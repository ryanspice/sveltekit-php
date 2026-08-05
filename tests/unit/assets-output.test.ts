import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import adapter from '../../adapter/src/index.ts';
import { getHtaccess } from '../../adapter/src/runtime/htaccess-templates.ts';
import { getPhpProxy } from '../../adapter/src/runtime/js-ssr-templates.ts';
import { getRouterPhpStaticPhp } from '../../adapter/src/runtime/router/php-static.ts';
import { getRouterSharedPhp } from '../../adapter/src/runtime/router/shared.ts';

type AdapterBuilder = Parameters<ReturnType<typeof adapter>['adapt']>[0];

const fixtureRoot = path.resolve('tests/fixtures/assets-output');
const fixtureClient = path.join(fixtureRoot, 'client');
const fixturePrerendered = path.join(fixtureRoot, 'prerendered');
const fixtureRoutes = path.join(fixtureRoot, 'app', 'src', 'routes');

function collectAssetFiles(dir: string, out: string[] = []) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			collectAssetFiles(full, out);
		} else if (entry.isFile() && (full.endsWith('.js') || full.endsWith('.css'))) {
			out.push(full);
		}
	}
	return out;
}

function createBuilder(tempRoot: string) {
	const outDir = path.join(tempRoot, 'out');
	const assetsDir = path.join(tempRoot, 'assets');
	const buildDir = path.join(tempRoot, '.svelte-kit');
	const prerenderedPages = new Map([['/', { file: 'index.html' }]]);
	const builder = {
		log: {
			minor: () => {},
			warn: () => {},
			error: () => {}
		},
		rimraf: (dir: string) => fs.rmSync(dir, { recursive: true, force: true }),
		mkdirp: (dir: string) => fs.mkdirSync(dir, { recursive: true }),
		getBuildDirectory: (name: string) => path.join(buildDir, name),
		writeClient: (dest: string) => {
			fs.mkdirSync(dest, { recursive: true });
			fs.cpSync(fixtureClient, dest, { recursive: true });
			return [];
		},
		writePrerendered: (dest: string) => {
			fs.mkdirSync(dest, { recursive: true });
			fs.cpSync(fixturePrerendered, dest, { recursive: true });
		},
		copy: (src: string, dest: string) => {
			fs.mkdirSync(path.dirname(dest), { recursive: true });
			fs.cpSync(src, dest, { recursive: true });
		},
		compress: (dest: string) => {
			const targets = collectAssetFiles(dest);
			if (!targets.length) return;
			const target = targets[0];
			const content = fs.readFileSync(target);
			fs.writeFileSync(target + '.br', content);
			fs.writeFileSync(target + '.gz', content);
		},
		writeServer: (dest: string) => {
			fs.mkdirSync(dest, { recursive: true });
			fs.writeFileSync(path.join(dest, 'index.js'), '');
		},
		generateManifest: () => '{}',
		generateFallback: async () => {},
		config: {
			kit: {
				paths: {
					base: '',
					assets: ''
				},
				files: {
					routes: fixtureRoutes
				}
			}
		},
		routes: [],
		prerendered: {
			pages: prerenderedPages
		}
	};
	return { builder, outDir, assetsDir };
}

function createExternalTempRoot() {
	return fs.mkdtempSync(path.join(path.dirname(process.cwd()), '.sk-php-external-'));
}

let tempRoot = '';

beforeEach(() => {
	tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-php-assets-'));
});

afterEach(() => {
	if (tempRoot) {
		fs.rmSync(tempRoot, { recursive: true, force: true });
	}
});

