<?php
/**
 * PHP Data Server for Development
 * Executes +page.server.php load functions and returns JSON
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$route = $_GET['route'] ?? '/';
$action = $_GET['action'] ?? null;
$basePath = __DIR__ . '/src/routes' . ($route === '/' ? '' : $route);
$phpFile = $basePath . '/+page.server.php';

if (file_exists($phpFile)) {
    try {
        require_once $phpFile;

        // Handle POST Actions
        if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action) {
            $actionName = 'action_' . ltrim($action, '?/');

            if (function_exists($actionName)) {
                // Get POST data
                $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
                $isJson = stripos($contentType, 'application/json') !== false;
                
                if ($isJson) {
                    $input = json_decode(file_get_contents('php://input'), true) ?? [];
                } else {
                    $input = $_POST;
                }

                // Mock params
                $params = [
                    'params' => [],
                    'post' => $input, // We'll pass the decoded body or $_POST as 'post'
                    'url' => (object)[
                        'searchParams' => (object)[]
                    ],
                    'request' => (object)[
                        'headers' => (object)getallheaders()
                    ]
                ];

                $result = $actionName($params);
                echo json_encode($result);
                exit;
            } else {
                http_response_code(404);
                echo json_encode(['error' => "Action function '$actionName' not found"]);
                exit;
            }
        }

        // Handle GET Load
        if (function_exists('load')) {
            // Convert $_GET to object for searchParams
            $searchParams = (object)$_GET;
            unset($searchParams->route); // Remove internal route param
            unset($searchParams->action); // Remove internal action param

            // Mock params
            $params = [
                'params' => [],
                'url' => (object)[
                    'searchParams' => $searchParams
                ],
                'request' => (object)[
                    'headers' => (object)[
                        'cookie' => $_SERVER['HTTP_COOKIE'] ?? ''
                    ]
                ],
                'cookies' => $_COOKIE // SvelteKit passes cookies object
            ];

            $data = load($params);
            echo json_encode($data);
        } else {
            echo json_encode(['error' => 'No load function found in +page.server.php']);
        }
    } catch (Throwable $e) {
        echo json_encode(['error' => $e->getMessage()]);
    }
} else {
    // If no PHP file, return null so SvelteKit can use default or JS load
    echo json_encode(null);
}
?>
