# Latest Svelte and SvelteKit compatibility audit

Date: 2026-07-06

This audit updates the 1.0.2-alpha goal against current official Svelte and SvelteKit guidance plus the current npm latest package surface. It is an alpha evidence artifact, not a dependency-upgrade commit.

## Sources checked

- Official SvelteKit adapter guidance: <https://svelte.dev/docs/kit/writing-adapters>
- Official SvelteKit adapter overview: <https://svelte.dev/docs/kit/adapters>
- Official SvelteKit build guidance: <https://svelte.dev/docs/kit/building-your-app>
- Official SvelteKit page options guidance: <https://svelte.dev/docs/kit/page-options>
- Official SvelteKit project-type guidance: <https://svelte.dev/docs/kit/project-types>
- Official SvelteKit remote-functions guidance: <https://svelte.dev/docs/kit/remote-functions>
- Official Svelte 5 migration guidance: <https://svelte.dev/docs/svelte/v5-migration-guide>
- Official Svelte browser support guidance: <https://svelte.dev/docs/svelte/browser-support>
- Local unsupported-feature policy: `docs/REMOTE-FUNCTIONS-ALPHA-POLICY.md`
- npm registry latest snapshot captured with `npm view` on 2026-07-06.
- Official adapter npm latest snapshot captured with `npm view` on 2026-07-06.
- Live consumer proof surface: <https://blog.ryanspice.com/>.
- Live crawl evidence from `seo_audit_python`.
- Latest package snapshot freshness verifier: `bun run verify:latest-sveltekit-audit`.
- Latest same-major fixture smoke: `bun run alpha:latest-same-major:smoke`.
- Latest Vite-major fixture smoke: `bun run alpha:latest-vite-major:smoke`.

## Latest package snapshot

| Package | npm latest | Current repo range | Alpha support stance |
| --- | ---: | --- | --- |
| `svelte` | `5.56.4` | `^5.45.6` | Green. Same major range, but alpha gates must run against the resolved latest 5.x before claiming compatibility. |
| `@sveltejs/kit` | `2.69.1` | `^2.49.1` | Green. Same major range and current adapter shape are covered by the latest-same-major fixture lane. |
| `@sveltejs/vite-plugin-svelte` | `7.1.4` | `^6.2.1` | Yellow. Latest is validated by the isolated Vite-major fixture lane, but it is not the repo dependency floor. |
| `vite` | `8.1.3` | `^7.2.6` | Yellow. Latest is validated by the isolated Vite-major fixture lane, but it is not the repo dependency floor. |

Latest package snapshot freshness is enforced by `scripts/verify-latest-sveltekit-audit.mjs`, which compares this table with current `npm view <package> version` output for `svelte`, `@sveltejs/kit`, `@sveltejs/vite-plugin-svelte`, and `vite`.

Latest same-major build compatibility is enforced by `scripts/smoke-latest-same-major.mjs`. The smoke packs `sveltekit-php`, installs it into a temporary SvelteKit fixture with npm-latest `svelte@5.x` and `@sveltejs/kit@2.x`, keeps `vite` and `@sveltejs/vite-plugin-svelte` on the current validated major lane, runs `vite build`, and checks the generated PHP/static output for `index.php`, `.htaccess`, `router.php`, `_runtime/compat.php`, `adapter/route-manifest.php`, and a `csr=false` no-hydration fixture marker.

Latest Vite-major build compatibility is enforced by `scripts/smoke-latest-vite-major.mjs` and the `latest-vite-major-validation` evidence marker. The smoke packs `sveltekit-php`, installs npm-latest `svelte@5.x`, `@sveltejs/kit@2.x`, `vite@8.x`, and `@sveltejs/vite-plugin-svelte@7.x` into a temporary fixture, runs `vite build`, and checks the same PHP/static no-hydration output contract without changing the repo dependency floors.

## Official adapter snapshot

