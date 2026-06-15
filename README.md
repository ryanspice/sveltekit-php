# SvelteKit PHP Adapter

![PHP 8.1+](https://img.shields.io/badge/PHP-8.1%2B-777bb4?logo=php&logoColor=white) ![Apache/Nginx](https://img.shields.io/badge/Apache%20%2F%20Nginx-supported-6c757d)

This project implements a **SvelteKit adapter for PHP**, allowing you to deploy SvelteKit applications to standard PHP hosting environments (Apache, Nginx, Shared Hosting) while maintaining a modern development experience.

Current package track: `1.0.2-alpha.0`.

## Support Policy

- Official support floor: PHP 8.1+
- Recommended production target: PHP 8.3+
- Supported hosting styles: Apache, Nginx, shared hosting, and PHP-FPM-backed hosts
- `php-static` is the deployment default
- `js-ssr` is JavaScript-sidecar SSR behind PHP
- Prerendered SSR still hydrates unless the app exports `csr = false`; use the build identity contract below for static skins where client data must not downgrade the deployed theme or tenant
- Historical audit notes under `docs/AUDIT-*` and `docs/CHAT-*` are archival snapshots, not the current contract
- Live example: [blog.ryanspice.com](https://blog.ryanspice.com) uses this adapter for its PHP-hosted release path

## 🌟 Key Features

- **Hybrid Development**: Run Vite (HMR) and PHP (Backend) simultaneously.
- **SSR Data Bridge**: Fetches `+page.server.php` data seamlessly in development.
- **Production Modes**:
  - `php-static`: Prerendered shell + PHP data/action bridge (Traditional PHP hosting).
  - `js-ssr`: PHP frontend proxy + JavaScript SSR sidecar (Full SSR + Streaming).

`js-ssr` is the SSR mode string. It uses a JavaScript SSR sidecar behind the PHP entrypoint.

- **API Proxy**: `/api/*` routes are automatically handled by PHP.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (or Bun)
- **PHP 8.1+** (Available in your system PATH)

### Installation

```bash
# Install dependencies
bun install
```

### Development

Start the hybrid development server:

```bash
bun run dev
```

This command launches two servers:

1.  **Vite Dev Server** (`http://localhost:5173`): Serves the frontend, handles HMR, and proxies API requests.
2.  **PHP Backend** (`http://127.0.0.1:8080`): Serves `+server.php` endpoints and `+page.server.php` data.

**How it works:**

- When you visit a page, Vite renders the Svelte components.
- If the page needs server data, a special **Data Bridge** (`src/lib/server/php-dev.ts`) fetches it from the running PHP server.
- You get the speed of Vite with the real logic of your PHP backend.

---

## 🛠 Developing Features

### 1. Creating Pages

Create standard SvelteKit pages in `src/routes`.

- `src/routes/about/+page.svelte`

### 2. Adding Backend Logic (PHP)

Instead of `+page.server.ts`, use `+page.server.php`.
The adapter compiles this into a PHP script that returns data to the frontend.

**Example `src/routes/about/+page.server.php`:**

```php
<?php
function load($params) {
    return [
        'title' => 'About Us',
        'server_time' => time()
    ];
}
?>
```

### 3. API Endpoints

Create `+server.php` files for pure API endpoints.

**Example `src/routes/api/hello/+server.php`:**

```php
<?php
function GET($params) {
    return new Response(json_encode(['msg' => 'Hello from PHP']), [
        'Content-Type' => 'application/json'
    ]);
}
?>
```

---

## ✅ Testing & Verification

The project includes a suite of fixture routes to verify functionality.

### Feature Showcase

- **Alpha readiness**: Visit `/alpha-readiness` for the native-styled readiness report, bridge-pattern reuse map, report JSON export, and community keyword links.
- **SSR Data**: Visit `/ssr-data` to see data loaded from PHP.
- **Forms**: Visit `/form-basic` to test form actions.

### Alpha evidence track

The `1.0.2-alpha.0` track is broader than a basic adapter smoke test. Before treating the package as alpha-ready, regenerate and verify the full evidence bundle:

```bash
bun run alpha:report:full
bun run verify:alpha
bun run verify:release-prep
```

The alpha surface is expected to prove:

- Windows 11 Mica/macOS-style browser-safe native shell cues reused from `B:\Dev\GPTLIGHTINGSTRENGTHTEST\lg-ultragear-bridge`.
- A native-host guide at `/alpha-readiness/native-host-guide.md` and `report/alpha-native-host-guide.md` for optional desktop wrappers.
- Report graphics at `/alpha-readiness/report.svg` and `/alpha-readiness/community-source-map.svg`.
- Keyword-to-source graph evidence linking open-source/community searches, supported public API lanes, manual research lanes, CSV handoffs, and Markdown analytics handoffs.
- `community-analytics-freshness-contract` metadata so collected counts are treated as directional evidence with an explicit refresh boundary.
- Hosted PHP proof through `ALPHA_SMOKE_BASE_URL` before the same evidence can support stable `1.0.0`.
- **Streaming**: Visit `/stream` to see streaming responses (simulated in dev, real in prod).
- **Layouts**: Visit `/parent-child` to test nested layout data inheritance.

### Alpha Readiness Surface

The `/alpha-readiness` fixture is the operator-facing report surface for the 1.0.2-alpha track. It adapts the Windows 11 Mica/macOS chrome and structured-report patterns from `B:\Dev\GPTLIGHTINGSTRENGTHTEST\lg-ultragear-bridge` without adding Tauri as a dependency to this PHP adapter demo.

The page provides:

- Native-shell styled release status cards.
- A downloadable JSON readiness report at `/alpha-readiness/report.json`.
- A standalone HTML report at `/alpha-readiness/report.html`.
- A Markdown report at `/alpha-readiness/report.md`.
- Alpha release notes at `/alpha-readiness/release-notes.md`.
- A portable SVG release graphic at `/alpha-readiness/report.svg`.
- A portable community source-map SVG at `/alpha-readiness/community-source-map.svg`.
- A machine-readable release manifest at `/alpha-readiness/release-manifest.json`.
- A gate matrix at `/alpha-readiness/gate-matrix.json`.
- An evidence index at `/alpha-readiness/evidence-index.json`.
- A package contract at `/alpha-readiness/package-contract.json`.
- A native-host contract at `/alpha-readiness/native-host-contract.json`.
- A hosted-smoke checklist at `/alpha-readiness/hosted-smoke-checklist.json`.
- An UltraGear bridge-reuse map at `/alpha-readiness/bridge-reuse.json`.
- An alpha reviewer index at `/alpha-readiness/review-index.md`.
- A dedicated community-signal JSON feed at `/alpha-readiness/community-signals.json`.
- A community analytics Markdown handoff at `/alpha-readiness/community-analytics.md`.
- A community research-pack JSON feed at `/alpha-readiness/community-research-pack.json` with source hosts, supported public API endpoints, and manual research links.
- Spreadsheet-friendly CSV endpoints at `/alpha-readiness/readiness.csv`, `/alpha-readiness/community-signals.csv`, and `/alpha-readiness/community-sources.csv`.
- CLI report export through `bun run alpha:report`.
- CSS-only readiness graphics.
- Keyword search links into GitHub, npm, Packagist, Svelte discussions, Stack Overflow, Reddit, Apache, and Nginx research surfaces.

Generate local report artifacts:

```bash
bun run alpha:report
```

This writes JSON, combined JSON, Markdown, HTML, SVG, source-map SVG, reviewer-index Markdown, native-host contract JSON, CSV, and release-manifest files under `report/`. The generated HTML and Markdown reports link the source-map graphic so the keyword/source analytics are visible in human review artifacts, not only JSON/CSV.

Collect public open-source community analytics before exporting the report:

```bash
bun run alpha:report:full
bun run verify:alpha
```

The analytics collector queries public JSON endpoints for supported GitHub, npm, Packagist, Stack Overflow, and Reddit links. Unauthenticated public APIs are rate-limited, so treat the results as directional alpha research evidence rather than product telemetry.

`bun run alpha:report:full` also records a deterministic skipped hosted-smoke artifact when no real deployment smoke has run, so local reports show the hosted evidence lane explicitly instead of omitting it.

Run the full local alpha release gate:

```bash
bun run alpha:gate
```

This gate regenerates the report, verifies the alpha report contract, checks release-prep env/package safety, builds the adapter, runs unit/PHP/check gates, verifies generated artifact sync, verifies PHP/static and JS-SSR route behavior, runs browser E2E for `php-static` and `js-ssr-root`, validates the `npm pack` publish manifest, installs the generated tarball into a temporary consumer, and smoke-tests the external import shape through `sveltekit-php/adapter`.

For the fast release-prep safety subset:

```bash
bun run verify:release-prep
```

This checks alpha package metadata, committed env-file safety, `.env.example` coverage, and leftover package tarball cleanup without printing env values.

After deploying to a real PHP host, run the optional remote smoke against the hosted base URL:

```bash
ALPHA_SMOKE_BASE_URL=https://example.com/ bun run alpha:remote:smoke
```

This checks the hosted home page, `/alpha-readiness`, `/alpha-readiness/report.json`, `/alpha-readiness/report.html`, `/alpha-readiness/report.md`, `/alpha-readiness/release-notes.md`, `/alpha-readiness/report.svg`, `/alpha-readiness/community-source-map.svg`, `/alpha-readiness/release-manifest.json`, `/alpha-readiness/gate-matrix.json`, `/alpha-readiness/evidence-index.json`, `/alpha-readiness/package-contract.json`, `/alpha-readiness/native-host-contract.json`, `/alpha-readiness/hosted-smoke-checklist.json`, `/alpha-readiness/bridge-reuse.json`, `/alpha-readiness/review-index.md`, `/alpha-readiness/community-signals.json`, `/alpha-readiness/community-analytics.md`, `/alpha-readiness/community-research-pack.json`, `/alpha-readiness/readiness.csv`, `/alpha-readiness/community-signals.csv`, `/alpha-readiness/community-sources.csv`, `/form-basic`, the default `/form-basic` POST action echo, expected content types, and traversal-style probes without printing URL credentials or env values. Keep credentials out of the URL; use a public smoke endpoint or CI secret-managed deploy target.

The remote smoke writes `report/alpha-remote-smoke.json`. Subsequent `bun run alpha:report` exports embed that hosted evidence into the Markdown, HTML, and full JSON readiness reports.

To prove both the full local gate and the hosted smoke in one release command:

```bash
ALPHA_SMOKE_BASE_URL=https://example.com/ bun run alpha:gate:hosted
```

The hosted gate runs the full local gate, runs the remote smoke, regenerates the alpha reports with the hosted smoke artifact, and verifies the final reports.

GitHub Actions also includes an `Alpha Gate` workflow. Push and pull-request runs execute the deterministic local `bun run alpha:gate`; manual `workflow_dispatch` runs can pass `alpha_smoke_base_url` to record hosted smoke evidence and upload the generated `report/` artifacts.

See `docs/ALPHA-READINESS.md` for scope, release gates, and current limitations.

### Running Regression Tests

To run the comprehensive verification suite:

```bash
# Build E2E artifacts and run all verification checks
bun run verify:all
```

For the same split used by CI:

```bash
bun run build:e2e
bun run verify:artifacts
bun scripts/verify-all.mjs --mode=php-static --skipBuild
bun scripts/verify-all.mjs --mode=all --skipBuild
```

Generated artifacts such as `adapter/index.js` should be produced by the build scripts, not patched by hand. `bun run verify:artifacts` fails when checked-in generated output drifts after `bun run build:adapter`.

After editing `adapter/src/**` or runtime PHP templates, run `bun run build:adapter` before `bun run verify:artifacts`. Treat stale `adapter/index.js` output as a release blocker until it is regenerated from source.

### Build identity contract

For multi-site static builds, do not rely on host-detection JavaScript to repair the wrong prerendered shell. SvelteKit prerendering writes HTML first, then hydrates by default. If the generated shell says one tenant/theme and the embedded route data says another, the browser can visibly switch themes after load.

Use `buildIdentity` to make the adapter fail before output is deployable:

```js
// svelte.config.js
adapter({
	mode: 'php-static',
	buildIdentity:
		process.env.PUBLIC_SITE_ID === 'canopy'
			? {
					name: 'canopy-static-skin',
					required: ['site-shell--canopy', 'themeClass:"canopy"'],
					forbidden: ['site-shell--ryan', 'themeClass:"ryan"']
				}
			: undefined
});
```

The same contract can be supplied from CI without changing config:

```powershell
$env:SVELTEKIT_PHP_BUILD_IDENTITY = 'canopy-static-skin'
$env:SVELTEKIT_PHP_BUILD_REQUIRED_MARKERS = '["site-shell--canopy","themeClass:\"canopy\""]'
$env:SVELTEKIT_PHP_BUILD_FORBIDDEN_MARKERS = '["site-shell--ryan","themeClass:\"ryan\""]'
```

The adapter scans generated `.php`, `.html`, and `.json` files, fails on missing required markers or present forbidden markers, and records the passed contract in `_runtime/build-stamp.json` with the adapter version and public site id/url. If the site must be fully static with no client rewrite, disable CSR in the app route options for that build.

---

## 📦 Building for Production

To create a deployable PHP application:

```bash
bun run build
```

The output will be in the `build/` directory.

### Running Production Build Locally

You can serve the build folder using PHP's built-in server:

```bash
# Serve the build directory
php -S 127.0.0.1:8080 -t build router.php
```

Then visit `http://127.0.0.1:8080`.

### Environment Configuration

Use `.env.example` as the public template. Keep real deployment values in your shell, CI secrets, or another ignored local file; `.env` in this repo is only a local operational placeholder.

The runtime base path is read from `SK_BASE_PATH` first and `DEPLOY_BASE` second. Leave both empty for root deployments.

Before running deploy or publish automation, verify required deploy values:

```bash
bun run precheck:deploy
```

The precheck requires non-empty `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_REMOTE`, and `DEPLOY_LOCAL` values.

### Runtime security notes

- Cookies: the adapter preserves `Set-Cookie` headers and caller-provided SvelteKit cookie options, but it does not invent production flags. Set `path`, `httpOnly`, `secure`, and `sameSite` explicitly for auth/session cookies.
- Form actions: PHP-provided `$_POST`/`$_FILES` data is used when available, with a `php://input` fallback for JSON, URL-encoded raw bodies, and raw text.
- Server fetch: `sk_fetch()` uses PHP stream wrappers when available, falls back to cURL, and returns an explicit fetch-error response if neither transport is available. Shared hosts should enable either `allow_url_fopen` or `curl`.

---

## 📂 Project Structure

- `adapter/`: The source code for the SvelteKit PHP adapter.
- `src/routes/`: The demo application and test fixtures.
- `scripts/`: Build and verification scripts.
  - `dev-php.mjs`: The hybrid dev server orchestrator.
- `src/lib/server/php-dev.ts`: The bridge connecting Vite to PHP in dev.


