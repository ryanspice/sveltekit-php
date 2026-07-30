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
	'DEPLOY_IDENTITY_FILE',
	'DEPLOY_THRESHOLD_FILES',
	'DEPLOY_THRESHOLD_BYTES',
	'ALPHA_SMOKE_BASE_URL',
	'ALPHA_SMOKE_EXPECTED_VERSION',
	'ALPHA_SMOKE_TIMEOUT_MS',
	'ALPHA_SMOKE_REPORT_PATH'
];

const deploySecretKeys = new Set([
	'DEPLOY_PROFILE',
	'DEPLOY_HOST',
	'DEPLOY_USER',
	'DEPLOY_REMOTE',
	'DEPLOY_IDENTITY_FILE'
]);
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

	if (key === 'ADAPTER_BASE_MODE' && !['fixed', 'auto'].includes(value)) {
		throw new Error(`${key} must be fixed, auto, empty, or a placeholder.`);
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
	const gitignoreText = await readOptionalText('.gitignore');
	if (!exampleText) {
		throw new Error('.env.example is required for alpha release prep.');
	}
	if (!gitignoreText) {
		throw new Error('.gitignore is required so runtime-local env files stay out of release artifacts.');
	}

	const exampleEntries = parseEnvFile(exampleText);
	const missingExampleKeys = requiredEnvKeys.filter((key) => !exampleEntries.has(key));
	if (missingExampleKeys.length > 0) {
		throw new Error(`.env.example is missing required keys: ${missingExampleKeys.join(', ')}`);
	}

	for (const [key, value] of exampleEntries) {
		validateSafeCommittedValue(key, value);
	}

	const gitignoreLines = gitignoreText
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line && !line.startsWith('#'));
	if (!gitignoreLines.includes('.env') || !gitignoreLines.includes('.env.*') || !gitignoreLines.includes('!.env.example')) {
		throw new Error('.gitignore must keep .env and .env.* ignored while allowing .env.example.');
	}

	console.log('PASS env-safety: release-prep checks .env.example and .gitignore without reading runtime-local .env.');
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

	if (packageJson.license !== 'MIT') {
		throw new Error('package.json must declare the MIT license.');
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
		'LICENSE',
		'README.md',
		'docs/ADAPTER-FEATURE-CATALOG.md',
		'docs/ADAPTER-LANDSCAPE.md',
		'docs/ALPHA-LATEST-SVELTEKIT-AUDIT.md',
		'docs/ALPHA-READINESS.md',
		'docs/ALPHA-RELEASE-CHECKLIST.md',
		'docs/DEV-ADAPTER-BOUNDARY.md',
		'docs/HOSTING-CONTRACT.md',
		'docs/REMOTE-FUNCTIONS-ALPHA-POLICY.md',
		'docs/recipes/composer-bootstrap.md',
		'docs/recipes/wordpress.md'
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
		'alpha:latest-same-major:smoke',
		'alpha:latest-vite-major:smoke',
		'alpha:native:smoke',
		'alpha:published:smoke',
		'alpha:remote:placeholder',
		'alpha:remote:smoke',
		'alpha:report:full',
		'verify:artifacts',
		'verify:alpha',
		'verify:latest-sveltekit-audit',
		'verify:remote-functions',
		'verify:root-router-parity',
		'verify:release-prep',
		'release:npm-state',
		'release:npm-state:strict',
		'v1:gate:local',
		'v1:gate:hosted',
		'v1:gate'
	]) {
		if (!packageJson.scripts?.[scriptName]) {
			throw new Error(`package.json is missing required script: ${scriptName}`);
		}
	}

	if (!packageJson.scripts?.['v1:gate:local']?.includes('verify:root-router-parity')) {
		throw new Error('package.json v1:gate:local must include verify:root-router-parity.');
	}
	if (!packageJson.scripts?.['v1:gate:local']?.includes('alpha:latest-vite-major:smoke')) {
		throw new Error('package.json v1:gate:local must include alpha:latest-vite-major:smoke.');
	}
	if (!packageJson.scripts?.['v1:gate:hosted']?.includes('--skip-local')) {
		throw new Error('package.json v1:gate:hosted must skip the local gate because v1:gate already runs v1:gate:local first.');
	}
	if (
		!packageJson.scripts?.['v1:gate']?.includes('v1:gate:local') ||
		!packageJson.scripts?.['v1:gate']?.includes('v1:gate:hosted')
	) {
		throw new Error('package.json v1:gate must compose v1:gate:local and v1:gate:hosted.');
	}

	console.log(`PASS package-alpha: ${packageJson.name}@${packageJson.version} is publish-shaped with ${requiredAlphaEvidence.length} required evidence markers.`);
}

