
waypoint_offset = {}
poi_offset = {}
waypoint_airframe = null;

function waypoint_autocomplete(input, offsets) {
  $(input).autocomplete({
    source: function(request, response) {
      waypoint_lookup_function(request, response)
    },
    minLength: 2,
    select: function(event, ui) {
      var tr = event.target.closest('tr');
      tr.cells[offsets.lat].setAttribute('data-lat', ui.item.lat)
      tr.cells[offsets.lat].setAttribute('data-lon', ui.item.lon)

      if (ui.item.alt && tr.cells[offsets.alt].firstChild) {
        tr.cells[offsets.alt].firstChild.value = ui.item.alt;
      }

      waypoint_update()
    }
  });
}


function waypoints_get_ah64_ident_options(sel_db, sel_ident) {

  let output = ''

  for (const [name, dbitems] of Object.entries(airframes["AH-64D"].point_db)) {
    for (const [db, typeinfo] of Object.entries(dbitems.types)) {
      for (const [desc, desc_data] of Object.entries(typeinfo)) {
        output += `<optgroup label="${desc}">`;
        // Sort Idents 
        for (const ident of Object.keys(desc_data.values).sort()) {
          const label = desc_data.values[ident];

          let display_name = `${ident} - ${label}`;

          selected = ident == sel_ident && db == sel_db ? 'selected' : '';

          output += `<option data-text="${display_name}" data-db="${db}" data-ident="${ident}" value="${ident}" ${selected}>${selected ? ident : display_name}</option>`;
        }
        output += `</optgroup>`;
      } 
    }
  }

  return output
}

function waypoint_autocomplete_ah64_ident(input, db_offset) {
  // make our select box options
  $(input).focus(function() {
    let selected = $(this).find('option:selected');
    selected.text(selected.data('text'));
  });

  $(input).change(function() { this.blur(); });

  $(input).blur(function() {
    this.blur();

    let selected = $(this).find('option:selected');
    selected.text(selected.data('ident'));
    
    // now update our other columns with the data
    let row = $(this).closest('tr');
    row[0].cells[db_offset].setAttribute('data-raw', selected.data('db'));

    // We need to update waypoints when this changes to renumber
    waypoint_update()
  });

}

function waypoints_table_format() {

  var type = $('#flight-airframe').val()
  
  let colgroup = `
    <col style="width:20px" />
    <col style="width:38px" />`;

  if (type === "AH-64D") {
    // add in type, ident, free
    colgroup += `
      <col style="width:80px" />
      <col style="width:60px" />`;
  }

  colgroup += `
      <col />
      <col style="width:45px" />
      <col style="width:45px" />
      <col style="width:60px" />
      <col style="width:60px" />`;

  // if we're apache, then we can put these down to a 
  lat_lon_width = type == "AH-64D" ? 113 : 140;

  colgroup += `
      <col style="width:${lat_lon_width}px" />
      <col style="width:${lat_lon_width}px" />`;

  colgroup += `
      <col style="width:45px" />
      <col style="width:45px" />
      <col style="width:20px;" />
      <col style="width:20px;" />`;

  let thead = `
      <tr>
        <th class="border-right-0"></th>
        <th class="border-left-0 text-center">#</th>`;

  if (type === "AH-64D") {
    thead += `
          <th style="display:none">DB</th>
          <th>IDENT</th>
          <th>FREE</th>`;
  }

  thead += `
          <th>WAYPOINT</th>
          <th>ALT</th>
          <th>GS</th>
          <th>TOT</th>
          <th>ACT</th>
          <th>LAT</th>
          <th>LON</th>
          <th id="waypoints-table-dist" data-key="dist">NM</th>
          <th colspan=3>TBRG</th>
          <th data-key="time" style="display:none"></th>
        </tr>`;

  // Build our column offset
  let offsets = {}
  let thead_obj = $(thead);
  let columns = $(thead_obj)[0].children;

  for (var i = 0; i < columns.length; i++) {
    let header = columns[i].getAttribute('data-key') || columns[i].innerHTML.toLowerCase();
    if (header === "#") header = "id";
    if (header !== "") {
      offsets[header] = i
    }
  }

  waypoint_offset = offsets;

  $("#waypoints-table > colgroup").empty().append(colgroup);
  $("#waypoints-table > thead").empty().append(thead_obj);
}

