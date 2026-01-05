import type { PageServerLoad } from './$types';
import { getPhpData } from '$lib/server/php-dev';

export const load: PageServerLoad = async ({ fetch, url }) => {
	const nodes = await getPhpData(fetch, url.pathname);
	return nodes[nodes.length - 1] || {};
};
