
function waypoint_autocomplete(input, lat_idx) {
  $(input).autocomplete({
    source: function(request, response) {
      waypoint_lookup_function(request, response)
    },
    minLength: 2,
    select: function(event, ui) {
      var tr = event.target.closest('tr')
      tr.cells[lat_idx].setAttribute('data-raw', ui.item.lat)
      tr.cells[lat_idx+1].setAttribute('data-raw', ui.item.lon)

      waypoint_update()
    }
  });
}

// Helper to get the number of seconds from a "HH:mm" string, used for
// calculating TOT
function get_seconds_from_time(time) {
  if (time == "") {
    return 0
  }
  var elems = time.split(":");
  return (parseInt(elems[0])*3600 + parseInt(elems[1])*60)
}

// Helper to get the "HH:mm" string from number of seconds since 00:00 as the
// format used in DCS mission start
function get_time_from_seconds(seconds) {
  hours   = Math.floor(seconds / 3600) % 24
  minutes = Math.floor((seconds % 3600) / 60)
  return pad(hours, 2)+":"+pad(minutes,2);
}

function waypoint_update_display() {
  $('.coord').each(function(idx, td) {
    coordinate_display_format(td);
  });
}

// Update all the DIST, TBRG for waypoints
function waypoint_update() {

  waypoint_update_display();

  // seconds
  var tot = get_seconds_from_time($("#waypoints-walk-time").val());
  var last_point = null;

  $('#waypoints-table > tbody > tr').each(function(idx, row) {

    var gs = parseInt(row.cells[3].children[0].value);

    var lat = row.cells[6].getAttribute('data-raw');
    var lon = row.cells[7].getAttribute('data-raw');
    if (lat == "" || lon == "") {
      row.cells[4].innerHTML = "";
      return
    }

    lat = parseFloat(lat)
    lon = parseFloat(lon)

    // If we have a last point, calculate distance + bearing
    // from last point to this
    if (last_point) {

      // Get Distance / Azimuth

      var r = geod.Inverse(last_point.lat, last_point.lon, lat, lon);
      var distance = (r.s12/1852);

      var azi = r.azi1;
      if (azi < 0) {
        azi += 360;
      }

      // TOT addition
      var duration_sec = (distance / gs)*3600;

      tot += duration_sec

      row.cells[8].innerHTML = distance.toFixed(1);
      row.cells[9].innerHTML = azi.toFixed(0);

    } else {
      row.cells[8].innerHTML = "";
      row.cells[9].innerHTML = "";
    }

    // Set TOT
    row.cells[4].innerHTML = get_time_from_seconds(tot);

    // Add activity time to tot
    tot += get_seconds_from_time(row.cells[5].children[0].value);

    last_point = {
      lat: lat,
      lon: lon,
      gs: parseInt(row.cells[3].children[0].value),
    }
  });

}


