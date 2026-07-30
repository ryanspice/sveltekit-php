import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { buildBridgeReuseInventory } from '../../src/lib/alpha-bridge-reuse';
import { renderAlphaCommunityAnalyticsMarkdown } from '../../src/lib/alpha-community-analytics-markdown';
import { buildCommunityResearchPack } from '../../src/lib/alpha-community-research-pack';
import {
	buildAlphaReadinessReport,
	calculateAlphaScore,
	readinessAreas,
	summarizeReadiness
} from '../../src/lib/alpha-readiness';
import { buildAlphaEvidenceIndex } from '../../src/lib/alpha-evidence-index';
import { buildAlphaGateMatrix } from '../../src/lib/alpha-gate-matrix';
import { buildHostedSmokeChecklist } from '../../src/lib/alpha-hosted-smoke-checklist';
import { renderAlphaReadinessHtml } from '../../src/lib/alpha-readiness-html';
import { renderAlphaReadinessMarkdown } from '../../src/lib/alpha-readiness-markdown';
import { renderAlphaReadinessSvg } from '../../src/lib/alpha-readiness-svg';
import { buildReleaseManifest } from '../../src/lib/alpha-release-manifest';
import { renderAlphaReleaseChecklistMarkdown } from '../../src/lib/alpha-release-checklist';
import { renderAlphaReleaseNotes } from '../../src/lib/alpha-release-notes';
import { renderAlphaReviewIndexMarkdown } from '../../src/lib/alpha-review-index';
import {
	buildCommunityEndpoint,
	classifyCommunitySource
} from '../../scripts/collect-alpha-community-analytics.mjs';
import {
	checkAlphaReadinessContract,
	summarizeChecks
} from '../../scripts/verify-alpha-readiness.mjs';
import { assertPackageExportShape } from '../../scripts/smoke-alpha-consumer.mjs';
import { describeCommunitySource } from '../../src/lib/alpha-community-sources';
import { renderAlphaCommunitySourceMapSvg } from '../../src/lib/alpha-community-source-map-svg';
import { buildAlphaNativeHostContract } from '../../src/lib/alpha-native-host-contract';
import { buildAlphaNativeHostWrapperSmoke } from '../../src/lib/alpha-native-host-wrapper-smoke';
import { renderAlphaNativeHostGuideMarkdown } from '../../src/lib/alpha-native-host-guide';
import { buildAlphaPackageContract } from '../../src/lib/alpha-package-contract';
import {
	renderCommunitySignalsCsv,
	renderCommunitySourcesCsv,
	renderReadinessCsv
} from '../../src/lib/alpha-readiness-csv';

const generatedArtifact = (path: string) => ({
	path,
	proofStage: 'generated-from-source',
	trustLevel: 'deterministic-local-artifact'
});

const collectedArtifact = (path: string) => ({
	path,
	proofStage: 'collected-public-source-data',
	trustLevel: 'directional-community-signal'
});

const hostedArtifact = (path: string) => ({
	path,
	proofStage: 'hosted-smoke-or-placeholder',
	trustLevel: 'requires-alpha-smoke-base-url-for-pass-evidence'
});

const runtimeEndpoint = (path: string) => ({
	path,
	proofStage: 'runtime-source-endpoint',
	trustLevel: 'deterministic-runtime-evidence'
});

function readRepoText(relativePath: string) {
	return readFileSync(path.resolve(relativePath), 'utf8');
}

