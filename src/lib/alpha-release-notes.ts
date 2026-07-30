import type { AlphaReadinessReport } from './alpha-readiness';
import { buildAlphaHardProofBlockers, type AlphaHardProofBlocker } from './alpha-hard-proof-blockers';
import { requiredAlphaEvidence } from './alpha-required-evidence';

type ManifestLike = {
	requiredEvidence?: string[];
	runtimeEndpoints?: { path: string; kind: string; proofStage?: string; trustLevel?: string }[];
	artifacts?: { path: string; kind: string; proofStage?: string; trustLevel?: string }[];
	trustModel?: Record<string, string>;
	evidenceSurfaces?: Record<
		string,
		{
			route?: string;
			component?: string;
			source?: string;
			markers?: string[];
			proofUse?: string;
		}
	>;
	hostedAlphaSmoke?: {
		status?: string;
		checkCount?: number;
		reason?: string | null;
		failure?: string | null;
	};
	hardProofBlockers?: AlphaHardProofBlocker[];
} | null;

export function renderAlphaReleaseNotes(report: AlphaReadinessReport, manifest: ManifestLike = null) {
	const readyAreas = report.readinessAreas.filter((area) => area.status === 'ready');
	const watchAreas = report.readinessAreas.filter((area) => area.status === 'watch');
	const blockedAreas = report.readinessAreas.filter((area) => area.status === 'blocked');
	const hostedStatus = manifest?.hostedAlphaSmoke?.status ?? 'missing';
	const hostedCheckCount = manifest?.hostedAlphaSmoke?.checkCount ?? 0;
	const hostedProofLine =
		hostedStatus === 'passed'
			? `- Hosted PHP proof is present for the checked alpha target: \`hosted-php-smoke-proof\` has ${hostedCheckCount} hosted checks recorded in \`report/alpha-remote-smoke.json\`. Stable still requires the current full local gate, strict artifact sync, packed consumer proof, real native-host proof for OS-native claims, and a fresh hosted gate for the release deployment target.`
			: '- Hosted PHP proof is external: `hosted-php-smoke-proof` remains incomplete until `ALPHA_SMOKE_BASE_URL` targets a real PHP deployment and `bun run alpha:gate:hosted` passes.';
	const requiredEvidence = manifest?.requiredEvidence ?? requiredAlphaEvidence;
	const hardProofBlockers = manifest?.hardProofBlockers ?? buildAlphaHardProofBlockers();
	const endpoints = manifest?.runtimeEndpoints ?? [
		{ path: '/alpha-readiness', kind: 'native-styled-report-page' },
		{ path: '/alpha-readiness/no-hydration', kind: 'no-hydration-prerender-fixture' },
		{ path: '/alpha-readiness/report.json', kind: 'readiness-json-endpoint' },
		{ path: '/alpha-readiness/report.html', kind: 'html-report-endpoint' },
		{ path: '/alpha-readiness/report.md', kind: 'markdown-report-endpoint' },
		{ path: '/alpha-readiness/release-notes.md', kind: 'release-notes-markdown-endpoint' },
		{ path: '/alpha-readiness/release-checklist.md', kind: 'release-checklist-markdown-endpoint' },
		{ path: '/alpha-readiness/report.svg', kind: 'svg-release-graphic-endpoint' },
		{ path: '/alpha-readiness/community-source-map.svg', kind: 'community-source-map-svg-endpoint' },
		{ path: '/alpha-readiness/release-manifest.json', kind: 'release-manifest-json-endpoint' },
		{ path: '/alpha-readiness/gate-matrix.json', kind: 'gate-matrix-json-endpoint' },
		{ path: '/alpha-readiness/evidence-index.json', kind: 'evidence-index-json-endpoint' },
		{ path: '/alpha-readiness/package-contract.json', kind: 'package-contract-json-endpoint' },
		{ path: '/alpha-readiness/native-host-contract.json', kind: 'native-host-contract-json-endpoint' },
		{ path: '/alpha-readiness/native-host-guide.md', kind: 'native-host-guide-markdown-endpoint' },
		{ path: '/alpha-readiness/native-host-wrapper-smoke.json', kind: 'native-host-wrapper-smoke-json-endpoint' },
		{
			path: '/alpha-readiness/hosted-smoke-checklist.json',
			kind: 'hosted-smoke-checklist-json-endpoint'
		},
		{ path: '/alpha-readiness/bridge-reuse.json', kind: 'bridge-reuse-json-endpoint' },
		{ path: '/alpha-readiness/review-index.md', kind: 'alpha-review-index-markdown-endpoint' },
		{ path: '/alpha-readiness/community-signals.json', kind: 'community-signals-json-endpoint' },
		{ path: '/alpha-readiness/community-analytics.md', kind: 'community-analytics-markdown-endpoint' },
		{ path: '/alpha-readiness/community-research-pack.json', kind: 'community-research-pack-json-endpoint' },
		{ path: '/alpha-readiness/readiness.csv', kind: 'readiness-csv-endpoint' },
		{ path: '/alpha-readiness/community-signals.csv', kind: 'community-signals-csv-endpoint' },
		{ path: '/alpha-readiness/community-sources.csv', kind: 'community-sources-csv-endpoint' }
	];

	const lines = [
		`# SvelteKit PHP ${report.target} alpha release notes`,
		'',
		`Issued: ${report.issued}`,
		`Overall readiness: ${report.overallScore}/100`,
		`Bridge source: ${report.bridgeSource}`,
		'',
		'## Release call',
		'',
		`This is an alpha candidate, not stable 1.0.2. The local evidence bundle is designed for runtime correctness, deployment safety, native-styled review, and open-source community research handoff.`,
		`Release policy: ${report.releasePolicy.marker}; channel ${report.releasePolicy.channel}; track ${report.releasePolicy.track}; rank ${report.releasePolicy.rank}.`,
		`Rule: ${report.releasePolicy.releaseRule}`,
		`Stable promotion rule: ${report.releasePolicy.stablePromotionRule}`,
		`Project-rank policy: 1.0.2-alpha is the required pre-stable release label and ranks above any RC for this project; RC, latest, and stable channels remain disallowed until the required alpha evidence is proven.`,
		`SemVer note: this is an explicit project release policy, not a claim that generic SemVer prerelease comparison orders alpha above rc.`,
		'',
		'## Required alpha evidence',
		'',
		'These `requiredEvidence` markers define the `required-alpha-evidence` boundary for treating this as a real `1.0.2-alpha` candidate rather than a generic adapter smoke test.',
		'',
		...requiredEvidence.map((marker) => `- ${marker}`),
		'',
		`Hosted smoke status: ${hostedStatus} (${hostedCheckCount} checks recorded).`,
		'',
		'## Alpha vs stable proof status',
		'',
		'- Alpha policy proof is deterministic: `alpha-over-rc-release-policy` pins the project-specific alpha track and blocks RC/latest/stable labels.',
		'- No-hydration proof is deterministic locally: `/alpha-readiness/no-hydration` carries `csr-disabled-prerender-contract`, but stable still needs hosted proof that the deployed HTML excludes `<script`, `sveltekit:start`, and `data-sveltekit-hydrate`.',
		'- Native host compatibility proof is source-observed: `native-host-compatibility-matrix` maps UltraGear Windows Mica, taskbar progress, drag, and maximize cues, including `ShellFeatureProbe.mica_supported` and `current_shell_features()`, to browser-safe host events, but it does not replace real OS-native wrapper smoke proof.',
		'- Native wrapper replay is deterministic handoff evidence: `native-host-wrapper-event-replay` rows must produce `expectedHistoryResult.mode=native-host`, but `realHostVerified` stays false until an actual Windows/macOS wrapper runs it.',
		'- Community analytics handoff is reviewer-auditable: `result-total-field-contract`, `top-result-field-contract`, and `sample-review-rule` are exposed in JSON/Markdown/SVG and in `alpha-community-sources.csv` as `result_total_field`, `top_result_fields`, and `sample_review_rule`.',
		hostedProofLine,
		'',
		'## Support lanes for 1.0.2-alpha',
		'',
		'- Supported: `php-static` covers prerendered/static HTML, PHP data/action handlers, endpoint dispatch, base-path deployment, root/generated router parity, and no-hydration `csr=false` pages.',
		'- Supported with sidecar: `js-ssr` covers request-time Svelte document SSR, exact streamed/deferred document behavior, and Node-like rendering that `php-static` intentionally does not emulate.',
		'- Validation lane: latest same-major Svelte 5/SvelteKit 2 is smoke-tested, and Vite 8 plus `@sveltejs/vite-plugin-svelte` 7 are smoke-tested in an isolated fixture without changing dependency floors.',
		'- Unsupported for this 1.x line: SvelteKit remote functions, `.remote.*` route files, WordPress plugin mode, PHP-FPM package mode, ISR, built-in image optimization, and adapter-owned auth/roles until fixtures, docs, and hosted proof exist.',
		'- Future and host-owned: native wrapper evidence is deterministic browser/PHP handoff only; real Windows Mica, macOS vibrancy, taskbar progress, drag, and maximize claims require an external wrapper smoke.',
		'- Proof boundary: `blog.ryanspice.com` is consumer proof for static/no-hydration behavior; `/dev/sveltekitphp` or another hosted PHP fixture plus npm-published consumer proof remains required before RC/stable.',
		'',
		'## Hard proof blockers',
		'',
		'These `hardProofBlockers` rows are the stable-promotion ledger. They define what still blocks stable `1.0.2`, real native-host claims, or fresh community claims.',
		'',
		...hardProofBlockers.map(
			(blocker) =>
				`- ${blocker.id}: ${blocker.status}; marker ${blocker.marker}; command \`${blocker.requiredCommand}\`; blocks ${blocker.blocks}. ${blocker.reviewerAction}`
		),
		'',
		'## What is ready',
		''
	];

	for (const area of readyAreas) {
		lines.push(`- ${area.title}: ${area.score}/100`);
	}

	if (readyAreas.length === 0) {
		lines.push('- No readiness areas are currently marked ready.');
	}

	lines.push('', '## Watch items', '');
	for (const area of watchAreas) {
		lines.push(`- ${area.title}: ${area.gap}`);
	}

	if (watchAreas.length === 0) {
		lines.push('- No readiness areas are currently marked watch.');
	}

	lines.push('', '## Blocked items', '');
	for (const area of blockedAreas) {
		lines.push(`- ${area.title}: ${area.gap}`);
	}

	if (blockedAreas.length === 0) {
		lines.push('- No readiness areas are currently marked blocked.');
	}

	lines.push('', '## Runtime evidence endpoints', '');
	for (const endpoint of endpoints) {
		lines.push(`- ${endpoint.path} (${endpoint.kind})`);
	}

	lines.push('', '## Evidence trust model', '');
	const trustModel = manifest?.trustModel ?? {
		'deterministic-local-artifact':
			'Generated reports, graphics, CSVs, manifests, and contracts from source-controlled alpha modules.',
		'directional-community-signal':
			'Public-source community analytics collected by bun run alpha:analytics; counts are not telemetry.',
		'no-live-community-api-runtime-boundary':
			'Community analytics runtime endpoints serve deterministic handoffs; public-source collection stays in explicit local/CI commands.',
		'deterministic-runtime-evidence':
			'Runtime endpoints serve deterministic report data and do not call live community APIs.',
		'requires-alpha-smoke-base-url-for-pass-evidence':
			'Hosted smoke only proves deployment after ALPHA_SMOKE_BASE_URL targets a real PHP host.'
	};
	for (const [trustLevel, description] of Object.entries(trustModel)) {
		lines.push(`- ${trustLevel}: ${description}`);
	}

	lines.push('', '## Live evidence surfaces', '');
	const evidenceSurfaces = manifest?.evidenceSurfaces ?? {
		ultraGearSourceParity: {
			route: '/alpha-readiness/bridge-reuse.json',
			markers: [
				'ultraGearParityContract',
				'packages/desktop-shell-ui/src/index.ts',
				'@scriptgpt/desktop-shell-ui',
				'desktopShellUiBinding',
				'enableMicaWindowChrome',
				'syncTaskbarProgress',
				'toggleWindowMaximize',
				'applyWindowChrome',
				'syncWindowProgress',
				'DRAG_START_THRESHOLD_PX',
				'Structured report preview'
			],
			proofUse:
				'Maps concrete UltraGear source cues to adapter DOM markers, host-event seams, report graphics, and release evidence artifacts.'
		},
		nativePlatformProvenance: {
			route: '/alpha-readiness/bridge-reuse.json',
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
				'@scriptgpt/desktop-shell-ui',
				'desktopShellUiBinding',
				'enableMicaWindowChrome',
				'syncTaskbarProgress',
				'toggleWindowMaximize',
				'Effect.Mica',
				'win.setEffects',
				'windowChromeState',
				'mica-active',
				'mica-inactive',
				'plain',
				'webview.setBackgroundColor([0, 0, 0, 0])',
				'--window-bg-mica',
				'--window-wash-inactive',
				'data-native-platform',
				'data-window-chrome-state',
				'data-window-chrome-state="mica-active"',
				'transparent-webview-material-boundary',
				'data-transparent-webview-material-boundary="host-owned"',
				'macos-material-host-policy',
				'source-observed-macos-host-scaffold',
				'macos-native-vibrancy-unverified',
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
				'Records the exact LG UltraGear source files and cue families behind Windows Mica, source-observed macOS host-material scaffolding, unverified native macOS vibrancy, macOS-style chrome, host-owned transparent webview material state, host-owned window actions, and structured report/progress handoff.'
		},
		realHostPermissionChecklist: {
			route: '/alpha-readiness/native-host-contract.json',
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
				'Separates browser-safe native styling evidence from real OS-native wrapper proof by requiring explicit host permission evidence.'
		},
		nativeHostCompatibilityMatrix: {
			route: '/alpha-readiness/native-host-contract.json',
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
			proofUse:
				'Maps observed UltraGear Windows/native host cues to browser-safe adapter host actions while keeping real OS-native support blocked on wrapper smoke proof.'
		},
		progressReportHandoff: {
			route: '/alpha-readiness',
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
				'Structured report preview'
			],
			proofUse:
				'Connects UltraGear taskbar progress/report-export cues to deterministic alpha report artifacts and optional desktop-host progress UI.'
		},
		progressReportGraphic: {
			route: '/alpha-readiness/report.svg',
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
				'Carries the UltraGear progress/report lifecycle into portable release graphics for screenshot, PR, and release-note review.'
		},
		nativeHostBridgeStatus: {
			route: '/alpha-readiness',
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
				'reportReady',
				'desktopShellUiBinding',
				'installSvelteKitPhpNativeHost',
				'@scriptgpt/desktop-shell-ui',
				'enableMicaWindowChrome',
				'syncTaskbarProgress',
				'toggleWindowMaximize'
			],
			proofUse:
				'Shows that native commands remain host-owned while the browser/PHP runtime exposes live Mica/progress/report handoff controls and records deterministic fallback state.'
		},
		noHydrationPrerenderFixture: {
			route: '/alpha-readiness/no-hydration',
			markers: [
				'no-hydration-fixture',
				'csr-disabled-prerender-contract',
				'theme-stable-ssr-html',
				'prerender=true',
				'csr=false',
				'forbiddenText:<script',
				'forbiddenText:sveltekit:start',
				'forbiddenText:data-sveltekit-hydrate'
			],
			proofUse:
				'Proves blog/static-theme pages can remain prerendered and client-hydration-free so the SSR theme is not repainted after load.'
		},
		nativeHostBindingGuide: {
			route: '/alpha-readiness/native-host-guide.md',
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
				'desktopShellUiBinding',
				'installSvelteKitPhpNativeHost',
				'@scriptgpt/desktop-shell-ui',
				'enableMicaWindowChrome',
				'syncTaskbarProgress',
				'toggleWindowMaximize'
			],
			proofUse:
				'Gives desktop-wrapper implementers a concrete host binding guide for Mica, titlebar, progress, report-ready handoff, and fallback history.'
		},
		nativeHostWrapperSmoke: {
			route: '/alpha-readiness/native-host-wrapper-smoke.json',
			markers: [
				'native-host-wrapper-smoke',
				'native-host-wrapper-probe',
				'contract-ready',
				'realHostVerified',
				'deterministic-host-wrapper-handoff',
				'report/alpha-native-host-wrapper-smoke.json',
				'TaskbarProgressState',
				'enableMicaWindowChrome',
				'syncTaskbarProgress',
				'toggleWindowMaximize'
			],
			proofUse:
				'Publishes deterministic wrapper-smoke handoff evidence while keeping real Windows/macOS host execution explicit and still unclaimed.'
		},
		nativeVisualMatrix: {
			route: '/alpha-readiness',
			markers: [
				'native-visual-matrix',
				'data-native-visual-matrix',
				'windows-mica-visual-row',
				'macos-traffic-light-row',
				'windows-caption-control-row',
				'ultragear-theme-row',
				'browser-fallback-visual-row'
			],
			proofUse:
				'Maps OS-style visual claims to concrete adapter markers and host-owned boundaries for alpha review.'
		},
		communityEvidenceLedger: {
			route: '/alpha-readiness',
			markers: [
				'Community evidence coverage ledger',
				'providerCoverage',
				'evidenceKindCoverage',
				'collectionRiskCoverage',
				'resultTotalFieldCoverage',
				'sampleReviewRuleCoverage',
				'Open-source analytics sources reviewers can audit first'
			],
			proofUse:
				'Shows provider, evidence-kind, collection-risk, and prioritized source coverage for open-source analytics.'
		},
		communityKeywordSearchGraph: {
			route: '/alpha-readiness/community-source-map.svg',
			markers: [
				'keywordSearchGraph',
				'keyword-search-graph',
				'analytics-linked-keyword-graph',
				'source-to-keyword-edge',
				'supported-api-lanes',
				'manual-research-lanes',
				'curated-signal-score',
				'collected-demand-score',
				'directional-community-signal',
				'no-live-community-api-runtime-boundary',
				'result-total-field-contract',
				'top-result-field-contract',
				'sample-review-rule',
				'resultTotalField',
				'topResultFields',
				'sampleReviewRule',
				'result_total_field',
				'top_result_fields',
				'sample_review_rule'
			],
			proofUse:
				'Links each alpha keyword to source hosts, API endpoints, manual research links, curated signal scores, collected demand-score handoff fields, CSV rows, and analytics handoff notes.'
		}
	};
	for (const [surface, details] of Object.entries(evidenceSurfaces)) {
		lines.push(`- ${surface}: ${details.proofUse ?? 'Alpha evidence surface.'}`);
		lines.push(`  - Route: ${details.route ?? '/alpha-readiness'}`);
		if (details.markers?.length) {
			lines.push(`  - Markers: ${details.markers.join(', ')}`);
		}
	}

	lines.push('', '## Alpha proof ledger', '');
	for (const item of report.proofLedger) {
		lines.push(`- ${item.id}: ${item.status}; marker ${item.marker}; ${item.proves}`);
		lines.push(`  - Stable blocker: ${item.stableBlocker}`);
	}

	const notableArtifacts = (manifest?.artifacts ?? []).filter((artifact) =>
		[
			'report/alpha-community-analytics.json',
			'report/alpha-remote-smoke.json',
			'report/alpha-release-checklist.md',
			'report/alpha-native-host-contract.json',
			'report/alpha-native-host-wrapper-smoke.json',
			'report/alpha-bridge-reuse.json',
			'report/alpha-hosted-smoke-checklist.json',
			'report/alpha-community-source-map.svg'
		].includes(artifact.path)
	);
	if (notableArtifacts.length > 0) {
		lines.push('', '## Proof-stage highlights', '');
		for (const artifact of notableArtifacts) {
			lines.push(
				`- ${artifact.path}: ${artifact.proofStage ?? 'unknown-stage'} / ${artifact.trustLevel ?? 'unknown-trust'}`
			);
		}
	}

	lines.push('', '## Required release commands', '');
	lines.push('- `bun run alpha:report:full`');
	lines.push('- `bun run alpha:native:smoke`');
	lines.push('- `bun run verify:alpha`');
	lines.push('- `bun run alpha:gate`');
	lines.push('- `ALPHA_SMOKE_BASE_URL=https://example.com/ bun run alpha:gate:hosted`');

	lines.push('', '## Known limitations', '');
	for (const limitation of report.limitations) {
		lines.push(`- ${limitation}`);
	}

	lines.push('');
	return lines.join('\n');
}


