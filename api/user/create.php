<?php

require_once(__DIR__.'/../user.php');
require_once(__DIR__.'/../utils.php');

define('ERROR_ROOT', 'user/create');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  \utils\client_error(ERROR_ROOT, "invalid request");
}

// Ensure we're allowed to 

$user = user\User::get();
if (!$user) {
  \utils\permission_error("user/cretae", "You must be logged in to use this endpoint");
}

$user->check_perms(['users-create']);

// Ensure we have our required paramters
if (!isset($_POST['username'])) {
  \utils\client_error(ERROR_ROOT, "invalid request");
}

if (!preg_match('/^[a-z0-9_-]{4,}$/i', $_POST['username'])) {
  \utils\json_response(array(
    'success' => false,
    'message' => 'Invalid username, must be at least 4 alpha numeric characters',
  ));
}

$user->create($_POST['username']);



?>
