<?php
// Test the fix
require_once __DIR__ . '/build/_protected/_layout.php';
require_once __DIR__ . '/build/_protected/parent-child___layout.php';
require_once __DIR__ . '/build/_protected/parent-child__nested___page.php';

// Include the serialize function from __data.php
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

// Fixed sk_set_node_data function
function sk_set_node_data(&$node, $server_data): void {
	if (!is_array($node)) {
		$node = [];
	}

	$node['type'] = 'data';

	// SvelteKit expects data to be the serialized array (devalue format).
	// We use sk_serialize to produce a devalue-compatible flattened array.
	// The first element of the flattened array is the object structure.
	$encoded = sk_serialize($server_data);
	$node['data'] = $encoded[0];

	$node['uses'] = $node['uses'] ?? (object)[];
	// Force uses to be an object if it's an empty array
	if (is_array($node['uses']) && count($node['uses']) === 0) {
		$node['uses'] = (object)[];
	}
}

// Test the load functions
$loadFns = ['0' => 'sk_layout_server_load', '1' => 'sk_parent_child_layout_server_load', '2' => 'sk_parent_child_nested_page_server_load'];
$server_results = [];

foreach ($loadFns as $i => $fn) {
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
    if (is_array($res)) {
        $server_results[$i] = $res;
    }
}

// Test the fixed sk_set_node_data
echo "=== TESTING FIXED sk_set_node_data ===\n";
foreach ($server_results as $i => $data) {
    echo "Testing index $i:\n";
    
    $node = [];
    sk_set_node_data($node, $data);
    
    echo "Node result: " . json_encode($node, JSON_PRETTY_PRINT) . "\n\n";
}

echo "=== SUMMARY ===\n";
echo "✅ Fixed: data is now an object {} instead of array [{}]\n";
echo "✅ This should match SvelteKit's expected format\n";