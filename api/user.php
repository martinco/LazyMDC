<?php

namespace user;

require_once __DIR__."/database/connection.php";
require_once __DIR__."/session.php";
require_once __DIR__."/utils.php";

use database\Connection;


if (!function_exists('hash_pbkdf2')) {
  function hash_pbkdf2($algo, $password, $salt, $count, $length = 0, $raw_output = false) {
    if (!in_array(strtolower($algo), hash_algos()))
      trigger_error(__FUNCTION__ . '(): Unknown hashing algorithm: ' . $algo, E_USER_WARNING);
    if (!is_numeric($count))
      trigger_error(__FUNCTION__ . '(): expects parameter 4 to be long, ' . gettype($count) . ' given', E_USER_WARNING);
    if (!is_numeric($length))
      trigger_error(__FUNCTION__ . '(): expects parameter 5 to be long, ' . gettype($length) . ' given', E_USER_WARNING);
    if ($count <= 0)
      trigger_error(__FUNCTION__ . '(): Iterations must be a positive integer: ' . $count, E_USER_WARNING);
    if ($length < 0)
      trigger_error(__FUNCTION__ . '(): Length must be greater than or equal to 0: ' . $length, E_USER_WARNING);

    $output = '';
    $block_count = $length ? ceil($length / strlen(hash($algo, '', $raw_output))) : 1;
    for ($i = 1; $i <= $block_count; $i++) {
        $last = $xorsum = hash_hmac($algo, $salt . pack('N', $i), $password, true);
        for ($j = 1; $j < $count; $j++) {
            $xorsum ^= ($last = hash_hmac($algo, $last, $password, true));
        }
        $output .= $xorsum;
    }

    if (!$raw_output) $output = bin2hex($output);
    return $length ? substr($output, 0, $length) : $output;
  }
}

class User {

  static function get() {
    // Get's the logged in user
    if (!isset($_SESSION['idx'])) return null;
    return new User($_SESSION['idx'], $_SESSION['username']);
  }

  static function login($user, $pass) {
    // Find user
    $db = Connection::get();

    $q = $db->prepare('SELECT idx, salt, iter, password, password_reset FROM users where username=?');
    if (!$q) {
      \utils\error("user", "Query preparation failed: " . $db->error);
    }

    $q->bind_param("s", $user);
    if (!$q->execute()) {
      \utils\error("user", "Query execution failed: " . $db->error);
    }

    $q->bind_result($idx, $salt, $iter, $db_hash, $password_reset);


    if ($data = $q->fetch()) {

      // move salt back to binary
      $salt = hex2bin($salt);

      $hash = hash_pbkdf2("sha256", $pass, $salt, $iter, 0);

      $perms = array();

      if ($hash === $db_hash) {

        $q->close();
        
        // login success, load perms
        $pq = $db->preparex(
          'SELECT p.name '.
          'FROM user_permissions up '.
          'JOIN permissions p '.
            'ON up.permission_id = p.idx '.
          'JOIN users u '.
            'ON up.user_id = u.idx '.
            'WHERE u.idx = ?',
          "i", $idx);

        $pq->bind_result($perm);

        while ($pq->fetch()) {
          array_push($perms, $perm);
        }

        $password_reset = $password_reset == 1;
        
        \session\regenerate_id();
        $_SESSION['idx'] = $idx;
        $_SESSION['username'] = $user;
        $_SESSION['password_reset'] = $password_reset;
        $_SESSION['permissions'] = $perms;
        session_commit();

        return new User();
      }
    }

    \utils\json_response(array(
      "success" => false,
      "message" => "Invalid username or password",
    ));

  }

  static function generate_password($len = 8) {

    $sets = array(
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      'abcdefghijklmnopqrstuvwxyz',
      '0123456789',
      '!"#$%&\'()*+,-./:;<=>?@[\]^_`{|}~',
    );

    // Remaining sets we must pick from, and the next set to pick
    $sets_remain = sizeof($sets);
    $sets_pick = 0;

    // We shuffle so we can always pick the first item and it wont be the same
    shuffle($sets);

    // default selector
    $all_chars = implode($sets);
    $all_chars_l = strlen($all_chars);

    // Array so we can just append to it  more easily
    $pass = array();

    for ($i = $len; $i > 0; $i--) {
      $rand = mt_rand(0,1000) / 1000;
      if ($rand <= ($sets_remain / $i)) {
        $pass[] = $sets[$sets_pick][mt_rand(0, strlen($sets[$sets_pick])-1)]; 
        --$sets_remain;
        ++$sets_pick;
      } else {
        $pass[] = $all_chars[mt_rand(0, $all_chars_l-1)];
      }
    }

    // And implode
    return implode($pass);
  }

  function __construct() {
    $this->idx = $_SESSION['idx'];
    $this->password_reset = $_SESSION['password_reset'];
    $this->username = $_SESSION['username'];
    $this->permissions = $_SESSION['permissions'];
  }

  function check_perms($perms, $section = 'user') {

    if (!$perms) return false;
    if (is_string($perms)) $perms = array($perms);
    if (!is_array($perms)) return false;

    // Filter any non-string arguments from array and fail
    $filtered = array_filter($perms, function($x) { return is_string($x); });
    if ($filtered != $perms) return false;

    // Dedupe
    $perms = array_unique($perms);

    // Make sure they intesect 
    $intersect = array_intersect($perms, $this->permissions);

    if (sizeof($intersect) == sizeof($perms)) {
      return true;
    }

    \utils\permission_error($section, "You do not have the required permissions");
  }

  function create($user) {

    $this->check_perms('users-create');

    // Returns password of created user, or error
    $db = Connection::get();

    // Check we have access
    $q = $db->prepare('SELECT 1 FROM users where username=?');
    if (!$q) {
      \utils\error("user", "Query preparation failed: " . $db->error);
    }

    $q->bind_param("s", $user);
    if (!$q->execute()) {
      \utils\error("user", "Query execution failed: " . $db->error);
    }
    $q->store_result();

    if ($q->num_rows) {
      \utils\error("user", "The user already exists");
    }

    $pass = self::generate_password();
    $salt = openssl_random_pseudo_bytes(16);
    $iter = 1000;

    $hash = hash_pbkdf2("sha256", $pass, $salt, $iter, 0);

    // Add the user

    // Reset Statement to avoid overwriting error
    $q = false;
    $q = $db->prepare('INSERT INTO users(username, salt, iter, password) VALUES(?, ?, ?, ?)');
    if (!$q) {
      \utils\error("user", "Query preparation failed: " . $db->error);
    }

    $q->bind_param("ssis", $user, bin2hex($salt), $iter, $hash);

    if(!$q->execute()) {
      \utils\error("user", "Failed to create user: " . $db->error);
    }

    \utils\json_response(array(
      'success' => true,
      'user'    => $user,
      'pass'    => $pass,
    ));
  }
}

#header("Content-Type: text/plain");
#User::create("MartinCo");
#User::login("MartinCo", "]v+1G35s");
