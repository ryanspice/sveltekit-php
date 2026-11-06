import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	validateRcConsumerProfile,
	validateRcConsumerReceipt
} from '../../scripts/utils/rc-consumer-evidence.mjs';
import profile from '../../release/consumer-profiles/canopy-sites.json';
import { probeConsumer } from '../../scripts/smoke-rc-consumers.mjs';

afterEach(() => vi.unstubAllGlobals());

describe('RC consumer evidence', () => {
	it('accepts the committed Canopy profile', () => {
		expect(validateRcConsumerProfile(profile).consumers).toHaveLength(2);
	});

	it('rejects private or credential-bearing evidence URLs', () => {
		const candidate = structuredClone(profile);
		candidate.consumers[0].baseUrl = 'https://user:secret@localhost/sites/lancasterfbc.ca/';
		expect(() => validateRcConsumerProfile(candidate)).toThrow(/public HTTPS/);
	});

	it('allows an optional controlled mirror but does not require one', () => {
		const withoutMirrors = structuredClone(profile);
		expect(() => validateRcConsumerProfile(withoutMirrors)).not.toThrow();
		Object.assign(withoutMirrors.consumers[0], { mirrorUrl: 'https://owned.example/' });
		expect(() => validateRcConsumerProfile(withoutMirrors)).not.toThrow();
	});

	it.each([
		'../private.json',
		'https://example.test/proof.json',
		'.well-known/proof.json',
		'proof%2fescape.json'
	])('rejects unsafe provenance path %s', (value) => {
		const candidate = structuredClone(profile);
		candidate.consumers[0].provenancePath = value;
		expect(() => validateRcConsumerProfile(candidate)).toThrow(/provenancePath/);
	});

	it('rejects expired receipts when current proof is required', () => {
		const receipt = {
			schemaVersion: 1,
			kind: 'sveltekit-php.rc-consumer-proof',
			status: 'passed',
			candidate: { adapterBundleSha256: 'a'.repeat(64) },
			run: { completedAt: '2026-07-01T00:00:00.000Z', expiresAt: '2026-07-10T00:00:00.000Z' },
			consumers: [{ status: 'passed', checks: [{ ok: true }] }]
		};
		expect(() =>
			validateRcConsumerReceipt(receipt, { now: new Date('2026-08-24'), requireCurrent: true })
		).toThrow(/expired/);
	});

	it('rejects a passed receipt containing failed checks', () => {
		const receipt = {
			schemaVersion: 1,
			kind: 'sveltekit-php.rc-consumer-proof',
			status: 'passed',
			candidate: { adapterBundleSha256: 'b'.repeat(64) },
			run: { completedAt: '2026-08-24T00:00:00.000Z', expiresAt: '2026-08-31T00:00:00.000Z' },
			consumers: [{ status: 'failed', checks: [{ ok: false }] }]
		};
		expect(() => validateRcConsumerReceipt(receipt)).toThrow(/passed receipt/);
	});

	it('rejects receipts that omit a committed profile consumer', () => {
		const receipt = {
			schemaVersion: 1,
			kind: 'sveltekit-php.rc-consumer-proof',
			status: 'failed',
			candidate: { adapterBundleSha256: 'c'.repeat(64) },
			run: { completedAt: '2026-08-24T00:00:00.000Z', expiresAt: '2026-08-31T00:00:00.000Z' },
			consumers: [{ id: 'lancasterfbc.ca', status: 'failed', checks: [{ ok: false }] }]
		};
		expect(() =>
			validateRcConsumerReceipt(receipt, {
				expectedConsumerIds: profile.consumers.map((consumer) => consumer.id)
			})
		).toThrow(/committed RC profile/);
	});

	it('records unavailable Canopy pages as failed observations', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(
				async () =>
					new Response('404 Not Found', { status: 404, headers: { 'content-type': 'text/html' } })
			)
		);
		const result = await probeConsumer(profile.consumers[0], {
			version: '1.0.2-alpha.0',
			adapterBundleSha256: 'a'.repeat(64)
		});
		expect(result.status).toBe('failed');
		expect(result.checks.find((check) => check.id === 'canonical-root')).toMatchObject({
			actualStatus: 404,
			ok: false
		});
		expect(JSON.stringify(result)).not.toContain('404 Not Found');
	});

	it('passes with branded pages, a base-scoped asset, and matching Canopy provenance', async () => {
		const consumer = profile.consumers[0];
		const candidate = { version: '1.0.2-alpha.0', adapterBundleSha256: 'b'.repeat(64) };
		vi.stubGlobal(
			'fetch',
			vi.fn(async (input: string | URL) => {
				const url = new URL(String(input));
				if (url.pathname.endsWith(`/${consumer.provenancePath}`)) {
					return Response.json({
						adapterVersion: candidate.version,
						adapterBundleSha256: candidate.adapterBundleSha256
					});
				}
				if (url.pathname.includes('__rc-proof-missing__'))
					return new Response('missing', { status: 404 });
				if (url.pathname.endsWith('/_app/app.js')) {
					return new Response('export {};', {
						status: 200,
						headers: { 'content-type': 'text/javascript' }
					});
				}
				return new Response(
					`<h1>${consumer.identityMarker}</h1><script src="_app/app.js"></script>`,
					{
						status: 200,
						headers: { 'content-type': 'text/html' }
					}
				);
			})
		);
		const result = await probeConsumer(consumer, candidate);
		expect(result.status).toBe('passed');
		expect(result.checks.every((check) => check.ok)).toBe(true);
	});
});