function waypoints_poi_table_format() {

  let colgroup = `
    <col style="width:20px" />
  `;

  let thead = `
    <tr>
      <th class="border-right-0"></th>`;

  // add in type, ident, free
  if (waypoint_airframe === "AH-64D") {
    colgroup += `
      <col style="width:80px" />
      <col style="width:60px" />`;

    thead += `
          <th style="display:none">TYP</th>
          <th style="display:none">DB</th>
          <th class="border-left-0">IDENT</th>
          <th>FREE</th>
          <th>WAYPOINT</th>`;
  } else {
    thead += `<th class="border-left-0">WAYPOINT</th>`;
  }

  // Oterwise, it's just our usual
  colgroup += `
      <col />
      <col style="width:140px" />
      <col style="width:140px" />
      <col style="width:45px" />
      <col style="width:20px;" />
  `;

  thead += `
      <th>LAT</th>
      <th>LON</th>
      <th colspan=2>ALT</th>
    </tr>
  `;


  // Build our column offset
  let offsets = {}
  let thead_obj = $(thead);
  let columns = $(thead_obj)[0].children;

  for (var i = 0; i < columns.length; i++) {
    let header = columns[i].getAttribute('data-key') || columns[i].innerHTML.toLowerCase();
    if (header === "#") header = "id";
    if (header !== "") {
      offsets[header] = i
    }
  }

  poi_offset = offsets;

  $("#waypoints-poi-table > colgroup").empty().append(colgroup);
  $("#waypoints-poi-table > thead").empty().append(thead_obj);
  
}

function waypoint_update_display() {
  $('.coord-ctrl').each(function(idx, td) {
    coords.format_td(td);
  });
}

// Update all the DIST, TBRG for waypoints
function waypoint_update() {

  waypoint_update_display();

  // ah64 index helper
  let ah64_helper = {
    'WP': 1,
    'CM': 51,
    'TG': 1,
  }

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

  // When processing our waypoints, just go straight to the first child
  $('#waypoints-table > tbody > tr:first-child').each(function(idx, row) {

    // FA-18C we don't want to index empty rows with Lat/Lon as the DCS
    // DTC loader doesn't like them, so to make things consistent we'll
    // skip them for compatability reasons
    
    let allow_reindex = true;

    // If we have a GS specified, use it; otherwise continue to use previous
    // gs. This allows someone to declutter and only specify when GS changes
    if (row.cells[waypoint_offset.gs].children[0].value) {
      gs = parseInt(row.cells[waypoint_offset.gs].children[0].value);

      // If GS is in kts convert to km/h
      if (unit == "kts") {
        gs *= 1.852;
      }
    }

    // If lat or lon are empty; we can't do any calculations for distance /
    // time / tot so we just bail
    var lat = parseFloat(row.cells[waypoint_offset.lat].getAttribute('data-lat'));
    var lon = parseFloat(row.cells[waypoint_offset.lat].getAttribute('data-lon'));

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

        row.cells[waypoint_offset.time].innerHTML = get_time_from_seconds(duration_sec)
        row.cells[waypoint_offset.dist].innerHTML = unit == "kts" ? (distance/1.852).toFixed(1) : distance.toFixed(1);
        row.cells[waypoint_offset.tbrg].innerHTML = azi.toFixed(0);

      } else {
        row.cells[waypoint_offset.time].innerHTML = "";
        row.cells[waypoint_offset.dist].innerHTML = "";
        row.cells[waypoint_offset.tbrg].innerHTML = "";
      }

      // Set TOT
      row.cells[waypoint_offset.tot].innerHTML = tot_valid ? get_time_from_seconds(tot) : '';

      // Update last point
      last_point = {
        lat: lat,
        lon: lon,
      }
    } else if (['FA-18C', 'AH-64D'].includes(type)) {
      // Don't reindex empty spaces on the 18 as it doesn't support blank
      // waypoints in the DTC etc.
      allow_reindex = false;
    }
   
    // If we reindex, each row must be incremented
    if (waypoint_reindex) {

      // When we reindex apache, we do it based on db with different start points 
      if (type == "AH-64D") {

        let ah64_db = row.cells[waypoint_offset.db].getAttribute('data-raw');
        let ah64_id = row.cells[waypoint_offset.id].innerHTML;
        let next_index = ""

        if (allow_reindex) {
          next_index = ah64_db[0] + pad(ah64_helper[['WP', 'HZ'].includes(ah64_db) ? 'WP' : ah64_db]++, 2);
        }
        row.cells[waypoint_offset.id].innerText = next_index;

      } else {
        row.cells[waypoint_offset.id].innerText = allow_reindex ? index++ : "";
      }
    }

    // Add activity time to tot
    tot += get_seconds_from_time(row.cells[waypoint_offset.act].children[0].value);

  });

  if (waypoint_airframe !== 'AH-64D') return;

  // If we're an apache, we also need the TSD IDs of BF Geometry
  $('#waypoints-poi-table > tbody > tr').each(function(idx, row) {

    var lat = parseFloat(row.cells[poi_offset.lat].getAttribute('data-lat'));
    var lon = parseFloat(row.cells[poi_offset.lat].getAttribute('data-lon'));

    if (isNaN(lat) || isNaN(lon)) return;

    let ah64_db = row.cells[poi_offset.db].getAttribute('data-raw');
    let next_type = ah64_db[0] + pad(ah64_helper[['WP', 'HZ'].includes(ah64_db) ? 'WP' : ah64_db]++, 2);

    row.cells[poi_offset.typ].setAttribute('data-raw', next_type);
  });

}


