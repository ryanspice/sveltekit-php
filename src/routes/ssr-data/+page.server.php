<?php
function load($params) {
    return [
        'message' => 'hello-from-server',
        'page_uuid' => uniqid('page_ssr_', true)
    ];
}
?>
