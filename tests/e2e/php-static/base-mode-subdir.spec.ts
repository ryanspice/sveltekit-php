import { test, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';
import { startPhpAndSidecar, type ServerInstance } from '../../test-utils';

const BUILD_DIR = path.resolve('build-e2e-php-static-base-auto-subdir');
const basePath = '/test-subdirectory';

let server: ServerInstance | undefined;

test.describe('BaseMode Auto Subdirectory Deployment', () => {
	test.describe.configure({ mode: 'serial' });

	test.beforeAll(async () => {
		const routerPath = path.join(BUILD_DIR, 'router.php');
		if (!fs.existsSync(routerPath)) {
			throw new Error(
				`Missing base-mode subdir E2E build at ${BUILD_DIR}. Run "bun scripts/build-e2e.mjs --mode=php-static" first.`
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

	test('should serve deep nested route with __data.json under subdirectory', async ({ page }) => {
		if (!server) throw new Error('PHP server was not started');

		const nestedRoute = `${basePath}/parent-child/nested`;
		const response = await page.goto(`http://127.0.0.1:${server.port}${nestedRoute}`);
		expect(response?.status()).toBe(200);

		const pageContent = await page.textContent('body');
		expect(pageContent).toContain('Nested Deep Child');

		const dataResponses: number[] = [];
		page.on('response', (res) => {
			if (res.url().includes('__data.json')) {
				dataResponses.push(res.status());
			}
		});

		await page.reload({ waitUntil: 'networkidle' });
		await page.waitForTimeout(1000);

		expect(dataResponses.every((status) => status === 200)).toBe(true);
	});

	test('should handle base-aware asset URLs in auto mode', async ({ page }) => {
		if (!server) throw new Error('PHP server was not started');

		const response = await page.goto(`http://127.0.0.1:${server.port}${basePath}/`);
		expect(response?.status()).toBe(200);

		const buildFile = [
			path.join(BUILD_DIR, basePath.replace(/^\//, ''), 'index.php'),
			path.join(BUILD_DIR, 'index.php')
		].find((candidate) => fs.existsSync(candidate));

		if (!buildFile) {
			throw new Error(`Could not find generated index.php in ${BUILD_DIR}`);
		}
		const fileContent = fs.readFileSync(buildFile, 'utf8');

		expect(fileContent).toMatch(
			/href="<\?php echo htmlspecialchars\(sk_base_href\(\), ENT_QUOTES\); \?>_app\//
		);
		expect(fileContent).toMatch(
			/<base href="<\?php echo htmlspecialchars\(sk_base_href\(\), ENT_QUOTES\); \?>"\s*\/?>/
		);
	});
});
