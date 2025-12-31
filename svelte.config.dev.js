import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/**
 * Development configuration that works with the PHP bridge plugin
 * The actual adapter is handled by the vite-plugin-php-bridge
 */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		// No adapter needed - handled by the PHP bridge plugin
		adapter: null,
		// Development optimizations
		prerender: {
			entries: ['/'] // Only prerender home in dev
		}
	}
};

export default config;
