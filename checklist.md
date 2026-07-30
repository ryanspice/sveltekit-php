# SvelteKit PHP audit checklist

This checklist consolidates the Fable 5 audit, the SvelteKit PHP adapter fix plan, and the current `1.0.2-alpha.0` evidence work. Treat it as the repo-level release hardening tracker. Generated `report/` artifacts were refreshed by the local v1 gate on 2026-07-01 and must be regenerated after any runtime/source change.

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
| 🟢 | Adapter platform emulation | Done | `adapter/src/index.ts` exposes a non-secret `event.platform.php` surface through SvelteKit `emulate().platform`, including adapter version, mode, prerender state, base path, output options, and runtime capability flags. | `bun run build:adapter`; `bun run verify:release-prep` |
| 🟢 | Platform emulation alpha evidence | Done | `adapter-platform-emulation` is now a required alpha evidence marker across package metadata, package contract, release manifest, evidence index, gate matrix, and release checklist surfaces. | `bun run alpha:report`; `bun run verify:alpha` |
| 🟢 | Community analytics refresh | Done | `bun run alpha:report:full`, `bun run verify:alpha`, and `bun run verify:release-prep` passed after the latest-adapter refresh; public-source analytics are present in the regenerated report bundle. | Keep `bun run alpha:report:full` in release prep when evidence sources change. |
| 🟢 | Current Svelte 5/SvelteKit 2 adapter parity snapshot | Done | Latest package snapshot and adapter matrix were refreshed on 2026-07-02 for `svelte@5.56.4`, `@sveltejs/kit@2.69.0`, `@sveltejs/vite-plugin-svelte@7.1.2`, Vite `8.1.3`, and current official adapter versions. Same-major Svelte/Kit and isolated Vite-major fixture lanes are both explicit. | `bun run verify:latest-sveltekit-audit`; `bun run alpha:latest-same-major:smoke`; `bun run alpha:latest-vite-major:smoke` |
| 🟢 | Vite 8/plugin 7 isolated validation | Done | `bun run alpha:latest-vite-major:smoke` passed on 2026-07-02 with npm-latest `vite@8.1.3` and `@sveltejs/vite-plugin-svelte@7.1.2` in a packed PHP/static fixture. This does not raise dependency floors. | Keep this lane current before RC/stable; do not treat it as a floor upgrade. |
| 🟢 | Live blog SEO evidence | Done | `blog.ryanspice.com` live root, robots, and sitemap return `200`; homepage is static/no-hydration by observed markers; `seo_audit_python` scanned 28 pages with score `91` / grade `A-`; high findings are confined to the intentionally private `/login` route. | `B:\Temp\@Browser\seo_blog_ryanspice_20260701\blog.ryanspice.com-root-20260701T060746Z-v0_4_9` |
| 🟢 | Native host wrapper probe | Done | `src/lib/native-shell/native-host-event-bridge.ts` exports `buildNativeHostWrapperProbe()` and `native-host-wrapper-probe` evidence so optional wrappers can smoke Mica, drag, maximize, progress, clear-progress, and report-ready mappings against the LG UltraGear helper contract. | `bun run alpha:report`; wrapper smoke remains host-owned |
| 🟢 | Native host wrapper smoke artifact | Done | `/alpha-readiness/native-host-wrapper-smoke.json` and `report/alpha-native-host-wrapper-smoke.json` expose deterministic wrapper handoff status, required actions, command mappings, progress-state expectations, and `realHostVerified: false` until a real wrapper runs it. | `bun run alpha:native:smoke`; real wrapper smoke remains host-owned |
| 🟢 | Native wrapper smoke verifier guard | Done | `scripts/verify-alpha-readiness.mjs` now requires the wrapper smoke source, route, artifact, JSON boundary, HTML/Markdown report section, SVG markers, package-contract markers, and `realHostVerified: false` boundary. | `bun run verify:alpha` |
| 🟢 | Native wrapper smoke required evidence | Done | `native-host-wrapper-smoke` is now part of the canonical `requiredEvidence` list across package metadata, package contract, release manifest, evidence index, gate matrix, hosted-smoke expectations, and generated reports. | `bun run alpha:report`; `bun run verify:alpha` |
| 🟢 | Native wrapper smoke release notes | Done | `alpha-release-notes.md` now includes the wrapper smoke endpoint, artifact, command, `nativeHostWrapperSmoke` surface, `TaskbarProgressState`, and real-host boundary markers so release reviewers see the same native-wrapper proof as the reports. | `bun run alpha:report`; `bun run verify:alpha` |
| 🟢 | Adapter base-mode env contract | Done | `scripts/verify-alpha-release-prep.mjs` now accepts `fixed` or `auto`, matching `adapter/src/types.ts` and the adapter runtime instead of the stale `dynamic` label. | `bun run verify:release-prep` |
| 🟢 | Adapter `supports` guardrails | Done | `adapter/src/index.ts` now fails clearly for `$app/server` `read` and `instrumentation.server.js` in `php-static`, while allowing the `js-ssr` sidecar lane. | `bun run build:adapter`; `bun run verify:artifacts -- --strict` |
| 🟢 | Reserved route validation | Done | `adapter/src/index.ts` rejects source route ids that collide with generated `_app`, `_runtime`, `_protected`, `adapter`, `__data`, `__action`, router, manifest, or compat paths in strict mode. | Add dedicated unit fixture if this expands. |
| 🟢 | Fallback asset exclusion smoke | Done | `scripts/smoke-remote-alpha.mjs` probes missing JS, CSS, SVG, webmanifest, WASM, and JSON asset-like paths and fails if they receive route fallback HTML. | `ALPHA_SMOKE_BASE_URL=https://example.com/ bun run alpha:remote:smoke` |
| 🟢 | Router MIME parity fixture | Done | `adapter/src/runtime/router/shared.ts` now includes JSON map, webmanifest, WASM, SVG, AVIF, and font MIME mappings; `tests/unit/router-parity.test.ts` asserts php-static/js-ssr/shared router parity. | `bun run test:unit` |
| 🟢 | Package manifest verification | Done | `scripts/verify-alpha-release-prep.mjs` now requires MIT license metadata, docs/recipe package files, published-alpha smoke wiring, and root-router parity gate wiring. | `bun run verify:release-prep` |
| 🟢 | PHP hosting contract docs | Done | `docs/HOSTING-CONTRACT.md` documents origin/proxy, body-size, static-vs-PHP headers, MIME, fallback exclusions, security headers, and trailing slash guidance. | Keep aligned with runtime behavior. |
| 🟢 | Dev adapter boundary docs | Done | `docs/DEV-ADAPTER-BOUNDARY.md` documents local-only dev adapter behavior and future smoke checks. | Add unit smoke when touching dev adapters. |
| 🟢 | Composer bootstrap recipe | Done | `docs/recipes/composer-bootstrap.md` records the safe future `phpBootstrap` option shape and path-safety gate. | Implement only with fixture coverage. |
| 🟢 | WordPress/CMS recipe | Done | `docs/recipes/wordpress.md` documents current standalone support and why plugin/shortcode/admin output remains outside core. | Add a real recipe fixture only if a target deployment needs it. |