function waypoint_add(wp_info) {
    
  var data = {
      'typ': 'WP',
      'name': '',
      'gs':  350,
      'alt': 15000,
      'lat': '',
      'lon': '',
      'act': '',
  }
  
  var last_row = $("#waypoints-table > tbody > tr:last")[0]
  var current_last_data = get_row_data(last_row);

  if (!last_row) {
    data['act'] = "00:20"
    data['typ'] = "1"
  } else {
    data['alt'] = current_last_data[2]
    data['gs'] = current_last_data[3]
  
    // If typ is a number, increment it
    if (!isNaN(parseInt(current_last_data[0]))) {
      data['typ'] = parseInt(current_last_data[0]) + 1;
    }
  }
  
  jQuery.extend(true, data, wp_info)
  
  var row = `<tr>
          <td class="input-container"><input class="text-center" value="${data['typ']}"></td>
          <td class="input-container"><input value="${data['name']}"></td>
          <td class="input-container text-right"><input value="${data['alt']}"></td>
          <td class="input-container text-right" onChange="waypoint_update()"><input value="${data['gs']}"></td>
          <td class="text-center"></td>
          <td class="input-container" onChange="waypoint_update()"><input class="nospinner" type="time" value="${data['act']}"></td>`
    
    if (data['lat_fmt']) {
        row += `<td class="coord" onClick="coordinate_input(this, 6);" data-dmp="${data['lat_dmp']}" data-fmt="${data['lat_fmt']}" data-raw="${data['lat']}"></td>`
    } else {
        row += `<td class="coord" onClick="coordinate_input(this, 6);" data-raw="${data['lat']}"></td>`
    }
    
    if (data['lon_fmt']) {
        row += `<td class="coord coord-lon" onClick="coordinate_input(this, 6);" data-dmp="${data['lon_dmp']}" data-fmt="${data['lon_fmt']}" data-raw="${data['lon']}"></td>`
    } else {
        row += `<td class="coord coord-lon" onClick="coordinate_input(this, 6);" data-raw="${data['lon']}"></td>`
    }
    
    row += `<td class="text-right"></td>
          <td class="text-right border-right-0"></td>
          <td class="input-container text-center border-left-0">
            <button class="btn btn-link btn-sm p-0 pt-0.5" type="button" onclick='$(this).closest("tr").remove();'>
              <i data-feather="delete"></i>
            </button>
          </td>
        </tr>`
  
  $("#waypoints-table > tbody").append(row)

  last_row = $("#waypoints-table > tbody > tr:last");

  waypoint_autocomplete(last_row[0].cells[1].firstChild, 6);

  // Replace feather
  feather.replace()

  // Update DIST / TBRG etc.
  waypoint_update();
  
  return last_row;
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
        row += `<td class="coord" onClick="coordinate_input(this, 1);" data-dmp="${data['lat_dmp']}" data-fmt="${data['lat_fmt']}" data-raw="${data['lat']}"></td>`
    } else {
        row += `<td class="coord" onClick="coordinate_input(this, 1);" data-raw="${data['lat']}"></td>`
    }
    
    if (data['lon_fmt']) {
        row += `<td class="coord border-right-0" onClick="coordinate_input(this, 1);" data-dmp="${data['lon_dmp']}" data-fmt="${data['lon_fmt']}" data-raw="${data['lon']}"></td>`
    } else {
        row += `<td class="coord border-right-0 coord-lon" onClick="coordinate_input(this, 1);" data-raw="${data['lon']}"></td>`
    }
  
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

function waypoint_get_row(row) {
  var headings = ['typ', 'name', 'alt', 'gs', 'tot', 'act', 'lat', 'lon', 'dist', 'tbrg']
  return get_row_data(row, headings)
}

$('#waypoints-add-waypoint').click(function() {
  waypoint_add();
});

// Make Draggable Elements
$('#waypoints-table > tbody').sortable({
  items: 'tr',
  update: function() {
    waypoint_update();
  },
})

$('#waypoints-bullseye-name').autocomplete({
  source: function(request, response) {
    waypoint_lookup_function(request, response)
  },
  minLength: 2,
  select: function(event, ui) {

    $('#waypoints-bullseye-lat').attr('data-raw', ui.item.lat)
    $('#waypoints-bullseye-lon').attr('data-raw', ui.item.lon)

    waypoint_update()
  }
});

// Allow cloning of waypoints
$.contextMenu({
  selector: '#waypoints-table > tbody > tr',
  callback: function(key, options) {
    if (key == 'duplicate') {

      var data = waypoint_get_row($(this)[0]);
      var last_row = waypoint_add(data);
      last_row.insertAfter($(this));
      waypoint_update();
    }
  },
  items: {
    "duplicate": {name: "duplicate", icon: "copy"},
  }
});

// If coordinate format updates, we need to refersh the table
$(document).on('flight-coordinates-changed', function() {
  waypoint_update_display();
});

$(document).on('coordinates-changed', function() {
  waypoint_update();
});

$('#flight-airframe').on('flight-airframe-changed', function(e) {
  var type = $('#flight-airframe').val()

  // Hide / Show POI / Sequence
  $('#waypoints-poi').toggle(type == 'F-14B')
  $('#waypoints-sequence').toggle(['F-16C', 'FA-18C'].includes(type))
});

$('#flight-airframe').on('data-route-updated', function(e) {

  // If we have a route, we can use the data from CF
  var route = $('#flight-airframe').data('route');

  var type = $('#flight-airframe').val()

  if (!route) {
    return
  }
 
  $('#waypoints-table > tbody').empty()
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
      
    waypoint_add({
        'typ': waypoint_type,
        'name': wp.querySelector('Name').textContent,
        'gs': wp.querySelector('GS').textContent,
        'alt': wp.querySelector('Altitude').textContent,
        'lat': wp.querySelector('Lat').textContent,
        'lon': wp.querySelector('Lon').textContent,
        'act': wp.querySelector('Activity').textContent.split(':').splice(0,2).join(':'),
    })
  });
});

