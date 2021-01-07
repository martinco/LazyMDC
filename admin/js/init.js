
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
        callback(obj);
      }
    },
    "json"
  ).fail(function() {
    console.log("fatal 3");
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
        callback(obj);
      }
    },
    "json"
  ).fail(function() {
    console.log("fatal 3");
    return;
  });
}

var dt = (new Date()).getTime();

$.when(

  $.get("../js/common.js?" + dt),
  $.get("../js/coords.js?" + dt),
  $.get("js/login.js?" + dt),
  $.get("js/theatres.js?" + dt),

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

  // nav click handlers
  /*
  $(document).on('click', function (e) {

    var tgt = $(e.target);

    if (!tgt.hasClass('nav-link') || tgt.hasClass('direct-link')) {
      return
    }
    console.log("NAV_LINK");
    e.preventDefault();
    window.location.hash = tgt.attr('href');
    tgt.tab('show');
  });
  */

  // Nav Cleanup / Deactivation
  $(document).on('shown.bs.tab', function(e) {
    var href = e.target.getAttribute('href');
    console.log("SHOW: " + href);
    /*
    $('a.nav-link:not([href="'+href+'"])').each(function(idx, itm) {
      itm.classList.remove('active');
    });
    */
  });

  $(document).on('hide.bs.tab', 'a.nav-link', function(e) {
    console.log("HIDE: " + e.target.getAttribute('href'));
    // If we have a child already; replace
    //$('#side-nav a[href="#theatres-edit"]').remove();
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
        }
        break;
    }
  });

  // Initialize tab show handler
  $(document).on('show.bs.tab', function(x) {
    var tab = x.target.getAttribute("href").substring(1);
    var fn = tab + "_refresh";
    if (typeof window[fn] === "function") {
      window[fn]();
    }
  });
  
  // Display main content
  $("#main-page").show()

  // Fade out Loader
  $("#loader-container").fadeOut("fast");

  // Initialize popstate for navigation
  window.onpopstate = function() {
    $("a.nav-link[href!=\"" + document.location.hash + "\"]").removeClass('active');
    $("a.nav-link[href$=\"" + document.location.hash + "\"]").tab('show');
  }

});