| Package | npm latest | Alpha parity stance |
| --- | ---: | --- |
| `@sveltejs/adapter-node` | `5.5.7` | Yellow. Node remains the model for origin, trusted proxy headers, client address policy, body-size limits, and lifecycle guards. PHP runtime guards are still a backlog item. |
| `@sveltejs/adapter-static` | `3.0.10` | Green. `php-static`, prerendered output, strict static expectations, trailing slash guidance, and the no-hydration fixture align most closely with this adapter. |
| `@sveltejs/adapter-cloudflare` | `7.2.9` | Yellow. Platform context and static-vs-dynamic header boundaries inform `event.platform.php` and host contract docs, but bindings are not PHP runtime claims. |
| `@sveltejs/adapter-netlify` | `6.0.4` | Yellow. Forms, platform context, and serverless/edge split remain comparison inputs; this repo should not claim Netlify-style platform behavior. |
| `@sveltejs/adapter-vercel` | `6.3.4` | Yellow. Per-route deployment config, skew protection, ISR, and image optimization stay deferred or documentation-only until hosted proof and publishability are current. |
| `@sveltejs/adapter-auto` | `7.0.1` | Yellow. Zero-config platform detection is not a shared PHP hosting goal; package metadata and docs should make explicit adapter selection easy. |

Official adapter snapshot support is reflected in generated alpha report data under `latestPackageSnapshot` and `officialAdapterSnapshot`.

## Compatibility matrix

| Area | Current status | Alpha requirement |
| --- | --- | --- |
| Adapter API shape | Green. The adapter exposes `name`, `adapt`, `supports`, and `emulate` surfaces expected by current custom-adapter guidance. | Keep `supports` and `emulate` covered by alpha evidence and verify against the latest same-major SvelteKit builder. |
| Builder output contract | Green/yellow. The adapter generates PHP runtime output, static assets, prerender artifacts, and server manifests, and now has fixture smokes against npm-latest Svelte 5/SvelteKit 2 plus isolated Vite 8/plugin 7. | Keep `alpha:latest-same-major:smoke` and `alpha:latest-vite-major:smoke` in the alpha evidence lane; do not raise dependency floors without a separate scope. |
| `supports` and `$app/server.read` support | Green. The adapter has mode-aware `supports.read` handling with clear unsupported `php-static` behavior and sidecar positioning. | Keep read-support behavior covered by fixture and runtime-router gates before stable. |
| `emulate().platform` | Green. The adapter exposes non-secret `event.platform.php` capability data for dev/build/preview. | Keep the platform surface capability-only and avoid leaking env values or marker payloads. |
| Instrumentation support | Green. The adapter declares instrumentation support through `supports`. | Keep this as alpha evidence, and do not claim stable until runtime smoke confirms no PHP entrypoint regression. |
| `csr = false` and prerender behavior | Green. The existing no-hydration/prerender contract aligns with current page-option guidance, and `blog.ryanspice.com` currently corroborates the static/no-hydration consumer behavior on the live homepage. | Preserve the rule that non-interactive public pages may set `csr = false`, while action routes and dynamic endpoints cannot be treated as prerender-only. |
| Form actions | Yellow. SvelteKit actions cannot be prerendered, and PHP action dispatch remains a high-risk compatibility point. | Keep action/form fixtures in alpha gates, including legacy PHP handler normalization and generated-router parity. |
| Endpoint dispatch | Yellow. Generated PHP routing is the compatibility boundary, and root `router.php` parity remains required. | Continue treating router parity and path safety as required alpha evidence. |
| Svelte 5 migration posture | Green/yellow. The repo is Svelte 5-aligned and should prefer `$app/state`, callback props, runes in new code, and server-first data boundaries. | Do not introduce new `$app/stores`, `createEventDispatcher`, broad legacy component APIs, or client-only load leakage in alpha work. |
| Browser support | Green. Svelte's current baseline is modern-browser oriented, not legacy IE support. | Keep generated PHP/browser output aligned with Svelte's browser support baseline and avoid promising unsupported legacy browsers. |
| Remote functions and newer Kit features | Yellow. `remote-functions-alpha-policy` now blocks `kit.experimental.remoteFunctions`, `.remote.*` files, and generated HTTP endpoint support until PHP runtime proof exists. | Before stable, add a fixture proving PHP routing for remote-function generated endpoints, or keep the unsupported-feature policy explicit. |
| Vite 8 and vite-plugin-svelte 7 | Yellow. These latest-major dependencies are validated by the isolated fixture lane, but remain outside the current repo ranges. | Keep the isolated smoke current and do not upgrade in-place without a separate dependency-floor change. |

