# SvelteKit PHP Adapter Instructions

This repo ships a custom SvelteKit adapter that targets **PHP hosting** and supports two deploy styles:

- **Mode A: `php-static`**: prerendered HTML + client assets, with **PHP bridges** for `__data.json`, actions, and endpoints.
- **Mode B: `node-ssr`**: **PHP is the public entrypoint**, but a **Node/Bun “SSR sidecar”** runs the SvelteKit server output for **true SSR + streaming**, and PHP (or Apache/Nginx) reverse-proxies HTML/data/action requests to it.

Adapters are build-time plugins and must use SvelteKit’s adapter contract (`adapt(builder)` and builder outputs).

---

## Key ideas you must not fight

### 1) `__data.json` is real

SvelteKit’s client navigation expects `__data.json` to exist. In `php-static`, **do not patch bundles**. Serve `__data.json` via a **rewrite/bridge** to PHP.

### 2) Subpath deployments need `kit.paths.base`

If you deploy to `mark8t.ca/sveltekit-php`, set:

- `kit.paths.base = '/sveltekit-php'` (must start with `/` and must not end with `/`).
- Use `$app/paths` to build URLs safely (e.g. `resolve()` / `asset()`).

### 3) Content negotiation is not optional

If a route has both a page and an endpoint, you must route based on HTTP method + `Accept` header. This is standard HTTP content negotiation.

### 4) Production-Grade HTTP Behavior

The adapter now supports:

- **HEAD requests**: Correctly handled in both modes (no body, correct Content-Length).
- **Precompression**: Generates `.htaccess` rules for Brotli/Gzip content negotiation (if `precompress: true`).
- **Cache Control**: Sane defaults for immutable assets (1 year), mutable assets, and HTML/PHP pages (no-store).

---

## Configuration

### `svelte.config.js`

```js
import adapter from './adapter/dist/index.js';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		paths: {
			base: '/sveltekit-php'
		},
		adapter: adapter({
			mode: 'php-static', // or 'node-ssr'
			out: './build',
			assets: './build',
			precompress: true // Enable precompression support
		})
	}
};

export default config;
```

> `mode='php-static'` is “prerender + bridge”, not on-demand SSR.

---

## Mode B: `node-ssr` (Hybrid)

In this mode, PHP serves as the primary entrypoint (handling static files, PHP APIs, and legacy logic) but proxies SvelteKit **page/data/action** requests to a **Node/Bun sidecar** that performs true SSR and streaming. `+server.php` endpoints remain in PHP.

### 1. Build

Set `mode: 'node-ssr'` in `svelte.config.js` (or via `ADAPTER_MODE` env var).
The build output will be:

- `build/index.php`: The proxy script.
- `build/server/handler.mjs`: The Node sidecar entrypoint.
- `build/server/index.js`: The SvelteKit server bundle.
- `build/.htaccess`: Apache rules to route requests (supports subdirectory deployment).
- `build/_app/**`: Client assets.
- `build/prerendered/**`: Prerendered content (if any).
- `build/api/**/index.php`: PHP API endpoints (wrapped).

### 2. Run the Sidecar

You must run the sidecar process alongside your PHP server.

```bash
# Using Node
PORT=3000 node build/server/handler.mjs

# Using Bun
PORT=3000 bun run build/server/handler.mjs
```

Ensure the port matches what `index.php` expects (default 3000).

### 3. PHP Server Config

- Point your web server (Apache/Nginx) docroot to `build/` (or the parent directory if deploying to subdirectory).
- Ensure `mod_rewrite`, `mod_headers`, and `mod_mime` are enabled (for Apache).
- The generated `.htaccess` handles routing:
  1. Serves static files directly (with precompression support).
  2. Serves existing PHP files (e.g. `api/cookie/index.php`).
  3. Proxies everything else to `index.php` -> Sidecar.

### 4. Base Path & Subdirectory Deployment

If deploying to a subdirectory (e.g. `/sveltekit-php`), set `kit.paths.base` in `svelte.config.js`. The adapter generates `.htaccess` rules that work **without** a hardcoded `RewriteBase`, allowing flexible deployment. The PHP proxy automatically handles base path stripping when forwarding to the sidecar.

### 5. Streaming & Buffering

The generated PHP proxy disables PHP output buffering (`ini_set('output_buffering', '0')`) to support streaming responses.
However, your web server (Apache/Nginx) might still buffer responses.

