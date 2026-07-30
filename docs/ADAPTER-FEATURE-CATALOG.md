# SvelteKit PHP adapter feature catalogue

Last reviewed: 2026-07-06

This is the human-readable feature map for `sveltekit-php`. It combines official SvelteKit adapter expectations, Azure Static Web Apps patterns, PHP-FPM/Composer ideas, WordPress/CMS embedding ideas, and this repo's current support level.

## Current Svelte 5/SvelteKit 2 adapter parity snapshot

Latest package evidence captured for the alpha track:

| Package | Latest | Repo range | Support | Notes |
| --- | ---: | --- | --- | --- |
| `svelte` | `5.56.4` | `^5.45.6` | 🟢 | Same-major Svelte 5 support is part of the alpha fixture lane. |
| `@sveltejs/kit` | `2.69.1` | `^2.49.1` | 🟢 | Same-major SvelteKit 2 adapter shape is part of the alpha fixture lane. |
| `@sveltejs/vite-plugin-svelte` | `7.1.4` | `^6.2.1` | 🟡 | Latest major is validated by `alpha:latest-vite-major:smoke`; it is not the support floor. |
| `vite` | `8.1.3` | `^7.2.6` | 🟡 | Latest major is validated by `alpha:latest-vite-major:smoke`; it is not the support floor. |

Official adapter comparison snapshot:

| Adapter | Latest | Support | What this repo should emulate |
| --- | ---: | --- | --- |
| `@sveltejs/adapter-node` | `5.5.7` | 🟡 | Origin, trusted proxy headers, address policy, body-size, and lifecycle guard patterns. |
| `@sveltejs/adapter-static` | `3.0.10` | 🟢 | Static/prerendered output, fallback/strict thinking, trailing slash rules, and no-hydration static pages. |
| `@sveltejs/adapter-cloudflare` | `7.2.9` | 🟡 | Platform context and static/dynamic header boundaries. |
| `@sveltejs/adapter-netlify` | `6.0.4` | 🟡 | Forms and platform-context comparison, not Netlify behavior claims. |
| `@sveltejs/adapter-vercel` | `6.3.4` | 🟡 | Per-route config, skew protection, ISR, and image optimization as deferred ideas. |
| `@sveltejs/adapter-auto` | `7.0.1` | 🟡 | Package discoverability and explicit adapter selection, not zero-config PHP host detection. |

Live consumer evidence:

| Surface | Result | Support |
| --- | --- | --- |
| `https://blog.ryanspice.com/` | `200`, `data-site="ryan"`, Ryan metadata present, no observed `sveltekit:start`, no module script marker, no `__sveltekit` marker. | 🟢 Consumer proof for static/no-hydration theme stability. |
| `robots.txt` and `sitemap.xml` | Both returned `200`. | 🟢 Public crawler surface is healthy. |
| `seo_audit_python` | 32 pages, score `91`, grade `A-`, 2 high, 5 medium, 13 low, 1 info findings. | 🟡 Useful consumer proof, but content/template cleanup remains. |
| Dedicated hosted PHP adapter fixture | Working-ground route is current alpha hosted proof. | 🟢 `https://blog.canopydigital.ca/dev/sveltekitphp/` was refreshed and `bun run alpha:deploy:dev-host -- --apply --smoke` passed hosted smoke for `1.0.2-alpha.0` on 2026-07-01. |

## Legend

Support level:

- 🟢 Supported: implemented in this repo and part of the current contract.
- 🟡 Partial: implemented only for some modes, documented but not fully enforced, or still needs stronger hosted evidence.
- 🔴 Missing or not claimed: not implemented, intentionally out of scope, or blocked before stable.

Checkbox state:

- `[x]` means the repo already has a source/docs/runtime contract for this item.
- `[ ]` means it is a candidate, blocker, or future item.

Priority:

- `P0`: stable-release correctness or safety.
- `P1`: high-value v1.x reliability or deployment clarity.
- `P2`: useful differentiation after stable proof.
- `P3`: host-specific, advanced, or likely separate package/profile.

## Double-check summary

This pass rechecked the catalogue against current official docs and community adapter sources.

