# SvelteKit PHP Adapter Audit: Routing Architecture & Discrepancies
**Date:** 2026-01-23
**Scope:** `php-static` mode routing behavior vs. SvelteKit standard semantics.

## Executive Summary
The current `php-static` implementation relies on **filesystem-based routing** (Apache `mod_rewrite` mapping URLs directly to files). This works flawlessly for prerendered (static) routes but fails for dynamic SSR routes (e.g., `/blog/[slug]`), causing the "Flash of Home" synchronization issue.

This audit compares the current implementation against the "Standard SvelteKit Model" (Node.js/Edge) to highlight the architectural gap.

---

## 1. The Standard SvelteKit Model (The "Tutorial" Standard)
In a standard SvelteKit deployment (e.g., `adapter-node` or `adapter-vercel`), the request lifecycle is:

1.  **Request Entry**: All requests (that aren't static assets) hit a **single entry point** (e.g., `index.js` or `handler.mjs`).
2.  **Central Routing**: The server-side router (part of SvelteKit's runtime) analyzes the URL (e.g., `/blog/my-post`).
3.  **Pattern Matching**: It matches the URL against a list of RegEx patterns (e.g., `/^/blog\/([^/]+)/?$`).
4.  **Execution**: It loads the corresponding `+page.server.ts` and `+page.svelte` for that pattern.
5.  **Response**: It returns the rendered HTML for that specific page.

**Key Characteristic:** The filesystem structure of the *deployment* does not need to match the URL structure.

---

## 2. Current PHP Adapter Architecture (`php-static`)
The current adapter attempts to "unroll" the SvelteKit router onto the filesystem to avoid a heavy PHP runtime.

1.  **Request Entry**: Apache receives the request.
2.  **Filesystem Check**: Apache checks if a file exists at the requested path (e.g., `/blog/my-post/index.php`).
    *   **Success (Prerendered):** If the page was prerendered, the file exists. Apache serves it. **(Works)**
    *   **Failure (Dynamic):** For `/blog/my-post`, no physical directory exists.
3.  **Fallback**: Apache's `.htaccess` (or `router.php` in dev) falls back to the configured `ErrorDocument` or `RewriteRule`.
    *   **Current Config:** It falls back to the **Root `index.php`** (the Home Page).
4.  **"Flash of Home"**: The server returns the Home Page HTML (status 200).
5.  **Client Hydration**: The browser loads the Home Page. The SvelteKit client-side router wakes up, sees the URL is `/blog/my-post`, realizes the content is wrong, and performs a **client-side navigation** to fetch the correct data and render the correct component.

**Key Characteristic:** Relies on physical files. Fails when URL ≠ File Path.

---

## 3. Detailed Discrepancies

| Feature | Standard SvelteKit (Node) | Current PHP Adapter | Consequence |
| :--- | :--- | :--- | :--- |
| **Dynamic Routes** | Server matches `/blog/[slug]` and renders the Post. | Server serves Home Page (`/index.php`). Client fixes it later. | **Flash of Content**, SEO failure, "Out of Sync" state. |
| **`__data.json`** | Server generates JSON for any valid route. | Server tries to find `__data.php` at exact path. | **404 Errors** on deep links or dynamic routes. |
| **Trailing Slash** | Enforced by internal router logic. | Enforced by filesystem (directory = slash). | **Slash Mismatch** between server (directory) and client (app config). |
| **404 Handling** | Renders `+error.svelte` with 404 status. | Serves Home Page (200 OK) or generic Apache 404. | Soft 404s (200 status for missing pages). |

---

## 4. Route-by-Route Analysis & Adapter Requirements
This section analyzes the build output and adapter requirements for each route in `src/routes/`, highlighting specific gaps in the current `php-static` mode.

| Route | Configuration | Build Output | Current Behavior (php-static) | Adapter Requirement (Fix) |
| :--- | :--- | :--- | :--- | :--- |
| **`api/*`**<br>(cookie, echo, ping) | `+server.php` | `api/.../index.php` | Works (served directly by Apache). | Ensure `router.php` maps API routes correctly if file access fails. |
| **`client-side`** | Prerendered | `client-side/index.html` | Works (static file). | None. |
| **`form-basic`**<br>**`form-multipart`** | Prerendered +<br>`+page.server.php` | `index.html`<br>`__data.php`<br>`__action.php` | **Partial.** GET works (static). POST works (rewritten to `__action.php`). | Ensure `.htaccess` rewrites `__action` correctly. |
| **`negotiate`** | Prerendered +<br>`+server.php` | `index.html` (Page)<br>`index.php` (API) | **Conflict.** Apache serves `index.php` (API) by default due to `DirectoryIndex`. Users see JSON instead of Page. | **Smart Wrapper:** `index.php` must perform Content Negotiation (check `Accept` header) to serve HTML or API. |
| **`redirect-me`** | **Dynamic**<br>(`prerender=false`) | *None* (No physical file) | **Failure.** Apache falls back to Root `index.php` (Home). Client flashes Home, then redirects. | **Hybrid Router:** Fallback must hit `router.php`, which executes the PHP logic to send `Location:` header immediately. |
| **`stream`** | Prerendered | `index.html` | Static (Promises resolved at build time). | For true streaming, must be Dynamic. Adapter needs `flush()` support in `router.php`. |
| **`matrix/*`** | Mixed | Mixed | Generally works if prerendered. | Ensure `router.php` handles any non-prerendered matrix permutations. |

---

## 5. Root Cause Analysis

### A. Missing Central Router in Production
The `router.php` generated by the adapter is designed for the PHP Built-in Server (`php -S`) and is **not effectively used** in the Apache production setup as a dispatcher. The `.htaccess` is configured to prefer physical files and fallback to `index.php` (Home) rather than a smart dispatcher.

### B. Unreachable "Shims"
The adapter *does* generate "runtime shims" for dynamic routes (e.g., `build/blog/[slug]/index.php`), but Apache has no way to know that a request for `/blog/cool-post` should be handled by that specific PHP file.

---

## 5. Recommendations (The Fix)

To align with the "Tutorial" standard, we must implement a **Hybrid Routing Strategy**:

1.  **Keep Static Performance**: Continue serving prerendered files directly (Apache is great at this).
2.  **Intercept Misses**: Change the `.htaccess` fallback. Instead of serving `index.php` (Home), route all non-static requests to a **new `router.php` entry point**.
3.  **Implement `router.php`**: This script must:
    *   Load a **Route Map** (URL Pattern -> PHP File).
    *   Match the incoming request (e.g., `/blog/cool-post`) against the patterns.
    *   `include` the correct shim file (e.g., `build/blog/[slug]/index.php`).
    *   Handle `__data.json` requests dynamically.

### Comparison after Fix

| Request | Old Flow | New Flow (Hybrid) |
| :--- | :--- | :--- |
| `/about` (Prerendered) | Apache serves `about/index.php` | Apache serves `about/index.php` |
| `/blog/post-1` (Dynamic) | Apache serves `index.php` (Home) | Apache -> `router.php` -> Matches `[slug]` -> Serves Post |
| `/unknown` (404) | Apache serves `index.php` (Home) | Apache -> `router.php` -> No Match -> Serves 404 |

This change will resolve the synchronization issues and align the PHP adapter's behavior with standard SvelteKit expectations.
