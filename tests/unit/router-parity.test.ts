import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { getMinimalBootstrapPhp, getRouterPhp } from '../../adapter/src/runtime/php-templates.ts';
import { getRouterJsSsrPhp } from '../../adapter/src/runtime/router/js-ssr.ts';
import { getRouterPhpStaticPhp } from '../../adapter/src/runtime/router/php-static.ts';
import { getRouterSharedPhp } from '../../adapter/src/runtime/router/shared.ts';
import { compilePhpRouteMatcher } from '../../adapter/src/utils/routing.ts';

const maliciousPathFixtures = [
	{ path: '/../secret.txt', guard: "$segment === '..' || $segment === '.'" },
	{ path: '/%2e%2e/secret.txt', guard: 'rawurldecode($decoded)' },
	{ path: '/%252e%252e/secret.txt', guard: 'for ($i = 0; $i < 3; $i++)' },
	{ path: '/safe/%5c..%5csecret.txt', guard: "str_replace('\\\\', '/', $decoded)" },
	{ path: '/safe/%00secret.txt', guard: "preg_match('/[\\x00-\\x1f\\x7f]/', $decoded)" },
	{ path: '/_protected', guard: '_protected(?:/|$)' }
];

describe('router parity and hardening', () => {
	it('keeps root router as a thin generated-router compatibility entrypoint', () => {
		const rootRouter = fs.readFileSync(path.resolve('router.php'), 'utf8');

		expect(rootRouter).toContain("$_SERVER['DOCUMENT_ROOT']");
		expect(rootRouter).toContain("'router.php'");
		expect(rootRouter).toContain('realpath($router_file)');
		expect(rootRouter).toContain('$router_real === $this_file');
		expect(rootRouter).toContain('$document_root_real');
		expect(rootRouter).toContain('require $router_real');
		expect(rootRouter).toContain('Generated build/router.php not found');
	});

	it('applies the same shared path-safety helpers to generated router modes', () => {
		const phpStatic = getRouterPhp('/base', 'php-static', false);
		const jsSsr = getRouterPhp('/base', 'js-ssr', false);

		for (const router of [phpStatic, jsSsr]) {
			expect(router).toContain('function router_has_bad_path');
			expect(router).toContain('function router_safe_path');
			expect(router).toContain('function router_mime_type');
			expect(router).toContain('function router_send_file');
			expect(router).toContain("strpos($uri, $base . '/') !== 0");
			expect(router).toContain("preg_match('#(^|/)_protected(?:/|$)#', $uri_raw)");
		}

		expect(phpStatic).toContain('router_safe_path($root');
		expect(jsSsr).toContain('router_safe_path(__DIR__, $full_path)');
		expect(jsSsr).toContain('router_send_file($real_full_path)');
	});

	it('strictly rejects requests outside a configured base path', () => {
		const shared = getRouterSharedPhp('/base');
		const phpStatic = getRouterPhpStaticPhp(false);

		expect(shared).toContain("echo \"404 Not Found\"");
		expect(shared).toContain("$uri !== $base && strpos($uri, $base . '/') !== 0");
		expect(phpStatic).toContain("echo \"404 Not Found\"");
	});

	it.each(maliciousPathFixtures)('keeps fixture guard for malicious path $path', ({ guard }) => {
		const shared = getRouterSharedPhp('/base');
		const phpStatic = getRouterPhp('/base', 'php-static', false);
		const jsSsr = getRouterPhp('/base', 'js-ssr', false);

		expect(shared).toContain(guard);
		expect(phpStatic).toContain(guard);
		expect(jsSsr).toContain(guard);
	});

	it('keeps mode-specific file serving behind shared safe-path checks', () => {
		const phpStatic = getRouterPhpStaticPhp(false);
		const jsSsr = getRouterJsSsrPhp();

		expect(phpStatic).toContain('$file = router_safe_path(__DIR__, $path)');
		expect(phpStatic).toContain('return false;');
		expect(phpStatic).toContain('router_send_file($nested_real)');
		expect(jsSsr).toContain('$real_full_path = router_safe_path(__DIR__, $full_path)');
		expect(jsSsr).toContain('$real_path = router_safe_path(__DIR__, $path)');
		expect(jsSsr).not.toContain('readfile($full_path)');
		expect(jsSsr).not.toContain('readfile($path)');
	});

	it('keeps asset MIME mappings needed for fallback exclusion probes', () => {
		const shared = getRouterSharedPhp('/base');
		const phpStatic = getRouterPhp('/base', 'php-static', false);
		const jsSsr = getRouterPhp('/base', 'js-ssr', false);
		const requiredMimeMappings = [
			"'js' => 'application/javascript'",
			"'css' => 'text/css'",
			"'json' => 'application/json'",
			"'map' => 'application/json'",
			"'webmanifest' => 'application/manifest+json'",
			"'wasm' => 'application/wasm'",
			"'svg' => 'image/svg+xml'",
			"'woff2' => 'font/woff2'"
		];

		for (const router of [shared, phpStatic, jsSsr]) {
			for (const mapping of requiredMimeMappings) {
				expect(router).toContain(mapping);
			}
		}
	});

	it('normalizes SvelteKit param matcher names for locale-prefixed routes', () => {
		const localizedPage = compilePhpRouteMatcher('/[lang=lang]/[slug]');
		const localizedRest = compilePhpRouteMatcher('/[lang=lang]/docs/[...path=localized]');
		const optionalLocale = compilePhpRouteMatcher('/[[lang=lang]]/rss-reader');

		expect(localizedPage.phpRegex).toBe('~^/([^/]+)/([^/]+)/?$~');
		expect(localizedPage.phpMap).toBe("['1' => 'lang', '2' => 'slug']");
		expect(localizedPage.phpMap).not.toContain('lang=lang');

		expect(localizedRest.phpRegex).toBe('~^/([^/]+)/docs(?:/(.*))?/?$~');
		expect(localizedRest.phpMap).toBe("['1' => 'lang', '2' => 'path']");
		expect(localizedRest.phpMap).not.toContain('path=localized');

		expect(optionalLocale.phpRegex).toBe('~^(?:/([^/]+))?/rss-reader/?$~');
		expect(optionalLocale.phpMap).toBe("['1' => 'lang']");
	});

	it('keeps php-static locale data, action, base path, and negotiation routing surfaces intact', () => {
		const phpStatic = getRouterPhp('/blog', 'php-static', false);

		expect(phpStatic).toContain("if ($uri === $base || strpos($uri, $base . '/') === 0)");
		expect(phpStatic).toContain("$suffix = '/__data.json'");
		expect(phpStatic).toContain("str_replace($suffix, '/__data.php', $uri)");
		expect(phpStatic).toContain("$action_suffix = '/__action'");
		expect(phpStatic).toContain("str_replace($action_suffix, '/__action.php', $uri)");
		expect(phpStatic).toContain("header('Vary: Accept', false)");
		expect(phpStatic).toContain("$accept = $_SERVER['HTTP_ACCEPT'] ?? ''");
		expect(phpStatic).toContain("$prefersHtml = (strpos($accept, 'text/html') !== false)");
	});

	it('keeps minimal HTML bootstrap GET-safe while preserving action POST support', () => {
		const bootstrap = getMinimalBootstrapPhp('/nested');

		expect(bootstrap).toContain("($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST'");
		expect(bootstrap).toContain("file_exists(__DIR__ . '/nested/__action.php')");
		expect(bootstrap).toContain("require __DIR__ . '/nested/__action.php'");
		expect(bootstrap).toContain('?>');
	});

	it('keeps the i18n php-static fixture route surfaces checked in', () => {
		const fixtureRoot = path.resolve('tests/fixtures/i18n-php-static/app/src');
		const requiredFiles = [
			'params/lang.ts',
			'routes/[lang=lang]/+page.server.ts',
			'routes/[lang=lang]/[slug]/+page.server.ts',
			'routes/[lang=lang]/rss.xml/+server.ts',
			'routes/[lang=lang]/rss-reader/+page.server.ts',
			'routes/[lang=lang]/action-test/+page.server.ts',
			'routes/[lang=lang]/api/locale/+server.ts'
		];

		for (const file of requiredFiles) {
			expect(fs.existsSync(path.join(fixtureRoot, file))).toBe(true);
		}
	});
});
