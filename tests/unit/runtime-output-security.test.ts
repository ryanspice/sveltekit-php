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
					'.env'
				]) {
					const response = await fetch(origin + base + '/' + privatePath);
					expect(response.status, privatePath).toBe(403);
					expect(await response.text()).not.toContain('PRIVATE_');
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
			expect(config.indexOf('(?:server|adapter|_protected)')).toBeLessThan(
				config.indexOf('# let existing files through')
			);
			expect(config).toContain('_runtime[. ]*(?:/|$) - [F,L,NC]');
		}
	});
});
