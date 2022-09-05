
function waypoint_autocomplete(input, lat_idx) {
  $(input).autocomplete({
    source: function(request, response) {
      waypoint_lookup_function(request, response)
    },
    minLength: 2,
    select: function(event, ui) {
      var tr = event.target.closest('tr')
      tr.cells[lat_idx].setAttribute('data-lat', ui.item.lat)
      tr.cells[lat_idx].setAttribute('data-lon', ui.item.lon)

      if (ui.item.alt && tr.cells[2].firstChild) {
        tr.cells[2].firstChild.value = ui.item.alt;
      }

      waypoint_update()
    }
  });
}

function waypoint_update_display() {
  $('.coord-ctrl').each(function(idx, td) {
    coords.format_td(td);
  });
}

// Update all the DIST, TBRG for waypoints
function waypoint_update() {

  waypoint_update_display();

  // seconds
  var unit = $("#waypoints-gs-units").val();
  var tot = get_seconds_from_time($("#waypoints-to-time").val());
  var last_point = null;
  var tot_valid = true;
  var gs = 0;

  var type = $('#flight-airframe').val()

  var waypoint_initial_index = 0;
  var waypoint_reindex = false;

  if (type && airframes[type]) {
    waypoint_reindex = airframes[type]['waypoint_reindex'] === true;
    if (airframes[type]['waypoint_initial_index']) {
      waypoint_initial_index = airframes[type]['waypoint_initial_index'];
    }
  }

  var index = waypoint_initial_index;

  // When processing our waypoints, just go straight to the children
  $('#waypoints-table > tbody > tr:not(.notes)').each(function(idx, row) {
   
    // If we reindex, each row must be incremented
    if (waypoint_reindex) {
      row.cells[0].innerText = index++;
    }

    // If we have a GS specified, use it; otherwise continue to use previous
    // gs. This allows someone to declutter and only specify when GS changes
    if (row.cells[3].children[0].value) {
      gs = parseInt(row.cells[3].children[0].value);

      // If GS is in kts convert to km/h
      if (unit == "kts") {
        gs *= 1.852;
      }
    }

    // If lat or lon are empty; we can't do any calculations for distance /
    // time / tot so we just bail
    var lat = row.cells[6].getAttribute('data-lat');
    var lon = row.cells[6].getAttribute('data-lon');

    lat = parseFloat(lat)
    lon = parseFloat(lon)

    if (!isNaN(lat) && !isNaN(lon)) {
      // If we have a last point, calculate distance + bearing from last point to
      // this
      if (last_point) {

        // Get Distance (nm) / Azimuth
        var r = geod.Inverse(last_point.lat, last_point.lon, lat, lon);
        var distance = r.s12/1000;

        var azi = r.azi1;
        if (azi < 0) {
          azi += 360;
        }

        // If we encounter a 0 ground speed, we're not going anywhere, so tot
        // becomes invalid from here-on out
        var duration_sec = 0
        if (!isNaN(gs) && gs != 0) {
          duration_sec = (distance / gs)*3600;
        } else {
          tot_valid = false;
        }

        tot += duration_sec

        row.cells[8].innerHTML = unit == "kts" ? (distance/1.852).toFixed(1) : distance.toFixed(1);
        row.cells[9].innerHTML = azi.toFixed(0);

      } else {
        row.cells[8].innerHTML = "";
        row.cells[9].innerHTML = "";
      }

      // Set TOT
      row.cells[4].innerHTML = tot_valid ? get_time_from_seconds(tot) : '';

      // Update last point
      last_point = {
        lat: lat,
        lon: lon,
      }
    }

    // Add activity time to tot
    tot += get_seconds_from_time(row.cells[5].children[0].value);

  });

}

function waypoints_add_notes(tbody, notes) {

  tbody = $(tbody.closest('tbody'));

  // Add notes to a waypoint tbody, this could be triggered on the tbody, or on
  // the button

  let html = `
    <tr class='notes'>
      <td colspan=11 class="border-right-0 p-0"><textarea style='width:100%; border:0; background-color: transparent; white-space: pre-wrap;'>${notes || ""}</textarea></td>
      <td class="input-container text-center border-left-0">
        <button class="btn btn-link btn-sm p-0 pt-0.5" type="button" onclick='waypoints_delete_row(this);'>
          <i data-feather="delete"></i>
        </button>
      </td>
    </tr>
  `;

  tbody.append(html);

  // Replace feather
  feather.replace();
}


