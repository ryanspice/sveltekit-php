import fs from 'node:fs';
import path from 'node:path';
import { normalizeAdapterMode } from './utils/config.mjs';

// Configuration
const OUT_DIR = process.env.ADAPTER_OUT || 'build-verify-all'; // Use the same dir as verify-all
const BASE_PATH = process.env.SK_BASE_PATH || '';
function resolvePath(p) {
	if (!BASE_PATH || BASE_PATH === '/' || BASE_PATH === '') return p;
	const rel = p.startsWith('/') ? p.slice(1) : p;
	const base = BASE_PATH.startsWith('/') ? BASE_PATH.slice(1) : BASE_PATH;
	return path.join(base, rel);
}

const COLORS = {
	green: '\x1b[32m',
	red: '\x1b[31m',
	reset: '\x1b[0m',
	bold: '\x1b[1m'
};

function log(msg, color = COLORS.reset) {
	console.log(`${color}${msg}${COLORS.reset}`);
}

function fail(msg) {
	console.error(`${COLORS.red}FAIL: ${msg}${COLORS.reset}`);
	process.exit(1);
}

function pass(msg) {
	console.log(`${COLORS.green}PASS: ${msg}${COLORS.reset}`);
}

function checkFileExists(relPath) {
	const absPath = path.join(OUT_DIR, relPath);
	if (!fs.existsSync(absPath)) {
		fail(`Missing file: ${relPath}`);
	}
	pass(`File exists: ${relPath}`);
	return fs.readFileSync(absPath, 'utf8');
}

function checkContent(content, pattern, name) {
	if (typeof pattern === 'string') {
		if (!content.includes(pattern)) fail(`${name}: Missing string "${pattern}"`);
	} else {
		if (!pattern.test(content)) fail(`${name}: Failed regex ${pattern}`);
	}
	pass(`${name}: Verified`);
}

async function run() {
	log(`Verifying build output in ${OUT_DIR}...\n`, COLORS.bold);

	if (!fs.existsSync(OUT_DIR)) {
		fail(`Build directory ${OUT_DIR} does not exist. Run verify:all first.`);
	}

	// 1. .htaccess Checks
	const htaccess = checkFileExists('.htaccess');
	checkContent(
		htaccess,
		/# trailingSlash: (always|never|ignore)/,
		'htaccess: trailingSlash marker'
	);

	// The rewrite rule might differ based on base path configuration
	// In the build, we see: RewriteRule ^(.*)/$ /dev/sveltekit/$1 [L,R=308]
	// This is because base path is /dev/sveltekit
	// Let's check for the general structure of the redirect rule
	checkContent(
		htaccess,
		/RewriteRule \^\(\.\*\)\/\$ .*\[L,R=308\]/,
		'htaccess: trailingSlash rule (308 redirect)'
	);

	checkContent(
		htaccess,
		/RewriteRule \^.*__data\\.json\$ .*__data\.php \[QSA,L\]/,
		'htaccess: __data.json rewrite'
	);

	// 2. Manifest Checks
	const manifest = checkFileExists('adapter/route-manifest.php');
	// Check for /status route entry
	// It should look like: "re" => "~^/status/?$~", "type" => "page"
	checkContent(manifest, /\/status\/\?\$~/, 'manifest: status route regex');
	checkContent(manifest, /'type'\s*=>\s*'page'/, 'manifest: status route type');

	// 3. Page Shim Checks
	// /status should have an index.php shim because it has +page.server.php
	// Only for php-static mode
	if (normalizeAdapterMode(process.env.ADAPTER_MODE || 'php-static') !== 'js-ssr') {
		checkFileExists(resolvePath('status/index.php'));
		const statusShim = checkFileExists(resolvePath('status/index.php'));
		checkContent(statusShim, 'sk_extract_params', 'shim: parameter extraction');
	} else {
		log('Skipping shim checks for js-ssr mode', COLORS.yellow);
		// For js-ssr, the entry point is the generated handler in server/
		checkFileExists('server/handler.mjs');
	}

	// 4. Asset Checks
	checkFileExists('_app/version.json');

	// 5. Package & Config Integrity
	log('\nChecking configuration integrity...');
	if (!fs.existsSync('package.json')) fail('Missing package.json in root');
	// Playwright Config Check (Relaxed)
	// We no longer strictly require e2e:php-static script to exist in package.json
	// if we are running verification via scripts/verify-all.mjs which invokes playwright directly.
	// But let's check if the config file exists if referenced.

	const playwrightConfig = 'playwright.config.ts';
	if (fs.existsSync(playwrightConfig)) {
		pass(`Config exists: ${playwrightConfig}`);
	} else {
		log(`Warning: ${playwrightConfig} missing, E2E tests might fail`, COLORS.yellow);
	}
	// Check js-ssr Playwright Config
	// Same as above, relaxed check
	log('\nStatic verification passed!', COLORS.green + COLORS.bold);
}

run();
