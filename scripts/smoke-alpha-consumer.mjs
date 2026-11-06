import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const requiredPackFiles = [
	'package.json',
	'README.md',
	'adapter/index.js',
	'adapter/declarations/index.d.ts',
	'adapter/declarations/types.d.ts',
	'adapter/src/runtime/php-compat.php',
	'docs/ALPHA-READINESS.md'
];
const forbiddenPackExactFiles = new Set(['.env', 'bun.lock', 'package-lock.json']);
const forbiddenPackPrefixes = [
	'.svelte-kit/',
	'build/',
	'build-e2e-',
	'node_modules/',
	'playwright-report/',
	'report/',
	'scripts/',
	'src/',
	'test-results/',
	'tests/'
];

/**
 * @param {string} command
 * @param {string[]} args
 * @param {{cwd?: string, env?: NodeJS.ProcessEnv}} [options]
 * @returns {Promise<{stdout: string, stderr: string}>}
 */
function run(command, args, options = {}) {
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, {
			cwd: options.cwd ?? repoRoot,
			env: {
				...process.env,
				...(options.env ?? {})
			},
			stdio: 'pipe',
			shell: process.platform === 'win32'
		});

		let stdout = '';
		let stderr = '';

		child.stdout?.on('data', (chunk) => {
			stdout += String(chunk);
		});
		child.stderr?.on('data', (chunk) => {
			stderr += String(chunk);
		});
		child.on('error', reject);
		child.on('close', (code) => {
			if (code === 0) {
				resolve({ stdout, stderr });
				return;
			}
			reject(new Error(`${command} ${args.join(' ')} exited ${code}\n${stdout}\n${stderr}`));
		});
	});
}

export async function assertPackageExportShape(
	packageJsonPath = path.join(repoRoot, 'package.json')
) {
	const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
	const adapterExport = packageJson.exports?.['./adapter'] ?? packageJson.exports?.['.'];
	const files = packageJson.files ?? [];

	if (!adapterExport) {
		throw new Error('package.json must export ./adapter or . for external consumers.');
	}

	if (!files.includes('adapter/index.js')) {
		throw new Error('package.json files must include adapter/index.js.');
	}
	if (!files.includes('adapter/declarations')) {
		throw new Error('package.json files must include adapter/declarations.');
	}
	if (
		typeof adapterExport !== 'object' ||
		adapterExport.types !== './adapter/declarations/index.d.ts'
	) {
		throw new Error('The adapter export must expose generated TypeScript declarations.');
	}

	return {
		name: packageJson.name,
		version: packageJson.version,
		private: Boolean(packageJson.private),
		adapterExport
	};
}

/**
 * @param {string} stdout
 * @returns {{name: string, version: string, filename: string, unpackedSize: number, files?: {path: string}[]}}
 */
