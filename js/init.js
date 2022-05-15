// This is ugly and i don't like it - but when we load an MDC on save, we click
// through the submission to see where to land, given right now this includes
// saving, we want to avoid it, so we disable it, click, enable it...eugh
disable_save = false

function debug(msg) {
  if (debug_level) {
    var dt = (new Date()).getTime();
    $('#debug').append(dt + " " + msg + "\n")
  }
}

squadron_data = {};
mission_data = {};
threats = null;

debug("init loaded");

$.when(

  api_get("threats").done(function(data) {
    threats = data;
  }),

  $.getJSON("data/airframes.json").done(function(data) {
    airframes = data;
  }),

).then(function() {

  debug("data loaded");

  var tinymce_init_count = $('textarea.mce').length;
  var tinymce_init_complete = $.Deferred();

  // Initialize Editors
  try {
    tinymce.init({
      selector: 'textarea.mce',
      plugins: [
        'autoresize',
        'image',
        'paste',
        'pagebreak',
        'table',
      ],
      table_toolbar: '',
      table_use_colgroups: true,
      mobile: {
        theme: 'mobile',
      },
      table_default_attributes: {
        border: 0,
        cellpadding: 0,
        cellspacing: 0,
      },
      // Take that image blob and upload it
      automatic_uploads: true,
      images_upload_url: "mce_upload.php",
      images_file_types: "jpeg,jpg,png,gif,bmp",
      // image pasting uploads (paste plugin), without using relative paths
      smart_paste: true,
      paste_data_images: true,
      relative_urls : false,
      remove_script_host: false,
      convert_urls: false,
      //toolbar: "undo redo pastetext | fontselect | fontsizeselect",
      content_css: "tinymce.css",
      fontsize_formats: "14px 16px 18px 20px 22px 24px 30px 40px",
      branding: false,
      forced_root_block: false,
      resize: true,
      remove_trailing_brs: true,
      resize_img_proportional: true,
      init_instance_callback: function(inst) {
        $(inst.contentWindow).bind('keydown', function(event) {
          switch (event.keyCode) {
            case 83: // s 
              if (event.ctrlKey || event.metaKey) {
                event.preventDefault();
                save({notify: true})
              }
              break;
          }
        });

        // Set min-height based on params
        inst.settings.min_height = parseInt(inst.targetElm.getAttribute('data-min-height')) || 700;

        tinymce_init_count -= 1;
        if (tinymce_init_count == 0) { 
          tinymce_init_complete.resolve();
        }
      },
    });
  } catch (e) {
    debug(e);
    tinymce_init_complete.resolve();
  }

  var dt = (new Date()).getTime();

  // Load page-dependent JS sequentially
  $.when(
    $.get("js/coords.js?" + dt),
    $.get("js/time.js?" + dt),
    $.get("js/pad.js?" + dt),
    $.get("js/mission.js?" + dt),
    $.get("js/flight.js?" + dt),
    $.get("js/data.js?" + dt),
    $.get("js/presets.js?" + dt),
    $.get("js/package.js?" + dt),
    $.get("js/loadout.js?" + dt),
    $.get("js/profiles.js?" + dt),
    $.get("js/deparr.js?" + dt),
    $.get("js/waypoints.js?" + dt),
    $.get("js/comms.js?" + dt),
    $.get("js/threats.js?" + dt),
    $.get("js/notes.js?" + dt),
    $.get("js/download.js?" + dt),
    tinymce_init_complete,

  ).then(function() {

    debug("JS Loaded");

    // Replace our icons
    feather.replace();

    // Add invalid feedback spacer for all our forms
    $('div .form-group > input[type!=file]').each(function (a, b) {
        $('<div style="height:1.25rem; float: right;"></div>').insertAfter($(b));
    });
    $('div .form-group > select').each(function (a, b) {
        $('<div style="height:1.25rem; float: right;"></div>').insertAfter($(b));
    });
    $('div .input-group:not(".p-0") > input[type!=file]').each(function (a, b) {
        $('<div style="height:1.25rem; float: right;"></div>').insertAfter($(b).parent());
    });

    // Nav Handling
    $('a.nav-link').not('.direct-link').click(function (e) {

      // Save as if the user hit next, just to avoid editing say notes, hitting
      // next, and it not saving when selecting html
      save()

      e.preventDefault();
      window.location.hash = $(this).attr('href');
      $(this).tab('show');
    });

    // Nav Cleanup / Deactivation
    $('a.nav-link').not('.direct-link').on('shown.bs.tab', function(e) {
      var href = e.target.getAttribute('href');
      $('a.nav-link:not([href="'+href+'"])').each(function(idx, itm) {
        itm.classList.remove('active');
      });
    });

    // Set forms autocomplete handlers
    (function() {
       'use strict';

        // Fetch all the forms we want to apply custom Bootstrap validation styles to
        var forms = document.getElementsByClassName('needs-validation');

        // Loop over them and prevent submission
        Array.prototype.filter.call(forms, function(form) {
          form.addEventListener('submit', function(event) {
            event.preventDefault();

            // If the page we're on has a custom validation then call that
            var page = $('a.nav-link.active').attr('href').substr(1);
            if (window[page + "_validate"]) {
              if(!window[page+"_validate"]()) {
                form.classList.add('was-validated');
                return;
              }
            }

            if (form.checkValidity() === true) {

              // Enable Next target
              var target = $(this).data('nav-target');

              // If we're flight, heading to mission, then we enable all others
              // and allow a freefor all selection 
              if (target == "#mission") {
                $("a.nav-link.disabled").removeClass('disabled');
              }

              var nav = $("a.nav-link[href$=\"" + target + "\"]")
              nav.tab('show');

              // If we aren't saving, we also don't want to spin through hashes
              // as it looks ugly
              if (!disable_save) {

                window.location.hash = target
                document_update_title()

                // Automatically save when we move to next target, due to the 
                // save only working if we got past mission, this works out
                // quite nicely
                save()
              }

            }
            form.classList.add('was-validated');
          }, false);
        });

    })();

    // Set freq_autocomplete on all freqs
    $(".freq-autocomplete").each(function(index, input) {
      freq_autocomplete(input);
    });

    // Set Ctlr+S Handler
    
    $(window).bind('keydown', function(event) {
      switch (event.keyCode) {
        case 13: // enter
          event.preventDefault();
          break;
        case 83: // s 
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            save({notify: true})
          }
          break;
      }
    });

    // Hide all the active tabs for crawlers etc
    if (!crawler) {
      $('div.tab-pane:not([id="error"]').removeClass('active');
    }
    
    // If we are loading a saved MDC, try to load that, otherwise just do a
    // null loader
    
    var mdc_key = get_key()
    if (mdc_key) {
      var dt = (new Date()).getTime();
      $.getJSON('mdcs/' + mdc_key + '.json?' + dt)
        .done(function(data) {

          load(data, function() {
            // If we got this far, then make data active
            $("a.nav-link[href$=data]").tab('show');

            // Store the original request hash
            var request_hash = window.location.hash;

            // Try and click "Next..." through each of the pages to validate,
            // before moving to the selected page on save
            var page = $('a.nav-link.active').attr('href').substr(1);

            $('a.nav-link').not('.direct-link').each(function(idx, itm) {
              var href = $(itm).attr('href').substr(1);
              if (href != "download") {
                var submit = $('#' + href + '-form button[type=submit]')
                if (submit) {
                  // if the page didn't change, we stop
                  disable_save = true
                  $(submit).click();
                  disable_save = false

                  var new_page = $('a.nav-link.active').attr('href').substr(1);

                  if (new_page != page) {
                    page = new_page;
                  } else {
                    window.location.hash = new_page 
                    return false
                  }
                }
              }
            });
            
            // If we the request had a hash, go to that page
            if (request_hash) {
              window.location.hash = request_hash;
              $("a.nav-link[href$=\"" + request_hash + "\"]").tab('show');
            }

            // Display main content
            $("#main-page").show()
            // Fade out Loader
            $("#loader-container").fadeOut("fast");
          });
        })
        .fail(function() {
          // Display error and fade out
          $("a.nav-link:not(.direct-link)").addClass('disabled');
          $("#error").show()
          $("#loader-container").fadeOut("fast");
        });
    } else {

      // If we're not a crawler, show data
      if (!crawler) {
        $("a.nav-link[href$=data]").tab('show');

        // Show page if we have one 
        $("a.nav-link[href$=\"" + window.location.hash + "\"]").tab('show');
      }

      // run through the page loaders, and fade out to main page
      load(null, function() {
        // Display main content
        $("#main-page").show()

        // Fade out Loader
        $("#loader-container").fadeOut("fast");
      });

    }
  });

  // Initialize popstate for navigation
  window.onpopstate = function() {
    $("a.nav-link[href$=\"" + document.location.hash + "\"]").tab('show');
    document_update_title()
  }
});
