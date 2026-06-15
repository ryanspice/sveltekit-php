import type { AlphaReadinessReport } from './alpha-readiness';
import { describeCommunitySource } from './alpha-community-sources';
import { requiredAlphaEvidence } from './alpha-required-evidence';

type CommunitySourceDescriptor = ReturnType<typeof describeCommunitySource>;

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

export function buildCommunityResearchPack(report: AlphaReadinessReport) {
	const queries = report.communitySignals.map((signal) => {
		const sources = signal.communities.map((community) =>
			describeCommunitySource(community, signal.keyword)
		);

		return {
			id: signal.id,
			keyword: signal.keyword,
			intent: signal.intent,
			curatedScore: signal.metric,
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
			analyticsLinkageMarker: source.analyticsLinkageMarker,
			sourceToKeywordEdge: source.sourceToKeywordEdge,
			manualReviewRequired: source.manualReviewRequired,
			priority: source.collectionPriority,
			endpoint: source.endpoint,
			href: source.href,
			proofUse: source.proofUse,
			reviewerAction: source.reviewerAction,
			collectorNote: source.collectorNote
		}));
	const keywordSearchGraph = {
		requiredEvidence: requiredAlphaEvidence,
		graphic: '/alpha-readiness/community-source-map.svg',
		sourceCsv: '/alpha-readiness/community-sources.csv',
		analyticsMarkdown: '/alpha-readiness/community-analytics.md',
		analyticsLinkage: {
			marker: 'analytics-linked-keyword-graph',
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
				'directional-community-signal'
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
				'Compare curated-signal-score values with collected-demand-score fields.',
				'Use directional-community-signal as the trust boundary for public-source counts.'
			],
			proofUse:
				'Portable graphic and spreadsheet contract linking keyword searches, public source analytics, manual research links, and directional trust metadata.'
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
					analyticsLinkageMarker: source.analyticsLinkageMarker,
					sourceToKeywordEdge: source.sourceToKeywordEdge,
					manualReviewRequired: source.manualReviewRequired
				})),
				manualLinks: query.manualSources.map((source) => ({
					label: source.label,
					href: source.href,
					sourceHost: source.sourceHost,
					evidenceKind: source.evidenceKind,
					freshnessMaxAgeHours: source.freshnessMaxAgeHours,
					evidenceWeight: source.evidenceWeight,
					trustBoundary: source.trustBoundary,
					analyticsLinkageMarker: source.analyticsLinkageMarker,
					sourceToKeywordEdge: source.sourceToKeywordEdge,
					manualReviewRequired: source.manualReviewRequired
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
				analyticsLinkageMarker: source.analyticsLinkageMarker,
				sourceToKeywordEdge: source.sourceToKeywordEdge,
				manualReviewRequired: source.manualReviewRequired,
				endpoint: source.endpoint,
				href: source.href
			}))
		)
	};
	const analyticsFreshnessContract = {
		marker: 'community-analytics-freshness-contract',
		maxAgeHours: 168,
		trustLevel: 'directional-community-signal',
		collectionCommand: 'bun run alpha:analytics',
		refreshCommand: 'bun run alpha:report:full',
		sourceArtifact: 'report/alpha-community-analytics.json',
		markdownArtifact: 'report/alpha-community-analytics.md',
		runtimeMarkdown: '/alpha-readiness/community-analytics.md',
		researchPack: '/alpha-readiness/community-research-pack.json',
		staleWhen: [
			'collectedAt is missing',
			'collectedAt is older than 168 hours at release-review time',
			'successfulSources is 0 while supportedSourceCount is greater than 0',
			'providerCoverage, evidenceKindCoverage, or collectionRiskCoverage is missing'
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
			'Run alpha:analytics only when public-source collection is desired; failures are recorded per source.',
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
			keywordSearchGraphNodes: keywordSearchGraph.nodes.length,
			keywordSearchGraphEdges: keywordSearchGraph.edges.length,
			providerCoverage: countByValue(sourceDescriptors, (source) => source.provider),
			evidenceKindCoverage: countByValue(sourceDescriptors, (source) => source.evidenceKind),
			collectionRiskCoverage: countByValue(sourceDescriptors, (source) => source.collectionRisk),
			collectionMethodCoverage: countByValue(sourceDescriptors, (source) => source.collectionMethod),
			trustBoundaryCoverage: countByValue(sourceDescriptors, (source) => source.trustBoundary),
			freshnessWindowCoverage: countByValue(sourceDescriptors, (source) =>
				String(source.freshnessMaxAgeHours)
			),
			weightedDemandScore: 'collectedCommunityAnalytics.queries[].aggregate.weightedDemandScore',
			note: 'Supported sources map to public JSON endpoints where available; manual sources remain explicit research links.'
		},
		analyticsFreshnessContract,
		requiredAlphaEvidence,
		keywordSearchGraph,
		collectionPlan,
		queries,
		limitations: report.limitations.filter((limitation) => limitation.includes('Community analytics'))
	};
}
