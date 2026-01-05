<?php
function load($params) {
    // Simulate slow DB call
    // usleep(500000); // 0.5s delay (Note: PHP sleeps stop the thread, might block if server is single threaded or has limit. Safe for test.)
    // Actually, let's not sleep in actual code unless needed, as it slows down build/prerender if called there.
    // Prerender calls load().
    // We only want to sleep if it's a runtime request.
    // The adapter might run this during build?
    // Yes, 'prerender' runs load.
    // So sleeping here will slow down build.
    // Let's just return large data.

    return [
        'heavy_data' => str_repeat('x', 1000),
        'timestamp' => time(),
        'page_uuid' => uniqid('page_preload_', true)
    ];
}
?>
