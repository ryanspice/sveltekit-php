# PHP Development Setup

To run this SvelteKit project with a realistic PHP environment during development, you need to have PHP installed and available in your system PATH.

## 1. Install PHP (Windows)

1. Download **VS16 x64 Non Thread Safe** (or similar) from [windows.php.net](https://windows.php.net/download/).
2. Extract the zip file to a folder (e.g., `C:\php`).
3. Add `C:\php` to your **System Environment Variables Path**.
   - Search "Edit the system environment variables" -> Environment Variables -> Path -> Edit -> New -> Paste `C:\php`.
4. Open a new terminal and verify with `php -v`.

## 2. Run in Development Mode

We have added a special script that builds the app in watch mode and serves it with PHP simultaneously:

```bash
bun run dev:php
```

This command runs:

1. `vite build --watch`: Rebuilds your app on file changes.
2. `php -S localhost:8000 ...`: Serves the `build` folder using PHP.
   `
   Open **http://localhost:8000** to see your app running with PHP.

## 3. Why the 405 Error?

The error `[405] POST method not allowed` occurred because you were likely running `vite dev` (the default Node.js server). The Node.js server ignores `.php` files, so it didn't know how to handle your form actions defined in `+page.server.php`. By using `bun run dev:php`, requests are handled by the PHP server, which correctly executes your PHP logic.
