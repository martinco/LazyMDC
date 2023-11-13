
function theatre_populate_airfield(id, af_data, overrides, new_item) {

  overrides = overrides || {};
  new_item = new_item || false;

  var tbody = $('#theatre-edit-airfield-table > tbody');

  var row = `
    <tr data-id="${id}">
      <td class="border-right-0">`;

  if (new_item) {
    row += '<span style="color:green" data-feather="plus-circle"></span>';
  }

  row += `</td>
      <td class="border-left-0 text-right" data-base="${id}">${id}</td>
      <td data-base="${af_data.dcs_name}" class="input-container"><input class="input-full" value="${af_data.dcs_name}"></td>`;
  
  
  row += `${af_data.dcs_name}
        </td>
      <td class="input-container"><input class="input-full" value="${overrides.display_name || ""}"></td>
      <td class="input-container"><input class="input-full" value="${overrides.icao || ""}"></td>`;

  // if we are an override, data-base
  if (overrides.lat || overrides.lon) {
    // we now treat either as an override
    let lat = overrides.lat ? overrides.lat : af_data.lat;
    let lon = overrides.lon ? overrides.lon : af_data.lon;

    row += `
      <td class="coord coord-ctrl ${overrides.lat ? "modified" : ""}" onClick="coordinate_input(this, 5);"
        data-base-lat="${af_data.lat}" data-base-lon="${af_data.lon}" 
        data-lat="${lat}" data-lon="${lon}"></td>
      <td class="coord ${overrides.lon ? "modified" : ""}" onClick="coordinate_input(this, 5);"></td>`;

  } else {
    row += `
      <td class="coord coord-ctrl" onClick="coordinate_input(this, 5);"
        data-base-lat="${af_data.lat}" data-base-lon="${af_data.lon}" 
        data-lat="${af_data.lat}" data-lon="${af_data.lon}"></td>
      <td class="coord" onClick="coordinate_input(this, 5);"></td>`;
  }

  if (overrides.alt) {
    row += `<td class="input-container"><input type=number class="input-full nospin text-right modified" data-base="${af_data.alt}" value="${overrides.alt}"></td>`;
  } else {
    row += `<td class="input-container"><input type=number class="input-full nospin text-right" data-base="${af_data.alt}" value="${af_data.alt}"></td>`;
  }

  row += `
      <td class="input-container"><input class="input-full freq" value="${overrides.uhf || ""}"></td>
      <td class="input-container"><input class="input-full freq" value="${overrides.vhf || ""}"></td>
      <td class="input-container border-right-0"><input class="input-full tcn" value="${overrides.tcn || ""}"></td>
      <td class="input-container border-left-0">
        <button type="button" class="btn btn-link btn-sm p-0 pt-0.5" onclick='$(this).closest("tr").remove();'>
          <i data-feather="delete"></i>
        </button>
    </tr>`;
  var elem = $(row);
  tbody.append(elem);

  // Process coordinates
  elem.find('.coord-ctrl').each(function(idx, elem) { coords.format_td(elem); });

  feather.replace();
}

