import type { AlphaReadinessReport } from './alpha-readiness';
import { buildAlphaHardProofBlockers } from './alpha-hard-proof-blockers';
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

const hostedArtifact = (path: string, kind: string, remoteSmoke: RemoteSmokeArtifact = null) => ({
	path,
	kind,
	proofStage: remoteSmoke?.status === 'passed' ? 'hosted-smoke-passed' : 'hosted-smoke-or-placeholder',
	trustLevel:
		remoteSmoke?.status === 'passed'
			? 'real-php-host-smoke-evidence'
			: 'requires-alpha-smoke-base-url-for-pass-evidence',
	hostedSmokeStatus: remoteSmoke?.status ?? 'missing',
	hostedSmokeCheckCount: remoteSmoke?.checks?.length ?? 0
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
		latestPackageSnapshot: {
			reviewed: report.latestPackageSnapshotReviewed,
			marker: 'latest-sveltekit-compatibility-audit',
			packages: report.latestPackageSnapshot,
			officialAdapters: report.officialAdapterSnapshot,
			proofUse:
				'Keeps the alpha report aligned with current Svelte 5, SvelteKit 2, Vite/plugin, and official adapter package snapshots without implying an in-place dependency-floor upgrade.'
		},
		liveConsumerEvidence: report.liveConsumerEvidence,
		requiredEvidence: requiredAlphaEvidence,
		proofLedger: report.proofLedger,
		hardProofBlockers: buildAlphaHardProofBlockers(),
		trustModel: {
			'deterministic-local-artifact':
				'Generated from source-controlled alpha readiness modules by bun run alpha:report:full.',
			'directional-community-signal':
				'Collected from public open-source/community JSON endpoints by bun run alpha:analytics; counts are rate-limited and incomplete.',
			'no-live-community-api-runtime-boundary':
				'Community analytics runtime endpoints are deterministic report handoffs; public-source API collection only runs through explicit local/CI commands.',
			'requires-alpha-smoke-base-url-for-pass-evidence':
				'Only proves hosted behavior after ALPHA_SMOKE_BASE_URL points at a real PHP deployment and hosted smoke runs.',
			'real-php-host-smoke-evidence':
				'Hosted alpha smoke has run against an HTTP(S) PHP deployment and produced a passed report/alpha-remote-smoke.json artifact.',
			'deterministic-runtime-evidence':
				'Served by the SvelteKit fixture/runtime endpoints without live community API calls.',
			'live-consumer-static-no-hydration-evidence':
				'Observed against blog.ryanspice.com as a real consumer deployment proof surface; it corroborates php-static/no-hydration behavior but does not replace the dedicated hosted PHP adapter fixture.'
		},
		hostedProofInterpretation: {
			marker: 'hosted-php-smoke-proof',
			requiredMarker: 'hosted-php-smoke-proof-required',
			status: remoteSmoke?.status ?? 'missing',
			checkCount: remoteSmoke?.checks?.length ?? 0,
			alphaEvidenceStatus:
				remoteSmoke?.status === 'passed' ? 'alpha-hosted-proof-present' : 'needs-hosted-proof',
			artifact: 'report/alpha-remote-smoke.json',
			checklist: 'report/alpha-hosted-smoke-checklist.json',
			runtimeChecklist: '/alpha-readiness/hosted-smoke-checklist.json',
			stableBoundary:
				'A passed hosted smoke artifact is alpha deployment evidence for that target. Stable 1.0.2 still requires the current full local gate, strict artifact sync, packed consumer proof, real native-host proof for OS-native claims, and a fresh hosted gate for the release deployment target.'
		},
		evidenceSurfaces: {
			hardProofBlockerLedger: {
				route: '/alpha-readiness/release-manifest.json',
				source: 'src/lib/alpha-hard-proof-blockers.ts',
				markers: [
					'hard-proof-blocker-ledger',
					'hardProofBlockers',
					'alpha-runtime-gate-ledger',
					'hosted-php-smoke-proof-required',
					'packed-consumer-install-import-proof',
					'source-to-generated-bundle-check',
					'real-native-host-wrapper-smoke-required',
					'community-analytics-freshness-contract'
				],
				proofUse:
					'Centralizes the current hard proof blockers so release notes, package contract, gate matrix, and reviewer handoffs do not drift on what still blocks stable claims.'
			},
			alphaReleaseChecklist: {
				route: '/alpha-readiness/release-checklist.md',
				source: 'src/lib/alpha-release-checklist.ts',
				documentationSource: 'docs/ALPHA-RELEASE-CHECKLIST.md',
				markers: [
					'1.0.2-alpha release checklist',
					'alpha-over-rc-release-policy',
					'native-host-compatibility-matrix',
					'desktop-shell-ui-command-mapping',
					'community-analytics-csv-linkage',
					'result-total-field-contract',
					'top-result-field-contract',
					'sample-review-rule',
					'router-path-safety-artifact-sync',
					'adapter-platform-emulation',
					'latest-sveltekit-compatibility-audit',
					'remote-functions-alpha-policy',
					'deploy-env-preflight-safety',
					'bun run alpha:gate',
					'bun run alpha:gate:hosted',
					'getDesktopShellUiCommandMapping',
					'sourceToKeywordEdge',
					'resultTotalField',
					'topResultFields',
					'sampleReviewRule',
					'weighted_demand_score',
					'result_total_field',
					'top_result_fields',
					'sample_review_rule',
					'ALPHA_SMOKE_BASE_URL'
				],
				proofUse:
					'Gives reviewers and contributors a single human checklist for alpha-over-RC policy, latest Svelte/SvelteKit compatibility posture, native helper mapping, community CSV linkage, source field contracts, router/artifact safety, deploy preflight, and hosted proof.'
			},
			adapterPlatformEmulation: {
				route: '/alpha-readiness/package-contract.json',
				source: 'adapter/src/index.ts',
				generatedArtifact: 'adapter/index.js',
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
				proofUse:
					'Records the non-secret PHP adapter platform surface available through SvelteKit dev/build/preview so consumers can inspect capabilities without exposing deploy env values.'
			},
			latestSvelteKitCompatibilityAudit: {
				route: '/alpha-readiness/release-manifest.json',
				source: 'docs/ALPHA-LATEST-SVELTEKIT-AUDIT.md',
				packageSource: 'package.json',
				adapterSource: 'adapter/src/index.ts',
				markers: [
					'latest-sveltekit-compatibility-audit',
					'svelte latest 5.56.4',
					'@sveltejs/kit latest 2.69.1',
					'@sveltejs/vite-plugin-svelte latest 7.1.4',
					'vite latest 8.1.3',
					'official adapter snapshot',
					'@sveltejs/adapter-node latest 5.5.7',
					'@sveltejs/adapter-static latest 3.0.10',
					'@sveltejs/adapter-cloudflare latest 7.2.9',
					'@sveltejs/adapter-netlify latest 6.0.4',
					'@sveltejs/adapter-vercel latest 6.3.4',
					'@sveltejs/adapter-auto latest 7.0.1',
					'SvelteKit writing adapters',
					'SvelteKit page options',
					'Svelte 5 migration',
					'remote-functions-alpha-policy',
					'remote functions generated HTTP endpoint support is blocked',
					'Vite 8 isolated validation lane',
					'latest-vite-major-validation',
					'alpha:latest-same-major:smoke',
					'smoke-latest-same-major.mjs',
					'alpha:latest-vite-major:smoke',
					'smoke-latest-vite-major.mjs'
				],
				proofUse:
					'Documents the current official Svelte/SvelteKit compatibility posture for the alpha goal, including packed fixture smokes for npm-latest Svelte 5/SvelteKit 2 and isolated npm-latest Vite 8/plugin 7 validation while keeping dependency-floor upgrades separate.'
			},
			liveBlogConsumerEvidence: {
				route: '/alpha-readiness/release-manifest.json',
				source: 'src/lib/alpha-readiness.ts',
				externalUrl: report.liveConsumerEvidence.url,
				trustLevel: 'live-consumer-static-no-hydration-evidence',
				markers: [
					'live-blog-consumer-evidence',
					'blog.ryanspice.com',
					'consumer-proof-not-hosted-fixture',
					'static/no-hydration homepage proof',
					'robots.txt 200',
					'sitemap.xml 200',
					'no sveltekit:start marker',
					'no module script marker',
					'no __sveltekit marker',
					'seo_audit_python A-',
					'seo_audit_python score 91',
					'28 pages scanned',
					'blog.ryanspice.com-root-20260701T060746Z-v0_4_9',
					'dedicated hosted PHP adapter fixture still required'
				],
				proofUse:
					'Records the current live blog consumer proof for static/no-hydration behavior and SEO health while preserving the hosted-php-smoke-proof requirement for a dedicated adapter fixture.'
			},
			remoteFunctionsAlphaPolicy: {
				route: '/alpha-readiness/release-manifest.json',
				source: 'docs/REMOTE-FUNCTIONS-ALPHA-POLICY.md',
				adapterSource: 'adapter/src/index.ts',
				verifier: 'scripts/verify-remote-functions-policy.mjs',
				markers: [
					'remote-functions-alpha-policy',
					'kit.experimental.remoteFunctions',
					'.remote.js',
					'.remote.ts',
					'generated server HTTP endpoints',
					'event.platform.php.remoteFunctions.supported',
					'assertRemoteFunctionsUnsupported',
					'REMOTE_FUNCTIONS_UNSUPPORTED_MESSAGE',
					'generatedHttpEndpointSupport: false',
					'verify:remote-functions'
				],
				proofUse:
					'Prevents alpha and package evidence from implying remote-functions support before PHP runtime routing has fixture and hosted deployment proof.'
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
					'macOS vibrancy host policy',
					'macos-vibrancy-host-policy',
					'macos-material-host-policy',
					'source-observed-macos-host-scaffold',
					'macos-native-vibrancy-unverified',
					'native-visual-matrix',
					'windows-mica-visual-row',
					'macos-traffic-light-row',
					'macos-vibrancy-visual-row',
					'native-window-action',
					'set-window-effect',
					'data-native-host-handoff-controls'
				],
				proofUse:
					'Makes the Windows 11 Mica fallback, macOS traffic-light/vibrancy policy, and host-owned caption-control seam explicit in both the live alpha page and the portable SVG report graphic.'
			},
			nativeVisualMatrix: {
				route: '/alpha-readiness',
				source: 'src/lib/alpha-native-host-contract.ts',
				markers: [
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
					'data-native-visual-matrix'
				],
				proofUse:
					'Maps Windows Mica, macOS traffic lights, source-observed macOS material host policy, unverified native macOS vibrancy, Windows caption controls, UltraGear theme tokens, and browser fallback state to concrete adapter markers and host-owned boundaries.'
			},
			nativePlatformProvenance: {
				route: '/alpha-readiness/bridge-reuse.json',
				source: 'src/lib/alpha-bridge-reuse.ts',
				markers: [
					'lg-ultragear-native-platform-provenance',
					'native-host-compatibility-matrix',
					'source-observed-host-compatibility-contract',
					'macos-material-host-policy',
					'source-observed-macos-host-scaffold',
					'macos-native-vibrancy-unverified',
					'lg-ultragear-host-permission-checklist',
					'realHostPermissionChecklist',
					'real-host-permission-cue-required',
					'hostPermissionCues',
					'requiredHostPermission',
					'src-tauri/capabilities/default.json',
					'src-tauri/src/lib.rs',
					'cfg!(target_os = "windows")',
					'ShellFeatureProbe.mica_supported',
					'current_shell_features()',
					'features.micaSupported',
					'windowChromeState',
					'data-window-chrome-state',
					'data-window-chrome-state="mica-active"',
					'mica-active',
					'mica-inactive',
					'plain',
					'transparentWebviewMaterialBoundary',
					'transparent-webview-material-boundary',
					'data-transparent-webview-material-boundary="host-owned"',
					'webview.setBackgroundColor([0, 0, 0, 0])',
					'windows-mica-effects',
					'taskbar-progress-reporting',
					'native-titlebar-drag-maximize',
					'core:window:allow-set-effects',
					'core:window:allow-set-progress-bar',
					'core:window:allow-start-dragging',
					'core:window:allow-toggle-maximize',
					'packages/desktop-shell-ui/src/index.ts',
					'packages/ultragear-widget-ui/src/app.ts',
					'@scriptgpt/desktop-shell-ui',
					'desktopShellUiBinding',
					'getDesktopShellUiCommandMapping',
					'nativeHostBridgeMapping',
					'desktopShellUiHelper',
					'desktopShellUiEvidence',
					'native-host-wrapper-probe',
					'toDesktopShellUiTaskbarProgressState',
					'enableMicaWindowChrome',
					'syncTaskbarProgress',
					'toggleWindowMaximize',
					'bindColorSchemeWatcher',
					'prefersDarkMode',
					'window.matchMedia("(prefers-color-scheme: dark)")',
					'TaskbarProgressState',
					'saveInFlight',
					'refreshInFlight',
					'hasQueuedSave',
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
				proofUse:
					'Records the exact LG UltraGear source files and implementation cues reused for the alpha native-shell styling, system appearance handling, host-action seam, and report/progress evidence.'
			},
			nativeHostCompatibilityMatrix: {
				route: '/alpha-readiness/native-host-contract.json',
				source: 'src/lib/alpha-native-host-contract.ts',
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
					'mica-active',
					'mica-inactive',
					'plain',
					'transparentWebviewMaterialBoundary',
					'transparent-webview-material-boundary',
					'data-transparent-webview-material-boundary="host-owned"',
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
				proofUse:
					'Separates source-observed Windows Mica/taskbar/drag/maximize compatibility evidence from real OS-native proof, tying UltraGear implementation cues to browser-safe PHP adapter host actions.'
			},
			realHostPermissionChecklist: {
				route: '/alpha-readiness/native-host-contract.json',
				source: 'src/lib/alpha-native-host-contract.ts',
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
				proofUse:
					'Keeps real OS-native Mica, taskbar progress, drag, and maximize claims gated on explicit host-wrapper permissions instead of CSS-only or DOM-only evidence.'
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
					'bindColorSchemeWatcher',
					'prefersDarkMode',
					'TaskbarProgressState',
					'toDesktopShellUiTaskbarProgressState',
					'saveInFlight',
					'refreshInFlight',
					'hasQueuedSave',
					'applyWindowChrome',
					'syncWindowProgress',
					'app-window',
					'app-window.maximized',
					'theme-ultragear',
					'max-width: 1180px',
					'max-width: 860px',
					'DRAG_START_THRESHOLD_PX',
					'setPointerCapture',
					'lostpointercapture',
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
			noHydrationPrerenderFixture: {
				route: '/alpha-readiness/no-hydration',
				source: 'src/routes/alpha-readiness/no-hydration/+page.svelte',
				configSource: 'src/routes/alpha-readiness/no-hydration/+page.ts',
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
				proofUse:
					'Records the blog/static-theme contract that prerendered csr=false pages must ship stable SSR HTML without client hydration scripts repainting the page after load.'
			},
			nativeHostBindingGuide: {
				route: '/alpha-readiness/native-host-guide.md',
				source: 'src/lib/alpha-native-host-guide.ts',
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
					'packages/ultragear-widget-ui/src/app.ts',
					'@scriptgpt/desktop-shell-ui',
					'enableMicaWindowChrome',
					'syncTaskbarProgress',
					'toggleWindowMaximize',
					'bindColorSchemeWatcher',
					'prefersDarkMode',
					'Effect.Mica',
					'win.setProgressBar',
					'reportJson'
				],
				proofUse:
					'Gives desktop-wrapper implementers a concrete binding contract for Windows 11 Mica, macOS titlebar behavior, progress, report-ready handoff, and browser fallback history without importing native APIs into the adapter.'
			},
			nativeHostWrapperSmoke: {
				route: '/alpha-readiness/native-host-wrapper-smoke.json',
				source: 'src/lib/alpha-native-host-wrapper-smoke.ts',
				artifact: 'report/alpha-native-host-wrapper-smoke.json',
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
				proofUse:
					'Provides deterministic wrapper-handoff smoke data for optional Windows/macOS hosts while making clear that real OS-native proof is still host-owned.'
			},
			communityEvidenceLedger: {
				route: '/alpha-readiness',
				source: 'src/lib/alpha-community-research-pack.ts',
				markers: [
					'Community evidence coverage ledger',
					'providerCoverage',
					'evidenceKindCoverage',
					'collectionRiskCoverage',
					'sourceHealthCoverage',
					'resultTotalFieldCoverage',
					'alpha-community-source-evidence-checklist',
					'source-health-classification',
					'result-total-field-contract',
					'top-result-field-contract',
					'sample-review-rule',
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
					'no-live-community-api-runtime-boundary',
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
				proofUse:
					'Links each alpha keyword to supported API lanes, manual research links, source hosts, evidence kinds, collection risk, curated signal scores, collected demand-score handoffs, CSV rows, analytics Markdown handoff, and the no-live community API runtime boundary.'
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
					'alpha-community-source-evidence-checklist',
					'directional-community-signal',
					'no-live-community-api-runtime-boundary'
				],
				proofUse:
					'Defines when public-source analytics counts are fresh enough for alpha release review, makes stale/missing collectedAt evidence explicit, and keeps runtime endpoints on deterministic no-live community API handoffs.'
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
			generatedArtifact('report/alpha-native-host-wrapper-smoke.json', 'native-host-wrapper-smoke-json'),
			generatedArtifact('report/alpha-hosted-smoke-checklist.json', 'hosted-smoke-checklist-json'),
			generatedArtifact('report/alpha-readiness.csv', 'readiness-csv'),
			generatedArtifact('report/alpha-bridge-reuse.json', 'bridge-reuse-json'),
			generatedArtifact('report/alpha-review-index.md', 'alpha-review-index-markdown'),
			generatedArtifact('report/alpha-community-signals.csv', 'community-signals-csv'),
			generatedArtifact('report/alpha-community-sources.csv', 'community-sources-csv'),
			generatedArtifact('report/alpha-community-research-pack.json', 'community-research-pack-json'),
			collectedArtifact('report/alpha-community-analytics.json', 'community-analytics-json'),
			collectedArtifact('report/alpha-community-analytics.md', 'community-analytics-markdown'),
			hostedArtifact('report/alpha-remote-smoke.json', 'hosted-smoke-json', remoteSmoke),
			generatedArtifact('report/alpha-release-manifest.json', 'release-manifest-json')
		],
		runtimeEndpoints: [
			runtimeEndpoint('/alpha-readiness', 'native-styled-report-page'),
			runtimeEndpoint('/alpha-readiness/no-hydration', 'no-hydration-prerender-fixture'),
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
			runtimeEndpoint('/alpha-readiness/native-host-wrapper-smoke.json', 'native-host-wrapper-smoke-json-endpoint'),
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