- [x] 🟢 Official adapter contract: SvelteKit adapters still revolve around `adapt(builder)`, optional `emulate`, optional `supports`, output writing, manifest generation, `server.respond`, platform data, bundling, and correct placement of static/client/server output.
- [x] 🟢 Static adapter baseline: `adapter-static` still frames fully prerendered output, `fallback`, `precompress`, `strict`, and trailing-slash behavior as the relevant static-host contract.
- [x] 🟢 Node adapter baseline: `adapter-node` remains the best source for env-driven runtime knobs: `ORIGIN`, forwarded host/protocol/port headers, address headers, body size limits, keep-alive/shutdown behavior, `envPrefix`, and custom server/health-route patterns.
- [x] 🟢 Latest Svelte/SvelteKit same-major snapshot: `svelte@5.56.4` and `@sveltejs/kit@2.69.1` remain same-major alpha gate targets.
- [x] 🟡 Latest Vite/plugin snapshot: `vite@8.1.3` and `@sveltejs/vite-plugin-svelte@7.1.4` are covered by `alpha:latest-vite-major:smoke` as latest-major validation lanes, not dependency-floor upgrades.
- [x] 🟢 Live blog consumer proof: `blog.ryanspice.com` currently corroborates static/no-hydration homepage behavior and returns healthy robots/sitemap responses.
- [x] 🟢 Azure SWA baseline: `svelte-adapter-azure-swa` still splits static output and Azure Function SSR output, uses `build/static` and `build/server` by default, exposes `apiDir`/`staticDir`, and protects critical SWA routing config.
- [x] 🟢 Azure platform config: `staticwebapp.config.json` remains the useful model for declarative routes, auth/roles, rewrites, redirects, fallback exclusions, response overrides, headers, MIME types, runtime selection, forwarding hosts, and required headers.
- [x] 🟢 PHP/community baseline: `vite-plugin-sveltekit-php-backend` is still a PHP-FPM/Composer/SvelteKit-as-router lane, not the same lane as shared-hosting static PHP deployment.
- [x] 🟢 CMS/template baseline: `sveltekit-adapter-html-like` and WordPress adapters still mainly contribute transform, injection, path/base/assets, `renderHead`/`renderBody`, and style-isolation ideas.
- [x] 🟢 No material correction found: the first-pass priorities still hold. The only tightening is support labeling: several items are now explicitly `🟡 Partial` instead of implied support.

## Current support dashboard

