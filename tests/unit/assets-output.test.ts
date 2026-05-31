import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import adapter from '../../adapter/src/index.ts';
import { getHtaccess } from '../../adapter/src/runtime/htaccess-templates.ts';

type AdapterBuilder = Parameters<ReturnType<typeof adapter>['adapt']>[0];

const fixtureRoot = path.resolve('tests/fixtures/assets-output');
const fixtureClient = path.join(fixtureRoot, 'client');
const fixturePrerendered = path.join(fixtureRoot, 'prerendered');
const fixtureRoutes = path.join(fixtureRoot, 'app', 'src', 'routes');

function collectAssetFiles(dir: string, out: string[] = []) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			collectAssetFiles(full, out);
		} else if (entry.isFile() && (full.endsWith('.js') || full.endsWith('.css'))) {
			out.push(full);
		}
	}
	return out;
}

function createBuilder(tempRoot: string) {
	const outDir = path.join(tempRoot, 'out');
	const assetsDir = path.join(tempRoot, 'assets');
	const buildDir = path.join(tempRoot, '.svelte-kit');
	const prerenderedPages = new Map([['/', { file: 'index.html' }]]);
	const builder = {
		log: {
			minor: () => {},
			warn: () => {},
			error: () => {}
		},
		rimraf: (dir: string) => fs.rmSync(dir, { recursive: true, force: true }),
		mkdirp: (dir: string) => fs.mkdirSync(dir, { recursive: true }),
		getBuildDirectory: (name: string) => path.join(buildDir, name),
		writeClient: (dest: string) => {
			fs.mkdirSync(dest, { recursive: true });
			fs.cpSync(fixtureClient, dest, { recursive: true });
			return [];
		},
		writePrerendered: (dest: string) => {
			fs.mkdirSync(dest, { recursive: true });
			fs.cpSync(fixturePrerendered, dest, { recursive: true });
		},
		copy: (src: string, dest: string) => {
			fs.mkdirSync(path.dirname(dest), { recursive: true });
			fs.cpSync(src, dest, { recursive: true });
		},
		compress: (dest: string) => {
			const targets = collectAssetFiles(dest);
			if (!targets.length) return;
			const target = targets[0];
			const content = fs.readFileSync(target);
			fs.writeFileSync(target + '.br', content);
			fs.writeFileSync(target + '.gz', content);
		},
		writeServer: (dest: string) => {
			fs.mkdirSync(dest, { recursive: true });
			fs.writeFileSync(path.join(dest, 'index.js'), '');
		},
		generateManifest: () => '{}',
		generateFallback: async () => {},
		config: {
			kit: {
				paths: {
					base: '',
					assets: ''
				},
				files: {
					routes: fixtureRoutes
				}
			}
		},
		routes: [],
		prerendered: {
			pages: prerenderedPages
		}
	};
	return { builder, outDir, assetsDir };
}

let tempRoot = '';

beforeEach(() => {
	tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-php-assets-'));
});

afterEach(() => {
	if (tempRoot) {
		fs.rmSync(tempRoot, { recursive: true, force: true });
	}
});

describe('assets output in js-ssr', () => {
	it('writes client assets into outDir when assetsDir differs', async () => {
		const { builder, outDir, assetsDir } = createBuilder(tempRoot);
		const instance = adapter({
			mode: 'js-ssr',
			out: outDir,
			assets: assetsDir,
			precompress: false,
			strict: false
		});
		await instance.adapt(builder as AdapterBuilder);
		const assetPath = path.join(outDir, '_app', 'immutable', 'entry', 'app.js');
		expect(fs.existsSync(assetPath)).toBe(true);
	});

	it('writes precompressed assets into outDir when enabled', async () => {
		const { builder, outDir, assetsDir } = createBuilder(tempRoot);
		const instance = adapter({
			mode: 'js-ssr',
			out: outDir,
			assets: assetsDir,
			precompress: true,
			strict: false
		});
		await instance.adapt(builder as AdapterBuilder);
		const target = collectAssetFiles(outDir)[0];
		expect(target).toBeTruthy();
		expect(fs.existsSync(target + '.br')).toBe(true);
		expect(fs.existsSync(target + '.gz')).toBe(true);
	});
});

describe('htaccess precompress rules', () => {
	it('excludes __data.json and __action and sets cache control', () => {
		const htaccess = getHtaccess('js-ssr', '/base', true);
		expect(htaccess).toContain('RewriteCond %{REQUEST_URI} !/__data\\.json$ [NC]');
		expect(htaccess).toContain('RewriteCond %{REQUEST_URI} !/__action$ [NC]');
		expect(htaccess).toContain(
			'Header set Cache-Control "public, max-age=31536000, immutable" env=SK_ASSET'
		);
		expect(htaccess).toContain('Header set Cache-Control "no-store" env=SK_DATA');
		expect(htaccess).toContain('Header set Cache-Control "no-store" env=SK_ACTION');
	});

	it('emits trailing slash redirects when requested', () => {
		const htaccess = getHtaccess('php-static', '', false, 'router.php', 'always');
		expect(htaccess).toContain('# trailingSlash: always');
		expect(htaccess).toContain('RewriteCond %{REQUEST_URI} !/$');
		expect(htaccess).toContain('RewriteRule ^(.*[^/])$ /$1/ [L,R=308]');
	});
});
