
var last_save_data = null


function getDictInit(obj) {
  if (obj === undefined) {
    return;
  }
  for (var i = 1; i < arguments.length; i++) {
    if (!obj.hasOwnProperty(arguments[i])) {
      obj[arguments[i]] = {}
    }
    obj = obj[arguments[i]];
  }
  return obj;
}

function update_presets() {
  $("input.freq-preset").each(function(idx, elem) {
    var elem = $(elem)
    var offset = elem.parent().index();
    var row = elem.closest('tr')[0];
    row.cells[offset+1].innerHTML = lookup_preset(elem.val())
  });
}

function getDict(obj) {
  if (obj === undefined) {
    return {};
  }
  for (var i = 1; i < arguments.length; i++) {
    if (!obj.hasOwnProperty(arguments[i])) {
      return {};
    }
    obj = obj[arguments[i]];
  }
  return obj;
}


function get_elem_data(elem) {
  // If we have children (e.g. input), use that value
  if (elem.children.length) {

    child = $(elem.children[0])

    // If it's an MCE text area just grab the HTML content
    if (child.hasClass('mce')) {
      return tinymce.editors[child.attr('id')].getContent()
    }

    // If our td holds data-lat and data-lon, return those
    let lat = child[0].getAttribute('data-lat');
    if (lat) {
      return [lat, child[0].getAttribute('data-lon')]
    }

    dd = child[0].getAttribute('data-raw')
    if (dd) {
      return dd
    }

    // Determine the value of the item
    var val = child[0].value;
    if (child.prop('type') == "checkbox") {
      val = child.is(":checked") ? 1 : 0;
    }

    return val;
  }

  // If our td holds data-lat and data-lon, return those
  let lat = elem.getAttribute('data-lat');
  if (lat) {
    return [lat, elem.getAttribute('data-lon')]
  }

  // If our TD holds raw-data, use that
  dd = elem.getAttribute('data-raw')
  if (dd) {
    return dd
  }

  // Finally, just use what's in the cell
  return elem.innerHTML
}

// Get a table row data, either as an array, or dict if provided headings
function get_row_data(row, headings) {
  if (!row) {
    return {}
  }

  var data = Array.prototype.map.call(row.querySelectorAll('td, th'), function(td) {
    return get_elem_data(td)
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

function freq_to_obj(value) {

  var float_val = parseFloat(value);
  if (isNaN(float_val)) { return null }

  var float_str = float_val.toFixed(3)
  var code = lookup_freq_code(float_str);
  var pst = lookup_preset(float_str);

  v = {
    'value': float_str,
  }
  if (code) { v['code'] = code; }
  if (pst) { v['pst'] = pst; }

  return v
}


function lookup_preset(value) {

  if (value === "" || isNaN(value) || !mission_data) {
    return ""
  }

  var float_val = parseFloat(value);
  var float_str = float_val.toFixed(3)
  let preset = presets?.lookups?.[float_str];

  if (preset) { return preset; }

  var type = $("#flight-airframe").val();

  // If that fails, it's manual 
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
  } else if (type == 'AH-64D') {
    if (float_val >= 225 && float_val < 400) {
      return "U-M";
    }
    if (float_val >= 108 && float_val < 152) {
      return "V-M"; // VOR (108-118) / ATC AM (118-137) / Also upto 151.9
    }
    if (float_val >= 30 && float_val < 88) {
      return "F-M"; // VHF FM
    }
    return "-";
  }

  return "M";
}

function lookup_freq_code(freq) {
  if (!freq) { return null }

  var float_val = parseFloat(freq);
  var float_str = float_val.toFixed(3);

  var lookups = getDict(squadron_data, 'freqs_lookup')
  return lookups[float_str];

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

function number_formatter(field, precision) {
  precision = precision || 0;
  field.addEventListener('keydown', function(e) {
    // With numbers, we change the , to a . and only allow 
    var key = e.keyCode ? e.keyCode : e.which;
    if (!(
        // unmodified 0-9
        (key >= 48 && key <= 57 && !(e.shiftKey || e.altKey))
        // unmodified decimal point, comma or period where precision isn't 0
        || ([110, 188, 190].indexOf(key) !== -1 && !(precision == 0))
        // backspace, tab, enter, esc, left arrow, right arrow, del, f5
        || ([8, 9, 13, 27, 37, 39, 46, 116].indexOf(key) !== -1)
        // ctrl + a
        || (key == 65 && e.ctrlKey)
    )) {
      e.preventDefault();
    }
  });

  field.addEventListener('change', function(e) {
    // Format correctly
    var value = parseFloat(e.target.value.replace(',', '.'));
    e.target.value = value.toFixed(precision);
  });
}

// From: https://stackoverflow.com/questions/16167581/sort-object-properties-and-json-stringify
function JSONStringifyOrder(obj) {
  var allKeys = [];
  JSON.stringify(obj, function(key, value) { allKeys.push(key); return value; })
  allKeys.sort();
  return JSON.stringify(obj, allKeys);
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

  ['data', 'mission', 'presets', 'flight', 'package', 'loadout', 'profiles', 'deparr', 'waypoint', 'comms', 'threats', 'notes', 'download'].forEach(function(data) {
    debug("collecting: " + data);
    ret[data] = window[data+"_export"]()
  });

  return ret
}

function document_update_title() {

  var mission_id = $('#mission-id').val();
  var title = "MDCv2:"

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


// index of load loop
load_loop = 0;

// Load from data provided by save()
function load(data, callback) {

  // We don't want saves() to trigger: This could cause a save to occur prior
  // to loading subsequent pages and result in data loss
  disable_save = true;

  // As we moved notes from loadout to profiles, make it so for loading older mdcs
  if (data && data.loadout && data.loadout.notes) {
    if (!data.profiles) { data['profiles'] = {}; }
    data.profiles.notes = data.loadout.notes;
  }
  
  // Async, sequential loading of the pages in order
  (function loader(list, callback, current=0) {
    var section = list[current];
    if (section) {
      debug("Loading " + section);
      console.log(`running load: ${section}`);
      window[section+"_load"](data ? data[section] : null, function() {
        console.log(`callback: ${section}`);
        loader(list, callback, current+1);
      });
    } else {
      callback();
    }
  })(['data', 'flight', 'mission', 'presets', 'package', 'loadout', 'profiles', 'deparr', 'waypoint', 'comms', 'threats', 'notes', 'download'], function() {
    disable_save = false;
    callback();
  });
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
