export function getRouterJsSsrPhp() {
	return `
// 0. Try to serve exact file match; preserves base path nesting
$full_path = __DIR__ . $uri;
if ($uri !== '/') {
    $real_full_path = router_safe_path(__DIR__, $full_path);
    if ($real_full_path !== null && is_file($real_full_path)) {
        router_send_file($real_full_path);
        return;
    } elseif ($real_full_path !== null && is_dir($real_full_path)) {
        // If accessing directory, check for index
        foreach (["/index.php", "/index.html"] as $idx) {
            $candidate = router_safe_path(__DIR__, $real_full_path . $idx);
            if ($candidate !== null && is_file($candidate)) {
                if (substr($uri, -1) !== '/') {
                    // Redirect to slash
                    $target = $uri . '/';
                    if (isset($_SERVER["QUERY_STRING"]) && $_SERVER["QUERY_STRING"] !== "") {
                        $target .= "?" . $_SERVER["QUERY_STRING"];
                    }
                    header("Location: $target", true, 301);
                    return;
                }

                if (substr($candidate, -4) === ".php") {
                    $_SERVER["SCRIPT_FILENAME"] = $candidate;
                    require $candidate;
                    return;
                }
                router_send_file($candidate, 'text/html; charset=utf-8');
                return;
            }
        }
    }
}

if ($base !== '' && strpos($uri, $base) === 0) {
    $uri = substr($uri, strlen($base));
    if ($uri === '' || $uri === false) $uri = '/';
}
if (strlen($uri) > 0 && $uri[0] !== '/') {
    $uri = '/' . $uri;
}
$path = __DIR__ . $uri;
if ($uri !== '/') {
    $real_path = router_safe_path(__DIR__, $path);
} else {
    $real_path = null;
}
if ($real_path !== null && is_dir($real_path)) {
    foreach (["/index.html", "/index.php"] as $idx) {
        $candidate = router_safe_path(__DIR__, $real_path . $idx);
        if ($candidate !== null && is_file($candidate)) {
            if (substr($candidate, -4) === ".php") {
                $_SERVER["SCRIPT_FILENAME"] = $candidate;
                require $candidate;
                return;
            }
            router_send_file($candidate, 'text/html; charset=utf-8');
            return;
        }
    }
}
if ($real_path !== null && is_file($real_path)) {
    router_send_file($real_path);
    return;
}

// Fallback to index.php
$_SERVER["SCRIPT_FILENAME"] = __DIR__ . "/index.php";
require __DIR__ . "/index.php";
`;
}
