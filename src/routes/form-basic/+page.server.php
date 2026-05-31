<?php
function sk_form_basic_page_server_load($params) {
    return [
        'page_uuid' => uniqid('page_form_basic_', true)
    ];
}

function sk_form_basic_page_server_action_default($params) {
    $val = $params['post']['val'] ?? '';
    if ($val === 'fail') {
        return sk_fail(400, ['error' => 'invalid']);
    }
    return [
        'type' => 'success',
        'data' => ['success' => true, 'echo' => $val]
    ];
}

function sk_form_basic_page_server_action_echo($params) {
    return sk_form_basic_page_server_action_default($params);
}
?>
