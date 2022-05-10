/*
 * Flight.js: Javascript related to the flight page
 */

$('#flight-add-member').click(function() {
  flightmembers_add();
});

$("#flight-airframe").on('change', function(e) {

  var target = $(e.target);

  // See if we're updating or staying the same
  var old_type = $(e.target).data('previous');
  var new_type = target.val();
  $(e.target).data('previous', new_type);

  if (new_type == old_type) {
    return;
  }

  // Only update the table if we have a type etc.
  if (new_type) {

    // Update table format
    flightmembers_format();

    // Add one for convienience
    flightmembers_add();

    // If we're moving to a different airframe and the route doesn't match,
    // then clear the route data
    var route = target.data('route');
    if (route && route.xml_format == "cf" && route.aircraft != new_type) {
      target.data('route', null);
    }

    // Update default coordinate format
    flight_update_default_coord_format()

    // Update all preset-freqs
    update_presets()
  }

  // Show options
  $('#flight-members-container').toggle(new_type !== null) 

  // Trigger event for other pages
  $('#flight-airframe').trigger('flight-airframe-changed');

  // Save and unlock all components if successful
  save({'callback': function() { $("a.nav-link.disabled").removeClass('disabled'); }})

});

$("input[name=flight-coord]").change(function() {
  let val = $(this).val();

  // When we change to MGRS, default decimals to 5 (1m) resolution
  if (val === "mgrs") {
    $("#flight-coord-decimals").val(5);
    coords.set_display_decimals(5);
  }
  coords.set_display_format(val);
});

$("#flight-coord-decimals").change(function() {
  coords.set_display_decimals($(this).val());
});

function flight_update_default_coord_format() {

  var ac = $("#flight-airframe").val()

  var fmt = "ddm"
  var dp = 3

  if (ac == "F-14B") {
    dp = 1
  } else if (ac == 'AV8BNA') {
    fmt = "dms";
    dp = 0;
  } else if (ac == 'AH-64D') {
    dp = 2;
  }

  // Update Radio / DP
  $('#flight-coord-'+fmt).click();
  $('#flight-coord-decimals').val(dp).change();

  // Set them in case the click/change doesn't trigger nicely
  coords.set_display_format(fmt);
  coords.set_display_decimals(dp);
}

function pilot_autocomplete(input, fields=null, rio=false) {
  $(input).autocomplete({
    source: function(request, response) {
      response(match_key_in_arr(squadron_data.members, "name", request.term, function(x) { x.value = x.name; return x; }))
    },
    minLength: 1,
    select: function( event, ui) {
      var ac = $("#flight-airframe").val();
      if (!rio && fields) {
        event.target.parentElement.parentElement.cells[fields[0]].children[0].value = ui.item.borts && ui.item.borts[ac] ? ui.item.borts[ac] : "";
      }
    }
  });
}

function flightmembers_items(ac) {

  // Returns a list of column headers, widths, and classes

  var cols = [
    ["#", 30, "", "text", ""],
    ["PILOT", 0, "", "text", "^.+$"],
  ];

  if (ac == "F-14B") {
    cols.push(
      ['RIO', 0, "", "text"])
  };

  // F/A-18C additional flight / element comms 
  if (ac == "FA-18C") {
    cols.push(
      ['MIDS A', 60, "text-center", "number"],
      ['MIDS B', 60, "text-center", "number"])
  };


  // The following airframes have a choice between NVGs and HMD
  if (['FA-18C', 'F-16C'].includes(ac)) {
    cols.push(
      ['HM DEVICE', 100, "text-center", "select", ["JHMCS", "NVGs"]],
    )
  } else if (ac == 'Ka-50') {
    cols.push(
      ['HM DEVICE', 100, "text-center", "select", ["HMS", "NVGs"]],
    )
  } else if (ac == 'AV8BNA') {
    cols.push(
      ['HM DEVICE', 100, "text-center", "select", ["NVGs", "Visor"]],
    )
  }

  if (["F-14B", "FA-18C"].includes(ac)) {
    cols.push(
      ['BORT', 50, "text-center", "number"])
  };

  if (ac == "A-10C") {
    cols.push(
      ['GID', 50, "text-center", "number"],
      ['OID', 50, "text-center", "number"])
  };

  if (!["UH-1H", "Ka-50", "Mi-8MT", "AH-64D"].includes(ac)) {
    cols.push(
      ['TCN', 50, "text-center", "text", '^([0-9]+\\s*(X|Y))?$', function(field) { tcn_formatter(field); } ],
    );
  }

  if (!["UH-1H", "Mi-8MT"].includes(ac)) {

    // Whilst the M2k doesn't have a pod, we still include LSR as it can carry
    // GPU-12s and as such it is still required for reference to set the code
    // from the kneeboard
    
    cols.push(
      ['LSR', 50, "text-center", "number"])

    if (!["Ka-50", "F-14B", "M-2000C"].includes(ac)) {
      cols.push(
        ['LSS', 50, "text-center", "number"])
    }
  }

  cols.push(
    ['SQUAWK', 80, "text-center", "number"],
  );

  return cols;

}


