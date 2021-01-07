<?php

require_once(__DIR__.'/database/connection.php');
require_once(__DIR__.'/utils.php');

use database\Connection;

define('ERROR_ROOT', 'theatres');

$db = Connection::get();

$r = $db->query(
  'SELECT theatre, display_name, data, overrides '.
  'FROM theatres '.
  'ORDER BY display_name');

$output = array();

while ($data = $r->fetch_assoc()) {

  // Original imported data from DCS
  $root_data = json_decode($data['data'], true);

  // Overrides to that data such as airfield names default bulls etc.
  $overrides = $data['overrides'] ? json_decode($data['overrides']) : array();

  // Merge
  $theatre = array_replace_recursive($root_data, $overrides);

  // Display name
  $theatre['display_name'] =  $data['display_name'];

  $output[$data['theatre']] = $theatre;
}

\utils\json_response($output);

?>
