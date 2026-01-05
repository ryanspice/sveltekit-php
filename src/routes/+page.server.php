<?php
function load($params) {
    return [
        'title' => 'SvelteKit PHP Adapter',
        'description' => 'Running SvelteKit on PHP runtime with full SSR support.',
        'message' => 'Hello from PHP!',
        'page_uuid' => uniqid('page_home_', true),
        'server_time' => date('Y-m-d H:i:s'),
        'cookies' => $_COOKIE
    ];
}
?>
