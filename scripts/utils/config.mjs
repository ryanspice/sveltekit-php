// scripts/utils/config.mjs

import { config as loadEnv } from 'dotenv';
loadEnv();

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

export function normalizeAdapterMode(raw = 'php-static') {
	const mode = String(raw || 'php-static').trim();
	if (mode === 'php-static' || mode === 'js-ssr') return mode;
	throw new Error(`Unsupported adapter mode: ${mode}`);
}

/**
 * Get environment variables for a specific build mode.
 * Useful for ensuring scripts run with consistent configuration.
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
