<?php
// Simple router to emulate Apache .htaccess mod_rewrite
// for the PHP built-in server.

// Helper for logging
function router_log($msg) {
    file_put_contents('php://stderr', "[Router] " . $msg . "\n", FILE_APPEND);
}

$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
router_log("Request: $uri");

// Security: Block _protected directory
if (strpos($uri, '/_protected/') === 0) {
    http_response_code(403);
    echo "Access Denied";
    return;
}

// Special handling for SvelteKit __data.json requests
// Map /path/__data.json to /build/path/__data.php
// PHP 8.0+ has str_ends_with, but we'll be safe
$suffix = '/__data.json';
if (substr($uri, -strlen($suffix)) === $suffix) {
    // Replace .json with .php
    $php_file_rel = str_replace($suffix, '/__data.php', $uri);

    // Handle root case if needed (though uri starts with /)
    // If uri is just /__data.json -> /__data.php

    $php_file = __DIR__ . '/build' . $php_file_rel;

    if (file_exists($php_file)) {
        router_log("Mapping JSON to PHP: $uri -> $php_file");
        // Prevent caching for data requests
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        header('Cache-Control: post-check=0, pre-check=0', false);
        header('Pragma: no-cache');

        $_SERVER['SCRIPT_FILENAME'] = realpath($php_file);
        require $php_file;
        return;
    } else {
        router_log("Missing JSON/PHP bridge: $php_file");
        // IMPORTANT: Do not fallback to index.php for __data.json requests
        // This prevents returning HTML for data requests
        http_response_code(404);
        echo json_encode(["error" => "Data not found", "path" => $uri]);
        return;
    }
}

// 1. Serve static files if they exist
if ($uri !== '/' && file_exists(__DIR__ . '/build' . $uri) && is_file(__DIR__ . '/build' . $uri)) {
    return false; // serve the requested resource as-is.
}

// 2. Serve PHP files if they exist (e.g. /__data.php)
$candidate = __DIR__ . '/build' . $uri . '.php';
router_log("Candidate: $candidate (Exists: " . (file_exists($candidate) ? 'YES' : 'NO') . ")");

if ($uri !== '/' && file_exists($candidate)) {
    // SECURITY: Ensure we are only executing files within the build directory
    $requested_file = realpath($candidate);
    $build_dir = realpath(__DIR__ . '/build');

    // Debug logging
    router_log("Checking .php file: $requested_file vs $build_dir");

    if ($requested_file && str_starts_with($requested_file, $build_dir)) {
        $_SERVER['SCRIPT_FILENAME'] = $requested_file;
        require $requested_file;
        return;
    } else {
         router_log("Security check failed for .php file: $requested_file");
    }
}

// 3. Fallback to index.php (SvelteKit routing)
// The adapter generates index.php for routes.
// We need to find the correct index.php or route handler.
// Since the adapter prerenders structure, we might have:
// build/index.php
// build/about/index.php
// build/subdir/page.php (renamed from html)

// Try direct match for .php
if (file_exists(__DIR__ . '/build' . $uri)) {
    // It's a directory?
    if (is_dir(__DIR__ . '/build' . $uri)) {
        if (file_exists(__DIR__ . '/build' . $uri . '/index.php')) {
            $file = realpath(__DIR__ . '/build' . $uri . '/index.php');
            $_SERVER['SCRIPT_FILENAME'] = $file;
            require $file;
            return;
        }
    }
}

// Check for .php version of the URI (Prerendered HTML -> PHP)
if (file_exists(__DIR__ . '/build' . $uri . '.php')) {
    $file = realpath(__DIR__ . '/build' . $uri . '.php');
    $_SERVER['SCRIPT_FILENAME'] = $file;
    require $file;
    return;
}

// Default fallback (SPA-like or 404 handling)
// If we have a root index.php, try that.
/*
// DISABLED for strict 404 testing. If fallback is needed, uncomment or configure.
if (file_exists(__DIR__ . '/build/index.php')) {
    $file = realpath(__DIR__ . '/build/index.php');
    $_SERVER['SCRIPT_FILENAME'] = $file;
    require $file;
    return;
}
*/

// 404
http_response_code(404);
echo "404 Not Found (PHP Router)";
?>