| Check | Support | Feature | Current repo posture | Next action |
| --- | --- | --- | --- | --- |
| [x] | 🟢 | `php-static` shared-hosting output | Main deployment lane. Generates PHP deploy output for static/prerendered shells plus PHP data/action helpers. | Keep as default lane. |
| [x] | 🟢 | PHP route handlers | `+page.server.php` and `+server.php` route logic are core fixtures, with handler normalization already added. | Keep tests green. |
| [x] | 🟢 | PHP form actions | Basic PHP action handling exists and hosted/local smoke covers `/form-basic`. | Expand edge-case coverage only when needed. |
| [x] | 🟢 | Router path safety | Path traversal, encoded traversal, protected paths, and generated-router safety are already part of the hardening lane. | Add reserved-prefix checklist next. |
| [x] | 🟢 | Env safety | `.env` safety, `.env.example`, release-prep verification, and deploy precheck exist. | Keep release-prep gate before publish. |
| [x] | 🟢 | Generated artifact sync | `verify:artifacts` exists and strict mode is part of the local v1 gate. | Keep generated output source-owned. |
| [x] | 🟢 | MIT license | Root `LICENSE` and package metadata now declare MIT. | Re-run package dry-run before publish. |
| [x] | 🟢 | `csr=false` no-hydration fixture | `/alpha-readiness/no-hydration` proves prerendered no-hydration static output with `csr-disabled-prerender-contract` and `theme-stable-ssr-html` markers. | Keep as required alpha evidence and hosted smoke coverage. |
| [x] | 🟢 | `php-static` client-fallback boundary | Non-prerendered `php-static` page shims expose fallback headers instead of pretending to be PHP document SSR. | Keep boundary explicit in docs and smoke. |
| [x] | 🟢 | Svelte 5/SvelteKit 2 same-major adapter shape | `supports`, `emulate().platform`, php-static, PHP handlers/actions, no-hydration fixture, and report graphics align with current SvelteKit 2 adapter guidance. | Keep `alpha:latest-same-major:smoke` in the alpha lane. |
| [x] | 🟢 | Live blog static/no-hydration consumer proof | `blog.ryanspice.com` homepage, robots, sitemap, and SEO crawl evidence are now recorded as consumer proof. | Keep separate from hosted adapter fixture proof. |
| [x] | 🟡 | `js-ssr` sidecar lane | Real dynamic Svelte document SSR is available only through the JS sidecar mode. | Needs stronger production recipe and hosted proof. |
| [x] | 🟡 | Root `router.php` parity | Root router exists, generated router is hardened, but parity remains easy to drift. | Add fixture-driven parity checks. |
| [x] | 🟡 | Base/path resolution | Existing routing handles normal paths, fallback asset exclusions, and MIME parity; trailing-slash assertions still need stronger hosted coverage. | Add trailing-slash fixture assertions. |
| [x] | 🟡 | Origin/proxy handling | `docs/HOSTING-CONTRACT.md` now defines the Node-style origin/proxy env contract and spoofing warning; runtime trusted-header guards remain future work. | Add runtime parsing only with host/proxy fixtures. |
| [ ] | 🔴 | External hosted PHP proof | Local PHP hosted gate passed, but real external PHP host smoke is still required before stable. | Deploy fixture and run `v1:gate:hosted`. |
| [ ] | 🔴 | npm publish proof | Package is not publish-proven because local npm auth previously failed. | Authenticate and publish alpha only. |
| [x] | 🟢 | Adapter `supports` hooks | Implemented for `$app/server` `read` and `instrumentation.server.js`: `php-static` fails clearly, `js-ssr` remains the sidecar lane. | Keep messages aligned with SvelteKit docs. |
| [x] | 🟢 | Adapter `emulate().platform` | Implemented as a non-secret `event.platform.php` contract for dev/build/preview with mode, output, base path, runtime capability, version, prerender, and build-identity presence. | Keep the surface capability-only; do not expose env values or marker payloads. |
| [ ] | 🔴 | Composer bootstrap | Not implemented in core. Useful but requires path safety and fixtures. | Candidate v1.x item. |
| [ ] | 🔴 | PHP-FPM dev bridge | Not this repo's current deployment lane. | Keep as future profile/package. |
| [ ] | 🔴 | WordPress/CMS profile | Not implemented in core. | Recipe first, optional profile later. |

## P0 stable checklist

| Check | Support | Item | Why it matters | Status / next move |
| --- | --- | --- | --- | --- |
| [x] | 🟢 | Honest `php-static` SSR boundary | Prevents users from confusing client fallback with real PHP-side Svelte document SSR. | Done through headers, README, smoke expectations, and no-hydration fixture. |
| [x] | 🟢 | PHP handler normalization | Existing legacy handler names continue to work while canonical names remain supported. | Done. Keep unit coverage. |
| [x] | 🟢 | Route/path traversal safety | Shared hosting routers are an attack surface. | Done for generated router; root parity remains separate. |
| [x] | 🟢 | Env and secret safety | Public adapter repos must not ship real deploy values. | Done through placeholders/prechecks. |
| [ ] | 🔴 | Real hosted PHP smoke | Stable release needs proof outside the local PHP server. | Still required before stable. |
| [ ] | 🔴 | npm alpha publish proof | Package must be installable by consumers before stable iteration makes sense. | Blocked on npm auth. |
| [x] | 🟢 | Adapter `supports` checks | Users should get build-time clarity for unsupported production APIs. | Implemented for `read` and instrumentation. |
| [x] | 🟢 | Reserved route validation | Azure SWA's `/api` reserved-route check is a useful model; this adapter needs its own generated-prefix guard. | Implemented for generated adapter segments and files in strict mode. |
| [x] | 🟢 | Fallback asset exclusions | Azure `navigationFallback.exclude` maps directly to avoiding JS/CSS/image requests receiving fallback HTML. | Hosted smoke now probes missing asset-like paths. |
| [x] | 🟡 | Vite 8 / plugin 7 validation lane | Latest npm has moved beyond the repo's current Vite/plugin major range, and the isolated smoke lane proves the current adapter fixture still builds. | Keep `alpha:latest-vite-major:smoke` current before raising dependency floors. |
| [x] | 🟡 | Origin/proxy/body-size runtime contract | Node adapter docs show these are production correctness and security features, not polish. | Docs are added in `docs/HOSTING-CONTRACT.md`; runtime guards remain future work. |

