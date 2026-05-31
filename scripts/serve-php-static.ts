import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { verifyBuildStamp } from './utils/stamp.mjs';
import { getBasePath } from './utils/config.mjs';

// Minimal args parser
function parseArgs(args) {
	const out = {};
	for (const arg of args) {
		if (arg.startsWith('--')) {
			const [key, val] = arg.slice(2).split('=');
			out[key] = val ?? true;
		}
	}
	return out;
}

const args = parseArgs(process.argv.slice(2));
const port = args.port || process.env.PHP_PORT || process.env.E2E_PHP_PORT || '8086';
const outDir = args.outDir || process.env.ADAPTER_OUT || 'build-e2e-php-static';
const basePath = args.basePath || getBasePath();

// Verify build stamp
const result = await verifyBuildStamp(outDir, 'php-static', basePath);
if (!result.ok) {
	console.error(`\n❌ Artifact verification failed for ${outDir}`);
	console.error(`   ${result.error}`);
	console.error(`   Please run 'bun run build:e2e' to generate fresh artifacts.\n`);
	process.exit(1);
}
console.log(`✓ Artifacts verified in ${outDir} (built at ${result.stamp.builtAt})`);

const routerPath = path.resolve(outDir, 'router.php');
if (!fs.existsSync(routerPath)) {
	throw new Error(`Missing router.php at ${routerPath}`);
}

console.log(`Starting PHP server on port ${port} serving ${outDir} (base: ${basePath})...`);

const phpProcess = spawn('php', ['-S', `127.0.0.1:${port}`, '-t', outDir, routerPath], {
	stdio: 'inherit',
	env: {
		...process.env,
		SK_BASE_PATH: basePath
	}
});

const cleanup = () => {
	phpProcess.kill();
	process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
