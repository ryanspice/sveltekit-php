<?php
// Compatibility entrypoint for the PHP built-in server.
//
// Preferred usage from the repository root:
// php -S 127.0.0.1:8080 -t build router.php
//
// The generated build/router.php contains the runtime routing and path-safety
// behavior. Keep this root file thin so local manual runs and generated runtime
// routing stay aligned.

declare(strict_types=1);

$document_root = $_SERVER['DOCUMENT_ROOT'] ?? '';
$document_root_real = is_string($document_root) ? realpath($document_root) : false;

if ($document_root_real === false || !is_dir($document_root_real)) {
	http_response_code(500);
	echo 'Invalid PHP document root';
	return;
}

$router_file = $document_root_real . DIRECTORY_SEPARATOR . 'router.php';
$router_real = realpath($router_file);
$this_file = realpath(__FILE__);

if (
	$router_real === false ||
	!is_file($router_real) ||
	$router_real === $this_file ||
	strpos(str_replace('\\', '/', $router_real), rtrim(str_replace('\\', '/', $document_root_real), '/') . '/') !== 0
) {
	http_response_code(500);
	echo 'Generated build/router.php not found. Run the adapter build before starting PHP.';
	return;
}

require $router_real;
