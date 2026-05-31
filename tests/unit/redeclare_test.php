<?php
// Regression Test: Multi-include Safety
// Verifies that including multiple generated __data.php files does not cause fatal errors.

// Mock environment
$_SERVER['SCRIPT_FILENAME'] = 'redeclare_test.php';
$_SERVER['REQUEST_URI'] = '/';
$_SERVER['REQUEST_METHOD'] = 'GET';

$buildDir = __DIR__ . '/../../build-e2e-php-static';

if (!is_dir($buildDir)) {
    echo "SKIP: Build directory not found. Run 'bun run build:e2e' first.\n";
    exit(0);
}

// Find all __data.php files
$files = [];
$iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($buildDir));
foreach ($iterator as $file) {
    if ($file->getFilename() === '__data.php') {
        $files[] = $file->getPathname();
    }
}

if (empty($files)) {
    echo "SKIP: No __data.php files found.\n";
    exit(0);
}

echo "Found " . count($files) . " __data.php files.\n";

// Include first 5 to test (or all)
$count = 0;
foreach ($files as $file) {
    // echo "Including $file...\n";
    try {
        require_once $file; // require_once should be safe if it's literally the SAME file, but these are DIFFERENT files with SAME function definitions.
        // Wait, different files (different paths) but same content structure?
        // Yes, adapter generates a __data.php for EACH route.
        // They ALL contain the helper functions.
        // So we MUST use `require` (not once) to simulate independent loading?
        // No, in a single request, if we route to A, we load A's __data.php.
        // If A includes B (unlikely for __data.php), or if we use a shared router that includes multiple?
        // A router typically includes ONE endpoint.
        // BUT, if we have a shared `compat.php` or if we have a layout that includes something...
        // SvelteKit's `__data.js` are separate.
        // However, if we define global functions in `__data.php`, and we have a persistent PHP process (e.g. FrankenPHP, Swoole - not targeted here but good practice), or if we somehow include two files.
        // Example: `_server_dispatch.php` might include `_page.php`?
        // Or if we have a custom server script that loads multiple things.
        
        // Actually, the main risk is if `__data.php` and `index.php` (shim) both define helpers, or if `+server.php` shim and `__data.php` are both loaded (e.g. for negotiation or side-effects).
        // My fix guarded them, so even if we `require` multiple DIFFERENT files that define the SAME function, it should be fine.
        
        // We use `require` here to force loading (require_once would skip if it was the exact same file path, but these are different paths).
    } catch (Throwable $e) {
        echo "FAIL: " . $e->getMessage() . " in $file\n";
        exit(1);
    }
    $count++;
    if ($count >= 5) break; 
}

echo "PASS: Included $count files without redeclaration errors.\n";
?>