## Current v1 gate snapshot

| Gate | Status | Evidence | Next action |
| --- | --- | --- | --- |
| Local v1 gate | Verify | `bun run v1:gate:local` passed on 2026-07-01 after the Vite-major fixture was added to the gate chain, readiness unit evidence was fixed, release-prep gate-chain verification was tightened, and the existing runtime/config/no-hydration/router checks stayed green. Today's latest-package source/report refresh means the full local gate must be rerun before release. | Keep `bun run v1:gate:local` green before release. |
| Hosted PHP adapter fixture gate | Done | `https://blog.canopydigital.ca/dev/sveltekitphp/` was refreshed and previous hosted alpha-gate proof exists for `1.0.2-alpha.0`. Fresh `ALPHA_SMOKE_BASE_URL=https://blog.canopydigital.ca/dev/sveltekitphp/ bun run v1:gate:hosted` passed on 2026-07-01 after the hosted wrapper was made composable with `--skip-local`; it ran remote smoke, regenerated hosted evidence, and passed `verify:alpha`. `https://blog.ryanspice.com/dev/sveltekitphp/` is not the working ground and returns `404`. | Rerun the full composed `bun run v1:gate` before any stable release claim if exact single-command evidence is required; the composed attempt in this continuation was interrupted and is not counted. |
| npm package publishability | Done | Package is `sveltekit-php@1.0.2-alpha.0`; registry already has `1.0.0` and `1.0.1`, so this alpha track is intentionally above the existing line. `bun run release:npm-state` passed its report-mode probe on 2026-07-02 and captured temp-destination pack metadata for `sveltekit-php-1.0.2-alpha.0.tgz` with 15 intended package entries and shasum `f802f329c73814a50c2e4afebc9193ac445ab6e6`. `npm run alpha:consumer:smoke` passed local packed-consumer import and publish-manifest checks. | `npm whoami` currently returns `E401`; authenticate npm, rerun `bun run release:npm-state:strict`, publish with the `alpha` tag, then run `npm run alpha:published:smoke`. |
| Release-note support lanes | Done | Generated release notes now distinguish supported `php-static`, supported-with-sidecar `js-ssr`, partial Vite 8/plugin 7 validation, unsupported remote functions/WordPress/PHP-FPM/ISR/image/auth lanes, native-wrapper host ownership, and hosted/npm proof boundaries. | Regenerate `report/alpha-release-notes.md` during the next `bun run alpha:report:full` run. |
| Stable v1 claim | Pending | Alpha hosted proof is current, MIT license is added, package dry-run passes, release-note lane boundaries are explicit, and non-enhanced PHP static page rendering boundaries are explicit. Today's source/report refresh leaves the full local v1 gate stale until rerun. Stable still needs intentional npm publish, npm-installed consumer proof, fresh local v1 gate, and a fresh final hosted gate for the release deployment target. | Do not call this stable `1.0.2` until publish/release-target proof is current. |

