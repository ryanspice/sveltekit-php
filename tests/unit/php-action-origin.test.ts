import { describe, expect, it } from 'vitest';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fixture, start, port } from '../helpers/runtime-security';
import {
	getActionPhp,
	getMinimalBootstrapPhp,
	getRouterPhp
} from '../../adapter/src/runtime/php-templates';

describe('PHP action origin enforcement before imports and handlers', () => {
	async function actionFixture(env: NodeJS.ProcessEnv = {}) {
		const f = fixture();
		mkdirSync(path.join(f.root, '_runtime'));
		writeFileSync(path.join(f.root, '_runtime/compat.php'), '<?php');
		writeFileSync(
			path.join(f.root, '__data.php'),
			`<?php
const SK_BASE_PATH = ''; const SK_ROUTE_REGEX = ''; const SK_ROUTE_PARAM_MAP = [];
function sk_extract_params(...$args) { return []; }
function &sk_locals() { static $locals = []; return $locals; }
function sk_json_encode($value) { return json_encode($value); }
class SK_Cookies { public function __construct($cookies) {} }
class SK_URLSearchParams { public function __construct($query) {} }
`
		);
		writeFileSync(
			path.join(f.root, '__action.php'),
			getActionPhp(
				[
					`file_put_contents(__DIR__ . '/included.marker', 'included');
function fixture_action_default($event) { file_put_contents(__DIR__ . '/action.marker', 'executed'); return ['type' => 'success', 'data' => ['ok' => true]]; }
function fixture_action_save($event) { return fixture_action_default($event); }`
				],
				'/',
				'fixture'
			)
		);
		writeFileSync(path.join(f.root, 'index.php'), getMinimalBootstrapPhp() + 'PAGE');
		mkdirSync(path.join(f.root, 'adapter'));
		writeFileSync(
			path.join(f.root, 'adapter/route-manifest.php'),
			"<?php return [['re' => '~^/$~', 'type' => 'page', 'shim' => '/index.php']];"
		);
		writeFileSync(path.join(f.root, 'router.php'), getRouterPhp('', 'php-static', false));
		const origin = `http://127.0.0.1:${await port()}`;
		await start(f, 'php', ['-n', '-S', origin.slice(7), '-t', f.root, 'router.php'], origin, env);
		return { ...f, origin };
	}
	it('rejects cross-site, null and missing origins before any user include, across direct/rewrite/page paths', async () => {
		const f = await actionFixture();
		for (const route of ['/__action.php', '/__action', '/']) {
			for (const supplied of ['https://attacker.example', 'null', undefined]) {
				const headers: Record<string, string> = {
					Accept: 'application/json',
					'Content-Type': 'application/x-www-form-urlencoded'
				};
				if (supplied !== undefined) headers.Origin = supplied;
				const response = await fetch(f.origin + route, {
					method: 'POST',
					headers,
					body: 'note=test'
				});
				expect(response.status, `${route} ${supplied}`).toBe(403);
				expect(existsSync(path.join(f.root, 'included.marker'))).toBe(false);
				expect(existsSync(path.join(f.root, 'action.marker'))).toBe(false);
			}
		}
	}, 15000);
	it('accepts same-origin named/multipart actions and a canonical TLS origin', async () => {
		const f = await actionFixture({ SK_ORIGIN: 'https://forms.example:443' });
		const body = new FormData();
		body.set('note', 'same-origin');
		const response = await fetch(f.origin + '/__action?/save', {
			method: 'POST',
			headers: { Origin: 'https://forms.example', Accept: 'application/json' },
			body
		});
		expect(response.status).toBe(200);
		expect(existsSync(path.join(f.root, 'included.marker'))).toBe(true);
		expect(existsSync(path.join(f.root, 'action.marker'))).toBe(true);
	}, 15000);
	it('requires explicit opt-in for missing Origin and still rejects null Origin', async () => {
		const f = await actionFixture({ SK_ALLOW_MISSING_ORIGIN: '1' });
		expect(
			(await fetch(f.origin + '/__action', { method: 'POST', headers: { Origin: 'null' } })).status
		).toBe(403);
		expect(existsSync(path.join(f.root, 'action.marker'))).toBe(false);
		expect(
			(
				await fetch(f.origin + '/__action', {
					method: 'POST',
					headers: { Accept: 'application/json' },
					body: 'note=trusted-client'
				})
			).status
		).toBe(200);
		expect(existsSync(path.join(f.root, 'action.marker'))).toBe(true);
	}, 15000);
	it.each(['0', '-1', 'unbounded', '9223372036854775807'])(
		'rejects invalid configured body limit %s before dispatch',
		async (limit) => {
			const f = await actionFixture({ SK_BODY_SIZE_LIMIT: limit });
			const response = await fetch(f.origin + '/__action', {
				method: 'POST',
				headers: { Origin: f.origin },
				body: 'body'
			});
			expect(response.status).toBe(500);
			expect(existsSync(path.join(f.root, 'included.marker'))).toBe(false);
			expect(existsSync(path.join(f.root, 'action.marker'))).toBe(false);
		},
		15000
	);
	it('rejects oversized PHP action bodies before user includes or handler dispatch', async () => {
		const f = await actionFixture({ SK_BODY_SIZE_LIMIT: '4' });
		const response = await fetch(f.origin + '/__action', {
			method: 'POST',
			headers: { Origin: f.origin, 'Content-Type': 'application/json' },
			body: '12345'
		});
		expect(response.status).toBe(413);
		expect(existsSync(path.join(f.root, 'included.marker'))).toBe(false);
		expect(existsSync(path.join(f.root, 'action.marker'))).toBe(false);
	}, 15000);
});
