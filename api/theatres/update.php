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

// Ensure we have our required paramters
if ( !isset($json['theatre_id']) || (!isset($json['base']) && !isset($json['overrides'])) ) {
  \utils\client_error(ERROR_ROOT, "invalid request");
}

// Ensure theatre_id is a number
if (!is_int($json['theatre_id'])) {
  \utils\client_error(ERROR_ROOT, "invalid theatre_id");
}

// Update

$query = 'UPDATE theatres SET ';
$args_refs = [];
$args = [""];
$sets = [];

if (isset($json['base'])) {
  $sets[] = 'data=?';

  $next = sizeof($args);

  // Order based on airfield when we save it 
  ksort($json['base']);
  $args[$next] = json_encode($json['base']);

  $args[0] .= "s";
  $args_refs[] = &$args[$next];
}

if (isset($json['overrides'])) {
  $sets[] = 'overrides=?';

  $next = sizeof($args);
  $args[$next] = json_encode($json['overrides']);

  $args[0] .= "s";
  $args_refs[] = &$args[$next];
}

if (isset($json['display_name'])) {
  $sets[] = 'display_name=?';

  $next = sizeof($args);
  $args[$next] = $json['display_name'];

  $args[0] .= "s";
  $args_refs[] = &$args[$next];
}

$query .= join(',', $sets) . ' WHERE idx=?';

$next = sizeof($args);
$args[$next] = $json['theatre_id'];
$args[0] .= "i";
$args_refs[] = &$args[$next];

$db = Connection::get();
$q = $db->prepare($query);
call_user_func_array(array($q, 'bind_param'), $args);

if (!$q->execute()) {
  \utils\error("user", "Query execution failed: " . $db->error);
}

$q->close();

\utils\json_response(array(
  "success" => "true",
));


?>
