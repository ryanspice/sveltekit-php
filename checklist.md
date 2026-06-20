# SvelteKit PHP audit checklist

This checklist consolidates the Fable 5 audit, the SvelteKit PHP adapter fix plan, and the current `1.0.2-alpha.0` evidence work. Treat it as the repo-level release hardening tracker. Generated `report/` artifacts were refreshed by the local v1 gate on 2026-06-16 and must be regenerated after any runtime/source change.

## Status legend

| Status | Meaning |
| --- | --- |
| Done | Source-level fix or contract exists in the current tree. |
| Partial | Some protection exists, but the evidence is incomplete or not yet verified. |
| Pending | Known work remains before alpha or stable release. |
| Verify | Requires commands, hosted smoke, or artifact regeneration before it is proven. |

## Support marker legend

| Marker | Meaning |
| --- | --- |
| 🟢 | Supported in the current source/docs contract. |
| 🟡 | Partial support, local-only proof, or mode-specific caveat. |
| 🔴 | Missing, blocked, or not claimed. |

## Autonomous quick wins snapshot

| Support | Item | Status | Evidence | Next check |
| --- | --- | --- | --- | --- |
| 🟢 | Adapter `supports` guardrails | Done | `adapter/src/index.ts` now fails clearly for `$app/server` `read` and `instrumentation.server.js` in `php-static`, while allowing the `js-ssr` sidecar lane. | `bun run build:adapter`; `bun run verify:artifacts -- --strict` |
| 🟢 | Reserved route validation | Done | `adapter/src/index.ts` rejects source route ids that collide with generated `_app`, `_runtime`, `_protected`, `adapter`, `__data`, `__action`, router, manifest, or compat paths in strict mode. | Add dedicated unit fixture if this expands. |
| 🟢 | Fallback asset exclusion smoke | Done | `scripts/smoke-remote-alpha.mjs` probes missing JS, CSS, SVG, webmanifest, WASM, and JSON asset-like paths and fails if they receive route fallback HTML. | `ALPHA_SMOKE_BASE_URL=https://example.com/ bun run alpha:remote:smoke` |
| 🟢 | Router MIME parity fixture | Done | `adapter/src/runtime/router/shared.ts` now includes JSON map, webmanifest, WASM, SVG, AVIF, and font MIME mappings; `tests/unit/router-parity.test.ts` asserts php-static/js-ssr/shared router parity. | `bun run test:unit` |
| 🟢 | Package manifest verification | Done | `scripts/verify-alpha-release-prep.mjs` now requires MIT license metadata and the new docs/recipe package files. | `bun run verify:release-prep` |
| 🟢 | PHP hosting contract docs | Done | `docs/HOSTING-CONTRACT.md` documents origin/proxy, body-size, static-vs-PHP headers, MIME, fallback exclusions, security headers, and trailing slash guidance. | Keep aligned with runtime behavior. |
| 🟢 | Dev adapter boundary docs | Done | `docs/DEV-ADAPTER-BOUNDARY.md` documents local-only dev adapter behavior and future smoke checks. | Add unit smoke when touching dev adapters. |
| 🟢 | Composer bootstrap recipe | Done | `docs/recipes/composer-bootstrap.md` records the safe future `phpBootstrap` option shape and path-safety gate. | Implement only with fixture coverage. |
| 🟢 | WordPress/CMS recipe | Done | `docs/recipes/wordpress.md` documents current standalone support and why plugin/shortcode/admin output remains outside core. | Add a real recipe fixture only if a target deployment needs it. |

## Current v1 gate snapshot

| Gate | Status | Evidence | Next action |
| --- | --- | --- | --- |
| Local v1 gate | Done | `bun run v1:gate:local` passed on 2026-06-16 after runtime, config, no-hydration, and `php-static` client-fallback boundary fixes. | Keep `bun run v1:gate:local` green before release. |
| Hosted PHP adapter fixture gate | Partial | `bun run alpha:gate:hosted` passed on 2026-06-16 against a local PHP built-in server target at `http://127.0.0.1:8097/`; direct remote smoke also passed against `http://127.0.0.1:8100/`, including the no-hydration fixture and `php-static` client-fallback headers. This proves the hosted gate path, not a real external host. | Deploy the adapter fixture to a real PHP host, set `ALPHA_SMOKE_BASE_URL`, then rerun `bun run v1:gate:hosted`. |
| npm package publishability | Verify | Package is `sveltekit-php@1.0.2-alpha.0`; registry already has `1.0.0` and `1.0.1`, so this alpha track is intentionally above the existing line. Package metadata now includes MIT licensing and the adapter feature catalogue; last dry-run proof predated those file-list changes. `npm whoami` returned `E401`, so live npm publish is blocked locally. | Re-run `npm pack --dry-run --json`, authenticate npm, then publish with the `alpha` tag. |
| Stable v1 claim | Pending | Local gates are green, local PHP hosted smoke is green, MIT license is added, and non-enhanced PHP static page rendering boundaries are explicit. Real hosted fixture smoke and npm publish auth are still open. | Clear the external blockers before calling this stable v1. |