## Live blog contrast

`blog.ryanspice.com` is the practical reference deployment: a small static SvelteKit blog with readable article pages, RSS/sitemap links, a dev log, and a public promise that the surface stays easy to scan. The adapter repo should therefore optimize for deploy predictability, generated-output integrity, clean static-routing behavior, and simple production guidance rather than broad demo complexity.

| Blog signal | Adapter implication | Status |
| --- | --- | --- |
| Public homepage and article pages are mostly static, source-linked, and low-interaction. | `php-static` should remain the default and must stay boring for normal content routes. | Done |
| RSS, sitemap, article slugs, and dev-log redirects need exact path behavior. | Router parity and base-path safety are release-critical, not optional polish. | Done |
| The blog presents a small trusted public surface. | Repo artifacts, logs, debug leftovers, and generated output need tighter hygiene before stable. | Partial |
| The blog is already a live adapter-backed deployment claim. | Hosted smoke against a real PHP target must be current before any stable `1.0.2` claim. | Done |
| The live homepage currently stays static/no-hydration by observed markers. | Keep `csr=false`/prerendered static theme behavior as a first-class adapter evidence lane. | Done |
| The live SEO crawl is A- but still noisy. | Login/private-route noise and content-template issues should be fixed or excluded in the blog workflow, not hidden in adapter docs. | Done |

## Runtime correctness

