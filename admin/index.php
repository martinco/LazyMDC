<!DOCTYPE html>
<html>
  <head>
    <title>Data Card Builder v2</title>

    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css" integrity="sha384-Vkoo8x4CGsO3+Hhxv8T/Q5PaXtkKtu6ug5TOeNV6gBiFeWPGFN9MuhOf23Q9Ifjh" crossorigin="anonymous">
    <link rel="stylesheet" href="https://code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css"   crossorigin="anonymous">

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-contextmenu/2.7.1/jquery.contextMenu.min.css"   crossorigin="anonymous">

    <link rel="stylesheet" href="../index.css">

    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/file-icon-vectors@1.0.0/dist/file-icon-classic.min.css">

    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/overhang@1.0.8/dist/overhang.min.css">

    <style type="text/css">
      body {
        margin: 0px;
      }
      #loader-container {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        width:100%;
        height: 100%;
        background: #ffffff;
        z-index: 999;
      }

      #loader {
        position: absolute;
        left: 50%;
        top: 50%;
        z-index: 1;
        margin: -30px 0 0 -30px;
        -webkit-animation: spin 2s linear infinite;
        animation: spin 2s linear infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
    <script>
      <?php
        $kneeboard_root=dirname($_SERVER['SCRIPT_NAME']);
        if (substr($kneeboard_root, -1) != '/') {
          $kneeboard_root .= '/';
        }
        echo('kneeboard_root="' . $kneeboard_root . '"' . "\n");
      ?>
    </script>
  </head>
  <body>
    <div id="loader-container">
      <div id="loader">
        <img src="../img/loader.svg" style="width:30px; height:30px"></img>
      </div>
    </div>

    <div id="main-page" style="width: 1050px; margin: 0 auto; min-height: 100%; display: flex">
      <div style="position: absolute; margin: 0 auto; top:0px; height:48px; width:1050px; border-bottom: 1px solid #00bdbd; background: #444">
        <?php if ($kneeboard_root != '/') { ?>
        <div style="padding-left: 215px; color:#ff0000; padding-top: .75rem; font-size:1rem; float:left">
          Development Build, use <a style="color: #ff0000" href="https://dcs-mdc.com">https://dcs-mdc.com</a>
        </div>
        <?php } ?>

        <!-- user menu -->
        <div id="header-user-container" style="display: none">
          <div style="float: right; color:#ff0000; padding-top: 5px; padding-right:5px; font-size:1rem;">
            <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" data-display="static" aria-haspopup="true" aria-expanded="false">
              <div style="position:relative; top: -2px" data-feather="user"></div>
              <span id="header-user-name"></span>
            </button>
            <div class="dropdown-menu dropdown-menu-right" aria-labelledby="dropdownMenuButton" style="top:45px; text-align: right" >
              <a class="dropdown-item" href="#profile" style="padding-right: 15px">
                Profile
                <span data-feather="activity" style="margin-left:5px"></span>
              </a>
              <a class="dropdown-item" onClick="do_logout()" style="padding-right: 15px">
                Logout
                <span data-feather="log-out" style="margin-left:5px"></span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <nav id='side-bar' class="bg-light sidebar col-fixed" style="min-height: 100%; border-left: 1px solid #dfdfdf; width:200px;">

        <div style="padding-left: .75rem; padding-top: .75rem; font-size:1rem; height:48px; border-bottom: 1px solid #bdbdbd; background-color: #222; color: #fff">Data Card Builder v2</div>

        <div id="sidebar" class="" style="padding-top: 10px">
          <ul class="nav flex-column show" id="side-nav">
            <li class="nav-item">
              <a class="nav-link active" href="#login">
                <span data-feather="log-in"></span>
                Log In
              </a>
            </li>
          </ul>
        </div>

        <div style="top:auto; bottom: 10px; position:fixed">
          <ul class="nav flex-column show">
            <li class="nav-item">
              <a class="nav-link" href="#about">
                <span data-feather="at-sign"></span>
                About<span class="sr-only"></span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link direct-link" href="https://github.com/MartinCo/LazyMDC/issues">
                <span data-feather="github"></span>
                Github Issues
              </a>
            </li>
          </ul>
        </div>
      </nav>

      <!-- Main Page -->
      <div class="tab-content" style="float: left; width:850px; min-height: 100%; padding: 15px; border-right:1px solid #dfdfdf; padding-top:58px">
        <?php
        readfile('pages/login.html');
        readfile('pages/theatres.html');
        readfile('pages/squadrons.html');
        readfile('../modals/coords.html');
        ?>
        </div>
      </div>

    </div> <!-- /content -->

    <!-- modals -->
    <div id="modal-container">
    </div>


    <script src="https://code.jquery.com/jquery-3.5.1.min.js" integrity="sha256-9/aliU8dGd2tb6OSsuzixeV4y/faTqgFtohetphbbj0=" crossorigin="anonymous"></script>
    <script src="https://code.jquery.com/ui/1.12.1/jquery-ui.min.js" integrity="sha256-VazP97ZCwtekAsvgPBSUwPFKdrwD3unUfSGVYrahUqU=" crossorigin="anonymous"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.7/umd/popper.min.js" integrity="sha384-UO2eT0CpHqdSJQ6hJty5KVphtPhzWj9WO1clHTMGa3JDZwrnQq4sF86dIHNDz0W1" crossorigin="anonymous"></script>
    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js" integrity="sha384-JjSmVgyd0p3pXB1rRibZUAYoIIy6OrQ6VrjIEaFf/nJGzIxFDsf4x0xIM+B07jRM" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/geographiclib@1.50.0/geographiclib.min.js" integrity="sha256-P4IU60oavmLHtspWrVYYoXkXGeeuIerQZFj33Q0FeTw=" crossorigin="anonymous"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-contextmenu/2.9.2/jquery.contextMenu.min.js" integrity="sha512-kvg/Lknti7OoAw0GqMBP8B+7cGHvp4M9O9V6nAYG91FZVDMW3Xkkq5qrdMhrXiawahqU7IZ5CNsY/wWy1PpGTQ==" crossorigin="anonymous"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-contextmenu/2.9.2/jquery.ui.position.min.js" integrity="sha512-878jmOO2JNhN+hi1+jVWRBv1yNB7sVFanp2gA1bG++XFKNj4camtC1IyNi/VQEhM2tIbne9tpXD4xaPC4i4Wtg==" crossorigin="anonymous"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jQuery.serializeObject/2.0.3/jquery.serializeObject.min.js" integrity="sha512-DNziaT2gAUenXiDHdhNj6bfk1Ivv72gpxOeMT+kFKXB2xG/ZRtGhW2lDJI9a+ZNCOas/rp4XAnvnjtGeMHRNyg==" crossorigin="anonymous"></script>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/tinymce/5.4.1/tinymce.min.js" integrity="sha512-c46AnRoKXNp7Sux2K56XDjljfI5Om/v1DvPt7iRaOEPU5X+KZt8cxzN3fFzemYC6WCZRhmpSlZvPA1pttfO9DQ==" crossorigin="anonymous"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/tinymce/5.4.1/plugins/table/plugin.min.js" integrity="sha512-uWF3FdNoBLruuobSz5+lT9MoLy3tAVgU4HCUoTEH8E0E63u4H/Y5Se1zPRX00b7p9pnlD79TlkpH4aHakqU7Tw==" crossorigin="anonymous"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/tinymce/5.4.1/plugins/image/plugin.min.js" integrity="sha512-jL/iLWqJMXq++2K/l0gLiUc9fGJg4w17wN/X++PEb18kcN+CQ20iwvcLhIUhvobII9m1cJOkiueyEHgMv3QF6g==" crossorigin="anonymous"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/tinymce/5.4.1/plugins/pagebreak/plugin.min.js" integrity="sha512-+8DNV1EQCNTeC8wKjeAgzqqUoewZlHASoKkgX7yU+wC2qpRVdpZKTLeB/ds1RALiG8a1yDTsyvAxIKBvmnw5aQ==" crossorigin="anonymous"></script>

    <script src="https://cdn.jsdelivr.net/npm/overhang@1.0.8/dist/overhang.min.js" integrity="sha256-Ug34+8hEyLcZRNUefnDM6H4ijzC7Tdf8eWGuTxXIseU=" crossorigin="anonymous"></script>

    <script type="text/javascript" src="../js/zip-js/zip.js"></script>

    <!-- Icons -->
    <script src="https://cdn.jsdelivr.net/npm/feather-icons/dist/feather.min.js"></script>

    <!-- Init -->
    <script src="js/init.js?<?php echo time() ?>"></script>
  </body>

</html>
