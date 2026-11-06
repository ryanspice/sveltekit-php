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

export type CommunityAnalyticsSource = ReturnType<
	typeof import('../src/lib/alpha-community-sources').describeCommunitySource
> & {
	status: string;
	url: string;
	total: number | null;
	score: number;
	top: { title?: string; url?: string; score: number }[];
	error: string | null;
};

export type CommunityAnalyticsArtifact = {
	target: string;
	collectedAt: string;
	userAgent: string;
	note: string;
	freshnessContract: {
		marker: string;
		maxAgeHours: number;
		trustLevel: string;
		refreshCommand: string;
		reportCommand: string;
		requiredSourceFields: string[];
		reviewerRule: string;
	};
	summary: {
		signals: number;
		successfulSources: number;
		failedSources: number;
		blockedSources: number;
		skippedSources: number;
		manualReviewRequiredSources: number;
		averageDemandScore: number;
		weightedAverageDemandScore: number;
		providerCoverage: { value: string | number; count: number }[];
		evidenceKindCoverage: { value: string | number; count: number }[];
		collectionRiskCoverage: { value: string | number; count: number }[];
		collectionMethodCoverage: { value: string | number; count: number }[];
		trustBoundaryCoverage: { value: string | number; count: number }[];
		freshnessWindows: { value: string | number; count: number }[];
		analyticsLinkageMarkers: string[];
	};
	queries: {
		signalId: string;
		id?: string;
		keyword: string;
		intent: string;
		analyticsLinkageMarker: string;
		sourceToKeywordEdges: string[];
		aggregate: {
			successfulSources: number;
			failedSources: number;
			blockedSources: number;
			skippedSources: number;
			manualReviewRequiredSources: number;
			totalMentions: number;
			demandScore: number;
			weightedDemandScore: number;
		};
		sources: CommunityAnalyticsSource[];
	}[];
};

export function collectCommunityAnalytics(options?: {
	signals?: Array<{
		id: string;
		keyword: string;
		intent: string;
		communities: CommunitySource[];
	}>;
	timeoutMs?: number;
}): Promise<CommunityAnalyticsArtifact>;
