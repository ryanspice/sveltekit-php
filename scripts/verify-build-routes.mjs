import { access, readFile, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import glob from 'tiny-glob';
import { normalizeAdapterMode } from './utils/config.mjs';

const stderrLogs = [];

const args = parseArgs(process.argv.slice(2));
const buildDir = path.resolve(args.build ?? process.env.VERIFY_BUILD_DIR ?? 'build');
const routesDir = path.resolve('src/routes');
const basePathOverride = args.basePath ?? process.env.VERIFY_BASE_PATH;
let basePath = normalizeBasePath(
	basePathOverride ?? (await inferBasePathFromBuild(buildDir)) ?? (await inferBasePathFromConfig())
);
const baseUrl = args.baseUrl ?? process.env.VERIFY_BASE_URL ?? '';
const mode = normalizeAdapterMode(args.mode ?? process.env.VERIFY_MODE ?? 'php-static');
const shouldStartPhp = Boolean(
	args.startPhp ?? process.env.VERIFY_START_PHP ?? (baseUrl === '' ? '1' : '')
);
const phpHost = args.phpHost ?? process.env.VERIFY_PHP_HOST ?? '127.0.0.1';
const phpPort = Number(args.phpPort ?? process.env.VERIFY_PHP_PORT ?? 8086);
const effectiveBaseUrl = baseUrl || (shouldStartPhp ? `http://${phpHost}:${phpPort}` : '');
const shouldHttpCheck = effectiveBaseUrl !== '';
let phpProc = null;

const checks = [];
const warnings = [];
const info = [];

const buildExists = await exists(buildDir);
addCheck('build directory exists', buildExists, buildDir);
if (!buildExists) {
	printSummary();
	process.exit(1);
}

const buildStats = await stat(buildDir);
addCheck('build directory is a directory', buildStats.isDirectory(), buildDir);

const requiredFiles = ['.htaccess', 'router.php', '_runtime/compat.php', '_protected/.htaccess'];

for (const rel of requiredFiles) {
	addCheck(`build/${rel} exists`, await exists(path.join(buildDir, rel)), rel);
}

const htaccessPath = path.join(buildDir, '.htaccess');
let trailingSlashMode = 'unknown';

if (await exists(htaccessPath)) {
	const htaccess = await readFile(htaccessPath, 'utf8');
	addCheck(
		'htaccess rewrites __data.json',
		/__data\.json|__data\\\.json/.test(htaccess),
		'.htaccess'
	);
	addCheck('htaccess handles base path', basePath ? htaccess.includes(basePath) : true, basePath);

	const tsMatch = htaccess.match(/# trailingSlash: (always|never|ignore)/);
	trailingSlashMode = tsMatch ? tsMatch[1] : 'unknown';

	addCheck(
		`htaccess handles trailing slash (${trailingSlashMode})`,
		Boolean(tsMatch),
		'.htaccess'
	);
}

const protectedHtaccessPath = path.join(buildDir, '_protected', '.htaccess');
if (await exists(protectedHtaccessPath)) {
	const protectedHtaccess = await readFile(protectedHtaccessPath, 'utf8');
	addCheck(
		'protected htaccess denies access',
		/Require\s+all\s+denied/i.test(protectedHtaccess),
		'_protected/.htaccess'
	);
}

const routerPath = path.join(buildDir, 'router.php');
if (await exists(routerPath)) {
	const router = await readFile(routerPath, 'utf8');
	addCheck('router handles __data.json', router.includes('__data.json'), 'router.php');
	addCheck('router blocks _protected', router.includes('_protected'), 'router.php');
	addCheck('router base path configurable', router.includes('SK_BASE_PATH'), 'router.php');
}

const phpFiles = await glob('**/*.php', { cwd: buildDir, absolute: true });
const allFiles = await glob('**/*', { cwd: buildDir, absolute: true });
const rootIndexExists =
	(await exists(path.join(buildDir, 'index.php'))) ||
	(await exists(path.join(buildDir, 'index.html')));

const phpFileInfo = classifyPhpFiles(buildDir, phpFiles);
const buildRoutes = buildRoutesFromPhp(buildDir, phpFileInfo.routeFiles, mode);

info.push(`total files: ${allFiles.length}`);
info.push(`php files: ${phpFiles.length}`);
info.push(`route php files: ${phpFileInfo.routeFiles.length}`);
info.push(`__data.php files: ${phpFileInfo.dataFiles.length}`);

const expected = await collectExpectedRoutes(routesDir);
const expectedStaticRoutes = expected.routes.filter((route) => !route.includes('['));
const expectedStaticPageRoutes = expected.pageRoutes.filter((route) => !route.includes('['));
const missing = [];

for (const route of expectedStaticRoutes) {
	if (!buildRoutes.has(route)) {
		missing.push(route);
	}
}

if (missing.length > 0) {
	warnings.push(`missing build routes (${missing.length}): ${missing.join(', ')}`);
}

const dataMissing = [];
for (const route of expectedStaticPageRoutes) {
	const dirRel = routeToDir(route);
	const dataRel = path.posix.join(dirRel, '__data.php');
	if (await exists(path.join(buildDir, dataRel))) {
		continue;
	}
	dataMissing.push(route);
}

if (dataMissing.length > 0) {
	warnings.push(`missing __data.php for routes (${dataMissing.length}): ${dataMissing.join(', ')}`);
}

const canonicalRoutes = [
	{ path: '/ssr-data', expectStatus: 200, expectType: 'text/html' },
	{ path: '/parent-child/nested', expectStatus: 200, expectType: 'text/html' },
	{ path: '/form-basic', expectStatus: 200, expectType: 'text/html' },
	{ path: '/form-multipart', expectStatus: 200, expectType: 'text/html' },
	{ path: '/stream', expectStatus: 200, expectType: 'text/html' },
	{ path: '/preload/__data.json', expectStatus: 200, expectType: 'application/json' },
	{ path: '/parent-child/nested/__data.json', expectStatus: 200, expectType: 'application/json' },
	{
		path: '/negotiate',
		expectStatus: 200,
		expectType: 'text/html',
		headers: { accept: 'text/html' }
	},
	{
		path: '/negotiate',
		expectStatus: 200,
		expectType: 'application/json',
		headers: { accept: 'application/json' },
		expectVary: 'Accept'
	},
	{ path: '/status?code=404', expectStatus: 404 }
];

if (trailingSlashMode === 'never') {
	canonicalRoutes.push({
		path: '/parent-child/nested/',
		expectStatus: shouldStartPhp ? 200 : 308,
		expectRedirect: !shouldStartPhp
	});
} else if (trailingSlashMode === 'always') {
	canonicalRoutes.push({
		path: '/parent-child/nested',
		expectStatus: 308,
		expectRedirect: true
	});
}

canonicalRoutes.unshift({
	path: '/',
	expectStatuses: rootIndexExists ? [200] : [200, 404],
	expectType: rootIndexExists ? 'text/html' : undefined,
	expectBody: rootIndexExists ? 'SvelteKit PHP Adapter' : undefined
});

if (basePath) {
	canonicalRoutes.splice(1, 0, {
		path: basePath,
		expectStatus: 200,
		expectType: 'text/html',
		expectBody: 'SvelteKit PHP Adapter',
		expectIncludes: `assets: "${basePath}"`
	});
}

if (mode === 'js-ssr') {
	canonicalRoutes.push({ path: '/__health', expectStatus: 200, expectType: 'application/json' });
}

if (shouldHttpCheck) {
	if (shouldStartPhp) {
		const started = await startPhpServer();
		if (!started) {
			warnings.push('php server could not be started; http checks skipped');
		}
	}
	for (const route of canonicalRoutes) {
		const url = new URL(route.path, effectiveBaseUrl).toString();
		const result = await httpCheck(url, route);
		addCheck(`http ${route.path}`, result.ok, result.details);
	}
} else {
	info.push('http checks skipped (set VERIFY_BASE_URL or --base-url)');
}

if (phpProc) {
	phpProc.kill();
}

printSummary();
process.exit(checks.some((check) => !check.ok) ? 1 : 0);

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

async function inferBasePathFromBuild(dir) {
	const routerPath = path.join(dir, 'router.php');
	if (!(await exists(routerPath))) return '';
	const router = await readFile(routerPath, 'utf8');
	const match = router.match(/\$base\s*=\s*getenv\('SK_BASE_PATH'\)\s*\?:\s*'([^']*)'/);
	if (match?.[1] != null) return match[1];
	return '';
}

async function inferBasePathFromConfig() {
	const configPath = path.resolve('svelte.config.js');
	if (!(await exists(configPath))) return '';
	const config = await readFile(configPath, 'utf8');
	const directMatch = config.match(/const\s+base\s*=\s*['"]([^'"]*)['"]/);
	if (directMatch?.[1] != null) return directMatch[1];
	const pathsMatch = config.match(/paths\s*:\s*{[^}]*base\s*:\s*['"]([^'"]*)['"]/s);
	if (pathsMatch?.[1] != null) return pathsMatch[1];
	return '';
}

function normalizeBasePath(value) {
	if (!value) return '';
	const trimmed = value.trim();
	if (trimmed === '/') return '';
	return trimmed.startsWith('/') ? trimmed.replace(/\/$/, '') : `/${trimmed.replace(/\/$/, '')}`;
}

async function exists(filePath) {
	try {
		await access(filePath);
		return true;
	} catch {
		return false;
	}
}

function addCheck(name, ok, details) {
	checks.push({ name, ok, details });
}

function classifyPhpFiles(root, files) {
	const routeFiles = [];
	const dataFiles = [];
	const actionFiles = [];
	const otherFiles = [];

	for (const file of files) {
		const rel = posixify(path.relative(root, file));
		if (rel.startsWith('_protected/') || rel.startsWith('_runtime/')) continue;
		if (rel === 'router.php') {
			otherFiles.push(rel);
			continue;
		}
		if (rel.endsWith('__data.php')) {
			dataFiles.push(rel);
			continue;
		}
		if (rel.endsWith('__action.php')) {
			actionFiles.push(rel);
			continue;
		}
		routeFiles.push(rel);
	}

	return { routeFiles, dataFiles, actionFiles, otherFiles };
}

function buildRoutesFromPhp(root, routeFiles, mode) {
	const routes = new Set();
	for (const rel of routeFiles) {
		if (rel === 'index.php') {
			if (mode === 'php-static') routes.add('/');
			continue;
		}
		if (rel.endsWith('/index.php')) {
			const dir = rel.slice(0, -'/index.php'.length);
			routes.add('/' + dir);
		} else if (rel.endsWith('.php')) {
			const route = '/' + rel.slice(0, -'.php'.length);
			routes.add(route === '/index' ? '/' : route);
		}
	}
	return routes;
}

async function collectExpectedRoutes(routesRoot) {
	const pageFiles = await glob('**/+page.*', { cwd: routesRoot });
	const serverFiles = await glob('**/+server.php', { cwd: routesRoot });
	const pageServerFiles = await glob('**/+page.server.*', { cwd: routesRoot });

	const all = new Set([...pageFiles, ...serverFiles, ...pageServerFiles]);
	const routes = new Set();
	const pageRoutes = new Set();

	for (const file of all) {
		const dir = path.posix.dirname(posixify(file));
		const route = routeFromDir(dir);
		routes.add(route);
		if (pageFiles.includes(file) || pageServerFiles.includes(file)) {
			pageRoutes.add(route);
		}
	}

	return { routes: Array.from(routes).sort(), pageRoutes: Array.from(pageRoutes).sort() };
}

function routeFromDir(dir) {
	if (dir === '.' || dir === '') return '/';
	const segments = dir
		.split('/')
		.filter((segment) => !(segment.startsWith('(') && segment.endsWith(')')));
	return '/' + segments.join('/');
}

function routeToDir(route) {
	const trimmed = route.replace(/^\/+/, '');
	return trimmed === '' ? '.' : trimmed;
}

function posixify(value) {
	return value.split(path.sep).join('/');
}

async function httpCheck(url, expectations) {
	let lastError;
	// Retry loop for network flakes
	for (let attempt = 0; attempt < 3; attempt++) {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 5000);
		try {
			const response = await fetch(url, {
				headers: expectations.headers ?? {},
				signal: controller.signal,
				redirect: expectations.expectRedirect ? 'manual' : 'follow'
			});
			clearTimeout(timeout);

			// Got a response, validate it
			const expectedStatuses = expectations.expectStatuses ?? [expectations.expectStatus];
			const statusOk = expectedStatuses.includes(response.status);
			const contentType = response.headers.get('content-type') ?? '';
			const typeOk = expectations.expectType ? contentType.includes(expectations.expectType) : true;
			const vary = response.headers.get('vary') ?? '';
			const varyOk = expectations.expectVary ? vary.includes(expectations.expectVary) : true;
			const body = expectations.expectBody ? await response.text() : null;
			const bodyOk = expectations.expectBody ? body?.includes(expectations.expectBody) : true;
			const includesOk = expectations.expectIncludes
				? body?.includes(expectations.expectIncludes)
				: true;
			const ok = statusOk && typeOk && varyOk && bodyOk && includesOk;
			const details = [
				`status=${response.status}`,
				expectations.expectType ? `type=${contentType || 'missing'}` : null,
				expectations.expectVary ? `vary=${vary || 'missing'}` : null
			]
				.filter(Boolean)
				.join(', ');
			return { ok, details };
		} catch (error) {
			clearTimeout(timeout);
			lastError = error;
			// Wait before retry
			if (attempt < 2) await new Promise((r) => setTimeout(r, 200 * Math.pow(2, attempt)));
		}
	}
	return { ok: false, details: lastError?.message ?? 'request failed after retries' };
}

