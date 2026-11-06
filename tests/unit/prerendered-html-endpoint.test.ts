import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import type { Builder } from '@sveltejs/kit';
import adapter from '../../adapter/src/index.ts';
import { fixture, port, start } from '../helpers/runtime-security';

const endpointHtml = '<!doctype html><title>Export</title><main>EXACT_REPORT_é</main>\n';
const endpointJson = '{"staticReport":true,"message":"EXACT_JSON"}\n';

function createBuilder(root: string, base: string, kit3: boolean) {
	const routesRoot = path.join(root, 'src', 'marketing');
	const metadata = (page: boolean) =>
		kit3
			? {
					page: { methods: page ? ['GET'] : [] },
					api: { methods: page ? [] : ['GET'] }
				}
			: {};
	for (const [route, module] of [
		['report.html', '+server.ts'],
		['report.json', '+server.ts'],
		['article', '+page.svx']
	]) {
		const target = path.join(routesRoot, '(exports)', route);
		fs.mkdirSync(target, { recursive: true });
		fs.writeFileSync(
			path.join(target, module),
			module === '+server.ts'
				? 'export const prerender = true; export function GET() {}'
				: '<h1>REAL_PAGE</h1>'
		);
	}
	const config = {
		paths: { base, assets: '' },
		files: { routes: routesRoot }
	};
	const builder = {
		log: { minor() {}, warn() {}, error() {} },
		rimraf: (dir: string) => fs.rmSync(dir, { recursive: true, force: true }),
		mkdirp: (dir: string) => fs.mkdirSync(dir, { recursive: true }),
		getBuildDirectory: (name: string) => path.join(root, '.svelte-kit', name),
		writeClient: (dest: string) => {
			fs.mkdirSync(dest, { recursive: true });
			return [];
		},
		writePrerendered: (dest: string) => {
			fs.writeFileSync(path.join(dest, 'report.html'), endpointHtml);
			fs.writeFileSync(path.join(dest, 'report.json'), endpointJson);
			fs.writeFileSync(path.join(dest, 'article.html'), '<!doctype html><h1>REAL_PAGE</h1>');
		},
		copy: (src: string, dest: string) => {
			fs.mkdirSync(path.dirname(dest), { recursive: true });
			fs.cpSync(src, dest, { recursive: true });
		},
		compress() {},
		writeServer: (dest: string) => {
			fs.mkdirSync(dest, { recursive: true });
			fs.writeFileSync(path.join(dest, 'index.js'), '');
		},
		generateManifest: () => '{}',
		generateFallback() {},
		config: kit3 ? config : { kit: config },
		routes: [
			{
				id: '/(exports)/report.html',
				pattern: /^\/report\.html\/?$/,
				prerender: true,
				...metadata(false)
			},
			{
				id: '/(exports)/report.json',
				pattern: /^\/report\.json\/?$/,
				prerender: true,
				...metadata(false)
			},
			{ id: '/(exports)/article', pattern: /^\/article\/?$/, prerender: true, ...metadata(true) }
		],
		prerendered: {
			pages: new Map([
				[base + '/report.html', { file: 'report.html' }],
				[base + '/article', { file: 'article.html' }]
			]),
			assets: new Map([[base + '/report.json', { type: 'application/json' }]])
		}
	};
	return builder as unknown as Builder;
}

describe('prerendered HTML endpoint output', () => {
	for (const kit3 of [false, true]) {
		for (const mode of ['php-static', 'js-ssr'] as const) {
			for (const base of ['', '/sites/demo']) {
				it(`preserves endpoint bytes and real pages: Kit ${kit3 ? '3 metadata' : '2 reduced'} ${mode} ${base || '/'}`, async () => {
					const owned = fixture();
					const out = path.join(owned.root, 'build');
					await adapter({ mode, out, assets: out, basePath: base, strict: false }).adapt(
						createBuilder(owned.root, base, kit3)
					);
					expect(fs.readFileSync(path.join(out, 'report.html'))).toEqual(Buffer.from(endpointHtml));
					expect(fs.readFileSync(path.join(out, 'report.json'))).toEqual(Buffer.from(endpointJson));
					if (mode === 'php-static') {
						const article = path.join(out, base, 'article', 'index.php');
						expect(fs.readFileSync(article, 'utf8')).toContain('REAL_PAGE');
					} else {
						expect(fs.readFileSync(path.join(out, 'article/index.html'), 'utf8')).toContain(
							'REAL_PAGE'
						);
					}
					const origin = `http://127.0.0.1:${await port()}`;
					await start(
						owned,
						'php',
						['-n', '-S', origin.slice(7), '-t', out, path.join(out, 'router.php')],
						origin,
						{ SK_BASE_PATH: base }
					);
					for (const [route, expected, contentType] of [
						['report.html', endpointHtml, 'text/html'],
						['report.json', endpointJson, 'application/json']
					]) {
						const response = await fetch(`${origin}${base}/${route}`, { redirect: 'manual' });
						expect(response.status, route).toBe(200);
						expect(response.headers.get('content-type'), route).toContain(contentType);
						expect(Buffer.from(await response.arrayBuffer()), route).toEqual(Buffer.from(expected));
					}
				}, 15000);
			}
		}
	}
});