- **Apache**: Ensure `mod_proxy` buffering is disabled or configured correctly if using it directly. If using the PHP script as a proxy, Apache usually streams PHP output if PHP flushes it.
- **Nginx**: You may need `fastcgi_buffering off;` or `proxy_buffering off;` for streaming routes.

### 6. PHP APIs

Standard `+server.php` files are supported. The adapter wraps them to be runnable directly by PHP. They are **NOT** proxied to the sidecar; only page/data/action traffic is proxied.

---

## Authoring server logic in PHP

### Page data + actions: `+page.server.php`

Create `src/routes/foo/+page.server.php` next to your `+page.svelte`.

- `function load($event)` returns an **array** (JSON-serializable).
- `function action_default($event)` and/or `action_name($event)` handle form actions.
- Reset files use `+page@.server.php` and `+layout@.server.php` only.
- Do not mix PHP server modules with TS/JS server modules at the same segment.

#### RequestEvent shape (PHP)

- `params`, `url`, `request.method`, `request.headers`
- `cookies` with `get`, `set`, `delete`, array access
- `locals` (shared mutable array)
- `route.id`, `parent()`, `depends()`, `fetch()` (basic)

#### Redirects and errors (PHP helpers)

- `sk_redirect($status, $location)`
- `sk_error($status, $body)`

#### Action responses

- Enhanced actions return JSON as usual.
- Non-enhanced actions return HTML and expose `form` data for hydration.

### Endpoints: `+server.php`

Create `src/routes/api/ping/+server.php`.

- Define `function GET($event)`, `POST(...)`, `PUT(...)`, etc.
- **HEAD requests**: Supported automatically (falls back to GET if not defined, body suppressed).
- Your router must route requests correctly based on method and `Accept` negotiation.

---

## Required rewrites (Apache example)

### `__data.json` bridge (Mode A: `php-static`)

You must make `/.../__data.json` hit PHP (which returns JSON) even though it ends in `.json`.

The adapter generates `.htaccess` automatically, but conceptually:

- `/{base}/**/__data.json` → `/{base}/**/__data.php` (or a centralized router that emits the JSON)

### Base path reminders

Root-relative links will ignore your base path unless you prefix them. Use `$app/paths` helpers.

---

## Dev workflow (recommended)

### Why PHP runs in dev

Because you want **real cookies/auth/headers/actions** from PHP while building, not “mocked by vibes.”

### Daily-driver dev (fast)

- **Entry URL:** Vite/SvelteKit dev server (HMR + correct client navigation)
- **Backend:** PHP server running alongside
- Vite proxies backend routes to PHP using `server.proxy`.

Example `vite.config.ts` proxy (adjust paths as needed for your setup):

```ts
export default {
	server: {
		proxy: {
			// Proxy specific API routes
			'/sveltekit-php/api': 'http://127.0.0.1:8080'

			// OR proxy the whole base path if PHP handles everything (except Vite assets)
			// '/sveltekit-php': 'http://127.0.0.1:8080'
		}
	}
};
```

### Prod-like dev (optional)

Put Apache/Nginx in front to validate:

- base-path mounting
- proxy headers/cookies
- buffering/streaming behavior

---

## Production deployment

### Mode A: `php-static`

1. `bun run build`
2. Upload `build/` to your server under the desired subpath.
3. The `.htaccess` file handles `__data.json` rewriting and routing.

### Mode B: `node-ssr`

1. `bun run build` (adapter emits PHP output **and** a sidecar server bundle)
2. Upload output to your server.
3. Run the sidecar (Node/Bun) on an internal port.
4. Configure PHP/Apache/Nginx to reverse-proxy `/{base}` HTML/data/action traffic to the sidecar, while letting PHP keep `/api/*` (and optionally static assets).

If you want “real streaming,” your proxy layer must not buffer responses.

---

## Production Runbook (Mode B: `node-ssr`)

For robust production deployments, use a process manager and configure environment variables.

### Process Management

Use `systemd` or `supervisor` to keep the Node sidecar running.

#### Example: `systemd` service

`/etc/systemd/system/sveltekit-sidecar.service`:

