export function getNodeHandlerMjs(base: string = '') {
	return `
import { Server } from './index.js';
import { manifest } from './manifest.js';
import http from 'node:http';

const server = new Server(manifest);
await server.init({ env: process.env });

const PORT = process.env.PORT || 3000;

http.createServer(async (req, res) => {
	try {
		const protocol = req.headers['x-forwarded-proto'] || 'http';
		const host = req.headers['x-forwarded-host'] || req.headers.host;
		const url = new URL(req.url, \`\${protocol}://\${host}\`);

    // Health/Ready Checks
    const pathname = url.pathname;
    const base = '${base}';
    const healthPath = base + '/__health';
    const readyPath = base + '/__ready';

    if (pathname === '/__health' || pathname === '/__ready' ||
        (base && (pathname === healthPath || pathname === readyPath))) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
            ok: true,
            mode: 'node-ssr',
            ts: Date.now()
        }));
        return;
    }

    console.log('[Handler] Request: ' + req.method + ' ' + url.pathname);

    // Polyfill: SvelteKit may not handle HEAD for __data.json, so we simulate it by doing GET and stripping body
    const isHead = req.method === 'HEAD';
    const isDataRequest = url.pathname.endsWith('__data.json');
    const method = (isHead && isDataRequest) ? 'GET' : req.method;

    if (isHead && isDataRequest) {
        console.log('[Handler] Converting HEAD to GET for ' + url.pathname);
    }

    const request = new Request(url, {
        method: method,
        headers: req.headers,
        body: method === 'GET' || method === 'HEAD' ? undefined : req,
        duplex: 'half'
    });

    const response = await server.respond(request, {
        getClientAddress: () => {
            return req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        },
        platform: { req, res }
    });

    res.statusCode = response.status;

    for (const [key, value] of response.headers) {
        // Handle Set-Cookie as array
        if (key === 'set-cookie') {
            const cookies = response.headers.getSetCookie();
            res.setHeader('set-cookie', cookies);
        } else {
            res.setHeader(key, value);
        }
    }

    if (response.body && (!isHead || !isDataRequest)) {
        const reader = response.body.getReader();
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                res.write(value);
            }
        } finally {
            res.end();
        }
    } else {
        res.end();
    }

} catch (e) {
    console.error(e);
    res.statusCode = 500;
    res.end('Internal Server Error');
}
}).listen(PORT, () => {
    console.log(\`Listening on port \${PORT}\`);
});
`;
}

