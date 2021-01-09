
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

function get_modified_row_data(row, headings) {
  if (!row) {
    return {}
  }

  var data = Array.prototype.map.call(row.querySelectorAll('td, th'), function(td) {
    // If we have children (e.g. input), use that value
    if (td.children.length) {

      child = $(td.children[0])

      // If it's an MCE text area just grab the HTML content
      if (child.hasClass('mce')) {
        return tinymce.editors[child.attr('id')].getContent()
      }

      dd = child[0].getAttribute('data-raw')
      if (dd) {
        if (child[0].hasAttribute('data-base')) {
          if (child[0].getAttribute('data-base') != dd) {
            return dd;
          }
          return
        }
        return dd ? dd : undefined;
      }

      if (child[0].hasAttribute('data-base')) {
        if (child[0].getAttribute('data-base') != child[0].value) {
          return child[0].value
        }
        return
      }

      return child[0].value ? child[0].value : undefined;
    }

    // If our TD holds raw-data, use that
    dd = td.getAttribute('data-raw')
    if (dd) {
      if (td.hasAttribute('data-base')) {
        if (td.getAttribute('data-base') != dd) {
          return dd;
        }
        return
      }
      return dd ? dd : undefined;
    }

    // Finally, just use what's in the cell
    if (td.hasAttribute('data-base')) {
      if (td.getAttribute('data-base') != td.innerHTML) {
        return dd;
      }
      return
    }

    return td.innerHTML ? td.innerHTML : undefined;
  });

  if (!headings) {
    return data;
  }

  // Map array to keys if we have them
  return headings.reduce(function(obj,key,idx) {
    if (key == "-" || data[idx] == undefined) {
        return obj
    }
    obj[key] = data[idx];
    return obj
  }, {});

}

function get_base_row_data(row, headings) {
  if (!row) {
    return {}
  }

  var data = Array.prototype.map.call(row.querySelectorAll('td, th'), function(td) {
    // If we have children (e.g. input), use that value
    if (td.children.length) {
      child = td.children[0];
      dd = child.getAttribute('data-base')
      if (dd) {
        return dd;
      }
    }

    // If our TD holds raw-data, use that
    dd = td.getAttribute('data-base')
    if (dd) {
      return dd;
    }

    return undefined;
  });

  if (!headings) {
    return data;
  }

  // Map array to keys if we have them
  return headings.reduce(function(obj,key,idx) {
    if (key == "-" || data[idx] == undefined) {
        return obj
    }
    obj[key] = data[idx];
    return obj
  }, {});

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

    // Set our window hash
    window.location.hash = tab;

    // if the page has a refresh function (e.g edit theatre, trigger the reload
    // of data)
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
    $("a.nav-link[href$=\"" + document.location.hash + "\"]").tab('show');
  }

  // Handle any global change events
  $(document).on('change', function(e) {
    var elem = $(e.target);

    // There was a request to allow commas for expedited entry, as it doesn't
    // cause much pain to have we will facilitate that here
    if (elem.hasClass('freq')) {
      var val = elem.val().replace(',', '.');
      var float_val = parseFloat(val).toFixed(3)
      elem.val(float_val);
    } else if (elem.hasClass('tcn')) {
      var tcn = elem.val().match(/^([0-9]+)\s*(X|Y)$/i);
      if (tcn) {
        elem.val(tcn[1] + ' ' + tcn[2].toUpperCase());
      }
    }
    // if it's got a data-base then it's an ovverride, so we add modified to the class
    if (elem[0].hasAttribute('data-base')) {
      elem.addClass("modified");
    }

  });

  $(document).on('coordinates-changed', function(e) {
    var elem = $(e.target);
    if (elem[0].hasAttribute('data-base')) {
      // It's eitehr set or reset 
      var base = elem[0].getAttribute('data-base');
      var raw = elem[0].getAttribute('data-raw');
      elem.toggleClass("modified", base != raw);
    }
  });

});
