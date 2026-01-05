import path from 'node:path';
import glob from 'tiny-glob';
import { readFile, writeFile, rename } from 'node:fs/promises';
import { posixify, stripLeadingSlash, fnPrefixForServerFile, phpRelToRootFromNav } from './utils/paths.js';
import { findRouteForNavPath, buildLayoutChainCandidates } from './utils/routing.js';
import { detectInlineDataModeFromHtml, replaceInlineConstData } from './utils/html.js';
import { exists } from './utils/fs.js';
import { getDataPhp, getActionPhp, getBootstrapPhp, getMinimalBootstrapPhp, getApiPhp, getRouterPhp, getFooterPhp } from './runtime/php-templates.js';
import { getNodeHandlerMjs, getPhpProxy, getHtaccess, getStandaloneApiPhp } from './runtime/node-ssr-templates.js';
import type { AdapterOptions, Builder } from './types.js';

export default function sveltekitPhpAdapter(options: AdapterOptions = {}) {
	const {
		mode = 'php-static',
		ssr = true,
		out = './build',
		assets = './build',
		precompress = false,
		fallback = false,
		strict = true
	} = options;

	return {
		name: '@ryanspice/sveltekit-adapter-php',
		async adapt(builder: Builder) {
			const outDir = path.resolve(out);
			const assetsDir = path.resolve(assets);
			const tmpDir = builder.getBuildDirectory('sveltekit-php');

			builder.log.minor(`Adapting for mode: ${mode}`);
			builder.log.minor('Cleaning output/temp');
			builder.rimraf(outDir);
			builder.rimraf(assetsDir);
			builder.rimraf(tmpDir);

			builder.mkdirp(outDir);
			builder.mkdirp(assetsDir);
			builder.mkdirp(tmpDir);

			// 1) Client assets (Common)
			builder.log.minor('Writing client assets');
			const writtenClientFiles = builder.writeClient(assetsDir);

			// 2) Prerendered output (Common, but optional for node-ssr)
			builder.log.minor('Prerendering pages');
			const prerenderedRoot = path.join(tmpDir, 'prerendered');
			builder.writePrerendered(prerenderedRoot);

			// 3) Mode-specific logic
			if (mode === 'node-ssr') {
				// --- Mode B: Node SSR ---
				builder.log.minor('Generating Node SSR output');

				// Copy prerendered files to output root so they are served as static files
				// This ensures Apache/PHP serves them directly (performance) and handles negotiation logic.
				// Previously we copied to 'prerendered' subdir but that made them inaccessible to the router.
				builder.copy(prerenderedRoot, outDir);

				// Generate Server Bundle
				const serverDir = path.join(outDir, 'server');
				builder.mkdirp(serverDir);
				builder.writeServer(serverDir);

				// Generate Manifest
				// We need the manifest to be importable by handler.mjs which is in server/
				const manifest = builder.generateManifest({ relativePath: '.' }); // . because handler is in same dir as index.js
				await writeFile(path.join(serverDir, 'manifest.js'), `export const manifest = ${manifest};\n`);

				// Generate Handler
				const handler = getNodeHandlerMjs(builder.config.kit.paths.base);
				await writeFile(path.join(serverDir, 'handler.mjs'), handler);

				// Generate PHP Proxy
				// We default to port 3000, but it can be configured via env in the sidecar.
				// The PHP script needs to know where the sidecar is.
				// We'll hardcode localhost:3000 for now or make it configurable via a PHP config file?
				// Instructions: "Proxies requests to the sidecar (default http://127.0.0.1:3000)"
				const proxy = getPhpProxy('http://127.0.0.1:3000');
				await writeFile(path.join(outDir, 'index.php'), proxy);

				// Generate .htaccess
				const htaccess = getHtaccess('node-ssr', builder.config.kit.paths.base, precompress);
				await writeFile(path.join(outDir, '.htaccess'), htaccess.trim());

				// Copy PHP API endpoints (+server.php)
				// In Mode B, PHP is the entrypoint. We want +server.php to be served by PHP directly.
				// We map src/routes/path/to/+server.php -> out/path/to/index.php
				const routesBaseFs = path.resolve(builder.config.kit.files.routes);
				const phpApiFiles = await glob('**/+server.php', { cwd: routesBaseFs });

				for (const file of phpApiFiles) {
					// file is relative to routesBaseFs, e.g. 'api/cookie/+server.php'
					const routeDir = path.dirname(file); // 'api/cookie'
					const destDir = path.join(outDir, routeDir);
					const srcFile = path.join(routesBaseFs, file);

					builder.mkdirp(destDir);

					// Copy as _server.php (hidden)
					await builder.copy(srcFile, path.join(destDir, '_server.php'));

					// Check for sibling Page (to enable Content Negotiation in Node SSR mode)
					const siblingPageCandidates = [
						path.join(routesBaseFs, routeDir, '+page.svelte'),
						path.join(routesBaseFs, routeDir, '+page.js'),
						path.join(routesBaseFs, routeDir, '+page.ts'),
						path.join(routesBaseFs, routeDir, '+page.server.js'),
						path.join(routesBaseFs, routeDir, '+page.server.ts'),
					];

					let hasSiblingPage = false;
					for (const c of siblingPageCandidates) {
						if (await exists(c)) {
							hasSiblingPage = true;
							break;
						}
					}

					const relToRoot = path.relative(destDir, outDir).replace(/\\/g, '/');

					// Check if a conflicting prerendered HTML file exists at the parent level
					// e.g. build/negotiate.html when we are in build/negotiate/
					const possibleHtml = destDir + '.html';
					if (await exists(possibleHtml)) {
						builder.log.minor(`Moving conflicting prerendered file ${possibleHtml} to ${path.join(destDir, 'index.html')}`);
						await rename(possibleHtml, path.join(destDir, 'index.html'));
						hasSiblingPage = true; // Ensure negotiation logic is enabled
					}

					// Generate wrapper index.php
					const wrapper = getStandaloneApiPhp('_server.php', hasSiblingPage ? relToRoot : undefined);
					await writeFile(path.join(destDir, 'index.php'), wrapper);
				}

				// Copy package.json / shim if needed?
				// "handler.mjs (zero deps)" -> so we don't need package.json if we use built-in modules.
				// But the server bundle might have deps?
				// SvelteKit's writeServer produces a standalone bundle usually if we use the right options,
				// but typically it relies on dependencies being installed.
				// However, the prompt says "zero deps" for the handler.
				// We assume the user runs `node out/server/handler.mjs` in an environment where deps are available
				// OR the bundle is standalone.
				// Standard adapter-node produces an index.js that requires '0' (the app).
				// We'll assume the user will run this in the project root or similar.

				// Generate router.php for PHP built-in server (Proxy Mode)
				builder.log.minor('Generating router.php');
				const router = getRouterPhp(builder.config.kit.paths.base, 'node-ssr');
				await writeFile(path.join(outDir, 'router.php'), router, 'utf8');

			} else {
				// --- Mode A: PHP Static ---

				// 0) Discover PHP server files early for validation
				const routesBaseFs = path.resolve(builder.config.kit.files.routes);
				const routesBasePosix = posixify(routesBaseFs);

				const files1 = await glob('**/+*.server.php', { cwd: routesBaseFs, absolute: true });
				const files2 = await glob('**/+server.php', { cwd: routesBaseFs, absolute: true });
				const allServerPhpFs = [...files1, ...files2];
				const allServerRelPosix = new Set(
					allServerPhpFs.map(posixify).map((abs) => {
						const rel = abs.startsWith(routesBasePosix) ? abs.slice(routesBasePosix.length) : abs;
						return rel.startsWith('/') ? rel : '/' + rel;
					})
				);

				// Basic prerender safety
				if (!fallback && strict !== false) {
					const dynamic = builder.routes.filter((r) => r.prerender !== true);
					const trulyDynamic = dynamic.filter((r) => {
						const id = r.id.startsWith('/') ? r.id : '/' + r.id;
						const candidate = id + '/+server.php';
						if (allServerRelPosix.has(candidate)) return false;
						return true;
					});

					if (trulyDynamic.length) {
						const prefix = path.relative('.', builder.config.kit.files.routes);
						const errorLines = [
							'All routes must be prerenderable for this adapter output.',
							'Found non-prerenderable routes:'
						];
						trulyDynamic.forEach((r) => {
							errorLines.push('- ' + path.posix.join(prefix, r.id));
						});
						errorLines.push('Fix: set prerender per-route, or configure SvelteKit prerender entries appropriately, or implement a fallback strategy.');
						builder.log.error(errorLines.join('\n'));
						throw new Error('Encountered non-prerenderable routes');
					}
				}

				// Log what was actually prerendered for debugging
				builder.log.minor('Prerendered pages: ' + Array.from(builder.prerendered.pages.entries()).map(([k, v]) => k + ' -> ' + v.file).join(', '));

				// 3) Discover PHP server files (Already done at step 0)

				// Map: "/foo/+page.server.php" -> "/_protected/foo_page.php"
				const protectedMap = new Map<string, string>();
				const fnPrefixMap = new Map<string, string>();

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
							.replace(/\+server\.php$/i, '_server.php')
							.replace(/\.server\.php$/i, '.php');

					protectedMap.set(rel, protectedRel);
				}

				const usedServerFiles = new Set<string>();

				// Helper: build deps for a route
				function getRouteDeps(routeIdPosix: string) {
					const chain = buildLayoutChainCandidates(routeIdPosix); // ["(app)/dashboard", "(app)", ""]
					const activeSegments: string[] = [];
					let stop = false;

					// Walk Leaf -> Root to determine active hierarchy
					for (const seg of chain) {
						activeSegments.push(seg);

						const base = seg ? '/' + seg : '';
						const rid = stripLeadingSlash(seg);

						// Check for reset files (server files)
						// Note: Ideally we check .svelte too, but we only indexed .server.php
						// We'll rely on server files for now.

						const isPage = (seg === chain[0]);
						if (isPage) {
							// Check +page@.server.php
							const pageResetA = '/' + (rid ? rid + '/' : '') + '+page@.server.php';
							const pageResetB = '/' + (rid ? rid + '/' : '') + '+page.server@.php';
							if (allServerRelPosix.has(pageResetA) || allServerRelPosix.has(pageResetB)) {
								stop = true;
							}
						} else {
							// Check +layout@.server.php
							const layoutResetA = base + '/+layout@.server.php';
							const layoutResetB = base + '/+layout.server@.php';
							if (allServerRelPosix.has(layoutResetA) || allServerRelPosix.has(layoutResetB)) {
								stop = true;
							}
						}

						if (stop) break;
					}

					const hierarchy = activeSegments.reverse(); // Root -> Leaf
					const files: string[] = [];
					const loadMapItems: { index: number | 'PAGE'; fn: string }[] = [];

					hierarchy.forEach((seg, i) => {
						const base = seg ? '/' + seg : '';
						const rid = stripLeadingSlash(seg);
						const isLast = (i === hierarchy.length - 1);

						// Check Layout
						const layoutCandidates = [
							base + '/+layout.server.php',
							base + '/+layout@.server.php',
							base + '/+layout.server@.php'
						];
						const layoutFound = layoutCandidates.find(c => allServerRelPosix.has(c));
						if (layoutFound) {
							files.push(layoutFound);
							const prefix = fnPrefixMap.get(layoutFound);
							if (prefix) {
								loadMapItems.push({ index: i, fn: prefix + '_load' });
							}
						}

						// Check Page (only if last segment)
						if (isLast) {
							const pageCandidates = [
								'/' + (rid ? rid + '/' : '') + '+page.server.php',
								'/' + (rid ? rid + '/' : '') + '+page@.server.php',
								'/' + (rid ? rid + '/' : '') + '+page.server@.php'
							];
							const pageFound = pageCandidates.find(c => allServerRelPosix.has(c));
							if (pageFound) {
								files.push(pageFound);
								const prefix = fnPrefixMap.get(pageFound);
								if (prefix) {
									loadMapItems.push({ index: 'PAGE', fn: prefix + '_load' });
								}
							}
						}
					});

					return { files, loadMapItems };
				}

				// 4) For each prerendered page, generate runtime files + convert HTML->PHP
				for (const [navPathRaw, filePath] of builder.prerendered.pages) {
					const navPath = navPathRaw; // e.g. "/about/"
					builder.log.minor('Preparing PHP route: ' + navPath);

					// Adjust navPath for route matching if base path is present.
					let routePath = navPath;
					const basePath = builder.config.kit.paths.base;
					if (basePath && routePath.startsWith(basePath)) {
						routePath = routePath.slice(basePath.length);
						if (!routePath.startsWith('/')) routePath = '/' + routePath;
					}

					const route = findRouteForNavPath(builder, routePath);
					const routeId = route?.id ?? routePath; // fallback: best-effort

					// DEBUG: Inspect route object for SSR flag
					if (navPath.includes('matrix')) {
						console.log(`DEBUG: Route for ${navPath}:`, JSON.stringify(route, null, 2));
					}

					const { files: deps, loadMapItems } = getRouteDeps(routeId);
					for (const d of deps) usedServerFiles.add(d);

					// Find the directory where the page was written
					const htmlFs = path.join(prerenderedRoot, filePath.file);
					const htmlDir = path.dirname(htmlFs);

					// Check if HTML file exists before processing
					if (!(await exists(htmlFs))) {
						builder.log.warn('HTML file not found: ' + htmlFs + '. Skipping route.');
						continue;
					}

					// Locate __data.json template near the HTML.
					// Search strategy:
					// 1. Sibling of the HTML file (standard)
					// 2. Subdirectory matching navPath (common for named pages in some Kit versions)
					// 3. Child directory if HTML is named (e.g. about.html -> about/__data.json)

					const candidates = [
						path.join(htmlDir, '__data.json'),
						path.join(prerenderedRoot, stripLeadingSlash(navPath), '__data.json')
					];

					// If htmlFs is like "about.html", try "about/__data.json"
					if (!htmlFs.endsWith('index.html') && htmlFs.endsWith('.html')) {
						const baseName = path.basename(htmlFs, '.html');
						candidates.push(path.join(htmlDir, baseName, '__data.json'));
					}

					let html = await readFile(htmlFs, 'utf8');
					const inlineMode = detectInlineDataModeFromHtml(html);

					let templateJsonFs: string | null = null;
					let templateJson = '{"type":"data","nodes":[]}';
					let nodeCount = 0;

					for (const c of candidates) {
						if (await exists(c)) {
							templateJsonFs = c;
							break;
						}
					}

					if (templateJsonFs) {
						// Case A: SvelteKit generated a __data.json (dynamic/SSR route)
						templateJson = await readFile(templateJsonFs, 'utf8');
						try {
							const parsed = JSON.parse(templateJson);
							if (Array.isArray(parsed.nodes)) {
								nodeCount = parsed.nodes.length;
							}
						} catch (e) {
							// Check for streaming JSON (newline delimited)
							if (templateJson.includes('\n')) {
								const firstLine = templateJson.split('\n')[0];
								try {
									const parsed = JSON.parse(firstLine);
									if (Array.isArray(parsed.nodes)) {
										nodeCount = parsed.nodes.length;
										templateJson = firstLine; // Use only the first line as template
										builder.log.minor(`Detected streaming JSON for ${templateJsonFs}, using first line as template.`);
									}
								} catch (e2) {
									builder.log.warn(`Failed to parse first line of ${templateJsonFs}: ${e2}`);
								}
							} else {
								builder.log.warn(`Failed to parse ${templateJsonFs}: ${e}`);
							}
						}
					} else {
						// Case B: Static route (no __data.json). Synthesize one for the PHP runtime.
						// We need to know how many nodes to put in the array so the runtime doesn't crash.
						// We can parse the "node_ids" from the HTML to infer the count.
						const nodeIdsMatch = html.match(/node_ids:\s*\[([\d,\s]+)\]/);
						if (nodeIdsMatch) {
							const ids = nodeIdsMatch[1].split(',').filter(s => s.trim() !== '');
							nodeCount = ids.length;
						} else {
							nodeCount = 2; // Fallback: Layout + Page
						}

						// Synthesize a template with null nodes (or minimal objects)
						// User requested: "cleaner and closer to Kit if you synthesize: nodes: [null, null, ...]"
						const nodes = new Array(nodeCount).fill(null);
						const synthTemplate = { type: 'data', nodes };
						templateJson = JSON.stringify(synthTemplate);

						// Write it to disk as __data.template.json immediately
						// This ensures the PHP runtime finds it at runtime.
						const synthPath = path.join(htmlDir, '__data.template.json');
						await writeFile(synthPath, templateJson);

						// We don't set templateJsonFs to this path to avoid renaming it later
						// (the rename logic checks if templateJsonFs exists and renames it)
					}

					// Fallback: detect node count from HTML if not found in JSON (should not happen if we found JSON)
					if (nodeCount === 0) {
						const nodeIdsMatch = html.match(/node_ids:\s*\[([\d,\s]+)\]/);
						if (nodeIdsMatch) {
							const ids = nodeIdsMatch[1].split(',').filter(s => s.trim() !== '');
							nodeCount = ids.length;
							// console.log('Detected ' + nodeCount + ' nodes from HTML node_ids for ' + navPath);
						}
					}

					// Final fallback: assume 2 nodes (layout + page) if we still don't know
					if (nodeCount === 0) {
						nodeCount = 2;
					}

					// Adjust navPath for filesystem depth calculation if base path is present.
					// SvelteKit's builder.writePrerendered() seems to output files relative to the destination
					// without nesting them under the base path directory (unlike the URL structure).
					// So if base is /sveltekit-php, the URL is /sveltekit-php/, but the file is at root /index.html.
					let fsPath = navPath;
					const base = builder.config.kit.paths.base;
					if (base && fsPath.startsWith(base)) {
						fsPath = fsPath.slice(base.length);
						if (!fsPath.startsWith('/')) fsPath = '/' + fsPath;
					}

					const relToRoot = phpRelToRootFromNav(fsPath);
					const includes = deps
						.map((d) => {
							const protectedRel = protectedMap.get(d);
							return protectedRel
								? 'require_once __DIR__ . \'/' + relToRoot + protectedRel.replace(/^\//, '') + '\';'
								: '';
						})
						.filter(Boolean);

					// Use the load map we generated earlier
					const loadMapStrings = loadMapItems.map(item => {
						let idx = item.index;
						if (idx === 'PAGE') {
							idx = nodeCount - 1;
						}
						return `'${idx}' => '${item.fn}'`;
					});
					const loadFnsPhp = '[' + loadMapStrings.join(', ') + ']';

					const pageDep = deps.find((d) => d.includes('+page.server'));
					const pagePrefix = pageDep ? fnPrefixMap.get(pageDep) : null;

					// Generate PHP content
					const dataPhp = getDataPhp(includes, builder.config.kit.paths.base)
						.replace('PLACEHOLDER_ROUTE_ID', JSON.stringify(navPath))
						.replace('PLACEHOLDER_TEMPLATE_JSON', templateJson)
						.replace('PLACEHOLDER_LOAD_FNS', loadFnsPhp)
						.replace('PLACEHOLDER_INLINE_MODE', JSON.stringify(inlineMode));

					const actionPhp = getActionPhp(includes, navPath, pagePrefix ?? null);

					// Write __data.php and __action.php
					// Subdirectory logic for named files
					let dataDir = htmlDir;
					let requirePrefix = '';

					const htmlBasename = path.basename(htmlFs);
					const isIndex = htmlBasename === 'index.html' || htmlBasename === 'index.php';

					if (!isIndex) {
						const name = htmlBasename.replace(/\.(html|php)$/i, '');
						dataDir = path.join(htmlDir, name);
						builder.mkdirp(dataDir);
						requirePrefix = '/' + name;
					}

					await writeFile(path.join(dataDir, '__data.php'), dataPhp, 'utf8');
					await writeFile(path.join(dataDir, '__action.php'), actionPhp, 'utf8');

					// Patch HTML to PHP
					if (ssr) {
						// Detect if the page has inline data (meaning it was SSR'd with data)
						const replaced = replaceInlineConstData(html);

						if (replaced) {
							// Detect how data is inlined (SvelteKit 1.0 vs 2.0 styles vary, plus `inlineBody` option)
							const inlineMode = detectInlineDataModeFromHtml(html); // 'nodes' | 'payload' | 'unknown'

							html = replaced;

							// Detect SvelteKit app hash for streaming support
							const appHashMatch = html.match(/__sveltekit_(\w+)/);
							const appHash = appHashMatch ? `__sveltekit_${appHashMatch[1]}` : '__sveltekit_unknown';
							const bootstrap = getBootstrapPhp(navPath, loadFnsPhp, templateJson, inlineMode, requirePrefix)
								.replace('PLACEHOLDER_APP_ID', appHash);
							const footer = getFooterPhp(appHash);

							html = bootstrap + html + footer;
						} else {
							// SSR off (or no data): inject minimal bootstrap (actions only), no data embedding
							const bootstrap = getMinimalBootstrapPhp(requirePrefix);
							html = bootstrap + html;
						}

						// Remove static __data.json if it exists (using the one we found)
						if (templateJsonFs && await exists(templateJsonFs)) {
							await rename(templateJsonFs, path.join(path.dirname(templateJsonFs), '__data.template.json'));
						}

						// rename .html -> .php
						// IMPORTANT: check if file still exists before renaming to avoid race conditions or double-renaming
						if (await exists(htmlFs)) {
							if (htmlFs.endsWith('.html')) {
								const phpFs = htmlFs.replace(/\.html$/i, '.php');
								await writeFile(htmlFs, html, 'utf8');
								await rename(htmlFs, phpFs);
							} else {
								await writeFile(htmlFs, html, 'utf8');
							}
						}
					} else {
						// Fallback for SPA mode (ssr=false):
						if (await exists(htmlFs) && htmlFs.endsWith('.html')) {
							const phpFs = htmlFs.replace(/\.html$/i, '.php');
							await rename(htmlFs, phpFs);
						}
					}
				}

				// 4.5) Handle API endpoints (+server.php)
				builder.log.minor('Generating API endpoints');
				for (const relPosix of allServerRelPosix) {
					if (relPosix.endsWith('+server.php')) {
						const routeDir = path.dirname(relPosix);
						const prefix = fnPrefixMap.get(relPosix);
						const protectedRel = protectedMap.get(relPosix);

						if (!prefix || !protectedRel) continue;

						usedServerFiles.add(relPosix);

						const outDir = path.join(prerenderedRoot, stripLeadingSlash(routeDir));
						builder.mkdirp(outDir);

						const relToRoot = phpRelToRootFromNav(routeDir + '/');
						const include = 'require_once __DIR__ . \'/' + relToRoot + protectedRel.replace(/^\//, '') + '\';';

						const apiPhp = getApiPhp([include], prefix);
						const indexPhp = path.join(outDir, 'index.php');

						// Check for collision with index.php OR sibling .php (e.g. about.php)
						let pageFile = null;
						if (await exists(indexPhp)) {
							pageFile = indexPhp;
						} else if (stripLeadingSlash(routeDir) !== '' && stripLeadingSlash(routeDir) !== '.') {
							// Check if there is a sibling file with the same name as the directory + .php
							// e.g. prerendered/negotiate.php
							// outDir is prerendered/negotiate
							const siblingPhp = outDir + '.php';
							if (await exists(siblingPhp)) {
								pageFile = siblingPhp;
							}
						}

						builder.log.minor(`Checking for collision at ${indexPhp} or sibling`);
						if (pageFile) {
							builder.log.minor(`Collision found at ${pageFile}`);
							// Collision with prerendered page! Implement content negotiation.

							// 1. Rename existing page to _page.php
							// If we are moving a sibling file (e.g. negotiate.php -> negotiate/_page.php),
							// we need to adjust the relative paths in the PHP file because depth changed.
							if (pageFile === indexPhp) {
								await rename(pageFile, path.join(outDir, '_page.php'));
							} else {
								// Moving sibling file into directory (depth +1)
								let content = await readFile(pageFile, 'utf8');
								// Adjust require_once paths to account for deeper location
								content = content.replace(/require_once __DIR__ \. '\//g, "require_once __DIR__ . '/../");

								await writeFile(path.join(outDir, '_page.php'), content, 'utf8');
								// Remove the original file
								await builder.rimraf(pageFile);
							}

							// 2. Write API dispatch logic to _server_dispatch.php
							await writeFile(path.join(outDir, '_server_dispatch.php'), apiPhp, 'utf8');

							// 3. Create new index.php that negotiates
							const negotiationPhp = `<?php
// SvelteKit-style Content Negotiation
// Generated by @ryanspice/sveltekit-adapter-php

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$accept = $_SERVER['HTTP_ACCEPT'] ?? '';

// 1. Method Precedence
// SvelteKit rules: PUT/PATCH/DELETE/OPTIONS -> always +server
if (in_array($method, ['PUT', 'PATCH', 'DELETE', 'OPTIONS'])) {
    require __DIR__ . '/_server_dispatch.php';
    return;
}

// 2. Accept Header Negotiation (for GET/POST/HEAD)
// Always set Vary: Accept so CDNs/proxies cache HTML vs JSON separately
header('Vary: Accept');

function sk_prefers_html($accept) {
    if (trim($accept) === '' || trim($accept) === '*/*') return false;

    $types = explode(',', $accept);
    $htmlQ = 0.0;
    $jsonQ = 0.0;

    foreach ($types as $type) {
        $parts = explode(';', $type);
        $mime = trim($parts[0]);
        $q = 1.0;

        for ($i = 1; $i < count($parts); $i++) {
            $part = trim($parts[$i]);
            if (str_starts_with($part, 'q=')) {
                $q = (float)substr($part, 2);
            }
        }

        if ($mime === 'text/html' || $mime === 'application/xhtml+xml') {
            $htmlQ = max($htmlQ, $q);
        } elseif ($mime === 'application/json') {
            $jsonQ = max($jsonQ, $q);
        }
    }

    return $htmlQ > $jsonQ;
}

if (sk_prefers_html($accept)) {
    require __DIR__ . '/_page.php';
} else {
    require __DIR__ . '/_server_dispatch.php';
}
?>`;
							await writeFile(indexPhp, negotiationPhp, 'utf8');
						} else {
							// No collision, just write index.php
							await writeFile(indexPhp, apiPhp, 'utf8');
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
							src = src.replace(/function\s+load\s*\(/m, 'function ' + prefix + '_load(');
							src = src.replace(
								/function\s+action_([A-Za-z0-9_]+)\s*\(/g,
								(_, name) => 'function ' + prefix + '_action_' + name + '('
							);
							src = src.replace(
								/function\s+(GET|POST|PUT|DELETE|PATCH|OPTIONS|HEAD)\s*\(/g,
								(_, name) => 'function ' + prefix + '_' + name + '('
							);
							await writeFile(outFs, src, 'utf8');
						})()
					);
				}

				await Promise.all(conversions);

				// 7) Finalize build output
				builder.log.minor('Copying build to output');
				builder.copy(prerenderedRoot, outDir);

				// 7) Generate .htaccess for Apache rewrites
				builder.log.minor('Generating .htaccess');
				const htaccess = getHtaccess('php-static', builder.config.kit.paths.base, precompress);
				await writeFile(path.join(outDir, '.htaccess'), htaccess.trim(), 'utf8');

				// 8) Generate router.php for PHP built-in server
				builder.log.minor('Generating router.php');
				const router = getRouterPhp(builder.config.kit.paths.base, 'php-static');
				await writeFile(path.join(outDir, 'router.php'), router, 'utf8');
			}

			if (precompress) {
				builder.log.minor('Compressing assets');
				await builder.compress(outDir);
			}

			builder.log.minor('Done');
		}
	};
}
