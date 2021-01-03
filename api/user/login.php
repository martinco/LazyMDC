<?php

require_once(__DIR__.'/../user.php');

define('ERROR_ROOT', 'user/login');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  \utils\client_error(ERROR_ROOT, "invalid request");
}

// Ensure data is valid json
$json = json_decode(file_get_contents('php://input'), true);
if ($json === null) {
  \utils\client_error(ERROR_ROOT, "invalid json");
}

// Ensure we have our required paramters
if (!isset($json['username']) || !isset($json['password'])) {
  \utils\client_error(ERROR_ROOT, "invalid request");
}

$user = user\User::login($json['username'], $json['password']);

\utils\json_response(array(
  'success' => true,
  'reset'   => $user->password_reset,
  'username' => $user->username,
  'permissions' => $user->permissions,
));


?>
