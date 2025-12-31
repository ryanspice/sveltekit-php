import adapter from './adapter/index.js';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// Use the standard PHP adapter
		adapter: adapter({
			ssr: true,
			out: 'build',
			assets: 'build',
			precompress: false,
			fallback: false,
			strict: true
		})
	}
};

export default config;