```ini
[Unit]
Description=SvelteKit Node Sidecar
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/html/build
Environment="PORT=3000"
Environment="ORIGIN=https://example.com"
Environment="BODY_SIZE_LIMIT=10M"
ExecStart=/usr/bin/node server/handler.mjs
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

### Environment Variables (PHP Proxy & Sidecar)

| Variable                   | Component | Default           | Description                                                            |
| :------------------------- | :-------- | :---------------- | :--------------------------------------------------------------------- |
| `PORT`                     | Sidecar   | `3000`            | Port the Node server listens on.                                       |
| `PROXY_TIMEOUT_MS`         | PHP Proxy | `10000`           | Max time (ms) to wait for sidecar response.                            |
| `PROXY_CONNECT_TIMEOUT_MS` | PHP Proxy | `500`             | Max time (ms) to connect to sidecar.                                   |
| `MAX_BODY_BYTES`           | PHP Proxy | `10485760` (10MB) | Max upload size allowed by proxy (returns 413 if exceeded).            |
| `SIDECAR_HOST`             | PHP Proxy | `127.0.0.1`       | Upstream host. Must be `127.0.0.1` or `localhost`.                     |
| `SIDECAR_PORT`             | PHP Proxy | `3000`            | Upstream port. Must be numeric.                                        |
| `ALLOW_NONLOCAL_SIDECAR`   | PHP Proxy | `0`               | Set to `1` to allow `SIDECAR_HOST` to be non-local (use with caution). |

### Security & Trust Model

The PHP Proxy (Mode B) enforces a strict trust model for forwarded headers to prevent spoofing and ensure correct routing.

#### 1. X-Forwarded-\* Headers

The proxy **ignores and overwrites** client-provided forwarded headers. It constructs a new trusted chain:

- **`X-Forwarded-For`**: Set to `REMOTE_ADDR` (Client IP). Client-provided values are discarded to prevent spoofing.
- **`X-Forwarded-Proto`**: Set based on PHP's `HTTPS` environment variable (`https` or `http`).
- **`X-Forwarded-Host`**: Set to `HTTP_HOST` (or `localhost`).
- **`X-Forwarded-Prefix`**: Set to the configured base path (if any).

#### 2. Request ID

- **`X-Request-Id`**: If the client provides a valid ID (alphanumeric/dashes), it is preserved for tracing. Otherwise, a unique ID is generated. This ID is logged to stderr and forwarded to the sidecar.

#### 3. Response Headers (Hop-by-hop)

The proxy strips hop-by-hop headers from the sidecar response to ensure HTTP compliance:

- `Connection`, `Keep-Alive`, `Proxy-Authenticate`, `Proxy-Authorization`, `TE`, `Trailer`, `Transfer-Encoding`, `Upgrade`.

#### 4. Host/Port Validation (SSRF Prevention)

- **`SIDECAR_HOST`**: Restricted to `127.0.0.1` or `localhost` by default.
- **`SIDECAR_PORT`**: Must be numeric.
- Use `ALLOW_NONLOCAL_SIDECAR=1` to override (only if you trust your internal network).

### Health Checks & Monitoring

- **`GET /__health`**: Returns JSON `{ ok: true, ... }`. Use this for load balancer health checks.
- **`GET /__ready`**: Returns 200 when ready.
- **502 Bad Gateway**: Returned by PHP proxy if sidecar is down or timed out. Check sidecar logs/status.
- **Logging**: The PHP proxy logs request method, URI, and errors to `php://stderr` (web server error log). Request IDs are correlated via `X-Request-Id`.

### Failure Scenarios

1.  **502 Bad Gateway**:
    - Is the sidecar running? (`systemctl status sveltekit-sidecar`)
    - Is the port correct? (`PORT` env var vs `index.php` default)
    - Did the request timeout? Increase `PROXY_TIMEOUT_MS`.
2.  **Streaming not streaming**:
    - Disable buffering in Nginx (`proxy_buffering off;` or `fastcgi_buffering off;`).
    - The PHP proxy already disables its own buffering.

---

## Troubleshooting

- **Navigation breaks after first load:** your server isn’t serving `__data.json` (missing rewrite/bridge).
- **Assets/links 404 under `/sveltekit-php`:** `kit.paths.base` missing or you used root-relative links without `$app/paths`.
- **JSON/HTML switching feels random:** your negotiation logic is wrong; fix routing based on method + `Accept` and include `Vary: Accept`.
- **Streaming doesn’t stream:** proxy buffering is swallowing chunks (common). Disable buffering for those routes.
- **HEAD requests fail:** Check if your PHP endpoint supports HEAD or if the adapter fallback is working.
