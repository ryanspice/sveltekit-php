import { access } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = parseArgs(process.argv.slice(2));
const buildDir = path.resolve(repoRoot, args.build ?? process.env.VERIFY_BUILD_DIR ?? 'build');
const host = args.host ?? process.env.VERIFY_PHP_HOST ?? '127.0.0.1';
const generatedPort = Number(args.generatedPort ?? process.env.VERIFY_GENERATED_PORT ?? 8091);
const rootPort = Number(args.rootPort ?? process.env.VERIFY_ROOT_ROUTER_PORT ?? 8092);
const basePath = normalizeBasePath(args.basePath ?? process.env.VERIFY_BASE_PATH ?? '');

const generatedRouter = path.join(buildDir, 'router.php');
const rootRouter = path.join(repoRoot, 'router.php');
const servers = [];
let cleaningUp = false;

process.on('exit', cleanupServers);
process.on('SIGINT', () => {
	cleanupServers();
	process.exit(130);
});
process.on('SIGTERM', () => {
	cleanupServers();
	process.exit(143);
});

await requireFile(generatedRouter, 'generated build router');
await requireFile(rootRouter, 'root compatibility router');

try {
	const generated = await startPhpServer('generated', generatedPort, generatedRouter);
	const root = await startPhpServer('root', rootPort, rootRouter);
	servers.push(generated, root);

	const fixtures = createFixtures(basePath);
	const failures = [];

	for (const fixture of fixtures) {
		const generatedResponse = await request(generated.port, fixture);
		const rootResponse = await request(root.port, fixture);
		const comparison = compareResponses(generatedResponse, rootResponse);

		if (comparison.ok) {
			console.log(`ok: ${fixture.name} ${fixture.path} status=${generatedResponse.statusCode}`);
		} else {
			failures.push({
				fixture,
				generated: generatedResponse,
				root: rootResponse,
				reason: comparison.reason
			});
			console.log(`fail: ${fixture.name} ${fixture.path} ${comparison.reason}`);
		}
	}

	if (failures.length > 0) {
		console.log('');
		console.log(`Root router parity failed (${failures.length} mismatches)`);
		for (const failure of failures) {
			console.log(`- ${failure.fixture.name}: ${failure.reason}`);
			console.log(
				`  generated: status=${failure.generated.statusCode} type=${failure.generated.contentType || '(none)'} hash=${failure.generated.bodyHash}`
			);
			console.log(
				`  root: status=${failure.root.statusCode} type=${failure.root.contentType || '(none)'} hash=${failure.root.bodyHash}`
			);
		}
		process.exitCode = 1;
	} else {
		console.log('');
		console.log(
			`PASS root-router-parity: ${fixtures.length} representative requests matched generated router behavior.`
		);
	}
} finally {
	cleanupServers();
}

function parseArgs(argv) {
	const output = {};
	for (let i = 0; i < argv.length; i += 1) {
		const arg = argv[i];
		if (!arg.startsWith('--')) continue;
		const key = arg.slice(2);
		const next = argv[i + 1];
		if (next === undefined || next.startsWith('--')) {
			output[key] = true;
			continue;
		}
		output[key] = next;
		i += 1;
	}
	return output;
}

function normalizeBasePath(value) {
	if (!value) return '';
	const trimmed = String(value).trim();
	if (trimmed === '' || trimmed === '/') return '';
	const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
	return normalized.replace(/\/$/, '');
}

async function requireFile(filePath, label) {
	try {
		await access(filePath);
	} catch {
		throw new Error(`${label} missing at ${filePath}. Build the adapter output before running parity.`);
	}
}

async function startPhpServer(name, port, routerPath) {
	const stderr = [];
	const proc = spawn(
		'php',
		['-d', 'opcache.enable=0', '-S', `${host}:${port}`, '-t', buildDir, routerPath],
		{
			cwd: repoRoot,
			stdio: 'pipe',
			env: {
				...process.env,
				SK_BASE_PATH: basePath
			}
		}
	);

	proc.stderr.on('data', (chunk) => {
		const text = chunk.toString().trim();
		if (!text) return;
		stderr.push(text);
		if (stderr.length > 50) stderr.shift();
	});

	proc.on('exit', (code) => {
		if (code !== null && code !== 0) {
			stderr.push(`${name} php server exited with code ${code}`);
		}
	});

	const ready = await waitForServer(port);
	if (!ready) {
		proc.kill();
		throw new Error(
			`${name} php server did not become ready on ${host}:${port}.\n${stderr.join('\n')}`
		);
	}

	return { name, port, proc, stderr };
}

async function waitForServer(port, timeoutMs = 10000) {
	const started = Date.now();
	let attempt = 0;
	while (Date.now() - started < timeoutMs) {
		try {
			const response = await request(port, {
				name: 'readiness',
				path: '/__root_router_parity_probe',
				headers: { accept: 'text/plain' }
			});
			if (response.statusCode >= 200 && response.statusCode < 500) return true;
		} catch {
			// retry
		}
		attempt += 1;
		await delay(Math.min(100 * Math.pow(1.5, attempt), 1000));
	}
	return false;
}

