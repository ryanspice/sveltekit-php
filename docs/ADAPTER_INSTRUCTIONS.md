# SvelteKit PHP Adapter Instructions

This repo ships a custom SvelteKit adapter that targets **PHP hosting** and supports two deploy styles:

- **Mode A: `php-static`**: prerendered HTML + client assets, with **PHP bridges** for `__data.json`, actions, and endpoints.
- **Mode B: `js-ssr`**: **PHP is the public entrypoint**, but a **Node/Bun “SSR sidecar”** runs the SvelteKit server output for **true SSR + streaming**, and PHP (or Apache/Nginx) reverse-proxies HTML/data/action requests to it.

Adapters are build-time plugins and must use SvelteKit’s adapter contract (`adapt(builder)` and builder outputs). citeturn1view0

---

## Key ideas you must not fight

### 1) `__data.json` is real
SvelteKit’s client navigation expects `__data.json` to exist. In `php-static`, **do not patch bundles**. Serve `__data.json` via a **rewrite/bridge** to PHP.

### 2) Subpath deployments need `kit.paths.base`
If you deploy to `mark8t.ca/sveltekit-php`, set:

- `kit.paths.base = '/sveltekit-php'` (must start with `/` and must not end with `/`). citeturn0search1
- Use `$app/paths` to build URLs safely (e.g. `resolve()` / `asset()`). citeturn1view2

### 3) Content negotiation is not optional
If a route has both a page and an endpoint, you must route based on HTTP method + `Accept` header. This is standard HTTP content negotiation. citeturn0search27

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
      mode: 'php-static', // or 'js-ssr'
      out: './build',
      assets: './build'
    })
  }
};

export default config;
```

> `mode='php-static'` is “prerender + bridge”, not on-demand SSR.

---

## Authoring server logic in PHP

### Page data + actions: `+page.server.php`
Create `src/routes/foo/+page.server.php` next to your `+page.svelte`.

- `function load($event)` returns an **array** (JSON-serializable).
- `function action_default($event)` and/or `action_name($event)` handle form actions.

### Endpoints: `+server.php`
Create `src/routes/api/ping/+server.php`.

- Define `function GET($event)`, `POST(...)`, `PUT(...)`, etc.
- Your router must route requests correctly based on method and `Accept` negotiation.

---

## Required rewrites (Apache example)

### `__data.json` bridge (Mode A: `php-static`)
You must make `/.../__data.json` hit PHP (which returns JSON) even though it ends in `.json`.

Conceptual rule:
- `/{base}/**/__data.json` → `/{base}/**/__data.php` (or a centralized router that emits the JSON)

Example (adjust paths to your output layout):

```apache
RewriteEngine On

# Base-path mount
RewriteBase /sveltekit-php/

# Serve __data.json via PHP bridge
RewriteRule ^(.*)/__data\.json$ $1/__data.php [L]

# Typical “directory index” fallthrough
DirectoryIndex index.php index.html
```

If you use Nginx/PHP-FPM instead, implement the same mapping.

### Base path reminders
Root-relative links will ignore your base path unless you prefix them. Use `$app/paths` helpers. citeturn1view2turn0search1

---

## Dev workflow (recommended)

### Why PHP runs in dev
Because you want **real cookies/auth/headers/actions** from PHP while building, not “mocked by vibes.”

### Daily-driver dev (fast)
- **Entry URL:** Vite/SvelteKit dev server (HMR + correct client navigation)
- **Backend:** PHP server running alongside
- Vite proxies backend routes to PHP using `server.proxy`. citeturn0search3

Example `vite.config.ts` proxy:

```ts
export default {
  server: {
    proxy: {
      '/sveltekit-php/api': 'http://127.0.0.1:8080'
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
3. Configure rewrites for:
   - `__data.json` → PHP bridge
   - page fallthrough to `index.php`/`index.html` as needed

### Mode B: `js-ssr`
1. `bun run build` (adapter emits PHP output **and** a sidecar server bundle)
2. Upload output to your server.
3. Run the sidecar (Node/Bun) on an internal port.
4. Configure PHP/Apache/Nginx to reverse-proxy `/{base}` HTML/data/action traffic to the sidecar, while letting PHP keep `/api/*` (and optionally static assets).

If you want “real streaming,” your proxy layer must not buffer responses.

---

## Troubleshooting

- **Navigation breaks after first load:** your server isn’t serving `__data.json` (missing rewrite/bridge).
- **Assets/links 404 under `/sveltekit-php`:** `kit.paths.base` missing or you used root-relative links without `$app/paths`. citeturn0search1turn1view2
- **JSON/HTML switching feels random:** your negotiation logic is wrong; fix routing based on method + `Accept` and include `Vary: Accept`. citeturn0search27
- **Streaming doesn’t stream:** proxy buffering is swallowing chunks (common). Disable buffering for those routes.
