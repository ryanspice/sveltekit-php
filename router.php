<?php
// router.php for PHP built-in server
// Serves static files from 'build' directory if they exist
// Otherwise routes to index.php in the corresponding directory

$root = __DIR__ . '/build';
$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

$target = $root . $uri;

// 1. Direct file access (JS, CSS, __data.php, etc.)
if (is_file($target)) {
    return false; // Serve static file
}

// 2. Clean URL handling for generated PHP files (e.g. /test-js -> /test-js.php)
// SvelteKit with trailingSlash='never' generates file.html -> file.php
if (is_file($target . '.php')) {
    include $target . '.php';
    return;
}

// 3. Directory access -> index.php (e.g. / -> /index.php, /about -> /about/index.php)
if (is_dir($target) && is_file($target . '/index.php')) {
    include $target . '/index.php';
    return;
}

// 3. Trailing slash handling (optional, but good for consistency)
// If /about is requested but only /about/index.php exists, logic #2 handles it if $target is the dir.
// But if $target is not a dir (unlikely for SvelteKit prerender), we might 404.

// 404
http_response_code(404);
echo "404 Not Found (Router) <br>";
echo "Checked: " . htmlspecialchars($target);
?>
