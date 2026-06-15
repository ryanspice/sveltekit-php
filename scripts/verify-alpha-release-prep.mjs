import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { requiredAlphaEvidence } from '../src/lib/alpha-required-evidence.ts';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const requiredEnvKeys = [
	'SK_BASE_PATH',
	'DEPLOY_BASE',
	'ADAPTER_MODE',
	'ADAPTER_OUT',
	'ADAPTER_ASSETS',
	'ADAPTER_BASE_MODE',
	'ADAPTER_FALLBACK',
	'PRECOMPRESS',
	'DEPLOY_PROFILE',
	'DEPLOY_HOST',
	'DEPLOY_USER',
	'DEPLOY_PORT',
	'DEPLOY_REMOTE',
	'DEPLOY_LOCAL',
	'DEPLOY_THRESHOLD_FILES',
	'DEPLOY_THRESHOLD_BYTES',
	'ALPHA_SMOKE_BASE_URL',
	'ALPHA_SMOKE_EXPECTED_VERSION',
	'ALPHA_SMOKE_TIMEOUT_MS',
	'ALPHA_SMOKE_REPORT_PATH'
];

const deploySecretKeys = new Set(['DEPLOY_PROFILE', 'DEPLOY_HOST', 'DEPLOY_USER', 'DEPLOY_REMOTE']);
const safeCommittedKeys = new Set([
	'SK_BASE_PATH',
	'DEPLOY_BASE',
	'ADAPTER_MODE',
	'ADAPTER_OUT',
	'ADAPTER_ASSETS',
	'ADAPTER_BASE_MODE',
	'ADAPTER_FALLBACK',
	'PRECOMPRESS',
	'DEPLOY_PORT',
	'DEPLOY_LOCAL',
	'DEPLOY_THRESHOLD_FILES',
	'DEPLOY_THRESHOLD_BYTES',
	'ALPHA_SMOKE_BASE_URL',
	'ALPHA_SMOKE_EXPECTED_VERSION',
	'ALPHA_SMOKE_TIMEOUT_MS',
	'ALPHA_SMOKE_REPORT_PATH'
]);

const placeholderPattern = /^(|<[^>]+>|CHANGE_ME|CHANGEME|TODO|TBD|PLACEHOLDER|EXAMPLE|YOUR_.+)$/i;

function stripInlineComment(value) {
	let quote = '';
	for (let index = 0; index < value.length; index += 1) {
		const char = value[index];
		if ((char === '"' || char === "'") && (!quote || quote === char)) {
			quote = quote ? '' : char;
			continue;
		}
		if (char === '#' && !quote && (index === 0 || /\s/.test(value[index - 1] ?? ''))) {
			return value.slice(0, index).trim();
		}
	}
	return value.trim();
}

function normalizeEnvValue(value) {
	const stripped = stripInlineComment(value);
	if (
		(stripped.startsWith('"') && stripped.endsWith('"')) ||
		(stripped.startsWith("'") && stripped.endsWith("'"))
	) {
		return stripped.slice(1, -1).trim();
	}
	return stripped;
}

function parseEnvFile(text) {
	const entries = new Map();

	for (const [lineIndex, line] of text.split(/\r?\n/).entries()) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) {
			continue;
		}

		const separator = trimmed.indexOf('=');
		if (separator === -1) {
			throw new Error(`Invalid env line ${lineIndex + 1}: expected KEY=VALUE.`);
		}

		const key = trimmed.slice(0, separator).trim();
		const value = normalizeEnvValue(trimmed.slice(separator + 1));

		if (!/^[A-Z][A-Z0-9_]*$/.test(key)) {
			throw new Error(`Invalid env key on line ${lineIndex + 1}: ${key}`);
		}

		entries.set(key, value);
	}

	return entries;
}

async function readOptionalText(relativePath) {
	try {
		return await readFile(path.join(repoRoot, relativePath), 'utf8');
	} catch (error) {
		if (error?.code === 'ENOENT') {
			return null;
		}
		throw error;
	}
}

function isPlaceholder(value) {
	return placeholderPattern.test(value.trim());
}

