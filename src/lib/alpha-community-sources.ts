export type AlphaCommunitySource = {
	label: string;
	href: string;
};

export type CommunityProvider =
	| 'github-repositories'
	| 'github-issues'
	| 'npm'
	| 'packagist'
	| 'stackoverflow'
	| 'reddit'
	| 'search-link-only';

export type ResearchSourceMode = 'supported-json-api' | 'manual-research-link';
export type ResearchCollectionMethod =
	| 'public-json-api'
	| 'public-json-api-rate-limited'
	| 'manual-search-review';
export type ResearchEvidenceKind =
	| 'repository-index'
	| 'issue-discussion-index'
	| 'package-registry'
	| 'qa-support-index'
	| 'community-forum-search'
	| 'manual-hosting-research';
export type ResearchCollectionRisk = 'low' | 'medium' | 'high' | 'manual';
export type ResearchTrustBoundary =
	| 'public-index-count'
	| 'public-discussion-sample'
	| 'package-ecosystem-discovery'
	| 'manual-qualitative-review';

export function getCommunitySourceHost(href: string): string {
	try {
		return new URL(href).hostname.replace(/^www\./, '');
	} catch {
		return 'invalid-url';
	}
}

export function classifyCommunitySource(community: AlphaCommunitySource): CommunityProvider {
	const label = community.label.toLowerCase();
	const href = community.href.toLowerCase();

	if (href.includes('github.com')) {
		if (label.includes('issue') || label.includes('discussion')) {
			return 'github-issues';
		}

		return 'github-repositories';
	}

	if (href.includes('npmjs.com')) {
		return 'npm';
	}

	if (href.includes('packagist.org')) {
		return 'packagist';
	}

	if (href.includes('stackoverflow.com')) {
		return 'stackoverflow';
	}

	if (href.includes('reddit.com')) {
		return 'reddit';
	}

	return 'search-link-only';
}

export function getResearchSourceMode(provider: CommunityProvider): ResearchSourceMode {
	return provider === 'search-link-only' ? 'manual-research-link' : 'supported-json-api';
}

export function getResearchCollectionMethod(provider: CommunityProvider): ResearchCollectionMethod {
	if (provider === 'search-link-only') {
		return 'manual-search-review';
	}

	if (provider === 'reddit') {
		return 'public-json-api-rate-limited';
	}

	return 'public-json-api';
}

export function buildCommunityEndpoint(
	provider: CommunityProvider,
	keyword: string,
	label: string
): string | null {
	const query = encodeURIComponent(keyword);

	if (provider === 'github-repositories') {
		return `https://api.github.com/search/repositories?q=${query}&per_page=5`;
	}

	if (provider === 'github-issues') {
		const githubQuery = label.toLowerCase().includes('svelte')
			? `${keyword} repo:sveltejs/kit`
			: keyword;
		return `https://api.github.com/search/issues?q=${encodeURIComponent(githubQuery)}&per_page=5`;
	}

	if (provider === 'npm') {
		return `https://registry.npmjs.org/-/v1/search?text=${query}&size=5`;
	}

	if (provider === 'packagist') {
		return `https://packagist.org/search.json?q=${query}&per_page=5`;
	}

	if (provider === 'stackoverflow') {
		return `https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=relevance&site=stackoverflow&q=${query}&pagesize=5`;
	}

	if (provider === 'reddit') {
		return `https://www.reddit.com/search.json?q=${query}&limit=5`;
	}

	return null;
}

export function getResearchEvidenceKind(provider: CommunityProvider): ResearchEvidenceKind {
	if (provider === 'github-repositories') {
		return 'repository-index';
	}

	if (provider === 'github-issues') {
		return 'issue-discussion-index';
	}

	if (provider === 'npm' || provider === 'packagist') {
		return 'package-registry';
	}

	if (provider === 'stackoverflow') {
		return 'qa-support-index';
	}

	if (provider === 'reddit') {
		return 'community-forum-search';
	}

	return 'manual-hosting-research';
}

export function getResearchCollectionRisk(provider: CommunityProvider): ResearchCollectionRisk {
	if (provider === 'reddit') {
		return 'high';
	}

	if (provider === 'github-repositories' || provider === 'github-issues' || provider === 'stackoverflow') {
		return 'medium';
	}

	if (provider === 'search-link-only') {
		return 'manual';
	}

	return 'low';
}

export function getResearchFreshnessMaxAgeHours(provider: CommunityProvider): number {
	if (provider === 'github-repositories' || provider === 'github-issues') {
		return 168;
	}

	if (provider === 'npm' || provider === 'packagist') {
		return 168;
	}

	if (provider === 'stackoverflow') {
		return 168;
	}

	if (provider === 'reddit') {
		return 72;
	}

	return 720;
}

export function getResearchEvidenceWeight(provider: CommunityProvider): number {
	if (provider === 'github-repositories' || provider === 'github-issues') {
		return 3;
	}

	if (provider === 'npm' || provider === 'packagist' || provider === 'stackoverflow') {
		return 2;
	}

	if (provider === 'reddit') {
		return 1;
	}

	return 1;
}