## P1 reliability checklist

| Check | Support | Item | Source model | PHP path |
| --- | --- | --- | --- | --- |
| [x] | 🟢 | `supports.read` / `supports.instrumentation` | Official writing-adapters API | Descriptive build-time errors for unsupported `php-static` features. |
| [x] | 🟢 | Mode-aware `event.platform.php` | Official `emulate().platform` | Exposes mode/base/path/runtime capabilities without secrets. |
| [x] | 🟡 | Trusted forwarded headers | `adapter-node` | Docs define `SK_ORIGIN`, trusted proto/host/port headers, and spoofing warnings; runtime parsing stays future until proxy fixtures exist. |
| [x] | 🟡 | Client address policy | `adapter-node` `ADDRESS_HEADER` / `XFF_DEPTH` | Docs define `SK_ADDRESS_HEADER` and `SK_XFF_DEPTH` as disabled-by-default; right-side trusted proxy parsing remains future work. |
| [x] | 🟡 | Body size limit | `adapter-node` `BODY_SIZE_LIMIT` | Docs define PHP-owned limits and future `SK_BODY_SIZE_LIMIT`; runtime raw-body guard remains future work. |
| [ ] | 🔴 | Host config generation model | Azure SWA protected config merge | Core `.htaccess`/Nginx/PHP rules stay protected; user headers/redirects/MIME rules merge safely. |
| [x] | 🟡 | Route-specific/global headers docs | Azure SWA `globalHeaders` / route headers | `docs/HOSTING-CONTRACT.md` documents static-file versus PHP-response ownership; generated host-config merge remains future work. |
| [x] | 🟡 | Custom MIME map | Azure SWA `mimeTypes` | Router MIME parity and host snippets cover JSON maps, webmanifest, SVG, WASM, AVIF, and fonts; user-configurable MIME merge remains future work. |
| [x] | 🟡 | Trailing slash recipe | `adapter-static` / Azure trailing-slash behavior | `docs/HOSTING-CONTRACT.md` documents `trailingSlash` host matching; fixture assertions remain future work. |
| [ ] | 🔴 | Composer autoload hook | PHP-FPM/Composer adapter lane | Add optional `phpBootstrap` with path safety and PHP smoke fixture. |

## P2 differentiation checklist

| Check | Support | Feature | Source model | Why it waits |
| --- | --- | --- | --- | --- |
| [ ] | 🔴 | Static HTML transform API | `sveltekit-adapter-html-like` | Useful, but touches generated output; needs fixture and artifact-sync safety. |
| [ ] | 🔴 | Tag injection | `sveltekit-adapter-html-like` | Good for PHP/Blade/CMS shells, but should be constrained to prerendered output. |
| [ ] | 🔴 | String replacement | `sveltekit-adapter-html-like` | Powerful but risky for secrets/runtime drift; docs first. |
| [ ] | 🔴 | Custom output extensions | `sveltekit-adapter-html-like` | Useful for `.blade.php`/Twig style output; avoid changing routing semantics. |
| [ ] | 🔴 | WordPress/CMS recipe | WordPress shortcode/admin adapters | Needs real target example. Start with docs, not core runtime changes. |
| [ ] | 🔴 | `renderHead` / `renderBody` hooks | WordPress adapters | Embedding feature; add only if multiple CMS recipes need it. |
| [ ] | 🔴 | Style isolation docs | WordPress adapters | Useful guidance, but shadow DOM should not be core default. |
| [ ] | 🔴 | Skew protection guidance | Vercel | Use atomic deploy/cache docs before trying a cookie/build-id runtime feature. |
| [ ] | 🔴 | Optional health endpoint | `adapter-node` custom server pattern | Useful for ops, but should be disabled/protected by default. |

## P3 separate-lane checklist

| Check | Support | Feature | Reason to keep separate |
| --- | --- | --- | --- |
| [ ] | 🔴 | PHP-FPM direct dev bridge | This is a different runtime lane from shared hosting and requires FastCGI assumptions. |
| [ ] | 🔴 | WordPress plugin/admin generator | Host-specific PHP metadata and admin menus do not belong in the core shared-hosting adapter. |
| [ ] | 🔴 | ISR/cache regeneration | Needs concrete invalidation, cache-control, and host write-permission design. |
| [ ] | 🔴 | Image optimizer/proxy | Better handled by build tooling or CDN; PHP image proxy would expand scope and risk. |
| [ ] | 🔴 | Auth/roles platform | Azure-style auth is platform-owned. In PHP core, auth should remain app-owned unless a specific host integration exists. |

