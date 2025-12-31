import path from 'node:path';
import glob from 'tiny-glob';
import { readFile, writeFile, rename } from 'node:fs/promises';
import { posixify, stripLeadingSlash, fnPrefixForServerFile, phpRelToRootFromNav } from './utils/paths.js';
import { findRouteForNavPath, buildLayoutChainCandidates } from './utils/routing.js';
import { detectInlineDataModeFromHtml, replaceInlineConstData } from './utils/html.js';
import { exists } from './utils/fs.js';
import { getDataPhp, getActionPhp, getBootstrapPhp } from './runtime/php-templates.js';
import type { AdapterOptions, Builder } from './types.js';

export default function sveltekitPhpAdapter(options: AdapterOptions = {}) {
	const {
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
			// Basic prerender safety
			if (!fallback && strict !== false) {
				const dynamic = builder.routes.filter((r) => r.prerender !== true);
				if (dynamic.length) {
					const prefix = path.relative('.', builder.config.kit.files.routes);
					const errorLines = [
						'All routes must be prerenderable for this adapter output.',
						'Found non-prerenderable routes:'
					];
					dynamic.forEach((r) => {
						errorLines.push('- ' + path.posix.join(prefix, r.id));
					});
					errorLines.push('Fix: set prerender per-route, or configure SvelteKit prerender entries appropriately, or implement a fallback strategy.');
					builder.log.error(errorLines.join('\n'));
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
					builder.log.minor('Patched client data endpoint: ' + startFilePath);
				}
			}

			// 2) Prerendered output
			builder.log.minor('Prerendering pages');
			const prerenderedRoot = path.join(tmpDir, 'prerendered');
			builder.writePrerendered(prerenderedRoot);

			// Log what was actually prerendered for debugging
			builder.log.minor('Prerendered pages: ' + Array.from(builder.prerendered.pages.entries()).map(([k, v]) => k + ' -> ' + v.file).join(', '));

			// 3) Discover PHP server files in src/routes
			const routesBaseFs = path.resolve(builder.config.kit.files.routes);
			const routesBasePosix = posixify(routesBaseFs);

			const allServerPhpFs = await glob('**/+*.server.php', { cwd: routesBaseFs, absolute: true });
			// console.log('Found PHP files:', allServerPhpFs);
			const allServerRelPosix = new Set(
				allServerPhpFs.map(posixify).map((abs) => {
					const rel = abs.startsWith(routesBasePosix) ? abs.slice(routesBasePosix.length) : abs;
					return rel.startsWith('/') ? rel : '/' + rel;
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
						.replace(/\.server\.php$/i, '.php');

				protectedMap.set(rel, protectedRel);
			}

			const usedServerFiles = new Set<string>();

			// Helper: build deps for a route
			function depsForRoute(routeIdPosix: string) {
				const deps: string[] = [];

				const chain = buildLayoutChainCandidates(routeIdPosix); // ["(app)/dashboard", "(app)", ""]
				for (const seg of chain.reverse()) {
					// walk root -> leaf for layout order
					const base = seg ? '/' + seg : '';
					const layoutStd = base + '/+layout.server.php';
					const layoutResetA = base + '/+layout@.server.php';
					const layoutResetB = base + '/+layout.server@.php';

					if (allServerRelPosix.has(layoutResetA)) {
						deps.push(layoutResetA);
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
				const pageStd = '/' + (rid ? rid + '/' : '') + '+page.server.php';
				const pageResetA = '/' + (rid ? rid + '/' : '') + '+page@.server.php';
				const pageResetB = '/' + (rid ? rid + '/' : '') + '+page.server@.php';

				if (allServerRelPosix.has(pageStd)) deps.push(pageStd);
				else if (allServerRelPosix.has(pageResetA)) deps.push(pageResetA);
				else if (allServerRelPosix.has(pageResetB)) deps.push(pageResetB);

				return deps;
			}

			// 4) For each prerendered page, generate runtime files + convert HTML->PHP
			for (const [navPathRaw, filePath] of builder.prerendered.pages) {
				const navPath = navPathRaw; // e.g. "/about/"
				builder.log.minor('Preparing PHP route: ' + navPath);

				const route = findRouteForNavPath(builder, navPath);
				const routeId = route?.id ?? navPath; // fallback: best-effort

				const deps = depsForRoute(routeId);
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
				const templateJsonFs = path.join(htmlDir, '__data.json');
				// if (!(await exists(templateJsonFs))) {
				// 	// Some layouts may produce slightly different paths; try nav-path based.
				// 	const altDir = path.join(prerenderedRoot, stripLeadingSlash(navPath), '');
				// 	const altTemplate = path.join(altDir, '__data.json');
				// 	if (await exists(altTemplate)) {
				// 		// could use alt location logic if needed, but currently just warning
				// 	} else {
				// 		builder.log.warn('Missing __data.json next to ' + htmlFs + '. Data injection will likely fail.');
				// 	}
				// }

				let html = await readFile(htmlFs, 'utf8');
				const inlineMode = detectInlineDataModeFromHtml(html);

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

				// SvelteKit 2.x often puts __data.json in a subdirectory for named pages.
				// e.g. prerendered/test-js.html might have data in prerendered/test-js/__data.json
				if (nodeCount === 0) {
					// Check subdirectory based on navPath
					const subDirData = path.join(prerenderedRoot, stripLeadingSlash(navPath), '__data.json');
					if (await exists(subDirData)) {
						templateJson = await readFile(subDirData, 'utf8');
						try {
							const payload = JSON.parse(templateJson);
							if (payload.nodes) nodeCount = payload.nodes.length;
							// If we found it here, we should probably mark it for renaming later
							// But for now, just reading it is enough to get the node count and template.
						} catch { }
					}
				}

				// Fallback: detect node count from HTML if not found in JSON
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

				const relToRoot = phpRelToRootFromNav(navPath);
				const includes = deps
					.map((d) => {
						const protectedRel = protectedMap.get(d);
						return protectedRel
							? 'require_once __DIR__ . \'/' + relToRoot + protectedRel.replace(/^\//, '') + '\';'
							: '';
					})
					.filter(Boolean);

				// Construct load map: [ index => function_name ]
				const loadMap: string[] = [];
				for (const d of deps) {
					const prefix = fnPrefixMap.get(d);
					if (!prefix) continue;
					const fnName = prefix + '_load';

					if (d.endsWith('page.server.php')) {
						// Page always targets the last node
						loadMap.push('\'' + (nodeCount - 1) + '\' => \'' + fnName + '\'');
					} else if (d.endsWith('layout.server.php')) {
						// Root layout targets 0. Others we skip for now.
						if (d === '/+layout.server.php' || d === '+layout.server.php') {
							loadMap.push('\'0\' => \'' + fnName + '\'');
						}
					}
				}

				const loadFnsPhp = '[' + loadMap.join(', ') + ']';

				const pageDep = deps.find((d) => d.includes('+page.server'));
				const pagePrefix = pageDep ? fnPrefixMap.get(pageDep) : null;

				// Generate PHP content
				const dataPhp = getDataPhp(includes)
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
					const replaced = replaceInlineConstData(html);
					if (replaced) html = replaced;

					const bootstrap = getBootstrapPhp(navPath, loadFnsPhp, templateJson, inlineMode, requirePrefix);
					html = bootstrap + html;

					// Remove static __data.json if it exists at the main location
					if (await exists(templateJsonFs)) {
						await rename(templateJsonFs, path.join(htmlDir, '__data.template.json'));
					}
					// Also check for the subdirectory one we might have read from
					const subDirData = path.join(prerenderedRoot, stripLeadingSlash(navPath), '__data.json');
					if (await exists(subDirData)) {
						// Only rename if it's different from templateJsonFs (it usually is for named routes)
						if (path.resolve(subDirData) !== path.resolve(templateJsonFs)) {
							await rename(subDirData, path.join(path.dirname(subDirData), '__data.template.json'));
						}
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
