# Verification Plan

## Repo Audit Checklist

> **Keep this checklist active for every change.**

- [ ] **Adapter Changes**: Must pass `bun run verify:all`
- [ ] **Bug Fixes**: Add a regression test in the relevant mode spec
- [ ] **Shared Features**: Test in both modes unless clearly mode-specific

## Overview

We verify the adapter works in two modes:

1. **php-static**: Prerendered pages + PHP data bridge + PHP actions. Unknown routes return 404 in strict mode (default). SPA fallback is not enabled unless explicitly configured.
2. **js-ssr**: PHP proxy + JavaScript SSR sidecar.

`js-ssr` is the only SSR mode string. It must remain a single code path.
Historical audit notes under `docs/AUDIT-*` and `docs/CHAT-*` are archival snapshots, not the current contract.

## "One Build, One Truth" Pipeline Contract

The pipeline is designed to be boring, fast, and predictable.

### 1. Single Build Phase (`build:e2e`)

We build **once** for all configurations.

- Command: `bun run build:e2e`
- Outputs:
  - `build-e2e-php-static` (Base: `/dev/sveltekit`)
  - `build-e2e-js-ssr-root` (Base: `/`, `js-ssr` via the current JavaScript SSR sidecar)
  - `build-e2e-js-ssr-subdir` (Base: `/dev/sveltekit`, `js-ssr` via the current JavaScript SSR sidecar)
- **Stamps**: Each build directory contains a `_runtime/build-stamp.json`. Tests verify this stamp before running.

### 2. Verification Phase (`test` / `verify:all`)

Verification reuses existing builds.

- Command: `bun run test` (alias for `verify:all`)
- Flow:
  1. **Build**: Runs `build:e2e` (unless `SKIP_BUILD` is set).
  2. **Unit**: Runs `vitest`.
     - Includes **PHP Unit Tests** (`test:php`) which require `php` CLI.
     - Pipeline fails if PHP is missing (bypass with `--skipPhp`).
  3. **Static**: Verifies file structure.
  4. **Sanity**: Runs fast HTTP checks (using internal temp servers).
     - **Readiness Probes**: Strict route-specific checks (e.g. `/status?code=200`, `/ssr-data`) ensure routing functionality before proceeding.
  5. **E2E**: Runs Playwright against the builds.

### 3. E2E Serving (`serve:e2e`)

Playwright (and local debugging) uses a unified server script.

- Command: `bun run serve:e2e`
- **Strictness**: Refuses to start if builds/stamps are missing.
- **Ports**:
  - `php-static`: **8086**
  - `js-ssr-root`: **8087** (PHP) / 3001 (JavaScript SSR sidecar)
  - `js-ssr-subdir`: **8088** (PHP) / 3002 (JavaScript SSR sidecar)

### 4. CI Strategy

CI should run:

1. `bun install`
2. `bun run build:e2e`
3. `bun run test --skipBuild` (Reuses the artifact from step 2)

## Automated Verification Scripts

- **`verify:all`** (`scripts/verify-all.mjs`): Main orchestrator.
- **`test:e2e`**: Runs Playwright (`playwright test`).
- **`serve:e2e`**: Starts all E2E servers for manual testing or Playwright reuse.

## Runtime Hardening Scope

The PHP runtime templates (`php-templates.ts`) inject hardening logic to prevent runtime errors and ensure security.

- **Guards**: All global functions/classes wrapped in `!function_exists` / `!class_exists`.
- **Error Handling**: `display_errors` disabled, `log_errors` to stderr.
- **Streaming Safety**: Output buffering management.

### Verification of Hardening

- **Multi-include Safety**: `tests/unit/redeclare_test.php`.

## Manual Debugging

To debug a specific mode locally:

1. **Build**: `bun run build:e2e`
2. **Serve**: `bun run serve:e2e`
3. **Browse**:
   - PHP Static: http://localhost:8086/dev/sveltekit/
   - js-ssr Root: http://localhost:8087/
   - js-ssr Subdir: http://localhost:8088/dev/sveltekit/
