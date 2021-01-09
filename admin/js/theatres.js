
function getDict(obj) {
  for (var i = 1; i < arguments.length; i++) {
    if (!obj.hasOwnProperty(arguments[i])) {
      return {};
    }
    obj = obj[arguments[i]];
  }
  return obj;
}

function theatre_populate_airfield(dcs_name, af_data, overrides, new_item) {

  overrides = overrides || {};
  new_item = new_item || false;

  var tbody = $('#theatre-edit-airfield-table > tbody');

  var row = `
    <tr>
      <td data-base="${dcs_name}">`;
  
  
  if (new_item) {
    row += '<span style="color:green" data-feather="plus-circle"></span>';
  }
  
  row += `${dcs_name}
        </td>
      <td class="input-container"><input class="input-full" value="${overrides.display_name || ""}"></td>`;

  // if we are an override, data-base
  if (overrides.lat) {
    row += `<td class="coord modified" onClick="coordinate_input(this, 2);" data-base="${af_data.lat}"  data-raw="${overrides.lat}"></td>`;
  } else {
    row += `<td class="coord" onClick="coordinate_input(this, 2);" data-base="${af_data.lat}"  data-raw="${af_data.lat}"></td>`;
  }

  if (overrides.lon) {
    row += `<td class="coord coord-lon modified" onClick="coordinate_input(this, 2);" data-base="${af_data.lon}" data-raw="${overrides.lon}"></td>`;
  } else {
    row += `<td class="coord coord-lon" onClick="coordinate_input(this, 2);" data-base="${af_data.lon}" data-raw="${af_data.lon}"></td>`;
  }

  if (overrides.alt) {
    row += `<td class="input-container"><input type=number class="input-full nospin text-right modified" data-base="${af_data.alt}" value="${overrides.alt}"></td>`;
  } else {
    row += `<td class="input-container"><input type=number class="input-full nospin text-right" data-base="${af_data.alt}" value="${af_data.alt}"></td>`;
  }

  row += `
      <td class="input-container"><input class="input-full freq" value="${overrides.uhf || ""}"></td>
      <td class="input-container"><input class="input-full freq" value="${overrides.vhf || ""}"></td>
      <td class="input-container"><input class="input-full tcn" value="${overrides.tcn || ""}"></td>
    </tr>`;


  var elem = $(row);
  tbody.append(elem);

  // Process coordinates
  elem.find('.coord').each(function(idx, elem) { coordinate_display_format(elem); });

  if (new_item) {
    feather.replace();
  }
}

function theatre_populate_edit(theatre_id, theatre_name) {
  // called from theatre_edit with the theatre (DCS) name, the data from which
  // can be pulled from theatres global


  var container = $('#theatres-edit');

  var data = theatres[theatre_name];

  $("#theatre-edit-display-name").val(data['display_name']);

  $("#theatre-edit-theatre-id").val(theatre_id);
  $("#theatre-edit-theatre-name").val(theatre_name);

  $("#theatre-edit-bullseye-table > tbody > tr").each(function(a, tr) {
    if (tr.cells.length) {
      var k = tr.cells[0].innerHTML;
      if (k in data.base.bullseye) {
        var override = getDict(data.overrides, 'bullseye', k);

        if(override.name) { $(tr.cells[1]).addClass("modified"); }
        tr.cells[1].firstChild.value = override.name || data.base.bullseye[k].name;
        tr.cells[1].firstChild.setAttribute("data-base", data.base.bullseye[k].name);

        if(override.lat) { $(tr.cells[2]).addClass("modified"); }
        tr.cells[2].setAttribute("data-raw", override.lat || data.base.bullseye[k].lat);
        tr.cells[2].setAttribute("data-base", data.base.bullseye[k].lat);
        coordinate_display_format(tr.cells[2]);

        if(override.lon) { $(tr.cells[2]).addClass("modified"); }
        tr.cells[3].setAttribute("data-raw", override.lon || data.base.bullseye[k].lon);
        tr.cells[3].setAttribute("data-base", data.base.bullseye[k].lon);
        coordinate_display_format(tr.cells[3]);
      }
    }
  });

  if (data.base.airfields) {
    var tbody = $('#theatre-edit-airfield-table > tbody');
    tbody.empty();
    for (const [dcs_name, af_data] of Object.entries(data.base.airfields)) {
      theatre_populate_airfield(dcs_name, af_data, getDict(data.overrides, 'airfields', dcs_name));
    }
  }

  // Lastly we update all our coordinate display formats
  //flight_update_coord();

}

