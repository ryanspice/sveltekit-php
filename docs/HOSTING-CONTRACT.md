# PHP hosting contract

Last updated: 2026-06-17

This document defines the production hosting assumptions for `sveltekit-php`. It borrows the useful parts of `adapter-node`, `adapter-static`, and Azure Static Web Apps configuration without pretending PHP shared hosting has the same platform features.

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
- `csr=false` no-hydration fixture has no client hydration markers
- `/form-basic` POST action works
- `php-static` client-fallback headers are present where expected
- traversal probes do not expose source/env/package files
- missing asset-like paths do not receive route fallback HTML