## External adapter parity matrix

| Family | Checked source | What they do better | Our support | Adoption decision |
| --- | --- | --- | --- | --- |
| Official adapter API | SvelteKit writing-adapters docs | `supports`, `emulate`, platform context, clear output expectations. | 🟢 `supports` guardrails exist; 🟢 `emulate().platform` exposes `event.platform.php`; 🟢 adapter output exists. | Keep parity checks tied to release-prep so the adapter contract does not drift. |
| Static adapter | SvelteKit adapter-static docs | Clear strict/fallback/precompress/trailing-slash contract. | 🟡 Partial. Static/prerender lane exists; strict fallback semantics need stronger checks. | Adopt stricter mode warnings and fallback exclusions. |
| Node adapter | SvelteKit adapter-node docs | Runtime env contract for origin, proxy headers, body size, address, shutdown, custom server. | 🟡 Partial. Basic PHP runtime works; Node-style safety knobs not fully formalized. | Adopt origin/proxy/body-size docs and small guards. |
| Vercel | SvelteKit adapter-vercel docs | Per-route config, split functions, image config, ISR, skew protection. | 🔴 Mostly missing/not claimed. | Only adopt deployment-skew docs; defer ISR/image config. |
| Netlify | SvelteKit adapter-netlify docs | Platform context, forms guidance, edge/serverless split. | 🟡 Partial for forms; 🔴 platform context. | Keep forms/prerender docs; platform context later. |
| Cloudflare | SvelteKit adapter-cloudflare docs | Platform emulation, asset/dynamic header boundary, `_headers`/`_redirects`, bindings. | 🟡 Partial through router/runtime docs. | Adopt static-vs-PHP header boundary docs. |
| Azure SWA adapter | `geoffrich/svelte-adapter-azure-swa` | Split static/server output, SWA config, reserved-route checks, local emulator config. | 🟡 Partial. Output exists but host-config/reserved-route model is not as mature. | Best model for next host-config pass. |
| Azure SWA platform | Microsoft SWA config docs | Declarative routes, auth, fallback exclusions, headers, MIME, response overrides, forwarding gateway. | 🔴 Mostly missing as declarative config. | Adopt selected concepts: fallback excludes, MIME, headers, required/forwarded host checks. |
| HTML-like adapter | `idleberg/sveltekit-adapter-html-like` | Injection, replacement, minify/prettify, custom extensions. | 🔴 Missing. | Post-v1 transform API only. |
| WordPress shortcode/admin | WordPress adapter repos | `index.php`, base/assets examples, `renderHead`, `renderBody`, shadow/style isolation. | 🔴 Missing. | Recipe/profile, not core. |
| PHP-FPM backend plugin | `vite-plugin-sveltekit-php-backend` | Composer/PHP-FPM lane with SvelteKit as router. | 🟡 Concept overlap through PHP route files; 🔴 no FPM bridge. | Separate profile/package; Composer bootstrap can land earlier. |

## Features we have now

- [x] 🟢 PHP shared-hosting default lane via `php-static`.
- [x] 🟢 Optional JS sidecar lane via `js-ssr` for real Svelte document SSR.
- [x] 🟢 PHP server load/action/endpoint route handlers.
- [x] 🟢 Legacy/canonical PHP handler normalization.
- [x] 🟢 Form action body parsing path.
- [x] 🟢 Router path-safety hardening.
- [x] 🟢 Local release gates and artifact-sync gate.
- [x] 🟢 Env safety checks and deploy precheck.
- [x] 🟢 Package metadata, MIT license, and publish allowlist.
- [x] 🟢 No-hydration `csr=false` fixture for blog/static skins, required alpha evidence, and hosted smoke forbidden hydration-marker checks.
- [x] 🟢 Explicit client-fallback boundary for non-prerendered `php-static` pages.
- [x] 🟢 Adapter `supports` guardrails for unsupported `php-static` production APIs.
- [x] 🟢 Reserved route validation for generated adapter paths.
- [x] 🟢 Hosted smoke asset-fallback exclusions for missing JS, CSS, SVG, webmanifest, WASM, and JSON asset-like paths.
- [x] 🟢 Router MIME parity coverage for JSON maps, webmanifest, WASM, SVG, AVIF, and fonts.

