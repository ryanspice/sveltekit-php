import { getPhpData } from '$lib/server/php-dev';

export const prerender = true;

export async function load({ fetch, url }) {
	const nodes = await getPhpData(fetch, url.pathname);
	if (nodes.length) return nodes[nodes.length - 1];

	// Fallback for build
	return {
		step1: 'init',
		step2: new Promise((resolve) => setTimeout(() => resolve('delayed'), 500))
	};
}
