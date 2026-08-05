import path from 'node:path';
import os from 'node:os';
import { readdir, stat, readFile } from 'node:fs/promises';
import type { AdapterOptions, Builder, BuildIdentityContract } from '../types.js';

export const DEFAULT_BUILD_IDENTITY_EXTENSIONS = ['.php', '.html', '.json'];
export const RESERVED_ROUTE_SEGMENTS = new Set(['_app', '_runtime', '_protected', 'adapter']);
export const RESERVED_ROUTE_FILES = new Set([
	'__data',
	'__action',
	'router',
	'route-manifest',
	'compat'
]);
export const REMOTE_FUNCTIONS_ALPHA_POLICY_MARKER = 'remote-functions-alpha-policy';
export const REMOTE_FUNCTIONS_UNSUPPORTED_MESSAGE =
	'sveltekit-php: SvelteKit remote functions are not supported by the PHP runtime in 1.0.2-alpha. Remote functions generate server HTTP endpoints that are not yet mapped through the PHP router. Disable kit.experimental.remoteFunctions and remove .remote.* files, or use a Node/edge adapter until remote-functions-alpha-policy has fixture proof.';
export const REMOTE_FUNCTION_FILE_RE = /\.remote\.(?:js|ts|mjs|mts|cjs|cts)$/i;

export type ResolvedBuildIdentityContract = Required<
	Pick<BuildIdentityContract, 'required' | 'forbidden' | 'extensions'>
> &
	Pick<BuildIdentityContract, 'name'>;

export function isInside(parent: string, child: string): boolean {
	const rel = path.relative(parent, child);
	return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);
}

export function isInsideOrSame(parent: string, child: string): boolean {
	return path.resolve(parent) === path.resolve(child) || isInside(parent, child);
}

export async function collectRemoteFunctionFiles(root: string): Promise<string[]> {
	const files: string[] = [];
	const visit = async (dir: string) => {
		let entries: Array<{ name: string; isDirectory(): boolean; isFile(): boolean }>;
		try {
			entries = await readdir(dir, { withFileTypes: true });
		} catch {
			return;
		}

		for (const entry of entries) {
			const abs = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				if (
					entry.name === 'node_modules' ||
					entry.name === '.git' ||
					entry.name === '.svelte-kit' ||
					entry.name === 'build'
				) {
					continue;
				}
				await visit(abs);
			} else if (entry.isFile() && REMOTE_FUNCTION_FILE_RE.test(entry.name)) {
				files.push(abs);
			}
		}
	};

	await visit(root);
	return files;
}

export async function assertRemoteFunctionsUnsupported(builder: Builder) {
	const kit = builder.config.kit as unknown as {
		experimental?: { remoteFunctions?: unknown };
		files?: { routes?: string; lib?: string };
	};
	const remoteFunctionsEnabled = kit.experimental?.remoteFunctions === true;
	const cwd = path.resolve(process.cwd());
	const roots = Array.from(
		new Set(
			[
				path.join(cwd, 'src'),
				kit.files?.routes ? path.resolve(kit.files.routes) : '',
				kit.files?.lib ? path.resolve(kit.files.lib) : ''
			].filter(Boolean)
		)
	);
	const remoteFiles = (
		await Promise.all(roots.map((root) => collectRemoteFunctionFiles(root)))
	)
		.flat()
		.map((file) => path.relative(cwd, file).replaceAll(path.sep, '/'))
		.sort();
	const uniqueRemoteFiles = Array.from(new Set(remoteFiles));

	if (!remoteFunctionsEnabled && uniqueRemoteFiles.length === 0) return;

	const reasons = [
		remoteFunctionsEnabled ? '- kit.experimental.remoteFunctions is enabled' : '',
		...uniqueRemoteFiles.map((file) => `- ${file}`)
	].filter(Boolean);

	throw new Error(
		[
			REMOTE_FUNCTIONS_UNSUPPORTED_MESSAGE,
			`Policy marker: ${REMOTE_FUNCTIONS_ALPHA_POLICY_MARKER}`,
			'Detected unsupported remote-functions surface:',
			...reasons
		].join('\n')
	);
}

export function normalizeMarkerList(value: unknown): string[] {
	if (value == null) return [];
	if (Array.isArray(value)) {
		return value
			.flatMap((item) => normalizeMarkerList(item))
			.map((item) => item.trim())
			.filter(Boolean);
	}
	if (typeof value !== 'string') return [];

	const trimmed = value.trim();
	if (!trimmed) return [];

	try {
		const parsed = JSON.parse(trimmed);
		if (Array.isArray(parsed)) return normalizeMarkerList(parsed);
	} catch {
		// Treat non-JSON values as delimiter-separated marker lists.
	}

	return trimmed
		.split(/\r?\n|;;/)
		.map((item) => item.trim())
		.filter(Boolean);
}

