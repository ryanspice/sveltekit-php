import type { AlphaReadinessReport } from './alpha-readiness';
import { requiredAlphaEvidence } from './alpha-required-evidence';

type CommunityAnalyticsArtifact = {
	summary?: unknown;
} | null;

type RemoteSmokeArtifact = {
	status?: string;
	checkedAt?: string;
	checks?: unknown[];
	reason?: string;
	failure?: string;
} | null;

const generatedArtifact = (path: string, kind: string) => ({
	path,
	kind,
	proofStage: 'generated-from-source',
	trustLevel: 'deterministic-local-artifact'
});

const collectedArtifact = (path: string, kind: string) => ({
	path,
	kind,
	proofStage: 'collected-public-source-data',
	trustLevel: 'directional-community-signal'
});

const hostedArtifact = (path: string, kind: string) => ({
	path,
	kind,
	proofStage: 'hosted-smoke-or-placeholder',
	trustLevel: 'requires-alpha-smoke-base-url-for-pass-evidence'
});

const runtimeEndpoint = (path: string, kind: string) => ({
	path,
	kind,
	proofStage: 'runtime-source-endpoint',
	trustLevel: 'deterministic-runtime-evidence'
});

const documentationArtifact = (path: string, kind: string) => ({
	path,
	kind,
	proofStage: 'source-controlled-release-documentation',
	trustLevel: 'deterministic-local-check'
});

