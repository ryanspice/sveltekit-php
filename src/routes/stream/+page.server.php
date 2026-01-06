<?php
function load($params) {
    return [
        'step1' => 'init',
        'page_uuid' => uniqid('page_stream_', true),
        'step2' => sk_defer(function() {
            usleep(800000); // 800ms
            return 'delayed';
        })
    ];
}
?>
