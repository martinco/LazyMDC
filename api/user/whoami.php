<?php

require_once(__DIR__.'/../session.php');
require_once(__DIR__.'/../user.php');
require_once(__DIR__.'/../utils.php');

$user = user\User::get();

if (!$user) {
  \utils\json_response(array(
    'username' => null,
  ));
}

$data = array(
  'username' => $user->username,
);

if ($user->password_reset) {
  $data['password_reset'] = true;
  $data['permissions'] = $user->permissions;
}


\utils\json_response($data);

?>
