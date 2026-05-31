export function getRouterJsSsrPhp() {
    return `
// 0. Try to serve exact file match; preserves base path nesting
$full_path = __DIR__ . $uri;
if ($uri !== '/' && file_exists($full_path)) {
    if (is_file($full_path)) {
        $real = realpath($full_path);
        if ($real === false || strpos($real, realpath(__DIR__)) !== 0) {
            http_response_code(403);
            return;
        }

        $ext = pathinfo($full_path, PATHINFO_EXTENSION);
        switch ($ext) {
            case 'js': $mime = 'application/javascript'; break;
            case 'css': $mime = 'text/css'; break;
            case 'html': $mime = 'text/html'; break;
            case 'json': $mime = 'application/json'; break;
            case 'png': $mime = 'image/png'; break;
            case 'jpg': $mime = 'image/jpeg'; break;
            case 'svg': $mime = 'image/svg+xml'; break;
            case 'ico': $mime = 'image/x-icon'; break;
            case 'txt': $mime = 'text/plain'; break;
            case 'xml': $mime = 'text/xml'; break;
            default: $mime = 'application/octet-stream';
        }

        header("Content-Type: $mime");
        readfile($full_path);
        return;
    } elseif (is_dir($full_path)) {
        // If accessing directory, check for index
        foreach (["/index.php", "/index.html"] as $idx) {
            $candidate = $full_path . $idx;
            if (is_file($candidate)) {
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
                    $_SERVER["SCRIPT_FILENAME"] = realpath($candidate);
                    require $candidate;
                    return;
                }
                header("Content-Type: text/html; charset=utf-8");
                readfile($candidate);
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
if ($uri !== '/' && is_dir($path)) {
    foreach (["/index.html", "/index.php"] as $idx) {
        $candidate = $path . $idx;
        if (is_file($candidate)) {
            if (substr($candidate, -4) === ".php") {
                $requested_file = realpath($candidate);
                if ($requested_file) {
                    $_SERVER["SCRIPT_FILENAME"] = $requested_file;
                    require $requested_file;
                    return;
                }
            }
            header("Content-Type: text/html; charset=utf-8");
            readfile($candidate);
            return;
        }
    }
}
if (file_exists($path) && is_file($path)) {
    $real = realpath($path);
    if ($real === false || strpos($real, realpath(__DIR__)) !== 0) {
        http_response_code(403);
        return;
    }

    $ext = pathinfo($path, PATHINFO_EXTENSION);
    switch ($ext) {
        case 'js': $mime = 'application/javascript'; break;
        case 'css': $mime = 'text/css'; break;
        case 'html': $mime = 'text/html'; break;
        case 'json': $mime = 'application/json'; break;
        case 'png': $mime = 'image/png'; break;
        case 'jpg': $mime = 'image/jpeg'; break;
        case 'svg': $mime = 'image/svg+xml'; break;
        case 'ico': $mime = 'image/x-icon'; break;
        case 'txt': $mime = 'text/plain'; break;
        case 'xml': $mime = 'text/xml'; break;
        default: $mime = 'application/octet-stream';
    }

    header("Content-Type: $mime");
    readfile($path);
    return;
}

// Fallback to index.php
$_SERVER["SCRIPT_FILENAME"] = __DIR__ . "/index.php";
require __DIR__ . "/index.php";
`;
}
