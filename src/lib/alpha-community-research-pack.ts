import type { AlphaReadinessReport } from './alpha-readiness';
import { describeCommunitySource } from './alpha-community-sources';
import { requiredAlphaEvidence } from './alpha-required-evidence';

type CommunitySourceDescriptor = ReturnType<typeof describeCommunitySource>;
type CommunityAnalyticsArtifact = {
	collectedAt?: string;
	note?: string;
	summary?: {
		successfulSources?: number;
		failedSources?: number;
		blockedSources?: number;
		skippedSources?: number;
		manualReviewRequiredSources?: number;
		averageDemandScore?: number;
	};
	queries?: {
		signalId?: string;
		keyword: string;
		aggregate?: {
			demandScore?: number;
			totalMentions?: number;
			successfulSources?: number;
			failedSources?: number;
			blockedSources?: number;
			skippedSources?: number;
			manualReviewRequiredSources?: number;
		};
	}[];
} | null;
type CommunityAnalyticsQuery = NonNullable<NonNullable<CommunityAnalyticsArtifact>['queries']>[number];

function countByValue(
	sources: CommunitySourceDescriptor[],
	selector: (source: CommunitySourceDescriptor) => string
) {
	const counts = new Map<string, number>();

	for (const source of sources) {
		const value = selector(source);
		counts.set(value, (counts.get(value) ?? 0) + 1);
	}

	return Array.from(counts.entries()).map(([value, count]) => ({ value, count }));
}

