<?php
function load($params) {
    $base = defined('SK_BASE_PATH') ? SK_BASE_PATH : '';
    header("Location: $base/ssr-data?redirected_from=$base/redirect-me&message=Redirect+Success", true, 302);
    exit;
}
?>