function validateSafeCommittedValue(key, value) {
	if (isPlaceholder(value)) {
		return;
	}

	if (deploySecretKeys.has(key)) {
		throw new Error(`${key} must be empty or a placeholder in committed env files.`);
	}

	if (!safeCommittedKeys.has(key)) {
		throw new Error(`${key} is not allowlisted for committed env files.`);
	}

	if (key === 'ADAPTER_MODE' && !['php-static', 'js-ssr'].includes(value)) {
		throw new Error(`${key} must be php-static, js-ssr, empty, or a placeholder.`);
	}

	if (key === 'ADAPTER_BASE_MODE' && !['fixed', 'dynamic'].includes(value)) {
		throw new Error(`${key} must be fixed, dynamic, empty, or a placeholder.`);
	}

	if (key === 'PRECOMPRESS' && !['true', 'false'].includes(value)) {
		throw new Error(`${key} must be true, false, empty, or a placeholder.`);
	}

	if (key === 'DEPLOY_PORT') {
		const port = Number(value);
		if (!Number.isInteger(port) || port < 1 || port > 65535) {
			throw new Error(`${key} must be a valid port, empty, or a placeholder.`);
		}
	}

	if (key.startsWith('DEPLOY_THRESHOLD_')) {
		const threshold = Number(value);
		if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1) {
			throw new Error(`${key} must be a number between 0 and 1, empty, or a placeholder.`);
		}
	}

	if (key === 'ALPHA_SMOKE_BASE_URL') {
		let url;
		try {
			url = new URL(value);
		} catch {
			throw new Error(`${key} must be a valid HTTP(S) URL, empty, or a placeholder.`);
		}
		if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search) {
			throw new Error(`${key} must be an HTTP(S) URL without credentials or query values.`);
		}
	}

	if (key === 'ALPHA_SMOKE_EXPECTED_VERSION' && !/^1\.0\.2-alpha\.\d+$/.test(value)) {
		throw new Error(`${key} must stay on the 1.0.2-alpha track, empty, or a placeholder.`);
	}

	if (key === 'ALPHA_SMOKE_TIMEOUT_MS') {
		const timeout = Number(value);
		if (!Number.isInteger(timeout) || timeout < 1000 || timeout > 60000) {
			throw new Error(`${key} must be between 1000 and 60000, empty, or a placeholder.`);
		}
	}

	if (['ADAPTER_OUT', 'ADAPTER_ASSETS', 'DEPLOY_LOCAL', 'ALPHA_SMOKE_REPORT_PATH'].includes(key)) {
		if (path.isAbsolute(value) || /^[A-Z]:\\/i.test(value) || value.includes('..')) {
			throw new Error(`${key} must not use an absolute or parent-relative path in committed env files.`);
		}
	}
}

async function verifyEnvFiles() {
	const exampleText = await readOptionalText('.env.example');
	if (!exampleText) {
		throw new Error('.env.example is required for alpha release prep.');
	}

	const exampleEntries = parseEnvFile(exampleText);
	const missingExampleKeys = requiredEnvKeys.filter((key) => !exampleEntries.has(key));
	if (missingExampleKeys.length > 0) {
		throw new Error(`.env.example is missing required keys: ${missingExampleKeys.join(', ')}`);
	}

	for (const [key, value] of exampleEntries) {
		validateSafeCommittedValue(key, value);
	}

	const envText = await readOptionalText('.env');
	if (envText) {
		const envEntries = parseEnvFile(envText);
		for (const [key, value] of envEntries) {
			validateSafeCommittedValue(key, value);
		}
		console.log(`PASS env-safety: .env has ${envEntries.size} checked keys and no deploy secrets.`);
	} else {
		console.log('PASS env-safety: .env is absent; .env.example defines the public template.');
	}

	console.log(`PASS env-example: .env.example defines ${requiredEnvKeys.length} release-prep keys.`);
}

