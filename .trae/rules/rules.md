# Project Rules (Trae) — SvelteKit PHP Adapter + Demo Fixture

These rules define how to work in this repo without breaking SvelteKit semantics, PHP runtime output, or the fixture routes used for verification.

---

## Goals

- Build a **SvelteKit adapter** that emits a **PHP-runnable deployment** (Apache/Nginx/PHP-FPM or PHP built-in server) while preserving core SvelteKit behavior.
- Support **both** deployment styles:
  - **Apache + PHP backend + JS SSR sidecar** (Node or Bun preferred), proxying HTML/data/action requests (**true SSR + streaming**).
  - **PHP-only static+bridge**: prerender + hydration + `__data.json` bridge + PHP actions/endpoints + negotiation + rewrites.
- Keep adapter implementation in **`adapter/src/*`** (TypeScript source), with minimal runtime glue.
- Provide a **fixture app** under `src/routes/*` that exercises edge cases: prerender, data navigation payloads (`__data.json`), redirects, nested layouts, actions, endpoint negotiation, base paths, and streaming.
- Keep development friction low while staying realistic:
  - **PHP backend should be running in dev** so API/auth/cookies behave like production.
  - Default dev entry should still be **Vite/SvelteKit dev server** for HMR and stack traces, with proxying to PHP for backend routes.

Adapters are build-time plugins and must follow SvelteKit’s adapter contract (use builder outputs; call `server.respond(...)` in SSR-capable runtimes).

---

## Non-goals

- Not building a general PHP framework.
- Not re-implementing SvelteKit’s server runtime in PHP.
- Not adding heavy runtime dependencies for convenience unless they eliminate significant complexity.

---

## Deploy Modes (authoritative)

### Mode A: `php-static` (PHP-only hosting)

- Output is **prerendered pages + client assets**.
- PHP provides routing + optional API endpoints and action handlers.
- Client navigation still requires `__data.json` availability (served via PHP rewrite/bridge).
- **No true on-demand SvelteKit SSR** here: it is “prerender + hydration + runtime data/action bridge”.

### Mode B: `js-ssr` (PHP + JS sidecar)

- PHP remains the public entrypoint and backend (APIs, auth, DB, etc.).
- A JS runtime (Node or Bun) runs the SvelteKit server bundle and handles **SSR + streaming** via `server.respond(...)`.
- PHP (or Apache/Nginx) reverse-proxies (streaming-safe) to the sidecar.

> Naming rule: **Do not call `php-static` “SSR.”** If it doesn’t run `server.respond(...)`, it’s not SvelteKit SSR.

---

## SvelteKit Rendering Options (csr/ssr/prerender) — expected behavior

SvelteKit supports per-route rendering configuration (`csr`, `ssr`, `prerender`, `trailingSlash`). The adapter must respect these as far as the runtime allows.

### In `js-ssr` mode

- `csr`: controls hydration as usual.
- `ssr`: true SSR for routes with `ssr=true`; SPA behavior where `ssr=false`.
- `prerender`: prerendered routes are output as files; dynamic routes SSR on demand.
- Streaming: supported where the JS runtime supports streaming responses and proxy buffering is disabled.

### In `php-static` mode

- `prerender`: must be true for HTML pages you expect to exist as files (unless you intentionally rely on SPA fallback).
- `csr`: controls hydration (works).
- `ssr`: only meaningful at **build time** (prerender uses SSR to generate HTML). There is no on-demand SSR without a JS runtime.
- Streaming: best-effort only; document buffering limitations.

---

## Repo Layout (authoritative)

- `adapter/src/*`: adapter implementation
  - `adapter/src/index.ts`: adapter entry (exports adapter factory, `adapt(builder)`)
  - `adapter/src/runtime/php-templates.ts`: emitted PHP templates + glue
  - `adapter/src/runtime/js-ssr-entry.ts`: sidecar entry generator (Mode B)
  - `adapter/src/utils/{fs,html,paths,routing}.ts`: helpers (small + typed)
