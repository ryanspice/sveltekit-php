<?php

function load($params) {
    return [
        'page_uuid' => uniqid('page_actions_named_', true)
    ];
}

function action_process($params) {
    $post = $params['post'] ?? [];
    $data = trim((string)($post['data'] ?? ''));
    $options = (string)($post['options'] ?? 'default');

    if ($data === '') {
        return sk_fail(400, [
            'success' => false,
            'action' => 'process',
            'message' => 'Data input is required'
        ]);
    }

    return [
        'type' => 'success',
        'data' => [
            'success' => true,
            'action' => 'process',
            'message' => 'Data processed successfully',
            'data' => [
                'input' => $data,
                'options' => $options,
                'processedAt' => gmdate('c'),
                'length' => strlen($data)
            ]
        ]
    ];
}

function action_validate($params) {
    $post = $params['post'] ?? [];
    $data = trim((string)($post['data'] ?? ''));
    $options = (string)($post['options'] ?? 'default');

    return [
        'type' => 'success',
        'data' => [
            'success' => $data !== '',
            'action' => 'validate',
            'message' => $data !== '' ? 'Data is valid' : 'Data input is required',
            'data' => [
                'valid' => $data !== '',
                'options' => $options,
                'length' => strlen($data)
            ]
        ]
    ];
}

function action_save($params) {
    $post = $params['post'] ?? [];
    $data = trim((string)($post['data'] ?? ''));
    $options = (string)($post['options'] ?? 'default');

    if ($data === '') {
        return sk_fail(400, [
            'success' => false,
            'action' => 'save',
            'message' => 'Data input is required'
        ]);
    }

    return [
        'type' => 'success',
        'data' => [
            'success' => true,
            'action' => 'save',
            'message' => 'Data saved successfully',
            'data' => [
                'id' => uniqid('saved_', true),
                'options' => $options,
                'savedAt' => gmdate('c')
            ]
        ]
    ];
}

?>
