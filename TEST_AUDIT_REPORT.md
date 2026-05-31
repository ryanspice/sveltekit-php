# Test Suite Audit & Optimization Report

## 1. Executive Summary
A comprehensive audit of the SvelteKit PHP Adapter test suite was conducted to identify overlaps, redundancies, and inefficiencies. The audit revealed that tests were scattered across multiple files with unclear boundaries, leading to redundant build processes and fragmented execution.

**Key Outcomes:**
- **Consolidated Tests:** Grouped tests by deployment mode (`php-static` vs `node-ssr`) into dedicated directories.
- **Eliminated Redundancy:** Removed duplicate test files and merged overlapping test cases.
- **Improved Efficiency:** Reduced the number of required builds by running related tests against a single build artifact where possible.
- **Fixed Bugs:** Resolved existing failures in content negotiation, fallback handling, and asset output verification.

## 2. Overlap Analysis (Pre-Refactoring)

### Node SSR Mode
- **Problem:** Tests were scattered across `tests/e2e/node-ssr.spec.ts`, `tests/stream.spec.ts`, `tests/ssr-hydration.spec.ts`, and `tests/e2e/adapter-node-ssr-assets.spec.ts`.
- **Impact:** Each test file often triggered a fresh build of the adapter and app, significantly increasing test duration.
- **Redundancy:** Basic SSR functionality was tested in multiple places with slight variations.

### PHP Static Mode
- **Problem:** Tests were split between `tests/integration.spec.ts`, `tests/php-server.spec.ts`, and multiple `tests/e2e/php-static-*.spec.ts` files.
- **Impact:** Hard to track coverage; "integration" and "e2e" distinctions were blurred.
- **Conflicts:** Some tests assumed specific router behaviors that conflicted with others (e.g., fallback handling).

### Unit Tests
- **Problem:** `tests/unit/assets-output.test.ts` contained a bug preventing it from passing.
- **Impact:** False negatives in asset handling verification.

## 3. Refactoring & Optimization Actions

### 3.1. Directory Restructuring
The `tests/` directory has been reorganized for clarity:

```
tests/
├── e2e/
│   ├── node-ssr/          # All Node SSR E2E tests
│   │   └── node-ssr.spec.ts (Consolidated)
│   ├── php-static/        # All PHP Static E2E tests
│   │   ├── smoke.spec.ts
│   │   ├── negotiation.spec.ts
│   │   ├── fallback.spec.ts
│   │   ├── structure.spec.ts
│   │   └── base-mode-*.spec.ts
│   │   └── status.spec.ts
├── unit/                  # True unit tests
│   ├── assets-output.test.ts
│   └── paths.test.ts
└── fixtures/              # Test app source code
```

### 3.2. Test Consolidation
- **Node SSR:** All Node SSR scenarios (Home, Deep Link, SSR Data, Streaming, Assets, Form Actions) were merged into `tests/e2e/node-ssr/node-ssr.spec.ts`. This suite runs serially (to avoid port conflicts) but reuses the build artifact where appropriate or rebuilds efficiently.
- **PHP Static:** Redundant `integration.spec.ts` and `php-server.spec.ts` were removed. Their coverage was mapped to specific `php-static` specs.

### 3.3. Fixes & Improvements
- **Node SSR Router:** Updated `tests/test-utils.ts` to correctly handle `node-ssr` mode, which uses `index.php` as the entry point instead of `router.php`.
- **Content Negotiation:** Fixed `negotiation.spec.ts` failure by enabling `prerender = true` for the `/negotiate` route in the test app. This ensures `php-static` mode generates the necessary files for negotiation logic.
- **Fallback Handling:** Fixed `fallback.spec.ts` to correctly verify fallback file vs directory existence.
- **Asset Output:** Fixed a bug in `assets-output.test.ts` where `fs.copyFileSync` failed when source and destination were identical.

## 4. Updated Test Execution Plan

### Running Tests
Use the defined `package.json` scripts:

1.  **Node SSR Tests:**
    ```bash
    bun run e2e:node-ssr
    ```
    *Runs `tests/e2e/node-ssr/node-ssr.spec.ts`.*

2.  **PHP Static Tests:**
    ```bash
    bun run e2e:php-static
    ```
    *Runs all tests in `tests/e2e/php-static/`.*

3.  **Unit Tests:**
    ```bash
    bun run test:unit
    ```
    *Runs Vitest on `tests/unit/`.*

4.  **Verification Scripts:**
    ```bash
    bun run verify:php-static
    ```
    *Runs the custom `scripts/verify-php-static.mjs` (Legacy verification for static builds).*

### CI/CD Integration
The `test` script (`playwright test`) defaults to running all tests. Ensure `playwright.config.ts` (root) is configured to include or exclude specific projects if necessary, or use the specific scripts above for targeted testing.

## 5. Conclusion
The test suite is now more organized, efficient, and robust. Overlaps have been eliminated, and execution time is optimized by reducing redundant builds. All identified failures have been resolved, ensuring reliable regression testing for both deployment modes.

## 6. Routing & Canonicalization Update (2026-01-26)

### 6.1. Trailing Slash Canonicalization
To align with SvelteKit's `trailingSlash` configuration, the adapter now employs a hybrid strategy:
- **.htaccess (Apache):** Uses an explicit `# trailingSlash=always|never` block with 308 redirects. It strictly guards against redirect loops by using `THE_REQUEST` or conditional checks.
  - `never`: Redirects `/foo/` → `/foo` (skipping directories unless explicitly allowed).
  - `always`: Redirects `/foo` → `/foo/` (skipping files).
- **router.php (Dev Server):** Does not perform 308 redirects (due to PHP built-in server limitations). Tests expecting redirects must accept `200` OK from the dev server while enforcing `308` expectation for production-like environments (Apache).

### 6.2. Page Shims for Server Routes
Routes containing `+page.server.php` (even if `prerender=false`) must be dispatched through the PHP router to handle server-side logic (e.g., status codes, headers).
- **Mechanism:** The adapter generates a PHP shim (`index.php`) for these routes during build.
- **Manifest:** These routes are added to `route-manifest.php` with `type: 'page'`, ensuring the router prioritizes them over static fallbacks.
- **Fix:** Solved issue where `/status?code=404` returned `200` because the static fallback was served instead of the dynamic route.

### 6.3. Regression Tests
- **Trailing Slash:** `tests/e2e/php-static/structure.spec.ts` ("Canonicalization: trailingSlash behavior").
- **Status Codes:** `tests/e2e/php-static/smoke.spec.ts` ("Status Code: Server-Side (404)").
- **Verification:** `scripts/verify-build-routes.mjs` includes checks for both behaviors.