- `scripts/*`: build/serve/verify tooling
  - `scripts/verify-comprehensive.mjs`: regression harness for CI
- `src/routes/*`: fixture app routes (extend carefully)

---

## Adapter Contract Rules (do not break)

- Must implement SvelteKit adapter API and use builder outputs (`writeClient`, `writePrerendered`, `writeServer`, `generateManifest`) rather than guessing internals.
- Treat adapter as a **pure build step**: input is SvelteKit build artifacts; output is deployable layout.
- Any logic that depends on Kit internals must be isolated and documented (and covered by fixture tests).

---

## Critical Semantics Rules (must match SvelteKit)

### 1) Do not patch compiled client assets

- **Banned:** string-replacing `__data.json` inside emitted JS bundles.
- Required approach:
  - Keep the client expecting `__data.json`.
  - Provide PHP rewrite/bridge: `/x/__data.json` → `/x/__data.php` (PHP returns JSON payload).
- Reason: `__data.json` is part of SvelteKit’s navigation/data model and must remain available.

### 2) Content negotiation must match SvelteKit

If `+server` and `+page` exist at the same route, routing must follow SvelteKit’s rules:

- `PUT/PATCH/DELETE/OPTIONS` → always `+server`
- `GET/POST/HEAD` → page **only if** the `Accept` header prioritizes `text/html`, otherwise `+server`
- `GET` responses must include `Vary: Accept` to avoid cache/proxy confusion

Fixture routes must include at least one directory where both page + server exist to prove this behavior.

### 3) Normalize URLs the way SvelteKit does

When mapping requests to routes/files, use SvelteKit-style URL normalization (e.g., strip `__data.json` suffix and normalize trailing slashes) rather than ad-hoc parsing.

### 4) `load` serialization + streaming promises

- Server `load` data must be devalue-serializable.
- Promises returned from `load` may be streamed in SSR-capable runtimes.
- In `php-static` mode, streaming is best-effort only; document limitations clearly.

### 5) Base paths and asset paths must be respected

- Support `kit.paths.base`, `kit.paths.assets`, and `kit.appDir` expectations.
- PHP router and emitted includes must not assume deployment at `/`.
- Fixture routes must validate correct asset URL generation under base paths (use `$app/paths` helpers in fixture code where appropriate).

---

## Output Layout Rules (PHP deploy)

- Output must clearly separate:
  - **client assets** (e.g. `${appDir}`) and static files
  - **prerendered pages**
  - **protected server PHP modules** (namespaced, not web-routable)
  - **JS SSR sidecar** artifacts (Mode B)
- Routing must support:
  - direct page loads
  - client navigations via `__data.json`
  - endpoints (`+server`)
  - actions (`+page.server`)
- Preserve: status codes, redirects, headers, and multiple `Set-Cookie` headers.

---

## Streaming Rules (Mode B and “best-effort” Mode A)

- True streaming requires disabling buffering across the stack:
  - PHP output buffering must be flushed correctly (`ob_flush`, output buffer rules).
  - Reverse proxies (Apache/nginx) may buffer by default; streaming requires disabling proxy buffering for relevant routes.
- Fixture `/stream` must:
  - demonstrate chunked output
  - include a note in README about required server/proxy settings

---

## Dev Workflow Rules

### Principle: PHP always runs in dev

- In dev, the PHP backend **must be running** so you see real-world behavior (cookies/auth/headers/actions) while building.
- The “frontend entrypoint” for day-to-day dev should still be **Vite/SvelteKit dev server**, because it provides HMR, accurate stack traces, and correct `__data.json` behavior for navigation.

### Required scripts

- `bun run dev` (daily-driver dev):
  - starts Vite dev server
  - starts PHP backend
  - uses Vite `server.proxy` to route backend calls to PHP (e.g. `/sveltekit-php/api/*` → PHP)
  - if the repo supports Mode B features in dev, Vite dev server is the effective “sidecar” (no separate built sidecar required)

