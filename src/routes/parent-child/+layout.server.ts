import type { LayoutServerLoad } from './$types';
import { getPhpData } from '$lib/server/php-dev';

export const load: LayoutServerLoad = async ({ fetch, url }) => {
	const nodes = await getPhpData(fetch, url.pathname);
	// Node 0 is root layout
	// Node 1 is this layout (parent-child)
	return nodes[1] || {};
};
