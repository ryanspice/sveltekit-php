import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import type { Builder } from '@sveltejs/kit';
import adapter from '../../adapter/src/index.ts';
import { canOmitPageBridges } from '../../adapter/src/utils/bridges.ts';
import { normalizeAdapterOptions } from '../../adapter/src/utils/options.ts';
import { fixture, port, start } from '../helpers/runtime-security';

function put(root: string, file: string, text: string) {
	const target = path.join(root, file);
	fs.mkdirSync(path.dirname(target), { recursive: true });
	fs.writeFileSync(target, text);
}

function builder(root: string, base: string) {
	const routes = path.join(root, 'src/routes');
	put(routes, '+layout.ts', 'export const prerender = true; export const csr = false;');
	put(routes, '+page.svelte', '<h1>Home</h1>');
	put(routes, 'about/+page.svelte', '<h1>About</h1>');
	return {
		log: { minor() {}, warn() {}, error() {} },
		rimraf: (dir: string) => fs.rmSync(dir, { recursive: true, force: true }),
		mkdirp: (dir: string) => fs.mkdirSync(dir, { recursive: true }),
		getBuildDirectory: (name: string) => path.join(root, '.svelte-kit', name),
		writeClient: () => [],
		writePrerendered: (dest: string) => {
			put(dest, 'index.html', '<!doctype html><html><head></head><body>HOME</body></html>');
			put(dest, 'about.html', '<!doctype html><html><head></head><body>ABOUT</body></html>');
		},
		copy: (src: string, dest: string) => {
			fs.mkdirSync(path.dirname(dest), { recursive: true });
			fs.cpSync(src, dest, { recursive: true });
		},
		compress() {},
		generateFallback() {},
		writeServer: (dest: string) => put(dest, 'index.js', ''),
		generateManifest: () => '{}',
		config: { kit: { paths: { base, assets: '' }, files: { routes } } },
		routes: [
			{ id: '/', pattern: /^\/$/, prerender: true },
			{ id: '/about', pattern: /^\/about\/?$/, prerender: true }
		],
		prerendered: {
			pages: new Map([
				[base + '/', { file: 'index.html' }],
				[base + '/about', { file: 'about.html' }]
			])
		}
	} as unknown as Builder & { config: { kit: { files: { routes: string } } } };
}

