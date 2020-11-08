/*
 * Flight.js: Javascript related to the flight page
 */

$('#flight-add-member').click(function() {
  flightmembers_add();
});

$("#flight-airframe").change(function(e) {

  // Update table format
  flightmembers_format();

  // Add one for convienience
  flightmembers_add();

  // If the AC != AC in the route, blat route\
  var target = $(e.target)
  var type = target.val()
  var route = target.data('route');
  if (route) {
    if (type != route.aircraft) {
      target.data('route', null);
    }
  }

  // Update default coordinate format
  flight_update_default_coord_format()

  // Update all preset-freqs
  update_presets()

  // Show options
  $('#flight-members-container').toggle(type !== null) 

  // Trigger event for other pages
  $('#flight-airframe').trigger('flight-airframe-changed');

  // Save and unlock all components if successful
  save({'callback': function() { $("a.nav-link.disabled").removeClass('disabled'); }})

});

$("input[name=flight-coord]").change(flight_update_coord)
$("#flight-coord-decimals").change(flight_update_coord)

function flight_update_coord() {

  // And our example
  coordinate_display_format($('#flight-coord-example')[0])

  // Broadcast event
  $(document).trigger('flight-coordinates-changed');
}

function flight_update_default_coord_format() {

  var ac = $("#flight-airframe").val()

  var fmt = "ddm"
  var dp = 3

  if (ac == "F-14B") {
    dp = 1
  }

  // Update Radio / DP
  $('#flight-coord-'+fmt).prop("checked", true).click();
  $('#flight-coord-decimals').val(dp);

  flight_update_coord();

}




function pilot_autocomplete(input, fields=null, rio=false) {
  $(input).autocomplete({
    source: function(request, response) {
      response(match_labels_in_arr(pilots, request.term))
    },
    minLength: 1,
    select: function( event, ui) {
      var ac = $("#flight-airframe").val() 
      if (!rio && fields) {
        event.target.parentElement.parentElement.cells[fields[0]].children[0].value = ui.item[ac] || "";
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

  if (!["UH-1H", "Ka-50", "Mi-8MT"].includes(ac)) {
    cols.push(
      ['TCN', 50, "text-center", "text", '^([0-9]+\\s*(X|Y))?$', function(field) { tcn_formatter(field); } ],
    );
  }

  if (!["UH-1H", "Mi-8MT"].includes(ac)) {
    cols.push(
      ['LSR', 50, "text-center", "number"])
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
        <button type="button" class="btn btn-link btn-sm p-0 pt-0.5" onclick='$(this).closest("tr").remove();'>
          <i data-feather="delete"></i>
        </button>
      </td>`;

  html += "</tr>"

  $("#flight-members-table > tbody").append(html);

  var new_last_row = $("#flight-members-table > tbody > tr:last");

  // Handle Setup Functions
  for (col in cols) {
    var [title, width, cls, typ, pattern, setup_fnc] = cols[col]
    if (setup_fnc) {
      setup_fnc(new_last_row[0].cells[col].firstChild);
    }
  }

  if (first_row[0] != undefined) {
    var first_tcn = first_row[0].cells[elems['TCN']].firstChild.value.match(/^([0-9]+)(.*)/);
    if (first_tcn) {
      new_last_row[0].cells[elems['TCN']].firstChild.value = String(parseInt(first_tcn[1]) + 63) + first_tcn[2];
    }
  }

  var incrs = ['#', 'SQUAWK', 'LSR', 'OID']
  for (incr in incrs) {
    if (arguments[elems[incrs[incr]]]) {
      continue
    }
    try {
      var last_val = last_row[0].cells[elems[incrs[incr]]].firstChild.value;
      if (last_val) {
        new_last_row[0].cells[elems[incrs[incr]]].firstChild.value = parseInt(last_val)+1 || ""
      }
    } catch(e) {}
  }

  var persists = ['GID']
  for (persist in persists) {
    if (arguments[elems[persists[persist]]]) {
      continue
    }
    try {
      var last_val = last_row[0].cells[elems[persists[persist]]].firstChild.value;
      if (last_val) {
        new_last_row[0].cells[elems[persists[persist]]].firstChild.value = last_val;
      }
    } catch(e) {}
  }

  if (!arguments[elems['SQUAWK']]) {
    try {
      var lsr = last_row[0].cells[elems['SQUAWK']].firstChild.value;
      if (lsr) {
        new_last_row[0].cells[elems['SQUAWK']].firstChild.value = parseInt(lsr)+1 || ""
      }
    } catch(e) {}
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

function pilot_autocomplete(input, fields=null, rio=0) {
  $(input).autocomplete({
    source: function(request, response) {
      response(match_labels_in_arr(pilots, request.term))
    },
    minLength: 1,
    select: function( event, ui) {
      var ac = $("#flight-airframe").val() 
      if (rio == 0 && fields) {
        event.target.parentElement.parentElement.cells[fields[0]].children[0].value = ui.item[ac] || "";
      }
    }
  });
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

function flight_load(data) {

  $("#flight-airframe").val(data['flight-airframe']).change()
  $("#flight-coord").val(data['flight-coord'])
  $("#flight-coord-decimals").val(data['flight-coord-decimals'])

  flightmembers_format()
  data['members'].forEach(function(member) {
    flightmembers_add(member)
  });

}
