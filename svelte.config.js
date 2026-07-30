import adapter from './adapter/index.js';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { normalizeAdapterMode, normalizeBase } from './scripts/utils/config.mjs'; // Use centralized config

const mode = normalizeAdapterMode(process.env.ADAPTER_MODE || 'php-static');
const baseMode = process.env.ADAPTER_BASE_MODE || 'fixed';
const debugEnabled = process.env.SK_DEBUG === 'true' || process.env.ADAPTER_DEBUG === 'true';

// Use centralized resolution logic
// Priority: SK_BASE_PATH > DEPLOY_BASE > Default ('')
const base = normalizeBase(process.env.SK_BASE_PATH ?? process.env.DEPLOY_BASE);

// Only set assets URL if ADAPTER_ASSETS is explicitly provided AND is a URL.
// Default 'build' is only for adapter output, not for paths.assets.
function normalizeAssets(raw) {
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

const rawAssets = process.env.ADAPTER_ASSETS
	? normalizeAssets(process.env.ADAPTER_ASSETS)
	: undefined;
const assets = rawAssets && /^https?:\/\//.test(rawAssets) ? rawAssets : undefined;
if (debugEnabled) {
	process.stdout.write(`[svelte.config.js] ENV ADAPTER_OUT: ${process.env.ADAPTER_OUT ?? ''}\n`);
	process.stdout.write(`[svelte.config.js] ENV ADAPTER_ASSETS: ${process.env.ADAPTER_ASSETS ?? ''}\n`);
	process.stdout.write(`[svelte.config.js] ENV ADAPTER_FALLBACK: ${process.env.ADAPTER_FALLBACK ?? ''}\n`);
	process.stdout.write(`[svelte.config.js] Resolved BASE: ${base}\n`);
}

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		outDir: process.env.SVELTEKIT_OUTDIR ?? '.svelte-kit',
		paths: {
			base,
			relative: false,
			assets
		},

		adapter: adapter({
			mode,
			baseMode,
			basePath: base, // keep adapter in sync with kit.paths.base
			ssr: true,
			out: process.env.ADAPTER_OUT || 'build',
			assets: process.env.ADAPTER_ASSETS || 'build',
			precompress: process.env.PRECOMPRESS === 'true',
			fallback: process.env.ADAPTER_FALLBACK
				? process.env.ADAPTER_FALLBACK === 'true'
					? true
					: process.env.ADAPTER_FALLBACK
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
	}
};

export default config;
