import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PACKAGE_VERSION } from './utils/release-snapshot.mjs';

const args = new Set(process.argv.slice(2));
const allowMissing = args.has('--allow-missing');
const forceSkip = args.has('--skip');
const expectedVersion = process.env.ALPHA_SMOKE_EXPECTED_VERSION || PACKAGE_VERSION;
const timeoutMs = Number(process.env.ALPHA_SMOKE_TIMEOUT_MS || 15000);
const baseUrlInput = process.env.ALPHA_SMOKE_BASE_URL;
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultReportPath = path.join(repoRoot, 'report', 'alpha-remote-smoke.json');
const reportPath = process.env.ALPHA_SMOKE_REPORT_PATH
	? path.resolve(repoRoot, process.env.ALPHA_SMOKE_REPORT_PATH)
	: defaultReportPath;

const pageChecks = [
	{
		name: 'home',
		path: '',
		expectedContentType: 'text/html',
		requiredText: ['SvelteKit']
	},
	{
		name: 'alpha readiness page',
		path: 'alpha-readiness',
		expectedContentType: 'text/html',
		requiredText: [
			'alpha',
			'readiness',
			'data-native-platform-provenance',
			'data-window-material',
			'windows-11-mica',
			'data-macos-chrome',
			'data-windows-chrome',
			'data-native-platform-mode',
			'hybrid-proof',
			'Native host bridge',
			'data-native-host-handoff-controls',
			'browser fallback active',
			'data-ultragear-source-parity',
			'ultraGearParityContract',
			'data-desktop-shell-ui-binding',
			'desktopShellUiBinding',
			'@scriptgpt/desktop-shell-ui',
			'enableMicaWindowChrome',
			'syncTaskbarProgress',
			'toggleWindowMaximize',
			'installSvelteKitPhpNativeHost',
			'data-progress-report-handoff',
			'progressReportHandoff',
			'statusMapping',
			'ProgressBarStatus.None',
			'report-ready',
			'data-native-visual-matrix',
			'native-visual-matrix',
			'windows-mica-visual-row',
			'macos-traffic-light-row',
			'macos-vibrancy-visual-row',
			'macos-vibrancy-host-policy',
			'macos-material-host-policy',
			'source-observed-macos-host-scaffold',
			'macos-native-vibrancy-unverified',
			'data-required-alpha-evidence',
			'Required alpha evidence',
			'requiredEvidence',
			'required-alpha-evidence',
			'native-host-binding-guide',
			'desktop-shell-ui-command-mapping',
			'csr-disabled-prerender-contract',
			'windows-11-mica-browser-safe-shell',
			'macos-style-native-titlebar-rhythm',
			'alpha-readiness-report-graphics',
			'community-keyword-search-graph',
			'community-analytics-freshness-contract',
			'community-analytics-csv-linkage',
			'router-path-safety-artifact-sync',
			'adapter-platform-emulation',
			'deploy-env-preflight-safety',
			'hosted-php-smoke-proof',
			'data-alpha-proof-ledger',
			'proofLedger',
			'Alpha proof ledger',
			'alpha-over-rc-release-policy',
			'alpha-runtime-gate-ledger',
			'hosted-php-smoke-proof-required',
			'needs-local-gate-proof',
			'needs-hosted-proof',
			'data-community-keyword-search-graph',
			'data-analytics-linked-keyword-graph',
			'keywordSearchGraph',
			'analytics-linked-keyword-graph',
			'community-analytics-freshness-contract',
			'curated-signal-score',
			'collected-demand-score',
			'directional-community-signal',
			'no-live-community-api-runtime-boundary',
			'source-to-keyword-edge',
			'Community evidence coverage ledger',
			'Open-source analytics sources reviewers can audit first'
		]
	},
	{
		name: 'no hydration prerender fixture',
		path: 'alpha-readiness/no-hydration',
		expectedContentType: 'text/html',
		requiredText: [
			'no-hydration-fixture',
			'csr-disabled-prerender-contract',
			'theme-stable-ssr-html',
			'This fixture is intentionally prerendered with csr=false'
		],
		forbiddenText: ['<script', 'sveltekit:start', 'data-sveltekit-hydrate']
	},
	{
		name: 'alpha readiness report',
		path: 'alpha-readiness/report.json',
		expectedContentType: 'application/json',
		requiredText: [
			expectedVersion,
			'releasePolicy',
			'requiredEvidence',
			'native-host-binding-guide',
			'desktop-shell-ui-command-mapping',
			'csr-disabled-prerender-contract',
			'windows-11-mica-browser-safe-shell',
			'macos-style-native-titlebar-rhythm',
			'alpha-readiness-report-graphics',
			'community-keyword-search-graph',
			'community-analytics-freshness-contract',
			'community-analytics-csv-linkage',
			'router-path-safety-artifact-sync',
			'adapter-platform-emulation',
			'deploy-env-preflight-safety',
			'hosted-php-smoke-proof',
			'proofLedger',
			'alpha-over-rc-release-policy',
			'1.0.2-alpha',
			'above-rc',
			'alpha-runtime-gate-ledger',
			'hosted-php-smoke-proof-required',
			'hardProofBlockers',
			'hard-proof-blocker-ledger',
			'packed-consumer-install-import-proof',
			'source-to-generated-bundle-check',
			'real-native-host-wrapper-smoke-required'
		]
	},
	{
		name: 'alpha readiness markdown',
		path: 'alpha-readiness/report.md',
		expectedContentType: 'text/markdown',
		requiredText: [
			expectedVersion,
			'Release policy',
			'alpha-over-rc-release-policy',
			'1.0.2-alpha',
			'above-rc',
			'Required alpha evidence',
			'requiredEvidence',
			'required-alpha-evidence',
			'native-host-binding-guide',
			'desktop-shell-ui-command-mapping',
			'csr-disabled-prerender-contract',
			'windows-11-mica-browser-safe-shell',
			'macos-style-native-titlebar-rhythm',
			'alpha-readiness-report-graphics',
			'community-keyword-search-graph',
			'community-analytics-freshness-contract',
			'community-analytics-csv-linkage',
			'router-path-safety-artifact-sync',
			'adapter-platform-emulation',
			'deploy-env-preflight-safety',
			'hosted-php-smoke-proof',
			'Alpha proof ledger',
			'alpha-runtime-gate-ledger',
			'hosted-php-smoke-proof-required',
			'Hard proof blockers',
			'hard-proof-blocker-ledger',
			'packed-consumer-install-import-proof',
			'source-to-generated-bundle-check',
			'real-native-host-wrapper-smoke-required',
			'UltraGear native platform provenance',
			'data-native-host-handoff-controls',
			'No-hydration prerender proof',
			'/alpha-readiness/no-hydration',
			'theme-stable-ssr-html',
			'data-sveltekit-hydrate',
			'set-window-effect',
			'set-progress',
			'clear-progress',
			'lg-ultragear-native-platform-provenance',
			'Effect.Mica',
			'win.startDragging',
			'reportJson',
			'UltraGear bridge reuse map',
			'UltraGear source parity',
			'Reusable UltraGear desktop shell binding',
			'data-desktop-shell-ui-binding',
			'desktopShellUiBinding',
			'@scriptgpt/desktop-shell-ui',
			'installSvelteKitPhpNativeHost',
			'enableMicaWindowChrome',
			'syncTaskbarProgress',
			'toggleWindowMaximize',
			'UltraGear progress and report handoff',
			'progressReportHandoff',
			'statusMapping',
			'ProgressBarStatus.None',
			'report-ready',
			'keywordSearchGraph',
			'analytics-linked-keyword-graph',
			'curated-signal-score',
			'collected-demand-score',
			'directional-community-signal',
			'no-live-community-api-runtime-boundary',
			'source-to-keyword-edge',
			'Evidence trust model',
			'Hosted deployment smoke'
		]
	},
	{
		name: 'alpha release notes',
		path: 'alpha-readiness/release-notes.md',
		expectedContentType: 'text/markdown',
		requiredText: [
			expectedVersion,
			'Runtime evidence endpoints',
			'Evidence trust model',
			'/alpha-readiness/release-checklist.md',
			'release-checklist-markdown-endpoint',
			'alpha-over-rc-release-policy',
			'track 1.0.2-alpha',
			'rank above-rc',
			'Project-rank policy',
			'1.0.2-alpha is the required pre-stable release label',
			'SemVer note',
			'RC, latest, and stable channels remain disallowed',
			'Alpha proof ledger',
			'alpha-runtime-gate-ledger',
			'hosted-php-smoke-proof-required',
			'Hard proof blockers',
			'hardProofBlockers',
			'packed-consumer-install-import-proof',
			'source-to-generated-bundle-check',
			'real-native-host-wrapper-smoke-required',
			'nativePlatformProvenance',
			'lg-ultragear-native-platform-provenance',
			'windowChromeState',
			'data-window-chrome-state',
			'transparent-webview-material-boundary',
			'webview.setBackgroundColor([0, 0, 0, 0])',
			'macos-material-host-policy',
			'source-observed-macos-host-scaffold',
			'macos-native-vibrancy-unverified',
			'ALPHA_SMOKE_BASE_URL'
		]
	},
	{
		name: 'alpha release checklist',
		path: 'alpha-readiness/release-checklist.md',
		expectedContentType: 'text/markdown',
		requiredText: [
			expectedVersion,
			'1.0.2-alpha release checklist',
			'alpha-over-rc-release-policy',
			'desktop-shell-ui-command-mapping',
			'windowChromeState',
			'mica-active',
			'mica-inactive',
			'plain',
			'webview.setBackgroundColor([0, 0, 0, 0])',
			'data-window-chrome-state',
			'data-window-chrome-state="mica-active"',
			'transparent-webview-material-boundary',
			'data-transparent-webview-material-boundary="host-owned"',
			'community-analytics-csv-linkage',
			'router-path-safety-artifact-sync',
			'adapter-platform-emulation',
			'deploy-env-preflight-safety',
			'bun run alpha:gate',
			'bun run alpha:gate:hosted',
			'getDesktopShellUiCommandMapping',
			'sourceToKeywordEdge',
			'weighted_demand_score',
			'ALPHA_SMOKE_BASE_URL',
			'Hard proof blockers',
			'hardProofBlockers',
			'packed-consumer-install-import-proof',
			'source-to-generated-bundle-check',
			'real-native-host-wrapper-smoke-required'
		]
	},
	{
		name: 'alpha readiness html report',
		path: 'alpha-readiness/report.html',
		expectedContentType: 'text/html',
		requiredText: [
			expectedVersion,
			'Native-styled release report',
			'app-window',
			'theme-ultragear',
			'data-window-effect="mica"',
			'data-window-focused="true"',
			'data-window-chrome-state="mica-active"',
			'data-transparent-webview-material-boundary="host-owned"',
			'transparent-webview-material-boundary',
			'data-ultragear-html-report-shell',
			'topbar-drag-strip',
			'data-window-drag',
			'data-drag-block-selector',
			'data-no-window-drag',
			'data-window-control-group',
			'caption-button',
			'data-window-control="maximize"',
			'--blur-mica',
			'--surface-chrome',
			'--window-bg-mica',
			'--window-bg-inactive',
			'--window-wash-inactive',
			'--caption-hover-bg',
			'max-width: 1180px',
			'max-width: 860px',
			'Release policy',
			'alpha-over-rc-release-policy',
			'1.0.2-alpha',
			'above-rc',
			'Alpha proof ledger',
			'alpha-runtime-gate-ledger',
			'hosted-php-smoke-proof-required',
			'Hard proof blockers',
			'data-hard-proof-blocker',
			'packed-consumer-install-import-proof',
			'source-to-generated-bundle-check',
			'real-native-host-wrapper-smoke-required',
			'UltraGear source parity',
			'Reusable UltraGear desktop shell binding',
			'data-desktop-shell-ui-binding',
			'desktopShellUiBinding',
			'@scriptgpt/desktop-shell-ui',
			'installSvelteKitPhpNativeHost',
			'enableMicaWindowChrome',
			'syncTaskbarProgress',
			'toggleWindowMaximize',
			'UltraGear native platform provenance',
			'data-native-platform-provenance',
			'data-native-host-handoff-controls',
			'No-hydration prerender proof',
			'data-no-hydration-prerender-proof',
			'theme-stable-ssr-html',
			'data-sveltekit-hydrate',
			'desktopShellUiBinding',
			'@scriptgpt/desktop-shell-ui',
			'installSvelteKitPhpNativeHost',
			'enableMicaWindowChrome',
			'syncTaskbarProgress',
			'toggleWindowMaximize',
			'set-window-effect',
			'set-progress',
			'clear-progress',
			'lg-ultragear-native-platform-provenance',
			'Effect.Mica',
			'win.startDragging',
			'reportJson',
			'UltraGear progress and report handoff',
			'progressReportHandoff',
			'statusMapping',
			'ProgressBarStatus.None',
			'report-ready',
			'keywordSearchGraph',
			'analytics-linked-keyword-graph',
			'curated-signal-score',
			'collected-demand-score',
			'directional-community-signal',
			'no-live-community-api-runtime-boundary',
			'alpha-community-source-evidence-checklist',
			'source-health-classification',
			'result-total-field-contract',
			'top-result-field-contract',
			'sample-review-rule',
			'resultTotalField',
			'topResultFields',
			'sampleReviewRule',
			'releaseUse',
			'blockedOutcomePolicy',
			'source-to-keyword-edge',
			'Evidence trust model',
			'Hosted deployment smoke'
		]
	},
	{
		name: 'alpha readiness graphic',
		path: 'alpha-readiness/report.svg',
		expectedContentType: 'image/svg+xml',
		requiredText: [
			'alpha readiness graphic',
			'data-required-alpha-evidence',
			'Required alpha evidence',
			'requiredEvidence',
			'required-alpha-evidence',
			'native-host-binding-guide',
			'desktop-shell-ui-command-mapping',
			'csr-disabled-prerender-contract',
			'windows-11-mica-browser-safe-shell',
			'macos-style-native-titlebar-rhythm',
			'alpha-readiness-report-graphics',
			'community-keyword-search-graph',
			'community-analytics-freshness-contract',
			'community-analytics-csv-linkage',
			'router-path-safety-artifact-sync',
			'adapter-platform-emulation',
			'deploy-env-preflight-safety',
			'hosted-php-smoke-proof',
			'Windows 11 Mica',
			'source-observed macOS host policy',
			'macos-vibrancy-host-policy',
			'macos-vibrancy-visual-row',
			'macos-material-host-policy',
			'source-observed-macos-host-scaffold',
			'macos-native-vibrancy-unverified',
			'data-macos-material-host-policy',
			'data-macos-native-vibrancy',
			'native-window-action',
			'progressReportHandoff',
			'statusMapping',
			'ProgressBarStatus.Indeterminate',
			'ProgressBarStatus.None',
			'report-ready',
			'Community signals',
			'hosted smoke:',
			'trust model:',
			'data-alpha-proof-ledger',
			'proofLedger',
			'proofLedger blockers',
			'alpha-over-rc-release-policy',
			'analytics-linked-keyword-graph',
			'alpha-runtime-gate-ledger',
			'hosted-php-smoke-proof-required',
			'needs-local-gate-proof',
			'needs-hosted-proof',
			'data-native-platform-provenance',
			'data-native-host-handoff-controls',
			'windowChromeState',
			'data-window-chrome-state',
			'transparent-webview-material-boundary',
			'webview.setBackgroundColor([0, 0, 0, 0])',
			'set-window-effect',
			'set-progress',
			'clear-progress',
			'lg-ultragear-native-platform-provenance',
			'Effect.Mica',
			'win.setEffects',
			'app-window.maximized',
			'theme-ultragear',
			'setPointerCapture',
			'lostpointercapture',
			'win.startDragging',
			'reportJson'
		]
	},
	{
		name: 'alpha community source map graphic',
		path: 'alpha-readiness/community-source-map.svg',
		expectedContentType: 'image/svg+xml',
		requiredText: [
			'community source map',
			'supported-json-api',
			'manual-research-link',
			'keyword-search-graph',
			'analytics-linked-keyword-graph',
			'community-analytics-freshness-contract',
			'source-to-keyword-edge',
			'supported-api-lanes',
			'manual-research-lanes',
			'curated-signal-score',
			'collected-demand-score',
			'directional-community-signal',
			'no-live-community-api-runtime-boundary',
			'alpha-community-source-evidence-checklist',
			'source-health-classification',
			'result-total-field-contract',
			'top-result-field-contract',
			'sample-review-rule',
			'resultTotalField',
			'topResultFields',
			'sampleReviewRule',
			'api.github.com/search',
			'evidence kind',
			'collection risk'
		]
	},
	{
		name: 'alpha release manifest',
		path: 'alpha-readiness/release-manifest.json',
		expectedContentType: 'application/json',
		requiredText: [
			expectedVersion,
			'release-manifest-json-endpoint',
			'alphaReleaseChecklist',
			'source-controlled-release-documentation',
			'docs/ALPHA-RELEASE-CHECKLIST.md',
			'release-checklist-markdown-endpoint',
			'/alpha-readiness/release-checklist.md',
			'report/alpha-release-checklist.md',
			'alpha:gate:hosted',
			'trustModel',
			'releasePolicy',
			'proofLedger',
			'alpha-over-rc-release-policy',
			'1.0.2-alpha',
			'above-rc',
			'projectRankPolicy',
			'semverNote',
			'disallowedCandidateLabels',
			'mustNotUseCandidateLabels',
			'releasePolicyProof',
			'alpha-runtime-gate-ledger',
			'hosted-php-smoke-proof-required',
			'hostedProofInterpretation',
			'hosted-php-smoke-proof',
			'alphaEvidenceStatus',
			'real-php-host-smoke-evidence',
			'hostedSmokeStatus',
			'proofStage',
			'evidenceSurfaces',
			'nativeChromeVisualContract',
			'nativeVisualMatrix',
			'macos-vibrancy-host-policy',
			'macos-vibrancy-visual-row',
			'macos-material-host-policy',
			'source-observed-macos-host-scaffold',
			'macos-native-vibrancy-unverified',
			'ultraGearSourceParity',
			'nativePlatformProvenance',
			'windowChromeState',
			'mica-active',
			'mica-inactive',
			'plain',
			'webview.setBackgroundColor([0, 0, 0, 0])',
			'data-window-chrome-state',
			'data-window-chrome-state="mica-active"',
			'transparent-webview-material-boundary',
			'data-transparent-webview-material-boundary="host-owned"',
			'lg-ultragear-native-platform-provenance',
			'progressReportHandoff',
			'progressReportGraphic',
			'nativeHostBridgeStatus',
			'nativeHostBindingGuide',
			'communityKeywordSearchGraph',
			'communityAnalyticsFreshnessContract',
			'requiredEvidence',
			'native-host-binding-guide',
			'desktop-shell-ui-command-mapping',
			'csr-disabled-prerender-contract',
			'windows-11-mica-browser-safe-shell',
			'macos-style-native-titlebar-rhythm',
			'alpha-readiness-report-graphics',
			'community-keyword-search-graph',
			'community-analytics-freshness-contract',
			'community-analytics-csv-linkage',
			'router-path-safety-artifact-sync',
			'adapter-platform-emulation',
			'deploy-env-preflight-safety',
			'hosted-php-smoke-proof',
			'communityEvidenceLedger',
			'hardProofBlockers',
			'hard-proof-blocker-ledger',
			'packed-consumer-install-import-proof',
			'source-to-generated-bundle-check',
			'real-native-host-wrapper-smoke-required'
		]
	},
	{
		name: 'alpha bridge reuse inventory',
		path: 'alpha-readiness/bridge-reuse.json',
		expectedContentType: 'application/json',
		requiredText: [
			expectedVersion,
			'lg-ultragear-bridge',
			'NativeWindowShell.svelte',
			'NativeHostBridgeStatus.svelte',
			'native-host-event-bridge.ts',
			'set-window-effect',
			'set-progress',
			'clear-progress',
			'setWindowEffect',
			'setProgress',
			'clearProgress',
			'reportReady',
			'ValidationView.svelte',
			'ultraGearParityContract',
			'nativeVisualMatrix',
			'native-visual-matrix',
			'native-host-compatibility-matrix',
			'source-observed-host-compatibility-contract',
			'macos-material-host-policy',
			'source-observed-macos-host-scaffold',
			'macos-native-vibrancy-unverified',
			'packages/ultragear-widget-ui/src/app.ts',
			'features.micaSupported',
			'windowChromeState',
			'mica-active',
			'mica-inactive',
			'plain',
			'webview.setBackgroundColor([0, 0, 0, 0])',
			'data-window-chrome-state',
			'data-window-chrome-state="mica-active"',
			'transparent-webview-material-boundary',
			'data-transparent-webview-material-boundary="host-owned"',
			'ShellFeatureProbe.mica_supported',
			'current_shell_features()',
			'cfg!(target_os = "windows")',
			'windows-mica-effects',
			'taskbar-progress-reporting',
			'native-titlebar-drag-maximize',
			'progressReportHandoff',
			'packages/desktop-shell-ui/src/index.ts',
			'desktopShellUiBinding',
			'installSvelteKitPhpNativeHost',
			'@scriptgpt/desktop-shell-ui',
			'enableMicaWindowChrome',
			'syncTaskbarProgress',
			'toggleWindowMaximize',
			'data-drag-block-selector',
			'caption-button',
			'progressStatus',
			'indeterminate',
			'applyWindowChrome',
			'syncWindowProgress',
			'ProgressBarStatus.Indeterminate',
			'ProgressBarStatus.None',
			'report-ready',
			'DRAG_START_THRESHOLD_PX',
			'Structured report preview',
			'lg-ultragear-native-platform-provenance',
			'MacosLauncher::LaunchAgent',
			'mica_supported: cfg!(target_os = "windows")',
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
			'data-window-material',
			'data-native-platform-mode',
			'hybrid-proof',
			'[data-no-window-drag]',
			'dragBlockSelector',
			'setPointerCapture',
			'lostpointercapture',
			'window blur drag cancellation',
			'win.startDragging',
			'win.setProgressBar',
			'reportJson',
			'reportUrl',
			'pointerdown',
			'native-window-action',
			'__SVELTEKIT_PHP_NATIVE_HOST__',
			'browser-fallback'
		]
	},
	{
		name: 'alpha reviewer index',
		path: 'alpha-readiness/review-index.md',
		expectedContentType: 'text/markdown',
		requiredText: [
			expectedVersion,
			'alpha reviewer index',
			'Release documentation artifacts',
			'/alpha-readiness/release-checklist.md',
			'report/alpha-release-checklist.md',
			'Windows 11 Mica',
			'ultraGearParityContract',
			'lg-ultragear-native-platform-provenance',
			'windowChromeState',
			'data-window-chrome-state',
			'transparent-webview-material-boundary',
			'webview.setBackgroundColor([0, 0, 0, 0])',
			'macos-material-host-policy',
			'source-observed-macos-host-scaffold',
			'macos-native-vibrancy-unverified',
			'Effect.Mica',
			'win.startDragging',
			'reportJson',
			'progressReportHandoff',
			'ProgressBarStatus.Indeterminate',
			'ProgressBarStatus.None',
			'statusMapping',
			'report-ready',
			'keywordSearchGraph',
			'analytics-linked-keyword-graph',
			'curated-signal-score',
			'collected-demand-score',
			'directional-community-signal',
			'no-live-community-api-runtime-boundary',
			'community-source-map.svg',
			'alpha-over-rc-release-policy',
			'releasePolicy.channel=alpha',
			'releasePolicy.track=1.0.2-alpha',
			'releasePolicy.rank=above-rc',
			'projectRankPolicy=above-rc',
			'alphaOverRcPolicyProof',
			'getDesktopShellUiCommandMapping',
			'nativeHostBridgeMapping',
			'desktopShellUiHelper',
			'desktopShellUiEvidence',
			'Alpha proof ledger',
			'alpha-runtime-gate-ledger',
			'hosted-php-smoke-proof-required',
			'ALPHA_SMOKE_BASE_URL'
		]
	},
	{
		name: 'alpha gate matrix',
		path: 'alpha-readiness/gate-matrix.json',
		expectedContentType: 'application/json',
		requiredText: [
			expectedVersion,
			'local-alpha-gate',
			'hosted-alpha-gate',
			'live-evidence-surfaces',
			'data-desktop-shell-ui-binding',
			'desktopShellUiBinding',
			'@scriptgpt/desktop-shell-ui',
			'installSvelteKitPhpNativeHost',
			'enableMicaWindowChrome',
			'syncTaskbarProgress',
			'toggleWindowMaximize',
			'data-drag-block-selector',
			'caption-button',
			'progressStatus',
			'indeterminate',
			'sourceToKeywordEdge',
			'analyticsLinkageMarker',
			'weightedDemandScore',
			'freshnessMaxAgeHours',
			'trustBoundary',
			'manualReviewRequired',
			'required-alpha-evidence',
			'requiredEvidence',
			'native-host-binding-guide',
			'desktop-shell-ui-command-mapping',
			'csr-disabled-prerender-contract',
			'windows-11-mica-browser-safe-shell',
			'macos-style-native-titlebar-rhythm',
			'alpha-readiness-report-graphics',
			'community-keyword-search-graph',
			'community-analytics-freshness-contract',
			'community-analytics-csv-linkage',
			'router-path-safety-artifact-sync',
			'adapter-platform-emulation',
			'deploy-env-preflight-safety',
			'hosted-php-smoke-proof',
			'release-policy-evidence-boundary',
			'live-runtime-surface-proof',
			'artifact-sync',
			'report/alpha-bridge-reuse.json',
			'report/alpha-release-checklist.md',
			'/alpha-readiness/release-checklist.md',
			'native platform provenance',
			'Native platform provenance markers',
			'Desktop shell helper binding markers',
			'report/alpha-readiness.json',
			'ALPHA_SMOKE_BASE_URL',
			'proofStages',
			'hardProofBlockers',
			'hard-proof-blocker-ledger',
			'packed-consumer-install-import-proof',
			'source-to-generated-bundle-check',
			'real-native-host-wrapper-smoke-required'
		]
	},
	{
		name: 'alpha evidence index',
		path: 'alpha-readiness/evidence-index.json',
		expectedContentType: 'application/json',
		requiredText: [
			expectedVersion,
			'image/svg+xml',
			'alpha-remote-smoke.json',
			'liveEvidenceSurfaces',
			'alpha-release-checklist',
			'docs/ALPHA-RELEASE-CHECKLIST.md',
			'/alpha-readiness/release-checklist.md',
			'report/alpha-release-checklist.md',
			'native-host-bridge-status',
			'data-native-host-handoff-controls',
			'native-visual-matrix',
			'lg-ultragear-native-platform-provenance',
			'windowChromeState',
			'mica-active',
			'mica-inactive',
			'plain',
			'webview.setBackgroundColor([0, 0, 0, 0])',
			'data-window-chrome-state',
			'data-window-chrome-state="mica-active"',
			'transparent-webview-material-boundary',
			'data-transparent-webview-material-boundary="host-owned"',
			'progress-report-handoff',
			'progress-report-graphic',
			'required-alpha-evidence',
			'requiredEvidence',
			'native-host-binding-guide',
			'desktop-shell-ui-command-mapping',
			'csr-disabled-prerender-contract',
			'windows-11-mica-browser-safe-shell',
			'macos-style-native-titlebar-rhythm',
			'alpha-readiness-report-graphics',
			'community-keyword-search-graph',
			'community-analytics-freshness-contract',
			'community-analytics-csv-linkage',
			'router-path-safety-artifact-sync',
			'adapter-platform-emulation',
			'deploy-env-preflight-safety',
			'hosted-php-smoke-proof',
			'projectRankPolicy',
			'disallowedCandidateLabels',
			'mustNotUseCandidateLabels',
			'getDesktopShellUiCommandMapping',
			'nativeHostBridgeMapping',
			'desktopShellUiHelper',
			'desktopShellUiEvidence',
			'community-evidence-coverage-ledger',
			'data-native-host-bridge-status',
			'data-native-host-handoff-controls',
			'ALPHA_SMOKE_BASE_URL',
			'trustModel'
		]
	},
	{
		name: 'alpha package contract',
		path: 'alpha-readiness/package-contract.json',
		expectedContentType: 'application/json',
		requiredText: [
			expectedVersion,
			'sveltekit-php',
			'sveltekit-php/adapter',
			'alpha:consumer:smoke',
			'publishConfig',
			'alpha-over-rc-release-policy',
			'above-rc',
			'projectRankPolicy',
			'disallowedCandidateLabels',
			'mustNotUseCandidateLabels',
			'alphaOverRcPolicyProof',
			'verify:artifacts',
			'precheck:deploy',
			'source-to-generated-bundle-check',
			'environment-preflight-check',
			'alphaReleaseChecklistProof',
			'windowChromeState',
			'mica-active',
			'mica-inactive',
			'plain',
			'webview.setBackgroundColor([0, 0, 0, 0])',
			'data-window-chrome-state',
			'data-window-chrome-state="mica-active"',
			'transparent-webview-material-boundary',
			'data-transparent-webview-material-boundary="host-owned"',
			'macos-material-host-policy',
			'source-observed-macos-host-scaffold',
			'macos-native-vibrancy-unverified',
			'/alpha-readiness/release-checklist.md',
			'report/alpha-release-checklist.md',
			'src/lib/alpha-release-checklist.ts',
			'TaskbarProgressState',
			'toDesktopShellUiTaskbarProgressState',
			'native-host-wrapper-probe',
			'saveInFlight',
			'refreshInFlight',
			'hasQueuedSave',
			'bindColorSchemeWatcher',
			'prefersDarkMode',
			'window.matchMedia("(prefers-color-scheme: dark)")',
			'app-window.maximized',
			'theme-ultragear',
			'setPointerCapture',
			'lostpointercapture',
			'nativePlatformProvenanceProof',
			'lg-ultragear-native-platform-provenance',
			'nativeHostBindingGuideProof',
			'native host binding guide',
			'noHydrationPrerenderProof',
			'csr-disabled-prerender-contract',
			'theme-stable-ssr-html',
			'/alpha-readiness/native-host-guide.md',
			'report/alpha-native-host-guide.md',
			'nativeHostWrapperSmokeProof',
			'real-host-permission-checklist',
			'deterministic-host-wrapper-handoff',
			'realHostVerified',
			'noNativeApiBoundary',
			'window.__SVELTEKIT_PHP_NATIVE_HOST__',
			'/alpha-readiness/native-host-wrapper-smoke.json',
			'report/alpha-native-host-wrapper-smoke.json',
			'native-host-wrapper-smoke',
			'docs/ALPHA-RELEASE-CHECKLIST.md',
			'requiredEvidence',
			'native-host-binding-guide',
			'desktop-shell-ui-command-mapping',
			'csr-disabled-prerender-contract',
			'windows-11-mica-browser-safe-shell',
			'macos-style-native-titlebar-rhythm',
			'alpha-readiness-report-graphics',
			'community-keyword-search-graph',
			'community-analytics-freshness-contract',
			'community-analytics-csv-linkage',
			'router-path-safety-artifact-sync',
			'adapter-platform-emulation',
			'deploy-env-preflight-safety',
			'hosted-php-smoke-proof',
			'set-window-effect',
			'set-progress',
			'clear-progress',
			'report-ready'
		]
	},
	{
		name: 'alpha native host contract',
		path: 'alpha-readiness/native-host-contract.json',
		expectedContentType: 'application/json',
		requiredText: [
			expectedVersion,
			'Windows 11 Mica',
			'macOS traffic-light',
			'data-window-drag',
			'data-native-host-bridge-status',
			'visualSnapshotContract',
			'nativeVisualMatrix',
			'native-visual-matrix',
			'windows-mica-visual-row',
			'macos-traffic-light-row',
			'macos-vibrancy-visual-row',
			'macos-vibrancy-host-policy',
			'macos-material-host-policy',
			'source-observed-macos-host-scaffold',
			'macos-native-vibrancy-unverified',
			'windows-caption-control-row',
			'ultragear-theme-row',
			'browser-fallback-visual-row',
			'ultraGearSourceParity',
			'progressReportHandoff',
			'desktopShellUiBinding',
			'packages/desktop-shell-ui/src/index.ts',
			'packages/ultragear-widget-ui/src/app.ts',
			'native-host-compatibility-matrix',
			'source-observed-host-compatibility-contract',
			'features.micaSupported',
			'windowChromeState',
			'mica-active',
			'mica-inactive',
			'plain',
			'webview.setBackgroundColor([0, 0, 0, 0])',
			'data-window-chrome-state',
			'data-window-chrome-state="mica-active"',
			'transparent-webview-material-boundary',
			'data-transparent-webview-material-boundary="host-owned"',
			'ShellFeatureProbe.mica_supported',
			'current_shell_features()',
			'cfg!(target_os = "windows")',
			'windows-mica-effects',
			'taskbar-progress-reporting',
			'native-titlebar-drag-maximize',
			'@scriptgpt/desktop-shell-ui',
			'getDesktopShellUiCommandMapping',
			'nativeHostBridgeMapping',
			'detailFields',
			'win.startDragging()',
			'host.reportReady',
			'enableMicaWindowChrome',
			'syncTaskbarProgress',
			'toggleWindowMaximize',
			'applyWindowChrome',
			'syncWindowProgress',
			'ProgressBarStatus.Indeterminate',
			'macOS traffic lights',
			'native-window-action',
			'toggle-maximize',
			'set-window-effect',
			'set-progress',
			'clear-progress',
			'report-ready',
			'setWindowEffect',
			'setProgress',
			'clearProgress',
			'reportReady',
			'__SVELTEKIT_PHP_NATIVE_HOST__',
			'__SVELTEKIT_PHP_NATIVE_HOST_HISTORY__',
			'installSvelteKitPhpNativeHost',
			'enableMicaWindowChrome',
			'syncTaskbarProgress',
			'toggleWindowMaximize',
			'data-drag-block-selector',
			'caption-button',
			'progressStatus',
			'indeterminate',
			'theme-ultragear',
			'tauriImportsAllowed'
		]
	},
	{
		name: 'alpha native host guide',
		path: 'alpha-readiness/native-host-guide.md',
		expectedContentType: 'text/markdown',
		requiredText: [
			expectedVersion,
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
			'packages/desktop-shell-ui/src/index.ts',
			'packages/ultragear-widget-ui/src/app.ts',
			'@scriptgpt/desktop-shell-ui',
			'getDesktopShellUiCommandMapping',
			'enableMicaWindowChrome',
			'syncTaskbarProgress',
			'toggleWindowMaximize',
			'TaskbarProgressState',
			'toDesktopShellUiTaskbarProgressState',
			'native-host-wrapper-probe',
			'saveInFlight',
			'refreshInFlight',
			'hasQueuedSave',
			'Effect.Mica',
			'win.setProgressBar',
			'reportJson',
			'native-host-wrapper-event-replay',
			'native-host-wrapper-event-replay-step',
			'eventReplayTranscript[]',
			'expectedHistoryResult',
			'expectedDesktopShellUiHelper',
			'noFallbackAllowedForRealHost'
		]
	},
	{
		name: 'alpha native host wrapper smoke',
		path: 'alpha-readiness/native-host-wrapper-smoke.json',
		expectedContentType: 'application/json',
		requiredText: [
			expectedVersion,
			'native-host-wrapper-smoke',
			'native-host-wrapper-probe',
			'contract-ready',
			'native-host-wrapper-event-replay',
			'native-host-wrapper-event-replay-step',
			'realHostVerified',
			'buildNativeHostWrapperProbe',
			'toDesktopShellUiTaskbarProgressState',
			'enableMicaWindowChrome',
			'syncTaskbarProgress',
			'toggleWindowMaximize',
			'TaskbarProgressState',
			'set-window-effect',
			'set-progress',
			'clear-progress',
			'report-ready',
			'expectedHistoryResult',
			'expectedDesktopShellUiHelper',
			'window.__SVELTEKIT_PHP_NATIVE_HOST_HISTORY__',
			'noFallbackAllowedForRealHost'
		]
	},
	{
		name: 'alpha hosted smoke checklist',
		path: 'alpha-readiness/hosted-smoke-checklist.json',
		expectedContentType: 'application/json',
		requiredText: [
			expectedVersion,
			'requires-external-host',
			'ALPHA_SMOKE_BASE_URL',
			'alpha-remote-smoke.json',
			'contentExpectations',
			'data-window-chrome-state="mica-active"',
			'data-transparent-webview-material-boundary="host-owned"',
			'transparent-webview-material-boundary',
			'windowChromeState',
			'macos-material-host-policy',
			'source-observed-macos-host-scaffold',
			'macos-native-vibrancy-unverified',
			'/alpha-readiness/release-checklist.md',
			'1.0.2-alpha release checklist',
			'alpha-over-rc-release-policy',
			'desktop-shell-ui-command-mapping',
			'community-analytics-csv-linkage',
			'router-path-safety-artifact-sync',
			'adapter-platform-emulation',
			'deploy-env-preflight-safety',
			'hosted-php-smoke-proof',
			'alphaReleaseChecklistProof',
			'report/alpha-release-checklist.md',
			'native-window-action',
			'native-host-wrapper-event-replay',
			'expectedHistoryResult',
			'noFallbackAllowedForRealHost',
			'live-evidence-surfaces',
			'liveEvidenceSurfaces',
			'hardProofBlockers',
			'hard-proof-blocker-ledger',
			'packed-consumer-install-import-proof',
			'source-to-generated-bundle-check',
			'real-native-host-wrapper-smoke-required'
		]
	},
	{
		name: 'alpha community signals json',
		path: 'alpha-readiness/community-signals.json',
		expectedContentType: 'application/json',
		requiredText: [expectedVersion, 'SvelteKit PHP adapter shared hosting', 'GitHub repos']
	},
	{
		name: 'alpha community analytics markdown',
		path: 'alpha-readiness/community-analytics.md',
		expectedContentType: 'text/markdown',
		requiredText: [
			expectedVersion,
			'community analytics',
			'bun run alpha:analytics',
			'Source coverage plan',
			'Evidence kinds',
			'community-analytics-freshness-contract',
			'Keyword research map',
			'Reviewer action:'
		]
	},
	{
		name: 'alpha community research pack',
		path: 'alpha-readiness/community-research-pack.json',
		expectedContentType: 'application/json',
		requiredText: [
			expectedVersion,
			'supported-json-api',
			'manual-research-link',
			'providerCoverage',
			'evidenceKindCoverage',
			'collectionPlan',
			'sourceToKeywordEdge',
			'analyticsLinkageMarker',
			'weightedDemandScore',
			'freshnessMaxAgeHours',
			'trustBoundary',
			'manualReviewRequired',
			'alpha-community-source-evidence-checklist',
			'source-health-classification',
			'result-total-field-contract',
			'top-result-field-contract',
			'sample-review-rule',
			'resultTotalField',
			'topResultFields',
			'sampleReviewRule',
			'analyticsFreshnessContract',
			'community-analytics-freshness-contract',
			'maxAgeHours',
			'community-analytics-graphic-linkage-contract',
			'communityAnalyticsGraphicLinkageContract',
			'community-source-map.svg',
			'community-analytics.md',
			'community-signals.csv',
			'community-sources.csv',
			'curated-signal-score',
			'collected-demand-score',
			'directional-community-signal',
			'no-live-community-api-runtime-boundary'
		]
	},
	{
		name: 'alpha readiness csv',
		path: 'alpha-readiness/readiness.csv',
		expectedContentType: 'text/csv',
		requiredText: [
			'runtime-correctness',
			'Hosted deployment evidence',
			'proof-ledger',
			'required-evidence',
			'requiredEvidence',
			'required-alpha-evidence',
			'native-host-binding-guide',
			'desktop-shell-ui-command-mapping',
			'csr-disabled-prerender-contract',
			'windows-11-mica-browser-safe-shell',
			'macos-style-native-titlebar-rhythm',
			'alpha-readiness-report-graphics',
			'community-keyword-search-graph',
			'community-analytics-freshness-contract',
			'community-analytics-csv-linkage',
			'router-path-safety-artifact-sync',
			'adapter-platform-emulation',
			'deploy-env-preflight-safety',
			'hosted-php-smoke-proof',
			'alpha-over-rc-release-policy',
			'native-visual-matrix',
			'analytics-linked-keyword-graph',
			'alpha-runtime-gate-ledger',
			'hosted-php-smoke-proof-required'
		]
	},
	{
		name: 'alpha community signals csv',
		path: 'alpha-readiness/community-signals.csv',
		expectedContentType: 'text/csv',
		requiredText: [
			'shared-hosting',
			'GitHub repos:',
			'analytics-linked-keyword-graph',
			'weighted_demand_score',
			'source_to_keyword_edges',
			'curated-signal-score',
			'collected-demand-score',
			'directional-community-signal'
		]
	},
	{
		name: 'alpha community sources csv',
		path: 'alpha-readiness/community-sources.csv',
		expectedContentType: 'text/csv',
		requiredText: [
			'source_host',
			'evidence_kind',
			'collection_risk',
			'collection_method',
			'freshness_max_age_hours',
			'evidence_weight',
			'trust_boundary',
			'source_health',
			'analytics_linkage_marker',
			'alpha_evidence_checklist_marker',
			'alpha_evidence_checklist',
			'source_to_keyword_edge',
			'manual_review_required',
			'release_use',
			'reviewer_action',
			'blocked_outcome_policy',
			'result_total_field',
			'top_result_fields',
			'sample_review_rule',
			'api.github.com/search',
			'manual-research-link',
			'analytics-linked-keyword-graph'
		]
	},
	{
		name: 'form route',
		path: 'form-basic',
		expectedContentType: 'text/html',
		expectedHeaders: {
			'x-sveltekit-php-page-mode': 'client-fallback',
			'x-sveltekit-php-ssr': 'unsupported-in-php-static'
		},
		requiredText: ['form']
	}
];

