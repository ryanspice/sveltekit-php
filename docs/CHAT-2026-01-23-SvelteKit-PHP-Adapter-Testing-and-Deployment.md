# Chat Summary — 2026-01-23
## Topic
SvelteKit PHP adapter review, refactor plan, Apache deployment requirements, and Trae AI test prompts (Playwright) to validate fixes.

---

## What you shared
- A large `adapter/src/index.ts` implementing two modes:
  - **php-static**: prerender output + PHP runtime shims and route files.
  - **node-ssr**: Node sidecar SSR + PHP proxy entrypoint, plus direct PHP `+server.php` endpoints.
- Current adapter folder structure showing `src/index.ts`, runtime templates, and utils.

---

## Key findings (bugs / risks)
### Must-fix issues
1) **node-ssr: `assetsDir !== outDir` breaks runtime**
- Current behavior writes client assets to `assetsDir` but serves from `outDir`, causing missing JS/CSS.
- Proposed fix: in node-ssr, ensure client assets are written into `outDir` (or enforce `assetsDir = outDir`).

2) **Fragile `__sveltekit_*` object patch**
- Regex-replacing the object literal can clobber fields and break when HTML formatting changes.
- Proposed fix: **inject a script that mutates the existing object** (`defer/resolve` polyfill), no object-literal replacement.

3) **Content negotiation collision for sibling pages**
- When pages output as `/route.php` but runtime files are `/route/__data.php`, moving the page into `/route/_page.php` can break relative bootstrap assumptions.
- Proposed fix: **normalize to directory-form output** (e.g., `route/index.php`) so runtime files live with the page.

4) **`fallback` option is effectively a no-op**
- Adapter warns but doesn’t actually emit fallback content or route unknown paths to it.
- Proposed fix: thread fallback into output + `.htaccess` routing (or `kit.prerender.fallback` coordination).

5) **Shim generation special-casing `/api` is dangerous**
- Endpoints are not required to live under `/api`.
- Proposed fix: classify endpoints by file presence/route metadata (`+server.*`), not URL prefix.

### High-risk items
- **`nodeCount` inference from HTML** via `node_ids:` regex may break with future Kit output changes.
- **Renaming `__data.json` → `__data.template.json`** is only safe if rewrites for `__data.json` are airtight.

---

## Refactor plan (recommended file split)
### Goals
- Isolate pipelines per mode (php-static vs node-ssr).
- Scan routes/conflicts once and reuse.
- Make per-route work “pure-ish” functions.
- Centralize filesystem output policy (layout).
- Deduplicate helpers and add caching where it matters.

### Proposed structure
```
adapter/src/
  core/ (options, context, io, php74)
  steps/ (clean, client, prerender, runtime, compress)
  routes/ (scan, conflicts, maps, deps)
  modes/
    php-static/
      page/ (process, data-template, html-patch, layout)
      api/ (generate)
      shims/ (nonprerendered)
      protect/ (convert)
      finalize.ts
    node-ssr/
      server/ (bundle)
      php/ (proxy, endpoints)
      finalize.ts
```

### The “save your sanity” module
- `layout.ts`: enforce **directory-form output** everywhere:
  - `about.html` → `about/index.php`
  - co-locate `__data.php` and `__action.php` beside `index.php`
  - negotiation always handled by route-local `index.php`

---

## Apache + PHP deployment requirements (root vs subpath)
### Server requirements
- Apache: `mod_rewrite` enabled, `AllowOverride` permits `.htaccess`.
- Disable MultiViews: `Options -MultiViews`.
- PHP 7.4+.

### Optimal build output structure
```
build/
  .htaccess
  router.php
  _runtime/compat.php
  _protected/.htaccess + namespaced modules
  assets/immutable client files
  <routes...>/index.php + __data.php + __action.php
```

### Root deploy
- Build with `basePath=""`, upload build contents to web root.

### Subpath deploy (e.g. `/dev/sveltekit`)
- Prefer building with `basePath="/dev/sveltekit"` and uploading build to:
  - `public_html/dev/sveltekit/`
- Ensure `.htaccess` is base-aware and rewrites `__data.json` to PHP.

---

## Trae AI prompts created (tests + proofs)
### Prompt 1 (you ran this)
- Node-SSR assetsDir/outDir regression test + fix, with Playwright proof.

### Prompt 2
- Replace fragile `__sveltekit_*` regex patch with safe injection + Playwright proof of client navigation + data fetch.

### Prompt 3
- Directory-form output + negotiation + fallback + remove `/api` special-case, with Playwright tests for structure and HTTP behavior.

---

## Recommended Trae AI agents
- **Prompt 2:** **GPT-5.2**
- **Prompt 3:** **Gemini 3 Pro 200k** if you provide lots of repo context/files; otherwise **GPT-5.2**.

---

## Process preference recorded
- Any future Trae AI prompts requested should be prefaced with:
  - `Recommended agent: <GPT-5.2 | Gemini 3 Pro 200k | Kimi>`
