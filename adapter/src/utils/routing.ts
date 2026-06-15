import { stripLeadingSlash } from './paths.js';
import type { Builder, Route } from '../types.js';
import { readFile, access } from 'fs/promises';
import path from 'path';

export function findRouteForNavPath(builder: Builder, navPath: string): Route | null {
	// navPath is usually "/foo/" from builder.prerendered.pages.
	// Some patterns match with/without trailing slash, so try both.
	const withSlash = navPath.endsWith('/') ? navPath : `${navPath}/`;
	const withoutSlash = navPath.endsWith('/') ? navPath.slice(0, -1) : navPath;

	// pick the most specific (longest id) matching route
	const matches = builder.routes
		.filter((r) => r.pattern?.test(withSlash) || r.pattern?.test(withoutSlash))
		.sort((a, b) => (b.id?.length ?? 0) - (a.id?.length ?? 0));

	return matches[0] ?? null;
}

function escapeRegexSegment(s: string) {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeParamName(raw: string): string {
	return raw.split('=')[0] ?? raw;
}

export function compilePhpRouteMatcher(routeId: string) {
	const id = routeId.startsWith('/') ? routeId : `/${routeId}`;
	const parts = stripLeadingSlash(id).split('/').filter(Boolean);

	let re = '^';
	const map: Array<{ idx: number; name: string }> = [];
	let groupIdx = 0;

	for (let i = 0; i < parts.length; i++) {
		const seg = parts[i];
		if (seg.startsWith('(') && seg.endsWith(')')) continue;

		const restMatch = seg.match(/^\[\.\.\.(.+)\]$/);
		if (restMatch) {
			groupIdx += 1;
			map.push({ idx: groupIdx, name: normalizeParamName(restMatch[1]) });
			re += `(?:/(.*))?`;
			continue;
		}

		const optMatch = seg.match(/^\[\[(.+)\]\]$/);
		if (optMatch) {
			groupIdx += 1;
			map.push({ idx: groupIdx, name: normalizeParamName(optMatch[1]) });
			re += `(?:/([^/]+))?`;
			continue;
		}

		const dynMatch = seg.match(/^\[(.+)\]$/);
		if (dynMatch) {
			groupIdx += 1;
			map.push({ idx: groupIdx, name: normalizeParamName(dynMatch[1]) });
			re += `/([^/]+)`;
			continue;
		}

		re += `/${escapeRegexSegment(seg)}`;
	}

	if (re === '^') re += '/';
	re += '/?$';

	const phpRegex = `~${re}~`;
	const phpMap = `[${map.map((m) => `'${m.idx}' => '${m.name}'`).join(', ')}]`;

	return { phpRegex, phpMap };
}

export function buildLayoutChainCandidates(routeIdPosix: string) {
	// routeIdPosix includes groups like "/(app)/dashboard"
	// We walk up parents: "/(app)/dashboard" -> "/(app)" -> "/"
	const parts = stripLeadingSlash(routeIdPosix).split('/').filter(Boolean);
	const chain: string[] = [];
	for (let i = parts.length; i >= 0; i--) {
		const seg = parts.slice(0, i).join('/');
		chain.push(seg); // "" means routes root
	}
	return chain;
}

export interface RouteManifestEntry {
	re: string;
	type: 'page' | 'negotiate' | 'endpoint';
	shim?: string;
	page?: string;
	endpoint?: string;
	trailingSlash?: 'never' | 'always' | 'ignore';
}

/**
 * Check if a file exists using access
 */
async function fileExists(filePath: string): Promise<boolean> {
	try {
		await access(filePath);
		return true;
	} catch {
		return false;
	}
}

/**
 * Check if a route has a server endpoint file (+server.js or +server.ts)
 */
async function hasServerFile(routeId: string, routesBasePath: string): Promise<boolean> {
	try {
		const strippedRouteId = stripLeadingSlash(routeId);
		const serverJsPath = path.join(routesBasePath, strippedRouteId, '+server.js');
		const serverTsPath = path.join(routesBasePath, strippedRouteId, '+server.ts');
		const serverPhpPath = path.join(routesBasePath, strippedRouteId, '+server.php');

		if (await fileExists(serverJsPath)) return true;
		if (await fileExists(serverTsPath)) return true;
		if (await fileExists(serverPhpPath)) return true;

		return false;
	} catch {
		return false;
	}
}

export async function generateRouteManifest(builder: Builder): Promise<RouteManifestEntry[]> {
	const manifest: RouteManifestEntry[] = [];

	// Process routes in order of specificity (longest path first)
	const sortedRoutes = [...builder.routes].sort(
		(a, b) => (b.id?.length ?? 0) - (a.id?.length ?? 0)
	);

	for (const route of sortedRoutes) {
		const routeId = route.id.startsWith('/') ? route.id : `/${route.id}`;
		const { phpRegex } = compilePhpRouteMatcher(route.id);

		// Read trailingSlash configuration from route files
		const routesBasePath = path.resolve(builder.config.kit.files.routes);
		let trailingSlash = await readTrailingSlashFromRoute(routeId, routesBasePath);

		// Default to config.kit.trailingSlash or 'never' if not specified
		if (!trailingSlash) {
			trailingSlash = builder.config.kit.trailingSlash || 'never';
		}

		// Check if this route has both page and server endpoints (negotiate type)
		const base = builder.config.kit.paths.base;
		let checkPath = routeId;
		if (base) {
			checkPath = path.posix.join(base, routeId);
		}

		const hasPage =
			builder.prerendered.pages.has(routeId) ||
			builder.prerendered.pages.has(`${routeId}/`) ||
			builder.prerendered.pages.has(checkPath) ||
			builder.prerendered.pages.has(`${checkPath}/`);

		let hasServerEndpoint = false;
		try {
			hasServerEndpoint = await hasServerFile(routeId, routesBasePath);
		} catch {
			hasServerEndpoint = false;
		}

		if (hasPage && hasServerEndpoint) {
			// Negotiate type - both page and endpoint exist
			manifest.push({
				re: phpRegex,
				type: 'negotiate',
				page: path.posix.join(base || '', `/${stripLeadingSlash(route.id)}/index.html`),
				endpoint: path.posix.join(base || '', `/${stripLeadingSlash(route.id)}/index.php`),
				trailingSlash
			});
		} else if (hasServerEndpoint) {
			// Endpoint only
			manifest.push({
				re: phpRegex,
				type: 'endpoint',
				shim: path.posix.join(base || '', `/${stripLeadingSlash(route.id)}/index.php`),
				trailingSlash
			});
		} else {
			// Page route (may be prerendered or SSR)
			manifest.push({
				re: phpRegex,
				type: 'page',
				shim: path.posix.join(base || '', `/${stripLeadingSlash(route.id)}/index.php`),
				trailingSlash
			});
		}
	}

	return manifest;
}

/**
 * Read trailingSlash configuration from route files
 */
export async function readTrailingSlashFromRoute(
	routeId: string,
	routesBasePath: string
): Promise<'never' | 'always' | 'ignore' | undefined> {
	const chain = buildLayoutChainCandidates(routeId); // e.g. ["a/b", "a", ""]

	for (const currentId of chain) {
		// currentId is relative posix path, e.g. "a/b" or ""
		const dir = path.join(routesBasePath, currentId);

		// If this is the leaf route (the one we are querying), check +page
		// Note: routeId passed in might have leading slash, currentId from chain does not (it's from buildLayoutChainCandidates which strips it? No, check impl)
		// buildLayoutChainCandidates uses stripLeadingSlash(routeIdPosix).split('/').
		// So chain elements do NOT have leading slash.
		// But routeId passed here MIGHT have leading slash (see generateRouteManifest).

		const normalizedRouteId = stripLeadingSlash(routeId);
		const normalizedCurrentId = currentId; // chain elements are already stripped

		if (normalizedCurrentId === normalizedRouteId) {
			const pageConfig = await checkFileForTrailingSlash(dir, '+page');
			if (pageConfig) return pageConfig;
		}

		// Check +layout
		const layoutConfig = await checkFileForTrailingSlash(dir, '+layout');
		if (layoutConfig) return layoutConfig;
	}

	return undefined;
}

async function checkFileForTrailingSlash(
	dir: string,
	prefix: string
): Promise<'never' | 'always' | 'ignore' | undefined> {
	for (const ext of ['.js', '.ts']) {
		try {
			const content = await readFile(path.join(dir, prefix + ext), 'utf-8');
			const match = content.match(
				/export\s+const\s+trailingSlash\s*=\s*['"](never|always|ignore)['"]/
			);
			if (match) {
				return match[1] as 'never' | 'always' | 'ignore';
			}
		} catch {
			// ignore missing files
		}
	}
	return undefined;
}