function flightmembers_format() {

  var ac = $("#flight-airframe").val()
  var cols = flightmembers_items(ac);

  var header = "<tr>"
  var colgroup = ""
  var last = cols.length - 1;

  for (col in cols) {
    var [title, width, cls, typ, pattern, setup_fnc] = cols[col]

    if (width) {
      colgroup += `<col style="width: ${width}px" />`
    } else {
      colgroup += `<col />`
    }

    if (cls != "") {
      header += `<th scope="col" class="${cls}">${title}</th>`
    } else {
      header += `<th scope="col">${title}</th>`
    }
  }
  header += "</tr>"

  // Add colgroup for delete
  colgroup += `<col style="width: 22px" />`

  $("#flight-members-table > colgroup").empty().append(colgroup);
  $("#flight-members-table > thead").empty().append(header);
  $("#flight-members-table > tbody").empty();

  // Set last head item colspan to 2 to cater for delete
  $("#flight-members-table > thead > tr > th:last").attr('colspan', 2);

}

function flightmembers_del(tr) {

  // Get the column identifiers
  var elems = {};

  var cols = flightmembers_items($("#flight-airframe").val())
  for (col in cols) {
    var [title, width, cls, typ, pattern, setup_fnc] = cols[col]
    elems[title] = col;
  }

  // When we delete a flight member, if it's the last row then we update the
  // LSS - if we delete a mid row flight member, do we renumber the IDs /
  // re-create all the LSS / LSR ?
  
  var rows = $("#flight-members-table > tbody > tr");
  var row_id = rows.length - 1;

  // We only care if more than 2 ship
  if (rows.length > 2 && rows.length % 2 == 0) {
    if (elems['LSS']) {
      rows[row_id - 1].cells[elems['LSS']].firstChild.value = rows[row_id - 3].cells[elems['LSR']].firstChild.value;
    }
  }

  // Allow the previous row to be deleted
  if (row_id > 0) {
    var cells = rows[row_id - 1].cells;
    $(cells[cells.length-1]).html($(`
      <button type="button" class="btn btn-link btn-sm p-0 pt-0.5" onclick='flightmembers_del($(this).closest("tr"));'>
        <i data-feather="delete"></i>
      </button>`));

    feather.replace()
  }

  tr.remove();
}