export function getPhpProxy(sidecarUrl: string, base: string = '') {
	return `<?php
require_once __DIR__ . '/_runtime/compat.php';
/**
 * SvelteKit Node Sidecar Proxy
 * - Forwards requests to the running Node/Bun sidecar
 * - Preserves Method, Headers, Cookies
 * - Streams Response
 * - Fallback: Uses fopen/stream_context if curl is missing
 */

// Configuration
$timeoutMs = getenv('PROXY_TIMEOUT_MS') ?: 10000;
$connectTimeoutMs = getenv('PROXY_CONNECT_TIMEOUT_MS') ?: 500;
$maxBodyBytes = getenv('MAX_BODY_BYTES') ?: 10485760; // 10MB default

// Disable output buffering for streaming
ini_set('output_buffering', '0');
ini_set('zlib.output_compression', '0');
ini_set('implicit_flush', '1');
ini_set('display_errors', '0'); // Suppress notices/warnings from breaking output
while (ob_get_level()) ob_end_clean();

// Configuration & Validation (Security: Prevent SSRF)
$sidecarHost = getenv('SIDECAR_HOST') ?: '127.0.0.1';
$sidecarPort = getenv('SIDECAR_PORT') ?: '3000';
$allowNonLocal = getenv('ALLOW_NONLOCAL_SIDECAR') ?: '0';

if ($allowNonLocal !== '1' && $sidecarHost !== '127.0.0.1' && $sidecarHost !== 'localhost') {
    file_put_contents('php://stderr', "[Proxy Config Error] SIDECAR_HOST must be local unless ALLOW_NONLOCAL_SIDECAR=1\n", FILE_APPEND);
    http_response_code(500);
    echo "Configuration Error: Insecure SIDECAR_HOST";
    exit;
}

if (!is_numeric($sidecarPort)) {
    file_put_contents('php://stderr', "[Proxy Config Error] SIDECAR_PORT must be numeric\n", FILE_APPEND);
    http_response_code(500);
    echo "Configuration Error: Invalid SIDECAR_PORT";
    exit;
}

$sidecar = "http://$sidecarHost:$sidecarPort";
$base = '${base}';

$method = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'];
$reqId = uniqid('req_', true);

// Logging Helper
function proxy_log($msg) {
    global $reqId;
    $log = json_encode([
        'ts' => date('c'),
        'id' => $reqId,
        'msg' => $msg
    ]);
    file_put_contents('php://stderr', $log . "\\n", FILE_APPEND);
}

proxy_log("Proxy Start: Method=$method, URI=$uri");

// Max Body Check
$len = $_SERVER['CONTENT_LENGTH'] ?? 'unknown';
proxy_log("Body Check: Length=$len, Max=$maxBodyBytes");

if (isset($_SERVER['CONTENT_LENGTH']) && (int)$_SERVER['CONTENT_LENGTH'] > $maxBodyBytes) {
    proxy_log("Payload Too Large: " . $_SERVER['CONTENT_LENGTH']);
    http_response_code(413);
    header("Status: 413 Payload Too Large"); // Explicit header for some SAPI
    echo "Payload Too Large";
    exit;
}

// Note: We do NOT strip base path here because SvelteKit sidecar (built with base path) expects the full URL.
// The base path is only stripped when mapping to the filesystem in php-static mode.

$url = $sidecar . $uri;

if (!function_exists('getallheaders')) {
    function getallheaders() {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            }
        }
        return $headers;
    }
}

// Gather headers to forward
$headers = [];

// Explicitly ignore client-provided Forwarded headers to prevent spoofing
$headersToIgnore = [
    'x-forwarded-for', 'x-forwarded-proto', 'x-forwarded-host', 'x-forwarded-prefix',
    'x-request-id', 'connection', 'keep-alive', 'proxy-authenticate',
    'proxy-authorization', 'te', 'trailer', 'transfer-encoding', 'upgrade', 'host', 'content-length'
];

// Reuse existing ID if valid, else generate (User requirement: generate if missing)
// But we must overwrite any client-provided X-Request-Id header in the loop below to ensure we control it?
// Actually, standard practice is to trust X-Request-Id from client for tracing, but here we want to ensure it is consistent.
// The user prompt said: "X-Request-Id (generate if missing)".
// Let's check if we have one.
$clientReqId = $_SERVER['HTTP_X_REQUEST_ID'] ?? null;
if ($clientReqId && preg_match('/^[a-zA-Z0-9-_]{1,200}$/', $clientReqId)) {
    $reqId = $clientReqId;
}
$headers[] = "X-Request-Id: $reqId";

foreach (getallheaders() as $name => $value) {
    if (in_array(strtolower($name), $headersToIgnore)) continue;
    $headers[] = "$name: $value";
}

$headers[] = "X-Forwarded-For: " . ($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1');
$headers[] = "X-Forwarded-Proto: " . ((isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? 'https' : 'http');
$headers[] = "X-Forwarded-Host: " . ($_SERVER['HTTP_HOST'] ?? 'localhost');
if ($base) {
    $headers[] = "X-Forwarded-Prefix: " . $base;
}

// Use Curl if available (better for streaming/control)
if (function_exists('curl_init')) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, false); // We handle output manually
    curl_setopt($ch, CURLOPT_HEADER, false); // Headers handled by callback
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false); // Do not follow redirects
    curl_setopt($ch, CURLOPT_BUFFERSIZE, 16384); // Smaller buffer for streaming?

    // Timeouts
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT_MS, (int)$connectTimeoutMs);
    curl_setopt($ch, CURLOPT_TIMEOUT_MS, (int)$timeoutMs);

    if ($method !== 'GET' && $method !== 'HEAD') {
        $input = @fopen('php://input', 'r');
        curl_setopt($ch, CURLOPT_UPLOAD, true);
        curl_setopt($ch, CURLOPT_INFILE, $input);
    }

    if ($method === 'HEAD') {
        curl_setopt($ch, CURLOPT_NOBODY, true);
        curl_setopt($ch, CURLOPT_HEADER, true);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

        $response = curl_exec($ch);

        if ($response !== false) {
              // Parse headers from response
              $headers = explode("\\r\\n", $response);
              foreach ($headers as $header) {
                  $parts = explode(':', $header, 2);
                  if (count($parts) < 2) {
                      if (str_starts_with(strtoupper($header), 'HTTP/')) {
                          $status_parts = explode(' ', trim($header), 3);
                          if (count($status_parts) >= 2) {
                              http_response_code((int)$status_parts[1]);
                          }
                      }
                      continue;
                  }
                  $name = trim($parts[0]);
                  $value = trim($parts[1]);
                  $hopByHop = [
                     'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
                     'te', 'trailer', 'transfer-encoding', 'upgrade'
                  ];
                  if (in_array(strtolower($name), $hopByHop)) continue;
                  header("$name: $value", false);
              }
         } else {
             $error = curl_error($ch);
             proxy_log("Proxy HEAD Error: $error");
             http_response_code(502);
         }
        curl_close($ch);
        exit;
    }

    // Handle Response Headers
    curl_setopt($ch, CURLOPT_HEADERFUNCTION, function($curl, $header) {
        $len = strlen($header);

        $parts = explode(':', $header, 2);

        // Status line
        if (count($parts) < 2) {
            if (str_starts_with(strtoupper($header), 'HTTP/')) {
                $status_parts = explode(' ', trim($header), 3);
                if (count($status_parts) >= 2) {
                    http_response_code((int)$status_parts[1]);
                }
            }
            return $len;
        }

        $name = trim($parts[0]);
        $value = trim($parts[1]);

        $hopByHop = [
            'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
            'te', 'trailer', 'transfer-encoding', 'upgrade'
        ];

        if (in_array(strtolower($name), $hopByHop)) return $len;

        // Important: false as second arg to append instead of replace (for Set-Cookie)
        header("$name: $value", false);
        return $len;
    });

    // Handle Response Body (Streaming)
    curl_setopt($ch, CURLOPT_WRITEFUNCTION, function($curl, $data) {
        echo $data;
        flush();
        return strlen($data);
    });

    $result = curl_exec($ch);

    if ($result === false) {
        $error = curl_error($ch);
        $errno = curl_errno($ch);
        proxy_log("Proxy Error ($errno): $error");

        // If we haven't sent headers yet, we can send 502/504
        if (!headers_sent()) {
            // Ensure we Vary on Accept if we are returning error, as negotiation might have happened or client expects specific format
            header('Vary: Accept', false);

            if ($errno == 28) { // CURLE_OPERATION_TIMEDOUT
                 http_response_code(504);
                 echo "Gateway Timeout";
            } else {
                 http_response_code(502);
                 echo "Bad Gateway: Upstream failed";
            }
        }
    }

    curl_close($ch);
    exit;
}

// Fallback: stream_context_create
$opts = [
    'http' => [
        'method' => $method,
        'header' => $headers,
        'follow_location' => false,
        'ignore_errors' => true,
        'timeout' => $timeoutMs / 1000
    ]
];

if ($method !== 'GET' && $method !== 'HEAD') {
    $opts['http']['content'] = file_get_contents('php://input');
}

$context = stream_context_create($opts);
$fp = @fopen($url, 'rb', false, $context);

if ($fp) {
    // Headers
    $meta = stream_get_meta_data($fp);
    if (isset($meta['wrapper_data'])) {
        foreach ($meta['wrapper_data'] as $h) {
            if (str_starts_with(strtoupper($h), 'HTTP/')) {
                $parts = explode(' ', $h, 3);
                if (count($parts) >= 2) http_response_code((int)$parts[1]);
            } else {
                $parts = explode(':', $h, 2);
                if (count($parts) === 2) {
                    $name = trim($parts[0]);
                    $hopByHop = [
                        'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
                        'te', 'trailer', 'transfer-encoding', 'upgrade'
                    ];
                    if (in_array(strtolower($name), $hopByHop)) continue;
                    header($h, false);
                }
            }
        }
    }
    fpassthru($fp);
    fclose($fp);
} else {
    proxy_log("Proxy Fallback Error: Failed to connect to sidecar");
    http_response_code(502);
    echo "Bad Gateway: Failed to connect to sidecar";
}
?>`;
}