const formActionChecks = [
	{
		name: 'form route default action',
		path: 'form-basic',
		form: {
			val: 'alpha-remote-smoke'
		},
		expectedContentType: 'application/json',
		requiredText: ['alpha-remote-smoke', 'success']
	}
];

const traversalProbes = [
	'%2e%2e/package.json',
	'..%2Fpackage.json',
	'%2e%2e/.env',
	'..%2F.env',
	'_app/%2e%2e/%2e%2e/package.json'
];

const assetFallbackProbes = [
	'_app/immutable/missing-alpha-smoke.js',
	'_app/immutable/missing-alpha-smoke.css',
	'alpha-readiness/missing-alpha-smoke.svg',
	'alpha-readiness/missing-alpha-smoke.webmanifest',
	'alpha-readiness/missing-alpha-smoke.wasm',
	'alpha-readiness/missing-alpha-smoke.json'
];

const forbiddenLeakMarkers = [
	'"name": "sveltekit-php"',
	'"scripts"',
	'DEPLOY_HOST=',
	'DEPLOY_USER=',
	'DEPLOY_REMOTE=',
	'<?php'
];

function fail(message) {
	console.error(message);
	process.exit(1);
}

async function writeSmokeReport(report) {
	await mkdir(path.dirname(reportPath), { recursive: true });
	await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
	console.log(`Remote alpha smoke report written to ${path.relative(repoRoot, reportPath)}`);
}

