<?php

  /*********************************************
   * Change this line to set the upload folder *
   *********************************************/
  $imageFolder = "mdc_images/";

  if (isset($_SERVER['HTTP_ORIGIN'])) {

    // If our server_name matches our origin, we're good for this use case
    // to prevent Cross site requests

    $origin_host = parse_url($_SERVER['HTTP_ORIGIN'], PHP_URL_HOST);
		error_log($origin_host . ' -> ' . $_SERVER['HTTP_HOST']);
    if ($origin_host == $_SERVER['HTTP_HOST']) {
      header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
    } else {
      header("HTTP/1.1 403 Origin Denied");
      return;
    }
  }

  // Don't attempt to process the upload on an OPTIONS request
  if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    header("Access-Control-Allow-Methods: POST, OPTIONS");
    return;
  }

  reset ($_FILES);
  $temp = current($_FILES);
  if (is_uploaded_file($temp['tmp_name'])){
    /*
      If your script needs to receive cookies, set images_upload_credentials : true in
      the configuration and enable the following two headers.
    */
    // header('Access-Control-Allow-Credentials: true');
    // header('P3P: CP="There is no P3P policy."');

    // Sanitize input
    if (preg_match("/([^\w\s\d\-_~,;:\[\]\(\).])|([\.]{2,})/", $temp['name'])) {
        header("HTTP/1.1 400 Invalid file name.");
        return;
    }

    // Verify extension
    $extension = strtolower(pathinfo($temp['name'], PATHINFO_EXTENSION));
    if (!in_array($extension, array("jpeg", "jpg", "png", "bmp"))) {
        header("HTTP/1.1 400 Invalid extension.");
        return;
    }

    // Instead of doing uniqid(), just do checksum so the same file multiple times
    // doesn't increase space usage
    $file_sha1 = sha1_file($temp['tmp_name']);

    // Accept upload if there was no origin, or if it is an accepted origin
    $filetowrite = $imageFolder . $file_sha1 . "." . $extension;
    move_uploaded_file($temp['tmp_name'], $filetowrite);

    // Respond to the successful upload with JSON.
    // Use a location key to specify the path to the saved image resource.
    // { location : '/your/uploaded/image/file'}
    echo json_encode(array('location' => '/'.$filetowrite));
  } else {
    // Notify editor that the upload failed
    header("HTTP/1.1 500 Server Error");
  }
?>
