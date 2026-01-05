<?php
function load($params) {
    return [
        'page_uuid' => uniqid('page_form_multipart_', true)
    ];
}

function action_default($params) {
    $note = $params['post']['note'] ?? null;
    $file = $params['files']['file'] ?? null;

    $fileData = null;
    if ($file) {
        $fileData = [
            'name' => $file['name'],
            'size' => $file['size'],
            'type' => $file['type']
        ];
    }

    return [
        'ok' => true,
        'note' => $note,
        'file' => $fileData
    ];
}
?>