async function verifyAlphaReleaseChecklistDoc() {
	const checklist = await readFile(path.join(repoRoot, 'docs', 'ALPHA-RELEASE-CHECKLIST.md'), 'utf8');
	const requiredMarkers = [
		'1.0.2-alpha release checklist',
		'alpha-over-rc-release-policy',
		'desktop-shell-ui-command-mapping',
			'data-window-chrome-state',
			'transparent-webview-material-boundary',
		'csr-disabled-prerender-contract',
		'community-analytics-csv-linkage',
		'result-total-field-contract',
		'top-result-field-contract',
		'sample-review-rule',
		'result_total_field',
		'top_result_fields',
		'sample_review_rule',
		'router-path-safety-artifact-sync',
		'adapter-platform-emulation',
		'latest-sveltekit-compatibility-audit',
		'remote-functions-alpha-policy',
		'deploy-env-preflight-safety',
		'hardProofBlockers',
		'hard-proof-blocker-ledger',
		'stablePromotionBlockers',
		'packed-consumer-install-import-proof',
		'npm-publish-auth-proof',
		'source-to-generated-bundle-check',
		'real-native-host-wrapper-smoke-required',
		'needs-current-run-proof',
		'needs-real-host-proof',
		'stable-native-claim',
		'fresh-community-claim',
		'event.platform.php',
		'bun run alpha:gate',
		'bun run alpha:gate:hosted',
		'getDesktopShellUiCommandMapping',
		'toDesktopShellUiTaskbarProgressState',
		'native-host-wrapper-smoke',
		'deterministic-host-wrapper-handoff',
		'noNativeApiBoundary',
		'TaskbarProgressState',
		'saveInFlight',
		'hasQueuedSave',
		'no-hydration-fixture',
		'theme-stable-ssr-html',
		'data-sveltekit-hydrate',
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
	const hardProofBlockerSource = await readFile(
		path.join(repoRoot, 'src', 'lib', 'alpha-hard-proof-blockers.ts'),
		'utf8'
	);
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
	const bridgeReuseSource = await readFile(path.join(repoRoot, 'src', 'lib', 'alpha-bridge-reuse.ts'), 'utf8');
	const nativeHostContractSource = await readFile(path.join(repoRoot, 'src', 'lib', 'alpha-native-host-contract.ts'), 'utf8');
	const nativeHostGuideSource = await readFile(path.join(repoRoot, 'src', 'lib', 'alpha-native-host-guide.ts'), 'utf8');
	const nativeHostWrapperSmokeSource = await readFile(
		path.join(repoRoot, 'src', 'lib', 'alpha-native-host-wrapper-smoke.ts'),
		'utf8'
	);
	const joined = [
		hardProofBlockerSource,
		releaseChecklistSource,
		releaseChecklistEndpoint,
		exportPipeline,
		manifestSource,
		evidenceIndexSource,
		gateMatrixSource,
		hostedChecklistSource,
		reviewIndexSource,
		packageContractSource,
		bridgeReuseSource,
		nativeHostContractSource,
		nativeHostGuideSource,
		nativeHostWrapperSmokeSource
	].join('\n');
	const requiredMarkers = [
		'renderAlphaReleaseChecklistMarkdown',
		'1.0.2-alpha release checklist',
		'alpha-over-rc-release-policy',
		'desktop-shell-ui-command-mapping',
			'data-window-chrome-state',
			'transparent-webview-material-boundary',
		'csr-disabled-prerender-contract',
		'community-analytics-csv-linkage',
		'result-total-field-contract',
		'top-result-field-contract',
		'sample-review-rule',
		'result_total_field',
		'top_result_fields',
		'sample_review_rule',
		'router-path-safety-artifact-sync',
		'adapter-platform-emulation',
		'latest-sveltekit-compatibility-audit',
		'remote-functions-alpha-policy',
		'deploy-env-preflight-safety',
		'alphaHardProofBlockers',
		'AlphaHardProofBlocker',
		'full-local-alpha-gate',
		'hosted-php-smoke-proof',
		'buildAlphaHardProofBlockers',
		'hardProofBlockers',
		'hard-proof-blocker-ledger',
		'stablePromotionBlockers',
		'packed-consumer-install-import-proof',
		'source-to-generated-bundle-check',
		'real-native-host-wrapper-smoke-required',
		'community-analytics-freshness-proof',
		'needs-current-run-proof',
		'needs-real-host-proof',
		'needs-hosted-proof',
		'needs-freshness-review',
		'stable-native-claim',
		'fresh-community-claim',
		'deterministic-local-gate-required',
		'requires-alpha-smoke-base-url-for-pass-evidence',
		'real-php-host-smoke-evidence',
		'hostedProofInterpretation',
		'hosted-php-smoke-proof',
		'hostedAlphaSmokeProof',
		'hostedAlphaSmokeArtifact',
		'alphaEvidenceStatus',
		'alpha-hosted-proof-present',
		'hosted-smoke-passed',
		'hostedSmokeStatus',
		'native-host-compatibility-matrix',
		'source-observed-host-compatibility-contract',
		'features.micaSupported',
		'windowChromeState',
		'mica-active',
		'mica-inactive',
		'plain',
		'webview.setBackgroundColor([0, 0, 0, 0])',
		'ShellFeatureProbe.mica_supported',
		'current_shell_features()',
		'cfg!(target_os = "windows")',
		'windows-mica-effects',
		'taskbar-progress-reporting',
		'native-titlebar-drag-maximize',
		'packed-artifact-install-import',
		'real-os-native-host-proof-required',
		'lg-ultragear-host-permission-checklist',
		'realHostPermissionChecklist',
		'hostPermissionCues',
		'requiredHostPermission',
		'real-host-permission-cue-required',
		'core:window:allow-set-effects',
		'core:window:allow-set-progress-bar',
		'core:window:allow-start-dragging',
		'core:window:allow-toggle-maximize',
		'src-tauri/capabilities/default.json',
		'adapterPlatformEmulationProof',
		'remoteFunctionsAlphaPolicyProof',
		'event.platform.php',
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
		'bun run verify:latest-sveltekit-audit',
		'bun run alpha:latest-same-major:smoke',
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
		'macos-vibrancy-visual-row',
		'macos-vibrancy-host-policy',
		'macos-material-host-policy',
		'source-observed-macos-host-scaffold',
		'macos-native-vibrancy-unverified',
		'source-observed macOS host policy',
		'data-macos-material-host-policy',
		'data-macos-native-vibrancy',
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
		'no-live-community-api-runtime-boundary',
		'result-total-field-contract',
		'top-result-field-contract',
		'sample-review-rule',
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
		'macos-material-host-policy',
		'source-observed-macos-host-scaffold',
		'macos-native-vibrancy-unverified',
		'native-host-compatibility-matrix',
		'source-observed-host-compatibility-contract',
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
		'data-macos-material-host-policy',
		'data-macos-native-vibrancy',
		'ShellFeatureProbe.mica_supported',
		'current_shell_features()',
		'cfg!(target_os = "windows")',
		'windows-mica-effects',
		'taskbar-progress-reporting',
		'native-titlebar-drag-maximize',
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
		'no-live-community-api-runtime-boundary',
		'result-total-field-contract',
		'top-result-field-contract',
		'sample-review-rule',
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
		'hostedProofInterpretation',
		'hosted-php-smoke-proof',
		'alphaEvidenceStatus',
		'real-php-host-smoke-evidence',
		'hostedSmokeStatus',
		'nativeChromeVisualContract',
		'nativeVisualMatrix',
		'macos-vibrancy-visual-row',
		'macos-vibrancy-host-policy',
		'macos-material-host-policy',
		'source-observed-macos-host-scaffold',
		'macos-native-vibrancy-unverified',
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
		'macos-material-host-policy',
		'source-observed-macos-host-scaffold',
		'macos-native-vibrancy-unverified',
		'windowChromeState',
		'data-window-chrome-state',
		'transparent-webview-material-boundary',
		'data-macos-material-host-policy',
		'data-macos-native-vibrancy',
		'webview.setBackgroundColor([0, 0, 0, 0])',
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
		'native-host-wrapper-smoke',
		'native-visual-matrix',
		'deterministic-host-wrapper-handoff',
		'noNativeApiBoundary',
		'lg-ultragear-native-platform-provenance',
		'progress-report-handoff',
		'progress-report-graphic',
		'required-alpha-evidence',
		'requiredEvidence',
		'native-host-binding-guide',
		'real-host-permission-checklist',
		'nativeHostWrapperSmokeProof',
		'report/alpha-native-host-wrapper-smoke.json',
		"path: 'alpha-readiness/native-host-wrapper-smoke.json'",
		'deterministic-host-wrapper-handoff',
		'noNativeApiBoundary',
			'desktop-shell-ui-command-mapping',
		'csr-disabled-prerender-contract',
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
		'macos-material-host-policy',
		'source-observed-macos-host-scaffold',
		'macos-native-vibrancy-unverified',
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
		'real-host-permission-checklist',
			'desktop-shell-ui-command-mapping',
		'csr-disabled-prerender-contract',
		'windows-11-mica-browser-safe-shell',
		'macos-style-native-titlebar-rhythm',
		'alpha-readiness-report-graphics',
		'community-keyword-search-graph',
		'community-analytics-freshness-contract',
		'community-analytics-csv-linkage',
		'result-total-field-contract',
		'top-result-field-contract',
		'sample-review-rule',
		'result_total_field',
		'top_result_fields',
		'sample_review_rule',
		'router-path-safety-artifact-sync',
		'adapter-platform-emulation',
		'deploy-env-preflight-safety',
		'hosted-php-smoke-proof',
		"path: 'alpha-readiness/native-host-contract.json'",
		"path: 'alpha-readiness/native-host-wrapper-smoke.json'",
		'buildNativeHostWrapperProbe',
		'realHostVerified',
		'window.__SVELTEKIT_PHP_NATIVE_HOST__',
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
		'no-live-community-api-runtime-boundary',
		'result-total-field-contract',
		'top-result-field-contract',
		'sample-review-rule',
		'resultTotalField',
		'topResultFields',
		'sampleReviewRule',
		'communityAnalyticsGraphicLinkageContract',
		'community-source-map.svg',
		'community-analytics.md',
		'community-signals.csv',
		'community-sources.csv',
		'result_total_field',
		'top_result_fields',
		'sample_review_rule',
		"path: 'alpha-readiness/readiness.csv'",
		"path: 'alpha-readiness/community-signals.csv'",
		"path: 'alpha-readiness/community-sources.csv'",
		'result_total_field',
		'top_result_fields',
		'sample_review_rule',
		'analytics-linked-keyword-graph',
		'curated-signal-score',
		'collected-demand-score',
		'directional-community-signal',
		'no-live-community-api-runtime-boundary',
		'result-total-field-contract',
		'top-result-field-contract',
		'sample-review-rule',
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
		'forbiddenLeakMarkers',
		'assetFallbackProbes',
		'verifyAssetFallbackExclusion',
		'asset-fallback-exclusion',
		'missing-alpha-smoke.webmanifest',
		'missing-alpha-smoke.wasm',
		'fallback HTML'
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
		'DEPLOY_IDENTITY_FILE',
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
		'a.remote === true ? undefined',
		'a[\'identity-file\'] ?? env(\'DEPLOY_IDENTITY_FILE\')'
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

async function verifyRootRouterParityContract() {
	const [
		rootRouter,
		parityVerifier,
		packageJsonText,
		checklist,
		releasePlan,
		alphaReleaseChecklist,
		hostingContract
	] = await Promise.all([
		readFile(path.join(repoRoot, 'router.php'), 'utf8'),
		readFile(path.join(repoRoot, 'scripts', 'verify-root-router-parity.mjs'), 'utf8'),
		readFile(path.join(repoRoot, 'package.json'), 'utf8'),
		readFile(path.join(repoRoot, 'checklist.md'), 'utf8'),
		readFile(path.join(repoRoot, 'plan', 'process-alpha-to-1x-rc-1.md'), 'utf8'),
		readFile(path.join(repoRoot, 'docs', 'ALPHA-RELEASE-CHECKLIST.md'), 'utf8'),
		readFile(path.join(repoRoot, 'docs', 'HOSTING-CONTRACT.md'), 'utf8')
	]);
	const packageJson = JSON.parse(packageJsonText);
	const requiredMarkers = [
		"return require $router_real",
		'createFixtures',
		'encoded-traversal',
		'double-encoded-traversal',
		'encoded-backslash-traversal',
		'negotiate-html',
		'negotiate-json',
		'base-mismatch',
		'normalizeBodyForComparison',
		'Root router parity failed'
	];
	const joined = `${rootRouter}\n${parityVerifier}`;
	const missingMarkers = requiredMarkers.filter((marker) => !joined.includes(marker));

	if (missingMarkers.length > 0) {
		throw new Error(`Root router parity contract missing markers: ${missingMarkers.join(', ')}`);
	}

	if (!packageJson.scripts?.['verify:root-router-parity']?.includes('verify-root-router-parity.mjs')) {
		throw new Error('package.json must expose verify:root-router-parity.');
	}

	if (!packageJson.scripts?.['v1:gate:local']?.includes('verify:root-router-parity')) {
		throw new Error('v1:gate:local must include verify:root-router-parity.');
	}
	if (!packageJson.scripts?.['v1:gate:local']?.includes('alpha:latest-vite-major:smoke')) {
		throw new Error('v1:gate:local must include alpha:latest-vite-major:smoke.');
	}

	if (
		!checklist.includes('Root/generated router parity') ||
		!checklist.includes('bun run verify:root-router-parity') ||
		!releasePlan.includes('TASK-014') ||
		!releasePlan.includes('verify-root-router-parity.mjs') ||
		!alphaReleaseChecklist.includes('root-router-parity-contract') ||
		!alphaReleaseChecklist.includes('bun run verify:root-router-parity') ||
		!hostingContract.includes('Root compatibility router') ||
		!hostingContract.includes('return require $router_real')
	) {
		throw new Error('Checklist, packaged docs, and release plan must document root/generated router parity proof.');
	}

	console.log(
		'PASS root-router-parity-contract: Root router delegates generated router results and parity proof is gated.'
	);
}

async function verifyPublicContractDocs() {
	const [readme, hostingContract, alphaReadiness] = await Promise.all([
		readFile(path.join(repoRoot, 'README.md'), 'utf8'),
		readFile(path.join(repoRoot, 'docs', 'HOSTING-CONTRACT.md'), 'utf8'),
		readFile(path.join(repoRoot, 'docs', 'ALPHA-READINESS.md'), 'utf8')
	]);
	const requiredHostingMarkers = [
		'## Public adapter options',
		'`mode`',
		'`ssr`',
		'`out`',
		'`assets`',
		'`precompress`',
		'`fallback`',
		'`strict`',
		'`basePath`',
		'`baseMode`',
		'`buildIdentity`',
		'## Package exports and packed files',
		'`sveltekit-php/adapter`',
		'docs/REMOTE-FUNCTIONS-ALPHA-POLICY.md',
		'## Base, deploy, and smoke environment names',
		'SK_BASE_PATH',
		'DEPLOY_BASE',
		'DEPLOY_REMOTE',
		'ALPHA_SMOKE_BASE_URL',
		'Adapter-emitted diagnostic headers',
		'X-SvelteKit-PHP-Page-Mode',
		'X-SvelteKit-PHP-SSR'
	];
	const requiredReadmeMarkers = [
		'Mode choice:',
		'Choose `php-static`',
		'Choose `js-ssr`',
		'remote functions',
		'docs/REMOTE-FUNCTIONS-ALPHA-POLICY.md'
	];
	const requiredAlphaReadinessMarkers = [
		'Stable 1.0.2 gate',
		'## Support lanes for 1.0.2-alpha',
		'`php-static`',
		'`js-ssr`',
		'Vite 8',
		'`@sveltejs/vite-plugin-svelte` 7',
		'remote functions',
		'streaming-deferred parity',
		'WordPress plugin mode',
		'PHP-FPM package mode',
		'adapter-owned auth/roles'
	];
	const missingHostingMarkers = requiredHostingMarkers.filter((marker) => !hostingContract.includes(marker));
	const missingReadmeMarkers = requiredReadmeMarkers.filter((marker) => !readme.includes(marker));
	const missingAlphaMarkers = requiredAlphaReadinessMarkers.filter((marker) => !alphaReadiness.includes(marker));

	if (missingHostingMarkers.length > 0 || missingReadmeMarkers.length > 0 || missingAlphaMarkers.length > 0) {
		throw new Error(
			[
				missingHostingMarkers.length > 0
					? `HOSTING-CONTRACT missing: ${missingHostingMarkers.join(', ')}`
					: null,
				missingReadmeMarkers.length > 0
					? `README missing: ${missingReadmeMarkers.join(', ')}`
					: null,
				missingAlphaMarkers.length > 0
					? `ALPHA-READINESS missing: ${missingAlphaMarkers.join(', ')}`
					: null
			]
				.filter(Boolean)
				.join('; ')
		);
	}

	console.log(
		'PASS public-contract-docs: README and hosting/readiness docs freeze options, exports, env names, headers, modes, and unsupported remote functions.'
	);
}

async function verifyAdapterPlatformEmulationContract() {
	const adapterSource = await readFile(path.join(repoRoot, 'adapter', 'src', 'index.ts'), 'utf8');
	const requiredMarkers = [
		'async emulate()',
		'async platform',
		'php: {',
		'adapterVersion',
		'prerendering',
		'documentSsr',
		'phpStaticClientFallback',
		'actionHandlers',
		'endpointHandlers',
		'nativeHostRuntime',
		'remoteFunctions',
		'generatedHttpEndpointSupport',
		'buildIdentity: {'
	];
	const missingMarkers = requiredMarkers.filter((marker) => !adapterSource.includes(marker));

	if (missingMarkers.length > 0) {
		throw new Error(`Adapter platform emulation contract is missing required markers: ${missingMarkers.join(', ')}`);
	}

	console.log('PASS adapter-platform-emulation: Adapter exposes a non-secret event.platform.php contract for dev, build, and preview.');
}

async function verifyLatestSvelteKitCompatibilityAudit() {
	const [
		audit,
		packageJsonText,
		adapterSource,
		releaseManifestSource,
		latestVerifierSource,
		sameMajorSmokeSource,
		viteMajorSmokeSource
	] =
		await Promise.all([
			readFile(path.join(repoRoot, 'docs', 'ALPHA-LATEST-SVELTEKIT-AUDIT.md'), 'utf8'),
			readFile(path.join(repoRoot, 'package.json'), 'utf8'),
			readFile(path.join(repoRoot, 'adapter', 'src', 'index.ts'), 'utf8'),
			readFile(path.join(repoRoot, 'src', 'lib', 'alpha-release-manifest.ts'), 'utf8'),
			readFile(path.join(repoRoot, 'scripts', 'verify-latest-sveltekit-audit.mjs'), 'utf8'),
			readFile(path.join(repoRoot, 'scripts', 'smoke-latest-same-major.mjs'), 'utf8'),
			readFile(path.join(repoRoot, 'scripts', 'smoke-latest-vite-major.mjs'), 'utf8')
		]);
	const packageJson = JSON.parse(packageJsonText);
	const requiredMarkers = [
		'latest-sveltekit-compatibility-audit',
		'https://svelte.dev/docs/kit/writing-adapters',
		'https://svelte.dev/docs/kit/page-options',
		'https://svelte.dev/docs/kit/remote-functions',
		'Remote functions and newer Kit features',
		'svelte` | `5.56.4',
		'@sveltejs/kit` | `2.69.1',
		'@sveltejs/vite-plugin-svelte` | `7.1.4',
		'vite` | `8.1.3',
		'Official adapter snapshot',
		'@sveltejs/adapter-node` | `5.5.7',
		'@sveltejs/adapter-static` | `3.0.10',
		'@sveltejs/adapter-cloudflare` | `7.2.9',
		'@sveltejs/adapter-netlify` | `6.0.4',
		'@sveltejs/adapter-vercel` | `6.3.4',
		'@sveltejs/adapter-auto` | `7.0.1',
		'Live blog consumer evidence',
		'blog.ryanspice.com',
		'seo_audit_python',
		'Latest package snapshot freshness',
		'verify:latest-sveltekit-audit',
		'verify-latest-sveltekit-audit.mjs',
		'alpha:latest-same-major:smoke',
		'smoke-latest-same-major.mjs',
		'Latest same-major fixture smoke',
		'latest-same-major-smoke',
		'latest-vite-major-validation',
		'alpha:latest-vite-major:smoke',
		'smoke-latest-vite-major.mjs',
		'latest-vite-major-smoke',
		'Vite 8 and vite-plugin-svelte 7',
		'async emulate()',
		'supports:',
		'latestSvelteKitCompatibilityAudit',
		'Vite 8 isolated validation lane',
		'npm view'
	];
	const joined = `${audit}\n${adapterSource}\n${releaseManifestSource}\n${latestVerifierSource}\n${sameMajorSmokeSource}\n${viteMajorSmokeSource}`;
	const missingMarkers = requiredMarkers.filter((marker) => !joined.includes(marker));

	if (missingMarkers.length > 0) {
		throw new Error(
			`Latest SvelteKit compatibility audit is missing required markers: ${missingMarkers.join(', ')}`
		);
	}

	if (!packageJson.files?.includes('docs/ALPHA-LATEST-SVELTEKIT-AUDIT.md')) {
		throw new Error('package.json files must include docs/ALPHA-LATEST-SVELTEKIT-AUDIT.md.');
	}

	if (!packageJson.scripts?.['verify:latest-sveltekit-audit']) {
		throw new Error('package.json must expose verify:latest-sveltekit-audit.');
	}

	if (!packageJson.scripts?.['alpha:latest-same-major:smoke']) {
		throw new Error('package.json must expose alpha:latest-same-major:smoke.');
	}
	if (!packageJson.scripts?.['alpha:latest-vite-major:smoke']) {
		throw new Error('package.json must expose alpha:latest-vite-major:smoke.');
	}

	if (
		!packageJson.sveltekitPhpReleasePolicy?.requiredEvidence?.includes(
			'latest-sveltekit-compatibility-audit'
		)
	) {
		throw new Error(
			'package.json sveltekitPhpReleasePolicy.requiredEvidence must include latest-sveltekit-compatibility-audit.'
		);
	}

	console.log(
		'PASS latest-sveltekit-compatibility-audit: latest Svelte/SvelteKit docs, package bounds, npm snapshot freshness verification, same-major fixture smoke, remote-function risk, adapter API markers, and Vite/plugin validation lanes are source-controlled.'
	);
}

async function verifyRemoteFunctionsAlphaPolicy() {
	const [policyDoc, packageJsonText, adapterSource, verifierSource, releaseManifestSource] =
		await Promise.all([
			readFile(path.join(repoRoot, 'docs', 'REMOTE-FUNCTIONS-ALPHA-POLICY.md'), 'utf8'),
			readFile(path.join(repoRoot, 'package.json'), 'utf8'),
			readFile(path.join(repoRoot, 'adapter', 'src', 'index.ts'), 'utf8'),
			readFile(path.join(repoRoot, 'scripts', 'verify-remote-functions-policy.mjs'), 'utf8'),
			readFile(path.join(repoRoot, 'src', 'lib', 'alpha-release-manifest.ts'), 'utf8')
		]);
	const packageJson = JSON.parse(packageJsonText);
	const requiredMarkers = [
		'remote-functions-alpha-policy',
		'kit.experimental.remoteFunctions',
		'.remote.js',
		'.remote.ts',
		'generated server HTTP endpoints',
		'event.platform.php.remoteFunctions.supported',
		'REMOTE_FUNCTIONS_UNSUPPORTED_MESSAGE',
		'REMOTE_FUNCTION_FILE_RE',
		'assertRemoteFunctionsUnsupported',
		'generatedHttpEndpointSupport',
		'remoteFunctionsAlphaPolicy',
		'remoteFunctionsAlphaPolicyProof',
		'verify:remote-functions'
	];
	const joined = `${policyDoc}\n${adapterSource}\n${verifierSource}\n${releaseManifestSource}`;
	const missingMarkers = requiredMarkers.filter((marker) => !joined.includes(marker));

	if (missingMarkers.length > 0) {
		throw new Error(
			`Remote functions alpha policy is missing required markers: ${missingMarkers.join(', ')}`
		);
	}

	if (!packageJson.files?.includes('docs/REMOTE-FUNCTIONS-ALPHA-POLICY.md')) {
		throw new Error('package.json files must include docs/REMOTE-FUNCTIONS-ALPHA-POLICY.md.');
	}

	if (!packageJson.scripts?.['verify:remote-functions']) {
		throw new Error('package.json must expose verify:remote-functions.');
	}

	if (
		!packageJson.sveltekitPhpReleasePolicy?.requiredEvidence?.includes(
			'remote-functions-alpha-policy'
		)
	) {
		throw new Error(
			'package.json sveltekitPhpReleasePolicy.requiredEvidence must include remote-functions-alpha-policy.'
		);
	}

	console.log(
		'PASS remote-functions-alpha-policy: Remote functions remain explicitly unsupported until PHP generated-endpoint routing proof exists.'
	);
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
		verifyArtifactSyncContract,
		verifyRootRouterParityContract,
		verifyPublicContractDocs,
		verifyAdapterPlatformEmulationContract,
		verifyLatestSvelteKitCompatibilityAudit,
		verifyRemoteFunctionsAlphaPolicy
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