## Features we should add next

- [ ] 🔴 Origin/proxy/body-size runtime guards.
- [ ] 🔴 Real external hosted PHP smoke proof.
- [ ] 🔴 Package dry-run proof after MIT/catalogue file changes.

## Features to defer unless a real deployment needs them

- [ ] 🔴 WordPress plugin/admin generation.
- [ ] 🔴 PHP-FPM direct bridge.
- [ ] 🔴 ISR-style regeneration.
- [ ] 🔴 PHP image optimizer/proxy.
- [ ] 🔴 Generic auth/roles framework.
- [ ] 🔴 Broad HTML rewrite/replace API before hosted proof.

## Source set

| Source | What was rechecked |
| --- | --- |
| [SvelteKit writing adapters](https://svelte.dev/docs/kit/writing-adapters) | Adapter API, `emulate`, `supports`, build output expectations, `server.respond`, platform context. |
| [SvelteKit adapter-static](https://svelte.dev/docs/kit/adapter-static) | `pages`, `assets`, `fallback`, `precompress`, `strict`, trailing slash, prerender contract. |
| [SvelteKit adapter-node](https://svelte.dev/docs/kit/adapter-node) | `ORIGIN`, forwarded headers, `ADDRESS_HEADER`, `XFF_DEPTH`, `BODY_SIZE_LIMIT`, `envPrefix`, custom server/health route pattern. |
| [SvelteKit adapter-vercel](https://svelte.dev/docs/kit/adapter-vercel) | Per-route config, split functions, image optimization, ISR, skew protection, deployment notes. |
| [SvelteKit adapter-netlify](https://svelte.dev/docs/kit/adapter-netlify) | Platform context, serverless/edge split, forms, filesystem/read caveats. |
| [SvelteKit adapter-cloudflare](https://svelte.dev/docs/kit/adapter-cloudflare) | Platform emulation, headers/redirects boundary, bindings/context, filesystem/read caveats. |
| [SvelteKit adapter-auto](https://svelte.dev/docs/kit/adapter-auto) | Azure SWA listed as community adapter target; adapter-specific options require concrete adapters. |
| [geoffrich/svelte-adapter-azure-swa](https://github.com/geoffrich/svelte-adapter-azure-swa) | Static/server output layout, Azure Function SSR, `apiDir`, `staticDir`, SWA local CLI config, custom config safeguards. |
| [Azure Static Web Apps configuration](https://learn.microsoft.com/en-us/azure/static-web-apps/configuration) | Routes, auth/roles, rewrites, redirects, fallback exclusions, response overrides, headers, MIME, runtime, forwarding gateway. |
| [idleberg/sveltekit-adapter-html-like](https://github.com/idleberg/sveltekit-adapter-html-like) | Static-template output, injection, replacement, minify/prettify, custom extensions. |
| [tomatrow/sveltekit-adapter-wordpress-shortcode](https://github.com/tomatrow/sveltekit-adapter-wordpress-shortcode) | WordPress shortcode embedding, `index.php`, base/assets, `renderHead`, `renderBody`, style isolation. |
| [lolcabanon/sveltekit-adapter-wordpress-admin](https://github.com/lolcabanon/sveltekit-adapter-wordpress-admin) | WordPress admin/plugin lane and MIT/public package posture. |
| [basuke/vite-plugin-sveltekit-php-backend](https://github.com/basuke/vite-plugin-sveltekit-php-backend) | PHP route files, form actions/endpoints, PHP-FPM/FastCGI, Composer compatibility, SvelteKit-as-router lane. |

## Decision rules

- Do not claim PHP-native dynamic document SSR. Use `js-ssr` when Svelte SSR JavaScript must execute at request time.
- Prefer generated config and smoke tests over prose-only deployment promises.
- Keep host-specific features behind recipes or profiles until real deployments need them.
- If a feature can break routing, path safety, or generated artifact sync, it must ship with a fixture and a verification gate.
- If a feature mostly helps WordPress, Azure, or PHP-FPM users, avoid making it required for basic shared hosting.

