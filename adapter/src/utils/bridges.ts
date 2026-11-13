import path from 'node:path';
import { readdir, readFile } from 'node:fs/promises';
import type { Route } from '../types.js';
import { buildLayoutChainCandidates } from './routing.js';

/** Fail closed: only option-only modules are understood; never execute consumer source. */
export async function canOmitPageBridges(
	route: Route | null,
	routesRoot: string
): Promise<boolean> {
	if (!route || route.prerender !== true) return false;
	let csr = true;
	let ssr = true;
	for (const segment of buildLayoutChainCandidates(route.id).reverse()) {
		const dir = path.join(routesRoot, segment);
		const entries = await readdir(dir).catch(() => null);
		if (!entries) return false;
		const leaf = segment === route.id.replace(/^\//, '');
		for (const file of entries.sort()) {
			// Include ancestors conservatively even across layout resets. Server modules may
			// contain loads/actions or re-exports in either language; retain them all.
			if (!/^\+(?:layout|page|server)(?:[.@]|$)/.test(file)) continue;
			if (file.startsWith('+page') && !leaf) continue;
			if (file.startsWith('+server')) {
				if (leaf) return false;
				continue;
			}
			if (file.includes('.server') || file.includes('@')) return false;
			if (!/\.[cm]?[jt]s$/.test(file)) continue;
			if (!/\.(?:js|ts)$/.test(file)) return false;
			let source = await readFile(path.join(dir, file), 'utf8');
			source = source.replace(/\/\*[\s\S]*?\*\/|\/\/[^\r\n]*/g, ' ').trim();
			// An intentionally small grammar, not an attempt to parse arbitrary JS. Loads,
			// imports, re-exports, computed options and unrecognized code retain bridges.
			while (source) {
				const match = source.match(
					/^export\s+const\s+(csr|ssr|prerender|trailingSlash)\s*=\s*(true|false|'auto'|"auto"|'always'|"always"|'never'|"never"|'ignore'|"ignore")\s*(?:;|$|(?=\r?\n))/
				);
				if (!match) return false;
				if (match[1] === 'csr') {
					if (!['true', 'false'].includes(match[2])) return false;
					csr = match[2] === 'true';
				}
				if (match[1] === 'ssr') ssr = match[2] !== 'false';
				source = source.slice(match[0].length).trim();
			}
		}
	}
	return !csr && ssr;
}

/** Guard the document itself so direct index.php and web-server rewrites agree. */
export function getBridgeFreePageGuard(): string {
	return `<?php
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method !== 'GET' && $method !== 'HEAD') {
    http_response_code(405);
    header('Allow: GET, HEAD');
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Method Not Allowed';
    exit;
}
header('Content-Type: text/html; charset=utf-8');
if ($method === 'HEAD') exit;
?>`;
}