async function verifyPackageMetadata() {
	const packageJson = JSON.parse(await readFile(path.join(repoRoot, 'package.json'), 'utf8'));

	if (packageJson.name !== 'sveltekit-php') {
		throw new Error(`Unexpected package name: ${packageJson.name}`);
	}

	if (!/^1\.0\.2-alpha\.\d+$/.test(packageJson.version)) {
		throw new Error(`Package version must stay on the 1.0.2-alpha track, received ${packageJson.version}.`);
	}

	if (packageJson.private !== false) {
		throw new Error('package.json must set private:false for alpha publish readiness.');
	}

	if (packageJson.publishConfig?.tag !== 'alpha') {
		throw new Error('package.json publishConfig.tag must stay alpha; do not publish alpha evidence as latest, rc, or stable.');
	}

	const releasePolicy = packageJson.sveltekitPhpReleasePolicy;
	if (
		releasePolicy?.marker !== 'alpha-over-rc-release-policy' ||
		releasePolicy?.channel !== 'alpha' ||
		releasePolicy?.track !== '1.0.2-alpha' ||
		releasePolicy?.rank !== 'above-rc' ||
		!(releasePolicy?.disallowedDistTags ?? []).includes('latest') ||
		!(releasePolicy?.disallowedDistTags ?? []).includes('rc') ||
		!(releasePolicy?.disallowedDistTags ?? []).includes('stable')
	) {
		throw new Error('package.json must carry the alpha-over-rc release policy and disallow latest, rc, and stable dist-tags.');
	}

	if (!Array.isArray(releasePolicy.requiredEvidence)) {
		throw new Error('package.json sveltekitPhpReleasePolicy.requiredEvidence must be an array.');
	}

	const missingRequiredEvidence = requiredAlphaEvidence.filter((marker) => !releasePolicy.requiredEvidence.includes(marker));
	const unexpectedRequiredEvidence = releasePolicy.requiredEvidence.filter((marker) => !requiredAlphaEvidence.includes(marker));
	const reorderedRequiredEvidence = requiredAlphaEvidence.filter((marker, index) => releasePolicy.requiredEvidence[index] !== marker);

	if (missingRequiredEvidence.length > 0 || unexpectedRequiredEvidence.length > 0 || reorderedRequiredEvidence.length > 0) {
		const details = [
			missingRequiredEvidence.length > 0 ? `missing: ${missingRequiredEvidence.join(', ')}` : '',
			unexpectedRequiredEvidence.length > 0 ? `unexpected: ${unexpectedRequiredEvidence.join(', ')}` : '',
			reorderedRequiredEvidence.length > 0 ? `out-of-order: ${reorderedRequiredEvidence.join(', ')}` : ''
		].filter(Boolean);

		throw new Error(
			`package.json sveltekitPhpReleasePolicy.requiredEvidence must match src/lib/alpha-required-evidence.ts exactly (${details.join('; ')}).`
		);
	}

	if (packageJson.exports?.['./adapter'] !== './adapter/index.js') {
		throw new Error('package.json must export ./adapter to ./adapter/index.js.');
	}

	for (const fileName of [
		'adapter/index.js',
		'README.md',
		'docs/ALPHA-READINESS.md',
		'docs/ALPHA-RELEASE-CHECKLIST.md'
	]) {
		if (!(packageJson.files ?? []).includes(fileName)) {
			throw new Error(`package.json files must include ${fileName}.`);
		}
	}

	for (const scriptName of [
		'build:adapter',
		'alpha:gate',
		'alpha:gate:hosted',
		'alpha:consumer:smoke',
		'alpha:remote:placeholder',
		'alpha:remote:smoke',
		'alpha:report:full',
		'verify:artifacts',
		'verify:alpha',
		'verify:release-prep'
	]) {
		if (!packageJson.scripts?.[scriptName]) {
			throw new Error(`package.json is missing required script: ${scriptName}`);
		}
	}

	console.log(`PASS package-alpha: ${packageJson.name}@${packageJson.version} is publish-shaped with ${requiredAlphaEvidence.length} required evidence markers.`);
}

async function verifyAlphaReleaseChecklistDoc() {
	const checklist = await readFile(path.join(repoRoot, 'docs', 'ALPHA-RELEASE-CHECKLIST.md'), 'utf8');
	const requiredMarkers = [
		'1.0.2-alpha release checklist',
		'alpha-over-rc-release-policy',
		'desktop-shell-ui-command-mapping',
		'community-analytics-csv-linkage',
		'router-path-safety-artifact-sync',
		'deploy-env-preflight-safety',
		'bun run alpha:gate',
		'bun run alpha:gate:hosted',
		'getDesktopShellUiCommandMapping',
		'toDesktopShellUiTaskbarProgressState',
		'TaskbarProgressState',
		'saveInFlight',
		'hasQueuedSave',
		'sourceToKeywordEdge',
		'weighted_demand_score',
		'ALPHA_SMOKE_BASE_URL'
	];
	const missingMarkers = requiredMarkers.filter((marker) => !checklist.includes(marker));

	if (missingMarkers.length > 0) {
		throw new Error(`docs/ALPHA-RELEASE-CHECKLIST.md is missing required markers: ${missingMarkers.join(', ')}`);
	}

	console.log('PASS alpha-release-checklist: human alpha release checklist covers policy, native mapping, CSV linkage, runtime safety, and hosted proof.');
}

