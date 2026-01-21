# Verification Plan — SvelteKit PHP Adapter (php-static + js-ssr)

This document outlines the verification strategy for ensuring correctness of the SvelteKit PHP Adapter across **two deploy modes**:

- **Mode A: `php-static`** — prerender + hydration + PHP bridge for `__data.json` and actions/endpoints.
- **Mode B: `js-ssr`** — PHP front + **JS SSR sidecar** (Node/Bun) running the SvelteKit server bundle (`server.respond(...)`) for true SSR + streaming.

It also verifies **base-path mounting** (e.g. `/sveltekit-php`) so the output can be deployed at `mark8t.ca/sveltekit-php` without broken links/assets/data requests.

---

## Overview

Verification is performed via `scripts/verify-comprehensive.mjs`, which runs E2E tests against locally started servers that mimic production wiring:

- **Always run a PHP server** in verification (it is the public entrypoint in both modes).
- In `js-ssr` mode, also run the **sidecar SSR server** and ensure requests flow **through PHP proxying** (so headers/cookies/streaming are validated in the real topology).

The suite focuses on:

- `__data.json` availability and shape (no bundle patching)
- layout/page data merging
- redirects + status codes + base-path correctness
- actions (including multipart)
- endpoints + content negotiation (`+page` vs `+server`)
- cookies (`Set-Cookie` preservation)
- streaming behavior (real in `js-ssr`, best-effort in `php-static`)

---

## Test Matrix (authoritative)

| Capability                        |                   php-static |                                                 js-ssr |
| --------------------------------- | ---------------------------: | -----------------------------------------------------: |
| Prerendered HTML                  |                  ✅ required |                                           ✅ supported |
| Client hydration (CSR)            |                           ✅ |                                                     ✅ |
| `__data.json` navigation endpoint |    ✅ via PHP bridge/rewrite |                        ✅ native (proxied through PHP) |
| On-demand SSR                     |         ❌ (build-time only) |                                                     ✅ |
| Streaming (promises/flush)        |                  best-effort |                             ✅ (proxy must not buffer) |
| Content negotiation (`Accept`)    | ✅ implemented by PHP router | ✅ (prefer sidecar rules, still validate via PHP path) |

---

## Environments Under Test

### Base-path deployment

All tests run under a configurable base path (default: `/sveltekit-php`). The verification script must prepend this base to every request and validate that redirects, asset URLs, and data endpoints respect it.

### Mode A (`php-static`) server topology

- Build output served by **PHP built-in server** (or PHP-FPM equivalent in CI).
- PHP router serves:
  - prerendered pages
  - static assets (`_app/*`)
  - `__data.json` via rewrite/bridge to PHP handler
  - actions/endpoints

### Mode B (`js-ssr`) server topology

- Start SSR sidecar (Node/Bun) on an internal port (e.g. `127.0.0.1:3010`).
- Start PHP server as the public entrypoint (e.g. `127.0.0.1:8086`) that:
  - serves static assets directly
  - passes `/api/*` to PHP endpoints
  - **reverse-proxies everything else** under the base path to the sidecar (including `__data.json`, actions, and HTML)
- Verification always targets the **PHP** port (never the sidecar directly), so proxy semantics are tested.

---

## Test Scenarios (authoritative)

### 0) Base Path Mount Sanity (P0)

- Verify root under base loads: `GET {base}/` returns 200.
- Verify links and asset URLs include the base prefix (no root-relative leaks).
- Verify redirects include the base prefix in `Location` headers.

### 1) Root Page Rendering & Hydration Marker (P0)

- `GET {base}/` returns 200.
- HTML contains `<meta name="adapter-test" ...>` marker.
- HTML contains a stable `<pre id="adapter-out">...</pre>` payload.

### 2) `__data.json` Availability (P0)

- Fetch `{base}/__data.json` (or route-specific `__data.json`) to simulate client navigation.
- Verify JSON content-type and SvelteKit “data” envelope shape (`type: "data"`, `nodes: [...]`).
- **Assertion:** No test uses `__data.php` (the client expects `__data.json`; php-static must bridge it).

### 3) Global Layout Data Merging (P0)

- Fetch `{base}/__data.json` for a route with layout + page data.
- Verify global layout keys (e.g., `app_name`, `global_layout_loaded`) appear.
- Verify node ordering and merge semantics are preserved (root layout → nested layout → page).

### 4) Nested Layout Merge Precedence (P0)

- Route: `{base}/parent-child/nested/`
- Verify deep merge from:
  - root layout
  - parent layout (`layout_level_1`)
  - page (`nested`)
- **Precedence:** page values override layout values on key collisions.

### 5) SSR Data Injection / No-Flicker Contract (P0)

