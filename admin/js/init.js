
admin_user = null;

function url_elems() {
  return (window.location.pathname.replace(kneeboard_root, '') || "introduction").split('/');
}

function update_content(callback) {
  console.log("update_content");
  // This gets called when we want to fully re-trigger the URL processing for
  // content, so on pop state, login, or page change to refresh the data
  
  // We just get the first page's refresh handler and let it deal with any
  // child pages and showing the correct nav items etc.

  var base_elems = url_elems();
  var page = base_elems.shift();
  var fn = page + "_refresh";
  if (typeof window[fn] === "function") {
    console.log("calling " + fn + "(" + JSON.stringify(base_elems) +", "+callback+")");
    window[fn](base_elems, callback);
  } else {
    console.log(page);
    $('#side-nav a[href="#'+page+'"]').tab('show');
    if (typeof(callback) === "function") {
      callback()
    }
  }
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

      // Determine the value of the item
      var val = child[0].value;
      if (child.prop('type') == "checkbox") {
        val = child.is(":checked") ? 1 : 0;
      }

      if (child[0].hasAttribute('data-base')) {
        if (child[0].getAttribute('data-base') != val) {
          return val;
        }
        return
      }

      return val ? val : undefined;
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

    // If we have lat lon (which are never inputs), we can return two items
    if (td.classList.contains('coord-ctrl')) {
      let base_lat = td.getAttribute('data-base-lat');
      let base_lon = td.getAttribute('data-base-lon');
      let lat = td.getAttribute('data-lat');
      let lon = td.getAttribute('data-lon');

      return [
        lat == base_lat ? null : lat,
        lon == base_lon ? null : lon];
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
  let obj = headings.reduce(function(obj,key,idx) {
    if (key == "-" || data[idx] == undefined) {
        return obj
    }
    obj[key] = data[idx];
    return obj
  }, {});

  // If heading includes lat, then auto add lon
  if (obj.lat) {
    if (obj.lat[1]) {
      obj.lon = obj.lat[1];
    }
    if (obj.lat[0]) {
      obj.lat = obj.lat[0];
    } else {
      delete obj.lat
    }
  }

  return obj;

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

    // If we have lat lon (which are never inputs), we can return two items
    if (td.hasAttribute('data-base-lat')) {
      let base_lat = td.getAttribute('data-base-lat');
      let base_lon = td.getAttribute('data-base-lon');
      return [base_lat, base_lon];
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
  let obj = headings.reduce(function(obj,key,idx) {
    if (key == "-" || data[idx] == undefined) {
        return obj
    }
    obj[key] = data[idx];
    return obj
  }, {});

  // If heading includes lat, then auto add lon
  if (obj.lat) {
    obj.lon = obj.lat[1];
    obj.lat = obj.lat[0];
  }

  return obj;
}

function sort_th(th, inverse) {
  var table = $(th).closest('table');
  var thIndex = $(th).index();

  if (inverse === null) {
    inverse = th.getAttribute('data-sort-inverse') == "true";
  }

  table.find('td').filter(function(){

    return $(this).index() === thIndex;

  }).sortElements(function(a, b){

    var aval = $(a.firstChild).prop('type') == "checkbox" ? $(a.firstChild).is(':checked') : a.firstChild.value.toLowerCase();
    var bval = $(b.firstChild).prop('type') == "checkbox" ? $(b.firstChild).is(':checked') : b.firstChild.value.toLowerCase();

    // if it's empty it's always less regardless, so we can have the non-empty cols at top
    if (aval == "") { return 1; }
    if (bval == "") { return -1; }

    // If the row has sortable-numeric, throw through parseFloat
    if ($(th).hasClass('sortable-numeric')) {
      aval = parseFloat(aval);
      bval = parseFloat(bval);
    }

    return aval > bval ?
      inverse ? -1 : 1
      : inverse ? 1 : -1;

  }, function(){

    // parentNode is the element we want to move
    return this.parentNode; 

  });
}

function sortable_table(table) {
  table.find('thead tr:last th.sortable').each(function(){

    $(this).click(function() {
      var inverse = this.getAttribute('data-sort-inverse') == "false";
      sort_th(this, inverse)
      this.setAttribute('data-sort-inverse', inverse);
    });
  });
}


// Setup AJAX 
$.ajaxSetup({
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

var dt = (new Date()).getTime();

$.when(

  $.ajax({
    url: kneeboard_root + "../js/coords.js?" + dt,
    headers: {'Accept': 'application/javascript'},
  }),
  $.ajax({
    url: kneeboard_root + "js/login.js?" + dt,
    headers: {'Accept': 'application/javascript'},
  }),
  $.ajax({
    url: kneeboard_root + "js/theatres.js?" + dt,
    headers: {'Accept': 'application/javascript'},
  }),
  $.ajax({
    url: kneeboard_root + "js/squadrons.js?" + dt,
    headers: {'Accept': 'application/javascript'},
  }),
  $.ajax({
    url: kneeboard_root + "js/threats.js?" + dt,
    headers: {'Accept': 'application/javascript'},
  }),

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
        if (event.target.nodeName == "TEXTAREA") {
          return;
        }
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

    // Ensure we're part of 
    if ($(x.target).closest('[id]')[0].id != 'side-nav') {
      return;
    }

    var tab = x.target.getAttribute("href").substring(1);

    var url = x.target.getAttribute("data-url") || tab;
    var path = kneeboard_root + url;
    var refresh = window.location.pathname != path;

    console.log(window.location.pathname,  path);

    // Set our window hash
    window.history.pushState('page', 'title', path);

    // If we are moving to a new tab, update the content
    if (refresh) {
      update_content();
    }

    // Ensure the nav item is selected when deletes/re-adds happen
    //console.log("AddC");
    //$('#side-nav a[href="#'+tab+'"]').addClass('active'); 

  });

  // Display main content
  $("#main-page").show()

  // Fade out Loader
  $("#loader-container").fadeOut("fast");

  // Initialize popstate for navigation once connected
  window.onpopstate = function() {
    // Now we need to know where the fuck to go from here ....
    console.log(window.location.pathname);
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
      if (isNaN(float_val)) {
        float_val = '';
      }
      elem.val(float_val);
    } else if (elem.hasClass('tcn')) {
      var tcn = elem.val().match(/^([0-9]+)\s*(X|Y)$/i);
      if (tcn) {
        elem.val(tcn[1] + ' ' + tcn[2].toUpperCase());
      }
    }

    // if it's got a data-base then it's an override, so we add modified to the class
    if (elem[0].hasAttribute('data-base')) {
      var base = elem[0].getAttribute('data-base')

      // If we're a child of a TD, then we set the TD
      var p = elem.parent();
      var tag_elem = p[0].tagName == 'TD' ? p : elem

      // If we are a checkbox, then we use checked 1/0 else use val()
      var val = elem.prop("type") == "checkbox"
        ? elem.is(':checked') ? '1': '0'
        : elem.val();

      if (val == base) {
        tag_elem.removeClass("modified");
      } else {
        tag_elem.addClass("modified");
      }
    }

  });

  $(document).on('coordinates-changed', function(e) {
    // elem is the lat item, so we need to go up and get next cell
    var elem = $(e.target);
    if (elem[0].hasAttribute('data-base-lat')) {
      var base = elem[0].getAttribute('data-base-lat');
      var raw = elem[0].getAttribute('data-lat');
      elem.toggleClass("modified", base != raw);
    }
    if (elem[0].hasAttribute('data-base-lon')) {
      var base = elem[0].getAttribute('data-base-lon');
      var raw = elem[0].getAttribute('data-lon');
      $(elem.closest('tr').children()[elem.index()+1]).toggleClass("modified", base != raw);
    }
  });

  // When we have modified an attribute, let it have right click reset
  $.contextMenu({
    selector: '.modified',
    callback: function(key, options) {
      if (key == 'reset') {
        var root = options.$trigger;
        var elem = root;

        if (elem[0].children.length) {
          elem = $(elem[0].children[0])
        }

        // Update raw value
        if (elem[0].hasAttribute('data-base')) {
          var attr = elem.data('base');
          elem[0].setAttribute('data-raw', attr);
          root.removeClass('modified');

          // Update display value
          var tag = elem[0].tagName;
          if (tag == "INPUT" || tag == "SELECT") {
            if (elem.prop("type") == "checkbox") {
              elem.prop('checked', attr == 1);
            } else {
              elem.val(attr);
            }
          }
        }

        if (elem[0].classList.contains('coord')) {

          let data_elem = elem;
          let tgt = "lat";
          if (!elem[0].classList.contains('coord-ctrl')) {
            data_elem = $(elem.closest('tr').children()[elem.index()-1]);
            tgt = "lon";
          }

          // Now we know what to reset based on where they're clicking, and the
          // key to update
          data_elem[0].setAttribute(`data-${tgt}`, data_elem[0].getAttribute(`data-base-${tgt}`));
          elem.removeClass('modified');

          // update the render
          coords.format_td(data_elem[0]);
        }
      }
    },
    items: {
      "reset": {name: "reset", icon: "copy"},
    }
  });

});
