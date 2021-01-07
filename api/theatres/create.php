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

// Ensure our parameters are set
if (!isset($json['display_name']) || !isset($json['data']) || !isset($json['data']['theatre'])) {
  \utils\client_error(ERROR_ROOT, "invalid json");
}

// Update
$db = Connection::get();


$q = $db->preparex(
  'INSERT INTO theatres(theatre, display_name, data) VALUES(?, ?, ?)',
  'sss',
  $json['data']['theatre'],
  $json['display_name'],
  json_encode($json['data']));

$q->close();

\utils\json_response(array(
  "success" => "true",
));

?>
