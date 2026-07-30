import type { AlphaReadinessReport } from './alpha-readiness';
import { buildAlphaHardProofBlockers } from './alpha-hard-proof-blockers';
import { requiredAlphaEvidence } from './alpha-required-evidence';

export function buildAlphaEvidenceIndex(report: AlphaReadinessReport) {
	return {
		target: report.target,
		issued: report.issued,
		bridgeSource: report.bridgeSource,
		requiredEvidence: requiredAlphaEvidence,
		trustModel: {
			runtimeEndpoints:
				'Runtime endpoints are deterministic source-derived evidence and do not call live community APIs.',
			generatedArtifacts:
				'Generated artifacts are current only after bun run alpha:report:full regenerates report/.',
			collectedArtifacts:
				'Community analytics artifacts are directional public-source evidence collected by bun run alpha:analytics.',
			hostedArtifacts:
				'Hosted smoke artifacts prove deployment behavior only after ALPHA_SMOKE_BASE_URL targets a real PHP host.'
		},
		liveEvidenceSurfaces: [
			{
				id: 'alpha-release-checklist',
				route: '/alpha-readiness/release-checklist.md',
				source: 'src/lib/alpha-release-checklist.ts',
				documentationSource: 'docs/ALPHA-RELEASE-CHECKLIST.md',
				artifact: 'report/alpha-release-checklist.md',
				manifestEndpoint: '/alpha-readiness/release-manifest.json',
				packageContractEndpoint: '/alpha-readiness/package-contract.json',
				markers: [
					'1.0.2-alpha release checklist',
					'alpha-over-rc-release-policy',
					'desktop-shell-ui-command-mapping',
					'community-analytics-csv-linkage',
					'router-path-safety-artifact-sync',
					'adapter-platform-emulation',
					'deploy-env-preflight-safety',
					'bun run alpha:gate',
					'bun run alpha:gate:hosted',
					'getDesktopShellUiCommandMapping',
					'sourceToKeywordEdge',
					'result-total-field-contract',
					'top-result-field-contract',
					'sample-review-rule',
					'resultTotalField',
					'topResultFields',
					'sampleReviewRule',
					'weighted_demand_score',
					'result_total_field',
					'top_result_fields',
					'sample_review_rule',
					'ALPHA_SMOKE_BASE_URL',
					'report/alpha-release-checklist.md',
					'source-controlled-release-documentation',
					'generated-from-source'
				],
				proofStage: 'runtime-source-endpoint',
				trustLevel: 'deterministic-runtime-evidence',
				proofUse:
					'Human-reviewable alpha release checklist endpoint and generated artifact covering the same policy, native mapping, community CSV, router safety, artifact sync, deploy preflight, and hosted proof markers enforced by release-prep.'
			},
			{
				id: 'required-alpha-evidence',
				route: '/alpha-readiness/evidence-index.json',
				source: 'src/lib/alpha-evidence-index.ts',
				manifestEndpoint: '/alpha-readiness/release-manifest.json',
				packageContractEndpoint: '/alpha-readiness/package-contract.json',
				markers: [
					'requiredEvidence',
					'alpha-over-rc-release-policy',
					'projectRankPolicy',
					'1.0.2-alpha',
					'above-rc',
					'disallowedCandidateLabels',
					'mustNotUseCandidateLabels',
					'native-host-binding-guide',
					'desktop-shell-ui-command-mapping',
					'csr-disabled-prerender-contract',
					'native-host-compatibility-matrix',
					'theme-stable-ssr-html',
					'no-hydration-fixture',
					'native-host-wrapper-smoke',
					'windows-11-mica-browser-safe-shell',
					'macos-style-native-titlebar-rhythm',
					'alpha-readiness-report-graphics',
					'community-keyword-search-graph',
					'community-analytics-freshness-contract',
					'community-analytics-csv-linkage',
					'router-path-safety-artifact-sync',
					'adapter-platform-emulation',
					'deploy-env-preflight-safety',
					'hosted-php-smoke-proof'
				],
				proofStage: 'release-policy-evidence-boundary',
				trustLevel: 'deterministic-runtime-evidence',
				proofUse:
					'Central index of the evidence required before the 1.0.2-alpha track can be treated as alpha-reviewable rather than a generic adapter smoke test.'
			},
			{
				id: 'hard-proof-blocker-ledger',
				route: '/alpha-readiness/release-manifest.json',
				source: 'src/lib/alpha-hard-proof-blockers.ts',
				manifestEndpoint: '/alpha-readiness/release-manifest.json',
				packageContractEndpoint: '/alpha-readiness/package-contract.json',
				gateMatrixEndpoint: '/alpha-readiness/gate-matrix.json',
				markers: [
					'hard-proof-blocker-ledger',
					'hardProofBlockers',
					...buildAlphaHardProofBlockers().map((blocker) => blocker.marker)
				],
				proofStage: 'hard-proof-blocker-ledger',
				trustLevel: 'stable-promotion-blocker-contract',
				proofUse:
					'Machine-readable stable-promotion blocker ledger covering the current local gate, hosted smoke, packed consumer, strict artifact sync, real native host, and community freshness proof gaps.'
			},
			{
				id: 'no-hydration-prerender-fixture',
				route: '/alpha-readiness/no-hydration',
				source: 'src/routes/alpha-readiness/no-hydration/+page.svelte',
				configSource: 'src/routes/alpha-readiness/no-hydration/+page.ts',
				manifestEndpoint: '/alpha-readiness/release-manifest.json',
				packageContractEndpoint: '/alpha-readiness/package-contract.json',
				markers: [
					'no-hydration-fixture',
					'csr-disabled-prerender-contract',
					'theme-stable-ssr-html',
					'prerender = true',
					'csr = false',
					'forbiddenText:<script',
					'forbiddenText:sveltekit:start',
					'forbiddenText:data-sveltekit-hydrate'
				],
				proofStage: 'runtime-source-endpoint',
				trustLevel: 'deterministic-runtime-evidence',
				proofUse:
					'Reviewer-visible fixture proving blog/static skins can ship prerendered csr=false HTML without client hydration scripts repainting the server-rendered theme.'
			},
			{
				id: 'adapter-platform-emulation',
				route: '/alpha-readiness/package-contract.json',
				source: 'adapter/src/index.ts',
				generatedArtifact: 'adapter/index.js',
				packageContractEndpoint: '/alpha-readiness/package-contract.json',
				markers: [
					'adapter-platform-emulation',
					'emulate().platform',
					'event.platform.php',
					'adapterVersion',
					'prerendering',
					'documentSsr',
					'phpStaticClientFallback',
					'actionHandlers',
					'endpointHandlers',
					'nativeHostRuntime'
				],
				proofStage: 'release-policy-evidence-boundary',
				trustLevel: 'deterministic-local-check',
				proofUse:
					'Machine-readable package contract proof that SvelteKit dev/build/preview receives a non-secret PHP adapter platform surface without expanding the runtime package API.'
			},
			{
				id: 'native-host-bridge-status',
				route: '/alpha-readiness',
				component: 'src/lib/components/native-shell/NativeHostBridgeStatus.svelte',
				contractEndpoint: '/alpha-readiness/native-host-contract.json',
				bridgeEndpoint: '/alpha-readiness/bridge-reuse.json',
				markers: [
					'data-native-host-bridge-status',
					'data-native-host-handoff-controls',
					'window.__SVELTEKIT_PHP_NATIVE_HOST__',
					'window.__SVELTEKIT_PHP_NATIVE_HOST_HISTORY__',
					'desktopShellUiHelper',
					'desktopShellUiEvidence',
					'native-host-wrapper-probe',
					'getDesktopShellUiCommandMapping',
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
				proofStage: 'runtime-source-endpoint',
				trustLevel: 'deterministic-runtime-evidence',
				proofUse:
					'Reviewer-visible native host seam showing host-owned Windows/macOS/progress/report commands, live handoff controls, and deterministic browser fallback history.'
			},
			{
				id: 'native-host-binding-guide',
				route: '/alpha-readiness/native-host-guide.md',
				source: 'src/lib/alpha-native-host-guide.ts',
				contractEndpoint: '/alpha-readiness/native-host-contract.json',
				bridgeEndpoint: '/alpha-readiness/bridge-reuse.json',
				markers: [
					'native host binding guide',
					'lg-ultragear-host-permission-checklist',
					'realHostPermissionChecklist',
					'hostPermissionCues',
					'requiredHostPermission',
					'src-tauri/capabilities/default.json',
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
					'native-host-wrapper-probe',
					'packages/desktop-shell-ui/src/index.ts',
					'packages/ultragear-widget-ui/src/app.ts',
					'@scriptgpt/desktop-shell-ui',
					'enableMicaWindowChrome',
					'syncTaskbarProgress',
					'toggleWindowMaximize',
					'bindColorSchemeWatcher',
					'prefersDarkMode',
					'window.matchMedia("(prefers-color-scheme: dark)")',
					'TaskbarProgressState',
					'toDesktopShellUiTaskbarProgressState',
					'native-host-wrapper-probe',
					'saveInFlight',
					'refreshInFlight',
					'hasQueuedSave',
					'Effect.Mica',
					'win.setProgressBar',
					'reportJson'
				],
				proofStage: 'runtime-source-endpoint',
				trustLevel: 'deterministic-runtime-evidence',
				proofUse:
					'Reviewer-visible host binding guide that translates LG UltraGear Mica/progress/report cues into the optional desktop wrapper contract.'
			},
			{
				id: 'real-host-permission-checklist',
				route: '/alpha-readiness/native-host-contract.json',
				source: 'src/lib/alpha-native-host-contract.ts',
				contractEndpoint: '/alpha-readiness/native-host-contract.json',
				guideEndpoint: '/alpha-readiness/native-host-guide.md',
				bridgeEndpoint: '/alpha-readiness/bridge-reuse.json',
				markers: [
					'lg-ultragear-host-permission-checklist',
					'realHostPermissionChecklist',
					'real-host-permission-cue-required',
					'hostPermissionCues',
					'requiredHostPermission',
					'src-tauri/capabilities/default.json',
					'core:window:allow-set-effects',
					'core:window:allow-set-progress-bar',
					'core:window:allow-start-dragging',
					'core:window:allow-is-maximized',
					'core:window:allow-maximize',
					'core:window:allow-unmaximize',
					'core:window:allow-toggle-maximize',
					'core:window:allow-theme',
					'core:window:allow-set-focus'
				],
				proofStage: 'real-host-permission-boundary',
				trustLevel: 'deterministic-runtime-evidence',
				proofUse:
					'Reviewer-visible permission checklist separating browser-safe native styling evidence from real OS-native wrapper proof.'
			},
			{
				id: 'native-host-wrapper-smoke',
				route: '/alpha-readiness/native-host-wrapper-smoke.json',
				source: 'src/lib/alpha-native-host-wrapper-smoke.ts',
				artifact: 'report/alpha-native-host-wrapper-smoke.json',
				contractEndpoint: '/alpha-readiness/native-host-contract.json',
				markers: [
					'native-host-wrapper-smoke',
					'native-host-wrapper-probe',
					'contract-ready',
					'deterministic-host-wrapper-handoff',
					'native-host-wrapper-event-replay',
					'native-host-wrapper-event-replay-step',
					'realHostVerified',
					'noNativeApiBoundary',
					'buildNativeHostWrapperProbe',
					'window.__SVELTEKIT_PHP_NATIVE_HOST__',
					'window.__SVELTEKIT_PHP_NATIVE_HOST_HISTORY__',
					'toDesktopShellUiTaskbarProgressState',
					'TaskbarProgressState',
					'enableMicaWindowChrome',
					'syncTaskbarProgress',
					'toggleWindowMaximize',
					'expectedHistoryResult',
					'expectedDesktopShellUiHelper',
					'noFallbackAllowedForRealHost'
				],
				proofStage: 'runtime-source-endpoint',
				trustLevel: 'deterministic-host-wrapper-handoff',
				proofUse:
					'Reviewer-visible smoke contract for optional wrappers to exercise the same LG UltraGear helper mapping used by the live native-host bridge while preserving realHostVerified:false until an OS-native wrapper run exists.'
			},
			{
				id: 'native-visual-matrix',
				route: '/alpha-readiness',
				source: 'src/lib/alpha-native-host-contract.ts',
				contractEndpoint: '/alpha-readiness/native-host-contract.json',
				bridgeEndpoint: '/alpha-readiness/bridge-reuse.json',
				markers: [
					'native-visual-matrix',
					'data-native-visual-matrix',
					'windows-mica-visual-row',
					'macos-traffic-light-row',
					'windows-caption-control-row',
					'ultragear-theme-row',
					'browser-fallback-visual-row'
				],
				proofStage: 'runtime-source-endpoint',
				trustLevel: 'deterministic-runtime-evidence',
				proofUse:
					'Reviewer-visible matrix mapping OS-style native visual claims to concrete adapter markers, UltraGear cues, report graphics, and host-owned boundaries.'
			},
			{
				id: 'native-host-compatibility-matrix',
				route: '/alpha-readiness/native-host-contract.json',
				source: 'src/lib/alpha-native-host-contract.ts',
				contractEndpoint: '/alpha-readiness/native-host-contract.json',
				bridgeEndpoint: '/alpha-readiness/bridge-reuse.json',
				hostedChecklistEndpoint: '/alpha-readiness/hosted-smoke-checklist.json',
				markers: [
					'native-host-compatibility-matrix',
					'source-observed-host-compatibility-contract',
					'packages/ultragear-widget-ui/src/app.ts',
					'src-tauri/src/lib.rs',
					'features.micaSupported',
					'windowChromeState',
					'data-window-chrome-state',
					'data-window-chrome-state="mica-active"',
					'transparent-webview-material-boundary',
					'data-transparent-webview-material-boundary="host-owned"',
					'mica-active',
					'mica-inactive',
					'plain',
					'webview.setBackgroundColor([0, 0, 0, 0])',
					'ShellFeatureProbe.mica_supported',
					'current_shell_features()',
					'cfg!(target_os = "windows")',
					'windows-mica-effects',
					'taskbar-progress-reporting',
					'native-titlebar-drag-maximize',
					'enableMicaWindowChrome(win)',
					'syncTaskbarProgress(win, { saveInFlight, refreshInFlight, hasQueuedSave })',
					'toggleDesktopWindowMaximize(win)',
					'win.startDragging()',
					'set-window-effect',
					'set-progress',
					'native-window-action'
				],
				proofStage: 'source-observed-host-compatibility-contract',
				trustLevel: 'deterministic-runtime-evidence',
				proofUse:
					'Reviewer-visible compatibility matrix connecting observed UltraGear Windows/native host cues to adapter host-event contracts while keeping real OS-native proof as a separate wrapper requirement.'
			},
			{
				id: 'ultragear-source-parity',
				route: '/alpha-readiness/bridge-reuse.json',
				source: 'src/lib/alpha-bridge-reuse.ts',
				contractEndpoint: '/alpha-readiness/native-host-contract.json',
				bridgeEndpoint: '/alpha-readiness/bridge-reuse.json',
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
					'bindColorSchemeWatcher',
					'prefersDarkMode',
					'applyWindowChrome',
					'syncWindowProgress',
					'DRAG_START_THRESHOLD_PX',
					'dispatch("start-dragging")',
					'Structured report preview'
				],
				proofStage: 'runtime-source-endpoint',
				trustLevel: 'deterministic-runtime-evidence',
				proofUse:
					'Reviewer-visible map from the referenced UltraGear implementation files to the adapter native-shell, report, graphics, and host-boundary evidence.'
			},
			{
				id: 'lg-ultragear-native-platform-provenance',
				route: '/alpha-readiness/bridge-reuse.json',
				source: 'src/lib/alpha-bridge-reuse.ts',
				contractEndpoint: '/alpha-readiness/bridge-reuse.json',
				markers: [
					'lg-ultragear-native-platform-provenance',
					'packages/desktop-shell-ui/src/index.ts',
					'packages/ultragear-widget-ui/src/app.ts',
					'@scriptgpt/desktop-shell-ui',
					'desktopShellUiBinding',
					'getDesktopShellUiCommandMapping',
					'desktopShellUiHelper',
					'desktopShellUiEvidence',
					'enableMicaWindowChrome',
					'syncTaskbarProgress',
					'toggleWindowMaximize',
					'bindColorSchemeWatcher',
					'prefersDarkMode',
					'window.matchMedia("(prefers-color-scheme: dark)")',
					'Effect.Mica',
					'win.setEffects',
					'app-window',
					'app-window.maximized',
					':root[data-window-effect="mica"][data-window-focused="false"]',
					'theme-ultragear',
					'--window-bg-mica',
					'--window-bg-inactive',
					'--window-wash-inactive',
					'--surface-chrome',
					'max-width: 1180px',
					'max-width: 860px',
					'data-native-platform',
					'data-window-control-group',
					'[data-no-window-drag]',
					'caption-button',
					'dragBlockSelector',
					'setPointerCapture',
					'lostpointercapture',
					'window blur drag cancellation',
					'win.startDragging',
					'win.setProgressBar',
					'reportJson',
					'reportUrl',
					'set-window-effect',
					'set-progress',
					'clear-progress',
					'report-ready'
				],
				proofStage: 'source-cue-to-adapter-evidence-map',
				trustLevel: 'manual-source-parity-contract',
				proofUse:
					'Proves the alpha evidence names the exact LG UltraGear source files behind Windows Mica, macOS-style chrome, host-owned window actions, and report/progress handoff reuse.'
			},
			{
				id: 'progress-report-handoff',
				route: '/alpha-readiness',
				source: 'src/lib/alpha-native-host-contract.ts',
				contractEndpoint: '/alpha-readiness/native-host-contract.json',
				bridgeEndpoint: '/alpha-readiness/bridge-reuse.json',
				markers: [
					'progressReportHandoff',
					'syncTaskbarProgress',
					'syncWindowProgress',
					'ProgressBarStatus.Indeterminate',
					'ProgressBarStatus.Normal',
					'set-progress',
					'clear-progress',
					'report-ready',
					'Download report JSON',
					'Structured report preview',
					'alpha:report:full'
				],
				proofStage: 'runtime-source-endpoint',
				trustLevel: 'deterministic-runtime-evidence',
				proofUse:
					'Reviewer-visible handoff from UltraGear taskbar progress/report export semantics to adapter report artifacts and optional desktop-host progress binding.'
			},
			{
				id: 'progress-report-graphic',
				route: '/alpha-readiness/report.svg',
				source: 'src/lib/alpha-readiness-svg.ts',
				contractEndpoint: '/alpha-readiness/report.svg',
				markers: [
					'progressReportHandoff',
					'statusMapping',
					'ProgressBarStatus.Indeterminate',
					'ProgressBarStatus.None',
					'report-ready',
					'report/alpha-readiness.full.json'
				],
				proofStage: 'runtime-source-endpoint',
				trustLevel: 'deterministic-runtime-evidence',
				proofUse:
					'Reviewer-visible SVG proof that the UltraGear progress/report lifecycle is present in portable release graphics, not only in JSON contracts.'
			},
			{
				id: 'community-evidence-coverage-ledger',
				route: '/alpha-readiness',
				source: 'src/lib/alpha-community-research-pack.ts',
				researchPackEndpoint: '/alpha-readiness/community-research-pack.json',
				sourcesCsvEndpoint: '/alpha-readiness/community-sources.csv',
				markers: [
					'Community evidence coverage ledger',
					'providerCoverage',
					'evidenceKindCoverage',
					'collectionRiskCoverage',
					'Open-source analytics sources reviewers can audit first'
				],
				proofStage: 'runtime-source-endpoint',
				trustLevel: 'deterministic-runtime-evidence',
				proofUse:
					'Reviewer-visible source taxonomy showing provider, evidence-kind, collection-risk, and prioritized public-source analytics coverage.'
			},
			{
				id: 'community-keyword-search-graph',
				route: '/alpha-readiness/community-source-map.svg',
				source: 'src/lib/alpha-community-research-pack.ts',
				researchPackEndpoint: '/alpha-readiness/community-research-pack.json',
				sourcesCsvEndpoint: '/alpha-readiness/community-sources.csv',
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
					'alpha-community-source-evidence-checklist',
					'source-health-classification',
					'result-total-field-contract',
					'top-result-field-contract',
					'sample-review-rule',
					'resultTotalField',
					'topResultFields',
					'sampleReviewRule',
					'api.github.com/search'
				],
				proofStage: 'runtime-source-endpoint',
				trustLevel: 'deterministic-runtime-evidence',
				proofUse:
					'Machine-readable and graphic proof that each alpha keyword maps to concrete source hosts, public API endpoints, manual research links, evidence kinds, collection-risk labels, curated signal scores, and collected demand-score handoff fields.'
			},
			{
				id: 'community-analytics-freshness-contract',
				route: '/alpha-readiness/community-research-pack.json',
				source: 'src/lib/alpha-community-research-pack.ts',
				researchPackEndpoint: '/alpha-readiness/community-research-pack.json',
				analyticsMarkdownEndpoint: '/alpha-readiness/community-analytics.md',
				markers: [
					'community-analytics-freshness-contract',
					'analyticsFreshnessContract',
					'maxAgeHours',
					'report/alpha-community-analytics.json',
					'report/alpha-community-analytics.md',
					'bun run alpha:analytics',
					'bun run alpha:report:full',
					'alpha-community-source-evidence-checklist',
					'directional-community-signal'
				],
				proofStage: 'runtime-source-endpoint',
				trustLevel: 'deterministic-runtime-evidence',
				proofUse:
					'Machine-readable freshness contract for public-source analytics counts so alpha review can separate current collected evidence from stale or placeholder research handoff data.'
			}
		],
		endpoints: [
			{
				path: '/alpha-readiness',
				mediaType: 'text/html',
				purpose: 'Native-styled operator report surface with download/open actions.',
				artifact: null
			},
			{
				path: '/alpha-readiness/no-hydration',
				mediaType: 'text/html',
				purpose: 'Prerendered csr=false fixture proving stable SSR theme HTML without client hydration scripts.',
				artifact: null
			},
			{
				path: '/alpha-readiness/report.json',
				mediaType: 'application/json',
				purpose: 'Canonical readiness report model.',
				artifact: 'report/alpha-readiness.json'
			},
			{
				path: '/alpha-readiness/report.html',
				mediaType: 'text/html',
				purpose: 'Standalone native-styled HTML handoff report.',
				artifact: 'report/alpha-readiness.html'
			},
			{
				path: '/alpha-readiness/report.md',
				mediaType: 'text/markdown',
				purpose: 'Markdown readiness report for PRs and release notes.',
				artifact: 'report/alpha-readiness.md'
			},
			{
				path: '/alpha-readiness/release-notes.md',
				mediaType: 'text/markdown',
				purpose: 'Concise alpha release call and required gate commands.',
				artifact: 'report/alpha-release-notes.md'
			},
			{
				path: '/alpha-readiness/release-checklist.md',
				mediaType: 'text/markdown',
				purpose: 'Human alpha release checklist for project policy, native shell mapping, community analytics linkage, runtime safety, and hosted proof.',
				artifact: 'report/alpha-release-checklist.md'
			},
			{
				path: '/alpha-readiness/report.svg',
				mediaType: 'image/svg+xml',
				purpose: 'Portable native-styled release-card graphic.',
				artifact: 'report/alpha-readiness.svg'
			},
			{
				path: '/alpha-readiness/community-source-map.svg',
				mediaType: 'image/svg+xml',
				purpose: 'Portable graphic mapping community keywords to supported API and manual research source lanes.',
				artifact: 'report/alpha-community-source-map.svg'
			},
			{
				path: '/alpha-readiness/release-manifest.json',
				mediaType: 'application/json',
				purpose: 'Machine-readable release evidence bundle manifest.',
				artifact: 'report/alpha-release-manifest.json'
			},
			{
				path: '/alpha-readiness/gate-matrix.json',
				mediaType: 'application/json',
				purpose: 'Maps release commands to proof scope and required artifacts.',
				artifact: 'report/alpha-gate-matrix.json'
			},
			{
				path: '/alpha-readiness/evidence-index.json',
				mediaType: 'application/json',
				purpose: 'Self-describing index of alpha report endpoints, generated artifacts, and quality bars.',
				artifact: 'report/alpha-evidence-index.json'
			},
			{
				path: '/alpha-readiness/package-contract.json',
				mediaType: 'application/json',
				purpose: 'Alpha npm package export and consumer-smoke contract.',
				artifact: 'report/alpha-package-contract.json'
			},
			{
				path: '/alpha-readiness/native-host-contract.json',
				mediaType: 'application/json',
				purpose: 'Native host seam for Mica, macOS chrome rhythm, report handoff, and no-Tauri adapter boundaries.',
				artifact: 'report/alpha-native-host-contract.json'
			},
			{
				path: '/alpha-readiness/native-host-guide.md',
				mediaType: 'text/markdown',
				purpose: 'Desktop-wrapper binding guide for native-window-action handlers, Mica effect, progress, report-ready handoff, and fallback history.',
				artifact: 'report/alpha-native-host-guide.md'
			},
			{
				path: '/alpha-readiness/native-host-wrapper-smoke.json',
				mediaType: 'application/json',
				purpose: 'Deterministic wrapper smoke contract for LG UltraGear helper mapping and taskbar progress translation.',
				artifact: 'report/alpha-native-host-wrapper-smoke.json'
			},
			{
				path: '/alpha-readiness/hosted-smoke-checklist.json',
				mediaType: 'application/json',
				purpose: 'Hosted PHP smoke environment, command, endpoint, and probe checklist.',
				artifact: 'report/alpha-hosted-smoke-checklist.json'
			},
			{
				path: '/alpha-readiness/bridge-reuse.json',
				mediaType: 'application/json',
				purpose: 'Auditable UltraGear bridge-pattern reuse inventory.',
				artifact: 'report/alpha-bridge-reuse.json'
			},
			{
				path: '/alpha-readiness/review-index.md',
				mediaType: 'text/markdown',
				purpose: 'Human reviewer index mapping the alpha objective to runtime links, generated artifacts, and remaining gates.',
				artifact: 'report/alpha-review-index.md'
			},
			{
				path: '/alpha-readiness/community-signals.json',
				mediaType: 'application/json',
				purpose: 'Keyword/search-link map for open-source community research.',
				artifact: null
			},
			{
				path: '/alpha-readiness/community-analytics.md',
				mediaType: 'text/markdown',
				purpose: 'Markdown community analytics handoff with collection commands, source coverage plan, keyword map, reviewer actions, and optional collected source counts.',
				artifact: 'report/alpha-community-analytics.md'
			},
			{
				path: '/alpha-readiness/community-research-pack.json',
				mediaType: 'application/json',
				purpose: 'Community research pack grouped by supported API/manual mode with provider coverage, evidence kind, collection risk, priority, proof use, and reviewer actions.',
				artifact: 'report/alpha-community-research-pack.json'
			},
			{
				path: '/alpha-readiness/readiness.csv',
				mediaType: 'text/csv',
				purpose: 'Spreadsheet-ready readiness areas, scores, status, and gaps.',
				artifact: 'report/alpha-readiness.csv'
			},
			{
				path: '/alpha-readiness/community-signals.csv',
				mediaType: 'text/csv',
				purpose: 'Spreadsheet-ready community keywords, metrics, and links.',
				artifact: 'report/alpha-community-signals.csv'
			},
			{
				path: '/alpha-readiness/community-sources.csv',
				mediaType: 'text/csv',
				purpose: 'Spreadsheet-ready community source inventory with provider, source host, source mode, evidence kind, collection risk, priority, endpoint, proof use, reviewer action, and result/top-result/sample-review field contracts.',
				artifact: 'report/alpha-community-sources.csv'
			}
		],
		generatedOnlyArtifacts: [
			{
				path: 'docs/ALPHA-RELEASE-CHECKLIST.md',
				mediaType: 'text/markdown',
				purpose: 'Human alpha release checklist for project policy, native shell mapping, community analytics linkage, runtime safety, and hosted proof.',
				proofStage: 'release-checklist-documentation',
				trustLevel: 'deterministic-local-check'
			},
			{
				path: 'report/alpha-release-checklist.md',
				mediaType: 'text/markdown',
				purpose: 'Generated alpha release checklist bundled with report artifacts.',
				proofStage: 'generated-from-source',
				trustLevel: 'deterministic-local-artifact'
			},
			{
				path: 'report/alpha-readiness.full.json',
				mediaType: 'application/json',
				purpose: 'Combined readiness report with collected analytics and hosted smoke evidence.',
				proofStage: 'generated-from-source-plus-optional-collected-and-hosted-data',
				trustLevel: 'deterministic-local-artifact-with-optional-evidence-slots'
			},
			{
				path: 'report/alpha-community-analytics.json',
				mediaType: 'application/json',
				purpose: 'Collected public-source community analytics.',
				proofStage: 'collected-public-source-data',
				trustLevel: 'directional-community-signal'
			},
			{
				path: 'report/alpha-remote-smoke.json',
				mediaType: 'application/json',
				purpose:
					'Remote hosted smoke result or deterministic skipped placeholder; status=passed is alpha hosted proof for the checked PHP target.',
				proofStage: 'hosted-smoke-or-placeholder',
				trustLevel: 'requires-alpha-smoke-base-url-for-pass-evidence'
			}
		],
		qualityBar: [
			'Every endpoint in this index must stay covered by alpha hosted smoke or alpha readiness verification.',
			'Live evidence surfaces must stay represented in the manifest, evidence index, hosted smoke checklist, release notes, and reviewer index.',
			'UltraGear source parity must map concrete source cues to adapter evidence without importing Tauri APIs into the PHP adapter runtime.',
			'LG UltraGear native platform provenance must name the exact source files and cue families reused by the alpha native-shell evidence.',
			'Real host permission checklist must keep LG UltraGear/Tauri permission cues visible across manifest, evidence index, native host contract, native host guide, bridge reuse, release-prep, and generated reports before any OS-native Mica/taskbar/drag claim is promoted.',
			'Native visual matrix evidence must keep Windows Mica, macOS traffic-light, Windows caption-control, UltraGear theme, and browser fallback rows tied to live markers and native-host contracts.',
			'Native host compatibility matrix evidence must keep source-observed Windows Mica/taskbar/drag/maximize cues tied to browser-safe host actions without promoting them to real OS-native proof.',
			'Progress/report handoff must keep taskbar progress host-owned while exposing deterministic report artifacts and live-page markers.',
			'Native host handoff controls must keep set-window-effect, set-progress, clear-progress, and report-ready synchronized across the live page, generated reports, manifest, evidence index, hosted smoke checklist, and review index.',
			'No-hydration prerender evidence must keep csr=false, prerender=true, theme-stable SSR markers, hosted smoke coverage, and forbidden hydration-script checks synchronized.',
			'Native host binding guide must stay synchronized with the runtime bridge action and handler contract before wrapper work can be called alpha-reviewable.',
			'Native host wrapper smoke must stay synchronized with the runtime bridge probe, native-host contract, package contract, release manifest, hosted checklist, and remote smoke before wrapper work can be called alpha-reviewable.',
			'Progress/report graphic proof must keep the UltraGear lifecycle visible in report.svg so screenshots and PR evidence preserve the same contract.',
			'Keyword search graph evidence must keep keyword-to-source edges, alpha evidence checklists, source-health classifications, and analytics score links aligned across the research pack, source-map SVG, CSV, and analytics Markdown handoff.',
			'Community analytics freshness contract must stay visible across the research pack, analytics Markdown, source-map SVG, manifest, evidence index, and hosted smoke checklist.',
			'Required alpha evidence must stay synchronized across package metadata, package contract, release manifest, evidence index, hosted smoke checklist, and remote smoke.',
			'Adapter platform emulation must stay capability-only and synchronized across source, generated adapter bundle, package contract, evidence index, release-prep, and report handoffs.',
			'The alpha release checklist must stay synchronized with package files, package contract, release manifest, evidence index, release-prep, and hosted smoke expectations.',
			'Alpha-over-RC policy must stay explicit: projectRankPolicy above-rc, 1.0.2-alpha track, alpha dist-tag, and disallowed RC/latest/stable candidate labels.',
			'Desktop shell helper mappings must stay explicit through getDesktopShellUiCommandMapping, desktopShellUiHelper, desktopShellUiEvidence, and nativeHostBridgeMapping evidence.',
			'The native host bridge status is proof of a host seam/fallback, not proof of real OS-native Mica or macOS chrome until a wrapper supplies handlers.',
			'Every generated artifact must be regenerated after source changes before the report bundle is current.',
			'Community analytics counts are evidence inputs, not telemetry or release claims by themselves.',
			'Hosted PHP proof remains blocked until ALPHA_SMOKE_BASE_URL targets the release deployment host and report/alpha-remote-smoke.json is current.',
			'Stable 1.0.0 remains blocked until the current full local gate, strict artifact sync, packed consumer proof, real native-host proof for OS-native claims, and a fresh hosted PHP smoke for the release deployment target are all current.'
		]
	};
}

