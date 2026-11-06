import { describe, expect, it } from 'vitest';
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parse } from 'devalue';
import { fixture, port, start } from '../helpers/runtime-security';
import { getActionPhp, getDataPhp } from '../../adapter/src/runtime/php-templates';

// Both Kit 2 and Kit 3 deserialize a JSON envelope, then devalue-parse its data string.
function deserialize(text: string) {
	const result = JSON.parse(text);
	if (result.data) result.data = parse(result.data);
	return result;
}

async function actionFixture(base = '') {
	const f = fixture();
	mkdirSync(path.join(f.root, '_runtime'));
	copyFileSync('adapter/src/runtime/php-compat.php', path.join(f.root, '_runtime/compat.php'));
	writeFileSync(
		path.join(f.root, '__data.php'),
		getDataPhp([], base)
			.replaceAll('PLACEHOLDER_ROUTE_REGEX', '')
			.replaceAll('PLACEHOLDER_ROUTE_PARAM_MAP', '[]')
	);
	writeFileSync(
		path.join(f.root, '__action.php'),
		getActionPhp(
			[
				`file_put_contents(__DIR__ . '/included.marker', 'yes');
function fixture_action_default($event) {
 file_put_contents(__DIR__ . '/handler.marker', 'yes');
 if (($event['post']['value'] ?? '') === 'fail') return sk_fail(422, ['error' => 'invalid', 'value' => 'fail']);
 if (($event['post']['value'] ?? '') === 'fail-default') return ['type' => 'failure', 'data' => ['error' => 'default failure']];
 if (($event['post']['value'] ?? '') === 'raw') return ['echo' => 'raw'];
 if (($event['post']['value'] ?? '') === 'redirect') sk_redirect(303, '/destination');
 if (($event['post']['value'] ?? '') === 'error') sk_error(409, ['message' => 'conflict']);
 if (($event['post']['value'] ?? '') === 'returned-error') return ['type' => 'error', 'status' => 410, 'error' => ['message' => 'gone', 'code' => 'GONE']];
 if (($event['post']['value'] ?? '') === 'unexpected') throw new RuntimeException('secret internal exception detail');
 return ['type' => 'success', 'data' => ['echo' => $event['post']['value'] ?? '', 'nested' => ['ok' => true]]];
}
function fixture_action_save($event) { return fixture_action_default($event); }`
			],
			'/forms/[id]',
			'fixture'
		)
	);
	writeFileSync(
		path.join(f.root, 'router.php'),
		`<?php
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { echo 'ready'; return; }
require __DIR__ . '/__action.php';
echo json_encode(['native' => $GLOBALS['__SK_ACTION_RESULT'] ?? null]);`
	);
	const origin = `http://127.0.0.1:${await port()}`;
	await start(f, 'php', ['-n', '-S', origin.slice(7), '-t', f.root, 'router.php'], origin);
	const post = (url: string, value: string, enhanced = true, originHeader = origin) =>
		fetch(origin + url, {
			method: 'POST',
			redirect: 'manual',
			body: new URLSearchParams({ value }),
			headers: {
				Origin: originHeader,
				Accept: enhanced ? 'application/json' : 'text/html',
				...(enhanced ? { 'X-SvelteKit-Action': 'true' } : {})
			}
		});
	return { ...f, origin, post };
}

