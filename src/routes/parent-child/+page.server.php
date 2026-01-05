<?php
function load($params) {
    return [
        'child' => 'child-data',
        'page_uuid' => uniqid('page_parent_child_', true)
    ];
}
?>
