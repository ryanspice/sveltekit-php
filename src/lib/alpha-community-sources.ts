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
export type ResearchSourceHealth =
	| 'countable-public-api'
	| 'rate-limited-public-discussion'
	| 'manual-review-only';
export type ResearchActionLane =
	| 'primary-release-evidence'
	| 'supporting-release-evidence'
	| 'qualitative-context'
	| 'manual-claim-check';
export type ResearchConfidenceTier =
	| 'high-public-index'
	| 'medium-public-sample'
	| 'low-fragile-sample'
	| 'manual-unverified';
export type ResearchResultTotalField =
	| 'total_count'
	| 'total'
	| 'results.length'
	| 'items.length'
	| 'data.dist'
	| 'manual-review-only';

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

export function getResearchSourceHealth(provider: CommunityProvider): ResearchSourceHealth {
	if (provider === 'reddit') {
		return 'rate-limited-public-discussion';
	}

	if (provider === 'search-link-only') {
		return 'manual-review-only';
	}

	return 'countable-public-api';
}

export function getResearchActionLane(provider: CommunityProvider): ResearchActionLane {
	if (provider === 'github-repositories' || provider === 'github-issues') {
		return 'primary-release-evidence';
	}

	if (provider === 'npm' || provider === 'packagist' || provider === 'stackoverflow') {
		return 'supporting-release-evidence';
	}

	if (provider === 'reddit') {
		return 'qualitative-context';
	}

	return 'manual-claim-check';
}

export function getResearchConfidenceTier(provider: CommunityProvider): ResearchConfidenceTier {
	if (provider === 'github-repositories' || provider === 'npm' || provider === 'packagist') {
		return 'high-public-index';
	}

	if (provider === 'github-issues' || provider === 'stackoverflow') {
		return 'medium-public-sample';
	}

	if (provider === 'reddit') {
		return 'low-fragile-sample';
	}

	return 'manual-unverified';
}

export function getResearchReleaseUse(provider: CommunityProvider): string {
	if (provider === 'github-repositories') {
		return 'Primary alpha signal for comparable adapter shape, source availability, and maintenance posture.';
	}

	if (provider === 'github-issues') {
		return 'Primary alpha signal for repeated runtime, routing, form-action, and hosting friction.';
	}

	if (provider === 'npm' || provider === 'packagist') {
		return 'Supporting alpha signal for package ecosystem discovery and naming/install expectations.';
	}

	if (provider === 'stackoverflow') {
		return 'Supporting alpha signal for support burden and unresolved deployment questions.';
	}

	if (provider === 'reddit') {
		return 'Qualitative alpha context only; do not promote Reddit counts to release-blocking evidence.';
	}

	return 'Manual qualitative context for host configuration claims that public APIs cannot prove.';
}

export function getResearchReleaseClaimUse(provider: CommunityProvider): string {
	if (provider === 'github-repositories') {
		return 'Can support claims about comparable adapter availability, active maintenance posture, and implementation shape after top repositories are reviewed.';
	}

	if (provider === 'github-issues') {
		return 'Can support claims about recurring user pain only after top issues/discussions are manually sampled.';
	}

	if (provider === 'npm' || provider === 'packagist') {
		return 'Can support ecosystem/naming/discovery claims, but not runtime correctness claims.';
	}

	if (provider === 'stackoverflow') {
		return 'Can support support-burden and deployment-confusion claims after top questions are reviewed.';
	}

	if (provider === 'reddit') {
		return 'Qualitative language only; never use as a hard demand, quality, or release-readiness claim.';
	}

	return 'Manual verification required before this source supports any release claim.';
}

export function getResearchBlockedOutcomePolicy(provider: CommunityProvider): string {
	if (provider === 'reddit') {
		return 'Record as blocked or failed, keep manual-review-required true, and continue with other source lanes.';
	}

	if (provider === 'search-link-only') {
		return 'Keep as manual-review-required; alpha review must open the linked search before relying on the claim.';
	}

	return 'Record API failure per source and require either a fresh retry or a manual linked-source review before release-critical use.';
}

