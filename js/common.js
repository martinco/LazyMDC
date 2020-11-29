
var last_save_data = null

// Pad "n" to given width with 'z'. In the case of a number: pad the
// characteristic, and mantissa to desired precision 
//   e.g: (54.24, 3, null, 4) => 054.2400
function pad(n, width, z, precision) {

  z = z || '0';
  precision = precision || 0;

  var nn = parseFloat(n)
  if (!isNaN(nn)) {

    var nni = Math.floor(nn)

    // Turn our int into a string
    var nns = nni + '';

    // pad NN to width
    nns = nns.length >= width ? nns : new Array(width - nns.length + 1).join(z) + nns;

    // Then append any remainder, merging back to n 
    if (precision > 0) {
      n = nns + ((nn - nni).toFixed(precision) + '').substr(1)
    } else {
      n = nns
    }
  }

  // continue pad as before
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

// Get a table row data, either as an array, or dict if provided headings
function get_row_data(row, headings) {
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
        return dd
      }
      return child[0].value
    }

    // If our TD holds raw-data, use that
    dd = td.getAttribute('data-raw')
    if (dd) {
      return dd
    }

    // Finally, just use what's in the cell
    return td.innerHTML
  });

  if (!headings) {
    return data;
  }

  // Map array to keys if we have them
  return headings.reduce(function(obj,key,idx) {
    if (key == "-") {
        return obj
    }
    obj[key] = data[idx];
    return obj
  }, {});

}

function get_form_data(form) {
  return form.serializeArray().reduce(
    function(obj,k) {
      obj[k['name']] = k['value']; 
      return obj
    }, {})
}

function update_presets() {
  $("input.freq-preset").each(function(idx, elem) {
    var elem = $(elem)
    elem.closest('tr')[0].cells[elem.parent().index()+1].innerHTML = lookup_preset(elem.val())
  });
}

function lookup_preset(value) {

  if (value === "" || isNaN(value)) {
    return ""
  }

  var float_val = parseFloat(value);
  var float_str = float_val.toFixed(3)
  var type = $("#flight-airframe").val();
  var mission = $('#data-mission').val();

  if (mission_data[mission] && mission_data[mission]['presets'] && mission_data[mission]['presets'][type] && mission_data[mission]['presets'][type][float_str]) {
    return mission_data[mission]['presets'][type][float_str];
  }

  if (type == 'FA-18C') {
    return "MAN"
  } else if (type == 'F-16C') {
    if (float_val >= 225 && float_val < 400) {
      return "U-M";
    }
    if (float_val >= 30 && float_val < 88) {
      return "V-M"; // VHF FM
    }
    if (float_val >= 108 && float_val < 152) {
      return "V-M"; // VOR (108-118) / ATC AM (118-137) / Also upto 151.9
    }
    return "-";
  }

  return "M";
}


function tcn_formatter(field) {
  $(field).on('change', function(x) {
    var tgt = x.target;

    var tcn = tgt.value.match(/^([0-9]+)\s*(X|Y)$/i);
    if (tcn) {
      tgt.value = tcn[1] + ' ' + tcn[2].toUpperCase();
    }
  });
}


function get_key() {
  var mdc_key = window.location.pathname.replace(kneeboard_root, '')
  if (/^[0-9a-zA-Z]{8}$/.test(mdc_key)) {
    return mdc_key
  }

  return undefined
}

// Get the data to save
function get_data() {
  var ret = {
    'version': '2.0',
  };

  ['data', 'mission', 'flight', 'package', 'loadout', 'deparr', 'waypoint', 'comms', 'threats', 'notes', 'download'].forEach(function(data) {
    debug("collecting: " + data);
    ret[data] = window[data+"_export"]()
  });

  return ret
}

function document_update_title() {

  var mission_id = $('#mission-id').val();
  var title = "DCBv2:"

  if (mission_id) {
    title += " " + mission_id
  }

  if (window.location.hash) {
    title += " " + window.location.hash.substr(1)
  }

  document.title = title;
}

