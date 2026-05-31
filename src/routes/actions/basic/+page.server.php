<?php

function load($params) {
    return [
        'page_uuid' => uniqid('page_actions_basic_', true)
    ];
}

function action_default($params) {
    return action_process($params);
}

function action_process($params) {
    $post = $params['post'] ?? [];
    $name = trim((string)($post['name'] ?? ''));
    $email = strtolower(trim((string)($post['email'] ?? '')));
    $message = trim((string)($post['message'] ?? ''));

    if ($name === '' || $email === '' || $message === '') {
        return sk_fail(400, [
            'success' => false,
            'message' => 'All fields are required'
        ]);
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return sk_fail(400, [
            'success' => false,
            'message' => 'Email must be valid'
        ]);
    }

    return [
        'type' => 'success',
        'data' => [
            'success' => true,
            'data' => [
                'name' => $name,
                'email' => $email,
                'message' => $message,
                'processedAt' => gmdate('c'),
                'messageLength' => strlen($message)
            ]
        ]
    ];
}

?>
