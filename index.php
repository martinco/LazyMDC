<!DOCTYPE html>
<html>
  <head>
    <title>Data Card Builder v2</title>

    <meta name="description" content="Mission Data Card (MDC) generator for DCS with support for importing data from CombatFlite or Google Earth, editing navigation, loadouts / weights, images for notes and more. Generates PDF, or PNG for immediate kneeboard use including A-10C CDU DataLoader files where applicable">
    <meta name="keywords" content="DCS, MDC, MissionDataCard, Mission Data Card, Data Card, Kneeboard, knee board, loadout, route, planning, combat flite, combatflite, google earth">

    <link rel="stylesheet" href="//stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css" integrity="sha384-Vkoo8x4CGsO3+Hhxv8T/Q5PaXtkKtu6ug5TOeNV6gBiFeWPGFN9MuhOf23Q9Ifjh" crossorigin="anonymous">
    <link rel="stylesheet" href="//code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css"   crossorigin="anonymous">

    <link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/jquery-contextmenu/2.7.1/jquery.contextMenu.min.css"   crossorigin="anonymous">

    <link rel="stylesheet" href="index.css">

    <link rel="stylesheet" href="//cdn.jsdelivr.net/npm/file-icon-vectors@1.0.0/dist/file-icon-classic.min.css">

    <link rel="stylesheet" href="//cdn.jsdelivr.net/npm/overhang@1.0.8/dist/overhang.min.css">

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
    <script><?php
        $kneeboard_root=dirname($_SERVER['SCRIPT_NAME']);
        if (substr($kneeboard_root, -1) != '/') {
          $kneeboard_root .= '/';
        }
        echo("\n");
        echo('kneeboard_root="' . $kneeboard_root . '"' . ";\n");
        echo('debug_level=' . (isset($_GET['debug']) ? 'true' : 'false') . ";\n");
      ?>
    </script>
  </head>
  <body>
    <div id="loader-container" style="<?php echo isset($_GET['debug']) ? 'display: none' : ''; ?>">
      <div id="loader">
        <img src="img/loader.svg" style="width:30px; height:30px"></img>
      </div>
    </div>

    <div id="main-page" style="width: 1050px; margin: 0 auto; min-height: 100%; display: flex">
      <div style="position: absolute; margin: 0 auto; top:0px; height:48px; width:1050px; border-bottom: 1px solid #bdbdbd; background: #444">
        <?php if ($kneeboard_root != '/' || $_SERVER['HTTP_HOST'] == 'dev.dcs-mdc.com') { ?>
        <div style="padding-left: 215px; color:#ff0000; padding-top: .75rem; font-size:1rem;">
          Development Build, use <a style="color: #ff0000" href="https://dcs-mdc.com">https://dcs-mdc.com</a>
        </div>
        <?php } ?>
      </div>

      <nav id='side-bar' class="bg-light sidebar col-fixed" style="min-height: 100%; border-left: 1px solid #dfdfdf; width:200px;">

        <div style="padding-left: .75rem; padding-top: .75rem; font-size:1rem; height:48px; border-bottom: 1px solid #bdbdbd; background-color: #222; color: #fff">Data Card Builder v2</div>

        <div class="" style="padding-top: 10px">
          <ul class="nav flex-column show" id="side-nav">
            <li class="nav-item">
              <a class="nav-link" href="#data">
                <span data-feather="upload"></span>
                Data Sources
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#flight">
                <span data-feather="users"></span>
                Flight
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link disabled" href="#mission">
                <span data-feather="crosshair"></span>
                Mission
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link disabled" href="#package">
                <span data-feather="user-plus"></span>
                Package
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link disabled" href="#loadout">
                <span data-feather="gift"></span>
                Loadout
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link disabled" href="#profiles">
                <span data-feather="briefcase"></span>
                Profiles
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link disabled" href="#deparr">
                <span data-feather="corner-up-right"></span>
                Depart / Arrival
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link disabled" href="#waypoints">
                <span data-feather="map-pin"></span>
                Waypoints
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link disabled" href="#comms">
                <span data-feather="message-circle"></span>
                Comms
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link disabled" href="#threats">
                <span data-feather="alert-triangle"></span>
                Threats
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link disabled" href="#notes">
                <span data-feather="edit"></span>
                Notes 
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link disabled" href="#download">
                <span data-feather="download"></span>
                Download
              </a>
            </li>
          </ul>
        </div>

        <div style="top:auto; bottom: 10px; position:fixed">
          <ul class="nav flex-column show">
            <li class="nav-item">
              <a class="nav-link direct-link" href="<?php echo $kneeboard_root; ?>">
                <span data-feather="repeat"></span>
                Reset
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#about">
                <span data-feather="at-sign"></span>
                About<span class="sr-only"></span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link direct-link" href="//github.com/MartinCo/LazyMDC/issues">
                <span data-feather="github"></span>
                Github Issues
              </a>
            </li>
          </ul>
        </div>
      </nav>

      <!-- Main Page -->
      <div class="tab-content" style="float: left; width:850px; min-height: 100%; padding: 15px; border-right:1px solid #dfdfdf; padding-top:58px">
        <div style="<?php echo !isset($_GET['debug']) ? 'display: none' : ''; ?>"><pre id="debug"></pre></div>
        <div class="tab-pane" id="error">
          <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pb-2 mb-3 border-bottom">
            <h1 class="h2">Error</h1>
          </div>
          <div>
            <p>
            I'm sorry, it looks like an error has occured
            </p>
            <p>
              Please feel free to get in touch by any of the following 
              mechanisms and we'll sort this out as soon as possible
              <ul>
                <li>File an issue on <a href="//github.com/MartinCo/LazyMDC/issues">GitHub</a>
                <li>Get in touch via MartinCo#6402 on discord (132nd.MartinCo on <a href=https://discord.gg/vK2MS2P>132nd Discord</a> or on Hoggit, DCS and others)
                <li>Get in touch via eMail: <a href="mailto:help@dcs-mdc.com">help@dcs-mdc.com</a>
              </ul>
            </p>
            <p>
            - MartinCo
            </p>
          </div>
        </div>
        <div class="tab-pane" id="about">
          <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pb-2 mb-3 border-bottom">
            <h1 class="h2">About</h1>
          </div>
          <div>
            <p>
              Welcome to Data Card Builder v2.
            </p>
            <p>
              This is a Mission Data Card (MDC) generator / builder for DCS 
              with support for importing routes, loadouts and more from CombatFlite or
              routes from Google Earth, editing navigation waypoints, assigning loadout 
              (including weights) and custom images for notes secctions and more.
            </p>
            <p>
              It generates multi-page PDF or per-page PNG files that are 
              suitable for immediate kneeboard use within DCS and includes a
              <a href='https://www.virtual-jabog32.de/forum/viewtopic.php?f=38&t=11569'>A-10C CDU DataLoader</a>
              compatible file when the A-10C is selected
            </p>
            <p>
              It was born out of a desire to make my own life easier building 
              MDCs in a reasonable timeframe and I hope you find it of use!
            </p>
            <p>
            If you have any trouble, feature requests or other items of interest, please feel free to
              <ul>
                <li>File an issue on <a href="http://github.com/MartinCo/LazyMDC/issues">GitHub</a>
                <li>Get in touch via <a href='https://discordapp.com/users/219885915198324736'>MartinCo#6402</a> on discord (132nd.MartinCo on <a href=https://discord.gg/vK2MS2P>132nd Discord</a> or on Hoggit, DCS and others)
                <li>Get in touch via eMail: <a href="mailto:help@dcs-mdc.com">help@dcs-mdc.com</a>
              </ul>
            </p>
            <p>
            - MartinCo
            </p>
          </div>
        </div>
        <?php
        readfile('pages/data.html');
        readfile('pages/flight.html');
        readfile('pages/mission.html');
        readfile('pages/package.html');
        readfile('pages/loadout.html');
        readfile('pages/profiles.html');
        readfile('pages/deparr.html');
        readfile('pages/waypoints.html');
        readfile('pages/comms.html');
        readfile('pages/threats.html');
        readfile('pages/notes.html');
        readfile('pages/download.html');
        ?>
      </div>

    </div> <!-- /content -->

    <!-- modals -->
    <div id="modal-container">
      <?php
      readfile('modals/coords.html');
      readfile('modals/download.html');
      ?>
    </div>


    <script src="https://code.jquery.com/jquery-3.5.1.min.js" integrity="sha256-9/aliU8dGd2tb6OSsuzixeV4y/faTqgFtohetphbbj0=" crossorigin="anonymous"></script>
    <script src="https://code.jquery.com/ui/1.12.1/jquery-ui.min.js" integrity="sha256-VazP97ZCwtekAsvgPBSUwPFKdrwD3unUfSGVYrahUqU=" crossorigin="anonymous"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.7/umd/popper.min.js" integrity="sha384-UO2eT0CpHqdSJQ6hJty5KVphtPhzWj9WO1clHTMGa3JDZwrnQq4sF86dIHNDz0W1" crossorigin="anonymous"></script>
    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js" integrity="sha384-JjSmVgyd0p3pXB1rRibZUAYoIIy6OrQ6VrjIEaFf/nJGzIxFDsf4x0xIM+B07jRM" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/geographiclib@1.50.0/geographiclib.min.js" integrity="sha256-P4IU60oavmLHtspWrVYYoXkXGeeuIerQZFj33Q0FeTw=" crossorigin="anonymous"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-contextmenu/2.9.2/jquery.contextMenu.min.js" integrity="sha512-kvg/Lknti7OoAw0GqMBP8B+7cGHvp4M9O9V6nAYG91FZVDMW3Xkkq5qrdMhrXiawahqU7IZ5CNsY/wWy1PpGTQ==" crossorigin="anonymous"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-contextmenu/2.9.2/jquery.ui.position.min.js" integrity="sha512-878jmOO2JNhN+hi1+jVWRBv1yNB7sVFanp2gA1bG++XFKNj4camtC1IyNi/VQEhM2tIbne9tpXD4xaPC4i4Wtg==" crossorigin="anonymous"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jQuery.serializeObject/2.0.3/jquery.serializeObject.min.js" integrity="sha512-DNziaT2gAUenXiDHdhNj6bfk1Ivv72gpxOeMT+kFKXB2xG/ZRtGhW2lDJI9a+ZNCOas/rp4XAnvnjtGeMHRNyg==" crossorigin="anonymous"></script>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/tinymce/5.6.1/tinymce.min.js" integrity="sha512-RAKGi5Lz3BrsIKXW8sSbTM2sgNbf5m3n7zApdXDTL1IH0OvG1Xe1q2yI2R2gTDqsd2PLuQIIiPnDJeOSLikJTA==" crossorigin="anonymous"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/tinymce/5.6.1/plugins/table/plugin.min.js" integrity="sha512-gh8VZki1bz2pnEpqlggbf1uhAM5Hx35xG29/l0li23HQogyutabbMO3BXZ3wnLEgtpw4RgUFCj1AzAqj1+8bFA==" crossorigin="anonymous"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/tinymce/5.6.1/plugins/image/plugin.min.js" integrity="sha512-f3ehjvBomLZvIXfVorgSoPMHzeaosLA2I4F4byiokqzqWNyvpZLwWWI4myoQ/CcVcpyNjslPhbVEIpw0rex9vA==" crossorigin="anonymous"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/tinymce/5.6.1/plugins/pagebreak/plugin.min.js" integrity="sha512-ts2h6EdRYK4iNPEgz5AH6uE0vdy9uDgTS8eNU1NSt1HlyHCo5/UbgJH/ZrpX51BB+MNiA18kRSpp9/ufM8m2cg==" crossorigin="anonymous"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/tinymce/5.6.1/themes/mobile/theme.min.js" integrity="sha512-xnXH5/nW1ksv/sJ9P49LGS0Pxn/VPBILlny3lGU35g1y19YUeBYzZVTcZbuIvetuPF4Eo6QXatXtenUw1DBTeA==" crossorigin="anonymous"></script>

    <script src="https://cdn.jsdelivr.net/npm/overhang@1.0.8/dist/overhang.min.js" integrity="sha256-Ug34+8hEyLcZRNUefnDM6H4ijzC7Tdf8eWGuTxXIseU=" crossorigin="anonymous"></script>

    <script type="text/javascript" src="js/zip-js/zip.js"></script>

    <!-- Icons -->
    <script src="https://cdn.jsdelivr.net/npm/feather-icons/dist/feather.min.js"></script>

    <!-- Init -->
    <script src="js/init.js?<?php echo time() ?>"></script>
    <script src="js/autocomplete.js"></script>
  </body>

</html>