async function startPhpServer() {
	if (!(await exists(path.join(buildDir, 'router.php')))) {
		warnings.push('router.php missing; cannot start php server');
		return false;
	}

	const routerAbsolute = path.join(buildDir, 'router.php');
	phpProc = spawn('php', ['-d', 'opcache.enable=0', '-S', `${phpHost}:${phpPort}`, '-t', buildDir, routerAbsolute], {
		stdio: 'pipe',
		env: {
			...process.env,
			SK_BASE_PATH: basePath
		}
	});

	phpProc.stderr.on('data', (data) => {
		const msg = data.toString().trim();
		if (msg) {
			if (stderrLogs.length > 100) stderrLogs.shift();
			stderrLogs.push(msg);
		}
	});

	// Readiness probe: try a 404 route to ensure router is active
	// We use 127.0.0.1 explicitly to avoid IPv6 issues
	const probeUrl = new URL('/__health_check_probe', effectiveBaseUrl).toString();
	console.log(`Waiting for PHP server at ${probeUrl}...`);

	const ok = await waitForServer(probeUrl);
	if (!ok) {
		phpProc.kill();
		phpProc = null;
		warnings.push('php server did not become ready');
		return false;
	}

	process.on('exit', () => phpProc?.kill());
	process.on('SIGINT', () => phpProc?.kill());
	process.on('SIGTERM', () => phpProc?.kill());
	return true;
}

