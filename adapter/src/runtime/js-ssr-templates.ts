import { getPhpRequestSecurity } from './php-templates';

export function getNodeHandlerMjs(base: string = '', serverInstance = false) {
	return `
${serverInstance ? "import { server } from './instance.js';" : "import { Server } from './index.js';\nimport { manifest } from './manifest.js';\nconst server = new Server(manifest);"}
import http from 'node:http';
import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';
import { isIP } from 'node:net';

await server.init({ env: process.env, read: (file) => Readable.toWeb(createReadStream(new URL('./' + file, import.meta.url))) });

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.SK_SIDECAR_HOST || '127.0.0.1';
const BODY_SIZE_LIMIT = Number(process.env.SK_BODY_SIZE_LIMIT || 10485760);
if (!Number.isInteger(PORT) || PORT < 0 || PORT > 65535) throw new Error('Invalid PORT');
if (!Number.isSafeInteger(BODY_SIZE_LIMIT) || BODY_SIZE_LIMIT < 1) throw new Error('Invalid SK_BODY_SIZE_LIMIT');
const normalizeOrigin = (value) => {
    if (typeof value !== 'string' || /[\\\\\\x00-\\x20\\x7f,]/.test(value)) return null;
    try {
        const parsed = new URL(value);
        if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) return null;
        return parsed.origin;
    } catch { return null; }
};
const configuredOrigin = process.env.SK_ORIGIN ? normalizeOrigin(process.env.SK_ORIGIN) : null;
if (process.env.SK_ORIGIN && !configuredOrigin) throw new Error('Invalid SK_ORIGIN');
if (!['127.0.0.1', '::1', 'localhost'].includes(HOST) && !configuredOrigin) throw new Error('SK_ORIGIN is required for non-loopback sidecar binding');
const proxyAddresses = (process.env.SK_TRUSTED_PROXY_IPS || '127.0.0.1,::1').split(',').map((value) => value.trim());
const proxyDepth = Number(process.env.SK_XFF_DEPTH || 1);
if (!Number.isSafeInteger(proxyDepth) || proxyDepth < 1) throw new Error('Invalid SK_XFF_DEPTH');
const trustedProxy = (req) => process.env.SK_TRUSTED_PROXY_HEADERS === 'true' && proxyAddresses.includes((req.socket.remoteAddress || '').replace(/^::ffff:/, ''));
const readBody = (req) => new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
        size += chunk.length;
        if (size > BODY_SIZE_LIMIT) {
            chunks.length = 0;
            reject(Object.assign(new Error('Payload Too Large'), { status: 413 }));
        } else chunks.push(chunk);
    });
    req.once('end', () => resolve(Buffer.concat(chunks)));
    req.once('error', () => reject(Object.assign(new Error('Bad Request'), { status: 400 })));
    req.once('aborted', () => reject(Object.assign(new Error('Bad Request'), { status: 400 })));
});
const DEBUG = process.env.SK_DEBUG === 'true' || process.env.ADAPTER_DEBUG === 'true';
const debugLog = (...args) => {
    if (DEBUG) globalThis.console.log(...args);
};

http.createServer(async (req, res) => {
	try {
		const trustsProxy = trustedProxy(req);
		const protocol = trustsProxy ? req.headers['x-forwarded-proto'] || 'http' : 'http';
		const host = trustsProxy ? req.headers['x-forwarded-host'] || req.headers.host : req.headers.host;
		const origin = configuredOrigin || normalizeOrigin(protocol + '://' + host);
		if (!origin || !req.url.startsWith('/') || req.url.startsWith('//') || /[\\\\\\x00-\\x20\\x7f]/.test(req.url)) {
            res.writeHead(400); res.end('Bad Request'); return;
        }
		const url = new URL(req.url, origin);

    // Health/Ready Checks
    const base = '${base}';
    const pathname = url.pathname;
    const ensureBase = (rawPathname, basePath) => {
        if (!basePath) return rawPathname;
        if (rawPathname === basePath || rawPathname.startsWith(basePath + '/')) return rawPathname;
        if (rawPathname === '/') return basePath + '/';
        return basePath + rawPathname;
    };
    const prefixBase = (location, basePath) => {
        if (!basePath || !location) return location;
        if (/^https?:\\/\\//i.test(location)) return location;
        if (!location.startsWith('/')) return location;
        if (location === basePath || location.startsWith(basePath + '/')) return location;
        if (location === '/') return basePath + '/';
        return basePath + location;
    };
    const healthPath = base + '/__health';
    const readyPath = base + '/__ready';

    if (pathname === '/__health' || pathname === '/__ready' ||
        (base && (pathname === healthPath || pathname === readyPath))) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
            ok: true,
            mode: 'js-ssr',
            ts: Date.now()
        }));
        return;
    }

    const routedPathname = ensureBase(pathname, base);
    if (routedPathname !== pathname) {
        url.pathname = routedPathname;
    }

    debugLog('[Handler] Request: ' + req.method + ' ' + pathname + ' -> ' + url.pathname);

    // Polyfill: SvelteKit may not handle HEAD for __data.json, so we simulate it by doing GET and stripping body
    const isHead = req.method === 'HEAD';
    const isDataRequest = url.pathname.endsWith('__data.json');
    const method = (isHead && isDataRequest) ? 'GET' : req.method;

    if (isHead && isDataRequest) {
        debugLog('[Handler] Converting HEAD to GET for ' + url.pathname);
    }

    const requestHeaders = { ...req.headers, host: url.host };
    if (!trustsProxy) {
        for (const name of Object.keys(requestHeaders)) {
            if (name === 'forwarded' || name.startsWith('x-forwarded-')) delete requestHeaders[name];
        }
    }
    const contentLength = req.headers['content-length'];
    if (contentLength !== undefined && (!/^\\d+$/.test(contentLength) || Number(contentLength) > BODY_SIZE_LIMIT)) {
        req.resume(); res.writeHead(413, { Connection: 'close' }); res.end('Payload Too Large'); return;
    }
    const body = method === 'GET' || method === 'HEAD' ? undefined : await readBody(req);
    const request = new Request(url, {
        method: method,
        headers: requestHeaders,
        body
    });

    const response = await server.respond(request, {
        getClientAddress: () => {
            const remote = req.socket.remoteAddress || '127.0.0.1';
            if (!trustsProxy || typeof req.headers['x-forwarded-for'] !== 'string') return remote;
            const chain = req.headers['x-forwarded-for'].split(',').map((value) => value.trim());
            const address = chain[chain.length - proxyDepth];
            return isIP(address || '') ? address : remote;
        },
        platform: { req, res }
    });

    res.statusCode = response.status;

    for (const [key, value] of response.headers) {
        // Handle Set-Cookie as array
        if (key === 'set-cookie') {
            const cookies = response.headers.getSetCookie();
            res.setHeader('set-cookie', cookies);
        } else if (key === 'location') {
            res.setHeader('location', prefixBase(value, base));
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
    globalThis.console.error(e);
    res.statusCode = e.status === 413 || e.status === 400 ? e.status : 500;
    if (res.statusCode === 413) { req.resume(); res.setHeader('Connection', 'close'); }
    res.end(res.statusCode === 413 ? 'Payload Too Large' : res.statusCode === 400 ? 'Bad Request' : 'Internal Server Error');
}
}).listen(PORT, HOST, () => {
    globalThis.console.log(\`Listening on port \${PORT}\`);
});
`;
}

