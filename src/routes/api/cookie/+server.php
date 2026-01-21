<?php
function GET($params) {
    $search = $params['url']->searchParams;

    if ($search->get('set')) {
        // Set cookie
        setcookie('adapter_cookie', '1', [
            'expires' => time() + 3600,
            'path' => '/',
            'httponly' => true
        ]);
        return [
            'body' => ['status' => 'set']
        ];
    }

    // Read cookie
    return [
        'body' => [
            'cookie_value' => $params['cookies']['adapter_cookie'] ?? null
        ]
    ];
}
?>
