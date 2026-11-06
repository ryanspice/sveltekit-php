import { afterEach, describe, expect, it } from 'vitest';
import { writeFileSync } from 'node:fs';
import type { RouterProbe } from '../helpers/router-php-execution.ts';
import { createRouterProbe } from '../helpers/router-php-execution.ts';

const probes: RouterProbe[] = [];
afterEach(async () => {
	await Promise.all(probes.splice(0).map((probe) => probe.close()));
});

describe('JS SSR base-stripped directory negotiation', () => {
	for (const layout of ['root', 'base'] as const) {
		it(`${layout} negotiates generated PHP and keeps static-only indexes`, async () => {
			const probe = await createRouterProbe(layout);
			probes.push(probe);
			const directory = `${probe.base}/negotiate/`;
			const cases = [
				{ accept: 'application/json', expected: 'application/json', contains: 'Negotiated API' },
				{ accept: 'text/html', expected: 'text/html', contains: 'Negotiated HTML' },
				{ accept: '*/*', expected: 'application/json', contains: 'Negotiated API' },
				{
					accept: 'text/html;q=0.4, application/json;q=0.9',
					expected: 'application/json',
					contains: 'Negotiated API'
				},
				{
					accept: 'application/json;q=0.4, text/html;q=0.9',
					expected: 'text/html',
					contains: 'Negotiated HTML'
				}
			];
			for (const item of cases) {
				const response = await fetch(`${probe.origin}${directory}`, {
					headers: { Accept: item.accept },
					redirect: 'manual'
				});
				const body = await response.text();
				expect(response.status).toBe(200);
				expect(response.headers.get('content-type')).toContain(item.expected);
				expect(response.headers.get('vary')).toContain('Accept');
				expect(body).toContain(item.contains);
				expect(body).not.toContain(probe.marker);
			}

			const head = await fetch(`${probe.origin}${directory}`, {
				method: 'HEAD',
				headers: { Accept: 'application/json' }
			});
			expect(head.status).toBe(200);
			expect(head.headers.get('content-type')).toContain('application/json');
			expect(head.headers.get('vary')).toContain('Accept');
			expect(await head.text()).toBe('');

			const post = await fetch(`${probe.origin}${directory}`, {
				method: 'POST',
				headers: { Accept: 'application/json' },
				body: 'probe'
			});
			expect(post.status).toBe(405);
			const noSlash = await fetch(`${probe.origin}${probe.base}/negotiate?source=regression`, {
				headers: { Accept: 'application/json' },
				redirect: 'manual'
			});
			if (layout === 'root') {
				expect(noSlash.status).toBe(301);
				expect(noSlash.headers.get('location')).toBe('/negotiate/?source=regression');
			} else {
				expect(noSlash.status).toBe(200);
				expect(noSlash.headers.get('content-type')).toContain('application/json');
				expect(noSlash.headers.get('vary')).toContain('Accept');
			}

			const staticIndex = await probe.request(`${probe.base}/static-only/`);
			expect(staticIndex.status).toBe(200);
			expect(await staticIndex.text()).toContain('Static only');
			const assetBytes = Buffer.from('byte-identical public asset\0\x01');
			writeFileSync(`${probe.root}/asset.bin`, assetBytes);
			const asset = await probe.request(`${probe.base}/asset.bin`);
			expect(Buffer.from(await asset.arrayBuffer())).toEqual(assetBytes);
		});
	}
});
