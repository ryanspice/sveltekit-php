import { getPhpData } from '$lib/server/php-dev';

export const prerender = process.env.ADAPTER_MODE === 'node-ssr' ? false : true;

export async function load({ fetch, url }) {
	const nodes = await getPhpData(fetch, url.pathname);
	return nodes[nodes.length - 1] || {};
}
