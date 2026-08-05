# PHP hosting contract

Last updated: 2026-06-17

This document defines the production hosting assumptions for `sveltekit-php`. It borrows the useful parts of `adapter-node`, `adapter-static`, and Azure Static Web Apps configuration without pretending PHP shared hosting has the same platform features.

## PHP version floor

PHP **8.1+ is required** for the adapter's runtime compat layer (`php-compat.php` hard-exits with `This app requires PHP 8.1+.` below `SK_PHP_MIN_VERSION=80100`). The generator and this contract both target PHP 8.1+; older polyfill stubs are not shipped.

## Support levels

| Level | Meaning |
| --- | --- |
| Supported | The adapter currently generates or documents this behavior as part of the release contract. |
| Partial | The behavior exists in some modes or hosts, but needs stronger fixture coverage. |
| Not claimed | The adapter does not implement this and should not imply support. |

## Deployment modes

| Mode | Support | Contract |
| --- | --- | --- |
| `php-static` | Supported | Prerendered pages plus PHP data/action/endpoint helpers for shared hosting. Non-prerendered document routes are explicit client fallback pages, not PHP-side Svelte document SSR. |
| `js-ssr` | Partial | PHP entrypoint/proxy plus JavaScript SSR sidecar for real dynamic Svelte document SSR. This needs a deploy target that can run the sidecar process. |
| PHP-native Svelte document SSR | Not claimed | PHP cannot execute Svelte's generated JavaScript SSR module. Use `js-ssr` if request-time document SSR is required. |

## Public adapter options

These option names are the 1.x public adapter surface. New options can be added in minor releases, but removing or changing these names requires a breaking-change release.

| Option | Accepted values | Contract |
| --- | --- | --- |
| `mode` | `'php-static'` or `'js-ssr'` | Selects generated runtime mode. |
| `ssr` | `boolean` | Legacy/compatibility SSR toggle; prefer explicit `mode` for release claims. |
| `out` | `string` | Output directory for generated PHP/static build files. |
| `assets` | `string` | Asset output path when separate from `out`. |
| `precompress` | `boolean` | Enables generated precompressed assets where the host can serve them. |
| `fallback` | `boolean` or `string` | Enables app fallback; a string value sets a custom fallback filename (e.g. `custom-fallback.html`). Asset-like paths must still be excluded from HTML fallback. |
| `strict` | `boolean` | Keeps release and source-shape guards fail-fast. |
| `basePath` | `string` | Explicit deployment base path for subdirectory hosting. |
| `baseMode` | `'fixed'` or `'auto'` | Controls whether base behavior is fixed by config or inferred for supported flows. |
| `buildIdentity` | object or `false` | Optional required/forbidden marker contract for tenant/theme/static-shell validation. |

## Package exports and packed files

The npm package export contract is:

| Export | Target |
| --- | --- |
| `sveltekit-php` | `./adapter/index.js` |
| `sveltekit-php/adapter` | `./adapter/index.js` |

The package allowlist intentionally contains only runtime adapter code plus release/user documentation: `adapter/index.js`, `adapter/src/runtime/php-compat.php`, `LICENSE`, `README.md`, `package.json`, `docs/ADAPTER-FEATURE-CATALOG.md`, `docs/ADAPTER-LANDSCAPE.md`, `docs/ALPHA-LATEST-SVELTEKIT-AUDIT.md`, `docs/ALPHA-READINESS.md`, `docs/ALPHA-RELEASE-CHECKLIST.md`, `docs/DEV-ADAPTER-BOUNDARY.md`, `docs/HOSTING-CONTRACT.md`, `docs/REMOTE-FUNCTIONS-ALPHA-POLICY.md`, `docs/recipes/composer-bootstrap.md`, and `docs/recipes/wordpress.md`.

## Streaming and deferred data boundary

`php-static` does not claim exact SvelteKit/devalue streaming-deferred parity for request-time Svelte documents. Treat `php-static` as the shared-hosting mode for prerendered documents plus PHP data/action/endpoint helpers. If a route requires exact streamed Svelte document output, deferred chunk semantics, or request-time SSR parity, deploy it through `js-ssr` so the PHP entrypoint can proxy to the JavaScript SSR sidecar.

This boundary is intentional for 1.x stability. A future PHP-native streaming/deferred feature would need dedicated fixtures that compare emitted chunks, devalue serialization, hydration behavior, and hosted output against SvelteKit's JavaScript SSR behavior before it can be promoted.

## Origin and proxy headers

Use an explicit origin when the app is behind a proxy, CDN, or subdirectory deployment.

Recommended environment contract:

```powershell
$env:SK_ORIGIN = 'https://example.com'
$env:SK_TRUSTED_PROXY_HEADERS = 'false'
```

