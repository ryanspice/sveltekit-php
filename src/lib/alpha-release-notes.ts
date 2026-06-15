import type { AlphaReadinessReport } from './alpha-readiness';
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
} | null;

export function renderAlphaReleaseNotes(report: AlphaReadinessReport, manifest: ManifestLike = null) {
	const readyAreas = report.readinessAreas.filter((area) => area.status === 'ready');
	const watchAreas = report.readinessAreas.filter((area) => area.status === 'watch');
	const blockedAreas = report.readinessAreas.filter((area) => area.status === 'blocked');
	const hostedStatus = manifest?.hostedAlphaSmoke?.status ?? 'missing';
	const hostedCheckCount = manifest?.hostedAlphaSmoke?.checkCount ?? 0;
	const requiredEvidence = manifest?.requiredEvidence ?? requiredAlphaEvidence;
	const endpoints = manifest?.runtimeEndpoints ?? [
		{ path: '/alpha-readiness', kind: 'native-styled-report-page' },
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
		`This is an alpha candidate, not stable 1.0.0. The local evidence bundle is designed for runtime correctness, deployment safety, native-styled review, and open-source community research handoff.`,
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
				'packages/desktop-shell-ui/src/index.ts',
				'@scriptgpt/desktop-shell-ui',
				'desktopShellUiBinding',
				'enableMicaWindowChrome',
				'syncTaskbarProgress',
				'toggleWindowMaximize',
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
				'Records the exact LG UltraGear source files and cue families behind Windows Mica, macOS-style chrome, host-owned window actions, and structured report/progress handoff.'
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
		nativeHostBindingGuide: {
			route: '/alpha-readiness/native-host-guide.md',
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
				'directional-community-signal'
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