export function getResearchTrustBoundary(provider: CommunityProvider): ResearchTrustBoundary {
	if (provider === 'github-repositories') {
		return 'public-index-count';
	}

	if (provider === 'github-issues' || provider === 'stackoverflow' || provider === 'reddit') {
		return 'public-discussion-sample';
	}

	if (provider === 'npm' || provider === 'packagist') {
		return 'package-ecosystem-discovery';
	}

	return 'manual-qualitative-review';
}

export function getResearchPriority(provider: CommunityProvider): number {
	if (provider === 'github-repositories' || provider === 'github-issues') {
		return 1;
	}

	if (provider === 'npm' || provider === 'packagist' || provider === 'stackoverflow') {
		return 2;
	}

	if (provider === 'reddit') {
		return 3;
	}

	return 4;
}

export function buildSourceToKeywordEdge(
	community: AlphaCommunitySource,
	keyword: string,
	provider = classifyCommunitySource(community)
): string {
	return `${keyword} -> ${provider} -> ${getCommunitySourceHost(community.href)}`;
}

export function getResearchProofUse(provider: CommunityProvider): string {
	if (provider === 'github-repositories') {
		return 'Comparable adapter/project discovery, maintenance signals, stars, and implementation patterns.';
	}

	if (provider === 'github-issues') {
		return 'Support burden, deployment friction, form-action/runtime complaints, and SvelteKit discussion context.';
	}

	if (provider === 'npm') {
		return 'JavaScript adapter/package ecosystem overlap and naming collisions.';
	}

	if (provider === 'packagist') {
		return 'PHP package ecosystem overlap and deployer expectations from Packagist search behavior.';
	}

	if (provider === 'stackoverflow') {
		return 'Q&A evidence for adoption blockers, routing failures, and PHP-host support needs.';
	}

	if (provider === 'reddit') {
		return 'Informal demand/support language from community discussion, treated as fragile due unauthenticated blocking.';
	}

	return 'Manual Apache/Nginx/shared-host research for routing fallback and deployment edge cases.';
}

export function getResearchReviewerAction(provider: CommunityProvider): string {
	if (provider === 'github-repositories') {
		return 'Review top repositories for active maintenance, adapter shape, and deployment claims.';
	}

	if (provider === 'github-issues') {
		return 'Scan issues/discussions for repeated routing, actions, base-path, and PHP hosting failures.';
	}

	if (provider === 'npm') {
		return 'Compare package names, install surfaces, and whether similar adapters are maintained.';
	}

	if (provider === 'packagist') {
		return 'Check whether PHP ecosystem users already search for SvelteKit-related packages.';
	}

	if (provider === 'stackoverflow') {
		return 'Inspect top questions for recurring support themes and unresolved deployment patterns.';
	}

	if (provider === 'reddit') {
		return 'Treat results as qualitative language only; do not use Reddit counts as hard demand proof.';
	}

	return 'Open the manual search and capture relevant Apache/Nginx/shared-host routing guidance.';
}

export function getResearchCollectorNote(provider: CommunityProvider): string {
	if (provider === 'github-repositories' || provider === 'github-issues') {
		return 'Uses unauthenticated GitHub Search API unless GITHUB_TOKEN or GH_TOKEN is present.';
	}

	if (provider === 'reddit') {
		return 'Reddit may reject or throttle unauthenticated JSON requests; failed collection is expected in some environments.';
	}

	if (provider === 'search-link-only') {
		return 'No public JSON collector is configured; this is intentionally manual evidence.';
	}

	return 'Uses a public unauthenticated JSON endpoint with timeout and failure recorded per source.';
}

export function describeCommunitySource(community: AlphaCommunitySource, keyword: string) {
	const provider = classifyCommunitySource(community);

	return {
		keyword,
		label: community.label,
		href: community.href,
		sourceHost: getCommunitySourceHost(community.href),
		provider,
		mode: getResearchSourceMode(provider),
		collectionMethod: getResearchCollectionMethod(provider),
		endpoint: buildCommunityEndpoint(provider, keyword, community.label),
		evidenceKind: getResearchEvidenceKind(provider),
		collectionRisk: getResearchCollectionRisk(provider),
		collectionPriority: getResearchPriority(provider),
		freshnessMaxAgeHours: getResearchFreshnessMaxAgeHours(provider),
		evidenceWeight: getResearchEvidenceWeight(provider),
		trustBoundary: getResearchTrustBoundary(provider),
		analyticsLinkageMarker: 'analytics-linked-keyword-graph',
		sourceToKeywordEdge: buildSourceToKeywordEdge(community, keyword, provider),
		manualReviewRequired: provider === 'search-link-only' || provider === 'reddit',
		proofUse: getResearchProofUse(provider),
		reviewerAction: getResearchReviewerAction(provider),
		collectorNote: getResearchCollectorNote(provider)
	};
}
