import type { AlphaReadinessReport } from './alpha-readiness';
import { describeCommunitySource } from './alpha-community-sources';
import { requiredAlphaEvidence } from './alpha-required-evidence';

type CommunityAnalyticsArtifact = {
	collectedAt?: string;
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

function escapeSvg(value: unknown) {
	return String(value)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

export function renderAlphaCommunitySourceMapSvg(
	report: AlphaReadinessReport,
	analytics: CommunityAnalyticsArtifact = null
) {
	const width = 1400;
	const height = 880;
	const requiredEvidenceMarkers = requiredAlphaEvidence.join(' | ');
	const sources = report.communitySignals.flatMap((signal) =>
		signal.communities.map((community) => ({
			signalId: signal.id,
			...describeCommunitySource(community, signal.keyword)
		}))
	);
	const supportedCount = sources.filter((source) => source.mode === 'supported-json-api').length;
	const manualCount = sources.filter((source) => source.mode === 'manual-research-link').length;
	const hosts = Array.from(new Set(sources.map((source) => source.sourceHost)));
	const weightedDemandScore = sources.length
		? Math.round(
				(sources.reduce((total, source) => total + source.evidenceWeight * 100, 0) / sources.length) * 10
			) / 10
		: 0;
	const analyticsLinkageMarkers = Array.from(
		new Set(sources.map((source) => source.analyticsLinkageMarker))
	).join(' | ');
	const sourceModes = Array.from(new Set(sources.map((source) => source.mode))).join(' | ');
	const sourceToKeywordEdges = sources.map((source) => source.sourceToKeywordEdge).join(' | ');
	const freshnessWindows = Array.from(
		new Set(sources.map((source) => `${source.freshnessMaxAgeHours}h`))
	).join(' | ');
	const trustBoundaries = Array.from(new Set(sources.map((source) => source.trustBoundary))).join(
		' | '
	);
	const sourceHealth = Array.from(new Set(sources.map((source) => source.sourceHealth))).join(
		' | '
	);
	const actionLanes = Array.from(new Set(sources.map((source) => source.actionLane))).join(' | ');
	const confidenceTiers = Array.from(new Set(sources.map((source) => source.confidenceTier))).join(
		' | '
	);
	const resultTotalFields = Array.from(new Set(sources.map((source) => source.resultTotalField))).join(
		' | '
	);
	const topResultFieldCount = Array.from(
		new Set(sources.flatMap((source) => source.topResultFields))
	).length;
	const analyticsSummary = analytics?.summary ?? null;
	const analyticsQueries = new Map<string, CommunityAnalyticsQuery>();
	for (const query of analytics?.queries ?? []) {
		analyticsQueries.set(query.signalId ?? query.keyword, query);
		analyticsQueries.set(query.keyword, query);
	}
	const collectedAt = analytics?.collectedAt ?? 'not-collected';
	const averageDemandScore = analyticsSummary?.averageDemandScore ?? 'not-collected';
	const successfulSources = analyticsSummary?.successfulSources ?? 0;
	const failedSources = analyticsSummary?.failedSources ?? 0;
	const blockedSources = analyticsSummary?.blockedSources ?? 0;
	const skippedSources = analyticsSummary?.skippedSources ?? 0;
	const manualReviewRequiredSources = analyticsSummary?.manualReviewRequiredSources ?? 0;
	const hostLabels = hosts
		.slice(0, 8)
		.map((host, index) => {
			const x = 76 + (index % 4) * 150;
			const y = 694 + Math.floor(index / 4) * 44;
			return `
				<g>
					<rect x="${x}" y="${y}" width="128" height="30" rx="15" class="host-chip" />
					<text x="${x + 64}" y="${y + 20}" text-anchor="middle" class="tiny">${escapeSvg(host)}</text>
				</g>`;
		})
		.join('');
	const signalRows = report.communitySignals
		.map((signal, signalIndex) => {
			const y = 204 + signalIndex * 124;
			const collected = analyticsQueries.get(signal.id) ?? analyticsQueries.get(signal.keyword);
			const collectedDemandScore = collected?.aggregate?.demandScore ?? 'not-collected';
			const collectedMentions = collected?.aggregate?.totalMentions ?? 'not-collected';
			const collectedSourceStatus = collected?.aggregate
				? `${collected.aggregate.successfulSources ?? 0} ok / ${collected.aggregate.failedSources ?? 0} failed / ${collected.aggregate.blockedSources ?? 0} blocked`
				: 'not-collected';
			const sourceNodes = signal.communities
				.map((community, sourceIndex) => {
					const source = describeCommunitySource(community, signal.keyword);
					const x = 470 + sourceIndex * 266;
					const nodeClass =
						source.mode === 'supported-json-api' ? 'source-node source-node--supported' : 'source-node source-node--manual';
					const endpointText = source.endpoint
						? source.endpoint.replace(/^https?:\/\//, '').slice(0, 42)
						: 'manual research link';

					return `
						<g>
							<path d="M414 ${y + 16} C436 ${y + 16}, 446 ${y + 16}, ${x - 16} ${y + 16}" class="connector" />
							<rect x="${x}" y="${y - 18}" width="236" height="130" rx="20" class="${nodeClass}" />
							<text x="${x + 18}" y="${y + 7}" class="source-title">${escapeSvg(source.label)}</text>
							<text x="${x + 18}" y="${y + 29}" class="tiny">${escapeSvg(source.sourceHost)} / ${escapeSvg(source.provider)}</text>
							<text x="${x + 18}" y="${y + 50}" class="tiny">${escapeSvg(source.evidenceKind)} / ${escapeSvg(source.collectionRisk)} risk</text>
							<text x="${x + 18}" y="${y + 68}" class="tiny">${escapeSvg(source.collectionMethod)} / weight ${escapeSvg(source.evidenceWeight)}</text>
							<text x="${x + 18}" y="${y + 84}" class="micro">${escapeSvg(source.actionLane)} / ${escapeSvg(source.confidenceTier)}</text>
							<text x="${x + 18}" y="${y + 98}" class="micro">${escapeSvg(source.sourceHealth)} / ${escapeSvg(source.mode)} / total ${escapeSvg(source.resultTotalField)}</text>
							<text x="${x + 18}" y="${y + 112}" class="micro">${escapeSvg(endpointText)}</text>
						</g>`;
				})
				.join('');

			return `
				<g>
					<rect x="76" y="${y - 24}" width="336" height="112" rx="24" class="keyword-card" />
					<text x="102" y="${y + 1}" class="keyword">${escapeSvg(signal.id)}</text>
					<text x="102" y="${y + 25}" class="tiny">${escapeSvg(signal.keyword)}</text>
					<text x="102" y="${y + 48}" class="tiny">${escapeSvg(signal.metric)}/100 curated-signal-score</text>
					<text x="102" y="${y + 68}" class="micro">collected-demand-score ${escapeSvg(collectedDemandScore)} / mentions ${escapeSvg(collectedMentions)}</text>
					<text x="102" y="${y + 82}" class="micro">source status: ${escapeSvg(collectedSourceStatus)}</text>
					${sourceNodes}
				</g>`;
		})
		.join('');

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc" data-required-alpha-evidence="requiredEvidence" data-no-live-community-api-runtime-boundary="true">
	<title id="title">SvelteKit PHP ${escapeSvg(report.target)} community source map</title>
	<desc id="desc">Open-source community analytics-linked-keyword-graph showing keyword-search-graph sourceToKeywordEdge links, supported-api-lanes, manual-research-lanes, curated-signal-score, collected-demand-score, collectedAt, totalMentions, collected-source-status, weightedDemandScore, freshnessMaxAgeHours, trustBoundary, sourceHealth, actionLane, confidenceTier, releaseClaimUse, alpha-community-source-evidence-checklist, manualReviewRequired, community-analytics-freshness-contract, directional-community-signal no-live-community-api-runtime-boundary metadata, requiredEvidence, required-alpha-evidence, alpha-readiness-report-graphics, community-keyword-search-graph, including api.github.com/search and google.com research lanes.</desc>
	<metadata>requiredEvidence required-alpha-evidence ${escapeSvg(requiredEvidenceMarkers)} community-analytics-freshness-contract no-live-community-api-runtime-boundary data-no-live-community-api-runtime-boundary alpha-community-source-evidence-checklist source-health-classification action-lane-classification confidence-tier-classification release-claim-use-guidance result-total-field-contract top-result-field-contract sample-review-rule analyticsLinkageMarker=${escapeSvg(analyticsLinkageMarkers)} sourceModes=${escapeSvg(sourceModes)} sourceHealth=${escapeSvg(sourceHealth)} actionLane=${escapeSvg(actionLanes)} confidenceTier=${escapeSvg(confidenceTiers)} resultTotalField=${escapeSvg(resultTotalFields)} topResultFields=${escapeSvg(topResultFieldCount)} sampleReviewRule=provider-scoped-review-guidance topResultFieldCount=${escapeSvg(topResultFieldCount)} releaseClaimUse=provider-scoped-review-guidance sourceToKeywordEdge=${escapeSvg(sourceToKeywordEdges)} weightedDemandScore=${escapeSvg(weightedDemandScore)} collectedAnalytics collectedAt=${escapeSvg(collectedAt)} averageDemandScore=${escapeSvg(averageDemandScore)} successfulSources=${escapeSvg(successfulSources)} failedSources=${escapeSvg(failedSources)} blockedSources=${escapeSvg(blockedSources)} skippedSources=${escapeSvg(skippedSources)} manualReviewRequiredSources=${escapeSvg(manualReviewRequiredSources)} freshnessMaxAgeHours=${escapeSvg(freshnessWindows)} trustBoundary=${escapeSvg(trustBoundaries)} manualReviewRequired=${escapeSvg(sources.some((source) => source.manualReviewRequired))} maxAgeHours=168 bun run alpha:analytics report/alpha-community-analytics.json report/alpha-community-analytics.md</metadata>
	<defs>
		<linearGradient id="micaMap" x1="0" y1="0" x2="1" y2="1">
			<stop offset="0" stop-color="#eef8ff" />
			<stop offset="0.48" stop-color="#f7edf5" />
			<stop offset="1" stop-color="#e8f8f2" />
		</linearGradient>
		<radialGradient id="washSourceA" cx="16%" cy="10%" r="58%">
			<stop offset="0" stop-color="#38bdf8" stop-opacity="0.36" />
			<stop offset="1" stop-color="#38bdf8" stop-opacity="0" />
		</radialGradient>
		<radialGradient id="washSourceB" cx="90%" cy="8%" r="60%">
			<stop offset="0" stop-color="#fb7185" stop-opacity="0.25" />
			<stop offset="1" stop-color="#fb7185" stop-opacity="0" />
		</radialGradient>
		<filter id="mapShadow" x="-10%" y="-10%" width="120%" height="130%">
			<feDropShadow dx="0" dy="22" stdDeviation="24" flood-color="#1f2937" flood-opacity="0.15" />
		</filter>
		<style>
			.bg { fill: url(#micaMap); }
			.panel { fill: rgba(255,255,255,0.68); stroke: rgba(80,95,130,0.18); stroke-width: 1.4; filter: url(#mapShadow); }
			.caption { fill: rgba(255,255,255,0.48); stroke: rgba(80,95,130,0.12); }
			.title { font: 850 52px "Segoe UI Variable", "Segoe UI", sans-serif; fill: #111827; letter-spacing: -2.8px; }
			.subtitle { font: 650 19px "Segoe UI", sans-serif; fill: #58647a; }
			.metric { font: 900 34px "Segoe UI", sans-serif; fill: #111827; }
			.metric-label { font: 800 14px "Segoe UI", sans-serif; fill: #58647a; letter-spacing: 0.08em; text-transform: uppercase; }
			.keyword { font: 850 18px "Segoe UI", sans-serif; fill: #111827; }
			.source-title { font: 850 16px "Segoe UI", sans-serif; fill: #111827; }
			.tiny { font: 700 12px "Segoe UI", sans-serif; fill: #58647a; }
			.micro { font: 650 10px "Segoe UI", sans-serif; fill: #667085; }
			.keyword-card { fill: rgba(255,255,255,0.5); stroke: rgba(80,95,130,0.16); }
			.source-node { stroke-width: 1.3; }
			.source-node--supported { fill: rgba(13,116,196,0.11); stroke: rgba(13,116,196,0.28); }
			.source-node--manual { fill: rgba(245,158,11,0.12); stroke: rgba(245,158,11,0.32); }
			.connector { fill: none; stroke: rgba(80,95,130,0.18); stroke-width: 2; stroke-dasharray: 7 8; }
			.host-chip { fill: rgba(255,255,255,0.5); stroke: rgba(80,95,130,0.14); }
		</style>
	</defs>
	<rect width="${width}" height="${height}" class="bg" />
	<rect width="${width}" height="${height}" fill="url(#washSourceA)" />
	<rect width="${width}" height="${height}" fill="url(#washSourceB)" />
	<rect x="44" y="36" width="1312" height="830" rx="34" class="panel" />
	<rect x="44" y="36" width="1312" height="78" rx="34" class="caption" />
	<circle cx="84" cy="76" r="10" fill="#ff5f57" />
	<circle cx="116" cy="76" r="10" fill="#ffbd2e" />
	<circle cx="148" cy="76" r="10" fill="#28c840" />
	<text x="76" y="154" class="subtitle">Open-source community analytics coverage / keyword-search-graph</text>
	<text x="76" y="210" class="title">Community source map</text>
	<g transform="translate(970 132)">
		<rect x="0" y="0" width="148" height="86" rx="24" class="keyword-card" />
		<text x="24" y="43" class="metric">${escapeSvg(supportedCount)}</text>
		<text x="24" y="67" class="metric-label">supported-api-lanes</text>
	</g>
	<g transform="translate(1138 132)">
		<rect x="0" y="0" width="148" height="86" rx="24" class="keyword-card" />
		<text x="24" y="43" class="metric">${escapeSvg(manualCount)}</text>
		<text x="24" y="67" class="metric-label">manual-research-lanes</text>
	</g>
	${signalRows}
	<g>
		<text x="76" y="670" class="subtitle">Source hosts</text>
		${hostLabels}
	</g>
	<text x="742" y="708" class="subtitle">Collector endpoints are explicit, not invented telemetry.</text>
	<text x="742" y="738" class="tiny">Primary API lane: api.github.com/search, registry.npmjs.org, packagist.org, api.stackexchange.com, reddit.com/search.json</text>
	<text x="742" y="762" class="tiny">Each source-to-keyword-edge includes evidence kind, collection risk, and source-health so reviewers can separate counts from manual proof.</text>
	<text x="742" y="786" class="tiny">analyticsLinkageMarker: ${escapeSvg(analyticsLinkageMarkers)} / weightedDemandScore ${escapeSvg(weightedDemandScore)}</text>
	<text x="742" y="810" class="tiny">freshnessMaxAgeHours ${escapeSvg(freshnessWindows)} / trustBoundary ${escapeSvg(trustBoundaries)} / sourceHealth ${escapeSvg(sourceHealth)}</text>
	<text x="742" y="834" class="tiny">actionLane ${escapeSvg(actionLanes)} / confidenceTier ${escapeSvg(confidenceTiers)}</text>
	<text x="742" y="854" class="tiny">resultTotalField ${escapeSvg(resultTotalFields)} / topResultFieldCount ${escapeSvg(topResultFieldCount)} / sources ${escapeSvg(successfulSources)} ok ${escapeSvg(failedSources)} failed ${escapeSvg(blockedSources)} blocked ${escapeSvg(skippedSources)} skipped</text>
	<text x="76" y="868" class="tiny">Target ${escapeSvg(report.target)} / ${escapeSvg(report.issued)} / ${escapeSvg(report.bridgeSource)}</text>
</svg>
`;
}
