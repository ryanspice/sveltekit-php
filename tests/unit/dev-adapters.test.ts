import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import devAdapter from '../../adapter/src/dev-adapter.ts';
import viteDevAdapter from '../../adapter/src/vite-dev-adapter.ts';
import type { Builder } from '../../adapter/src/types.ts';

let tempRoot = '';
let originalNodeEnv: string | undefined;
let originalCi: string | undefined;
let originalAllow: string | undefined;

function createBuilder(): Builder {
	return {
		log: {
			minor: () => {},
			warn: () => {},
			error: () => {}
		},
		rimraf: (dir: string) => fs.rmSync(dir, { recursive: true, force: true }),
		mkdirp: (dir: string) => fs.mkdirSync(dir, { recursive: true }),
		getBuildDirectory: (name: string) => path.join(tempRoot, name),
		writeClient: (dest: string) => {
			fs.mkdirSync(dest, { recursive: true });
			return [];
		},
		writePrerendered: () => {},
		copy: () => {},
		compress: () => {},
		generateFallback: () => {},
		writeServer: () => {},
		generateManifest: () => '{}',
		config: {
			kit: {
				files: {
					routes: path.join(tempRoot, 'routes')
				},
				paths: {
					base: ''
				}
			}
		},
		routes: [],
		prerendered: {
			pages: new Map()
		}
	};
}

beforeEach(() => {
	tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-php-dev-adapter-'));
	originalNodeEnv = process.env.NODE_ENV;
	originalCi = process.env.CI;
	originalAllow = process.env.SK_PHP_ALLOW_DEV_ADAPTER;
	process.env.NODE_ENV = 'test';
	delete process.env.CI;
	delete process.env.SK_PHP_ALLOW_DEV_ADAPTER;
});

afterEach(() => {
	if (tempRoot) fs.rmSync(tempRoot, { recursive: true, force: true });
	if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
	else process.env.NODE_ENV = originalNodeEnv;
	if (originalCi === undefined) delete process.env.CI;
	else process.env.CI = originalCi;
	if (originalAllow === undefined) delete process.env.SK_PHP_ALLOW_DEV_ADAPTER;
	else process.env.SK_PHP_ALLOW_DEV_ADAPTER = originalAllow;
});

describe('development adapters', () => {
	it('writes deterministic PHP stubs in local/test contexts', async () => {
		const out = path.join(tempRoot, 'out');
		await devAdapter({ out, assets: path.join(tempRoot, 'assets') }).adapt(createBuilder());

		const stub = fs.readFileSync(path.join(out, 'index.php'), 'utf8');
		expect(stub).toContain('development-only stub');
		expect(stub).toContain('http_response_code(503)');
	});

	it('registers the Vite dev router stub', async () => {
		const out = path.join(tempRoot, 'vite-out');
		await viteDevAdapter({ out, assets: path.join(tempRoot, 'vite-assets') }).adapt(createBuilder());

		const stub = fs.readFileSync(path.join(out, 'dev-router.php'), 'utf8');
		expect(stub).toContain('Vite PHP dev adapter');
		expect(stub).toContain('http_response_code(503)');
	});

	it('rejects accidental production usage', async () => {
		process.env.NODE_ENV = 'production';

		await expect(
			devAdapter({ out: path.join(tempRoot, 'prod-out') }).adapt(createBuilder())
		).rejects.toThrow(/dev-only/);

		await expect(
			viteDevAdapter({ out: path.join(tempRoot, 'vite-prod-out') }).adapt(createBuilder())
		).rejects.toThrow(/dev-only/);
	});

	it('rejects CI usage unless explicitly allowed', async () => {
		process.env.CI = 'true';

		await expect(devAdapter({ out: path.join(tempRoot, 'ci-out') }).adapt(createBuilder())).rejects.toThrow(
			/SK_PHP_ALLOW_DEV_ADAPTER/
		);

		await expect(
			viteDevAdapter({ out: path.join(tempRoot, 'vite-ci-out') }).adapt(createBuilder())
		).rejects.toThrow(/SK_PHP_ALLOW_DEV_ADAPTER/);
	});

	it('allows explicit local override for adapter smoke tests', async () => {
		process.env.CI = 'true';
		process.env.SK_PHP_ALLOW_DEV_ADAPTER = 'true';

		const out = path.join(tempRoot, 'explicit-out');
		await devAdapter({ out, assets: path.join(tempRoot, 'explicit-assets') }).adapt(createBuilder());

		expect(fs.readFileSync(path.join(out, 'index.php'), 'utf8')).toContain('production adapter for deployable PHP output');
	});
});