- Route: `{base}/ssr-data`
- In **js-ssr** mode:
  - initial HTML must contain the server-derived data (no “waiting” placeholders).
- In **php-static** mode:
  - prerendered HTML must contain the stable payload OR bootstrap logic must render without a “waiting” fallback flash.
- Verify response is cache-safe as expected (no unintended variance).

### 6) Redirect Semantics + Data Propagation (P0)

- Route: `{base}/redirect-me/`
- Verify:
  - 30x status (e.g., 302)
  - `Location` includes `{base}/ssr-data` and query params
- Follow redirect and verify destination page renders propagated query parameters.

### 7) Content Negotiation (`+page` vs `+server`) (P0)

- Route: `{base}/negotiate`
- Verify routing rules using method + `Accept`:
  - `GET` with `Accept: text/html` → page response (HTML)
  - `GET` with `Accept: application/json` → server response (JSON)
  - `POST` with `Accept: text/html` → page (if applicable) else server per fixture design
  - `PUT/PATCH/DELETE/OPTIONS` → always server response
- Verify `GET` responses include `Vary: Accept`.

### 8) Form Actions (P0)

- Route: `{base}/form-basic`
- Test standard POST (non-enhanced) and enhanced-style POST (`x-sveltekit-action` header).
- Verify JSON action response shape and that page form state can be derived.
- Verify failure action returns expected status/keys and does not crash.

### 9) Cookies Roundtrip (P0)

- Route: `{base}/api/cookie` (or equivalent endpoint)
- Verify:
  - `Set-Cookie` is emitted properly
  - subsequent request includes `Cookie` and server reads it
- In **js-ssr** mode, verify cookies survive PHP proxying unchanged (no header collapsing).

### 10) API Routes (P0)

- Route: `{base}/api/ping`
- Verify:
  - JSON `Content-Type`
  - stable body `{ ok: true }` (or fixture’s stable payload)

### 11) Multipart Uploads (P1)

- Route: `{base}/form-multipart`
- Submit `FormData` including a file.
- Verify file metadata extraction and parameter extraction.
- Ensure request body parsing aligns with expected PHP mappings (no silent truncation).

### 12) Error Handling (P1)

- Verify 404 for non-existent routes under base.
- Verify 500 for route that intentionally throws (`{base}/error-throw`).
- Ensure error responses have stable markers for assertions (avoid random stack traces in prod mode).

### 13) Streaming (P2)

- Route: `{base}/stream`
- In **js-ssr** mode:
  - verify streamed response behavior via incremental reads (chunk timing/order best-effort).
  - verify response contains expected chunk markers in order.
- In **php-static** mode:
  - verify response completes and contains expected markers.
  - if buffering prevents chunk timing assertions, the test is format-only and the limitation must be documented.

### 14) JavaScript-Only Route (Prerendering) (P2)

- Route: `{base}/test-js/`
- Verify prerender still works for routes without PHP server modules.

---

## Running the Verification

The verification script should accept a mode and base-path configuration (CLI flags or env vars). Examples:

```bash
# Mode A: php-static
bun scripts/verify-comprehensive.mjs --mode=php-static --base=/sveltekit-php --port=8086

# Mode B: js-ssr (PHP front + sidecar)
bun scripts/verify-comprehensive.mjs --mode=js-ssr --base=/sveltekit-php --phpPort=8086 --ssrPort=3010
```

What the script does (high level):

1. Build the adapter package (if needed).
2. Build the SvelteKit app using the adapter (mode-specific output).
3. Start servers:
   - always start PHP server
   - start SSR sidecar in `js-ssr` mode
4. Run the scenario suite against the PHP entrypoint.
5. Report PASS/FAIL per scenario.

---

## Fixture App Structure (expected)

- `src/routes/+page.svelte`: root marker + stable JSON
- `src/routes/ssr-data/*`: SSR data contract route
- `src/routes/redirect-me/*`: redirect test route
- `src/routes/parent-child/nested/*`: nested layout merge test
- `src/routes/data-endpoint/*`: asserts `__data.json` navigation fetch works
- `src/routes/form-basic/*`: actions test (success/failure)
- `src/routes/form-multipart/*`: multipart action test
- `src/routes/negotiate/*`: `+page.*` and `+server.*` coexistence for Accept negotiation
- `src/routes/base-path/*`: asserts correct behavior under `kit.paths.base`
- `src/routes/stream/*`: streaming test route
- `src/routes/test-js/*`: JS-only prerender test
- `src/routes/api/ping/*`: JSON API test
- `src/routes/api/cookie/*`: cookie set/read test
- `src/routes/error-throw/*`: 500 error test
