import type { AlphaReadinessReport } from './alpha-readiness';
import { buildAlphaHardProofBlockers } from './alpha-hard-proof-blockers';
import { requiredAlphaEvidence } from './alpha-required-evidence';

export function buildAlphaPackageContract(report: AlphaReadinessReport) {
	return {
		target: report.target,
		packageName: 'sveltekit-php',
		requiredEvidence: requiredAlphaEvidence,
		stablePromotionBlockers: buildAlphaHardProofBlockers(),
		publishShape: {
			private: false,
			versionPattern: report.releasePolicy.requiredTargetPattern,
			publishConfig: {
				tag: report.releasePolicy.channel
			},
			releasePolicy: {
				marker: report.releasePolicy.marker,
				channel: report.releasePolicy.channel,
				track: report.releasePolicy.track,
				rank: report.releasePolicy.rank,
				projectRankPolicy: '1.0.2-alpha ranks above any RC for this project release track',
				semverNote:
					'Project policy intentionally overrides ordinary alpha-vs-rc naming expectations for this adapter alpha gate.',
				requiredTargetPattern: report.releasePolicy.requiredTargetPattern,
				requiredEvidence: requiredAlphaEvidence,
				disallowedDistTags: report.releasePolicy.disallowedChannels,
				disallowedCandidateLabels: ['rc', 'release-candidate', 'latest', 'stable']
			},
			exports: {
				'.': './adapter/index.js',
				'./adapter': './adapter/index.js'
			},
			files: [
				'adapter/index.js',
				'README.md',
				'docs/ALPHA-LATEST-SVELTEKIT-AUDIT.md',
				'docs/ALPHA-READINESS.md',
				'docs/ALPHA-RELEASE-CHECKLIST.md',
				'docs/REMOTE-FUNCTIONS-ALPHA-POLICY.md'
			]
		},
		consumerProof: {
			command: 'bun run alpha:consumer:smoke',
			proofStage: 'package-consumer-proof',
			trustLevel: 'packed-artifact-install-import',
			proves: [
				'npm pack --json succeeds without publishing',
				'Packed tarball contains only the expected publish contract files',
				'Temporary external consumer install can import sveltekit-php/adapter'
			]
		},
		releasePrepProof: {
			command: 'bun run verify:release-prep',
			proofStage: 'package-safety-proof',
			trustLevel: 'deterministic-local-check',
			proves: [
				'docs/ALPHA-RELEASE-CHECKLIST.md records the human alpha release checklist for policy, native mapping, CSV linkage, router safety, artifact sync, deploy preflight, and hosted proof',
				'package metadata remains on the 1.0.2-alpha track',
				'publishConfig.tag remains alpha and never latest, rc, or stable',
				'package-level release policy records alpha-over-rc-release-policy with rank above-rc',
				'package-level release policy records required alpha evidence for native host guide, real host permission checklist, native host compatibility matrix, no-hydration prerender proof, native wrapper smoke, native shell styling, report graphics, community analytics freshness, and hosted PHP smoke proof',
				'private:false is set for publish readiness',
				'committed env files remain placeholder-safe',
				'leftover root package tarballs are rejected',
				'deploy precheck rejects missing, placeholder, malformed, or unsafe operational values',
				'alpha gate keeps strict generated artifact sync wired to adapter/index.js',
				'latest-sveltekit-compatibility-audit freshness is checked against current npm view output',
				'adapter-platform-emulation proves event.platform.php stays a capability-only dev/build/preview contract',
				'remote-functions-alpha-policy blocks generated HTTP endpoint support until PHP runtime routing has fixture and hosted proof'
			]
		},
		latestSvelteKitCompatibilityAuditProof: {
			marker: 'latest-sveltekit-compatibility-audit',
			command: 'bun run verify:latest-sveltekit-audit',
			proofStage: 'package-safety-proof',
			trustLevel: 'npm-latest-snapshot-freshness-check',
			source: 'docs/ALPHA-LATEST-SVELTEKIT-AUDIT.md',
			verifier: 'scripts/verify-latest-sveltekit-audit.mjs',
			markers: [
				'Latest package snapshot freshness',
				'npm view',
				'svelte@5.56.4',
				'@sveltejs/kit@2.69.1',
				'@sveltejs/vite-plugin-svelte@7.1.4',
				'vite@8.1.3',
				'Vite 8 isolated validation lane',
				'latest-vite-major-validation',
				'alpha:latest-vite-major:smoke',
				'smoke-latest-vite-major.mjs'
			],
			proves: [
				'The source-controlled latest-SvelteKit audit does not silently age past current npm latest versions.',
				'Svelte and SvelteKit same-major claims stay separated from dependency-floor upgrades while Vite 8/plugin 7 compatibility is validated through an isolated smoke lane.',
				'The alpha gate fails when the audit snapshot needs to be refreshed before release review.'
			]
		},
		adapterPlatformEmulationProof: {
			marker: 'adapter-platform-emulation',
			proofStage: 'package-safety-proof',
			trustLevel: 'deterministic-local-check',
			source: 'adapter/src/index.ts',
			generatedArtifact: 'adapter/index.js',
			markers: [
				'emulate().platform',
				'event.platform.php',
				'adapterVersion',
				'prerendering',
				'documentSsr',
				'phpStaticClientFallback',
				'actionHandlers',
				'endpointHandlers',
				'nativeHostRuntime',
				'remoteFunctions',
				'generatedHttpEndpointSupport'
			],
			proves: [
				'SvelteKit dev/build/preview can inspect the PHP adapter mode and runtime capability surface through event.platform.php.',
				'The platform object exposes capability flags, version, base path, output settings, and prerender state without deploy secrets or private env values.',
				'event.platform.php.remoteFunctions.supported remains false until remote-functions-alpha-policy fixture proof exists.',
				'Release-prep checks fail if the adapter source drops the platform emulation contract.'
			]
		},
		remoteFunctionsAlphaPolicyProof: {
			marker: 'remote-functions-alpha-policy',
			command: 'bun run verify:remote-functions',
			proofStage: 'unsupported-feature-policy',
			trustLevel: 'deterministic-local-check',
			source: 'docs/REMOTE-FUNCTIONS-ALPHA-POLICY.md',
			adapterSource: 'adapter/src/index.ts',
			markers: [
				'kit.experimental.remoteFunctions',
				'.remote.js',
				'.remote.ts',
				'generated server HTTP endpoints',
				'REMOTE_FUNCTIONS_UNSUPPORTED_MESSAGE',
				'assertRemoteFunctionsUnsupported',
				'event.platform.php.remoteFunctions.supported',
				'generatedHttpEndpointSupport'
			],
			proves: [
				'The PHP runtime alpha does not silently claim SvelteKit remote-functions support.',
				'Builds fail when kit.experimental.remoteFunctions is enabled or .remote.* files are present.',
				'The unsupported-feature policy defines the fixture and hosted smoke proof required before support can be promoted.'
			]
		},
		alphaOverRcPolicyProof: {
			marker: 'alpha-over-rc-release-policy',
			requiredTargetPattern: report.releasePolicy.requiredTargetPattern,
			channel: report.releasePolicy.channel,
			rank: report.releasePolicy.rank,
			projectRankPolicy: 'above-rc',
			mustNotUseDistTags: report.releasePolicy.disallowedChannels,
			mustNotUseCandidateLabels: ['rc', 'release-candidate', 'latest', 'stable'],
			proves: [
				'The package contract treats 1.0.2-alpha as the required pre-stable track above any RC label for this project.',
				'publishConfig.tag must stay alpha for this candidate.',
				'RC, latest, and stable labels remain blocked until hosted PHP smoke proof and required alpha evidence are complete.'
			]
		},
		artifactSyncProof: {
			command: 'bun run verify:artifacts -- --strict',
			proofStage: 'package-safety-proof',
			trustLevel: 'source-to-generated-bundle-check',
			proves: [
				'adapter/src/index.ts builds to the same content as checked-in adapter/index.js',
				'stale generated adapter bundles fail CI and alpha gate review',
				'package consumers import the same adapter bundle produced from source'
			]
		},
		deploySafetyProof: {
			command: 'bun run precheck:deploy',
			proofStage: 'deployment-safety-proof',
			trustLevel: 'environment-preflight-check',
			proves: [
				'DEPLOY_HOST, DEPLOY_USER, DEPLOY_REMOTE, and DEPLOY_LOCAL are concrete before deploy automation',
				'placeholder, undefined, malformed port, parent-relative path, and unsafe smoke URL values are rejected',
				'hosted smoke security probes include %2e%2e/.env traversal checks before hosted proof can pass',
				'deploy scripts read operational values from private env/CI instead of committed literals'
			]
		},
		reportEvidenceBoundary: {
			proofStage: 'generated-from-source',
			trustLevel: 'release-evidence-not-package-api',
			proves:
				'Alpha readiness endpoints, no-hydration prerender fixture, release checklist, graphics, manifests, native platform provenance, native host binding guide, and community analytics are release evidence for reviewers, not npm adapter exports.'
		},
		noHydrationPrerenderProof: {
			proofStage: 'runtime-source-endpoint',
			trustLevel: 'deterministic-runtime-evidence',
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
			proves: [
				'/alpha-readiness/no-hydration is the adapter fixture for blog/static-theme pages that must stay prerendered and client-hydration-free.',
				'Hosted smoke must reject script and SvelteKit hydration markers on the fixture response.',
				'The alpha package contract treats no-hydration proof as release evidence without adding npm package API surface.'
			]
		},
		alphaReleaseChecklistProof: {
			proofStage: 'generated-from-source',
			trustLevel: 'deterministic-runtime-evidence',
			checklistEndpoint: '/alpha-readiness/release-checklist.md',
			artifact: 'report/alpha-release-checklist.md',
			documentationArtifact: 'docs/ALPHA-RELEASE-CHECKLIST.md',
			source: 'src/lib/alpha-release-checklist.ts',
			markers: [
				'1.0.2-alpha release checklist',
				'alpha-over-rc-release-policy',
				'real-host-permission-checklist',
				'native-host-compatibility-matrix',
				'source-observed-host-compatibility-contract',
				'lg-ultragear-host-permission-checklist',
				'realHostPermissionChecklist',
				'requiredHostPermission',
				'src-tauri/capabilities/default.json',
				'src-tauri/src/lib.rs',
				'cfg!(target_os = "windows")',
				'ShellFeatureProbe.mica_supported',
				'current_shell_features()',
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
				'macos-material-host-policy',
				'source-observed-macos-host-scaffold',
				'macos-native-vibrancy-unverified',
				'windows-mica-effects',
				'taskbar-progress-reporting',
				'native-titlebar-drag-maximize',
				'desktop-shell-ui-command-mapping',
				'community-analytics-csv-linkage',
				'result-total-field-contract',
				'top-result-field-contract',
				'sample-review-rule',
				'router-path-safety-artifact-sync',
				'adapter-platform-emulation',
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
			proves: [
				'/alpha-readiness/release-checklist.md exposes the project-specific 1.0.2-alpha policy and proof checklist as runtime evidence',
				'report/alpha-release-checklist.md is regenerated with the report bundle rather than manually patched',
				'docs/ALPHA-RELEASE-CHECKLIST.md remains the source-controlled human checklist packaged for release review',
				'Community analytics checklist proof includes result/top-result/sample-review field contracts for reviewer-auditable source counts',
				'Chrome-state and transparent-webview checklist markers prove the alpha package contract names the host-owned Windows Mica boundary without adding Tauri APIs to the adapter package surface'
			]
		},
		nativePlatformProvenanceProof: {
			proofStage: 'generated-from-source',
			trustLevel: 'lg-ultragear-native-platform-provenance',
			markers: [
				'lg-ultragear-native-platform-provenance',
				'lg-ultragear-host-permission-checklist',
				'realHostPermissionChecklist',
				'real-host-permission-cue-required',
				'hostPermissionCues',
				'requiredHostPermission',
				'src-tauri/capabilities/default.json',
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
				'reportUrl'
			],
			proves: [
				'/alpha-readiness/bridge-reuse.json names the exact LG UltraGear source files and native cue families reused by alpha evidence',
				'/alpha-readiness/report.html, /alpha-readiness/report.md, and /alpha-readiness/report.svg surface the provenance for reviewers',
				'The npm package surface remains adapter-focused while alpha evidence tracks Windows 11 Mica, macOS chrome, browser-safe system appearance handling, host-owned window actions, report/progress handoff, and real-host permission checklist boundaries'
			]
		},
		nativeHostCompatibilityMatrixProof: {
			marker: 'native-host-compatibility-matrix',
			proofStage: 'source-observed-host-compatibility-contract',
			trustLevel: 'deterministic-runtime-evidence',
			contractEndpoint: '/alpha-readiness/native-host-contract.json',
			bridgeEndpoint: '/alpha-readiness/bridge-reuse.json',
			hostedChecklistEndpoint: '/alpha-readiness/hosted-smoke-checklist.json',
			markers: [
				'native-host-compatibility-matrix',
				'source-observed-host-compatibility-contract',
				'packages/ultragear-widget-ui/src/app.ts',
				'src-tauri/src/lib.rs',
				'features.micaSupported',
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
			proves: [
				'The alpha evidence bundle maps observed LG UltraGear Windows/native host cues to browser-safe adapter host events.',
				'Windows Mica, taskbar progress, drag, and maximize compatibility claims stay tied to source-observed cues instead of generic styling assertions.',
				'This matrix is not a substitute for real Windows/macOS wrapper smoke proof; stable promotion still requires OS-native host evidence.'
			]
		},
		nativeHostBindingGuideProof: {
			proofStage: 'generated-from-source',
			trustLevel: 'deterministic-runtime-evidence',
			guideEndpoint: '/alpha-readiness/native-host-guide.md',
			artifact: 'report/alpha-native-host-guide.md',
			markers: [
				'native host binding guide',
				'lg-ultragear-host-permission-checklist',
				'realHostPermissionChecklist',
				'hostPermissionCues',
				'requiredHostPermission',
				'src-tauri/capabilities/default.json',
				'data-native-host-handoff-controls',
				'native-window-action',
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
				'window.matchMedia("(prefers-color-scheme: dark)")',
				'TaskbarProgressState',
				'toDesktopShellUiTaskbarProgressState',
				'saveInFlight',
				'refreshInFlight',
				'hasQueuedSave',
				'set-window-effect',
				'set-progress',
				'clear-progress',
				'report-ready',
				'setWindowEffect',
				'setProgress',
				'clearProgress',
				'reportReady',
				'Effect.Mica',
				'core:window:allow-set-effects',
				'core:window:allow-set-progress-bar',
				'core:window:allow-start-dragging',
				'core:window:allow-toggle-maximize',
				'win.setProgressBar',
				'reportJson'
			],
			proves: [
				'/alpha-readiness/native-host-guide.md gives optional desktop wrappers a concrete binding path for native-window-action events',
				'Windows 11 Mica, macOS titlebar behavior, progress, drag, maximize, and report-ready handoff stay host-owned and permission-gated instead of becoming adapter package APIs',
				'The alpha package contract can reference native host implementation guidance without expanding the npm export surface beyond sveltekit-php/adapter'
			]
		},
		nativeHostWrapperSmokeProof: {
			proofStage: 'generated-from-source',
			trustLevel: 'deterministic-host-wrapper-handoff',
			command: 'bun run alpha:native:smoke',
			source: 'src/lib/alpha-native-host-wrapper-smoke.ts',
			runtimeSource: 'src/lib/native-shell/native-host-event-bridge.ts',
			contractEndpoint: '/alpha-readiness/native-host-contract.json',
			route: '/alpha-readiness/native-host-wrapper-smoke.json',
			artifact: 'report/alpha-native-host-wrapper-smoke.json',
			realHostVerified: false,
			stableBlocker:
				'Real Windows/macOS desktop-wrapper smoke proof is still required before stable release claims.',
			noNativeApiBoundary: {
				tauriImportsAllowed: false,
				nativeWindowCallsAllowed: false,
				adapterRuntimeNativeImportsAllowed: false
			},
			reportVisibility: [
				'/alpha-readiness/report.html',
				'/alpha-readiness/report.md',
				'/alpha-readiness/report.svg',
				'/alpha-readiness/release-notes.md',
				'/alpha-readiness/review-index.md'
			],
			markers: [
				'native-host-wrapper-smoke',
				'native-host-wrapper-probe',
				'real-host-permission-checklist',
				'lg-ultragear-host-permission-checklist',
				'realHostPermissionChecklist',
				'hostPermissionCues',
				'requiredHostPermission',
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
				'core:window:allow-set-effects',
				'core:window:allow-set-progress-bar',
				'core:window:allow-start-dragging',
				'core:window:allow-toggle-maximize',
				'set-window-effect',
				'set-progress',
				'clear-progress',
				'report-ready',
				'expectedHistoryResult',
				'expectedDesktopShellUiHelper',
				'noFallbackAllowedForRealHost'
			],
			proves: [
				'Optional desktop wrappers have a deterministic smoke contract for the LG UltraGear helper mapping.',
				'The smoke contract validates Mica, drag, maximize, progress, clear-progress, report-ready handoff data, and required host permissions without importing native APIs into the PHP adapter runtime.',
				'The package contract records noNativeApiBoundary and realHostVerified:false until a Windows/macOS wrapper supplies OS-native proof.'
			]
		},
		boundaries: [
			'Alpha readiness fixture endpoints are release evidence, not public npm package exports.',
			'The npm package surface stays adapter-focused.',
			'Strict artifact sync is release safety evidence, not a publish operation.',
			'Deploy precheck validates env shape only; it does not connect, upload, or deploy.',
			'No publish, tag, deploy, or git operation is performed by the evidence endpoint.'
		]
	};
}