async function verifyAlphaReleaseChecklistRuntimeContract() {
	const releaseChecklistSource = await readFile(path.join(repoRoot, 'src', 'lib', 'alpha-release-checklist.ts'), 'utf8');
	const releaseChecklistEndpoint = await readFile(
		path.join(repoRoot, 'src', 'routes', 'alpha-readiness', 'release-checklist.md', '+server.ts'),
		'utf8'
	);
	const exportPipeline = await readFile(path.join(repoRoot, 'scripts', 'export-alpha-readiness.mjs'), 'utf8');
	const manifestSource = await readFile(path.join(repoRoot, 'src', 'lib', 'alpha-release-manifest.ts'), 'utf8');
	const evidenceIndexSource = await readFile(path.join(repoRoot, 'src', 'lib', 'alpha-evidence-index.ts'), 'utf8');
	const gateMatrixSource = await readFile(path.join(repoRoot, 'src', 'lib', 'alpha-gate-matrix.ts'), 'utf8');
	const hostedChecklistSource = await readFile(path.join(repoRoot, 'src', 'lib', 'alpha-hosted-smoke-checklist.ts'), 'utf8');
	const reviewIndexSource = await readFile(path.join(repoRoot, 'src', 'lib', 'alpha-review-index.ts'), 'utf8');
	const packageContractSource = await readFile(path.join(repoRoot, 'src', 'lib', 'alpha-package-contract.ts'), 'utf8');
	const joined = [
		releaseChecklistSource,
		releaseChecklistEndpoint,
		exportPipeline,
		manifestSource,
		evidenceIndexSource,
		gateMatrixSource,
		hostedChecklistSource,
		reviewIndexSource,
		packageContractSource
	].join('\n');
	const requiredMarkers = [
		'renderAlphaReleaseChecklistMarkdown',
		'1.0.2-alpha release checklist',
		'alpha-over-rc-release-policy',
		'desktop-shell-ui-command-mapping',
		'community-analytics-csv-linkage',
		'router-path-safety-artifact-sync',
		'deploy-env-preflight-safety',
		'sourceToKeywordEdge',
		'weighted_demand_score',
		'ALPHA_SMOKE_BASE_URL',
		'/alpha-readiness/release-checklist.md',
		'release-checklist-markdown-endpoint',
		'report/alpha-release-checklist.md',
		'alphaReleaseChecklist',
		'alphaReleaseChecklistProof',
		'source-controlled-release-documentation',
		'generatedArtifact',
		'coveredEndpoints',
		'contentExpectations'
	];
	const missingMarkers = requiredMarkers.filter((marker) => !joined.includes(marker));

	if (missingMarkers.length > 0) {
		throw new Error(`Alpha release checklist runtime contract is missing required markers: ${missingMarkers.join(', ')}`);
	}

	console.log('PASS alpha-release-checklist-runtime: release checklist is source-rendered, exported, manifested, indexed, and smoke-covered.');
}

async function verifyNoLeftoverTarballs() {
	const entries = await readdir(repoRoot);
	const leftoverTarballs = entries.filter((entry) => /^sveltekit-php-\d.+\.tgz$/.test(entry));

	if (leftoverTarballs.length > 0) {
		throw new Error(`Remove leftover package tarballs before release prep: ${leftoverTarballs.join(', ')}`);
	}

	console.log('PASS package-cleanup: no leftover root package tarballs.');
}

