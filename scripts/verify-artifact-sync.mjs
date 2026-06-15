import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const strict = process.env.CI === 'true' || process.argv.includes('--strict');

const generatedArtifacts = [
	{
		label: 'adapter bundle',
		source: 'adapter/src/index.ts',
		artifact: 'adapter/index.js',
		build: (outFile) => ['build', 'adapter/src/index.ts', '--outfile', outFile, '--target', 'node', '--format', 'esm'],
		requiredMarkers: [
			"preg_match('/[\\\\x00-\\\\x1f\\\\x7f]/', $decoded)",
			"$segment === '..' || $segment === '.'",
			"preg_match('#(^|/)_protected(?:/|$)#', $uri_raw)",
			"preg_quote($base, '#') . '/_protected(?:/|$)#'",
			'router_safe_path($root',
			'router_safe_path(__DIR__',
			'Build identity contract',
			'buildIdentity',
			'1.0.0-alpha.1'
		]
	}
];

function runBun(args) {
	return execFileSync('bun', args, {
		cwd: repoRoot,
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'pipe']
	});
}

function normalizeBuiltArtifact(text) {
	return text.replace(/\r\n/g, '\n').trimEnd();
}

function compareArtifact(artifact) {
	const tempRoot = mkdtempSync(path.join(os.tmpdir(), 'sk-php-artifact-sync-'));
	const tempFile = path.join(tempRoot, path.basename(artifact.artifact));

	try {
		runBun(artifact.build(tempFile));

		const generated = normalizeBuiltArtifact(readFileSync(tempFile, 'utf8'));
		const checkedIn = normalizeBuiltArtifact(readFileSync(path.join(repoRoot, artifact.artifact), 'utf8'));
		const missingMarkers = [];

		for (const marker of artifact.requiredMarkers ?? []) {
			if (!generated.includes(marker)) {
				missingMarkers.push(`${artifact.label} generated output missing marker: ${marker}`);
			}
			if (!checkedIn.includes(marker)) {
				missingMarkers.push(`${artifact.artifact} checked-in artifact missing marker: ${marker}`);
			}
		}

		if (missingMarkers.length > 0) {
			return {
				ok: false,
				message: missingMarkers.join('\n')
			};
		}

		if (generated !== checkedIn) {
			return {
				ok: false,
				message: `${artifact.artifact} is stale relative to ${artifact.source}. Run \`bun run build:adapter\` and commit the regenerated artifact.`
			};
		}

		return {
			ok: true,
			message: `${artifact.artifact} matches ${artifact.source}.`
		};
	} finally {
		rmSync(tempRoot, { recursive: true, force: true });
	}
}

const failures = [];

for (const artifact of generatedArtifacts) {
	const result = compareArtifact(artifact);
	if (result.ok) {
		console.log(`PASS artifact-sync: ${result.message}`);
	} else {
		failures.push(result);
		const output = strict ? console.error : console.warn;
		output(`FAIL artifact-sync: ${result.message}`);
	}
}

if (failures.length > 0) {
	if (strict) {
		process.exit(1);
	}

	console.warn('Non-strict artifact sync check is advisory; pass --strict or run in CI to fail on drift.');
} else {
	console.log(`Generated artifacts are synchronized: ${generatedArtifacts.length} checked.`);
}