function waypoints_add_notes(tbody, notes) {

  var type = $('#flight-airframe').val()
  tbody = $(tbody.closest('tbody'));

  // Add notes to a waypoint tbody, this could be triggered on the tbody, or on
  // the button
  let colspan = type == "AH-64D" ? 13 : 11

  let html = `
    <tr class='notes'>
      <td class="border-right-0"></td>
      <td colspan=${colspan} class="border-right-0 border-left-0 p-0"><textarea style='width:100%; border:0; background-color: transparent; white-space: pre-wrap;'>${notes || ""}</textarea></td>
      <td class="input-container text-center border-left-0">
        <button class="btn btn-link btn-sm p-0 pt-0.5" type="button" onclick='waypoints_delete_row(this);'>
          <i data-feather="delete"></i>
        </button>
      </td>
    </tr>
  `;

  tbody.find('tr').first().after(html);

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
  var row = `
    <tbody style="border-bottom: 1px solid black">
      <tr>
        <td class="input-container text-center border-right-0"><i data-feather="more-vertical"></i></td>
    `;

  // Always add a handle for draggin waypoints

  if (waypoint_reindex) {
    row += `<td class="text-center border-left-0">${data['typ']}</td>`;
  } else {
    row += `<td class="input-container border-left-0"><input class="text-center" value="${data['typ']}"></td>`;
  }

  // add in our ident (dropdown, autocomplete) and free fields
  if (type == 'AH-64D') {

    let sel_db = data.db;
    let sel_ident = data.ident;
    if (!sel_db || !sel_ident) {
      sel_db = sel_ident = "WP";
    }

    row += `
      <td style="display: none" data-raw="${sel_db}"></td>
      <td class="input-container"><select class="input-full ah64-ident-select">${waypoints_get_ah64_ident_options(sel_db, sel_ident)}</td>
      <td class="input-container text-center"><input value="${data['free'] || ""}" maxlength=3 /></td>`;
  }

  row += `
          <td class="input-container"><input value="${data['name']}"></td>
          <td class="input-container text-right"><input class="nospin" type="number" value="${data['alt']}"></td>
          <td class="input-container text-right" onChange="waypoint_update()"><input value="${data['gs']}"></td>
          <td class="text-center"></td>
          <td class="input-container text-center" onChange="waypoint_update()"><input type="text" value="${data['act']}" placeholder="--:--:--" pattern="^([0-9]+:)?([0-9]+:)?[0-9]+$"></td>`
    
    if (data['lat_fmt']) {
        row += `<td class="coord coord-ctrl" onClick="coordinate_input(this, waypoint_offset.lat, waypoint_update);" data-dmp="${data['lat_dmp']}" data-fmt="${data['lat_fmt']}" data-lat="${data['lat']}" data-lon="${data['lon']}"></td>`
    } else {
        row += `<td class="coord coord-ctrl" onClick="coordinate_input(this, waypoint_offset.lat, waypoint_update);" data-lat="${data['lat']}" data-lon="${data['lon']}"></td>`
    }

    // Moves to a dumb row and is updated from format_td
    row += `<td class="coord" onClick="coordinate_input(this, waypoint_offset.lat, waypoint_update);"></td>`

    row += `<td class="text-right"></td>
          <td class="text-right border-right-0"></td>
          <td style="display:none"></td>
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

  if (type == "AH-64D") {
    waypoint_autocomplete_ah64_ident(last_tbody[0].rows[0].cells[waypoint_offset.ident].firstElementChild, waypoint_offset.db);
  }

  waypoint_autocomplete(last_tbody[0].rows[0].cells[waypoint_offset.waypoint].firstChild, waypoint_offset);

  $(last_tbody[0].rows[0].cells[waypoint_offset.act].firstChild).on('change', function(evt) {
    // Get seconds from time, and format accordingly
    var tgt = evt.target;
    tgt.value = get_time_from_seconds(get_seconds_from_time(tgt.value), true);
  });

  // Allow tag drops
  last_tbody.droppable({
    drop: function(event, ui) {
      waypoints_tag_dropped(ui.draggable, $(event.target));
    }
  });

  // move any tags to where we need to be
  for (const tag of (wp_info?.tags || [])) {
    // find our tag if still exists in avilable waypoin
    let avail_pill = $(`#waypoints-tag-container > div:contains("${tag}")`).first();
    if (avail_pill) {
      waypoints_tag_dropped(avail_pill, last_tbody);
    }

  }
  

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
    'alt': '',
  }
  
  data = jQuery.extend(true, data, poi_data);
    
  var row = `<tr>
    <td class="input-container text-center border-right-0"><i data-feather="more-vertical"></i></td>`;

  if (waypoint_airframe == 'AH-64D') {

    let sel_db = data.db;
    let sel_ident = data.ident;
    if (!sel_db || !sel_ident) {
      sel_db = sel_ident = "WP";
    }

    row += `
      <td style="display: none" data-raw="${data.typ||""}"></td>
      <td style="display: none" data-raw="${sel_db}"></td>
      <td class="input-container border-left-0"><select class="input-full ah64-ident-select">${waypoints_get_ah64_ident_options(sel_db, sel_ident)}</td>
      <td class="input-container text-center"><input value="${data['free'] || ""}" maxlength=3 /></td>`;
  }

  row += `<td class="input-container ${waypoint_airframe !== 'AH-64D' ? "border-left-0" : ""}"><input value="${data['name']}"></td>`;


    if (data['lat_fmt']) {
      row += `<td class="coord coord-ctrl" onClick="coordinate_input(this, poi_offset.lat, waypoint_update);" data-dmp="${data['lat_dmp']}" data-fmt="${data['lat_fmt']}" data-lat="${data['lat']}" data-lon="${data['lon']}"></td>`
    } else {
      row += `<td class="coord coord-ctrl" onClick="coordinate_input(this, poi_offset.lat, waypoint_update);" data-lat="${data['lat']}" data-lon="${data['lon']}"></td>`
    }

    row += `<td class="coord border-right-0" onClick="coordinate_input(this, poi_offset.lat, waypoint_update);"></td>`

    row += `<td class="input-container text-right border-right-0"><input class="nospin" type="number" value="${data['alt']}"></td>`;

    row += `<td class="input-container text-center border-left-0">
          <button class="btn btn-link btn-sm p-0 pt-0.5" type="button" onclick='$(this).closest("tr").remove();'>
            <i data-feather="delete"></i>
          </button>
        </td>
      </tr>
  `

  $("#waypoints-poi-table > tbody").append(row);
  
  var last_row = $("#waypoints-poi-table > tbody > tr:last")[0]
  waypoint_autocomplete(last_row.cells[poi_offset.waypoint].firstChild, poi_offset);

  // Add our auto-complete handler
  if (waypoint_airframe === "AH-64D") {
    waypoint_autocomplete_ah64_ident(last_row.cells[poi_offset.ident].firstElementChild, poi_offset.db);
  }

  // Replace feather
  feather.replace()

  // Update WP info (full, not just display to re-caclulate TYP/TSD etc. if needed
  waypoint_update();
  
  return last_row;

}