function theatre_edit(e) {
  // Called when the user clicks the theatre to edit

  var row = $(e.currentTarget);

  // If we have a child already; replace
  $('#side-nav a[href="#theatres-edit"]').remove();

  var nn = nav_item('theatres-edit', row[0].cells[0].innerHTML, 'map-pin', 1);
  $('#side-nav a[href="#theatres"]').parent().after(nn);

  // Update icon
  feather.replace();

  theatre_populate_edit(row.data('id'), row.data('theatre'));

  // And switch to tab
  $('#side-nav a[href="#theatres-edit"]').tab('show');

}


function theatre_add() {

  // Reset the form
  var form = $('#theatre-add-form');
  form[0].reset();
  form[0].classList.remove('was-validated');

  $('#theatre-add-dialog-title').html('Add new Theatre');
  $('#theatre-add-display-name-div').show();

  var dlg = $('#theatre-add-dialog');

  dlg.data({
    'mode': 'new',
  })

  // Show the dlg
  dlg.modal({
    backdrop: 'static',
  });

}

function theatre_update() {

  // Reset the form
  var form = $('#theatre-add-form');
  form[0].reset();
  form[0].classList.remove('was-validated');

  var theatre_id = $("#theatre-edit-theatre-id").val();
  var theatre = $("#theatre-edit-theatre-name").val();

  $('#theatre-add-dialog-title').html('Update ' + theatre);
  $('#theatre-add-display-name-div').hide();

  var dlg = $('#theatre-add-dialog');

  dlg.data({
    'mode': 'update',
    'theatre': theatre,
  })

  // Show the dlg
  dlg.modal({
    backdrop: 'static',
  });

}

function theatre_update_data(data) {
  // This is called with new base data; we don't want to change data so we'll
  // set the new base values, but keep the existing values and mark them as
  // modified if need be, the hover state will show the original value

  $("#theatre-edit-bullseye-table > tbody > tr").each(function(a, tr) {
    if (tr.cells.length) {
      var k = tr.cells[0].innerHTML;
      if (k in data.bullseye) {
        var bulls = data.bullseye[k];

        // Bulls Name
        tr.cells[1].firstChild.setAttribute("data-base", bulls.name);
        var current_value = get_elem_data(tr.cells[1]);
        if (current_value != bulls.name) {
          $(tr.cells[1]).addClass("modified");
        }

        tr.cells[2].setAttribute("data-base", bulls.lat);
        var current_value = get_elem_data(tr.cells[2]);
        if (current_value != bulls.lat) {
          $(tr.cells[2]).addClass("modified");
        }

        tr.cells[3].setAttribute("data-base", bulls.lon);
        var current_value = get_elem_data(tr.cells[3]);
        if (current_value != bulls.lon) {
          $(tr.cells[3]).addClass("modified");
        }
      }
    }
  });

  // For theatres, we go through the table, unset data-base for any item that
  // no longer resides in DCS (adding a warning the entire row as it'll be
  // deleted) 

  var matched = {};
  var update_feather = false;

  $("#theatre-edit-airfield-table > tbody > tr").each(function(a, tr) {
    if (tr.cells.length) {
      // if no match, remove 
      var af_name = tr.cells[0].getAttribute('data-base');
      if (af_name in data.airfields) {
        // We have a match, so just update lat, lon, alt if need be
        matched[af_name] = true;
      } else {
        tr.cells[0].removeAttribute('data-base');
        tr.cells[0].innerHTML = '<span style="color:red" data-feather="alert-triangle"></span>WILL BE REMOVED';
        tr.cells[1].firstChild.value = af_name;
        update_feather = true;
      }
    }
  });

  // Now add any airfields that have been added
  for (const [dcs_name, af_data] of Object.entries(data.airfields)) {
    if (matched[dcs_name]) { continue; }
    theatre_populate_airfield(dcs_name, af_data, {}, true);
  }
  
  if (update_feather) {
    feather.replace();
  }

  if (typeof(myd) === "undefined") {
    myd = data;
  }
}


