<?php

require_once(__DIR__.'/database/connection.php');
require_once(__DIR__.'/utils.php');

use database\Connection;

define('ERROR_ROOT', 'theatres');

$db = Connection::get();

$merged = !isset($_GET['merged']) || $_GET['merged'] == 1;

$r = $db->query(
  'SELECT idx, theatre, display_name, data, overrides '.
  'FROM theatres '.
  'ORDER BY display_name');

$output = array();

while ($data = $r->fetch_assoc()) {

  // Original imported data from DCS
  $root_data = json_decode($data['data'], true);

  // Sort our airfields
  ksort($root_data['airfields']);

  // Overrides to that data such as airfield names default bulls etc.
  $overrides = $data['overrides'] ? json_decode($data['overrides'], true) : array();

  // Merge
  if($merged) {
    $theatre = array_replace_recursive($root_data, $overrides);
  } else {
    $theatre = array(
      'base' => $root_data,
      'overrides' => $overrides,
    );
  }

  // Display name
  $theatre['display_name'] =  $data['display_name'];
  $theatre['id'] = $data['idx'];

  $output[$data['theatre']] = $theatre;
}

\utils\json_response($output);

?>
