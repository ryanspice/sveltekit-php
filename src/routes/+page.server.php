<?php
function load($params) {
    // Check cookies for redirect source
    $cookies = $params['cookies'] ?? [];
    $redirectedFrom = $cookies['redirected_from'] ?? null;
    
    $data = [
        'message' => 'Hello from PHP Root',
        'server_time' => date('Y-m-d H:i:s'),
        'php_version' => phpversion()
    ];

    if ($redirectedFrom) {
        $data['redirect_source'] = $redirectedFrom;
        $data['message'] = "You were redirected from: $redirectedFrom";
    }

    return $data;
}

function action_save($params) {
    $note = $params['post']['note'] ?? '';
    return [
        'success' => true,
        'message' => "Saved note: $note",
        'timestamp' => time()
    ];
}
?>
