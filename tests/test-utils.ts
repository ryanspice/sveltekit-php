import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import http from 'node:http';

export interface ServerOptions {
	mode: 'php-static' | 'js-ssr';
	port?: number;
	basePath?: string;
	env?: NodeJS.ProcessEnv;
	outDir?: string;
}

export interface ServerInstance {
	port: number;
	cleanup: () => Promise<void>;
	phpProcess?: ChildProcess;
	nodeProcess?: ChildProcess;
}

export async function startPhpAndSidecar(options: ServerOptions): Promise<ServerInstance> {
	const { basePath = '', env = {}, outDir = 'build' } = options;
	const mode = options.mode;
	const port = options.port || 8000 + Math.floor(Math.random() * 1000);
	const sidecarPort = 3000 + Math.floor(Math.random() * 1000);

	let nodeProcess: ChildProcess | undefined;
	let phpProcess: ChildProcess | undefined;

	const cleanup = async () => {
		if (nodeProcess) {
			nodeProcess.kill();
		}
		if (phpProcess) {
			phpProcess.kill();
		}
		// Give them a moment to die
		await new Promise((resolve) => setTimeout(resolve, 500));
	};

	try {
		if (mode === 'js-ssr') {
			const handlerPath = path.resolve(outDir, 'server/handler.mjs');
			if (!fs.existsSync(handlerPath)) {
				throw new Error(`Node handler not found at ${handlerPath}`);
			}

			console.log(`Starting Node-compatible js-ssr sidecar on port ${sidecarPort}...`);
			nodeProcess = spawn('node', [handlerPath], {
				env: {
					...process.env,
					...env,
					PORT: sidecarPort.toString()
					// ORIGIN: `http://localhost:${sidecarPort}` // SvelteKit might need this
				},
				stdio: 'pipe' // Capture output for debugging
			});

			nodeProcess.stdout?.on('data', (d: unknown) => console.log(`[Node]: ${d}`));
			nodeProcess.stderr?.on('data', (d: unknown) => console.error(`[Node Err]: ${d}`));

			// Wait for Node server to be ready (check health)
			let retries = 100; // 10 seconds total
			while (retries > 0) {
				try {
					await new Promise((resolve, reject) => {
						const req = http.get(`http://127.0.0.1:${sidecarPort}/__health`, (res) => {
							if (res.statusCode === 200) resolve(true);
							else reject(new Error('Status ' + res.statusCode));
						});
						req.on('error', reject);
						req.end();
					});
					console.log('js-ssr sidecar is ready.');
					break;
				} catch (e) {
					retries--;
					if (retries === 0) {
						console.error('js-ssr sidecar failed to start:', e);
						throw new Error('js-ssr sidecar failed to start');
					}
					await new Promise((r) => setTimeout(r, 100));
				}
			}
		}

		console.log(`Starting PHP server on port ${port}...`);
		let routerPath = path.resolve(outDir, 'router.php');

		if (mode === 'js-ssr' && !fs.existsSync(routerPath)) {
			// In js-ssr mode, index.php is the public PHP entrypoint/proxy.
			const indexPath = path.resolve(outDir, 'index.php');
			if (fs.existsSync(indexPath)) {
				console.log('Using index.php as router for js-ssr mode');
				routerPath = indexPath;
			} else {
				throw new Error(`PHP entrypoint not found at ${indexPath} or ${routerPath}`);
			}
		} else if (!fs.existsSync(routerPath)) {
			throw new Error(`PHP router not found at ${routerPath}`);
		}

		phpProcess = spawn('php', ['-S', `127.0.0.1:${port}`, '-t', outDir, routerPath], {
			env: {
				...process.env,
				...env,
				SK_BASE_PATH: basePath,
				// Pass sidecar config to PHP if in js-ssr mode.
				...(mode === 'js-ssr'
					? {
							SIDECAR_HOST: '127.0.0.1',
							SIDECAR_PORT: sidecarPort.toString()
						}
					: {})
			},
			stdio: 'pipe'
		});

		phpProcess.stdout?.on('data', (d) => console.log(`[PHP]: ${d}`));
		phpProcess.stderr?.on('data', (d) => console.error(`[PHP Err]: ${d}`));

		// Wait for PHP server
		let phpRetries = 100; // 10 seconds total
		while (phpRetries > 0) {
			try {
				await new Promise((resolve, reject) => {
					const req = http.get(`http://127.0.0.1:${port}/`, () => {
						// Any status code means the server is up (even 404 or 500)
						resolve(true);
					});
					req.on('error', reject);
					req.end();
				});
				console.log('PHP server is ready.');
				break;
			} catch (e) {
				phpRetries--;
				if (phpRetries === 0) {
					console.error('PHP server failed to start:', e);
					throw new Error('PHP server failed to start');
				}
				await new Promise((r) => setTimeout(r, 100));
			}
		}

		return {
			port,
			cleanup,
			phpProcess,
			nodeProcess
		};
	} catch (e) {
		await cleanup();
		throw e;
	}
}