export function buildCommunityResearchPack(
	report: AlphaReadinessReport,
	analytics: CommunityAnalyticsArtifact = null
) {
	const analyticsQueries = new Map<string, CommunityAnalyticsQuery>();
	for (const query of analytics?.queries ?? []) {
		analyticsQueries.set(query.signalId ?? query.keyword, query);
		analyticsQueries.set(query.keyword, query);
	}

	const queries = report.communitySignals.map((signal) => {
		const sources = signal.communities.map((community) =>
			describeCommunitySource(community, signal.keyword)
		);
		const collected = analyticsQueries.get(signal.id) ?? analyticsQueries.get(signal.keyword);

		return {
			id: signal.id,
			keyword: signal.keyword,
			intent: signal.intent,
			curatedScore: signal.metric,
			collectedAnalytics: {
				marker: 'analytics-linked-keyword-graph',
				collectedAt: analytics?.collectedAt ?? null,
				demandScore: collected?.aggregate?.demandScore ?? null,
				totalMentions: collected?.aggregate?.totalMentions ?? null,
				successfulSources: collected?.aggregate?.successfulSources ?? 0,
				failedSources: collected?.aggregate?.failedSources ?? 0,
				blockedSources: collected?.aggregate?.blockedSources ?? 0,
				skippedSources: collected?.aggregate?.skippedSources ?? 0,
				manualReviewRequiredSources: collected?.aggregate?.manualReviewRequiredSources ?? 0,
				trustLevel: 'directional-community-signal',
				freshnessMarker: 'community-analytics-freshness-contract'
			},
			supportedSources: sources.filter((source) => source.mode === 'supported-json-api'),
			manualSources: sources.filter((source) => source.mode === 'manual-research-link')
		};
	});

	const supportedSourceCount = queries.reduce((total, query) => total + query.supportedSources.length, 0);
	const manualSourceCount = queries.reduce((total, query) => total + query.manualSources.length, 0);
	const sourceDescriptors = queries.flatMap((query) => [
		...query.supportedSources,
		...query.manualSources
	]);
	const collectionPlan = [...sourceDescriptors]
		.sort((left, right) => left.collectionPriority - right.collectionPriority || left.label.localeCompare(right.label))
		.map((source) => ({
			label: source.label,
			sourceHost: source.sourceHost,
			provider: source.provider,
			mode: source.mode,
			collectionMethod: source.collectionMethod,
			evidenceKind: source.evidenceKind,
			collectionRisk: source.collectionRisk,
			freshnessMaxAgeHours: source.freshnessMaxAgeHours,
			evidenceWeight: source.evidenceWeight,
			trustBoundary: source.trustBoundary,
			sourceHealth: source.sourceHealth,
			actionLane: source.actionLane,
			confidenceTier: source.confidenceTier,
			releaseClaimUse: source.releaseClaimUse,
			resultTotalField: source.resultTotalField,
			topResultFields: source.topResultFields,
			sampleReviewRule: source.sampleReviewRule,
			analyticsLinkageMarker: source.analyticsLinkageMarker,
			alphaEvidenceChecklistMarker: source.alphaEvidenceChecklistMarker,
			alphaEvidenceChecklist: source.alphaEvidenceChecklist,
			sourceToKeywordEdge: source.sourceToKeywordEdge,
			manualReviewRequired: source.manualReviewRequired,
			priority: source.collectionPriority,
			endpoint: source.endpoint,
			href: source.href,
			proofUse: source.proofUse,
			releaseUse: source.releaseUse,
			reviewerAction: source.reviewerAction,
			collectorNote: source.collectorNote,
			blockedOutcomePolicy: source.blockedOutcomePolicy
		}));
	const runtimeCollectionBoundary = {
		marker: 'no-live-community-api-runtime-boundary',
		trustLevel: 'deterministic-runtime-evidence',
		collectionCommand: 'bun run alpha:analytics',
		runtimeEndpoints: [
			'/alpha-readiness/community-analytics.md',
			'/alpha-readiness/community-research-pack.json',
			'/alpha-readiness/community-source-map.svg',
			'/alpha-readiness/community-signals.csv',
			'/alpha-readiness/community-sources.csv'
		],
		proofUse:
			'Runtime endpoints serve deterministic source/report data and never call public community APIs; fresh public-source collection stays an explicit local/CI command.'
	};
	const keywordSearchGraph = {
		requiredEvidence: requiredAlphaEvidence,
		graphic: '/alpha-readiness/community-source-map.svg',
		sourceCsv: '/alpha-readiness/community-sources.csv',
		analyticsMarkdown: '/alpha-readiness/community-analytics.md',
		analyticsLinkage: {
			marker: 'analytics-linked-keyword-graph',
			collectedArtifactEmbedded: Boolean(analytics),
			collectedAt: analytics?.collectedAt ?? null,
			collectedSummaryField: 'collectedCommunityAnalytics.summary',
			curatedSignalScoreField: 'keywordSearchGraph.nodes[].curatedScore',
			collectedDemandScoreField:
				'collectedCommunityAnalytics.queries[].aggregate.demandScore',
			weightedDemandScoreField:
				'collectedCommunityAnalytics.queries[].aggregate.weightedDemandScore',
			sourceToKeywordEdgeField: 'keywordSearchGraph.edges[].sourceToKeywordEdge',
			directionalTrustLevel: 'directional-community-signal',
			graphicMarkers: [
				'curated-signal-score',
				'collected-demand-score',
				'directional-community-signal',
				'no-live-community-api-runtime-boundary'
			]
		},
		reviewContract: {
			marker: 'community-analytics-graphic-linkage-contract',
			requiredEvidence: requiredAlphaEvidence,
			graphic: '/alpha-readiness/community-source-map.svg',
			analyticsMarkdown: '/alpha-readiness/community-analytics.md',
			signalsCsv: '/alpha-readiness/community-signals.csv',
			sourcesCsv: '/alpha-readiness/community-sources.csv',
			requiredMarkers: [
				'keyword-search-graph',
				'analytics-linked-keyword-graph',
				'community-analytics-freshness-contract',
				'source-to-keyword-edge',
				'curated-signal-score',
				'collected-demand-score',
				'directional-community-signal',
				'no-live-community-api-runtime-boundary',
				'alpha-community-source-evidence-checklist',
				'source-health-classification',
				'result-total-field-contract',
				'top-result-field-contract',
				'sample-review-rule',
				'action-lane-classification',
				'confidence-tier-classification',
				'release-claim-use-guidance',
				'supported-api-lanes',
				'manual-research-lanes'
			],
			requiredAlphaMarkers: [
				'requiredEvidence',
				'required-alpha-evidence',
				'alpha-readiness-report-graphics',
				'community-keyword-search-graph',
				'community-analytics-freshness-contract'
			],
			reviewerPath: [
				'Open the source-map SVG first.',
				'Trace keyword nodes to supported API lanes and manual research lanes.',
				'Check alphaEvidenceChecklist for each source before using a count as release evidence.',
				'Filter actionLane before treating a source as release evidence.',
				'Use confidenceTier and releaseClaimUse to avoid overclaiming fragile or manual sources.',
				'Compare curated-signal-score values with collected-demand-score fields.',
				'Use directional-community-signal as the trust boundary for public-source counts.',
				'Use no-live-community-api-runtime-boundary to keep runtime report endpoints deterministic.'
			],
			proofUse:
				'Portable graphic and spreadsheet contract linking keyword searches, public source analytics, manual research links, directional trust metadata, and the no-live-community-api runtime boundary.'
		},
		nodes: queries.map((query) => {
			const allSources = [...query.supportedSources, ...query.manualSources];
			return {
				id: query.id,
				keyword: query.keyword,
				intent: query.intent,
				curatedScore: query.curatedScore,
				analyticsLinkage: {
					marker: 'analytics-linked-keyword-graph',
					curatedSignalScore: query.curatedScore,
					collectedAt: query.collectedAnalytics.collectedAt,
					collectedDemandScore: query.collectedAnalytics.demandScore,
					collectedTotalMentions: query.collectedAnalytics.totalMentions,
					collectedSourceStatus: {
						successfulSources: query.collectedAnalytics.successfulSources,
						failedSources: query.collectedAnalytics.failedSources,
						blockedSources: query.collectedAnalytics.blockedSources,
						skippedSources: query.collectedAnalytics.skippedSources,
						manualReviewRequiredSources: query.collectedAnalytics.manualReviewRequiredSources
					},
					collectedDemandScoreSource: '/alpha-readiness/community-analytics.md',
					collectedDemandScoreField: 'aggregate.demandScore',
					weightedDemandScoreField: 'aggregate.weightedDemandScore',
					trustLevel: 'directional-community-signal'
				},
				supportedApiLanes: query.supportedSources.length,
				manualResearchLanes: query.manualSources.length,
				sourceHosts: Array.from(new Set(allSources.map((source) => source.sourceHost))).sort(),
				apiEndpoints: query.supportedSources.map((source) => ({
					label: source.label,
					provider: source.provider,
					endpoint: source.endpoint,
					evidenceKind: source.evidenceKind,
					collectionRisk: source.collectionRisk,
					freshnessMaxAgeHours: source.freshnessMaxAgeHours,
					evidenceWeight: source.evidenceWeight,
					trustBoundary: source.trustBoundary,
					sourceHealth: source.sourceHealth,
					actionLane: source.actionLane,
					confidenceTier: source.confidenceTier,
					releaseClaimUse: source.releaseClaimUse,
					resultTotalField: source.resultTotalField,
					topResultFields: source.topResultFields,
					sampleReviewRule: source.sampleReviewRule,
					analyticsLinkageMarker: source.analyticsLinkageMarker,
					alphaEvidenceChecklistMarker: source.alphaEvidenceChecklistMarker,
					alphaEvidenceChecklist: source.alphaEvidenceChecklist,
					sourceToKeywordEdge: source.sourceToKeywordEdge,
					manualReviewRequired: source.manualReviewRequired,
					releaseUse: source.releaseUse,
					blockedOutcomePolicy: source.blockedOutcomePolicy
				})),
				manualLinks: query.manualSources.map((source) => ({
					label: source.label,
					href: source.href,
					sourceHost: source.sourceHost,
					evidenceKind: source.evidenceKind,
					freshnessMaxAgeHours: source.freshnessMaxAgeHours,
					evidenceWeight: source.evidenceWeight,
					trustBoundary: source.trustBoundary,
					sourceHealth: source.sourceHealth,
					actionLane: source.actionLane,
					confidenceTier: source.confidenceTier,
					releaseClaimUse: source.releaseClaimUse,
					resultTotalField: source.resultTotalField,
					topResultFields: source.topResultFields,
					sampleReviewRule: source.sampleReviewRule,
					analyticsLinkageMarker: source.analyticsLinkageMarker,
					alphaEvidenceChecklistMarker: source.alphaEvidenceChecklistMarker,
					alphaEvidenceChecklist: source.alphaEvidenceChecklist,
					sourceToKeywordEdge: source.sourceToKeywordEdge,
					manualReviewRequired: source.manualReviewRequired,
					releaseUse: source.releaseUse,
					blockedOutcomePolicy: source.blockedOutcomePolicy
				}))
			};
		}),
		edges: queries.flatMap((query) =>
			[...query.supportedSources, ...query.manualSources].map((source) => ({
				from: query.id,
				to: source.label,
				mode: source.mode,
				provider: source.provider,
				sourceHost: source.sourceHost,
				evidenceKind: source.evidenceKind,
				collectionRisk: source.collectionRisk,
				freshnessMaxAgeHours: source.freshnessMaxAgeHours,
				evidenceWeight: source.evidenceWeight,
				trustBoundary: source.trustBoundary,
				sourceHealth: source.sourceHealth,
				actionLane: source.actionLane,
				confidenceTier: source.confidenceTier,
				releaseClaimUse: source.releaseClaimUse,
				resultTotalField: source.resultTotalField,
				topResultFields: source.topResultFields,
				sampleReviewRule: source.sampleReviewRule,
				analyticsLinkageMarker: source.analyticsLinkageMarker,
				alphaEvidenceChecklistMarker: source.alphaEvidenceChecklistMarker,
				alphaEvidenceChecklist: source.alphaEvidenceChecklist,
				sourceToKeywordEdge: source.sourceToKeywordEdge,
				manualReviewRequired: source.manualReviewRequired,
				endpoint: source.endpoint,
				href: source.href,
				releaseUse: source.releaseUse,
				blockedOutcomePolicy: source.blockedOutcomePolicy
			}))
		)
	};
	const analyticsFreshnessContract = {
		marker: 'community-analytics-freshness-contract',
		maxAgeHours: 168,
		trustLevel: 'directional-community-signal',
		runtimeCollectionBoundary,
		collectionCommand: 'bun run alpha:analytics',
		refreshCommand: 'bun run alpha:report:full',
		sourceArtifact: 'report/alpha-community-analytics.json',
		markdownArtifact: 'report/alpha-community-analytics.md',
		runtimeMarkdown: '/alpha-readiness/community-analytics.md',
		researchPack: '/alpha-readiness/community-research-pack.json',
		currentArtifact: {
			embedded: Boolean(analytics),
			collectedAt: analytics?.collectedAt ?? null,
			note: analytics?.note ?? null,
			summary: analytics?.summary ?? null
		},
		staleWhen: [
			'collectedAt is missing',
			'collectedAt is older than 168 hours at release-review time',
			'successfulSources is 0 while supportedSourceCount is greater than 0',
			'providerCoverage, evidenceKindCoverage, or collectionRiskCoverage is missing',
			'alphaEvidenceChecklist coverage is missing from source descriptors'
		],
		reviewerRule:
			'Use collected public-source counts only as directional alpha evidence; refresh within seven days before release review and open linked source results for release-critical claims.'
	};

	return {
		target: report.target,
		issued: report.issued,
		bridgeSource: report.bridgeSource,
		commands: {
			collectAnalytics: 'bun run alpha:analytics',
			collectAnalyticsWithGithubToken: '$env:GITHUB_TOKEN="<token>"; bun run alpha:analytics',
			exportFullReport: 'bun run alpha:report:full',
			verifyAlpha: 'bun run verify:alpha'
		},
		reviewerWorkflow: [
			'Open the community source-map SVG to understand source coverage before reading counts.',
			'Use keywordSearchGraph to trace each keyword to supported API endpoints, manual research links, CSV rows, and collected analytics notes.',
			'Use alphaEvidenceChecklist and sourceHealth before treating any source as alpha release evidence.',
			'Run alpha:analytics only when public-source collection is desired; failures are recorded per source.',
			'Keep runtime endpoints on no-live-community-api-runtime-boundary; they serve deterministic report data only.',
			'Compare curated alpha scores against collected demand scores instead of treating either as complete telemetry.',
			'Use manual Apache/Nginx links to confirm routing fallback constraints that public JSON APIs cannot cover.'
		],
		summary: {
			queryCount: queries.length,
			supportedSourceCount,
			manualSourceCount,
			analyticsFreshnessContract: true,
			analyticsLinkedKeywordGraph: true,
			communityAnalyticsGraphicLinkageContract: true,
			requiredAlphaEvidenceLinked: true,
			collectedAnalyticsEmbedded: Boolean(analytics),
			collectedAt: analytics?.collectedAt ?? null,
			collectedAverageDemandScore: analytics?.summary?.averageDemandScore ?? null,
			collectedSuccessfulSources: analytics?.summary?.successfulSources ?? 0,
			collectedFailedSources: analytics?.summary?.failedSources ?? 0,
			collectedBlockedSources: analytics?.summary?.blockedSources ?? 0,
			collectedSkippedSources: analytics?.summary?.skippedSources ?? 0,
			collectedManualReviewRequiredSources: analytics?.summary?.manualReviewRequiredSources ?? 0,
			keywordSearchGraphNodes: keywordSearchGraph.nodes.length,
			keywordSearchGraphEdges: keywordSearchGraph.edges.length,
			providerCoverage: countByValue(sourceDescriptors, (source) => source.provider),
			evidenceKindCoverage: countByValue(sourceDescriptors, (source) => source.evidenceKind),
			collectionRiskCoverage: countByValue(sourceDescriptors, (source) => source.collectionRisk),
			collectionMethodCoverage: countByValue(sourceDescriptors, (source) => source.collectionMethod),
			sourceHealthCoverage: countByValue(sourceDescriptors, (source) => source.sourceHealth),
			trustBoundaryCoverage: countByValue(sourceDescriptors, (source) => source.trustBoundary),
			freshnessWindowCoverage: countByValue(sourceDescriptors, (source) =>
				String(source.freshnessMaxAgeHours)
			),
			actionLaneCoverage: countByValue(sourceDescriptors, (source) => source.actionLane),
			confidenceTierCoverage: countByValue(sourceDescriptors, (source) => source.confidenceTier),
			resultTotalFieldCoverage: true,
			resultTotalFieldCoverageByField: countByValue(
				sourceDescriptors,
				(source) => source.resultTotalField
			),
			releaseClaimUseGuidance: true,
			sampleReviewRuleCoverage: true,
			noLiveCommunityApiRuntimeBoundary: true,
			weightedDemandScore: 'collectedCommunityAnalytics.queries[].aggregate.weightedDemandScore',
			note: 'Supported sources map to public JSON endpoints where available; manual sources remain explicit research links; runtime endpoints do not call live community APIs.'
		},
		analyticsFreshnessContract,
		runtimeCollectionBoundary,
		requiredAlphaEvidence,
		keywordSearchGraph,
		collectionPlan,
		queries,
		limitations: report.limitations.filter((limitation) => limitation.includes('Community analytics'))
	};
}