## Live blog contrast

`blog.ryanspice.com` is the practical reference deployment: a small static SvelteKit blog with readable article pages, RSS/sitemap links, a dev log, and a public promise that the surface stays easy to scan. The adapter repo should therefore optimize for deploy predictability, generated-output integrity, clean static-routing behavior, and simple production guidance rather than broad demo complexity.

| Blog signal | Adapter implication | Status |
| --- | --- | --- |
| Public homepage and article pages are mostly static, source-linked, and low-interaction. | `php-static` should remain the default and must stay boring for normal content routes. | Done |
| RSS, sitemap, article slugs, and dev-log redirects need exact path behavior. | Router parity and base-path safety are release-critical, not optional polish. | Partial |
| The blog presents a small trusted public surface. | Repo artifacts, logs, debug leftovers, and generated output need tighter hygiene before stable. | Partial |
| The blog is already a live adapter-backed deployment claim. | Hosted smoke against a real PHP target must be current before any stable `1.0.0` claim. | Verify |

## Runtime correctness

| Item | Status | Evidence | Next check |
| --- | --- | --- | --- |
| PHP route handler normalization supports canonical and legacy names. | Done | `adapter/src/utils/php-handlers.ts`; `tests/unit/php-handlers.test.ts` | `bun run test:unit` |
| PHP handler conversion fails fast when no callable route handler is discovered. | Done | `normalizePhpHandlerSource()` throws on empty/unsupported handler-shaped exports. | `bun run test:unit` |
| Form actions parse `$_POST` and fall back to `php://input` for JSON, URL-encoded raw bodies, and raw text. | Done | `adapter/src/runtime/php-templates.ts` action helpers `sk_action_parse_body()`, `sk_action_raw_body()`, `sk_action_form_data()` | `bun run test:unit`; PHP action fixture smoke |
| Action event exposes `request.rawBody`, `request.text()`, `request.json()`, top-level `body`, `rawBody`, and `formData`. | Done | `getActionPhp()` event payload | PHP form/action regression |
| `sk_serialize()` has bounded traversal and object-cycle rejection. | Done | `adapter/src/runtime/php-templates.ts` depth guard and object stack | serializer unit fixture |
| `sk_assert_jsonable()` has bounded traversal before serialization. | Done | `adapter/src/runtime/php-templates.ts` depth guard | serializer unit fixture |
| Streaming deferred serialization is exact SvelteKit/devalue parity. | Pending | `getFooterPhp()` still documents simplified JSON encoding for deferred chunks. | Add streaming fixture parity test |
| `sk_fetch()` handles hosts with `allow_url_fopen=0`. | Done | `adapter/src/runtime/php-compat.php` cURL fallback and explicit `x-sveltekit-php-fetch-error` response | unit/static check; PHP host smoke |
| `sk_fetch()` supports timeout configuration. | Done | `SK_FETCH_TIMEOUT_MS` in `adapter/src/runtime/php-compat.php` | `bun run test:unit` |
| Cookie default security behavior is documented. | Done | README runtime security notes state Secure, HttpOnly, and SameSite are caller-owned options. | Keep examples aligned |
| Blog-style no-hydration static pages have an adapter smoke fixture. | Done | `/alpha-readiness/no-hydration` is prerendered with `csr=false`; remote smoke checks SSR markers and forbids client hydration script markers. | `bun run alpha:gate:hosted` |
| Non-enhanced PHP static page rendering fully SSR-renders arbitrary non-prerendered pages. | Done | `php-static` now documents and exposes the support boundary: non-prerendered page shims emit `X-SvelteKit-PHP-Page-Mode: client-fallback` and `X-SvelteKit-PHP-SSR: unsupported-in-php-static`; hosted smoke asserts this on `/form-basic`. | Use `js-ssr` for true dynamic document SSR |
| External SvelteKit/PHP adapter landscape is captured. | Done | `docs/ADAPTER-LANDSCAPE.md` compares static/template, WordPress, PHP-FPM, SvelteKit docs, and community expectations, then maps repo strategy. | Revisit before stable promotion |
| External adapter feature catalogue exists. | Done | `docs/ADAPTER-FEATURE-CATALOG.md` maps official adapters, Azure SWA, PHP-FPM, WordPress, and template adapters into a prioritized PHP adoption backlog. | Use it to pick the next P0/P1 before stable |

