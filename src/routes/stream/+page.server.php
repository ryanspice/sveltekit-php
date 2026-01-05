<?php
function load($params) {
    return [
        'step1' => 'init',
        'page_uuid' => uniqid('page_stream_', true),
        'step2' => sk_defer(function() {
            usleep(200000); // 200ms
            return 'delayed';
        })
    ];
}
?>
