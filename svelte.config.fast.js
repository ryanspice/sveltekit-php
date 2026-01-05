import adapter from './adapter/index.js';
import devAdapter from './adapter/src/dev-adapter.js';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const isDev = process.env.NODE_ENV === 'development' || process.env.FAST_DEV === 'true';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		// Use fast dev adapter for development, full adapter for production
		adapter: isDev ? devAdapter() : adapter({
			ssr: true,
			out: 'build',
			assets: 'build',
			precompress: process.env.PRECOMPRESS === 'true',
			fallback: false,
			strict: true
		}),
		// Optimize for development
		prerender: {
			entries: isDev ? ['/'] : undefined // Only prerender home in dev
		}
	}
};

export default config;