function getPhpProxyRequestBody() {
	return String.raw`
function sk_proxy_body_fail(int $status): never {
    http_response_code($status);
    exit($status === 413 ? 'Payload Too Large' : 'Invalid request body');
}
function sk_proxy_ini_bytes(string $value): int {
    // Keep the PHP 8.1 code floor; ini_parse_quantity was added in PHP 8.2.
    if (trim($value) === '-1') return 0;
    if (!preg_match('/^([0-9]+)\s*([KMG]?)$/iD', trim($value), $parts)) sk_proxy_body_fail(500);
    $quantity = (int)$parts[1];
    $factor = ['' => 1, 'K' => 1024, 'M' => 1048576, 'G' => 1073741824][strtoupper($parts[2])];
    return $quantity > intdiv(PHP_INT_MAX, $factor) ? PHP_INT_MAX : $quantity * $factor;
}
function sk_proxy_body_append($stream, string $bytes, int &$size, int $limit): void {
    $length = strlen($bytes);
    if ($length > $limit - $size) sk_proxy_body_fail(413);
    if ($length > 0 && fwrite($stream, $bytes) !== $length) sk_proxy_body_fail(500);
    $size += $length;
}
function sk_proxy_part_parameter(string $value): string {
    return preg_replace_callback('/[\x00-\x1f\x7f"\\\\]/',
        static fn($match) => sprintf('%%%02X', ord($match[0])), $value);
}
function sk_proxy_form_fields($stream, string $name, $value, string $boundary, int &$size, int $limit, int $depth = 0): void {
    if ($depth > 64) sk_proxy_body_fail(400);
    if (is_array($value)) {
        $list = array_is_list($value);
        foreach ($value as $key => $child) {
            $suffix = $list && !is_array($child) ? '[]' : '[' . $key . ']';
            sk_proxy_form_fields($stream, $name . $suffix, $child, $boundary, $size, $limit, $depth + 1);
        }
        return;
    }
    if (!is_string($value)) sk_proxy_body_fail(400);
    sk_proxy_body_append($stream, '--' . $boundary . "\r\nContent-Disposition: form-data; name=\"" . sk_proxy_part_parameter($name) . "\"\r\n\r\n", $size, $limit);
    sk_proxy_body_append($stream, $value, $size, $limit);
    sk_proxy_body_append($stream, "\r\n", $size, $limit);
}
function sk_proxy_form_files($stream, string $name, array $file, string $boundary, int &$size, int $limit, int $depth = 0): void {
    if ($depth > 64 || !array_key_exists('error', $file)) sk_proxy_body_fail(400);
    if (is_array($file['error'])) {
        $list = array_is_list($file['error']);
        foreach ($file['error'] as $key => $error) {
            $child = [];
            foreach (['name', 'type', 'tmp_name', 'error', 'size'] as $property) {
                if (!isset($file[$property]) || !is_array($file[$property]) || !array_key_exists($key, $file[$property])) sk_proxy_body_fail(400);
                $child[$property] = $file[$property][$key];
            }
            $suffix = $list && !is_array($error) ? '[]' : '[' . $key . ']';
            sk_proxy_form_files($stream, $name . $suffix, $child, $boundary, $size, $limit, $depth + 1);
        }
        return;
    }
    $error = $file['error'];
    if ($error === UPLOAD_ERR_INI_SIZE || $error === UPLOAD_ERR_FORM_SIZE) sk_proxy_body_fail(413);
    if ($error !== UPLOAD_ERR_OK && $error !== UPLOAD_ERR_NO_FILE) sk_proxy_body_fail(400);
    if (!is_string($file['name'] ?? null) || !is_string($file['type'] ?? null)) sk_proxy_body_fail(400);
    $type = $file['type'] ?: 'application/octet-stream';
    if (!preg_match('~^[a-zA-Z0-9!#$&^_.+-]+/[a-zA-Z0-9!#$&^_.+-]+$~D', $type)) sk_proxy_body_fail(400);
    sk_proxy_body_append($stream, '--' . $boundary . "\r\nContent-Disposition: form-data; name=\"" . sk_proxy_part_parameter($name) . "\"; filename=\"" . sk_proxy_part_parameter($file['name']) . "\"\r\nContent-Type: " . $type . "\r\n\r\n", $size, $limit);
    if ($error === UPLOAD_ERR_OK) {
        $tmp = $file['tmp_name'] ?? null;
        if (!is_string($tmp) || !is_uploaded_file($tmp)) sk_proxy_body_fail(400);
        $input = @fopen($tmp, 'rb');
        if ($input === false) sk_proxy_body_fail(400);
        while (!feof($input)) {
            $bytes = fread($input, 8192);
            if ($bytes === false) sk_proxy_body_fail(400);
            sk_proxy_body_append($stream, $bytes, $size, $limit);
        }
        fclose($input);
    }
    sk_proxy_body_append($stream, "\r\n", $size, $limit);
}

$requestBody = null;
$requestBodySize = 0;
$requestContentType = $_SERVER['CONTENT_TYPE'] ?? '';
if ($hasBody) {
    $isMultipart = (bool)preg_match('~^multipart/form-data(?:\s*;|\s*$)~i', $requestContentType);
    if ($isMultipart) {
        // A failed PHP parse can leave raw input readable. Validate before choosing
        // raw forwarding or reconstruction so parser failures cannot bypass limits.
        if (!preg_match('~;\s*boundary=(?:"[^"\r\n]+"|[^\s;"\r\n]+)~i', $requestContentType)) sk_proxy_body_fail(400);
        if ($method === 'POST' && filter_var(ini_get('enable_post_data_reading'), FILTER_VALIDATE_BOOLEAN)) {
            $postLimit = sk_proxy_ini_bytes((string)ini_get('post_max_size'));
            if ($postLimit > 0 && $contentLength !== null && $contentLength > $postLimit) sk_proxy_body_fail(413);
            if ($proxyParseError !== null && preg_match('~(?:POST Content-Length|input variables exceeded|input variable nesting|multipart|file upload|upload.*error)~i', $proxyParseError['message'] ?? '')) sk_proxy_body_fail(400);
        }
    }
    $requestBody = fopen('php://temp/maxmemory:2097152', 'w+b');
    $input = @fopen('php://input', 'rb');
    if ($requestBody === false || $input === false) sk_proxy_body_fail(500);
    while (!feof($input)) {
        $bytes = fread($input, 8192);
        if ($bytes === false) sk_proxy_body_fail(400);
        sk_proxy_body_append($requestBody, $bytes, $requestBodySize, $maxBodyBytes);
    }
    fclose($input);
    if ($requestBodySize === 0 && $isMultipart) {
        if ($method !== 'POST' || !filter_var(ini_get('enable_post_data_reading'), FILTER_VALIDATE_BOOLEAN) || $contentLength === 0) sk_proxy_body_fail(400);
        // PHP consumes POST multipart bodies before this script. Rebuild only its parsed semantics.
        // Bare duplicate names, original name spelling, and cross-field ordering cannot be recovered.
        $boundary = 'sk-proxy-' . bin2hex(random_bytes(16));
        foreach ($_POST as $name => $value) sk_proxy_form_fields($requestBody, (string)$name, $value, $boundary, $requestBodySize, $maxBodyBytes);
        foreach ($_FILES as $name => $file) {
            if (!is_array($file)) sk_proxy_body_fail(400);
            sk_proxy_form_files($requestBody, (string)$name, $file, $boundary, $requestBodySize, $maxBodyBytes);
        }
        sk_proxy_body_append($requestBody, '--' . $boundary . "--\r\n", $requestBodySize, $maxBodyBytes);
        $requestContentType = 'multipart/form-data; boundary=' . $boundary;
    }
    rewind($requestBody);
}
`;
}

