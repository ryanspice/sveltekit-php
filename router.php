<?php
// Simple router to emulate Apache .htaccess mod_rewrite
// for the PHP built-in server.

// Helper for logging
function router_log($msg) {
    file_put_contents('php://stderr', "[Router] " . $msg . "\n", FILE_APPEND);
}

$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
router_log("Request: $uri");

// 1. Determine Base Path
$base = getenv('DEPLOY_BASE');
if ($base === false) $base = getenv('SK_BASE_PATH');
if ($base === false) {
    // Try build stamp
    $stamp_file = $_SERVER['DOCUMENT_ROOT'] . '/_runtime/build-stamp.json';
    if (file_exists($stamp_file)) {
        $data = json_decode(file_get_contents($stamp_file), true);
        $base = $data['basePath'] ?? '';
    } else {
        $base = '';
    }
}
// Normalize base: no trailing slash
$base = rtrim($base, '/');

// 2. Root Redirect (only if base is set)
if ($base !== '' && $uri === '/') {
    header("Location: $base/", true, 308);
    exit;
}

// 3. Path Stripping & Strict 404
$path = $uri; // Path relative to document root
if ($base !== '') {
    if (strpos($uri, $base . '/') === 0) {
        $path = substr($uri, strlen($base));
    } elseif ($uri === $base) {
         // canonical redirect for base without slash
         header("Location: $base/", true, 308);
         exit;
    } else {
        // Strict 404 for outside base
        http_response_code(404);
        echo "404 Not Found (Outside Base)";
        return;
    }
}

// Ensure path starts with /
if ($path === '') $path = '/';
router_log("Rewrote URI to: $path (Base: '$base')");

// Security: Block _protected directory
if (strpos($path, '/_protected/') === 0) {
    http_response_code(403);
    echo "Access Denied";
    return;
}

// Special handling for SvelteKit __data.json requests
// Map /path/__data.json to /build/path/__data.php
$suffix = '/__data.json';
if (substr($path, -strlen($suffix)) === $suffix) {
    // Replace .json with .php
    $php_file_rel = str_replace($suffix, '/__data.php', $path);
    $php_file = $_SERVER['DOCUMENT_ROOT'] . $php_file_rel;

    if (file_exists($php_file)) {
        router_log("Mapping JSON to PHP: $path -> $php_file");
        // Prevent caching for data requests
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        header('Cache-Control: post-check=0, pre-check=0', false);
        header('Pragma: no-cache');

        $_SERVER['SCRIPT_FILENAME'] = realpath($php_file);
        require $php_file;
        return;
    } else {
        router_log("Missing JSON/PHP bridge: $php_file");
        http_response_code(404);
        echo json_encode(["error" => "Data not found", "path" => $path]);
        return;
    }
}

// 4. Serve Static Files
// If base is empty, we can return false for direct hits.
// BUT if base is set, we stripped it, so the built-in server sees the original URI (with base)
// and won't find it in docroot. We must serve it manually.
$file = $_SERVER['DOCUMENT_ROOT'] . $path;

if ($base === '' && $path !== '/' && file_exists($file) && is_file($file)) {
    return false; // serve the requested resource as-is.
}

if ($base !== '' && $path !== '/' && file_exists($file) && is_file($file)) {
    // Security check
    if (strpos(realpath($file), realpath($_SERVER['DOCUMENT_ROOT'])) !== 0) {
         http_response_code(403); exit;
    }

    // MIME types
    $ext = pathinfo($file, PATHINFO_EXTENSION);
    $mimes = [
        'html' => 'text/html',
        'css' => 'text/css',
        'js' => 'application/javascript',
        'mjs' => 'application/javascript',
        'json' => 'application/json',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'gif' => 'image/gif',
        'svg' => 'image/svg+xml',
        'ico' => 'image/x-icon',
        'woff' => 'font/woff',
        'woff2' => 'font/woff2',
        'ttf' => 'font/ttf',
        'map' => 'application/json',
        'txt' => 'text/plain',
        'xml' => 'text/xml',
        'pdf' => 'application/pdf',
        'wasm' => 'application/wasm'
    ];

    if ($ext === 'php') {
        // Fall through to PHP handling logic
    } else {
        $mime = $mimes[$ext] ?? 'application/octet-stream';
        header("Content-Type: $mime");
        // Add cache headers for assets
        if (strpos($path, '/_app/') === 0) {
            header('Cache-Control: public, max-age=31536000, immutable');
        }
        readfile($file);
        return;
    }
}

// 5. Serve PHP files if they exist (e.g. /__data.php)
$candidate = $_SERVER['DOCUMENT_ROOT'] . $path . '.php';
// router_log("Candidate: $candidate (Exists: " . (file_exists($candidate) ? 'YES' : 'NO') . ")");

if ($path !== '/' && file_exists($candidate)) {
    $requested_file = realpath($candidate);
    $build_dir = realpath($_SERVER['DOCUMENT_ROOT']);

    if ($requested_file && str_starts_with($requested_file, $build_dir)) {
        $_SERVER['SCRIPT_FILENAME'] = $requested_file;
        require $requested_file;
        return;
    }
}

// 6. Fallback to index.php (SvelteKit routing)
if (file_exists($_SERVER['DOCUMENT_ROOT'] . $path)) {
    // It's a directory?
    if (is_dir($_SERVER['DOCUMENT_ROOT'] . $path)) {
        if (file_exists($_SERVER['DOCUMENT_ROOT'] . $path . '/index.php')) {
            $file = realpath($_SERVER['DOCUMENT_ROOT'] . $path . '/index.php');
            $_SERVER['SCRIPT_FILENAME'] = $file;
            require $file;
            return;
        }
    }
}

// Check for .php version of the URI (Prerendered HTML -> PHP)
if (file_exists($_SERVER['DOCUMENT_ROOT'] . $path . '.php')) {
    $file = realpath($_SERVER['DOCUMENT_ROOT'] . $path . '.php');
    $_SERVER['SCRIPT_FILENAME'] = $file;
    require $file;
    return;
}

// 404
http_response_code(404);
echo "404 Not Found (PHP Router)";
?>