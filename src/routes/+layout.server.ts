import type { LayoutServerLoad } from './$types';
import { getPhpData } from '$lib/server/php-dev';

export const prerender = true;

export const load: LayoutServerLoad = async ({ fetch, url }) => {
	// In dev mode, we proxy to the PHP server to get the data
	// The root layout is typically node 0 in the response
	const nodes = await getPhpData(fetch, url.pathname);
	return nodes[0] || {};
};
