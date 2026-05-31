<?php
$full_path = "test.js";
$ext = pathinfo($full_path, PATHINFO_EXTENSION);
switch ($ext) {
    case 'js': $mime = 'application/javascript'; break;
    default: $mime = 'application/octet-stream'; break;
}
echo $mime;