function theatre_add_row(id, theatre, display_name) {

  var row = $(`
    <tr data-id="${id}" data-theatre="${theatre}">
      <td>${display_name}</td>
      <td class="text-center">
        <button class="btn btn-sm btn-primary" type="button")'>Edit</button>
      </td>
    </tr>
  `);

  row.on('click', theatre_edit);

  $('#theatres-table tbody').append(row);
}


function theatres_refresh() {

  // Remove child
  $('#side-nav a[href="#theatres-edit"]').remove();

  // Load up theatres and update the table
  api_get('theatres?merged=0', function(res) {
    
    // Save theatre data, and build our table of theatres, with an edit button
    theatres = res;

    $('#theatres-table tbody').empty();

    for (const [theatre, data] of Object.entries(theatres)) {
      theatre_add_row(data['id'], theatre, data['display_name']);
    }

    // If we're on an edit page, refresh the data
    if (window.location.hash == "#theatres-edit") {
      var theatre_id = $("#theatre-edit-theatre-id").val();
      var theatre = $("#theatre-edit-theatre-name").val();
      theatre_populate_edit(theatre_id, theatre);
    }

  });
}

// Theatre name validity
$('#theatre-add-display-name').on('change', function(e) {
  var error = '';
  var name = $(this).val();

  if (Object.values(theatres).map(function(x) { return x.display_name } ).includes(name)) {
    error = 'A theatre of this name already exists, please update that instead'
  }

  // Set validity
  this.setCustomValidity(error);
  var inval = $(this).parent().find('div.invalid-feedback')[0]
  if (inval) {
    inval.innerHTML = error;
  }
})

// Theatre add JSON validity
$('#theatre-add-json').on('change', function(e) {
    var error = '';
    var json = null;

    // If we're updating then theatre needs to also match the current value
    var dlg = $('#theatre-add-dialog');
    var mode = dlg.data('mode');

    try {
      json = JSON.parse($(this).val());
    } catch {}

    if(!json) {
      error = 'This does not appear to be valid JSON, please verify you have copied in the contents of the file'
    } else if (!json.theatre) {
      error = 'Theatre not in the JSON, please verify you copied all the content'
    } else if (mode == "new" && theatres[json.theatre]) {
      error = 'A theatre already exists with that name, please update the existing theatre';
    } else if (mode == "update" && dlg.data('theatre') != json.theatre) {
      error = 'The supplied JSON is not for ' + dlg.data('theatre');
    }

    // Set validity
    this.setCustomValidity(error);

    var inval = $(this).parent().find('div.invalid-feedback')[0]
    if (inval) {
      $(inval).addClass("d-block");
      inval.innerHTML = error;
    }
});

$('#theatre-add-button').click(theatre_add);

$('#theatre-add-submit').click(function() {
  var dlg = $('#theatre-add-dialog'); 
  var form = $('#theatre-add-form');

  // Required etc. is ok, but not nessesarilly things like the JSON
  form[0].classList.add('was-validated');
  if (form[0].checkValidity() !== true) {
    return;
  }

  var data = {
    'data': JSON.parse($('#theatre-add-json').val()),
  }

  // Display name defaults to theatre if not set
  data['display_name'] = $('#theatre-add-display-name').val() || data.data.theatre;

  // If it's add, we submit / close
  var mode = dlg.data('mode');
  console.log(mode);

  if (mode == "new") {
    api_post(
      'theatres/create',
      data,
      function(response) {
        console.log(response);

        // Refresh our list, and close the dlg
        theatres_refresh();

        dlg.modal('hide');
      });
    return
  }

  if (mode == "update") {
    theatre_update_data(data.data);
    dlg.modal('hide');
  }

});

