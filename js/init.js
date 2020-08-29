

$.when(

  // Page Data
  $.get( "pages/welcome.html", function( data ) { $("#welcome").append(data); }),
  $.get( "pages/mission.html", function( data ) { $("#mission").append(data); }),
  $.get( "pages/data.html", function( data ) { $("#data").append(data); }),
  $.get( "pages/flight.html", function( data ) { $("#flight").append(data); }),
  $.get( "pages/package.html", function( data ) { $("#package").append(data); }),
  $.get( "pages/loadout.html", function( data ) { $("#loadout").append(data); }),
  $.get( "pages/deparr.html", function( data ) { $("#deparr").append(data); }),
  $.get( "pages/waypoints.html", function( data ) { $("#waypoints").append(data); }),
  $.get( "pages/comms.html", function( data ) { $("#comms").append(data); }),
  $.get( "pages/threats.html", function( data ) { $("#threats").append(data); }),
  $.get( "pages/notes.html", function( data ) { $("#notes").append(data); }),
  $.get( "pages/download.html", function( data ) { $("#download").append(data); }),

  $.get( "modals/coords.html", function( data ) { $("#modal-container").append(data); }),
  $.get( "modals/download.html", function( data ) { $("#modal-container").append(data); }),

  // Data Sources
  $.getJSON("data/freqs.json").done(function(data) {
    freqs = data;
  }),

  $.getJSON("data/pilots.json").done(function(data) {
    pilots = data;
  }),

  $.getJSON("data/stores-map.json").done(function(data) {
    stores_map = data;
  }),

  $.getJSON("data/theatres.json").done(function(data) {
    theatres = data;
  }),

  $.getJSON("data/mission_data.json").done(function(data) {
    mission_data = data;
  }),

  $.getJSON("data/pylons.json").done(function(data) {
    pylon_data = data;
  }),

  $.getJSON("data/threats.json").done(function(data) {
    threats = data;
  }),

  $.getJSON("data/callsigns.json").done(function(data) {
    callsigns = data;
  }),

).then(function() {

  var tinymce_init_count = $('textarea.mce').length;
  var tinymce_init_complete = $.Deferred();

  // Initialize Editors
  tinymce.init({
    selector:'textarea.mce',
    plugins: [
      'table',
    ],
    force_br_newlines : true,
    force_p_newlines : false,
    forced_root_block : '',
    height: "400",
    resize: false,
    init_instance_callback: function() {
      tinymce_init_count -= 1;
      if (tinymce_init_count == 0) { 
        tinymce_init_complete.resolve();
      }
    },
  });

  var dt = (new Date()).getTime();

  // Load page-dependent JS sequentially
  $.when(
    $.get("js/common.js?" + dt),
    $.get("js/coords.js?" + dt),
    $.get("js/mission.js?" + dt),
    $.get("js/flight.js?" + dt),
    $.get("js/data.js?" + dt),
    $.get("js/package.js?" + dt),
    $.get("js/loadout.js?" + dt),
    $.get("js/deparr.js?" + dt),
    $.get("js/waypoints.js?" + dt),
    $.get("js/comms.js?" + dt),
    $.get("js/threats.js?" + dt),
    $.get("js/notes.js?" + dt),
    $.get("js/download.js?" + dt),
    tinymce_init_complete,

  ).then(function() {


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

    // Cleanup Nav
    $('#side-nav a').click(function (e) {
      e.preventDefault();
      window.location.hash = $(this).attr('href');
      $(this).tab('show');
    });

    // If we have a window ref select that tab
    if (window.location.hash) { 
      $("#side-nav a[href$=\"" + window.location.hash + "\"]").tab('show');
    }

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
            var page = $('ul#side-nav a.nav-link.active').attr('href').substr(1);
            if (window[page + "_validate"]) {
              if(!window[page+"_validate"]()) {
                form.classList.add('was-validated');
                return;
              }
            }

            if (form.checkValidity() === true) {
              // Enable Next target
              var target = $(this).data('nav-target');

              var nav = $("#side-nav a[href$=\"" + target + "\"]")
              nav.removeClass('disabled');
              nav.tab('show');

              // Set hash
              window.location.hash = target
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
      if (event.ctrlKey || event.metaKey) {
        switch (String.fromCharCode(event.which).toLowerCase()) {
          case 's':
            event.preventDefault();
            save(null, false, true, true)
            break;
        }
      }
    });
    
    // If we are loading a saved MDC, try to load that 
    var mdc_key = get_key()
    if (mdc_key) {
      $.getJSON('mdcs/' + mdc_key + '.json')
        .done(function(data) {
          load(data)

          // Try and click "Next..." through each of the pages to validate,
          // before moving to the selected page on save
          var page = $('ul#side-nav a.nav-link.active').attr('href').substr(1);

          $('ul#side-nav a.nav-link').each(function(idx, itm) {
            var href = $(itm).attr('href').substr(1);
            if (href != "download") {
              var submit = $('#' + href + '-form button[type=submit]')
              if (submit) {
                // if the page didn't change, we stop
                $(submit).click();

                var new_page = $('ul#side-nav a.nav-link.active').attr('href').substr(1);

                if (new_page != page) {
                  page = new_page;
                } else {
                  return false
                }
              }
            }
          });
          
          // If we have a current_page, move to it
          if (data['current_page']) {
            window.location.hash = data['current_page'];
            $("#side-nav a[href$=\"" + data['current_page'] + "\"]").tab('show');
          }

        })
        .always(function() {
          // Display main content
          $("#main-page").show()

          // Fade out Loader
          $("#loader-container").fadeOut("fast");
        })
    } else {
      // Display main content
      $("#main-page").show()

      // Fade out Loader
      $("#loader-container").fadeOut("fast");
    }
  });
});