function buildCompleteGeneratedEvidence() {
	const report = buildAlphaReadinessReport();
	const communityAnalytics = {
		summary: {
			successfulSources: 3,
			failedSources: 0,
			skippedSources: 0,
			providerCoverage: [{ value: 'github-repositories', count: 1 }],
			evidenceKindCoverage: [{ value: 'repository-index', count: 1 }],
			collectionRiskCoverage: [{ value: 'medium', count: 1 }]
		},
		queries: report.communitySignals.map((signal) => ({
			signalId: signal.id,
			keyword: signal.keyword,
			intent: signal.intent,
			analyticsLinkageMarker: 'analytics-linked-keyword-graph',
			sourceToKeywordEdges: [`${signal.keyword} -> github-repositories -> github.com`],
			aggregate: {
				demandScore: signal.metric,
				weightedDemandScore: signal.metric,
				successfulSources: 1,
				failedSources: 0,
				skippedSources: 0
			},
			sources: [
				{
					label: 'GitHub repositories',
					provider: 'github-repositories',
					status: 'ok',
					url: `https://api.github.com/search/repositories?q=${encodeURIComponent(signal.keyword)}`,
					sourceHost: 'github.com',
					mode: 'supported-json-api',
					endpoint: `https://api.github.com/search/repositories?q=${encodeURIComponent(signal.keyword)}`,
					evidenceKind: 'repository-index',
					collectionRisk: 'medium',
					collectionPriority: 1,
					proofUse: 'Comparable adapter/project discovery, maintenance signals, stars, and implementation patterns.',
					reviewerAction: 'Review top repositories for active maintenance, adapter shape, and deployment claims.',
					collectorNote: 'Uses unauthenticated GitHub Search API unless GITHUB_TOKEN or GH_TOKEN is present.'
				}
			]
		}))
	};
	const remoteSmoke = { status: 'skipped' };
	const manifest = buildReleaseManifest(report, communityAnalytics, remoteSmoke);
	const hostedAlphaSmokeArtifact = manifest.artifacts.find(
		(artifact) => artifact.path === 'report/alpha-remote-smoke.json'
	);

	return {
		report,
		packageJson: JSON.parse(readRepoText('package.json')),
		gitignore: readRepoText('.gitignore'),
		generated: {
			analytics: communityAnalytics,
			fullReport: {
				...report,
				collectedCommunityAnalytics: communityAnalytics,
				hostedAlphaSmoke: remoteSmoke,
				hostedAlphaSmokeProof: manifest.hostedProofInterpretation,
				hostedAlphaSmokeArtifact
			},
			manifest,
			communityResearchPack: buildCommunityResearchPack(report),
			bridgeReuse: buildBridgeReuseInventory(report),
			gateMatrix: buildAlphaGateMatrix(report),
			evidenceIndex: buildAlphaEvidenceIndex(report),
			packageContract: buildAlphaPackageContract(report),
			nativeHostContract: buildAlphaNativeHostContract(report),
			nativeHostGuide: renderAlphaNativeHostGuideMarkdown(report),
			nativeHostWrapperSmoke: buildAlphaNativeHostWrapperSmoke(report),
			hostedSmokeChecklist: buildHostedSmokeChecklist(report),
			html: renderAlphaReadinessHtml(report, communityAnalytics, remoteSmoke, {
				readinessGraphicHref: 'alpha-readiness.svg',
				communitySourceMapHref: 'alpha-community-source-map.svg',
				runtimeCommunitySourceMapHref: '/alpha-readiness/community-source-map.svg'
			}),
			markdown: renderAlphaReadinessMarkdown(report, communityAnalytics, remoteSmoke),
			communityAnalyticsMarkdown: renderAlphaCommunityAnalyticsMarkdown(report, communityAnalytics),
			releaseNotes: renderAlphaReleaseNotes(report, manifest),
			releaseChecklist: renderAlphaReleaseChecklistMarkdown(),
			reviewIndex: renderAlphaReviewIndexMarkdown(report),
			svg: renderAlphaReadinessSvg(report, communityAnalytics, remoteSmoke),
			sourceMapSvg: renderAlphaCommunitySourceMapSvg(report),
			readinessCsv: renderReadinessCsv(report),
			communitySignalsCsv: renderCommunitySignalsCsv(report, communityAnalytics),
			communitySourcesCsv: renderCommunitySourcesCsv(report),
			latestSvelteKitAudit: readRepoText('docs/ALPHA-LATEST-SVELTEKIT-AUDIT.md'),
			latestSvelteKitAuditVerifier: readRepoText('scripts/verify-latest-sveltekit-audit.mjs'),
			latestSameMajorSmoke: readRepoText('scripts/smoke-latest-same-major.mjs'),
			latestViteMajorSmoke: readRepoText('scripts/smoke-latest-vite-major.mjs'),
			remoteFunctionsPolicy: readRepoText('docs/REMOTE-FUNCTIONS-ALPHA-POLICY.md'),
			remoteFunctionsVerifier: readRepoText('scripts/verify-remote-functions-policy.mjs'),
			adapterSource: readRepoText('adapter/src/index.ts'),
			noHydrationConfigSource: readRepoText('src/routes/alpha-readiness/no-hydration/+page.ts'),
			noHydrationPageSource: readRepoText('src/routes/alpha-readiness/no-hydration/+page.svelte'),
			alphaPage: readRepoText('src/routes/alpha-readiness/+page.svelte'),
			nativeWindowShellSource: readRepoText('src/lib/components/native-shell/NativeWindowShell.svelte'),
			nativeTitlebarSource: readRepoText('src/lib/components/native-shell/NativeTitlebar.svelte'),
			nativeHostBridgeStatusSource: readRepoText('src/lib/components/native-shell/NativeHostBridgeStatus.svelte'),
			nativeHostBridgeSource: readRepoText('src/lib/native-shell/native-host-event-bridge.ts'),
			releaseChecklistSource: readRepoText('src/lib/alpha-release-checklist.ts'),
			releaseChecklistEndpointSource: readRepoText('src/routes/alpha-readiness/release-checklist.md/+server.ts')
		}
	};
}

