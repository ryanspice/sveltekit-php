<?php
function POST($params) {
    $body = $params['request']->body;
    return [
        'body' => ['echo' => $body],
        'headers' => ['Content-Type' => 'application/json']
    ];
}
?>
