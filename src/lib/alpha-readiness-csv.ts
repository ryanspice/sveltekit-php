import type { AlphaReadinessReport } from './alpha-readiness';
import { describeCommunitySource } from './alpha-community-sources';
import { requiredAlphaEvidence } from './alpha-required-evidence';

type CommunityAnalyticsArtifact = {
	queries?: {
		id?: string;
		signalId?: string;
		analyticsLinkageMarker?: string;
		sourceToKeywordEdges?: string[];
		aggregate?: {
			demandScore?: number;
			weightedDemandScore?: number;
		};
	}[];
} | null;

function csvCell(value: unknown) {
	return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

export function renderReadinessCsv(report: AlphaReadinessReport) {
	const rows = [
		['kind', 'id', 'label', 'status', 'score', 'description', 'gap', 'marker', 'evidence'],
		...report.readinessAreas.map((area) => [
			'readiness',
			area.id,
			area.title,
			area.status,
			area.score,
			area.description,
			area.gap,
			'',
			''
		]),
		...report.proofLedger.map((item) => [
			'proof-ledger',
			item.id,
			item.id,
			item.status,
			'',
			item.proves,
			item.stableBlocker,
			item.marker,
			item.evidence.join(' | ')
		]),
		...requiredAlphaEvidence.map((marker) => [
			'required-evidence',
			marker,
			marker,
			'required',
			'',
			'Required alpha evidence marker for the 1.0.2-alpha review boundary.',
			'Must remain synchronized across canonical report JSON, live page, generated reports, graphics, manifest, evidence index, gate matrix, package contract, hosted smoke checklist, and remote smoke.',
			marker,
			'requiredEvidence | required-alpha-evidence'
		])
	];

	return `${rows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`;
}

export function renderCommunitySignalsCsv(
	report: AlphaReadinessReport,
	communityAnalytics: CommunityAnalyticsArtifact = null
) {
	const collectedScores = new Map(
		(communityAnalytics?.queries ?? [])
			.flatMap((query) => {
				const key = query.signalId ?? query.id;
				return typeof key === 'string'
					? ([[key, query.aggregate?.demandScore ?? ''] as [string, number | string]])
					: [];
			})
	);
	const weightedScores = new Map(
		(communityAnalytics?.queries ?? [])
			.flatMap((query) => {
				const key = query.signalId ?? query.id;
				return typeof key === 'string'
					? ([[key, query.aggregate?.weightedDemandScore ?? ''] as [string, number | string]])
					: [];
			})
	);
	const queryEdges = new Map(
		(communityAnalytics?.queries ?? [])
			.map((query) => [query.signalId ?? query.id, query.sourceToKeywordEdges?.join(' | ') ?? ''] as const)
			.filter((entry): entry is [string, string] => typeof entry[0] === 'string')
	);
	const rows = [
		[
			'id',
			'keyword',
			'intent',
			'curated_score',
			'collected_demand_score',
			'weighted_demand_score',
			'analytics_linkage_marker',
			'source_to_keyword_edges',
			'curated_signal_score_marker',
			'collected_demand_score_marker',
			'directional_trust_level',
			'community_links'
		],
		...report.communitySignals.map((signal) => [
			signal.id,
			signal.keyword,
			signal.intent,
			signal.metric,
			collectedScores.get(signal.id) ?? '',
			weightedScores.get(signal.id) ?? '',
			'analytics-linked-keyword-graph',
			queryEdges.get(signal.id) ?? '',
			'curated-signal-score',
			'collected-demand-score',
			'directional-community-signal',
			signal.communities.map((community) => `${community.label}: ${community.href}`).join(' | ')
		])
	];

	return `${rows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`;
}

export function renderCommunitySourcesCsv(report: AlphaReadinessReport) {
	const rows = [
		[
			'signal_id',
			'keyword',
			'source_label',
			'source_host',
			'provider',
			'mode',
			'evidence_kind',
			'collection_risk',
			'collection_priority',
			'collection_method',
			'freshness_max_age_hours',
			'evidence_weight',
			'trust_boundary',
			'analytics_linkage_marker',
			'source_to_keyword_edge',
			'manual_review_required',
			'endpoint',
			'href',
			'proof_use',
			'reviewer_action',
			'collector_note'
		],
		...report.communitySignals.flatMap((signal) =>
			signal.communities.map((community) => {
				const source = describeCommunitySource(community, signal.keyword);

				return [
					signal.id,
					signal.keyword,
					source.label,
					source.sourceHost,
					source.provider,
					source.mode,
					source.evidenceKind,
					source.collectionRisk,
					source.collectionPriority,
					source.collectionMethod,
					source.freshnessMaxAgeHours,
					source.evidenceWeight,
					source.trustBoundary,
					source.analyticsLinkageMarker,
					source.sourceToKeywordEdge,
					source.manualReviewRequired,
					source.endpoint ?? '',
					source.href,
					source.proofUse,
					source.reviewerAction,
					source.collectorNote
				];
			})
		)
	];

	return `${rows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`;
}

