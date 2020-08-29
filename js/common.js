
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
        return tinyMCE.editors[child.attr('id')].getContent()
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

  var float_val = parseFloat(value).toFixed(3)
  var type = $("#flight-airframe").val();
  var mission = $('#data-mission').val();

  try {
    return mission_data[mission]['presets'][type][float_val] || "M"
  } catch {
    return "M"
  }
}

function get_key() {
  var mdc_key = window.location.pathname.replace(kneeboard_root + '/', '')
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

function save(data = null, new_id = false, update_id=true, notify = false, cb = null, cb_args = []) {

  // As a simple sanity check we ensure we have mission ID as bare minimum to save
  if (!$('#mission-id').val()) {
    return
  }

  if (!data) {
    data = get_data()
  }

  var key = get_key();
  if(key && !new_id) {
    data['key'] = key;
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
    JSON.stringify(data),
    function(data) {
      if (data) {
        if (notify) {
          $("#side-bar").overhang({
              custom: true,
              primary: "#444444",
              accent: "#222222",
              message: "Kneeboard Saved"
          });
        }
        if (update_id) {
          // Update without page reload
          window.history.replaceState(data, '', kneeboard_root + "/" + data + window.location.hash );
        }
        if (cb) {
          cb_args.unshift(data)
          cb(...cb_args);
        }
      } else {
        alert("failed to save");
      }
    },
  );
}

// Load from data provided by save()
function load(data) {
  if (!data) { return; }
  ['data', 'mission', 'flight', 'package', 'loadout', 'deparr', 'waypoint', 'comms', 'threats', 'notes', 'download'].forEach(function(section) {
    if (section in data) {
      window[section+"_load"](data[section])
    }
  });
}

