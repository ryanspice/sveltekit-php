import type { AlphaReadinessReport } from './alpha-readiness';
import { requiredAlphaEvidence } from './alpha-required-evidence';

export function buildAlphaPackageContract(report: AlphaReadinessReport) {
	return {
		target: report.target,
		packageName: 'sveltekit-php',
		requiredEvidence: requiredAlphaEvidence,
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
				'docs/ALPHA-READINESS.md',
				'docs/ALPHA-RELEASE-CHECKLIST.md'
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
				'package-level release policy records required alpha evidence for native host guide, native shell styling, report graphics, community analytics freshness, and hosted PHP smoke proof',
				'private:false is set for publish readiness',
				'committed env files remain placeholder-safe',
				'leftover root package tarballs are rejected',
				'deploy precheck rejects missing, placeholder, malformed, or unsafe operational values',
				'alpha gate keeps strict generated artifact sync wired to adapter/index.js'
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
				'deploy scripts read operational values from private env/CI instead of committed literals'
			]
		},
		reportEvidenceBoundary: {
			proofStage: 'generated-from-source',
			trustLevel: 'release-evidence-not-package-api',
			proves:
				'Alpha readiness endpoints, release checklist, graphics, manifests, native platform provenance, native host binding guide, and community analytics are release evidence for reviewers, not npm adapter exports.'
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
			],
			proves: [
				'/alpha-readiness/release-checklist.md exposes the project-specific 1.0.2-alpha policy and proof checklist as runtime evidence',
				'report/alpha-release-checklist.md is regenerated with the report bundle rather than manually patched',
				'docs/ALPHA-RELEASE-CHECKLIST.md remains the source-controlled human checklist packaged for release review'
			]
		},
		nativePlatformProvenanceProof: {
			proofStage: 'generated-from-source',
			trustLevel: 'lg-ultragear-native-platform-provenance',
			markers: [
				'lg-ultragear-native-platform-provenance',
				'packages/desktop-shell-ui/src/index.ts',
				'packages/ultragear-widget-ui/src/app.ts',
				'@scriptgpt/desktop-shell-ui',
				'desktopShellUiBinding',
				'getDesktopShellUiCommandMapping',
				'nativeHostBridgeMapping',
				'desktopShellUiHelper',
				'desktopShellUiEvidence',
				'toDesktopShellUiTaskbarProgressState',
				'enableMicaWindowChrome',
				'syncTaskbarProgress',
				'toggleWindowMaximize',
				'TaskbarProgressState',
				'saveInFlight',
				'refreshInFlight',
				'hasQueuedSave',
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
				'reportUrl'
			],
			proves: [
				'/alpha-readiness/bridge-reuse.json names the exact LG UltraGear source files and native cue families reused by alpha evidence',
				'/alpha-readiness/report.html, /alpha-readiness/report.md, and /alpha-readiness/report.svg surface the provenance for reviewers',
				'The npm package surface remains adapter-focused while alpha evidence tracks Windows 11 Mica, macOS chrome, host-owned window actions, and report/progress handoff'
			]
		},
		nativeHostBindingGuideProof: {
			proofStage: 'generated-from-source',
			trustLevel: 'deterministic-runtime-evidence',
			guideEndpoint: '/alpha-readiness/native-host-guide.md',
			artifact: 'report/alpha-native-host-guide.md',
			markers: [
				'native host binding guide',
				'data-native-host-handoff-controls',
				'native-window-action',
				'window.__SVELTEKIT_PHP_NATIVE_HOST__',
				'window.__SVELTEKIT_PHP_NATIVE_HOST_HISTORY__',
				'desktopShellUiBinding',
				'installSvelteKitPhpNativeHost',
				'getDesktopShellUiCommandMapping',
				'nativeHostBridgeMapping',
				'packages/ultragear-widget-ui/src/app.ts',
				'@scriptgpt/desktop-shell-ui',
				'enableMicaWindowChrome',
				'syncTaskbarProgress',
				'toggleWindowMaximize',
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
				'win.setProgressBar',
				'reportJson'
			],
			proves: [
				'/alpha-readiness/native-host-guide.md gives optional desktop wrappers a concrete binding path for native-window-action events',
				'Windows 11 Mica, macOS titlebar behavior, progress, and report-ready handoff stay host-owned instead of becoming adapter package APIs',
				'The alpha package contract can reference native host implementation guidance without expanding the npm export surface beyond sveltekit-php/adapter'
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