export function getHtaccess(mode: string, precompress: boolean = false) {
	// Removed RewriteBase to support flexible subdirectory deployment

	let commonRules = `
    RewriteEngine On

    # 1. Serve static files if they exist
    RewriteCond %{REQUEST_FILENAME} -f
    RewriteRule ^ - [L]
`;

	// Precompression Rules (Brotli/Gzip)
	if (precompress) {
		commonRules = `
    RewriteEngine On

    # 0. Precompression (Brotli)
    RewriteCond %{HTTP:Accept-Encoding} br
    RewriteCond %{REQUEST_FILENAME}.br -f
    RewriteRule ^(.*)$ $1.br [L]

    # 0. Precompression (Gzip)
    RewriteCond %{HTTP:Accept-Encoding} gzip
    RewriteCond %{REQUEST_FILENAME}.gz -f
    RewriteRule ^(.*)$ $1.gz [L]

    # Ensure Content-Type is correct for compressed files
    # This usually requires mod_mime and mod_headers.
    <IfModule mod_headers.c>
        <FilesMatch "\\.js\\.br$">
            Header set Content-Type "application/javascript"
            Header set Content-Encoding br
            Header append Vary Accept-Encoding
        </FilesMatch>
        <FilesMatch "\\.js\\.gz$">
            Header set Content-Type "application/javascript"
            Header set Content-Encoding gzip
            Header append Vary Accept-Encoding
        </FilesMatch>
        <FilesMatch "\\.css\\.br$">
            Header set Content-Type "text/css"
            Header set Content-Encoding br
            Header append Vary Accept-Encoding
        </FilesMatch>
        <FilesMatch "\\.css\\.gz$">
            Header set Content-Type "text/css"
            Header set Content-Encoding gzip
            Header append Vary Accept-Encoding
        </FilesMatch>
        <FilesMatch "\\.html\\.br$">
            Header set Content-Type "text/html"
            Header set Content-Encoding br
            Header append Vary Accept-Encoding
        </FilesMatch>
        <FilesMatch "\\.html\\.gz$">
            Header set Content-Type "text/html"
            Header set Content-Encoding gzip
            Header append Vary Accept-Encoding
        </FilesMatch>
    </IfModule>

    # 1. Serve static files if they exist
    RewriteCond %{REQUEST_FILENAME} -f
    RewriteRule ^ - [L]
`;
	}

	// Cache Control Rules
	const cacheRules = `
    <IfModule mod_headers.c>
        # Immutable assets (hashed)
        <FilesMatch "^immutable/.*$">
            Header set Cache-Control "public, max-age=31536000, immutable"
        </FilesMatch>

        # Other assets in _app (not immutable)
        <FilesMatch "^_app/(?!immutable/).*$">
            Header set Cache-Control "public, max-age=0, must-revalidate"
        </FilesMatch>

        # HTML/PHP Pages and Data
        <FilesMatch "\\.(php|html)$">
            Header set Cache-Control "no-store, no-cache, must-revalidate, max-age=0"
        </FilesMatch>
    </IfModule>
`;

	if (mode === 'node-ssr') {
		return `
<IfModule mod_rewrite.c>
${commonRules}
    # 2. Serve directory index if it exists (e.g. index.php)
    RewriteCond %{REQUEST_FILENAME} -d
    RewriteCond %{REQUEST_FILENAME}/index.php -f
    RewriteRule ^ %{REQUEST_URI}/index.php [L]

    # 3. Proxy everything else to index.php (which proxies to Node)
    RewriteRule ^ index.php [L]
</IfModule>
${cacheRules}
`;
	}

	// php-static mode
	return `
<IfModule mod_rewrite.c>
${commonRules}
    # 2. SvelteKit __data.json Bridge
    # Rewrite /path/__data.json -> /path/__data.php
    RewriteRule ^(.*)/__data\\.json$ $1/__data.php [L]

    # 3. Handle Prerendered HTML / PHP
    # If request is /foo, check for /foo.php (prerendered)
    RewriteCond %{REQUEST_FILENAME}.php -f
    RewriteRule ^(.*)$ $1.php [L]

    # 4. Fallback to index.php (SPA / Dynamic)
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^ index.php [L]
</IfModule>
${cacheRules}
`;
}

