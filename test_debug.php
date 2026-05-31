<?php
// Test script to debug the load function execution

// Include the layout files
require_once __DIR__ . '/build/_protected/_layout.php';
require_once __DIR__ . '/build/_protected/parent-child___layout.php';
require_once __DIR__ . '/build/_protected/parent-child__nested___page.php';

// Check if functions exist
echo "Function exists checks:\n";
echo "sk_layout_server_load: " . (function_exists('sk_layout_server_load') ? 'YES' : 'NO') . "\n";
echo "sk_parent_child_layout_server_load: " . (function_exists('sk_parent_child_layout_server_load') ? 'YES' : 'NO') . "\n";
echo "sk_parent_child_nested_page_server_load: " . (function_exists('sk_parent_child_nested_page_server_load') ? 'YES' : 'NO') . "\n";

// Test calling the functions
$testParams = [
    'params' => [],
    'url' => (object)['searchParams' => new class {
        public function get($key) { return null; }
    }],
    'request' => (object)['method' => 'GET'],
    'cookies' => new class {
        public function get($key) { return null; }
    },
    'route' => (object)['id' => '/parent-child/nested'],
    'parent' => function() { return []; },
    'locals' => [],
    'depends' => function(...$deps) { return null; },
    'fetch' => function($input, $init = []) { return null; },
    'routeid' => '/parent-child/nested',
    'parentdata' => [],
    'method' => 'GET',
    'query' => [],
    'server' => []
];

echo "\nTesting function calls:\n";
try {
    $result1 = sk_layout_server_load($testParams);
    echo "sk_layout_server_load result: " . json_encode($result1) . "\n";
} catch (Exception $e) {
    echo "sk_layout_server_load error: " . $e->getMessage() . "\n";
}

try {
    $result2 = sk_parent_child_layout_server_load($testParams);
    echo "sk_parent_child_layout_server_load result: " . json_encode($result2) . "\n";
} catch (Exception $e) {
    echo "sk_parent_child_layout_server_load error: " . $e->getMessage() . "\n";
}

try {
    $result3 = sk_parent_child_nested_page_server_load($testParams);
    echo "sk_parent_child_nested_page_server_load result: " . json_encode($result3) . "\n";
} catch (Exception $e) {
    echo "sk_parent_child_nested_page_server_load error: " . $e->getMessage() . "\n";
}