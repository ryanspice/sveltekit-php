import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

const args = new Set(process.argv.slice(2));
const allowMissing = args.has('--allow-missing');
const forceSkip = args.has('--skip');
const expectedVersion = process.env.ALPHA_SMOKE_EXPECTED_VERSION || '1.0.2-alpha.0';
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
			'data-required-alpha-evidence',
			'Required alpha evidence',
			'requiredEvidence',
			'required-alpha-evidence',
			'native-host-binding-guide',
			'desktop-shell-ui-command-mapping',
			'windows-11-mica-browser-safe-shell',
			'macos-style-native-titlebar-rhythm',
			'alpha-readiness-report-graphics',
			'community-keyword-search-graph',
			'community-analytics-freshness-contract',
			'community-analytics-csv-linkage',
			'router-path-safety-artifact-sync',
			'deploy-env-preflight-safety',
			'hosted-php-smoke-proof',
			'data-alpha-proof-ledger',
			'proofLedger',
			'Alpha proof ledger',
			'Release documentation artifacts',
			'docs/ALPHA-RELEASE-CHECKLIST.md',
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
			'source-to-keyword-edge',
			'Community evidence coverage ledger',
			'Open-source analytics sources reviewers can audit first'
		]
	},
	{
		name: 'alpha readiness report',
		path: 'alpha-readiness/report.json',
		expectedContentType: 'application/json',
		requiredText: [
			expectedVersion,
			'releasePolicy',
			'alphaReleaseChecklist',
			'source-controlled-release-documentation',
			'docs/ALPHA-RELEASE-CHECKLIST.md',
			'requiredEvidence',
			'native-host-binding-guide',
			'desktop-shell-ui-command-mapping',
			'windows-11-mica-browser-safe-shell',
			'macos-style-native-titlebar-rhythm',
			'alpha-readiness-report-graphics',
			'community-keyword-search-graph',
			'community-analytics-freshness-contract',
			'community-analytics-csv-linkage',
			'router-path-safety-artifact-sync',
			'deploy-env-preflight-safety',
			'hosted-php-smoke-proof',
			'proofLedger',
			'alpha-over-rc-release-policy',
			'1.0.2-alpha',
			'above-rc',
			'alpha-runtime-gate-ledger',
			'hosted-php-smoke-proof-required'
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
			'windows-11-mica-browser-safe-shell',
			'macos-style-native-titlebar-rhythm',
			'alpha-readiness-report-graphics',
			'community-keyword-search-graph',
			'community-analytics-freshness-contract',
			'community-analytics-csv-linkage',
			'router-path-safety-artifact-sync',
			'deploy-env-preflight-safety',
			'hosted-php-smoke-proof',
			'Alpha proof ledger',
			'alpha-runtime-gate-ledger',
			'hosted-php-smoke-proof-required',
			'UltraGear native platform provenance',
			'data-native-host-handoff-controls',
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
			'nativePlatformProvenance',
			'lg-ultragear-native-platform-provenance',
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
			'community-analytics-csv-linkage',
			'router-path-safety-artifact-sync',
			'deploy-env-preflight-safety',
			'bun run alpha:gate',
			'bun run alpha:gate:hosted',
			'getDesktopShellUiCommandMapping',
			'sourceToKeywordEdge',
			'weighted_demand_score',
			'ALPHA_SMOKE_BASE_URL'
		]
	},
	{
		name: 'alpha readiness html report',
		path: 'alpha-readiness/report.html',
		expectedContentType: 'text/html',
		requiredText: [
			expectedVersion,
			'Native-styled release report',
			'Release policy',
			'alpha-over-rc-release-policy',
			'1.0.2-alpha',
			'above-rc',
			'Alpha proof ledger',
			'alpha-runtime-gate-ledger',
			'hosted-php-smoke-proof-required',
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
			'windows-11-mica-browser-safe-shell',
			'macos-style-native-titlebar-rhythm',
			'alpha-readiness-report-graphics',
			'community-keyword-search-graph',
			'community-analytics-freshness-contract',
			'community-analytics-csv-linkage',
			'router-path-safety-artifact-sync',
			'deploy-env-preflight-safety',
			'hosted-php-smoke-proof',
			'Windows 11 Mica',
			'macOS traffic lights',
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
			'set-window-effect',
			'set-progress',
			'clear-progress',
			'lg-ultragear-native-platform-provenance',
			'Effect.Mica',
			'win.setEffects',
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
			'disallowedCandidateLabels',
			'mustNotUseCandidateLabels',
			'alphaOverRcPolicyProof',
			'Project-rank policy',
			'SemVer note',
			'alpha-runtime-gate-ledger',
			'hosted-php-smoke-proof-required',
			'proofStage',
			'evidenceSurfaces',
			'nativeChromeVisualContract',
			'nativeVisualMatrix',
			'ultraGearSourceParity',
			'nativePlatformProvenance',
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
			'windows-11-mica-browser-safe-shell',
			'macos-style-native-titlebar-rhythm',
			'alpha-readiness-report-graphics',
			'community-keyword-search-graph',
			'community-analytics-freshness-contract',
			'community-analytics-csv-linkage',
			'router-path-safety-artifact-sync',
			'deploy-env-preflight-safety',
			'hosted-php-smoke-proof',
			'communityEvidenceLedger'
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
			'Effect.Mica',
			'win.setEffects',
			'--window-bg-mica',
			'--window-wash-inactive',
			'data-native-platform',
			'data-window-control-group',
			'data-window-material',
			'data-native-platform-mode',
			'hybrid-proof',
			'dragBlockSelector',
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
			'windows-11-mica-browser-safe-shell',
			'macos-style-native-titlebar-rhythm',
			'alpha-readiness-report-graphics',
			'community-keyword-search-graph',
			'community-analytics-freshness-contract',
			'community-analytics-csv-linkage',
			'router-path-safety-artifact-sync',
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
			'proofStages'
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
			'progress-report-handoff',
			'progress-report-graphic',
			'required-alpha-evidence',
			'requiredEvidence',
			'native-host-binding-guide',
			'desktop-shell-ui-command-mapping',
			'windows-11-mica-browser-safe-shell',
			'macos-style-native-titlebar-rhythm',
			'alpha-readiness-report-graphics',
			'community-keyword-search-graph',
			'community-analytics-freshness-contract',
			'community-analytics-csv-linkage',
			'router-path-safety-artifact-sync',
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
			'/alpha-readiness/release-checklist.md',
			'report/alpha-release-checklist.md',
			'src/lib/alpha-release-checklist.ts',
			'TaskbarProgressState',
			'toDesktopShellUiTaskbarProgressState',
			'saveInFlight',
			'refreshInFlight',
			'hasQueuedSave',
			'nativePlatformProvenanceProof',
			'lg-ultragear-native-platform-provenance',
			'nativeHostBindingGuideProof',
			'native host binding guide',
			'/alpha-readiness/native-host-guide.md',
			'report/alpha-native-host-guide.md',
			'docs/ALPHA-RELEASE-CHECKLIST.md',
			'requiredEvidence',
			'native-host-binding-guide',
			'desktop-shell-ui-command-mapping',
			'windows-11-mica-browser-safe-shell',
			'macos-style-native-titlebar-rhythm',
			'alpha-readiness-report-graphics',
			'community-keyword-search-graph',
			'community-analytics-freshness-contract',
			'community-analytics-csv-linkage',
			'router-path-safety-artifact-sync',
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
			'windows-caption-control-row',
			'ultragear-theme-row',
			'browser-fallback-visual-row',
			'ultraGearSourceParity',
			'progressReportHandoff',
			'desktopShellUiBinding',
			'packages/desktop-shell-ui/src/index.ts',
			'packages/ultragear-widget-ui/src/app.ts',
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
			'saveInFlight',
			'refreshInFlight',
			'hasQueuedSave',
			'Effect.Mica',
			'win.setProgressBar',
			'reportJson'
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
			'/alpha-readiness/release-checklist.md',
			'1.0.2-alpha release checklist',
			'alpha-over-rc-release-policy',
			'desktop-shell-ui-command-mapping',
			'community-analytics-csv-linkage',
			'router-path-safety-artifact-sync',
			'deploy-env-preflight-safety',
			'hosted-php-smoke-proof',
			'alphaReleaseChecklistProof',
			'report/alpha-release-checklist.md',
			'native-window-action',
			'live-evidence-surfaces',
			'liveEvidenceSurfaces'
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
			'directional-community-signal'
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
			'windows-11-mica-browser-safe-shell',
			'macos-style-native-titlebar-rhythm',
			'alpha-readiness-report-graphics',
			'community-keyword-search-graph',
			'community-analytics-freshness-contract',
			'community-analytics-csv-linkage',
			'router-path-safety-artifact-sync',
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
			'analytics_linkage_marker',
			'source_to_keyword_edge',
			'manual_review_required',
			'reviewer_action',
			'api.github.com/search',
			'manual-research-link',
			'analytics-linked-keyword-graph'
		]
	},
	{
		name: 'form route',
		path: 'form-basic',
		expectedContentType: 'text/html',
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
		expectedContentType: 'text/html',
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

const forbiddenLeakMarkers = [
	'"name": "sveltekit-php"',
	'"scripts"',
	'DEPLOY_HOST',
	'DEPLOY_USER',
	'DEPLOY_REMOTE',
	'<?php',
	'adapter/index.js'
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

function assertContentTypeIncludes(contentType, expectedContentType, checkName) {
	if (!expectedContentType) {
		return;
	}

	if (!contentType.toLowerCase().includes(expectedContentType.toLowerCase())) {
		throw new Error(`${checkName} returned content-type ${contentType || 'missing'}, expected ${expectedContentType}.`);
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
	assertNoForbiddenLeaks(response.body, check.name);
	assertTextIncludes(response.body, check.requiredText, check.name);
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
			accept: 'text/html,application/xhtml+xml'
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