describe('assets output in js-ssr', () => {
	it('writes client assets into outDir when assetsDir differs', async () => {
		const { builder, outDir, assetsDir } = createBuilder(tempRoot);
		const instance = adapter({
			mode: 'js-ssr',
			out: outDir,
			assets: assetsDir,
			precompress: false,
			strict: false
		});
		await instance.adapt(builder as AdapterBuilder);
		const assetPath = path.join(outDir, '_app', 'immutable', 'entry', 'app.js');
		expect(fs.existsSync(assetPath)).toBe(true);
	});

	it('writes precompressed assets into outDir when enabled', async () => {
		const { builder, outDir, assetsDir } = createBuilder(tempRoot);
		const instance = adapter({
			mode: 'js-ssr',
			out: outDir,
			assets: assetsDir,
			precompress: true,
			strict: false
		});
		await instance.adapt(builder as AdapterBuilder);
		const target = collectAssetFiles(outDir)[0];
		expect(target).toBeTruthy();
		expect(fs.existsSync(target + '.br')).toBe(true);
		expect(fs.existsSync(target + '.gz')).toBe(true);
	});

	it('rejects unsafe build targets before cleanup', async () => {
		const { builder, assetsDir } = createBuilder(tempRoot);
		const instance = adapter({
			mode: 'js-ssr',
			out: process.cwd(),
			assets: assetsDir,
			strict: false
		});

		await expect(instance.adapt(builder as AdapterBuilder)).rejects.toThrow(
			/Unsafe build target for out/
		);
	});

	it('rejects unconfigured external build roots before cleanup', async () => {
		const externalRoot = createExternalTempRoot();
		const previousSafeRoots = process.env.SVELTEKIT_PHP_SAFE_EXTERNAL_ROOTS;
		delete process.env.SVELTEKIT_PHP_SAFE_EXTERNAL_ROOTS;

		try {
			const { builder, assetsDir } = createBuilder(tempRoot);
			const instance = adapter({
				mode: 'js-ssr',
				out: path.join(externalRoot, 'sites', 'ryanspice.com', 'build'),
				assets: assetsDir,
				strict: false
			});

			await expect(instance.adapt(builder as AdapterBuilder)).rejects.toThrow(
				/Unsafe build target for out/
			);
		} finally {
			if (previousSafeRoots === undefined) {
				delete process.env.SVELTEKIT_PHP_SAFE_EXTERNAL_ROOTS;
			} else {
				process.env.SVELTEKIT_PHP_SAFE_EXTERNAL_ROOTS = previousSafeRoots;
			}
			fs.rmSync(externalRoot, { recursive: true, force: true });
		}
	});

	it('allows configured external build roots', async () => {
		const externalRoot = createExternalTempRoot();
		const runtimeRoot = path.join(externalRoot, '.runtime');
		const previousSafeRoots = process.env.SVELTEKIT_PHP_SAFE_EXTERNAL_ROOTS;
		process.env.SVELTEKIT_PHP_SAFE_EXTERNAL_ROOTS = runtimeRoot;

		try {
			const { builder } = createBuilder(tempRoot);
			const outDir = path.join(runtimeRoot, 'sites', 'ryanspice.com', 'build');
			const instance = adapter({
				mode: 'js-ssr',
				out: outDir,
				assets: outDir,
				precompress: false,
				strict: false
			});

			await instance.adapt(builder as AdapterBuilder);
			expect(fs.existsSync(path.join(outDir, '_app', 'immutable', 'entry', 'app.js'))).toBe(true);
		} finally {
			if (previousSafeRoots === undefined) {
				delete process.env.SVELTEKIT_PHP_SAFE_EXTERNAL_ROOTS;
			} else {
				process.env.SVELTEKIT_PHP_SAFE_EXTERNAL_ROOTS = previousSafeRoots;
			}
			fs.rmSync(externalRoot, { recursive: true, force: true });
		}
	});

	it('treats URL assets as non-filesystem targets', async () => {
		const { builder, outDir } = createBuilder(tempRoot);
		const instance = adapter({
			mode: 'js-ssr',
			out: outDir,
			assets: 'https://cdn.example.test/assets',
			precompress: false,
			strict: false
		});

		await instance.adapt(builder as AdapterBuilder);
		expect(fs.existsSync(path.join(outDir, '_app', 'immutable', 'entry', 'app.js'))).toBe(true);
	});

	it('fails fast when generated output violates a build identity contract', async () => {
		const { builder, outDir } = createBuilder(tempRoot);
		const instance = adapter({
			mode: 'php-static',
			out: outDir,
			assets: outDir,
			strict: false,
			buildIdentity: {
				name: 'canopy-static-skin',
				required: ['site-shell--canopy'],
				forbidden: ['site-shell--ryan']
			}
		});

		await expect(instance.adapt(builder as AdapterBuilder)).rejects.toThrow(
			/Build identity contract "canopy-static-skin" failed/
		);
	});
});

describe('htaccess precompress rules', () => {
	it('excludes __data.json and __action and sets cache control', () => {
		const htaccess = getHtaccess('js-ssr', '/base', true);
		expect(htaccess).toContain('RewriteCond %{REQUEST_URI} !/__data\\.json$ [NC]');
		expect(htaccess).toContain('RewriteCond %{REQUEST_URI} !/__action$ [NC]');
		expect(htaccess).toContain(
			'Header set Cache-Control "public, max-age=31536000, immutable" env=SK_ASSET'
		);
		expect(htaccess).toContain('Header set Cache-Control "no-store" env=SK_DATA');
		expect(htaccess).toContain('Header set Cache-Control "no-store" env=SK_ACTION');
	});

	it('emits trailing slash redirects when requested', () => {
		const htaccess = getHtaccess('php-static', '', false, 'router.php', 'always');
		expect(htaccess).toContain('# trailingSlash: always');
		expect(htaccess).toContain('RewriteCond %{REQUEST_URI} !/$');
		expect(htaccess).toContain('RewriteRule ^(.*[^/])$ /$1/ [L,R=308]');
	});
});