| Item | Status | Evidence | Next check |
| --- | --- | --- | --- |
| PHP route handler normalization supports canonical and legacy names. | Done | `adapter/src/utils/php-handlers.ts`; `tests/unit/php-handlers.test.ts` | `bun run test:unit` |
| PHP handler conversion fails fast when no callable route handler is discovered. | Done | `normalizePhpHandlerSource()` throws on empty/unsupported handler-shaped exports. | `bun run test:unit` |
| Form actions parse `$_POST` and fall back to `php://input` for JSON, URL-encoded raw bodies, and raw text. | Done | `adapter/src/runtime/php-templates.ts` action helpers `sk_action_parse_body()`, `sk_action_raw_body()`, `sk_action_form_data()` | `bun run test:unit`; PHP action fixture smoke |
| Action event exposes `request.rawBody`, `request.text()`, `request.json()`, top-level `body`, `rawBody`, and `formData`. | Done | `getActionPhp()` event payload | PHP form/action regression |
| `sk_serialize()` has bounded traversal and object-cycle rejection. | Done | `adapter/src/runtime/php-templates.ts` depth guard and object stack | serializer unit fixture |
| `sk_assert_jsonable()` has bounded traversal before serialization. | Done | `adapter/src/runtime/php-templates.ts` depth guard | serializer unit fixture |
| Streaming deferred serialization support boundary is explicit. | Done | `README.md`, `docs/HOSTING-CONTRACT.md`, and `docs/ALPHA-READINESS.md` state that `php-static` does not claim exact SvelteKit/devalue streaming-deferred parity; use `js-ssr` for exact streamed Svelte document/deferred chunk behavior. | Add PHP-native streaming parity fixtures only if this becomes a supported feature. |
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
| Root `router.php` stays in parity with generated router safety. | Done | Root router is a thin compatibility shim that returns the generated router result; `scripts/verify-root-router-parity.mjs` compares root and generated built-in server responses across page, data, negotiate, missing route, asset, base, protected, and encoded traversal fixtures. | `bun run verify:root-router-parity` passed on 2026-07-01 |
| Built-in server and generated runtime avoid writing router logs by default. | Done | `router_debug_enabled()` and stderr logging | `bun run test:unit` |
| `.env` and `.env.example` are placeholder-safe. | Done | `scripts/verify-alpha-release-prep.mjs`; `.env.example` | `bun run verify:release-prep` |
| Deploy and hosted-smoke commands reject missing, placeholder, malformed, or unsafe env values. | Done | `scripts/utils/config.mjs`; `scripts/run-hosted-alpha-gate.mjs`; `scripts/deploy-precheck.mjs` | `bun run verify:release-prep` |
| Shared config helpers do not load `.env` as an import side effect. | Done | `scripts/utils/config.mjs` is side-effect free; deploy/hosted entrypoints own intentional dotenv loading. | `npm pack --dry-run --json`; `bun run v1:gate:local` |
| Hosted PHP proof exists against a real deployment. | Done | `https://blog.canopydigital.ca/dev/sveltekitphp/` passed remote smoke and the composed hosted alpha gate for `1.0.2-alpha.0` on 2026-07-01. | Rerun before final release or if `/dev/sveltekitphp` is redeployed. |

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
| Native host wrapper smoke handoff has a deterministic artifact. | Done | `/alpha-readiness/native-host-wrapper-smoke.json`; `report/alpha-native-host-wrapper-smoke.json`; `native-host-wrapper-smoke` | `bun run alpha:native:smoke` |
| Windows 11 Mica/browser-safe shell markers are present. | Done | `NativeWindowShell.svelte`; native host contract; SVG/report markers | `bun run verify:alpha` |
| macOS-style titlebar rhythm markers are present. | Done | `NativeTitlebar.svelte`; native visual matrix | `bun run verify:alpha` |
| LG UltraGear desktop-shell helper mapping uses the real `TaskbarProgressState` translation. | Done | `toDesktopShellUiTaskbarProgressState()`; native host contract; release checklist | `bun run test:unit`; `bun run verify:alpha` |
| Report graphics exist for readiness and community source maps. | Done | `bun run alpha:gate:hosted` regenerated `report/alpha-readiness.svg` and `report/alpha-community-source-map.svg`, then verified them through `bun run verify:alpha`. | Keep generated reports synchronized after source edits. |
| Community keyword graph links searches to open-source/community evidence. | Done | `alpha-community-research-pack`, SVG source map, CSV handoffs | `bun run verify:alpha` |
| Community analytics freshness boundary is explicit. | Done | `community-analytics-freshness-contract` markers | `bun run verify:alpha` |
| Source-to-keyword CSV linkage is explicit. | Done | `sourceToKeywordEdge`, `weighted_demand_score`, `source_to_keyword_edge` markers | `bun run verify:alpha` |
| Alpha release checklist is source-rendered and included as runtime/generated evidence. | Done | `/alpha-readiness/release-checklist.md`; `report/alpha-release-checklist.md`; `alphaReleaseChecklistProof` | `bun run verify:alpha` |
| Generated report bundle is current after source edits. | Done | `bun run alpha:gate:hosted` regenerated the report bundle, restored live hosted smoke evidence, and passed final `bun run verify:alpha`. | Regenerate after future report/source edits. |
| No-hydration fixture is covered by hosted smoke. | Done | `/alpha-readiness/no-hydration` verifies the `csr=false` prerender contract and catches script/hydration marker regressions. | `bun run alpha:gate:hosted` |