describe('optional page bridges', () => {
	it('validates the boolean option', () => {
		expect(() => normalizeAdapterOptions({ omitUnusedBridges: 'yes' as never })).toThrow(
			/omitUnusedBridges/
		);
	});
	it.each([
		['+page.server.php', '<?php function action_default($event) { return []; }'],
		['+layout.server.php', '<?php function load($event) { return []; }'],
		['+page.server.ts', 'export const actions = { default: () => ({}) };'],
		['+layout.server.ts', 'export const load = () => ({});'],
		['+page.ts', 'export const load = () => ({});'],
		['+page.ts', 'export { load } from "./data";'],
		['+page.ts', 'export const csr = true;'],
		['+page.ts', 'export const csr = process.env.CSR === "true";'],
		['+page.ts', 'export const ssr = false;'],
		['+page@.svelte', '<h1>Reset</h1>'],
		['+server.php', '<?php function POST($event) { return []; }']
	])('retains unsupported or needed bridges for %s: %s', async (file, source) => {
		const f = fixture();
		const b = builder(f.root, '');
		put(b.config.kit.files.routes, 'about/' + file, source);
		expect(await canOmitPageBridges(b.routes[1], b.config.kit.files.routes)).toBe(false);
	});
	it('retains unknown, non-prerendered and CSR-default routes; honors page overrides', async () => {
		const f = fixture();
		const b = builder(f.root, '');
		const root = b.config.kit.files.routes;
		expect(await canOmitPageBridges(null, root)).toBe(false);
		expect(await canOmitPageBridges({ ...b.routes[1], prerender: 'auto' }, root)).toBe(false);
		put(root, '+layout.ts', 'export const prerender = true;');
		expect(await canOmitPageBridges(b.routes[1], root)).toBe(false);
		put(root, 'about/+page.ts', '// no client router\nexport const csr = false');
		expect(await canOmitPageBridges(b.routes[1], root)).toBe(true);
	});

	for (const base of ['', '/sites/demo']) {
		for (const enabled of [undefined, false, true]) {
			it(`emits compatible output and HTTP methods with option=${enabled}, base=${base || '/'}`, async () => {
				const f = fixture();
				const b = builder(f.root, base);
				const out = path.join(f.root, 'build');
				await adapter({ out, assets: out, basePath: base, omitUnusedBridges: enabled }).adapt(b);
				for (const route of ['', 'about']) {
					for (const name of ['__data.php', '__action.php']) {
						expect(fs.existsSync(path.join(out, base, route, name))).toBe(!enabled);
					}
				}
				expect(fs.existsSync(path.join(out, '_runtime/compat.php'))).toBe(true);
				const allFiles = (dir: string): string[] =>
					fs
						.readdirSync(dir, { withFileTypes: true })
						.flatMap((e) =>
							e.isDirectory() ? allFiles(path.join(dir, e.name)) : [path.join(dir, e.name)]
						);
				if (enabled)
					expect(allFiles(out).filter((f) => f.endsWith('__data.template.json'))).toEqual([]);
				expect(
					fs.readFileSync(path.join(out, '.htaccess'), 'utf8').includes('__data.php [QSA,L]')
				).toBe(!enabled);
				const origin = `http://127.0.0.1:${await port()}`;
				await start(
					f,
					'php',
					['-n', '-S', origin.slice(7), '-t', out, path.join(out, 'router.php')],
					origin,
					{ SK_BASE_PATH: base }
				);
				for (const route of ['/', '/about', '/about?hello=world']) {
					const get = await fetch(origin + base + route);
					expect(get.status).toBe(200);
					expect(await get.text()).toContain(route === '/' ? 'HOME' : 'ABOUT');
					const head = await fetch(origin + base + route, { method: 'HEAD' });
					expect(head.status).toBe(200);
					expect(await head.text()).toBe('');
					if (enabled)
						for (const method of ['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']) {
							const response = await fetch(origin + base + route, { method });
							expect(response.status, method + route).toBe(405);
							expect(response.headers.get('allow')).toBe('GET, HEAD');
							expect(await response.text()).not.toContain('HOME');
						}
				}
				if (enabled) {
					for (const route of ['/__data.json', '/about/__action', '/unknown']) {
						expect((await fetch(origin + base + route)).status, route).toBe(404);
					}
					for (const route of ['/_runtime/compat.php', '/_protected/test.php', '/.env']) {
						expect([403, 404]).toContain((await fetch(origin + base + route)).status);
					}
					const slash = await fetch(origin + base + '/about/?q=1', {
						redirect: 'manual',
						method: 'POST'
					});
					expect(slash.status).toBe(308);
					expect(slash.headers.get('location')).toBe(base + '/about?q=1');
					const direct = await fetch(origin + base + '/about/index.php', { method: 'POST' });
					expect(direct.status).toBe(405);
				}
			}, 20000);
		}
	}
	it('retains bridges in mixed builds, including working PHP actions and data loads', async () => {
		const f = fixture();
		const b = builder(f.root, '');
		put(
			b.config.kit.files.routes,
			'about/+page.server.php',
			'<?php\nfunction load($event) { return ["answer" => 42]; }\nfunction action_default($event) { return ["saved" => true]; }'
		);
		const out = path.join(f.root, 'build');
		await adapter({ out, assets: out, omitUnusedBridges: true }).adapt(b);
		expect(fs.existsSync(path.join(out, '__data.php'))).toBe(false);
		expect(fs.existsSync(path.join(out, 'about/__data.php'))).toBe(true);
		expect(fs.existsSync(path.join(out, 'about/__action.php'))).toBe(true);
		expect(fs.readFileSync(path.join(out, '.htaccess'), 'utf8')).toContain(
			'RewriteCond %1/__data.php -f'
		);
		const origin = `http://127.0.0.1:${await port()}`;
		await start(
			f,
			'php',
			['-n', '-S', origin.slice(7), '-t', out, path.join(out, 'router.php')],
			origin
		);
		const data = await fetch(origin + '/about/__data.json');
		expect(data.status).toBe(200);
		expect(await data.text()).toContain('42');
		const action = await fetch(origin + '/about', {
			method: 'POST',
			headers: { origin, accept: 'application/json', 'x-sveltekit-action': 'true' }
		});
		expect(action.status).toBe(200);
		expect(await action.text()).toContain('saved');
	});
	it.each(['csr', 'data', 'bootstrap', 'auto-base', 'adapter-ssr-off'])(
		'retains emitted bridges for %s configurations',
		async (kind) => {
			const f = fixture();
			const b = builder(f.root, '');
			if (kind === 'csr') put(b.config.kit.files.routes, '+page.ts', 'export const csr = true;');
			const writePrerendered = b.writePrerendered;
			b.writePrerendered = (dest: string) => {
				const files = writePrerendered(dest);
				if (kind === 'data') put(dest, '__data.json', '{"type":"data","nodes":[]}');
				if (kind === 'bootstrap')
					put(
						dest,
						'index.html',
						'<script>__sveltekit_test = {}; const data = [null, null];</script>'
					);
				return files;
			};
			const out = path.join(f.root, 'build');
			await adapter({
				out,
				assets: out,
				omitUnusedBridges: true,
				baseMode: kind === 'auto-base' ? 'auto' : 'fixed',
				ssr: kind !== 'adapter-ssr-off'
			}).adapt(b);
			expect(fs.existsSync(path.join(out, '__data.php'))).toBe(true);
			expect(fs.existsSync(path.join(out, '__action.php'))).toBe(true);
			if (kind === 'bootstrap' || kind === 'data') {
				const origin = `http://127.0.0.1:${await port()}`;
				await start(
					f,
					'php',
					['-n', '-S', origin.slice(7), '-t', out, path.join(out, 'router.php')],
					origin
				);
				const response = await fetch(origin + (kind === 'data' ? '/__data.json' : '/'));
				expect(response.status).toBe(200);
				const body = await response.text();
				expect(body).not.toMatch(/Fatal error|Uncaught Error/);
				if (kind === 'data') expect(body).toContain('"type":"data"');
			}
		}
	);
	it('retains js-ssr output and sidecar routing with the option enabled', async () => {
		const f = fixture();
		for (const enabled of [false, true]) {
			const b = builder(f.root, '');
			const out = path.join(f.root, enabled ? 'on' : 'off');
			await adapter({ mode: 'js-ssr', out, assets: out, omitUnusedBridges: enabled }).adapt(b);
			expect(fs.existsSync(path.join(out, '_runtime/compat.php'))).toBe(true);
			expect(fs.existsSync(out + '-server/handler.mjs')).toBe(true);
		}
		for (const name of ['index.php', 'router.php', '.htaccess', 'index.html', 'about/index.html']) {
			expect(fs.readFileSync(path.join(f.root, 'on', name))).toEqual(
				fs.readFileSync(path.join(f.root, 'off', name))
			);
		}
	});
	it('re-emits bridges when an eligible page gains a server load on a subsequent build', async () => {
		const f = fixture();
		const b = builder(f.root, '');
		const out = path.join(f.root, 'build');
		const options = { out, assets: out, omitUnusedBridges: true };
		await adapter(options).adapt(b);
		expect(fs.existsSync(path.join(out, 'about/__data.php'))).toBe(false);
		put(
			b.config.kit.files.routes,
			'about/+page.server.php',
			'<?php function load($event) { return ["fresh" => 73]; }'
		);
		await adapter(options).adapt(b);
		for (const name of ['__data.php', '__action.php'])
			expect(fs.existsSync(path.join(out, 'about', name))).toBe(true);
		expect(fs.readFileSync(path.join(out, 'about/__data.php'), 'utf8')).toContain('_protected');
		const origin = `http://127.0.0.1:${await port()}`;
		await start(
			f,
			'php',
			['-n', '-S', origin.slice(7), '-t', out, path.join(out, 'router.php')],
			origin
		);
		const data = await fetch(origin + '/about/__data.json');
		expect(data.status).toBe(200);
		expect(await data.text()).toContain('73');
	});
	it('preserves a JS-like code sample without invoking the full data bootstrap on eligible pages', async () => {
		const f = fixture();
		const b = builder(f.root, '');
		b.writePrerendered = (dest: string) => {
			put(dest, 'index.html', '<pre>const data = [1, 2];</pre>');
			put(dest, 'about.html', '<pre>data: { example: true }</pre>');
			return [];
		};
		const out = path.join(f.root, 'build');
		await adapter({ out, assets: out, omitUnusedBridges: true }).adapt(b);
		const home = fs.readFileSync(path.join(out, 'index.php'), 'utf8');
		expect(home).toContain('<pre>const data = [1, 2];</pre>');
		expect(home).not.toContain('__data.php');
	});
});
