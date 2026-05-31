<?php
declare(strict_types=1);

if (!defined('SK_PHP_MIN_VERSION')) {
	define('SK_PHP_MIN_VERSION', 80100);
}

if (PHP_VERSION_ID < SK_PHP_MIN_VERSION) {
	http_response_code(500);
	header('Content-Type: text/plain; charset=utf-8');
	echo 'This app requires PHP 8.1+.';
	exit;
}

function sk_debug_enabled(): bool {
	$value = getenv('SK_DEBUG');
	if ($value === false) $value = getenv('ADAPTER_DEBUG');
	if ($value === false) return false;
	return in_array(strtolower((string)$value), ['1', 'true', 'yes', 'on'], true);
}

function sk_debug_log(string $message): void {
	if (sk_debug_enabled()) {
		error_log($message);
	}
}

if (!function_exists('str_starts_with')) {
	function str_starts_with($haystack, $needle) {
		return (string)$needle !== '' && strncmp($haystack, $needle, strlen($needle)) === 0;
	}
}

if (!function_exists('str_ends_with')) {
	function str_ends_with($haystack, $needle) {
		return $needle === '' || substr($haystack, -strlen($needle)) === $needle;
	}
}

if (!function_exists('array_is_list')) {
	function array_is_list(array $a) {
		if ($a === []) return true;
		return array_keys($a) === range(0, count($a) - 1);
	}
}

final class SK_Cookies implements ArrayAccess, IteratorAggregate {
	private array $cookies;

	public function __construct(?array $cookies = null) {
		$this->cookies = $cookies ?? $_COOKIE;
	}

	public function get(string $name): ?string {
		return $this->cookies[$name] ?? null;
	}

	public function getAll(): array {
		return $this->cookies;
	}

	public function set(string $name, string $value, array $options = []): void {
		$opts = $this->normalizeOptions($options);
		setcookie($name, $value, $opts);
		$this->cookies[$name] = $value;
	}

	public function delete(string $name, array $options = []): void {
		$opts = $this->normalizeOptions($options);
		$opts['expires'] = time() - 3600;
		setcookie($name, '', $opts);
		unset($this->cookies[$name]);
	}

	public function offsetExists($offset): bool {
		return array_key_exists($offset, $this->cookies);
	}

	public function offsetGet($offset): ?string {
		return $this->cookies[$offset] ?? null;
	}

	public function offsetSet($offset, $value): void {
		if (!is_string($offset)) return;
		$this->set($offset, (string)$value);
	}

	public function offsetUnset($offset): void {
		if (!is_string($offset)) return;
		$this->delete($offset);
	}

	public function getIterator(): Traversable {
		return new ArrayIterator($this->cookies);
	}

	private function normalizeOptions(array $options): array {
		$out = [];

		if (array_key_exists('path', $options)) $out['path'] = $options['path'];
		if (array_key_exists('domain', $options)) $out['domain'] = $options['domain'];
		if (array_key_exists('secure', $options)) $out['secure'] = (bool)$options['secure'];
		if (array_key_exists('httpOnly', $options)) $out['httponly'] = (bool)$options['httpOnly'];
		if (array_key_exists('sameSite', $options)) $out['samesite'] = $options['sameSite'];

		if (array_key_exists('maxAge', $options)) {
			$out['expires'] = time() + (int)$options['maxAge'];
		} elseif (array_key_exists('expires', $options)) {
			$out['expires'] = is_numeric($options['expires']) ? (int)$options['expires'] : strtotime((string)$options['expires']);
		}

		if (!array_key_exists('path', $out)) $out['path'] = '/';

		return $out;
	}
}

final class SK_Redirect extends Exception {
	public int $status;
	public string $location;

	public function __construct(int $status, string $location) {
		parent::__construct('Redirect');
		$this->status = $status;
		$this->location = $location;
	}
}

final class SK_Error extends Exception {
	public int $status;
	public $body;

	public function __construct(int $status, $body) {
		parent::__construct('Error');
		$this->status = $status;
		$this->body = $body;
	}
}

function sk_redirect(int $status, string $location): void {
	throw new SK_Redirect($status, $location);
}

function sk_error(int $status, $body): void {
	throw new SK_Error($status, $body);
}

