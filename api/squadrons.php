<?php

namespace squadrons;

include __DIR__."/database/connection.php";
include __DIR__."/user.php";

use database\Connection;
use user\User;

$db = Connection::get();


// If we're logged in 
$user = User::get();

if ($user) {
  $query =  'SELECT s.idx, s.name, s.url, IFNULL(u.idx, false) as editable '.
            'FROM squadrons s '.
            'LEFT JOIN squadron_perms sp '.
              'ON sp.squadron_id = s.idx '.
            'LEFT JOIN users u '.
              'ON sp.user_id = u.idx '.
              'AND u.idx = '.(int)$user->idx.' '.
            'ORDER BY s.name != "None", s.name ';
} else {
  $query = <<<EOT
    SELECT idx, name, url
    FROM squadrons
    WHERE active = 1
    ORDER BY name != "None", name
EOT;
}


$output = array();

if (!($res = $db->query($query))) {
  \utils\error("user", "Query execution failed: " . $db->error);
}

while ($row = $res->fetch_assoc()) {

  // process editable into a bool
  if(isset($row['editable'])) {
    $row['editable'] = $row['editable'] === "1";
  }

  array_push($output, $row);
}

$res->close();

header('Content-Type: application/json');
print(json_encode($output, JSON_PRETTY_PRINT));

$db->close();

?>
