<?php
// Test script to debug load function execution
require_once __DIR__ . '/build/_runtime/compat.php';
require_once __DIR__ . '/build/_protected/_layout.php';
require_once __DIR__ . '/build/_protected/parent-child___layout.php';
require_once __DIR__ . '/build/_protected/parent-child__nested___page.php';

// Mock URL object for load functions
class MockURL {
    public $searchParams = [];
    
    public function __construct() {
        $this->searchParams = new MockSearchParams();
    }
}

class MockSearchParams {
    public $redirected_source = null;
    public $message = null;
    public $redirected_from = null;
}

$params = ['url' => new MockURL()];

echo "Testing load functions:\n";
echo "======================\n\n";

// Test layout load function
echo "1. sk_layout_server_load:\n";
$layout_data = sk_layout_server_load($params);
echo "Result: " . json_encode($layout_data, JSON_PRETTY_PRINT) . "\n\n";

// Test parent-child layout load function  
echo "2. sk_parent_child_layout_server_load:\n";
$parent_data = sk_parent_child_layout_server_load($params);
echo "Result: " . json_encode($parent_data, JSON_PRETTY_PRINT) . "\n\n";

// Test nested page load function
echo "3. sk_parent_child_nested_page_server_load:\n";
$page_data = sk_parent_child_nested_page_server_load($params);
echo "Result: " . json_encode($page_data, JSON_PRETTY_PRINT) . "\n\n";

// Test serialization
echo "4. Testing serialization:\n";
require_once __DIR__ . '/build/parent-child/nested/__data.php';

$all_data = [$layout_data, $parent_data, $page_data];
foreach ($all_data as $i => $data) {
    echo "Data $i before serialize: " . json_encode($data) . "\n";
    $encoded = sk_serialize($data);
    echo "Data $i after serialize: " . json_encode($encoded) . "\n\n";
}