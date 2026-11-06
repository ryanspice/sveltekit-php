import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readRcConsumerProfile } from './utils/rc-consumer-evidence.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const profile = await readRcConsumerProfile(
	path.join(repoRoot, 'release', 'consumer-profiles', 'canopy-sites.json')
);
console.log(`PASS rc-consumer-profile: ${profile.id} (${profile.consumers.length} consumers)`);
