import type { AlphaReadinessReport } from './alpha-readiness';
import { buildAlphaHardProofBlockers } from './alpha-hard-proof-blockers';
import { requiredAlphaEvidence } from './alpha-required-evidence';

type ReviewEvidence = {
	claim: string;
	status: 'present' | 'requires-hosted-proof';
	evidence: string[];
};

const runtimeEvidence = [
	'/alpha-readiness',
	'/alpha-readiness/no-hydration',
	'/alpha-readiness/report.html',
	'/alpha-readiness/report.md',
	'/alpha-readiness/release-checklist.md',
	'/alpha-readiness/report.svg',
	'/alpha-readiness/community-source-map.svg',
	'/alpha-readiness/native-host-contract.json',
	'/alpha-readiness/native-host-guide.md',
	'/alpha-readiness/native-host-wrapper-smoke.json',
	'/alpha-readiness/bridge-reuse.json',
	'/alpha-readiness/community-analytics.md',
	'/alpha-readiness/community-research-pack.json',
	'/alpha-readiness/community-signals.csv',
	'/alpha-readiness/community-sources.csv',
	'/alpha-readiness/release-manifest.json',
	'/alpha-readiness/evidence-index.json',
	'/alpha-readiness/package-contract.json',
	'/alpha-readiness/gate-matrix.json',
	'/alpha-readiness/hosted-smoke-checklist.json'
];

const generatedEvidence = [
	'report/alpha-readiness.html',
	'report/alpha-readiness.md',
	'report/alpha-release-checklist.md',
	'report/alpha-readiness.svg',
	'report/alpha-community-source-map.svg',
	'report/alpha-native-host-contract.json',
	'report/alpha-native-host-guide.md',
	'report/alpha-native-host-wrapper-smoke.json',
	'report/alpha-bridge-reuse.json',
	'report/alpha-community-analytics.json',
	'report/alpha-community-analytics.md',
	'report/alpha-community-research-pack.json',
	'report/alpha-community-signals.csv',
	'report/alpha-community-sources.csv',
	'report/alpha-release-manifest.json',
	'report/alpha-evidence-index.json',
	'report/alpha-package-contract.json',
	'report/alpha-gate-matrix.json',
	'report/alpha-hosted-smoke-checklist.json',
	'report/alpha-remote-smoke.json'
];

const documentationEvidence = ['docs/ALPHA-RELEASE-CHECKLIST.md'];

