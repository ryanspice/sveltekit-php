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

function escapeRegexSegment(s: string) {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
			map.push({ idx: groupIdx, name: restMatch[1] });
			re += `(?:/(.*))?`;
			continue;
		}

		const optMatch = seg.match(/^\[\[(.+)\]\]$/);
		if (optMatch) {
			groupIdx += 1;
			map.push({ idx: groupIdx, name: optMatch[1] });
			re += `(?:/([^/]+))?`;
			continue;
		}

		const dynMatch = seg.match(/^\[(.+)\]$/);
		if (dynMatch) {
			groupIdx += 1;
			map.push({ idx: groupIdx, name: dynMatch[1] });
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
