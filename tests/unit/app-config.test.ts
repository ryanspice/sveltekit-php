import { describe, expect, it, vi } from 'vitest';

vi.mock('sveltekit-php', () => ({ default: (options: unknown) => options }));

import { createAppConfig } from '../../app.config.mjs';

describe('Kit 3 application configuration', () => {
	for (const mode of ['php-static', 'js-ssr']) {
		for (const base of ['', '/sites/demo']) {
			it(`preserves ${mode} at ${base || 'root'}`, () => {
				const config = createAppConfig({
					ADAPTER_MODE: mode,
					SK_BASE_PATH: base,
					DEPLOY_BASE: '/ignored',
					SVELTEKIT_OUTDIR: '.svelte-kit-owned',
					ADAPTER_OUT: 'build-owned',
					ADAPTER_ASSETS: 'https://cdn.example.test/assets/',
					ADAPTER_BASE_MODE: 'auto',
					ADAPTER_FALLBACK: '200.html',
					PRECOMPRESS: 'true'
				});
				expect(config).not.toHaveProperty('kit');
				expect(config.outDir).toBe('.svelte-kit-owned');
				expect(config.paths).toEqual({
					base,
					relative: false,
					assets: 'https://cdn.example.test/assets'
				});
				expect(config.adapter).toMatchObject({
					mode,
					basePath: base,
					baseMode: 'auto',
					out: 'build-owned',
					assets: 'https://cdn.example.test/assets/',
					fallback: '200.html',
					precompress: true,
					strict: true
				});
				expect(config.prerender?.entries).toContain('/alpha-readiness/report.json');
			});
		}
	}

	it('keeps output-directory assets separate from the public asset URL', () => {
		const config = createAppConfig({ ADAPTER_ASSETS: 'build-owned', DEPLOY_BASE: 'sites/demo/' });
		expect(config.paths).toEqual({ base: '/sites/demo', relative: false, assets: undefined });
		expect(config.adapter).toMatchObject({ fallback: false, precompress: false });
		expect(createAppConfig({ ADAPTER_FALLBACK: 'true' }).adapter).toMatchObject({ fallback: true });
	});

	it('rejects unsupported modes before building', () => {
		expect(() => createAppConfig({ ADAPTER_MODE: 'unknown' })).toThrow('Unsupported adapter mode');
		expect(() => createAppConfig({ ADAPTER_BASE_MODE: 'unknown' })).toThrow(
			'Unsupported adapter base mode'
		);
	});
});
