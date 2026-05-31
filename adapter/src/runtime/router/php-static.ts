export function getRouterPhpStaticPhp(fallback?: string | boolean, fallbackFile?: string) {
	const hasFallback = Boolean(fallback);
	const resolvedFallback = fallbackFile ?? 'index.php';

	return `
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if (strpos($path, '/../') !== false || strpos($path, '/..\\\\') !== false) {
	http_response_code(400);
	echo "Bad Request";
	return;
}

if ($base !== '' && strpos($uri, $base) === 0) {
	$uri = substr($uri, strlen($base));
	if ($uri === '' || $uri === false) $uri = '/';
	router_log("Stripped URI: $uri");
}

if (strlen($uri) > 0 && $uri[0] !== '/') {
    $uri = '/' . $uri;
}

$root = __DIR__;
$q = $_SERVER['QUERY_STRING'] ?? '';

// Load Route Manifest
$manifest_file = $root . '/adapter/route-manifest.php';
$manifest = file_exists($manifest_file) ? require $manifest_file : [];

// Check Manifest Routes
foreach ($manifest as $route) {
    if (preg_match($route['re'], $uri)) {
        router_log("Matched regex: {$route['re']} for URI: $uri");

        // Enforce canonical trailing slash redirects (308)
        // If manifest entry says "always" but URI lacks slash -> 308 redirect
        // If manifest entry says "never" but URI has slash -> 308 redirect
        // Note: The regex usually handles matching both, but we need to enforce the canonical version.

        $trailingSlash = $route['trailingSlash'] ?? 'ignore'; // 'always', 'never', 'ignore'

        if ($trailingSlash === 'always' && substr($uri, -1) !== '/') {
            // Redirect to slash
            // Use 308 for Permanent Redirect (preserves method)
            $target = $base . $uri . '/';
            if ($q !== '') {
                $target .= '?' . $q;
            }
            header("Location: $target", true, 308);
            http_response_code(308); // Explicitly set response code
            return;
        } elseif ($trailingSlash === 'never' && substr($uri, -1) === '/' && $uri !== '/') {
            // Redirect to no slash
            $target = $base . substr($uri, 0, -1);
            if ($q !== '') {
                $target .= '?' . $q;
            }
            header("Location: $target", true, 308);
            http_response_code(308); // Explicitly set response code
            return;
        }

        if ($route['type'] === 'page' || $route['type'] === 'endpoint') {
            // ...
            $shim = $root . $route['shim'];
            router_log("Checking shim: $shim");
            // If we are serving a directory index, we must ensure trailing slash is correct.
            // But if we've reached here, the trailing slash check above should have handled it if manifest knows about it.
            // If manifest didn't catch it (e.g. regex too broad or 'ignore'), and it's a directory...
            // Actually, shim points to a file.
            if (file_exists($shim)) {
                // For directories, ensure we have trailing slash if required by manifest or typical convention
                // But for pages/endpoints, the regex should handle it.
                $_SERVER['SCRIPT_FILENAME'] = realpath($shim);
                require $shim;
                return;
            } else {
                router_log("Shim not found: $shim");
            }
        } elseif ($route['type'] === 'negotiate') {
            // Negotiation logic
            // Check Accept header
            $accept = $_SERVER['HTTP_ACCEPT'] ?? '';
            $prefersHtml = (strpos($accept, 'text/html') !== false);

            // Also check method. GET/HEAD can be page or endpoint. POST/PUT/etc usually endpoint.
            $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
            $isRead = ($method === 'GET' || $method === 'HEAD');

            $served = false;

            if ($isRead && $prefersHtml) {
                // Try page first
                $page = $root . $route['page'];
                if (file_exists($page)) {
                    // Check if it's .html or .php
                    if (substr($page, -4) === '.php') {
                        $_SERVER['SCRIPT_FILENAME'] = realpath($page);
                        require $page;
                        $served = true;
                    } else {
                        // Serve static HTML
                        // We must serve it with correct headers?
                        // Actually, just readfile. Apache/PHP handles content-type usually?
                        // We should set Content-Type: text/html explicitly to be safe
                        header('Content-Type: text/html; charset=utf-8');
                        readfile($page);
                        $served = true;
                    }
                }
            }

            if (!$served) {
                // Try endpoint
                $endpoint = $root . $route['endpoint'];
                if (file_exists($endpoint)) {
                    $_SERVER['SCRIPT_FILENAME'] = realpath($endpoint);
                    require $endpoint;
                    $served = true;
                }
            }

            // Fallback to page if endpoint missing? Or 404?
            // If we preferred HTML but page missing, try endpoint?
            // If we preferred JSON but endpoint missing, try page?
            // For now, simple priority.

            if ($served) {
                // $out = ob_get_clean();
                // echo $out;
                return;
            }
        }
    }
}

// Special handling for SvelteKit __data.json requests
// Map /path/__data.json to /path/__data.php
$suffix = '/__data.json';
if (substr($uri, -strlen($suffix)) === $suffix) {
    $php_file_rel = str_replace($suffix, '/__data.php', $uri);
    // If base path is set, the data files are nested under it (created by adapter)
    $prefix = ($base !== '' && $base !== '/') ? $base : '';
    $php_file = $root . $prefix . $php_file_rel;

    if (file_exists($php_file)) {
		header('Content-Type: application/json');
		header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
		$_SERVER['SCRIPT_FILENAME'] = realpath($php_file);
		require $php_file;
		return;
	} else {
        http_response_code(404);
        header('Content-Type: application/json');
        echo json_encode(["error" => "Data not found", "path" => $uri]);
        $out = ob_get_clean();
        echo $out;
        return;
    }
}

$action_suffix = '/__action';
if (substr($uri, -strlen($action_suffix)) === $action_suffix) {
    $php_file_rel = str_replace($action_suffix, '/__action.php', $uri);
    // If base path is set, the action files are nested under it (created by adapter)
    $prefix = ($base !== '' && $base !== '/') ? $base : '';
    $php_file = $root . $prefix . $php_file_rel;

    if (file_exists($php_file)) {
        $_SERVER['SCRIPT_FILENAME'] = realpath($php_file);
        require $php_file;
        // Same here
        return;
    } else {
        http_response_code(404);
        return;
    }
}

// 0. Try to serve exact file match - nested under base path
// This handles cases where static files are nested under the base path in the build output.
// We use stripped URI but reconstructed path including base.
$nested_path = __DIR__ . ($base === '/' ? '' : $base) . $uri;
if ($uri !== '/' && file_exists($nested_path)) {
	if (is_file($nested_path)) {
		$real = realpath($nested_path);
		if ($real === false || strpos($real, realpath(__DIR__)) !== 0) {
			http_response_code(403);
			return;
		}

		$ext = pathinfo($nested_path, PATHINFO_EXTENSION);
        $mime = 'application/octet-stream';
        if ($ext === 'html') $mime = 'text/html';
        elseif ($ext === 'css') $mime = 'text/css';
        elseif ($ext === 'js') $mime = 'application/javascript';
        elseif ($ext === 'json') $mime = 'application/json';
        elseif ($ext === 'png') $mime = 'image/png';
        elseif ($ext === 'jpg') $mime = 'image/jpeg';
        elseif ($ext === 'svg') $mime = 'image/svg+xml';

		if ($_SERVER['REQUEST_METHOD'] === 'HEAD') {
			header('Content-Type: '.$mime);
			header('Content-Length: '.filesize($nested_path));
			return;
		}

		if ($ext === 'php') {
			$_SERVER['SCRIPT_FILENAME'] = $real;
			require $real;
			return;
		}

		header('Content-Type: '.$mime);
		header('Content-Length: '.filesize($nested_path));
		readfile($nested_path);
		return;
	} elseif (is_dir($nested_path)) {
		// If accessing directory, check for index
		foreach (['/index.php', '/index.html'] as $idx) {
			$candidate = $nested_path . $idx;
			if (is_file($candidate)) {
				if (substr($uri, -1) !== '/') {
					// Redirect to slash
                    // We use $base . $uri because $uri is stripped
					$target = $base . $uri . '/';
					if (isset($_SERVER['QUERY_STRING']) && $_SERVER['QUERY_STRING'] !== '') {
						$target .= '?' . $_SERVER['QUERY_STRING'];
					}
					header("Location: $target", true, 301);
					return;
				}

				if (substr($candidate, -4) === '.php') {
					$_SERVER['SCRIPT_FILENAME'] = realpath($candidate);
					require $candidate;
					return;
				}

				header('Content-Type: text/html; charset=utf-8');
				readfile($candidate);
				return;
			}
		}
	}
}

// 1. Serve static files if they exist
$path = __DIR__.$uri;
if ($uri !== '/' && file_exists($path) && is_file($path)) {
    $real = realpath($path);
    if ($real === false || strpos($real, realpath(__DIR__)) !== 0) {
        http_response_code(403);
        echo "Access Denied";
        return;
    }

	$ext = pathinfo($path, PATHINFO_EXTENSION);
	$mimes = [
		'js' => 'application/javascript',
		'mjs' => 'application/javascript',
		'cjs' => 'application/javascript',
		'css' => 'text/css',
		'json' => 'application/json',
		'html' => 'text/html',
		'htm' => 'text/html',
		'xml' => 'text/xml',
		'txt' => 'text/plain',
		'svg' => 'image/svg+xml',
		'png' => 'image/png',
		'jpg' => 'image/jpeg',
		'jpeg' => 'image/jpeg',
		'gif' => 'image/gif',
		'webp' => 'image/webp',
		'ico' => 'image/x-icon',
		'woff2' => 'font/woff2',
		'woff' => 'font/woff',
		'ttf' => 'font/ttf',
		'eot' => 'application/vnd.ms-fontobject'
	];
	$mime = $mimes[$ext] ?? (function_exists('mime_content_type') ? mime_content_type($path) : 'application/octet-stream');

	if ($_SERVER['REQUEST_METHOD'] === 'HEAD') {
		header('Content-Type: '.$mime);
		header('Content-Length: '.filesize($path));
		return;
	}

	header('Content-Type: '.$mime);
	header('Content-Length: '.filesize($path));
	readfile($path);
	return;
}

if (strpos($uri, '/_app/') === 0) {
	http_response_code(404);
	return;
}

if (preg_match('/\\.(css|js|map|mjs|cjs|json|png|jpg|jpeg|gif|webp|svg|ico|txt|xml|woff2|woff|ttf|eot)$/', $uri)) {
	http_response_code(404);
	return;
}

// 2. If it's a directory, manually serve index.php or index.html
if ($uri !== '/' && is_dir($path)) {
    // If manifest said "never" for this route, we should have already redirected.
    // If we are here, and it's a directory, and the URI ends in slash (which is_dir implies usually unless trailing slash missing but is_dir still works on some OS?),
    // actually, if URI doesn't end in slash but is_dir is true, we should redirect to slash IF we want canonical directories.
    // But let's check manifest logic first.

    // Check if we need to redirect to slash for directory if missing
    if (substr($uri, -1) !== '/') {
         // This is a directory but accessed without slash.
         // Apache/Nginx usually do this automatically (301).
         // We should probably do it too if we are the router.
         $target = $base . $uri . '/';
         if (isset($_SERVER['QUERY_STRING']) && $_SERVER['QUERY_STRING'] !== '') {
             $target .= '?' . $_SERVER['QUERY_STRING'];
         }
         header("Location: $target", true, 301); // 301 for directory canonicalization (standard)
         return;
    }

    foreach (['/index.php', '/index.html'] as $idx) {
        $candidate = $path . $idx;
        if (is_file($candidate)) {
            // Check for trailing slash policy if it's a directory serving index
            // If the URI doesn't end in slash, we should have redirected above.

            if (substr($candidate, -4) === '.php') {
                $requested_file = realpath($candidate);
                if ($requested_file) {
                    $_SERVER['SCRIPT_FILENAME'] = $requested_file;
                    require $requested_file;
                    return;
                }
            }

            // Fix: If serving directory index.html, we must redirect non-slash URI to slash first
            // Otherwise relative links in that HTML will be broken.
            // (We did a 301 redirect check above, but that was generic. The previous block handles generic dir redirect.)
            // But if we are here, it means we found an index file.

            header('content-type: text/html; charset=utf-8');
            readfile($candidate);
            return;
        }
    }
}

// 3. Extensionless matching: /foo -> /foo.php or /foo.html
// But NOT if URI ends with slash (already handled by directory check above)
if ($uri !== '/' && substr($uri, -1) !== '/') {
    $candidate_path = __DIR__ . $uri;
    foreach (['.php', '.html'] as $ext) {
        $candidate = $candidate_path . $ext;
        if (is_file($candidate)) {
            if ($ext === '.php') {
                $requested_file = realpath($candidate);
                if ($requested_file) {
                    $_SERVER['SCRIPT_FILENAME'] = $requested_file;
                    require $requested_file;
                    return;
                }
            }

            header('content-type: text/html; charset=utf-8');
            readfile($candidate);
            return;
        }
    }
}

${
	hasFallback
		? `
$fallback_file = __DIR__ . '/${resolvedFallback}';
$fallback_php_ext = str_replace('.html', '.php', $fallback_file);

if (is_file($fallback_php_ext)) {
    $_SERVER['SCRIPT_FILENAME'] = realpath($fallback_php_ext);
    require $fallback_php_ext;
    $out = ob_get_clean();
    echo $out;
    return;
}
if (is_file($fallback_file)) {
    header('content-type: text/html; charset=utf-8');
    readfile($fallback_file);
    $out = ob_get_clean();
    echo $out;
    return;
}
router_log("Fallback enabled but file not found. Checked: $fallback_file and $fallback_php_ext");
`
		: 'router_log("Fallback disabled");'
}

// Explicit 404 for non-existent routes when no fallback is configured
http_response_code(404);
echo "404 Not Found";
$out = ob_get_clean();
echo $out;
`;
}
