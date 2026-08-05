import { describe, it, expect } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
	assertRemoteFunctionsUnsupported,
	assertSafeBuildTarget,
	normalizeSafeExternalRoots,
	resolveBuildIdentityContract,
	validateReservedRouteIds
} from '../../adapter/src/utils/guards.ts';
import type { Builder, Route } from '../../adapter/src/types.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function makeRoute(id: string): Route {
	return { id, pattern: /.*/, prerender: true };
}

function fakeBuilder(routes: Route[] = [], kit: Record<string, unknown> = {}): Builder {
	return {
		routes,
		log: {
			warn: () => {},
			minor: () => {},
			error: () => {}
		},
		rimraf: () => {},
		mkdirp: () => {},
		getBuildDirectory: (name) => name,
		writeClient: () => [],
		writePrerendered: () => {},
		copy: () => {},
		compress: () => {},
		generateFallback: () => {},
		writeServer: () => {},
		generateManifest: () => '{}',
		config: {
			kit: {
				files: {
					routes: path.join(repoRoot, 'src', 'routes')
				},
				paths: { base: '' },
				...kit
			}
		},
		prerendered: { pages: new Map() }
	};
}

describe('normalizeSafeExternalRoots', () => {
	it('parses JSON array input and resolves absolute paths', () => {
		const roots = normalizeSafeExternalRoots(JSON.stringify(['B:/tmp/out', 'C:/other']));
		expect(roots).toEqual([path.resolve('B:/tmp/out'), path.resolve('C:/other')]);
	});

	it('parses semicolon-separated input', () => {
		const roots = normalizeSafeExternalRoots(`B:/tmp/a;${path.join('C:', 'other')}`);
		expect(roots.length).toBe(2);
	});

	it('returns empty array for empty input', () => {
		expect(normalizeSafeExternalRoots('')).toEqual([]);
		expect(normalizeSafeExternalRoots(undefined)).toEqual([]);
	});
});

describe('validateReservedRouteIds', () => {
	it('throws on reserved route segments in strict mode', () => {
		expect(() =>
			validateReservedRouteIds([makeRoute('/_app/hacked')], true, fakeBuilder())
		).toThrow(/reserved route collision/);
	});

	it('throws on reserved route files and parent traversal in strict mode', () => {
		expect(() => validateReservedRouteIds([makeRoute('/api/__data')], true, fakeBuilder())).toThrow(
			/reserved route collision/
		);
		expect(() => validateReservedRouteIds([makeRoute('/a/../b')], true, fakeBuilder())).toThrow(
			/reserved route collision/
		);
	});

	it('does not throw for clean routes', () => {
		expect(() =>
			validateReservedRouteIds(
				[makeRoute('/blog/[slug]'), makeRoute('/api/hello')],
				true,
				fakeBuilder()
			)
		).not.toThrow();
	});

	it('warns instead of throwing when strict is false', () => {
		expect(() =>
			validateReservedRouteIds([makeRoute('/_protected/x')], false, fakeBuilder())
		).not.toThrow();
	});
});

describe('assertRemoteFunctionsUnsupported', () => {
	it('passes when remote functions are disabled and no .remote files exist', async () => {
		await expect(assertRemoteFunctionsUnsupported(fakeBuilder())).resolves.toBeUndefined();
	});

	it('throws when kit.experimental.remoteFunctions is enabled', async () => {
		const builder = fakeBuilder([], { experimental: { remoteFunctions: true } });
		await expect(assertRemoteFunctionsUnsupported(builder)).rejects.toThrow(
			/remote functions are not supported/
		);
	});
});

describe('assertSafeBuildTarget', () => {
	const routesRoot = path.join(repoRoot, 'src', 'routes');

	it('rejects fs roots, repo root, and home', () => {
		expect(() => assertSafeBuildTarget(path.parse(process.cwd()).root, 'out', routesRoot)).toThrow(
			/Unsafe build target/
		);
		expect(() => assertSafeBuildTarget(process.cwd(), 'out', routesRoot)).toThrow(/Unsafe build target/);
		expect(() => assertSafeBuildTarget(os.homedir(), 'out', routesRoot)).toThrow(/Unsafe build target/);
	});

	it('rejects temp root and common user directories (hardening)', () => {
		expect(() => assertSafeBuildTarget(os.tmpdir(), 'out', routesRoot)).toThrow(/denied directory/);
		expect(() =>
			assertSafeBuildTarget(path.join(os.homedir(), 'Documents'), 'out', routesRoot)
		).toThrow(/denied directory/);
		expect(() =>
			assertSafeBuildTarget(path.join(os.homedir(), 'Desktop'), 'out', routesRoot)
		).toThrow(/denied directory/);
	});

	it('rejects source trees', () => {
		expect(() => assertSafeBuildTarget(path.join(repoRoot, 'src'), 'out', routesRoot)).toThrow(
			/Unsafe build target/
		);
	});

	it('allows temp subdirectories and repo subdirectories', () => {
		expect(() =>
			assertSafeBuildTarget(path.join(os.tmpdir(), 'sveltekit-php-guard-test'), 'out', routesRoot)
		).not.toThrow();
		expect(() =>
			assertSafeBuildTarget(path.join(repoRoot, 'build-test-out'), 'out', routesRoot)
		).not.toThrow();
	});
});

describe('resolveBuildIdentityContract', () => {
	it('returns null when disabled or empty', () => {
		expect(resolveBuildIdentityContract(false)).toBeNull();
		expect(resolveBuildIdentityContract(undefined)).toBeNull();
	});

	it('normalizes marker lists and extensions', () => {
		const contract = resolveBuildIdentityContract({
			name: 'tenant-a',
			required: ['alpha-marker'],
			forbidden: ['hydration'],
			extensions: ['HTML', '.json']
		});
		expect(contract?.name).toBe('tenant-a');
		expect(contract?.required).toEqual(['alpha-marker']);
		expect(contract?.extensions).toEqual(['.html', '.json']);
	});
});

describe('adapter hygiene (audit fixes)', () => {
	it('uses nowdoc for prerendered page emission', () => {
		const source = readFileSync(path.join(repoRoot, 'adapter', 'src', 'index.ts'), 'utf8');
		expect(source).toContain("echo <<<'HTML'");
		expect(source).not.toContain('echo <<<HTML');
	});

	it('removed the obsolete PHP 7.4 guard', () => {
		const source = readFileSync(path.join(repoRoot, 'adapter', 'src', 'index.ts'), 'utf8');
		expect(source).not.toContain('assertPhp74Safe');
		expect(source).not.toContain('PHP 7.4-safe');
	});

	it('aligns the adapter identity banner with the package name', () => {
		const source = readFileSync(path.join(repoRoot, 'adapter', 'src', 'index.ts'), 'utf8');
		expect(source).toContain("name: 'sveltekit-php'");
		expect(source).not.toContain("@ryanspice/sveltekit-adapter-php'");
	});

	it('removed dead PHP 7.4 polyfills from the runtime', () => {
		const compat = readFileSync(path.join(repoRoot, 'adapter', 'src', 'runtime', 'php-compat.php'), 'utf8');
		expect(compat).not.toContain('function str_starts_with');
		expect(compat).not.toContain('function str_ends_with');
		expect(compat).not.toContain('function array_is_list');
		expect(compat).toContain("define('SK_PHP_MIN_VERSION', 80100)");
	});
});
