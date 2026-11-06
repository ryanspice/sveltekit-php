import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readRcConsumerProfile, validateRcConsumerReceipt } from './utils/rc-consumer-evidence.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * @typedef {{id: string, url: string, expectedStatus: number, actualStatus: number | null, contentType: string, ok: boolean, response?: Response, error?: string}} ObservedCheck
 * @typedef {{version: string, adapterBundleSha256: string}} Candidate
 */

/** @param {import('node:crypto').BinaryLike} content */
function sha256(content) {
	return createHash('sha256').update(content).digest('hex');
}

/** @param {string} url @param {number} expectedStatus @param {string} check @returns {Promise<ObservedCheck>} */
async function observe(url, expectedStatus, check) {
	try {
		const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(15000) });
		const contentType = response.headers.get('content-type') ?? '';
		return {
			id: check,
			url,
			expectedStatus,
			actualStatus: response.status,
			contentType,
			ok: response.status === expectedStatus,
			response
		};
	} catch (error) {
		return {
			id: check,
			url,
			expectedStatus,
			actualStatus: null,
			contentType: '',
			ok: false,
			error: String(error)
		};
	}
}

/** @param {ObservedCheck} observation */
function safeCheck({ response, ...check }) {
	void response;
	return check;
}

/** @param {import('./utils/rc-consumer-evidence.mjs').RcConsumer} consumer @param {Candidate} candidate */
export async function probeConsumer(consumer, candidate) {
	const checks = [];
	for (const [id, relative] of [
		['canonical-root', ''],
		...consumer.representativePaths.map((route, index) => [`representative-${index + 1}`, route])
	]) {
		const observed = await observe(new URL(relative, consumer.baseUrl).href, 200, id);
		let body = '';
		if (observed.response) body = await observed.response.text();
		observed.ok &&=
			observed.contentType.includes('text/html') && body.includes(consumer.identityMarker);
		checks.push(safeCheck(observed));
		if (id === 'canonical-root' && observed.ok) {
			const candidates = [...body.matchAll(/(?:src|href)=["']([^"']+)["']/gi)].map(
				(match) => match[1]
			);
			const expectedPrefix = new URL('_app/', consumer.baseUrl);
			const assetUrl = candidates
				.map((value) => new URL(value, consumer.baseUrl))
				.find(
					(url) =>
						url.origin === expectedPrefix.origin && url.pathname.startsWith(expectedPrefix.pathname)
				);
			if (!assetUrl) {
				checks.push({
					id: 'base-scoped-asset',
					url: consumer.baseUrl,
					expectedStatus: 200,
					actualStatus: null,
					contentType: '',
					ok: false,
					error: 'No same-origin base-scoped _app asset found.'
				});
			} else {
				const asset = await observe(assetUrl.href, 200, 'base-scoped-asset');
				asset.ok &&= /(?:javascript|css)/i.test(asset.contentType);
				checks.push(safeCheck(asset));
			}
		}
	}
	checks.push(
		safeCheck(
			await observe(new URL('__rc-proof-missing__/', consumer.baseUrl).href, 404, 'unknown-route')
		)
	);
	if (consumer.mirrorUrl) {
		const mirror = await observe(consumer.mirrorUrl, 301, 'mirror-redirect');
		if (mirror.actualStatus === 308) mirror.ok = true;
		if (mirror.response) {
			const location = mirror.response.headers.get('location');
			mirror.ok &&= Boolean(
				location && new URL(location, consumer.mirrorUrl).href === consumer.baseUrl
			);
		}
		checks.push(safeCheck(mirror));
	}

	const provenance = await observe(
		new URL(consumer.provenancePath, consumer.baseUrl).href,
		200,
		'deployment-provenance'
	);
	if (provenance.response && provenance.ok) {
		try {
			const data = await provenance.response.json();
			provenance.ok =
				data.adapterVersion === candidate.version &&
				data.adapterBundleSha256 === candidate.adapterBundleSha256;
		} catch {
			provenance.ok = false;
		}
	}
	checks.push(safeCheck(provenance));
	return {
		id: consumer.id,
		role: 'php-static-base-path-production-consumer',
		baseUrl: consumer.baseUrl,
		mode: consumer.mode,
		assertedProvenance: 'repository-asserted',
		checks,
		status: checks.every((check) => check.ok) ? 'passed' : 'failed'
	};
}

/** @param {{profileFile: string, outputFile: string}} options */
export async function runRcConsumerSmoke({ profileFile, outputFile }) {
	const startedAt = new Date();
	const profile = await readRcConsumerProfile(profileFile);
	const packageJson = JSON.parse(await readFile(path.join(repoRoot, 'package.json'), 'utf8'));
	const adapterBundleSha256 = sha256(await readFile(path.join(repoRoot, 'adapter', 'index.js')));
	let sourceRevision = 'unknown';
	try {
		sourceRevision = execFileSync('git', ['rev-parse', 'HEAD'], {
			cwd: repoRoot,
			encoding: 'utf8'
		}).trim();
	} catch {
		// Keep the explicit unknown revision when Git metadata is unavailable.
	}
	const candidate = {
		package: packageJson.name,
		version: packageJson.version,
		sourceRevision,
		adapterBundleSha256
	};
	const consumers = [];
	for (const consumer of profile.consumers)
		consumers.push(await probeConsumer(consumer, candidate));
	const completedAt = new Date();
	const receipt = {
		schemaVersion: 1,
		kind: 'sveltekit-php.rc-consumer-proof',
		status: consumers.every((consumer) => consumer.status === 'passed') ? 'passed' : 'failed',
		candidate,
		run: {
			profile: profile.id,
			startedAt: startedAt.toISOString(),
			completedAt: completedAt.toISOString(),
			expiresAt: new Date(completedAt.valueOf() + 14 * 86400000).toISOString()
		},
		consumers,
		limitations: profile.limitations
	};
	validateRcConsumerReceipt(receipt, {
		expectedConsumerIds: profile.consumers.map((consumer) => consumer.id)
	});
	await mkdir(path.dirname(outputFile), { recursive: true });
	await writeFile(outputFile, `${JSON.stringify(receipt, null, 2)}\n`);
	return receipt;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
	const receipt = await runRcConsumerSmoke({
		profileFile: path.join(repoRoot, 'release', 'consumer-profiles', 'canopy-sites.json'),
		outputFile: path.join(repoRoot, 'report', 'rc-consumer-evidence.json')
	});
	console.log(`RC consumer smoke ${receipt.status}; report/rc-consumer-evidence.json written.`);
	if (receipt.status !== 'passed' && !process.argv.includes('--report-only')) process.exitCode = 1;
}