function theatre_populate_edit(theatre_id) {

  // called from theatre_edit with the theatre (DCS) name, the data from which
  // can be pulled from theatres global
  
  api_get('theatres/' + theatre_id + '?merged=0', function(data) {

    // If we have a child already; replace
    $('#side-nav a[href="#theatres-edit"]').remove();

    var nn = nav_item('theatres-edit', data.display_name, 'map-pin', 'theatres/'+data.id, 1);
    $('#side-nav a[href="#theatres"]').parent().after(nn);

    // Update icon
    feather.replace();

    // Populate the content 

    var container = $('#theatres-edit');

    $("#theatre-edit-title").html(data['display_name']);
    $("#theatre-edit-display-name").val(data['display_name']);

    $("#theatre-edit-theatre-id").val(theatre_id);
    $("#theatre-edit-theatre-name").val(data.name);

    $("#theatre-edit-bullseye-table > tbody > tr").each(function(a, tr) {
      if (tr.cells.length) {
        var k = tr.cells[0].getAttribute('data-base');
        if (k in data.base.bullseye) {
          var override = getDict(data.overrides, 'bullseye', k);

          if(override.name) { $(tr.cells[1]).addClass("modified"); }
          tr.cells[1].firstChild.value = override.name || data.base.bullseye[k].name;
          tr.cells[1].firstChild.setAttribute("data-base", data.base.bullseye[k].name);

          if(override.lat) {
            $(tr.cells[2]).addClass("modified"); 
          }

          if (override.lon) {
            $(tr.cells[3]).addClass("modified"); 
          }

          tr.cells[2].setAttribute("data-lat", override.lat || data.base.bullseye[k].lat);
          tr.cells[2].setAttribute("data-base-lat", data.base.bullseye[k].lat);

          tr.cells[2].setAttribute("data-lon", override.lon || data.base.bullseye[k].lon);
          tr.cells[2].setAttribute("data-base-lon", data.base.bullseye[k].lon);

          coords.format_td(tr.cells[2]);
        }
      }
    });

    $('#theatre-edit-airfield-table').data('next-id', data.next_airfield_id);
    if (data.base.airfields) {
      var tbody = $('#theatre-edit-airfield-table > tbody');
      tbody.empty();

      var sorted_airfields = Object.entries(data.base.airfields).sort(
          (a,b) => a[1].dcs_name.toLowerCase().localeCompare(b[1].dcs_name.toLowerCase()));

      for (const [id, af_data] of sorted_airfields) {
        theatre_populate_airfield(id, af_data, getDict(data.overrides, 'airfields', id));
      }
    }

    // And switch to tab
    $('#side-nav a[href="#theatres-edit"]').tab('show');
  })
  
  // Lastly we update all our coordinate display formats
  //flight_update_coord();

}

function theatre_edit(e) {
  // Called when the user clicks the theatre to edit
  theatre_populate_edit($(e.currentTarget).data('id'));
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
      var k = tr.cells[0].getAttribute('data-base');
      if (k in data.bullseye) {
        var bulls = data.bullseye[k];

        // Bulls Name
        tr.cells[1].firstChild.setAttribute("data-base", bulls.name);
        var current_value = get_elem_data(tr.cells[1]);
        if (current_value != bulls.name) { $(tr.cells[1]).addClass("modified"); }

        tr.cells[2].setAttribute("data-base-lat", bulls.lat);
        tr.cells[2].setAttribute("data-base-lon", bulls.lon);

        let latlon = get_elem_data(tr.cells[2]);
        if (latlon[0] != bulls.lat) { $(tr.cells[2]).addClass("modified"); } 
        if (latlon[1] != bulls.lon) { $(tr.cells[3]).addClass("modified"); }
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
      var af_name = tr.cells[2].getAttribute('data-base');
      if (af_name in data.airfields) {
        // We have a match, so just update lat, lon, alt if need be
        matched[af_name] = true;
      } else {
        tr.cells[0].innerHTML = '<span style="color:red" data-feather="alert-triangle"></span>';

        // Wipe clear data-base so it shows up on modified and reads the value
        tr.cells[2].setAttribute('data-base', '');
        tr.cells[2].firstChild.value = "";

        // Set Display name to the old name
        if (!tr.cells[3].firstChild.value) {
          tr.cells[3].firstChild.value = af_name;
        }

        update_feather = true;
      }
    }
  });

  // Now add any airfields that have been added
  for (const [dcs_name, af_data] of Object.entries(data.airfields)) {
    if (matched[dcs_name]) { continue; }
    af_data['dcs_name'] = dcs_name;
    theatre_populate_airfield('', af_data, {}, true);
  }
  
  if (update_feather) {
    feather.replace();
  }

  if (typeof(myd) === "undefined") {
    myd = data;
  }
}


function theatre_add_row(id, display_name) {

  var row = $(`
    <tr data-id="${id}">
      <td class="border-right-0">${display_name}</td>
      <td class="text-center border-left-0">
        <button class="btn btn-sm btn-primary" type="button")'>Edit</button>
      </td>
    </tr>
  `);

  row.on('click', theatre_edit);

  $('#theatres-table tbody').append(row);
}


