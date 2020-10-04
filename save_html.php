<?php

$uuid_regex = '/^([0-9a-zA-Z]{8})$/';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  exit;
}

if (!isset($_GET['kb']) || preg_match($uuid_regex, $_GET['kb']) !== 1) {
  exit;
}

$data = file_get_contents('php://input');
$fn = "mdcs_html/${_GET['kb']}.html";

$fp = fopen($fn, 'w') or die();
fwrite($fp, $data);
fclose($fp);

echo ($_GET['kb']);

?>
