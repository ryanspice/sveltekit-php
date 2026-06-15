import { assertHostedSmokeEnv } from './utils/config.mjs';
import { config as loadEnv } from 'dotenv';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

loadEnv();

assertHostedSmokeEnv('Hosted alpha gate');

const steps = [
	{
		name: 'Run local alpha release gate',
		command: 'bun',
		args: ['run', 'alpha:gate']
	},
	{
		name: 'Run hosted alpha remote smoke',
		command: 'bun',
		args: ['run', 'alpha:remote:smoke']
	},
	{
		name: 'Regenerate alpha report with hosted evidence',
		command: 'bun',
		args: ['run', 'alpha:report']
	},
	{
		name: 'Verify alpha report includes hosted evidence',
		command: 'bun',
		args: ['run', 'verify:alpha']
	}
];

function runStep(step) {
	return new Promise((resolve, reject) => {
		console.log(`\n==> ${step.name}`);
		console.log(`$ ${step.command} ${step.args.join(' ')}`);

		const child = spawn(step.command, step.args, {
			cwd: repoRoot,
			env: process.env,
			stdio: 'inherit',
			shell: process.platform === 'win32'
		});

		child.on('error', reject);
		child.on('close', (code) => {
			if (code === 0) {
				resolve();
				return;
			}
			reject(new Error(`${step.name} failed with exit code ${code}`));
		});
	});
}

function fail(message) {
	console.error(message);
	process.exit(1);
}

async function main() {
	if (!process.env.ALPHA_SMOKE_BASE_URL) {
		fail('Set ALPHA_SMOKE_BASE_URL before running the hosted alpha gate.');
	}

	const started = Date.now();
	for (const step of steps) {
		await runStep(step);
	}

	const elapsedSeconds = Math.round((Date.now() - started) / 1000);
	console.log(`\nHosted alpha gate passed in ${elapsedSeconds}s.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	await main();
}
