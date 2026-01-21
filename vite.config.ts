import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		proxy: {
			// Proxy API and other PHP-handled routes to the PHP server
			'/api': 'http://127.0.0.1:8080'
			// Add other paths as needed, e.g. if you have other PHP endpoints
		}
	}
});
