import { test, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';
import { startPhpAndSidecar, type ServerInstance } from '../../test-utils';

const BUILD_DIR = path.resolve('build-e2e-php-static-base-auto');
const basePath = '/test-subdirectory';

let server: ServerInstance | undefined;

test.describe.configure({ mode: 'serial' });

test.describe('BaseMode Auto Subdirectory Deployment', () => {
	test.beforeAll(async () => {
		const routerPath = path.join(BUILD_DIR, 'router.php');
		if (!fs.existsSync(routerPath)) {
			throw new Error(
				`Missing base-mode auto E2E build at ${BUILD_DIR}. Run "bun scripts/build-e2e.mjs --mode=php-static" first.`
			);
		}

		server = await startPhpAndSidecar({
			mode: 'php-static',
			basePath,
			outDir: BUILD_DIR,
			env: {
				SK_BASE_PATH: basePath
			}
		});
	});

	test.afterAll(async () => {
		if (server) await server.cleanup();
	});

	test('should serve deep nested route', async ({ page }) => {
		if (!server) throw new Error('PHP server was not started');

		const url = `http://127.0.0.1:${server.port}${basePath}/parent-child/nested`;
		const response = await page.goto(url);
		expect(response?.status()).toBe(200);

		const content = await page.content();
		expect(content).toContain('parent-child');

		const baseHref = await page.getAttribute('base', 'href');
		expect(baseHref).toBe(basePath + '/');

		const scripts = await page.$$('script[src*="_app"]');
		for (const script of scripts) {
			const src = await script.getAttribute('src');
			expect(src).toContain(`${basePath}/_app/`);
		}
	});
});