function normalizeBaseUrl(input) {
	let url;
	try {
		url = new URL(input);
	} catch {
		fail('ALPHA_SMOKE_BASE_URL must be a valid absolute HTTP(S) URL.');
	}

	if (!['http:', 'https:'].includes(url.protocol)) {
		fail('ALPHA_SMOKE_BASE_URL must use http or https.');
	}

	if (url.username || url.password) {
		fail('ALPHA_SMOKE_BASE_URL must not embed credentials.');
	}

	url.hash = '';
	url.search = '';
	if (!url.pathname.endsWith('/')) {
		url.pathname = `${url.pathname}/`;
	}

	return url;
}

function safeUrlForLog(url) {
	const copy = new URL(url);
	copy.username = '';
	copy.password = '';
	copy.search = '';
	copy.hash = '';
	return copy.toString();
}

function targetUrl(baseUrl, relativePath) {
	return new URL(relativePath, baseUrl);
}

async function fetchText(url, init = {}) {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const response = await fetch(url, {
			...init,
			headers: {
				'user-agent': 'sveltekit-php-alpha-remote-smoke/1.0',
				...(init.headers ?? {})
			},
			redirect: 'follow',
			signal: controller.signal
		});
		const body = await response.text();
		return {
			body,
			contentType: response.headers.get('content-type') || '',
			headers: response.headers,
			status: response.status,
			url: response.url
		};
	} finally {
		clearTimeout(timeout);
	}
}

