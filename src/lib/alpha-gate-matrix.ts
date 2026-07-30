import type { AlphaReadinessReport } from './alpha-readiness';
import { buildAlphaHardProofBlockers } from './alpha-hard-proof-blockers';
import { requiredAlphaEvidence } from './alpha-required-evidence';

export function buildAlphaGateMatrix(report: AlphaReadinessReport) {
	return {
		target: report.target,
		issued: report.issued,
		overallScore: report.overallScore,
		requiredEvidence: requiredAlphaEvidence,
		proofStages: {
			'release-policy-evidence-boundary':
				'Required alpha evidence markers that must stay synchronized across package metadata, canonical report JSON, generated reports, graphics, manifests, hosted smoke, and release-prep contracts.',
			'generated-from-source':
				'Report, graphic, CSV, manifest, native platform provenance, and contract artifacts generated from source-controlled alpha modules.',
			'collected-public-source-data':
				'Community analytics collected from public JSON APIs; useful as directional evidence, not telemetry.',
			'hosted-smoke-proof':
				'External PHP-host evidence generated only when ALPHA_SMOKE_BASE_URL points at a real deployment.',
			'package-consumer-proof':
				'Packed npm artifact install/import evidence from a temporary external consumer.',
			'live-runtime-surface-proof':
				'Runtime/live page evidence surfaces rendered from source modules, used for reviewer-visible native host and community coverage proof.',
			'hard-proof-blocker-ledger':
				'Machine-readable list of proof still required before stable 1.0.0, real native-host claims, or fresh community claims can be made.'
		},
		hardProofBlockers: buildAlphaHardProofBlockers(),
		gates: [
			{
				id: 'report-bundle',
				scope: 'local',
				proofStage: 'generated-from-source',
				command: 'bun run alpha:report:full',
				proves:
					'Generates community analytics, hosted-smoke placeholder/evidence, reports, graphics, CSVs, manifests, native platform provenance evidence, and release notes.',
				requiredMarkers: [
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
					'data-ultragear-source-parity',
					'ultraGearParityContract',
					'lg-ultragear-native-platform-provenance',
					'native-host-compatibility-matrix',
					'source-observed-host-compatibility-contract',
					'features.micaSupported',
					'ShellFeatureProbe.mica_supported',
					'current_shell_features()',
					'cfg!(target_os = "windows")',
					'windows-mica-effects',
					'taskbar-progress-reporting',
					'native-titlebar-drag-maximize',
					'lg-ultragear-host-permission-checklist',
					'realHostPermissionChecklist',
					'hostPermissionCues',
					'requiredHostPermission',
					'src-tauri/capabilities/default.json',
					'progressReportHandoff',
					'csr-disabled-prerender-contract',
					'theme-stable-ssr-html',
					'no-hydration-fixture',
					'sourceToKeywordEdge',
					'analyticsLinkageMarker',
					'weightedDemandScore',
					'freshnessMaxAgeHours',
					'trustBoundary',
					'result-total-field-contract',
					'top-result-field-contract',
					'sample-review-rule',
					'resultTotalField',
					'topResultFields',
					'sampleReviewRule',
					'manualReviewRequired'
				],
				requiredArtifacts: [
					'report/alpha-community-analytics.json',
					'report/alpha-community-analytics.md',
					'report/alpha-community-source-map.svg',
					'report/alpha-community-research-pack.json',
					'report/alpha-community-signals.csv',
					'report/alpha-community-sources.csv',
					'report/alpha-readiness.json',
					'report/alpha-readiness.full.json',
					'report/alpha-readiness.csv',
					'report/alpha-readiness.md',
					'report/alpha-readiness.html',
					'report/alpha-review-index.md',
					'report/alpha-release-checklist.md',
					'report/alpha-readiness.svg',
					'report/alpha-native-host-contract.json',
					'report/alpha-native-host-guide.md',
					'report/alpha-native-host-wrapper-smoke.json',
					'report/alpha-bridge-reuse.json',
					'report/alpha-evidence-index.json',
					'report/alpha-hosted-smoke-checklist.json',
					'report/alpha-package-contract.json',
					'report/alpha-release-manifest.json',
					'report/alpha-release-notes.md'
				]
			},
			{
				id: 'alpha-contract',
				scope: 'local',
				proofStage: 'generated-from-source',
				command: 'bun run verify:alpha',
				proves:
					'Verifies report source files, generated artifacts, runtime endpoints, native bridge map, native platform provenance, community research pack, and release notes.',
				requiredArtifacts: [
					'report/alpha-release-manifest.json',
					'report/alpha-gate-matrix.json',
					'report/alpha-bridge-reuse.json',
					'report/alpha-readiness.html',
					'report/alpha-readiness.md',
					'report/alpha-readiness.svg'
				]
			},
			{
				id: 'required-alpha-evidence',
				scope: 'local',
				proofStage: 'release-policy-evidence-boundary',
				command: 'bun run verify:alpha',
				proves:
					'Verifies requiredEvidence markers for native host guide, no-hydration prerender proof, native wrapper smoke, Windows 11 Mica browser-safe shell, macOS-style titlebar rhythm, report graphics, community keyword graph, analytics freshness, adapter platform emulation, and hosted PHP smoke proof across canonical and generated alpha evidence.',
				requiredEvidence: requiredAlphaEvidence,
				requiredArtifacts: [
					'report/alpha-readiness.json',
					'report/alpha-readiness.html',
					'report/alpha-readiness.md',
					'report/alpha-readiness.svg',
					'report/alpha-release-manifest.json',
					'report/alpha-evidence-index.json',
					'report/alpha-package-contract.json',
					'report/alpha-hosted-smoke-checklist.json',
					'report/alpha-review-index.md',
					'report/alpha-release-checklist.md',
					'report/alpha-release-notes.md'
				]
			},
			{
				id: 'live-evidence-surfaces',
				scope: 'local',
				proofStage: 'live-runtime-surface-proof',
				command: 'bun run verify:alpha',
				proves:
					'Verifies /alpha-readiness exposes native host bridge status, native host handoff controls, native platform provenance, and community evidence coverage ledger markers through source, manifest, evidence index, hosted checklist, release notes, and reviewer index.',
				requiredMarkers: [
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
					'data-native-host-bridge-status',
					'data-native-host-handoff-controls',
					'lg-ultragear-host-permission-checklist',
					'native-host-compatibility-matrix',
					'source-observed-host-compatibility-contract',
					'features.micaSupported',
					'ShellFeatureProbe.mica_supported',
					'current_shell_features()',
					'cfg!(target_os = "windows")',
					'windows-mica-effects',
					'taskbar-progress-reporting',
					'native-titlebar-drag-maximize',
					'realHostPermissionChecklist',
					'hostPermissionCues',
					'requiredHostPermission',
					'src-tauri/capabilities/default.json',
					'native-host-wrapper-probe',
					'csr-disabled-prerender-contract',
					'theme-stable-ssr-html',
					'no-hydration-fixture',
					'data-ultragear-source-parity',
					'sourceToKeywordEdge',
					'analyticsLinkageMarker',
					'weightedDemandScore',
					'freshnessMaxAgeHours',
					'trustBoundary',
					'result-total-field-contract',
					'top-result-field-contract',
					'sample-review-rule',
					'resultTotalField',
					'topResultFields',
					'sampleReviewRule',
					'manualReviewRequired'
				],
				requiredArtifacts: [
					'report/alpha-bridge-reuse.json',
					'report/alpha-evidence-index.json',
					'report/alpha-release-manifest.json',
					'report/alpha-hosted-smoke-checklist.json',
					'report/alpha-native-host-guide.md',
					'report/alpha-native-host-wrapper-smoke.json',
					'report/alpha-review-index.md',
					'report/alpha-release-checklist.md',
					'report/alpha-release-notes.md'
				]
			},
			{
				id: 'native-host-wrapper-smoke',
				scope: 'local',
				proofStage: 'live-runtime-surface-proof',
				command: 'bun run alpha:native:smoke',
				proves:
					'Writes deterministic wrapper smoke evidence for the native-host probe sequence, LG UltraGear helper mapping, and TaskbarProgressState translation without importing native APIs into the adapter runtime.',
				requiredArtifacts: ['report/alpha-native-host-wrapper-smoke.json']
			},
			{
				id: 'no-hydration-prerender-fixture',
				scope: 'hosted',
				proofStage: 'live-runtime-surface-proof',
				command: 'bun run alpha:remote:smoke',
				proves:
					'Checks /alpha-readiness/no-hydration for stable prerendered csr=false HTML and rejects client hydration script markers that can repaint blog/static themes after load.',
				requiredMarkers: [
					'no-hydration-fixture',
					'csr-disabled-prerender-contract',
					'theme-stable-ssr-html'
				],
				forbiddenMarkers: ['<script', 'sveltekit:start', 'data-sveltekit-hydrate']
			},
			{
				id: 'release-prep',
				scope: 'local',
				proofStage: 'package-consumer-proof',
				command: 'bun run verify:release-prep',
				proves:
					'Verifies package metadata, env placeholders, CI markers, hosted-gate wrapper, report pipeline, artifact-sync contract, and hosted smoke coverage contract.',
				requiredArtifacts: [
					'docs/ALPHA-RELEASE-CHECKLIST.md',
					'report/alpha-release-checklist.md'
				]
			},
			{
				id: 'local-alpha-gate',
				scope: 'local',
				proofStage: 'package-consumer-proof',
				command: 'bun run alpha:gate',
				proves:
					'Runs the full deterministic local alpha gate including builds, strict artifact-sync verification, unit/PHP/check gates, route verification, E2E projects, and packed consumer smoke.',
				requiredArtifacts: ['report/alpha-release-manifest.json']
			},
			{
				id: 'hosted-smoke',
				scope: 'hosted',
				proofStage: 'hosted-smoke-proof',
				command: 'bun run alpha:remote:smoke',
				environment: ['ALPHA_SMOKE_BASE_URL'],
				proves: 'Checks deployed PHP-hosted pages, report endpoints, content types, form POST action, and traversal leak probes.',
				requiredArtifacts: ['report/alpha-remote-smoke.json']
			},
			{
				id: 'hosted-alpha-gate',
				scope: 'hosted',
				proofStage: 'hosted-smoke-proof',
				command: 'bun run alpha:gate:hosted',
				environment: ['ALPHA_SMOKE_BASE_URL'],
				proves: 'Runs the full local alpha gate, hosted smoke, report regeneration, and final alpha verification with hosted evidence embedded.',
				requiredArtifacts: [
					'report/alpha-remote-smoke.json',
					'report/alpha-readiness.full.json',
					'report/alpha-release-manifest.json',
					'report/alpha-release-checklist.md'
				]
			}
		],
		runtimeEvidenceEndpoints: [
			'/alpha-readiness',
			'/alpha-readiness/no-hydration',
			'/alpha-readiness/report.json',
			'/alpha-readiness/report.html',
			'/alpha-readiness/report.md',
			'/alpha-readiness/release-notes.md',
			'/alpha-readiness/release-checklist.md',
			'/alpha-readiness/report.svg',
			'/alpha-readiness/community-source-map.svg',
			'/alpha-readiness/release-manifest.json',
			'/alpha-readiness/gate-matrix.json',
			'/alpha-readiness/evidence-index.json',
			'/alpha-readiness/package-contract.json',
			'/alpha-readiness/native-host-contract.json',
			'/alpha-readiness/native-host-guide.md',
			'/alpha-readiness/native-host-wrapper-smoke.json',
			'/alpha-readiness/hosted-smoke-checklist.json',
			'/alpha-readiness/bridge-reuse.json',
			'/alpha-readiness/review-index.md',
			'/alpha-readiness/community-signals.json',
			'/alpha-readiness/community-analytics.md',
			'/alpha-readiness/community-research-pack.json',
			'/alpha-readiness/readiness.csv',
			'/alpha-readiness/community-signals.csv',
			'/alpha-readiness/community-sources.csv'
		],
		completionBlockers: [
			'Generated report artifacts must be refreshed after source edits before the alpha bundle can be reviewed as current.',
			'Checked-in adapter/index.js must match a strict temporary build from adapter/src/index.ts before the alpha gate can pass.',
			'Native platform provenance markers must remain synchronized across bridge reuse, reports, graphics, evidence index, manifest, hosted smoke checklist, release notes, and reviewer index.',
			'Native host compatibility matrix markers must remain synchronized across native host contract, bridge reuse, evidence index, manifest, gate matrix, hosted smoke checklist, remote smoke, release-prep, and generated reports.',
			'Real host permission checklist markers must remain synchronized across native contract, bridge reuse, package contract, gate matrix, hosted smoke checklist, report graphics, release notes, and reviewer index before any OS-native Mica/taskbar/drag/maximize claim is promoted.',
			'Desktop shell helper binding markers must remain synchronized across /alpha-readiness, report HTML, report Markdown, report SVG, native-host guide, bridge reuse, manifest, evidence index, hosted smoke checklist, release-prep, and remote smoke.',
			'Live evidence surface markers must remain synchronized across /alpha-readiness, evidence index, manifest, hosted smoke checklist, release notes, and reviewer index.',
			'Native host handoff controls must keep data-native-host-handoff-controls, set-window-effect, set-progress, clear-progress, and report-ready synchronized across live and generated alpha evidence.',
			'Native host binding guide must remain generated, hosted, and verifier-covered so desktop-wrapper implementers can bind the LG UltraGear-inspired actions without changing the PHP adapter boundary.',
			'Native host wrapper smoke must remain generated, hosted, and verifier-covered so wrapper implementers have deterministic handoff evidence before real OS-native smoke.',
			'No-hydration fixture proof must remain hosted-smoke-covered so blog/static-theme deployments do not regress into client hydration repaint behavior.',
			'Required alpha evidence must remain synchronized across package metadata, canonical report JSON, live page, generated reports, graphics, release manifest, evidence index, package contract, hosted smoke checklist, and remote smoke.',
			'Adapter platform emulation must remain synchronized across adapter source, generated adapter bundle, package contract, release manifest, evidence index, release-prep, and generated reports.',
			'The source-rendered alpha release checklist must remain synchronized across docs, runtime endpoint, generated artifact, package contract, manifest, evidence index, hosted smoke checklist, and release-prep.',
			'Community analytics remain directional until bun run alpha:analytics runs successfully against public sources.',
			'Community analytics freshness must be reviewed with community-analytics-freshness-contract before alpha release claims use collected public-source counts.',
			'Stable 1.0.0 remains unproven until ALPHA_SMOKE_BASE_URL points at a real deployed PHP host and bun run alpha:gate:hosted passes.'
		]
	};
}
