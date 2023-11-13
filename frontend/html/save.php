<?php

function generateID() {
  $characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  $string = '';
  $max = strlen($characters) - 1;
  for ($i = 0; $i < 8; $i++) {
    $string .= $characters[mt_rand(0, $max)];
  }
  return $string;
}

$uuid_regex = '/^([0-9a-zA-Z]{8})$/';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  exit;
}

$data = file_get_contents('php://input');

$json = json_decode($data, true);
if (isset($json['key']) && preg_match($uuid_regex, $json['key']) === 1) {
  $id = $json['key'];
  $fn = "mdcs/{$id}.json";
} else {
  while (true) {
    $id = generateID();
    $fn = "mdcs/{$id}.json";
    if (!file_exists($fn)) {
      break;
    }
  }
}

$fp = fopen($fn, 'w') or die();
fwrite($fp, json_encode($json, JSON_PRETTY_PRINT));
fclose($fp);

echo $id;
