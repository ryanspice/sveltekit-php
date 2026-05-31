import type { PageServerLoad } from './$types';
import { getPhpData } from '$lib/server/php-dev';

export const prerender = true;

export const load: PageServerLoad = async ({ fetch }) => {
	// This file exists to ensure SvelteKit recognizes that this page has server-side data.
	// The actual data is provided by +page.server.php via the PHP adapter.

	// In dev mode, we proxy to the PHP server to get the data
	const nodes = await getPhpData(fetch, '/ssr-data');
	const data = nodes[nodes.length - 1];

	if (data) return data;

	// Fallback for build time (when PHP server is not running)
	// This ensures hydration matches what PHP will eventually serve
	return {
		message: 'hello-from-server',
		page_uuid: 'build-time-placeholder'
	};
};
