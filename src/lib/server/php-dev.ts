import { dev } from '$app/environment';
import * as devalue from 'devalue';

/**
 * Helper to fetch data from the running PHP server in dev mode.
 * This simulates the PHP adapter's behavior by fetching the __data.json
 * endpoint and extracting the data for all nodes.
 *
 * @param {typeof fetch} fetch - The SvelteKit fetch function
 * @param {string} path - The path to the route (e.g. '/ssr-data')
 * @returns {Promise<any[]>} An array of parsed data objects for each node in the route
 */
type PhpNode = {
	type?: string;
	data?: unknown[];
};

export async function getPhpData(fetch: typeof globalThis.fetch, path: string): Promise<unknown[]> {
	if (!dev) return [];

	// Normalize path (handle leading slash and avoid double slashes)
	const cleanPath = path.replace(/^\/+/, '');
	const url = `http://127.0.0.1:8080/${cleanPath}/__data.json`;

	try {
		console.log(`[PHP-Dev] Fetching ${url}`);
		const res = await fetch(url);

		const contentType = res.headers.get('content-type');
		if (!contentType || !contentType.includes('application/json')) {
			console.warn(
				`[PHP-Dev] Warning: Expected JSON from ${url}, got ${contentType}. This usually means the PHP route is missing or falling back to HTML.`
			);
			// If we got HTML (e.g. 404 page or fallback index), return empty to avoid crash
			return [];
		}

		if (!res.ok) {
			console.error(`[PHP-Dev] Failed to fetch ${url}: ${res.status}`);
			return [];
		}

		const json = await res.json();

		// Parse Devalue format
		// Expected: { type: 'data', nodes: [...] }

		if (json.type === 'data' && Array.isArray(json.nodes)) {
			return json.nodes.map((node: PhpNode) => {
				if (node && node.type === 'data' && Array.isArray(node.data) && node.data.length > 0) {
					try {
						// node.data is the devalue-serialized array.
						// We need to unflatten it.
						// devalue.unflatten takes the array itself.
						return devalue.unflatten(node.data);
					} catch (e) {
						// If devalue parsing fails, it might be a raw value?
						// Or maybe the data structure is slightly different.
						console.error(`[PHP-Dev] Failed to parse node data:`, e);
						return {};
					}
				}
				return {};
			});
		}

		return [];
	} catch (e) {
		console.error(`[PHP-Dev] Error fetching PHP data:`, e);
		return [];
	}
}