## Router and deployment security

| Item | Status | Evidence | Next check |
| --- | --- | --- | --- |
| Generated router rejects traversal, dot segments, encoded traversal, control bytes, and `_protected` access. | Done | `adapter/src/runtime/router/shared.ts` | `bun run test:unit`; hosted smoke probes |
| Root `router.php` stays in parity with generated router safety. | Partial | Root router exists separately; generated shared router is hardened. | Add/keep parity fixture checks |
| Built-in server and generated runtime avoid writing router logs by default. | Done | `router_debug_enabled()` and stderr logging | `bun run test:unit` |
| `.env` and `.env.example` are placeholder-safe. | Done | `scripts/verify-alpha-release-prep.mjs`; `.env.example` | `bun run verify:release-prep` |
| Deploy and hosted-smoke commands reject missing, placeholder, malformed, or unsafe env values. | Done | `scripts/utils/config.mjs`; `scripts/run-hosted-alpha-gate.mjs`; `scripts/deploy-precheck.mjs` | `bun run verify:release-prep` |
| Shared config helpers do not load `.env` as an import side effect. | Done | `scripts/utils/config.mjs` is side-effect free; deploy/hosted entrypoints own intentional dotenv loading. | `npm pack --dry-run --json`; `bun run v1:gate:local` |
| Hosted PHP proof exists against a real deployment. | Verify | Local PHP hosted gate passed, but real external `ALPHA_SMOKE_BASE_URL` evidence is still required before stable. | `bun run alpha:gate:hosted` |

## Adapter maintainability

| Item | Status | Evidence | Next check |
| --- | --- | --- | --- |
| PHP handler rewriting logic is isolated from `adapter/src/index.ts`. | Done | `adapter/src/utils/php-handlers.ts` | `bun run test:unit` |
| `php-static` and `js-ssr` mode pipelines are deduplicated. | Pending | `adapter/src/index.ts` still has large mode branches. | Refactor after runtime gates are green |
| `sk_prefers_html` negotiation helper duplication is removed. | Pending | Negotiation snippets still appear inline in generated route branches. | Extract shared negotiation template |
| Debug output uses adapter logger rather than broad `console.log`. | Partial | Debug is gated by `ADAPTER_DEBUG`/`SK_DEBUG`; cleanup still warranted. | Audit debug call sites |
| Generated `adapter/index.js` stays synced with source. | Verify | `scripts/verify-artifact-sync.mjs` strict mode | `bun run verify:artifacts -- --strict` |

## Package and repository hygiene

| Item | Status | Evidence | Next check |
| --- | --- | --- | --- |
| Package track is explicitly `1.0.2-alpha.0`, not RC/stable. | Done | `package.json`; alpha release policy metadata | `bun run verify:release-prep` |
| Package metadata supports npm/GitHub discoverability. | Done | `package.json` now includes description, keywords, repository, homepage, and bugs URL. | `npm pack --dry-run --json` |
| Release policy says project `1.0.2-alpha` ranks above RC labels for this repo. | Done | `sveltekitPhpReleasePolicy`; release manifest/report contracts | `bun run verify:alpha` |
| LICENSE exists if the adapter is intended for external reuse. | Done | Root `LICENSE` is MIT and `package.json` declares `"license": "MIT"`. | Keep package metadata aligned |
| Scratch artifacts are ignored. | Done | `.gitignore` ignores debug logs, report output, Playwright output, build output, `.htaccess.test`, `test.php`, `verbose/.last-run.json`, and `tools/*.patch`. | Confirm tracked-file status manually |
| Root scratch artifacts are removed from tracked source if already committed. | Verify | Files such as `test.php`, `.htaccess.test`, debug logs, and local build output may still exist locally. | Use git status before cleanup |
| Package files include only intended publish artifacts. | Verify | Expected publish set is now `README.md`, `LICENSE`, `adapter/index.js`, `docs/ADAPTER-FEATURE-CATALOG.md`, `docs/ADAPTER-LANDSCAPE.md`, `docs/ALPHA-READINESS.md`, `docs/ALPHA-RELEASE-CHECKLIST.md`, `docs/DEV-ADAPTER-BOUNDARY.md`, `docs/HOSTING-CONTRACT.md`, `docs/recipes/composer-bootstrap.md`, `docs/recipes/wordpress.md`, and `package.json`. | Re-run `npm pack --dry-run --json` before publish |

## Alpha evidence and reporting