async function verifyCiWorkflow() {
	const workflow = await readFile(path.join(repoRoot, '.github', 'workflows', 'alpha-gate.yml'), 'utf8');
	const ciWorkflow = await readFile(path.join(repoRoot, '.github', 'workflows', 'playwright.yml'), 'utf8');
	const requiredMarkers = [
		'name: Alpha Gate',
		'bun run alpha:gate',
		'bun run alpha:gate:hosted',
		'ALPHA_SMOKE_BASE_URL',
		'shivammathur/setup-php@v2',
		'bunx playwright install --with-deps',
		'path: report/'
	];
	const requiredCiMarkers = [
		'name: CI',
		'bun run build:adapter',
		'bun run verify:artifacts -- --strict',
		'bun run verify:release-prep',
		'bun run test:unit',
		'bun scripts/verify-all.mjs --mode=php-static --skipBuild',
		'bun scripts/verify-all.mjs --mode=all --skipBuild'
	];
	const missingMarkers = [
		...requiredMarkers.filter((marker) => !workflow.includes(marker)),
		...requiredCiMarkers.filter((marker) => !ciWorkflow.includes(marker))
	];

	if (missingMarkers.length > 0) {
		throw new Error(`CI workflows are missing required markers: ${missingMarkers.join(', ')}`);
	}

	console.log('PASS ci-alpha: CI workflows cover local/hosted alpha gates, strict artifact sync, and release-prep checks.');
}

async function verifyHostedGateWrapper() {
	const wrapper = await readFile(path.join(repoRoot, 'scripts', 'run-hosted-alpha-gate.mjs'), 'utf8');
	const remoteSmokeIndex = wrapper.indexOf("args: ['run', 'alpha:remote:smoke']");
	const reportIndex = wrapper.indexOf("args: ['run', 'alpha:report']");
	const verifyIndex = wrapper.indexOf("args: ['run', 'verify:alpha']");

	if (remoteSmokeIndex === -1 || reportIndex === -1 || verifyIndex === -1) {
		throw new Error('Hosted alpha gate must run remote smoke, alpha report export, and verify:alpha.');
	}

	if (!(remoteSmokeIndex < reportIndex && reportIndex < verifyIndex)) {
		throw new Error('Hosted alpha gate must regenerate and verify reports after remote smoke.');
	}

	console.log('PASS hosted-gate: Hosted gate embeds remote smoke into verified alpha reports.');
}