function waypoint_add(wp_info) {

  var data = {
      'typ': 'WP',
      'name': '',
      'gs':  '',
      'alt': '',
      'lat': '',
      'lon': '',
      'act': '',
  }
  
  var waypoints_table = $("#waypoints-table");

  // last row with data
  var last_tbody = $("#waypoints-table > tbody:last")[0]
  var current_last_data = get_row_data(last_tbody);

  var type = $('#flight-airframe').val()

  var waypoint_initial_index = 0;
  var waypoint_reindex = false;

  if (type && airframes[type]) {
    waypoint_reindex = airframes[type]['waypoint_reindex'] === true;
    if (airframes[type]['waypoint_initial_index']) {
      waypoint_initial_index = airframes[type]['waypoint_initial_index'];
    }
  }

  if (!last_tbody) {

    // We also remove declutter to avoid GS / ALT being removed in the case
    // someone adds a row, deletes all the rows, and adds a row
    $("#waypoints-table").data('declutter', null);

    // If we are adding the first row, set an appropriate speed / altitude
    // unless they're already defined (e.g. CF) otherwise, we'll use the
    // previous row's data

    if (type && airframes[type]) {
      if (airframes[type]['cruise_gs'] && !data['gs']) {
        data['gs'] = airframes[type]['cruise_gs'].toString()
      }
      if (airframes[type]['cruise_alt'] && !data['alt']) {
        data['alt'] = airframes[type]['cruise_alt'].toString()
      }
    }

    data['typ'] = waypoint_initial_index;
  } else {

    // If typ is a number, increment it
    if (!isNaN(parseInt(current_last_data[0]))) {
      data['typ'] = parseInt(current_last_data[0]) + 1;
    }
  }

  // Update with requested waypoint info
  jQuery.extend(true, data, wp_info)

  // Reformat ACT
  data['act'] = get_time_from_seconds(get_seconds_from_time(data['act']), true);

  // Conform Ground Speed to nearest 5
  var gs = parseFloat(data['gs']);
  if (!isNaN(gs)) {
    data['gs'] = (Math.round(gs / 5)*5).toFixed();
  }

  // Make ALT integer
  var alt = parseFloat(data['alt']);
  if (!isNaN(alt)) {
    data['alt'] = Math.round(alt);
  }

  // Finally run the declutter checks for alt / gs of previous row against this
  // one and blank them if they match
  
  var declutter = waypoints_table.data('declutter') || {};
  for (var x of ['gs', 'alt']) {
    if (declutter[x] == data[x]) {
      data[x] = '';
    } else if (data[x]) {
      declutter[x] = data[x];
    }
  }

  // Remove default emptyness
  if (data['act'] == "00:00") {
    data['act'] = "";
  }

  waypoints_table.data('declutter', declutter);

  // F-16 waypoints always 
  var row = `<tbody style="border-bottom: 1px solid black"><tr>`;

  if (waypoint_reindex) {
    row += `<td class="text-center">${data['typ']}</td>`;
  } else {
    row += `<td class="input-container"><input class="text-center" value="${data['typ']}"></td>`;
  }

  row += `
          <td class="input-container"><input value="${data['name']}"></td>
          <td class="input-container text-right"><input class="nospin" type="number" value="${data['alt']}"></td>
          <td class="input-container text-right" onChange="waypoint_update()"><input value="${data['gs']}"></td>
          <td class="text-center"></td>
          <td class="input-container text-center" onChange="waypoint_update()"><input type="text" value="${data['act']}" placeholder="--:--:--" pattern="^([0-9]+:)?([0-9]+:)?[0-9]+$"></td>`
    
    if (data['lat_fmt']) {
        row += `<td class="coord coord-ctrl" onClick="coordinate_input(this, 6, waypoint_update);" data-dmp="${data['lat_dmp']}" data-fmt="${data['lat_fmt']}" data-lat="${data['lat']}" data-lon="${data['lon']}"></td>`
    } else {
        row += `<td class="coord coord-ctrl" onClick="coordinate_input(this, 6, waypoint_update);" data-lat="${data['lat']}" data-lon="${data['lon']}"></td>`
    }

    // Moves to a dumb row and is updated from format_td
    row += `<td class="coord" onClick="coordinate_input(this, 6, waypoint_update);"></td>`

    row += `<td class="text-right"></td>
          <td class="text-right border-right-0"></td>
          <td class="input-container text-center border-left-0 border-right-0" alt="foo">
            <button class="btn btn-link btn-sm p-0 pt-0.5" type="button" onclick='waypoints_add_notes(this);'>
              <i data-feather="file-plus"></i>
            </button>
          </td>
          <td class="input-container text-center border-left-0">
            <button class="btn btn-link btn-sm p-0 pt-0.5" type="button" onclick='waypoints_delete_tbody(this);'>
              <i data-feather="delete"></i>
            </button>
          </td>
        </tr>
      </tbody>`;

  $("#waypoints-table").append(row);

  // Lookup new real last row
  last_tbody = $("#waypoints-table > tbody:last");

  // If we have notes, add the notes row
  if (wp_info && wp_info.notes) {
    waypoints_add_notes(last_tbody, wp_info.notes);
  }

  waypoint_autocomplete(last_tbody[0].rows[0].cells[1].firstChild, 6);

  $(last_tbody[0].rows[0].cells[5].firstChild).on('change', function(evt) {
    // Get seconds from time, and format accordingly
    var tgt = evt.target;
    tgt.value = get_time_from_seconds(get_seconds_from_time(tgt.value), true);
  });

  // Replace feather
  feather.replace()

  // Update DIST / TBRG etc.
  waypoint_update();
  
  return last_tbody;
}