Remote functions generated HTTP endpoint support is blocked by `remote-functions-alpha-policy` until the PHP router has fixture and hosted proof.

## Live blog consumer evidence

`blog.ryanspice.com` is now recorded as live consumer proof for static/no-hydration behavior, but not as a replacement for the dedicated hosted PHP adapter fixture.

| Evidence | Result | Alpha interpretation |
| --- | --- | --- |
| Homepage | `200`; `data-site="ryan"` and Ryan metadata present. | Consumer proof that a real static public shell can preserve the intended site identity. |
| Hydration markers | No `sveltekit:start`, no `<script type="module"`, and no `__sveltekit` marker observed in homepage HTML. | Supports the `csr=false` and php-static theme-stability contract for static skins. |
| `robots.txt` | `200`; sitemap directive present. | Public crawler surface is reachable. |
| `sitemap.xml` | `200`; URL set and hreflang alternates present. | Static route output and SEO route expectations are working on the live consumer. |
| `seo_audit_python` | Report `blog.ryanspice.com-root-20260701T060746Z-v0_4_9`; 28 pages; score `91`; grade `A-`; 2 high, 5 medium, 13 low, 1 info findings. | Good consumer proof; the high findings are confined to the intentionally private `/login` route, with content/template cleanup remaining outside this adapter docs pass. |

Findings to feed into future blog work:

- Treat `/login` SEO findings as private-route noise while login remains intentionally non-indexed: `noindex`, `nofollow`, thin content, and invalid JSON-LD should stay excluded/annotated in audit workflow, or be fixed if the route becomes public.
- Fix content-template quick wins: duplicate PixelBoats titles, long titles, weak meta descriptions, repeated `open copy link share` phrase noise, missing dimensions on SVG article images, and unnecessary `d3` references.
- Keep homepage static/no-hydration behavior as consumer proof for the adapter's `csr=false` and PHP-static theme-stability contract.
- Run future `seo_audit_python` crawls from `B:\Temp\@Browser` or add a shortcut-output option so root shortcut HTML does not land in `B:\Dev\seo_audit_python`.

## 1.0.2-alpha goal update

Add `latest-sveltekit-compatibility-audit` to the required alpha evidence set.

The alpha goal now requires:

- Official-doc alignment against current SvelteKit adapter, build, page-option, and project-type guidance.
- Current npm latest snapshot recorded in source control.
- Current official adapter latest snapshot recorded in source control.
- Live blog consumer evidence recorded in alpha report source data without treating it as hosted fixture proof.
- Current npm latest snapshot verified by `bun run verify:latest-sveltekit-audit`.
- Current same-major npm-latest `svelte@5.x` and `@sveltejs/kit@2.x` fixture build proof through `bun run alpha:latest-same-major:smoke`.
- Current latest-major `vite@8.x` and `@sveltejs/vite-plugin-svelte@7.x` fixture build proof through `bun run alpha:latest-vite-major:smoke`.
- A clear support stance separating same-major Svelte/SvelteKit compatibility and isolated latest-major Vite/plugin validation from dependency-floor upgrades.
- Stable-release blockers for remote functions, form actions, router parity, path safety, and hosted PHP smoke proof.
- `remote-functions-alpha-policy` enforcement so generated HTTP endpoint support is blocked until the PHP router has fixture and hosted proof.

## Stable-release blockers carried forward

- Keep the isolated Vite 8 plus `@sveltejs/vite-plugin-svelte` 7 validation lane current before raising dependency floors.
- Add explicit remote-functions compatibility proof before changing `event.platform.php.remoteFunctions.supported` from `false`.
- Keep action/form fixtures and root/generated router parity in the required gate.
- Keep hosted PHP smoke proof required before any stable 1.0.2 claim.