describe('PHP action results match Kit 2/3 form deserialization', () => {
	it.each(['', '/sites/cos'])(
		'emits an object envelope with encoded data, status and actual action location at base %s',
		async (base) => {
			const f = await actionFixture(base);
			const response = await f.post(`${base}/forms/order-123?keep=one&%2Fsave=&keep=two`, 'hello');
			expect(response.status).toBe(200);
			const text = await response.text();
			const wire = JSON.parse(text);
			expect(Array.isArray(wire)).toBe(false);
			expect(typeof wire.data).toBe('string');
			expect(deserialize(text)).toEqual({
				type: 'success',
				status: 200,
				location: `${base}/forms/order-123?keep=one&keep=two`,
				data: { echo: 'hello', nested: { ok: true } }
			});
		}
	);
	it('uses the actual failure status for enhanced requests, with devalue data', async () => {
		const f = await actionFixture();
		const response = await f.post('/forms/other?%2Fsave=&filter=active', 'fail');
		expect(response.status).toBe(422);
		expect(deserialize(await response.text())).toEqual({
			type: 'failure',
			status: 422,
			location: '/forms/other?filter=active',
			data: { error: 'invalid', value: 'fail' }
		});
	});
	it('defaults failure status to 400 and normalizes a plain action data return', async () => {
		const f = await actionFixture();
		const failure = await f.post('/forms/default', 'fail-default');
		expect(failure.status).toBe(400);
		expect(deserialize(await failure.text())).toEqual({
			type: 'failure',
			status: 400,
			location: '/forms/default',
			data: { error: 'default failure' }
		});
		const raw = await f.post('/forms/plain', 'raw');
		expect(deserialize(await raw.text())).toEqual({
			type: 'success',
			status: 200,
			location: '/forms/plain',
			data: { echo: 'raw' }
		});
	});
	it('resolves a direct root action shim to the home path', async () => {
		const f = await actionFixture();
		const response = await f.post('/__action.php?/save', 'root');
		expect(deserialize(await response.text()).location).toBe('/');
	});
	it('strips direct shim suffixes while keeping base, dynamic segments and ordinary query keys', async () => {
		const f = await actionFixture('/sites/cos');
		for (const suffix of ['/__action', '/__action.php']) {
			const response = await f.post(`/sites/cos/forms/order-456${suffix}?page=2&/save=`, 'direct');
			expect(deserialize(await response.text()).location).toBe('/sites/cos/forms/order-456?page=2');
		}
	});
	it('guards leading double slash locations and preserves a different action target route', async () => {
		const f = await actionFixture();
		const response = await f.post('//forms/elsewhere?/save&next=%2Fview', 'target');
		expect(deserialize(await response.text()).location).toBe('/.//forms/elsewhere?next=%2Fview');
	});
	it('removes every duplicate of the first decoded named action key, retaining other keys and duplicates', async () => {
		const f = await actionFixture('/sites/cos');
		const response = await f.post(
			'/sites/cos/forms/target?keep=one&%2Fsave=first&keep=two&/save=second&%2Fother=leave&%2fsave=third',
			'named'
		);
		expect(deserialize(await response.text()).location).toBe(
			'/sites/cos/forms/target?keep=one&keep=two&%2Fother=leave'
		);
	});
	it('normalizes thrown, returned and unexpected error bodies with status and the actual action target', async () => {
		const f = await actionFixture('/sites/cos');
		for (const [value, status, message] of [
			['error', 409, 'conflict'],
			['returned-error', 410, 'gone'],
			['unexpected', 500, 'Internal Server Error']
		] as const) {
			const response = await f.post('/sites/cos/forms/different-target?/save&view=details', value);
			expect(response.status).toBe(status);
			const text = await response.text();
			expect(deserialize(text)).toMatchObject({
				type: 'error',
				status,
				location: '/sites/cos/forms/different-target?view=details',
				error: { status, message }
			});
			expect(text).not.toContain('secret internal exception detail');
		}
	});
	it('reports a missing enhanced action with a complete Kit 3 error body before handler execution', async () => {
		const f = await actionFixture('/sites/cos');
		const response = await f.post('/sites/cos/forms/target?/missing&tab=details', 'unused');
		expect(response.status).toBe(404);
		expect(deserialize(await response.text())).toEqual({
			type: 'error',
			status: 404,
			location: '/sites/cos/forms/target?tab=details',
			error: { status: 404, message: 'Action not found' }
		});
		expect(existsSync(path.join(f.root, 'handler.marker'))).toBe(false);
	});
	it('preserves native form data and JSON action result contracts', async () => {
		const f = await actionFixture();
		const native = await f.post('/forms/native', 'native', false);
		expect(await native.json()).toEqual({ native: { echo: 'native', nested: { ok: true } } });
		const json = await fetch(f.origin + '/forms/json', {
			method: 'POST',
			headers: {
				Origin: f.origin,
				Accept: 'application/json',
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: 'value=json'
		});
		expect(await json.json()).toEqual({
			type: 'success',
			data: { echo: 'json', nested: { ok: true } }
		});
	});
	it('preserves redirect/error envelopes and denies unsafe origins before imports or handlers', async () => {
		const f = await actionFixture();
		const rejected = await f.post('/forms/secret?/save', 'no', true, 'https://attacker.example');
		expect(rejected.status).toBe(403);
		expect(existsSync(path.join(f.root, 'included.marker'))).toBe(false);
		expect(existsSync(path.join(f.root, 'handler.marker'))).toBe(false);
		const redirect = await f.post('/forms/action', 'redirect');
		expect(await redirect.json()).toEqual({
			type: 'redirect',
			status: 303,
			location: '/destination'
		});
		const error = await f.post('/forms/action', 'error');
		expect(error.status).toBe(409);
		expect(await error.json()).toMatchObject({
			type: 'error',
			status: 409,
			error: { message: 'conflict' }
		});
	});
});
