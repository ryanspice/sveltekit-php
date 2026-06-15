import type { AlphaReadinessReport } from './alpha-readiness';
import { describeCommunitySource } from './alpha-community-sources';
import { requiredAlphaEvidence } from './alpha-required-evidence';

type CommunityAnalyticsArtifact = {
	collectedAt?: string;
	note?: string;
	summary?: {
		signals?: number;
		successfulSources?: number;
		failedSources?: number;
		skippedSources?: number;
		averageDemandScore?: number;
	};
	queries?: {
		signalId?: string;
		keyword: string;
		intent?: string;
		aggregate?: {
			demandScore?: number;
			totalMentions?: number;
			successfulSources?: number;
			failedSources?: number;
			skippedSources?: number;
		};
		sources?: {
			label: string;
			provider: string;
			status: string;
			url: string;
			total?: number | null;
			error?: string | null;
			top?: { title?: string; url?: string; score?: number }[];
		}[];
	}[];
} | null;

type CommunitySourceDescriptor = ReturnType<typeof describeCommunitySource>;

function summarizeSources(
	sources: CommunitySourceDescriptor[],
	selector: (source: CommunitySourceDescriptor) => string
) {
	const counts = new Map<string, number>();

	for (const source of sources) {
		const value = selector(source);
		counts.set(value, (counts.get(value) ?? 0) + 1);
	}

	return Array.from(counts.entries())
		.map(([value, count]) => `${value}: ${count}`)
		.join(', ');
}

