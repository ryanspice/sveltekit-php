<?php
// Test script to debug sk_apply_loads function
require_once __DIR__ . '/build/_runtime/compat.php';
require_once __DIR__ . '/build/_protected/_layout.php';
require_once __DIR__ . '/build/_protected/parent-child___layout.php';
require_once __DIR__ . '/build/_protected/parent-child__nested___page.php';
require_once __DIR__ . '/build/parent-child/nested/__data.php';

// Mock $_SERVER
$base = getenv('DEPLOY_BASE') ?: '/dev/sveltekit';
$_SERVER['REQUEST_URI'] = $base . '/parent-child/nested';
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['QUERY_STRING'] = '';
$_SERVER['HTTP_COOKIE'] = '';

// Mock $_GET
$_GET = [];

// Mock $_COOKIE
$_COOKIE = [];

// Test the template JSON from __data.php
$templateJson = base64_decode('eyJ0eXBlIjoiZGF0YSIsIm5vZGVzIjpbeyJ0eXBlIjoiZGF0YSIsImRhdGEiOlt7fV0sInVzZXMiOnsidXJsIjoxfX0seyJ0eXBlIjoiZGF0YSIsImRhdGEiOlt7fV0sInVzZXMiOnsidXJsIjoxfX0seyJ0eXBlIjoiZGF0YSIsImRhdGEiOlt7fV0sInVzZXMiOnsidXJsIjoxfX1dfQo=');
$payload = json_decode(is_string($templateJson) ? $templateJson : '', true);
$loadFns = ['0' => 'sk_layout_server_load', '1' => 'sk_parent_child_layout_server_load', '2' => 'sk_parent_child_nested_page_server_load'];
$routeId = $base . "/parent-child/nested";
$inlineMode = "nodes";

echo "Template payload before sk_apply_loads:\n";
echo json_encode($payload, JSON_PRETTY_PRINT) . "\n\n";

echo "Load functions:\n";
echo json_encode($loadFns, JSON_PRETTY_PRINT) . "\n\n";

// Test sk_get_nodes_ref
echo "Testing sk_get_nodes_ref:\n";
$ref = sk_get_nodes_ref($payload);
echo "Reference: " . json_encode($ref) . "\n\n";

// Get nodes reference
$nodes = [];
if ($ref['kind'] === 'assoc') {
    $nodes = &$payload[$ref['key']];
} else if ($ref['kind'] === 'index') {
    $nodes = &$payload[$ref['idx']];
} else {
    $nodes = &$payload;
}

echo "Nodes before: " . json_encode($nodes, JSON_PRETTY_PRINT) . "\n\n";

// Test sk_apply_loads
echo "Calling sk_apply_loads...\n";
$finalPayload = sk_apply_loads($routeId, $loadFns, $payload, $inlineMode);

echo "Final payload:\n";
echo json_encode($finalPayload, JSON_PRETTY_PRINT) . "\n";
