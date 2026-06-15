# SvelteKit PHP audit checklist

This checklist consolidates the Fable 5 audit, the SvelteKit PHP adapter fix plan, and the current `1.0.0-alpha` evidence work. Treat it as the repo-level release hardening tracker. Generated `report/` artifacts must still be regenerated before any checked result can be called current.

## Status legend

| Status | Meaning |
| --- | --- |
| Done | Source-level fix or contract exists in the current tree. |
| Partial | Some protection exists, but the evidence is incomplete or not yet verified. |
| Pending | Known work remains before alpha or stable release. |
| Verify | Requires commands, hosted smoke, or artifact regeneration before it is proven. |

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

## Router and deployment security

| Item | Status | Evidence | Next check |
| --- | --- | --- | --- |
| Generated router rejects traversal, dot segments, encoded traversal, control bytes, and `_protected` access. | Done | `adapter/src/runtime/router/shared.ts` | `bun run test:unit`; hosted smoke probes |
| Root `router.php` stays in parity with generated router safety. | Partial | Root router exists separately; generated shared router is hardened. | Add/keep parity fixture checks |
| Built-in server and generated runtime avoid writing router logs by default. | Done | `router_debug_enabled()` and stderr logging | `bun run test:unit` |
| `.env` and `.env.example` are placeholder-safe. | Done | `scripts/verify-alpha-release-prep.mjs`; `.env.example` | `bun run verify:release-prep` |
| Deploy and hosted-smoke commands reject missing, placeholder, malformed, or unsafe env values. | Done | `scripts/utils/config.mjs`; `scripts/run-hosted-alpha-gate.mjs`; `scripts/deploy-precheck.mjs` | `bun run verify:release-prep` |
| Hosted PHP proof exists against a real deployment. | Verify | Requires `ALPHA_SMOKE_BASE_URL` and `report/alpha-remote-smoke.json` with `status=passed`. | `bun run alpha:gate:hosted` |

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
| Package track is explicitly `1.0.0-alpha.0`, not RC/stable. | Done | `package.json`; alpha release policy metadata | `bun run verify:release-prep` |
| Release policy says project `1.0.0-alpha` ranks above RC labels for this repo. | Done | `sveltekitPhpReleasePolicy`; release manifest/report contracts | `bun run verify:alpha` |
| LICENSE exists if the adapter is intended for external reuse. | Pending | No root `LICENSE` was present during audit inspection. | Add chosen license |
| Scratch artifacts are ignored. | Done | `.gitignore` ignores debug logs, report output, Playwright output, build output, `.htaccess.test`, `test.php`, `verbose/.last-run.json`, and `tools/*.patch`. | Confirm tracked-file status manually |
| Root scratch artifacts are removed from tracked source if already committed. | Verify | Files such as `test.php`, `.htaccess.test`, debug logs, and local build output may still exist locally. | Use git status before cleanup |
| Package files include only intended publish artifacts. | Partial | `package.json` files list is narrow, but generated runtime file inclusion should be audited before publish. | `bun run alpha:consumer:smoke` |

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
| Generated report bundle is current after source edits. | Verify | Current source changed after last generation. | `bun run alpha:report:full` |

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

## Stable release blockers

| Blocker | Status |
| --- | --- |
| Hosted PHP smoke must pass against a real deployment. | Verify |
| Generated artifacts must be regenerated after current source edits. | Verify |
| Strict `adapter/index.js` artifact sync must pass. | Verify |
| Unit, PHP route, E2E, and consumer smoke gates must pass. | Verify |
| License must be added before public reuse claims are made. | Pending |
| Large adapter mode-branch dedupe remains a maintainability task before stable. | Pending |
