<?php
function load($params) {
    // Capture potential redirect info from query params
    // In a real app, this might come from a session flash message
    $search = $params['url']->searchParams;

    return [
        'app_name' => 'SvelteKit PHP Demo',
        'app_version' => '1.0.0',
        'global_layout_loaded' => true,

        // Debug & Tracking
        'request_id' => uniqid('req_', true),
        'layout_uuid' => uniqid('layout_', true),
        'timestamp' => time(),
        'php_engine' => 'PHP ' . PHP_VERSION,
        'memory_usage' => memory_get_usage(),
        'is_dev' => getenv('APP_ENV') === 'dev',

        // Requested global fields
        'redirected_source' => $search->redirected_source ?? null,
        'message' => $search->message ?? null,
        'redirected_from' => $search->redirected_from ?? null
    ];
}
?>