function waypoint_get_poi(tr) {

  let type = waypoint_airframe;

  let cols = type === 'AH-64D' 
    ? ['-', 'typ', 'db', 'ident', 'free', 'name', 'lat', 'lon', 'alt']
    : ['-', 'name', 'lat', 'lon', 'alt'];

  var d = get_row_data(tr, cols);

  let [lat, lon] = d['lat'];
  d['lat'] = lat;
  d['lon'] = lon;
                  
  if (tr.cells[poi_offset.lat].hasAttribute('data-fmt')) {
      d['lat_fmt'] = tr.cells[poi_offset.lat].getAttribute('data-fmt')
      d['lat_dmp'] = tr.cells[poi_offset.lat].getAttribute('data-dmp')
  }

  return d;
}

function waypoint_get_tbody(tbody) {

  var type = waypoint_airframe;
  let headings = ['-', 'typ', 'name', 'alt', 'gs', 'tot', 'act', 'lat', 'lon', 'tbrg', 'dist', 'time'];

  if (type == "AH-64D") {
    headings = ['-', 'typ', 'db', 'ident', 'free', 'name', 'alt', 'gs', 'tot', 'act', 'lat', 'lon', 'tbrg', 'dist', 'time'];
  }
  let row = tbody[0].rows[0];
  let d = get_row_data(row, headings);
  
  if (row.cells[waypoint_offset.lat].hasAttribute('data-fmt')) {
      d['lat_fmt'] = row.cells[waypoint_offset.lat].getAttribute('data-fmt')
      d['lat_dmp'] = row.cells[waypoint_offset.lat].getAttribute('data-dmp')
  }

  // Lon is always stored on lat, so move it (this is so awful but provides
  // MGRS and is currently in progress) 
  let [lat, lon] = d['lat'];
  d['lat'] = lat;
  d['lon'] = lon;

  // If the next row is notes, join them to this
  let notes_row = tbody.find('.notes')
  if (notes_row.length !== 0) {
    let notes = notes_row[0].cells[1].firstChild.value.trim();
    if (notes) {
      d['notes'] = notes;
    }
  }

  // Bring on the tags
  let tags = tbody.find('.wp-tags').first()
  if (tags.length !== 0) {
    d['tags'] = []
    for (const pill of tags.children()) {
      d['tags'].push(pill.innerText);
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
  var type = $('#flight-airframe').val();
  let existing_rows = [];
  let existing_poi = [];

  // If we're changing airframe, then we can't just change the columns as all
  // the rows will be buggered, so we save / re-create the waypoints
  if (waypoint_airframe && waypoint_airframe != type) {
    $('#waypoints-table > tbody').each(function(idx, tbody) {
      existing_rows.push(waypoint_get_tbody($(tbody)))
    })
    $('#waypoints-poi-table > tbody > tr').each(function(idx, tr) {
      existing_poi.push(waypoint_get_poi(tr))
    })

    // And delete
    $('#waypoints-table > tbody').remove();
    $('#waypoints-poi-table tbody > tr').remove();
  }

  waypoint_airframe = type;

  // set default speed format else default to kts
  if (airframes[type] && airframes[type]['gs_units']) {
    $('#waypoints-gs-units').val(airframes[type]['gs_units']).change();
  } else {
    $('#waypoints-gs-units').val("kts").change();
  }

  // Recreate pills
  $('#waypoints-tag-container').empty();
  let airframe_tags = airframes?.[type]?.waypoint_tags;
  if (airframe_tags !== undefined) {
    for (const [tag, color] of Object.entries(airframe_tags)) {
      waypoints_create_pill(tag, color);
    }
    $('#waypoints-tag-group').toggle(true);
  } else {
    $('#waypoints-tag-group').toggle(false);
  }

  // refresh the layout for ah-64
  waypoints_table_format();
  waypoints_poi_table_format();

  // Hide / Show Sequenc based on Airframe
  $('#waypoints-sequence').toggle(['FA-18C'].includes(type))

  // then add them again
  existing_rows.forEach(function(data) {
    waypoint_add(data)
  });
  existing_poi.forEach(function(data) {
    waypoint_add_poi(data)
  });

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
          'alt': wp.querySelector('Altitude').textContent,
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
      alt = Math.round(alt * 0.328084) * 10;

      waypoint_add_poi({
          'name': "POI " + x,
          'lat': lat,
          'lon': lon,
          'alt': alt,
      });
      x++;
    }
  } else if (route.xml_format == "miz") {
    let x = 1;
    for (const [wp, info] of Object.entries(route.group_data.route.points)) {

      let ll = route.coords.xz_to_ll(info.x, info.y);

      waypoint_add_poi({
        'name': info.name || "Waypoint " + x,
        'lat': ll.lat,
        'lon': ll.lon,
        'alt': Math.round(info.alt * 0.328084)*10,
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
 
  if (!route.append_route) {
    $("#waypoints-table > tbody").remove()
  }
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
  } else if (route.xml_format == "miz") {
    let x = 1;
    for (const [wp, info] of Object.entries(route.group_data.route.points)) {

      let ll = route.coords.xz_to_ll(info.x, info.y)

      waypoint_add({
        'typ': x,
        'name': info.name || "Waypoint " + x,
        'lat': ll.lat,
        'lon': ll.lon,
        'alt': Math.round(info.alt * 0.328084)*10,
        'gs': Math.round(info.speed / 10)*10,
      });
      x++;
    }
  }
});

$("#waypoints-add-poi").click(function() {
  waypoint_add_poi();
})


function waypoint_export() {

    // make sure we're blured to show the right data from the selects etc.
    // (doesn't affect value)
    document.activeElement.blur();

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
      ret['poi'].push(waypoint_get_poi(tr));
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

  $("#waypoints-endurance").val(data['endurance'] || "");
  $("#waypoints-ete").val(data['ete'] || "");

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


function wp_pills_setup_draggable(elem) {
  elem.draggable({
    appendTo: 'body',
    helper: 'clone',
  });

}

waypoint_autocomplete($('#waypoints-bullseye-name')[0], {'lat': 1});

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

$("#waypoints-ete").on('change', function(evt) {
  var tgt = evt.target;
  tgt.value = get_time_from_seconds(get_seconds_from_time(tgt.value), true);
});

$("#waypoints-endurance").on('change', function(evt) {
  var tgt = evt.target;
  tgt.value = get_time_from_seconds(get_seconds_from_time(tgt.value), true);
});

function waypoints_tag_dropped(tag_div, tbody) {
  // We move the tag to the target tbody
  if (!tag_div.hasClass("wp-pill")) return;

  // If we don't have a tags section, make one
  let tag_container = tbody.find('.wp-tags').first();
  let colspan = waypoint_airframe == "AH-64D" ? 13 : 11;

  if (tag_container.length == 0) {
    tbody.append(`
      <tr class='waypoint-tags-container'>
        <td class="border-right-0"></td>
        <td class="border-right-0 border-left-0">Tags:</td>
        <td colspan=${colspan} class="border-left-0 border-right-0 p-0 wp-tags"></td>
      </tr>
    `);
    tag_container = tbody.find('.wp-tags').first();
  }

  // If our source was a waypoint-tags-container and it's left with no
  // children, remove it
  
  let parent_elem = tag_div.parent();

  // Move
  tag_container.append(tag_div);

  // Cleanup old TR if need be
  if (parent_elem.hasClass('wp-tags')) {
    if (parent_elem.children().length == 0) {
      parent_elem.parent().remove();
    }
  }
}

function getColor(){ 
  return "hsl(" + 360 * Math.random() + ',' +
  (25 + 70 * Math.random()) + '%,' + 
  (85 + 10 * Math.random()) + '%)'
}


function waypoints_create_pill(name, color) {
  color = color || getColor();
  let elem = $(`<div class="wp-pill" style="border:1px solid ${color}; background: ${color}">${name}</div>`);
  wp_pills_setup_draggable(elem);
  $('#waypoints-tag-container').append(elem);

}

$('#waypoints-tag-container').droppable({
  drop: function(event, ui) {
    // Only Pills
    if (!ui.draggable.hasClass("wp-pill")) return;

    // Find our parent
    let td = ui.draggable.parent();

    // Move our pill
    $(this).append(ui.draggable);

    // If we have no more pills, delete
    if (td.children().length == 0) {
      td.parent().remove();
    }
  }
});