export function normalizeSafeExternalRoots(value: string | undefined): string[] {
	if (!value) return [];
	const trimmed = value.trim();
	if (!trimmed) return [];

	try {
		const parsed = JSON.parse(trimmed);
		if (Array.isArray(parsed)) {
			return parsed
				.filter((item): item is string => typeof item === 'string')
				.map((item) => item.trim())
				.filter(Boolean)
				.map((item) => path.resolve(item));
		}
	} catch {
		// Treat non-JSON values as semicolon-separated Windows path lists.
	}

	return trimmed
		.split(';')
		.map((item) => item.trim())
		.filter(Boolean)
		.map((item) => path.resolve(item));
}

export function resolveBuildIdentityContract(
	buildIdentity: AdapterOptions['buildIdentity']
): ResolvedBuildIdentityContract | null {
	if (buildIdentity === false) return null;
	const option = buildIdentity && typeof buildIdentity === 'object' ? buildIdentity : undefined;

	const envRequired = normalizeMarkerList(process.env.SVELTEKIT_PHP_BUILD_REQUIRED_MARKERS);
	const envForbidden = normalizeMarkerList(process.env.SVELTEKIT_PHP_BUILD_FORBIDDEN_MARKERS);
	const optionRequired = normalizeMarkerList(option?.required);
	const optionForbidden = normalizeMarkerList(option?.forbidden);
	const required = [...optionRequired, ...envRequired];
	const forbidden = [...optionForbidden, ...envForbidden];

	if (required.length === 0 && forbidden.length === 0) return null;

	const extensions = normalizeMarkerList(option?.extensions).map((extension) =>
		extension.startsWith('.') ? extension.toLowerCase() : `.${extension.toLowerCase()}`
	);

	return {
		name: option?.name ?? process.env.SVELTEKIT_PHP_BUILD_IDENTITY ?? 'generated-output',
		required,
		forbidden,
		extensions: extensions.length > 0 ? extensions : DEFAULT_BUILD_IDENTITY_EXTENSIONS
	};
}

export async function verifyBuildIdentityContract(
	outDir: string,
	contract: ResolvedBuildIdentityContract,
	builder: Builder
) {
	const extensions = new Set(contract.extensions);
	const textFiles: string[] = [];

	const collectTextFiles = async (dir: string) => {
		let entries: string[];
		try {
			entries = await readdir(dir);
		} catch {
			// Ignore transient directories removed by user hooks or post-processing.
			return;
		}

		for (const entry of entries) {
			const file = path.join(dir, entry);
			try {
				const info = await stat(file);
				if (info.isDirectory()) {
					await collectTextFiles(file);
				} else if (info.isFile() && extensions.has(path.extname(file).toLowerCase())) {
					textFiles.push(file);
				}
			} catch {
				// Ignore transient files removed by user hooks or post-processing.
			}
		}
	};

	await collectTextFiles(outDir);

	let corpus = '';
	for (const file of textFiles) {
		corpus += `\n/* ${path.relative(outDir, file)} */\n`;
		corpus += await readFile(file, 'utf8');
	}

	const missing = contract.required.filter((marker) => !corpus.includes(marker));
	const presentForbidden = contract.forbidden.filter((marker) => corpus.includes(marker));

	if (missing.length > 0 || presentForbidden.length > 0) {
		const lines = [`Build identity contract "${contract.name ?? 'generated-output'}" failed.`];
		if (missing.length > 0) lines.push(`Missing required markers: ${missing.join(', ')}`);
		if (presentForbidden.length > 0)
			lines.push(`Forbidden markers present: ${presentForbidden.join(', ')}`);
		throw new Error(lines.join('\n'));
	}

	builder.log.minor(
		`Build identity contract "${contract.name ?? 'generated-output'}" passed (${textFiles.length} files scanned)`
	);
}

export function normalizeRouteIdSegments(routeId: string): string[] {
	return routeId
		.split('/')
		.map((segment) => segment.trim())
		.filter(Boolean)
		.filter((segment) => !(segment.startsWith('(') && segment.endsWith(')')));
}

export function isRouteParamSegment(segment: string): boolean {
	return segment.startsWith('[') && segment.endsWith(']');
}