function flight_update_coord() {
  $('.coord').each(function(idx, td) {
    coordinate_display_format(td);
  });
}

function theatres_save() {

  // Which to update
  var theatre = $('#theatre-edit-theatre-name').val();
  var theatre_id = parseInt($('#theatre-edit-theatre-id').val());

  // Destination
  var overrides = {};
  var base = {
    'theatre': theatre,
  };

  // Get the source data
  var data = theatres[theatre];

  // Display Name
  var dname = $('#theatre-edit-display-name').val();
  if (dname != theatre) {
    overrides.display_name = dname
  }

  // Bullseyes
  $("#theatre-edit-bullseye-table > tbody > tr").each(function(a, tr) {
    if (tr.cells.length) {

      // override
      var data = get_modified_row_data(tr, ["-", "name", "lat", "lon"]);
      var name = tr.cells[0].getAttribute('data-base');
      if (Object.keys(data).length) {
        if (!overrides.bullseye) { overrides.bullseye = {} };
        overrides.bullseye[name] = data;
      }

      // base 
      var data = get_base_row_data(tr, ["side", "name", "lat", "lon"]);
      var name = data['side'];
      delete(data['side']);
      if (Object.keys(data).length) {
        if (!base.bullseye) { base.bullseye = {} };
        base.bullseye[name] = data;
      }
    }
  });

  // Airfields
  $("#theatre-edit-airfield-table > tbody > tr").each(function(a, tr) {
    if (tr.cells.length) {

      // Overrides
      var data = get_modified_row_data(tr, ["-", "display_name", "lat", "lon", "alt", "uhf", "vhf", "tcn"]);

      // data-base might be empty if we're removing an item from DCS on update
      var name = tr.cells[0].getAttribute('data-base');
      if (!name) {
        console.log("Skippy", tr)
        return
      }
      delete(data['dcs_name']);

      if (Object.keys(data).length) {
        if (!overrides.airfields) { overrides.airfields = {} };
        overrides.airfields[name] = data;
      }

      // Base values (in case of update)
      var data = get_base_row_data(tr, ["dcs_name", "-", "lat", "lon", "alt", "-", "-"]);
      var name = data['dcs_name'];
      delete(data['dcs_name']);

      if (name && Object.keys(data).length) {
        if (!base.airfields) { base.airfields = {} };
        base.airfields[name] = data;
      }

    }
  });

  data = {
    'display_name': $('#theatre-edit-display-name').val(),
    'theatre_id': theatre_id,
    'theatre': theatre,
    'overrides': overrides,
    'base': base,
  }

  api_post(
    'theatres/update',
    data, 
    function(data) {
      console.log("SAVED");
      // Refresh saved data
      theatres_refresh();
    });

}

// Any time we move away from theatres-edit, we remove the nav
$('#theatre-edit-save').click(theatres_save);
$('#theatre-edit-update').click(theatre_update);

// Any time we move away from theatres-edit, we remove the nav
$(document).on('hide.bs.tab', 'a[href="#theatres-edit"]', function(x) {
  $('#side-nav a[href="#theatres-edit"]').remove();
});

$("input[name=flight-coord]").change(flight_update_coord)
$("#flight-coord-decimals").change(flight_update_coord)

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
      if (attr = elem.data('base')) {
        elem[0].setAttribute('data-raw', attr);
        root.removeClass('modified');

        // Update display value
        if (elem.hasClass("coord")) {
          coordinate_display_format(elem[0]);
        } else {
          var tag = elem[0].tagName;
          if (tag == "INPUT") {
            elem.val(attr);
          }
        }
      }

    }
  },
  items: {
    "reset": {name: "reset", icon: "copy"},
  }
});
