<?php
function load($params) {
    return [
        'page_uuid' => uniqid('page_form_basic_', true)
    ];
}

function action_default($params) {
    $val = $params['post']['val'] ?? '';
    if ($val === 'fail') {
        return sk_fail(400, ['error' => 'invalid']);
    }
    return ['success' => true, 'echo' => $val];
}
?>