async function waitForServer(url, timeoutMs = 10000) {
	const start = Date.now();
	let attempt = 0;
	while (Date.now() - start < timeoutMs) {
		try {
			const res = await fetch(url);
			if (res.status >= 200 && res.status < 500) return true;
		} catch {
			// retry
		}
		attempt++;
		// Exponential backoff: 100, 150, 225, 337... capped at 1s
		const delay = Math.min(100 * Math.pow(1.5, attempt), 1000);
		await new Promise((resolve) => setTimeout(resolve, delay));
	}
	return false;
}

function printSummary() {
	console.log('');
	console.log('Build verification');
	console.log(`build: ${buildDir}`);
	console.log(`mode: ${mode}`);
	console.log(`basePath: ${basePath || '(none)'}`);
	console.log(`baseUrl: ${baseUrl || '(not set)'}`);

	console.log('');
	for (const item of info) {
		console.log(`info: ${item}`);
	}

	console.log('');
	for (const check of checks) {
		const status = check.ok ? 'ok' : 'fail';
		console.log(`${status}: ${check.name}${check.details ? ` (${check.details})` : ''}`);
	}

	if (warnings.length > 0) {
		console.log('');
		for (const warning of warnings) {
			console.log(`warn: ${warning}`);
		}
	}

	console.log('');
	const failed = checks.filter((check) => !check.ok).length;
	console.log(`summary: ${failed === 0 ? 'pass' : 'fail'} (${failed} failed checks)`);

	if (failed > 0 && stderrLogs.length > 0) {
		console.log('');
		console.log('\x1b[31m--- Server Stderr (last 100 lines) ---\x1b[0m');
		console.log(stderrLogs.join('\n'));
		console.log('\x1b[31m--------------------------------------\x1b[0m');
	}
}
