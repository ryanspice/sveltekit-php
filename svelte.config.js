import adapter from './adapter/index.js';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const mode = process.env.ADAPTER_MODE || 'php-static';
const base = process.env.BASE_PATH || '';

console.log(`[Config] Mode: ${mode}, Base: '${base}'`);

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		paths: {
			base
		},
		// Use the standard PHP adapter
		adapter: adapter({
			mode,
			ssr: true,
			out: 'build',
			assets: 'build',
			precompress: process.env.PRECOMPRESS === 'true',
			fallback: false,
			strict: false
		}),
		prerender: {
			handleHttpError: 'warn'
		}
	}
};

export default config;
