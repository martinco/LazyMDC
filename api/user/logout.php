<?php

require_once(__DIR__.'/../user.php');

define('ERROR_ROOT', 'user/logout');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  \utils\client_error(ERROR_ROOT, "invalid request");
}

session_destroy();

\utils\json_response(array(
  'logout' => true,
));

?>
