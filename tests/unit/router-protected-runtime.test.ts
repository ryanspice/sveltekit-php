import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { getRouterPhp } from '../../adapter/src/runtime/php-templates.ts';

describe('generated router protected directory boundary', () => {
	for (const mode of ['php-static', 'js-ssr'] as const) {
		for (const base of ['', '/base']) {
			it(`${mode} ${base || '/'} denies protected case aliases before static delegation`, () => {
				const root = mkdtempSync(path.join(os.tmpdir(), 'sk-php-protected-'));
				try {
					mkdirSync(path.join(root, '_runtime'));
					writeFileSync(path.join(root, '_runtime/compat.php'), '<?php');
					const protectedDir = path.join(root, base, '_protected');
					mkdirSync(protectedDir, { recursive: true });
					writeFileSync(path.join(protectedDir, 'private.txt'), 'PRIVATE_FIXTURE');
					const publicDir = path.join(root, base, '_protected-public');
					mkdirSync(publicDir, { recursive: true });
					writeFileSync(path.join(publicDir, 'public.txt'), 'PUBLIC_FIXTURE');
					writeFileSync(path.join(root, 'router.php'), getRouterPhp(base, mode, false));
					writeFileSync(
						path.join(root, 'probe.php'),
						`<?php
$_SERVER['REQUEST_URI'] = $argv[1];
$_SERVER['REQUEST_METHOD'] = 'GET';
http_response_code(200);
ob_start();
$result = require __DIR__ . '/router.php';
$body = ob_get_clean();
echo json_encode(['status' => http_response_code(), 'delegated' => $result === false, 'body' => $body]);
`
					);
					for (const directory of ['_protected', '_PROTECTED', '_Protected', '%5fPROTECTED']) {
						const result = JSON.parse(
							execFileSync(
								'php',
								['-n', path.join(root, 'probe.php'), `${base}/${directory}/private.txt`],
								{
									encoding: 'utf8',
									env: { ...process.env, SK_BASE_PATH: base }
								}
							)
						);
						expect(result, directory).toEqual({
							status: 403,
							delegated: false,
							body: 'Access Denied'
						});
					}
					const publicResult = JSON.parse(
						execFileSync(
							'php',
							['-n', path.join(root, 'probe.php'), `${base}/_protected-public/public.txt`],
							{
								encoding: 'utf8',
								env: { ...process.env, SK_BASE_PATH: base }
							}
						)
					);
					expect(publicResult).toEqual({ status: 200, delegated: true, body: '' });
				} finally {
					rmSync(root, { recursive: true, force: true });
				}
			});
		}
	}
});