export function renderAlphaCommunityAnalyticsMarkdown(
	report: AlphaReadinessReport,
	analytics: CommunityAnalyticsArtifact = null
) {
	const sourceDescriptors = report.communitySignals.flatMap((signal) =>
		signal.communities.map((community) => describeCommunitySource(community, signal.keyword))
	);
	const lines = [
		`# SvelteKit PHP ${report.target} community analytics`,
		'',
		`Issued: ${report.issued}`,
		`Bridge source: ${report.bridgeSource}`,
		'',
		'This report is an alpha research handoff for open-source demand, support burden, comparable adapter patterns, and PHP-hosting friction. Public API counts are directional signals, not product telemetry.',
		'',
		'## Collection commands',
		'',
		'- `bun run alpha:analytics`',
		'- `bun run alpha:report:full`',
		'- `bun run verify:alpha`',
		''
	];

	lines.push('## Source coverage plan', '');
	lines.push('- Freshness marker: `community-analytics-freshness-contract`.');
	lines.push('- Freshness rule: refresh with `bun run alpha:analytics` within 168 hours before alpha release review.');
	lines.push(`- Providers: ${summarizeSources(sourceDescriptors, (source) => source.provider)}`);
	lines.push(`- Evidence kinds: ${summarizeSources(sourceDescriptors, (source) => source.evidenceKind)}`);
	lines.push(`- Collection risk: ${summarizeSources(sourceDescriptors, (source) => source.collectionRisk)}`);
	lines.push(
		'- Reviewer rule: use collected counts as directional evidence only; confirm release-critical claims by opening the linked source results.'
	);
	lines.push('');

	lines.push('## Required alpha evidence linkage', '');
	lines.push('- Contract markers: `requiredEvidence`, `required-alpha-evidence`.');
	lines.push('- Graphic proof: `alpha-readiness-report-graphics` via `/alpha-readiness/community-source-map.svg` and `report/alpha-community-source-map.svg`.');
	lines.push('- Keyword proof: `community-keyword-search-graph` via `keywordSearchGraph`, `source-to-keyword-edge`, and spreadsheet CSV rows.');
	lines.push('- Freshness proof: `community-analytics-freshness-contract` via `collectedAt`, `maxAgeHours`, source coverage, and `directional-community-signal` trust metadata.');
	for (const marker of requiredAlphaEvidence) {
		lines.push(`- Required marker: \`${marker}\`.`);
	}
	lines.push('');

	if (analytics) {
		lines.push('## Collected source summary', '');
		lines.push(`- Collected: ${analytics.collectedAt ?? 'unknown'}`);
		lines.push(`- Signals: ${analytics.summary?.signals ?? report.communitySignals.length}`);
		lines.push(`- Successful sources: ${analytics.summary?.successfulSources ?? 0}`);
		lines.push(`- Failed sources: ${analytics.summary?.failedSources ?? 0}`);
		lines.push(`- Skipped sources: ${analytics.summary?.skippedSources ?? 0}`);
		lines.push(`- Average demand score: ${analytics.summary?.averageDemandScore ?? 0}/100`);
		lines.push('- Freshness contract: `community-analytics-freshness-contract` requires `collectedAt`, source coverage summaries, and successful source counts to be reviewed before release.');
		if (analytics.note) {
			lines.push(`- Note: ${analytics.note}`);
		}
		lines.push('');
	} else {
		lines.push('## Collected source summary', '');
		lines.push(
			'No collected analytics artifact is embedded in this runtime endpoint. Run `bun run alpha:analytics` locally to write `report/alpha-community-analytics.json`, then `bun run alpha:report:full` to embed collected counts in generated report artifacts.'
		);
		lines.push(
			'Freshness contract `community-analytics-freshness-contract` is not satisfied by runtime-only placeholder data.'
		);
		lines.push('');
	}

	lines.push('## Keyword research map', '');
	for (const signal of report.communitySignals) {
		const collected = analytics?.queries?.find((query) => (query.signalId ?? query.keyword) === signal.id || query.keyword === signal.keyword);

		lines.push(`### ${signal.keyword}`, '');
		lines.push(`- Intent: ${signal.intent}`);
		lines.push(`- Curated alpha score: ${signal.metric}/100`);
		if (collected) {
			lines.push(`- Collected demand score: ${collected.aggregate?.demandScore ?? 0}/100`);
			lines.push(`- Total mentions: ${collected.aggregate?.totalMentions ?? 0}`);
			lines.push(
				`- Source status: ${collected.aggregate?.successfulSources ?? 0} ok, ${collected.aggregate?.failedSources ?? 0} failed, ${collected.aggregate?.skippedSources ?? 0} skipped`
			);
		}
		lines.push('- Research links:');
		for (const community of signal.communities) {
			lines.push(`  - [${community.label}](${community.href})`);
		}
		lines.push('- Collection endpoints:');
		for (const community of signal.communities) {
			const source = describeCommunitySource(community, signal.keyword);
			if (source.endpoint) {
				lines.push(
					`  - ${source.label} (${source.sourceHost}, ${source.evidenceKind}, ${source.collectionRisk} risk): ${source.endpoint}`
				);
			} else {
				lines.push(
					`  - ${source.label} (${source.sourceHost}, ${source.evidenceKind}, ${source.collectionRisk} risk): manual research link only`
				);
			}
			lines.push(`    - Proof use: ${source.proofUse}`);
			lines.push(`    - Reviewer action: ${source.reviewerAction}`);
			lines.push(`    - Collector note: ${source.collectorNote}`);
		}
		lines.push('');

		for (const source of collected?.sources ?? []) {
			lines.push(`#### ${source.label}`, '');
			lines.push(`- Provider: ${source.provider}`);
			lines.push(`- Status: ${source.status}`);
			lines.push(`- URL: ${source.url}`);
			if (source.total !== undefined && source.total !== null) {
				lines.push(`- Total: ${source.total}`);
			}
			if (source.error) {
				lines.push(`- Error: ${source.error}`);
			}
			if ((source.top ?? []).length > 0) {
				lines.push('- Top results:');
				for (const item of source.top ?? []) {
					if (item.title && item.url) {
						lines.push(`  - [${item.title}](${item.url})`);
					}
				}
			}
			lines.push('');
		}
	}

	lines.push('## Limitations', '');
	for (const limitation of report.limitations.filter((limitation) => limitation.includes('Community analytics'))) {
		lines.push(`- ${limitation}`);
	}
	lines.push('- Runtime endpoints do not call public community APIs; collection stays an explicit local/CI command.');
	lines.push('');

	return lines.join('\n');
}
