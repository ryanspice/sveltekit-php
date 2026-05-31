# SvelteKit PHP Adapter Testing & Verification Framework

This document serves as the comprehensive companion to `TEST_AUDIT_REPORT.md`, establishing the standard operating procedures for testing the SvelteKit PHP Adapter. It defines the architecture, processes, and guidelines for maintaining a robust and efficient test suite.

## 1. Test File Inventory & Structure

The testing ecosystem consists of End-to-End (E2E) tests via Playwright, Unit tests via Vitest, and custom verification scripts.

### 1.1. Test Suite Catalog

#### **E2E (Node SSR)**

Located in `tests/e2e/node-ssr/`. Verifies the "Hybrid" mode where PHP proxies to a Node/Bun sidecar. Runs serially due to build requirements.

| File               | Scenarios Covered                                                                                                                                                                                                                                                                                                                                        |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `node-ssr.spec.ts` | **Hybrid Integration**: Builds and tests the app in `node-ssr` mode.<br>**Core Features**: Home page rendering, Deep link SSR, SSR Data Hydration, Streaming response handling.<br>**Data Bridge**: Verifies `__data.json` proxying for nested routes.<br>**Forms**: POST form actions.<br>**Assets**: Correct separation of assets and build artifacts. |

#### **E2E (PHP Static)**

Located in `tests/e2e/php-static/`. Verifies the "Static" mode where PHP handles routing, assets, and data. Runs in parallel.

| File                  | Scenarios Covered                                                                                                                                                                                                          |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `smoke.spec.ts`       | **Sanity Checks**: Base HTML serving, Deep route handling, Robots.txt.<br>**Data**: Global layout data merging, JSON response for data requests.<br>**Redirects**: Server-side redirect logic.                             |
| `negotiation.spec.ts` | **Content Negotiation**: Verifies `Accept` header handling.<br>- Prefers HTML by default.<br>- Serves JSON when requested (`Accept: application/json`).<br>- Ensures POST requests bypass static cache and hit the server. |
| `fallback.spec.ts`    | **SPA Fallback**: Tests behavior when `ADAPTER_FALLBACK` is set (e.g., `200.html`).<br>- Verifies unknown routes return the fallback content.<br>- Checks router logic for fallback path resolution.                       |
| `structure.spec.ts`   | **File System**: Verifies `name.html` is normalized to `name/index.php`.<br>**Routing**: Checks that `/api/*` paths can function as pages if defined in SvelteKit.                                                         |
| `base-mode-*.spec.ts` | **Base Paths**: Tests dynamic base path resolution (`ADAPTER_BASE_MODE='auto'`).<br>- Verifies deep nested routes work under subdirectories.<br>- Checks `<base>` tag injection and asset URL rewriting.                   |

#### **Unit Tests**

Located in `tests/unit/`. Isolated tests for internal logic without a full build.

| File                    | Scenarios Covered                                                                                                                                                                      |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `assets-output.test.ts` | **Asset Management**: Verifies client assets are correctly copied to the output directory.<br>- Handles `outDir` vs `assetsDir` differences.<br>- Checks precompressed asset handling. |
| `paths.test.ts`         | **Path Utilities**: Tests internal path normalization and resolution helpers.                                                                                                          |

### 1.2. Verification Scripts (`scripts/`)

These scripts provide lower-level verification and utility functions for the test suites.

- **`verify-php-static.mjs`**: Legacy verification script for PHP static builds. Checks for file existence and basic response codes.
- **`serve-php-static.ts`**: The test server driver. Builds the app (if requested) and launches the PHP built-in server for E2E tests.
- **`verify-build-routes.mjs`**: Verifies that the build output contains expected route files.
- **`php-server-verifier.mjs`**: Utility to verify the PHP server is responding correctly.

### 1.3. Configuration Files

- **`playwright.config.ts`**: Default configuration.
- **`playwright.node-ssr.config.ts`**: Dedicated config for Node SSR tests. Enforces serial execution (`workers: 1`) to prevent build conflicts.
- **`playwright.php-static.config.ts`**: Dedicated config for PHP Static tests. Enables parallelism and configures the `serve-php-static.ts` web server.
- **`vitest.config.ts`** (implicit via `package.json`): Configures Unit tests to run in `tests/unit/`.

---

## 2. Organization & Storage Strategy

### 2.1. Directory Structure

All testing assets reside in the `tests/` directory, mirroring the separation of concerns in the adapter itself.

```
tests/
├── e2e/                   # End-to-End Tests
│   ├── node-ssr/          # Scenario: PHP Entry + Node Sidecar
│   └── php-static/        # Scenario: Pure PHP (Prerendered + Dynamic)
├── unit/                  # Unit Tests (Fast, no build required)
├── fixtures/              # Test Data & Mock Apps
└── test-utils.ts          # Shared Utilities
```

### 2.2. Naming Conventions

- **Test Files:** `*.spec.ts` for Playwright (E2E), `*.test.ts` for Vitest (Unit).
- **Test Descriptions:**
  - Use `describe` blocks to group by feature (e.g., `describe('Content Negotiation', ...)`).
  - Use `test` blocks for specific behaviors (e.g., `test('serves HTML for Accept: text/html', ...)`).
