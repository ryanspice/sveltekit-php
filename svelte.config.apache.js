
import apacheAdapter from './adapter/src/apache-adapter.js';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: apacheAdapter({
			ssr: true,
			out: 'build',
			assets: 'build',
			precompress: true,
			strict: true
		})
	}
};

export default config;