export function getPhpProxy(sidecarUrl: string, base: string = '') {
	return `<?php
$proxyParseError = error_get_last();
require_once __DIR__ . '/_runtime/compat.php';
${getPhpRequestSecurity()}
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
$configuredMaxBodyBytes = getenv('MAX_BODY_BYTES');
$maxBodyBytes = $configuredMaxBodyBytes === false || $configuredMaxBodyBytes === '' ? '10485760' : $configuredMaxBodyBytes; // 10MB default
if (!sk_is_ascii_digits((string)$maxBodyBytes) || (int)$maxBodyBytes < 1 || (int)$maxBodyBytes >= PHP_INT_MAX) {
    http_response_code(500);
    exit('Invalid MAX_BODY_BYTES');
}
$maxBodyBytes = (int)$maxBodyBytes;

// Disable output buffering for streaming
ini_set('output_buffering', '0');
ini_set('zlib.output_compression', '0');
ini_set('implicit_flush', '1');
ini_set('display_errors', '0'); // Suppress notices/warnings from breaking output
while (ob_get_level()) ob_end_clean();

// Configuration & Validation (Security: Prevent SSRF)
$sidecar = getenv('PHP_SIDECAR_URL');

if (!$sidecar) {
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
}

$sidecar = rtrim($sidecar, '/');
$sidecarOrigin = sk_normalize_origin($sidecar);
$sidecarHost = $sidecarOrigin === null ? '' : parse_url($sidecarOrigin, PHP_URL_HOST);
if ($sidecarOrigin === null || (getenv('ALLOW_NONLOCAL_SIDECAR') !== '1' && !in_array($sidecarHost, ['127.0.0.1', 'localhost', '[::1]'], true))) {
    http_response_code(500);
    exit('Configuration Error: Invalid sidecar origin');
}
$sidecar = $sidecarOrigin;
$publicOrigin = sk_request_origin();
if ($publicOrigin === null) {
    http_response_code(400);
    exit('Invalid request origin configuration');
}
$base = '${base}';

$method = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'];
$path = parse_url($uri, PHP_URL_PATH);
$hasBody = !in_array($method, ['GET', 'HEAD'], true);
$contentLengthHeader = $_SERVER['CONTENT_LENGTH'] ?? null;
$contentLength = is_numeric($contentLengthHeader) ? (int)$contentLengthHeader : null;
// Normalize path for matching (e.g. // -> /)
if ($path && $path !== '/') {
    $path = preg_replace('#/+#', '/', $path);
}
$localPath = $path;
if ($base !== '' && ($path === $base || strpos($path, $base . '/') === 0)) {
    $localPath = substr($path, strlen($base)) ?: '/';
}

// 1. Prerendered Home Page Support
if (!$hasBody && ($localPath === '/' || $localPath === '/index.php')) {
    if (file_exists(__DIR__ . '/_home.php')) {
        require __DIR__ . '/_home.php';
        exit;
    }

    $htmlPath = __DIR__ . '/index.html';
    if (file_exists($htmlPath)) {
        header('Content-Type: text/html; charset=utf-8');
        readfile($htmlPath);
        exit;
    }
}

// 2. Prerendered Data Support
// If we have a local __data.php corresponding to the request, serve it directly.
// This handles /__data.json -> /__data.php (Root)
// And /about/__data.json -> /about/__data.php (Subdir)
if (substr($localPath, -12) === '/__data.json') {
    $phpDataRel = substr($localPath, 0, -12) . '/__data.php';
    // Prevent directory traversal attacks if someone requests /../../__data.json (though parse_url cleans some)
    // Realpath check is good.
    $phpData = __DIR__ . $phpDataRel;
    if (file_exists($phpData)) {
         $real = realpath($phpData);
         if ($real && strpos($real, realpath(__DIR__)) === 0) {
             $_SERVER['SCRIPT_FILENAME'] = $real;
             require $real;
             exit;
         }
    }
}

$reqId = uniqid('req_', true);

// Logging Helper
if (!function_exists('proxy_log')) {
    function proxy_log($msg) {
        global $reqId;
        $log = json_encode([
            'ts' => date('c'),
            'id' => $reqId,
            'msg' => $msg
        ]);
        file_put_contents('php://stderr', $log . "\\n", FILE_APPEND);
    }
}

if (!function_exists('proxy_debug_enabled')) {
    function proxy_debug_enabled() {
        $value = getenv('PROXY_DEBUG');
        if ($value === false) $value = getenv('SK_DEBUG');
        if ($value === false) $value = getenv('ADAPTER_DEBUG');
        if ($value === false) return false;
        return in_array(strtolower((string)$value), ['1', 'true', 'yes', 'on'], true);
    }
}

if (!function_exists('proxy_debug')) {
    function proxy_debug($msg) {
        if (proxy_debug_enabled()) proxy_log($msg);
    }
}

proxy_debug("Proxy Start: Method=$method, URI=$uri, Sidecar=$sidecar");

// Max Body Check
$len = $_SERVER['CONTENT_LENGTH'] ?? 'unknown';
proxy_debug("Body Check: Length=$len, Max=$maxBodyBytes");

if ($hasBody && $contentLength !== null && $contentLength > (int)$maxBodyBytes) {
    proxy_log("Payload Too Large: " . $_SERVER['CONTENT_LENGTH']);
    http_response_code(413);
    header("Status: 413 Payload Too Large"); // Explicit header for some SAPI
    echo "Payload Too Large";
    exit;
}

// Note: We do NOT strip base path here because SvelteKit sidecar (built with base path) expects the full URL.
// The base path is only stripped when mapping to the filesystem in php-static mode.

$url = $sidecar . $uri;

${getPhpProxyRequestBody()}

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
    'forwarded', 'x-request-id', 'connection', 'keep-alive', 'proxy-authenticate',
    'proxy-authorization', 'te', 'trailer', 'transfer-encoding', 'upgrade', 'host', 'content-length', 'content-type'
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
    if (in_array(strtolower($name), $headersToIgnore) || str_starts_with(strtolower($name), 'x-forwarded-')) continue;
    $headers[] = "$name: $value";
}
if ($requestContentType !== '') $headers[] = 'Content-Type: ' . $requestContentType;
if ($hasBody) $headers[] = 'Content-Length: ' . $requestBodySize;

$headers[] = "X-Forwarded-For: " . sk_client_address();
$headers[] = "X-Forwarded-Proto: " . parse_url($publicOrigin, PHP_URL_SCHEME);
$headers[] = "X-Forwarded-Host: " . parse_url($publicOrigin, PHP_URL_HOST) . (parse_url($publicOrigin, PHP_URL_PORT) !== null ? ':' . parse_url($publicOrigin, PHP_URL_PORT) : '');
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
    curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4); // Force IPv4 to avoid localhost ::1 issues on Windows

    // Timeouts
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT_MS, (int)$connectTimeoutMs);
    curl_setopt($ch, CURLOPT_TIMEOUT_MS, (int)$timeoutMs);

    if ($hasBody) {
        curl_setopt($ch, CURLOPT_UPLOAD, true);
        curl_setopt($ch, CURLOPT_INFILE, $requestBody);
        curl_setopt($ch, CURLOPT_INFILESIZE, $requestBodySize);
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
        proxy_log("Proxy Error (origin=$sidecar, errno=$errno): $error");

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

if ($hasBody) {
    $opts['http']['content'] = stream_get_contents($requestBody, $maxBodyBytes);
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

export function getStandaloneApiPhp(serverFilePath: string, relativePathToRoot?: string) {
	const negotiationLogic = relativePathToRoot
		? `
// Content Negotiation: If HTML requested, proxy to Node (Page)
$accept = $_SERVER['HTTP_ACCEPT'] ?? '';
header('Vary: Accept');
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
if (!function_exists('sk_request_body')) {
function sk_request_body(): string {
    return file_get_contents('php://input') ?: '';
}
}

if (!function_exists('sk_json_body')) {
function sk_json_body() {
    $raw = sk_request_body();
    return json_decode($raw, true);
}
}

// Build param object similar to RequestEvent
if (!function_exists('sk_api_param')) {
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
    error_log('[sveltekit-php] endpoint error: ' . $e->getMessage());
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Internal Server Error';
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