function parsePackManifest(stdout) {
	const trimmed = stdout.trim();
	const jsonStarts = [...trimmed.matchAll(/\[/g)].map((match) => match.index ?? -1);
	let manifest;

	for (const jsonStart of jsonStarts) {
		try {
			const parsed = JSON.parse(trimmed.slice(jsonStart));
			if (Array.isArray(parsed)) {
				manifest = parsed;
				break;
			}
		} catch {
			// npm lifecycle scripts can print bracket-prefixed logs before the JSON manifest.
		}
	}

	if (!manifest) {
		throw new Error(`npm pack --json did not return a JSON array:\n${stdout}`);
	}

	if (!Array.isArray(manifest) || manifest.length !== 1) {
		throw new Error(`Expected exactly one npm pack manifest entry, received ${manifest.length}.`);
	}

	return manifest[0];
}

/** @param {Awaited<ReturnType<typeof assertPackageExportShape>>} exportShape */
export async function createAndAssertPackagePack(exportShape) {
	const result = await run('npm', ['pack', '--json']);
	const pack = parsePackManifest(result.stdout);
	const files = (pack.files ?? []).map((file) => String(file.path).replaceAll('\\', '/')).sort();

	if (pack.name !== exportShape.name) {
		throw new Error(
			`Packed package name mismatch: expected ${exportShape.name}, received ${pack.name}.`
		);
	}

	if (pack.version !== exportShape.version) {
		throw new Error(
			`Packed package version mismatch: expected ${exportShape.version}, received ${pack.version}.`
		);
	}

	for (const requiredFile of requiredPackFiles) {
		if (!files.includes(requiredFile)) {
			throw new Error(`Packed package is missing required file: ${requiredFile}.`);
		}
	}

	const forbiddenFiles = files.filter(
		(file) =>
			forbiddenPackExactFiles.has(file) ||
			file.startsWith('.env.') ||
			forbiddenPackPrefixes.some((prefix) => file.startsWith(prefix))
	);

	if (forbiddenFiles.length > 0) {
		throw new Error(`Packed package includes forbidden files:\n${forbiddenFiles.join('\n')}`);
	}

	return {
		filename: pack.filename,
		tarballPath: path.resolve(repoRoot, pack.filename),
		fileCount: files.length,
		unpackedSize: pack.unpackedSize,
		files
	};
}

/** @param {string} tempRoot @param {string} tarballPath */
async function installPackedPackage(tempRoot, tarballPath) {
	await writeFile(
		path.join(tempRoot, 'package.json'),
		`${JSON.stringify(
			{
				name: 'sveltekit-php-alpha-consumer-smoke',
				private: true,
				type: 'module'
			},
			null,
			2
		)}\n`
	);

	await run(
		'npm',
		[
			'install',
			'--ignore-scripts',
			'--no-audit',
			'--no-fund',
			'--package-lock=false',
			tarballPath,
			'typescript@5.9.3',
			'@types/node@22'
		],
		{
			cwd: tempRoot
		}
	);
}

async function main() {
	const keep = process.argv.includes('--keep');
	const exportShape = await assertPackageExportShape();
	const packManifest = await createAndAssertPackagePack(exportShape);
	const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'sveltekit-php-alpha-consumer-'));

	try {
		await installPackedPackage(tempRoot, packManifest.tarballPath);
		const consumerPath = path.join(tempRoot, 'consumer.mjs');
		await writeFile(
			consumerPath,
			[
				"import adapter from 'sveltekit-php/adapter';",
				"if (typeof adapter !== 'function') {",
				"  throw new Error('Expected sveltekit-php/adapter default export to be a function');",
				'}',
				"console.log('consumer import ok');",
				''
			].join('\n')
		);

		const nodeBin = process.execPath;
		const result = await run(nodeBin, [consumerPath], { cwd: tempRoot });
		process.stdout.write(result.stdout);
		process.stderr.write(result.stderr);

		await writeFile(
			path.join(tempRoot, 'consumer.ts'),
			[
				"import adapter, { type AdapterMode, type AdapterOptions, type BuildIdentityContract } from 'sveltekit-php';",
				"import adapterFromSubpath from 'sveltekit-php/adapter';",
				"import type { Adapter } from '@sveltejs/kit';",
				"const identity: BuildIdentityContract = { name: 'canopy', required: ['site-shell--canopy'] };",
				"const mode: AdapterMode = 'php-static';",
				"const options = { mode, fallback: 'errors/200.html', strict: true, buildIdentity: identity } satisfies AdapterOptions;",
				'const configured: Adapter = adapter(options);',
				'const configuredSubpath: Adapter = adapterFromSubpath(options);',
				'void configured; void configuredSubpath;',
				'// @ts-expect-error invalid modes remain rejected',
				"adapter({ mode: 'php_static' });",
				'// @ts-expect-error fallback does not accept arbitrary values',
				'adapter({ fallback: 42 });',
				''
			].join('\n')
		);
		await writeFile(
			path.join(tempRoot, 'tsconfig.json'),
			`${JSON.stringify({ compilerOptions: { strict: true, module: 'NodeNext', moduleResolution: 'NodeNext', noEmit: true, skipLibCheck: false }, files: ['consumer.ts'] }, null, 2)}\n`
		);
		await run('npm', ['exec', '--', 'tsc', '--project', 'tsconfig.json'], { cwd: tempRoot });
		console.log('consumer TypeScript API ok');
		console.log(
			`Alpha consumer smoke passed for ${exportShape.name}@${exportShape.version} via ${JSON.stringify(exportShape.adapterExport)}.`
		);
		console.log(
			`Publish manifest smoke passed for ${packManifest.filename} with ${packManifest.fileCount} files.`
		);
		if (exportShape.private) {
			console.log(
				'Package is still marked private; this smoke proves import shape, not publish readiness.'
			);
		}
	} finally {
		if (!keep) {
			await rm(packManifest.tarballPath, { force: true });
		} else {
			console.log(`Kept package tarball: ${packManifest.tarballPath}`);
		}

		if (!keep) {
			await rm(tempRoot, { recursive: true, force: true });
		} else {
			console.log(`Kept consumer smoke temp directory: ${tempRoot}`);
		}
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	await main();
}