function waypoints_delete_tbody(elem) {
  $(elem).closest('tbody').remove();
  waypoint_update();
}

function waypoints_delete_row(elem) {
  $(elem).closest('tr').remove();
}

function waypoint_add_poi(poi_data) {

  var data = {
    'name': '',
    'lat': '',
    'lon': '',
  }
  
  data = jQuery.extend(true, data, poi_data);
    
    
  var row = `<tr>
        <td class="input-container"><input value="${data['name']}"></td>`        


    if (data['lat_fmt']) {
      row += `<td class="coord coord-ctrl" onClick="coordinate_input(this, 1);" data-dmp="${data['lat_dmp']}" data-fmt="${data['lat_fmt']}" data-lat="${data['lat']}" data-lon="${data['lon']}"></td>`
    } else {
      row += `<td class="coord coord-ctrl" onClick="coordinate_input(this, 1);" data-lat="${data['lat']}" data-lon="${data['lon']}"></td>`
    }

    row += `<td class="coord border-right-0" onClick="coordinate_input(this, 1);"></td>`

    row += `<td class="input-container text-center border-left-0">
          <button class="btn btn-link btn-sm p-0 pt-0.5" type="button" onclick='$(this).closest("tr").remove();'>
            <i data-feather="delete"></i>
          </button>
        </td>
      </tr>
  `

  $("#waypoints-poi-table > tbody").append(row);
  
  var last_row = $("#waypoints-poi-table > tbody > tr:last")[0]
  waypoint_autocomplete(last_row.cells[0].firstChild, 1);

  // Replace feather
  feather.replace()

  // Update Display
  waypoint_update_display();
  
  return last_row;

}

