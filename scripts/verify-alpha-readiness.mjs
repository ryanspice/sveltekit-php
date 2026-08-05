// @ts-nocheck
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildAlphaReadinessReport } from '../src/lib/alpha-readiness.ts';
import { requiredAlphaEvidence } from '../src/lib/alpha-required-evidence.ts';
import { PACKAGE_VERSION } from './utils/release-snapshot.mjs';
import npmLatest from './snapshots/npm-latest.json' with { type: 'json' };

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const releaseTrack = PACKAGE_VERSION.replace(/\.\d+$/, '');
const npmLatestMarkers = Object.entries(npmLatest.packages).map(
	([name, info]) => `${name}\` | \`${info.latest}`
);

const requiredGeneratedFiles = [
	'report/alpha-community-analytics.json',
	'report/alpha-community-analytics.md',
	'report/alpha-readiness.json',
	'report/alpha-readiness.full.json',
	'report/alpha-readiness.md',
	'report/alpha-readiness.html',
	'report/alpha-readiness.svg',
	'report/alpha-community-source-map.svg',
	'report/alpha-release-notes.md',
	'report/alpha-release-checklist.md',
	'report/alpha-gate-matrix.json',
	'report/alpha-evidence-index.json',
	'report/alpha-package-contract.json',
	'report/alpha-native-host-contract.json',
	'report/alpha-native-host-guide.md',
	'report/alpha-native-host-wrapper-smoke.json',
	'report/alpha-hosted-smoke-checklist.json',
	'report/alpha-readiness.csv',
	'report/alpha-bridge-reuse.json',
	'report/alpha-review-index.md',
	'report/alpha-community-signals.csv',
	'report/alpha-community-sources.csv',
	'report/alpha-community-research-pack.json',
	'report/alpha-release-manifest.json'
];

const requiredSourceFiles = [
	'router.php',
	'adapter/src/runtime/router/shared.ts',
	'adapter/src/runtime/router/php-static.ts',
	'adapter/src/runtime/router/js-ssr.ts',
	'adapter/src/dev-adapter.ts',
	'adapter/src/vite-dev-adapter.ts',
	'src/lib/alpha-readiness.ts',
	'src/lib/alpha-required-evidence.ts',
	'docs/ALPHA-LATEST-SVELTEKIT-AUDIT.md',
	'docs/REMOTE-FUNCTIONS-ALPHA-POLICY.md',
	'scripts/verify-latest-sveltekit-audit.mjs',
	'scripts/smoke-latest-same-major.mjs',
	'scripts/smoke-latest-vite-major.mjs',
	'scripts/verify-remote-functions-policy.mjs',
	'src/lib/alpha-bridge-reuse.ts',
	'src/lib/alpha-community-analytics-markdown.ts',
	'src/lib/alpha-community-source-map-svg.ts',
	'src/lib/alpha-community-research-pack.ts',
	'src/lib/alpha-community-sources.ts',
	'src/lib/alpha-evidence-index.ts',
	'src/lib/alpha-gate-matrix.ts',
	'src/lib/alpha-hard-proof-blockers.ts',
	'src/lib/alpha-hosted-smoke-checklist.ts',
	'src/lib/alpha-native-host-contract.ts',
	'src/lib/alpha-native-host-guide.ts',
	'src/lib/alpha-native-host-wrapper-smoke.ts',
	'src/lib/alpha-package-contract.ts',
	'src/lib/alpha-readiness-csv.ts',
	'src/lib/alpha-readiness-html.ts',
	'src/lib/alpha-readiness-markdown.ts',
	'src/lib/alpha-review-index.ts',
	'src/lib/alpha-release-manifest.ts',
	'src/lib/alpha-release-checklist.ts',
	'src/lib/alpha-release-notes.ts',
	'src/lib/alpha-readiness-svg.ts',
	'src/lib/native-shell/native-host-event-bridge.ts',
	'src/lib/components/native-shell/NativeHostBridgeStatus.svelte',
	'src/lib/components/native-shell/NativeWindowShell.svelte',
	'src/lib/components/native-shell/NativeTitlebar.svelte',
	'src/routes/alpha-readiness/+page.svelte',
	'src/routes/alpha-readiness/no-hydration/+page.ts',
	'src/routes/alpha-readiness/no-hydration/+page.svelte',
	'src/routes/alpha-readiness/report.json/+server.ts',
	'src/routes/alpha-readiness/report.html/+server.ts',
	'src/routes/alpha-readiness/report.md/+server.ts',
	'src/routes/alpha-readiness/release-notes.md/+server.ts',
	'src/routes/alpha-readiness/release-checklist.md/+server.ts',
	'src/routes/alpha-readiness/report.svg/+server.ts',
	'src/routes/alpha-readiness/community-source-map.svg/+server.ts',
	'src/routes/alpha-readiness/gate-matrix.json/+server.ts',
	'src/routes/alpha-readiness/evidence-index.json/+server.ts',
	'src/routes/alpha-readiness/package-contract.json/+server.ts',
	'src/routes/alpha-readiness/native-host-contract.json/+server.ts',
	'src/routes/alpha-readiness/native-host-guide.md/+server.ts',
	'src/routes/alpha-readiness/native-host-wrapper-smoke.json/+server.ts',
	'src/routes/alpha-readiness/hosted-smoke-checklist.json/+server.ts',
	'src/routes/alpha-readiness/bridge-reuse.json/+server.ts',
	'src/routes/alpha-readiness/review-index.md/+server.ts',
	'src/routes/alpha-readiness/release-manifest.json/+server.ts',
	'src/routes/alpha-readiness/community-signals.json/+server.ts',
	'src/routes/alpha-readiness/community-analytics.md/+server.ts',
	'src/routes/alpha-readiness/community-research-pack.json/+server.ts',
	'src/routes/alpha-readiness/readiness.csv/+server.ts',
	'src/routes/alpha-readiness/community-signals.csv/+server.ts',
	'src/routes/alpha-readiness/community-sources.csv/+server.ts',
	'tests/unit/php-handlers.test.ts',
	'tests/unit/router-parity.test.ts',
	'tests/unit/native-host-event-bridge.test.ts',
	'tests/unit/dev-adapters.test.ts',
	'tests/unit/deploy-precheck.test.ts',
	'scripts/collect-alpha-community-analytics.mjs',
	'scripts/export-alpha-readiness.mjs',
	'scripts/deploy-precheck.mjs',
	'scripts/utils/config.mjs',
	'scripts/verify-artifact-sync.mjs',
	'scripts/smoke-alpha-consumer.mjs',
	'scripts/smoke-native-host-wrapper.mjs',
	'scripts/smoke-remote-alpha.mjs',
	'scripts/run-alpha-release-gate.mjs',
	'scripts/run-hosted-alpha-gate.mjs',
	'scripts/verify-alpha-release-prep.mjs',
	'tools/deploy-build.ts'
];

function ok(id, message) {
	return { id, ok: true, message };
}

function fail(id, message) {
	return { id, ok: false, message };
}

function hasText(value, text) {
	return typeof value === 'string' && value.includes(text);
}

