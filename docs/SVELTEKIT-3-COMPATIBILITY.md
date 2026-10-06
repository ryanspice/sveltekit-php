# SvelteKit 3 compatibility and CoS integration

Date: 2026-10-06. Local candidate: **1.1.0-alpha.0**, unpublished.

## API and release verification

Official sources: [Kit 3 migration](https://svelte.dev/docs/kit/migrating-to-sveltekit-3), [writing adapters](https://svelte.dev/docs/kit/writing-adapters), and installed official `@sveltejs/kit@3.0.1` builder/types. Registry metadata checked on this date: Kit 3.0.1, Svelte 5.57.1, Vite 8.3.3, vite-plugin-svelte 7.3.1, adapter-node 6.0.0, adapter-static 4.0.0. npm's `sveltekit-php` latest tag resolves to 1.0.1; this local candidate has not been published.

Kit 3 requires Node >=22.17, Svelte >=5.57.1, Vite >=8.0.12, plugin 7 and TypeScript 6. Adapter/Builder types still come from `@sveltejs/kit`. Builder config is flat; `generateManifest` is removed and `generateServerInstance` writes a server object. The adapter detects these APIs and retains its Kit 2 bootstrap. Config normalization uses a separate facade and preserves upstream methods.

## Focused acceptance matrix

Run `bun run build:adapter` followed by `node scripts/smoke-kit-compatibility.mjs`. The latter packs the actual package and installs exact versions into temporary projects; it never builds CoS. Results are written to `report/kit-compatibility.json` (ignored local evidence). `--keep` preserves fixture output for inspection.

| Consumer fixture | Build toolchain | php-static | js-ssr |
| --- | --- | --- | --- |
| Kit 2.49.2 | Svelte 5.57.1, Vite 7.2.6, plugin 6.2.1, TS 5.9.3 | Root and `/sites/cos` | Root and `/sites/cos` |
| Kit 3.0.1 | Svelte 5.57.1, Vite 8.3.3, plugin 7.3.1, TS 6.0.3 | Root and `/sites/cos` | Root and `/sites/cos` |

The fixtures verify both package exports against the official Adapter type, a custom route directory and `appDir: 'cos-app'`, prerendered pages with `csr=false`, static JSON, exact public asset bytes, Brotli/gzip output, build stamps, generated PHP syntax, PHP endpoint dispatch, and protected/missing-asset handling. Sidecar acceptance covers request-time SSR, Node filesystem reads, `$app/server.read` assets, instrumentation before app execution, cookies, same-origin POST bodies and PHP proxy requests. Local runtime: Node 26.7.0 and PHP 8.5.4. Existing Kit 2 development dependencies and source application stay locked; the peer range becomes `^2.0.0 || ^3.0.0`.

This does not claim PHP-native JavaScript SSR, arbitrary Node endpoint translation, remote functions, host deployment acceptance, or complete CoS acceptance. Remote modules, including Kit 3 runes filenames, remain blocked.

Local source checks: 130 unit tests pass; adapter JS/declaration builds, strict artifact sync, PHP redeclaration smoke and all 19 release-preparation checks pass. `bun run check` reports one existing error in the pre-existing dirty `tests/unit/rc-consumer-evidence.test.ts`: its inferred consumer type lacks `mirrorUrl`. That file belongs to another workstream and was preserved. Hosted gates, whole CoS production builds and CoS browser acceptance were not run. LAN5173 responded HTTP 200 after this work.

## Kit 3 configuration

```js
// vite.config.js
import { sveltekit } from '@sveltejs/kit/vite';
import adapter from 'sveltekit-php';

export default {
  plugins: [sveltekit({
    adapter: adapter({ mode: 'php-static', out: 'build', assets: 'build', strict: true }),
    paths: { base: '/sites/cos' },
    prerender: { entries: ['/', '/marketing'], crawl: false }
  })]
};
```

Use an empty base for root hosting. Kit 2 continues to use its existing `svelte.config.js` configuration. On Kit 3 use `asset('logo.svg')`; Kit 2 uses `asset('/logo.svg')`. Kit 3 consumer migration also removes `$app/stores`, renames `$app/environment` and replaces `$lib`; adapter compatibility cannot rewrite application imports.

## CoS recommendation

Keep the current build split in `apps/cos-app/vite.config.ts`:

- `COS_MARKETING_PHP=1`: select `src/php-marketing-routes`, `.svelte-kit-marketing-php`, `build-marketing-php`, and this adapter in `php-static` mode. Preserve `COS_MARKETING_BASE` as empty or `/sites/cos`, the existing public marketing asset transform and custom appDir. Use `COS_PHP_ADAPTER` to point to this candidate's generated `adapter/index.js` for a later coordinated acceptance build.
- Normal app: keep its Node-capable runtime. `ride/endpoint/[...path]/+server.ts` reads the locked native checkout and CoS bridge files, while dev catalogue/render/provenance routes read repository files. Those remain request-time Node endpoints and are not translated to PHP by `php-static`.

One adapter package can generate both PHP marketing and a Node sidecar app, using **different modes/builds**. Switching the normal CoS app to `js-ssr` would require a persistent Node process behind PHP, server dependencies, correct repository/native checkout availability and dedicated acceptance. It is not a pure-PHP deployment and is not proven for CoS by these fixtures. Retain adapter-auto/current Node deployment for the normal app until its integration owner requests that migration.

No CoS package, lock or config writes are part of this adapter change. Whole CoS production builds are deferred to appv1.0.0 consolidation. The normal application's LAN5173 process is not restarted or replaced.

## Changed files owned by this task

- Adapter source: `adapter/src/index.ts`, `adapter/src/types.ts`, `adapter/src/utils/builder.ts`, `adapter/src/utils/guards.ts`, `adapter/src/runtime/js-ssr-templates.ts`.
- Generated artifacts: `adapter/index.js`, `adapter/declarations/utils/builder.d.ts`, `adapter/declarations/runtime/js-ssr-templates.d.ts`.
- Package and docs: `package.json`, `bun.lock` (root peer metadata only), `README.md`, `CHANGELOG.md`, `docs/SVELTEKIT-3-COMPATIBILITY.md`.
- Acceptance and release checks: `scripts/smoke-kit-compatibility.mjs`, `scripts/smoke-latest-same-major.mjs`, `scripts/smoke-latest-vite-major.mjs`, `scripts/verify-alpha-readiness.mjs`, `scripts/verify-alpha-release-prep.mjs`.
- Release metadata and assertions: `src/lib/alpha-readiness.ts`, `src/lib/alpha-release-manifest.ts`, `src/lib/alpha-release-notes.ts`, `tests/unit/alpha-readiness.test.ts`, `tests/unit/kit-builder.test.ts`.

The two existing latest-major smoke scripts now explicitly query latest Kit 2, preserving their historical lane after npm's latest tag moved to Kit 3. The new pinned matrix is the Kit 3 acceptance lane. The former live/latest-smoke commands were not rerun in this task; their API change is limited to version resolution. Other dirty files and sidecars observed at initial inspection were left untouched. Initial Git state: `main`, HEAD `3c7da04af47d9417e26753dcaf846d169cc34d3d`; no commit, push or publication.
