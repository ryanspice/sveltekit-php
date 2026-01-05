# SvelteKit PHP Adapter

This project implements a **SvelteKit adapter for PHP**, allowing you to deploy SvelteKit applications to standard PHP hosting environments (Apache, Nginx, Shared Hosting) while maintaining a modern development experience.

## 🌟 Key Features

-   **Hybrid Development**: Run Vite (HMR) and PHP (Backend) simultaneously.
-   **SSR Data Bridge**: Fetches `+page.server.php` data seamlessly in development.
-   **Production Modes**:
    -   `php-static`: Prerendered shell + PHP data/action bridge (Traditional PHP hosting).
    -   `js-ssr`: PHP frontend proxy + Node/Bun sidecar (Full SSR + Streaming).
-   **API Proxy**: `/api/*` routes are automatically handled by PHP.

---

## 🚀 Getting Started

### Prerequisites

-   **Node.js** (or Bun)
-   **PHP 8.1+** (Available in your system PATH)

### Installation

```bash
# Install dependencies
bun install
```

### Development

Start the hybrid development server:

```bash
bun run dev
```

This command launches two servers:
1.  **Vite Dev Server** (`http://localhost:5173`): Serves the frontend, handles HMR, and proxies API requests.
2.  **PHP Backend** (`http://127.0.0.1:8080`): Serves `+server.php` endpoints and `+page.server.php` data.

**How it works:**
-   When you visit a page, Vite renders the Svelte components.
-   If the page needs server data, a special **Data Bridge** (`src/lib/server/php-dev.ts`) fetches it from the running PHP server.
-   You get the speed of Vite with the real logic of your PHP backend.

---

## 🛠 Developing Features

### 1. Creating Pages
Create standard SvelteKit pages in `src/routes`.
-   `src/routes/about/+page.svelte`

### 2. Adding Backend Logic (PHP)
Instead of `+page.server.ts`, use `+page.server.php`.
The adapter compiles this into a PHP script that returns data to the frontend.

**Example `src/routes/about/+page.server.php`:**
```php
<?php
function load($params) {
    return [
        'title' => 'About Us',
        'server_time' => time()
    ];
}
?>
```

### 3. API Endpoints
Create `+server.php` files for pure API endpoints.

**Example `src/routes/api/hello/+server.php`:**
```php
<?php
function GET($params) {
    return new Response(json_encode(['msg' => 'Hello from PHP']), [
        'Content-Type' => 'application/json'
    ]);
}
?>
```

---

## ✅ Testing & Verification

The project includes a suite of fixture routes to verify functionality.

### Feature Showcase
-   **SSR Data**: Visit `/ssr-data` to see data loaded from PHP.
-   **Forms**: Visit `/form-basic` to test form actions.
-   **Streaming**: Visit `/stream` to see streaming responses (simulated in dev, real in prod).
-   **Layouts**: Visit `/parent-child` to test nested layout data inheritance.

### Running Regression Tests
To run the comprehensive verification suite (requires build):

```bash
# Build and run verification
bun run build
node scripts/verify-comprehensive.mjs
```

---

## 📦 Building for Production

To create a deployable PHP application:

```bash
bun run build
```

The output will be in the `build/` directory.

### Running Production Build Locally
You can serve the build folder using PHP's built-in server:

```bash
# Serve the build directory
php -S 127.0.0.1:8080 -t build router.php
```

Then visit `http://127.0.0.1:8080`.

---

## 📂 Project Structure

-   `adapter/`: The source code for the SvelteKit PHP adapter.
-   `src/routes/`: The demo application and test fixtures.
-   `scripts/`: Build and verification scripts.
    -   `dev-php.mjs`: The hybrid dev server orchestrator.
-   `src/lib/server/php-dev.ts`: The bridge connecting Vite to PHP in dev.
