import path from 'node:path';
import { writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import type { AdapterOptions, Builder } from './types.js';

/**
 * Vite-integrated development adapter for faster builds
 * Works with Vite's dev server for instant feedback
 */
export default function sveltekitViteDevAdapter(options: AdapterOptions = {}) {
	const {
		ssr = true,
		out = './build',
		assets = './build',
	} = options;

	return {
		name: '@ryanspice/sveltekit-adapter-php-vite-dev',
		async adapt(builder: Builder) {
			const outDir = path.resolve(out);
			const assetsDir = path.resolve(assets);

			builder.log.minor('🚀 Vite dev adapter - optimized for development');

			// 1) Client assets (fast)
			builder.log.minor('Writing client assets');
			const writtenClientFiles = builder.writeClient(assetsDir);

			// 2) Create development PHP router
			if (ssr) {
				const devRouter = `<?php
/**
 * Vite Development PHP Router
 * Provides instant feedback during development
 */

// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 1);

$root = __DIR__;
$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

// Log requests for debugging (optional, can be disabled)
if (isset($_GET['debug'])) {
    error_log("[PHP Dev] Request: " . $_SERVER['REQUEST_METHOD'] . " " . $uri);
}

// 1. Direct file access (JS, CSS, images, etc.)
$target = $root . $uri;
if (is_file($target)) {
    // Set appropriate content type
    $ext = pathinfo($target, PATHINFO_EXTENSION);
    switch ($ext) {
        case 'js': header('Content-Type: application/javascript'); break;
        case 'css': header('Content-Type: text/css'); break;
        case 'json': header('Content-Type: application/json'); break;
        case 'php': break; // Let PHP handle PHP files
        default: 
            $mime = mime_content_type($target);
            if ($mime) header('Content-Type: ' . $mime);
    }
    return false; // Serve static file
}

// 2. PHP files (including __data.php, __action.php)
if (is_file($target . '.php')) {
    include $target . '.php';
    return;
}

// 3. Directory with index.php
if (is_dir($target) && is_file($target . '/index.php')) {
    include $target . '/index.php';
    return;
}

// 4. Development fallback - serve index.html with dev indicator
$indexFile = $root . '/index.html';
if (file_exists($indexFile)) {
    $content = file_get_contents($indexFile);
    
    // Add development indicator
    $devIndicator = '<!-- VITE DEV MODE - PHP Adapter Active -->';
    if (strpos($content, $devIndicator) === false) {
        $content = str_replace('<head>', '<head>' . $devIndicator, $content);
    }
    
    // Inject development script for hot reload
    $devScript = '
<script>
    // Development hot reload indicator
    if (typeof window !== "undefined" && window.console) {
        console.log("🚀 PHP Dev Adapter Active - Vite Dev Server Running");
    }
</script>';
    
    $content = str_replace('</body>', $devScript . '</body>', $content);
    
    echo $content;
    return;
}

// 5. 404 for development
http_response_code(404);
echo '<h1>404 - Development Mode</h1>';
echo '<p>File not found: ' . htmlspecialchars($uri) . '</p>';
echo '<p><small>PHP Dev Adapter - Vite Integration</small></p>';
?>`;

				await mkdir(outDir, { recursive: true });
				await writeFile(path.join(outDir, 'dev-router.php'), devRouter, 'utf8');
				builder.log.minor('Created Vite-integrated development router');
			}

			builder.log.minor('✅ Vite dev adapter complete - ready for development');
		}
	};
}