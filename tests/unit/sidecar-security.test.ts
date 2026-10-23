import { describe, expect, it } from 'vitest';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fixture, start, port } from '../helpers/runtime-security';
import { getNodeHandlerMjs, getPhpProxy } from '../../adapter/src/runtime/js-ssr-templates';

describe('private sidecar request boundary', () => {
	async function sidecarFixture(env: NodeJS.ProcessEnv = {}) {
		const f = fixture();
		writeFileSync(path.join(f.root, 'package.json'), '{"type":"module"}');
		writeFileSync(
			path.join(f.root, 'instance.js'),
			`import { appendFileSync } from 'node:fs';
export const server = { init: async () => {}, respond: async (request, options) => {
appendFileSync(new URL('./dispatched.marker', import.meta.url), 'executed');
return Response.json({ url: request.url, address: options.getClientAddress(), body: await request.text(), forwarded: request.headers.get('x-forwarded-host') });
} };`
		);
		writeFileSync(path.join(f.root, 'handler.mjs'), getNodeHandlerMjs('', true));
		const origin = `http://127.0.0.1:${await port()}`;
		await start(f, process.execPath, ['handler.mjs'], origin, {
			PORT: origin.split(':').at(-1),
			...env
		});
		return { ...f, origin };
	}
	it('rejects non-loopback startup without a configured canonical origin', async () => {
		await expect(sidecarFixture({ SK_SIDECAR_HOST: '0.0.0.0' })).rejects.toThrow(
			'SK_ORIGIN is required'
		);
	}, 15000);
	it('ignores spoofed forwarding by default and uses a configured public origin', async () => {
		const f = await sidecarFixture({ SK_ORIGIN: 'https://app.example' });
		const response = await fetch(f.origin + '/route', {
			headers: {
				'X-Forwarded-Host': 'attacker.example',
				'X-Forwarded-Proto': 'https',
				'X-Forwarded-For': '203.0.113.1'
			}
		});
		const data = await response.json();
		expect(data.url).toBe('https://app.example/route');
		expect(data.address).toBe('127.0.0.1');
		expect(data.forwarded).toBe(null);
	}, 15000);
	it('requires both opt-in and an allowed proxy address, parsing client IPs from the trusted depth', async () => {
		const f = await sidecarFixture({ SK_TRUSTED_PROXY_HEADERS: 'true', SK_XFF_DEPTH: '2' });
		const response = await fetch(f.origin + '/route', {
			headers: {
				'X-Forwarded-Host': 'app.example',
				'X-Forwarded-Proto': 'https',
				'X-Forwarded-For': '203.0.113.8, 198.51.100.2, 127.0.0.2'
			}
		});
		const data = await response.json();
		expect(data.url).toBe('https://app.example/route');
		expect(data.address).toBe('198.51.100.2');
	}, 15000);
	it('ignores forwarding from an address absent from the explicit proxy allowlist', async () => {
		const f = await sidecarFixture({
			SK_TRUSTED_PROXY_HEADERS: 'true',
			SK_TRUSTED_PROXY_IPS: '192.0.2.1'
		});
		const response = await fetch(f.origin + '/route', {
			headers: { 'X-Forwarded-Host': 'attacker.example', 'X-Forwarded-Proto': 'https' }
		});
		expect((await response.json()).url).toBe(f.origin + '/route');
	}, 15000);
	it('preserves the configured public origin through PHP while replacing spoofed forwarding', async () => {
		const f = await sidecarFixture({ SK_ORIGIN: 'https://public.example' });
		const publicRoot = path.join(f.root, 'public');
		mkdirSync(path.join(publicRoot, '_runtime'), { recursive: true });
		writeFileSync(path.join(publicRoot, '_runtime/compat.php'), '<?php');
		writeFileSync(path.join(publicRoot, 'index.php'), getPhpProxy(f.origin));
		const phpOrigin = `http://127.0.0.1:${await port()}`;
		await start(
			f,
			'php',
			['-n', '-S', phpOrigin.slice(7), '-t', publicRoot, path.join(publicRoot, 'index.php')],
			phpOrigin,
			{ PHP_SIDECAR_URL: f.origin, SK_ORIGIN: 'https://public.example' }
		);
		const response = await fetch(phpOrigin + '/live', {
			method: 'POST',
			headers: {
				Origin: 'https://public.example',
				'X-Forwarded-Host': 'attacker.example',
				'X-Forwarded-For': '203.0.113.1'
			},
			body: 'proxy-body'
		});
		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data.url).toBe('https://public.example/live');
		expect(data.body).toBe('proxy-body');
		expect(data.address).toBe('127.0.0.1');
	}, 15000);
	it('rejects oversized declared and streamed bodies before dispatch', async () => {
		const f = await sidecarFixture({ SK_BODY_SIZE_LIMIT: '4' });
		const declared = await fetch(f.origin + '/route', { method: 'POST', body: '12345' });
		expect(declared.status).toBe(413);
		const streamed = await fetch(f.origin + '/route', {
			method: 'POST',
			body: new ReadableStream({
				start(controller) {
					controller.enqueue(new TextEncoder().encode('12345'));
					controller.close();
				}
			}),
			duplex: 'half'
		} as RequestInit);
		expect(streamed.status).toBe(413);
		expect(existsSync(path.join(f.root, 'dispatched.marker'))).toBe(false);
		const accepted = await fetch(f.origin + '/route', { method: 'POST', body: '1234' });
		expect(accepted.status).toBe(200);
		expect((await accepted.json()).body).toBe('1234');
	}, 15000);
});
