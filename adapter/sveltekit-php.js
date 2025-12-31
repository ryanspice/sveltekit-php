import path from 'node:path';
import { fileURLToPath } from 'node:url';
import glob from 'tiny-glob';
import { readFile, writeFile, rename, unlink, access } from 'node:fs/promises';

const posixify = (p) => p.split(path.sep).join(path.posix.sep);
const stripLeadingSlash = (s) => (s.startsWith('/') ? s.slice(1) : s);

function toPhpIdentifier(s) {
	// conservative: only [A-Za-z0-9_], never start with a digit
	const t = s.replace(/[^A-Za-z0-9_]/g, '_');
	return /^\d/.test(t) ? `_${t}` : t;
}

function fnPrefixForServerFile(serverRelPosix) {
	// example: "(app)/blog/+page.server.php" -> "sk__app__blog__page_server"
	const base = serverRelPosix
		.replace(/^\//, '')
		.replace(/\.php$/i, '')
		.replace(/\//g, '_')
		.replace(/\+/g, '')
		.replace(/\./g, '_');
	return `sk_${toPhpIdentifier(base)}`;
}

async function exists(p) {
	try {
		await access(p);
		return true;
	} catch {
		return false;
	}
}

function findRouteForNavPath(builder, navPath) {
	// navPath is usually "/foo/" from builder.prerendered.pages.
	// Some patterns match with/without trailing slash, so try both.
	const withSlash = navPath.endsWith('/') ? navPath : `${navPath}/`;
	const withoutSlash = navPath.endsWith('/') ? navPath.slice(0, -1) : navPath;

	// pick the most specific (longest id) matching route
	const matches = builder.routes
		.filter((r) => r.pattern?.test(withSlash) || r.pattern?.test(withoutSlash))
		.sort((a, b) => (b.id?.length ?? 0) - (a.id?.length ?? 0));

	return matches[0] ?? null;
}

function buildLayoutChainCandidates(routeIdPosix) {
	// routeIdPosix includes groups like "/(app)/dashboard"
	// We walk up parents: "/(app)/dashboard" -> "/(app)" -> "/"
	const parts = stripLeadingSlash(routeIdPosix).split('/').filter(Boolean);
	const chain = [];
	for (let i = parts.length; i >= 0; i--) {
		const seg = parts.slice(0, i).join('/');
		chain.push(seg); // "" means routes root
	}
	return chain;
}

function phpRelToRootFromNav(navPath) {
	// navPath like "/a/b/" => depth 2 => "../../"
	const depth = navPath.split('/').filter(Boolean).length;
	return depth === 0 ? './' : `./${'../'.repeat(depth)}`;
}

function detectInlineDataModeFromHtml(html) {
	// We need to find "const data =" OR "data:" followed by [ or {
	// Because "data:" can appear in data-URIs, we must loop until we find a valid one.

	const patterns = ['const data', 'data:'];

	for (const p of patterns) {
		let startPos = 0;
		while (true) {
			const idx = html.indexOf(p, startPos);
			if (idx === -1) break;

			// Check what follows
			for (let i = idx + p.length; i < html.length; i++) {
				const c = html[i];
				if (c === '=' || c === ':' || c === ' ' || c === '\t' || c === '\r' || c === '\n') continue;

				if (c === '[') return 'nodes';
				if (c === '{') return 'payload';

				// Invalid char, this occurrence is not it (e.g. data:image)
				break;
			}

			startPos = idx + 1;
		}
	}

	return 'unknown';
}

function replaceInlineConstData(html) {
	const patterns = ['const data', 'data:'];

	for (const p of patterns) {
		let startPos = 0;
		while (true) {
			const startIdx = html.indexOf(p, startPos);
			if (startIdx === -1) break;

			// Find opening bracket
			let openIdx = -1;
			let openChar = '';
			let closeChar = '';
			let isValid = false;

			for (let i = startIdx + p.length; i < html.length; i++) {
				const c = html[i];
				if (c === ' ' || c === '\t' || c === '\r' || c === '\n' || c === '=' || c === ':') continue;
				if (c === '[') {
					openIdx = i;
					openChar = '[';
					closeChar = ']';
					isValid = true;
					break;
				}
				if (c === '{') {
					openIdx = i;
					openChar = '{';
					closeChar = '}';
					isValid = true;
					break;
				}
				// Invalid char -> not this one
				break;
			}

			if (!isValid) {
				startPos = startIdx + 1;
				continue;
			}

			// Found valid start, now find end
			let balance = 1;
			let closeIdx = -1;
			let inString = false;
			let stringChar = '';
			let escape = false;

			for (let i = openIdx + 1; i < html.length; i++) {
				const c = html[i];

				if (escape) {
					escape = false;
					continue;
				}

				if (c === '\\') {
					escape = true;
					continue;
				}

				if (inString) {
					if (c === stringChar) inString = false;
					continue;
				}

				if (c === '"' || c === "'" || c === '`') {
					inString = true;
					stringChar = c;
					continue;
				}

				if (c === openChar) {
					balance++;
				} else if (c === closeChar) {
					balance--;
					if (balance === 0) {
						closeIdx = i;
						break;
					}
				}
			}

			if (closeIdx !== -1) {
				const before = html.slice(0, openIdx);
				const after = html.slice(closeIdx + 1);
				return `${before} <?php echo $__SK_DATA; ?>${after}`;
			}

			// If we got here, we found open but not close? Abort this match.
			startPos = startIdx + 1;
		}
	}

	return null;
}

/**
 * @param {object} options
 * @param {boolean} [options.ssr=true]
 * @param {string} [options.out="./build"]    build output
 * @param {string} [options.assets="./build"] client assets output
 * @param {boolean} [options.precompress=false]
 * @param {boolean} [options.strict=true]
 * @param {boolean} [options.fallback=false] if true, allow non-prerenderable routes (still limited)
 */
export default function sveltekitPhpAdapter({
	ssr = true,
	out = './build',
	assets = './build',
	precompress = false,
	fallback = false,
	strict = true
} = {}) {
	return {
		name: '@flexlex/sveltekit-php-adapter',
		async adapt(builder) {
			// Basic prerender safety (same spirit as adapter-static).
			// We *don’t* require a root +layout.server.js export; we just enforce reality:
			// if you don’t prerender and don’t provide a fallback/router, you don’t have files to serve.
			if (!fallback && strict !== false) {
				const dynamic = builder.routes.filter((r) => r.prerender !== true);
				if (dynamic.length) {
					const prefix = path.relative('.', builder.config.kit.files.routes);
					builder.log.error(
						[
							'All routes must be prerenderable for this adapter output.',
							'Found non-prerenderable routes:',
							...dynamic.map((r) => `- ${path.posix.join(prefix, r.id)}`),
							'Fix: set prerender per-route, or configure SvelteKit prerender entries appropriately, or implement a fallback strategy.'
						].join('\n')
					);
					throw new Error('Encountered non-prerenderable routes');
				}
			}

			const outDir = path.resolve(out);
			const assetsDir = path.resolve(assets);
			const tmpDir = builder.getBuildDirectory('sveltekit-php');

			builder.log.minor('Cleaning output/temp');
			builder.rimraf(outDir);
			builder.rimraf(assetsDir);
			builder.rimraf(tmpDir);

			builder.mkdirp(outDir);
			builder.mkdirp(assetsDir);
			builder.mkdirp(tmpDir);

			// 1) Client assets
			builder.log.minor('Writing client assets');
			const writtenClientFiles = builder.writeClient(assetsDir);

			// Patch client to request __data.php instead of __data.json
			if (ssr) {
				const startCandidates = writtenClientFiles.filter((p) => /entry\/start.*\.js$/.test(posixify(p)));
				for (const startFileRel of startCandidates) {
					const startFilePath = path.join(assetsDir, startFileRel);
					let startFile = await readFile(startFilePath, 'utf8');
					startFile = startFile.replaceAll('__data.json', '__data.php');
					await writeFile(startFilePath, startFile, 'utf8');
					builder.log.minor(`Patched client data endpoint: ${startFilePath}`);
				}
			}

			// 2) Prerendered output
			builder.log.minor('Prerendering pages');
			const prerenderedRoot = path.join(tmpDir, 'prerendered');
			builder.writePrerendered(prerenderedRoot);

			// 3) Discover PHP server files in src/routes
			const routesBaseFs = path.resolve(builder.config.kit.files.routes);
			const routesBasePosix = posixify(routesBaseFs);

			const allServerPhpFs = await glob('**/+*.server.php', { cwd: routesBaseFs, absolute: true });
			console.log('Found PHP files:', allServerPhpFs);
			const allServerRelPosix = new Set(
				allServerPhpFs.map(posixify).map((abs) => {
					const rel = abs.startsWith(routesBasePosix) ? abs.slice(routesBasePosix.length) : abs;
					return rel.startsWith('/') ? rel : `/${rel}`;
				})
			);

			// Map: "/foo/+page.server.php" -> "/_protected/foo_page.php"
			const protectedMap = new Map();
			const fnPrefixMap = new Map();

			for (const rel of allServerRelPosix) {
				const prefix = fnPrefixForServerFile(rel);
				fnPrefixMap.set(rel, prefix);

				const protectedRel =
					'/_protected/' +
					rel
						.replace(/^\//, '')
						.replace(/\//g, '__')
						.replace(/\+layout\.server\.php$/i, '_layout.php')
						.replace(/\+page\.server\.php$/i, '_page.php')
						.replace(/\.server\.php$/i, '.php');

				protectedMap.set(rel, protectedRel);
			}

			const usedServerFiles = new Set();

			// Helper: build deps for a route
			function depsForRoute(routeIdPosix) {
				const deps = [];

				const chain = buildLayoutChainCandidates(routeIdPosix); // ["(app)/dashboard", "(app)", ""]
				for (const seg of chain.reverse()) {
					// walk root -> leaf for layout order
					const base = seg ? `/${seg}` : '';
					const layoutStd = `${base}/+layout.server.php`;
					// best-effort support layout reset naming variants (not perfect, but better than “lol no”)
					const layoutResetA = `${base}/+layout@.server.php`;
					const layoutResetB = `${base}/+layout.server@.php`;

					if (allServerRelPosix.has(layoutResetA)) {
						deps.push(layoutResetA);
						// reset: stop including ancestors above this point
						break;
					}
					if (allServerRelPosix.has(layoutResetB)) {
						deps.push(layoutResetB);
						break;
					}
					if (allServerRelPosix.has(layoutStd)) deps.push(layoutStd);
				}

				// page server
				const rid = stripLeadingSlash(routeIdPosix);
				const pageStd = `/${rid ? `${rid}/` : ''}+page.server.php`;
				const pageResetA = `/${rid ? `${rid}/` : ''}+page@.server.php`;
				const pageResetB = `/${rid ? `${rid}/` : ''}+page.server@.php`;

				if (allServerRelPosix.has(pageStd)) deps.push(pageStd);
				else if (allServerRelPosix.has(pageResetA)) deps.push(pageResetA);
				else if (allServerRelPosix.has(pageResetB)) deps.push(pageResetB);

				return deps;
			}

			// 4) For each prerendered page, generate runtime files + convert HTML->PHP
			for (const [navPathRaw, filePath] of builder.prerendered.pages) {
				const navPath = navPathRaw; // e.g. "/about/"
				builder.log.minor(`Preparing PHP route: ${navPath}`);

				const route = findRouteForNavPath(builder, navPath);
				const routeId = route?.id ?? navPath; // fallback: best-effort

				const deps = depsForRoute(routeId);
				for (const d of deps) usedServerFiles.add(d);

				// Find the directory where the page was written
				const htmlFs = path.join(prerenderedRoot, filePath.file);
				const htmlDir = path.dirname(htmlFs);

				// Locate __data.json template near the HTML.
				const templateJsonFs = path.join(htmlDir, '__data.json');
				if (!(await exists(templateJsonFs))) {
					// Some layouts may produce slightly different paths; try nav-path based.
					const altDir = path.join(prerenderedRoot, stripLeadingSlash(navPath), ''); // "/a/b/" -> ".../a/b/"
					const altTemplate = path.join(altDir, '__data.json');
					if (await exists(altTemplate)) {
						// eslint-disable-next-line no-unused-vars
					} else {
						builder.log.warn(`Missing __data.json next to ${htmlFs}. Data injection will likely fail.`);
					}
				}

				let html = await readFile(htmlFs, 'utf8');
				const inlineMode = detectInlineDataModeFromHtml(html); // "nodes" | "payload" | "unknown"

				// Read template json (if present)
				let templateJson = '{}';
				let nodeCount = 0;
				if (await exists(templateJsonFs)) {
					templateJson = await readFile(templateJsonFs, 'utf8');
					try {
						const payload = JSON.parse(templateJson);
						if (payload.nodes) nodeCount = payload.nodes.length;
					} catch { }
				}

				// Fallback: detect node count from HTML if not found in JSON
				if (nodeCount === 0) {
					const nodeIdsMatch = html.match(/node_ids:\s*\[([\d,\s]+)\]/);
					if (nodeIdsMatch) {
						const ids = nodeIdsMatch[1].split(',').filter(s => s.trim() !== '');
						nodeCount = ids.length;
						console.log(`Detected ${nodeCount} nodes from HTML node_ids for ${navPath}`);
					}
				}

				// Final fallback: assume 2 nodes (layout + page) if we still don't know
				if (nodeCount === 0) {
					nodeCount = 2;
				}

				// Generate __data.php and __action.php in the same directory as the page
				const relToRoot = phpRelToRootFromNav(navPath); // "./../.." style
				const includes = deps
					.map((d) => {
						const protectedRel = protectedMap.get(d);
						return protectedRel
							? `require_once __DIR__ . '/${relToRoot}${protectedRel.replace(/^\//, '')}';`
							: '';
					})
					.filter(Boolean);

				// Construct load map: [ index => function_name ]
				const loadMap = [];
				for (const d of deps) {
					const prefix = fnPrefixMap.get(d);
					if (!prefix) continue;
					const fnName = `${prefix}_load`;

					if (d.endsWith('page.server.php')) {
						// Page always targets the last node
						loadMap.push(`'${nodeCount - 1}' => '${fnName}'`);
					} else if (d.endsWith('layout.server.php')) {
						// Root layout targets 0. Others we skip for now or try to guess.
						// If we are at root, and d is root layout, index 0.
						if (d === '/+layout.server.php' || d === '+layout.server.php') {
							loadMap.push(`'0' => '${fnName}'`);
						}
					}
				}

				const loadFnsPhp = `[${loadMap.join(', ')}]`;

				const pageDep = deps.find((d) => d.includes('+page.server'));
				const pagePrefix = pageDep ? fnPrefixMap.get(pageDep) : null;

				const dataPhp = `<?php
/**
 * Generated by sveltekit-php adapter
 * - Serves /__data.php requests (client navigation + invalidations)
 * - Provides sk_build_embed_data() for index.php hydration
 *
 * Template shape comes from prerendered __data.json (so it matches your Kit version).
 */

declare(strict_types=1);

${includes.join('\n')}

final class __SK_Deferred {
	public function __construct(public $fn) {}
}
function sk_defer(callable $fn): __SK_Deferred { return new __SK_Deferred($fn); }

/**
 * Locates the "nodes" array within the template payload.
 * Supports:
 *   A) { "type":"data", "nodes":[ ... ] }
 *   B) devalue-like: [ { "type":1, "nodes":2 }, ..., <nodes at index 2>, ... ]
 */
function sk_get_nodes_ref(array &$payload): array {
	// A) associative with nodes
	if (array_key_exists('nodes', $payload) && is_array($payload['nodes'])) {
		return ['kind' => 'assoc', 'key' => 'nodes'];
	}

	// B) packed array with header object at 0
	if (isset($payload[0]) && is_array($payload[0]) && array_key_exists('nodes', $payload[0]) && is_int($payload[0]['nodes'])) {
		$idx = $payload[0]['nodes'];
		if (isset($payload[$idx]) && is_array($payload[$idx])) {
			return ['kind' => 'index', 'idx' => $idx];
		}
	}

	// fallback: treat as already nodes
	return ['kind' => 'self'];
}

function sk_set_node_data(array &$node, mixed $server_data): void {
	// If existing node.data is an array, we treat [0] as the "server" slot (best-effort).
	if (array_key_exists('data', $node)) {
		if (is_array($node['data'])) {
			if (count($node['data']) === 0) $node['data'] = [$server_data];
			else $node['data'][0] = $server_data;
			return;
		}
		$node['data'] = $server_data;
		return;
	}

	$node['type'] = $node['type'] ?? 'data';
	$node['data'] = $server_data;
	$node['uses'] = $node['uses'] ?? (object)[];
}

function sk_apply_loads(string $routeid, array $loadFns, array &$payload, string $inline_mode): array {
	$base = [];
	$server_results = [];
	$deferred = []; // [id => callable]
	$next_chunk_id = 1;

	foreach ($loadFns as $i => $fn) {
		if (!function_exists($fn)) {
			continue;
		}
		$res = $fn([
			'routeid' => $routeid,
			'parentdata' => $base,
			'method' => $_SERVER['REQUEST_METHOD'] ?? 'GET',
			'query' => $_GET,
			'server' => $_SERVER
		]);

		if ($res === null) {
			continue;
		}

		// Streaming support: values wrapped in sk_defer(fn) become chunk references
		if (is_array($res)) {
			$res2 = $res;
			array_walk_recursive($res2, function (&$v) use (&$deferred, &$next_chunk_id) {
				if ($v instanceof __SK_Deferred) {
					$id = $next_chunk_id++;
					$deferred[$id] = $v->fn;
					$v = $id; // placeholder id
				}
			});
			$res = $res2;
		}

		$server_results[$i] = $res;

		if (is_array($res)) {
			foreach ($res as $k => $v) $base[$k] = $v;
		}
	}

	// Patch nodes
	$nodesRef = sk_get_nodes_ref($payload);

	$nodes = null;
	if ($nodesRef['kind'] === 'assoc') $nodes = &$payload[$nodesRef['key']];
	else if ($nodesRef['kind'] === 'index') $nodes = &$payload[$nodesRef['idx']];
	else $nodes = &$payload;

	foreach ($server_results as $i => $res) {
		// ensure enough nodes exist
		while (count($nodes) <= $i) {
			$nodes[] = null;
		}

		if ($nodes[$i] === null) {
			$nodes[$i] = ['type' => 'data', 'data' => null, 'uses' => (object)[]];
		}

		if (is_array($nodes[$i])) {
			sk_set_node_data($nodes[$i], $res);
		}
	}

	return ['deferred' => $deferred];
}

/**
 * Build the "data" value embedded into index.php.
 * If the HTML had \`const data = [...]\`, we return nodes; if it had \`{ ... }\`, we return payload.
 */
function sk_build_embed_data(string $routeid, array $loadFns, string $template_json, string $inline_mode): string {
	$payload = json_decode($template_json, true);
	if (!is_array($payload)) $payload = [];

	sk_apply_loads($routeid, $loadFns, $payload, $inline_mode);

	if ($inline_mode === 'nodes') {
		$nodesRef = sk_get_nodes_ref($payload);
		$nodes = null;
		if ($nodesRef['kind'] === 'assoc') $nodes = $payload[$nodesRef['key']];
		else if ($nodesRef['kind'] === 'index') $nodes = $payload[$nodesRef['idx']];
		else $nodes = $payload;

		return json_encode($nodes, JSON_UNESCAPED_SLASHES);
	}

	return json_encode($payload, JSON_UNESCAPED_SLASHES);
}

function sk_handle_data_request(string $routeid, array $loadFns, string $template_json, string $inline_mode): void {
	$payload = json_decode($template_json, true);
	if (!is_array($payload)) $payload = [];

	$meta = sk_apply_loads($routeid, $loadFns, $payload, $inline_mode);
	$deferred = $meta['deferred'];

	// If we have deferred chunks, stream in the documented format.
	// Otherwise, regular JSON response.
	if (count($deferred) > 0) {
		header('content-type: text/x-sveltekit-data');
		header('cache-control: no-store');

		echo json_encode($payload, JSON_UNESCAPED_SLASHES) . "\\n";
		@ob_flush(); @flush();

		foreach ($deferred as $id => $fn) {
			$value = $fn();
			$chunk = ['type' => 'chunk', 'id' => $id, 'data' => [$value]];
			echo json_encode($chunk, JSON_UNESCAPED_SLASHES) . "\\n";
			@ob_flush(); @flush();
		}
		return;
	}

	header('content-type: application/json');
	header('cache-control: no-store');
	echo json_encode($payload, JSON_UNESCAPED_SLASHES);
}

// If requested directly as /__data.php, serve data; if included from index.php, do nothing.
if (php_sapi_name() !== 'cli' && realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) {
	$routeid = ${JSON.stringify(navPath)};
	$template_json = <<<'JSON'
${templateJson}
JSON;

	$loadFns = ${loadFnsPhp};
	$inline_mode = ${JSON.stringify(inlineMode)};
	sk_handle_data_request($routeid, $loadFns, $template_json, $inline_mode);
}
?>`;

				const actionPhp = `<?php
/**
 * Generated by sveltekit-php adapter
 * - Handles POST form actions (enhanced + best-effort non-JS)
 */

declare(strict_types=1);

${includes.join('\n')}

final class __SK_Fail {
	public function __construct(public int $status, public array $data) {}
}
final class __SK_Redirect {
	public function __construct(public int $status, public string $location) {}
}

function sk_fail(int $status, array $data = []): __SK_Fail { return new __SK_Fail($status, $data); }
function sk_redirect(int $status, string $location): __SK_Redirect { return new __SK_Redirect($status, $location); }

function sk_header(string $name): ?string {
	$key = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
	return $_SERVER[$key] ?? null;
}

function sk_action_name(): string {
	$qs = $_SERVER['QUERY_STRING'] ?? '';
	// SvelteKit uses ?/actionName
	if (strlen($qs) > 0 && $qs[0] === '/') {
		$raw = substr($qs, 1);
		$raw = explode('&', $raw, 2)[0];
		$raw = trim($raw);
		return $raw !== '' ? $raw : 'default';
	}
	return 'default';
}

function sk_is_action_request(): bool {
	if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') return false;
	// Enhanced submissions include x-sveltekit-action and usually accept: application/json
	// but we also treat a ?/name POST as an action for progressive enhancement.
	$qs = $_SERVER['QUERY_STRING'] ?? '';
	return sk_header('x-sveltekit-action') === 'true' || (strlen($qs) > 0 && $qs[0] === '/');
}

function sk_action_param(string $routeid): array {
	return [
		'routeid' => $routeid,
		'method' => $_SERVER['REQUEST_METHOD'] ?? 'POST',
		'query' => $_GET,
		'post' => $_POST,
		'files' => $_FILES,
		'server' => $_SERVER
	];
}

function sk_send_action_json(string $type, int $status, mixed $data = null, ?string $location = null): void {
	header('cache-control: no-store');
	header('content-type: application/json');

	$out = ['type' => $type, 'status' => $status];

	if ($location !== null) $out['location'] = $location;

	// Match common SvelteKit behavior: data is a stringified payload
	// (client uses $app/forms deserialize/applyAction).
	if ($data !== null) {
		$out['data'] = json_encode([$data, $type === 'success'], JSON_UNESCAPED_SLASHES);
	}

	echo json_encode($out, JSON_UNESCAPED_SLASHES);
}

if (sk_is_action_request()) {
	$routeid = ${JSON.stringify(navPath)};
	$action = sk_action_name();
	$param = sk_action_param($routeid);

	$fn_base = ${JSON.stringify(pagePrefix ? `${pagePrefix}_action_` : '')};

	if ($fn_base === '') {
		// No +page.server.php, nothing to do
		http_response_code(404);
		exit;
	}

	$fn = $fn_base . $action;
	$fallback = $fn_base . 'default';

	$call = function_exists($fn) ? $fn : (function_exists($fallback) ? $fallback : null);

	if ($call === null) {
		http_response_code(404);
		exit;
	}

	$res = $call($param);

	// Enhanced?
	$accept = sk_header('accept') ?? '';
	$enhanced = (strpos($accept, 'application/json') !== false) || sk_header('x-sveltekit-action') === 'true';

	if ($res instanceof __SK_Redirect) {
		if ($enhanced) {
			sk_send_action_json('redirect', $res->status, null, $res->location);
			exit;
		}
		http_response_code($res->status);
		header('location: ' . $res->location);
		exit;
	}

	if ($res instanceof __SK_Fail) {
		if ($enhanced) {
			sk_send_action_json('failure', $res->status, $res->data, null);
			exit;
		}
		// Non-JS fallback: redirect back (best-effort)
		http_response_code(303);
		header('location: ' . strtok($_SERVER['REQUEST_URI'] ?? '/', '?'));
		exit;
	}

	// success
	if ($enhanced) {
		sk_send_action_json('success', 200, is_array($res) ? $res : ['ok' => true]);
		exit;
	}

	// Non-JS: PRG redirect back
	http_response_code(303);
	header('location: ' . strtok($_SERVER['REQUEST_URI'] ?? '/', '?'));
	exit;
}
?>`;

				// Generate __data.php and __action.php
				// If we are generating for a named file (e.g. test-js.html), we must put the data/action
				// files in a subdirectory (e.g. test-js/__data.php) to avoid overwriting the root __data.php.
				let dataDir = htmlDir;
				let requirePrefix = '';

				const htmlBasename = path.basename(htmlFs);
				const isIndex = htmlBasename === 'index.html' || htmlBasename === 'index.php';

				if (!isIndex) {
					const name = htmlBasename.replace(/\.(html|php)$/i, '');
					dataDir = path.join(htmlDir, name);
					builder.mkdirp(dataDir);
					requirePrefix = `/${name}`;
				}

				await writeFile(path.join(dataDir, '__data.php'), dataPhp, 'utf8');
				await writeFile(path.join(dataDir, '__action.php'), actionPhp, 'utf8');

				// Patch HTML to PHP (embed dynamic data into hydration payload)
				if (ssr) {
					const replaced = replaceInlineConstData(html);
					if (replaced) html = replaced;

					// Add include block at the very top
					// - __action.php may exit early for POST actions
					// - __data.php provides sk_build_embed_data() to generate $__SK_DATA
					const bootstrap = `<?php
require __DIR__ . '${requirePrefix}/__action.php';
require __DIR__ . '${requirePrefix}/__data.php';

$routeid = ${JSON.stringify(navPath)};
$template_json = <<<'JSON'
${templateJson}
JSON;

$__SK_DATA = sk_build_embed_data($routeid, ${loadFnsPhp}, $template_json, ${JSON.stringify(inlineMode)});
?>\n`;

					html = bootstrap + html;

					// Remove static __data.json to avoid serving stale data
					if (await exists(templateJsonFs)) {
						await rename(templateJsonFs, path.join(htmlDir, '__data.template.json'));
					}

					// rename .html -> .php
					if (htmlFs.endsWith('.html')) {
						const phpFs = htmlFs.replace(/\.html$/i, '.php');
						await writeFile(htmlFs, html, 'utf8');
						await rename(htmlFs, phpFs);
					} else {
						await writeFile(htmlFs, html, 'utf8');
					}
				}
			}

			// 5) Convert PHP server files into namespaced protected copies
			builder.log.minor('Converting PHP server files');
			const protectedRoot = path.join(prerenderedRoot, '_protected');
			builder.mkdirp(protectedRoot);

			const conversions = [];
			for (const relPosix of usedServerFiles) {
				const absFs = path.join(routesBaseFs, stripLeadingSlash(relPosix));
				const protectedRel = protectedMap.get(relPosix);
				const prefix = fnPrefixMap.get(relPosix);

				if (!protectedRel || !prefix) continue;

				const outFs = path.join(prerenderedRoot, protectedRel.replace(/^\//, ''));
				const outDir = path.dirname(outFs);
				builder.mkdirp(outDir);

				conversions.push(
					(async () => {
						let src = await readFile(absFs, 'utf8');

						// Namespace load()
						src = src.replace(/function\s+load\s*\(/m, `function ${prefix}_load(`);

						// Namespace action_*()
						src = src.replace(
							/function\s+action_([A-Za-z0-9_]+)\s*\(/g,
							(_, name) => `function ${prefix}_action_${name}(`
						);

						await writeFile(outFs, src, 'utf8');
					})()
				);
			}

			await Promise.all(conversions);

			// 6) Finalize build output
			builder.log.minor('Copying build to output');
			builder.copy(prerenderedRoot, outDir);

			if (precompress) {
				builder.log.minor('Precompressing');
				builder.compress(outDir);
			}

			builder.log.minor('Done');
		}
	};
}
