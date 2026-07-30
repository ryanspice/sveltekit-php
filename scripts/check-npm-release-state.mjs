#!/usr/bin/env node

import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const repoRoot = new URL('../', import.meta.url);
const flags = new Set(process.argv.slice(2));
const strict = flags.has('--strict');
const jsonOutput = flags.has('--json');

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const packageName = packageJson.name;
const targetVersion = packageJson.version;

async function runNpm(args, timeout = 120_000) {
	try {
		const result = await execFileAsync(npmBin, args, {
			cwd: repoRoot,
			timeout,
			maxBuffer: 10 * 1024 * 1024
		});

		return {
			ok: true,
			status: 0,
			stdout: result.stdout ?? '',
			stderr: result.stderr ?? ''
		};
	} catch (error) {
		return {
			ok: false,
			status: typeof error.code === 'number' ? error.code : 1,
			stdout: error.stdout ?? '',
			stderr: error.stderr ?? '',
			message: error.message
		};
	}
}

function compactError(result) {
	const text = `${result.stderr}\n${result.stdout}\n${result.message ?? ''}`;
	if (text.includes('E401') || /unauthorized/i.test(text)) return 'E401 Unauthorized';
	if (text.includes('E404') || /not found/i.test(text)) return 'not found';
	if (/timed out/i.test(text)) return 'timed out';
	return text.split(/\r?\n/).find(Boolean) ?? 'unknown error';
}

function parseJsonObject(text) {
	const trimmed = text.trim();
	if (!trimmed) return null;
	return JSON.parse(trimmed);
}

function parseFirstJsonArray(text) {
	const start = text.indexOf('[');
	const end = text.lastIndexOf(']');
	if (start === -1 || end === -1 || end < start) return null;
	return JSON.parse(text.slice(start, end + 1));
}

const authResult = await runNpm(['whoami'], 30_000);
const registryResult = await runNpm(['view', packageName, 'dist-tags', 'version', 'versions', '--json'], 30_000);
const packDestination = await mkdtemp(join(tmpdir(), 'sveltekit-php-pack-'));
let packResult;
try {
	packResult = await runNpm(['pack', '--dry-run', '--json', '--pack-destination', packDestination], 120_000);
} finally {
	await rm(packDestination, { recursive: true, force: true });
}

const blockers = [];
const warnings = [];

const auth = authResult.ok
	? { ok: true, user: authResult.stdout.trim() }
	: { ok: false, reason: compactError(authResult) };

if (!auth.ok) {
	blockers.push(`npm authentication unavailable: ${auth.reason}`);
}

let registry = null;
if (registryResult.ok) {
	registry = parseJsonObject(registryResult.stdout);
} else {
	blockers.push(`npm registry lookup failed: ${compactError(registryResult)}`);
}

const versions = Array.isArray(registry?.versions) ? registry.versions : [];
const distTags = registry?.['dist-tags'] && typeof registry['dist-tags'] === 'object' ? registry['dist-tags'] : {};
const targetAlreadyPublished = versions.includes(targetVersion);

if (targetAlreadyPublished) {
	blockers.push(`${packageName}@${targetVersion} is already published`);
}

if (distTags.latest === targetVersion) {
	blockers.push(`${packageName}@${targetVersion} is already the latest dist-tag`);
}

if (distTags.alpha && distTags.alpha !== targetVersion) {
	warnings.push(`alpha dist-tag currently points at ${distTags.alpha}`);
}

let pack = null;
if (packResult.ok) {
	const parsedPack = parseFirstJsonArray(packResult.stdout);
	pack = parsedPack?.[0] ?? null;
	if (!pack) {
		blockers.push('npm pack dry-run did not return package metadata');
	}
} else {
	blockers.push(`npm pack dry-run failed: ${compactError(packResult)}`);
}

const state = {
	package: packageName,
	targetVersion,
	auth,
	registry: registry
		? {
				latest: distTags.latest ?? null,
				alpha: distTags.alpha ?? null,
				versions,
				targetAlreadyPublished
			}
		: null,
	pack: pack
		? {
				filename: pack.filename,
				shasum: pack.shasum,
				size: pack.size,
				unpackedSize: pack.unpackedSize,
				entryCount: pack.entryCount,
				bundled: pack.bundled ?? []
			}
		: null,
	warnings,
	blockers,
	ok: blockers.length === 0
};

if (jsonOutput) {
	console.log(JSON.stringify(state, null, 2));
} else {
	console.log(`npm release state for ${packageName}@${targetVersion}`);
	console.log(`- auth: ${auth.ok ? `authenticated as ${auth.user}` : `blocked (${auth.reason})`}`);
	if (registry) {
		console.log(`- registry latest: ${distTags.latest ?? '<none>'}`);
		console.log(`- registry alpha: ${distTags.alpha ?? '<none>'}`);
		console.log(`- published versions: ${versions.join(', ') || '<none>'}`);
		console.log(`- target published: ${targetAlreadyPublished ? 'yes' : 'no'}`);
	}
	if (pack) {
		console.log(`- pack dry-run: ${pack.filename}, ${pack.entryCount} entries, shasum ${pack.shasum}`);
	}
	for (const warning of warnings) {
		console.log(`WARN ${warning}`);
	}
	if (blockers.length > 0) {
		for (const blocker of blockers) {
			console.log(`BLOCKER ${blocker}`);
		}
	} else {
		console.log('PASS npm release state has no detected blockers.');
	}
}

if (strict && blockers.length > 0) {
	process.exitCode = 1;
}
