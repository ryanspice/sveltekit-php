// @ts-nocheck
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { renderAlphaCommunityAnalyticsMarkdown } from '../src/lib/alpha-community-analytics-markdown.ts';
import {
	buildCommunityEndpoint,
	classifyCommunitySource,
	describeCommunitySource
} from '../src/lib/alpha-community-sources.ts';
import { alphaTarget, buildAlphaReadinessReport, communitySignals } from '../src/lib/alpha-readiness.ts';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.resolve(repoRoot, 'report');
const userAgent = 'sveltekit-php-alpha-readiness/1.0';

export { buildCommunityEndpoint, classifyCommunitySource, describeCommunitySource };

function scoreFromTotal(total) {
	if (!Number.isFinite(total) || total <= 0) {
		return 0;
	}

	return Math.min(100, Math.round(Math.log10(total + 1) * 25));
}

function parseProviderResult(provider, data) {
	if (provider === 'github-repositories') {
		return {
			total: Number(data.total_count ?? 0),
			top: (data.items ?? []).map((item) => ({
				title: item.full_name,
				url: item.html_url,
				score: item.stargazers_count ?? 0
			}))
		};
	}

	if (provider === 'github-issues') {
		return {
			total: Number(data.total_count ?? 0),
			top: (data.items ?? []).map((item) => ({
				title: item.title,
				url: item.html_url,
				score: item.comments ?? 0
			}))
		};
	}

	if (provider === 'npm') {
		return {
			total: Number(data.total ?? 0),
			top: (data.objects ?? []).map((item) => ({
				title: item.package?.name,
				url: item.package?.links?.npm,
				score: Math.round((item.score?.final ?? 0) * 100)
			}))
		};
	}

	if (provider === 'packagist') {
		return {
			total: Number(data.total ?? data.results?.length ?? 0),
			top: (data.results ?? []).map((item) => ({
				title: item.name,
				url: item.url ?? `https://packagist.org/packages/${item.name}`,
				score: item.downloads ?? 0
			}))
		};
	}

	if (provider === 'stackoverflow') {
		return {
			total: Number(data.total ?? data.items?.length ?? 0),
			top: (data.items ?? []).map((item) => ({
				title: item.title,
				url: item.link,
				score: item.score ?? 0
			}))
		};
	}

	if (provider === 'reddit') {
		const children = data.data?.children ?? [];
		return {
			total: Number(data.data?.dist ?? children.length ?? 0),
			top: children.map((entry) => ({
				title: entry.data?.title,
				url: entry.data?.permalink ? `https://www.reddit.com${entry.data.permalink}` : undefined,
				score: entry.data?.score ?? 0
			}))
		};
	}

	return { total: 0, top: [] };
}

function countSourcesBy(sources, field) {
	const counts = new Map();

	for (const source of sources) {
		const value = source[field] ?? 'unknown';
		counts.set(value, (counts.get(value) ?? 0) + 1);
	}

	return Array.from(counts.entries()).map(([value, count]) => ({ value, count }));
}

function averageWeightedDemandScore(sources) {
	const scoredSources = sources.filter((source) => Number.isFinite(source.score));
	const totalWeight = scoredSources.reduce(
		(total, source) => total + Number(source.evidenceWeight ?? 1),
		0
	);

	if (totalWeight <= 0) {
		return 0;
	}

	const weightedTotal = scoredSources.reduce(
		(total, source) => total + Number(source.score ?? 0) * Number(source.evidenceWeight ?? 1),
		0
	);

	return Math.round(weightedTotal / totalWeight);
}

function isBlockedSource(source) {
	const error = String(source.error ?? '').toLowerCase();
	return (
		source.status === 'error' &&
		(source.provider === 'reddit' ||
			error.includes('403') ||
			error.includes('blocked') ||
			error.includes('rate limit') ||
			error.includes('throttle'))
	);
}

async function fetchJson(url, provider, timeoutMs) {
	const headers = {
		Accept: 'application/json',
		'User-Agent': userAgent
	};

	const githubToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
	if (provider.startsWith('github') && githubToken) {
		headers.Authorization = `Bearer ${githubToken}`;
	}

	const response = await fetch(url, {
		headers,
		signal: AbortSignal.timeout(timeoutMs)
	});

	if (!response.ok) {
		throw new Error(`${response.status} ${response.statusText}`);
	}

	return response.json();
}

