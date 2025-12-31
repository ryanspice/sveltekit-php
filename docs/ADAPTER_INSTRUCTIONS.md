# SvelteKit PHP Adapter Instructions

This project uses a custom SvelteKit adapter (`sveltekit-php.js`) to build your application for deployment on Apache servers with PHP support.

## Features
- **Hybrid Rendering**: Uses SvelteKit's Prerendering for HTML shells and PHP for server-side data injection (SSR-like behavior).
- **PHP Routes**: `+*.server.php` files in your routes are detected and converted to namespaced PHP files in `build/_protected`.
- **Data & Actions**: Supports `load()` and `action_*()` functions in PHP, mirroring SvelteKit's `+page.server.js` functionality.
- **Streaming**: Supports streaming responses (using `sk_defer`).

## Configuration
The adapter is configured in `svelte.config.js`:

```javascript
import adapter from './sveltekit-php.js';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    kit: {
        adapter: adapter({
            // options (defaults shown)
            // ssr: true,
            // out: './build',
            // assets: './build',
        })
    }
};
```

## Requirements
- **Prerendering**: Currently, routes using PHP must be prerenderable (set `export const prerender = true` in `+page.js` or `+layout.js`). The adapter uses the prerendered HTML as a template and injects dynamic data via PHP at runtime.
- **PHP**: Target server must support PHP 8.0+.
- **Apache**: `build` folder contains `.htaccess` friendly structure (index.php files).

## Usage
1. Create `+page.server.php` alongside your `+page.svelte`.
2. Define `function load($params)` returning an array.
3. Define `function action_default($params)` or `action_save($params)` for form actions.

## Deployment
1. Run `bun run build` (or `npm run build`).
2. Upload the contents of the `build` directory to your Apache server's public root.

## Troubleshooting
- **Missing Data**: Ensure `+page.server.php` is named correctly and `prerender = true` is set for the route.
- **Build Errors**: Check console for "Found PHP files" to verify your PHP files are detected.
