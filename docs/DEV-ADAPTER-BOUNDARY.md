# Dev adapter boundary

Last updated: 2026-10-25

The dev adapter surfaces exist for local development only. They are not production adapters and should fail loudly when used outside the intended local Vite/PHP workflow.

The repository's development application uses Kit 3.1.0 with Node >=22.17, Vite 8, Svelte 5 and TypeScript 6. `app.config.mjs` supplies flat options to the Vite plugin. `scripts/dev-php.mjs` watches that configuration and starts the local frontend/backend workflow; it is distinct from the production adapter's Kit 2/3 consumer support.

The Vite watcher excludes sibling `.svelte-kit*` and known build fixture trees. The current Kit output directory and its `generated` subtree remain traversable for HMR, alongside source/static/configuration inputs. This prevents accumulated verification output from overwhelming the development watcher. Root and fixed-base PHP data-bridge probes are recorded in the [Kit 3 migration receipt](security/kit3-migration-20261025.md).

## Current contract

| Surface | Intended use | Production posture |
| --- | --- | --- |
| `adapter/src/dev-adapter.ts` | Local PHP backend bridge during development. | Dev-only. Do not publish as a production runtime. |
| `adapter/src/vite-dev-adapter.ts` | Vite plugin/adapter helper for local dev integration. | Dev-only. Do not use in deployed PHP builds. |
| `bun run dev` | Starts Vite plus PHP development backend. | Local only. |
| `php-static` adapter mode | Shared-hosting production output. | Production-supported lane. |
| `js-ssr` adapter mode | PHP entrypoint plus JavaScript SSR sidecar. | Production lane only where sidecar process is supported. |

## Failure rule

Dev adapter code should prefer actionable failures over silent degradation.

Good error shape:

```text
sveltekit-php dev adapter is local-development only.
Use adapter({ mode: 'php-static' }) for shared hosting output or adapter({ mode: 'js-ssr' }) for JavaScript SSR sidecar output.
```

## Guardrail checklist

- [x] Document dev-only boundary.
- [x] Keep production docs centered on `php-static` and `js-ssr`.
- [x] Add a unit smoke that initializes dev adapter paths in local dev mode.
- [x] Add a unit smoke that fails dev adapter initialization outside local dev context.
- [x] Avoid placeholder behavior that silently skips PHP backend integration.

Guardrail coverage: `tests/unit/dev-adapters.test.ts` covers deterministic local/test stubs, Vite dev-router stub registration, production rejection, CI rejection, and explicit `SK_PHP_ALLOW_DEV_ADAPTER=true` smoke-test override.

## Non-goals

- The dev adapter should not generate production PHP output.
- The dev adapter should not publish runtime config or secrets.
- The dev adapter should not pretend to emulate a full shared host.
- The dev adapter should not be required for `npm` consumers who only import `sveltekit-php/adapter`.
