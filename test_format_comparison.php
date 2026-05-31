<?php
// Test what the expected format should be
$expected_format = [
    'type' => 'data',
    'data' => ["app_name" => 1, "app_version" => 2], // This should be just the object, not wrapped in array
    'uses' => (object)[]
];

echo "Expected format:\n";
echo json_encode($expected_format, JSON_PRETTY_PRINT) . "\n\n";

// Current format (wrong)
$current_format = [
    'type' => 'data', 
    'data' => [["app_name" => 1, "app_version" => 2], "SvelteKit PHP Demo", "1.0.0"], // Wrapped in array
    'uses' => (object)[]
];

echo "Current format (wrong):\n";
echo json_encode($current_format, JSON_PRETTY_PRINT) . "\n\n";

echo "The issue: array_values() returns the entire flattened array,\n";
echo "but we only need the first element (the object structure)\n";