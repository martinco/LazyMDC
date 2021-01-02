<?php

namespace utils;

function permission_error($section, $message) {
  http_response_code(403);
  error($section, $message);
}

function client_error($section, $message) {
  http_response_code(400);
  error($section, $message);
}

function error($section, $message) {
  json_response(array(
    'section' => $section,
    'message' => $message,
  ));
}

function json_response($data) {
  header('Content-Type: application/json');
  print(json_encode($data, JSON_PRETTY_PRINT));
  print("\n");
  exit;
}

?>