function waypoint_get_tbody(tbody) {

  let headings = ['typ', 'name', 'alt', 'gs', 'tot', 'act', 'lat', 'lon', 'dist', 'tbrg'];
  let row = tbody[0].rows[0];
  let d = get_row_data(row, headings);
  
  if (row.cells[6].hasAttribute('data-fmt')) {
      d['lat_fmt'] = row.cells[6].getAttribute('data-fmt')
      d['lat_dmp'] = row.cells[6].getAttribute('data-dmp')
  }

  // Lon is always stored on lat, so move it (this is so awful but provides
  // MGRS and is currently in progress) 
  let [lat, lon] = d['lat'];
  d['lat'] = lat;
  d['lon'] = lon;

  // If the next row is notes, join them to this
  let notes_row = tbody[0].rows[1]
  if (notes_row) {
    let notes = notes_row.cells[0].firstChild.value.trim();
    if (notes) {
      d['notes'] = notes;
    }
  }

  // Now we attach the nearest tacan station (if there is one)
  let closest = {
    data: {},
    distance: null,
  }
  for (const [tcn, value] of Object.entries(mission_data.data.beacons || {})) {
    let r = geod.Inverse(lat, lon, value.lat, value.lon);
    let distance = r.s12/1000;

    // Convert distance from km -> kts if needed
    if ($('#waypoints-gs-units').val() == "kts") {
      distance /= 1.852;
    }

    // Round to 1 DP
    distance = Math.round((distance + Number.EPSILON) * 10) / 10;

    let azi = Math.round(r.azi1);
    if (azi < 0) { azi += 360; }

    if (!closest.distance || closest.distance > distance) {
      closest.distance = distance;
      closest.data = {...value, ...{
        'channel': tcn,
        'brg': azi,
        'rng': distance,
      }}
    }
  }
  if (closest.distance) {
    d['nearest_tcn'] = closest.data;
  }
  
  return d
}

$('#waypoints-add-waypoint').click(function() {
  waypoint_add();
});

// Make Draggable Elements
$('#waypoints-table').sortable({
  items: 'tbody',
  update: function() {
    waypoint_update();
  },
  helper: function(e, tr)
  {
    // Wrap our tbody around the same table definition to maintain the column
    // spacing and keep things pretty
    let jtr = $(tr);
    return `
      <table class="table">
        ${$(jtr.closest('table')).find('colgroup')[0].outerHTML}
        ${jtr.html()}
      </table>`;
  },
})

$('#waypoints-poi-table > tbody').sortable({
  items: 'tr',
})

$('#waypoints-bullseye-name').autocomplete({
  source: function(request, response) {
    waypoint_lookup_function(request, response)
  },
  minLength: 2,
  select: function(event, ui) {

    $('#waypoints-bullseye-lat').attr('data-lat', ui.item.lat)
    $('#waypoints-bullseye-lat').attr('data-lon', ui.item.lon)

    waypoint_update()
  }
});

// Allow cloning of waypoints
$.contextMenu({
  selector: '#waypoints-table > tbody',
  callback: function(key, options) {
    if (key == 'duplicate') {

      var data = waypoint_get_tbody($(this));

      // If the row after this row is notes, we need to insert after this row 
      var last_row = waypoint_add(data);
      last_row.insertAfter($(this));

      waypoint_update();
    }
  },
  items: {
    "duplicate": {name: "duplicate", icon: "copy"},
  }
});

$('#waypoints-gs-units').on('change', function() {
  $('#waypoints-table-dist').html($('#waypoints-gs-units').val() == "kts" ? "NM" : "KM");
  waypoint_update();
});

$('#flight-airframe').on('flight-airframe-changed', function(e) {
  var type = $('#flight-airframe').val()

  // Set default speed format else default to kts
  if (airframes[type] && airframes[type]['gs_units']) {
    $('#waypoints-gs-units').val(airframes[type]['gs_units']).change();
  } else {
    $('#waypoints-gs-units').val("kts").change();
  }

  // Hide / Show Sequenc based on Airframe
  $('#waypoints-sequence').toggle(['FA-18C'].includes(type))
});