async function verifyRemoteSmokeCoverage() {
	const smoke = await readFile(path.join(repoRoot, 'scripts', 'smoke-remote-alpha.mjs'), 'utf8');
	const requiredMarkers = [
		"path: 'alpha-readiness/report.json'",
		"expectedContentType: 'application/json'",
		'data-ultragear-source-parity',
		'ultraGearParityContract',
		'data-progress-report-handoff',
		'progressReportHandoff',
		'statusMapping',
		'ProgressBarStatus.None',
		'report-ready',
		'data-native-visual-matrix',
		'native-visual-matrix',
		'windows-mica-visual-row',
		'macos-traffic-light-row',
		'data-alpha-proof-ledger',
		'proofLedger',
		'Alpha proof ledger',
		'alpha-runtime-gate-ledger',
		'hosted-php-smoke-proof-required',
		'needs-local-gate-proof',
		'needs-hosted-proof',
		'data-community-keyword-search-graph',
		'data-analytics-linked-keyword-graph',
		'keywordSearchGraph',
		'analytics-linked-keyword-graph',
		'curated-signal-score',
		'collected-demand-score',
		'directional-community-signal',
		'source-to-keyword-edge',
		"path: 'alpha-readiness/report.md'",
		"expectedContentType: 'text/markdown'",
		'UltraGear source parity',
		'UltraGear native platform provenance',
		'lg-ultragear-native-platform-provenance',
		'data-desktop-shell-ui-binding',
		'desktopShellUiBinding',
		'@scriptgpt/desktop-shell-ui',
		'enableMicaWindowChrome',
		'syncTaskbarProgress',
		'toggleWindowMaximize',
		'installSvelteKitPhpNativeHost',
		'data-drag-block-selector',
		'caption-button',
		'progressStatus',
		'indeterminate',
		'Effect.Mica',
		'win.startDragging',
		'reportJson',
		'UltraGear progress and report handoff',
		'keywordSearchGraph',
		'source-to-keyword-edge',
		"path: 'alpha-readiness/release-notes.md'",
		'alpha-over-rc-release-policy',
		'track 1.0.2-alpha',
		'rank above-rc',
		'Alpha proof ledger',
		'alpha-runtime-gate-ledger',
		'hosted-php-smoke-proof-required',
		'nativePlatformProvenance',
		'lg-ultragear-native-platform-provenance',
		'ALPHA_SMOKE_BASE_URL',
		'ALPHA_SMOKE_TIMEOUT_MS',
		'ALPHA_SMOKE_REPORT_PATH',
		"path: 'alpha-readiness/release-checklist.md'",
		'release-checklist-markdown-endpoint',
		'report/alpha-release-checklist.md',
		'/alpha-readiness/release-checklist.md',
		'alphaReleaseChecklistProof',
		'bun run alpha:gate:hosted',
		'sourceToKeywordEdge',
		'weighted_demand_score',
		"path: 'alpha-readiness/report.html'",
		'Native-styled release report',
		'data-native-platform-provenance',
		'data-native-host-handoff-controls',
		"path: 'alpha-readiness/report.svg'",
		'data-alpha-proof-ledger',
		'data-native-platform-provenance',
		'lg-ultragear-native-platform-provenance',
		'proofLedger blockers',
		'needs-local-gate-proof',
		'needs-hosted-proof',
		"path: 'alpha-readiness/community-source-map.svg'",
		'community source map',
		'keyword-search-graph',
		'analytics-linked-keyword-graph',
		'source-to-keyword-edge',
		'supported-api-lanes',
		'manual-research-lanes',
		'curated-signal-score',
		'collected-demand-score',
		'directional-community-signal',
		"expectedContentType: 'image/svg+xml'",
		"path: 'alpha-readiness/release-manifest.json'",
		'release-manifest-json-endpoint',
		'alphaReleaseChecklist',
		'source-controlled-release-documentation',
		'docs/ALPHA-RELEASE-CHECKLIST.md',
		'releasePolicy',
		'proofLedger',
		'alpha-over-rc-release-policy',
		'1.0.2-alpha',
		'above-rc',
		'mustNotUseCandidateLabels',
		'disallowedCandidateLabels',
		'projectRankPolicy',
		'alphaOverRcPolicyProof',
		'SemVer note',
		'1.0.2-alpha is the required pre-stable release label',
		'Project-rank policy',
		'alpha-runtime-gate-ledger',
		'hosted-php-smoke-proof-required',
		'nativeChromeVisualContract',
		'nativeVisualMatrix',
		'ultraGearSourceParity',
		'nativePlatformProvenance',
		'lg-ultragear-native-platform-provenance',
		'progressReportHandoff',
		'progressReportGraphic',
		'communityKeywordSearchGraph',
		"path: 'alpha-readiness/bridge-reuse.json'",
		'NativeWindowShell.svelte',
		'ValidationView.svelte',
		'ultraGearParityContract',
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
		'ProgressBarStatus.Indeterminate',
		'ProgressBarStatus.None',
		'report-ready',
		'DRAG_START_THRESHOLD_PX',
		'Structured report preview',
		"path: 'alpha-readiness/review-index.md'",
		'alpha reviewer index',
		'releasePolicy.channel=alpha',
		'releasePolicy.track=1.0.2-alpha',
		'releasePolicy.rank=above-rc',
		'Alpha proof ledger',
		'alpha-runtime-gate-ledger',
		'hosted-php-smoke-proof-required',
		'lg-ultragear-native-platform-provenance',
		"path: 'alpha-readiness/gate-matrix.json'",
		'local-alpha-gate',
		'hosted-alpha-gate',
		'live-evidence-surfaces',
		'required-alpha-evidence',
		'requiredEvidence',
		'release-policy-evidence-boundary',
		'live-runtime-surface-proof',
		'artifact-sync',
		'report/alpha-bridge-reuse.json',
		'native platform provenance',
		'Native platform provenance markers',
		'report/alpha-readiness.json',
		"path: 'alpha-readiness/evidence-index.json'",
		'alpha-remote-smoke.json',
		'liveEvidenceSurfaces',
		'alpha-release-checklist',
		'native-host-bridge-status',
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
		'community-evidence-coverage-ledger',
		"path: 'alpha-readiness/package-contract.json'",
		'sveltekit-php/adapter',
		'publishConfig',
		'alpha-over-rc-release-policy',
		'above-rc',
		'verify:artifacts',
		'precheck:deploy',
		'source-to-generated-bundle-check',
		'environment-preflight-check',
		'nativePlatformProvenanceProof',
		'lg-ultragear-native-platform-provenance',
		'nativeHostBindingGuideProof',
		'native host binding guide',
		'/alpha-readiness/native-host-guide.md',
		'report/alpha-native-host-guide.md',
		'desktopShellUiBinding',
		'installSvelteKitPhpNativeHost',
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
		'data-drag-block-selector',
		'caption-button',
		'progressStatus',
		'indeterminate',
		'data-required-alpha-evidence',
		'Required alpha evidence',
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
		"path: 'alpha-readiness/native-host-contract.json'",
		'data-window-drag',
		"path: 'alpha-readiness/native-host-guide.md'",
		'native host binding guide',
		'set-window-effect',
		'set-progress',
		'clear-progress',
		'setWindowEffect',
		'setProgress',
		'clearProgress',
		'reportReady',
		"path: 'alpha-readiness/hosted-smoke-checklist.json'",
		'requires-external-host',
		"path: 'alpha-readiness/community-signals.json'",
		'GitHub repos',
		"path: 'alpha-readiness/community-analytics.md'",
		'Keyword research map',
		"path: 'alpha-readiness/community-research-pack.json'",
		'supported-json-api',
		'manual-research-link',
		'analyticsFreshnessContract',
		'community-analytics-freshness-contract',
		'maxAgeHours',
		'community-analytics-graphic-linkage-contract',
		'communityAnalyticsGraphicLinkageContract',
		'community-source-map.svg',
		'community-analytics.md',
		'community-signals.csv',
		'community-sources.csv',
		"path: 'alpha-readiness/readiness.csv'",
		"path: 'alpha-readiness/community-signals.csv'",
		"path: 'alpha-readiness/community-sources.csv'",
		'analytics-linked-keyword-graph',
		'curated-signal-score',
		'collected-demand-score',
		'directional-community-signal',
		'source_host',
		'weighted_demand_score',
		'source_to_keyword_edges',
		'collection_method',
		'freshness_max_age_hours',
		'evidence_weight',
		'trust_boundary',
		'analytics_linkage_marker',
		'source_to_keyword_edge',
		'manual_review_required',
		"expectedContentType: 'text/csv'",
		'proof-ledger',
		'hosted-php-smoke-proof-required',
		"expectedContentType: 'text/html'",
		'alpha-remote-smoke',
		'assertContentTypeIncludes',
		'assertNoForbiddenLeaks',
		'forbiddenLeakMarkers'
	];
	const missingMarkers = requiredMarkers.filter((marker) => !smoke.includes(marker));

	if (missingMarkers.length > 0) {
		throw new Error(`Remote alpha smoke is missing required coverage markers: ${missingMarkers.join(', ')}`);
	}

	console.log('PASS remote-smoke-contract: Hosted smoke covers JSON, SVG, form action, content types, and leak guards.');
}

