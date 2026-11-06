import path from 'node:path';
import type { AdapterMode, AdapterOptions } from '../types.js';

// eslint-disable-next-line no-control-regex -- Reject literal and decoded control bytes in public adapter options.
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;
const VALID_MODES: readonly AdapterMode[] = ['php-static', 'js-ssr'];
const VALID_BASE_MODES = ['fixed', 'auto'] as const;

function decodeForValidation(value: string, label: string): string {
	let decoded = value;
	for (let pass = 0; pass < 8; pass += 1) {
		try {
			const next = decodeURIComponent(decoded);
			if (next === decoded) return decoded;
			decoded = next;
		} catch {
			throw new Error(`sveltekit-php: ${label} contains invalid percent encoding.`);
		}
	}
	throw new Error(`sveltekit-php: ${label} contains excessive nested percent encoding.`);
}

function assertNoControlCharacters(value: string, label: string): void {
	if (
		CONTROL_CHARACTERS.test(value) ||
		CONTROL_CHARACTERS.test(decodeForValidation(value, label))
	) {
		throw new Error(`sveltekit-php: ${label} must not contain control characters.`);
	}
}

function assertBoolean(value: unknown, label: keyof AdapterOptions): void {
	if (value !== undefined && typeof value !== 'boolean') {
		throw new Error(`sveltekit-php: ${label} must be a boolean.`);
	}
}

function assertOptionalString(value: unknown, label: keyof AdapterOptions): void {
	if (value !== undefined && (typeof value !== 'string' || value.trim() === '')) {
		throw new Error(`sveltekit-php: ${label} must be a non-empty string.`);
	}
}

export function normalizeBasePathOption(value: string | undefined): string | undefined {
	if (value === undefined) return undefined;
	if (value === '' || value === '/') return '';
	assertNoControlCharacters(value, 'basePath');
	if (!value.startsWith('/') || value.endsWith('/')) {
		throw new Error(
			'sveltekit-php: basePath must be empty or start with one slash and omit the trailing slash.'
		);
	}
	if (value.includes('\\') || value.includes('?') || value.includes('#') || value.includes('//')) {
		throw new Error(
			'sveltekit-php: basePath must be a normalized URL path without backslashes, queries, fragments, or empty segments.'
		);
	}
	const decoded = decodeForValidation(value, 'basePath');
	if (
		decoded.includes('\\') ||
		decoded.includes('?') ||
		decoded.includes('#') ||
		decoded.split('/').length !== value.split('/').length
	) {
		throw new Error(
			'sveltekit-php: basePath must not contain encoded URL separators or reserved characters.'
		);
	}
	const segments = decoded.slice(1).split('/');
	if (segments.some((segment) => segment === '' || segment === '.' || segment === '..')) {
		throw new Error(
			'sveltekit-php: basePath must not contain empty, current-directory, or parent-directory segments.'
		);
	}
	return value;
}

export function normalizeFallbackOption(value: AdapterOptions['fallback']): boolean | string {
	if (value === undefined) return false;
	if (typeof value === 'boolean') return value;
	if (typeof value !== 'string' || value.trim() === '') {
		throw new Error('sveltekit-php: fallback must be a boolean or a non-empty relative path.');
	}
	if (value !== value.trim()) {
		throw new Error('sveltekit-php: fallback must not have leading or trailing whitespace.');
	}
	assertNoControlCharacters(value, 'fallback');
	if (
		value.includes('\\') ||
		value.includes('?') ||
		value.includes('#') ||
		path.posix.isAbsolute(value) ||
		path.win32.isAbsolute(value) ||
		/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(value)
	) {
		throw new Error(
			'sveltekit-php: fallback must be a relative URL path without a scheme, drive, query, fragment, or backslash.'
		);
	}
	const decoded = decodeForValidation(value, 'fallback');
	if (
		decoded.includes('\\') ||
		decoded.includes('?') ||
		decoded.includes('#') ||
		decoded.split('/').length !== value.split('/').length ||
		path.posix.isAbsolute(decoded) ||
		path.win32.isAbsolute(decoded)
	) {
		throw new Error(
			'sveltekit-php: fallback must not contain encoded separators or reserved characters.'
		);
	}
	const segments = decoded.split('/');
	if (segments.some((segment) => segment === '' || segment === '.' || segment === '..')) {
		throw new Error(
			'sveltekit-php: fallback must not contain empty, current-directory, or parent-directory segments.'
		);
	}
	return value;
}

export function resolveContainedOutputPath(
	root: string,
	relativePath: string,
	label: string
): string {
	const resolvedRoot = path.resolve(root);
	const resolvedTarget = path.resolve(resolvedRoot, relativePath);
	const relative = path.relative(resolvedRoot, resolvedTarget);
	if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
		throw new Error(`sveltekit-php: ${label} escaped its output root.`);
	}
	return resolvedTarget;
}

export function normalizeAdapterOptions(options: AdapterOptions = {}): AdapterOptions & {
	mode: AdapterMode;
	baseMode: 'fixed' | 'auto';
	fallback: boolean | string;
} {
	if (options === null || typeof options !== 'object' || Array.isArray(options)) {
		throw new Error('sveltekit-php: adapter options must be an object.');
	}
	const mode = options.mode ?? 'php-static';
	if (!VALID_MODES.includes(mode)) {
		throw new Error(`sveltekit-php: mode must be one of ${VALID_MODES.join(', ')}.`);
	}
	const baseMode = options.baseMode ?? 'fixed';
	if (!VALID_BASE_MODES.includes(baseMode)) {
		throw new Error(`sveltekit-php: baseMode must be one of ${VALID_BASE_MODES.join(', ')}.`);
	}
	assertBoolean(options.ssr, 'ssr');
	assertBoolean(options.precompress, 'precompress');
	assertBoolean(options.strict, 'strict');
	assertOptionalString(options.out, 'out');
	assertOptionalString(options.assets, 'assets');

	return {
		...options,
		mode,
		baseMode,
		basePath: normalizeBasePathOption(options.basePath),
		fallback: normalizeFallbackOption(options.fallback)
	};
}
