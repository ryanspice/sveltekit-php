import { afterEach } from 'vitest';
import { spawn, type ChildProcess } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const owned: { root: string; processes: ChildProcess[] }[] = [];
afterEach(async () => {
	for (const fixture of owned.splice(0)) {
		await Promise.all(
			fixture.processes.map(async (child) => {
				if (child.exitCode !== null) return;
				const closed = new Promise<void>((resolve) => child.once('exit', () => resolve()));
				child.kill();
				await closed;
			})
		);
		rmSync(fixture.root, { recursive: true, force: true });
	}
});

export async function port() {
	const server = createServer();
	await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
	const address = server.address();
	if (!address || typeof address === 'string') throw new Error('Missing port');
	await new Promise<void>((resolve, reject) =>
		server.close((error) => (error ? reject(error) : resolve()))
	);
	return address.port;
}
export function fixture() {
	const result = {
		root: mkdtempSync(path.join(os.tmpdir(), 'sk-php-runtime-security-')),
		processes: [] as ChildProcess[]
	};
	owned.push(result);
	return result;
}
export async function start(
	f: ReturnType<typeof fixture>,
	command: string,
	args: string[],
	origin: string,
	env: NodeJS.ProcessEnv = {}
) {
	const child = spawn(command, args, {
		cwd: f.root,
		env: {
			...process.env,
			SK_ORIGIN: '',
			SK_TRUSTED_PROXY_HEADERS: 'false',
			SK_TRUSTED_PROXY_IPS: '',
			SK_ALLOW_MISSING_ORIGIN: '',
			SK_XFF_DEPTH: '',
			SK_BODY_SIZE_LIMIT: '',
			SK_SIDECAR_HOST: '',
			SK_BASE_PATH: '',
			...env
		},
		stdio: 'pipe'
	});
	f.processes.push(child);
	let logs = '';
	child.stderr?.on('data', (data) => {
		logs += String(data);
	});
	child.stdout?.on('data', (data) => {
		logs += String(data);
	});
	for (let attempt = 0; attempt < 80; attempt++) {
		if (child.exitCode !== null) throw new Error(`Owned server ${child.pid} exited: ${logs}`);
		try {
			await fetch(origin + '/__health');
			return child;
		} catch {
			await new Promise((resolve) => setTimeout(resolve, 50));
		}
	}
	throw new Error(`Owned server ${child.pid} did not start: ${logs}`);
}
