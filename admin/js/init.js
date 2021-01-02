
function api_get(path, callback) {
  $.get(
    '../api/' + path,
    function(obj) {
      if (!obj) {
        console.log("fatal call 1");
        return;
      }

      if (typeof obj !== "object") {
        console.log("fatal 2");
        return;
        // fatal error
      }

      if (typeof callback === "function") {
        console.log("callback");
        callback(obj);
      }
    },
    "json"
  ).fail(function() {
  });
}

function api_post(path, data, callback) {
  $.post(
    '../api/' + path,
    JSON.stringify(data),
    function(obj) {
      if (!obj) {
        console.log("fatal call 1");
        return;
      }

      if (typeof obj !== "object") {
        console.log("fatal 2");
        return;
        // fatal error
      }

      if (typeof callback === "function") {
        console.log("callback");
        callback(obj);
      }
    },
    "json"
  ).fail(function() {
  });
}

var dt = (new Date()).getTime();

$.when(

  $.get("js/login.js?" + dt),

).then(function() {

  // Check for login
  api_get('user/whoami', function(r) {
    if (r.username) {
      do_login(r, true);
    }
  });

  // Load page-dependent JS sequentially
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
  
  // Display main content
  $("#main-page").show()

  // Try log load page 
  $("a.nav-link[href$=\"" + document.location.hash + "\"]").tab('show');

  // Fade out Loader
  $("#loader-container").fadeOut("fast");

  // Initialize popstate for navigation
  window.onpopstate = function() {
    $("a.nav-link[href$=\"" + document.location.hash + "\"]").tab('show');
  }

});
