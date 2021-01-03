<?php

namespace database;

require_once __DIR__."/../utils.php";

class Connection {

  protected static $inst;
  private $conn;

  static function get() {
    if (self::$inst) {
      return self::$inst;
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

    self::$inst = new Connection($conn);
    return self::$inst;
  }

  public function __construct($conn) {
    $this->conn = $conn;
  }

  public function __call($method, $args) {
    return call_user_func_array(array($this->conn, $method), $args);
  }

  public function __get($param) {
    return $this->conn->$param;
  }

  // Overloaded for parguments
  public function preparex($query, $param_fmt, $params) {


    $q = $this->prepare($query);
    if (!$q) {
      \utils\error("user", "Query preparation failed: " . $this->conn->error);
    }

    $args = array_splice(func_get_args(), 1);

    // Migrate to references
    $args_refs = array();
    foreach($args as &$a) {
      $args_refs[] = &$a;
    }

    call_user_func_array(array($q, 'bind_param'), $args_refs);
    if (!$q->execute()) {
      \utils\error("user", "Query execution failed: " . $this->conn->error);
    }

    return $q;

  }

}

?>