export function getResearchAlphaEvidenceChecklist(provider: CommunityProvider): string[] {
	const common = [
		'alpha-community-source-evidence-checklist',
		'confirm-source-host',
		'record-source-to-keyword-edge',
		'compare-curated-signal-score-to-collected-demand-score',
		'keep-directional-community-signal-boundary'
	];

	if (provider === 'github-repositories') {
		return [...common, 'review-maintenance-signal', 'review-adapter-implementation-pattern'];
	}

	if (provider === 'github-issues') {
		return [...common, 'scan-recurring-runtime-failures', 'scan-routing-and-form-action-friction'];
	}

	if (provider === 'npm' || provider === 'packagist') {
		return [...common, 'check-package-ecosystem-overlap', 'check-install-surface-expectations'];
	}

	if (provider === 'stackoverflow') {
		return [...common, 'review-unresolved-support-questions', 'capture-hosting-failure-language'];
	}

	if (provider === 'reddit') {
		return [...common, 'treat-counts-as-fragile', 'capture-language-not-hard-demand'];
	}

	return [...common, 'open-manual-research-link', 'capture-host-configuration-evidence'];
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

export function getResearchResultTotalField(provider: CommunityProvider): ResearchResultTotalField {
	if (provider === 'github-repositories' || provider === 'github-issues') {
		return 'total_count';
	}

	if (provider === 'npm' || provider === 'packagist') {
		return 'total';
	}

	if (provider === 'stackoverflow') {
		return 'items.length';
	}

	if (provider === 'reddit') {
		return 'data.dist';
	}

	return 'manual-review-only';
}

export function getResearchTopResultFields(provider: CommunityProvider): string[] {
	if (provider === 'github-repositories') {
		return ['items[].full_name', 'items[].html_url', 'items[].stargazers_count'];
	}

	if (provider === 'github-issues') {
		return ['items[].title', 'items[].html_url', 'items[].comments'];
	}

	if (provider === 'npm') {
		return ['objects[].package.name', 'objects[].package.links.npm', 'objects[].score.final'];
	}

	if (provider === 'packagist') {
		return ['results[].name', 'results[].url', 'results[].downloads'];
	}

	if (provider === 'stackoverflow') {
		return ['items[].title', 'items[].link', 'items[].score'];
	}

	if (provider === 'reddit') {
		return ['data.children[].data.title', 'data.children[].data.permalink', 'data.children[].data.score'];
	}

	return ['manual-search-result.title', 'manual-search-result.url', 'manual-review-note'];
}

export function getResearchSampleReviewRule(provider: CommunityProvider): string {
	if (provider === 'github-repositories') {
		return 'Before using counts in release notes, inspect top repositories for adapter relevance, recency, license, and maintenance activity.';
	}

	if (provider === 'github-issues') {
		return 'Before using discussion counts as support evidence, sample top issues for repeated SvelteKit/PHP hosting failures rather than generic mentions.';
	}

	if (provider === 'npm' || provider === 'packagist') {
		return 'Before using registry totals, inspect top package names to avoid counting unrelated packages or abandoned experiments as adapter demand.';
	}

	if (provider === 'stackoverflow') {
		return 'Before using Q&A counts, sample top questions for unresolved routing, deployment, or form-action blockers.';
	}

	if (provider === 'reddit') {
		return 'Treat top posts as qualitative language only; do not convert Reddit samples into release-blocking demand evidence.';
	}

	return 'Open the manual search link and capture a dated reviewer note before using this source in release claims.';
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
		actionLane: getResearchActionLane(provider),
		confidenceTier: getResearchConfidenceTier(provider),
		freshnessMaxAgeHours: getResearchFreshnessMaxAgeHours(provider),
		evidenceWeight: getResearchEvidenceWeight(provider),
		trustBoundary: getResearchTrustBoundary(provider),
		sourceHealth: getResearchSourceHealth(provider),
		analyticsLinkageMarker: 'analytics-linked-keyword-graph',
		alphaEvidenceChecklistMarker: 'alpha-community-source-evidence-checklist',
		alphaEvidenceChecklist: getResearchAlphaEvidenceChecklist(provider),
		sourceToKeywordEdge: buildSourceToKeywordEdge(community, keyword, provider),
		manualReviewRequired: provider === 'search-link-only' || provider === 'reddit',
		proofUse: getResearchProofUse(provider),
		releaseUse: getResearchReleaseUse(provider),
		releaseClaimUse: getResearchReleaseClaimUse(provider),
		reviewerAction: getResearchReviewerAction(provider),
		collectorNote: getResearchCollectorNote(provider),
		resultTotalField: getResearchResultTotalField(provider),
		topResultFields: getResearchTopResultFields(provider),
		sampleReviewRule: getResearchSampleReviewRule(provider),
		blockedOutcomePolicy: getResearchBlockedOutcomePolicy(provider)
	};
}
