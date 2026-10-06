// Real consumer builds and HTTP acceptance, isolated from repository/app output.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile, readdir, rm } from 'node:fs/promises';
import { createServer } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PACKAGE_VERSION } from './utils/release-snapshot.mjs';
import { createHash } from 'node:crypto';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scratch = await mkdtemp(path.join(os.tmpdir(), 'sveltekit-php-kit-compat-'));
const keep = process.argv.includes('--keep');
const lanes = [
	{ kit: '3.0.1', svelte: '5.57.1', vite: '8.3.3', plugin: '7.3.1', typescript: '6.0.3' },
	{ kit: '2.49.2', svelte: '5.57.1', vite: '7.2.6', plugin: '6.2.1', typescript: '5.9.3' }
];
const results = [];
const adapterSha256 = createHash('sha256').update(await readFile(path.join(repo, 'adapter/index.js'))).digest('hex');
function run(command, args, cwd, env = {}) {
	return new Promise((resolve, reject) => {
		const windowsNpm = command === 'npm' && process.platform === 'win32';
		const child = spawn(windowsNpm ? process.execPath : command,
			windowsNpm ? [path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js'), ...args] : args,
			{ cwd, env: { ...process.env, ...env }, windowsHide: true });
		let output = '';
		child.stdout.on('data', (data) => { output += data; });
		child.stderr.on('data', (data) => { output += data; });
		child.on('error', reject);
		child.on('close', (code) => code === 0 ? resolve(output) : reject(new Error(`${command} ${args.join(' ')}: ${code}\n${output}`)));
	});
}
async function put(root, name, value) {
	const dest = path.join(root, name);
	await mkdir(path.dirname(dest), { recursive: true });
	await writeFile(dest, value);
}
async function files(root) {
	const found = [];
	for (const entry of await readdir(root, { withFileTypes: true })) {
		const file = path.join(root, entry.name);
		if (entry.isDirectory()) found.push(...await files(file));
		else found.push(file);
	}
	return found;
}
async function freePort() {
	const server = createServer();
	await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
	const port = server.address().port;
	await new Promise((resolve) => server.close(resolve));
	return port;
}
async function serve(command, args, cwd, env, accept) {
	const child = spawn(command, args, { cwd, env: { ...process.env, ...env }, windowsHide: true });
	let logs = '';
	child.stdout.on('data', (data) => { logs += data; });
	child.stderr.on('data', (data) => { logs += data; });
	let failure;
	child.on('error', (error) => { failure = error; });
	try {
		await accept(async (url) => {
			for (let attempt = 0; attempt < 100; attempt++) {
				if (failure || child.exitCode !== null) throw failure ?? new Error(logs);
				try { return await fetch(url); } catch { await new Promise((resolve) => setTimeout(resolve, 100)); }
			}
			throw new Error(`Server did not start: ${logs}`);
		});
	} catch (error) {
		throw new Error(`${error.stack}\n${logs}`);
	} finally {
		child.kill();
		await new Promise((resolve) => child.exitCode !== null ? resolve() : child.once('exit', resolve));
	}
}
async function fixture(root, lane) {
	const kit3 = lane.kit.startsWith('3.');
	await put(root, 'package.json', JSON.stringify({ name: 'kit-compat-fixture', private: true, type: 'module', dependencies: {
		'sveltekit-php': `file:${path.join(scratch, 'adapter.tgz').replaceAll('\\', '/')}`,
		'@sveltejs/kit': lane.kit, svelte: lane.svelte, vite: lane.vite,
		'@sveltejs/vite-plugin-svelte': lane.plugin, typescript: lane.typescript, '@types/node': '22.19.0'
	} }, null, 2));
	await run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund'], root);
	const options = `{
		adapter: adapter({ mode: process.env.FIXTURE_MODE, out: 'build', assets: 'build', fallback: false, precompress: true }),
		files: { routes: 'src/marketing-routes' },
		paths: { base: process.env.FIXTURE_BASE || '', relative: false }, appDir: 'cos-app',
		prerender: { entries: ['/', '/marketing', '/feed.json'], crawl: false }
		${kit3 ? '' : ", experimental: { instrumentation: { server: process.env.FIXTURE_MODE === 'js-ssr' } }"}
	}`;
	if (!kit3) await put(root, 'svelte.config.js', `import adapter from 'sveltekit-php';\nexport default { kit: ${options} };\n`);
	await put(root, 'vite.config.js', `import { sveltekit } from '@sveltejs/kit/vite';\n${kit3 ? "import adapter from 'sveltekit-php';" : ''}\nexport default { build: { assetsInlineLimit: 0 }, plugins: [sveltekit(${kit3 ? options : ''})] };\n`);
	await put(root, 'consumer.ts', `import adapter from 'sveltekit-php';\nimport subpath from 'sveltekit-php/adapter';\nimport type { Adapter } from '@sveltejs/kit';\nconst a: Adapter = adapter({ mode: 'php-static' });\nconst b: Adapter = subpath({ mode: 'js-ssr' });\nvoid a; void b;\n// @ts-expect-error invalid mode\nadapter({ mode: 'php_static' });\n`);
	await put(root, 'tsconfig.consumer.json', JSON.stringify({ compilerOptions: { strict: true, module: 'NodeNext', moduleResolution: 'NodeNext', noEmit: true, skipLibCheck: false }, files: ['consumer.ts'] }));
	await run('npm', ['exec', '--', 'tsc', '-p', 'tsconfig.consumer.json'], root);
	await put(root, 'src/app.html', '<!doctype html><html lang="en"><head>%sveltekit.head%</head><body><div>%sveltekit.body%</div></body></html>');
	for (const route of ['', 'marketing']) {
		await put(root, `src/marketing-routes/${route}/+page.js`, "export const prerender = true; export const csr = false;");
		await put(root, `src/marketing-routes/${route}/+page.svelte`, `<script>import { asset, resolve } from "$app/paths";</script><svelte:head><title>Kit compatibility</title></svelte:head><main data-fixture="marketing"><h1>PHP marketing fixture</h1><a href={resolve("/marketing")}>Marketing</a><img src={asset("${kit3 ? 'logo.svg' : '/logo.svg'}")} alt="Fixture logo" /></main>`);
	}
	await put(root, 'static/logo.svg', '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" /></svg>');
	await put(root, 'src/marketing-routes/feed.json/+server.js', 'export const prerender = true; export function GET() { return Response.json({ staticFeed: true }); }');
	await put(root, 'src/marketing-routes/php-api/+server.php', '<?php\nfunction GET($event) { return ["body" => ["phpEndpoint" => true]]; }');
	await put(root, 'src/marketing-routes/live/+page.svelte', '<script>let { data } = $props();</script><h1 data-live>{data.value}</h1>');
	await put(root, 'src/marketing-routes/live/+page.server.js', 'export function load() { return { value: "request-time SSR" }; }');
	// A bundled endpoint resolves import.meta.url at runtime; use a cwd file like CoS's anchored repo files.
	await put(root, 'src/marketing-routes/node-api/+server.js', 'import { readFile } from "node:fs/promises";\nexport async function GET({ cookies }) { cookies.set("fixture", "yes", { path: "/" }); return new Response(await readFile("private.txt"), { headers: { "Content-Type": "text/plain" } }); }\nexport async function POST({ request }) { return new Response(await request.text(), { status: 201 }); }');
	await put(root, 'private.txt', 'repo-file-byte-proof\n');
}
async function acceptance(root, mode, base) {
	const build = path.join(root, 'build');
	const emitted = await files(build);
	for (const php of emitted.filter((file) => file.endsWith('.php'))) await run('php', ['-l', php], root);
	assert(emitted.some((file) => file.endsWith('.gz')), 'compressed assets emitted');
	assert(emitted.some((file) => file.endsWith('.br')), 'brotli assets emitted');
	assert.equal(await readFile(path.join(build, 'logo.svg'), 'utf8'), await readFile(path.join(root, 'static/logo.svg'), 'utf8'));
	assert.deepEqual(JSON.parse(await readFile(path.join(build, 'feed.json'), 'utf8')), { staticFeed: true });
	const stamp = JSON.parse(await readFile(path.join(build, '_runtime/build-stamp.json'), 'utf8'));
	assert.equal(stamp.adapterVersion, PACKAGE_VERSION); assert.equal(stamp.basePath, base);
	const port = await freePort();
	const origin = `http://127.0.0.1:${port}`;
	await serve('php', ['-S', `127.0.0.1:${port}`, '-t', build, path.join(build, 'router.php')], root, {}, async (ready) => {
		await ready(origin + base + '/');
		if (mode === 'php-static') {
			for (const route of ['/', '/marketing']) {
				const response = await fetch(origin + base + route);
				assert.equal(response.status, 200);
				const html = await response.text();
				assert.match(html, /data-fixture="marketing"/); assert(!html.includes('__sveltekit_'));
				assert(html.includes(`${base}/logo.svg`)); assert(html.includes(`${base}/marketing`));
			}
			const phpResponse = await fetch(origin + base + '/php-api');
			assert.equal(phpResponse.status, 200); assert.match(await phpResponse.text(), /phpEndpoint/);
			assert.equal((await fetch(origin + base + '/missing.js')).status, 404);
			assert.equal((await fetch(origin + base + '/_protected/private.txt')).status, 403);
		}
		const asset = await fetch(origin + base + '/logo.svg'); assert.equal(asset.status, 200);
		assert.equal(await asset.text(), await readFile(path.join(build, 'logo.svg'), 'utf8'));
	});
	if (mode === 'js-ssr') {
		assert(!emitted.includes(path.join(build, 'node-api/index.php')), 'JavaScript endpoint must reach the sidecar');
		const nodePort = await freePort();
		const nodeOrigin = `http://127.0.0.1:${nodePort}`;
		await serve(process.execPath, [path.join(build, 'server/handler.mjs')], root, { PORT: String(nodePort) }, async (ready) => {
			const response = await ready(nodeOrigin + base + '/live'); assert.equal(response.status, 200);
			assert.match(await response.text(), /request-time SSR/);
			const api = await fetch(nodeOrigin + base + '/node-api'); assert.equal(api.status, 200);
			assert.equal(await api.text(), 'repo-file-byte-proof\n'); assert.match(api.headers.get('set-cookie'), /fixture=yes/);
			assert.equal(api.headers.get('x-instrumented'), 'yes');
			const read = await fetch(nodeOrigin + base + '/read-asset'); assert.equal(read.status, 200);
			assert.equal(await read.text(), await readFile(path.join(root, 'static/logo.svg'), 'utf8'));
			const post = await fetch(nodeOrigin + base + '/node-api', { method: 'POST', headers: { Origin: nodeOrigin }, body: 'body-byte-proof' });
			assert.equal(post.status, 201); assert.equal(await post.text(), 'body-byte-proof');
			const phpPort = await freePort();
			const phpOrigin = `http://127.0.0.1:${phpPort}`;
			await serve('php', ['-S', `127.0.0.1:${phpPort}`, '-t', build, path.join(build, 'router.php')], root, { SIDECAR_PORT: String(nodePort) }, async (phpReady) => {
				const proxy = await phpReady(phpOrigin + base + '/live'); assert.equal(proxy.status, 200);
				assert.match(await proxy.text(), /request-time SSR/);
				for (const route of ['/', '/marketing']) {
					const page = await fetch(phpOrigin + base + route); assert.equal(page.status, 200);
					assert.match(await page.text(), /data-fixture="marketing"/);
				}
				const apiProxy = await fetch(phpOrigin + base + '/node-api'); assert.equal(apiProxy.status, 200);
				assert.equal(await apiProxy.text(), 'repo-file-byte-proof\n'); assert.match(apiProxy.headers.get('set-cookie'), /fixture=yes/);
				const posted = await fetch(phpOrigin + base + '/node-api', { method: 'POST', headers: { Origin: phpOrigin }, body: 'proxy-body-proof' });
				assert.equal(posted.status, 201); assert.equal(await posted.text(), 'proxy-body-proof');
			});
		});
	}
}
try {
	const packOutput = await run('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', scratch], repo);
	const packed = JSON.parse(packOutput.slice(packOutput.search(/^\[/m)));
	await import('node:fs/promises').then(({ rename }) => rename(path.join(scratch, packed[0].filename), path.join(scratch, 'adapter.tgz')));
	for (const lane of lanes) {
		const root = path.join(scratch, `kit-${lane.kit}`); await mkdir(root);
		console.log(`Installing isolated fixture: Kit ${lane.kit}`); await fixture(root, lane);
		for (const mode of ['php-static', 'js-ssr']) {
			if (mode === 'js-ssr') {
				await put(root, 'src/instrumentation.server.js', 'globalThis.__fixtureInstrumented = true;');
				await put(root, 'src/hooks.server.js', 'export async function handle({ event, resolve }) { const response = await resolve(event); response.headers.set("x-instrumented", globalThis.__fixtureInstrumented ? "yes" : "no"); return response; }');
				await put(root, 'src/marketing-routes/read-asset/+server.js', 'import { read } from "$app/server"; import logo from "../../../static/logo.svg"; export function GET() { return read(logo); }');
			}
			for (const base of ['', '/sites/cos']) {
				console.log(`Building/serving Kit ${lane.kit} ${mode} ${base || '/'}`);
				await run(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js'), 'build'], root, { FIXTURE_MODE: mode, FIXTURE_BASE: base });
				await acceptance(root, mode, base);
				results.push({ ...lane, mode, base, result: 'passed' });
			}
		}
	}
	await mkdir(path.join(repo, 'report'), { recursive: true });
	await writeFile(path.join(repo, 'report/kit-compatibility.json'), JSON.stringify({ date: new Date().toISOString(), adapterVersion: PACKAGE_VERSION, adapterSha256, node: process.version, fixtureRoot: keep ? scratch : null, results }, null, 2));
	console.log(JSON.stringify(results, null, 2));
} finally {
	if (keep) console.log(`Kept fixtures: ${scratch}`);
	else await rm(scratch, { recursive: true, force: true });
}
