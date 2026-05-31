import path from 'node:path';
import { fileURLToPath } from 'node:url';
import glob from 'tiny-glob';
import { readFile, writeFile, rename, stat } from 'node:fs/promises';
import {
	posixify,
	stripLeadingSlash,
	fnPrefixForServerFile,
	phpRelToRootFromNav,
	phpArrayString
} from './utils/paths.js';
import {
	findRouteForNavPath,
	buildLayoutChainCandidates,
	compilePhpRouteMatcher,
	generateRouteManifest,
	readTrailingSlashFromRoute,
	type RouteManifestEntry
} from './utils/routing.js';
import { detectInlineDataModeFromHtml, replaceInlineConstData } from './utils/html.js';
import { exists } from './utils/fs.js';
import {
	getDataPhp,
	getActionPhp,
	getBootstrapPhp,
	getMinimalBootstrapPhp,
	getApiPhp,
	getRouterPhp,
	getFooterPhp
} from './runtime/php-templates.js';
import { getNodeHandlerMjs, getPhpProxy, getStandaloneApiPhp } from './runtime/js-ssr-templates.js';
import { getHtaccess } from './runtime/htaccess-templates.js';
import type { AdapterMode, AdapterOptions, Builder } from './types.js';

export default function sveltekitPhpAdapter(options: AdapterOptions = {}) {
	const {
		ssr = true,
		out = './build',
		assets = './build',
		precompress = false,
		fallback = false,
		strict = true,
		baseMode = 'fixed'
	} = options;
	const mode: AdapterMode = options.mode ?? 'php-static';
	const debugEnabled = process.env.ADAPTER_DEBUG === 'true' || process.env.SK_DEBUG === 'true';

	return {
		name: '@ryanspice/sveltekit-adapter-php',
		async adapt(builder: Builder) {
			const debug = (...args: unknown[]) => {
				if (debugEnabled) console.log(...args);
			};
			const debugMinor = (message: string) => {
				if (debugEnabled) builder.log.minor(message);
			};
			if (debugEnabled) {
				await writeFile('adapter_debug.log', JSON.stringify(options, null, 2));
			}
			const outDir = path.resolve(out);
			const assetsDir = path.resolve(assets);
			const tmpDir = builder.getBuildDirectory('sveltekit-php');
			const basePath =
				baseMode === 'fixed' ? (options.basePath ?? builder.config.kit.paths.base ?? '') : '';
			const routesBasePath = path.resolve(builder.config.kit.files.routes);
			const trailingSlash = (await readTrailingSlashFromRoute('/', routesBasePath)) ?? 'ignore';
			debug(`DEBUG: trailingSlash from root route: ${trailingSlash}`);
			const buildTimeBase = options.basePath ?? builder.config.kit.paths.base ?? '';
			const compatCandidates = [
				fileURLToPath(new URL('./runtime/php-compat.php', import.meta.url)),
				fileURLToPath(new URL('./src/runtime/php-compat.php', import.meta.url))
			];
			const compatSource = (await exists(compatCandidates[0]))
				? compatCandidates[0]
				: compatCandidates[1];
			const compatPhp = await readFile(compatSource, 'utf8');
			const assertPhp74Safe = (php: string, label: string) => {
				const banned: Array<[RegExp, string]> = [
					[/\b__construct\s*\(\s*(public|protected|private)\s+/i, 'constructor property promotion'],
					[/\(\s*mixed\s+\$/i, 'mixed type param'],
					[/:\\s*mixed\\b/i, 'mixed return type'],
					[/\bmatch\s*\(/i, 'match expression'],
					[/\?->/i, 'nullsafe operator'],
					[/\breadonly\b/i, 'readonly'],
					[/#\[/, 'attributes']
				];
				for (const [re, name] of banned) {
					if (re.test(php)) {
						throw new Error(`Generated PHP is not PHP 7.4-safe (${name}) in ${label}`);
					}
				}
			};
			const isDevProxyServerFile = async (abs: string) => {
				const code = await readFile(abs, 'utf8');
				return code.includes('getPhpData') && code.includes('php-dev');
			};
			const isFile = async (abs: string) => {
				try {
					return (await stat(abs)).isFile();
				} catch {
					return false;
				}
			};

			builder.log.minor(`Adapting for mode: ${mode}`);
			builder.log.minor('Cleaning output/temp');

			// Robust delete for Windows
			const robustRimraf = async (dir: string) => {
				try {
					// Retry logic or just simple rmSync with force
					// We import fs from 'node:fs/promises', but we need sync or standard fs for some ops?
					// builder.rimraf is likely sync or async? It returns void in types usually.
					// Let's use the one from 'node:fs/promises' if we imported it?
					// I imported { readFile, writeFile, rename } from 'node:fs/promises'.
					// I need 'rm' or 'rmdir'.
					// But I can import 'node:fs' dynamically.
					const fs = await import('node:fs');
					if (fs.existsSync(dir)) {
						try {
							fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
						} catch {
							// If ENOTEMPTY, try again after a short delay
							await new Promise((r) => setTimeout(r, 200));
							fs.rmSync(dir, { recursive: true, force: true });
						}
					}
				} catch (error) {
					builder.log.warn(`Failed to clean ${dir}: ${error}`);
				}
			};

			await robustRimraf(outDir);
			await robustRimraf(assetsDir);
			await robustRimraf(tmpDir);

			builder.mkdirp(outDir);
			builder.mkdirp(assetsDir);
			builder.mkdirp(tmpDir);

			// 1) Client assets (Common)
			builder.log.minor('Writing client assets');
			builder.writeClient(assetsDir);

			// In js-ssr mode, if assetsDir != outDir, we still need client assets in outDir
			// because the PHP entrypoint (or Apache) serves them from there.
			if (mode === 'js-ssr' && assetsDir !== outDir) {
				builder.log.minor('Copying client assets to outDir for js-ssr');
				builder.writeClient(outDir);
			}

			// 2) Prerendered output (Common, but optional for js-ssr)
			builder.log.minor('Prerendering pages');
			const prerenderedRoot = path.join(tmpDir, 'prerendered');
			builder.mkdirp(prerenderedRoot);
			builder.writePrerendered(prerenderedRoot);

			if (fallback) {
				const fallbackFile = typeof fallback === 'string' ? fallback : '200.html';
				builder.log.minor(`Generating fallback page: ${fallbackFile}`);
				const fallbackSrc = path.join(prerenderedRoot, fallbackFile);
				await builder.generateFallback(fallbackSrc);

				// Manually copy fallback file to outDir as it might not be in builder.prerendered.pages
				const fallbackDest = path.join(outDir, fallbackFile);
				await builder.copy(fallbackSrc, fallbackDest);
			}

			// Helper function to normalize server file paths
			const normalizeServerRel = (rel: string) => {
				if (rel.endsWith('/+page.server@.php'))
					return rel.replace('/+page.server@.php', '/+page@.server.php');
				if (rel.endsWith('/+layout.server@.php'))
					return rel.replace('/+layout.server@.php', '/+layout@.server.php');
				return rel;
			};

			// Discover all server files (for both modes)
			const routesBaseFs = path.resolve(builder.config.kit.files.routes);
			const routesBasePosix = posixify(routesBaseFs);

			// Discover PHP server files
			const phpServerFilesAll = await glob('**/+*.server.php', {
				cwd: routesBaseFs,
				absolute: true
			});
			const phpEndpointFilesAll = await glob('**/+server.php', {
				cwd: routesBaseFs,
				absolute: true
			});
			const allPhpRel = new Set(
				[...phpServerFilesAll, ...phpEndpointFilesAll].map(posixify).map((abs) => {
					const rel = abs.startsWith(routesBasePosix) ? abs.slice(routesBasePosix.length) : abs;
					return rel.startsWith('/') ? rel : '/' + rel;
				})
			);

			// Create normalized relative paths for all PHP server files (used by both modes)
			const allServerRelPosix = new Set(
				[...phpServerFilesAll, ...phpEndpointFilesAll].map(posixify).map((abs) => {
					const rel = abs.startsWith(routesBasePosix) ? abs.slice(routesBasePosix.length) : abs;
					return normalizeServerRel(rel.startsWith('/') ? rel : '/' + rel);
				})
			);

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

			// Track which server files are used (for both modes)
			const usedServerFiles = new Set<string>();

			// Discover JS/TS server files
			debugMinor(`DEBUG: Searching for JS/TS files in: ${routesBaseFs}`);
			const tsServerFiles = await glob('**/+*.server.{js,ts}', {
				cwd: routesBaseFs,
				absolute: true
			});
			const tsEndpointFiles = await glob('**/+server.{js,ts}', {
				cwd: routesBaseFs,
				absolute: true
			});
			const allServerTsJsFs = [...tsServerFiles, ...tsEndpointFiles];

			// Debug: Log what JS/TS server files were discovered
			debugMinor(`DEBUG: Found ${tsServerFiles.length} +*.server.{js,ts} files`);
			debugMinor(`DEBUG: Found ${tsEndpointFiles.length} +server.{js,ts} files`);
			debugMinor(`DEBUG: Total allServerTsJsFs files: ${allServerTsJsFs.length}`);
			allServerTsJsFs.forEach((file) => {
				debugMinor(`DEBUG: Discovered JS/TS file: ${file}`);
			});

			// Create normalized relative paths for all JS/TS server files (used by both modes)
			const allServerTsJsRel = new Set(
				allServerTsJsFs.map(posixify).map((abs) => {
					const rel = abs.startsWith(routesBasePosix) ? abs.slice(routesBasePosix.length) : abs;
					return normalizeServerRel(rel.startsWith('/') ? rel : '/' + rel);
				})
			);

			// Add JS/TS server files to the maps
			for (const rel of allServerTsJsRel) {
				const prefix = fnPrefixForServerFile(rel);
				fnPrefixMap.set(rel, prefix);

				const protectedRel =
					'/_protected/' +
					rel
						.replace(/^\//, '')
						.replace(/\//g, '__')
						.replace(/\+layout\.server\.(js|ts)$/i, '_layout.php')
						.replace(/\+page\.server\.(js|ts)$/i, '_page.php')
						.replace(/\+server\.(js|ts)$/i, '_server.php');

				protectedMap.set(rel, protectedRel);
			}

			// Conflict Resolution:
			// Identify valid PHP and TS/JS server modules, resolving conflicts based on mode.
			// 1. Identify valid TS/JS files (excluding dev proxies)
			const validTsFiles = new Set<string>();
			for (const abs of allServerTsJsFs) {
				if (await isDevProxyServerFile(abs)) continue;
				const rel = posixify(abs);
				const sliced = rel.startsWith(routesBasePosix) ? rel.slice(routesBasePosix.length) : rel;
				const normalized = normalizeServerRel(sliced.startsWith('/') ? sliced : '/' + sliced);
				validTsFiles.add(normalized);
			}

			// 2. Map routes to files
			const serverKey = (rel: string) => {
				const normalized = normalizeServerRel(rel);
				const lastSlash = normalized.lastIndexOf('/');
				const dir = lastSlash === -1 ? '' : normalized.slice(0, lastSlash);
				const file = lastSlash === -1 ? normalized : normalized.slice(lastSlash + 1);
				let kind = 'server';
				if (file.startsWith('+page')) kind = 'page';
				if (file.startsWith('+layout')) kind = 'layout';
				return `${dir}:${kind}`;
			};

			const conflicts: string[] = [];
			const phpMap = new Map<string, string[]>();
			for (const rel of allPhpRel) {
				const key = serverKey(rel);
				const list = phpMap.get(key);
				if (!list) {
					phpMap.set(key, [rel]);
				} else {
					list.push(rel);
				}
			}

			const tsMap = new Map<string, string[]>();
			for (const rel of validTsFiles) {
				const key = serverKey(rel);
				const list = tsMap.get(key);
				if (!list) {
					tsMap.set(key, [rel]);
				} else {
					list.push(rel);
				}
			}

			const effectivePhpFiles = new Set<string>();
			const effectiveTsFiles = new Set<string>();
			const allKeys = new Set([...phpMap.keys(), ...tsMap.keys()]);

			for (const key of allKeys) {
				const phps = phpMap.get(key) || [];
				const tss = tsMap.get(key) || [];

				if (phps.length > 1) {
					conflicts.push(`Multiple PHP modules for ${key}: ${phps.join(', ')}`);
				}
				if (tss.length > 1) {
					conflicts.push(`Multiple TS/JS modules for ${key}: ${tss.join(', ')}`);
				}

				if (phps.length > 0 && tss.length > 0) {
					if (mode === 'php-static') {
						effectivePhpFiles.add(phps[0]);
						builder.log.minor(
							`Mode ${mode}: Precedence -> Using PHP (${phps[0]}) for ${key}, ignoring TS/JS (${tss[0]})`
						);
					} else if (mode === 'js-ssr') {
						effectiveTsFiles.add(tss[0]);
						builder.log.minor(
							`Mode ${mode}: Precedence -> Using TS/JS (${tss[0]}) for ${key}, ignoring PHP (${phps[0]})`
						);
					} else {
						conflicts.push(`${phps[0]} <-> ${tss[0]}`);
					}
				} else if (phps.length > 0) {
					effectivePhpFiles.add(phps[0]);
				} else if (tss.length > 0) {
					effectiveTsFiles.add(tss[0]);
				}
			}

			if (conflicts.length) {
				const prefix = path.relative('.', builder.config.kit.files.routes);
				const errorLines = [
					'Conflicting PHP and TS/JS server modules detected:',
					...conflicts.map((c) => '- ' + path.posix.join(prefix, c))
				];
				if (strict) {
					builder.log.error(errorLines.join('\n'));
					throw new Error('Conflicting server modules detected');
				} else {
					builder.log.warn(errorLines.join('\n'));
					builder.log.warn('Continuing because strict mode is disabled.');
				}
			}

			// JS/TS server files will be processed after maps are created

			// JS/TS server files will be added to maps after they are discovered

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

					const isPage = seg === chain[0];
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
					const isLast = i === hierarchy.length - 1;

					// Check Layout
					const layoutCandidates = [
						base + '/+layout.server.php',
						base + '/+layout@.server.php',
						base + '/+layout.server@.php'
					];
					const layoutFound = layoutCandidates.find((c) => allServerRelPosix.has(c));
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
						const pageFound = pageCandidates.find((c) => allServerRelPosix.has(c));
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
				debug(`DEBUG: Processing prerendered route: ${navPath}`);

				// Adjust navPath for route matching if base path is present.
				let routePath = navPath;
				if (buildTimeBase && routePath.startsWith(buildTimeBase)) {
					routePath = routePath.slice(buildTimeBase.length);
					if (!routePath.startsWith('/')) routePath = '/' + routePath;
				}

				const route = findRouteForNavPath(builder, routePath);
				const routeId = route?.id ?? routePath; // fallback: best-effort

				// DEBUG: Inspect route object for SSR flag
				if (navPath.includes('matrix')) {
					debug(`DEBUG: Route for ${navPath}:`, JSON.stringify(route, null, 2));
					const routeConfig =
						route && typeof route === 'object' && 'config' in route
							? (route as { config?: unknown }).config
							: undefined;
					debug(`DEBUG: Route config for ${navPath}:`, JSON.stringify(routeConfig, null, 2));
				}

				const { phpRegex: routeRegex, phpMap: routeParamMapPhp } = compilePhpRouteMatcher(routeId);

				const { files: deps, loadMapItems } = getRouteDeps(routeId);
				for (const d of deps) usedServerFiles.add(d);

				// Find the directory where the page was written
				const htmlFs = path.join(prerenderedRoot, filePath.file);
				const htmlDir = path.dirname(htmlFs);
				const htmlBasename = path.basename(htmlFs);

				if (!/\.(html|php)$/i.test(htmlBasename)) {
					debug(`DEBUG: Skipping non-page prerendered output: ${filePath.file}`);
					continue;
				}

				// Directory-form normalization:
				// If the file is NOT index.html (e.g. about.html), treat it as about/index.php
				// So targetDir becomes htmlDir/about
				const isIndex = htmlBasename === 'index.html' || htmlBasename === 'index.php';

				// Determine fallback filename to skip normalization
				let fallbackFile = '200.html';
				if (typeof fallback === 'string' && fallback) fallbackFile = fallback;
				const isFallback = htmlBasename === fallbackFile;

				if (isFallback) {
					// For fallback file, we just copy it to outDir
					const fallbackDest = path.join(outDir, htmlBasename);
					// We might want to inject base href though?
					// Usually fallback is used for SPA, so it should have correct base refs.
					// But if we are in auto mode, we might want to patch it.
					// For now, let's just copy it as is, or process it minimally.
					// If we continue, it will be processed as a route, which might be overkill or wrong.
					// But if we skip it, we MUST copy it.
					await builder.copy(htmlFs, fallbackDest);
					continue;
				}

				let targetDir = htmlDir;
				let targetHtmlFs = htmlFs;
				let requirePrefix = '';

				if (!isIndex && !isFallback) {
					const name = htmlBasename.replace(/\.(html|php)$/i, '');
					targetDir = path.join(htmlDir, name);
					targetHtmlFs = path.join(targetDir, 'index.html'); // We will rename to .php later
					// requirePrefix is now empty because we are inside the directory
					requirePrefix = '';
				}

				// Ensure target directory exists
				builder.mkdirp(targetDir);

				// Check if HTML file exists before processing
				if (!(await exists(htmlFs))) {
					builder.log.warn('HTML file not found: ' + htmlFs + '. Skipping route.');
					continue;
				}

				if (mode === 'js-ssr') {
					if (htmlFs !== targetHtmlFs) {
						await builder.copy(htmlFs, targetHtmlFs);
					}
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
				const injectBaseHref = (html: string, basePath: string) => {
					if (baseMode === 'auto') {
						// Remove existing base tag if present to allow PHP injection
						html = html.replace(/<base\s[^>]*>/i, '');
					}

					if (/<base\s/i.test(html)) return html;

					if (baseMode === 'auto') {
						// For auto mode, inject PHP-based base tag
						const phpHref = '<?php echo htmlspecialchars(sk_base_href(), ENT_QUOTES); ?>';
						return html.replace(/<head(\s[^>]*)?>/i, (m) => `${m}\n  <base href="${phpHref}">`);
					} else {
						// For fixed mode, use static base path
						if (!basePath) return html;
						const href = basePath.replace(/\/$/, '') + '/';
						return html.replace(/<head(\s[^>]*)?>/i, (m) => `${m}\n  <base href="${href}">`);
					}
				};

				const rewriteAssetUrls = (html: string) => {
					if (baseMode === 'auto') {
						// For auto mode, rewrite /_app asset URLs to use base-aware PHP
						const phpBaseHref = '<?php echo htmlspecialchars(sk_base_href(), ENT_QUOTES); ?>';

						if (buildTimeBase && buildTimeBase !== '/') {
							const basePattern = buildTimeBase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

							const regex = new RegExp(`\\s(src|href)=(["'])${basePattern}/_app/`, 'g');
							html = html.replace(regex, (match, attr, quote) => {
								return ` ${attr}=${quote}${phpBaseHref}_app/`;
							});
						}

						// Also handle standard relative/root paths (fallback or if base wasn't applied)
						html = html.replace(/\s(src|href)="(\/|\.\/)?_app\//g, (match, attr) => {
							return ` ${attr}="${phpBaseHref}_app/`;
						});
						html = html.replace(/\s(src|href)='(\/|\.\/)?_app\//g, (match, attr) => {
							return ` ${attr}='${phpBaseHref}_app/`;
						});
					}
					return html;
				};

				const patchBootConfig = (html: string) => {
					if (baseMode !== 'auto') return html;

					// Patch inline SvelteKit boot config
					return html.replace(/<script[^>]*>([\s\S]*?)<\/script>/g, (match, content) => {
						if (!content.includes('__sveltekit_')) return match;

						let newContent = content;

						// Patch base: "..." -> base: <?php echo json_encode(sk_base_path()); ?>
						newContent = newContent.replace(
							/(["']?)base\1:\s*(["']).*?\2/g,
							(m: string, q1: string) => {
								return `${q1}base${q1}: <?php echo json_encode(sk_base_path()); ?>`;
							}
						);

						// Patch assets: "..." -> assets: <?php echo json_encode(sk_base_path()); ?>
						newContent = newContent.replace(
							/(["']?)assets\1:\s*(["']).*?\2/g,
							(m: string, q1: string) => {
								return `${q1}assets${q1}: <?php echo json_encode(sk_base_path()); ?>`;
							}
						);

						return match.replace(content, newContent);
					});
				};

				html = injectBaseHref(html, basePath);
				html = rewriteAssetUrls(html);
				html = patchBootConfig(html);

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
					try {
						templateJson = await readFile(templateJsonFs, 'utf8');
					} catch (e) {
						builder.log.warn(
							`Failed to read ${templateJsonFs} despite existence check: ${e}. Using synthesized template.`
						);
						templateJsonFs = null; // Trigger fallback synthesis
					}
				}

				if (templateJsonFs) {
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
									builder.log.minor(
										`Detected streaming JSON for ${templateJsonFs}, using first line as template.`
									);
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
					const nodeIdsMatch = html.match(/node_ids\s*:\s*\[([\d,\s]+)\]/);
					if (nodeIdsMatch) {
						const ids = nodeIdsMatch[1].split(',').filter((s) => s.trim() !== '');
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
						const ids = nodeIdsMatch[1].split(',').filter((s) => s.trim() !== '');
						nodeCount = ids.length;
						// console.log('Detected ' + nodeCount + ' nodes from HTML node_ids for ' + navPath);
					}
				}

				// Final fallback: assume 2 nodes (layout + page) if we still don't know
				if (nodeCount === 0) {
					nodeCount = 2;
				}

				// Adjust navPath for filesystem depth calculation if base path is present.
				// We want to preserve the base path structure in the output so that php -S works correctly
				// and relative paths in require_once are correct.
				const fsPath = navPath;

				// Re-calculate targetDir based on full fsPath to ensure files are nested correctly
				// This fixes the issue where SvelteKit strips base path from output files.
				targetDir = path.join(prerenderedRoot, stripLeadingSlash(fsPath));
				builder.mkdirp(targetDir);

				const relToRoot = phpRelToRootFromNav(fsPath);
				const includes = deps
					.map((d) => {
						const protectedRel = protectedMap.get(d);
						return protectedRel
							? "require_once __DIR__ . '/" + relToRoot + protectedRel.replace(/^\//, '') + "';"
							: '';
					})
					.filter(Boolean);

				// Use the load map we generated earlier
				const loadMapStrings = loadMapItems.map((item) => {
					let idx = item.index;
					if (idx === 'PAGE') {
						idx = nodeCount - 1;
					}
					return `'${idx}' => '${item.fn}'`;
				});
				const loadFnsPhp = '[' + loadMapStrings.join(', ') + ']';

				const pageDep = deps.find((d) => d.includes('+page.server'));
				const pagePrefix = pageDep ? fnPrefixMap.get(pageDep) : null;

				// Detect SvelteKit app hash early (needed for streaming Promise glue)
				const appHashMatch = html.match(/__sveltekit_(\w+)/);
				const appHash = appHashMatch ? `__sveltekit_${appHashMatch[1]}` : '__sveltekit_unknown';

				// Generate PHP content
				const compatRel = relToRoot + '_runtime/compat.php';
				const dataPhp = getDataPhp(includes, basePath, compatRel, relToRoot)
					.replace('PLACEHOLDER_ROUTE_ID', JSON.stringify(navPath))
					.replace('PLACEHOLDER_TEMPLATE_B64', Buffer.from(templateJson, 'utf8').toString('base64'))
					.replace('PLACEHOLDER_ROUTE_REGEX', routeRegex)
					.replace('PLACEHOLDER_ROUTE_PARAM_MAP', routeParamMapPhp)
					.replace('PLACEHOLDER_LOAD_FNS', loadFnsPhp)
					.replace('PLACEHOLDER_INLINE_MODE', JSON.stringify(inlineMode))
					.replaceAll('PLACEHOLDER_APP_ID', appHash);

				const actionPhp = getActionPhp(includes, navPath, pagePrefix ?? null, compatRel);

				// Write __data.php and __action.php
				// We always write to targetDir
				const dataDir = targetDir;
				// requirePrefix is always empty now because data is alongside index.php
				requirePrefix = '';

				assertPhp74Safe(dataPhp, `__data.php (${navPath})`);
				assertPhp74Safe(actionPhp, `__action.php (${navPath})`);
				await writeFile(path.join(dataDir, '__data.php'), dataPhp, 'utf8');
				await writeFile(path.join(dataDir, '__action.php'), actionPhp, 'utf8');

				// Patch HTML to PHP
				if (ssr) {
					debug(`DEBUG: SSR is enabled for ${navPath}. Converting HTML to PHP.`);
					// Detect if the page has inline data (meaning it was SSR'd with data)
					const replaced = replaceInlineConstData(html);

					if (replaced) {
						// Detect how data is inlined (SvelteKit 1.0 vs 2.0 styles vary, plus `inlineBody` option)
						const inlineMode = detectInlineDataModeFromHtml(html); // 'nodes' | 'payload' | 'unknown'

						html = replaced;

						html = html.replace(
							/<script>__sveltekit_[A-Za-z0-9_]+\.resolve\([\s\S]*?<\/script>\s*/g,
							''
						);
						const bootstrap = getBootstrapPhp(
							navPath,
							loadFnsPhp,
							templateJson,
							inlineMode,
							requirePrefix
						).replace('PLACEHOLDER_APP_ID', appHash);
						const footer = getFooterPhp(appHash);

						html = bootstrap + html.replace(/<\/body>/i, `${footer}\n</body>`);
					} else {
						// SSR off (or no data): inject minimal bootstrap (actions only), no data embedding
						const bootstrap = getMinimalBootstrapPhp(requirePrefix);
						html = bootstrap + html;
					}

					// Remove static __data.json if it exists (using the one we found)
					if (templateJsonFs && (await exists(templateJsonFs))) {
						try {
							await rename(
								templateJsonFs,
								path.join(path.dirname(templateJsonFs), '__data.template.json')
							);
						} catch (error: unknown) {
							const code =
								typeof error === 'object' && error !== null && 'code' in error
									? (error as { code?: string }).code
									: undefined;
							if (code !== 'ENOENT') {
								throw error;
							}
							// If it's gone, that's fine (maybe processed by another route sharing the same file?)
							builder.log.warn(`Could not rename ${templateJsonFs} (ENOENT). Ignoring.`);
						}
					}

					// Write to target location as index.php
					const targetPhp = path.join(targetDir, 'index.php');
					debug(`DEBUG: Writing converted PHP to ${targetPhp}`);
					await writeFile(targetPhp, html, 'utf8');

					// Remove the original HTML file
					if (await exists(htmlFs)) {
						debug(`DEBUG: Removing original HTML ${htmlFs}`);
						// For index.html -> index.php, we delete index.html
						// For about.html -> about/index.php, we delete about.html
						// Use fs.unlink (via rimraf or just unlink if available, but rimraf is safe)
						// builder.rimraf handles files too usually.
						// But let's use node fs for safety if rimraf is directory-focused?
						// builder.rimraf is likely standard rimraf.
						await builder.rimraf(htmlFs);
					}
				} else {
					// Fallback for SPA mode (ssr=false):
					// Move/Rename to index.php in target dir
					const targetPhp = path.join(targetDir, 'index.php');
					if (htmlFs !== targetPhp) {
						await rename(htmlFs, targetPhp);
					}
				}
			}

			// 3) Mode-specific logic
			debugMinor(`DEBUG: About to check mode. Current mode: ${mode}`);
			debug(`DEBUG: About to check mode. Current mode: ${mode}`);
			if (mode === 'js-ssr') {
				// --- Mode B: JavaScript SSR sidecar ---
				builder.log.minor('Generating JavaScript SSR sidecar output');

				// Copy prerendered files to output root so they are served as static files
				// This ensures Apache/PHP serves them directly (performance) and handles negotiation logic.
				// Previously we copied to 'prerendered' subdir but that made them inaccessible to the router.
				builder.copy(prerenderedRoot, outDir);

				// If we have a prerendered root index.php, rename it to _home.php
				// so the Proxy (which must be index.php) can include it instead of overwriting it.
				const possibleRootPhp = path.join(outDir, 'index.php');
				if (await exists(possibleRootPhp)) {
					builder.log.minor('Renaming prerendered root index.php to _home.php for js-ssr mode');
					await rename(possibleRootPhp, path.join(outDir, '_home.php'));
				}

				builder.mkdirp(path.join(outDir, '_runtime'));
				await writeFile(path.join(outDir, '_runtime', 'compat.php'), compatPhp, 'utf8');

				// Generate Server Bundle
				const serverDir = path.join(outDir, 'server');
				builder.mkdirp(serverDir);
				builder.writeServer(serverDir);

				// Generate Manifest
				// We need the manifest to be importable by handler.mjs which is in server/
				const manifest = builder.generateManifest({ relativePath: '.' }); // . because handler is in same dir as index.js
				await writeFile(
					path.join(serverDir, 'manifest.js'),
					`export const manifest = ${manifest};\n`
				);

				// Generate Handler
				const handler = getNodeHandlerMjs(basePath);
				await writeFile(path.join(serverDir, 'handler.mjs'), handler);

				// Generate PHP Proxy
				// We default to port 3000, but it can be configured via env in the sidecar.
				// The PHP script needs to know where the sidecar is.
				// We use env var PHP_SIDECAR_URL if set, otherwise default to localhost:3000
				const sidecarUrl = process.env.PHP_SIDECAR_URL || 'http://127.0.0.1:3000';
				const proxy = getPhpProxy(sidecarUrl);
				await writeFile(path.join(outDir, 'index.php'), proxy);

				// Generate .htaccess
				const htaccess = getHtaccess(
					'js-ssr',
					basePath || '',
					precompress,
					undefined,
					trailingSlash
				);
				await writeFile(path.join(outDir, '.htaccess'), htaccess.trim());
				if (precompress) {
					builder.log.minor('Compressing assets');
					await builder.compress(outDir);
					if (assetsDir !== outDir) {
						await builder.compress(assetsDir);
					}
				}

				// Copy PHP API endpoints (+server.php)
				// In Mode B, PHP is the entrypoint. We want +server.php to be served by PHP directly.
				// We map src/routes/path/to/+server.php -> out/path/to/index.php
				// Use the top-level allPhpRel variable instead of discovering again

				const phpApiFiles = await glob('**/+server.php', { cwd: routesBaseFs });

				for (const file of phpApiFiles) {
					// file is relative to routesBaseFs, e.g. 'api/cookie/+server.php'
					const srcFile = path.join(routesBaseFs, file);

					const rel = posixify(srcFile);
					const sliced = rel.startsWith(routesBasePosix) ? rel.slice(routesBasePosix.length) : rel;
					const normalized = sliced.startsWith('/') ? sliced : '/' + sliced;

					if (!effectivePhpFiles.has(normalized)) {
						builder.log.minor(`Skipping shadowed/ignored PHP file: ${file}`);
						continue;
					}

					const routeDir = path.dirname(file); // 'api/cookie'
					const destDir = path.join(outDir, routeDir);

					builder.mkdirp(destDir);

					// Copy as _server.php (hidden)
					await builder.copy(srcFile, path.join(destDir, '_server.php'));

					// Check for sibling Page (to enable Content Negotiation in js-ssr mode)
					const siblingPageCandidates = [
						path.join(routesBaseFs, routeDir, '+page.svelte'),
						path.join(routesBaseFs, routeDir, '+page.js'),
						path.join(routesBaseFs, routeDir, '+page.ts'),
						path.join(routesBaseFs, routeDir, '+page.server.js'),
						path.join(routesBaseFs, routeDir, '+page.server.ts')
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
						builder.log.minor(
							`Moving conflicting prerendered file ${possibleHtml} to ${path.join(destDir, 'index.html')}`
						);
						await rename(possibleHtml, path.join(destDir, 'index.html'));
						hasSiblingPage = true; // Ensure negotiation logic is enabled
					}

					// Generate wrapper index.php
					const wrapper = getStandaloneApiPhp(
						'_server.php',
						hasSiblingPage ? relToRoot : undefined
					);
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
				const router = getRouterPhp(basePath, 'js-ssr', fallback);
				assertPhp74Safe(router, 'router.php (js-ssr)');
				await writeFile(path.join(outDir, 'router.php'), router, 'utf8');

				// Generate route manifest for js-ssr mode
				builder.log.minor('Generating route manifest for js-ssr');
				const routeManifest = await generateRouteManifest(builder);
				const manifestPhp = `<?php\nreturn ${phpArrayString(routeManifest)};\n`;
				const manifestDir = path.join(outDir, 'adapter');
				builder.mkdirp(manifestDir);
				await writeFile(path.join(manifestDir, 'route-manifest.php'), manifestPhp, 'utf8');

				// Write Build Stamp
				builder.log.minor('Writing build stamp');
				const stamp = {
					mode,
					basePath: basePath || '',
					adapterVersion: '0.0.1', // TODO: Read from package.json or inject
					builtAt: new Date().toISOString()
				};
				// Ensure _runtime exists (it should, but just in case)
				builder.mkdirp(path.join(outDir, '_runtime'));
				await writeFile(
					path.join(outDir, '_runtime', 'build-stamp.json'),
					JSON.stringify(stamp, null, 2),
					'utf8'
				);

				if (mode === 'js-ssr') {
					// --- Mode B: JavaScript SSR sidecar ---

					// Basic prerender safety
					if (strict !== false) {
						const dynamic = builder.routes.filter((r) => r.prerender !== true);
						const trulyDynamic = dynamic.filter((r) => {
							const id = r.id.startsWith('/') ? r.id : '/' + r.id;
							const candidateServer = id + '/+server.php';
							const candidatePageServer = id + '/+page.server.php';
							if (
								allServerRelPosix.has(candidateServer) ||
								allServerRelPosix.has(candidatePageServer)
							) {
								return false;
							}
							return true;
						});

						if (trulyDynamic.length) {
							const prefix = path.relative('.', builder.config.kit.files.routes);
							const errorLines = [
								'Non-prerenderable routes detected:',
								'This adapter will build, but these routes require a fallback strategy to render at runtime.'
							];
							trulyDynamic.forEach((r) => {
								errorLines.push('- ' + path.posix.join(prefix, r.id));
							});
							if (!fallback) {
								errorLines.push(
									'Set kit.prerender.fallback or adapter fallback if you want SPA-style fallback.'
								);
							}
							builder.log.warn(errorLines.join('\n'));
						}
					}

					// Log what was actually prerendered for debugging
					builder.log.minor(
						'Prerendered pages: ' +
							Array.from(builder.prerendered.pages.entries())
								.map(([k, v]) => k + ' -> ' + v.file)
								.join(', ')
					);

					// 3) Discover PHP server files (Already done at step 0)

					// Use the top-level protectedMap and fnPrefixMap that were already created

					// Use the top-level usedServerFiles that was already created

					// 4.5) Handle API endpoints (+server.php, +server.js, +server.ts)
					builder.log.minor('Generating API endpoints');

					// Process PHP server endpoints
					for (const relPosix of allServerRelPosix) {
						if (relPosix.endsWith('+server.php')) {
							const routeDir = path.dirname(relPosix);
							const prefix = fnPrefixMap.get(relPosix);
							const protectedRel = protectedMap.get(relPosix);

							if (!prefix || !protectedRel) continue;

							usedServerFiles.add(relPosix);

							const outDir = path.join(prerenderedRoot, stripLeadingSlash(routeDir));
							if (await isFile(outDir)) {
								builder.log.minor(`Skipping prerendered PHP endpoint file: ${routeDir}`);
								continue;
							}
							builder.log.minor(`Creating output directory: ${outDir}`);
							builder.mkdirp(outDir);

							const relToRoot = phpRelToRootFromNav(routeDir + '/');
							const include =
								"require_once __DIR__ . '/" + relToRoot + protectedRel.replace(/^\//, '') + "';";
							builder.log.minor(`Generated include: ${include}`);

							const { phpRegex: routeRegex, phpMap: routeParamMapPhp } =
								compilePhpRouteMatcher(routeDir);
							const apiPhp = getApiPhp(
								[include],
								prefix,
								basePath || '',
								routeRegex,
								routeParamMapPhp,
								relToRoot + '_runtime/compat.php'
							);
							const indexPhp = path.join(outDir, 'index.php');

							// Check for collision with index.php OR sibling .php/.html (e.g. about.php, negotiate.html)
							let pageFile = null;
							if (await exists(indexPhp)) {
								pageFile = indexPhp;
							} else if (
								stripLeadingSlash(routeDir) !== '' &&
								stripLeadingSlash(routeDir) !== '.'
							) {
								// Check if there is a sibling file with the same name as the directory + .php or .html
								// e.g. prerendered/negotiate.php, prerendered/negotiate.html
								// We need to check relative to the build root, not the outDir
								const buildRoot = prerenderedRoot;
								const routeName = path.basename(routeDir);
								const routeParent = path.dirname(routeDir);
								const siblingPhp = path.join(
									buildRoot,
									stripLeadingSlash(routeParent),
									routeName + '.php'
								);
								const siblingHtml = path.join(
									buildRoot,
									stripLeadingSlash(routeParent),
									routeName + '.html'
								);
								if (await exists(siblingPhp)) {
									pageFile = siblingPhp;
								} else if (await exists(siblingHtml)) {
									pageFile = siblingHtml;
								}
							}

							builder.log.minor(`Checking for collision at ${indexPhp} or sibling`);
							builder.log.minor(`Route dir: ${routeDir}, outDir: ${outDir}`);
							if (stripLeadingSlash(routeDir) !== '' && stripLeadingSlash(routeDir) !== '.') {
								const buildRoot = prerenderedRoot;
								const routeName = path.basename(routeDir);
								const routeParent = path.dirname(routeDir);
								const siblingPhp = path.join(
									buildRoot,
									stripLeadingSlash(routeParent),
									routeName + '.php'
								);
								const siblingHtml = path.join(
									buildRoot,
									stripLeadingSlash(routeParent),
									routeName + '.html'
								);
								builder.log.minor(`Sibling PHP check: ${siblingPhp}`);
								builder.log.minor(`Sibling HTML check: ${siblingHtml}`);
							}
							builder.log.minor(`Page file found: ${pageFile}`);
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

									// Handle HTML files differently from PHP files
									if (pageFile.endsWith('.html')) {
										// For HTML files, wrap in PHP that outputs the content
										content = `<?php
// Generated HTML content from ${path.basename(pageFile)}
header('Content-Type: text/html; charset=utf-8');
echo <<<HTML
${content}
HTML;
?>`;
									} else {
										// Adjust require_once paths to account for deeper location
										content = content.replace(
											/require_once __DIR__ \. '\//g,
											"require_once __DIR__ . '/../"
										);
									}

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

if (($_SERVER['HTTP_X_SVELTEKIT_ACTION'] ?? '') === 'true') {
    require __DIR__ . '/_page.php';
    return;
}

// 1. Method Precedence
// SvelteKit rules: PUT/PATCH/DELETE/OPTIONS -> always +server
// POST also goes to +server if it exists (conflicts with actions are not allowed by Kit)
if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'])) {
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
            if (strncmp($part, 'q=', 2) === 0) {
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
								assertPhp74Safe(apiPhp, `API dispatch (${routeDir})`);
								assertPhp74Safe(negotiationPhp, `Negotiation index.php (${routeDir})`);
								await writeFile(indexPhp, negotiationPhp, 'utf8');
							} else {
								// No collision, just write index.php
								builder.log.minor(`Writing index.php to ${indexPhp}`);
								assertPhp74Safe(apiPhp, `API index.php (${routeDir})`);
								await writeFile(indexPhp, apiPhp, 'utf8');
							}
						}
					}

					// Process JS/TS server endpoints
					builder.log.minor('Processing JS/TS server endpoints');
					debugMinor(
						`DEBUG: Starting JS/TS endpoint processing loop with ${allServerTsJsFs.length} files`
					);
					for (const absPath of allServerTsJsFs) {
						debugMinor(`DEBUG: Checking file: ${absPath}`);

						const relPosixPath = posixify(absPath);
						const sliced = relPosixPath.startsWith(routesBasePosix)
							? relPosixPath.slice(routesBasePosix.length)
							: relPosixPath;
						const relative = sliced.startsWith('/') ? sliced : '/' + sliced;
						const normalized = normalizeServerRel(relative);

						if (!effectiveTsFiles.has(normalized)) {
							builder.log.minor(`Skipping ignored TS/JS file: ${absPath}`);
							continue;
						}

						if (absPath.endsWith('+server.js') || absPath.endsWith('+server.ts')) {
							builder.log.minor(`Processing JS/TS endpoint: ${absPath}`);
							const routeDir = path.dirname(normalized);
							const prefix = fnPrefixMap.get(normalized);
							const protectedRel = protectedMap.get(normalized);

							if (!prefix || !protectedRel) {
								builder.log.minor(`Skipping ${normalized} - missing prefix or protectedRel`);
								continue;
							}

							usedServerFiles.add(normalized);

							const outDir = path.join(prerenderedRoot, stripLeadingSlash(routeDir));
							if (await isFile(outDir)) {
								builder.log.minor(`Skipping prerendered JS/TS endpoint file: ${routeDir}`);
								continue;
							}
							debugMinor(`DEBUG: Creating output directory: ${outDir}`);
							debug(`DEBUG: Creating output directory: ${outDir}`);
							builder.mkdirp(outDir);

							const relToRoot = phpRelToRootFromNav(routeDir + '/');
							const include =
								"require_once __DIR__ . '/" + relToRoot + protectedRel.replace(/^\//, '') + "';";

							const { phpRegex: routeRegex, phpMap: routeParamMapPhp } =
								compilePhpRouteMatcher(routeDir);
							const apiPhp = getApiPhp(
								[include],
								prefix,
								basePath || '',
								routeRegex,
								routeParamMapPhp,
								relToRoot + '_runtime/compat.php'
							);
							const indexPhp = path.join(outDir, 'index.php');

							// Check for collision with index.php OR sibling .php (e.g. about.php)
							let pageFile = null;
							if (await exists(indexPhp)) {
								pageFile = indexPhp;
							} else if (
								stripLeadingSlash(routeDir) !== '' &&
								stripLeadingSlash(routeDir) !== '.'
							) {
								// Check if there is a sibling file with the same name as the directory + .php
								// e.g. prerendered/negotiate.php
								// outDir is prerendered/negotiate
								const siblingPhp = outDir + '.php';
								if (await exists(siblingPhp)) {
									pageFile = siblingPhp;
								}
							}

							builder.log.minor(
								`Checking for collision at ${indexPhp} or sibling for JS/TS endpoint`
							);
							if (pageFile) {
								builder.log.minor(`Collision found at ${pageFile} for JS/TS endpoint`);
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
									content = content.replace(
										/require_once __DIR__ \. '\//g,
										"require_once __DIR__ . '/../"
									);

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

if (($_SERVER['HTTP_X_SVELTEKIT_ACTION'] ?? '') === 'true') {
    require __DIR__ . '/_page.php';
    return;
}

// 1. Method Precedence
// SvelteKit rules: PUT/PATCH/DELETE/OPTIONS -> always +server
// POST also goes to +server if it exists (conflicts with actions are not allowed by Kit)
if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'])) {
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
            if (strncmp($part, 'q=', 2) === 0) {
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
								assertPhp74Safe(apiPhp, `API dispatch (${routeDir})`);
								assertPhp74Safe(negotiationPhp, `Negotiation index.php (${routeDir})`);
								await writeFile(indexPhp, negotiationPhp, 'utf8');
							} else {
								// No collision, just write index.php
								assertPhp74Safe(apiPhp, `API index.php (${routeDir})`);
								await writeFile(indexPhp, apiPhp, 'utf8');
							}
						}
					}

					// 5) Convert PHP server files into namespaced protected copies
					builder.log.minor('Converting PHP server files');
					const protectedRoot = path.join(prerenderedRoot, '_protected');
					builder.mkdirp(protectedRoot);
					await writeFile(path.join(protectedRoot, '.htaccess'), 'Require all denied\n', 'utf8');

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

					// 6.5) Generate route manifest
					builder.log.minor('Generating route manifest');
					debug('DEBUG: About to call generateRouteManifest for php-static mode');
					const routeManifest = await generateRouteManifest(builder);
					debug('DEBUG: generateRouteManifest returned:', JSON.stringify(routeManifest, null, 2));
					const manifestPhp = `<?php\nreturn ${phpArrayString(routeManifest)};\n`;
					const manifestDir = path.join(prerenderedRoot, 'adapter');
					builder.mkdirp(manifestDir);
					await writeFile(path.join(manifestDir, 'route-manifest.php'), manifestPhp, 'utf8');
				}
			} else if (mode === 'php-static') {
				// --- Mode A: php-static ---
				builder.log.minor('Generating php-static output');
				debugMinor(`DEBUG: Entering php-static mode section. Mode: ${mode}`);
				debug(`DEBUG: Entering php-static mode section. Mode: ${mode}`);

				// 4.25) Generate runtime shims for non-prerendered pages with +page.server.php
				// This prevents 404s for prerender=false pages in php-static mode and allows PHP-only redirects.
				builder.log.minor('Generating runtime shims for non-prerendered pages');
				debug(`DEBUG: allServerRelPosix size: ${allServerRelPosix.size}`);
				debug(`DEBUG: allServerRelPosix content:`, Array.from(allServerRelPosix));

				for (const r of builder.routes) {
					if (r.prerender === true) continue;

					const routeId = r.id.startsWith('/') ? r.id : '/' + r.id;
					if (routeId === '/' || routeId === '') continue;

					const pageServerRel = routeId + '/+page.server.php';
					debug(`DEBUG: Checking route ${routeId}, looking for ${pageServerRel}`);

					if (!allServerRelPosix.has(pageServerRel)) {
						debug(`DEBUG: ${pageServerRel} NOT found in allServerRelPosix`);
						continue;
					}

					debug(`DEBUG: Found ${pageServerRel}, generating shims`);

					// Adjust output directory to include base path if present
					let fsPath = routeId;
					if (buildTimeBase && buildTimeBase !== '/') {
						const normalizedBase = buildTimeBase.startsWith('/')
							? buildTimeBase
							: '/' + buildTimeBase;
						fsPath = normalizedBase + (routeId.startsWith('/') ? routeId : '/' + routeId);
					}

					const outDirForRoute = path.join(prerenderedRoot, stripLeadingSlash(fsPath));
					const outIndexPhp = path.join(outDirForRoute, 'index.php');
					const outSiblingPhp = outDirForRoute + '.php';
					const outSiblingHtml = outDirForRoute + '.html';

					if (await exists(outIndexPhp)) continue;
					if (await exists(outSiblingPhp)) continue;
					if (await exists(outSiblingHtml)) continue;

					const { files: deps, loadMapItems } = getRouteDeps(routeId);
					for (const d of deps) usedServerFiles.add(d);

					const fsPathForRel = fsPath.endsWith('/') ? fsPath : fsPath + '/';
					const relToRoot = phpRelToRootFromNav(fsPathForRel);
					const compatRel = relToRoot + '_runtime/compat.php';
					const includes = deps
						.map((d) => {
							const protectedRel = protectedMap.get(d);
							return protectedRel
								? "require_once __DIR__ . '/" + relToRoot + protectedRel.replace(/^\//, '') + "';"
								: '';
						})
						.filter(Boolean);

					const loadFnList = loadMapItems.map((i) => i.fn);
					const loadFnsPhp = '[' + loadFnList.map((fn) => `'${fn}'`).join(', ') + ']';

					const { phpRegex: routeRegex, phpMap: routeParamMapPhp } =
						compilePhpRouteMatcher(routeId);

					const shimPhp = `<?php
declare(strict_types = 1);

require_once __DIR__ . '/${compatRel}';

if (!defined('SK_BASE_PATH')) {
					define('SK_BASE_PATH', getenv('SK_BASE_PATH') ?: ${JSON.stringify(basePath || '')});
}

const SK_ROUTE_REGEX = '${routeRegex}';
const SK_ROUTE_PARAM_MAP = ${routeParamMapPhp};

${includes.join('\n')}

// Handle Actions (POST) for this route
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
	if (file_exists(__DIR__ . '/__action.php')) {
		require __DIR__ . '/__action.php';
		// If action returned (did not exit), we continue to render the page (shim).
		// We must prevent the fallback root index.php from trying to handle the POST again.
		$_SERVER['REQUEST_METHOD'] = 'GET';
	}
}

$loadFns = ${loadFnsPhp};
$routeid = ${JSON.stringify(routeId)};

final class SK_URLSearchParams {
	private array $pairs = [];

	public function __construct(string $queryString) {
		$qs = ltrim($queryString, '?');
		if ($qs === '') return;
		foreach (explode('&', $qs) as $part) {
			if ($part === '') continue;
			$kv = explode('=', $part, 2);
			$key = urldecode($kv[0]);
			$val = urldecode($kv[1] ?? '');
			if (!array_key_exists($key, $this->pairs)) $this->pairs[$key] = [];
			$this->pairs[$key][] = $val;
		}
	}

	public function get(string $key): ?string {
		$vals = $this->pairs[$key] ?? null;
		if (!$vals) return null;
		return $vals[0] ?? null;
	}

	public function has(string $key): bool {
		return array_key_exists($key, $this->pairs);
	}

	public function __get(string $key): ?string {
		return $this->get($key);
	}

	public function __isset(string $key): bool {
		return $this->has($key);
	}

	public function all(string $key): array {
		return $this->pairs[$key] ?? [];
	}

	public function toString(): string {
		$out = [];
		foreach ($this->pairs as $k => $vals) {
			foreach ($vals as $v) {
				$out[] = rawurlencode($k) . '=' . rawurlencode($v);
			}
		}
		return implode('&', $out);
	}
}


$params = sk_extract_params($_SERVER['REQUEST_URI'] ?? '', SK_BASE_PATH, SK_ROUTE_REGEX, SK_ROUTE_PARAM_MAP);

$base = [];
foreach ($loadFns as $fn) {
	if (!function_exists($fn)) continue;

	$event = [
		'params' => $params,
		'url' => (object)[
			'searchParams' => new SK_URLSearchParams($_SERVER['QUERY_STRING'] ?? ''),
			'pathname' => parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH)
		],
		'request' => (object)[
			'headers' => (object)[
				'cookie' => $_SERVER['HTTP_COOKIE'] ?? ''
			]
		],
		'cookies' => new SK_Cookies($_COOKIE),
		'routeid' => $routeid,
		'parentdata' => $base,
		'method' => $_SERVER['REQUEST_METHOD'] ?? 'GET',
		'query' => $_GET,
		'server' => $_SERVER
	];

	$res = $fn($event);
	if (is_array($res)) {
		$base = array_merge($base, $res);
	}
}

$fallback_php = __DIR__ . '/${relToRoot.replace(/^\.\//, '')}${basePath ? stripLeadingSlash(basePath) + '/' : ''}index.php';
$fallback_html = __DIR__ . '/${relToRoot.replace(/^\.\//, '')}${basePath ? stripLeadingSlash(basePath) + '/' : ''}index.html';
$fallback_200 = __DIR__ . '/${relToRoot.replace(/^\.\//, '')}${basePath ? stripLeadingSlash(basePath) + '/' : ''}200.html';

if (is_file($fallback_php)) {
	$_SERVER['SCRIPT_FILENAME'] = realpath($fallback_php);
	require $fallback_php;
	exit;
}

if (is_file($fallback_html)) {
	header('content-type: text/html; charset=utf-8');
	readfile($fallback_html);
	exit;
}

if (is_file($fallback_200)) {
	header('content-type: text/html; charset=utf-8');
	readfile($fallback_200);
	exit;
}

					http_response_code(404);
					echo '404 Not Found (PHP Router)';
`;

					builder.mkdirp(outDirForRoute);
					assertPhp74Safe(shimPhp, `Route shim index.php (${routeId})`);
					await writeFile(outIndexPhp, shimPhp, 'utf8');

					// Generate __data.php and __action.php for this dynamic route
					// We use a synthesized template with minimal nodes since we don't have prerendered data
					const nodeCount = loadMapItems.length > 0 ? loadMapItems.length : 2; // Approximate
					const nodes = new Array(nodeCount).fill(null);
					const templateJson = JSON.stringify({ type: 'data', nodes });
					const inlineMode = 'unknown';
					const appHash = '__sveltekit_unknown';

					const dataPhp = getDataPhp(includes, basePath, compatRel, relToRoot)
						.replace('PLACEHOLDER_ROUTE_ID', JSON.stringify(routeId))
						.replace(
							'PLACEHOLDER_TEMPLATE_B64',
							Buffer.from(templateJson, 'utf8').toString('base64')
						)
						.replace('PLACEHOLDER_ROUTE_REGEX', routeRegex)
						.replace('PLACEHOLDER_ROUTE_PARAM_MAP', routeParamMapPhp)
						.replace('PLACEHOLDER_LOAD_FNS', loadFnsPhp)
						.replace('PLACEHOLDER_INLINE_MODE', JSON.stringify(inlineMode))
						.replaceAll('PLACEHOLDER_APP_ID', appHash);

					const pageDep = deps.find((d) => d.includes('+page.server'));
					const pagePrefix = pageDep ? fnPrefixMap.get(pageDep) : null;
					const actionPhp = getActionPhp(includes, routeId, pagePrefix ?? null, compatRel);

					assertPhp74Safe(dataPhp, `__data.php (${routeId})`);
					assertPhp74Safe(actionPhp, `__action.php (${routeId})`);
					await writeFile(path.join(outDirForRoute, '__data.php'), dataPhp, 'utf8');
					await writeFile(path.join(outDirForRoute, '__action.php'), actionPhp, 'utf8');
				}

				// 4.5) Handle API endpoints (+server.php, +server.js, +server.ts)
				builder.log.minor('Generating API endpoints');

				// Process PHP server endpoints
				for (const relPosix of allServerRelPosix) {
					if (relPosix.endsWith('+server.php')) {
						const routeDir = path.dirname(relPosix);
						const prefix = fnPrefixMap.get(relPosix);
						const protectedRel = protectedMap.get(relPosix);

						if (!prefix || !protectedRel) continue;

						usedServerFiles.add(relPosix);

						let fsPath = routeDir;
						if (buildTimeBase && buildTimeBase !== '/') {
							const normalizedBase = buildTimeBase.startsWith('/')
								? buildTimeBase
								: '/' + buildTimeBase;
							const routePart = routeDir.startsWith('/') ? routeDir : '/' + routeDir;
							fsPath = normalizedBase + routePart;
						}

						const outDir = path.join(prerenderedRoot, stripLeadingSlash(fsPath));
						if (await isFile(outDir)) {
							builder.log.minor(`Skipping prerendered PHP endpoint file: ${routeDir}`);
							continue;
						}
						builder.log.minor(`Creating output directory: ${outDir}`);
						builder.mkdirp(outDir);

						const relToRoot = phpRelToRootFromNav(fsPath + '/');
						const include =
							"require_once __DIR__ . '/" + relToRoot + protectedRel.replace(/^\//, '') + "';";
						builder.log.minor(`Generated include: ${include}`);

						const { phpRegex: routeRegex, phpMap: routeParamMapPhp } =
							compilePhpRouteMatcher(routeDir);
						const apiPhp = getApiPhp(
							[include],
							prefix,
							basePath || '',
							routeRegex,
							routeParamMapPhp,
							relToRoot + '_runtime/compat.php'
						);
						const indexPhp = path.join(outDir, 'index.php');

						// Check for collision with index.php, index.html OR sibling .php/.html
						let pageFile = null;
						const indexHtml = path.join(outDir, 'index.html');

						if (await exists(indexPhp)) {
							pageFile = indexPhp;
						} else if (await exists(indexHtml)) {
							pageFile = indexHtml;
						} else if (stripLeadingSlash(routeDir) !== '' && stripLeadingSlash(routeDir) !== '.') {
							// Check if there is a sibling file with the same name as the directory + .php or .html
							// e.g. prerendered/negotiate.php or prerendered/negotiate.html
							// outDir is prerendered/negotiate
							const siblingPhp = outDir + '.php';
							const siblingHtml = outDir + '.html';

							if (await exists(siblingPhp)) {
								pageFile = siblingPhp;
							} else if (await exists(siblingHtml)) {
								pageFile = siblingHtml;
							}
						}

						builder.log.minor(`Checking for collision at ${indexPhp}, ${indexHtml} or sibling`);
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
								content = content.replace(
									/require_once __DIR__ \. '\//g,
									"require_once __DIR__ . '/../"
								);

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

if (($_SERVER['HTTP_X_SVELTEKIT_ACTION'] ?? '') === 'true') {
    require __DIR__ . '/_page.php';
    return;
}

// 1. Method Precedence
// SvelteKit rules: PUT/PATCH/DELETE/OPTIONS -> always +server
// POST also goes to +server if it exists (conflicts with actions are not allowed by Kit)
if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'])) {
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
            if (strncmp($part, 'q=', 2) === 0) {
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
							assertPhp74Safe(apiPhp, `API dispatch (${routeDir})`);
							assertPhp74Safe(negotiationPhp, `Negotiation index.php (${routeDir})`);
							await writeFile(indexPhp, negotiationPhp, 'utf8');
						} else {
							// No collision, just write index.php
							builder.log.minor(`Writing index.php to ${indexPhp}`);
							assertPhp74Safe(apiPhp, `API index.php (${routeDir})`);
							await writeFile(indexPhp, apiPhp, 'utf8');
						}
					}
				}

				// Process JS/TS server endpoints
				builder.log.minor('Processing JS/TS server endpoints');
				debugMinor(
					`DEBUG: Starting JS/TS endpoint processing loop with ${allServerTsJsFs.length} files`
				);
				debug(
					`DEBUG: Starting JS/TS endpoint processing loop with ${allServerTsJsFs.length} files`
				);
				for (const absPath of allServerTsJsFs) {
					debugMinor(`DEBUG: Checking file: ${absPath}`);
					debug(`DEBUG: Checking file: ${absPath}`);

					const relPosixPath = posixify(absPath);
					const sliced = relPosixPath.startsWith(routesBasePosix)
						? relPosixPath.slice(routesBasePosix.length)
						: relPosixPath;
					const relative = sliced.startsWith('/') ? sliced : '/' + sliced;
					const normalized = normalizeServerRel(relative);

					if (!effectiveTsFiles.has(normalized)) {
						builder.log.minor(`Skipping ignored TS/JS file: ${absPath}`);
						continue;
					}

					if (absPath.endsWith('+server.js') || absPath.endsWith('+server.ts')) {
						builder.log.minor(`Processing JS/TS endpoint: ${absPath}`);
						debug(`Processing JS/TS endpoint: ${absPath}`);

						debugMinor(`DEBUG: Converted to normalized path: ${normalized}`);
						debug(`DEBUG: Converted to normalized path: ${normalized}`);

						const routeDir = path.dirname(normalized);
						const prefix = fnPrefixMap.get(normalized);
						const protectedRel = protectedMap.get(normalized);

						debug(`DEBUG: Looking up ${normalized} in maps`);
						debug(`DEBUG: prefix: ${prefix}, protectedRel: ${protectedRel}`);
						debug(`DEBUG: fnPrefixMap has ${fnPrefixMap.size} entries`);
						debug(`DEBUG: protectedMap has ${protectedMap.size} entries`);

						if (!prefix || !protectedRel) {
							builder.log.minor(`Skipping ${normalized} - missing prefix or protectedRel`);
							debug(
								`DEBUG: Skipping ${normalized} - prefix: ${prefix}, protectedRel: ${protectedRel}`
							);
							continue;
						}

						usedServerFiles.add(normalized);

						let fsPath = routeDir;
						if (buildTimeBase && buildTimeBase !== '/') {
							const normalizedBase = buildTimeBase.startsWith('/')
								? buildTimeBase
								: '/' + buildTimeBase;
							const routePart = routeDir.startsWith('/') ? routeDir : '/' + routeDir;
							fsPath = normalizedBase + routePart;
						}

						const outDir = path.join(prerenderedRoot, stripLeadingSlash(fsPath));
						if (await isFile(outDir)) {
							builder.log.minor(`Skipping prerendered JS/TS endpoint file: ${routeDir}`);
							continue;
						}
						builder.mkdirp(outDir);

						const relToRoot = phpRelToRootFromNav(fsPath + '/');
						const include =
							"require_once __DIR__ . '/" + relToRoot + protectedRel.replace(/^\//, '') + "';";

						const { phpRegex: routeRegex, phpMap: routeParamMapPhp } =
							compilePhpRouteMatcher(routeDir);
						const apiPhp = getApiPhp(
							[include],
							prefix,
							basePath || '',
							routeRegex,
							routeParamMapPhp,
							relToRoot + '_runtime/compat.php'
						);
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

						builder.log.minor(
							`Checking for collision at ${indexPhp} or sibling for JS/TS endpoint`
						);
						if (pageFile) {
							builder.log.minor(`Collision found at ${pageFile} for JS/TS endpoint`);
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
								content = content.replace(
									/require_once __DIR__ \. '\//g,
									"require_once __DIR__ . '/../"
								);

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

if (($_SERVER['HTTP_X_SVELTEKIT_ACTION'] ?? '') === 'true') {
    require __DIR__ . '/_page.php';
    return;
}

// 1. Method Precedence
// SvelteKit rules: PUT/PATCH/DELETE/OPTIONS -> always +server
// POST also goes to +server if it exists (conflicts with actions are not allowed by Kit)
if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'])) {
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
            if (strncmp($part, 'q=', 2) === 0) {
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
							assertPhp74Safe(apiPhp, `API dispatch (${routeDir})`);
							assertPhp74Safe(negotiationPhp, `Negotiation index.php (${routeDir})`);
							await writeFile(indexPhp, negotiationPhp, 'utf8');
						} else {
							// No collision, just write index.php
							debugMinor(`DEBUG: No collision found, writing index.php to ${indexPhp}`);
							debug(`DEBUG: No collision found, writing index.php to ${indexPhp}`);
							assertPhp74Safe(apiPhp, `API index.php (${routeDir})`);
							await writeFile(indexPhp, apiPhp, 'utf8');
							debugMinor(`DEBUG: Successfully wrote index.php to ${indexPhp}`);
							debug(`DEBUG: Successfully wrote index.php to ${indexPhp}`);
						}
					}
				}

				// 5) Convert PHP server files into namespaced protected copies
				builder.log.minor('Converting PHP server files');
				const protectedRoot = path.join(prerenderedRoot, '_protected');
				builder.mkdirp(protectedRoot);
				await writeFile(path.join(protectedRoot, '.htaccess'), 'Require all denied\n', 'utf8');

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

				// 6.5) Generate route manifest
				builder.log.minor('Generating route manifest');
				debug('DEBUG: About to call generateRouteManifest for php-static mode');
				const routeManifestRaw = await generateRouteManifest(builder);

				// Filter phantom entries (routes that claim to have a shim but the shim doesn't exist)
				const filteredManifest: RouteManifestEntry[] = [];
				for (const entry of routeManifestRaw) {
					// entry.shim is now a root-relative path string like "/foo/index.php"
					// We need to check existence relative to prerenderedRoot

					const checkExists = async (relPath: string) => {
						if (!relPath) return false;
						// Remove leading slash to join correctly
						const safeRel = relPath.startsWith('/') ? relPath.slice(1) : relPath;
						return await exists(path.join(prerenderedRoot, safeRel));
					};

					let exists_ = true;
					if (entry.type === 'page' || entry.type === 'endpoint') {
						if (entry.shim) {
							if (!(await checkExists(entry.shim))) {
								exists_ = false;
							}
						}
					} else if (entry.type === 'negotiate') {
						let pExists = false;
						let eExists = false;
						if (entry.page && (await checkExists(entry.page))) pExists = true;
						if (entry.endpoint && (await checkExists(entry.endpoint))) eExists = true;

						if (!pExists && !eExists) exists_ = false;
					}

					if (exists_) filteredManifest.push(entry);
					else {
						builder.log.minor(`Removing phantom route manifest entry type=${entry.type}`);
					}
				}

				debug('DEBUG: generateRouteManifest returned:', JSON.stringify(filteredManifest, null, 2));
				const manifestPhp = `<?php\nreturn ${phpArrayString(filteredManifest)};\n`;
				const manifestDir = path.join(prerenderedRoot, 'adapter');
				builder.mkdirp(manifestDir);
				await writeFile(path.join(manifestDir, 'route-manifest.php'), manifestPhp, 'utf8');

				// 7) Finalize build output
				builder.log.minor('Copying build to output');
				builder.copy(prerenderedRoot, outDir);
				builder.mkdirp(path.join(outDir, '_runtime'));
				await writeFile(path.join(outDir, '_runtime', 'compat.php'), compatPhp, 'utf8');

				// 7) Generate .htaccess for Apache rewrites
				builder.log.minor('Generating .htaccess');
				const htaccess = getHtaccess(
					'php-static',
					basePath || '',
					precompress,
					'router.php',
					trailingSlash
				);
				await writeFile(path.join(outDir, '.htaccess'), htaccess.trim(), 'utf8');

				// 8) Generate router.php for PHP built-in server
				builder.log.minor('Generating router.php');
				// Use fallback if provided, regardless of strict mode (user choice)
				const routerFallback = fallback;
				const router = getRouterPhp(basePath, 'php-static', routerFallback);
				assertPhp74Safe(router, 'router.php');
				await writeFile(path.join(outDir, 'router.php'), router, 'utf8');

				// 9) Compress assets
				builder.log.minor('Compressing assets');
				await builder.compress(outDir);

				// 10) Write Build Stamp
				builder.log.minor('Writing build stamp');
				const stamp = {
					mode,
					basePath: basePath || '',
					adapterVersion: '0.0.1', // TODO: Read from package.json or inject
					builtAt: new Date().toISOString()
				};
				await writeFile(
					path.join(outDir, '_runtime', 'build-stamp.json'),
					JSON.stringify(stamp, null, 2),
					'utf8'
				);
			}

			builder.log.minor('Done');
		}
	};
}
