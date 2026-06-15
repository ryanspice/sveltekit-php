import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildBridgeReuseInventory } from '../src/lib/alpha-bridge-reuse.ts';
import { renderAlphaCommunityAnalyticsMarkdown } from '../src/lib/alpha-community-analytics-markdown.ts';
import { renderAlphaCommunitySourceMapSvg } from '../src/lib/alpha-community-source-map-svg.ts';
import { buildCommunityResearchPack } from '../src/lib/alpha-community-research-pack.ts';
import { buildAlphaEvidenceIndex } from '../src/lib/alpha-evidence-index.ts';
import { buildAlphaGateMatrix } from '../src/lib/alpha-gate-matrix.ts';
import { buildHostedSmokeChecklist } from '../src/lib/alpha-hosted-smoke-checklist.ts';
import { renderAlphaNativeHostGuideMarkdown } from '../src/lib/alpha-native-host-guide.ts';
import { buildAlphaNativeHostContract } from '../src/lib/alpha-native-host-contract.ts';
import { buildAlphaPackageContract } from '../src/lib/alpha-package-contract.ts';
import { buildAlphaReadinessReport } from '../src/lib/alpha-readiness.ts';
import {
	renderCommunitySourcesCsv,
	renderCommunitySignalsCsv,
	renderReadinessCsv
} from '../src/lib/alpha-readiness-csv.ts';
import { renderAlphaReadinessHtml } from '../src/lib/alpha-readiness-html.ts';
import { renderAlphaReadinessMarkdown } from '../src/lib/alpha-readiness-markdown.ts';
import { renderAlphaReviewIndexMarkdown } from '../src/lib/alpha-review-index.ts';
import { renderAlphaReleaseChecklistMarkdown } from '../src/lib/alpha-release-checklist.ts';
import { buildReleaseManifest } from '../src/lib/alpha-release-manifest.ts';
import { renderAlphaReleaseNotes } from '../src/lib/alpha-release-notes.ts';
import { renderAlphaReadinessSvg } from '../src/lib/alpha-readiness-svg.ts';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.resolve(repoRoot, 'report');

