<?php

require_once(__DIR__.'/../user.php');
require_once(__DIR__.'/../utils.php');

use Database\Connection;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  \utils\client_error("user/login", "invalid request");
}

// Ensure we're allowed to 

$user = user\User::get();
if (!$user) {
  \utils\permission_error("squadrons/cretae", "You must be logged in to use this endpoint");
}

$user->check_perms(['squadrons-create'], 'squadrons/create');

// Ensure we have our required paramters
if (!isset($_POST['name'])  ) {
  \utils\client_error("squadrons/create", "invalid request");
}

if (!preg_match('/^[a-z0-9_ -]{4,}$/i', $_POST['name'])) {
  \utils\json_response(array(
    'success' => false,
    'message' => 'Invalid squadron name, must be at least 4 alpha numeric characters',
  ));
}

// Make sure it's not spaces
$name = trim($_POST['name']);
if (!$name) {
  \utils\json_response(array(
    'success' => false,
    'message' => 'Please enter a non-empty squadron name',
  ));
}

$url = isset($_POST['url']) ? filter_var($_POST['url'], FILTER_VALIDATE_URL) : null;

$db = Connection::get();
$q = $db->prepare('INSERT INTO squadrons(name, url) VALUES(?, ?)');
if (!$q) {
  \utils\error("user", "Query preparation failed: " . $db->error);
}

$q->bind_param("ss", $name, $url ? $url : null);
if(!$q->execute()) {
  // Duplicate key
  if ($db->errno == 1062)  {
    \utils\error('squadrons/create', 'Failed to create squadron, a squadron with that name already exists');
  }
  \utils\error("squadrons/create", "Failed to create squadron: " . $db->error . '  ' . $db->errno);
}

\utils\json_response(array(
  'success' => true,
));



?>
