import { spawn, type ChildProcess } from 'node:child_process';
import {
	existsSync,
	mkdtempSync,
	mkdirSync,
	readFileSync,
	rmSync,
	writeFileSync
} from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { getStandaloneApiPhp } from '../../adapter/src/runtime/js-ssr-templates.ts';
import { getRouterPhp } from '../../adapter/src/runtime/php-templates.ts';

const marker = 'ROUTER_PHP_SOURCE_MARKER_20261106_P1';

async function freePort() {
	return await new Promise<number>((resolve, reject) => {
		const server = net.createServer();
		server.once('error', reject);
		server.listen(0, '127.0.0.1', () => {
			const address = server.address();
			if (!address || typeof address === 'string') return reject(new Error('No TCP port'));
			server.close((error) => (error ? reject(error) : resolve(address.port)));
		});
	});
}

function waitUntilReady(process: ChildProcess, url: string) {
	return new Promise<void>((resolve, reject) => {
		const deadline = Date.now() + 5000;
		const poll = async () => {
			if (process.exitCode !== null) return reject(new Error(`PHP exited: ${process.exitCode}`));
			try {
				await fetch(url);
				resolve();
			} catch {
				if (Date.now() >= deadline) return reject(new Error('PHP loopback server did not start'));
				setTimeout(poll, 30);
			}
		};
		poll();
	});
}

export type RouterProbe = {
	base: '' | '/sites/demo';
	root: string;
	origin: string;
	marker: string;
	request(pathname: string, method?: 'GET' | 'HEAD'): Promise<Response>;
	protectedEffect: string;
	records: {
		method: string;
		path: string;
		status: number;
		contentType: string | null;
		bodyBytes: number;
		sourceMarkerPresent: boolean;
	}[];
	close(): Promise<void>;
};

export async function createRouterProbe(layout: 'root' | 'base'): Promise<RouterProbe> {
	const base = layout === 'root' ? '' : '/sites/demo';
	const tempRoot = process.env.TEMP;
	if (!tempRoot) throw new Error('TEMP must point into task evidence storage');
	const root = mkdtempSync(path.join(tempRoot, `router-php-${layout}-`));
	const protectedEffect = path.join(root, 'protected-handler-ran.txt');
	const asset = Buffer.from('<!doctype html><title>router fixture</title><p>static fixture</p>');
	let child: ChildProcess | undefined;
	let origin = '';
	try {
		const endpointDir = path.join(root, 'negotiate');
		mkdirSync(endpointDir, { recursive: true });
		mkdirSync(path.join(root, '_protected'), { recursive: true });
		mkdirSync(path.join(root, '_runtime'), { recursive: true });
		writeFileSync(path.join(root, '_runtime', 'compat.php'), '<?php // runtime fixture');
		writeFileSync(
			path.join(root, '_protected', 'probe.php'),
			`<?php file_put_contents(${JSON.stringify(protectedEffect)}, 'ran'); echo '${marker}';`
		);
		writeFileSync(path.join(root, '_server.php'), `<?php echo '${marker}';`);
		writeFileSync(
			path.join(endpointDir, '_server.php'),
			`<?php function GET($event) { return ['status' => 200, 'headers' => ['Content-Type' => 'application/json'], 'body' => ['title' => 'Negotiated API']]; }`
		);
		writeFileSync(path.join(endpointDir, 'index.php'), getStandaloneApiPhp('_server.php'));
		writeFileSync(path.join(endpointDir, 'case.PHP'), getStandaloneApiPhp('_server.php'));
		writeFileSync(path.join(root, 'asset.txt'), asset);
		writeFileSync(path.join(root, 'index.php'), '<?php echo "root fixture";');
		writeFileSync(path.join(root, 'router.php'), getRouterPhp(base, 'js-ssr', false));

		const port = await freePort();
		const php = process.env.PHP_BINARY || 'php';
		child = spawn(php, ['-S', `127.0.0.1:${port}`, '-t', root, path.join(root, 'router.php')], {
			cwd: root,
			env: { ...process.env, SK_BASE_PATH: base },
			stdio: ['ignore', 'ignore', 'pipe']
		});
		origin = `http://127.0.0.1:${port}`;
		await waitUntilReady(child, `${origin}${base}/_runtime/compat.php`);
	} catch (error) {
		child?.kill();
		if (child && child.exitCode === null)
			await new Promise<void>((resolve) => child!.once('exit', () => resolve()));
		rmSync(root, { recursive: true, force: true });
		throw error;
	}
	const records: RouterProbe['records'] = [];

	return {
		base,
		root,
		origin,
		marker,
		async request(pathname, method = 'GET') {
			const response = await fetch(`${origin}${pathname}`, { method, redirect: 'manual' });
			const body = Buffer.from(await response.clone().arrayBuffer());
			records.push({
				method,
				path: pathname,
				status: response.status,
				contentType: response.headers.get('content-type'),
				bodyBytes: body.length,
				sourceMarkerPresent: body.includes(marker)
			});
			return response;
		},
		protectedEffect,
		records,
		async close() {
			child!.kill();
			if (child!.exitCode === null)
				await new Promise<void>((resolve) => child!.once('exit', () => resolve()));
			const evidenceDir = process.env.ROUTER_HTTP_EVIDENCE_DIR;
			if (evidenceDir) {
				mkdirSync(evidenceDir, { recursive: true });
				writeFileSync(
					path.join(evidenceDir, `http-${layout}-${process.pid}-${Date.now()}.json`),
					JSON.stringify(
						{ layout, base, origin, records, protectedHandlerRan: existsSync(protectedEffect) },
						null,
						2
					)
				);
			}
			rmSync(root, { recursive: true, force: true });
		}
	};
}