function createFixtures(base) {
	const withBase = (requestPath) => {
		const normalized = requestPath.startsWith('/') ? requestPath : `/${requestPath}`;
		if (!base) return normalized;
		if (normalized === '/') return `${base}/`;
		return `${base}${normalized}`;
	};

	const fixtures = [
		{ name: 'root', path: withBase('/'), headers: { accept: 'text/html' } },
		{ name: 'page', path: withBase('/form-basic'), headers: { accept: 'text/html' } },
		{
			name: 'data',
			path: withBase('/preload/__data.json'),
			headers: { accept: 'application/json' }
		},
		{ name: 'negotiate-html', path: withBase('/negotiate'), headers: { accept: 'text/html' } },
		{
			name: 'negotiate-json',
			path: withBase('/negotiate'),
			headers: { accept: 'application/json' }
		},
		{ name: 'missing-asset', path: withBase('/_app/missing.js'), headers: { accept: '*/*' } },
		{
			name: 'encoded-traversal',
			path: withBase('/%2e%2e/secret.txt'),
			headers: { accept: 'text/plain' }
		},
		{
			name: 'double-encoded-traversal',
			path: withBase('/%252e%252e/secret.txt'),
			headers: { accept: 'text/plain' }
		},
		{
			name: 'encoded-backslash-traversal',
			path: withBase('/safe/%5c..%5csecret.txt'),
			headers: { accept: 'text/plain' }
		},
		{ name: 'protected', path: withBase('/_protected/secret.txt'), headers: { accept: '*/*' } },
		{ name: 'missing-route', path: withBase('/definitely-missing'), headers: { accept: 'text/html' } }
	];

	if (base) {
		fixtures.push({
			name: 'base-mismatch',
			path: '/outside-configured-base',
			headers: { accept: 'text/html' }
		});
	}

	return fixtures;
}

function request(port, fixture) {
	return new Promise((resolve, reject) => {
		const req = http.request(
			{
				host,
				port,
				method: 'GET',
				path: fixture.path,
				headers: fixture.headers ?? {},
				timeout: 5000
			},
			(res) => {
				const chunks = [];
			res.on('data', (chunk) => chunks.push(chunk));
			res.on('end', () => {
				const body = Buffer.concat(chunks);
				const normalizedBody = normalizeBodyForComparison(body, port);
				resolve({
					statusCode: res.statusCode ?? 0,
					contentType: normalizeHeader(res.headers['content-type']),
					location: normalizeHeader(res.headers.location),
					bodyLength: body.length,
					bodyHash: createHash('sha256').update(body).digest('hex'),
					normalizedBodyHash: createHash('sha256').update(normalizedBody).digest('hex'),
					normalizedBody
				});
			});
		}
		);
		req.on('timeout', () => {
			req.destroy(new Error(`request timed out: ${fixture.path}`));
		});
		req.on('error', reject);
		req.end();
	});
}

function compareResponses(generated, root) {
	if (generated.statusCode !== root.statusCode) {
		return { ok: false, reason: `status mismatch ${generated.statusCode} !== ${root.statusCode}` };
	}
	if (generated.contentType !== root.contentType) {
		return {
			ok: false,
			reason: `content-type mismatch ${generated.contentType || '(none)'} !== ${root.contentType || '(none)'}`
		};
	}
	if (generated.location !== root.location) {
		return {
			ok: false,
			reason: `location mismatch ${generated.location || '(none)'} !== ${root.location || '(none)'}`
		};
	}
	if (generated.normalizedBodyHash !== root.normalizedBodyHash) {
		return { ok: false, reason: `body mismatch ${firstDiff(generated.normalizedBody, root.normalizedBody)}` };
	}
	return { ok: true, reason: '' };
}

function firstDiff(left, right) {
	const max = Math.min(left.length, right.length);
	let index = 0;
	while (index < max && left[index] === right[index]) index += 1;
	const leftSnippet = JSON.stringify(left.slice(Math.max(0, index - 40), index + 80));
	const rightSnippet = JSON.stringify(right.slice(Math.max(0, index - 40), index + 80));
	return `at ${index}; generated=${leftSnippet}; root=${rightSnippet}`;
}

function normalizeBodyForComparison(body, port) {
	const text = body.toString('utf8');
	return text
		.replaceAll(`${host}:${port}`, `${host}:<PORT>`)
		.replaceAll(`localhost:${port}`, 'localhost:<PORT>')
		.replace(/req_[a-f0-9]+\.\d+/g, 'req_<ID>')
		.replace(/layout_[a-f0-9]+\.\d+/g, 'layout_<ID>')
		.replace(/page_[a-z0-9_-]+_[a-f0-9]+\.\d+/g, 'page_<ID>')
		.replace(/("PHP [^"]+",)\d+/g, '$1<MEMORY>');
}

function normalizeHeader(value) {
	if (Array.isArray(value)) return value.join(', ');
	return value ?? '';
}

function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function cleanupServers() {
	if (cleaningUp) return;
	cleaningUp = true;
	for (const server of servers) {
		if (!server.proc.killed) {
			server.proc.kill();
		}
	}
}
