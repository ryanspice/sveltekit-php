# SvelteKit PHP adapter landscape

Last reviewed: 2026-06-16

This repo should not try to be every PHP integration pattern. Its best lane is:

- `php-static` for shared hosting: prerendered documents, PHP data/action helpers, explicit client-fallback boundaries for non-prerendered pages.
- `js-ssr` for real SvelteKit document SSR behind a PHP entrypoint.
- Deployment hygiene: path safety, generated artifact sync, `.env` safety, hosted smoke evidence, and package boundary checks.

For a source-linked feature backlog across official adapters, Azure SWA, PHP-FPM, WordPress, and template-output adapters, see [`ADAPTER-FEATURE-CATALOG.md`](ADAPTER-FEATURE-CATALOG.md).

## Reference projects and signals

| Project/source | What it optimizes for | What we should learn |
| --- | --- | --- |
| [`idleberg/sveltekit-adapter-html-like`](https://github.com/idleberg/sveltekit-adapter-html-like) | Static/template-engine output with tag injection, string replacement, minify/prettify, and custom output extensions. | Keep static output simple and consider a small transform/injection API after v1 if PHP/CMS embedding demand is real. |
| [`tomatrow/sveltekit-adapter-wordpress-shortcode`](https://github.com/tomatrow/sveltekit-adapter-wordpress-shortcode) | WordPress shortcode embedding, custom `index.php`, base/assets configuration, `renderHead`/`renderBody`, and style isolation guidance. | WordPress users need explicit base/assets examples and embed/isolation docs more than broad SSR claims. |
| [`lolcabanon/sveltekit-adapter-wordpress-admin`](https://github.com/lolcabanon/sveltekit-adapter-wordpress-admin) | WordPress admin plugin output with menu/plugin metadata, custom `index.php`, and base/assets handling. | Host-specific entrypoint generation can be useful, but should be a separate plugin/profile instead of polluting the core adapter. |
| [`basuke/vite-plugin-sveltekit-php-backend`](https://github.com/basuke/vite-plugin-sveltekit-php-backend) and [`basuke/sveltekit-php-backend`](https://github.com/basuke/sveltekit-php-backend) | PHP backend logic in route files during SvelteKit development, PHP-FPM/FastCGI integration, Composer compatibility. | Composer/PHP-FPM integration is a different product lane. Our PHP route handler model overlaps, but real document SSR still needs JS runtime or a sidecar. |
| [SvelteKit static site generation docs](https://svelte.dev/docs/kit/adapter-static) | Static generation is for prerendered pages; mixed static/dynamic SSR needs a different adapter. | Our `php-static` support boundary should stay explicit and tested. |
| [SvelteKit project types docs](https://svelte.dev/docs/kit/project-types) | PHP backends are usually separate backends with Node/serverless frontend, or an SPA served by the backend with SEO/performance tradeoffs. | Position this repo honestly: shared-hosting PHP deployment with clear tradeoffs, not magic PHP-native Svelte SSR. |
| [Stack Overflow: SvelteKit on PHP hosting without Node](https://stackoverflow.com/questions/71278902/can-i-deploy-a-svelte-kit-app-on-php-hosting-without-nodejs) | Community expectation is static pages work on PHP hosting, but SSR/backend features need another runtime/adapter. | Make the docs and smoke tests prevent users from mistaking client fallback for SSR. |

## Where this repo is ahead

| Area | Current advantage |
| --- | --- |
| PHP shared-hosting runtime | Generates PHP route handlers, data endpoints, action endpoints, router safety, `.htaccess`, and built-in server routing. |
| SvelteKit form actions in PHP | Supports enhanced action POSTs and PHP route handler normalization. |
| Release evidence | Has local v1 gate, artifact sync, env precheck, hosted smoke, generated alpha evidence, and package dry-run checks. |
| No-hydration static page proof | Hosted smoke covers a `prerender = true` and `csr = false` fixture. |
| Honest SSR boundary | Non-prerendered `php-static` page shims now identify themselves with `X-SvelteKit-PHP-Page-Mode: client-fallback` and `X-SvelteKit-PHP-SSR: unsupported-in-php-static`. |

## Where this repo is falling behind

| Gap | Why it matters | v1 posture |
| --- | --- | --- |
| Package discoverability | Competing packages expose clear metadata, topics, licenses, examples, and narrow positioning. | Metadata is improved in `package.json`; MIT license is now explicit. |
| Template/CMS transforms | Static/template adapters support markup injection and string replacement for PHP/Blade/WordPress style deployments. | Defer feature until after v1; document as a candidate `htmlTransforms` option. |
| WordPress-specific path examples | WordPress adapters show concrete `base`/`assets` examples and custom entrypoints. | Add docs/examples after external hosted proof. Do not mix WordPress behavior into core. |
| Composer/PHP-FPM lane | PHP-FPM/Composer integration helps PHP teams reuse existing app logic. | Separate future package/profile. Core v1 stays shared-hosting focused. |
| Real dynamic document SSR without Node | PHP cannot execute Svelte SSR JavaScript. | Use `js-ssr`; keep `php-static` boundary explicit. |

## Adopted now

- Added explicit non-prerendered `php-static` fallback headers in generated shims.
- Added hosted-smoke assertions for those headers on `/form-basic`.
- Added a no-hydration prerender fixture for static/blog-style pages.
- Added npm package metadata for discoverability: description, keywords, repository, homepage, and bugs URL.
- Captured the external adapter landscape in this document so v1 decisions stay grounded.
- Added a source-linked adapter feature catalogue in `docs/ADAPTER-FEATURE-CATALOG.md`.
- Added an MIT license for public reuse.
- Added adapter `supports` guardrails for unsupported `php-static` production APIs.
- Added reserved route validation for adapter-generated runtime paths.
- Added hosted-smoke asset fallback exclusion probes for missing asset-like paths.

## Post-v1 candidates

| Candidate | Proposed shape | Acceptance gate |
| --- | --- | --- |
| Static HTML transform API | `htmlTransforms` or `staticTransforms` with controlled inject/replace hooks over generated HTML/PHP files. | Fixture proving deterministic output, no secret leakage, and no route/router drift. |
| WordPress/PHP CMS recipe | `docs/recipes/wordpress.md` with `paths.base`, `paths.assets`, upload layout, and limitations. | Local fixture or example output; no core runtime special cases. |
| Composer bridge profile | Optional PHP autoload/bootstrap hook for `+page.server.php` and `+server.php`. | PHP unit smoke with Composer autoload, explicit security boundary, no required Composer dependency. |
| Hosted comparison matrix | A public README table comparing `php-static`, `js-ssr`, static adapter, WordPress embedding, and PHP-FPM plugin approaches. | README stays concise and links to this landscape doc. |
