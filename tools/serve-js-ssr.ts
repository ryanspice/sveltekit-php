import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { verifyBuildStamp } from '../scripts/utils/stamp.mjs';

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
const port = args.port || process.env.PORT || '3000';
const phpPort = args.phpPort || process.env.PHP_PORT || process.env.E2E_PHP_PORT || '8080';
const outDir = args.outDir || process.env.ADAPTER_OUT || 'build';
const basePath = args.basePath || process.env.SK_BASE_PATH || '';

// Verify build stamp
// Note: We need to know what basePath to expect.
const result = await verifyBuildStamp(outDir, 'js-ssr', basePath);
if (!result.ok) {
	console.error(`\n❌ Artifact verification failed for ${outDir}`);
	console.error(`   ${result.error}`);
	console.error(`   Please run 'bun run build:e2e' to generate fresh artifacts.\n`);
	process.exit(1);
}
console.log(`✓ Artifacts verified in ${outDir} (built at ${result.stamp.builtAt})`);

console.log(`Starting js-ssr sidecar on port ${port}...`);
console.log(`Starting PHP proxy on port ${phpPort} with base path "${basePath}"...`);

const serverDir = path.join(outDir, 'server');
const handlerPath = path.join(serverDir, 'handler.mjs');

if (!fs.existsSync(handlerPath)) {
	throw new Error(`Missing handler.mjs at ${handlerPath}`);
}

// Start Node Sidecar
const nodeServer = spawn('node', [handlerPath], {
	stdio: 'inherit',
	env: {
		...process.env,
		PORT: port,
		ADDRESS_HEADER: 'x-forwarded-for',
		XFF_DEPTH: '1'
	}
});

// Start PHP Server
const phpServer = spawn('php', ['-S', `127.0.0.1:${phpPort}`, '-t', outDir, path.join(outDir, 'router.php')], {
	stdio: 'inherit',
	env: {
		...process.env,
		SK_BASE_PATH: basePath,
		PHP_SIDECAR_URL: `http://127.0.0.1:${port}`
	}
});

const cleanup = () => {
	console.log('Shutting down servers...');
	nodeServer.kill();
	phpServer.kill();
	process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

nodeServer.on('close', (code) => {
	console.log(`Node server exited with code ${code}`);
	cleanup();
});

phpServer.on('close', (code) => {
	console.log(`PHP server exited with code ${code}`);
	cleanup();
});
