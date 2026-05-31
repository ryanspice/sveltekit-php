<?php

function load($params) {
    return [
        'page_uuid' => uniqid('page_actions_multipart_', true)
    ];
}

function action_default($params) {
    $post = $params['post'] ?? [];
    $files = $params['files'] ?? [];
    $title = trim((string)($post['title'] ?? ''));
    $description = trim((string)($post['description'] ?? ''));
    $agree = isset($post['agree']);
    $file = $files['file'] ?? null;

    if ($title === '' || $description === '' || !$agree || !$file) {
        return sk_fail(400, [
            'success' => false,
            'error' => 'All fields are required',
            'title' => $title,
            'description' => $description
        ]);
    }

    if (!is_array($file) || ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        return sk_fail(400, [
            'success' => false,
            'error' => 'Invalid file upload',
            'title' => $title,
            'description' => $description
        ]);
    }

    if (($file['size'] ?? 0) > 10 * 1024 * 1024) {
        return sk_fail(400, [
            'success' => false,
            'error' => 'File size exceeds 10MB limit',
            'title' => $title,
            'description' => $description
        ]);
    }

    $allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'text/plain'
    ];

    $fileType = (string)($file['type'] ?? '');
    if (!in_array($fileType, $allowedTypes, true)) {
        return sk_fail(400, [
            'success' => false,
            'error' => 'File type not allowed. Allowed types: JPG, PNG, GIF, WebP, PDF, TXT',
            'title' => $title,
            'description' => $description
        ]);
    }

    return [
        'type' => 'success',
        'data' => [
            'success' => true,
            'uploadedFile' => [
                'name' => (string)($file['name'] ?? ''),
                'size' => (int)($file['size'] ?? 0),
                'type' => $fileType
            ],
            'title' => $title,
            'description' => $description,
            'uploadedAt' => gmdate('c')
        ]
    ];
}

?>