async function verifyLocalReportPipeline() {
	const packageJson = JSON.parse(await readFile(path.join(repoRoot, 'package.json'), 'utf8'));
	const reportFull = packageJson.scripts?.['alpha:report:full'] ?? '';
	const placeholder = packageJson.scripts?.['alpha:remote:placeholder'] ?? '';

	if (!placeholder.includes('smoke-remote-alpha.mjs --skip')) {
		throw new Error('alpha:remote:placeholder must record skipped hosted evidence deterministically.');
	}

	if (!reportFull.includes('alpha:remote:placeholder') || !reportFull.includes('alpha:report')) {
		throw new Error('alpha:report:full must write hosted placeholder evidence before exporting reports.');
	}

	if (!(reportFull.indexOf('alpha:remote:placeholder') < reportFull.indexOf('alpha:report'))) {
		throw new Error('alpha:report:full must run hosted placeholder evidence before alpha:report.');
	}

	console.log('PASS report-pipeline: Local report exports include deterministic hosted evidence.');
}

async function verifyAlphaGateArtifactSyncIsStrict() {
	const gate = await readFile(path.join(repoRoot, 'scripts', 'run-alpha-release-gate.mjs'), 'utf8');
	const artifactStepIndex = gate.indexOf("name: 'Verify generated adapter artifacts'");
	const strictArgsIndex = gate.indexOf("args: ['run', 'verify:artifacts', '--', '--strict']");

	if (artifactStepIndex === -1 || strictArgsIndex === -1) {
		throw new Error('Alpha release gate must run verify:artifacts in strict mode.');
	}

	if (artifactStepIndex > strictArgsIndex) {
		throw new Error('Alpha release gate strict artifact sync args must belong to the artifact verification step.');
	}

	console.log('PASS alpha-gate-artifact-sync: Alpha gate fails on stale generated adapter artifacts.');
}