function assertTextIncludes(body, requiredText, checkName) {
	const lowered = body.toLowerCase();
	const missing = requiredText.filter((text) => !lowered.includes(text.toLowerCase()));
	if (missing.length > 0) {
		throw new Error(`${checkName} response is missing expected text markers: ${missing.join(', ')}`);
	}
}

function collectJsonSearchText(value, parts = []) {
	if (value === null || value === undefined) {
		return parts;
	}

	if (Array.isArray(value)) {
		for (const item of value) {
			collectJsonSearchText(item, parts);
		}
		return parts;
	}

	if (typeof value === 'object') {
		for (const [key, nestedValue] of Object.entries(value)) {
			parts.push(key);
			collectJsonSearchText(nestedValue, parts);
		}
		return parts;
	}

	parts.push(String(value));
	return parts;
}

function searchableResponseText(body, contentType) {
	if (!contentType.toLowerCase().includes('application/json')) {
		return body;
	}

	try {
		return `${body}\n${collectJsonSearchText(JSON.parse(body)).join('\n')}`;
	} catch {
		return body;
	}
}

function assertTextExcludes(body, forbiddenText = [], checkName) {
	const lowered = body.toLowerCase();
	const present = forbiddenText.filter((text) => lowered.includes(text.toLowerCase()));
	if (present.length > 0) {
		throw new Error(`${checkName} response includes forbidden text markers: ${present.join(', ')}`);
	}
}