## Dev adapter and boundary hardening

| Item | Status | Evidence | Next check |
| --- | --- | --- | --- |
| Dev adapters fail safely outside local dev context. | Done | `adapter/src/dev-adapter.ts` and `adapter/src/vite-dev-adapter.ts` reject production/CI use unless `SK_PHP_ALLOW_DEV_ADAPTER=true`; `tests/unit/dev-adapters.test.ts` covers local/test stubs, production rejection, CI rejection, and explicit override. | `bunx vitest run tests/unit/dev-adapters.test.ts` |
| Placeholder behavior emits actionable errors instead of silent degradation. | Done | Dev adapters write deterministic 503 PHP stubs with actionable messages instead of silently pretending to be production output. | `bunx vitest run tests/unit/dev-adapters.test.ts` |
| Browser/PHP runtime does not import Tauri or native host APIs. | Done | Native host contract says native calls remain optional host-wrapper concerns. | `bun run verify:alpha` |

## Verification commands

| Scope | Command |
| --- | --- |
| Regenerate alpha reports | `bun run alpha:report:full` |
| Native wrapper smoke handoff | `bun run alpha:native:smoke` |
| Release-prep safety | `bun run verify:release-prep` passed with 17 checks on 2026-07-02 |
| Alpha report contract | `bun run verify:alpha` |
| Latest Svelte/SvelteKit audit freshness | `bun run verify:latest-sveltekit-audit` |
| Latest same-major consumer fixture | `bun run alpha:latest-same-major:smoke` |
| Latest Vite-major consumer fixture | `bun run alpha:latest-vite-major:smoke` |
| Published alpha npm consumer fixture | `npm run alpha:published:smoke` |
| Root/generated router parity | `bun run verify:root-router-parity` |
| npm release-state probe | `bun run release:npm-state`; after npm login, `bun run release:npm-state:strict` |
| Live blog SEO audit | `Push-Location B:\Temp\@Browser; & B:\Dev\seo_audit_python\.venv\Scripts\python.exe -m seo_audit https://blog.ryanspice.com/ --max-pages 80 --timeout 15 --workers 4 --respect-robots --render-provider playwright --render-pages 5 --page-quality-sample 4 --report-mode developer --allowed-hostname blog.ryanspice.com --no-knowledge-compiler --no-knowledge-compiler-auto-clone --no-obscura-auto-install --out B:\Temp\@Browser\seo_blog_ryanspice_20260701; Pop-Location` |
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
| Hosted PHP smoke must pass against a real deployment. | Done - `https://blog.canopydigital.ca/dev/sveltekitphp/` passed `alpha:gate:hosted` on 2026-07-01. |
| Generated artifacts must be regenerated after current source edits. | Done - `alpha:gate:hosted` regenerated reports and restored hosted smoke pass evidence. |
| Strict `adapter/index.js` artifact sync must pass. | Done - strict artifact sync passed inside `alpha:gate:hosted` on 2026-07-01. |
| Unit, PHP route, E2E, and consumer smoke gates must pass. | Done locally on 2026-06-16 via `bun run verify:all`. |
| npm publish needs authenticated maintainer credentials; `bun run release:npm-state` still returns `E401` locally as of 2026-07-02. | Verify - package dry-run passes and `npm run alpha:published:smoke` is ready, but `npm whoami` returns `E401` until maintainer auth is configured. |
| License must be added before public reuse claims are made. | Done - MIT license added. |
| Blog-style `csr=false` prerender pages must stay no-hydration in hosted smoke. | Done - no-hydration fixture is covered by hosted smoke and `alpha:gate:hosted`. |
| Non-enhanced PHP static HTML SSR for arbitrary dynamic pages needs a clear support boundary or a real SSR fixture. | Done - support boundary is explicit via generated headers, README guidance, checklist, and hosted smoke. |
| Competitive strategy review before hosted proof/npm/license. | Done - external adapter landscape and feature catalogue captured; feature adoption deferred to post-v1 unless it affects release correctness. |
| Large adapter mode-branch dedupe remains a maintainability task before stable. | Pending |