async function verifyDeployPrecheckContract() {
	const config = await readFile(path.join(repoRoot, 'scripts', 'utils', 'config.mjs'), 'utf8');
	const precheck = await readFile(path.join(repoRoot, 'scripts', 'deploy-precheck.mjs'), 'utf8');
	const hostedGate = await readFile(path.join(repoRoot, 'scripts', 'run-hosted-alpha-gate.mjs'), 'utf8');
	const deployBuild = await readFile(path.join(repoRoot, 'tools', 'deploy-build.ts'), 'utf8');
	const requiredMarkers = [
		'assertDeployEnv',
		'assertHostedSmokeEnv',
		'DEPLOY_HOST',
		'DEPLOY_USER',
		'DEPLOY_REMOTE',
		'DEPLOY_LOCAL',
		'ALPHA_SMOKE_BASE_URL',
		'ALPHA_SMOKE_TIMEOUT_MS',
		'ALPHA_SMOKE_REPORT_PATH',
		'undefined',
		'omit credentials and query tokens',
		'ALPHA_SMOKE_BASE_URL must be an HTTP(S) origin/path',
		"import { assertDeployEnv } from './utils/config.mjs'",
		'assertDeployEnv(',
		"assertHostedSmokeEnv('Hosted alpha gate')",
		"profile: 'default'",
		'a.host === true ? undefined',
		'a.user === true ? undefined',
		'a.remote === true ? undefined'
	];
	const joined = `${config}\n${precheck}\n${hostedGate}\n${deployBuild}`;
	const missingMarkers = requiredMarkers.filter((marker) => !joined.includes(marker));

	if (missingMarkers.length > 0) {
		throw new Error(`Deploy precheck contract is missing required markers: ${missingMarkers.join(', ')}`);
	}

	console.log('PASS deploy-precheck-contract: Deploy commands reject missing, placeholder, and unsafe env values.');
}

async function verifyArtifactSyncContract() {
	const artifactSync = await readFile(path.join(repoRoot, 'scripts', 'verify-artifact-sync.mjs'), 'utf8');
	const requiredMarkers = [
		'adapter/src/index.ts',
		'adapter/index.js',
		'mkdtempSync',
		"runBun(artifact.build(tempFile))",
		'normalizeBuiltArtifact',
		'requiredMarkers',
		"preg_match('/[\\\\\\\\x00-\\\\\\\\x1f\\\\\\\\x7f]/', $decoded)",
		"$segment === '..' || $segment === '.'",
		"preg_match('#(^|/)_protected(?:/|$)#', $uri_raw)",
		"preg_quote($base, '#') . '/_protected(?:/|$)#'",
		'--strict',
		'process.env.CI'
	];
	const missingMarkers = requiredMarkers.filter((marker) => !artifactSync.includes(marker));

	if (missingMarkers.length > 0) {
		throw new Error(`Artifact sync verifier is missing required markers: ${missingMarkers.join(', ')}`);
	}

	console.log('PASS artifact-sync-contract: Adapter bundle sync is checked from source via a temporary build.');
}

async function main() {
	const checks = [
		verifyPackageMetadata,
		verifyAlphaReleaseChecklistDoc,
		verifyAlphaReleaseChecklistRuntimeContract,
		verifyEnvFiles,
		verifyNoLeftoverTarballs,
		verifyCiWorkflow,
		verifyHostedGateWrapper,
		verifyRemoteSmokeCoverage,
		verifyLocalReportPipeline,
		verifyAlphaGateArtifactSyncIsStrict,
		verifyDeployPrecheckContract,
		verifyArtifactSyncContract
	];
	const failures = [];

	for (const check of checks) {
		try {
			await check();
		} catch (error) {
			failures.push(error);
			console.error(`FAIL ${check.name}: ${error.message}`);
		}
	}

	if (failures.length > 0) {
		process.exit(1);
	}

	console.log(`Alpha release-prep verification passed: ${checks.length} checks.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	await main();
}

