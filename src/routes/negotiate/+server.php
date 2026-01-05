<?php
function GET($params) {
    return [
        'body' => ['message' => 'Negotiated API'],
        'headers' => ['Content-Type' => 'application/json']
    ];
}
?>
