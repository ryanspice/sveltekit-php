// @ts-nocheck
import { mkdtemp, readFile, rm, writeFile, mkdir, access } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { assertPackageExportShape, createAndAssertPackagePack } from './smoke-alpha-consumer.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const keep = process.argv.includes('--keep');
const expectedMajors = {
	svelte: 5,
	'@sveltejs/kit': 2,
	'@sveltejs/vite-plugin-svelte': 7,
	vite: 8
};

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

async function npmLatestVersion(packageName) {
	const result = await run('npm', ['view', packageName, 'version', '--silent']);
	return result.stdout.trim();
}

function majorOf(version) {
	const major = Number(String(version).split('.')[0]);
	if (!Number.isInteger(major)) {
		throw new Error(`Could not parse package major from version: ${version}`);
	}
	return major;
}

async function assertLatestViteMajorTargets() {
	const versions = {};
	for (const [packageName, expectedMajor] of Object.entries(expectedMajors)) {
		const version = await npmLatestVersion(packageName);
		const actualMajor = majorOf(version);
		if (actualMajor !== expectedMajor) {
			throw new Error(
				`${packageName}@${version} is not in the expected validation major (${expectedMajor}.x). Update the audit before claiming latest-major validation support.`
			);
		}
		versions[packageName] = version;
	}
	return versions;
}

async function writeFixture(tempRoot, tarballPath, packageJson, versions) {
	const viteRange = versions.vite;
	const pluginRange = versions['@sveltejs/vite-plugin-svelte'];
	const tarballSpec = `file:${tarballPath.replace(/\\/g, '/')}`;

	await writeFile(
		path.join(tempRoot, 'package.json'),
		`${JSON.stringify(
			{
				name: 'sveltekit-php-latest-vite-major-smoke',
				private: true,
				type: 'module',
				scripts: {
					build: 'vite build'
				},
				dependencies: {
					'sveltekit-php': tarballSpec,
					svelte: versions.svelte,
					'@sveltejs/kit': versions['@sveltejs/kit'],
					'@sveltejs/vite-plugin-svelte': pluginRange,
					vite: viteRange
				},
				devDependencies: {}
			},
			null,
			2
		)}\n`
	);

	await writeFile(
		path.join(tempRoot, 'svelte.config.js'),
		[
			"import adapter from 'sveltekit-php/adapter';",
			'',
			'/** @type {import("@sveltejs/kit").Config} */',
			'const config = {',
			'  kit: {',
			'    adapter: adapter({ mode: "php-static", out: "build", assets: "build", strict: true }),',
			'    paths: { relative: false },',
			'    prerender: { entries: ["/"] }',
			'  }',
			'};',
			'',
			'export default config;',
			''
		].join('\n')
	);

	await writeFile(
		path.join(tempRoot, 'vite.config.js'),
		[
			"import { sveltekit } from '@sveltejs/kit/vite';",
			'',
			'/** @type {import("vite").UserConfig} */',
			'const config = {',
			'  plugins: [sveltekit()]',
			'};',
			'',
			'export default config;',
			''
		].join('\n')
	);

	await mkdir(path.join(tempRoot, 'src', 'routes'), { recursive: true });
	await writeFile(
		path.join(tempRoot, 'src', 'app.html'),
		[
			'<!doctype html>',
			'<html lang="en">',
			'  <head>%sveltekit.head%</head>',
			'  <body><div style="display: contents">%sveltekit.body%</div></body>',
			'</html>',
			''
		].join('\n')
	);
	await writeFile(
		path.join(tempRoot, 'src', 'routes', '+page.js'),
		['export const prerender = true;', 'export const csr = false;', ''].join('\n')
	);
	await writeFile(
		path.join(tempRoot, 'src', 'routes', '+page.svelte'),
		[
			'<svelte:head>',
			'  <title>latest Vite-major smoke</title>',
			'</svelte:head>',
			'',
			'<main data-latest-vite-major-smoke="sveltekit-php">',
			'  <h1>latest Vite-major smoke</h1>',
			'  <p>adapter build output verified with latest Svelte 5, SvelteKit 2, Vite 8, and vite-plugin-svelte 7.</p>',
			'</main>',
			''
		].join('\n')
	);
}

async function assertFileExists(filePath) {
	try {
		await access(filePath);
	} catch {
		throw new Error(`Expected generated file to exist: ${filePath}`);
	}
}

async function assertBuildOutput(tempRoot, versions) {
	const buildRoot = path.join(tempRoot, 'build');
	const indexPhp = path.join(buildRoot, 'index.php');
	const htaccess = path.join(buildRoot, '.htaccess');
	const routerPhp = path.join(buildRoot, 'router.php');
	const compatPhp = path.join(buildRoot, '_runtime', 'compat.php');
	const routeManifest = path.join(buildRoot, 'adapter', 'route-manifest.php');

	for (const filePath of [indexPhp, htaccess, routerPhp, compatPhp, routeManifest]) {
		await assertFileExists(filePath);
	}

	const html = await readFile(indexPhp, 'utf8');
	if (!html.includes('data-latest-vite-major-smoke="sveltekit-php"')) {
		throw new Error('Generated index.php is missing latest Vite-major fixture marker.');
	}

	if (html.includes('sveltekit:start') || html.includes('data-sveltekit-hydrate')) {
		throw new Error('Generated csr=false fixture should not include hydration bootstrap markers.');
	}

	console.log(
		`PASS latest-vite-major-smoke: built php-static fixture with svelte@${versions.svelte}, @sveltejs/kit@${versions['@sveltejs/kit']}, @sveltejs/vite-plugin-svelte@${versions['@sveltejs/vite-plugin-svelte']}, and vite@${versions.vite}.`
	);
	console.log('PASS latest-vite-major-smoke: output includes index.php, .htaccess, router.php, compat.php, and route manifest.');
}

async function main() {
	const packageJson = JSON.parse(await readFile(path.join(repoRoot, 'package.json'), 'utf8'));
	const versions = await assertLatestViteMajorTargets();
	const exportShape = await assertPackageExportShape();
	const packManifest = await createAndAssertPackagePack(exportShape);
	const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'sveltekit-php-latest-vite-major-'));

	try {
		await writeFixture(tempRoot, packManifest.tarballPath, packageJson, versions);
		await run('npm', ['install', '--no-audit', '--no-fund', '--package-lock=false'], { cwd: tempRoot });
		await run('npm', ['run', 'build'], {
			cwd: tempRoot,
			env: {
				ADAPTER_MODE: 'php-static',
				NODE_ENV: 'production'
			}
		});
		await assertBuildOutput(tempRoot, versions);
	} finally {
		if (!keep) {
			await rm(packManifest.tarballPath, { force: true });
			await rm(tempRoot, { recursive: true, force: true });
		} else {
			console.log(`Kept package tarball: ${packManifest.tarballPath}`);
			console.log(`Kept latest Vite-major temp directory: ${tempRoot}`);
		}
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	await main();
}

