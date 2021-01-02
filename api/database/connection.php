<?php

namespace database;

require_once __DIR__."/../utils.php";

class Connection {

  protected static $conn;

  static function get() {
    if (self::$conn) {
      return self::$conn;
    }

    $conn = new \mysqli(
      isset($_SERVER['DB_HOST'])? $_SERVER['DB_HOST'] : "localhost",
      $_SERVER['DB_USER'],
      $_SERVER['DB_PASS'],
      $_SERVER['DB_NAME']);

    if ($conn->connect_error) {
      \utils\error("database", $conn->connect_error);
    }

    // Set TZ
    $conn->query('SET time_zone = "+00:00"');

    self::$conn = $conn;
    return self::$conn;
  }

}

?>