function reviewCoverage(report: AlphaReadinessReport): ReviewEvidence[] {
	return [
		{
			claim: '1.0.2-alpha is the explicit channel and must not drift into RC or stable release semantics.',
			status: 'present',
			evidence: [
				'alpha-over-rc-release-policy',
				'docs/ALPHA-RELEASE-CHECKLIST.md',
				'releasePolicy.channel=alpha',
				'releasePolicy.track=1.0.2-alpha',
				'releasePolicy.rank=above-rc',
				'projectRankPolicy=above-rc',
				'1.0.2-alpha is the required pre-stable release label',
				'disallowedCandidateLabels=rc/latest/stable',
				'alphaOverRcPolicyProof',
				'requiredEvidence',
				'required-alpha-evidence',
				'/alpha-readiness/release-manifest.json',
				'/alpha-readiness/evidence-index.json',
				'/alpha-readiness/package-contract.json',
				'/alpha-readiness/release-notes.md'
			]
		},
		{
			claim: 'The alpha release checklist is included in the package and synchronized with generated evidence surfaces.',
			status: 'present',
			evidence: [
				'docs/ALPHA-RELEASE-CHECKLIST.md',
				'1.0.2-alpha release checklist',
				'desktop-shell-ui-command-mapping',
				'community-analytics-csv-linkage',
				'router-path-safety-artifact-sync',
				'adapter-platform-emulation',
				'deploy-env-preflight-safety',
				'/alpha-readiness/release-manifest.json alphaReleaseChecklist',
				'/alpha-readiness/evidence-index.json alpha-release-checklist',
				'/alpha-readiness/package-contract.json alphaReleaseChecklistProof',
				'/alpha-readiness/release-checklist.md',
				'report/alpha-release-checklist.md',
				'/alpha-readiness/package-contract.json docs/ALPHA-RELEASE-CHECKLIST.md'
			]
		},
		{
			claim: 'Required alpha evidence covers native host guide, real host permission checklist, native host compatibility matrix, no-hydration prerender proof, native shell styling, report graphics, community graph, freshness contract, and hosted PHP smoke proof.',
			status: 'present',
			evidence: [
				...requiredAlphaEvidence,
				'/alpha-readiness/release-manifest.json requiredEvidence',
				'/alpha-readiness/evidence-index.json required-alpha-evidence',
				'/alpha-readiness/package-contract.json requiredEvidence',
				'/alpha-readiness/hosted-smoke-checklist.json contentExpectations'
			]
		},
		{
			claim: 'Blog/static-theme pages have a no-hydration prerender contract to prevent client repaint after load.',
			status: 'present',
			evidence: [
				'/alpha-readiness/no-hydration',
				'no-hydration-fixture',
				'csr-disabled-prerender-contract',
				'theme-stable-ssr-html',
				'prerender=true',
				'csr=false',
				'remote smoke forbids <script, sveltekit:start, and data-sveltekit-hydrate'
			]
		},
		{
			claim: 'Current Svelte 5/SvelteKit 2 same-major adapter support is separated from Vite 8/plugin 7 validation risk.',
			status: 'present',
			evidence: [
				'latest-sveltekit-compatibility-audit',
				'svelte latest 5.56.4',
				'@sveltejs/kit latest 2.69.1',
				'@sveltejs/vite-plugin-svelte latest 7.1.4',
				'vite latest 8.1.3',
				'@sveltejs/adapter-node latest 5.5.7',
				'@sveltejs/adapter-static latest 3.0.10',
				'@sveltejs/adapter-cloudflare latest 7.2.9',
				'@sveltejs/adapter-netlify latest 6.0.4',
				'@sveltejs/adapter-vercel latest 6.3.4',
				'@sveltejs/adapter-auto latest 7.0.1',
				'alpha:latest-same-major:smoke',
				'Vite 8 isolated validation lane'
			]
		},
		{
			claim: 'blog.ryanspice.com is live consumer evidence for static/no-hydration behavior and SEO health, but not a replacement for the hosted adapter fixture.',
			status: 'requires-hosted-proof',
			evidence: [
				'live-blog-consumer-evidence',
				'https://blog.ryanspice.com/',
				'consumer-proof-not-hosted-fixture',
				'homepage 200',
				'robots.txt 200',
				'sitemap.xml 200',
				'data-site="ryan"',
				'no sveltekit:start marker',
				'no module script marker',
				'no __sveltekit marker',
				'seo_audit_python A-',
				'seo_audit_python score 91',
				'28 pages scanned',
				'blog.ryanspice.com-root-20260701T060746Z-v0_4_9',
				'dedicated hosted PHP adapter fixture still required'
			]
		},
		{
			claim: 'Native wrapper replay is deterministic handoff evidence, not real OS-native proof yet.',
			status: 'present',
			evidence: [
				'/alpha-readiness/native-host-wrapper-smoke.json',
				'report/alpha-native-host-wrapper-smoke.json',
				'native-host-wrapper-event-replay',
				'native-host-wrapper-event-replay-step',
				'expectedHistoryResult',
				'expectedDesktopShellUiHelper',
				'noFallbackAllowedForRealHost',
				'expectedHistoryResult.mode=native-host',
				'expectedHistoryResult.handled=true',
				'realHostVerified=false',
				'noNativeApiBoundary',
				'stable requires a real Windows/macOS wrapper smoke run'
			]
		},
		{
			claim: '1.0.2-alpha package track is explicit and reviewable.',
			status: 'present',
			evidence: [`package.json version should match ${report.target}`, '/alpha-readiness/report.json']
		},
		{
			claim: 'Windows 11 Mica, macOS-style chrome rhythm, and source-observed macOS material host policy are represented without importing Tauri into the PHP adapter runtime.',
			status: 'present',
			evidence: [
				'/alpha-readiness',
				'/alpha-readiness/bridge-reuse.json',
				'/alpha-readiness/native-host-contract.json',
				'/alpha-readiness/native-host-guide.md',
				'/alpha-readiness/native-host-wrapper-smoke.json',
				'data-native-host-bridge-status',
				'data-native-host-handoff-controls',
				'data-ultragear-source-parity',
				'ultraGearParityContract',
				'native-host-compatibility-matrix',
				'source-observed-host-compatibility-contract',
				'lg-ultragear-native-platform-provenance',
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
				'installSvelteKitPhpNativeHost',
				'getDesktopShellUiCommandMapping',
				'nativeHostBridgeMapping',
				'desktopShellUiHelper',
				'desktopShellUiEvidence',
				'native-host-wrapper-smoke',
				'native-host-wrapper-probe',
				'realHostVerified=false',
				'buildNativeHostWrapperProbe',
				'report/alpha-native-host-wrapper-smoke.json',
				'enableMicaWindowChrome',
				'syncTaskbarProgress',
				'toggleWindowMaximize',
				'Effect.Mica',
				'win.setEffects',
				'data-native-platform',
				'data-window-control-group',
				'win.startDragging',
				'win.setProgressBar',
				'reportJson',
				'reportUrl',
				'data-progress-report-handoff',
				'progressReportHandoff',
				'applyWindowChrome',
				'syncWindowProgress',
				'ProgressBarStatus.Indeterminate',
				'ProgressBarStatus.None',
				'statusMapping',
				'report-ready',
				'data-native-visual-matrix',
				'nativeVisualMatrix',
				'native-visual-matrix',
				'windows-mica-visual-row',
				'macos-traffic-light-row',
				'windows-caption-control-row',
				'ultragear-theme-row',
				'browser-fallback-visual-row',
				'report/alpha-readiness.full.json',
				'DRAG_START_THRESHOLD_PX',
				'window.__SVELTEKIT_PHP_NATIVE_HOST__',
				'window.__SVELTEKIT_PHP_NATIVE_HOST_HISTORY__',
				'set-window-effect',
				'set-progress',
				'clear-progress',
				'report-ready',
				'setWindowEffect',
				'setProgress',
				'clearProgress',
				'reportReady',
				'browser-fallback',
				'src/lib/components/native-shell/NativeWindowShell.svelte',
				'src/lib/components/native-shell/NativeTitlebar.svelte',
				'src/lib/components/native-shell/NativeHostBridgeStatus.svelte'
			]
		},
		{
			claim: 'Source-observed native host compatibility is mapped without becoming real OS-native proof yet.',
			status: 'present',
			evidence: [
				'native-host-compatibility-matrix',
				'source-observed-host-compatibility-contract',
				'/alpha-readiness/native-host-contract.json nativeHostCompatibilityMatrix',
				'/alpha-readiness/bridge-reuse.json nativeHostCompatibilityMatrix',
				'/alpha-readiness/hosted-smoke-checklist.json native-host-compatibility-matrix',
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
				'stable still requires real Windows/macOS host smoke proof'
			]
		},
		{
			claim:
				'Real OS-native Mica, taskbar progress, drag, and maximize claims require explicit host permission evidence.',
			status: 'present',
			evidence: [
				'/alpha-readiness/native-host-contract.json',
				'/alpha-readiness/native-host-guide.md',
				'/alpha-readiness/bridge-reuse.json',
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
				'core:window:allow-set-focus',
				'macos-material-host-policy',
				'source-observed-macos-host-scaffold',
				'macos-native-vibrancy-unverified',
				'MacosLauncher::LaunchAgent',
				'mica_supported: cfg!(target_os = "windows")',
				'stable blocker: real wrapper must prove these permissions before realHostVerified can become true'
			]
		},
		{
			claim:
				'Host-owned transparent webview and chrome-state markers are explicit review evidence, not implicit PHP runtime claims.',
			status: 'present',
			evidence: [
				'/alpha-readiness/report.html',
				'/alpha-readiness/report.svg',
				'/alpha-readiness/bridge-reuse.json',
				'windowChromeState',
				'mica-active',
				'mica-inactive',
				'plain',
				'data-window-chrome-state',
				'data-window-chrome-state="mica-active"',
				'transparent-webview-material-boundary',
				'data-transparent-webview-material-boundary="host-owned"',
				'webview.setBackgroundColor([0, 0, 0, 0])',
				'host-owned material boundary; PHP adapter emits deterministic markers only'
			]
		},
		{
			claim: 'Full report outputs exist for browser review, PR handoff, release notes, and graphics.',
			status: 'present',
			evidence: [
				'/alpha-readiness/report.html',
				'/alpha-readiness/report.md',
				'/alpha-readiness/report.svg',
				'/alpha-readiness/community-source-map.svg',
				'/alpha-readiness/native-host-wrapper-smoke.json',
				'report/alpha-native-host-wrapper-smoke.json',
				'native-host-wrapper-smoke markers embedded in HTML/Markdown/SVG report outputs'
			]
		},
		{
			claim: 'Keyword searches and open-source community analytics are linked to auditable sources.',
			status: 'present',
			evidence: [
				'/alpha-readiness/community-analytics.md',
				'/alpha-readiness/community-research-pack.json',
				'/alpha-readiness/community-source-map.svg',
				'/alpha-readiness/community-sources.csv',
				'data-community-keyword-search-graph',
				'keywordSearchGraph',
				'analytics-linked-keyword-graph',
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
				'result_total_field',
				'top_result_fields',
				'sample_review_rule',
				'releaseUse',
				'blockedOutcomePolicy',
				'Community evidence coverage ledger',
				'Open-source analytics sources reviewers can audit first',
				'providerCoverage / evidenceKindCoverage / collectionRiskCoverage / sourceHealthCoverage',
				'provider/evidence-kind/risk/priority metadata in community source descriptors',
				'api.github.com/search'
			]
		},
		{
			claim: 'Hosted PHP deployment evidence is defined but not complete until the remote smoke gate runs.',
			status: 'requires-hosted-proof',
			evidence: ['ALPHA_SMOKE_BASE_URL', 'bun run alpha:gate:hosted', '/alpha-readiness/hosted-smoke-checklist.json', 'report/alpha-remote-smoke.json']
		},
		{
			claim: 'Hard proof blockers are centralized so stable promotion gaps cannot drift across report surfaces.',
			status: 'present',
			evidence: [
				'hard-proof-blocker-ledger',
				'hardProofBlockers',
				'src/lib/alpha-hard-proof-blockers.ts',
				'/alpha-readiness/release-manifest.json hardProofBlockers',
				'/alpha-readiness/gate-matrix.json hardProofBlockers',
				'/alpha-readiness/evidence-index.json hard-proof-blocker-ledger',
				'/alpha-readiness/package-contract.json stablePromotionBlockers',
				'packed-consumer-install-import-proof',
				'source-to-generated-bundle-check',
				'real-native-host-wrapper-smoke-required'
			]
		},
		{
			claim: 'Alpha proof ledger separates alpha-ready evidence from local and hosted proof still required before stable.',
			status: 'present',
			evidence: [
				'Alpha proof ledger',
				'alpha-runtime-gate-ledger',
				'hosted-php-smoke-proof-required',
				'native-visual-matrix',
				'analytics-linked-keyword-graph',
				'/alpha-readiness/report.json proofLedger',
				'/alpha-readiness/release-manifest.json proofLedger'
			]
		}
	];
}

