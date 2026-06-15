<?php
function form_basic_result($params) {
    $val = $params['post']['val'] ?? '';
    if ($val === 'fail') {
        return sk_fail(400, ['error' => 'invalid']);
    }
    return [
        'type' => 'success',
        'data' => ['success' => true, 'echo' => $val]
    ];
}

function load($params) {
    return [
        'page_uuid' => uniqid('page_form_basic_', true)
    ];
}

function action_default($params) {
    return form_basic_result($params);
}

function action_echo($params) {
    return form_basic_result($params);
}
?>