$('#flight-airframe').on('data-poi-updated', function(e) {
  var route = $('#flight-airframe').data('poi');
  if (!route) {
    return
  }

  $('#waypoints-poi-table > tbody').empty()

  if (route.xml_format == "cf") {
    route.xml.querySelectorAll('Waypoints > Waypoint').forEach(function(wp) {
      waypoint_add_poi({
          'name': wp.querySelector('Name').textContent,
          'lat': wp.querySelector('Lat').textContent,
          'lon': wp.querySelector('Lon').textContent,
      })
    });
  } else if (route.xml_format == "ge") {
    var process_coords = route.xml.querySelector('LineString > coordinates').textContent.split(" ");
    var x = 1;
    for (var coord of process_coords) {
      coord = coord.trim();
      if (!coord) {
        continue;
      }

      var [lon,lat,alt] = coord.split(",");
      waypoint_add_poi({
          'name': "POI " + x,
          'lat': lat,
          'lon': lon,
      });
      x++;
    }
  }

});

$('#flight-airframe').on('data-route-updated', function(e) {

  // If we have a route, we can use the data from CF
  var route = $('#flight-airframe').data('route');
  var type = $('#flight-airframe').val()

  if (!route) {
    return
  }
 
  $("#waypoints-table > tbody").remove()
  $("#waypoints-table").data('declutter', null);

  if (route.xml_format == "cf") {

    // IF we're not route only, then set the walk time 
    if (!route.route_only) {
      // Mission Start
      var start_time = parseInt(route.xml.ownerDocument.querySelector('Mission > Environment > Starttime').textContent);
      $("#waypoints-walk-time").val(get_time_from_seconds(start_time)).change();

      // Default T/O time is 20 minutes hence
      $("#waypoints-to-time").val(get_time_from_seconds(start_time+60*20)).change();
    }

    // F-18 waypoints start at 0
    var idx = ["FA-18C"].includes(type) ? 0 : 1;

    let first = true;

    var style = route.wp_style || "index";

    route.xml.querySelectorAll('Waypoints > Waypoint').forEach(function(wp) {

      var waypoint_type = (function(waypoint_type) {
        if (waypoint_type.startsWith('Take off')) {
          return 'DEP'
        }
        switch(waypoint_type) {
          case 'Landing':
            return 'ARR';
          case 'Steerpoint':
            return 'WP';
          case 'Target':
            return 'ST';
        }
        return waypoint_type
      })(wp.querySelector('Type').textContent);

      // Handle our selected waypoint type / name convention
      var name = wp.querySelector('Name').textContent;
      var type = idx.toFixed()

      switch(style) {
        case "index-type":
          name = waypoint_type + ": " + name;
          break;
        case "type":
          type = waypoint_type;
          break
      }

      // If we're the first row and not route only, then add ACT to walk
      let act = wp.querySelector('Activity').textContent.split(':').splice(0,2).join(':');
      if (first) {
        first = false;
        if (!route.route_only) {

          // Update our T/O time from walk + ACT
          let to_time = get_seconds_from_time($("#waypoints-walk-time").val()) + get_seconds_from_time(act);
          $("#waypoints-to-time").val(get_time_from_seconds(to_time)).change();

          // Clear act, as it's set from walk + to now, though could be added
          // by someone for after depart refuel or such 
          act = "00:00";
        }
      }

      waypoint_add({
          'typ': type,
          'name': name,
          'gs': wp.querySelector('GS').textContent,
          'alt': wp.querySelector('Altitude').textContent,
          'lat': wp.querySelector('Lat').textContent,
          'lon': wp.querySelector('Lon').textContent,
          'act': act,
      })

      idx++;
    });
  } else if (route.xml_format == "ge") {
    let process_coords = route.xml.querySelector('LineString > coordinates').textContent.split(" ");
    var x = 1;
    for (var coord of process_coords) {
      coord = coord.trim();

      if (!coord) {
        continue;
      }

      // update alt to nearest 10
      var [lon,lat,alt] = coord.split(",");
      alt = Math.round(alt * 0.328084) * 10;

      waypoint_add({
        'typ': x,
        'name': "Waypoint " + x,
        'lat': lat,
        'lon': lon,
      });
      x++;
    }
  }
});

$("#waypoints-add-poi").click(function() {
  waypoint_add_poi();
})