// function save(data = null, new_id = false, update_id=true, notify = false, cb = null, cb_args = []) {
function save(override) {

  if (disable_save) {
    debug("Saving Disabled");
    return
  }

  var params = {
    data: null,
    new_id: false,
    update_id: true,
    notify: false,
    notify_message: "Kneeboard Saved",
    force: false,
    callback: null,
    callback_args: [],
  }

  // Extend with user provided opts
  jQuery.extend(true, params, override)

  // As a simple sanity check we ensure we have mission ID as bare minimum to save
  if (!$('#flight-airframe').val()) {
    debug("No Airframe, aborting save");
    return
  }

  var data = params.data;
  if (!data) {
    try {
      data = get_data()
    } catch (e) {
      debug(e);
      return;
    }
  }

  var key = get_key();
  if (params.new_id) {
    delete data['key'];
  } else if (key) {
    data['key'] = key;
  }

  // Short Circuit should nothing have changed and not forced
  var save_data = JSON.stringify(data)
  if (last_save_data && save_data == last_save_data && !params.force) {
    if (params.notify) {
      $("#side-bar").overhang({
          custom: true,
          primary: "#444444",
          accent: "#222222",
          message: params.notify_message,
      });
    }
    if (params.callback) {
      params.callback_args.unshift(key)
      params.callback(...params.callback_args);
    }

    debug("save data matches, doing nothing");
    return
  }

  // Save our current_page if valid
  // If we have a window ref select that tab
  if (window.location.hash) {
    var tab = $("#side-nav a[href$=\"" + window.location.hash + "\"]");
    if (tab) {
      data['current_page'] = window.location.hash;
    }
  }

  document_update_title()

  // construct an HTTP request
  $.post(
    "save.php",
    save_data,
    function(data) {
      if (data) {
        last_save_data = save_data;
        if (params.notify) {
          $("#side-bar").overhang({
              custom: true,
              primary: "#444444",
              accent: "#222222",
              message: params.notify_message,
          });
        }
        if (params.update_id) {
          // Update without page reload
          var update = get_key() != data;
          if (update) {
            var url = kneeboard_root + data;
            if (debug_level) { url += '?debug=1'; }
            url += window.location.hash;

            debug("Updating state: " + url);
            window.history.replaceState(data, '', url);
            $(document).trigger("key-updated");
          }
        }
        if (params.callback) {
          params.callback_args.unshift(data)
          params.callback(...params.callback_args);
        }
      } else {
        alert("failed to save");
      }
    },
  );
}

var getUrlParameter = function getUrlParameter(sParam) {
  var sPageURL = window.location.search.substring(1),
  sURLVariables = sPageURL.split('&'),
  sParameterName,
    i;

  for (i = 0; i < sURLVariables.length; i++) {
    sParameterName = sURLVariables[i].split('=');

    if (sParameterName[0] === sParam) {
      return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
    }
  }
};

// Load from data provided by save()
function load(data) {
  if (!data) { return; }

  // We don't want saves() to trigger: This could cause a save to occur prior
  // to loading subsequent pages and result in data loss
  disable_save = true;

  ['data', 'flight', 'mission', 'package', 'loadout', 'deparr', 'waypoint', 'comms', 'threats', 'notes', 'download'].forEach(function(section) {
    if (section in data) {
      window[section+"_load"](data[section])
    }
  });

  disable_save = false;
}


function xml_createNSResolver(document) {
  var ns = {};
  if (document.documentElement) {
    var attrs = document.documentElement.attributes;
    for (var i = 0; i < attrs.length; ++i) {
      if (attrs[i].name.indexOf("xmlns:") == 0) {
        ns[attrs[i].name.substring(6)] = attrs[i].value;
      }
    }
  }
  var nsResolver = function nsResolver(prefix) {
    return ns[prefix] || null;
  };
  nsResolver.lookupNamespaceURI = nsResolver;
  return nsResolver;
}
