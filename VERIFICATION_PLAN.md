# Verification Plan

## Overview
We verify the adapter works in two modes:
1. **php-static**: Prerendered pages + PHP data bridge + PHP actions.
2. **node-ssr**: PHP proxy + Node SSR sidecar.

## Automated Verification
Run `node scripts/verify-comprehensive.mjs [--mode=node-ssr]` to run the suite.

## Test Cases

### Common
- **Root Page**: Serves HTML with correct title.
- **Matrix Routes**:
  - `ssr-on`: Server data injected into HTML.
  - `ssr-off`: No server data in HTML; client fetches `__data.json`.
  - `ts-never`: Trailing slash behavior.
  - `mixed`: Layout/page override behavior.
- **Base Path**: Assets and links respect `kit.paths.base`.

### Mode A: `php-static`
- **Bridge**: `__data.json` requests are rewritten to `__data.php` and return JSON.
- **Actions**: Form posts work via PHP logic.
- **Prerendering**: All pages must be prerendered (except API endpoints).

### Mode B: `node-ssr`
- **Dynamic SSR**: `prerender=false` routes are rendered on-demand by Sidecar.
- **Streaming**: Responses are streamed (chunked transfer encoding) via PHP proxy.
- **PHP APIs**: `+server.php` endpoints are served by PHP directly (not proxied).
- **Cookies**: `Set-Cookie` headers from Sidecar and PHP APIs are preserved.
- **Proxy**: Method, Headers, and Status codes are preserved.
