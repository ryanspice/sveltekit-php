<?php
// Test the sk_apply_loads logic

// Include the layout files
require_once __DIR__ . '/build/_protected/_layout.php';
require_once __DIR__ . '/build/_protected/parent-child___layout.php';
require_once __DIR__ . '/build/_protected/parent-child__nested___page.php';

// Simulate the template JSON
$templateJson = '{"type":"data","nodes":[{"type":"data","data":[{}],"uses":{"url":1}},{"type":"data","data":[{}],"uses":{"url":1}},{"type":"data","data":[{}],"uses":{"url":1}}]}';
$payload = json_decode($templateJson, true);
$loadFns = ['0' => 'sk_layout_server_load', '1' => 'sk_parent_child_layout_server_load', '2' => 'sk_parent_child_nested_page_server_load'];

// Simulate the sk_apply_loads logic
$base = [];
$server_results = [];

foreach ($loadFns as $i => $fn) {
    echo "Processing loadFn index=$i, function=$fn\n";
    echo "Function exists: " . (function_exists($fn) ? 'YES' : 'NO') . "\n";
    
    if (!function_exists($fn)) {
        echo "Function $fn does not exist, skipping\n";
        continue;
    }
    
    // Mock params (similar to what's in sk_apply_loads)
    $params = [
        'params' => [],
        'url' => (object)['searchParams' => new class {
            public function get($key) { return null; }
        }],
        'request' => (object)['method' => 'GET'],
        'cookies' => new class {
            public function get($key) { return null; }
        },
        'route' => (object)['id' => '/parent-child/nested'],
        'parent' => function() use (&$base) { return $base; },
        'locals' => [],
        'depends' => function(...$deps) { return null; },
        'fetch' => function($input, $init = []) { return null; },
        'routeid' => '/parent-child/nested',
        'parentdata' => $base,
        'method' => 'GET',
        'query' => [],
        'server' => []
    ];
    
    try {
        $res = $fn($params);
        echo "Function result: " . json_encode($res) . "\n";
        
        if (is_array($res)) {
            $base = array_merge($base, $res);
            $server_results[$i] = $res;
        }
    } catch (Exception $e) {
        echo "Function error: " . $e->getMessage() . "\n";
    }
}

echo "\nServer results: " . json_encode($server_results) . "\n";

// Now try to map to nodes
$nodes = $payload['nodes'];
echo "\nOriginal nodes: " . json_encode($nodes) . "\n";

foreach ($server_results as $i => $data) {
    $nodeIdx = (int)$i; // Convert string key to int
    echo "Mapping load index $i to node index $nodeIdx\n";
    
    if (array_key_exists($nodeIdx, $nodes)) {
        echo "Found node at index $nodeIdx, updating data\n";
        $nodes[$nodeIdx]['data'] = [$data]; // Set the data array
    } else {
        echo "Node not found at index $nodeIdx\n";
    }
}

echo "\nUpdated nodes: " . json_encode($nodes) . "\n";

// Update payload
$payload['nodes'] = $nodes;
echo "\nFinal payload: " . json_encode($payload) . "\n";