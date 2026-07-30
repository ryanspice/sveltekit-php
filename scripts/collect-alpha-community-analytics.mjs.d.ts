export type CommunitySource = {
	label: string;
	href: string;
};

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

export type CommunityProvider =
	| 'github-repositories'
	| 'github-issues'
	| 'npm'
	| 'packagist'
	| 'stackoverflow'
	| 'reddit'
	| 'search-link-only';

export function classifyCommunitySource(community: CommunitySource): CommunityProvider;

export function buildCommunityEndpoint(
	provider: CommunityProvider,
	keyword: string,
	label: string
): string | null;

export function describeCommunitySource(
	community: CommunitySource,
	keyword: string
): {
	label: string;
	href: string;
	keyword: string;
	sourceHost: string;
	provider: CommunityProvider;
	mode: ResearchSourceMode;
	collectionMethod: ResearchCollectionMethod;
	endpoint: string | null;
	evidenceKind: ResearchEvidenceKind;
	collectionRisk: ResearchCollectionRisk;
	collectionPriority: number;
	freshnessMaxAgeHours: number;
	evidenceWeight: number;
	trustBoundary: ResearchTrustBoundary;
	sourceHealth: ResearchSourceHealth;
	analyticsLinkageMarker: 'analytics-linked-keyword-graph';
	alphaEvidenceChecklistMarker: 'alpha-community-source-evidence-checklist';
	alphaEvidenceChecklist: string[];
	sourceToKeywordEdge: string;
	manualReviewRequired: boolean;
	proofUse: string;
	releaseUse: string;
	reviewerAction: string;
	collectorNote: string;
	blockedOutcomePolicy: string;
};

export function collectCommunityAnalytics(options?: {
	signals?: Array<{
		id: string;
		keyword: string;
		intent: string;
		communities: CommunitySource[];
	}>;
	timeoutMs?: number;
}): Promise<unknown>;
