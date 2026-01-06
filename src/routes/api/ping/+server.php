<?php
function GET($event) {
  return [
    'status' => 200,
    'headers' => [
      'content-type' => 'application/json; charset=utf-8',
      'cache-control' => 'no-store'
    ],
    'body' => json_encode([ 'ok' => true, 'ts' => time() ])
  ];
}
?>
