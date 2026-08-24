import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readRcConsumerProfile, validateRcConsumerReceipt } from './utils/rc-consumer-evidence.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.resolve(process.argv.find((value) => value.endsWith('.json')) ?? 'report/rc-consumer-evidence.json');
const profile = await readRcConsumerProfile(path.join(repoRoot, 'release', 'consumer-profiles', 'canopy-sites.json'));
const receipt = validateRcConsumerReceipt(JSON.parse(await readFile(file, 'utf8')), {
	requireCurrent: process.argv.includes('--require-current'),
	expectedConsumerIds: profile.consumers.map((consumer) => consumer.id)
});
if (receipt.status !== 'passed') throw new Error('RC consumer receipt records a failed proof run.');
const packageJson = JSON.parse(await readFile(path.join(repoRoot, 'package.json'), 'utf8'));
const localBundleHash = createHash('sha256')
	.update(await readFile(path.join(repoRoot, 'adapter', 'index.js')))
	.digest('hex');
if (receipt.candidate.version !== packageJson.version || receipt.candidate.adapterBundleSha256 !== localBundleHash) {
	throw new Error('RC consumer receipt does not match the local package version and adapter bundle.');
}
console.log(`PASS rc-consumer-receipt: ${receipt.run.profile} expires ${receipt.run.expiresAt}`);
