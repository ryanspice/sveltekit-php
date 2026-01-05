<?php
function load($params) {
    $code = $params['url']->searchParams->code ?? 200;
    http_response_code((int)$code);
    return [
        'status' => $code,
        'page_uuid' => uniqid('page_status_', true)
    ];
}
?>