function escapeHtml(value) {
	return String(value)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

async function loadCommunityAnalytics() {
	try {
		const analyticsPath = path.join(outputDir, 'alpha-community-analytics.json');
		return JSON.parse(await readFile(analyticsPath, 'utf8'));
	} catch {
		return null;
	}
}

async function loadRemoteSmoke() {
	try {
		const smokePath = path.join(outputDir, 'alpha-remote-smoke.json');
		return JSON.parse(await readFile(smokePath, 'utf8'));
	} catch {
		return null;
	}
}

function renderSvg(report, communityAnalytics, remoteSmoke) {
	return renderAlphaReadinessSvg(report, communityAnalytics, remoteSmoke);
}

async function main() {
	const report = buildAlphaReadinessReport();
	await mkdir(outputDir, { recursive: true });
	const communityAnalytics = await loadCommunityAnalytics();
	const remoteSmoke = await loadRemoteSmoke();

	const jsonPath = path.join(outputDir, 'alpha-readiness.json');
	const fullJsonPath = path.join(outputDir, 'alpha-readiness.full.json');
	const mdPath = path.join(outputDir, 'alpha-readiness.md');
	const htmlPath = path.join(outputDir, 'alpha-readiness.html');
	const svgPath = path.join(outputDir, 'alpha-readiness.svg');
	const communitySourceMapSvgPath = path.join(outputDir, 'alpha-community-source-map.svg');
	const manifestPath = path.join(outputDir, 'alpha-release-manifest.json');
	const readinessCsvPath = path.join(outputDir, 'alpha-readiness.csv');
	const communitySignalsCsvPath = path.join(outputDir, 'alpha-community-signals.csv');
	const communitySourcesCsvPath = path.join(outputDir, 'alpha-community-sources.csv');
	const communityAnalyticsMarkdownPath = path.join(outputDir, 'alpha-community-analytics.md');
	const communityResearchPackPath = path.join(outputDir, 'alpha-community-research-pack.json');
	const bridgeReusePath = path.join(outputDir, 'alpha-bridge-reuse.json');
	const reviewIndexPath = path.join(outputDir, 'alpha-review-index.md');
	const releaseChecklistPath = path.join(outputDir, 'alpha-release-checklist.md');
	const releaseNotesPath = path.join(outputDir, 'alpha-release-notes.md');
	const gateMatrixPath = path.join(outputDir, 'alpha-gate-matrix.json');
	const evidenceIndexPath = path.join(outputDir, 'alpha-evidence-index.json');
	const packageContractPath = path.join(outputDir, 'alpha-package-contract.json');
	const nativeHostContractPath = path.join(outputDir, 'alpha-native-host-contract.json');
	const nativeHostGuidePath = path.join(outputDir, 'alpha-native-host-guide.md');
	const hostedSmokeChecklistPath = path.join(outputDir, 'alpha-hosted-smoke-checklist.json');
	const manifest = buildReleaseManifest(report, communityAnalytics, remoteSmoke);

	await Promise.all([
		writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8'),
		writeFile(
			fullJsonPath,
			`${JSON.stringify({ ...report, collectedCommunityAnalytics: communityAnalytics, hostedAlphaSmoke: remoteSmoke }, null, 2)}\n`,
			'utf8'
		),
		writeFile(mdPath, renderAlphaReadinessMarkdown(report, communityAnalytics, remoteSmoke), 'utf8'),
		writeFile(
			htmlPath,
			renderAlphaReadinessHtml(report, communityAnalytics, remoteSmoke, {
				readinessGraphicHref: 'alpha-readiness.svg',
				communitySourceMapHref: 'alpha-community-source-map.svg',
				runtimeCommunitySourceMapHref: '/alpha-readiness/community-source-map.svg'
			}),
			'utf8'
		),
		writeFile(svgPath, renderSvg(report, communityAnalytics, remoteSmoke), 'utf8'),
		writeFile(communitySourceMapSvgPath, renderAlphaCommunitySourceMapSvg(report), 'utf8'),
		writeFile(readinessCsvPath, renderReadinessCsv(report), 'utf8'),
		writeFile(communitySignalsCsvPath, renderCommunitySignalsCsv(report, communityAnalytics), 'utf8'),
		writeFile(communitySourcesCsvPath, renderCommunitySourcesCsv(report), 'utf8'),
		writeFile(
			communityAnalyticsMarkdownPath,
			renderAlphaCommunityAnalyticsMarkdown(report, communityAnalytics),
			'utf8'
		),
		writeFile(
			communityResearchPackPath,
			`${JSON.stringify(buildCommunityResearchPack(report), null, 2)}\n`,
			'utf8'
		),
		writeFile(bridgeReusePath, `${JSON.stringify(buildBridgeReuseInventory(report), null, 2)}\n`, 'utf8'),
		writeFile(reviewIndexPath, renderAlphaReviewIndexMarkdown(report), 'utf8'),
		writeFile(releaseChecklistPath, renderAlphaReleaseChecklistMarkdown(), 'utf8'),
		writeFile(releaseNotesPath, renderAlphaReleaseNotes(report, manifest), 'utf8'),
		writeFile(gateMatrixPath, `${JSON.stringify(buildAlphaGateMatrix(report), null, 2)}\n`, 'utf8'),
		writeFile(evidenceIndexPath, `${JSON.stringify(buildAlphaEvidenceIndex(report), null, 2)}\n`, 'utf8'),
		writeFile(packageContractPath, `${JSON.stringify(buildAlphaPackageContract(report), null, 2)}\n`, 'utf8'),
		writeFile(
			nativeHostContractPath,
			`${JSON.stringify(buildAlphaNativeHostContract(report), null, 2)}\n`,
			'utf8'
		),
		writeFile(nativeHostGuidePath, renderAlphaNativeHostGuideMarkdown(report), 'utf8'),
		writeFile(
			hostedSmokeChecklistPath,
			`${JSON.stringify(buildHostedSmokeChecklist(report), null, 2)}\n`,
			'utf8'
		),
		writeFile(
			manifestPath,
			`${JSON.stringify(manifest, null, 2)}\n`,
			'utf8'
		)
	]);

	console.log(`Alpha readiness report written to ${path.relative(repoRoot, outputDir)}`);
	console.log(`- ${path.relative(repoRoot, jsonPath)}`);
	console.log(`- ${path.relative(repoRoot, fullJsonPath)}`);
	console.log(`- ${path.relative(repoRoot, mdPath)}`);
	console.log(`- ${path.relative(repoRoot, htmlPath)}`);
	console.log(`- ${path.relative(repoRoot, svgPath)}`);
	console.log(`- ${path.relative(repoRoot, communitySourceMapSvgPath)}`);
	console.log(`- ${path.relative(repoRoot, readinessCsvPath)}`);
	console.log(`- ${path.relative(repoRoot, communitySignalsCsvPath)}`);
	console.log(`- ${path.relative(repoRoot, communitySourcesCsvPath)}`);
	console.log(`- ${path.relative(repoRoot, communityAnalyticsMarkdownPath)}`);
	console.log(`- ${path.relative(repoRoot, communityResearchPackPath)}`);
	console.log(`- ${path.relative(repoRoot, bridgeReusePath)}`);
	console.log(`- ${path.relative(repoRoot, reviewIndexPath)}`);
	console.log(`- ${path.relative(repoRoot, releaseChecklistPath)}`);
	console.log(`- ${path.relative(repoRoot, releaseNotesPath)}`);
	console.log(`- ${path.relative(repoRoot, gateMatrixPath)}`);
	console.log(`- ${path.relative(repoRoot, evidenceIndexPath)}`);
	console.log(`- ${path.relative(repoRoot, packageContractPath)}`);
	console.log(`- ${path.relative(repoRoot, nativeHostContractPath)}`);
	console.log(`- ${path.relative(repoRoot, nativeHostGuidePath)}`);
	console.log(`- ${path.relative(repoRoot, hostedSmokeChecklistPath)}`);
	console.log(`- ${path.relative(repoRoot, manifestPath)}`);
	if (!communityAnalytics) {
		console.log('No alpha-community-analytics.json found; run bun run alpha:analytics to embed collected counts.');
	}
	if (!remoteSmoke) {
		console.log('No alpha-remote-smoke.json found; run bun run alpha:remote:smoke after deployment to embed hosted evidence.');
	}
}

await main();
