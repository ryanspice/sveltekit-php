import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import type { Builder } from '@sveltejs/kit';
import adapter from '../../adapter/src/index.ts';
import { fixture, port, start } from '../helpers/runtime-security';

const html =
	'<!doctype html><script>kit.start(app, element, { node_ids: [0, 1], data: [null, null] });</script>';
const payload = (id: string) =>
	JSON.stringify({ type: 'data', nodes: [null, { type: 'data', data: [{ id: 1 }, id] }] });

function createBuilder(root: string, base: string, directoryForm: boolean, pageHtml = html) {
	const routes = path.join(root, 'src/routes');
	fs.mkdirSync(routes, { recursive: true });
	const pages = directoryForm
		? [
				['/legacy', 'nested/index.html'],
				['/', 'index.html']
			]
		: [
				['/optional/test-id', 'optional/test-id.html'],
				['/optional', 'optional.html'],
				['/', 'index.html']
			];
	const builder = {
		log: { minor() {}, warn() {}, error() {} },
		rimraf: (dir: string) => fs.rmSync(dir, { recursive: true, force: true }),
		mkdirp: (dir: string) => fs.mkdirSync(dir, { recursive: true }),
		getBuildDirectory: (name: string) => path.join(root, '.svelte-kit', name),
		writeClient: () => [],
		writePrerendered: (dest: string) => {
			const files = directoryForm
				? {
						'index.html': pageHtml,
						'__data.json': payload('ROOT'),
						'nested/index.html': pageHtml,
						'nested/__data.json': payload('DIRECTORY_FALLBACK')
					}
				: {
						'index.html': pageHtml,
						'__data.json': payload('ROOT'),
						'optional.html': pageHtml,
						'optional/__data.json': payload('PARENT'),
						'optional/test-id.html': pageHtml,
						'optional/test-id/__data.json': payload('CHILD')
					};
			for (const [file, data] of Object.entries(files)) {
				const target = path.join(dest, file);
				fs.mkdirSync(path.dirname(target), { recursive: true });
				fs.writeFileSync(target, data);
			}
		},
		copy: (src: string, dest: string) => {
			fs.mkdirSync(path.dirname(dest), { recursive: true });
			fs.cpSync(src, dest, { recursive: true });
		},
		compress() {},
		generateManifest: () => '{}',
		config: { paths: { base, assets: '' }, files: { routes } },
		routes: [],
		prerendered: { pages: new Map(pages.map(([route, file]) => [base + route, { file }])) }
	};
	return builder as unknown as Builder;
}

function embeddedData(file: string) {
	const php = fs.readFileSync(file, 'utf8');
	const encoded = php.match(/\$templateJson = base64_decode\('([^']+)'\)/)?.[1];
	expect(encoded, file).toBeTruthy();
	return JSON.parse(Buffer.from(encoded!, 'base64').toString('utf8'));
}

describe('prerendered data template selection', () => {
	for (const base of ['', '/sites/demo']) {
		for (const baseMode of ['fixed', 'auto'] as const) {
			it.each([undefined, false, true])(
				`preserves visible samples and replaces Kit data over PHP HTTP at ${base || '/'}, ${baseMode}, omission=%s`,
				async (omitUnusedBridges) => {
					const owned = fixture();
					const out = path.join(owned.root, 'build');
					const sample = '<pre>const data = ["VISIBLE"]; data: {example:true}</pre>';
					const pageHtml = `<!doctype html><html><head></head><body>${sample}<script nonce="fixture">__sveltekit_test = {base:"${base}", assets:"${base}"}; kit.start(app, element, {node_ids:[0,2], data:[null,{type:"data",data:{id:"BUILD"}}], form:null, error:null});</script></body></html>`;
					const b = createBuilder(owned.root, base, false, pageHtml);
					b.routes = [
						{ id: '/', pattern: /^\/$/, prerender: true },
						{ id: '/optional', pattern: /^\/optional\/?$/, prerender: true },
						{ id: '/optional/test-id', pattern: /^\/optional\/test-id\/?$/, prerender: true }
					] as Builder['routes'];
					fs.writeFileSync(
						path.join(owned.root, 'src/routes/+page.server.php'),
						'<?php function load($event) { return ["id" => "RUNTIME", "unsafe" => "</script><script>BAD</script>"]; }'
					);
					await adapter({
						out,
						assets: out,
						basePath: base,
						baseMode,
						omitUnusedBridges,
						strict: false
					}).adapt(b);
					const php = fs.readFileSync(path.join(out, base, 'index.php'), 'utf8');
					expect(php).toContain(sample);
					expect(php).not.toContain('id:"BUILD"');
					expect(php).toContain('data:(function(){ const d = <?php echo $dataPayload; ?>;');
					const origin = `http://127.0.0.1:${await port()}`;
					await start(
						owned,
						'php',
						['-n', '-S', origin.slice(7), '-t', out, path.join(out, 'router.php')],
						origin,
						{ SK_BASE_PATH: base }
					);
					const response = await fetch(origin + base + '/');
					expect(response.status).toBe(200);
					const document = await response.text();
					expect(document).toContain(sample);
					expect(document).toContain('RUNTIME');
					expect(document).not.toContain('<script>BAD</script>');
					expect(document).not.toMatch(/Fatal error|Uncaught Error/);
					const hydration = document.match(/const d = (.*?); return d;/)?.[1];
					expect(JSON.parse(hydration!)[1].data.id).toBe('RUNTIME');
					const dataResponse = await fetch(origin + base + '/__data.json');
					expect(dataResponse.status).toBe(200);
					expect(await dataResponse.text()).toContain('RUNTIME');
				}
			);
		}
	}

	it.each(['', '/sites/demo'])(
		'keeps flat child and parent page data distinct at base %s',
		async (base) => {
			const owned = fixture();
			const out = path.join(owned.root, 'build');
			await adapter({ mode: 'php-static', out, assets: out, basePath: base, strict: false }).adapt(
				createBuilder(owned.root, base, false)
			);
			expect(embeddedData(path.join(out, base, 'optional/test-id/index.php'))).toEqual(
				JSON.parse(payload('CHILD'))
			);
			expect(embeddedData(path.join(out, base, 'optional/index.php'))).toEqual(
				JSON.parse(payload('PARENT'))
			);
			expect(embeddedData(path.join(out, base, 'index.php'))).toEqual(JSON.parse(payload('ROOT')));
		}
	);
	it.each(['', '/sites/demo'])(
		'retains index-page and sibling-directory fallback data at base %s',
		async (base) => {
			const owned = fixture();
			const out = path.join(owned.root, 'build');
			await adapter({ mode: 'php-static', out, assets: out, basePath: base, strict: false }).adapt(
				createBuilder(owned.root, base, true)
			);
			expect(embeddedData(path.join(out, base, 'legacy/index.php'))).toEqual(
				JSON.parse(payload('DIRECTORY_FALLBACK'))
			);
			expect(embeddedData(path.join(out, base, 'index.php'))).toEqual(JSON.parse(payload('ROOT')));
		}
	);
});
