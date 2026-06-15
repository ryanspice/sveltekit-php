import type { AlphaReadinessReport } from './alpha-readiness';
import { requiredAlphaEvidence } from './alpha-required-evidence';

type ReviewEvidence = {
	claim: string;
	status: 'present' | 'requires-hosted-proof';
	evidence: string[];
};

const runtimeEvidence = [
	'/alpha-readiness',
	'/alpha-readiness/report.html',
	'/alpha-readiness/report.md',
	'/alpha-readiness/release-checklist.md',
	'/alpha-readiness/report.svg',
	'/alpha-readiness/community-source-map.svg',
	'/alpha-readiness/native-host-contract.json',
	'/alpha-readiness/native-host-guide.md',
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
			claim: 'Required alpha evidence covers native host guide, native shell styling, report graphics, community graph, freshness contract, and hosted PHP smoke proof.',
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
			claim: '1.0.2-alpha package track is explicit and reviewable.',
			status: 'present',
			evidence: [`package.json version should match ${report.target}`, '/alpha-readiness/report.json']
		},
		{
			claim: 'Windows 11 Mica and macOS-native styling are represented without importing Tauri into the PHP adapter runtime.',
			status: 'present',
			evidence: [
				'/alpha-readiness',
				'/alpha-readiness/bridge-reuse.json',
				'/alpha-readiness/native-host-contract.json',
				'/alpha-readiness/native-host-guide.md',
				'data-native-host-bridge-status',
				'data-native-host-handoff-controls',
				'data-ultragear-source-parity',
				'ultraGearParityContract',
				'lg-ultragear-native-platform-provenance',
				'packages/desktop-shell-ui/src/index.ts',
				'packages/ultragear-widget-ui/src/app.ts',
				'@scriptgpt/desktop-shell-ui',
				'desktopShellUiBinding',
				'installSvelteKitPhpNativeHost',
				'getDesktopShellUiCommandMapping',
				'nativeHostBridgeMapping',
				'desktopShellUiHelper',
				'desktopShellUiEvidence',
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
			claim: 'Full report outputs exist for browser review, PR handoff, release notes, and graphics.',
			status: 'present',
			evidence: ['/alpha-readiness/report.html', '/alpha-readiness/report.md', '/alpha-readiness/report.svg', '/alpha-readiness/community-source-map.svg']
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
				'Community evidence coverage ledger',
				'Open-source analytics sources reviewers can audit first',
				'providerCoverage / evidenceKindCoverage / collectionRiskCoverage',
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

	lines.push(
		'',
		'## Required reviewer commands',
		'',
		'- `bun run alpha:report:full`',
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