function assertContentTypeIncludes(contentType, expectedContentType, checkName) {
	if (!expectedContentType) {
		return;
	}

	if (!contentType.toLowerCase().includes(expectedContentType.toLowerCase())) {
		throw new Error(`${checkName} returned content-type ${contentType || 'missing'}, expected ${expectedContentType}.`);
	}
}

function assertHeadersInclude(headers, expectedHeaders = {}, checkName) {
	for (const [name, expectedValue] of Object.entries(expectedHeaders)) {
		const actualValue = headers.get(name) || '';
		if (!actualValue.toLowerCase().includes(String(expectedValue).toLowerCase())) {
			throw new Error(
				`${checkName} returned header ${name}: ${actualValue || 'missing'}, expected ${expectedValue}.`
			);
		}
	}
}

function assertNoForbiddenLeaks(body, checkName) {
	const leakedMarkers = forbiddenLeakMarkers.filter((marker) => body.includes(marker));

	if (leakedMarkers.length > 0) {
		throw new Error(`${checkName} leaked forbidden markers: ${leakedMarkers.join(', ')}`);
	}
}

async function verifyPage(baseUrl, check) {
	const url = targetUrl(baseUrl, check.path);
	const response = await fetchText(url);

	if (response.status < 200 || response.status >= 300) {
		throw new Error(`${check.name} returned HTTP ${response.status}.`);
	}

	assertContentTypeIncludes(response.contentType, check.expectedContentType, check.name);
	assertHeadersInclude(response.headers, check.expectedHeaders, check.name);
	assertNoForbiddenLeaks(response.body, check.name);
	const searchableBody = searchableResponseText(response.body, response.contentType);
	assertTextIncludes(searchableBody, check.requiredText, check.name);
	assertTextExcludes(searchableBody, check.forbiddenText, check.name);
	console.log(`PASS remote-page: ${check.name} returned HTTP ${response.status} as ${response.contentType || 'unknown content-type'}.`);
	return {
		kind: 'page',
		name: check.name,
		path: check.path,
		status: response.status,
		contentType: response.contentType,
		expectedContentType: check.expectedContentType,
		finalUrl: safeUrlForLog(new URL(response.url)),
		ok: true
	};
}