Future runtime knobs should follow the `adapter-node` model:

| Proposed variable | Purpose | Default posture |
| --- | --- | --- |
| `SK_ORIGIN` | Canonical public origin for redirects, form-action checks, and generated absolute URLs. | Prefer explicit production value. |
| `SK_PROTOCOL_HEADER` | Trusted header for original protocol, such as `X-Forwarded-Proto`. | Disabled unless explicitly trusted. |
| `SK_HOST_HEADER` | Trusted header for original host, such as `X-Forwarded-Host`. | Disabled unless explicitly trusted. |
| `SK_PORT_HEADER` | Trusted header for original port, such as `X-Forwarded-Port`. | Disabled unless explicitly trusted. |
| `SK_ADDRESS_HEADER` | Trusted client address header. | Disabled unless explicitly trusted. |
| `SK_XFF_DEPTH` | Number of trusted proxies when parsing `X-Forwarded-For` from the right. | Disabled unless explicitly configured. |

Do not trust forwarded headers on public shared hosting unless the host/CDN boundary is known. Spoofable proxy headers can cause bad redirects, bad form-action origin checks, and misleading client-address data.

## Base, deploy, and smoke environment names

These environment names are part of the release-prep/deploy contract. Committed examples must keep deployment secrets empty or placeholder-only.

| Variable | Owner | Purpose |
| --- | --- | --- |
| `SK_BASE_PATH` | Runtime/build verification | Base path used by PHP routing in subdirectory deployments. |
| `DEPLOY_BASE` | Deploy scripts | Public base path for guarded dev-host deployment. |
| `ADAPTER_MODE` | Build/deploy scripts | Selects `php-static` or `js-ssr` for scripted builds. |
| `ADAPTER_OUT` | Build/deploy scripts | Output directory override. |
| `ADAPTER_ASSETS` | Build/deploy scripts | Asset output override. |
| `SVELTEKIT_PHP_SAFE_EXTERNAL_ROOTS` | Build scripts | Semicolon-separated trusted parent roots for adapter output outside the project or OS temp directory. **WARNING:** these directories are passed to `fs.rmSync(..., { recursive: true })` during cleanup; a misconfigured value can delete unintended directory trees. Restrict this to adapter-output-specific paths and never point it at Documents/Desktop/Downloads/OneDrive/system roots. |
| `ADAPTER_BASE_MODE` | Build/deploy scripts | `fixed` or `auto` base handling. |
| `ADAPTER_FALLBACK` | Build/deploy scripts | Fallback behavior toggle. |
| `PRECOMPRESS` | Build/deploy scripts | Precompression toggle. |
| `DEPLOY_PROFILE` | Deploy scripts | Human label for deployment target. |
| `DEPLOY_HOST` | Deploy scripts | SSH/SFTP host. |
| `DEPLOY_USER` | Deploy scripts | SSH/SFTP user. |
| `DEPLOY_PORT` | Deploy scripts | SSH/SFTP port. |
| `DEPLOY_REMOTE` | Deploy scripts | Remote deployment directory. |
| `DEPLOY_LOCAL` | Deploy scripts | Local build directory to upload. |
| `DEPLOY_IDENTITY_FILE` | Deploy scripts | Optional SSH identity file. |
| `DEPLOY_THRESHOLD_FILES` | Deploy scripts | Safety threshold for file-count changes. |
| `DEPLOY_THRESHOLD_BYTES` | Deploy scripts | Safety threshold for byte-size changes. |
| `ALPHA_SMOKE_BASE_URL` | Hosted smoke | Real HTTP(S) deployment URL for hosted alpha/v1 gates. |
| `ALPHA_SMOKE_EXPECTED_VERSION` | Hosted smoke | Expected package/version marker. |
| `ALPHA_SMOKE_TIMEOUT_MS` | Hosted smoke | Request timeout override. |
| `ALPHA_SMOKE_REPORT_PATH` | Hosted smoke | Output path for smoke proof JSON. |

## Body size contract

PHP request body limits are controlled partly outside the adapter.

| Setting | Owner | Notes |
| --- | --- | --- |
| `post_max_size` | PHP config | Caps aggregate POST body size before application code receives it. |
| `upload_max_filesize` | PHP config | Caps individual uploaded files. |
| `max_input_vars` | PHP config | Caps parsed form variables. |
| `memory_limit` | PHP config | Caps memory available while parsing/serializing. |
| `SK_BODY_SIZE_LIMIT` | Future adapter/runtime knob | Should cap raw action parsing where PHP exposes enough information. |

Until `SK_BODY_SIZE_LIMIT` is implemented, production hosts should set conservative PHP limits and avoid accepting large uploads through the generic action bridge.

