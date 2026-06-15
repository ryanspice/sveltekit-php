import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const steps = [
	{
		name: 'Generate alpha report and community analytics',
		command: 'bun',
		args: ['run', 'alpha:report:full']
	},
	{
		name: 'Verify alpha report/native/community gate',
		command: 'bun',
		args: ['run', 'verify:alpha']
	},
	{
		name: 'Verify release-prep safety',
		command: 'bun',
		args: ['run', 'verify:release-prep']
	},
	{
		name: 'Build adapter artifact',
		command: 'bun',
		args: ['run', 'build:adapter']
	},
	{
		name: 'Run unit tests',
		command: 'bun',
		args: ['run', 'test:unit']
	},
	{
		name: 'Run PHP unit smoke',
		command: 'bun',
		args: ['run', 'test:php']
	},
	{
		name: 'Run Svelte/TypeScript check',
		command: 'bun',
		args: ['run', 'check']
	},
	{
		name: 'Verify generated adapter artifacts',
		command: 'bun',
		args: ['run', 'verify:artifacts', '--', '--strict']
	},
	{
		name: 'Build php-static route artifacts',
		command: 'bun',
		args: ['scripts/build-e2e.mjs', '--mode=php-static']
	},
	{
		name: 'Verify php-static route behavior',
		command: 'bun',
		args: ['scripts/verify-all.mjs', '--mode=php-static', '--skipBuild', '--skipE2E']
	},
	{
		name: 'Build js-ssr route artifacts',
		command: 'bun',
		args: ['scripts/build-e2e.mjs', '--mode=js-ssr']
	},
	{
		name: 'Verify js-ssr route behavior',
		command: 'bun',
		args: ['scripts/verify-all.mjs', '--mode=js-ssr', '--skipBuild', '--skipE2E']
	},
	{
		name: 'Run php-static browser E2E',
		command: 'bun',
		args: ['run', 'test:e2e', '--', '--project=php-static'],
		env: {
			ADAPTER_MODE: 'php-static'
		}
	},
	{
		name: 'Run js-ssr browser E2E',
		command: 'bun',
		args: ['run', 'test:e2e', '--', '--project=js-ssr-root'],
		env: {
			ADAPTER_MODE: 'js-ssr'
		}
	},
	{
		name: 'Smoke external consumer adapter import',
		command: 'bun',
		args: ['run', 'alpha:consumer:smoke']
	}
];

function runStep(step) {
	return new Promise((resolve, reject) => {
		console.log(`\n==> ${step.name}`);
		console.log(`$ ${step.command} ${step.args.join(' ')}`);

		const child = spawn(step.command, step.args, {
			cwd: repoRoot,
			env: {
				...process.env,
				...(step.env ?? {})
			},
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

async function main() {
	const started = Date.now();
	for (const step of steps) {
		await runStep(step);
	}

	const elapsedSeconds = Math.round((Date.now() - started) / 1000);
	console.log(`\nAlpha release gate passed in ${elapsedSeconds}s.`);
	console.log('If this was a clean checkout, the repo is ready for a package-version alpha bump review.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	await main();
}