async function verifyFormAction(baseUrl, check) {
	const url = targetUrl(baseUrl, check.path);
	const response = await fetchText(url, {
		method: 'POST',
		body: new URLSearchParams(check.form),
		headers: {
			accept: 'application/json',
			'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
			'x-sveltekit-action': 'true'
		}
	});

	if (response.status < 200 || response.status >= 300) {
		throw new Error(`${check.name} returned HTTP ${response.status}.`);
	}

	assertContentTypeIncludes(response.contentType, check.expectedContentType, check.name);
	assertNoForbiddenLeaks(response.body, check.name);
	assertTextIncludes(response.body, check.requiredText, check.name);
	console.log(`PASS remote-action: ${check.name} returned HTTP ${response.status} as ${response.contentType || 'unknown content-type'}.`);
	return {
		kind: 'action',
		name: check.name,
		path: check.path,
		status: response.status,
		contentType: response.contentType,
		expectedContentType: check.expectedContentType,
		finalUrl: safeUrlForLog(new URL(response.url)),
		ok: true
	};
}

async function verifyTraversalProbe(baseUrl, probePath) {
	const url = targetUrl(baseUrl, probePath);
	const response = await fetchText(url);

	assertNoForbiddenLeaks(response.body, probePath);
	console.log(`PASS remote-safety: ${probePath} did not expose package/env/source markers.`);
	return {
		kind: 'safety',
		name: probePath,
		path: probePath,
		status: response.status,
		contentType: response.contentType,
		finalUrl: safeUrlForLog(new URL(response.url)),
		ok: true
	};
}