## Static assets versus PHP responses

Static asset headers are normally web-server owned. PHP response headers are application/runtime owned.

| Concern | Static files | PHP responses |
| --- | --- | --- |
| MIME types | Apache/Nginx config or host control panel. | `router_mime_type()` fallback when PHP serves the file. |
| Cache control | Apache/Nginx config preferred. | PHP endpoint/action/page code. |
| Security headers | Apache/Nginx/global host config preferred. | PHP endpoint/action/page code or generated router where safe. |
| Redirects | Apache/Nginx config preferred. | PHP router or endpoint responses. |
| Fallback routing | Apache/Nginx rewrite rules or generated `router.php`. | PHP router must not return route fallback HTML for asset-like paths. |

Adapter-emitted diagnostic headers:

| Header | Values | Meaning |
| --- | --- | --- |
| `X-SvelteKit-PHP-Page-Mode` | `client-fallback` | A non-prerendered `php-static` page is a client fallback shell, not PHP-side Svelte document SSR. |
| `X-SvelteKit-PHP-SSR` | `unsupported-in-php-static` | Use `js-ssr` when request-time Svelte document SSR is required. |

## Root compatibility router

The generated `build/router.php` owns runtime routing, path-safety checks, and fallback behavior. The repository root `router.php` is only a compatibility shim for PHP built-in server runs such as:

```powershell
php -S 127.0.0.1:8080 -t build router.php
```

The root shim must delegate with `return require $router_real;`, not a bare `require`. That return value matters because the generated router can return `false` to let PHP's built-in server serve an exact static file from the document root. If the shim swallows that value, manual root-router runs and direct generated-router runs can diverge.

Run `bun run verify:root-router-parity` after router changes. The verifier starts one PHP built-in server through the root shim and one through the generated router, then compares representative page, data, negotiation, missing-route, asset, protected-path, base-path, and encoded-traversal requests.

## MIME types to pin on weak hosts

Some shared hosts serve uncommon assets as `text/plain` or `application/octet-stream`. Pin these when the host allows it:

```apacheconf
AddType application/javascript .js .mjs
AddType text/css .css
AddType application/json .json .map
AddType application/manifest+json .webmanifest
AddType image/svg+xml .svg
AddType application/wasm .wasm
AddType font/woff2 .woff2
```

Nginx equivalents:

```nginx
types {
  application/javascript js mjs;
  text/css css;
  application/json json map;
  application/manifest+json webmanifest;
  image/svg+xml svg;
  application/wasm wasm;
  font/woff2 woff2;
}
```

## Fallback exclusions

Azure Static Web Apps has `navigationFallback.exclude`; PHP hosts need the same idea in router behavior.

Asset-like paths must either serve the real file or return a missing-file response. They must not receive the HTML route fallback.

Minimum excluded patterns:

```text
/_app/*
/*.js
/*.mjs
/*.css
/*.map
/*.json
/*.webmanifest
/*.svg
/*.wasm
/*.png
/*.jpg
/*.jpeg
/*.gif
/*.webp
/*.ico
/*.woff
/*.woff2
```

The hosted smoke script now probes missing asset-like paths and fails if they receive route fallback HTML.

## Security headers

Safe default guidance:

```apacheconf
Header set X-Content-Type-Options \"nosniff\"
Header set Referrer-Policy \"strict-origin-when-cross-origin\"
Header set X-Frame-Options \"SAMEORIGIN\"
```

Do not generate a default Content Security Policy in the adapter. CSP is app-specific and can break inline styles/scripts, analytics, CMS embeds, and SvelteKit runtime chunks if guessed.

## Trailing slash guidance

Use SvelteKit's `trailingSlash` option to match host behavior.

| Host behavior | Recommended SvelteKit option |
| --- | --- |
| Host serves `/about/index.html` for `/about/` | `trailingSlash = 'always'` |
| Host serves `/about.html` for `/about` | default or `trailingSlash = 'never'` |
| Mixed or unknown | Prefer explicit testing and avoid `ignore` for public SEO routes. |

## Stable-release host proof

Stable release proof must include:

```powershell
$env:ALPHA_SMOKE_BASE_URL = 'https://example.com/'
bun run v1:gate:hosted
```

That hosted target must prove:

- home page loads as HTML
- alpha readiness endpoints load with expected content types
- `csr=false` no-hydration fixture has `csr-disabled-prerender-contract` / `theme-stable-ssr-html` markers and no client hydration markers (`<script`, `sveltekit:start`, or `data-sveltekit-hydrate`)
- `/form-basic` POST action works
- `php-static` client-fallback headers are present where expected
- traversal probes do not expose source/env/package files
- missing asset-like paths do not receive route fallback HTML
