import path from 'node:path';
import { writeFile } from 'node:fs/promises';
import type { AdapterOptions, Builder } from './types.js';

/**
 * Lightweight development adapter that skips prerendering for faster builds
 */
export default function sveltekitPhpDevAdapter(options: AdapterOptions = {}) {
	const {
		ssr = true,
		out = './build',
		assets = './build',
	} = options;

	return {
		name: '@ryanspice/sveltekit-adapter-php-dev',
		async adapt(builder: Builder) {
			const outDir = path.resolve(out);
			const assetsDir = path.resolve(assets);

			builder.log.minor('🚀 Development adapter - skipping prerendering for speed');

			// 1) Client assets only (much faster)
			builder.log.minor('Writing client assets');
			const writtenClientFiles = builder.writeClient(assetsDir);

			// 2) Create minimal PHP entry point for development
			if (ssr) {
				const devPhp = `<?php
/**
 * Development mode - minimal PHP setup
 * This provides basic routing without full prerendering
 */

// Simple router for development
$uri = $_SERVER['REQUEST_URI'] ?? '/';
$path = parse_url($uri, PHP_URL_PATH);

// Serve static files directly
if (file_exists(__DIR__ . $path) && is_file(__DIR__ . $path)) {
    return false;
}

// For everything else, serve the main index.html
$indexFile = __DIR__ . '/index.html';
if (file_exists($indexFile)) {
    // Inject a simple dev mode indicator
    $content = file_get_contents($indexFile);
    $devIndicator = '<!-- DEV MODE -->';
    if (strpos($content, $devIndicator) === false) {
        $content = str_replace('<head>', '<head>' . $devIndicator, $content);
    }
    echo $content;
} else {
    echo '<h1>Development Mode</h1><p>Build in progress...</p>';
}
?>`;

				await writeFile(path.join(outDir, 'index.php'), devPhp, 'utf8');
				builder.log.minor('Created development PHP entry point');
			}

			builder.log.minor('✅ Development adapter complete');
		}
	};
}