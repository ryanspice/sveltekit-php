import { stripLeadingSlash } from './paths.js';
import type { Builder, Route } from '../types.js';

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
