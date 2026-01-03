# Verification Plan for SvelteKit PHP Adapter

This document outlines the verification strategy for ensuring the correctness of the SvelteKit PHP Adapter, focusing on data merging, redirects, routing behavior, and API compliance.

## Overview

The verification process uses a custom script (`scripts/verify-comprehensive.mjs`) to perform End-to-End (E2E) testing against a locally running PHP server. This ensures that the generated PHP code behaves exactly as expected in a production-like environment.

## Test Scenarios

The verification suite covers the following critical scenarios:

1.  **Root Page Rendering & Data Injection**
    *   Verifies that the home page loads with status 200.
    *   Checks for the presence of the "Debug Console" (indicating component hydration).
    *   Confirms server-side data (`Hello from PHP!`) is injected into the HTML.

2.  **Global Layout Data Merging**
    *   Fetches `/__data.php` to simulate a client-side navigation.
    *   Verifies that global layout data (e.g., `app_name`, `global_layout_loaded`) is present.
    *   Ensures that SvelteKit's data structure (nodes) is correctly preserved or flattened as needed.

3.  **Server-Side Redirects**
    *   Tests the `/redirect-me/` route.
    *   Verifies that the server returns a 302 status code.
    *   Checks the `Location` header to ensure it redirects to `/ssr-data` with the correct query parameters (`redirected_from`, `message`).
    *   **Data Propagation**: Verifies that the destination page (`/ssr-data`) receives and renders the query parameters from the redirect.

4.  **Nested Layout Data Merging**
    *   Tests the `/parent-child/nested/` route data.
    *   Verifies deep merging of data from:
        *   Root Layout
        *   Parent Layout (`layout_level_1`)
        *   Page (`nested`)
    *   **Precedence Check**: Confirms that page data overwrites layout data where keys collide.

5.  **JavaScript-Only Routes (Prerendering)**
    *   Tests `/test-js/` to ensure standard SvelteKit prerendering still works for non-PHP routes.

6.  **SSR Data Injection (No Flicker)**
    *   Fetches `/ssr-data` directly.
    *   Checks that PHP data is embedded in the initial HTML response.
    *   Ensures no "Waiting for PHP..." fallback text is present.

7.  **Preload Data Endpoint**
    *   Tests `/preload/__data.php`.
    *   Verifies that the endpoint returns the expected heavy data structure.

8.  **Form Actions**
    *   Tests standard POST to `/form-basic`.
    *   Verifies `x-sveltekit-action` handling and JSON response format.

9.  **API Routes (P0)**
    *   Tests `/api/ping`.
    *   Verifies JSON `Content-Type` and body `{ ok: true }`.

10. **Cookies (P0)**
    *   Tests `/api/cookie` roundtrip.
    *   Verifies `Set-Cookie` header generation.
    *   Verifies `Cookie` header parsing and reading.

11. **Multipart Uploads (P1)**
    *   Tests `/form-multipart` with `FormData`.
    *   Verifies file upload handling (`$_FILES` mapping) and parameter extraction.

12. **Error Handling (P1)**
    *   Verifies 404 status for non-existent routes.
    *   Verifies 500 status for exceptions thrown in PHP (`/error-throw`).

13. **Streaming (P2)**
    *   Tests `/stream` route rendering.
    *   Verifies successful response (format check only).

## Running the Verification

To execute the verification plan:

```bash
bun scripts/verify-comprehensive.mjs
```

This script will:
1.  Build the adapter (`bun run build:adapter`).
2.  Build the SvelteKit app (`bun run build`).
3.  Start a built-in PHP server on port 8086.
4.  Run the test suite against the server.
5.  Report PASS/FAIL for each scenario.

## Fixture App Structure

*   `src/routes/api/ping`: JSON API test.
*   `src/routes/api/cookie`: Cookie set/read test.
*   `src/routes/form-multipart`: Multipart upload test.
*   `src/routes/error-throw`: 500 error test.
*   `src/routes/redirect-me`: Redirect test.
*   `src/routes/parent-child/nested`: Nested layout test.
