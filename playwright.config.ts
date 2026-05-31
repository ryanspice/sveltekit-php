import { defineConfig, devices } from '@playwright/test';
import { config as loadEnv } from 'dotenv';
import { getBasePath, normalizeAdapterMode } from './scripts/utils/config.mjs';

loadEnv();

const maxFailures = process.env.PW_MAX_FAILURES
	? Number(process.env.PW_MAX_FAILURES)
	: process.env.CI
		? 1
		: 0;
const adapterMode = process.env.ADAPTER_MODE
	? normalizeAdapterMode(process.env.ADAPTER_MODE)
	: undefined;

export default defineConfig({
	maxFailures,
	testDir: './tests/e2e',
	/* Run tests in parallel */
	fullyParallel: true,
	/* Fail the build on CI if you accidentally left test.only in the source code. */
	forbidOnly: !!process.env.CI,
	/* Retry on CI only */
	retries: process.env.CI ? 2 : 0,
	/* Opt out of parallel tests on CI. */
	workers: process.env.CI ? 1 : undefined,
	/* Reporter to use. See https://playwright.dev/docs/test-reporters */
	reporter: 'html',

	/* Shared settings */
	use: {
		trace: 'on-first-retry'
	},

	/* Configure projects for different environments */
	projects: [
		{
			name: 'php-static',
			testDir: './tests/e2e/php-static',
			use: {
				...devices['Desktop Chrome'],
				baseURL: 'http://127.0.0.1:8086'
			}
		},
		{
			name: 'js-ssr-root',
			testDir: './tests/e2e/js-ssr',
			use: {
				...devices['Desktop Chrome'],
				baseURL: 'http://127.0.0.1:8087'
			},
			metadata: {
				basePath: ''
			}
		},
		{
			name: 'js-ssr-subdir',
			testDir: './tests/e2e/js-ssr',
			use: {
				...devices['Desktop Chrome'],
				baseURL: 'http://127.0.0.1:8088'
			},
			metadata: {
				basePath: getBasePath()
			}
		}
	],

	/* Run local dev servers before starting the tests */
	webServer: {
		command: 'bun scripts/serve-e2e.mjs',
		// Wait for the last port to be ready, but technically we wait for all.
		// Playwright waits for the url to be available.
		url:
			adapterMode === 'php-static'
				? 'http://127.0.0.1:8086'
				: adapterMode === 'js-ssr'
					? getBasePath() === '' || getBasePath() === '/'
						? 'http://127.0.0.1:8087'
						: `http://127.0.0.1:8088${getBasePath()}`
					: `http://127.0.0.1:8088${getBasePath()}`,
		reuseExistingServer: !process.env.CI,
		stdout: 'pipe',
		stderr: 'pipe',
		timeout: 60000 // Give time for 3 builds to verify/start
	}
});
