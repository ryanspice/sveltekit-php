import { defineConfig, devices } from '@playwright/test';

const deployments = [
	{ mode: 'php-static', basePath: '', outDir: 'build-e2e-php-static' },
	{ mode: 'php-static', basePath: '/dev/sveltekit', outDir: 'build-e2e-php-static-fallback' },
	{ mode: 'js-ssr', basePath: '', outDir: 'build-e2e-js-ssr-root' },
	{ mode: 'js-ssr', basePath: '/dev/sveltekit', outDir: 'build-e2e-js-ssr-subdir' }
];

export default defineConfig({
	testDir: './tests/e2e/kit3',
	fullyParallel: false,
	workers: 1,
	forbidOnly: !!process.env.CI,
	retries: 0,
	reporter: [['list']],
	use: { trace: 'retain-on-failure' },
	projects: deployments.flatMap((deployment) =>
		['desktop', 'mobile'].map((viewport) => ({
			name: `${deployment.mode}-${deployment.basePath ? 'subdir' : 'root'}-${viewport}`,
			metadata: deployment,
			use: viewport === 'mobile' ? devices['Pixel 7'] : devices['Desktop Chrome']
		}))
	)
});