function waypoint_export() {

    var ret = $("#waypoints-form").serializeObject();

    // Bullseye is really a waypoint kinda of object so 
    delete(ret['bullseye-name'])

    var be_lat = $("#waypoints-bullseye-lat")

    var bullseye = {
      'name': $("#waypoints-bullseye-name").val(),
      'lat': be_lat.attr('data-lat'),
      'lon': be_lat.attr('data-lon'),
    }

    if (be_lat[0].hasAttribute('data-fmt')) {
        bullseye['lat_fmt'] = be_lat[0].getAttribute('data-fmt')
        bullseye['lat_dmp'] = be_lat[0].getAttribute('data-dmp')
    }

    ret['bullseye'] = bullseye
    
    // waypoints
    ret["waypoints"] = []
    $('#waypoints-table > tbody').each(function(idx, tbody) {

        // waypoints also have override display formats in addition to visible data
        ret['waypoints'].push(waypoint_get_tbody($(tbody)))
    })
    
    ret["poi"] = []
    $('#waypoints-poi-table > tbody > tr').each(function(idx, tr) {
        var d = get_row_data(tr, ['name', 'lat', 'lon'])

        let [lat, lon] = d['lat'];
        d['lat'] = lat;
        d['lon'] = lon;
                        
        if (tr.cells[1].hasAttribute('data-fmt')) {
            d['lat_fmt'] = tr.cells[1].getAttribute('data-fmt')
            d['lat_dmp'] = tr.cells[1].getAttribute('data-dmp')
        }
        
        ret['poi'].push(d)
        
    })
   
    if ($("#waypoints-sequence").css('display') != "none") {
        ret["sequence"] = []
        $('#waypoints-sequence-table > tbody > tr').each(function(idx, tr) {
            ret['sequence'].push(get_row_data(tr, ['id', 'seq', 'notes']))
        })
    }
    
    return ret
}


function waypoint_load(data, callback) {

  if (!data) { callback(); return; }
    

  $("#waypoints-walk-time").val(data['walk-time']);
  $("#waypoints-to-time").val(data['to-time']);
  $("#waypoints-transition-alt").val(data['transition-alt']);
  $("#waypoints-transition-level").val(data['transition-level']);
  $("#waypoints-gs-units").val(data['gs-units'] || "kts").change();

  // Bullseye 
  $("#waypoints-bullseye-name").val(data['bullseye']['name'])

  var be_lat = $("#waypoints-bullseye-lat")

  be_lat.attr('data-lat', data['bullseye']['lat'])
  be_lat.attr('data-lon', data['bullseye']['lon'])

  if (data['bullseye'].lat_fmt) {
    be_lat.attr('data-fmt', data['bullseye']['lat_fmt'])
    be_lat.attr('data-dmp', data['bullseye']['lat_dmp'])
  }

  $("#waypoints-table > tbody").remove();
  $("#waypoints-table").data('declutter', null);

  data['waypoints'].forEach(function(data) {
    waypoint_add(data)
  });

  if (data['poi']) {
    $("#waypoints-poi-table > tbody").empty();
    data['poi'].forEach(function(data) {
      waypoint_add_poi(data)
    });
  }

  if (data['sequence']) {
    $("#waypoints-sequence-table > tbody > tr").each(function(idx, tr) {
      var elem = data['sequence'][idx];
      if (elem) {
        tr.cells[1].firstChild.value = elem['seq'];
        tr.cells[2].firstChild.value = elem['notes'];
      }
    });
  }

  validate_walk_time();

  callback();
}

function validate_walk_time() {
  let to_elem = $('#waypoints-to-time')
  let walk = get_seconds_from_time($('#waypoints-walk-time').val());
  let to = get_seconds_from_time(to_elem.val());
  var inval = to_elem.parent().find('div.invalid-feedback');
  inval.toggle(to < walk);
}

waypoint_autocomplete($('#waypoints-bullseye-name')[0], 1);

$("#waypoints-walk-time").on('change', function(evt) {
  var tgt = evt.target;
  tgt.value = get_time_from_seconds(get_seconds_from_time(tgt.value), true);
  validate_walk_time();
});

$("#waypoints-to-time").on('change', function(evt) {
  var tgt = evt.target;
  tgt.value = get_time_from_seconds(get_seconds_from_time(tgt.value), true);
  validate_walk_time();
  waypoint_update();
});