- **Fixtures:** Named descriptively based on the scenario (e.g., `assets-output`).

### 2.3. Storage Strategy

- **Source Code Co-location:** Not used for this project. All tests are centralized in `tests/` to keep the `src/` and `adapter/` directories clean and focused on implementation.
- **Artifacts:** Test builds and reports are generated in `build-e2e-*/` and `playwright-report/` respectively. These are git-ignored.

---

## 3. Streamlining Framework

### 3.1. Execution Workflows

Developers should use the `bun run` scripts defined in `package.json`.

| Workflow            | Command                     | Description                                              |
| ------------------- | --------------------------- | -------------------------------------------------------- |
| **Full Suite**      | `bun run test`              | Runs default Playwright suite (check config).            |
| **PHP Static Only** | `bun run e2e:php-static`    | **Recommended.** Runs all static mode tests in parallel. |
| **Node SSR Only**   | `bun run e2e:node-ssr`      | Runs SSR/Sidecar tests serially.                         |
| **Unit Tests**      | `bun run test:unit`         | Fast execution for utility logic.                        |
| **Verification**    | `bun run verify:php-static` | Quick sanity check script.                               |

### 3.2. Test Data Management

- **Fixtures:** Use `tests/fixtures/` for static file structures needed by unit tests.
- **Test App:** The E2E tests build the actual SvelteKit app located in `src/routes/`.
  - **Add New Scenarios:** Create new routes in `src/routes/` (e.g., `src/routes/my-new-feature/`).
  - **Isolation:** Each test suite (Static vs. SSR) builds to a separate output directory (`build-e2e-php-static` vs `build-e2e-node-ssr`) to prevent artifact collision.

### 3.3. CI/CD Integration

The GitHub Actions workflow (`.github/workflows/playwright.yml`) automates testing.

- **Trigger:** Push to `main` or Pull Request.
- **Steps:**
  1. Install dependencies (`bun install`).
  2. Build the adapter.
  3. Run Unit Tests.
  4. Run Playwright Tests (can be split into jobs for parallelism).

### 3.4. Optimization Guidelines

- **Build Reuse:** The `serve-php-static.ts` script checks if a build exists. Use flags to force/skip builds to save time during local dev loops.
- **Parallelism:**
  - **Static Tests:** Safe to run in parallel (`fullyParallel: true`).
  - **SSR Tests:** Must run serially (`workers: 1`) if they share a single sidecar instance or modify global state.
- **Targeted Testing:** Use Playwright's `-g` flag to run specific tests:
  ```bash
  bun run e2e:php-static -- -g "Content Negotiation"
  ```

---

## 4. Test Volume Management

### 4.1. Criteria for New Tests

- **New Feature:** If adding a new capability (e.g., new SvelteKit feature support), add a corresponding route in `src/routes/` and a spec file in `tests/e2e/`.
- **Bug Fix:** **Mandatory.** Every bug fix must be accompanied by a regression test case.
- **Refactor:** If refactoring internals, rely on existing E2E tests. Add Unit tests if the internal API changes significantly.

### 4.2. Duplication Prevention

- **Review `TEST_AUDIT_REPORT.md`**: Ensure the test doesn't already exist in the consolidated suites.
- **Shared Logic:** If a test applies to both Static and SSR modes (e.g., basic routing), consider if it needs to be tested in _both_ or if one covers the logic sufficiently. Critical core features should be tested in both.

### 4.3. Review & Pruning

- **Quarterly Audit:** Review the suite for slow, flaky, or redundant tests.
- **Deprecation:** If a feature is removed from SvelteKit or the Adapter, immediately remove the associated tests and fixture routes.

---

## 5. Implementation Guidelines

### 5.1. E2E Test Template (Playwright)

```typescript
import { expect, test } from '@playwright/test';
import * as utils from '../../test-utils';

test.describe('My New Feature', () => {
	test('should behave correctly under specific conditions', async ({ page }) => {
		// 1. Arrange: Navigate to the route
		await page.goto('/my-new-feature');

		// 2. Act: Interact with the page (if necessary)
		// await page.click('#submit');

		// 3. Assert: Check the state
		await expect(page.locator('h1')).toHaveText('Feature Active');

		// Optional: Check Server Headers (if relevant)
		const response = await page.request.get('/my-new-feature');
		expect(response.headers()['content-type']).toContain('text/html');
	});
});
```

### 5.2. Unit Test Template (Vitest)

```typescript
import { describe, expect, it } from 'vitest';
import { myHelperFunction } from '../../adapter/src/utils/my-helper';

describe('myHelperFunction', () => {
	it('returns true for valid input', () => {
		const result = myHelperFunction('valid');
		expect(result).toBe(true);
	});

	it('throws error for invalid input', () => {
		expect(() => myHelperFunction('invalid')).toThrow();
	});
});
```

### 5.3. Best Practices

- **Isolation:** Do not rely on state from previous tests. Each test should be independent.
- **Selectors:** Use robust locators (e.g., `getByRole`, `getByTestId`) rather than brittle CSS paths.
- **Wait Mechanisms:** Avoid `page.waitForTimeout()`. Use web-first assertions (like `expect(locator).toBeVisible()`) which have auto-retrying.
- **Console Logs:** Check for server-side errors in the console during E2E tests if behavior is unexpected.