$("#waypoints-walk-time").change(function() {
  waypoint_update();
});

$("#waypoints-add-poi").click(function() {
  waypoint_add_poi();
})


function waypoint_export() {

    var ret = $("#waypoints-form").serializeObject();

    // Bullseye is really a waypoint kinda of object so 
    delete(ret['bullseye-name'])

    var be_lat = $("#waypoints-bullseye-lat")
    var be_lon = $("#waypoints-bullseye-lon")

    var bullseye = {
      'name': $("#waypoints-bullseye-name").val(),
      'lat': be_lat.attr('data-raw'),
      'lon': be_lon.attr('data-raw'),
    }

    if (be_lat[0].hasAttribute('data-fmt')) {
        bullseye['lat_fmt'] = be_lat[0].getAttribute('data-fmt')
        bullseye['lat_dmp'] = be_lat[0].getAttribute('data-dmp')
    }
    if (be_lon[0].hasAttribute('data-fmt')) {
        bullseye['lon_fmt'] = be_lon[0].getAttribute('data-fmt')
        bullseye['lon_dmp'] = be_lon[0].getAttribute('data-dmp')
    }

    ret['bullseye'] = bullseye
    
    // waypoints
    ret["waypoints"] = []
    $('#waypoints-table > tbody > tr').each(function(idx, tr) {
        // waypoints also have override display formats in addition to visible data
        var d = get_row_data(tr, ['typ', 'name', 'alt', 'gs', 'tot', 'act', 'lat', 'lon', 'dist', 'tbrg'])
        
        if (tr.cells[6].hasAttribute('data-fmt')) {
            d['lat_fmt'] = tr.cells[6].getAttribute('data-fmt')
            d['lat_dmp'] = tr.cells[6].getAttribute('data-dmp')
        }
        if (tr.cells[7].hasAttribute('data-fmt')) {
            d['lon_fmt'] = tr.cells[7].getAttribute('data-fmt')
            d['lon_dmp'] = tr.cells[7].getAttribute('data-dmp')
        }
        
        ret['waypoints'].push(d)
    })
    
    if ($("#waypoints-poi").css('display') != "none") {
        ret["poi"] = []
        $('#waypoints-poi-table > tbody > tr').each(function(idx, tr) {
            var d = get_row_data(tr, ['name', 'lat', 'lon'])
                            
            if (tr.cells[1].hasAttribute('data-fmt')) {
                d['lat_fmt'] = tr.cells[1].getAttribute('data-fmt')
                d['lat_dmp'] = tr.cells[1].getAttribute('data-dmp')
            }
            if (tr.cells[2].hasAttribute('data-fmt')) {
                d['lon_fmt'] = tr.cells[2].getAttribute('data-fmt')
                d['lon_dmp'] = tr.cells[2].getAttribute('data-dmp')
            }
            
            ret['poi'].push(d)
            
        })
    }
   
    if ($("#waypoints-sequence").css('display') != "none") {
        ret["sequence"] = []
        $('#waypoints-sequence-table > tbody > tr').each(function(idx, tr) {
            ret['sequence'].push(get_row_data(tr, ['id', 'seq', 'notes']))
        })
    }   
    
    return ret
}


function waypoint_load(data) {

  $("#waypoints-walk-time").val(data['walk-time'])
  $("#waypoints-transition-alt").val(data['transition-alt'])
  $("#waypoints-transition-level").val(data['transition-level'])

  // Bullseye 
  $("#waypoints-bullseye-name").val(data['bullseye']['name'])

  var be_lat = $("#waypoints-bullseye-lat")
  var be_lon = $("#waypoints-bullseye-lon")

  be_lat.attr('data-raw', data['bullseye']['lat'])
  be_lon.attr('data-raw', data['bullseye']['lon'])

  if (data['bullseye'].lat_fmt) {
    be_lat.attr('data-fmt', data['bullseye']['lat_fmt'])
    be_lat.attr('data-dmp', data['bullseye']['lat_dmp'])
  }

  if (data['bullseye'].lon_fmt) {
    be_lon.attr('data-fmt', data['bullseye']['lon_fmt'])
    be_lon.attr('data-dmp', data['bullseye']['lon_dmp'])
  }

  $("#waypoints-table > tbody").empty() 
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

}

waypoint_autocomplete($('#waypoints-bullseye-name')[0], 1);