function flightmembers_add(values) {

  values = values || {}

  // Adds a row to flight-members-table
  var ac = $("#flight-airframe").val()
  var cols = flightmembers_items(ac);
  var html = "<tr>"

  var first_row = $("#flight-members-table > tbody > tr:first")
  var last_row = $("#flight-members-table > tbody > tr:last");
  var elems = {};

  var last_col_id = cols.length - 1;

  for (col in cols) {
    var [title, width, cls, typ, pattern, setup_fnc] = cols[col]
    var value_id = title.toLowerCase()

    elems[title] = col;

    var value = "";
    if (title == "#") {
      value_id = "id"
      value = 1;
    }

    value = values[value_id] || value;

    // Remove right hand border for delete icon to be pretty
    var cls_append = col == last_col_id ? " border-right-0" : ""

    if (typ == "select") {
    
      html += `<td class="input-container${cls_append}">
                <select class="input-full ${cls}">`;

      for (var itm of pattern) {
        html += `<option${itm == value ? ' selected' : ''}>${itm}</option>`;
      }
      html += `</select></td>`;

    } else {

      // Hide spinner as it takes up valuable space
      if (typ == "number") {
        cls += " nospin"
      }

      html += `<td class="input-container${cls_append}"><input type="${typ}" class="input-full ${cls}" value="${value}" `

      if (pattern) {
        html += `pattern="${pattern}" `
      }

      html += `></td>`;
    }

  }

  html += `
      <td class="input-container text-center border-left-0">
        <button type="button" class="btn btn-link btn-sm p-0 pt-0.5" onclick='flightmembers_del($(this).closest("tr"));'>
          <i data-feather="delete"></i>
        </button>
      </td>`;

  html += "</tr>"

  $("#flight-members-table > tbody").append(html);

  var rows = $("#flight-members-table > tbody > tr");
  var row_id = rows.length - 1;
  var new_last_row = $(rows[row_id]);

  // Remove last rows delete
  if (last_row[0]) {
    var cells = last_row[0].cells;
    $(cells[cells.length-1]).empty();
  }

  // Handle Setup Functions
  for (col in cols) {
    var [title, width, cls, typ, pattern, setup_fnc] = cols[col]
    if (setup_fnc) {
      setup_fnc(new_last_row[0].cells[col].firstChild);
    }
  }

  // Manage TCN
  if (first_row[0] != undefined && elems['TCN']) {
    if (!values['tcn']) {
      var first_tcn = first_row[0].cells[elems['TCN']].firstChild.value.match(/^([0-9]+)(.*)/);
      if (first_tcn) {
        new_last_row[0].cells[elems['TCN']].firstChild.value = String(parseInt(first_tcn[1]) + 63) + first_tcn[2];
      }
    }
  }

  // Handle incrementing values
  var incrs = ['#', 'SQUAWK', 'LSR', 'OID']
  for (var incr of incrs) {
    if (values[incr.toLowerCase()]) {
      continue
    }
    try {
      var last_val = last_row[0].cells[elems[incr]].firstChild.value;
      if (last_val) {
        new_last_row[0].cells[elems[incr]].firstChild.value = parseInt(last_val)+1 || ""
      }
    } catch(e) {}
  }

  // Persistent values
  var persists = ['GID', 'MIDS A', 'MIDS B'];
  for (var persist of persists) {
    if (values[persist.toLowerCase()]) {
      continue
    }
    try {
      var last_val = last_row[0].cells[elems[persist]].firstChild.value;
      if (last_val) {
        new_last_row[0].cells[elems[persist]].firstChild.value = last_val;
      }
    } catch(e) {}
  }

  if (!values['squawk']) {
    try {
      var lsr = last_row[0].cells[elems['SQUAWK']].firstChild.value;
      if (lsr) {
        new_last_row[0].cells[elems['SQUAWK']].firstChild.value = parseInt(lsr)+1 || ""
      }
    } catch(e) {}
  }

  // LSS fun:
  //   - On adding 2nd, we set 1 to 2 LSR, 2 to 1 LSR
  //   - On adding 3rd, we set 3 to 1 LSR
  //   - On adding 4th, we set 3 to 4 LSR
  //   - And continue creating 2 ship elements
  //
  // We ONLY do this if LSS is empty on the row we're adding else we might
  // change data on reloading a saved MDC
  //
  if (elems['LSS'] && values['lss'] == undefined) {

    // Ignore Flight lead
    if (row_id > 0) {

      // If were completing a 2 ship (element) then we also set the element
      // lead LSS to LSR of wing, otherwise, we use the last element leads LSR
      //
      // This does lead to a 5 ship being element of 2 and then a 2nd element
      // of 3, but the creator will just have to juggle the codes as they
      // desire in such cases
      
      if (row_id % 2 == 1) {
        rows[row_id].cells[elems['LSS']].firstChild.value = rows[row_id-1].cells[elems['LSR']].firstChild.value;

        // As we're completing an element, we set the element lead to our value
        rows[row_id-1].cells[elems['LSS']].firstChild.value = rows[row_id].cells[elems['LSR']].firstChild.value;
      } else {
        // We're adding an odd number and have to use row_id - 2
        rows[row_id].cells[elems['LSS']].firstChild.value = rows[row_id-2].cells[elems['LSR']].firstChild.value;
      }

    }
  }
  
  // Lastly add autocomplete
  if (elems['BORT']) {
    pilot_autocomplete(new_last_row[0].cells[1].firstChild, [elems['BORT']]);

    if (elems['RIO']) {
      pilot_autocomplete(new_last_row[0].cells[2].firstChild, [elems['BORT']], 1);
    }
  } else {
    pilot_autocomplete(new_last_row[0].cells[1].firstChild);
  }

  // Replace feather
  feather.replace()

}



function flight_export() {
  var ret = get_form_data($("#flight-form"));
  ret['members'] = []
  
  var headers = []
  $("#flight-members-table > thead > tr > th").each(function(idx, row) {
    headers.push(row.innerText.toLowerCase())
  })
  headers[0] = "id"

  $("#flight-members-table > tbody > tr").each(function(idx, row) {
    ret['members'].push(get_row_data(row, headers));
  })

  return ret
}

function flight_load(data, callback) {

  if (!data) { callback(); return; }

  $("#flight-airframe").val(data['flight-airframe']).change();
  $('#flight-coord-' + data['flight-coord']).click();
  $("#flight-coord-decimals").val(data['flight-coord-decimals']).change();

  flightmembers_format()
  data['members'].forEach(function(member) {
    flightmembers_add(member)
  });

  callback();

}
