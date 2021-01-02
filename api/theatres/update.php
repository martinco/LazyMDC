<?php

require_once(__DIR__.'/../database/connection.php');
require_once(__DIR__.'/../user.php');
require_once(__DIR__.'/../utils.php');

use database\Connection;

define('ERROR_ROOT', 'theatres/update');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  \utils\client_error(ERROR_ROOT, "invalid request");
}

// Ensure we're allowed to 
$user = user\User::get();
if (!$user) {
  \utils\permission_error(ERROR_ROOT, "You must be logged in to use this endpoint");
}

$user->check_perms(['theatre-create']);

// Ensure data is valid json
$data = file_get_contents('php://input');
$json = json_decode($data, true);

if ($json === null) {
  \utils\client_error(ERROR_ROOT, "invalid json");
}

print_r($json);

// Ensure we have our required paramters
if (!isset($json['data']) || !isset($json['theatre_id'])) {
  \utils\client_error(ERROR_ROOT, "invalid request");
}

// Ensure theatre_id is a number
if (!is_int($json['theatre_id'])) {
  \utils\client_error(ERROR_ROOT, "invalid theatre_id");
}

// Update
$db = Connection::get();
$q = $db->prepare('UPDATE theatres SET data=? WHERE idx=?');

$q->bind_param("si", json_encode($json['data']), $json['theatre_id']);

if (!$q->execute()) {
  \utils\error("user", "Query execution failed: " . $db->error);
}

$q->close();


?>