export function getStandaloneApiPhp(serverFilePath: string, relativePathToRoot?: string) {
	const negotiationLogic = relativePathToRoot
		? `
// Content Negotiation: If HTML requested, proxy to Node (Page)
$accept = $_SERVER['HTTP_ACCEPT'] ?? '';
if (($_SERVER['HTTP_X_SVELTEKIT_ACTION'] ?? '') === 'true') {
    $proxy = __DIR__ . '/${relativePathToRoot}/index.php';
    if (file_exists($proxy)) {
        $_SERVER['SCRIPT_FILENAME'] = realpath($proxy);
        require $proxy;
        return;
    }
}
if (!function_exists('sk_prefers_html')) {
    function sk_prefers_html($accept) {
        if (trim($accept) === '' || trim($accept) === '*/*') return false;
        $types = explode(',', $accept);
        $htmlQ = 0.0; $jsonQ = 0.0;
        foreach ($types as $type) {
            $parts = explode(';', $type);
            $mime = trim($parts[0]);
            $q = 1.0;
            for ($i = 1; $i < count($parts); $i++) {
                 $p = trim($parts[$i]);
                 if (strncmp($p, 'q=', 2) === 0) $q = (float)substr($p, 2);
            }
            if ($mime === 'text/html' || $mime === 'application/xhtml+xml') $htmlQ = max($htmlQ, $q);
            elseif ($mime === 'application/json') $jsonQ = max($jsonQ, $q);
        }
        return $htmlQ > $jsonQ;
    }
}

if (sk_prefers_html($accept)) {
    // 1. Check for Prerendered HTML
    $html = __DIR__ . '/index.html';
    if (file_exists($html)) {
        header('Content-Type: text/html');
        readfile($html);
        return;
    }

    // 2. Proxy to Node (Dynamic SSR)
    $proxy = __DIR__ . '/${relativePathToRoot}/index.php';
    if (file_exists($proxy)) {
        $_SERVER['SCRIPT_FILENAME'] = realpath($proxy);
        require $proxy;
        return;
    }
}
`
		: '';

	return `<?php
/**
 * SvelteKit PHP Adapter - Standalone API Wrapper
 * Wraps ${serverFilePath}
 */
${negotiationLogic}
require_once __DIR__ . '/${serverFilePath}';

// Helper to access request body
function sk_request_body(): string {
    return file_get_contents('php://input') ?: '';
}

function sk_json_body() {
    $raw = sk_request_body();
    return json_decode($raw, true);
}

// Build param object similar to RequestEvent
function sk_api_param(): array {
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $headers = [];
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
    } else {
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            }
        }
    }

    $url = (object)[
        'searchParams' => (object)$_GET,
        'pathname' => parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH)
    ];

    return [
        'request' => (object)[
            'method' => $method,
            'headers' => $headers,
            'body' => sk_json_body(),
            'rawBody' => sk_request_body()
        ],
        'url' => $url,
        'cookies' => $_COOKIE,
        'params' => []
    ];
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$fn_name = $method; // e.g. GET, POST

if (!function_exists($fn_name)) {
    // HEAD fallback to GET
    if ($method === 'HEAD' && function_exists('GET')) {
        $fn_name = 'GET';
    } else {
        http_response_code(405);
        exit;
    }
}

$param = sk_api_param();

try {
    $res = $fn_name($param);
} catch (Throwable $e) {
    http_response_code(500);
    echo "Internal Server Error: " . $e->getMessage();
    exit;
}

// Normalize response
$status = $res['status'] ?? 200;
$headers = $res['headers'] ?? [];
$body = $res['body'] ?? null;

// Apply headers
http_response_code((int)$status);
foreach ($headers as $k => $v) {
    header("$k: $v");
}

if ($body !== null) {
    $content = '';
    if (is_array($body) || is_object($body)) {
        if (!isset($headers['Content-Type']) && !isset($headers['content-type'])) {
            header('Content-Type: application/json');
        }
        $content = json_encode($body);
    } else {
        $content = (string)$body;
    }

    if (!isset($headers['Content-Length']) && !isset($headers['content-length'])) {
        header('Content-Length: ' . strlen($content));
    }

    if ($method !== 'HEAD') {
        echo $content;
    }
}
?>`;
}
