<?php

namespace session;

function start() {
  session_start();
}

function regenerate_id() {
  session_regenerate_id();
}


date_default_timezone_set('UTC');
start();

?>