describe('alpha readiness report', () => {
	it('keeps the report summary and score derived from readiness areas', () => {
		const report = buildAlphaReadinessReport();

		expect(report.target).toBe('1.0.2-alpha.0');
		expect(report.overallScore).toBe(calculateAlphaScore(readinessAreas));
		expect(report.summary).toEqual(summarizeReadiness(readinessAreas));
	});

	it('keeps community signals linked to inspectable open-source searches', () => {
		const report = buildAlphaReadinessReport();

		expect(report.communitySignals.length).toBeGreaterThanOrEqual(4);
		for (const signal of report.communitySignals) {
			expect(signal.keyword).toContain('Svelte');
			expect(signal.communities.length).toBeGreaterThanOrEqual(2);
			expect(signal.communities.every((community) => community.href.startsWith('https://'))).toBe(true);
		}
	});

	it('maps collected community analytics demand scores into the signals CSV', () => {
		const report = buildAlphaReadinessReport();
		const csv = renderCommunitySignalsCsv(report, {
			queries: [{ signalId: 'shared-hosting', aggregate: { demandScore: 91 } }]
		});

		expect(csv).toContain(
			'"shared-hosting","SvelteKit PHP adapter shared hosting","Find comparable adapters, deployment failures, and shared-hosting demand.","72","91"'
		);
	});

	it('exports source-level community research inventory as CSV', () => {
		const csv = renderCommunitySourcesCsv(buildAlphaReadinessReport());

		expect(csv).toContain(
			'"signal_id","keyword","source_label","source_host","provider","mode","evidence_kind","collection_risk","collection_priority","action_lane","confidence_tier","collection_method","freshness_max_age_hours","evidence_weight","trust_boundary","source_health","analytics_linkage_marker","alpha_evidence_checklist_marker","alpha_evidence_checklist","source_to_keyword_edge","manual_review_required","endpoint","href","proof_use","release_use","release_claim_use","reviewer_action","collector_note","blocked_outcome_policy","result_total_field","top_result_fields","sample_review_rule"'
		);
		expect(csv).toContain('api.github.com/search');
		expect(csv).toContain('analytics-linked-keyword-graph');
		expect(csv).toContain('freshness_max_age_hours');
		expect(csv).toContain('manual_review_required');
		expect(csv).toContain('"google.com","search-link-only","manual-research-link"');
		expect(csv).toContain('"manual-hosting-research","manual"');
	});

	it('renders a graphic community source map with supported and manual lanes', () => {
		const svg = renderAlphaCommunitySourceMapSvg(buildAlphaReadinessReport());

		expect(svg).toContain('community source map');
		expect(svg).toContain('supported-json-api');
		expect(svg).toContain('manual-research-link');
		expect(svg).toContain('api.github.com/search');
		expect(svg).toContain('google.com');
	});

	it('describes the native-shell boundary and export limitations', () => {
		const report = buildAlphaReadinessReport();

		expect(report.bridgeSource).toContain('lg-ultragear-bridge');
		expect(report.bridgePatterns.some((pattern) => pattern.label.includes('Mica'))).toBe(true);
		expect(report.bridgePatterns.some((pattern) => pattern.label.includes('Structured'))).toBe(true);
		expect(report.limitations.some((limitation) => limitation.includes('not computed telemetry'))).toBe(true);
		expect(report.analyticsRows.map((row) => row.label)).toEqual([
			'Runtime',
			'Security',
			'Native UX',
			'Community',
			'Hosted'
		]);
	});

	it('maps report community links to collector providers when possible', () => {
		expect(classifyCommunitySource({ label: 'GitHub repos', href: 'https://github.com/search?q=x' })).toBe(
			'github-repositories'
		);
		expect(classifyCommunitySource({ label: 'GitHub issues', href: 'https://github.com/search?q=x' })).toBe(
			'github-issues'
		);
		expect(classifyCommunitySource({ label: 'npm packages', href: 'https://www.npmjs.com/search?q=x' })).toBe(
			'npm'
		);
		expect(classifyCommunitySource({ label: 'Packagist', href: 'https://packagist.org/search/?q=x' })).toBe(
			'packagist'
		);
		expect(classifyCommunitySource({ label: 'Stack Overflow', href: 'https://stackoverflow.com/search?q=x' })).toBe(
			'stackoverflow'
		);
		expect(classifyCommunitySource({ label: 'Reddit', href: 'https://www.reddit.com/search/?q=x' })).toBe(
			'reddit'
		);
	});

	it('builds public JSON endpoints for supported analytics providers', () => {
		expect(buildCommunityEndpoint('github-repositories', 'SvelteKit PHP adapter', 'GitHub repos')).toContain(
			'api.github.com/search/repositories'
		);
		expect(buildCommunityEndpoint('github-issues', 'SvelteKit PHP adapter', 'GitHub issues')).toContain(
			'api.github.com/search/issues'
		);
		expect(buildCommunityEndpoint('npm', 'SvelteKit PHP adapter', 'npm packages')).toContain(
			'registry.npmjs.org/-/v1/search'
		);
		expect(buildCommunityEndpoint('packagist', 'SvelteKit PHP adapter', 'Packagist')).toContain(
			'packagist.org/search.json'
		);
		expect(buildCommunityEndpoint('stackoverflow', 'SvelteKit PHP adapter', 'Stack Overflow')).toContain(
			'api.stackexchange.com/2.3/search/advanced'
		);
		expect(buildCommunityEndpoint('reddit', 'SvelteKit PHP adapter', 'Reddit')).toContain(
			'reddit.com/search.json'
		);
		expect(buildCommunityEndpoint('search-link-only', 'SvelteKit PHP adapter', 'Apache docs search')).toBeNull();
	});

	it('describes community research sources with auditable public API endpoints', () => {
		expect(
			describeCommunitySource(
				{ label: 'GitHub repos', href: 'https://github.com/search?q=SvelteKit+PHP+adapter' },
				'SvelteKit PHP adapter'
			)
		).toMatchObject({
			provider: 'github-repositories',
			mode: 'supported-json-api',
			sourceHost: 'github.com',
			endpoint: expect.stringContaining('api.github.com/search/repositories'),
			evidenceKind: 'repository-index',
			collectionRisk: 'medium',
			collectionPriority: 1,
			proofUse: expect.stringContaining('Comparable adapter'),
			reviewerAction: expect.stringContaining('Review top repositories'),
			collectorNote: expect.stringContaining('GitHub Search API')
		});

		expect(
			describeCommunitySource(
				{ label: 'Apache docs search', href: 'https://www.google.com/search?q=Apache+PHP+router' },
				'static Svelte app PHP hosting routing fallback'
			)
		).toMatchObject({
			provider: 'search-link-only',
			mode: 'manual-research-link',
			sourceHost: 'google.com',
			endpoint: null,
			evidenceKind: 'manual-hosting-research',
			collectionRisk: 'manual',
			collectionPriority: 4,
			proofUse: expect.stringContaining('Manual Apache'),
			reviewerAction: expect.stringContaining('manual search'),
			collectorNote: expect.stringContaining('intentionally manual')
		});
	});

	it('defines the native host seam without importing native runtime responsibilities into the adapter', () => {
		const contract = buildAlphaNativeHostContract(buildAlphaReadinessReport());

		expect(contract.adapterBoundary.tauriImportsAllowed).toBe(false);
		expect(contract.requiredDomMarkers.map((marker) => marker.marker)).toContain('data-native-shell-theme');
		expect(contract.requiredDomMarkers.map((marker) => marker.marker)).toContain('data-native-window-frame');
		expect(contract.requiredDomMarkers.map((marker) => marker.marker)).toContain('data-native-titlebar');
		expect(contract.requiredDomMarkers.map((marker) => marker.marker)).toContain('data-native-platform');
		expect(contract.requiredDomMarkers.map((marker) => marker.marker)).toContain('data-window-drag');
		expect(contract.requiredDomMarkers.map((marker) => marker.marker)).toContain('data-no-window-drag');
		expect(contract.requiredDomMarkers.map((marker) => marker.marker)).toContain('data-window-control');
		expect(contract.nativeShellThemes.some((theme) => theme.name === 'theme-ultragear')).toBe(true);
		expect(
			contract.hostEvents.some(
				(event) =>
					event.event === 'native-window-action' &&
					event.actions.includes('start-dragging') &&
					event.actions.includes('toggle-maximize')
			)
		).toBe(true);
		expect(contract.hostResponsibilities.some((item) => item.capability.includes('Windows 11 Mica'))).toBe(true);
		expect(contract.hostResponsibilities.some((item) => item.capability.includes('Caption controls'))).toBe(true);
		expect(contract.hostResponsibilities.some((item) => item.capability.includes('macOS traffic-light'))).toBe(true);
		expect(contract.reportEvidence).toContain('/alpha-readiness/community-source-map.svg');
	});

	it('passes the alpha readiness contract for a complete generated report shape', () => {
		const { report, packageJson, gitignore, generated } = buildCompleteGeneratedEvidence();
		const checks = checkAlphaReadinessContract({ report, packageJson, gitignore, generated });

		expect(checks.filter((check) => !check.ok).map((check) => `${check.id}: ${check.message}`)).toEqual([]);
		expect(summarizeChecks(checks)).toMatchObject({
			ok: true,
			failed: 0
		});
	});

	it('fails the alpha readiness contract when generated analytics are absent', () => {
		const checks = checkAlphaReadinessContract({
			report: buildAlphaReadinessReport(),
			packageJson: {
				version: '1.0.0-alpha.0',
				scripts: {
					'alpha:analytics': 'bun scripts/collect-alpha-community-analytics.mjs',
					'alpha:report': 'bun scripts/export-alpha-readiness.mjs',
					'alpha:report:full': 'bun run alpha:analytics && bun run alpha:report',
					'alpha:consumer:smoke': 'bun scripts/smoke-alpha-consumer.mjs',
					'alpha:remote:placeholder': 'bun scripts/smoke-remote-alpha.mjs --skip',
					'alpha:remote:smoke': 'bun scripts/smoke-remote-alpha.mjs',
					'alpha:gate': 'bun scripts/run-alpha-release-gate.mjs',
					'alpha:gate:hosted': 'bun scripts/run-hosted-alpha-gate.mjs',
					'verify:release-prep': 'bun scripts/verify-alpha-release-prep.mjs',
					'verify:alpha': 'bun scripts/verify-alpha-readiness.mjs'
				},
				files: ['adapter/index.js'],
				exports: {
					'./adapter': './adapter/index.js'
				}
			},
			gitignore: '/report/',
			generated: {
				fullReport: {
					hostedAlphaSmoke: null
				},
				manifest: {
					target: '1.0.0-alpha.0',
					artifacts: [
						{ path: 'report/alpha-readiness.svg' },
						{ path: 'report/alpha-community-source-map.svg' },
						{ path: 'report/alpha-release-notes.md' },
						{ path: 'report/alpha-gate-matrix.json' },
						{ path: 'report/alpha-evidence-index.json' },
						{ path: 'report/alpha-package-contract.json' },
						{ path: 'report/alpha-native-host-contract.json' },
						{ path: 'report/alpha-hosted-smoke-checklist.json' },
						{ path: 'report/alpha-readiness.csv' },
						{ path: 'report/alpha-bridge-reuse.json' },
						{ path: 'report/alpha-review-index.md' },
						{ path: 'report/alpha-community-signals.csv' },
						{ path: 'report/alpha-community-sources.csv' },
						{ path: 'report/alpha-community-analytics.md' },
						{ path: 'report/alpha-community-research-pack.json' },
						{ path: 'report/alpha-release-manifest.json' },
						{ path: 'report/alpha-community-analytics.json' }
					],
					runtimeEndpoints: [
						{ path: '/alpha-readiness/report.json' },
						{ path: '/alpha-readiness/report.html' },
						{ path: '/alpha-readiness/report.md' },
						{ path: '/alpha-readiness/release-notes.md' },
						{ path: '/alpha-readiness/report.svg' },
						{ path: '/alpha-readiness/community-source-map.svg' },
						{ path: '/alpha-readiness/release-manifest.json' },
						{ path: '/alpha-readiness/gate-matrix.json' },
						{ path: '/alpha-readiness/evidence-index.json' },
						{ path: '/alpha-readiness/package-contract.json' },
						{ path: '/alpha-readiness/native-host-contract.json' },
						{ path: '/alpha-readiness/hosted-smoke-checklist.json' },
						{ path: '/alpha-readiness/bridge-reuse.json' },
						{ path: '/alpha-readiness/review-index.md' },
						{ path: '/alpha-readiness/community-signals.json' },
						{ path: '/alpha-readiness/community-analytics.md' },
						{ path: '/alpha-readiness/community-research-pack.json' },
						{ path: '/alpha-readiness/readiness.csv' },
						{ path: '/alpha-readiness/community-signals.csv' },
						{ path: '/alpha-readiness/community-sources.csv' }
					],
					commands: {
						hostedGate: 'bun run alpha:gate:hosted'
					},
					hostedAlphaSmoke: {
						status: 'skipped'
					}
				},
				communityResearchPack: {
					target: '1.0.0-alpha.0',
					summary: {
						queryCount: 4,
						supportedSourceCount: 10,
						manualSourceCount: 2
					},
					queries: [
						{
							keyword: 'SvelteKit PHP adapter shared hosting',
							supportedSources: [
								{
									sourceHost: 'github.com',
									endpoint: 'https://api.github.com/search/repositories?q=SvelteKit'
								}
							],
							manualSources: [{ sourceHost: 'google.com', endpoint: null }]
						}
					]
				},
				bridgeReuse: {
					target: '1.0.0-alpha.0',
					bridgeSource: 'B:/Dev/GPTLIGHTINGSTRENGTHTEST/lg-ultragear-bridge',
					patterns: [{ label: 'Mica material shell' }],
					implementationFiles: [{ path: 'src/lib/components/native-shell/NativeWindowShell.svelte' }],
					sourceCues: [
						{ cues: ['Effect.Mica'] },
						{ cues: [':root[data-window-effect="mica"]'] },
						{ cues: ['Download report JSON'] }
					],
					adapterCues: [
						{ cues: ['data-window-effect'] },
						{ cues: ['data-drag-start-threshold-px'] }
					],
					boundaries: ['Tauri APIs are intentionally not imported into the PHP adapter fixture.']
				},
				gateMatrix: {
					target: '1.0.0-alpha.0',
					gates: [
						{
							id: 'report-bundle',
							requiredArtifacts: [
								'report/alpha-community-analytics.json',
								'report/alpha-community-analytics.md',
								'report/alpha-community-source-map.svg',
								'report/alpha-community-sources.csv',
								'report/alpha-review-index.md',
								'report/alpha-native-host-contract.json'
							]
						},
						{ id: 'local-alpha-gate', command: 'bun run alpha:gate' },
						{ id: 'hosted-alpha-gate', environment: ['ALPHA_SMOKE_BASE_URL'] }
					],
					runtimeEvidenceEndpoints: [
						'/alpha-readiness/gate-matrix.json',
						'/alpha-readiness/evidence-index.json',
						'/alpha-readiness/package-contract.json',
						'/alpha-readiness/native-host-contract.json',
						'/alpha-readiness/hosted-smoke-checklist.json',
						'/alpha-readiness/community-analytics.md',
						'/alpha-readiness/community-source-map.svg',
						'/alpha-readiness/review-index.md',
						'/alpha-readiness/community-sources.csv'
					],
					completionBlockers: ['ALPHA_SMOKE_BASE_URL is required for hosted proof.']
				},
				evidenceIndex: {
					target: '1.0.0-alpha.0',
					endpoints: [
						{ path: '/alpha-readiness/report.svg', mediaType: 'image/svg+xml' },
						{
							path: '/alpha-readiness/community-source-map.svg',
							artifact: 'report/alpha-community-source-map.svg'
						},
						{
							path: '/alpha-readiness/review-index.md',
							artifact: 'report/alpha-review-index.md'
						},
						{
							path: '/alpha-readiness/native-host-contract.json',
							artifact: 'report/alpha-native-host-contract.json'
						},
						{
							path: '/alpha-readiness/community-analytics.md',
							artifact: 'report/alpha-community-analytics.md'
						},
						{
							path: '/alpha-readiness/community-sources.csv',
							artifact: 'report/alpha-community-sources.csv'
						},
						{ path: '/alpha-readiness/evidence-index.json', mediaType: 'application/json' },
						{
							path: '/alpha-readiness/package-contract.json',
							mediaType: 'application/json',
							artifact: 'report/alpha-package-contract.json'
						}
					],
					generatedOnlyArtifacts: [
						{ path: 'report/alpha-community-analytics.json' },
						{ path: 'report/alpha-remote-smoke.json' }
					],
					qualityBar: ['ALPHA_SMOKE_BASE_URL is required for hosted proof.']
				},
				packageContract: {
					target: '1.0.0-alpha.0',
					packageName: 'sveltekit-php',
					publishShape: {
						exports: {
							'./adapter': './adapter/index.js'
						}
					},
					consumerProof: {
						command: 'bun run alpha:consumer:smoke'
					},
					boundaries: ['The npm package surface stays adapter-focused.']
				},
				nativeHostContract: {
					target: '1.0.0-alpha.0',
					adapterBoundary: { tauriImportsAllowed: false },
					requiredDomMarkers: [{ marker: 'data-window-drag' }, { marker: 'data-no-window-drag' }],
					hostResponsibilities: [
						{ capability: 'Windows 11 Mica material' },
						{ capability: 'macOS traffic-light rhythm and draggable titlebar' }
					],
					reportEvidence: ['/alpha-readiness/community-source-map.svg']
				},
				hostedSmokeChecklist: {
					target: '1.0.0-alpha.0',
					status: 'requires-external-host',
					requiredEnvironment: [{ name: 'ALPHA_SMOKE_BASE_URL', required: true }],
					coveredEndpoints: [
						'/alpha-readiness/hosted-smoke-checklist.json',
						'/alpha-readiness/native-host-contract.json',
						'/alpha-readiness/community-analytics.md',
						'/alpha-readiness/community-source-map.svg',
						'/alpha-readiness/review-index.md',
						'/alpha-readiness/community-sources.csv'
					],
					securityProbes: ['%2e%2e/.env'],
					proofArtifact: 'report/alpha-remote-smoke.json'
				},
				html:
					'<h1>Native-styled release report</h1><h2>Community keyword signals</h2><h2>Community source map</h2><a href="alpha-community-source-map.svg">community-source-map.svg</a><h2>Hosted deployment smoke</h2>',
				markdown:
					'# Report\n\n## UltraGear bridge reuse map\n\n## Report graphics\n\ncommunity-source-map.svg\n\n## Collected community analytics\n\n## Hosted deployment smoke',
				communityAnalyticsMarkdown:
					'# community analytics\n\n## Collection commands\n\nbun run alpha:analytics\n\n## Keyword research map\n\nCollection endpoints\n\napi.github.com/search\ngoogle.com\n',
				releaseNotes:
					'# SvelteKit PHP 1.0.0-alpha.0 alpha release notes\n\n## Runtime evidence endpoints\n\nALPHA_SMOKE_BASE_URL=https://example.com/ bun run alpha:gate:hosted\n',
				reviewIndex:
					'# SvelteKit PHP 1.0.0-alpha.0 alpha reviewer index\n\nWindows 11 Mica\nmacOS-native\ncommunity-source-map.svg\napi.github.com/search\nALPHA_SMOKE_BASE_URL\n',
				svg: '<svg><title>alpha readiness graphic</title><text>Community signals</text><text>hosted smoke: skipped</text><text>Bridge cues:</text></svg>',
				sourceMapSvg:
					'<svg><title>community source map</title><text>supported-json-api</text><text>manual-research-link</text><text>api.github.com/search</text><text>google.com</text></svg>',
				readinessCsv:
					'"kind","id","label","status","score","description","gap"\n"readiness","runtime-correctness","Runtime correctness","ready","86","desc","gap"\n',
				communitySignalsCsv:
					'"id","keyword","intent","curated_score","collected_demand_score","community_links"\n"shared-hosting","SvelteKit PHP adapter shared hosting","Find comparable adapters, deployment failures, and shared-hosting demand.","72","70","GitHub repos: https://github.com/search"\n',
				communitySourcesCsv:
					'"signal_id","keyword","source_label","source_host","provider","mode","endpoint","href"\n"shared-hosting","SvelteKit PHP adapter shared hosting","GitHub repos","github.com","github-repositories","supported-json-api","https://api.github.com/search/repositories?q=SvelteKit","https://github.com/search"\n"php-hosting-runtime","static Svelte app PHP hosting routing fallback","Apache docs search","google.com","search-link-only","manual-research-link","","https://www.google.com/search"\n'
			}
		});

		expect(summarizeChecks(checks)).toMatchObject({
			ok: false
		});
		expect(checks.some((check) => !check.ok && check.id === 'full-json')).toBe(true);
	});

	it('keeps the package export shape usable by external alpha consumers', async () => {
		const shape = await assertPackageExportShape();

		expect(shape.name).toBe('sveltekit-php');
		expect(shape.version).toBe('1.0.2-alpha.0');
		expect(shape.adapterExport).toBe('./adapter/index.js');
		expect(shape.private).toBe(false);
	});
});
