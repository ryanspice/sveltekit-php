// @ts-nocheck
import { readFile } from 'node:fs/promises';

const SHA256 = /^[a-f0-9]{64}$/;

function assertPublicHttpsUrl(value, label) {
	let parsed;
	try {
		parsed = new URL(value);
	} catch {
		throw new Error(`${label} must be a valid URL.`);
	}
	if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash) {
		throw new Error(`${label} must be a public HTTPS URL without credentials, query, or fragment.`);
	}
	return parsed;
}

export function validateRcConsumerProfile(profile) {
	if (profile?.schemaVersion !== 1 || profile?.kind !== 'sveltekit-php.rc-consumer-profile') {
		throw new Error('Unsupported RC consumer profile schema or kind.');
	}
	if (!Array.isArray(profile.consumers) || profile.consumers.length < 1) {
		throw new Error('RC consumer profile must contain consumers.');
	}
	const ids = new Set();
	for (const consumer of profile.consumers) {
		if (!consumer.id || ids.has(consumer.id)) throw new Error('RC consumer IDs must be non-empty and unique.');
		ids.add(consumer.id);
		if (consumer.mode !== 'php-static') throw new Error(`${consumer.id} must declare php-static mode.`);
		if (typeof consumer.identityMarker !== 'string' || consumer.identityMarker.trim().length < 3) {
			throw new Error(`${consumer.id} must include a stable identity marker.`);
		}
		const base = assertPublicHttpsUrl(consumer.baseUrl, `${consumer.id}.baseUrl`);
		if (consumer.mirrorUrl !== undefined) {
			assertPublicHttpsUrl(consumer.mirrorUrl, `${consumer.id}.mirrorUrl`);
		}
		if (!base.pathname.endsWith(`/sites/${consumer.id}/`)) {
			throw new Error(`${consumer.id}.baseUrl must end with /sites/${consumer.id}/.`);
		}
		const provenanceSegments =
			typeof consumer.provenancePath === 'string' ? consumer.provenancePath.split('/') : [];
		if (
			typeof consumer.provenancePath !== 'string' ||
			!/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(consumer.provenancePath) ||
			provenanceSegments.some((segment) => !segment || segment === '.' || segment === '..' || segment.startsWith('.'))
		) {
			throw new Error(`${consumer.id}.provenancePath must be a safe non-dot relative path.`);
		}
		if (!Array.isArray(consumer.representativePaths) || consumer.representativePaths.length < 1) {
			throw new Error(`${consumer.id} must include representative paths.`);
		}
		for (const route of consumer.representativePaths) {
			if (!route || route.startsWith('/') || route.includes('..') || route.includes('\\')) {
				throw new Error(`${consumer.id} contains an unsafe representative path.`);
			}
		}
	}
	return profile;
}

/**
 * @param {any} receipt
 * @param {{ now?: Date, requireCurrent?: boolean, expectedConsumerIds?: string[] }} [options]
 */
export function validateRcConsumerReceipt(receipt, options = {}) {
	const { now = new Date(), requireCurrent = false, expectedConsumerIds } = options;
	if (receipt?.schemaVersion !== 1 || receipt?.kind !== 'sveltekit-php.rc-consumer-proof') {
		throw new Error('Unsupported RC consumer receipt schema or kind.');
	}
	if (!SHA256.test(receipt.candidate?.adapterBundleSha256 ?? '')) {
		throw new Error('Receipt candidate must include a lowercase SHA-256 adapter hash.');
	}
	const completedAt = new Date(receipt.run?.completedAt);
	const expiresAt = new Date(receipt.run?.expiresAt);
	if (!Number.isFinite(completedAt.valueOf()) || !Number.isFinite(expiresAt.valueOf())) {
		throw new Error('Receipt timestamps must be valid ISO dates.');
	}
	if (expiresAt <= completedAt || expiresAt.valueOf() - completedAt.valueOf() > 14 * 86400000) {
		throw new Error('Receipt lifetime must be positive and no longer than 14 days.');
	}
	if (requireCurrent && expiresAt <= now) throw new Error('RC consumer receipt is expired.');
	if (!Array.isArray(receipt.consumers) || receipt.consumers.length < 1) {
		throw new Error('Receipt must contain consumer results.');
	}
	const consumerIds = receipt.consumers.map((consumer) => consumer.id);
	if (new Set(consumerIds).size !== consumerIds.length) throw new Error('Receipt consumer IDs must be unique.');
	if (
		expectedConsumerIds &&
		JSON.stringify([...consumerIds].sort()) !== JSON.stringify([...expectedConsumerIds].sort())
	) {
		throw new Error('Receipt consumers do not match the committed RC profile.');
	}
	if (receipt.status === 'passed') {
		for (const consumer of receipt.consumers) {
			if (consumer.status !== 'passed' || consumer.checks?.some((check) => !check.ok)) {
				throw new Error('A passed receipt cannot contain failed consumer checks.');
			}
		}
	}
	return receipt;
}

export async function readRcConsumerProfile(file) {
	return validateRcConsumerProfile(JSON.parse(await readFile(file, 'utf8')));
}
