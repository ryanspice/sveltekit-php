import { afterEach, describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import type { RouterProbe } from '../helpers/router-php-execution.ts';
import { createRouterProbe } from '../helpers/router-php-execution.ts';

const probes: RouterProbe[] = [];
afterEach(async () => {
	await Promise.all(probes.splice(0).map((probe) => probe.close()));
});

describe('JS SSR generated PHP execution over loopback', () => {
	for (const layout of ['root', 'base'] as const) {
		it(`${layout} exact PHP wrappers execute and never disclose source for GET and HEAD`, async () => {
			const probe = await createRouterProbe(layout);
			probes.push(probe);
			for (const file of ['index.php', '_server.php']) {
				const url = `${probe.base}/negotiate/${file}`;
				const get = await probe.request(url);
				const body = await get.text();
				expect(get.status).toBe(200);
				expect(get.headers.get('content-type')).not.toContain('application/octet-stream');
				expect(body).not.toContain(probe.marker);
				if (file === 'index.php') expect(body).toContain('Negotiated API');

				const head = await probe.request(url, 'HEAD');
				expect(head.status).toBe(200);
				expect(head.headers.get('content-type')).not.toContain('application/octet-stream');
				expect(await head.text()).toBe('');
			}
		});

		if (layout === 'base') {
			it('base dispatch decodes and matches PHP extensions without case sensitivity', async () => {
				const probe = await createRouterProbe(layout);
				probes.push(probe);
				for (const pathname of [
					`${probe.base}/negotiate/case.PHP`,
					`${probe.base}/negotiate/%69ndex.php`
				]) {
					const response = await probe.request(pathname);
					const body = await response.text();
					expect(response.status).toBe(200);
					expect(response.headers.get('content-type')).not.toContain('application/octet-stream');
					expect(body).toContain('Negotiated API');
					expect(body).not.toContain(probe.marker);
				}
			});
		}

		it(`${layout} preserves static bytes and denies private and traversal paths before handler execution`, async () => {
			const probe = await createRouterProbe(layout);
			probes.push(probe);
			const expectedAsset = readFileSync(`${probe.root}/index.html`);
			const asset = await probe.request(`${probe.base}/index.html`);
			expect(asset.status).toBe(200);
			expect(Buffer.from(await asset.arrayBuffer())).toEqual(expectedAsset);

			const protectedPaths = probe.base
				? [
						`${probe.base}/_runtime/compat.php`,
						`${probe.base}/server/handler.mjs`,
						`${probe.base}/_protected/probe.php`
					]
				: ['/_runtime/missing.php', '/server/missing.php', '/_protected/missing.php'];
			for (const url of protectedPaths) {
				const response = await probe.request(url);
				expect([400, 403, 404]).toContain(response.status);
				expect(await response.text()).not.toContain(probe.marker);
			}
			const traversal = await probe.request(`${probe.base}/%2e%2e/_protected/probe.php`);
			expect([400, 403, 404]).toContain(traversal.status);
			expect(existsSync(probe.protectedEffect)).toBe(false);
		});
	}
});