export function renderAlphaReviewIndexMarkdown(report: AlphaReadinessReport) {
	const hardProofBlockers = buildAlphaHardProofBlockers();
	const lines = [
		`# SvelteKit PHP ${report.target} alpha reviewer index`,
		'',
		`Issued: ${report.issued}`,
		`Bridge source: ${report.bridgeSource}`,
		`Overall readiness: ${report.overallScore}/100`,
		'',
		'This index maps the requested alpha end state to concrete runtime links, generated artifacts, and remaining proof gates. It is intentionally review-oriented: use it before deciding whether the package is alpha-ready or stable-ready.',
		'',
		'## Objective coverage',
		''
	];

	for (const item of reviewCoverage(report)) {
		lines.push(`### ${item.claim}`, '');
		lines.push(`- Status: ${item.status}`);
		lines.push('- Evidence:');
		for (const evidence of item.evidence) {
			lines.push(`  - ${evidence}`);
		}
		lines.push('');
	}

	lines.push('## Runtime evidence links', '');
	for (const endpoint of runtimeEvidence) {
		lines.push(`- ${endpoint}`);
	}

	lines.push('', '## Release documentation artifacts', '');
	for (const documentPath of documentationEvidence) {
		lines.push(`- ${documentPath}`);
	}

	lines.push('', '## Generated report bundle artifacts', '');
	for (const artifact of generatedEvidence) {
		lines.push(`- ${artifact}`);
	}

	lines.push('', '## Required alpha evidence', '');
	for (const marker of requiredAlphaEvidence) {
		lines.push(`- ${marker}`);
	}

	lines.push('', '## Hard proof blockers', '');
	for (const blocker of hardProofBlockers) {
		lines.push(`### ${blocker.id}`, '');
		lines.push(`- Marker: ${blocker.marker}`);
		lines.push(`- Status: ${blocker.status}`);
		lines.push(`- Scope: ${blocker.scope}`);
		lines.push(`- Required command: \`${blocker.requiredCommand}\``);
		if (blocker.requiredEnvironment?.length) {
			lines.push(`- Required environment: ${blocker.requiredEnvironment.join(', ')}`);
		}
		lines.push(`- Required artifacts: ${blocker.requiredArtifacts.join(', ')}`);
		lines.push(`- Blocks: ${blocker.blocks}`);
		lines.push(`- Reviewer action: ${blocker.reviewerAction}`, '');
	}

	lines.push(
		'',
		'## Required reviewer commands',
		'',
		'- `bun run alpha:report:full`',
		'- `bun run alpha:native:smoke`',
		'- `bun run verify:alpha`',
		'- `bun run alpha:gate`',
		'- `ALPHA_SMOKE_BASE_URL=https://example.com/ bun run alpha:gate:hosted`',
		'',
		'## Stable 1.0.0 blocker',
		'',
		'Stable 1.0.0 remains unproven until the hosted PHP smoke gate passes against a real deployed PHP host. The alpha evidence bundle can be reviewed locally, but hosted correctness requires `ALPHA_SMOKE_BASE_URL` and `bun run alpha:gate:hosted`.',
		''
	);

	return lines.join('\n');
}

