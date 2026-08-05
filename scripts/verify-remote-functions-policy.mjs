import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const remoteFunctionFileRe = /\.remote\.(?:js|ts|mjs|mts|cjs|cts)$/i;

async function collectRemoteFunctionFiles(root) {
	const files = [];
	const visit = async (dir) => {
		let entries;
		try {
			entries = await readdir(dir, { withFileTypes: true });
		} catch {
			return;
		}

		for (const entry of entries) {
			const abs = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				if (
					entry.name === 'node_modules' ||
					entry.name === '.git' ||
					entry.name === '.svelte-kit' ||
					entry.name === 'build'
				) {
					continue;
				}
				await visit(abs);
			} else if (entry.isFile() && remoteFunctionFileRe.test(entry.name)) {
				files.push(path.relative(repoRoot, abs).replaceAll(path.sep, '/'));
			}
		}
	};

	await visit(root);
	return files.sort();
}

function requireMarkers(label, text, markers) {
	const missing = markers.filter((marker) => !text.includes(marker));
	if (missing.length > 0) {
		throw new Error(`${label} is missing required markers: ${missing.join(', ')}`);
	}
}

async function main() {
	const [packageJsonText, svelteConfig, adapterIndexSource, guardsSource, policyDoc, latestAudit, releasePrep] =
		await Promise.all([
			readFile(path.join(repoRoot, 'package.json'), 'utf8'),
			readFile(path.join(repoRoot, 'svelte.config.js'), 'utf8'),
			readFile(path.join(repoRoot, 'adapter', 'src', 'index.ts'), 'utf8'),
			readFile(path.join(repoRoot, 'adapter', 'src', 'utils', 'guards.ts'), 'utf8'),
			readFile(path.join(repoRoot, 'docs', 'REMOTE-FUNCTIONS-ALPHA-POLICY.md'), 'utf8'),
			readFile(path.join(repoRoot, 'docs', 'ALPHA-LATEST-SVELTEKIT-AUDIT.md'), 'utf8'),
			readFile(path.join(repoRoot, 'scripts', 'verify-alpha-release-prep.mjs'), 'utf8')
		]);
	const packageJson = JSON.parse(packageJsonText);
	const adapterSource = `${adapterIndexSource}\n${guardsSource}`;
	const remoteFiles = await collectRemoteFunctionFiles(path.join(repoRoot, 'src'));

	if (/remoteFunctions\s*:\s*true/.test(svelteConfig)) {
		throw new Error('svelte.config.js must not enable kit.experimental.remoteFunctions for PHP alpha builds.');
	}

	if (remoteFiles.length > 0) {
		throw new Error(
			`Remote function files are blocked by remote-functions-alpha-policy: ${remoteFiles.join(', ')}`
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

	requireMarkers('adapter/src/index.ts', adapterSource, [
		'REMOTE_FUNCTIONS_ALPHA_POLICY_MARKER',
		'REMOTE_FUNCTIONS_UNSUPPORTED_MESSAGE',
		'REMOTE_FUNCTION_FILE_RE',
		'assertRemoteFunctionsUnsupported',
		'kit.experimental.remoteFunctions',
		'generatedHttpEndpointSupport',
		'remoteFunctions:'
	]);
	requireMarkers('docs/REMOTE-FUNCTIONS-ALPHA-POLICY.md', policyDoc, [
		'remote-functions-alpha-policy',
		'kit.experimental.remoteFunctions',
		'.remote.js',
		'.remote.ts',
		'generated server HTTP endpoints',
		'Hosted PHP smoke proof'
	]);
	requireMarkers('docs/ALPHA-LATEST-SVELTEKIT-AUDIT.md', latestAudit, [
		'remote-functions-alpha-policy',
		'Official SvelteKit remote-functions guidance',
		'generated HTTP endpoint support is blocked'
	]);
	requireMarkers('scripts/verify-alpha-release-prep.mjs', releasePrep, [
		'verifyRemoteFunctionsAlphaPolicy',
		'remote-functions-alpha-policy',
		'verify:remote-functions',
		'docs/REMOTE-FUNCTIONS-ALPHA-POLICY.md'
	]);

	console.log(
		'PASS remote-functions-alpha-policy: remote functions are explicitly blocked until PHP runtime route proof exists.'
	);
}

main().catch((error) => {
	console.error(`FAIL remote-functions-alpha-policy: ${error.message}`);
	process.exit(1);
});