## RC and stable release classification

| Item | Classification | RC requirement | Stable requirement | Current next action |
| --- | --- | --- | --- | --- |
| npm authentication | Release-blocking | Required | Required | `npm whoami` must pass before `npm publish --tag alpha`. |
| Published alpha from npm | Release-blocking | Required | Required | Publish `1.0.2-alpha.0` with `npm publish --tag alpha`. |
| Published alpha consumer smoke | Release-blocking | Required | Required | Run `npm run alpha:published:smoke` after alpha publish. |
| Root `router.php` parity | Release-blocking unless explicitly narrowed | Required | Required | Done locally; keep `bun run verify:root-router-parity` in `v1:gate:local`. |
| Final package hygiene | Release-blocking | Required | Required | Check tracked scratch files and rerun `npm pack --dry-run --json`. |
| Final hosted release target | Release-blocking for stable | Preferred | Required | Rerun `bun run v1:gate` against the final release target before stable publish. |
| Streaming deferred serialization parity | Unsupported/post-stable unless implemented | Not required if documented | Not required if documented | Document the `php-static` boundary or implement exact parity before claiming support. |
| Dev adapter partial polish | Post-stable hardening | Not required | Not required | Keep dev-only boundary; improve smoke tests after stable. |
| Large mode-branch dedupe | Post-stable maintainability | Not required | Not required | Defer unless it causes a release-blocking bug. |
| `sk_prefers_html` template dedupe | Post-stable maintainability | Not required | Not required | Defer; keep behavior covered by fixtures. |
| Debug output cleanup | Post-stable maintainability | Not required | Not required | Keep debug gated and audit after stable. |
| Vite 8 / plugin 7 upgrade | Isolated validation lane | Not required | Not required if documented | Isolated Vite-major fixture proof is current; keep same-major Svelte 5/SvelteKit 2 support as stable claim unless dependency-floor upgrade is intentionally scoped. |
| WordPress/PHP-FPM/remote functions/ISR/image optimization/auth roles | Unsupported for this stable line | Not required | Not required | Keep out of stable claims until each lane has fixtures and hosted proof. |
| Live blog SEO cleanup | Consumer-proof quality follow-up | Not required | Not required | Fix/annotate in blog workflow; only block adapter release if it exposes adapter routing/markup regressions. |

