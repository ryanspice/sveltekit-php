// scripts/utils/config.mjs
//
// Keep this module side-effect free. It is imported by svelte.config.js during
// `svelte-kit sync`, `vite build`, and npm packaging hooks, so loading .env here
// would make build/package behavior depend on runtime deployment files.
// Commands that intentionally support local .env files should load dotenv in
// their own entrypoint before calling these helpers.

/**
 * @typedef {Record<string, string | undefined>} EnvRecord
 */

/**
 * Single source of truth for base path resolution.
 *
 * Rules:
 * 1. Default to root ('') if no environment variables are set.
 * 2. If SK_BASE_PATH is set, use it (internal override).
 * 3. If DEPLOY_BASE is set, use it (user preference).
 * 4. Normalize to ensure no trailing slash (unless it is exactly '/').
 */
export function getBasePath() {
	// Priority: SK_BASE_PATH > DEPLOY_BASE > Default ('')
	const raw = process.env.SK_BASE_PATH ?? process.env.DEPLOY_BASE ?? '';
	return normalizeBase(raw);
}

/**
 * Normalize base path:
 * - Trim whitespace
 * - Ensure leading slash if not empty
 * - Remove trailing slash
 * - Return '' for root
 */
/**
 * @param {unknown} raw
 * @returns {string}
 */
export function normalizeBase(raw) {
	if (!raw) return '';
	let b = String(raw).trim();
	if (b === '/' || b === '.') return '';

	// Ensure leading slash
	if (!b.startsWith('/')) b = '/' + b;

	// Strip trailing slash(es)
	b = b.replace(/\/+$/, '');

	return b;
}

/**
 * @param {unknown} [raw]
 * @returns {'php-static' | 'js-ssr'}
 */
export function normalizeAdapterMode(raw = 'php-static') {
	const mode = String(raw || 'php-static').trim();
	if (mode === 'php-static' || mode === 'js-ssr') return mode;
	throw new Error(`Unsupported adapter mode: ${mode}`);
}

/**
 * Get environment variables for a specific build mode.
 * Useful for ensuring scripts run with consistent configuration.
 */
/**
 * @param {unknown} mode
 * @param {unknown} [base]
 * @returns {EnvRecord & { SK_BASE_PATH: string; DEPLOY_BASE: string; ADAPTER_MODE: 'php-static' | 'js-ssr'; NODE_ENV: 'production' }}
 */
export function getEnvForMode(mode, base = null) {
	const basePath = base !== null ? normalizeBase(base) : getBasePath();
	const adapterMode = normalizeAdapterMode(mode);
	return {
		...process.env,
		SK_BASE_PATH: basePath,
		DEPLOY_BASE: basePath, // Sync them to avoid confusion
		ADAPTER_MODE: adapterMode,
		NODE_ENV: 'production'
	};
}

const PLACEHOLDER_RE = /^(|<.*>|\$\{.*\}|changeme|change_me|change-me|todo|tbd|placeholder|example|example\..*|your_.+|undefined|null)$/i;

/**
 * @param {string[]} keys
 * @param {string} [label]
 * @param {EnvRecord} [env]
 * @returns {void}
 */
export function assertRequiredEnv(keys, label = 'environment', env = process.env) {
	const missing = [];

	for (const key of keys) {
		const value = env[key];
		if (value == null || PLACEHOLDER_RE.test(String(value).trim())) {
			missing.push(key);
		}
	}

	if (missing.length > 0) {
		throw new Error(`${label} requires non-empty values for: ${missing.join(', ')}`);
	}
}

/**
 * @param {string[]} keys
 * @param {string} [label]
 * @param {EnvRecord} [env]
 * @returns {void}
 */
export function assertOptionalEnvIsConcrete(keys, label = 'environment', env = process.env) {
	const placeholders = [];

	for (const key of keys) {
		const value = env[key];
		if (value != null && String(value).trim() !== '' && PLACEHOLDER_RE.test(String(value).trim())) {
			placeholders.push(key);
		}
	}

	if (placeholders.length > 0) {
		throw new Error(`${label} contains placeholder values for: ${placeholders.join(', ')}`);
	}
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isConcreteEnvValue(value) {
	return value != null && !PLACEHOLDER_RE.test(String(value).trim());
}

/**
 * @param {string} [label]
 * @param {EnvRecord} [env]
 * @returns {void}
 */
export function assertDeployEnv(label = 'Deploy environment', env = process.env) {
	assertRequiredEnv(['DEPLOY_HOST', 'DEPLOY_USER', 'DEPLOY_REMOTE', 'DEPLOY_LOCAL'], label, env);
	assertOptionalEnvIsConcrete(['DEPLOY_PROFILE', 'DEPLOY_IDENTITY_FILE', 'ALPHA_SMOKE_BASE_URL'], label, env);

	const port = env.DEPLOY_PORT;
	if (isConcreteEnvValue(port)) {
		const parsed = Number(port);
		if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
			throw new Error(`${label} requires DEPLOY_PORT to be an integer from 1 to 65535.`);
		}
	}

	for (const key of ['DEPLOY_LOCAL', 'DEPLOY_IDENTITY_FILE']) {
		const value = env[key];
		if (isConcreteEnvValue(value) && String(value).includes('..')) {
			throw new Error(`${label} requires ${key} to avoid parent-relative paths.`);
		}
	}

	const smokeUrl = env.ALPHA_SMOKE_BASE_URL?.trim();
	if (smokeUrl && isConcreteEnvValue(smokeUrl)) {
		let url;
		try {
			url = new URL(smokeUrl);
		} catch {
			throw new Error(`${label} requires ALPHA_SMOKE_BASE_URL to be a valid HTTP(S) URL when set.`);
		}

		if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search) {
			throw new Error(`${label} requires ALPHA_SMOKE_BASE_URL to omit credentials and query tokens.`);
		}
	}
}

/**
 * @param {string} [label]
 * @param {EnvRecord} [env]
 * @returns {void}
 */
export function assertHostedSmokeEnv(label = 'Hosted smoke environment', env = process.env) {
	assertRequiredEnv(['ALPHA_SMOKE_BASE_URL'], label, env);
	assertOptionalEnvIsConcrete(
		['ALPHA_SMOKE_TIMEOUT_MS', 'ALPHA_SMOKE_REPORT_PATH', 'ALPHA_SMOKE_EXPECTED_BASE'],
		label,
		env
	);

	const baseUrl = env.ALPHA_SMOKE_BASE_URL?.trim() ?? '';
	try {
		const parsed = new URL(baseUrl);
		if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
			throw new Error('protocol');
		}
		if (parsed.username || parsed.password || parsed.search) {
			throw new Error('credentials-or-query');
		}
	} catch {
		throw new Error(
			`${label}: ALPHA_SMOKE_BASE_URL must be an HTTP(S) origin/path and must omit credentials and query tokens.`
		);
	}

	const timeoutRaw = env.ALPHA_SMOKE_TIMEOUT_MS?.trim();
	if (timeoutRaw && isConcreteEnvValue(timeoutRaw)) {
		const timeoutMs = Number(timeoutRaw);
		if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
			throw new Error(`${label}: ALPHA_SMOKE_TIMEOUT_MS must be a positive number when set.`);
		}
	}

	const reportPath = env.ALPHA_SMOKE_REPORT_PATH?.trim();
	if (reportPath && isConcreteEnvValue(reportPath) && /(^|[\\/])\.\.([\\/]|$)/.test(reportPath)) {
		throw new Error(`${label}: ALPHA_SMOKE_REPORT_PATH must not contain parent-directory segments.`);
	}
}

