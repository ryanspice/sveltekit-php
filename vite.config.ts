import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { createAppConfig } from './app.config.mjs';
import { createDevWatchIgnored } from './scripts/utils/dev-watch.mjs';

const appConfig = createAppConfig();

export default defineConfig({
	plugins: [sveltekit(appConfig)],
	server: {
		watch: {
			ignored: createDevWatchIgnored(appConfig.outDir)
		},
		proxy: {
			// Proxy API and other PHP-handled routes to the PHP server
			'/api': 'http://127.0.0.1:8080'
			// Add other paths as needed, e.g. if you have other PHP endpoints
		}
	}
});