describe('runtime hardening templates', () => {
	it('gates router logging and avoids filesystem router logs', () => {
		const router = getRouterSharedPhp('');
		expect(router).toContain('function router_debug_enabled');
		expect(router).toContain("file_put_contents('php://stderr'");
		expect(router).not.toContain('../router.log');
	});

	it('generates safe router path helpers and traversal rejection', () => {
		const shared = getRouterSharedPhp('');
		const phpStatic = getRouterPhpStaticPhp(true, '200.html');
		expect(shared).toContain('function router_has_bad_path');
		expect(shared).toContain('function router_safe_path');
		expect(shared).toContain('Bad Request');
		expect(phpStatic).toContain('router_safe_path($root');
		expect(phpStatic).toContain('router_send_file');
	});

	it('limits proxy fallback bodies without curl', () => {
		const proxy = getPhpProxy('http://127.0.0.1:3000');
		expect(proxy).toContain('Length Required');
		expect(proxy).toContain('http_response_code(411)');
		expect(proxy).toContain('$contentLength > (int)$maxBodyBytes');
	});

	it('documents sk_fetch timeout support in generated compat code', () => {
		const compat = fs.readFileSync(path.resolve('adapter/src/runtime/php-compat.php'), 'utf8');
		expect(compat).toContain('SK_FETCH_TIMEOUT_MS');
		expect(compat).toContain('$timeoutMs =');
		expect(compat).toContain("'timeout' => $timeoutMs / 1000");
		expect(compat).toContain('sk_fetch_with_curl');
		expect(compat).toContain('allow_url_fopen is disabled and the curl extension is unavailable');
		expect(compat).toContain('x-sveltekit-php-fetch-error');
	});

	it('documents action raw-body fallback and serializer cycle guards in generated templates', () => {
		const templates = fs.readFileSync(path.resolve('adapter/src/runtime/php-templates.ts'), 'utf8');
		expect(templates).toContain('sk_action_parse_body');
		expect(templates).toContain("file_get_contents('php://input')");
		expect(templates).toContain("'rawBody' => sk_action_raw_body()");
		expect(templates).toContain('Possible cyclic or too-deep JSON value');
		expect(templates).toContain('Cannot serialize cyclic object graph');
	});

	it('keeps generated PHP exception details out of client responses', () => {
		const phpTemplates = fs.readFileSync(path.resolve('adapter/src/runtime/php-templates.ts'), 'utf8');
		const jsSsrTemplates = fs.readFileSync(path.resolve('adapter/src/runtime/js-ssr-templates.ts'), 'utf8');

		expect(phpTemplates).toContain(
			"error_log('[sveltekit-php] action error: ' . $e->getMessage());"
		);
		expect(phpTemplates).toContain(
			"error_log('[sveltekit-php] endpoint error: ' . $e->getMessage());"
		);
		expect(phpTemplates).toContain("['message' => 'Internal Server Error']");
		expect(phpTemplates).toContain("echo 'Internal Server Error';");
		expect(phpTemplates).not.toContain('Internal Server Error:');
		expect(phpTemplates).not.toContain('$e -> getMessage()');

		expect(jsSsrTemplates).toContain(
			"error_log('[sveltekit-php] endpoint error: ' . $e->getMessage());"
		);
		expect(jsSsrTemplates).toContain("echo 'Internal Server Error';");
		expect(jsSsrTemplates).not.toContain('Internal Server Error:');
	});

	it('does not treat Svelte rest params as literal traversal in reserved route checks', () => {
		const adapterSource = fs.readFileSync(path.resolve('adapter/src/index.ts'), 'utf8');
		const guardsSource = fs.readFileSync(path.resolve('adapter/src/utils/guards.ts'), 'utf8');
		const combined = `${adapterSource}\n${guardsSource}`;

		expect(combined).toContain('function isRouteParamSegment');
		expect(combined).toContain(
			"segments.some((segment) => !isRouteParamSegment(segment) && segment.includes('..'))"
		);
	});
});
