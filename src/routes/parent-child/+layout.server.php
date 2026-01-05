<?php
function load($params) {
    return [
        'layout_level_1' => 'layout-data-1',
        // Pass 'parent' here to match what +page.svelte expects if we want to simulate inheritance
        'parent' => 'parent-data-from-layout'
    ];
}
?>
