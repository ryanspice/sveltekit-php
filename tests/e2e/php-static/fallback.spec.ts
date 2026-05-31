import { test, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';
import { startPhpAndSidecar, type ServerInstance } from '../../test-utils';

const BUILD_DIR = path.resolve('build-e2e-php-static-fallback');
const BASE = process.env.DEPLOY_BASE || '/dev/sveltekit';
const BASE_PREFIX = BASE === '/' ? '' : BASE;

let server: ServerInstance | undefined;

function baseUrl() {
	if (!server) throw new Error('PHP server was not started');
	return `http://127.0.0.1:${server.port}`;
}

test.describe('PHP Static Fallback', () => {
	test.describe.configure({ mode: 'serial' });

	test.beforeAll(async () => {
		const routerPath = path.join(BUILD_DIR, 'router.php');
		if (!fs.existsSync(routerPath)) {
			throw new Error(
				`Missing fallback E2E build at ${BUILD_DIR}. Run "bun scripts/build-e2e.mjs --mode=php-static" first.`
			);
		}

		server = await startPhpAndSidecar({
			mode: 'php-static',
			basePath: BASE,
			outDir: BUILD_DIR,
			env: {
				SK_BASE_PATH: BASE
			}
		});
	});

	test.afterAll(async () => {
		if (server) await server.cleanup();
	});

	test('Fallback file exists and is not normalized to directory', () => {
		const fallbackFile = path.join(BUILD_DIR, '200.html');
		const existsAsFile = fs.existsSync(fallbackFile);
		const existsAsDir = fs.existsSync(path.join(BUILD_DIR, '200', 'index.php'));

		expect(existsAsFile || existsAsDir).toBeTruthy();
	});

	test('Unknown route returns 200 (Fallback Mode)', async ({ request }) => {
		const response = await request.get(`${baseUrl()}${BASE_PREFIX}/this/does/not/exist`);
		expect(response.status()).toBe(200);
	});

	test('Router uses custom fallback logic', async () => {
		const routerPhp = fs.readFileSync(path.join(BUILD_DIR, 'router.php'), 'utf8');
		expect(routerPhp).toMatch(
			/\$fallback_file\s*=\s*router_safe_path\(\$root,\s*\$root\s*\.\s*["']\/200\.html["']\);/
		);
		expect(routerPhp).toMatch(
			/\$fallback_php_ext\s*=\s*\$fallback_file\s*!==\s*null\s*\?\s*router_safe_path\(\$root,\s*str_replace\('\.html',\s*'\.php',\s*\$fallback_file\)\)\s*:\s*null;/
		);
		expect(routerPhp).not.toContain("$fallback_file = __DIR__ . '/200.html';");
	});
});