- `bun run dev:prodlike` (integration dev, optional but supported):
  - runs an Apache (or nginx) front that proxies `/sveltekit-php/*` to the Vite dev server (or to a built sidecar)
  - excludes `/sveltekit-php/api/*` so those hit PHP directly
  - used to validate: base path mounting, proxy headers/cookies, buffering/streaming behavior

- `bun run prod`:
  - builds adapter output
  - serves build via PHP
  - if `mode=js-ssr`, also runs (or documents how to run) the sidecar server and proxy config

### No global config hacks

- Do not require a mandatory root `+layout.server.*` export to make the adapter work.
- Respect per-route options (`csr`, `ssr`, `prerender`, `trailingSlash`) as SvelteKit defines them.

---

## Fixture App Rules (src/routes)

### Canonical test routes (do not remove)

- `/` root: prerender + stable data output marker
- `/ssr-data` data appears on initial load (Mode B must SSR; Mode A must at least bootstrap without flicker)
- `/redirect-me` redirect preserves query + status
- `/parent-child/nested` nested layout merge precedence
- `/data-endpoint` proves `__data.json` resolves correctly (served by PHP bridge)
- `/form-basic` actions: success + failure + enhanced
- `/form-multipart` multipart upload via actions
- `/negotiate` directory includes **both** `+page.*` and `+server.*` (content negotiation assertions)
- `/base-path` verifies base-path deployment assumptions (links/assets/data endpoints under base)
- `/stream` streaming test route (best-effort in `php-static`; real in `js-ssr`)
- `/test-js` prerender-only JS route

### Golden output convention (required)

- Pages include:
  - `<meta name="adapter-test" content="route:case:ok">`
  - `<pre id="adapter-out">{...stable json...}</pre>`
- Endpoints include:
  - stable JSON keys
  - optional `x-adapter-test` header

---

## Testing & Regression Rules

- Any bug fix must add:
  - a fixture route reproducer **or**
  - a new assertion in `verify-comprehensive.mjs`.
- Do not weaken existing assertions to “make it pass.”
- Explicit tests must cover:
  - `__data.json` availability without patching bundles
  - content negotiation correctness
  - base path deployment sanity
  - js-ssr proxy correctness (status/headers/cookies/streaming)
  - php-static bridge correctness (data/actions)

---

## Code Style Rules

- TypeScript-first (adapter + helpers).
- Keep utility modules small; avoid circular deps.
- Avoid new deps unless they meaningfully reduce complexity.

---

## Documentation Rules

Maintain:

- `VERIFICATION_PLAN.md` (what is covered and how to run it)
- README section: output layout, routing assumptions, PHP rewrites for `__data.json`, content negotiation, base path, known limitations
- Dev docs must clearly distinguish:
  - daily-driver dev (Vite entry + proxy to PHP)
  - prod-like integration dev (Apache/nginx front)
- Streaming limitations must be stated plainly and tied to `/stream` route + server config.

---

## Change Safety Checklist (before committing)

- [ ] `bun run dev` works (Vite + PHP + proxies)
- [ ] `bun run prod` serves build via PHP (and sidecar if enabled)
- [ ] No compiled bundle patching (rewrites/bridge used instead)
- [ ] `__data.json` works for navigation
- [ ] Content negotiation route passes
- [ ] Redirects preserve status + Location headers
- [ ] Cookies emitted as real `Set-Cookie` headers
- [ ] Base path deployment works
- [ ] Verification suite updated if behavior changed

---

## “If you touch this, you own it” zones

- `adapter/src/runtime/php-templates.ts` (runtime glue)
- `__data.json` bridge/rewrite handling
- Negotiation routing (`+page` vs `+server`)
- Sidecar proxy semantics (status/headers/cookies/streaming)
- Anything depending on SvelteKit internal structures (document assumptions + add tests)

End of rules. Ship it without making future-you cry.