async function verifyAssetFallbackExclusion(baseUrl, probePath) {
	const url = targetUrl(baseUrl, probePath);
	const response = await fetchText(url, {
		headers: {
			accept: '*/*'
		}
	});

	assertNoForbiddenLeaks(response.body, probePath);

	const contentType = response.contentType.toLowerCase();
	const looksLikeHtmlFallback =
		response.status >= 200 &&
		response.status < 300 &&
		contentType.includes('text/html') &&
		(response.body.includes('sveltekit:start') ||
			response.body.includes('SvelteKit') ||
			response.body.includes('alpha-readiness') ||
			response.body.includes('no-hydration-fixture'));

	if (looksLikeHtmlFallback) {
		throw new Error(`${probePath} was served as fallback HTML. Asset-like paths must 404 or return their real MIME type, not route fallback markup.`);
	}

	console.log(`PASS remote-asset-fallback: ${probePath} did not receive route fallback HTML.`);
	return {
		kind: 'asset-fallback-exclusion',
		name: probePath,
		path: probePath,
		status: response.status,
		contentType: response.contentType,
		finalUrl: safeUrlForLog(new URL(response.url)),
		ok: true
	};
}

async function main() {
	if (!Number.isFinite(timeoutMs) || timeoutMs < 1000 || timeoutMs > 60000) {
		fail('ALPHA_SMOKE_TIMEOUT_MS must be between 1000 and 60000.');
	}

	if (forceSkip) {
		console.log('Remote alpha smoke skipped: --skip was provided.');
		await writeSmokeReport({
			target: expectedVersion,
			status: 'skipped',
			checkedAt: new Date().toISOString(),
			reason: 'Remote alpha smoke was intentionally skipped for deterministic local report generation.',
			checks: []
		});
		return;
	}

	if (!baseUrlInput) {
		if (allowMissing) {
			console.log('Remote alpha smoke skipped: ALPHA_SMOKE_BASE_URL is not set.');
			await writeSmokeReport({
				target: expectedVersion,
				status: 'skipped',
				checkedAt: new Date().toISOString(),
				reason: 'ALPHA_SMOKE_BASE_URL is not set.',
				checks: []
			});
			return;
		}
		fail('Set ALPHA_SMOKE_BASE_URL or pass --allow-missing to skip remote alpha smoke.');
	}

	const baseUrl = normalizeBaseUrl(baseUrlInput);
	const checks = [];
	console.log(`Remote alpha smoke target: ${safeUrlForLog(baseUrl)}`);

	try {
		for (const check of pageChecks) {
			checks.push(await verifyPage(baseUrl, check));
			await delay(50);
		}

		for (const check of formActionChecks) {
			checks.push(await verifyFormAction(baseUrl, check));
			await delay(50);
		}

		for (const probePath of traversalProbes) {
			checks.push(await verifyTraversalProbe(baseUrl, probePath));
			await delay(50);
		}

		for (const probePath of assetFallbackProbes) {
			checks.push(await verifyAssetFallbackExclusion(baseUrl, probePath));
			await delay(50);
		}
	} catch (error) {
		await writeSmokeReport({
			target: expectedVersion,
			status: 'failed',
			checkedAt: new Date().toISOString(),
			baseUrl: safeUrlForLog(baseUrl),
			timeoutMs,
			checks,
			failure: error.message
		});
		throw error;
	}

	await writeSmokeReport({
		target: expectedVersion,
		status: 'passed',
		checkedAt: new Date().toISOString(),
		baseUrl: safeUrlForLog(baseUrl),
		timeoutMs,
		checks
	});
	console.log(`Remote alpha smoke passed for ${expectedVersion}.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	await main();
}