export function validateReservedRouteIds(routes: Builder['routes'], strict: boolean, builder: Builder) {
	const conflicts = routes
		.map((route) => route.id)
		.filter(Boolean)
		.filter((routeId) => {
			const segments = normalizeRouteIdSegments(routeId);
			if (segments.length === 0) return false;
			const firstSegment = segments[0];
			const lastSegment = segments[segments.length - 1] ?? '';
			const lastBase = lastSegment.replace(/\.[^.]+$/, '');

			return (
				RESERVED_ROUTE_SEGMENTS.has(firstSegment) ||
				RESERVED_ROUTE_FILES.has(lastBase) ||
				segments.some((segment) => !isRouteParamSegment(segment) && segment.includes('..'))
			);
		});

	if (conflicts.length === 0) return;

	const message = [
		'sveltekit-php reserved route collision detected.',
		'These route ids overlap adapter-generated runtime paths and can break static assets, data/action dispatch, or protected PHP handler output:',
		...conflicts.map((routeId) => `- ${routeId}`),
		'Rename these routes or move them under a non-reserved segment.'
	].join('\n');

	if (strict) {
		throw new Error(message);
	}

	builder.log.warn(message);
}

/**
 * Guard against build cleanup targeting unsafe paths.
 *
 * The adapter rimrafs the output/temp dirs it owns. This guard rejects fs roots,
 * the repo, home, source trees, and (hardening, audit P1-7) common user/system
 * directories even when they are configured through SVELTEKIT_PHP_SAFE_EXTERNAL_ROOTS.
 */
export function assertSafeBuildTarget(target: string, label: string, routesRoot: string) {
	const resolved = path.resolve(target);
	const cwd = path.resolve(process.cwd());
	const home = path.resolve(os.homedir());
	const temp = path.resolve(os.tmpdir());
	const root = path.parse(resolved).root;
	const sourceRoots = [
		path.join(cwd, 'src'),
		path.join(cwd, 'adapter', 'src'),
		path.join(cwd, 'scripts'),
		path.join(cwd, 'tests'),
		path.resolve(routesRoot)
	];
	const safeExternalRoots = normalizeSafeExternalRoots(
		process.env.SVELTEKIT_PHP_SAFE_EXTERNAL_ROOTS
	);

	if (resolved === root || resolved === cwd || resolved === home) {
		throw new Error(`Unsafe build target for ${label}: ${resolved}`);
	}
	if (sourceRoots.some((source) => resolved === source || isInside(source, resolved))) {
		throw new Error(`Unsafe build target for ${label}: ${resolved}`);
	}

	for (const safeRoot of safeExternalRoots) {
		const safeRootFsRoot = path.parse(safeRoot).root;
		if (
			safeRoot === safeRootFsRoot ||
			safeRoot === cwd ||
			safeRoot === home ||
			sourceRoots.some((source) => safeRoot === source || isInside(source, safeRoot))
		) {
			throw new Error(`Unsafe configured external build root for ${label}: ${safeRoot}`);
		}
	}

	// Hardening: never rimraf these, even through SVELTEKIT_PHP_SAFE_EXTERNAL_ROOTS.
	const exactDenyRoots = new Set([temp]);
	const subtreeDenyRoots = [
		// POSIX system roots only; on Windows path.resolve('/dev') maps to the
		// current drive root and could swallow real trees like B:\Dev.
		...(process.platform === 'win32'
			? []
			: ['/etc', '/usr', '/var', '/opt', '/boot', '/dev', '/proc', '/sys']),
		path.join(home, 'Documents'),
		path.join(home, 'Downloads'),
		path.join(home, 'Desktop'),
		path.join(home, 'OneDrive')
	].map((entry) => path.resolve(entry));

	if (exactDenyRoots.has(resolved)) {
		throw new Error(`Unsafe build target for ${label}: ${resolved} (denied directory)`);
	}
	if (subtreeDenyRoots.some((deny) => resolved === deny || isInside(deny, resolved))) {
		throw new Error(`Unsafe build target for ${label}: ${resolved} (denied directory)`);
	}

	const isConfiguredExternalTarget = safeExternalRoots.some((safeRoot) =>
		isInsideOrSame(safeRoot, resolved)
	);
	if (!isInside(cwd, resolved) && !isInside(temp, resolved) && !isConfiguredExternalTarget) {
		throw new Error(`Unsafe build target for ${label}: ${resolved}`);
	}
}