| Item | Status | Evidence | Next check |
| --- | --- | --- | --- |
| Native host guide exists for optional desktop wrappers. | Done | `/alpha-readiness/native-host-guide.md`; `src/lib/alpha-native-host-guide.ts` | `bun run verify:alpha` |
| Windows 11 Mica/browser-safe shell markers are present. | Done | `NativeWindowShell.svelte`; native host contract; SVG/report markers | `bun run verify:alpha` |
| macOS-style titlebar rhythm markers are present. | Done | `NativeTitlebar.svelte`; native visual matrix | `bun run verify:alpha` |
| LG UltraGear desktop-shell helper mapping uses the real `TaskbarProgressState` translation. | Done | `toDesktopShellUiTaskbarProgressState()`; native host contract; release checklist | `bun run test:unit`; `bun run verify:alpha` |
| Report graphics exist for readiness and community source maps. | Verify | Source renderers exist; generated `report/` artifacts must be current. | `bun run alpha:report:full` |
| Community keyword graph links searches to open-source/community evidence. | Done | `alpha-community-research-pack`, SVG source map, CSV handoffs | `bun run verify:alpha` |
| Community analytics freshness boundary is explicit. | Done | `community-analytics-freshness-contract` markers | `bun run verify:alpha` |
| Source-to-keyword CSV linkage is explicit. | Done | `sourceToKeywordEdge`, `weighted_demand_score`, `source_to_keyword_edge` markers | `bun run verify:alpha` |
| Alpha release checklist is source-rendered and included as runtime/generated evidence. | Done | `/alpha-readiness/release-checklist.md`; `report/alpha-release-checklist.md`; `alphaReleaseChecklistProof` | `bun run verify:alpha` |
| Generated report bundle is current after source edits. | Done | `bun run v1:gate:local` refreshed and verified reports on 2026-06-16 after runtime/config/no-hydration edits; direct local PHP smoke then wrote `report/alpha-remote-smoke.json` with `status=passed`. | Re-run after runtime/source edits |
| No-hydration fixture is covered by hosted smoke. | Done | `/alpha-readiness/no-hydration` verifies the `csr=false` prerender contract and catches script/hydration marker regressions. | `bun run alpha:gate:hosted` |

## Dev adapter and boundary hardening

| Item | Status | Evidence | Next check |
| --- | --- | --- | --- |
| Dev adapters fail safely outside local dev context. | Partial | Dev adapter tests and explicit dev-only guard work exist from prior hardening. | `bun run test:unit` |
| Placeholder behavior emits actionable errors instead of silent degradation. | Partial | Dev adapter stabilization needs periodic review. | Dev adapter smoke tests |
| Browser/PHP runtime does not import Tauri or native host APIs. | Done | Native host contract says native calls remain optional host-wrapper concerns. | `bun run verify:alpha` |

## Verification commands

| Scope | Command |
| --- | --- |
| Regenerate alpha reports | `bun run alpha:report:full` |
| Release-prep safety | `bun run verify:release-prep` |
| Alpha report contract | `bun run verify:alpha` |
| Strict generated adapter sync | `bun run verify:artifacts -- --strict` |
| Unit/runtime source checks | `bun run test:unit` |
| Full local alpha gate | `bun run alpha:gate` |
| Hosted PHP gate | `ALPHA_SMOKE_BASE_URL=https://example.com/ bun run alpha:gate:hosted` |
| Local v1 gate | `bun run v1:gate:local` |
| Full v1 gate | `ALPHA_SMOKE_BASE_URL=https://example.com/ bun run v1:gate` |
| npm package dry-run | `npm pack --dry-run --json` |

## Stable release blockers

| Blocker | Status |
| --- | --- |
| Hosted PHP smoke must pass against a real deployment. | Verify - local PHP hosted gate passed, but external PHP host proof is still required. |
| Generated artifacts must be regenerated after current source edits. | Done locally on 2026-06-16 via `bun run v1:gate:local`. |
| Strict `adapter/index.js` artifact sync must pass. | Done on 2026-06-16. |
| Unit, PHP route, E2E, and consumer smoke gates must pass. | Done locally on 2026-06-16 via `bun run verify:all`. |
| npm publish needs authenticated maintainer credentials. | Verify - `npm whoami` returned `E401` locally. |
| License must be added before public reuse claims are made. | Done - MIT license added. |
| Blog-style `csr=false` prerender pages must stay no-hydration in hosted smoke. | Done locally - no-hydration fixture added; rerun hosted smoke after deploy. |
| Non-enhanced PHP static HTML SSR for arbitrary dynamic pages needs a clear support boundary or a real SSR fixture. | Done - support boundary is explicit via generated headers, README guidance, checklist, and hosted smoke. |
| Competitive strategy review before hosted proof/npm/license. | Done - external adapter landscape and feature catalogue captured; feature adoption deferred to post-v1 unless it affects release correctness. |
| Large adapter mode-branch dedupe remains a maintainability task before stable. | Pending |
