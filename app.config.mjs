import adapter from 'sveltekit-php';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { normalizeAdapterMode, normalizeBase } from './scripts/utils/config.mjs';

/**
 * Build the same application options for development, verification and every hosting mode.
 * @param {Record<string, string | undefined>} [env]
 */
export function createAppConfig(env = process.env) {
	const mode = normalizeAdapterMode(env.ADAPTER_MODE || 'php-static');
	const baseMode = env.ADAPTER_BASE_MODE || 'fixed';
	if (baseMode !== 'fixed' && baseMode !== 'auto') {
		throw new Error(`Unsupported adapter base mode: ${baseMode}`);
	}
	const debugEnabled = env.SK_DEBUG === 'true' || env.ADAPTER_DEBUG === 'true';

	// Use centralized resolution logic
	// Priority: SK_BASE_PATH > DEPLOY_BASE > Default ('')
	const base = /** @type {'' | `/${string}`} */ (
		normalizeBase(env.SK_BASE_PATH ?? env.DEPLOY_BASE)
	);

	// Only set assets URL if ADAPTER_ASSETS is explicitly provided AND is a URL.
	// Default 'build' is only for adapter output, not for paths.assets.
	function normalizeAssets(/** @type {string | undefined} */ raw) {
		if (!raw) return '';
		let a = String(raw).trim();
		if (a === '/' || a === '.') return '';
		// if it is a URL, return it as is (strip trailing slash)
		if (/^https?:\/\//.test(a)) {
			return a.replace(/\/+$/, '');
		}
		// strip trailing slash(es)
		a = a.replace(/\/+$/, '');
		// ensure leading slash if non-empty
		if (a && !a.startsWith('/')) a = '/' + a;
		return a;
	}

	const rawAssets = env.ADAPTER_ASSETS ? normalizeAssets(env.ADAPTER_ASSETS) : undefined;
	const assets = /** @type {`http://${string}` | `https://${string}` | undefined} */ (
		rawAssets && /^https?:\/\//.test(rawAssets) ? rawAssets : undefined
	);
	if (debugEnabled) {
		process.stdout.write(`[app.config.mjs] ENV ADAPTER_OUT: ${env.ADAPTER_OUT ?? ''}\n`);
		process.stdout.write(`[app.config.mjs] ENV ADAPTER_ASSETS: ${env.ADAPTER_ASSETS ?? ''}\n`);
		process.stdout.write(`[app.config.mjs] ENV ADAPTER_FALLBACK: ${env.ADAPTER_FALLBACK ?? ''}\n`);
		process.stdout.write(`[app.config.mjs] Resolved BASE: ${base}\n`);
	}

	/** @type {import('@sveltejs/kit/vite').Config} */
	const config = {
		preprocess: vitePreprocess(),

		outDir: env.SVELTEKIT_OUTDIR ?? '.svelte-kit',
		paths: {
			base,
			relative: false,
			assets
		},

		adapter: adapter({
			mode,
			baseMode,
			basePath: base, // keep adapter in sync with paths.base
			ssr: true,
			out: env.ADAPTER_OUT || 'build',
			assets: env.ADAPTER_ASSETS || 'build',
			precompress: env.PRECOMPRESS === 'true',
			fallback: env.ADAPTER_FALLBACK
				? env.ADAPTER_FALLBACK === 'true'
					? true
					: env.ADAPTER_FALLBACK
				: false,
			strict: true
		}),

		prerender: {
			handleHttpError: 'warn',
			entries: [
				'/',
				'/alpha-readiness',
				'/alpha-readiness/report.json',
				'/alpha-readiness/report.html',
				'/alpha-readiness/report.md',
				'/alpha-readiness/release-notes.md',
				'/alpha-readiness/report.svg',
				'/alpha-readiness/community-source-map.svg',
				'/alpha-readiness/release-manifest.json',
				'/alpha-readiness/gate-matrix.json',
				'/alpha-readiness/evidence-index.json',
				'/alpha-readiness/package-contract.json',
				'/alpha-readiness/native-host-contract.json',
				'/alpha-readiness/native-host-wrapper-smoke.json',
				'/alpha-readiness/hosted-smoke-checklist.json',
				'/alpha-readiness/bridge-reuse.json',
				'/alpha-readiness/review-index.md',
				'/alpha-readiness/community-signals.json',
				'/alpha-readiness/community-analytics.md',
				'/alpha-readiness/community-research-pack.json',
				'/alpha-readiness/readiness.csv',
				'/alpha-readiness/community-signals.csv',
				'/alpha-readiness/community-sources.csv',
				'/blog/hello-world',
				'/blog/sveltekit-php',
				'/path-viewer',
				'/path-viewer/docs/readme.md',
				'/path-viewer/assets/image.png',
				'/optional/test-id',
				'/layout/parent/child/grandchild',
				'/ssg/simple',
				'/ssg/nested/child',
				'/ssr/basic',
				'/ssr/stream',
				// '/negotiate', // SSR for negotiation test
				'/parent-child/nested',
				'/ssr-data',
				'/stream',
				'/test-js',
				'/status',
				'/client-side',
				'/preload',
				// '/form-basic', // Cannot prerender pages with actions
				// '/form-multipart',
				'/api/demo',
				'/matrix/dynamic-ssr',
				'/matrix/mixed/page-ssr-off',
				'/matrix/ssr-off',
				'/matrix/ssr-on',
				'/matrix/ts-never'
			]
		}
	};

	return config;
}
