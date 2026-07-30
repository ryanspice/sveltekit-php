// @ts-nocheck
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const keep = process.argv.includes('--keep');

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

async function npmView(packageSpec, field) {
	const result = await run('npm', ['view', packageSpec, field, '--silent']);
	return result.stdout.trim();
}

async function assertPublishedAlphaVersion(expectedVersion) {
	let publishedVersion = '';
	try {
		publishedVersion = await npmView('sveltekit-php@alpha', 'version');
	} catch (error) {
		throw new Error(
			`Could not resolve sveltekit-php@alpha from npm. Publish with "npm publish --tag alpha" before running this smoke.\n${error.message}`
		);
	}

	if (publishedVersion !== expectedVersion) {
		throw new Error(
			`sveltekit-php@alpha resolves to ${publishedVersion}, expected ${expectedVersion}. Publish or retag the verified alpha before RC.`
		);
	}

	return publishedVersion;
}

async function writeFixture(tempRoot, packageJson) {
	const svelteVersion = await npmView('svelte', 'version');
	const kitVersion = await npmView('@sveltejs/kit', 'version');
	const viteRange = packageJson.devDependencies?.vite ?? '^7.2.6';
	const pluginRange = packageJson.devDependencies?.['@sveltejs/vite-plugin-svelte'] ?? '^6.2.1';

	await writeFile(
		path.join(tempRoot, 'package.json'),
		`${JSON.stringify(
			{
				name: 'sveltekit-php-published-alpha-smoke',
				private: true,
				type: 'module',
				scripts: {
					build: 'vite build'
				},
				dependencies: {
					'sveltekit-php': 'alpha',
					svelte: svelteVersion,
					'@sveltejs/kit': kitVersion,
					'@sveltejs/vite-plugin-svelte': pluginRange,
					vite: viteRange
				}
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
	await writeFile(path.join(tempRoot, 'src', 'routes', '+page.js'), ['export const prerender = true;', 'export const csr = false;', ''].join('\n'));
	await writeFile(
		path.join(tempRoot, 'src', 'routes', '+page.svelte'),
		[
			'<svelte:head>',
			'  <title>published alpha smoke</title>',
			'</svelte:head>',
			'',
			'<main data-published-alpha-smoke="sveltekit-php">',
			'  <h1>published alpha smoke</h1>',
			'  <p>adapter build output verified from npm alpha dist-tag.</p>',
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

async function assertBuildOutput(tempRoot, publishedVersion) {
	const buildRoot = path.join(tempRoot, 'build');
	const requiredFiles = [
		path.join(buildRoot, 'index.php'),
		path.join(buildRoot, '.htaccess'),
		path.join(buildRoot, 'router.php'),
		path.join(buildRoot, '_runtime', 'compat.php'),
		path.join(buildRoot, 'adapter', 'route-manifest.php')
	];

	for (const filePath of requiredFiles) {
		await assertFileExists(filePath);
	}

	const html = await readFile(path.join(buildRoot, 'index.php'), 'utf8');
	if (!html.includes('data-published-alpha-smoke="sveltekit-php"')) {
		throw new Error('Generated index.php is missing published alpha fixture marker.');
	}

	if (html.includes('sveltekit:start') || html.includes('data-sveltekit-hydrate')) {
		throw new Error('Published alpha csr=false fixture should not include hydration bootstrap markers.');
	}

	console.log(`PASS published-alpha-smoke: installed sveltekit-php@alpha (${publishedVersion}) from npm.`);
	console.log('PASS published-alpha-smoke: output includes index.php, .htaccess, router.php, compat.php, and route manifest.');
	console.log('PASS published-alpha-smoke: prerendered csr=false page has no SvelteKit hydration bootstrap markers.');
}

async function main() {
	const packageJson = JSON.parse(await readFile(path.join(repoRoot, 'package.json'), 'utf8'));
	const publishedVersion = await assertPublishedAlphaVersion(packageJson.version);
	const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'sveltekit-php-published-alpha-'));

	try {
		await writeFixture(tempRoot, packageJson);
		await run('npm', ['install', '--no-audit', '--no-fund', '--package-lock=false'], { cwd: tempRoot });
		await run('npm', ['run', 'build'], {
			cwd: tempRoot,
			env: {
				ADAPTER_MODE: 'php-static',
				NODE_ENV: 'production'
			}
		});
		await assertBuildOutput(tempRoot, publishedVersion);
	} finally {
		if (!keep) {
			await rm(tempRoot, { recursive: true, force: true });
		} else {
			console.log(`Kept published alpha smoke temp directory: ${tempRoot}`);
		}
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	await main();
}