export function buildReleaseManifest(
	report: AlphaReadinessReport,
	communityAnalytics: CommunityAnalyticsArtifact = null,
	remoteSmoke: RemoteSmokeArtifact = null
) {
	return {
		target: report.target,
		issued: report.issued,
		bridgeSource: report.bridgeSource,
		overallScore: report.overallScore,
		summary: report.summary,
		releasePolicy: {
			...report.releasePolicy,
			requiredEvidence: requiredAlphaEvidence,
			projectRankPolicy: '1.0.2-alpha is the required pre-stable release track and ranks above any RC for this project.',
			semverNote:
				'This is a project release policy marker, not a claim that SemVer prerelease comparison ranks alpha above rc.',
			disallowedCandidateLabels: ['1.0.2-rc', '1.0.2-rc.0', '1.0.2-rc.1', 'latest', 'stable'],
			requiredDistTag: report.releasePolicy.channel,
			requiredMarker: 'alpha-over-rc-release-policy'
		},
		releasePolicyProof: {
			marker: 'alpha-over-rc-release-policy',
			requiredTargetPattern: report.releasePolicy.requiredTargetPattern,
			channel: report.releasePolicy.channel,
			track: report.releasePolicy.track,
			rank: report.releasePolicy.rank,
			projectRankPolicy: 'above-rc',
			proofStage: 'release-policy-contract',
			trustLevel: 'deterministic-local-check',
			mustNotUseDistTags: report.releasePolicy.disallowedChannels,
			mustNotUseCandidateLabels: ['rc', 'release-candidate', 'stable', 'latest'],
			proves: [
				'1.0.2-alpha is the only accepted pre-stable release label for this alpha evidence bundle',
				'RC labels remain explicitly disallowed for this project release track',
				'The npm publish tag must remain alpha rather than latest, rc, or stable',
				'The alpha release gate must run report generation, release-prep verification, build, artifact sync, unit, runtime, consumer, and hosted-placeholder evidence'
			]
		},
		requiredEvidence: requiredAlphaEvidence,
		proofLedger: report.proofLedger,
		trustModel: {
			'deterministic-local-artifact':
				'Generated from source-controlled alpha readiness modules by bun run alpha:report:full.',
			'directional-community-signal':
				'Collected from public open-source/community JSON endpoints by bun run alpha:analytics; counts are rate-limited and incomplete.',
			'requires-alpha-smoke-base-url-for-pass-evidence':
				'Only proves hosted behavior after ALPHA_SMOKE_BASE_URL points at a real PHP deployment and hosted smoke runs.',
			'deterministic-runtime-evidence':
				'Served by the SvelteKit fixture/runtime endpoints without live community API calls.'
		},
		evidenceSurfaces: {
			alphaReleaseChecklist: {
				route: '/alpha-readiness/release-checklist.md',
				source: 'src/lib/alpha-release-checklist.ts',
				documentationSource: 'docs/ALPHA-RELEASE-CHECKLIST.md',
				markers: [
					'1.0.2-alpha release checklist',
					'alpha-over-rc-release-policy',
					'desktop-shell-ui-command-mapping',
					'community-analytics-csv-linkage',
					'router-path-safety-artifact-sync',
					'deploy-env-preflight-safety',
					'bun run alpha:gate',
					'bun run alpha:gate:hosted',
					'getDesktopShellUiCommandMapping',
					'sourceToKeywordEdge',
					'weighted_demand_score',
					'ALPHA_SMOKE_BASE_URL'
				],
				proofUse:
					'Gives reviewers and contributors a single human checklist for alpha-over-RC policy, native helper mapping, community CSV linkage, router/artifact safety, deploy preflight, and hosted proof.'
			},
			nativeChromeVisualContract: {
				route: '/alpha-readiness',
				components: [
					'src/lib/components/native-shell/NativeWindowShell.svelte',
					'src/lib/components/native-shell/NativeTitlebar.svelte',
					'src/lib/alpha-readiness-svg.ts'
				],
				markers: [
					'data-native-shell-theme',
					'data-window-effect',
					'data-window-effect="mica"',
					'data-native-platform',
					'data-window-control',
					'Windows 11 Mica',
					'macOS traffic lights',
					'native-visual-matrix',
					'windows-mica-visual-row',
					'macos-traffic-light-row',
					'native-window-action',
					'set-window-effect',
					'data-native-host-handoff-controls'
				],
				proofUse:
					'Makes the Windows 11 Mica fallback, macOS traffic-light rhythm, and host-owned caption-control seam explicit in both the live alpha page and the portable SVG report graphic.'
			},
			nativeVisualMatrix: {
				route: '/alpha-readiness',
				source: 'src/lib/alpha-native-host-contract.ts',
				markers: [
					'native-visual-matrix',
					'windows-mica-visual-row',
					'macos-traffic-light-row',
					'windows-caption-control-row',
					'ultragear-theme-row',
					'browser-fallback-visual-row',
					'data-native-visual-matrix'
				],
				proofUse:
					'Maps Windows Mica, macOS traffic lights, Windows caption controls, UltraGear theme tokens, and browser fallback state to concrete adapter markers and host-owned boundaries.'
			},
			nativePlatformProvenance: {
				route: '/alpha-readiness/bridge-reuse.json',
				source: 'src/lib/alpha-bridge-reuse.ts',
				markers: [
					'lg-ultragear-native-platform-provenance',
					'packages/desktop-shell-ui/src/index.ts',
					'packages/ultragear-widget-ui/src/app.ts',
					'@scriptgpt/desktop-shell-ui',
					'desktopShellUiBinding',
					'getDesktopShellUiCommandMapping',
					'nativeHostBridgeMapping',
					'desktopShellUiHelper',
					'desktopShellUiEvidence',
					'toDesktopShellUiTaskbarProgressState',
					'enableMicaWindowChrome',
					'syncTaskbarProgress',
					'toggleWindowMaximize',
					'TaskbarProgressState',
					'saveInFlight',
					'refreshInFlight',
					'hasQueuedSave',
					'Effect.Mica',
					'win.setEffects',
					'--window-bg-mica',
					'--window-wash-inactive',
					'data-native-platform',
					'data-window-control-group',
					'dragBlockSelector',
					'win.startDragging',
					'win.setProgressBar',
					'reportJson',
					'reportUrl',
					'set-window-effect',
					'set-progress',
					'clear-progress',
					'report-ready'
				],
				proofUse:
					'Records the exact LG UltraGear source files and implementation cues reused for the alpha native-shell styling, host-action seam, and report/progress evidence.'
			},
			ultraGearSourceParity: {
				route: '/alpha-readiness/bridge-reuse.json',
				source: 'src/lib/alpha-bridge-reuse.ts',
				markers: [
					'ultraGearParityContract',
					'packages/desktop-shell-ui/src/index.ts',
					'packages/ultragear-widget-ui/src/app.ts',
					'@scriptgpt/desktop-shell-ui',
					'desktopShellUiBinding',
					'getDesktopShellUiCommandMapping',
					'nativeHostBridgeMapping',
					'enableMicaWindowChrome',
					'syncTaskbarProgress',
					'toggleWindowMaximize',
					'TaskbarProgressState',
					'toDesktopShellUiTaskbarProgressState',
					'saveInFlight',
					'refreshInFlight',
					'hasQueuedSave',
					'applyWindowChrome',
					'syncWindowProgress',
					'DRAG_START_THRESHOLD_PX',
					'dispatch("start-dragging")',
					'Structured report preview'
				],
				proofUse:
					'Maps concrete UltraGear source cues to adapter DOM markers, host-event seams, report graphics, and release-evidence artifacts.'
			},
			progressReportHandoff: {
				route: '/alpha-readiness',
				source: 'src/lib/alpha-native-host-contract.ts',
				markers: [
					'progressReportHandoff',
					'syncTaskbarProgress',
					'syncWindowProgress',
					'ProgressBarStatus.Indeterminate',
					'ProgressBarStatus.Normal',
					'ProgressBarStatus.None',
					'report-ready',
					'set-progress',
					'clear-progress',
					'Download report JSON',
					'Structured report preview',
					'alpha:report:full',
					'report/alpha-readiness.full.json'
				],
				proofUse:
					'Connects UltraGear taskbar progress/report-export cues to deterministic alpha report artifacts and optional desktop-host progress UI.'
			},
			progressReportGraphic: {
				route: '/alpha-readiness/report.svg',
				source: 'src/lib/alpha-readiness-svg.ts',
				markers: [
					'progressReportHandoff',
					'statusMapping',
					'ProgressBarStatus.Indeterminate',
					'ProgressBarStatus.None',
					'report-ready',
					'set-progress',
					'clear-progress',
					'report/alpha-readiness.full.json'
				],
				proofUse:
					'Carries the UltraGear-inspired progress/report lifecycle into the portable SVG release graphic so report screenshots and PR graphics preserve the same host-owned progress evidence.'
			},
			nativeHostBridgeStatus: {
				route: '/alpha-readiness',
				component: 'src/lib/components/native-shell/NativeHostBridgeStatus.svelte',
				markers: [
					'data-native-host-bridge-status',
					'data-native-host-handoff-controls',
					'window.__SVELTEKIT_PHP_NATIVE_HOST__',
					'window.__SVELTEKIT_PHP_NATIVE_HOST_HISTORY__',
					'browser-fallback',
					'set-window-effect',
					'set-progress',
					'clear-progress',
					'report-ready',
					'setWindowEffect',
					'setProgress',
					'clearProgress',
					'reportReady'
				],
				proofUse:
					'Shows that Windows Mica/macOS chrome/progress/report commands remain host-owned while the PHP/browser demo exposes live handoff controls and deterministic fallback history.'
			},
			nativeHostBindingGuide: {
				route: '/alpha-readiness/native-host-guide.md',
				source: 'src/lib/alpha-native-host-guide.ts',
				markers: [
					'native host binding guide',
					'data-native-host-handoff-controls',
					'native-window-action',
					'set-window-effect',
					'set-progress',
					'clear-progress',
					'report-ready',
					'setWindowEffect',
					'setProgress',
					'clearProgress',
					'reportReady',
					'window.__SVELTEKIT_PHP_NATIVE_HOST__',
					'window.__SVELTEKIT_PHP_NATIVE_HOST_HISTORY__',
					'desktopShellUiBinding',
					'installSvelteKitPhpNativeHost',
					'getDesktopShellUiCommandMapping',
					'nativeHostBridgeMapping',
					'packages/ultragear-widget-ui/src/app.ts',
					'@scriptgpt/desktop-shell-ui',
					'enableMicaWindowChrome',
					'syncTaskbarProgress',
					'toggleWindowMaximize',
					'Effect.Mica',
					'win.setProgressBar',
					'reportJson'
				],
				proofUse:
					'Gives desktop-wrapper implementers a concrete binding contract for Windows 11 Mica, macOS titlebar behavior, progress, report-ready handoff, and browser fallback history without importing native APIs into the adapter.'
			},
			communityEvidenceLedger: {
				route: '/alpha-readiness',
				source: 'src/lib/alpha-community-research-pack.ts',
				markers: [
					'Community evidence coverage ledger',
					'providerCoverage',
					'evidenceKindCoverage',
					'collectionRiskCoverage',
					'Open-source analytics sources reviewers can audit first'
				],
				proofUse:
					'Shows provider, evidence-kind, collection-risk, and prioritized source coverage for open-source community analytics.'
			},
			communityKeywordSearchGraph: {
				route: '/alpha-readiness/community-source-map.svg',
				source: 'src/lib/alpha-community-research-pack.ts',
				markers: [
					'keywordSearchGraph',
					'keyword-search-graph',
					'analytics-linked-keyword-graph',
					'community-analytics-freshness-contract',
					'source-to-keyword-edge',
					'supported-api-lanes',
					'manual-research-lanes',
					'curated-signal-score',
					'collected-demand-score',
					'directional-community-signal',
					'api.github.com/search'
				],
				proofUse:
					'Links each alpha keyword to supported API lanes, manual research links, source hosts, evidence kinds, collection risk, curated signal scores, collected demand-score handoffs, CSV rows, and analytics Markdown handoff.'
			},
			communityAnalyticsFreshnessContract: {
				route: '/alpha-readiness/community-research-pack.json',
				source: 'src/lib/alpha-community-research-pack.ts',
				markers: [
					'community-analytics-freshness-contract',
					'analyticsFreshnessContract',
					'maxAgeHours',
					'report/alpha-community-analytics.json',
					'report/alpha-community-analytics.md',
					'bun run alpha:analytics',
					'bun run alpha:report:full',
					'directional-community-signal'
				],
				proofUse:
					'Defines when public-source analytics counts are fresh enough for alpha release review and makes stale/missing collectedAt evidence explicit.'
			}
		},
		artifacts: [
			documentationArtifact('docs/ALPHA-RELEASE-CHECKLIST.md', 'alpha-release-checklist-documentation'),
			generatedArtifact('report/alpha-release-checklist.md', 'alpha-release-checklist-markdown'),
			generatedArtifact('report/alpha-readiness.json', 'readiness-json'),
			generatedArtifact('report/alpha-readiness.full.json', 'combined-json'),
			generatedArtifact('report/alpha-readiness.md', 'markdown-report'),
			generatedArtifact('report/alpha-readiness.html', 'html-report'),
			generatedArtifact('report/alpha-readiness.svg', 'svg-release-graphic'),
			generatedArtifact('report/alpha-community-source-map.svg', 'community-source-map-svg'),
			generatedArtifact('report/alpha-release-notes.md', 'release-notes-markdown'),
			generatedArtifact('report/alpha-gate-matrix.json', 'gate-matrix-json'),
			generatedArtifact('report/alpha-evidence-index.json', 'evidence-index-json'),
			generatedArtifact('report/alpha-package-contract.json', 'package-contract-json'),
			generatedArtifact('report/alpha-native-host-contract.json', 'native-host-contract-json'),
			generatedArtifact('report/alpha-native-host-guide.md', 'native-host-guide-markdown'),
			generatedArtifact('report/alpha-hosted-smoke-checklist.json', 'hosted-smoke-checklist-json'),
			generatedArtifact('report/alpha-readiness.csv', 'readiness-csv'),
			generatedArtifact('report/alpha-bridge-reuse.json', 'bridge-reuse-json'),
			generatedArtifact('report/alpha-review-index.md', 'alpha-review-index-markdown'),
			generatedArtifact('report/alpha-community-signals.csv', 'community-signals-csv'),
			generatedArtifact('report/alpha-community-sources.csv', 'community-sources-csv'),
			generatedArtifact('report/alpha-community-research-pack.json', 'community-research-pack-json'),
			collectedArtifact('report/alpha-community-analytics.json', 'community-analytics-json'),
			collectedArtifact('report/alpha-community-analytics.md', 'community-analytics-markdown'),
			hostedArtifact('report/alpha-remote-smoke.json', 'hosted-smoke-json'),
			generatedArtifact('report/alpha-release-manifest.json', 'release-manifest-json')
		],
		runtimeEndpoints: [
			runtimeEndpoint('/alpha-readiness', 'native-styled-report-page'),
			runtimeEndpoint('/alpha-readiness/report.json', 'readiness-json-endpoint'),
			runtimeEndpoint('/alpha-readiness/report.html', 'html-report-endpoint'),
			runtimeEndpoint('/alpha-readiness/report.md', 'markdown-report-endpoint'),
			runtimeEndpoint('/alpha-readiness/release-checklist.md', 'release-checklist-markdown-endpoint'),
			runtimeEndpoint('/alpha-readiness/release-notes.md', 'release-notes-markdown-endpoint'),
			runtimeEndpoint('/alpha-readiness/report.svg', 'svg-release-graphic-endpoint'),
			runtimeEndpoint('/alpha-readiness/community-source-map.svg', 'community-source-map-svg-endpoint'),
			runtimeEndpoint('/alpha-readiness/release-manifest.json', 'release-manifest-json-endpoint'),
			runtimeEndpoint('/alpha-readiness/gate-matrix.json', 'gate-matrix-json-endpoint'),
			runtimeEndpoint('/alpha-readiness/evidence-index.json', 'evidence-index-json-endpoint'),
			runtimeEndpoint('/alpha-readiness/package-contract.json', 'package-contract-json-endpoint'),
			runtimeEndpoint('/alpha-readiness/native-host-contract.json', 'native-host-contract-json-endpoint'),
			runtimeEndpoint('/alpha-readiness/native-host-guide.md', 'native-host-guide-markdown-endpoint'),
			runtimeEndpoint('/alpha-readiness/hosted-smoke-checklist.json', 'hosted-smoke-checklist-json-endpoint'),
			runtimeEndpoint('/alpha-readiness/bridge-reuse.json', 'bridge-reuse-json-endpoint'),
			runtimeEndpoint('/alpha-readiness/review-index.md', 'alpha-review-index-markdown-endpoint'),
			runtimeEndpoint('/alpha-readiness/community-signals.json', 'community-signals-json-endpoint'),
			runtimeEndpoint('/alpha-readiness/community-analytics.md', 'community-analytics-markdown-endpoint'),
			runtimeEndpoint('/alpha-readiness/community-research-pack.json', 'community-research-pack-json-endpoint'),
			runtimeEndpoint('/alpha-readiness/readiness.csv', 'readiness-csv-endpoint'),
			runtimeEndpoint('/alpha-readiness/community-signals.csv', 'community-signals-csv-endpoint'),
			runtimeEndpoint('/alpha-readiness/community-sources.csv', 'community-sources-csv-endpoint')
		],
		commands: {
			localReport: 'bun run alpha:report:full',
			localGate: 'bun run alpha:gate',
			hostedSmoke: 'bun run alpha:remote:smoke',
			hostedGate: 'bun run alpha:gate:hosted',
			verifyReport: 'bun run verify:alpha'
		},
		communityAnalytics: communityAnalytics
			? {
					status: 'collected',
					summary: communityAnalytics.summary ?? null
				}
			: {
					status: 'missing',
					summary: null
				},
		hostedAlphaSmoke: remoteSmoke
			? {
					status: remoteSmoke.status,
					checkedAt: remoteSmoke.checkedAt ?? null,
					checkCount: (remoteSmoke.checks ?? []).length,
					reason: remoteSmoke.reason ?? null,
					failure: remoteSmoke.failure ?? null
				}
			: {
					status: 'missing',
					checkedAt: null,
					checkCount: 0,
					reason: null,
					failure: null
				},
		limitations: report.limitations
	};
}