function theatres_refresh(elems) {

  console.log("theatres_refresh", elems);

  if (elems && elems.length > 0) {
    // We have a child, so ignore this page, and move to the next page, which
    // is an edit
    theatre_populate_edit(elems[0]);
    return
  }

  // Remove child
  $('#side-nav a[href="#theatres-edit"]').remove();

  // Load up theatres and update the table
  api_get('theatres?merged=0', function(res) {
    
    $('#theatres-table tbody').empty();

    for (const [theatre, data] of Object.entries(res)) {
      theatre_add_row(data['id'], data['display_name']);
    }

    // Ensure our theatres tab is selected
    $('#side-nav a[href="#theatres"]').tab('show');

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
  var mode = dlg.data('mode');

  // Required etc. is ok, but not nessesarilly things like the JSON
  form[0].classList.add('was-validated');
  if (form[0].checkValidity() !== true) {
    return;
  }

  // Submitted data
  var src = JSON.parse($('#theatre-add-json').val());

  // On update we just pass it on
  if (mode == "update") {
    var data = {
      'data': src,
    }
    theatre_update_data(data.data);
    dlg.modal('hide');
    return;
  }

  // Shouldn't be anything else, just close and do nothing
  if (mode != "new") {
    dlg.modal('hide');
    return;
  }

  // However if we're new, we need to generate airfield indexes to allow for
  // DCS changing the names of airfields without all our data getting messed up

  var data = {
    'data': {
      'airfields': {},
      'bullseye': {},
      'next_airfield': 1,
      'theatre': src.theatre,
    }
  }

  var airfield_id = 1;
  for (const [dcs_name, af_data] of Object.entries(src.airfields)) {
    af_data['dcs_name'] = dcs_name;
    data.data.airfields[airfield_id++] = af_data
  };

  // Store next ID
  data.data.next_airfield = airfield_id;

  // Bullseye's come upper case so downcase them
  for (const [bulls_side, bulls_data] of Object.entries(src.bullseye)) {
    data.data.bullseye[bulls_side.toLowerCase()] = bulls_data;
  };

  // Display name defaults to theatre if not set
  data['display_name'] = $('#theatre-add-display-name').val() || src.theatre;

  api_post(
    'theatres',
    data,
    function(response) {
      console.log(response);

      // Refresh content page
      update_content();

      dlg.modal('hide');
    });
  return

});

function flight_update_coord() {
  $('.coord-ctrl').each(function(idx, td) {
    coords.format_td(td);
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
      var data = get_modified_row_data(tr, ["-", "name", "lat", "-"]);
      console.log(data);
      var name = tr.cells[0].getAttribute('data-base');
      if (Object.keys(data).length) {
        if (!overrides.bullseye) { overrides.bullseye = {} };
        overrides.bullseye[name] = data;
      }

      // base 
      var data = get_base_row_data(tr, ["side", "name", "lat", "-"]);
      var name = data['side'];
      delete(data['side']);
      if (Object.keys(data).length) {
        if (!base.bullseye) { base.bullseye = {} };
        base.bullseye[name] = data;
      }
    }
  });

  // Airfields
  var next_id = parseInt($('#theatre-edit-airfield-table').data('next-id'));
  $("#theatre-edit-airfield-table > tbody > tr").each(function(a, tr) {
    if (tr.cells.length) {

      // Overrides
      var data = get_modified_row_data(tr, ["-", "id", "dcs_name", "display_name", "icao", "lat", "-", "alt", "uhf", "vhf", "tcn"]);
      var id = $(tr).data('id');
      if (!id) {
        id = next_id++;
      }

      // Store DCS Name
      dcs_name = data['dcs_name']
      if (!dcs_name) {
        return;
      }

      // We don't want this in overrides
      delete(data['dcs_name']);

      if (Object.keys(data).length) {
        if (!overrides.airfields) { overrides.airfields = {} };
        overrides.airfields[id] = data;
      }

      // Base values (in case of update)
      var data = get_base_row_data(tr, ["-", "-", "-", "-", "-", "lat", "-", "alt", "-", "-"]);
      data['dcs_name'] = dcs_name;

      if (Object.keys(data).length) {
        if (!base.airfields) { base.airfields = {} };
        base.airfields[id] = data;
      }
    }
  });

  data = {
    'display_name': $('#theatre-edit-display-name').val(),
    'next_airfield_id': next_id,
    'theatre_id': theatre_id,
    'theatre': theatre,
    'overrides': overrides,
    'base': base,
  }

  api_post(
    'theatres/' + theatre_id,
    data, 
    function(data) {
      console.log("SAVED");
      // Refresh displayed content
      update_content();
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