export async function collectCommunityAnalytics({
	signals = communitySignals,
	timeoutMs = Number(process.env.ALPHA_ANALYTICS_TIMEOUT_MS || 8000)
} = {}) {
	const collectedAt = new Date().toISOString();
	const queries = [];

	for (const signal of signals) {
		const sources = [];

		for (const community of signal.communities) {
			const sourceDescriptor = describeCommunitySource(community, signal.keyword);
			const provider = sourceDescriptor.provider;
			const endpoint = sourceDescriptor.endpoint;

			if (!endpoint) {
				sources.push({
					...sourceDescriptor,
					status: 'skipped',
					url: sourceDescriptor.href,
					total: null,
					score: 0,
					top: [],
					error: 'No public JSON endpoint configured; link remains a manual research entrypoint.'
				});
				continue;
			}

			try {
				const data = await fetchJson(endpoint, provider, timeoutMs);
				const parsed = parseProviderResult(provider, data);
				sources.push({
					...sourceDescriptor,
					status: 'ok',
					url: endpoint,
					total: parsed.total,
					score: scoreFromTotal(parsed.total),
					top: parsed.top.filter((item) => item.title && item.url).slice(0, 5),
					error: null
				});
			} catch (error) {
				sources.push({
					...sourceDescriptor,
					status: 'error',
					url: endpoint,
					total: null,
					score: 0,
					top: [],
					error: error instanceof Error ? error.message : String(error)
				});
			}
		}

		const okSources = sources.filter((source) => source.status === 'ok');
		const blockedSources = sources.filter(isBlockedSource);
		const manualReviewRequiredSources = sources.filter((source) => source.manualReviewRequired);
		const totalMentions = okSources.reduce((total, source) => total + Number(source.total ?? 0), 0);
		const demandScore =
			okSources.length === 0
				? 0
				: Math.round(okSources.reduce((total, source) => total + source.score, 0) / okSources.length);
		const weightedDemandScore = averageWeightedDemandScore(okSources);

		queries.push({
			signalId: signal.id,
			keyword: signal.keyword,
			intent: signal.intent,
			analyticsLinkageMarker: 'analytics-linked-keyword-graph',
			sourceToKeywordEdges: sources.map((source) => source.sourceToKeywordEdge),
			aggregate: {
				successfulSources: okSources.length,
				failedSources: sources.filter((source) => source.status === 'error').length,
				blockedSources: blockedSources.length,
				skippedSources: sources.filter((source) => source.status === 'skipped').length,
				manualReviewRequiredSources: manualReviewRequiredSources.length,
				totalMentions,
				demandScore,
				weightedDemandScore
			},
			sources
		});
	}

	const successfulSources = queries.reduce(
		(total, query) => total + query.aggregate.successfulSources,
		0
	);
	const failedSources = queries.reduce((total, query) => total + query.aggregate.failedSources, 0);
	const blockedSources = queries.reduce((total, query) => total + query.aggregate.blockedSources, 0);
	const skippedSources = queries.reduce((total, query) => total + query.aggregate.skippedSources, 0);
	const manualReviewRequiredSources = queries.reduce(
		(total, query) => total + query.aggregate.manualReviewRequiredSources,
		0
	);
	const averageDemandScore =
		queries.length === 0
			? 0
			: Math.round(
					queries.reduce((total, query) => total + query.aggregate.demandScore, 0) / queries.length
				);
	const sourceDescriptors = queries.flatMap((query) => query.sources);
	const weightedAverageDemandScore =
		queries.length === 0
			? 0
			: Math.round(
					queries.reduce((total, query) => total + query.aggregate.weightedDemandScore, 0) /
						queries.length
				);

	return {
		target: alphaTarget,
		collectedAt,
		userAgent,
		freshnessContract: {
			marker: 'community-analytics-freshness-contract',
			maxAgeHours: 168,
			trustLevel: 'directional-community-signal',
			refreshCommand: 'bun run alpha:analytics',
			reportCommand: 'bun run alpha:report:full',
			requiredSourceFields: [
				'keyword',
				'sourceToKeywordEdge',
				'analyticsLinkageMarker',
				'collectionMethod',
				'freshnessMaxAgeHours',
				'evidenceWeight',
				'trustBoundary',
				'manualReviewRequired',
				'resultTotalField',
				'topResultFields',
				'sampleReviewRule'
			],
			reviewerRule:
				'Refresh public-source analytics within seven days before alpha release review and treat counts as directional evidence only.'
		},
		note:
			'Public unauthenticated endpoints are rate-limited and incomplete. Treat these as directional alpha research signals, not product telemetry.',
		summary: {
			signals: queries.length,
			successfulSources,
			failedSources,
			blockedSources,
			skippedSources,
			manualReviewRequiredSources,
			averageDemandScore,
			weightedAverageDemandScore,
			providerCoverage: countSourcesBy(sourceDescriptors, 'provider'),
			evidenceKindCoverage: countSourcesBy(sourceDescriptors, 'evidenceKind'),
			collectionRiskCoverage: countSourcesBy(sourceDescriptors, 'collectionRisk'),
			collectionMethodCoverage: countSourcesBy(sourceDescriptors, 'collectionMethod'),
			trustBoundaryCoverage: countSourcesBy(sourceDescriptors, 'trustBoundary'),
			freshnessWindows: countSourcesBy(sourceDescriptors, 'freshnessMaxAgeHours'),
			analyticsLinkageMarkers: Array.from(
				new Set(sourceDescriptors.map((source) => source.analyticsLinkageMarker).filter(Boolean))
			)
		},
		queries
	};
}

async function main() {
	const analytics = await collectCommunityAnalytics();
	const report = buildAlphaReadinessReport();
	await mkdir(outputDir, { recursive: true });

	const jsonPath = path.join(outputDir, 'alpha-community-analytics.json');
	const mdPath = path.join(outputDir, 'alpha-community-analytics.md');

	await Promise.all([
		writeFile(jsonPath, `${JSON.stringify(analytics, null, 2)}\n`, 'utf8'),
		writeFile(mdPath, renderAlphaCommunityAnalyticsMarkdown(report, analytics), 'utf8')
	]);

	console.log(`Alpha community analytics written to ${path.relative(repoRoot, outputDir)}`);
	console.log(`- ${path.relative(repoRoot, jsonPath)}`);
	console.log(`- ${path.relative(repoRoot, mdPath)}`);
	console.log(
		`Sources: ${analytics.summary.successfulSources} ok, ${analytics.summary.failedSources} failed, ${analytics.summary.blockedSources} blocked, ${analytics.summary.skippedSources} skipped, ${analytics.summary.manualReviewRequiredSources} manual-review-required`
	);
	for (const query of analytics.queries) {
		for (const source of query.sources) {
			if (source.status === 'ok') {
				continue;
			}
			console.log(`- ${source.status}: ${query.keyword} / ${source.label} (${source.error})`);
		}
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	await main();
}
