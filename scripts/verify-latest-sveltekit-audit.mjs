import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const auditPackages = [
	{
		name: 'svelte',
		rangeField: 'devDependencies',
		stance: 'same-major alpha gate target'
	},
	{
		name: '@sveltejs/kit',
		rangeField: 'devDependencies',
		stance: 'same-major alpha gate target'
	},
	{
		name: '@sveltejs/vite-plugin-svelte',
		rangeField: 'devDependencies',
		stance: 'isolated latest-major validation lane'
	},
	{
		name: 'vite',
		rangeField: 'devDependencies',
		stance: 'isolated latest-major validation lane'
	}
];

async function npmLatest(packageName) {
	const { stdout } = await execFileAsync(npmCommand, ['view', packageName, 'version', '--silent'], {
		cwd: repoRoot,
		timeout: 20000,
		windowsHide: true
	});
	return stdout.trim();
}

function extractAuditVersion(audit, packageName) {
	for (const line of audit.split(/\r?\n/)) {
		const cells = line.split('|').map((cell) => cell.trim());
		if (cells[1] === `\`${packageName}\``) {
			return cells[2]?.replace(/^`|`$/g, '') ?? null;
		}
	}
	return null;
}

function requireMarkers(label, text, markers) {
	const missing = markers.filter((marker) => !text.includes(marker));
	if (missing.length > 0) {
		throw new Error(`${label} is missing required markers: ${missing.join(', ')}`);
	}
}

async function main() {
	const [audit, packageJsonText, releasePrep] = await Promise.all([
		readFile(path.join(repoRoot, 'docs', 'ALPHA-LATEST-SVELTEKIT-AUDIT.md'), 'utf8'),
		readFile(path.join(repoRoot, 'package.json'), 'utf8'),
		readFile(path.join(repoRoot, 'scripts', 'verify-alpha-release-prep.mjs'), 'utf8')
	]);
	const packageJson = JSON.parse(packageJsonText);

	requireMarkers('docs/ALPHA-LATEST-SVELTEKIT-AUDIT.md', audit, [
		'latest-sveltekit-compatibility-audit',
		'Latest package snapshot',
		'Alpha support stance',
		'Remote functions and newer Kit features',
		'Vite 8 and vite-plugin-svelte 7',
		'remote-functions-alpha-policy',
		'Latest package snapshot freshness',
		'alpha:latest-same-major:smoke',
		'smoke-latest-same-major.mjs',
		'alpha:latest-vite-major:smoke',
		'smoke-latest-vite-major.mjs',
		'latest-vite-major-validation'
	]);

	requireMarkers('scripts/verify-alpha-release-prep.mjs', releasePrep, [
		'verifyLatestSvelteKitCompatibilityAudit',
		'verify:latest-sveltekit-audit',
		'verify-latest-sveltekit-audit.mjs',
		'alpha:latest-same-major:smoke',
		'alpha:latest-vite-major:smoke'
	]);

	if (packageJson.scripts?.['verify:latest-sveltekit-audit'] !== 'bun scripts/verify-latest-sveltekit-audit.mjs') {
		throw new Error('package.json must expose verify:latest-sveltekit-audit.');
	}
	if (
		packageJson.scripts?.['alpha:latest-vite-major:smoke'] !==
		'bun scripts/smoke-latest-vite-major.mjs'
	) {
		throw new Error('package.json must expose alpha:latest-vite-major:smoke.');
	}

	if (!packageJson.sveltekitPhpReleasePolicy?.requiredEvidence?.includes('latest-sveltekit-compatibility-audit')) {
		throw new Error('package.json required evidence must include latest-sveltekit-compatibility-audit.');
	}
	if (!packageJson.sveltekitPhpReleasePolicy?.requiredEvidence?.includes('latest-vite-major-validation')) {
		throw new Error('package.json required evidence must include latest-vite-major-validation.');
	}

	const results = [];
	for (const item of auditPackages) {
		const recorded = extractAuditVersion(audit, item.name);
		const latest = await npmLatest(item.name);
		const configuredRange = packageJson[item.rangeField]?.[item.name];

		if (!recorded) {
			throw new Error(`docs/ALPHA-LATEST-SVELTEKIT-AUDIT.md is missing a package row for ${item.name}.`);
		}
		if (recorded !== latest) {
			throw new Error(
				`Latest package snapshot freshness failed for ${item.name}: audit records ${recorded}, npm view reports ${latest}. Update docs/ALPHA-LATEST-SVELTEKIT-AUDIT.md and rerun alpha report generation.`
			);
		}
		if (!configuredRange) {
			throw new Error(`package.json is missing ${item.rangeField}.${item.name}.`);
		}

		results.push(`${item.name}@${latest} (${item.stance}; repo ${configuredRange})`);
	}

	console.log(
		`PASS latest-sveltekit-compatibility-audit: npm view latest snapshot matches docs/ALPHA-LATEST-SVELTEKIT-AUDIT.md (${results.join(', ')}).`
	);
}

main().catch((error) => {
	console.error(`FAIL latest-sveltekit-compatibility-audit: ${error.message}`);
	process.exit(1);
});