/**
 * Get the base path for the application.
 * If SK_BASE_PATH environment variable is set, use that.
 * Otherwise compute from SCRIPT_NAME and SK_REL_TO_ROOT.
 * Returns empty string when at domain root.
 */
function sk_base_path(): string {
	// Check environment variable first
	$envPath = getenv('SK_BASE_PATH');
	if ($envPath !== false) {
		return rtrim($envPath, '/');
	}

	// If SK_REL_TO_ROOT is defined, compute from SCRIPT_NAME
	if (defined('SK_REL_TO_ROOT')) {
		$scriptName = $_SERVER['SCRIPT_NAME'] ?? '';
		$relToRoot = SK_REL_TO_ROOT;

		// Count ../ segments in SK_REL_TO_ROOT
		$upSegments = substr_count($relToRoot, '../');

		// Get directory of current script
		$scriptDir = dirname($scriptName);

		// Remove up segments from script directory
		$pathParts = explode('/', trim($scriptDir, '/'));
		$keepParts = count($pathParts) - $upSegments;
		$baseParts = array_slice($pathParts, 0, $keepParts);

		$basePath = '/' . implode('/', $baseParts);
		return rtrim($basePath, '/');
	}

	// Fallback to empty string (domain root)
	return '';
}

/**
 * Get the base href for HTML base tag and asset URLs.
 * Returns '/' for domain root, or '/base-path/' for subdirectory.
 */
function sk_base_href(): string {
	$basePath = sk_base_path();
	return $basePath === '' ? '/' : $basePath . '/';
}

function sk_extract_params(string $request_uri, string $base, string $regex, array $map): array {
	$path = parse_url($request_uri, PHP_URL_PATH) ?? '';
	if ($base !== '' && str_starts_with($path, $base)) {
		$path = substr($path, strlen($base));
		if ($path === '') $path = '/';
	}
	if ($path !== '/' && str_ends_with($path, '/')) $path = rtrim($path, '/');
	if ($path === '') $path = '/';

	$m = [];
	if (!preg_match($regex, $path, $m)) return [];

	$params = [];
	foreach ($map as $idx => $name) {
		$i = (int)$idx;
		if (!isset($m[$i])) continue;
		if ($m[$i] === '') continue;
		$params[(string)$name] = rawurldecode($m[$i]);
	}
	return $params;
}


function &sk_locals(): array {
	if (!array_key_exists('__SK_LOCALS', $GLOBALS)) {
		$GLOBALS['__SK_LOCALS'] = [];
	}
	return $GLOBALS['__SK_LOCALS'];
}

final class SK_FetchResponse {
	private int $status;
	private array $headers;
	private string $body;

	public function __construct(int $status, array $headers, string $body) {
		$this->status = $status;
		$this->headers = $headers;
		$this->body = $body;
	}

	public function status(): int {
		return $this->status;
	}

	public function headers(): array {
		return $this->headers;
	}

	public function text(): string {
		return $this->body;
	}

	public function json() {
		return json_decode($this->body, true);
	}
}

function sk_fetch(string $input, array $init = []): SK_FetchResponse {
	$method = $init['method'] ?? 'GET';
	$headers = $init['headers'] ?? [];
	$body = $init['body'] ?? null;
	$timeoutMsRaw = getenv('SK_FETCH_TIMEOUT_MS');
	$timeoutMs = is_numeric($timeoutMsRaw) && (int)$timeoutMsRaw > 0 ? (int)$timeoutMsRaw : 10000;

	$headerLines = [];
	foreach ($headers as $k => $v) {
		if (is_int($k)) {
			$headerLines[] = (string)$v;
		} else {
			$headerLines[] = $k . ': ' . $v;
		}
	}

	$opts = [
		'http' => [
			'method' => $method,
			'header' => implode("\r\n", $headerLines),
			'ignore_errors' => true,
			'timeout' => $timeoutMs / 1000
		]
	];

	if ($body !== null) {
		$opts['http']['content'] = is_string($body) ? $body : json_encode($body);
	}

	$context = stream_context_create($opts);
	$responseBody = @file_get_contents($input, false, $context);
	$respHeaders = $http_response_header ?? [];

	$status = 0;
	if (isset($respHeaders[0]) && preg_match('/\s(\d{3})\s/', $respHeaders[0], $m)) {
		$status = (int)$m[1];
	}

	return new SK_FetchResponse($status, $respHeaders, $responseBody !== false ? $responseBody : '');
}
