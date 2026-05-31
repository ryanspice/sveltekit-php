<?php
// Include the necessary functions
require_once __DIR__ . '/build/_protected/_layout.php';
require_once __DIR__ . '/build/_protected/parent-child___layout.php';
require_once __DIR__ . '/build/_protected/parent-child__nested___page.php';

// Mock the sk_serialize function
function sk_serialize($value): array {
	$flattened = [];
	$map = [];

	$add_primitive = function($val) use (&$flattened, &$map) {
		$key = is_string($val)
			? 's_'.$val
			: (is_int($val)
				? 'i_'.$val
				: (is_float($val) ? 'f_'.$val : json_encode($val)));
		if (array_key_exists($key, $map)) {
			return $map[$key];
		}

		$flattened[] = $val;
		$idx = count($flattened) - 1;
		$map[$key] = $idx;
		return $idx;
	};

	$fn = function($val) use (&$flattened, &$map, &$fn, $add_primitive) {
		if (is_string($val) || is_int($val) || is_float($val) || is_bool($val) || is_null($val)) {
			return $add_primitive($val);
		}

		$is_list = is_array($val) && array_is_list($val);
		$flattened[] = $is_list ? [] : (object)[];
		$idx = count($flattened) - 1;
		$map['o_'.$idx] = $idx;

		foreach ($val as $k => $v) {
			$vIdx = $fn($v);
			if (is_array($flattened[$idx])) {
				$flattened[$idx][] = $vIdx;
			} else {
				$flattened[$idx]->{$k} = $vIdx;
			}
		}
		return $idx;
	};

	$fn($value);
	return $flattened;
}

// Test the load functions
$loadFns = ['0' => 'sk_layout_server_load', '1' => 'sk_parent_child_layout_server_load', '2' => 'sk_parent_child_nested_page_server_load'];
$server_results = [];

foreach ($loadFns as $i => $fn) {
    echo "Processing loadFn index=$i, function=$fn\n";
    
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
    
    $res = $fn($params);
    echo "Function result: " . json_encode($res) . "\n";
    
    if (is_array($res)) {
        $server_results[$i] = $res;
    }
}

echo "\n=== SERIALIZATION TEST ===\n";

// Test serialization
foreach ($server_results as $i => $data) {
    echo "Serializing data for index $i:\n";
    echo "Raw data: " . json_encode($data) . "\n";
    
    $encoded = sk_serialize($data);
    echo "Encoded: " . json_encode($encoded) . "\n";
    echo "Array values: " . json_encode(array_values($encoded)) . "\n\n";
}

echo "=== EXPECTED vs ACTUAL ===\n";
echo "Expected: data should be an object like {}\n";
echo "Actual: data is an array like [{}]\n";
echo "Problem: array_values() wraps the serialized data in an array\n";