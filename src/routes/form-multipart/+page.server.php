<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function load($params) {
    return [
        'page_uuid' => uniqid('page_form_multipart_', true),
        'uploaded_files' => $_SESSION['uploaded_files'] ?? []
    ];
}

function action_default($params) {
    $note = $params['post']['note'] ?? null;
    $file = $params['files']['file'] ?? null;

    if (!$file || $file['error'] !== UPLOAD_ERR_OK) {
        return sk_fail(400, ['error' => 'No file uploaded or upload error code: ' . ($file['error'] ?? 'unknown')]);
    }

    // Validate size (max 5MB)
    if ($file['size'] > 5 * 1024 * 1024) {
        return sk_fail(400, ['error' => 'File too large (max 5MB)']);
    }

    // Validate type (allow images and text)
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'text/plain', 'application/pdf'];
    if (!in_array($file['type'], $allowedTypes)) {
        return sk_fail(400, ['error' => 'Invalid file type: ' . $file['type']]);
    }

    // Permanent Storage
    // We store in a 'uploads' directory relative to this script
    // In production build, this will be build/form-multipart/uploads
    $uploadDir = __DIR__ . '/uploads';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    // Unique naming
    $uniqueName = uniqid('upload_', true) . '.' . $ext;
    $destination = $uploadDir . '/' . $uniqueName;

    if (!move_uploaded_file($file['tmp_name'], $destination)) {
        return sk_fail(500, ['error' => 'Failed to move uploaded file']);
    }

    // Session Storage (Track uploads)
    if (!isset($_SESSION['uploaded_files'])) {
        $_SESSION['uploaded_files'] = [];
    }

    $fileData = [
        'id' => uniqid(),
        'original_name' => $file['name'],
        'stored_name' => $uniqueName,
        'size' => $file['size'],
        'type' => $file['type'],
        'uploaded_at' => time()
    ];

    $_SESSION['uploaded_files'][] = $fileData;

    return [
        'type' => 'success',
        'data' => [
            'success' => true,
            'note' => $note,
            'file' => $fileData,
            'message' => 'File uploaded successfully'
        ]
    ];
}
?>
