import { describe, expect, it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fixture, start, port } from '../helpers/runtime-security';
import { getRouterPhp } from '../../adapter/src/runtime/php-templates';
import { getHtaccess } from '../../adapter/src/runtime/htaccess-templates';

describe('private runtime output boundary', () => {
	for (const mode of ['php-static', 'js-ssr'] as const) {
		for (const base of ['', '/base']) {
			it(`${mode} ${base || '/'} denies actual private files and preserves public files`, async () => {
				const f = fixture();
				mkdirSync(path.join(f.root, '_runtime'));
				writeFileSync(path.join(f.root, '_runtime/compat.php'), '<?php');
				writeFileSync(path.join(f.root, '_runtime/build-stamp.json'), '{"public":true}');
				for (const directory of ['server', '_protected', 'adapter']) {
					mkdirSync(path.join(f.root, directory));
					writeFileSync(path.join(f.root, directory, 'private.txt'), 'PRIVATE_SOURCE');
				}
				for (const directory of ['server', 'adapter', '_runtime']) {
					const nested = path.join(f.root, base, 'api', directory, 'status');
					mkdirSync(path.dirname(nested), { recursive: true });
					writeFileSync(nested, `NESTED_PUBLIC_${directory}`);
				}
				const nestedPrivate = path.join(f.root, base, 'api');
				writeFileSync(path.join(nestedPrivate, '.env'), 'PRIVATE_ENV');
				writeFileSync(path.join(nestedPrivate, 'data.server.js'), 'PRIVATE_SOURCE');
				mkdirSync(path.join(nestedPrivate, '_protected'));
				writeFileSync(path.join(nestedPrivate, '_protected/private.txt'), 'PRIVATE_SOURCE');
				mkdirSync(path.join(f.root, '_app'));
				writeFileSync(path.join(f.root, '_app/public.js'), 'PUBLIC_ASSET');
				writeFileSync(path.join(f.root, '.env'), 'PRIVATE_ENV');
				writeFileSync(path.join(f.root, 'router.php'), getRouterPhp(base, mode, false));
				const origin = `http://127.0.0.1:${await port()}`;
				await start(f, 'php', ['-n', '-S', origin.slice(7), '-t', f.root, 'router.php'], origin, {
					SK_BASE_PATH: base
				});
				for (const privatePath of [
					'server/private.txt',
					'SERVER/private.txt',
					'server./private.txt',
					'%73erver/private.txt',
					'_protected/private.txt',
					'_PROTECTED/private.txt',
					'adapter/private.txt',
					'_runtime/compat.php',
					'.env',
					'api/.env',
					'api/data.server.js',
					'api/_protected/private.txt'
				]) {
					const response = await fetch(origin + base + '/' + privatePath);
					expect(response.status, privatePath).toBe(403);
					expect(await response.text()).not.toContain('PRIVATE_');
				}
				for (const directory of ['server', 'adapter', '_runtime']) {
					const response = await fetch(origin + base + '/api/' + directory + '/status');
					expect(response.status, `nested ${directory}`).toBe(200);
					expect(await response.text()).toBe(`NESTED_PUBLIC_${directory}`);
				}
				const publicAsset = await fetch(origin + '/_app/public.js');
				expect(await publicAsset.text()).toBe('PUBLIC_ASSET');
				expect((await fetch(origin + '/_runtime/build-stamp.json')).status).toBe(200);
			}, 15000);
		}
	}
	it('places Apache private denial before file/asset shortcuts in both modes', () => {
		for (const mode of ['php-static', 'js-ssr']) {
			const config = getHtaccess(mode, '/base');
			expect(config.indexOf('^(?:base/)?(?:server|adapter)')).toBeLessThan(
				config.indexOf('# let existing files through')
			);
			expect(config).toContain('RewriteRule ^(?:base/)?_runtime[.\\x20]*(?:/|$) - [F,L,NC]');
			const rules = config
				.split('\n')
				.filter((line) => line.includes('[F,L,NC]'))
				.map((line) => new RegExp(line.trim().split(' ')[1], 'i'));
			for (const prefix of ['', 'base/']) {
				for (const directory of ['server', 'adapter', '_runtime']) {
					expect(rules.some((rule) => rule.test(`${prefix}api/${directory}/status`))).toBe(false);
					expect(rules.some((rule) => rule.test(`${prefix}${directory}/private.txt`))).toBe(true);
				}
			}
		}
	});
});