function csvCell(value) {
	return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

export function checkAlphaReadinessContract({ report, packageJson, gitignore, generated }) {
	const checks = [];
	const latestSvelteKitAudit = generated.latestSvelteKitAudit ?? '';
	const latestSvelteKitAuditVerifier = generated.latestSvelteKitAuditVerifier ?? '';
	const latestSameMajorSmoke = generated.latestSameMajorSmoke ?? '';
	const latestViteMajorSmoke = generated.latestViteMajorSmoke ?? '';
	const remoteFunctionsPolicy = generated.remoteFunctionsPolicy ?? '';
	const remoteFunctionsVerifier = generated.remoteFunctionsVerifier ?? '';
	const adapterSource = generated.adapterSource ?? '';

	checks.push(
		report.target === PACKAGE_VERSION
			? ok('target', `Report target is ${PACKAGE_VERSION}.`)
			: fail('target', `Report target is ${report.target ?? 'missing'}.`)
	);

	checks.push(
		hasText(latestSvelteKitAudit, 'latest-sveltekit-compatibility-audit') &&
			hasText(latestSvelteKitAudit, 'https://svelte.dev/docs/kit/writing-adapters') &&
			hasText(latestSvelteKitAudit, 'https://svelte.dev/docs/kit/page-options') &&
			hasText(latestSvelteKitAudit, 'Remote functions') &&
			npmLatestMarkers.every((marker) => hasText(latestSvelteKitAudit, marker)) &&
			hasText(latestSvelteKitAudit, 'Official adapter snapshot') &&
			hasText(latestSvelteKitAudit, '@sveltejs/adapter-node` | `5.5.7') &&
			hasText(latestSvelteKitAudit, '@sveltejs/adapter-static` | `3.0.10') &&
			hasText(latestSvelteKitAudit, '@sveltejs/adapter-cloudflare` | `7.2.9') &&
			hasText(latestSvelteKitAudit, '@sveltejs/adapter-netlify` | `6.0.4') &&
			hasText(latestSvelteKitAudit, '@sveltejs/adapter-vercel` | `6.3.4') &&
			hasText(latestSvelteKitAudit, '@sveltejs/adapter-auto` | `7.0.1') &&
			hasText(latestSvelteKitAudit, 'Live blog consumer evidence') &&
			hasText(latestSvelteKitAudit, 'blog.ryanspice.com') &&
			hasText(latestSvelteKitAudit, 'seo_audit_python') &&
			hasText(latestSvelteKitAudit, 'Latest package snapshot freshness') &&
			hasText(latestSvelteKitAudit, 'Latest same-major build compatibility') &&
			hasText(generated.markdown, 'Live blog consumer evidence') &&
			hasText(generated.markdown, 'Current Svelte 5/SvelteKit 2 adapter parity snapshot') &&
			hasText(generated.html, 'data-live-blog-consumer-evidence') &&
			hasText(generated.html, 'data-latest-sveltekit-adapter-snapshot') &&
			hasText(latestSvelteKitAuditVerifier, 'npm view') &&
			hasText(latestSvelteKitAuditVerifier, 'verify:latest-sveltekit-audit') &&
			hasText(latestSameMajorSmoke, 'latest-same-major-smoke') &&
			hasText(latestSameMajorSmoke, 'assertLatestSameMajorTargets') &&
			hasText(latestSameMajorSmoke, 'data-latest-same-major-smoke') &&
			hasText(latestViteMajorSmoke, 'latest-vite-major-smoke') &&
			hasText(latestViteMajorSmoke, 'assertLatestViteMajorTargets') &&
			hasText(latestViteMajorSmoke, 'data-latest-vite-major-smoke') &&
			packageJson.sveltekitPhpReleasePolicy?.requiredEvidence?.includes(
				'latest-sveltekit-compatibility-audit'
			) &&
			packageJson.sveltekitPhpReleasePolicy?.requiredEvidence?.includes(
				'latest-vite-major-validation'
			) &&
			packageJson.scripts?.['verify:latest-sveltekit-audit'] ===
				'bun scripts/verify-latest-sveltekit-audit.mjs' &&
			packageJson.scripts?.['alpha:latest-same-major:smoke'] ===
				'bun scripts/smoke-latest-same-major.mjs' &&
			packageJson.scripts?.['alpha:latest-vite-major:smoke'] ===
				'bun scripts/smoke-latest-vite-major.mjs' &&
			packageJson.files?.includes('docs/ALPHA-LATEST-SVELTEKIT-AUDIT.md') &&
			(generated.manifest?.evidenceSurfaces?.latestSvelteKitCompatibilityAudit?.markers ?? []).includes(
				'Vite 8 isolated validation lane'
			) &&
			(generated.manifest?.evidenceSurfaces?.liveBlogConsumerEvidence?.markers ?? []).includes(
				'seo_audit_python A-'
			)
			? ok(
					'latest-sveltekit-compatibility-audit',
					'Latest Svelte/SvelteKit audit records official docs, package boundaries, official adapter versions, live blog consumer evidence, npm freshness verification, same-major fixture smoke, required evidence, package inclusion, and Vite/plugin validation lanes.'
				)
			: fail(
					'latest-sveltekit-compatibility-audit',
					'Latest Svelte/SvelteKit audit is missing official docs, package boundaries, official adapter versions, live blog consumer evidence, npm freshness verification, same-major fixture smoke, required evidence, package inclusion, or Vite/plugin validation markers.'
				)
	);

	checks.push(
		hasText(remoteFunctionsPolicy, 'remote-functions-alpha-policy') &&
			hasText(remoteFunctionsPolicy, 'kit.experimental.remoteFunctions') &&
			hasText(remoteFunctionsPolicy, '.remote.ts') &&
			hasText(remoteFunctionsPolicy, 'generated server HTTP endpoints') &&
			hasText(remoteFunctionsVerifier, 'remote-functions-alpha-policy') &&
			hasText(remoteFunctionsVerifier, 'verify:remote-functions') &&
			hasText(adapterSource, 'assertRemoteFunctionsUnsupported') &&
			hasText(adapterSource, 'REMOTE_FUNCTIONS_UNSUPPORTED_MESSAGE') &&
			hasText(adapterSource, 'generatedHttpEndpointSupport') &&
			packageJson.sveltekitPhpReleasePolicy?.requiredEvidence?.includes(
				'remote-functions-alpha-policy'
			) &&
			packageJson.files?.includes('docs/REMOTE-FUNCTIONS-ALPHA-POLICY.md') &&
			packageJson.scripts?.['verify:remote-functions'] ===
				'bun scripts/verify-remote-functions-policy.mjs' &&
			generated.packageContract?.remoteFunctionsAlphaPolicyProof?.marker ===
				'remote-functions-alpha-policy' &&
			(
				generated.manifest?.evidenceSurfaces?.remoteFunctionsAlphaPolicy?.markers ?? []
			).includes('generatedHttpEndpointSupport: false')
			? ok(
					'remote-functions-alpha-policy',
					'Remote-functions policy blocks experimental generated HTTP endpoints until PHP runtime fixture and hosted proof exists.'
				)
			: fail(
					'remote-functions-alpha-policy',
					'Remote-functions policy is missing package, adapter, verifier, manifest, or package-contract evidence.'
				)
	);

	checks.push(
		report.releasePolicy?.marker === 'alpha-over-rc-release-policy' &&
			report.releasePolicy?.channel === 'alpha' &&
			report.releasePolicy?.track === releaseTrack &&
			report.releasePolicy?.rank === 'above-rc' &&
			(report.releasePolicy?.disallowedChannels ?? []).includes('rc') &&
			(report.releasePolicy?.disallowedChannels ?? []).includes('stable') &&
			report.releasePolicy?.stablePromotionRule?.includes('hosted PHP smoke')
			? ok('release-policy', `Release policy pins the ${releaseTrack} channel above RC/stable promotion semantics.`)
			: fail('release-policy', 'Release policy is missing alpha-over-RC channel, track, rank, or stable promotion blockers.')
	);

	checks.push(
		(report.proofLedger ?? []).some(
			(item) =>
				item.id === 'alpha-channel-policy' &&
				item.marker === 'alpha-over-rc-release-policy' &&
				item.status === 'alpha-ready'
		) &&
			(report.proofLedger ?? []).some(
				(item) =>
					item.id === 'ultragear-native-visual-provenance' &&
					item.marker === 'native-visual-matrix' &&
					item.status === 'alpha-ready'
		) &&
			(report.proofLedger ?? []).some(
				(item) =>
					item.id === 'no-hydration-prerender-proof' &&
					item.marker === 'csr-disabled-prerender-contract' &&
					item.status === 'alpha-ready'
			) &&
			(report.proofLedger ?? []).some(
				(item) =>
					item.id === 'community-keyword-analytics-linkage' &&
					item.marker === 'analytics-linked-keyword-graph' &&
					item.status === 'alpha-ready'
			) &&
			(report.proofLedger ?? []).some(
				(item) =>
					item.id === 'php-runtime-release-gates' &&
					item.marker === 'alpha-runtime-gate-ledger' &&
					item.status === 'needs-local-gate-proof'
			) &&
			(report.proofLedger ?? []).some(
				(item) =>
					item.id === 'hosted-php-smoke-proof' &&
					item.marker === 'hosted-php-smoke-proof-required' &&
					item.status === 'needs-hosted-proof'
			)
			? ok('proof-ledger', 'Alpha proof ledger separates alpha-ready, no-hydration, local-gate, and hosted proof requirements.')
			: fail('proof-ledger', 'Alpha proof ledger is missing channel, UltraGear, no-hydration, community, local gate, or hosted proof rows.')
	);

	checks.push(
		(report.hardProofBlockers ?? []).some(
			(item) =>
				item.id === 'full-local-alpha-gate' &&
				item.marker === 'alpha-runtime-gate-ledger' &&
				item.status === 'needs-current-run-proof'
		) &&
			(report.hardProofBlockers ?? []).some(
				(item) =>
					item.id === 'hosted-php-smoke-proof' &&
					item.marker === 'hosted-php-smoke-proof-required' &&
					item.status === 'needs-hosted-proof'
			) &&
			(report.hardProofBlockers ?? []).some(
				(item) =>
					item.id === 'packed-consumer-install-import-proof' &&
					item.marker === 'packed-consumer-install-import-proof'
			) &&
			(report.hardProofBlockers ?? []).some(
				(item) => item.id === 'strict-artifact-sync-proof' && item.marker === 'source-to-generated-bundle-check'
			) &&
			(report.hardProofBlockers ?? []).some(
				(item) =>
					item.id === 'real-native-wrapper-proof' &&
					item.marker === 'real-native-host-wrapper-smoke-required'
			)
			? ok('hard-proof-blockers', 'Canonical report carries the hard proof blocker ledger for stable-promotion gaps.')
			: fail(
					'hard-proof-blockers',
					'Canonical report is missing local gate, hosted smoke, packed consumer, artifact sync, or real native wrapper hard proof blockers.'
				)
	);

	checks.push(
		packageJson?.version === report.target
			? ok('package-version', 'Package version matches the alpha report target.')
			: fail(
					'package-version',
					`Package version ${packageJson?.version ?? 'missing'} does not match report target ${report.target ?? 'missing'}.`
				)
	);

	checks.push(
		report.bridgeSource?.includes('lg-ultragear-bridge')
			? ok('bridge-source', 'Report links the UltraGear bridge source.')
			: fail('bridge-source', 'Report does not link the UltraGear bridge source.')
	);

	const bridgeLabels = (report.bridgePatterns ?? []).map((pattern) => pattern.label).join(' ');
	checks.push(
		/Mica/i.test(bridgeLabels) && /Window chrome/i.test(bridgeLabels) && /Structured/i.test(bridgeLabels)
			? ok('bridge-patterns', 'Mica, native chrome, and structured report patterns are represented.')
			: fail('bridge-patterns', 'Bridge pattern map is missing Mica, native chrome, or structured reporting.')
	);

	const areaIds = new Set((report.readinessAreas ?? []).map((area) => area.id));
	checks.push(
		areaIds.has('native-shell-ux') && areaIds.has('community-analytics') && areaIds.has('hosted-deployment')
			? ok('areas', 'Native-shell UX, community analytics, and hosted deployment readiness areas are present.')
			: fail('areas', 'Native-shell UX, community analytics, or hosted deployment readiness area is missing.')
	);

	const communityLinks = (report.communitySignals ?? []).flatMap((signal) => signal.communities ?? []);
	checks.push(
		(report.communitySignals ?? []).length >= 4 && communityLinks.every((link) => link.href?.startsWith('https://'))
			? ok('community-links', 'Community signal links are present and HTTPS.')
			: fail('community-links', 'Community signals are missing or include non-HTTPS links.')
	);

	const scripts = packageJson?.scripts ?? {};
	checks.push(
		scripts['build:adapter'] &&
			scripts['verify:artifacts'] &&
			scripts['alpha:analytics'] &&
			scripts['alpha:report'] &&
			scripts['alpha:report:full'] &&
			scripts['alpha:consumer:smoke'] &&
			scripts['alpha:latest-same-major:smoke'] &&
			scripts['alpha:latest-vite-major:smoke'] &&
			scripts['alpha:remote:placeholder'] &&
			scripts['alpha:remote:smoke'] &&
			scripts['alpha:gate'] &&
			scripts['alpha:gate:hosted'] &&
			scripts['verify:release-prep'] &&
			scripts['verify:alpha']
			? ok('package-scripts', 'Alpha analytics/report/consumer/remote/gate/verify and artifact-sync scripts are wired.')
			: fail(
					'package-scripts',
					'Package scripts are missing alpha analytics/report/consumer/remote/gate/verify or artifact-sync commands.'
				)
	);

	checks.push(
		packageJson?.exports?.['./adapter'] === './adapter/index.js' &&
			(packageJson?.files ?? []).includes('adapter/index.js')
			? ok('package-export', 'Package exposes sveltekit-php/adapter and includes adapter/index.js.')
			: fail('package-export', 'Package export shape does not expose sveltekit-php/adapter.')
	);

	checks.push(
		generated?.packageContract?.nativeHostBindingGuideProof?.guideEndpoint ===
			'/alpha-readiness/native-host-guide.md' &&
			generated?.packageContract?.nativeHostBindingGuideProof?.artifact ===
				'report/alpha-native-host-guide.md' &&
			(generated?.packageContract?.nativeHostBindingGuideProof?.markers ?? []).includes(
				'native host binding guide'
			) &&
			(generated?.packageContract?.nativeHostBindingGuideProof?.markers ?? []).includes(
				'set-window-effect'
			) &&
			(generated?.packageContract?.nativeHostBindingGuideProof?.markers ?? []).includes(
				'set-progress'
			) &&
			(generated?.packageContract?.nativeHostBindingGuideProof?.markers ?? []).includes(
				'report-ready'
			) &&
			(generated?.packageContract?.nativeHostBindingGuideProof?.markers ?? []).includes(
				'desktopShellUiBinding'
			) &&
			(generated?.packageContract?.nativeHostBindingGuideProof?.markers ?? []).includes(
				'@scriptgpt/desktop-shell-ui'
			) &&
			(generated?.packageContract?.nativeHostBindingGuideProof?.markers ?? []).includes(
				'enableMicaWindowChrome'
			) &&
			(generated?.packageContract?.nativeHostBindingGuideProof?.markers ?? []).includes(
				'syncTaskbarProgress'
			) &&
			(generated?.packageContract?.nativeHostBindingGuideProof?.markers ?? []).includes(
				'TaskbarProgressState'
			) &&
			(generated?.packageContract?.nativeHostBindingGuideProof?.markers ?? []).includes(
				'toDesktopShellUiTaskbarProgressState'
			) &&
			(generated?.packageContract?.nativeHostBindingGuideProof?.markers ?? []).includes(
				'saveInFlight'
			) &&
			(generated?.packageContract?.nativeHostBindingGuideProof?.markers ?? []).includes(
				'hasQueuedSave'
			) &&
			(generated?.packageContract?.nativeHostBindingGuideProof?.markers ?? []).includes(
				'toggleWindowMaximize'
			) &&
			(generated?.packageContract?.nativeHostBindingGuideProof?.markers ?? []).includes(
				'setWindowEffect'
			) &&
			(generated?.packageContract?.nativeHostBindingGuideProof?.markers ?? []).includes(
				'setProgress'
			) &&
			(generated?.packageContract?.nativeHostBindingGuideProof?.markers ?? []).includes('reportReady')
			? ok(
					'package-native-host-guide-proof',
					'Package contract keeps native host binding guide evidence outside the npm export surface.'
				)
			: fail(
					'package-native-host-guide-proof',
					'Package contract is missing native host binding guide endpoint, artifact, actions, or handlers.'
				)
	);

	checks.push(
		generated?.packageContract?.alphaReleaseChecklistProof?.checklistEndpoint ===
			'/alpha-readiness/release-checklist.md' &&
			generated?.packageContract?.alphaReleaseChecklistProof?.artifact ===
				'report/alpha-release-checklist.md' &&
			generated?.packageContract?.alphaReleaseChecklistProof?.documentationArtifact ===
				'docs/ALPHA-RELEASE-CHECKLIST.md' &&
			generated?.packageContract?.alphaReleaseChecklistProof?.source ===
				'src/lib/alpha-release-checklist.ts' &&
			(generated?.packageContract?.alphaReleaseChecklistProof?.markers ?? []).includes(
				'alpha-over-rc-release-policy'
			) &&
			(generated?.packageContract?.alphaReleaseChecklistProof?.markers ?? []).includes(
				'desktop-shell-ui-command-mapping'
			) &&
			(generated?.packageContract?.alphaReleaseChecklistProof?.markers ?? []).includes(
				'community-analytics-csv-linkage'
			) &&
			(generated?.packageContract?.alphaReleaseChecklistProof?.markers ?? []).includes(
				'result-total-field-contract'
			) &&
			(generated?.packageContract?.alphaReleaseChecklistProof?.markers ?? []).includes(
				'top-result-field-contract'
			) &&
			(generated?.packageContract?.alphaReleaseChecklistProof?.markers ?? []).includes(
				'sample-review-rule'
			) &&
			(generated?.packageContract?.alphaReleaseChecklistProof?.markers ?? []).includes(
				'router-path-safety-artifact-sync'
			) &&
			(generated?.packageContract?.alphaReleaseChecklistProof?.markers ?? []).includes(
				'adapter-platform-emulation'
			) &&
			(generated?.packageContract?.alphaReleaseChecklistProof?.markers ?? []).includes(
				'deploy-env-preflight-safety'
			) &&
			(generated?.packageContract?.alphaReleaseChecklistProof?.markers ?? []).includes(
				'sourceToKeywordEdge'
			) &&
			(generated?.packageContract?.alphaReleaseChecklistProof?.markers ?? []).includes(
				'resultTotalField'
			) &&
			(generated?.packageContract?.alphaReleaseChecklistProof?.markers ?? []).includes(
				'topResultFields'
			) &&
			(generated?.packageContract?.alphaReleaseChecklistProof?.markers ?? []).includes(
				'sampleReviewRule'
			) &&
			(generated?.packageContract?.alphaReleaseChecklistProof?.markers ?? []).includes(
				'weighted_demand_score'
			) &&
			(generated?.packageContract?.alphaReleaseChecklistProof?.markers ?? []).includes(
				'result_total_field'
			) &&
			(generated?.packageContract?.alphaReleaseChecklistProof?.markers ?? []).includes(
				'top_result_fields'
			) &&
			(generated?.packageContract?.alphaReleaseChecklistProof?.markers ?? []).includes(
				'sample_review_rule'
			) &&
			(generated?.packageContract?.alphaReleaseChecklistProof?.markers ?? []).includes(
				'ALPHA_SMOKE_BASE_URL'
			) &&
			(generated?.packageContract?.alphaReleaseChecklistProof?.markers ?? []).includes(
				'windowChromeState'
			) &&
			(generated?.packageContract?.alphaReleaseChecklistProof?.markers ?? []).includes(
				'mica-active'
			) &&
			(generated?.packageContract?.alphaReleaseChecklistProof?.markers ?? []).includes(
				'mica-inactive'
			) &&
			(generated?.packageContract?.alphaReleaseChecklistProof?.markers ?? []).includes(
				'plain'
			) &&
			(generated?.packageContract?.alphaReleaseChecklistProof?.markers ?? []).includes(
				'webview.setBackgroundColor([0, 0, 0, 0])'
			) &&
			(generated?.packageContract?.alphaReleaseChecklistProof?.markers ?? []).includes(
				'data-window-chrome-state'
			) &&
			(generated?.packageContract?.alphaReleaseChecklistProof?.markers ?? []).includes(
				'data-window-chrome-state="mica-active"'
			) &&
			(generated?.packageContract?.alphaReleaseChecklistProof?.markers ?? []).includes(
				'transparent-webview-material-boundary'
			) &&
			(generated?.packageContract?.alphaReleaseChecklistProof?.markers ?? []).includes(
				'data-transparent-webview-material-boundary="host-owned"'
			) &&
			(generated?.packageContract?.alphaReleaseChecklistProof?.markers ?? []).includes(
				'macos-material-host-policy'
			) &&
			(generated?.packageContract?.alphaReleaseChecklistProof?.markers ?? []).includes(
				'source-observed-macos-host-scaffold'
			) &&
			(generated?.packageContract?.alphaReleaseChecklistProof?.markers ?? []).includes(
				'macos-native-vibrancy-unverified'
			)
			? ok(
					'package-alpha-release-checklist-proof',
					'Package contract exposes the source-rendered alpha checklist endpoint, artifact, documentation, and required proof markers.'
				)
			: fail(
					'package-alpha-release-checklist-proof',
					'Package contract is missing alpha release checklist endpoint, artifact, documentation, source, or required markers.'
				)
	);

	checks.push(
		hasText(gitignore, '/report/')
			? ok('report-ignore', 'Generated report directory is ignored.')
			: fail('report-ignore', 'Generated report directory is not ignored.')
	);

	const fullReport = generated?.fullReport;
	const analytics = generated?.analytics;
	const html = generated?.html ?? '';
	const markdown = generated?.markdown ?? '';
	const communityAnalyticsMarkdown = generated?.communityAnalyticsMarkdown ?? '';
	const releaseNotes = generated?.releaseNotes ?? '';
	const releaseChecklist = generated?.releaseChecklist ?? '';
	const reviewIndex = generated?.reviewIndex ?? '';
	const svg = generated?.svg ?? '';
	const sourceMapSvg = generated?.sourceMapSvg ?? '';
	const readinessCsv = generated?.readinessCsv ?? '';
	const communitySignalsCsv = generated?.communitySignalsCsv ?? '';
	const communitySourcesCsv = generated?.communitySourcesCsv ?? '';
	const communityResearchPack = generated?.communityResearchPack;
	const bridgeReuse = generated?.bridgeReuse;
	const gateMatrix = generated?.gateMatrix;
	const evidenceIndex = generated?.evidenceIndex;
	const packageContract = generated?.packageContract;
	const nativeHostContract = generated?.nativeHostContract;
	const nativeHostGuide = generated?.nativeHostGuide ?? '';
	const nativeHostWrapperSmoke = generated?.nativeHostWrapperSmoke;
	const hostedSmokeChecklist = generated?.hostedSmokeChecklist;
	const manifest = generated?.manifest;
	const alphaPage = generated?.alphaPage ?? '';
	const nativeWindowShellSource = generated?.nativeWindowShellSource ?? '';
	const nativeTitlebarSource = generated?.nativeTitlebarSource ?? '';
	const nativeHostBridgeStatusSource = generated?.nativeHostBridgeStatusSource ?? '';
	const nativeHostBridgeSource = generated?.nativeHostBridgeSource ?? '';
	const noHydrationConfigSource = generated?.noHydrationConfigSource ?? '';
	const noHydrationPageSource = generated?.noHydrationPageSource ?? '';
	const releaseChecklistSource = generated?.releaseChecklistSource ?? '';
	const releaseChecklistEndpointSource = generated?.releaseChecklistEndpointSource ?? '';
	const collectedScoreRows = (analytics?.queries ?? [])
		.map((query) => {
			const signalId = query.signalId ?? query.id;
			const signal = (report.communitySignals ?? []).find((entry) => entry.id === signalId);

			if (!signal) {
				return null;
			}

			return [signal.id, signal.keyword, signal.intent, signal.metric, query.aggregate?.demandScore ?? '']
				.map(csvCell)
				.join(',');
		})
		.filter(Boolean);
	const communityCsvIncludesCollectedScores =
		collectedScoreRows.length > 0 &&
		collectedScoreRows.every((row) => hasText(communitySignalsCsv, row));

	const requiredAlphaEvidenceArrays = [
		report?.releasePolicy?.requiredEvidence ?? [],
		manifest?.requiredEvidence ?? [],
		manifest?.releasePolicy?.requiredEvidence ?? [],
		gateMatrix?.requiredEvidence ?? [],
		evidenceIndex?.requiredEvidence ?? [],
		packageJson?.sveltekitPhpReleasePolicy?.requiredEvidence ?? [],
		packageContract?.requiredEvidence ?? [],
		packageContract?.publishShape?.releasePolicy?.requiredEvidence ?? []
	];
	const requiredAlphaEvidenceTextTargets = [
		html,
		markdown,
		reviewIndex,
		alphaPage,
		releaseNotes,
		svg,
		readinessCsv,
		sourceMapSvg
	];
	const nativeChromeStateReviewMarkers = [
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
		'macos-native-vibrancy-unverified'
	];

	checks.push(
		requiredAlphaEvidence.every((marker) =>
			requiredAlphaEvidenceArrays.every((markers) => markers.includes(marker))
		) &&
			requiredAlphaEvidence.every((marker) =>
				requiredAlphaEvidenceTextTargets.every((content) => hasText(content, marker))
			)
			? ok(
					'required-alpha-evidence-synchronization',
					'Every required alpha evidence marker is synchronized across policy arrays, generated reports, live page, CSV, SVG, and source-map surfaces.'
				)
			: fail(
					'required-alpha-evidence-synchronization',
					'Required alpha evidence markers drifted across policy arrays, generated reports, live page, CSV, SVG, or source-map surfaces.'
				)
	);

	checks.push(
		nativeChromeStateReviewMarkers.every((marker) => hasText(releaseNotes, marker)) &&
			nativeChromeStateReviewMarkers.every((marker) => hasText(reviewIndex, marker))
			? ok(
					'native-chrome-state-human-docs',
					'Release notes and reviewer index expose host-owned chrome-state and transparent webview boundary markers.'
				)
			: fail(
					'native-chrome-state-human-docs',
					'Release notes or reviewer index are missing host-owned chrome-state/transparent webview boundary markers.'
				)
	);

	checks.push(
		report?.releasePolicy?.requiredEvidence?.includes('native-host-binding-guide') &&
			report?.releasePolicy?.requiredEvidence?.includes('real-host-permission-checklist') &&
			report?.releasePolicy?.requiredEvidence?.includes('csr-disabled-prerender-contract') &&
			report?.releasePolicy?.requiredEvidence?.includes('native-host-wrapper-smoke') &&
			report?.releasePolicy?.requiredEvidence?.includes('windows-11-mica-browser-safe-shell') &&
			report?.releasePolicy?.requiredEvidence?.includes('macos-style-native-titlebar-rhythm') &&
			report?.releasePolicy?.requiredEvidence?.includes('alpha-readiness-report-graphics') &&
			report?.releasePolicy?.requiredEvidence?.includes('community-keyword-search-graph') &&
			report?.releasePolicy?.requiredEvidence?.includes('community-analytics-freshness-contract') &&
			report?.releasePolicy?.requiredEvidence?.includes('hosted-php-smoke-proof')
			? ok('canonical-release-policy', 'Canonical report release policy carries the required alpha evidence boundary.')
			: fail('canonical-release-policy', 'Canonical report release policy is missing required alpha evidence markers.')
	);

	checks.push(
		hasText(noHydrationConfigSource, 'export const prerender = true') &&
			hasText(noHydrationConfigSource, 'export const csr = false') &&
			hasText(noHydrationPageSource, 'no-hydration-fixture') &&
			hasText(noHydrationPageSource, 'csr-disabled-prerender-contract') &&
			hasText(noHydrationPageSource, 'theme-stable-ssr-html')
			? ok('no-hydration-prerender-fixture', 'No-hydration fixture exports prerender=true, csr=false, and stable SSR theme markers.')
			: fail(
					'no-hydration-prerender-fixture',
					'No-hydration fixture is missing prerender/csr config or stable SSR theme markers.'
				)
	);

	checks.push(
		fullReport?.collectedCommunityAnalytics?.summary?.successfulSources > 0
			? ok('full-json', 'Combined full JSON embeds collected community analytics.')
			: fail('full-json', 'Combined full JSON is missing collected community analytics.')
	);

	checks.push(
		analytics?.summary?.successfulSources > 0 &&
			(analytics?.summary?.providerCoverage ?? []).length > 0 &&
			(analytics?.summary?.evidenceKindCoverage ?? []).length > 0 &&
			(analytics?.summary?.collectionRiskCoverage ?? []).length > 0 &&
			(analytics?.queries ?? []).some((query) =>
				(query.sources ?? []).some(
					(source) =>
						source.sourceHost &&
						source.mode &&
						source.evidenceKind &&
						source.collectionRisk &&
						source.collectionPriority &&
						source.proofUse &&
						source.reviewerAction &&
						source.collectorNote &&
						Object.hasOwn(source, 'endpoint')
				)
			)
			? ok(
					'analytics-json',
					'Collected community analytics JSON has successful sources, coverage summaries, and source proof metadata.'
				)
			: fail(
					'analytics-json',
					'Collected community analytics JSON has no successful sources or lacks coverage summaries/source proof metadata.'
				)
	);

	checks.push(
			hasText(html, 'Native-styled release report') &&
			hasText(html, 'app-window') &&
			hasText(html, 'theme-ultragear') &&
			hasText(html, 'data-window-effect="mica"') &&
			hasText(html, 'data-window-focused="true"') &&
			hasText(html, 'data-window-chrome-state="mica-active"') &&
			hasText(html, 'data-transparent-webview-material-boundary="host-owned"') &&
			hasText(html, 'data-ultragear-html-report-shell') &&
			hasText(html, 'topbar-drag-strip') &&
			hasText(html, 'data-window-drag') &&
			hasText(html, 'data-drag-block-selector') &&
			hasText(html, 'data-no-window-drag') &&
			hasText(html, 'data-window-control-group') &&
			hasText(html, 'caption-button') &&
			hasText(html, 'data-window-control="maximize"') &&
			hasText(html, '--blur-mica') &&
			hasText(html, '--surface-chrome') &&
			hasText(html, '--window-bg-mica') &&
			hasText(html, '--window-bg-inactive') &&
			hasText(html, '--window-wash-inactive') &&
			hasText(html, '--caption-hover-bg') &&
			hasText(html, 'max-width: 1180px') &&
			hasText(html, 'max-width: 860px') &&
			hasText(html, 'Release policy') &&
			hasText(html, 'alpha-over-rc-release-policy') &&
			hasText(html, '1.0.2-alpha') &&
			hasText(html, 'above-rc') &&
			hasText(html, 'Required alpha evidence') &&
			hasText(html, 'requiredEvidence') &&
			hasText(html, 'required-alpha-evidence') &&
			hasText(html, 'native-host-binding-guide') &&
			hasText(html, 'real-host-permission-checklist') &&
			hasText(html, 'csr-disabled-prerender-contract') &&
			hasText(html, 'windows-11-mica-browser-safe-shell') &&
			hasText(html, 'macos-style-native-titlebar-rhythm') &&
			hasText(html, 'alpha-readiness-report-graphics') &&
			hasText(html, 'community-keyword-search-graph') &&
			hasText(html, 'community-analytics-freshness-contract') &&
			hasText(html, 'hosted-php-smoke-proof') &&
			hasText(html, 'Alpha proof ledger') &&
			hasText(html, 'alpha-runtime-gate-ledger') &&
			hasText(html, 'hosted-php-smoke-proof-required') &&
			hasText(html, 'Community keyword signals') &&
			hasText(html, 'Community source map') &&
			hasText(html, 'Evidence trust model') &&
			hasText(html, 'deterministic-local-artifact') &&
			hasText(html, 'directional-community-signal') &&
			hasText(html, 'no-live-community-api-runtime-boundary') &&
			hasText(html, 'Native host bridge status') &&
			hasText(html, 'data-native-host-bridge-status') &&
			hasText(html, 'data-native-host-handoff-controls') &&
			hasText(html, '/alpha-readiness/native-host-guide.md') &&
			hasText(html, 'No-hydration prerender proof') &&
			hasText(html, 'data-no-hydration-prerender-proof') &&
			hasText(html, 'theme-stable-ssr-html') &&
			hasText(html, 'data-sveltekit-hydrate') &&
			hasText(html, 'Native host wrapper smoke handoff') &&
			hasText(html, 'data-native-host-wrapper-smoke') &&
			hasText(html, 'native-host-wrapper-smoke') &&
			hasText(html, 'native-host-wrapper-event-replay') &&
			hasText(html, 'expectedHistoryResult') &&
			hasText(html, 'expectedDesktopShellUiHelper') &&
			hasText(html, 'window.__SVELTEKIT_PHP_NATIVE_HOST_HISTORY__') &&
			hasText(html, 'noFallbackAllowedForRealHost') &&
			hasText(html, '/alpha-readiness/native-host-wrapper-smoke.json') &&
			hasText(html, 'report/alpha-native-host-wrapper-smoke.json') &&
			hasText(html, 'realHostVerified') &&
			hasText(html, 'TaskbarProgressState') &&
			hasText(html, 'set-window-effect') &&
			hasText(html, 'set-progress') &&
			hasText(html, 'clear-progress') &&
			hasText(html, 'report-ready') &&
			hasText(html, 'Community evidence coverage ledger') &&
			hasText(html, 'UltraGear source parity') &&
			hasText(html, 'data-ultragear-source-parity') &&
			hasText(html, 'ultraGearParityContract') &&
			hasText(html, 'Reusable UltraGear desktop shell binding') &&
			hasText(html, 'data-desktop-shell-ui-binding') &&
			hasText(html, 'desktopShellUiBinding') &&
			hasText(html, '@scriptgpt/desktop-shell-ui') &&
			hasText(html, 'installSvelteKitPhpNativeHost') &&
			hasText(html, 'enableMicaWindowChrome') &&
			hasText(html, 'syncTaskbarProgress') &&
			hasText(html, 'toggleWindowMaximize') &&
			hasText(html, 'UltraGear native platform provenance') &&
			hasText(html, 'data-native-platform-provenance') &&
			hasText(html, 'lg-ultragear-native-platform-provenance') &&
			hasText(html, 'Effect.Mica') &&
			hasText(html, 'win.startDragging') &&
			hasText(html, 'reportJson') &&
			hasText(html, 'UltraGear progress and report handoff') &&
			hasText(html, 'data-progress-report-handoff') &&
			hasText(html, 'progressReportHandoff') &&
			hasText(html, 'statusMapping') &&
			hasText(html, 'ProgressBarStatus.None') &&
			hasText(html, 'report-ready') &&
			hasText(html, 'Native visual matrix') &&
			hasText(html, 'data-native-visual-matrix') &&
			hasText(html, 'native-visual-matrix') &&
			hasText(html, 'windows-mica-visual-row') &&
			hasText(html, 'macos-traffic-light-row') &&
			hasText(html, 'macos-vibrancy-visual-row') &&
			hasText(html, 'macos-vibrancy-host-policy') &&
			hasText(html, 'macos-material-host-policy') &&
			hasText(html, 'source-observed-macos-host-scaffold') &&
			hasText(html, 'macos-native-vibrancy-unverified') &&
			hasText(html, 'windows-caption-control-row') &&
			hasText(html, 'ultragear-theme-row') &&
			hasText(html, 'browser-fallback-visual-row') &&
			hasText(html, 'Community keyword search graph') &&
			hasText(html, 'data-community-keyword-search-graph') &&
			hasText(html, 'keywordSearchGraph') &&
			hasText(html, 'analytics-linked-keyword-graph') &&
			hasText(html, 'source-to-keyword-edge') &&
			hasText(html, 'curated-signal-score') &&
			hasText(html, 'collected-demand-score') &&
			hasText(html, 'directional-community-signal') &&
			hasText(html, 'no-live-community-api-runtime-boundary') &&
			hasText(html, 'alpha-community-source-evidence-checklist') &&
			hasText(html, 'releaseUse') &&
			hasText(html, 'blockedOutcomePolicy') &&
			hasText(html, 'Open-source analytics sources reviewers can audit first') &&
			hasText(html, 'community-source-map.svg')
			? ok('html-report', 'HTML report includes native-styled report, community signals, and source-map graphic links.')
			: fail('html-report', 'HTML report is missing native-styled, community signal, source-map graphic, or trust-model sections.')
	);

	checks.push(
		hasText(markdown, 'Collected community analytics') &&
			hasText(markdown, 'Release policy') &&
			hasText(markdown, 'alpha-over-rc-release-policy') &&
			hasText(markdown, '1.0.2-alpha') &&
			hasText(markdown, 'above-rc') &&
			hasText(markdown, 'Alpha proof ledger') &&
			hasText(markdown, 'alpha-runtime-gate-ledger') &&
			hasText(markdown, 'hosted-php-smoke-proof-required') &&
			hasText(markdown, 'UltraGear bridge reuse map') &&
			hasText(markdown, 'Evidence trust model') &&
			hasText(markdown, 'requires-alpha-smoke-base-url-for-pass-evidence') &&
			hasText(markdown, 'Native host bridge status') &&
			hasText(markdown, 'data-native-host-bridge-status') &&
			hasText(markdown, 'data-native-host-handoff-controls') &&
			hasText(markdown, '/alpha-readiness/native-host-guide.md') &&
			hasText(markdown, 'No-hydration prerender proof') &&
			hasText(markdown, '/alpha-readiness/no-hydration') &&
			hasText(markdown, 'theme-stable-ssr-html') &&
			hasText(markdown, 'data-sveltekit-hydrate') &&
			hasText(markdown, 'Native host wrapper smoke handoff') &&
			hasText(markdown, 'native-host-wrapper-smoke') &&
			hasText(markdown, 'native-host-wrapper-event-replay') &&
			hasText(markdown, 'native-host-wrapper-event-replay-step') &&
			hasText(markdown, 'expectedHistoryResult') &&
			hasText(markdown, 'expectedDesktopShellUiHelper') &&
			hasText(markdown, 'noFallbackAllowedForRealHost') &&
			hasText(markdown, '/alpha-readiness/native-host-wrapper-smoke.json') &&
			hasText(markdown, 'report/alpha-native-host-wrapper-smoke.json') &&
			hasText(markdown, 'realHostVerified') &&
			hasText(markdown, 'TaskbarProgressState') &&
			hasText(markdown, 'set-window-effect') &&
			hasText(markdown, 'set-progress') &&
			hasText(markdown, 'clear-progress') &&
			hasText(markdown, 'report-ready') &&
			hasText(markdown, 'Community evidence coverage ledger') &&
			hasText(markdown, 'UltraGear source parity') &&
			hasText(markdown, 'data-ultragear-source-parity') &&
			hasText(markdown, 'ultraGearParityContract') &&
			hasText(markdown, 'Reusable UltraGear desktop shell binding') &&
			hasText(markdown, 'data-desktop-shell-ui-binding') &&
			hasText(markdown, 'desktopShellUiBinding') &&
			hasText(markdown, '@scriptgpt/desktop-shell-ui') &&
			hasText(markdown, 'installSvelteKitPhpNativeHost') &&
			hasText(markdown, 'enableMicaWindowChrome') &&
			hasText(markdown, 'syncTaskbarProgress') &&
			hasText(markdown, 'toggleWindowMaximize') &&
			hasText(markdown, 'UltraGear native platform provenance') &&
			hasText(markdown, 'lg-ultragear-native-platform-provenance') &&
			hasText(markdown, 'Effect.Mica') &&
			hasText(markdown, 'win.startDragging') &&
			hasText(markdown, 'reportJson') &&
			hasText(markdown, 'UltraGear progress and report handoff') &&
			hasText(markdown, 'data-progress-report-handoff') &&
			hasText(markdown, 'progressReportHandoff') &&
			hasText(markdown, 'statusMapping') &&
			hasText(markdown, 'ProgressBarStatus.None') &&
			hasText(markdown, 'report-ready') &&
			hasText(markdown, 'Native visual matrix') &&
			hasText(markdown, 'data-native-visual-matrix') &&
			hasText(markdown, 'native-visual-matrix') &&
			hasText(markdown, 'windows-mica-visual-row') &&
			hasText(markdown, 'macos-traffic-light-row') &&
			hasText(markdown, 'macos-vibrancy-visual-row') &&
			hasText(markdown, 'macos-vibrancy-host-policy') &&
			hasText(markdown, 'macos-material-host-policy') &&
			hasText(markdown, 'source-observed-macos-host-scaffold') &&
			hasText(markdown, 'macos-native-vibrancy-unverified') &&
			hasText(markdown, 'windows-caption-control-row') &&
			hasText(markdown, 'ultragear-theme-row') &&
			hasText(markdown, 'browser-fallback-visual-row') &&
			hasText(markdown, 'Community keyword search graph') &&
			hasText(markdown, 'data-community-keyword-search-graph') &&
			hasText(markdown, 'keywordSearchGraph') &&
			hasText(markdown, 'analytics-linked-keyword-graph') &&
			hasText(markdown, 'source-to-keyword-edge') &&
			hasText(markdown, 'curated-signal-score') &&
			hasText(markdown, 'collected-demand-score') &&
			hasText(markdown, 'directional-community-signal') &&
			hasText(markdown, 'no-live-community-api-runtime-boundary') &&
			hasText(markdown, 'alpha-community-source-evidence-checklist') &&
			hasText(markdown, 'Source health') &&
			hasText(markdown, 'Result total fields') &&
			hasText(markdown, 'Top fields:') &&
			hasText(markdown, 'Sample rule:') &&
			hasText(markdown, 'Release use:') &&
			hasText(markdown, 'Blocked policy:') &&
			hasText(markdown, 'Open-source analytics sources reviewers can audit first') &&
			hasText(markdown, 'Report graphics') &&
			hasText(markdown, 'community-source-map.svg') &&
			hasText(markdown, 'Required alpha evidence') &&
			hasText(markdown, 'requiredEvidence') &&
			hasText(markdown, 'required-alpha-evidence') &&
			hasText(markdown, 'native-host-binding-guide') &&
			hasText(markdown, 'real-host-permission-checklist') &&
			hasText(markdown, 'csr-disabled-prerender-contract') &&
			hasText(markdown, 'windows-11-mica-browser-safe-shell') &&
			hasText(markdown, 'macos-style-native-titlebar-rhythm') &&
			hasText(markdown, 'alpha-readiness-report-graphics') &&
			hasText(markdown, 'community-keyword-search-graph') &&
			hasText(markdown, 'community-analytics-freshness-contract') &&
			hasText(markdown, 'hosted-php-smoke-proof')
			? ok('markdown-report', 'Markdown report includes collected analytics, bridge reuse map, and source-map graphic evidence.')
			: fail('markdown-report', 'Markdown report is missing collected analytics, bridge reuse map, or source-map graphic evidence.')
	);

	checks.push(
		hasText(communityAnalyticsMarkdown, 'community analytics') &&
			hasText(communityAnalyticsMarkdown, 'Collection commands') &&
			hasText(communityAnalyticsMarkdown, 'Source coverage plan') &&
			hasText(communityAnalyticsMarkdown, 'Evidence kinds') &&
			hasText(communityAnalyticsMarkdown, 'Collection risk') &&
			hasText(communityAnalyticsMarkdown, 'community-analytics-freshness-contract') &&
			hasText(communityAnalyticsMarkdown, 'Keyword research map') &&
			hasText(communityAnalyticsMarkdown, 'Collection endpoints') &&
			hasText(communityAnalyticsMarkdown, 'Proof use:') &&
			hasText(communityAnalyticsMarkdown, 'Release use:') &&
			hasText(communityAnalyticsMarkdown, 'Reviewer action:') &&
			hasText(communityAnalyticsMarkdown, 'Collector note:') &&
			hasText(communityAnalyticsMarkdown, 'Source health:') &&
			hasText(communityAnalyticsMarkdown, 'Result total fields') &&
			hasText(communityAnalyticsMarkdown, 'Top result field contracts') &&
			hasText(communityAnalyticsMarkdown, 'Sample review rule') &&
			hasText(communityAnalyticsMarkdown, 'Alpha evidence checklist:') &&
			hasText(communityAnalyticsMarkdown, 'Blocked outcome policy:') &&
			hasText(communityAnalyticsMarkdown, 'api.github.com/search') &&
			hasText(communityAnalyticsMarkdown, 'google.com') &&
			hasText(communityAnalyticsMarkdown, 'bun run alpha:analytics')
			? ok(
					'community-analytics-markdown',
					'Community analytics Markdown includes source coverage, proof use, reviewer actions, source hosts, and public endpoint URLs.'
				)
			: fail(
					'community-analytics-markdown',
					'Community analytics Markdown is missing source coverage, proof use, reviewer actions, source hosts, or public endpoint URLs.'
				)
	);

	checks.push(
		hasText(reviewIndex, 'alpha reviewer index') &&
			hasText(reviewIndex, 'Windows 11 Mica') &&
			hasText(reviewIndex, 'data-native-host-bridge-status') &&
			hasText(reviewIndex, 'data-ultragear-source-parity') &&
			hasText(reviewIndex, 'ultraGearParityContract') &&
			hasText(reviewIndex, 'lg-ultragear-native-platform-provenance') &&
			hasText(reviewIndex, 'Effect.Mica') &&
			hasText(reviewIndex, 'win.startDragging') &&
			hasText(reviewIndex, 'reportJson') &&
			hasText(reviewIndex, 'data-progress-report-handoff') &&
			hasText(reviewIndex, 'progressReportHandoff') &&
			hasText(reviewIndex, 'ProgressBarStatus.Indeterminate') &&
			hasText(reviewIndex, 'ProgressBarStatus.None') &&
			hasText(reviewIndex, 'statusMapping') &&
			hasText(reviewIndex, 'report-ready') &&
			hasText(reviewIndex, 'data-native-visual-matrix') &&
			hasText(reviewIndex, 'native-visual-matrix') &&
			hasText(reviewIndex, 'windows-mica-visual-row') &&
			hasText(reviewIndex, 'macos-traffic-light-row') &&
			hasText(reviewIndex, 'windows-caption-control-row') &&
			hasText(reviewIndex, 'ultragear-theme-row') &&
			hasText(reviewIndex, 'browser-fallback-visual-row') &&
			hasText(reviewIndex, 'data-community-keyword-search-graph') &&
			hasText(reviewIndex, 'keywordSearchGraph') &&
			hasText(reviewIndex, 'analytics-linked-keyword-graph') &&
			hasText(reviewIndex, 'source-to-keyword-edge') &&
			hasText(reviewIndex, 'curated-signal-score') &&
			hasText(reviewIndex, 'collected-demand-score') &&
			hasText(reviewIndex, 'directional-community-signal') &&
			hasText(reviewIndex, 'no-live-community-api-runtime-boundary') &&
			hasText(reviewIndex, 'alpha-community-source-evidence-checklist') &&
			hasText(reviewIndex, 'source-health-classification') &&
			hasText(reviewIndex, 'result-total-field-contract') &&
			hasText(reviewIndex, 'top-result-field-contract') &&
			hasText(reviewIndex, 'sample-review-rule') &&
			hasText(reviewIndex, 'result_total_field') &&
			hasText(reviewIndex, 'top_result_fields') &&
			hasText(reviewIndex, 'sample_review_rule') &&
			hasText(reviewIndex, 'releaseUse') &&
			hasText(reviewIndex, 'blockedOutcomePolicy') &&
			hasText(reviewIndex, '__SVELTEKIT_PHP_NATIVE_HOST__') &&
			hasText(reviewIndex, 'Community evidence coverage ledger') &&
			hasText(reviewIndex, 'Open-source analytics sources reviewers can audit first') &&
			hasText(reviewIndex, 'source-observed-macos-host-scaffold') &&
			hasText(reviewIndex, 'macos-native-vibrancy-unverified') &&
			hasText(reviewIndex, 'community-source-map.svg') &&
			hasText(reviewIndex, 'api.github.com/search') &&
			hasText(reviewIndex, 'alpha-over-rc-release-policy') &&
			hasText(reviewIndex, 'Release documentation artifacts') &&
			hasText(reviewIndex, 'docs/ALPHA-RELEASE-CHECKLIST.md') &&
			hasText(reviewIndex, 'releasePolicy.channel=alpha') &&
			hasText(reviewIndex, 'releasePolicy.track=1.0.2-alpha') &&
			hasText(reviewIndex, 'releasePolicy.rank=above-rc') &&
			hasText(reviewIndex, 'projectRankPolicy=above-rc') &&
			hasText(reviewIndex, 'alphaOverRcPolicyProof') &&
			hasText(reviewIndex, 'getDesktopShellUiCommandMapping') &&
			hasText(reviewIndex, 'nativeHostBridgeMapping') &&
			hasText(reviewIndex, 'desktopShellUiHelper') &&
			hasText(reviewIndex, 'desktopShellUiEvidence') &&
			hasText(reviewIndex, 'Required alpha evidence') &&
			hasText(reviewIndex, 'requiredEvidence') &&
			hasText(reviewIndex, 'required-alpha-evidence') &&
			hasText(reviewIndex, 'native-host-binding-guide') &&
			hasText(reviewIndex, 'real-host-permission-checklist') &&
			hasText(reviewIndex, 'csr-disabled-prerender-contract') &&
			hasText(reviewIndex, 'windows-11-mica-browser-safe-shell') &&
			hasText(reviewIndex, 'macos-style-native-titlebar-rhythm') &&
			hasText(reviewIndex, 'alpha-readiness-report-graphics') &&
			hasText(reviewIndex, 'community-keyword-search-graph') &&
			hasText(reviewIndex, 'community-analytics-freshness-contract') &&
			hasText(reviewIndex, 'hosted-php-smoke-proof') &&
			hasText(reviewIndex, 'Alpha proof ledger') &&
			hasText(reviewIndex, 'alpha-runtime-gate-ledger') &&
			hasText(reviewIndex, 'hosted-php-smoke-proof-required') &&
			hasText(reviewIndex, 'ALPHA_SMOKE_BASE_URL')
			? ok('review-index', 'Reviewer index maps native styling, reports, graphics, community analytics, and hosted proof gates.')
			: fail('review-index', 'Reviewer index is missing native styling, graphics, community analytics, or hosted proof markers.')
	);

	checks.push(
		hasText(alphaPage, 'data-ultragear-source-parity') &&
			hasText(alphaPage, 'ultraGearParityContract') &&
			hasText(alphaPage, 'buildBridgeReuseInventory') &&
			hasText(alphaPage, 'data-desktop-shell-ui-binding') &&
			hasText(alphaPage, 'desktopShellUiBinding') &&
			hasText(alphaPage, '@scriptgpt/desktop-shell-ui') &&
			hasText(alphaPage, 'enableMicaWindowChrome') &&
			hasText(alphaPage, 'syncTaskbarProgress') &&
			hasText(alphaPage, 'toggleWindowMaximize') &&
			hasText(alphaPage, 'installSvelteKitPhpNativeHost') &&
			hasText(alphaPage, 'data-progress-report-handoff') &&
			hasText(alphaPage, 'progressReportHandoff') &&
			hasText(alphaPage, 'statusMapping') &&
			hasText(alphaPage, 'ProgressBarStatus.None') &&
			hasText(alphaPage, 'report-ready') &&
			hasText(alphaPage, 'data-native-visual-matrix') &&
			hasText(alphaPage, 'native-visual-matrix') &&
			hasText(alphaPage, 'windows-mica-visual-row') &&
			hasText(alphaPage, 'macos-traffic-light-row') &&
			hasText(alphaPage, 'windows-caption-control-row') &&
			hasText(alphaPage, 'ultragear-theme-row') &&
			hasText(alphaPage, 'browser-fallback-visual-row') &&
			hasText(alphaPage, 'data-required-alpha-evidence') &&
			hasText(alphaPage, 'Required alpha evidence') &&
			hasText(alphaPage, 'requiredEvidence') &&
			hasText(alphaPage, 'required-alpha-evidence') &&
			hasText(alphaPage, 'native-host-binding-guide') &&
			hasText(alphaPage, 'real-host-permission-checklist') &&
			hasText(alphaPage, 'csr-disabled-prerender-contract') &&
			hasText(alphaPage, 'windows-11-mica-browser-safe-shell') &&
			hasText(alphaPage, 'macos-style-native-titlebar-rhythm') &&
			hasText(alphaPage, 'alpha-readiness-report-graphics') &&
			hasText(alphaPage, 'community-keyword-search-graph') &&
			hasText(alphaPage, 'community-analytics-freshness-contract') &&
			hasText(alphaPage, 'hosted-php-smoke-proof') &&
			hasText(alphaPage, 'data-alpha-proof-ledger') &&
			hasText(alphaPage, 'proofLedger') &&
			hasText(alphaPage, 'Alpha proof ledger') &&
			hasText(alphaPage, 'alpha-over-rc-release-policy') &&
			hasText(alphaPage, 'analytics-linked-keyword-graph') &&
			hasText(alphaPage, 'alpha-runtime-gate-ledger') &&
			hasText(alphaPage, 'hosted-php-smoke-proof-required') &&
			hasText(alphaPage, 'needs-local-gate-proof') &&
			hasText(alphaPage, 'needs-hosted-proof') &&
			hasText(alphaPage, 'data-community-keyword-search-graph') &&
			hasText(alphaPage, 'data-analytics-linked-keyword-graph') &&
			hasText(alphaPage, 'keywordSearchGraph') &&
			hasText(alphaPage, 'analytics-linked-keyword-graph') &&
			hasText(alphaPage, 'source-to-keyword-edge') &&
			hasText(alphaPage, 'curated-signal-score') &&
			hasText(alphaPage, 'collected-demand-score') &&
			hasText(alphaPage, 'directional-community-signal') &&
			hasText(alphaPage, 'supported-api-lanes') &&
			hasText(alphaPage, 'manual-research-lanes')
			? ok(
					'alpha-live-page-evidence',
					'Live alpha page exposes UltraGear source parity, proof-ledger blockers, and community keyword-search graph evidence panels.'
				)
			: fail(
					'alpha-live-page-evidence',
					'Live alpha page is missing UltraGear source parity, proof-ledger blocker, or community keyword-search graph evidence markers.'
				)
	);

	checks.push(
		hasText(nativeWindowShellSource, "themeClass = 'theme-ultragear'") &&
			hasText(nativeWindowShellSource, 'data-native-platform-provenance') &&
			hasText(nativeWindowShellSource, 'data-window-material') &&
			hasText(nativeWindowShellSource, 'windows-11-mica') &&
			hasText(nativeWindowShellSource, 'data-macos-chrome') &&
			hasText(nativeWindowShellSource, 'data-windows-chrome') &&
			hasText(nativeTitlebarSource, 'data-native-platform-mode') &&
			hasText(nativeTitlebarSource, 'hybrid-proof') &&
			hasText(nativeTitlebarSource, 'data-macos-chrome') &&
			hasText(nativeTitlebarSource, 'data-windows-chrome') &&
			hasText(nativeTitlebarSource, 'data-window-control-group="macos"') &&
			hasText(nativeTitlebarSource, 'data-window-control-group="windows"')
			? ok(
					'native-shell-implementation',
					'Native shell components default to UltraGear theme and expose Windows Mica/macOS provenance markers.'
				)
			: fail(
					'native-shell-implementation',
					'Native shell components are missing UltraGear default theme, Mica material, or hybrid platform provenance markers.'
				)
	);

	checks.push(
		hasText(releaseNotes, 'alpha release notes') &&
			hasText(releaseNotes, 'Runtime evidence endpoints') &&
			hasText(releaseNotes, 'Evidence trust model') &&
			hasText(releaseNotes, 'Live evidence surfaces') &&
			hasText(releaseNotes, 'data-native-host-bridge-status') &&
			hasText(releaseNotes, '/alpha-readiness/native-host-wrapper-smoke.json') &&
			hasText(releaseNotes, 'nativeHostWrapperSmoke') &&
			hasText(releaseNotes, 'native-host-wrapper-smoke') &&
			hasText(releaseNotes, 'native-host-wrapper-probe') &&
			hasText(releaseNotes, 'realHostVerified') &&
			hasText(releaseNotes, 'deterministic-host-wrapper-handoff') &&
			hasText(releaseNotes, 'report/alpha-native-host-wrapper-smoke.json') &&
			hasText(releaseNotes, 'TaskbarProgressState') &&
			hasText(releaseNotes, 'nativeVisualMatrix') &&
			hasText(releaseNotes, 'native-visual-matrix') &&
			hasText(releaseNotes, 'nativePlatformProvenance') &&
			hasText(releaseNotes, 'lg-ultragear-native-platform-provenance') &&
			hasText(releaseNotes, '@scriptgpt/desktop-shell-ui') &&
			hasText(releaseNotes, 'Project-rank policy') &&
			hasText(releaseNotes, '1.0.2-alpha is the required pre-stable release label') &&
			hasText(releaseNotes, 'SemVer note') &&
			hasText(releaseNotes, 'RC, latest, and stable channels remain disallowed') &&
			hasText(releaseNotes, 'desktopShellUiBinding') &&
			hasText(releaseNotes, 'enableMicaWindowChrome') &&
			hasText(releaseNotes, 'syncTaskbarProgress') &&
			hasText(releaseNotes, 'toggleWindowMaximize') &&
			hasText(releaseNotes, 'alpha-over-rc-release-policy') &&
			hasText(releaseNotes, 'channel alpha') &&
			hasText(releaseNotes, 'track 1.0.2-alpha') &&
			hasText(releaseNotes, 'rank above-rc') &&
			hasText(releaseNotes, 'Required alpha evidence') &&
			hasText(releaseNotes, 'requiredEvidence') &&
			hasText(releaseNotes, 'required-alpha-evidence') &&
			hasText(releaseNotes, 'native-host-binding-guide') &&
			hasText(releaseNotes, 'csr-disabled-prerender-contract') &&
			hasText(releaseNotes, 'windows-11-mica-browser-safe-shell') &&
			hasText(releaseNotes, 'macos-style-native-titlebar-rhythm') &&
			hasText(releaseNotes, 'alpha-readiness-report-graphics') &&
			hasText(releaseNotes, 'community-keyword-search-graph') &&
			hasText(releaseNotes, 'community-analytics-freshness-contract') &&
			hasText(releaseNotes, 'hosted-php-smoke-proof') &&
			hasText(releaseNotes, 'Alpha proof ledger') &&
			hasText(releaseNotes, 'alpha-runtime-gate-ledger') &&
			hasText(releaseNotes, 'hosted-php-smoke-proof-required') &&
			hasText(releaseNotes, 'Community evidence coverage ledger') &&
			hasText(releaseNotes, 'directional-community-signal') &&
			hasText(releaseNotes, 'no-live-community-api-runtime-boundary') &&
			hasText(releaseNotes, 'result-total-field-contract') &&
			hasText(releaseNotes, 'top-result-field-contract') &&
			hasText(releaseNotes, 'sample-review-rule') &&
			hasText(releaseNotes, 'result_total_field') &&
			hasText(releaseNotes, 'top_result_fields') &&
			hasText(releaseNotes, 'sample_review_rule') &&
			hasText(releaseNotes, 'bun run alpha:native:smoke') &&
			hasText(releaseNotes, 'ALPHA_SMOKE_BASE_URL')
			? ok('release-notes', 'Release notes include alpha call, runtime endpoints, and hosted gate command.')
			: fail('release-notes', 'Release notes are missing alpha call, runtime endpoints, or hosted gate command.')
	);

	checks.push(
			hasText(svg, '<svg') &&
			hasText(svg, 'alpha readiness graphic') &&
			hasText(svg, 'data-required-alpha-evidence') &&
			hasText(svg, 'Required alpha evidence') &&
			hasText(svg, 'requiredEvidence') &&
			hasText(svg, 'required-alpha-evidence') &&
			hasText(svg, 'native-host-binding-guide') &&
			hasText(svg, 'csr-disabled-prerender-contract') &&
			hasText(svg, 'windows-11-mica-browser-safe-shell') &&
			hasText(svg, 'macos-style-native-titlebar-rhythm') &&
			hasText(svg, 'alpha-readiness-report-graphics') &&
			hasText(svg, 'community-keyword-search-graph') &&
			hasText(svg, 'community-analytics-freshness-contract') &&
			hasText(svg, 'hosted-php-smoke-proof') &&
			hasText(svg, 'Community signals') &&
			hasText(svg, 'hosted smoke:') &&
			hasText(svg, 'trust model:') &&
			hasText(svg, 'Windows 11 Mica') &&
			hasText(svg, 'source-observed macOS host policy') &&
			hasText(svg, 'native-visual-matrix') &&
			hasText(svg, 'windows-mica-visual-row') &&
			hasText(svg, 'macos-traffic-light-row') &&
			hasText(svg, 'macos-vibrancy-visual-row') &&
			hasText(svg, 'macos-vibrancy-host-policy') &&
			hasText(svg, 'macos-material-host-policy') &&
			hasText(svg, 'source-observed-macos-host-scaffold') &&
			hasText(svg, 'macos-native-vibrancy-unverified') &&
			hasText(svg, 'data-macos-material-host-policy') &&
			hasText(svg, 'data-macos-native-vibrancy') &&
			hasText(svg, 'native-window-action') &&
			hasText(svg, 'data-native-host-handoff-controls') &&
			hasText(svg, 'set-window-effect') &&
			hasText(svg, 'set-progress') &&
			hasText(svg, 'clear-progress') &&
			hasText(svg, 'data-native-platform-provenance') &&
			hasText(svg, 'lg-ultragear-native-platform-provenance') &&
			hasText(svg, 'desktopShellUiBinding') &&
			hasText(svg, '@scriptgpt/desktop-shell-ui') &&
			hasText(svg, 'installSvelteKitPhpNativeHost') &&
			hasText(svg, 'enableMicaWindowChrome') &&
			hasText(svg, 'syncTaskbarProgress') &&
			hasText(svg, 'toggleWindowMaximize') &&
			hasText(svg, 'Effect.Mica') &&
			hasText(svg, 'win.setEffects') &&
			hasText(svg, 'win.startDragging') &&
			hasText(svg, 'reportJson') &&
			hasText(svg, 'data-alpha-proof-ledger') &&
			hasText(svg, 'proofLedger') &&
			hasText(svg, 'proofLedger blockers') &&
			hasText(svg, 'alpha-over-rc-release-policy') &&
			hasText(svg, 'analytics-linked-keyword-graph') &&
			hasText(svg, 'sourceToKeywordEdge') &&
			hasText(svg, 'analyticsLinkageMarker') &&
			hasText(svg, 'weightedDemandScore') &&
			hasText(svg, 'freshnessMaxAgeHours') &&
			hasText(svg, 'trustBoundary') &&
			hasText(svg, 'manualReviewRequired') &&
			hasText(svg, 'alpha-runtime-gate-ledger') &&
			hasText(svg, 'hosted-php-smoke-proof-required') &&
			hasText(svg, 'needs-local-gate-proof') &&
			hasText(svg, 'needs-hosted-proof') &&
			hasText(svg, 'progressReportHandoff') &&
			hasText(svg, 'statusMapping') &&
			hasText(svg, 'ProgressBarStatus.Indeterminate') &&
			hasText(svg, 'ProgressBarStatus.None') &&
			hasText(svg, 'report-ready') &&
			hasText(svg, 'directional-community-signal') &&
			hasText(svg, 'no-live-community-api-runtime-boundary') &&
			hasText(svg, 'data-native-host-bridge-status') &&
			hasText(svg, 'Community ledger:')
			? ok(
					'svg-report',
					'SVG report graphic includes native alpha, proof-ledger blockers, community, hosted smoke, and bridge cue summary.'
				)
			: fail(
					'svg-report',
					'SVG report graphic is missing native alpha, proof-ledger blocker, community, hosted smoke, or bridge cue summary.'
				)
	);

	checks.push(
			hasText(sourceMapSvg, '<svg') &&
			hasText(sourceMapSvg, 'sourceToKeywordEdge') &&
			hasText(sourceMapSvg, 'analyticsLinkageMarker') &&
			hasText(sourceMapSvg, 'weightedDemandScore') &&
			hasText(sourceMapSvg, 'freshnessMaxAgeHours') &&
			hasText(sourceMapSvg, 'trustBoundary') &&
			hasText(sourceMapSvg, 'manualReviewRequired') &&
			hasText(sourceMapSvg, 'community source map') &&
			hasText(sourceMapSvg, 'keyword-search-graph') &&
			hasText(sourceMapSvg, 'analytics-linked-keyword-graph') &&
			hasText(sourceMapSvg, 'source-to-keyword-edge') &&
			hasText(sourceMapSvg, 'supported-api-lanes') &&
			hasText(sourceMapSvg, 'manual-research-lanes') &&
			hasText(sourceMapSvg, 'curated-signal-score') &&
			hasText(sourceMapSvg, 'collected-demand-score') &&
			hasText(sourceMapSvg, 'directional-community-signal') &&
			hasText(sourceMapSvg, 'no-live-community-api-runtime-boundary') &&
			hasText(sourceMapSvg, 'data-no-live-community-api-runtime-boundary') &&
			hasText(sourceMapSvg, 'supported-json-api') &&
			hasText(sourceMapSvg, 'manual-research-link') &&
			hasText(sourceMapSvg, 'evidence kind') &&
			hasText(sourceMapSvg, 'collection risk') &&
			hasText(sourceMapSvg, 'api.github.com/search') &&
			hasText(sourceMapSvg, 'google.com') &&
			hasText(sourceMapSvg, 'requiredEvidence') &&
			hasText(sourceMapSvg, 'required-alpha-evidence') &&
			requiredAlphaEvidence.every((marker) => hasText(sourceMapSvg, marker))
			? ok(
					'community-source-map-svg',
					'Community source-map SVG includes supported API lanes, manual lanes, analytics-linkage markers, endpoint markers, source hosts, and required alpha evidence markers.'
				)
			: fail(
					'community-source-map-svg',
					'Community source-map SVG is missing supported API lanes, manual lanes, analytics-linkage markers, endpoint markers, source hosts, or required alpha evidence markers.'
				)
	);

	checks.push(
		hasText(readinessCsv, '"kind","id","label","status","score","description","gap","marker","evidence"') &&
			hasText(readinessCsv, '"readiness","runtime-correctness"') &&
			hasText(readinessCsv, '"proof-ledger","alpha-channel-policy"') &&
			hasText(readinessCsv, '"required-evidence","native-host-binding-guide"') &&
			hasText(readinessCsv, 'requiredEvidence') &&
			hasText(readinessCsv, 'required-alpha-evidence') &&
			hasText(readinessCsv, 'desktop-shell-ui-command-mapping') &&
			hasText(readinessCsv, 'windows-11-mica-browser-safe-shell') &&
			hasText(readinessCsv, 'macos-style-native-titlebar-rhythm') &&
			hasText(readinessCsv, 'alpha-readiness-report-graphics') &&
			hasText(readinessCsv, 'community-keyword-search-graph') &&
			hasText(readinessCsv, 'community-analytics-freshness-contract') &&
			hasText(readinessCsv, 'community-analytics-csv-linkage') &&
			hasText(readinessCsv, 'router-path-safety-artifact-sync') &&
			hasText(readinessCsv, 'adapter-platform-emulation') &&
			hasText(readinessCsv, 'deploy-env-preflight-safety') &&
			hasText(readinessCsv, 'hosted-php-smoke-proof') &&
			hasText(readinessCsv, 'alpha-over-rc-release-policy') &&
			hasText(readinessCsv, 'native-visual-matrix') &&
			hasText(readinessCsv, 'analytics-linked-keyword-graph') &&
			hasText(readinessCsv, 'alpha-runtime-gate-ledger') &&
			hasText(readinessCsv, 'hosted-php-smoke-proof-required') &&
			hasText(
				communitySignalsCsv,
				'"id","keyword","intent","curated_score","collected_demand_score","weighted_demand_score","analytics_linkage_marker","source_to_keyword_edges","curated_signal_score_marker","collected_demand_score_marker","directional_trust_level","community_links"'
			) &&
			hasText(communitySignalsCsv, 'analytics-linked-keyword-graph') &&
			hasText(communitySignalsCsv, 'weighted_demand_score') &&
			hasText(communitySignalsCsv, 'source_to_keyword_edges') &&
			hasText(communitySignalsCsv, 'curated-signal-score') &&
			hasText(communitySignalsCsv, 'collected-demand-score') &&
			hasText(communitySignalsCsv, 'directional-community-signal') &&
			hasText(communitySignalsCsv, 'GitHub repos:') &&
			communityCsvIncludesCollectedScores &&
			hasText(
				communitySourcesCsv,
				'"signal_id","keyword","source_label","source_host","provider","mode","evidence_kind","collection_risk","collection_priority","action_lane","confidence_tier","collection_method","freshness_max_age_hours","evidence_weight","trust_boundary","source_health","analytics_linkage_marker","alpha_evidence_checklist_marker","alpha_evidence_checklist","source_to_keyword_edge","manual_review_required","endpoint","href","proof_use","release_use","release_claim_use","reviewer_action","collector_note","blocked_outcome_policy","result_total_field","top_result_fields","sample_review_rule"'
			) &&
			hasText(communitySourcesCsv, 'api.github.com/search') &&
			hasText(communitySourcesCsv, 'analytics-linked-keyword-graph') &&
			hasText(communitySourcesCsv, 'freshness_max_age_hours') &&
			hasText(communitySourcesCsv, 'trust_boundary') &&
			hasText(communitySourcesCsv, 'source_health') &&
			hasText(communitySourcesCsv, 'alpha_evidence_checklist_marker') &&
			hasText(communitySourcesCsv, 'alpha-community-source-evidence-checklist') &&
			hasText(communitySourcesCsv, 'blocked_outcome_policy') &&
			hasText(communitySourcesCsv, 'result_total_field') &&
			hasText(communitySourcesCsv, 'top_result_fields') &&
			hasText(communitySourcesCsv, 'sample_review_rule') &&
			hasText(communitySourcesCsv, 'manual_review_required') &&
			hasText(communitySourcesCsv, '"repository-index"') &&
			hasText(communitySourcesCsv, '"collection') &&
			hasText(communitySourcesCsv, '"reviewer_action"') &&
			hasText(communitySourcesCsv, 'manual-research-link')
			? ok(
					'csv-reports',
					'CSV exports include readiness rows, collected demand scores, community signal links, and source-level endpoint inventory.'
				)
			: fail(
					'csv-reports',
					'CSV exports are missing readiness rows, collected demand scores, community signal links, or source-level endpoint inventory.'
				)
	);

	checks.push(
		communityResearchPack?.target === report.target &&
			communityResearchPack?.summary?.queryCount >= 4 &&
			communityResearchPack?.summary?.supportedSourceCount > 0 &&
			communityResearchPack?.summary?.manualSourceCount > 0 &&
			communityResearchPack?.summary?.analyticsFreshnessContract === true &&
			communityResearchPack?.summary?.analyticsLinkedKeywordGraph === true &&
			communityResearchPack?.summary?.communityAnalyticsGraphicLinkageContract === true &&
			communityResearchPack?.summary?.noLiveCommunityApiRuntimeBoundary === true &&
			communityResearchPack?.summary?.resultTotalFieldCoverage === true &&
			communityResearchPack?.summary?.sampleReviewRuleCoverage === true &&
			communityResearchPack?.summary?.requiredAlphaEvidenceLinked === true &&
			communityResearchPack?.summary?.keywordSearchGraphNodes >= 4 &&
			communityResearchPack?.summary?.keywordSearchGraphEdges > 0 &&
			(communityResearchPack?.summary?.providerCoverage ?? []).length > 0 &&
			(communityResearchPack?.summary?.evidenceKindCoverage ?? []).length > 0 &&
			(communityResearchPack?.summary?.collectionRiskCoverage ?? []).length > 0 &&
			communityResearchPack?.analyticsFreshnessContract?.marker ===
				'community-analytics-freshness-contract' &&
			communityResearchPack?.analyticsFreshnessContract?.maxAgeHours === 168 &&
			communityResearchPack?.analyticsFreshnessContract?.runtimeCollectionBoundary?.marker ===
				'no-live-community-api-runtime-boundary' &&
			communityResearchPack?.runtimeCollectionBoundary?.marker ===
				'no-live-community-api-runtime-boundary' &&
			communityResearchPack?.runtimeCollectionBoundary?.trustLevel ===
				'deterministic-runtime-evidence' &&
			(communityResearchPack?.reviewerWorkflow ?? []).some((step) => step.includes('source-map')) &&
			(communityResearchPack?.collectionPlan ?? []).some(
				(source) =>
					source.sourceHost &&
					source.evidenceKind &&
					source.collectionRisk &&
					source.sourceToKeywordEdge &&
					source.analyticsLinkageMarker === 'analytics-linked-keyword-graph' &&
					source.freshnessMaxAgeHours &&
					source.evidenceWeight &&
					source.trustBoundary &&
					source.sourceHealth &&
					source.alphaEvidenceChecklistMarker === 'alpha-community-source-evidence-checklist' &&
					(source.alphaEvidenceChecklist ?? []).includes('record-source-to-keyword-edge') &&
					typeof source.manualReviewRequired === 'boolean' &&
					source.priority &&
					source.proofUse &&
					source.releaseUse &&
					source.reviewerAction &&
					source.collectorNote &&
					source.blockedOutcomePolicy &&
					source.resultTotalField &&
					(source.topResultFields ?? []).length > 0 &&
					source.sampleReviewRule
			) &&
			(communityResearchPack?.queries ?? []).some((query) => query.keyword?.includes('SvelteKit PHP adapter')) &&
			(communityResearchPack?.queries ?? []).some((query) =>
				(query.supportedSources ?? []).some(
					(source) =>
						source.endpoint?.includes('api.github.com/search') &&
						source.evidenceKind &&
						source.collectionRisk &&
						source.sourceToKeywordEdge &&
						source.analyticsLinkageMarker === 'analytics-linked-keyword-graph' &&
						source.freshnessMaxAgeHours &&
						source.evidenceWeight &&
						source.trustBoundary &&
						source.sourceHealth === 'countable-public-api' &&
						source.alphaEvidenceChecklistMarker === 'alpha-community-source-evidence-checklist' &&
						(source.alphaEvidenceChecklist ?? []).includes('review-maintenance-signal') &&
						typeof source.manualReviewRequired === 'boolean' &&
						source.proofUse &&
						source.releaseUse &&
						source.reviewerAction
				)
			) &&
			(communityResearchPack?.queries ?? []).some((query) =>
				(query.manualSources ?? []).some(
					(source) =>
						source.sourceHost &&
						source.endpoint === null &&
						source.evidenceKind === 'manual-hosting-research' &&
						source.collectionRisk === 'manual' &&
						source.sourceToKeywordEdge &&
						source.analyticsLinkageMarker === 'analytics-linked-keyword-graph' &&
						source.freshnessMaxAgeHours &&
						source.evidenceWeight &&
						source.trustBoundary === 'manual-qualitative-review' &&
						source.sourceHealth === 'manual-review-only' &&
						source.alphaEvidenceChecklistMarker === 'alpha-community-source-evidence-checklist' &&
						(source.alphaEvidenceChecklist ?? []).includes('open-manual-research-link') &&
						source.manualReviewRequired === true &&
						source.blockedOutcomePolicy
				)
			)
			&& communityResearchPack?.keywordSearchGraph?.analyticsLinkage?.marker === 'analytics-linked-keyword-graph'
			&& communityResearchPack?.keywordSearchGraph?.analyticsLinkage?.directionalTrustLevel === 'directional-community-signal'
			&& (communityResearchPack?.keywordSearchGraph?.analyticsLinkage?.graphicMarkers ?? []).includes('curated-signal-score')
			&& (communityResearchPack?.keywordSearchGraph?.analyticsLinkage?.graphicMarkers ?? []).includes('collected-demand-score')
			&& (communityResearchPack?.keywordSearchGraph?.analyticsLinkage?.graphicMarkers ?? []).includes('no-live-community-api-runtime-boundary')
			&& requiredAlphaEvidence.every((marker) => (communityResearchPack?.requiredAlphaEvidence ?? []).includes(marker))
			&& requiredAlphaEvidence.every((marker) => (communityResearchPack?.keywordSearchGraph?.requiredEvidence ?? []).includes(marker))
			&& requiredAlphaEvidence.every((marker) => (communityResearchPack?.keywordSearchGraph?.reviewContract?.requiredEvidence ?? []).includes(marker))
			&& communityResearchPack?.keywordSearchGraph?.reviewContract?.marker === 'community-analytics-graphic-linkage-contract'
			&& communityResearchPack?.keywordSearchGraph?.reviewContract?.graphic === '/alpha-readiness/community-source-map.svg'
			&& communityResearchPack?.keywordSearchGraph?.reviewContract?.analyticsMarkdown === '/alpha-readiness/community-analytics.md'
			&& (communityResearchPack?.keywordSearchGraph?.reviewContract?.requiredMarkers ?? []).includes('analytics-linked-keyword-graph')
			&& (communityResearchPack?.keywordSearchGraph?.reviewContract?.requiredMarkers ?? []).includes('community-analytics-freshness-contract')
			&& (communityResearchPack?.keywordSearchGraph?.reviewContract?.requiredMarkers ?? []).includes('collected-demand-score')
			&& (communityResearchPack?.keywordSearchGraph?.reviewContract?.requiredMarkers ?? []).includes('directional-community-signal')
			&& (communityResearchPack?.keywordSearchGraph?.reviewContract?.requiredMarkers ?? []).includes('no-live-community-api-runtime-boundary')
			&& (communityResearchPack?.keywordSearchGraph?.reviewContract?.requiredMarkers ?? []).includes('alpha-community-source-evidence-checklist')
			&& (communityResearchPack?.keywordSearchGraph?.reviewContract?.requiredMarkers ?? []).includes('source-health-classification')
			&& (communityResearchPack?.keywordSearchGraph?.reviewContract?.requiredMarkers ?? []).includes('result-total-field-contract')
			&& (communityResearchPack?.keywordSearchGraph?.reviewContract?.requiredMarkers ?? []).includes('top-result-field-contract')
			&& (communityResearchPack?.keywordSearchGraph?.reviewContract?.requiredMarkers ?? []).includes('sample-review-rule')
			&& (communityResearchPack?.keywordSearchGraph?.reviewContract?.requiredAlphaMarkers ?? []).includes('requiredEvidence')
			&& (communityResearchPack?.keywordSearchGraph?.reviewContract?.requiredAlphaMarkers ?? []).includes('required-alpha-evidence')
			&& (communityResearchPack?.keywordSearchGraph?.reviewContract?.requiredAlphaMarkers ?? []).includes('alpha-readiness-report-graphics')
			&& (communityResearchPack?.keywordSearchGraph?.reviewContract?.requiredAlphaMarkers ?? []).includes('community-keyword-search-graph')
			&& (communityResearchPack?.keywordSearchGraph?.reviewContract?.requiredAlphaMarkers ?? []).includes('community-analytics-freshness-contract')
			&& (communityResearchPack?.keywordSearchGraph?.nodes ?? []).some(
				(node) =>
					node.keyword?.includes('SvelteKit PHP adapter') &&
					node.analyticsLinkage?.marker === 'analytics-linked-keyword-graph' &&
					node.analyticsLinkage?.trustLevel === 'directional-community-signal' &&
					(node.apiEndpoints ?? []).some(
						(endpoint) =>
							endpoint.endpoint?.includes('api.github.com/search') &&
							endpoint.sourceHealth === 'countable-public-api' &&
							(endpoint.alphaEvidenceChecklist ?? []).includes('record-source-to-keyword-edge')
					) &&
					(node.manualLinks ?? []).some(
						(link) =>
							link.sourceHost &&
							link.sourceHealth === 'manual-review-only' &&
							(link.alphaEvidenceChecklist ?? []).includes('open-manual-research-link')
					)
			)
			&& (communityResearchPack?.keywordSearchGraph?.edges ?? []).some(
				(edge) =>
					edge.mode === 'supported-json-api' &&
					edge.evidenceKind &&
					edge.collectionRisk &&
					edge.sourceHealth &&
					edge.alphaEvidenceChecklistMarker === 'alpha-community-source-evidence-checklist' &&
					edge.endpoint
			)
			? ok(
					'community-research-pack',
					'Community research pack inventories supported API sources, public endpoints, source hosts, manual research links, the analytics graphic linkage contract, and the required alpha evidence boundary.'
				)
			: fail(
					'community-research-pack',
					'Community research pack is missing query inventory, supported source endpoints, source hosts, manual links, or analytics graphic linkage metadata.'
				)
	);

	checks.push(
		bridgeReuse?.target === report.target &&
			bridgeReuse?.bridgeSource?.includes('lg-ultragear-bridge') &&
			bridgeReuse?.nativePlatformProvenance?.marker === 'lg-ultragear-native-platform-provenance' &&
			(bridgeReuse?.nativePlatformProvenance?.sourceFiles ?? []).includes('src/app.ts') &&
			(bridgeReuse?.nativePlatformProvenance?.sourceFiles ?? []).includes('src-tauri/src/lib.rs') &&
			(bridgeReuse?.nativePlatformProvenance?.sourceFiles ?? []).includes(
				'packages/ultragear-widget-ui/src/app.ts'
			) &&
			(bridgeReuse?.nativePlatformProvenance?.sourceFiles ?? []).includes(
				'src/lib/bridge-ui/shell/BridgeShell.svelte'
			) &&
			(bridgeReuse?.nativePlatformProvenance?.windowsMicaCues ?? []).includes('Effect.Mica') &&
			(bridgeReuse?.nativePlatformProvenance?.windowsMicaCues ?? []).includes('micaSupported') &&
			(bridgeReuse?.nativePlatformProvenance?.windowsMicaCues ?? []).includes(
				'ShellFeatureProbe.mica_supported'
			) &&
			(bridgeReuse?.nativePlatformProvenance?.windowsMicaCues ?? []).includes(
				'current_shell_features()'
			) &&
			(bridgeReuse?.nativePlatformProvenance?.windowsMicaCues ?? []).includes(
				'cfg!(target_os = "windows")'
			) &&
			(bridgeReuse?.nativePlatformProvenance?.windowsMicaCues ?? []).includes(
				'--window-bg-mica'
			) &&
			(bridgeReuse?.nativePlatformProvenance?.shellMaterialCues ?? []).includes(
				'app-window.maximized'
			) &&
			(bridgeReuse?.nativePlatformProvenance?.shellMaterialCues ?? []).includes(
				'max-width: 860px'
			) &&
			(bridgeReuse?.nativePlatformProvenance?.macosChromeCues ?? []).includes(
				'data-window-control-group'
			) &&
			(bridgeReuse?.nativePlatformProvenance?.macosChromeCues ?? []).includes(
				'macos-vibrancy-host-policy'
			) &&
			(bridgeReuse?.nativePlatformProvenance?.macosChromeCues ?? []).includes(
				'macos-vibrancy-visual-row'
			) &&
			(bridgeReuse?.nativePlatformProvenance?.macosChromeCues ?? []).includes(
				'data-macos-chrome'
			) &&
			(bridgeReuse?.nativePlatformProvenance?.windowActionCues ?? []).includes(
				'setPointerCapture'
			) &&
			(bridgeReuse?.nativePlatformProvenance?.windowActionCues ?? []).includes(
				'win.startDragging'
			) &&
			(bridgeReuse?.nativePlatformProvenance?.adapterEvidence ?? []).some((item) =>
				item.includes('data-window-material')
			) &&
			(bridgeReuse?.nativePlatformProvenance?.adapterEvidence ?? []).some((item) =>
				item.includes('data-native-platform-mode')
			) &&
			(bridgeReuse?.nativePlatformProvenance?.progressReportCues ?? []).includes(
				'win.setProgressBar'
			) &&
			(bridgeReuse?.nativePlatformProvenance?.progressReportCues ?? []).includes('reportJson') &&
			(bridgeReuse?.patterns ?? []).some((pattern) => pattern.label?.includes('Mica')) &&
			(bridgeReuse?.implementationFiles ?? []).some((file) => file.path?.includes('NativeWindowShell.svelte')) &&
			(bridgeReuse?.implementationFiles ?? []).some((file) => file.path?.includes('NativeHostBridgeStatus.svelte')) &&
			(bridgeReuse?.implementationFiles ?? []).some((file) => file.path?.includes('native-host-event-bridge.ts')) &&
			(bridgeReuse?.sourceCues ?? []).some((cue) => (cue.cues ?? []).includes('Effect.Mica')) &&
			(bridgeReuse?.sourceCues ?? []).some(
				(cue) =>
					cue.source === 'packages/desktop-shell-ui/src/index.ts' &&
					(cue.cues ?? []).includes('enableMicaWindowChrome') &&
					(cue.cues ?? []).includes('syncTaskbarProgress') &&
					(cue.cues ?? []).includes('toggleWindowMaximize')
			) &&
			(bridgeReuse?.sourceCues ?? []).some(
				(cue) =>
					cue.source === 'packages/ultragear-widget-ui/src/app.ts' &&
					(cue.cues ?? []).includes('features.micaSupported') &&
					(cue.cues ?? []).includes('enableMicaWindowChrome(win)') &&
					(cue.cues ?? []).includes(
						'syncTaskbarProgress(win, { saveInFlight, refreshInFlight, hasQueuedSave })'
					) &&
					(cue.cues ?? []).includes('toggleDesktopWindowMaximize(win)')
			) &&
			(bridgeReuse?.sourceCues ?? []).some(
				(cue) =>
					cue.source === 'src-tauri/src/lib.rs' &&
					(cue.cues ?? []).includes('ShellFeatureProbe.mica_supported') &&
					(cue.cues ?? []).includes('current_shell_features()') &&
					(cue.cues ?? []).includes('cfg!(target_os = "windows")') &&
					(cue.cues ?? []).includes('MacosLauncher::LaunchAgent')
			) &&
			(bridgeReuse?.sourceCues ?? []).some(
				(cue) =>
					cue.source === 'src-tauri/Cargo.toml' &&
					(cue.cues ?? []).includes('cfg(any(target_os = "macos", windows, target_os = "linux"))')
			) &&
			(bridgeReuse?.sourceCues ?? []).some((cue) => (cue.cues ?? []).includes(':root[data-window-effect="mica"]')) &&
			(bridgeReuse?.sourceCues ?? []).some((cue) => (cue.cues ?? []).includes('app-window')) &&
			(bridgeReuse?.sourceCues ?? []).some((cue) => (cue.cues ?? []).includes('max-width: 1180px')) &&
			(bridgeReuse?.sourceCues ?? []).some((cue) => (cue.cues ?? []).includes('pointerdown')) &&
			(bridgeReuse?.sourceCues ?? []).some((cue) => (cue.cues ?? []).includes('Download report JSON')) &&
			(bridgeReuse?.ultraGearParityContract?.parityRows ?? []).some(
				(row) =>
					row.sourceFile === 'src/app.ts' &&
					(row.sourceCues ?? []).includes('applyWindowChrome') &&
					(row.sourceCues ?? []).includes('Effect.Mica') &&
					(row.sourceCues ?? []).includes('win.setEffects') &&
					(row.sourceCues ?? []).includes('syncWindowProgress') &&
					(row.sourceCues ?? []).includes('win.setProgressBar')
			) &&
			(bridgeReuse?.ultraGearParityContract?.parityRows ?? []).some(
				(row) =>
					row.sourceFile === 'packages/desktop-shell-ui/src/index.ts' &&
					(row.sourceCues ?? []).includes('enableMicaWindowChrome') &&
					(row.sourceCues ?? []).includes('syncTaskbarProgress') &&
					(row.sourceCues ?? []).includes('toggleWindowMaximize') &&
					(row.localEvidence ?? []).includes('desktopShellUiBinding') &&
					(row.localEvidence ?? []).includes('installSvelteKitPhpNativeHost')
			) &&
			(bridgeReuse?.ultraGearParityContract?.parityRows ?? []).some(
				(row) =>
					row.sourceFile === 'packages/ultragear-widget-ui/src/app.ts' &&
					(row.sourceCues ?? []).includes('features.micaSupported') &&
					(row.sourceCues ?? []).includes('enableMicaWindowChrome(win)') &&
					(row.localEvidence ?? []).includes('data-native-host-handoff-controls') &&
					(row.localEvidence ?? []).includes('native-window-action')
			) &&
			bridgeReuse?.nativeHostCompatibilityMatrix?.marker === 'native-host-compatibility-matrix' &&
			bridgeReuse?.nativeHostCompatibilityMatrix?.trustLevel ===
				'source-observed-host-compatibility-contract' &&
			(bridgeReuse?.nativeHostCompatibilityMatrix?.rows ?? []).some(
				(row) =>
					row.id === 'windows-mica-effects' &&
					JSON.stringify(row).includes('features.micaSupported') &&
					JSON.stringify(row).includes('ShellFeatureProbe.mica_supported') &&
					JSON.stringify(row).includes('current_shell_features()') &&
					JSON.stringify(row).includes('set-window-effect')
			) &&
			(bridgeReuse?.nativeHostCompatibilityMatrix?.rows ?? []).some(
				(row) =>
					row.id === 'taskbar-progress-reporting' &&
					JSON.stringify(row).includes(
						'syncTaskbarProgress(win, { saveInFlight, refreshInFlight, hasQueuedSave })'
					) &&
					JSON.stringify(row).includes('set-progress')
			) &&
			(bridgeReuse?.nativeHostCompatibilityMatrix?.rows ?? []).some(
				(row) =>
					row.id === 'native-titlebar-drag-maximize' &&
					JSON.stringify(row).includes('win.startDragging()') &&
					JSON.stringify(row).includes('native-window-action')
			) &&
			(bridgeReuse?.nativeHostCompatibilityMatrix?.rows ?? []).some(
				(row) =>
					row.id === 'macos-material-host-policy' &&
					JSON.stringify(row).includes('source-observed-macos-host-scaffold') &&
					JSON.stringify(row).includes('macos-native-vibrancy-unverified') &&
					JSON.stringify(row).includes('MacosLauncher::LaunchAgent')
			) &&
			(bridgeReuse?.ultraGearParityContract?.parityRows ?? []).some(
				(row) =>
					row.sourceFile?.includes('BridgeShell.svelte') &&
					(row.sourceCues ?? []).includes('app-window') &&
					(row.sourceCues ?? []).includes('app-window.maximized') &&
					(row.localEvidence ?? []).includes('data-window-effect="mica"')
			) &&
			(bridgeReuse?.ultraGearParityContract?.parityRows ?? []).some(
				(row) =>
					row.sourceFile?.includes('BridgeTopbar.svelte') &&
					(row.sourceCues ?? []).includes('DRAG_START_THRESHOLD_PX') &&
					(row.sourceCues ?? []).includes('setPointerCapture') &&
					(row.sourceCues ?? []).includes('lostpointercapture') &&
					(row.localEvidence ?? []).includes('native-window-action')
			) &&
			(bridgeReuse?.ultraGearParityContract?.parityRows ?? []).some(
				(row) =>
					row.sourceFile?.includes('ValidationView.svelte') &&
					(row.sourceCues ?? []).includes('Structured report preview') &&
					(row.localEvidence ?? []).includes('community-source-map.svg')
			) &&
			(bridgeReuse?.progressReportHandoff?.sourceCues ?? []).includes('syncWindowProgress') &&
			(bridgeReuse?.progressReportHandoff?.sourceCues ?? []).includes(
				'packages/desktop-shell-ui/src/index.ts syncTaskbarProgress'
			) &&
			(bridgeReuse?.progressReportHandoff?.sourceCues ?? []).includes('ProgressBarStatus.Indeterminate') &&
			(bridgeReuse?.progressReportHandoff?.sourceCues ?? []).includes('Structured report preview') &&
			(bridgeReuse?.progressReportHandoff?.adapterEvidence ?? []).includes('/alpha-readiness/report.json') &&
			(bridgeReuse?.progressReportHandoff?.statusMapping ?? []).some(
				(status) =>
					status.adapterState === 'report-ready' &&
					status.hostCue === 'ProgressBarStatus.None' &&
					status.reportCue?.includes('report/alpha-readiness.full.json')
			) &&
			bridgeReuse?.nativeVisualMatrix?.marker === 'native-visual-matrix' &&
			(bridgeReuse?.nativeVisualMatrix?.rows ?? []).includes('windows-mica-visual-row') &&
			(bridgeReuse?.nativeVisualMatrix?.rows ?? []).includes('macos-traffic-light-row') &&
			(bridgeReuse?.nativeVisualMatrix?.rows ?? []).includes('macos-vibrancy-visual-row') &&
			(bridgeReuse?.nativeVisualMatrix?.rows ?? []).includes('ultragear-theme-row') &&
			(bridgeReuse?.adapterCues ?? []).some((cue) => (cue.cues ?? []).includes('data-window-effect')) &&
			(bridgeReuse?.adapterCues ?? []).some((cue) => (cue.cues ?? []).includes('data-drag-start-threshold-px')) &&
			(bridgeReuse?.adapterCues ?? []).some((cue) => (cue.cues ?? []).includes('native-window-action')) &&
			(bridgeReuse?.adapterCues ?? []).some((cue) => (cue.cues ?? []).includes('__SVELTEKIT_PHP_NATIVE_HOST__')) &&
			(bridgeReuse?.adapterCues ?? []).some((cue) => (cue.cues ?? []).includes('browser-fallback')) &&
			(bridgeReuse?.adapterCues ?? []).some((cue) => (cue.cues ?? []).includes('data-native-host-bridge-status')) &&
			(bridgeReuse?.boundaries ?? []).some((boundary) => boundary.includes('Tauri APIs'))
			? ok(
					'bridge-reuse',
					'Bridge reuse inventory maps UltraGear patterns, native platform provenance, source cues, adapter implementation files, and boundaries.'
				)
			: fail(
					'bridge-reuse',
					'Bridge reuse inventory is missing source, native platform provenance, patterns, source cues, adapter cues, implementation files, or boundaries.'
				)
	);

	checks.push(
			gateMatrix?.target === report.target &&
			(gateMatrix?.requiredEvidence ?? []).includes('native-host-binding-guide') &&
			(gateMatrix?.requiredEvidence ?? []).includes('csr-disabled-prerender-contract') &&
			(gateMatrix?.requiredEvidence ?? []).includes('native-host-wrapper-smoke') &&
			(gateMatrix?.requiredEvidence ?? []).includes('windows-11-mica-browser-safe-shell') &&
			(gateMatrix?.requiredEvidence ?? []).includes('macos-style-native-titlebar-rhythm') &&
			(gateMatrix?.requiredEvidence ?? []).includes('alpha-readiness-report-graphics') &&
			(gateMatrix?.requiredEvidence ?? []).includes('community-keyword-search-graph') &&
			(gateMatrix?.requiredEvidence ?? []).includes('community-analytics-freshness-contract') &&
			(gateMatrix?.requiredEvidence ?? []).includes('hosted-php-smoke-proof') &&
			gateMatrix?.proofStages?.['release-policy-evidence-boundary'] &&
			gateMatrix?.proofStages?.['generated-from-source'] &&
			gateMatrix?.proofStages?.['collected-public-source-data'] &&
			gateMatrix?.proofStages?.['hosted-smoke-proof'] &&
			gateMatrix?.proofStages?.['live-runtime-surface-proof'] &&
			(gateMatrix?.gates ?? []).some((gate) => gate.id === 'local-alpha-gate' && gate.command === 'bun run alpha:gate') &&
			(gateMatrix?.gates ?? []).some((gate) => gate.id === 'hosted-alpha-gate' && gate.environment?.includes('ALPHA_SMOKE_BASE_URL')) &&
			(gateMatrix?.gates ?? []).some(
				(gate) =>
					gate.id === 'live-evidence-surfaces' &&
					gate.proofStage === 'live-runtime-surface-proof' &&
					(gate.requiredMarkers ?? []).includes('data-desktop-shell-ui-binding') &&
					(gate.requiredMarkers ?? []).includes('desktopShellUiBinding') &&
					(gate.requiredMarkers ?? []).includes('@scriptgpt/desktop-shell-ui') &&
					(gate.requiredMarkers ?? []).includes('installSvelteKitPhpNativeHost') &&
					(gate.requiredMarkers ?? []).includes('enableMicaWindowChrome') &&
					(gate.requiredMarkers ?? []).includes('syncTaskbarProgress') &&
					(gate.requiredMarkers ?? []).includes('toggleWindowMaximize') &&
					(gate.requiredMarkers ?? []).includes('data-drag-block-selector') &&
					(gate.requiredMarkers ?? []).includes('caption-button') &&
					(gate.requiredMarkers ?? []).includes('progressStatus') &&
					(gate.requiredMarkers ?? []).includes('indeterminate') &&
					(gate.requiredMarkers ?? []).includes('sourceToKeywordEdge') &&
					(gate.requiredMarkers ?? []).includes('analyticsLinkageMarker') &&
					(gate.requiredMarkers ?? []).includes('weightedDemandScore') &&
					(gate.requiredMarkers ?? []).includes('freshnessMaxAgeHours') &&
					(gate.requiredMarkers ?? []).includes('trustBoundary') &&
					(gate.requiredMarkers ?? []).includes('result-total-field-contract') &&
					(gate.requiredMarkers ?? []).includes('top-result-field-contract') &&
					(gate.requiredMarkers ?? []).includes('sample-review-rule') &&
					(gate.requiredMarkers ?? []).includes('resultTotalField') &&
					(gate.requiredMarkers ?? []).includes('topResultFields') &&
					(gate.requiredMarkers ?? []).includes('sampleReviewRule') &&
					(gate.requiredMarkers ?? []).includes('manualReviewRequired') &&
					(gate.requiredArtifacts ?? []).includes('report/alpha-bridge-reuse.json') &&
					(gate.requiredArtifacts ?? []).includes('report/alpha-evidence-index.json') &&
					(gate.requiredArtifacts ?? []).includes('report/alpha-hosted-smoke-checklist.json')
			) &&
			(gateMatrix?.gates ?? []).some(
				(gate) =>
					gate.id === 'report-bundle' &&
					gate.proofStage === 'generated-from-source' &&
					(gate.requiredMarkers ?? []).includes('data-desktop-shell-ui-binding') &&
					(gate.requiredMarkers ?? []).includes('desktopShellUiBinding') &&
					(gate.requiredMarkers ?? []).includes('@scriptgpt/desktop-shell-ui') &&
					(gate.requiredMarkers ?? []).includes('installSvelteKitPhpNativeHost') &&
					(gate.requiredMarkers ?? []).includes('enableMicaWindowChrome') &&
					(gate.requiredMarkers ?? []).includes('syncTaskbarProgress') &&
					(gate.requiredMarkers ?? []).includes('toggleWindowMaximize') &&
					(gate.requiredMarkers ?? []).includes('data-drag-block-selector') &&
					(gate.requiredMarkers ?? []).includes('caption-button') &&
					(gate.requiredMarkers ?? []).includes('progressStatus') &&
					(gate.requiredMarkers ?? []).includes('indeterminate') &&
					(gate.requiredMarkers ?? []).includes('sourceToKeywordEdge') &&
					(gate.requiredMarkers ?? []).includes('analyticsLinkageMarker') &&
					(gate.requiredMarkers ?? []).includes('weightedDemandScore') &&
					(gate.requiredMarkers ?? []).includes('freshnessMaxAgeHours') &&
					(gate.requiredMarkers ?? []).includes('trustBoundary') &&
					(gate.requiredMarkers ?? []).includes('result-total-field-contract') &&
					(gate.requiredMarkers ?? []).includes('top-result-field-contract') &&
					(gate.requiredMarkers ?? []).includes('sample-review-rule') &&
					(gate.requiredMarkers ?? []).includes('resultTotalField') &&
					(gate.requiredMarkers ?? []).includes('topResultFields') &&
					(gate.requiredMarkers ?? []).includes('sampleReviewRule') &&
					(gate.requiredMarkers ?? []).includes('manualReviewRequired') &&
					(gate.requiredArtifacts ?? []).includes('report/alpha-community-analytics.json') &&
					(gate.requiredArtifacts ?? []).includes('report/alpha-community-analytics.md') &&
					(gate.requiredArtifacts ?? []).includes('report/alpha-community-source-map.svg') &&
					(gate.requiredArtifacts ?? []).includes('report/alpha-community-research-pack.json') &&
					(gate.requiredArtifacts ?? []).includes('report/alpha-community-signals.csv') &&
					(gate.requiredArtifacts ?? []).includes('report/alpha-community-sources.csv') &&
					(gate.requiredArtifacts ?? []).includes('report/alpha-readiness.json') &&
					(gate.requiredArtifacts ?? []).includes('report/alpha-readiness.csv') &&
					(gate.requiredArtifacts ?? []).includes('report/alpha-readiness.md') &&
					(gate.requiredArtifacts ?? []).includes('report/alpha-readiness.html') &&
					(gate.requiredArtifacts ?? []).includes('report/alpha-readiness.svg') &&
					(gate.requiredArtifacts ?? []).includes('report/alpha-review-index.md') &&
					(gate.requiredArtifacts ?? []).includes('report/alpha-native-host-contract.json') &&
					(gate.requiredArtifacts ?? []).includes('report/alpha-bridge-reuse.json') &&
					(gate.requiredArtifacts ?? []).includes('report/alpha-evidence-index.json') &&
					(gate.requiredArtifacts ?? []).includes('report/alpha-hosted-smoke-checklist.json') &&
					(gate.requiredArtifacts ?? []).includes('report/alpha-package-contract.json') &&
					(gate.requiredArtifacts ?? []).includes('report/alpha-release-manifest.json') &&
					(gate.requiredArtifacts ?? []).includes('report/alpha-release-notes.md')
			) &&
			(gateMatrix?.gates ?? []).some(
				(gate) =>
					gate.id === 'required-alpha-evidence' &&
					gate.proofStage === 'release-policy-evidence-boundary' &&
					(gate.requiredEvidence ?? []).includes('native-host-binding-guide') &&
					(gate.requiredEvidence ?? []).includes('csr-disabled-prerender-contract') &&
					(gate.requiredEvidence ?? []).includes('native-host-wrapper-smoke') &&
					(gate.requiredEvidence ?? []).includes('windows-11-mica-browser-safe-shell') &&
					(gate.requiredEvidence ?? []).includes('macos-style-native-titlebar-rhythm') &&
					(gate.requiredEvidence ?? []).includes('alpha-readiness-report-graphics') &&
					(gate.requiredEvidence ?? []).includes('community-keyword-search-graph') &&
					(gate.requiredEvidence ?? []).includes('community-analytics-freshness-contract') &&
					(gate.requiredEvidence ?? []).includes('hosted-php-smoke-proof') &&
					(gate.requiredArtifacts ?? []).includes('report/alpha-readiness.json') &&
					(gate.requiredArtifacts ?? []).includes('report/alpha-readiness.svg') &&
					(gate.requiredArtifacts ?? []).includes('report/alpha-release-manifest.json') &&
					(gate.requiredArtifacts ?? []).includes('report/alpha-evidence-index.json') &&
					(gate.requiredArtifacts ?? []).includes('report/alpha-package-contract.json') &&
					(gate.requiredArtifacts ?? []).includes('report/alpha-hosted-smoke-checklist.json')
			) &&
			(gateMatrix?.runtimeEvidenceEndpoints ?? []).includes('/alpha-readiness/gate-matrix.json') &&
			(gateMatrix?.runtimeEvidenceEndpoints ?? []).includes('/alpha-readiness/evidence-index.json') &&
			(gateMatrix?.runtimeEvidenceEndpoints ?? []).includes('/alpha-readiness/package-contract.json') &&
			(gateMatrix?.runtimeEvidenceEndpoints ?? []).includes('/alpha-readiness/native-host-contract.json') &&
			(gateMatrix?.runtimeEvidenceEndpoints ?? []).includes('/alpha-readiness/hosted-smoke-checklist.json') &&
			(gateMatrix?.runtimeEvidenceEndpoints ?? []).includes('/alpha-readiness/community-analytics.md') &&
			(gateMatrix?.runtimeEvidenceEndpoints ?? []).includes('/alpha-readiness/community-source-map.svg') &&
			(gateMatrix?.runtimeEvidenceEndpoints ?? []).includes('/alpha-readiness/review-index.md') &&
			(gateMatrix?.runtimeEvidenceEndpoints ?? []).includes('/alpha-readiness/community-sources.csv') &&
			(gateMatrix?.completionBlockers ?? []).some((blocker) => blocker.includes('Generated report artifacts')) &&
			(gateMatrix?.completionBlockers ?? []).some((blocker) =>
				blocker.includes('Native platform provenance markers')
			) &&
			(gateMatrix?.completionBlockers ?? []).some((blocker) =>
				blocker.includes('Desktop shell helper binding markers')
			) &&
			(gateMatrix?.completionBlockers ?? []).some((blocker) => blocker.includes('Live evidence surface markers')) &&
			(gateMatrix?.completionBlockers ?? []).some((blocker) => blocker.includes('Required alpha evidence')) &&
			(gateMatrix?.completionBlockers ?? []).some((blocker) => blocker.includes('Community analytics')) &&
			(gateMatrix?.completionBlockers ?? []).some((blocker) => blocker.includes('ALPHA_SMOKE_BASE_URL'))
			? ok('gate-matrix', 'Gate matrix maps local/hosted commands, proof artifacts, endpoints, and completion blocker.')
			: fail('gate-matrix', 'Gate matrix is missing local/hosted gates, runtime endpoint inventory, or hosted completion blocker.')
	);

	checks.push(
		evidenceIndex?.target === report.target &&
			evidenceIndex?.trustModel?.runtimeEndpoints &&
			evidenceIndex?.trustModel?.generatedArtifacts &&
			evidenceIndex?.trustModel?.collectedArtifacts &&
			evidenceIndex?.trustModel?.hostedArtifacts &&
			(evidenceIndex?.liveEvidenceSurfaces ?? []).some(
				(surface) =>
					surface.id === 'native-host-bridge-status' &&
					(surface.markers ?? []).includes('data-native-host-bridge-status') &&
					(surface.markers ?? []).includes('window.__SVELTEKIT_PHP_NATIVE_HOST__')
			) &&
			(evidenceIndex?.liveEvidenceSurfaces ?? []).some(
				(surface) =>
					surface.id === 'native-visual-matrix' &&
					(surface.markers ?? []).includes('data-native-visual-matrix') &&
					(surface.markers ?? []).includes('native-visual-matrix') &&
					(surface.markers ?? []).includes('windows-mica-visual-row') &&
					(surface.markers ?? []).includes('macos-traffic-light-row') &&
					(surface.markers ?? []).includes('windows-caption-control-row') &&
					(surface.markers ?? []).includes('ultragear-theme-row') &&
					(surface.markers ?? []).includes('browser-fallback-visual-row')
			) &&
			(evidenceIndex?.liveEvidenceSurfaces ?? []).some(
				(surface) =>
					surface.id === 'ultragear-source-parity' &&
					(surface.markers ?? []).includes('ultraGearParityContract') &&
					(surface.markers ?? []).includes('@scriptgpt/desktop-shell-ui') &&
					(surface.markers ?? []).includes('desktopShellUiBinding') &&
					(surface.markers ?? []).includes('enableMicaWindowChrome') &&
					(surface.markers ?? []).includes('syncTaskbarProgress') &&
					(surface.markers ?? []).includes('toggleWindowMaximize') &&
					(surface.markers ?? []).includes('applyWindowChrome') &&
					(surface.markers ?? []).includes('DRAG_START_THRESHOLD_PX')
			) &&
			(evidenceIndex?.liveEvidenceSurfaces ?? []).some(
				(surface) =>
					surface.id === 'community-evidence-coverage-ledger' &&
					(surface.markers ?? []).includes('Community evidence coverage ledger') &&
					(surface.markers ?? []).includes('Open-source analytics sources reviewers can audit first')
			) &&
			(evidenceIndex?.liveEvidenceSurfaces ?? []).some(
				(surface) =>
					surface.id === 'community-keyword-search-graph' &&
					(surface.markers ?? []).includes('keywordSearchGraph') &&
					(surface.markers ?? []).includes('keyword-search-graph') &&
					(surface.markers ?? []).includes('source-to-keyword-edge')
			) &&
			(evidenceIndex?.liveEvidenceSurfaces ?? []).some(
				(surface) =>
					surface.id === 'progress-report-handoff' &&
					(surface.markers ?? []).includes('progressReportHandoff') &&
					(surface.markers ?? []).includes('syncTaskbarProgress') &&
					(surface.markers ?? []).includes('syncWindowProgress') &&
					(surface.markers ?? []).includes('ProgressBarStatus.Indeterminate')
			) &&
			(evidenceIndex?.liveEvidenceSurfaces ?? []).some(
				(surface) =>
					surface.id === 'progress-report-graphic' &&
					(surface.markers ?? []).includes('progressReportHandoff') &&
					(surface.markers ?? []).includes('statusMapping') &&
					(surface.markers ?? []).includes('ProgressBarStatus.None') &&
					(surface.markers ?? []).includes('report-ready') &&
					surface.route === '/alpha-readiness/report.svg'
			) &&
			(evidenceIndex?.endpoints ?? []).some((endpoint) => endpoint.path === '/alpha-readiness/report.svg' && endpoint.mediaType === 'image/svg+xml') &&
			(evidenceIndex?.endpoints ?? []).some((endpoint) => endpoint.path === '/alpha-readiness/community-source-map.svg' && endpoint.artifact === 'report/alpha-community-source-map.svg') &&
			(evidenceIndex?.endpoints ?? []).some((endpoint) => endpoint.path === '/alpha-readiness/review-index.md' && endpoint.artifact === 'report/alpha-review-index.md') &&
			(evidenceIndex?.endpoints ?? []).some((endpoint) => endpoint.path === '/alpha-readiness/evidence-index.json') &&
			(evidenceIndex?.endpoints ?? []).some((endpoint) => endpoint.path === '/alpha-readiness/community-analytics.md' && endpoint.artifact === 'report/alpha-community-analytics.md') &&
			(evidenceIndex?.endpoints ?? []).some((endpoint) => endpoint.path === '/alpha-readiness/community-sources.csv' && endpoint.artifact === 'report/alpha-community-sources.csv') &&
			(evidenceIndex?.endpoints ?? []).some((endpoint) => endpoint.path === '/alpha-readiness/native-host-contract.json' && endpoint.artifact === 'report/alpha-native-host-contract.json') &&
			(evidenceIndex?.endpoints ?? []).some((endpoint) => endpoint.path === '/alpha-readiness/package-contract.json' && endpoint.artifact === 'report/alpha-package-contract.json') &&
			(evidenceIndex?.requiredEvidence ?? []).includes('native-host-binding-guide') &&
			(evidenceIndex?.requiredEvidence ?? []).includes('csr-disabled-prerender-contract') &&
			(evidenceIndex?.requiredEvidence ?? []).includes('native-host-wrapper-smoke') &&
			(evidenceIndex?.requiredEvidence ?? []).includes('windows-11-mica-browser-safe-shell') &&
			(evidenceIndex?.requiredEvidence ?? []).includes('macos-style-native-titlebar-rhythm') &&
			(evidenceIndex?.requiredEvidence ?? []).includes('alpha-readiness-report-graphics') &&
			(evidenceIndex?.requiredEvidence ?? []).includes('community-keyword-search-graph') &&
			(evidenceIndex?.requiredEvidence ?? []).includes('community-analytics-freshness-contract') &&
			(evidenceIndex?.requiredEvidence ?? []).includes('hosted-php-smoke-proof') &&
			(evidenceIndex?.liveEvidenceSurfaces ?? []).some(
				(surface) =>
					surface.id === 'required-alpha-evidence' &&
					(surface.markers ?? []).includes('requiredEvidence') &&
					(surface.markers ?? []).includes('native-host-binding-guide') &&
					(surface.markers ?? []).includes('csr-disabled-prerender-contract') &&
					(surface.markers ?? []).includes('native-host-wrapper-smoke') &&
					(surface.markers ?? []).includes('windows-11-mica-browser-safe-shell') &&
					(surface.markers ?? []).includes('macos-style-native-titlebar-rhythm') &&
					(surface.markers ?? []).includes('alpha-readiness-report-graphics') &&
					(surface.markers ?? []).includes('community-keyword-search-graph') &&
					(surface.markers ?? []).includes('community-analytics-freshness-contract') &&
					(surface.markers ?? []).includes('hosted-php-smoke-proof')
			) &&
			(evidenceIndex?.generatedOnlyArtifacts ?? []).some(
				(artifact) =>
					artifact.path === 'report/alpha-community-analytics.json' &&
					artifact.proofStage === 'collected-public-source-data' &&
					artifact.trustLevel === 'directional-community-signal'
			) &&
			(evidenceIndex?.generatedOnlyArtifacts ?? []).some(
				(artifact) =>
					artifact.path === 'report/alpha-remote-smoke.json' &&
					artifact.proofStage === 'hosted-smoke-or-placeholder' &&
					artifact.trustLevel === 'requires-alpha-smoke-base-url-for-pass-evidence'
			) &&
			(evidenceIndex?.qualityBar ?? []).some((item) => item.includes('generated artifact')) &&
			(evidenceIndex?.qualityBar ?? []).some((item) => item.includes('Alpha-over-RC policy')) &&
			(evidenceIndex?.qualityBar ?? []).some((item) => item.includes('Desktop shell helper mappings')) &&
			(evidenceIndex?.qualityBar ?? []).some((item) => item.includes('Live evidence surfaces')) &&
			(evidenceIndex?.qualityBar ?? []).some((item) => item.includes('UltraGear source parity')) &&
			(evidenceIndex?.qualityBar ?? []).some((item) => item.includes('Native visual matrix')) &&
			(evidenceIndex?.qualityBar ?? []).some((item) => item.includes('Keyword search graph')) &&
			(evidenceIndex?.qualityBar ?? []).some((item) => item.includes('Progress/report handoff')) &&
			(evidenceIndex?.qualityBar ?? []).some((item) => item.includes('Progress/report graphic proof')) &&
			(evidenceIndex?.qualityBar ?? []).some((item) => item.includes('Community analytics')) &&
			(evidenceIndex?.qualityBar ?? []).some((item) => item.includes('Required alpha evidence')) &&
			(evidenceIndex?.qualityBar ?? []).some((item) => item.includes('ALPHA_SMOKE_BASE_URL'))
			? ok('evidence-index', 'Evidence index maps endpoints, media types, generated artifacts, and hosted proof blocker.')
			: fail('evidence-index', 'Evidence index is missing endpoint inventory, generated artifacts, or hosted proof blocker.')
	);

	checks.push(
			packageContract?.target === report.target &&
			packageContract?.packageName === 'sveltekit-php' &&
			packageJson?.publishConfig?.tag === 'alpha' &&
			packageJson?.sveltekitPhpReleasePolicy?.marker === 'alpha-over-rc-release-policy' &&
			packageJson?.sveltekitPhpReleasePolicy?.rank === 'above-rc' &&
			(report?.releasePolicy?.requiredEvidence ?? []).includes('native-host-binding-guide') &&
			(report?.releasePolicy?.requiredEvidence ?? []).includes('csr-disabled-prerender-contract') &&
			(report?.releasePolicy?.requiredEvidence ?? []).includes('desktop-shell-ui-command-mapping') &&
			(report?.releasePolicy?.requiredEvidence ?? []).includes('native-host-wrapper-smoke') &&
			(report?.releasePolicy?.requiredEvidence ?? []).includes('community-analytics-csv-linkage') &&
			(report?.releasePolicy?.requiredEvidence ?? []).includes('router-path-safety-artifact-sync') &&
			(report?.releasePolicy?.requiredEvidence ?? []).includes('adapter-platform-emulation') &&
			(report?.releasePolicy?.requiredEvidence ?? []).includes('deploy-env-preflight-safety') &&
			(report?.releasePolicy?.requiredEvidence ?? []).includes('community-analytics-freshness-contract') &&
			(report?.releasePolicy?.requiredEvidence ?? []).includes('hosted-php-smoke-proof') &&
			(packageJson?.sveltekitPhpReleasePolicy?.requiredEvidence ?? []).includes('native-host-binding-guide') &&
			(packageJson?.sveltekitPhpReleasePolicy?.requiredEvidence ?? []).includes('csr-disabled-prerender-contract') &&
			(packageJson?.sveltekitPhpReleasePolicy?.requiredEvidence ?? []).includes('native-host-wrapper-smoke') &&
			(packageJson?.sveltekitPhpReleasePolicy?.requiredEvidence ?? []).includes('windows-11-mica-browser-safe-shell') &&
			(packageJson?.sveltekitPhpReleasePolicy?.requiredEvidence ?? []).includes('macos-style-native-titlebar-rhythm') &&
			(packageJson?.sveltekitPhpReleasePolicy?.requiredEvidence ?? []).includes('alpha-readiness-report-graphics') &&
			(packageJson?.sveltekitPhpReleasePolicy?.requiredEvidence ?? []).includes('community-keyword-search-graph') &&
			(packageJson?.sveltekitPhpReleasePolicy?.requiredEvidence ?? []).includes('community-analytics-freshness-contract') &&
			(packageJson?.sveltekitPhpReleasePolicy?.requiredEvidence ?? []).includes('community-analytics-csv-linkage') &&
			(packageJson?.sveltekitPhpReleasePolicy?.requiredEvidence ?? []).includes('router-path-safety-artifact-sync') &&
			(packageJson?.sveltekitPhpReleasePolicy?.requiredEvidence ?? []).includes('adapter-platform-emulation') &&
			(packageJson?.sveltekitPhpReleasePolicy?.requiredEvidence ?? []).includes('deploy-env-preflight-safety') &&
			(packageJson?.sveltekitPhpReleasePolicy?.requiredEvidence ?? []).includes('hosted-php-smoke-proof') &&
			(packageJson?.files ?? []).includes('docs/ALPHA-RELEASE-CHECKLIST.md') &&
			(packageJson?.sveltekitPhpReleasePolicy?.disallowedDistTags ?? []).includes('latest') &&
			packageContract?.publishShape?.publishConfig?.tag === 'alpha' &&
			packageContract?.publishShape?.releasePolicy?.marker === 'alpha-over-rc-release-policy' &&
			packageContract?.publishShape?.releasePolicy?.rank === 'above-rc' &&
			packageContract?.publishShape?.releasePolicy?.projectRankPolicy?.includes('above any RC') &&
			packageContract?.alphaOverRcPolicyProof?.projectRankPolicy === 'above-rc' &&
			(packageContract?.alphaOverRcPolicyProof?.mustNotUseCandidateLabels ?? []).includes('rc') &&
			(packageContract?.requiredEvidence ?? []).includes('native-host-binding-guide') &&
			(packageContract?.requiredEvidence ?? []).includes('csr-disabled-prerender-contract') &&
			(packageContract?.requiredEvidence ?? []).includes('native-host-wrapper-smoke') &&
			(packageContract?.requiredEvidence ?? []).includes('windows-11-mica-browser-safe-shell') &&
			(packageContract?.requiredEvidence ?? []).includes('macos-style-native-titlebar-rhythm') &&
			(packageContract?.requiredEvidence ?? []).includes('alpha-readiness-report-graphics') &&
			(packageContract?.requiredEvidence ?? []).includes('community-keyword-search-graph') &&
			(packageContract?.requiredEvidence ?? []).includes('community-analytics-freshness-contract') &&
			(packageContract?.requiredEvidence ?? []).includes('community-analytics-csv-linkage') &&
			(packageContract?.requiredEvidence ?? []).includes('router-path-safety-artifact-sync') &&
			(packageContract?.requiredEvidence ?? []).includes('adapter-platform-emulation') &&
			(packageContract?.requiredEvidence ?? []).includes('deploy-env-preflight-safety') &&
			(packageContract?.requiredEvidence ?? []).includes('hosted-php-smoke-proof') &&
			(packageContract?.publishShape?.files ?? []).includes('docs/ALPHA-RELEASE-CHECKLIST.md') &&
			(packageContract?.publishShape?.releasePolicy?.requiredEvidence ?? []).includes('native-host-binding-guide') &&
			(packageContract?.publishShape?.releasePolicy?.requiredEvidence ?? []).includes('csr-disabled-prerender-contract') &&
			(packageContract?.publishShape?.releasePolicy?.requiredEvidence ?? []).includes('native-host-wrapper-smoke') &&
			(packageContract?.publishShape?.releasePolicy?.requiredEvidence ?? []).includes('community-analytics-freshness-contract') &&
			(packageContract?.publishShape?.releasePolicy?.requiredEvidence ?? []).includes('adapter-platform-emulation') &&
			(packageContract?.publishShape?.releasePolicy?.requiredEvidence ?? []).includes('hosted-php-smoke-proof') &&
			packageContract?.publishShape?.exports?.['./adapter'] === './adapter/index.js' &&
			packageContract?.consumerProof?.command === 'bun run alpha:consumer:smoke' &&
			packageContract?.consumerProof?.proofStage === 'package-consumer-proof' &&
			packageContract?.adapterPlatformEmulationProof?.marker === 'adapter-platform-emulation' &&
			(packageContract?.adapterPlatformEmulationProof?.markers ?? []).includes('event.platform.php') &&
			packageContract?.releasePrepProof?.proofStage === 'package-safety-proof' &&
			packageContract?.artifactSyncProof?.command === 'bun run verify:artifacts -- --strict' &&
			packageContract?.artifactSyncProof?.trustLevel === 'source-to-generated-bundle-check' &&
			packageContract?.deploySafetyProof?.command === 'bun run precheck:deploy' &&
			packageContract?.deploySafetyProof?.trustLevel === 'environment-preflight-check' &&
			packageContract?.reportEvidenceBoundary?.trustLevel === 'release-evidence-not-package-api' &&
			packageContract?.nativePlatformProvenanceProof?.trustLevel ===
				'lg-ultragear-native-platform-provenance' &&
			(packageContract?.nativePlatformProvenanceProof?.markers ?? []).includes('Effect.Mica') &&
			(packageContract?.nativePlatformProvenanceProof?.markers ?? []).includes(
				'@scriptgpt/desktop-shell-ui'
			) &&
			(packageContract?.nativePlatformProvenanceProof?.markers ?? []).includes('desktopShellUiBinding') &&
			(packageContract?.nativePlatformProvenanceProof?.markers ?? []).includes('enableMicaWindowChrome') &&
			(packageContract?.nativePlatformProvenanceProof?.markers ?? []).includes('syncTaskbarProgress') &&
			(packageContract?.nativePlatformProvenanceProof?.markers ?? []).includes('toggleWindowMaximize') &&
			(packageContract?.nativePlatformProvenanceProof?.markers ?? []).includes('bindColorSchemeWatcher') &&
			(packageContract?.nativePlatformProvenanceProof?.markers ?? []).includes('prefersDarkMode') &&
			(packageContract?.nativePlatformProvenanceProof?.markers ?? []).includes('window.matchMedia("(prefers-color-scheme: dark)")') &&
			(packageContract?.nativePlatformProvenanceProof?.markers ?? []).includes(
				'win.startDragging'
			) &&
			(packageContract?.nativePlatformProvenanceProof?.markers ?? []).includes(
				'app-window.maximized'
			) &&
			(packageContract?.nativePlatformProvenanceProof?.markers ?? []).includes(
				'setPointerCapture'
			) &&
			(packageContract?.nativePlatformProvenanceProof?.markers ?? []).includes('reportJson') &&
			packageContract?.nativeHostWrapperSmokeProof?.trustLevel === 'deterministic-host-wrapper-handoff' &&
			packageContract?.nativeHostWrapperSmokeProof?.source === 'src/lib/alpha-native-host-wrapper-smoke.ts' &&
			packageContract?.nativeHostWrapperSmokeProof?.runtimeSource === 'src/lib/native-shell/native-host-event-bridge.ts' &&
			packageContract?.nativeHostWrapperSmokeProof?.contractEndpoint === '/alpha-readiness/native-host-contract.json' &&
			packageContract?.nativeHostWrapperSmokeProof?.realHostVerified === false &&
			packageContract?.nativeHostWrapperSmokeProof?.noNativeApiBoundary?.tauriImportsAllowed === false &&
			packageContract?.nativeHostWrapperSmokeProof?.noNativeApiBoundary?.nativeWindowCallsAllowed === false &&
			packageContract?.nativeHostWrapperSmokeProof?.noNativeApiBoundary?.adapterRuntimeNativeImportsAllowed === false &&
			(packageContract?.nativeHostWrapperSmokeProof?.markers ?? []).includes('deterministic-host-wrapper-handoff') &&
			(packageContract?.nativeHostWrapperSmokeProof?.markers ?? []).includes('native-host-wrapper-event-replay') &&
			(packageContract?.nativeHostWrapperSmokeProof?.markers ?? []).includes('native-host-wrapper-event-replay-step') &&
			(packageContract?.nativeHostWrapperSmokeProof?.markers ?? []).includes('noNativeApiBoundary') &&
			(packageContract?.nativeHostWrapperSmokeProof?.markers ?? []).includes('window.__SVELTEKIT_PHP_NATIVE_HOST__') &&
			(packageContract?.nativeHostWrapperSmokeProof?.markers ?? []).includes('window.__SVELTEKIT_PHP_NATIVE_HOST_HISTORY__') &&
			(packageContract?.nativeHostWrapperSmokeProof?.markers ?? []).includes('expectedHistoryResult') &&
			(packageContract?.nativeHostWrapperSmokeProof?.markers ?? []).includes('expectedDesktopShellUiHelper') &&
			(packageContract?.nativeHostWrapperSmokeProof?.markers ?? []).includes('noFallbackAllowedForRealHost') &&
			(packageContract?.nativeHostWrapperSmokeProof?.markers ?? []).includes('TaskbarProgressState') &&
			(packageContract?.nativeHostWrapperSmokeProof?.reportVisibility ?? []).includes('/alpha-readiness/release-notes.md') &&
			(packageContract?.boundaries ?? []).some((boundary) => boundary.includes('adapter-focused'))
			? ok(
					'package-contract',
					'Package contract documents adapter export shape, consumer smoke, artifact sync, deploy safety, native provenance, wrapper-smoke boundary, and package boundary.'
				)
			: fail(
					'package-contract',
					'Package contract is missing export shape, consumer smoke, artifact sync, deploy safety, native provenance, wrapper-smoke boundary, or package boundary.'
				)
	);

	checks.push(
			nativeHostContract?.target === report.target &&
			nativeHostContract?.adapterBoundary?.tauriImportsAllowed === false &&
			(nativeHostContract?.requiredDomMarkers ?? []).some((marker) => marker.marker === 'data-native-shell-theme') &&
			nativeHostContract?.desktopShellUiBinding?.marker === 'desktopShellUiBinding' &&
			nativeHostContract?.desktopShellUiBinding?.packageName === '@scriptgpt/desktop-shell-ui' &&
			nativeHostContract?.desktopShellUiBinding?.sourcePackage?.includes('packages/desktop-shell-ui/src/index.ts') &&
			(nativeHostContract?.desktopShellUiBinding?.requiredImports ?? []).includes('enableMicaWindowChrome') &&
			(nativeHostContract?.desktopShellUiBinding?.requiredImports ?? []).includes('syncTaskbarProgress') &&
			(nativeHostContract?.desktopShellUiBinding?.requiredImports ?? []).includes('toggleWindowMaximize') &&
			(nativeHostContract?.desktopShellUiBinding?.requiredImports ?? []).includes('bindColorSchemeWatcher') &&
			(nativeHostContract?.desktopShellUiBinding?.requiredImports ?? []).includes('prefersDarkMode') &&
			(nativeHostContract?.desktopShellUiBinding?.systemAppearanceBinding?.helpers ?? []).includes('bindColorSchemeWatcher') &&
			(nativeHostContract?.desktopShellUiBinding?.systemAppearanceBinding?.helpers ?? []).includes('prefersDarkMode') &&
			nativeHostContract?.desktopShellUiBinding?.systemAppearanceBinding?.browserApi ===
				'window.matchMedia("(prefers-color-scheme: dark)")' &&
			nativeHostContract?.desktopShellUiBinding?.upstreamWidgetSource ===
				'packages/ultragear-widget-ui/src/app.ts' &&
			nativeHostContract?.desktopShellUiBinding?.controllerBinding?.installer === 'installSvelteKitPhpNativeHost' &&
			(nativeHostContract?.desktopShellUiBinding?.controllerBinding?.handlers ?? []).some(
				(handler) =>
					handler.action === 'start-dragging' &&
					handler.ultraGearImplementation === 'win.startDragging()' &&
					handler.nativeHostBridgeMapping?.includes('getDesktopShellUiCommandMapping')
			) &&
			(nativeHostContract?.desktopShellUiBinding?.controllerBinding?.handlers ?? []).some(
				(handler) =>
					handler.action === 'report-ready' &&
					handler.ultraGearImplementation?.includes('host.reportReady') &&
					handler.detailFields?.includes('reportHref')
			) &&
			(nativeHostContract?.requiredDomMarkers ?? []).some((marker) => marker.marker === 'data-native-window-frame') &&
			(nativeHostContract?.requiredDomMarkers ?? []).some((marker) => marker.marker === 'data-native-titlebar') &&
			(nativeHostContract?.requiredDomMarkers ?? []).some((marker) => marker.marker === 'data-native-platform') &&
			(nativeHostContract?.requiredDomMarkers ?? []).some((marker) => marker.marker === 'data-macos-chrome') &&
			(nativeHostContract?.requiredDomMarkers ?? []).some((marker) => marker.marker === 'data-window-drag') &&
			(nativeHostContract?.requiredDomMarkers ?? []).some((marker) => marker.marker === 'data-no-window-drag') &&
			(nativeHostContract?.requiredDomMarkers ?? []).some((marker) => marker.marker === 'data-window-control') &&
			(nativeHostContract?.requiredDomMarkers ?? []).some((marker) => marker.marker === 'data-native-host-bridge-status') &&
			(nativeHostContract?.visualSnapshotContract?.requiredMarkers ?? []).includes('Windows 11 Mica') &&
			(nativeHostContract?.visualSnapshotContract?.requiredMarkers ?? []).includes('macOS traffic lights') &&
			(nativeHostContract?.visualSnapshotContract?.requiredMarkers ?? []).includes('macOS vibrancy host policy') &&
			(nativeHostContract?.visualSnapshotContract?.requiredMarkers ?? []).includes('macos-vibrancy-visual-row') &&
			(nativeHostContract?.visualSnapshotContract?.requiredMarkers ?? []).includes('native-window-action') &&
			nativeHostContract?.macosMaterialPolicy?.marker === 'macos-vibrancy-host-policy' &&
			nativeHostContract?.macosMaterialPolicy?.hostPermission === 'core:window:allow-set-effects' &&
			(nativeHostContract?.macosMaterialPolicy?.adapterMarkers ?? []).includes('macos-vibrancy-visual-row') &&
			nativeHostContract?.nativeVisualMatrix?.marker === 'native-visual-matrix' &&
			nativeHostContract?.nativeVisualMatrix?.proofStage === 'browser-safe-native-visual-contract' &&
			nativeHostContract?.nativeVisualMatrix?.trustLevel === 'deterministic-runtime-evidence' &&
			(nativeHostContract?.nativeVisualMatrix?.rows ?? []).some(
				(row) =>
					row.id === 'windows-mica-visual-row' &&
					(row.adapterMarkers ?? []).some((marker) => marker.includes('data-window-effect')) &&
					(row.adapterMarkers ?? []).some((marker) => marker.includes('data-native-platform'))
			) &&
			(nativeHostContract?.nativeVisualMatrix?.rows ?? []).some(
				(row) =>
					row.id === 'macos-traffic-light-row' &&
					(row.adapterMarkers ?? []).some((marker) => marker.includes('data-native-platform')) &&
					(row.adapterMarkers ?? []).some((marker) => marker.includes('data-window-control'))
			) &&
			(nativeHostContract?.nativeVisualMatrix?.rows ?? []).some(
				(row) =>
					row.id === 'macos-vibrancy-visual-row' &&
					(row.adapterMarkers ?? []).includes('macos-vibrancy-host-policy') &&
					(row.adapterMarkers ?? []).includes('data-macos-chrome')
			) &&
			(nativeHostContract?.nativeVisualMatrix?.rows ?? []).some((row) => row.id === 'windows-caption-control-row') &&
			(nativeHostContract?.nativeVisualMatrix?.rows ?? []).some((row) => row.id === 'ultragear-theme-row') &&
			(nativeHostContract?.nativeVisualMatrix?.rows ?? []).some((row) => row.id === 'browser-fallback-visual-row') &&
			(nativeHostContract?.ultraGearSourceParity?.requiredSourceCues ?? []).includes('applyWindowChrome') &&
			(nativeHostContract?.ultraGearSourceParity?.requiredSourceCues ?? []).includes('enableMicaWindowChrome') &&
			(nativeHostContract?.ultraGearSourceParity?.requiredSourceCues ?? []).includes('core:window:allow-set-effects') &&
			(nativeHostContract?.ultraGearSourceParity?.requiredSourceCues ?? []).includes('macos-vibrancy-host-policy') &&
			(nativeHostContract?.ultraGearSourceParity?.requiredSourceCues ?? []).includes('syncTaskbarProgress') &&
			(nativeHostContract?.ultraGearSourceParity?.requiredSourceCues ?? []).includes('toggleWindowMaximize') &&
			(nativeHostContract?.ultraGearSourceParity?.requiredSourceCues ?? []).includes('syncWindowProgress') &&
			(nativeHostContract?.ultraGearSourceParity?.requiredSourceCues ?? []).includes('DRAG_START_THRESHOLD_PX') &&
			(nativeHostContract?.ultraGearSourceParity?.requiredSourceCues ?? []).includes('Structured report preview') &&
			(nativeHostContract?.progressReportHandoff?.hostOwnedCues ?? []).includes('syncWindowProgress') &&
			(nativeHostContract?.progressReportHandoff?.hostOwnedCues ?? []).includes('ProgressBarStatus.Indeterminate') &&
			(nativeHostContract?.progressReportHandoff?.adapterEvidence ?? []).includes('/alpha-readiness/report.json') &&
			(nativeHostContract?.progressReportHandoff?.statusMapping ?? []).some(
				(status) =>
					status.adapterState === 'report-ready' &&
					status.hostCue === 'ProgressBarStatus.None' &&
					status.reportCue?.includes('/alpha-readiness/report.json')
			) &&
			(nativeHostContract?.nativeShellThemes ?? []).some((theme) => theme.name === 'theme-ultragear') &&
			(nativeHostContract?.hostEvents ?? []).some(
				(event) =>
					event.event === 'native-window-action' &&
					event.bridge === 'src/lib/native-shell/native-host-event-bridge.ts' &&
					(event.actions ?? []).includes('start-dragging') &&
					(event.actions ?? []).includes('toggle-maximize')
			) &&
			nativeHostContract?.hostRuntimeBridge?.globalController === 'window.__SVELTEKIT_PHP_NATIVE_HOST__' &&
			nativeHostContract?.hostRuntimeBridge?.globalHistory === 'window.__SVELTEKIT_PHP_NATIVE_HOST_HISTORY__' &&
			(nativeHostContract?.hostRuntimeBridge?.handlers ?? []).includes('startDragging') &&
			(nativeHostContract?.hostRuntimeBridge?.handlers ?? []).includes('toggleMaximize') &&
			(nativeHostContract?.hostRuntimeBridge?.resultModes ?? []).includes('browser-fallback') &&
			(nativeHostContract?.hostResponsibilities ?? []).some((item) => item.capability?.includes('Windows 11 Mica')) &&
			(nativeHostContract?.hostResponsibilities ?? []).some((item) => item.capability?.includes('Caption controls')) &&
			(nativeHostContract?.hostResponsibilities ?? []).some((item) => item.capability?.includes('macOS traffic-light')) &&
			(nativeHostContract?.hostResponsibilities ?? []).some((item) => item.capability?.includes('macOS vibrancy')) &&
			(nativeHostContract?.reportEvidence ?? []).includes('/alpha-readiness/community-source-map.svg')
			? ok('native-host-contract', 'Native host contract documents Mica/macOS seams, DOM markers, report handoff, and no-Tauri boundary.')
			: fail('native-host-contract', 'Native host contract is missing native seams, DOM markers, report handoff, or no-Tauri boundary.')
	);

	checks.push(
		nativeHostWrapperSmoke?.target === report.target &&
			nativeHostWrapperSmoke?.marker === 'native-host-wrapper-smoke' &&
			nativeHostWrapperSmoke?.status === 'contract-ready' &&
			nativeHostWrapperSmoke?.realHostVerified === false &&
			nativeHostWrapperSmoke?.trustLevel === 'deterministic-host-wrapper-handoff' &&
			nativeHostWrapperSmoke?.source === 'src/lib/native-shell/native-host-event-bridge.ts' &&
			nativeHostWrapperSmoke?.contractEndpoint === '/alpha-readiness/native-host-contract.json' &&
			nativeHostWrapperSmoke?.runtimeEndpoint === '/alpha-readiness/native-host-wrapper-smoke.json' &&
			nativeHostWrapperSmoke?.artifact === 'report/alpha-native-host-wrapper-smoke.json' &&
			nativeHostWrapperSmoke?.noNativeApiBoundary?.tauriImportsAllowed === false &&
			nativeHostWrapperSmoke?.noNativeApiBoundary?.nativeWindowCallsAllowed === false &&
			nativeHostWrapperSmoke?.eventReplayContract?.marker === 'native-host-wrapper-event-replay' &&
			nativeHostWrapperSmoke?.eventReplayContract?.eventName === 'native-window-action' &&
			nativeHostWrapperSmoke?.eventReplayContract?.expectedMode === 'native-host' &&
			nativeHostWrapperSmoke?.eventReplayContract?.expectedHandled === true &&
			nativeHostWrapperSmoke?.eventReplayContract?.noFallbackAllowedForRealHost === true &&
			(nativeHostWrapperSmoke?.eventReplayContract?.requiredResultFields ?? []).includes('desktopShellUiHelper') &&
			(nativeHostWrapperSmoke?.eventReplayContract?.requiredResultFields ?? []).includes('desktopShellUiEvidence') &&
			(nativeHostWrapperSmoke?.summary?.requiredActions ?? []).includes('set-window-effect') &&
			(nativeHostWrapperSmoke?.summary?.requiredActions ?? []).includes('start-dragging') &&
			(nativeHostWrapperSmoke?.summary?.requiredActions ?? []).includes('toggle-maximize') &&
			(nativeHostWrapperSmoke?.summary?.requiredActions ?? []).includes('set-progress') &&
			(nativeHostWrapperSmoke?.summary?.requiredActions ?? []).includes('clear-progress') &&
			(nativeHostWrapperSmoke?.summary?.requiredActions ?? []).includes('report-ready') &&
			(nativeHostWrapperSmoke?.summary?.requiredHelpers ?? []).includes('enableMicaWindowChrome') &&
			(nativeHostWrapperSmoke?.summary?.requiredHelpers ?? []).includes('syncTaskbarProgress') &&
			(nativeHostWrapperSmoke?.summary?.requiredHelpers ?? []).includes('toggleWindowMaximize') &&
			nativeHostWrapperSmoke?.summary?.missingActions?.length === 0 &&
			nativeHostWrapperSmoke?.summary?.missingMappings?.length === 0 &&
			nativeHostWrapperSmoke?.summary?.failedProgressExpectations?.length === 0 &&
			nativeHostWrapperSmoke?.summary?.eventReplayExpectationCount ===
				(nativeHostWrapperSmoke?.eventReplayTranscript ?? []).length &&
			(nativeHostWrapperSmoke?.eventReplayTranscript ?? []).some(
				(entry) =>
					entry.marker === 'native-host-wrapper-event-replay-step' &&
					entry.action === 'set-window-effect' &&
					entry.expectedHistoryResult?.handled === true &&
					entry.expectedHistoryResult?.mode === 'native-host' &&
					entry.expectedDesktopShellUiHelper === 'enableMicaWindowChrome'
			) &&
			(nativeHostWrapperSmoke?.eventReplayTranscript ?? []).some(
				(entry) =>
					entry.action === 'set-progress' &&
					entry.expectedHistoryResult?.desktopShellUiHelper === 'syncTaskbarProgress' &&
					entry.expectedTaskbarState?.saveInFlight === true
			) &&
			(nativeHostWrapperSmoke?.eventReplayTranscript ?? []).some(
				(entry) =>
					entry.action === 'report-ready' &&
					entry.expectedHistoryResult?.desktopShellUiHelper === 'host.reportReady'
			) &&
			(nativeHostWrapperSmoke?.progressExpectations ?? []).some(
				(expectation) =>
					expectation.progressStatus === 'indeterminate' &&
					expectation.expectedTaskbarState?.saveInFlight === true
			) &&
			(nativeHostWrapperSmoke?.progressExpectations ?? []).some(
				(expectation) =>
					expectation.progressStatus === 'normal' &&
					expectation.expectedTaskbarState?.hasQueuedSave === true
			) &&
			(nativeHostWrapperSmoke?.wrapperSmokeInstructions ?? []).some((instruction) =>
				instruction.includes('window.__SVELTEKIT_PHP_NATIVE_HOST__')
			)
			? ok('native-host-wrapper-smoke', 'Native host wrapper smoke artifact proves deterministic helper mapping and preserves the real-host boundary.')
			: fail('native-host-wrapper-smoke', 'Native host wrapper smoke artifact is missing deterministic helper mapping or real-host boundary markers.')
	);

	checks.push(
		hostedSmokeChecklist?.target === report.target &&
			hostedSmokeChecklist?.status === 'requires-external-host' &&
			(hostedSmokeChecklist?.requiredEnvironment ?? []).some((env) => env.name === 'ALPHA_SMOKE_BASE_URL' && env.required === true) &&
			(hostedSmokeChecklist?.coveredEndpoints ?? []).includes('/alpha-readiness/hosted-smoke-checklist.json') &&
			(hostedSmokeChecklist?.coveredEndpoints ?? []).includes('/alpha-readiness/native-host-contract.json') &&
			(hostedSmokeChecklist?.coveredEndpoints ?? []).includes('/alpha-readiness/community-analytics.md') &&
			(hostedSmokeChecklist?.coveredEndpoints ?? []).includes('/alpha-readiness/community-source-map.svg') &&
			(hostedSmokeChecklist?.coveredEndpoints ?? []).includes('/alpha-readiness/review-index.md') &&
			(hostedSmokeChecklist?.coveredEndpoints ?? []).includes('/alpha-readiness/community-signals.csv') &&
			(hostedSmokeChecklist?.coveredEndpoints ?? []).includes('/alpha-readiness/community-sources.csv') &&
			(hostedSmokeChecklist?.contentExpectations ?? []).some(
				(expectation) =>
					expectation.endpoint === '/alpha-readiness' &&
					(expectation.markers ?? []).includes('data-native-host-bridge-status') &&
					(expectation.markers ?? []).includes('data-native-platform-provenance') &&
					(expectation.markers ?? []).includes('data-window-material') &&
					(expectation.markers ?? []).includes('windows-11-mica') &&
					(expectation.markers ?? []).includes('data-macos-chrome') &&
					(expectation.markers ?? []).includes('data-windows-chrome') &&
					(expectation.markers ?? []).includes('data-native-platform-mode') &&
					(expectation.markers ?? []).includes('hybrid-proof') &&
					(expectation.markers ?? []).includes('browser fallback active') &&
					(expectation.markers ?? []).includes('data-ultragear-source-parity') &&
					(expectation.markers ?? []).includes('ultraGearParityContract') &&
					(expectation.markers ?? []).includes('data-desktop-shell-ui-binding') &&
					(expectation.markers ?? []).includes('desktopShellUiBinding') &&
					(expectation.markers ?? []).includes('@scriptgpt/desktop-shell-ui') &&
					(expectation.markers ?? []).includes('enableMicaWindowChrome') &&
					(expectation.markers ?? []).includes('syncTaskbarProgress') &&
					(expectation.markers ?? []).includes('toggleWindowMaximize') &&
					(expectation.markers ?? []).includes('installSvelteKitPhpNativeHost') &&
					(expectation.markers ?? []).includes('data-progress-report-handoff') &&
					(expectation.markers ?? []).includes('progressReportHandoff') &&
					(expectation.markers ?? []).includes('statusMapping') &&
					(expectation.markers ?? []).includes('ProgressBarStatus.None') &&
					(expectation.markers ?? []).includes('report-ready') &&
					(expectation.markers ?? []).includes('data-native-visual-matrix') &&
					(expectation.markers ?? []).includes('native-visual-matrix') &&
					(expectation.markers ?? []).includes('windows-mica-visual-row') &&
					(expectation.markers ?? []).includes('macos-traffic-light-row') &&
					(expectation.markers ?? []).includes('macos-vibrancy-visual-row') &&
					(expectation.markers ?? []).includes('macos-vibrancy-host-policy') &&
					(expectation.markers ?? []).includes('data-community-keyword-search-graph') &&
					(expectation.markers ?? []).includes('data-analytics-linked-keyword-graph') &&
					(expectation.markers ?? []).includes('keywordSearchGraph') &&
					(expectation.markers ?? []).includes('analytics-linked-keyword-graph') &&
					(expectation.markers ?? []).includes('curated-signal-score') &&
					(expectation.markers ?? []).includes('collected-demand-score') &&
					(expectation.markers ?? []).includes('directional-community-signal') &&
					(expectation.markers ?? []).includes('no-live-community-api-runtime-boundary') &&
					(expectation.markers ?? []).includes('Community evidence coverage ledger') &&
					(expectation.markers ?? []).includes('Open-source analytics sources reviewers can audit first')
			) &&
			(hostedSmokeChecklist?.contentExpectations ?? []).some(
				(expectation) =>
					expectation.endpoint === '/alpha-readiness/native-host-contract.json' &&
					(expectation.markers ?? []).includes('native-window-action') &&
					(expectation.markers ?? []).includes('toggle-maximize') &&
					(expectation.markers ?? []).includes('__SVELTEKIT_PHP_NATIVE_HOST__') &&
					(expectation.markers ?? []).includes('visualSnapshotContract') &&
					(expectation.markers ?? []).includes('ultraGearSourceParity') &&
					(expectation.markers ?? []).includes('progressReportHandoff') &&
					(expectation.markers ?? []).includes('ProgressBarStatus.Indeterminate') &&
					(expectation.markers ?? []).includes('ProgressBarStatus.None') &&
					(expectation.markers ?? []).includes('report-ready') &&
					(expectation.markers ?? []).includes('nativeVisualMatrix') &&
					(expectation.markers ?? []).includes('native-visual-matrix') &&
					(expectation.markers ?? []).includes('windows-mica-visual-row') &&
					(expectation.markers ?? []).includes('macos-traffic-light-row') &&
					(expectation.markers ?? []).includes('macos-vibrancy-visual-row') &&
					(expectation.markers ?? []).includes('macos-vibrancy-host-policy') &&
					(expectation.markers ?? []).includes('windows-caption-control-row') &&
					(expectation.markers ?? []).includes('ultragear-theme-row') &&
					(expectation.markers ?? []).includes('browser-fallback-visual-row') &&
					(expectation.markers ?? []).includes('browser-fallback')
			) &&
			(hostedSmokeChecklist?.contentExpectations ?? []).some(
				(expectation) =>
					expectation.endpoint === '/alpha-readiness/bridge-reuse.json' &&
					(expectation.markers ?? []).includes('ultraGearParityContract') &&
					(expectation.markers ?? []).includes('applyWindowChrome') &&
					(expectation.markers ?? []).includes('DRAG_START_THRESHOLD_PX') &&
					(expectation.markers ?? []).includes('progressReportHandoff') &&
					(expectation.markers ?? []).includes('ProgressBarStatus.Indeterminate') &&
					(expectation.markers ?? []).includes('ProgressBarStatus.None') &&
					(expectation.markers ?? []).includes('report-ready') &&
					(expectation.markers ?? []).includes('nativeVisualMatrix') &&
					(expectation.markers ?? []).includes('native-visual-matrix') &&
					(expectation.markers ?? []).includes('Structured report preview') &&
					(expectation.markers ?? []).includes('lg-ultragear-native-platform-provenance') &&
					(expectation.markers ?? []).includes('macos-material-host-policy') &&
					(expectation.markers ?? []).includes('source-observed-macos-host-scaffold') &&
					(expectation.markers ?? []).includes('macos-native-vibrancy-unverified') &&
					(expectation.markers ?? []).includes('Effect.Mica') &&
					(expectation.markers ?? []).includes('win.startDragging') &&
					(expectation.markers ?? []).includes('reportJson')
			) &&
			(hostedSmokeChecklist?.contentExpectations ?? []).some(
				(expectation) =>
					expectation.endpoint === '/alpha-readiness/community-analytics.md' &&
					(expectation.markers ?? []).includes('Source coverage plan') &&
					(expectation.markers ?? []).includes('Evidence kinds') &&
					(expectation.markers ?? []).includes('Collection risk') &&
					(expectation.markers ?? []).includes('community-analytics-freshness-contract') &&
					(expectation.markers ?? []).includes('Reviewer action:') &&
					(expectation.markers ?? []).includes('Collector note:')
			) &&
			(hostedSmokeChecklist?.contentExpectations ?? []).some(
				(expectation) =>
					expectation.endpoint === '/alpha-readiness/report.json' &&
					(expectation.markers ?? []).includes('releasePolicy') &&
					(expectation.markers ?? []).includes('requiredEvidence') &&
					(expectation.markers ?? []).includes('native-host-binding-guide') &&
					(expectation.markers ?? []).includes('csr-disabled-prerender-contract') &&
					(expectation.markers ?? []).includes('windows-11-mica-browser-safe-shell') &&
					(expectation.markers ?? []).includes('macos-style-native-titlebar-rhythm') &&
					(expectation.markers ?? []).includes('alpha-readiness-report-graphics') &&
					(expectation.markers ?? []).includes('community-keyword-search-graph') &&
					(expectation.markers ?? []).includes('community-analytics-freshness-contract') &&
					(expectation.markers ?? []).includes('hosted-php-smoke-proof') &&
					(expectation.markers ?? []).includes('proofLedger') &&
					(expectation.markers ?? []).includes('alpha-over-rc-release-policy') &&
					(expectation.markers ?? []).includes('1.0.2-alpha') &&
					(expectation.markers ?? []).includes('above-rc') &&
					(expectation.markers ?? []).includes('alpha-runtime-gate-ledger') &&
					(expectation.markers ?? []).includes('hosted-php-smoke-proof-required')
			) &&
			(hostedSmokeChecklist?.contentExpectations ?? []).some(
				(expectation) =>
					expectation.endpoint === '/alpha-readiness/report.svg' &&
					(expectation.markers ?? []).includes('data-required-alpha-evidence') &&
					(expectation.markers ?? []).includes('Required alpha evidence') &&
					(expectation.markers ?? []).includes('requiredEvidence') &&
					(expectation.markers ?? []).includes('required-alpha-evidence') &&
					(expectation.markers ?? []).includes('native-host-binding-guide') &&
					(expectation.markers ?? []).includes('csr-disabled-prerender-contract') &&
					(expectation.markers ?? []).includes('windows-11-mica-browser-safe-shell') &&
					(expectation.markers ?? []).includes('macos-style-native-titlebar-rhythm') &&
					(expectation.markers ?? []).includes('alpha-readiness-report-graphics') &&
					(expectation.markers ?? []).includes('community-keyword-search-graph') &&
					(expectation.markers ?? []).includes('community-analytics-freshness-contract') &&
					(expectation.markers ?? []).includes('hosted-php-smoke-proof') &&
					(expectation.markers ?? []).includes('proofLedger') &&
					(expectation.markers ?? []).includes('alpha-runtime-gate-ledger') &&
					(expectation.markers ?? []).includes('hosted-php-smoke-proof-required') &&
					(expectation.markers ?? []).includes('needs-local-gate-proof') &&
					(expectation.markers ?? []).includes('needs-hosted-proof') &&
					(expectation.markers ?? []).includes('data-native-platform-provenance') &&
					(expectation.markers ?? []).includes('lg-ultragear-native-platform-provenance') &&
					(expectation.markers ?? []).includes('Effect.Mica') &&
					(expectation.markers ?? []).includes('win.startDragging') &&
					(expectation.markers ?? []).includes('reportJson')
			) &&
			(hostedSmokeChecklist?.contentExpectations ?? []).some(
				(expectation) =>
					expectation.endpoint === '/alpha-readiness/community-source-map.svg' &&
					(expectation.markers ?? []).includes('keyword-search-graph') &&
					(expectation.markers ?? []).includes('analytics-linked-keyword-graph') &&
					(expectation.markers ?? []).includes('community-analytics-freshness-contract') &&
					(expectation.markers ?? []).includes('source-to-keyword-edge') &&
					(expectation.markers ?? []).includes('supported-api-lanes') &&
					(expectation.markers ?? []).includes('manual-research-lanes') &&
					(expectation.markers ?? []).includes('curated-signal-score') &&
					(expectation.markers ?? []).includes('collected-demand-score') &&
					(expectation.markers ?? []).includes('directional-community-signal') &&
					(expectation.markers ?? []).includes('no-live-community-api-runtime-boundary') &&
					(expectation.markers ?? []).includes('alpha-community-source-evidence-checklist') &&
					(expectation.markers ?? []).includes('source-health-classification') &&
					(expectation.markers ?? []).includes('result-total-field-contract')
					&& (expectation.markers ?? []).includes('top-result-field-contract')
					&& (expectation.markers ?? []).includes('sample-review-rule')
			) &&
			(hostedSmokeChecklist?.contentExpectations ?? []).some(
				(expectation) =>
					expectation.endpoint === '/alpha-readiness/community-research-pack.json' &&
					(expectation.markers ?? []).includes('providerCoverage') &&
					(expectation.markers ?? []).includes('evidenceKindCoverage') &&
					(expectation.markers ?? []).includes('collectionRiskCoverage') &&
					(expectation.markers ?? []).includes('collectionPlan') &&
					(expectation.markers ?? []).includes('keywordSearchGraph') &&
					(expectation.markers ?? []).includes('sourceToKeywordEdge') &&
					(expectation.markers ?? []).includes('analyticsLinkageMarker') &&
					(expectation.markers ?? []).includes('weightedDemandScore') &&
					(expectation.markers ?? []).includes('freshnessMaxAgeHours') &&
					(expectation.markers ?? []).includes('trustBoundary') &&
					(expectation.markers ?? []).includes('manualReviewRequired') &&
					(expectation.markers ?? []).includes('alpha-community-source-evidence-checklist') &&
					(expectation.markers ?? []).includes('source-health-classification') &&
					(expectation.markers ?? []).includes('result-total-field-contract') &&
					(expectation.markers ?? []).includes('top-result-field-contract') &&
					(expectation.markers ?? []).includes('sample-review-rule') &&
					(expectation.markers ?? []).includes('analyticsFreshnessContract') &&
					(expectation.markers ?? []).includes('community-analytics-freshness-contract') &&
					(expectation.markers ?? []).includes('maxAgeHours') &&
					(expectation.markers ?? []).includes('community-analytics-graphic-linkage-contract') &&
					(expectation.markers ?? []).includes('communityAnalyticsGraphicLinkageContract') &&
					(expectation.markers ?? []).includes('community-source-map.svg') &&
					(expectation.markers ?? []).includes('community-analytics.md') &&
					(expectation.markers ?? []).includes('community-signals.csv') &&
					(expectation.markers ?? []).includes('community-sources.csv') &&
					(expectation.markers ?? []).includes('curated-signal-score') &&
					(expectation.markers ?? []).includes('collected-demand-score') &&
					(expectation.markers ?? []).includes('directional-community-signal') &&
					(expectation.markers ?? []).includes('no-live-community-api-runtime-boundary') &&
					(expectation.markers ?? []).includes('alpha-community-source-evidence-checklist') &&
					(expectation.markers ?? []).includes('source-health-classification') &&
					(expectation.markers ?? []).includes('result-total-field-contract')
					&& (expectation.markers ?? []).includes('top-result-field-contract')
					&& (expectation.markers ?? []).includes('sample-review-rule')
			) &&
			(hostedSmokeChecklist?.contentExpectations ?? []).some(
				(expectation) =>
					expectation.endpoint === '/alpha-readiness/readiness.csv' &&
					(expectation.markers ?? []).includes('proof-ledger') &&
					(expectation.markers ?? []).includes('required-evidence') &&
					(expectation.markers ?? []).includes('requiredEvidence') &&
					(expectation.markers ?? []).includes('required-alpha-evidence') &&
					(expectation.markers ?? []).includes('native-host-binding-guide') &&
					(expectation.markers ?? []).includes('csr-disabled-prerender-contract') &&
					(expectation.markers ?? []).includes('windows-11-mica-browser-safe-shell') &&
					(expectation.markers ?? []).includes('macos-style-native-titlebar-rhythm') &&
					(expectation.markers ?? []).includes('alpha-readiness-report-graphics') &&
					(expectation.markers ?? []).includes('community-keyword-search-graph') &&
					(expectation.markers ?? []).includes('community-analytics-freshness-contract') &&
					(expectation.markers ?? []).includes('hosted-php-smoke-proof') &&
					(expectation.markers ?? []).includes('alpha-over-rc-release-policy') &&
					(expectation.markers ?? []).includes('native-visual-matrix') &&
					(expectation.markers ?? []).includes('analytics-linked-keyword-graph') &&
					(expectation.markers ?? []).includes('alpha-runtime-gate-ledger') &&
					(expectation.markers ?? []).includes('hosted-php-smoke-proof-required')
			) &&
			(hostedSmokeChecklist?.contentExpectations ?? []).some(
				(expectation) =>
					expectation.endpoint === '/alpha-readiness/community-signals.csv' &&
					(expectation.markers ?? []).includes('analytics_linkage_marker') &&
					(expectation.markers ?? []).includes('analytics-linked-keyword-graph') &&
					(expectation.markers ?? []).includes('curated_signal_score_marker') &&
					(expectation.markers ?? []).includes('curated-signal-score') &&
					(expectation.markers ?? []).includes('collected_demand_score_marker') &&
					(expectation.markers ?? []).includes('collected-demand-score') &&
					(expectation.markers ?? []).includes('directional_trust_level') &&
					(expectation.markers ?? []).includes('directional-community-signal') &&
					(expectation.markers ?? []).includes('no-live-community-api-runtime-boundary')
			) &&
			(hostedSmokeChecklist?.contentExpectations ?? []).some(
				(expectation) =>
					expectation.endpoint === '/alpha-readiness/release-manifest.json' &&
					(expectation.markers ?? []).includes('trustModel') &&
					(expectation.markers ?? []).includes('releasePolicy') &&
					(expectation.markers ?? []).includes('proofLedger') &&
					(expectation.markers ?? []).includes('alpha-over-rc-release-policy') &&
					(expectation.markers ?? []).includes('1.0.2-alpha') &&
					(expectation.markers ?? []).includes('above-rc') &&
					(expectation.markers ?? []).includes('alpha-runtime-gate-ledger') &&
					(expectation.markers ?? []).includes('hosted-php-smoke-proof-required') &&
					(expectation.markers ?? []).includes('proofStage') &&
					(expectation.markers ?? []).includes('evidenceSurfaces') &&
					(expectation.markers ?? []).includes('nativeChromeVisualContract') &&
					(expectation.markers ?? []).includes('ultraGearSourceParity') &&
					(expectation.markers ?? []).includes('nativePlatformProvenance') &&
					(expectation.markers ?? []).includes('lg-ultragear-native-platform-provenance') &&
					(expectation.markers ?? []).includes('progressReportHandoff') &&
					(expectation.markers ?? []).includes('nativeHostBridgeStatus') &&
					(expectation.markers ?? []).includes('nativeHostBindingGuide') &&
					(expectation.markers ?? []).includes('nativeVisualMatrix') &&
					(expectation.markers ?? []).includes('communityAnalyticsFreshnessContract') &&
					(expectation.markers ?? []).includes('no-live-community-api-runtime-boundary') &&
					(expectation.markers ?? []).includes('requiredEvidence') &&
					(expectation.markers ?? []).includes('native-host-binding-guide') &&
					(expectation.markers ?? []).includes('csr-disabled-prerender-contract') &&
					(expectation.markers ?? []).includes('windows-11-mica-browser-safe-shell') &&
					(expectation.markers ?? []).includes('macos-style-native-titlebar-rhythm') &&
					(expectation.markers ?? []).includes('alpha-readiness-report-graphics') &&
					(expectation.markers ?? []).includes('community-keyword-search-graph') &&
					(expectation.markers ?? []).includes('community-analytics-freshness-contract') &&
					(expectation.markers ?? []).includes('hosted-php-smoke-proof') &&
					(expectation.markers ?? []).includes('communityEvidenceLedger')
			) &&
			(hostedSmokeChecklist?.contentExpectations ?? []).some(
				(expectation) =>
					expectation.endpoint === '/alpha-readiness/gate-matrix.json' &&
					(expectation.markers ?? []).includes('live-evidence-surfaces') &&
					(expectation.markers ?? []).includes('data-desktop-shell-ui-binding') &&
					(expectation.markers ?? []).includes('desktopShellUiBinding') &&
					(expectation.markers ?? []).includes('@scriptgpt/desktop-shell-ui') &&
					(expectation.markers ?? []).includes('installSvelteKitPhpNativeHost') &&
					(expectation.markers ?? []).includes('enableMicaWindowChrome') &&
					(expectation.markers ?? []).includes('syncTaskbarProgress') &&
					(expectation.markers ?? []).includes('toggleWindowMaximize') &&
					(expectation.markers ?? []).includes('data-drag-block-selector') &&
					(expectation.markers ?? []).includes('caption-button') &&
					(expectation.markers ?? []).includes('progressStatus') &&
					(expectation.markers ?? []).includes('indeterminate') &&
					(expectation.markers ?? []).includes('sourceToKeywordEdge') &&
					(expectation.markers ?? []).includes('analyticsLinkageMarker') &&
					(expectation.markers ?? []).includes('weightedDemandScore') &&
					(expectation.markers ?? []).includes('freshnessMaxAgeHours') &&
					(expectation.markers ?? []).includes('trustBoundary') &&
					(expectation.markers ?? []).includes('manualReviewRequired') &&
					(expectation.markers ?? []).includes('required-alpha-evidence') &&
					(expectation.markers ?? []).includes('requiredEvidence') &&
					(expectation.markers ?? []).includes('release-policy-evidence-boundary') &&
					(expectation.markers ?? []).includes('native-host-binding-guide') &&
					(expectation.markers ?? []).includes('csr-disabled-prerender-contract') &&
					(expectation.markers ?? []).includes('windows-11-mica-browser-safe-shell') &&
					(expectation.markers ?? []).includes('macos-style-native-titlebar-rhythm') &&
					(expectation.markers ?? []).includes('alpha-readiness-report-graphics') &&
					(expectation.markers ?? []).includes('community-keyword-search-graph') &&
					(expectation.markers ?? []).includes('community-analytics-freshness-contract') &&
					(expectation.markers ?? []).includes('hosted-php-smoke-proof') &&
					(expectation.markers ?? []).includes('live-runtime-surface-proof') &&
					(expectation.markers ?? []).includes('artifact-sync') &&
					(expectation.markers ?? []).includes('report/alpha-bridge-reuse.json') &&
					(expectation.markers ?? []).includes('native platform provenance') &&
					(expectation.markers ?? []).includes('Native platform provenance markers') &&
					(expectation.markers ?? []).includes('report/alpha-readiness.json')
			) &&
			(hostedSmokeChecklist?.contentExpectations ?? []).some(
				(expectation) =>
					expectation.endpoint === '/alpha-readiness/evidence-index.json' &&
					(expectation.markers ?? []).includes('liveEvidenceSurfaces') &&
					(expectation.markers ?? []).includes('native-host-bridge-status') &&
					(expectation.markers ?? []).includes('data-native-host-handoff-controls') &&
					(expectation.markers ?? []).includes('native-visual-matrix') &&
					(expectation.markers ?? []).includes('lg-ultragear-native-platform-provenance') &&
					(expectation.markers ?? []).includes('progress-report-handoff') &&
					(expectation.markers ?? []).includes('required-alpha-evidence') &&
					(expectation.markers ?? []).includes('requiredEvidence') &&
					(expectation.markers ?? []).includes('native-host-binding-guide') &&
					(expectation.markers ?? []).includes('csr-disabled-prerender-contract') &&
					(expectation.markers ?? []).includes('windows-11-mica-browser-safe-shell') &&
					(expectation.markers ?? []).includes('macos-style-native-titlebar-rhythm') &&
					(expectation.markers ?? []).includes('alpha-readiness-report-graphics') &&
					(expectation.markers ?? []).includes('community-keyword-search-graph') &&
					(expectation.markers ?? []).includes('community-analytics-freshness-contract') &&
					(expectation.markers ?? []).includes('hosted-php-smoke-proof') &&
					(expectation.markers ?? []).includes('community-evidence-coverage-ledger')
			) &&
			(hostedSmokeChecklist?.contentExpectations ?? []).some(
				(expectation) =>
					expectation.endpoint === '/alpha-readiness/package-contract.json' &&
					(expectation.markers ?? []).includes('sveltekit-php/adapter') &&
					(expectation.markers ?? []).includes('alpha:consumer:smoke') &&
					(expectation.markers ?? []).includes('publishConfig') &&
					(expectation.markers ?? []).includes('alpha-over-rc-release-policy') &&
					(expectation.markers ?? []).includes('above-rc') &&
					(expectation.markers ?? []).includes('verify:artifacts') &&
					(expectation.markers ?? []).includes('precheck:deploy') &&
					(expectation.markers ?? []).includes('source-to-generated-bundle-check') &&
					(expectation.markers ?? []).includes('environment-preflight-check') &&
					(expectation.markers ?? []).includes('nativePlatformProvenanceProof') &&
					(expectation.markers ?? []).includes('lg-ultragear-native-platform-provenance') &&
					(expectation.markers ?? []).includes('nativeHostBindingGuideProof') &&
					(expectation.markers ?? []).includes('nativeHostWrapperSmokeProof') &&
					(expectation.markers ?? []).includes('deterministic-host-wrapper-handoff') &&
					(expectation.markers ?? []).includes('native-host-wrapper-event-replay') &&
					(expectation.markers ?? []).includes('native-host-wrapper-event-replay-step') &&
					(expectation.markers ?? []).includes('realHostVerified') &&
					(expectation.markers ?? []).includes('noNativeApiBoundary') &&
					(expectation.markers ?? []).includes('window.__SVELTEKIT_PHP_NATIVE_HOST__') &&
					(expectation.markers ?? []).includes('window.__SVELTEKIT_PHP_NATIVE_HOST_HISTORY__') &&
					(expectation.markers ?? []).includes('TaskbarProgressState') &&
					(expectation.markers ?? []).includes('expectedHistoryResult') &&
					(expectation.markers ?? []).includes('expectedDesktopShellUiHelper') &&
					(expectation.markers ?? []).includes('noFallbackAllowedForRealHost') &&
					(expectation.markers ?? []).includes('/alpha-readiness/native-host-guide.md') &&
					(expectation.markers ?? []).includes('report/alpha-native-host-guide.md') &&
					(expectation.markers ?? []).includes('/alpha-readiness/native-host-wrapper-smoke.json') &&
					(expectation.markers ?? []).includes('report/alpha-native-host-wrapper-smoke.json') &&
					(expectation.markers ?? []).includes('native-host-wrapper-smoke') &&
					(expectation.markers ?? []).includes('requiredEvidence') &&
					(expectation.markers ?? []).includes('native-host-binding-guide') &&
					(expectation.markers ?? []).includes('csr-disabled-prerender-contract') &&
					(expectation.markers ?? []).includes('windows-11-mica-browser-safe-shell') &&
					(expectation.markers ?? []).includes('macos-style-native-titlebar-rhythm') &&
					(expectation.markers ?? []).includes('alpha-readiness-report-graphics') &&
					(expectation.markers ?? []).includes('community-keyword-search-graph') &&
					(expectation.markers ?? []).includes('community-analytics-freshness-contract') &&
					(expectation.markers ?? []).includes('hosted-php-smoke-proof')
			) &&
			(hostedSmokeChecklist?.securityProbes ?? []).includes('%2e%2e/.env') &&
			hostedSmokeChecklist?.proofArtifact === 'report/alpha-remote-smoke.json'
			? ok('hosted-smoke-checklist', 'Hosted smoke checklist documents env, endpoints, probes, and proof artifact.')
			: fail(
					'hosted-smoke-checklist',
					'Hosted smoke checklist is missing env, endpoint, content expectation, probe, or proof artifact coverage.'
				)
	);

	checks.push(
		Object.hasOwn(fullReport ?? {}, 'hostedAlphaSmoke') &&
			Object.hasOwn(fullReport ?? {}, 'hostedAlphaSmokeProof') &&
			Object.hasOwn(fullReport ?? {}, 'hostedAlphaSmokeArtifact') &&
			fullReport?.hostedAlphaSmokeProof?.marker === 'hosted-php-smoke-proof' &&
			fullReport?.hostedAlphaSmokeArtifact?.path === 'report/alpha-remote-smoke.json' &&
			hasText(html, 'Hosted deployment smoke') &&
			hasText(markdown, 'Hosted deployment smoke') &&
			hasText(svg, 'hosted smoke:')
			? ok(
					'hosted-smoke-report',
					'Reports include hosted deployment smoke evidence slot and interpreted hosted proof state.'
				)
			: fail(
					'hosted-smoke-report',
					'Reports are missing hosted deployment smoke evidence slot or interpreted hosted proof state.'
				)
	);

	checks.push(
		hasText(svg, 'data-native-host-wrapper-smoke') &&
			hasText(svg, 'native-host-wrapper-smoke') &&
			hasText(svg, 'native-host-wrapper-probe') &&
			hasText(svg, 'realHostVerified=false') &&
			hasText(svg, 'real-host-not-verified') &&
			hasText(svg, 'report/alpha-native-host-wrapper-smoke.json') &&
			hasText(svg, '/alpha-readiness/native-host-wrapper-smoke.json')
			? ok('svg-native-wrapper-smoke', 'SVG report embeds native wrapper smoke status, endpoint, artifact, and real-host boundary.')
			: fail('svg-native-wrapper-smoke', 'SVG report is missing native wrapper smoke status or real-host boundary markers.')
	);

	const nativeHostActions = new Set(
		(nativeHostContract?.hostEvents ?? []).flatMap((event) => event.actions ?? [])
	);
	const nativeHostHandlers = new Set(nativeHostContract?.hostRuntimeBridge?.handlers ?? []);
	const nativeHostEvidenceText = JSON.stringify({
		bridgeReuse,
		nativeHostContract,
		nativeHostWrapperSmoke,
		hostedSmokeChecklist
	});
	const requiredNativeHostActions = [
		'set-window-effect',
		'set-progress',
		'clear-progress',
		'report-ready'
	];
	const requiredNativeHostHandlers = [
		'setWindowEffect',
		'setProgress',
		'clearProgress',
		'reportReady'
	];

	checks.push(
		requiredNativeHostActions.every((action) => nativeHostActions.has(action)) &&
			requiredNativeHostHandlers.every((handler) => nativeHostHandlers.has(handler)) &&
			requiredNativeHostActions.every((action) => hasText(nativeHostBridgeSource, action)) &&
			requiredNativeHostHandlers.every((handler) => hasText(nativeHostBridgeSource, handler)) &&
			requiredNativeHostActions.every((action) => hasText(nativeHostBridgeStatusSource, action)) &&
			requiredNativeHostHandlers.every((handler) => hasText(nativeHostBridgeStatusSource, handler)) &&
			requiredNativeHostActions.every((action) => hasText(nativeHostGuide, action)) &&
			requiredNativeHostHandlers.every((handler) => hasText(nativeHostGuide, handler)) &&
			hasText(nativeHostGuide, 'native host binding guide') &&
			hasText(nativeHostGuide, 'window.__SVELTEKIT_PHP_NATIVE_HOST__') &&
			hasText(nativeHostGuide, 'window.__SVELTEKIT_PHP_NATIVE_HOST_HISTORY__') &&
			hasText(nativeHostGuide, 'desktopShellUiBinding') &&
			hasText(nativeHostGuide, 'installSvelteKitPhpNativeHost') &&
			hasText(nativeHostGuide, 'getDesktopShellUiCommandMapping') &&
			hasText(nativeHostGuide, 'toDesktopShellUiTaskbarProgressState') &&
			hasText(nativeHostGuide, 'TaskbarProgressState') &&
			hasText(nativeHostGuide, 'native-host-wrapper-event-replay') &&
			hasText(nativeHostGuide, 'native-host-wrapper-event-replay-step') &&
			hasText(nativeHostGuide, 'eventReplayTranscript[]') &&
			hasText(nativeHostGuide, 'expectedHistoryResult') &&
			hasText(nativeHostGuide, 'expectedDesktopShellUiHelper') &&
			hasText(nativeHostGuide, 'noFallbackAllowedForRealHost') &&
			hasText(nativeHostGuide, 'saveInFlight') &&
			hasText(nativeHostGuide, 'hasQueuedSave') &&
			hasText(nativeHostGuide, 'packages/ultragear-widget-ui/src/app.ts') &&
			hasText(nativeHostGuide, '@scriptgpt/desktop-shell-ui') &&
			hasText(nativeHostGuide, 'enableMicaWindowChrome') &&
			hasText(nativeHostGuide, 'syncTaskbarProgress') &&
			hasText(nativeHostGuide, 'toggleWindowMaximize') &&
			hasText(nativeHostGuide, 'Effect.Mica') &&
			hasText(nativeHostGuide, 'win.setProgressBar') &&
			hasText(nativeHostGuide, 'reportJson') &&
			hasText(nativeHostBridgeStatusSource, 'data-native-host-handoff-controls') &&
			hasText(nativeHostBridgeStatusSource, 'dispatchNativeHostHandoff') &&
			hasText(nativeHostBridgeSource, 'desktopShellUiBinding') &&
			hasText(nativeHostBridgeSource, 'getDesktopShellUiCommandMapping') &&
			hasText(nativeHostBridgeSource, 'desktopShellUiHelper') &&
			hasText(nativeHostBridgeSource, 'desktopShellUiEvidence') &&
			hasText(nativeHostBridgeSource, 'toDesktopShellUiTaskbarProgressState') &&
			hasText(nativeHostBridgeSource, 'TaskbarProgressState') &&
			hasText(nativeHostBridgeSource, 'saveInFlight') &&
			hasText(nativeHostBridgeSource, 'hasQueuedSave') &&
			hasText(nativeHostBridgeSource, 'packages/ultragear-widget-ui/src/app.ts') &&
			hasText(nativeHostBridgeSource, 'win.startDragging()') &&
			hasText(nativeHostBridgeSource, 'ProgressBarStatus') &&
			nativeHostContract?.nativeHostCompatibilityMatrix?.marker === 'native-host-compatibility-matrix' &&
			nativeHostContract?.nativeHostCompatibilityMatrix?.trustLevel ===
				'source-observed-host-compatibility-contract' &&
			(nativeHostContract?.nativeHostCompatibilityMatrix?.rows ?? []).some(
				(row) =>
					row.id === 'windows-mica-effects' &&
					JSON.stringify(row).includes('features.micaSupported') &&
					JSON.stringify(row).includes('ShellFeatureProbe.mica_supported') &&
					JSON.stringify(row).includes('current_shell_features()') &&
					JSON.stringify(row).includes('set-window-effect')
			) &&
			(nativeHostContract?.nativeHostCompatibilityMatrix?.rows ?? []).some(
				(row) =>
					row.id === 'taskbar-progress-reporting' &&
					JSON.stringify(row).includes(
						'syncTaskbarProgress(win, { saveInFlight, refreshInFlight, hasQueuedSave })'
					) &&
					JSON.stringify(row).includes('set-progress')
			) &&
			(nativeHostContract?.nativeHostCompatibilityMatrix?.rows ?? []).some(
				(row) =>
					row.id === 'native-titlebar-drag-maximize' &&
					JSON.stringify(row).includes('win.startDragging()') &&
					JSON.stringify(row).includes('native-window-action')
			) &&
			(nativeHostContract?.nativeHostCompatibilityMatrix?.rows ?? []).some(
				(row) =>
					row.id === 'macos-material-host-policy' &&
					JSON.stringify(row).includes('source-observed-macos-host-scaffold') &&
					JSON.stringify(row).includes('macos-native-vibrancy-unverified') &&
					JSON.stringify(row).includes('MacosLauncher::LaunchAgent')
			) &&
			hasText(nativeHostEvidenceText, 'native-host-compatibility-matrix') &&
			hasText(nativeHostEvidenceText, 'source-observed-host-compatibility-contract') &&
			hasText(nativeHostEvidenceText, 'features.micaSupported') &&
			hasText(nativeHostEvidenceText, 'ShellFeatureProbe.mica_supported') &&
			hasText(nativeHostEvidenceText, 'current_shell_features()') &&
			(hasText(nativeHostEvidenceText, 'cfg!(target_os = "windows")') ||
				hasText(nativeHostEvidenceText, 'cfg!(target_os = \\"windows\\")')) &&
			hasText(nativeHostEvidenceText, 'macos-material-host-policy') &&
			hasText(nativeHostEvidenceText, 'source-observed-macos-host-scaffold') &&
			hasText(nativeHostEvidenceText, 'macos-native-vibrancy-unverified') &&
			requiredNativeHostActions.every((action) => hasText(nativeHostEvidenceText, action)) &&
			requiredNativeHostHandlers.every((handler) => hasText(nativeHostEvidenceText, handler))
			? ok(
					'native-host-extended-actions',
					'Native host bridge, contract, smoke checklist, and reuse inventory expose effect/progress/report-ready handlers.'
				)
			: fail(
					'native-host-extended-actions',
					'Native host effect/progress/report-ready actions are missing from the bridge source, contract, hosted checklist, or reuse inventory.'
				)
	);

	const releaseChecklistMarkers = [
		'1.0.2-alpha release checklist',
		'alpha-over-rc-release-policy',
		'desktop-shell-ui-command-mapping',
			'windowChromeState',
			'webview.setBackgroundColor([0, 0, 0, 0])',
			'data-window-chrome-state',
			'transparent-webview-material-boundary',
		'community-analytics-csv-linkage',
		'router-path-safety-artifact-sync',
		'adapter-platform-emulation',
		'deploy-env-preflight-safety',
		'bun run alpha:gate:hosted',
		'sourceToKeywordEdge',
		'result-total-field-contract',
		'top-result-field-contract',
		'sample-review-rule',
		'resultTotalField',
		'topResultFields',
		'sampleReviewRule',
		'weighted_demand_score',
		'result_total_field',
		'top_result_fields',
		'sample_review_rule',
		'ALPHA_SMOKE_BASE_URL'
	];
	const releaseChecklistIndexedText = [
		JSON.stringify(gateMatrix ?? {}),
		JSON.stringify(evidenceIndex ?? {}),
		JSON.stringify(hostedSmokeChecklist ?? {}),
		JSON.stringify(manifest ?? {})
	].join('\n');
	checks.push(
		releaseChecklistMarkers.every((marker) => hasText(releaseChecklist, marker)) &&
			hasText(releaseChecklistSource, 'renderAlphaReleaseChecklistMarkdown') &&
			hasText(releaseChecklistEndpointSource, 'renderAlphaReleaseChecklistMarkdown') &&
			hasText(releaseChecklistEndpointSource, 'text/markdown') &&
			hasText(releaseNotes, '/alpha-readiness/release-checklist.md') &&
			hasText(releaseNotes, 'release-checklist-markdown-endpoint') &&
			hasText(releaseChecklistIndexedText, '/alpha-readiness/release-checklist.md') &&
			hasText(releaseChecklistIndexedText, 'release-checklist-markdown-endpoint') &&
			hasText(releaseChecklistIndexedText, 'report/alpha-release-checklist.md') &&
			hasText(releaseChecklistIndexedText, 'alpha-release-checklist') &&
			hasText(releaseChecklistIndexedText, 'alphaReleaseChecklist') &&
			hasText(releaseChecklistIndexedText, 'source-controlled-release-documentation') &&
			hasText(releaseChecklistIndexedText, 'generatedArtifact')
			? ok(
					'alpha-release-checklist-runtime',
					'Source-rendered alpha release checklist is exported, indexed, manifested, and covered by hosted smoke expectations.'
				)
			: fail(
					'alpha-release-checklist-runtime',
					'Alpha release checklist artifact, route, source renderer, manifest, gate matrix, evidence index, or hosted smoke coverage is incomplete.'
				)
	);

	const manifestArtifacts = new Set((manifest?.artifacts ?? []).map((artifact) => artifact.path));
	const manifestEndpoints = new Set((manifest?.runtimeEndpoints ?? []).map((endpoint) => endpoint.path));
	const hostedAlphaSmokePassed = manifest?.hostedAlphaSmoke?.status === 'passed';
	const expectedHostedSmokeProofStage = hostedAlphaSmokePassed
		? 'hosted-smoke-passed'
		: 'hosted-smoke-or-placeholder';
	const expectedHostedSmokeTrustLevel = hostedAlphaSmokePassed
		? 'real-php-host-smoke-evidence'
		: 'requires-alpha-smoke-base-url-for-pass-evidence';
	const remoteSmokeArtifact = (manifest?.artifacts ?? []).find(
		(artifact) => artifact.path === 'report/alpha-remote-smoke.json'
	);
	const hostedProofStableBoundary = String(
		manifest?.hostedProofInterpretation?.stableBoundary ?? ''
	);
	const hostedProofInterpretationOk =
		manifest?.hostedProofInterpretation?.marker === 'hosted-php-smoke-proof' &&
		manifest?.hostedProofInterpretation?.artifact === 'report/alpha-remote-smoke.json' &&
		manifest?.hostedProofInterpretation?.checklist === 'report/alpha-hosted-smoke-checklist.json' &&
		hostedProofStableBoundary.includes('Stable') &&
		(!hostedAlphaSmokePassed ||
			(manifest?.hostedProofInterpretation?.status === 'passed' &&
				manifest?.hostedProofInterpretation?.alphaEvidenceStatus ===
					'alpha-hosted-proof-present' &&
				Number(manifest?.hostedProofInterpretation?.checkCount ?? 0) > 0));
	checks.push(
			manifest?.target === report.target &&
			manifest?.trustModel?.['deterministic-local-artifact'] &&
			manifest?.trustModel?.['directional-community-signal'] &&
			manifest?.trustModel?.['no-live-community-api-runtime-boundary'] &&
			manifest?.trustModel?.['requires-alpha-smoke-base-url-for-pass-evidence'] &&
			manifest?.trustModel?.['real-php-host-smoke-evidence'] &&
			manifest?.releasePolicy?.marker === 'alpha-over-rc-release-policy' &&
			manifest?.releasePolicy?.channel === 'alpha' &&
			manifest?.releasePolicy?.track === releaseTrack &&
			manifest?.releasePolicy?.rank === 'above-rc' &&
			manifest?.releasePolicy?.projectRankPolicy?.includes('ranks above any RC') &&
			manifest?.releasePolicy?.semverNote?.includes('SemVer') &&
			manifest?.releasePolicyProof?.projectRankPolicy === 'above-rc' &&
			manifest?.evidenceSurfaces?.alphaReleaseChecklist?.route === '/alpha-readiness/release-checklist.md' &&
			manifest?.evidenceSurfaces?.alphaReleaseChecklist?.source === 'src/lib/alpha-release-checklist.ts' &&
			manifest?.evidenceSurfaces?.alphaReleaseChecklist?.documentationSource === 'docs/ALPHA-RELEASE-CHECKLIST.md' &&
			(manifest?.releasePolicyProof?.mustNotUseCandidateLabels ?? []).includes('rc') &&
			(manifest?.requiredEvidence ?? []).includes('native-host-binding-guide') &&
			(manifest?.requiredEvidence ?? []).includes('csr-disabled-prerender-contract') &&
			(manifest?.requiredEvidence ?? []).includes('native-host-wrapper-smoke') &&
			(manifest?.requiredEvidence ?? []).includes('windows-11-mica-browser-safe-shell') &&
			(manifest?.requiredEvidence ?? []).includes('macos-style-native-titlebar-rhythm') &&
			(manifest?.requiredEvidence ?? []).includes('alpha-readiness-report-graphics') &&
			(manifest?.requiredEvidence ?? []).includes('community-keyword-search-graph') &&
			(manifest?.requiredEvidence ?? []).includes('community-analytics-freshness-contract') &&
			(manifest?.requiredEvidence ?? []).includes('hosted-php-smoke-proof') &&
			(manifest?.releasePolicy?.requiredEvidence ?? []).includes('native-host-binding-guide') &&
			(manifest?.releasePolicy?.requiredEvidence ?? []).includes('csr-disabled-prerender-contract') &&
			(manifest?.releasePolicy?.requiredEvidence ?? []).includes('native-host-wrapper-smoke') &&
			(manifest?.releasePolicy?.requiredEvidence ?? []).includes('community-analytics-freshness-contract') &&
			(manifest?.releasePolicy?.requiredEvidence ?? []).includes('hosted-php-smoke-proof') &&
			(manifest?.releasePolicy?.disallowedChannels ?? []).includes('rc') &&
			(manifest?.proofLedger ?? []).some((item) => item.marker === 'alpha-runtime-gate-ledger') &&
			(manifest?.proofLedger ?? []).some((item) => item.marker === 'hosted-php-smoke-proof-required') &&
			manifest?.evidenceSurfaces?.nativeChromeVisualContract?.markers?.includes('Windows 11 Mica') &&
			manifest?.evidenceSurfaces?.nativeChromeVisualContract?.markers?.includes('macOS traffic lights') &&
			manifest?.evidenceSurfaces?.nativeChromeVisualContract?.markers?.includes('macOS vibrancy host policy') &&
			manifest?.evidenceSurfaces?.nativeChromeVisualContract?.markers?.includes('macos-material-host-policy') &&
			manifest?.evidenceSurfaces?.nativeChromeVisualContract?.markers?.includes('source-observed-macos-host-scaffold') &&
			manifest?.evidenceSurfaces?.nativeChromeVisualContract?.markers?.includes('macos-native-vibrancy-unverified') &&
			manifest?.evidenceSurfaces?.nativeChromeVisualContract?.markers?.includes('native-window-action') &&
			manifest?.evidenceSurfaces?.nativeChromeVisualContract?.markers?.includes('native-visual-matrix') &&
			manifest?.evidenceSurfaces?.nativeChromeVisualContract?.markers?.includes('windows-mica-visual-row') &&
			manifest?.evidenceSurfaces?.nativeChromeVisualContract?.markers?.includes('macos-traffic-light-row') &&
			manifest?.evidenceSurfaces?.nativeChromeVisualContract?.markers?.includes('macos-vibrancy-visual-row') &&
			manifest?.evidenceSurfaces?.nativeVisualMatrix?.markers?.includes('native-visual-matrix') &&
			manifest?.evidenceSurfaces?.nativeVisualMatrix?.markers?.includes('windows-mica-visual-row') &&
			manifest?.evidenceSurfaces?.nativeVisualMatrix?.markers?.includes('macos-traffic-light-row') &&
			manifest?.evidenceSurfaces?.nativeVisualMatrix?.markers?.includes('macos-vibrancy-visual-row') &&
			manifest?.evidenceSurfaces?.nativeVisualMatrix?.markers?.includes('macos-material-host-policy') &&
			manifest?.evidenceSurfaces?.nativeVisualMatrix?.markers?.includes('source-observed-macos-host-scaffold') &&
			manifest?.evidenceSurfaces?.nativeVisualMatrix?.markers?.includes('macos-native-vibrancy-unverified') &&
			manifest?.evidenceSurfaces?.nativeVisualMatrix?.markers?.includes('windows-caption-control-row') &&
			manifest?.evidenceSurfaces?.nativeVisualMatrix?.markers?.includes('ultragear-theme-row') &&
			manifest?.evidenceSurfaces?.nativeVisualMatrix?.markers?.includes('browser-fallback-visual-row') &&
			manifest?.evidenceSurfaces?.nativeVisualMatrix?.markers?.includes('data-native-visual-matrix') &&
			manifest?.evidenceSurfaces?.ultraGearSourceParity?.markers?.includes('ultraGearParityContract') &&
			manifest?.evidenceSurfaces?.ultraGearSourceParity?.markers?.includes('@scriptgpt/desktop-shell-ui') &&
			manifest?.evidenceSurfaces?.ultraGearSourceParity?.markers?.includes('desktopShellUiBinding') &&
			manifest?.evidenceSurfaces?.ultraGearSourceParity?.markers?.includes('enableMicaWindowChrome') &&
			manifest?.evidenceSurfaces?.ultraGearSourceParity?.markers?.includes('syncTaskbarProgress') &&
			manifest?.evidenceSurfaces?.ultraGearSourceParity?.markers?.includes('toggleWindowMaximize') &&
			manifest?.evidenceSurfaces?.ultraGearSourceParity?.markers?.includes('applyWindowChrome') &&
			manifest?.evidenceSurfaces?.ultraGearSourceParity?.markers?.includes('app-window.maximized') &&
			manifest?.evidenceSurfaces?.ultraGearSourceParity?.markers?.includes('DRAG_START_THRESHOLD_PX') &&
			manifest?.evidenceSurfaces?.ultraGearSourceParity?.markers?.includes('setPointerCapture') &&
			manifest?.evidenceSurfaces?.nativePlatformProvenance?.markers?.includes('lg-ultragear-native-platform-provenance') &&
			manifest?.evidenceSurfaces?.nativePlatformProvenance?.markers?.includes('macos-material-host-policy') &&
			manifest?.evidenceSurfaces?.nativePlatformProvenance?.markers?.includes('source-observed-macos-host-scaffold') &&
			manifest?.evidenceSurfaces?.nativePlatformProvenance?.markers?.includes('macos-native-vibrancy-unverified') &&
			manifest?.evidenceSurfaces?.nativePlatformProvenance?.markers?.includes('@scriptgpt/desktop-shell-ui') &&
			manifest?.evidenceSurfaces?.nativePlatformProvenance?.markers?.includes('desktopShellUiBinding') &&
			manifest?.evidenceSurfaces?.nativePlatformProvenance?.markers?.includes('enableMicaWindowChrome') &&
			manifest?.evidenceSurfaces?.nativePlatformProvenance?.markers?.includes('syncTaskbarProgress') &&
			manifest?.evidenceSurfaces?.nativePlatformProvenance?.markers?.includes('toggleWindowMaximize') &&
			manifest?.evidenceSurfaces?.nativePlatformProvenance?.markers?.includes('Effect.Mica') &&
			manifest?.evidenceSurfaces?.nativePlatformProvenance?.markers?.includes('win.setEffects') &&
			manifest?.evidenceSurfaces?.nativePlatformProvenance?.markers?.includes('app-window.maximized') &&
			manifest?.evidenceSurfaces?.nativePlatformProvenance?.markers?.includes('data-window-control-group') &&
			manifest?.evidenceSurfaces?.nativePlatformProvenance?.markers?.includes('setPointerCapture') &&
			manifest?.evidenceSurfaces?.nativePlatformProvenance?.markers?.includes('win.startDragging') &&
			manifest?.evidenceSurfaces?.nativePlatformProvenance?.markers?.includes('win.setProgressBar') &&
			manifest?.evidenceSurfaces?.nativePlatformProvenance?.markers?.includes('reportJson') &&
			manifest?.evidenceSurfaces?.progressReportHandoff?.markers?.includes('progressReportHandoff') &&
			manifest?.evidenceSurfaces?.progressReportHandoff?.markers?.includes('syncTaskbarProgress') &&
			manifest?.evidenceSurfaces?.progressReportHandoff?.markers?.includes('syncWindowProgress') &&
			manifest?.evidenceSurfaces?.progressReportHandoff?.markers?.includes('ProgressBarStatus.Indeterminate') &&
			manifest?.evidenceSurfaces?.progressReportHandoff?.markers?.includes('ProgressBarStatus.None') &&
			manifest?.evidenceSurfaces?.progressReportHandoff?.markers?.includes('report-ready') &&
			manifest?.evidenceSurfaces?.progressReportGraphic?.markers?.includes('progressReportHandoff') &&
			manifest?.evidenceSurfaces?.progressReportGraphic?.markers?.includes('statusMapping') &&
			manifest?.evidenceSurfaces?.progressReportGraphic?.markers?.includes('ProgressBarStatus.None') &&
			manifest?.evidenceSurfaces?.progressReportGraphic?.markers?.includes('report-ready') &&
			manifest?.evidenceSurfaces?.nativeHostBridgeStatus?.markers?.includes('data-native-host-bridge-status') &&
			manifest?.evidenceSurfaces?.nativeHostBridgeStatus?.markers?.includes('data-native-host-handoff-controls') &&
			manifest?.evidenceSurfaces?.nativeHostBridgeStatus?.markers?.includes('set-window-effect') &&
			manifest?.evidenceSurfaces?.nativeHostBridgeStatus?.markers?.includes('set-progress') &&
			manifest?.evidenceSurfaces?.nativeHostBridgeStatus?.markers?.includes('clear-progress') &&
			manifest?.evidenceSurfaces?.nativeHostBridgeStatus?.markers?.includes('report-ready') &&
			manifest?.evidenceSurfaces?.nativeHostBridgeStatus?.markers?.includes('window.__SVELTEKIT_PHP_NATIVE_HOST__') &&
			manifest?.evidenceSurfaces?.nativeHostBindingGuide?.markers?.includes('native host binding guide') &&
			manifest?.evidenceSurfaces?.nativeHostBindingGuide?.markers?.includes('@scriptgpt/desktop-shell-ui') &&
			manifest?.evidenceSurfaces?.nativeHostBindingGuide?.markers?.includes('desktopShellUiBinding') &&
			manifest?.evidenceSurfaces?.nativeHostBindingGuide?.markers?.includes('enableMicaWindowChrome') &&
			manifest?.evidenceSurfaces?.nativeHostBindingGuide?.markers?.includes('syncTaskbarProgress') &&
			manifest?.evidenceSurfaces?.nativeHostBindingGuide?.markers?.includes('toggleWindowMaximize') &&
			manifest?.evidenceSurfaces?.nativeHostBindingGuide?.markers?.includes('data-native-host-handoff-controls') &&
			manifest?.evidenceSurfaces?.nativeHostBindingGuide?.markers?.includes('set-window-effect') &&
			manifest?.evidenceSurfaces?.nativeHostBindingGuide?.markers?.includes('set-progress') &&
			manifest?.evidenceSurfaces?.nativeHostBindingGuide?.markers?.includes('report-ready') &&
			manifest?.evidenceSurfaces?.nativeHostWrapperSmoke?.markers?.includes('native-host-wrapper-smoke') &&
			manifest?.evidenceSurfaces?.nativeHostWrapperSmoke?.markers?.includes('native-host-wrapper-probe') &&
			manifest?.evidenceSurfaces?.nativeHostWrapperSmoke?.markers?.includes('deterministic-host-wrapper-handoff') &&
			manifest?.evidenceSurfaces?.nativeHostWrapperSmoke?.markers?.includes('native-host-wrapper-event-replay') &&
			manifest?.evidenceSurfaces?.nativeHostWrapperSmoke?.markers?.includes('native-host-wrapper-event-replay-step') &&
			manifest?.evidenceSurfaces?.nativeHostWrapperSmoke?.markers?.includes('realHostVerified') &&
			manifest?.evidenceSurfaces?.nativeHostWrapperSmoke?.markers?.includes('noNativeApiBoundary') &&
			manifest?.evidenceSurfaces?.nativeHostWrapperSmoke?.markers?.includes('window.__SVELTEKIT_PHP_NATIVE_HOST__') &&
			manifest?.evidenceSurfaces?.nativeHostWrapperSmoke?.markers?.includes('window.__SVELTEKIT_PHP_NATIVE_HOST_HISTORY__') &&
			manifest?.evidenceSurfaces?.nativeHostWrapperSmoke?.markers?.includes('TaskbarProgressState') &&
			manifest?.evidenceSurfaces?.nativeHostWrapperSmoke?.markers?.includes('enableMicaWindowChrome') &&
			manifest?.evidenceSurfaces?.nativeHostWrapperSmoke?.markers?.includes('syncTaskbarProgress') &&
			manifest?.evidenceSurfaces?.nativeHostWrapperSmoke?.markers?.includes('toggleWindowMaximize') &&
			manifest?.evidenceSurfaces?.nativeHostWrapperSmoke?.markers?.includes('expectedHistoryResult') &&
			manifest?.evidenceSurfaces?.nativeHostWrapperSmoke?.markers?.includes('expectedDesktopShellUiHelper') &&
			manifest?.evidenceSurfaces?.nativeHostWrapperSmoke?.markers?.includes('noFallbackAllowedForRealHost') &&
			manifest?.evidenceSurfaces?.communityEvidenceLedger?.markers?.includes('Community evidence coverage ledger') &&
			manifest?.evidenceSurfaces?.communityEvidenceLedger?.markers?.includes('Open-source analytics sources reviewers can audit first') &&
			manifest?.evidenceSurfaces?.communityKeywordSearchGraph?.markers?.includes('keywordSearchGraph') &&
			manifest?.evidenceSurfaces?.communityKeywordSearchGraph?.markers?.includes('analytics-linked-keyword-graph') &&
			manifest?.evidenceSurfaces?.communityKeywordSearchGraph?.markers?.includes('community-analytics-freshness-contract') &&
			manifest?.evidenceSurfaces?.communityKeywordSearchGraph?.markers?.includes('source-to-keyword-edge') &&
			manifest?.evidenceSurfaces?.communityKeywordSearchGraph?.markers?.includes('curated-signal-score') &&
			manifest?.evidenceSurfaces?.communityKeywordSearchGraph?.markers?.includes('collected-demand-score') &&
			manifest?.evidenceSurfaces?.communityKeywordSearchGraph?.markers?.includes('directional-community-signal') &&
			manifest?.evidenceSurfaces?.communityKeywordSearchGraph?.markers?.includes('no-live-community-api-runtime-boundary') &&
			manifest?.evidenceSurfaces?.communityKeywordSearchGraph?.markers?.includes('alpha-community-source-evidence-checklist') &&
			manifest?.evidenceSurfaces?.communityKeywordSearchGraph?.markers?.includes('source-health-classification') &&
			manifest?.evidenceSurfaces?.communityKeywordSearchGraph?.markers?.includes('result-total-field-contract') &&
			manifest?.evidenceSurfaces?.communityKeywordSearchGraph?.markers?.includes('top-result-field-contract') &&
			manifest?.evidenceSurfaces?.communityKeywordSearchGraph?.markers?.includes('sample-review-rule') &&
			manifest?.evidenceSurfaces?.communityAnalyticsFreshnessContract?.markers?.includes('community-analytics-freshness-contract') &&
			manifest?.evidenceSurfaces?.communityAnalyticsFreshnessContract?.markers?.includes('analyticsFreshnessContract') &&
			manifest?.evidenceSurfaces?.communityAnalyticsFreshnessContract?.markers?.includes('maxAgeHours') &&
			manifest?.evidenceSurfaces?.communityAnalyticsFreshnessContract?.markers?.includes('no-live-community-api-runtime-boundary') &&
			(manifest?.artifacts ?? []).every((artifact) => artifact.proofStage && artifact.trustLevel) &&
			(manifest?.runtimeEndpoints ?? []).every((endpoint) => endpoint.proofStage === 'runtime-source-endpoint' && endpoint.trustLevel === 'deterministic-runtime-evidence') &&
			(manifest?.artifacts ?? []).some(
				(artifact) =>
					artifact.path === 'report/alpha-community-analytics.json' &&
					artifact.proofStage === 'collected-public-source-data' &&
					artifact.trustLevel === 'directional-community-signal'
			) &&
			remoteSmokeArtifact?.proofStage === expectedHostedSmokeProofStage &&
			remoteSmokeArtifact?.trustLevel === expectedHostedSmokeTrustLevel &&
			remoteSmokeArtifact?.hostedSmokeStatus === (manifest?.hostedAlphaSmoke?.status ?? 'missing') &&
			manifestArtifacts.has('report/alpha-readiness.svg') &&
			manifestArtifacts.has('report/alpha-community-source-map.svg') &&
			manifestArtifacts.has('report/alpha-release-notes.md') &&
			manifestArtifacts.has('report/alpha-release-checklist.md') &&
			manifestArtifacts.has('report/alpha-gate-matrix.json') &&
			manifestArtifacts.has('report/alpha-evidence-index.json') &&
			manifestArtifacts.has('report/alpha-package-contract.json') &&
			manifestArtifacts.has('report/alpha-native-host-contract.json') &&
			manifestArtifacts.has('report/alpha-native-host-guide.md') &&
			manifestArtifacts.has('report/alpha-hosted-smoke-checklist.json') &&
			manifestArtifacts.has('docs/ALPHA-RELEASE-CHECKLIST.md') &&
			manifestArtifacts.has('report/alpha-readiness.csv') &&
			manifestArtifacts.has('report/alpha-bridge-reuse.json') &&
			manifestArtifacts.has('report/alpha-review-index.md') &&
			manifestArtifacts.has('report/alpha-community-signals.csv') &&
			manifestArtifacts.has('report/alpha-community-sources.csv') &&
			manifestArtifacts.has('report/alpha-community-analytics.md') &&
			manifestArtifacts.has('report/alpha-community-research-pack.json') &&
			manifestArtifacts.has('report/alpha-release-manifest.json') &&
			manifestArtifacts.has('report/alpha-community-analytics.json') &&
			manifestEndpoints.has('/alpha-readiness/report.json') &&
			manifestEndpoints.has('/alpha-readiness/report.html') &&
			manifestEndpoints.has('/alpha-readiness/report.md') &&
			manifestEndpoints.has('/alpha-readiness/release-notes.md') &&
			manifestEndpoints.has('/alpha-readiness/release-checklist.md') &&
			manifestEndpoints.has('/alpha-readiness/report.svg') &&
			manifestEndpoints.has('/alpha-readiness/community-source-map.svg') &&
			manifestEndpoints.has('/alpha-readiness/release-manifest.json') &&
			manifestEndpoints.has('/alpha-readiness/gate-matrix.json') &&
			manifestEndpoints.has('/alpha-readiness/evidence-index.json') &&
			manifestEndpoints.has('/alpha-readiness/package-contract.json') &&
			manifestEndpoints.has('/alpha-readiness/native-host-contract.json') &&
			manifestEndpoints.has('/alpha-readiness/native-host-guide.md') &&
			manifestEndpoints.has('/alpha-readiness/hosted-smoke-checklist.json') &&
			manifestEndpoints.has('/alpha-readiness/bridge-reuse.json') &&
			manifestEndpoints.has('/alpha-readiness/review-index.md') &&
			manifestEndpoints.has('/alpha-readiness/community-signals.json') &&
			manifestEndpoints.has('/alpha-readiness/community-analytics.md') &&
			manifestEndpoints.has('/alpha-readiness/community-research-pack.json') &&
			manifestEndpoints.has('/alpha-readiness/readiness.csv') &&
			manifestEndpoints.has('/alpha-readiness/community-signals.csv') &&
			manifestEndpoints.has('/alpha-readiness/community-sources.csv') &&
			manifest?.commands?.hostedGate === 'bun run alpha:gate:hosted' &&
			manifest?.hostedAlphaSmoke?.status &&
			hostedProofInterpretationOk
			? ok(
					'release-manifest',
					'Release manifest inventories artifacts, runtime endpoints, commands, hosted smoke status, and hosted smoke proof interpretation.'
				)
			: fail(
					'release-manifest',
					'Release manifest is missing artifact inventory, runtime endpoints, commands, hosted smoke status, or hosted smoke proof interpretation.'
				)
	);

	return checks;
}

export function summarizeChecks(checks) {
	const failed = checks.filter((check) => !check.ok);
	return {
		ok: failed.length === 0,
		passed: checks.length - failed.length,
		failed: failed.length,
		failures: failed
	};
}

async function readJson(relativePath) {
	return JSON.parse(await readFile(path.join(repoRoot, relativePath), 'utf8'));
}

async function ensureFile(relativePath) {
	await access(path.join(repoRoot, relativePath));
}

async function main() {
	for (const file of [...requiredSourceFiles, ...requiredGeneratedFiles]) {
		try {
			await ensureFile(file);
		} catch {
			console.error(`Missing required alpha readiness file: ${file}`);
			console.error('Run `bun run alpha:report:full` before `bun run verify:alpha` if generated report files are missing.');
			process.exit(1);
		}
	}

	const packageJson = await readJson('package.json');
	const gitignore = await readFile(path.join(repoRoot, '.gitignore'), 'utf8');
	const generated = {
		analytics: await readJson('report/alpha-community-analytics.json'),
		fullReport: await readJson('report/alpha-readiness.full.json'),
		manifest: await readJson('report/alpha-release-manifest.json'),
		communityResearchPack: await readJson('report/alpha-community-research-pack.json'),
		bridgeReuse: await readJson('report/alpha-bridge-reuse.json'),
		gateMatrix: await readJson('report/alpha-gate-matrix.json'),
		evidenceIndex: await readJson('report/alpha-evidence-index.json'),
		packageContract: await readJson('report/alpha-package-contract.json'),
		nativeHostContract: await readJson('report/alpha-native-host-contract.json'),
		nativeHostGuide: await readFile(path.join(repoRoot, 'report/alpha-native-host-guide.md'), 'utf8'),
		nativeHostWrapperSmoke: await readJson('report/alpha-native-host-wrapper-smoke.json'),
		hostedSmokeChecklist: await readJson('report/alpha-hosted-smoke-checklist.json'),
		alphaPage: await readFile(path.join(repoRoot, 'src/routes/alpha-readiness/+page.svelte'), 'utf8'),
		nativeWindowShellSource: await readFile(
			path.join(repoRoot, 'src/lib/components/native-shell/NativeWindowShell.svelte'),
			'utf8'
		),
		nativeTitlebarSource: await readFile(
			path.join(repoRoot, 'src/lib/components/native-shell/NativeTitlebar.svelte'),
			'utf8'
		),
		nativeHostBridgeStatusSource: await readFile(
			path.join(repoRoot, 'src/lib/components/native-shell/NativeHostBridgeStatus.svelte'),
			'utf8'
		),
		nativeHostBridgeSource: await readFile(
			path.join(repoRoot, 'src/lib/native-shell/native-host-event-bridge.ts'),
			'utf8'
		),
		noHydrationConfigSource: await readFile(
			path.join(repoRoot, 'src/routes/alpha-readiness/no-hydration/+page.ts'),
			'utf8'
		),
		noHydrationPageSource: await readFile(
			path.join(repoRoot, 'src/routes/alpha-readiness/no-hydration/+page.svelte'),
			'utf8'
		),
		releaseChecklistSource: await readFile(path.join(repoRoot, 'src/lib/alpha-release-checklist.ts'), 'utf8'),
		releaseChecklistEndpointSource: await readFile(
			path.join(repoRoot, 'src/routes/alpha-readiness/release-checklist.md/+server.ts'),
			'utf8'
		),
		html: await readFile(path.join(repoRoot, 'report/alpha-readiness.html'), 'utf8'),
		markdown: await readFile(path.join(repoRoot, 'report/alpha-readiness.md'), 'utf8'),
		communityAnalyticsMarkdown: await readFile(path.join(repoRoot, 'report/alpha-community-analytics.md'), 'utf8'),
		releaseNotes: await readFile(path.join(repoRoot, 'report/alpha-release-notes.md'), 'utf8'),
		releaseChecklist: await readFile(path.join(repoRoot, 'report/alpha-release-checklist.md'), 'utf8'),
		reviewIndex: await readFile(path.join(repoRoot, 'report/alpha-review-index.md'), 'utf8'),
		svg: await readFile(path.join(repoRoot, 'report/alpha-readiness.svg'), 'utf8'),
		sourceMapSvg: await readFile(path.join(repoRoot, 'report/alpha-community-source-map.svg'), 'utf8'),
		readinessCsv: await readFile(path.join(repoRoot, 'report/alpha-readiness.csv'), 'utf8'),
		communitySignalsCsv: await readFile(path.join(repoRoot, 'report/alpha-community-signals.csv'), 'utf8'),
		communitySourcesCsv: await readFile(path.join(repoRoot, 'report/alpha-community-sources.csv'), 'utf8'),
		latestSvelteKitAudit: await readFile(
			path.join(repoRoot, 'docs/ALPHA-LATEST-SVELTEKIT-AUDIT.md'),
			'utf8'
		),
		latestSvelteKitAuditVerifier: await readFile(
			path.join(repoRoot, 'scripts/verify-latest-sveltekit-audit.mjs'),
			'utf8'
		),
		latestSameMajorSmoke: await readFile(
			path.join(repoRoot, 'scripts/smoke-latest-same-major.mjs'),
			'utf8'
		),
		latestViteMajorSmoke: await readFile(
			path.join(repoRoot, 'scripts/smoke-latest-vite-major.mjs'),
			'utf8'
		),
		remoteFunctionsPolicy: await readFile(
			path.join(repoRoot, 'docs/REMOTE-FUNCTIONS-ALPHA-POLICY.md'),
			'utf8'
		),
		remoteFunctionsVerifier: await readFile(
			path.join(repoRoot, 'scripts/verify-remote-functions-policy.mjs'),
			'utf8'
		),
		adapterSource:
			(await readFile(path.join(repoRoot, 'adapter/src/index.ts'), 'utf8')) +
			'\n' +
			(await readFile(path.join(repoRoot, 'adapter/src/utils/guards.ts'), 'utf8'))
	};

	const checks = checkAlphaReadinessContract({
		report: buildAlphaReadinessReport(),
		packageJson,
		gitignore,
		generated
	});
	const summary = summarizeChecks(checks);

	for (const check of checks) {
		console.log(`${check.ok ? 'PASS' : 'FAIL'} ${check.id}: ${check.message}`);
	}

	console.log(`Alpha readiness gate: ${summary.passed} passed, ${summary.failed} failed.`);

	if (!summary.ok) {
		process.exit(1);
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	await main();
}


