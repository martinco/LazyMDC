/******************************************************************************
* Functions
******************************************************************************/

function data_process_kml(xml) {

  // Reset / Present the route dialog
  var select_wp = $("#data-route-dialog-waypoints");
  var select_poi = $("#data-route-dialog-poi");

  $('#data-route-dialog-cf').hide();
  $('#data-route-dialog-ge').show();
  $('#data-route-dialog-cf-only').hide();

  // Reset the form to wipe out any previous routes (first option = None)
  select_wp.children('option:not(:first)').remove();
  select_poi.children('option:not(:first)').remove();

  // Build up a list of routes / store against their names so we can 
  var route_data = new Object(); 

  var nsResolver = xml_createNSResolver(xml)
  var routes = document.evaluate(
    '//kml:Placemark[kml:LineString]', xml,
    nsResolver,
    XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null)

  // We use Placemarks that have LineStrings
  var node;
  while(node = routes.iterateNext()) {

    var title = node.querySelector('name').textContent;
    var name = title;
    var dupe = 0;
    while(route_data[name] !== undefined) {
      dupe++;
      name = title + dupe
    }

    // Store so we can fire the event
    route_data[name] = {
      xml: node,
      xml_format: 'ge',
    }

    // Add options to route selector
    var opt = new Option(title, name)

    select_wp.append(opt);
    select_poi.append(new Option(title, name));
  }

  // Bind our routes to the dialog, and show
  $('#data-route-dialog')
    .data({
      'routes': route_data,
      'xml': xml,
    })
    .modal({
      backdrop: 'static',
  });

}

function data_process_cf(xml) {

  // Reset / Present the route dialog
  var select_wp = $("#data-route-dialog-waypoints");
  var select_poi = $("#data-route-dialog-poi");
  
  $('#data-route-dialog-cf').show();
  $('#data-route-dialog-ge').hide();
  $('#data-route-dialog-cf-only').show();

  // Reset the form to wipe out any previous routes (first option = None)
  select_wp.children('option:not(:first)').remove();
  select_poi.children('option:not(:first)').remove();

  // Build up a list of routes / store against their names so we can 
  var route_data = new Object(); 

  var routes = xml.getElementsByTagName("Route")

  // Iterate the routes and collect Name, Task, Side, AC
  for (var i = 0; i < routes.length; i++) {

    var route_xml = routes[i];

    var name = route_xml.querySelector('Name').textContent;
    var task = route_xml.querySelector('Task').textContent;
    var side = route_xml.querySelector('Side').textContent;
    var aircraft = route_xml.querySelector('Aircraft > Type').textContent;
    var aircraft_source = aircraft;

    var load_loadout = true;
    var route_append = "";

    // Choose if we import route only (set AC if possible)
    
    // F-16 Varianats: F-16A, F-16A MLU, F-16C bl.50, F-16C bl.52 F-16C_50
    if (aircraft.startsWith("F-16")) {
      if (aircraft != 'F-16C_50') {
        route_append = " - Select F-16C_50 in CF for loadout";
        load_loadout = false;
      }
      aircraft = "F-16C"

    // F-18C Variants: F/A-18C, FA-18C_hornet
    } else if (aircraft == 'F/A-18C' || aircraft == 'FA-18C_hornet') {
      if (aircraft != 'FA-18C_hornet') {
        route_append = " - Select FA-18C_hornet in CF for loadout";
        load_loadout = false;
      }
      aircraft = "FA-18C"

    // F-14 Variants: F-14A, F-14B
    } else if (aircraft.startsWith("F-14")) {
      if (aircraft != 'F-14B') {
        route_append = " - select F-14B in CF for loadout";
        load_loadout = false;
      }
      aircraft = "F-14B"

    // A-10 Variants: A-10A, A-10C, A-10C_2 (which is same as a10c for this
    // generator)
    } else if (aircraft.startsWith("A-10")) {
      if (!aircraft.startsWith('A-10C')) {
        route_append = " - Select A-10C or A-10C_2 in CF for loadout";
        load_loadout = false;
      }
      aircraft = "A-10C"

    // Anything else 
    } else { 
      route_append = " - unsupported airframe - route only";
      load_loadout = false;
      aircraft = null;
    }

    var units = route_xml.querySelector('Units').textContent;

    var route_title = `[${task}] ${name} ${units}x${aircraft_source}`

    // Store so we can fire the event
    route_data[name] = {
      aircraft: aircraft,
      side: side,
      task: task,
      units: units,
      use_loadout: load_loadout,
      xml: route_xml,
      xml_format: 'cf',
    }

    // Add options to route selector
    var opt = new Option(route_title + route_append, name)
    if (!load_loadout) {
      opt.style.color = '#cc0000'
    }

    select_wp.append(opt);
    select_poi.append(new Option(route_title, name));
  };

  // Bind our routes to the dialog, and show
  $('#data-route-dialog')
    .data({
      'routes': route_data,
      'xml': xml,
    })
    .modal({
      backdrop: 'static',
    });
}

function data_load_file(input) {

  if (input == undefined) {
    return;
  }

  // input will either be js or cf
  var file = input.files[0];
  var file_ext = file.name.split('.').pop();

  if (file_ext == 'json') {
    var fr = new FileReader()
    fr.onload = function(e) {
        var data = JSON.parse(e.target.result);

        // Check if it's version 2
        if (!data.version || data.version != "2.0") {
          alert('This JSON is not compatible');
          return;
        }

        // Populate all the forms 
        load(data)

        // Save as a new page (in case of edits)
        save({
          data: data,
          new_id: true,
          update_id: true,
          force: true,
        })
    }
    fr.readAsText(file);

  } else if (file_ext == 'cf') {
    zip.createReader(new zip.BlobReader(file), function(zipReader) {
      zipReader.getEntries(function(entries) {
        entries.forEach(function(entry) {
          if (entry.filename === "mission.xml") {
            text = entry.getData(new zip.TextWriter(), function(text) {

              // Parse XML
              var parser = new DOMParser();
              var xml = parser.parseFromString(text,"text/xml");

              data_process_cf(xml)

            })
            return
          }
        })
      })
    }, function(message) {
      alert("Failed to load CF: " + message);
    })
  } else if(file_ext == 'kml') {
    // Standard XML 
    var fr = new FileReader()
    fr.onload = function(e) {
        var parser = new DOMParser();
        kmls = e.target.result;
        var xml = parser.parseFromString(e.target.result,"text/xml");
        kml = xml;
        data_process_kml(xml)
    }
    fr.readAsText(file);
  } else if(file_ext == 'kmz') {
    // doc.kml within a Zip File
    zip.createReader(new zip.BlobReader(file), function(zipReader) {
      zipReader.getEntries(function(entries) {
        entries.forEach(function(entry) {
          if (entry.filename === "doc.kml") {
            text = entry.getData(new zip.TextWriter(), function(text) {

              // Parse XML
              var parser = new DOMParser();
              var xml = parser.parseFromString(text,"text/xml");

              data_process_kml(xml)

            })
            return
          }
        })
      })
    }, function(message) {
      alert("Failed to load KMZ: " + message);
    })
  }

  // Replace fileInput so we can retrigger same file
  $(input).val('')
}

/******************************************************************************
* Bindings
******************************************************************************/

function data_squadron_set(sqn, callback) {

  sqn = sqn || $('#data-squadron').val();

  // If mission ID same as now, ignore
  if (squadron_data.id && sqn == squadron_data.id) {
    if (typeof(callback) === "function") {
      callback();
    }
    console.log("SKIPPY", squadron_data, sqn);
    return; 
  }

  // Updated squadron, update relevant data
  api_get(`squadrons/${sqn}`, function(resp) {

    // Create lookups of frequency to code
    var freqs = getDict(resp, 'freqs');
    var lookups = {};
    for (const [code, freq] of Object.entries(freqs)) {
      lookups[freq] = code;
    }

    resp['freqs_lookup'] = lookups;

    // Store squadron info
    squadron_data = resp;

    // Store current mission to see if teh data changes 
    var input = $('#data-mission');
    input.empty();
    for (var msn of resp.missions) {
      var option = new Option(msn.name, msn.id, msn.is_default, msn.is_default);
      input.append(option)
    }

    if (typeof(callback) === "function") {
      callback();
    }
  });
}


$("#data-squadron").change(function(e) {

  var value = $(this).val();

  // Update the squadron data and trigger if we've changed values
  data_squadron_set(value, function() {
    if (mission_data.id && mission_data.id != $('#data-mission').val()) {
      $('#data-mission').change()
    }
  });

});


function build_preset_lookups(ac, radios) {

  // There might not be mission radio data for all radios so we merge the keys
  // to ensure all readios are evaluated 
  
  var airframe_radios = Object.keys(getDict(airframes, ac, 'radios', 'presets'));

  var preset_lookups = {};
  for (const radio of airframe_radios) {
    for (const [preset, freq] of Object.entries(getDict(radios, radio))) {
      if (!preset_lookups[freq]) { preset_lookups[freq] = []; };
      preset_lookups[freq].push([radio, parseInt(preset)])
    }
  }

  // Consolidate down to what's displayed
  // If single radio then show RADIO-<PST>
  // If multiple on same radio, we show RAIDO-<FIRST_PST>
  // If multiple on different radios, we go PST, PST in aircraft radio priority order
  
  for (var [freq, data] of Object.entries(preset_lookups)) {
    // data is [[RADIO, PST]], so find unique radios and lowest presets
    var v = {}
    data.forEach((x) => v[x[0]] = !v[x[0]] || v[x[0]] > x[1] ? x[1] : v[x[0]] );

    if (Object.keys(v).length == 1)  {
      var k = Object.keys(v)[0];
      preset_lookups[freq] = `${k} ${v[k]}`;
    } else {
      var prio = getDict(airframes, ac, 'radios', 'priority');
      if (typeof(prio) !== "array") {
        prio = Object.keys(v);
      }
      var elems = [];
      for (const pick of prio) {
        if (v[pick]) {
          elems.push(v[pick]);
        }
      }
      if (ac == "AH-64D") {
        // If we have multiple, it must be on the FM since there can't be
        // overlaping freqs on any other radios, so prefix with FM
        preset_lookups[freq] = "FM " + elems.join(',');
      } else {
        preset_lookups[freq] = elems.join(',');
      }
    }
  }

  return preset_lookups;
}


function data_mission_set(mid, callback) {

  var input = $('#data-mission');

  var squadron_id = $("#data-squadron").val();
  var target_mission_id = mid || input.val();

  // we only do anythji
  if (mission_data.id && target_mission_id == mission_data.id) {
    if (typeof(callback) === "function") {
      callback();
    }
    return;
  }

  // Else we need to load the requested mission
  input.val(target_mission_id);

  // Updated squadron, update relevant data
  api_get(`squadrons/${squadron_id}/missions/${target_mission_id}`, function(resp) {

    // Our mission data presets aren't ideal for us to consume, so we'll format
    // the presets into AC => freq => radio, so we can do a direct lookup,
    // additionally the airframe doesn't always have presets so we merge our
    // mission presets with the airframe default presets

    var preset_lookups = {};

    for (const side of ['red', 'blue']) {
      for (const airframe of Object.keys(airframes)) {
        var defaults = getDict(airframes, airframe, 'radios', 'presets');
        var presets = getDictInit(resp, 'data', 'presets', 'presets', airframe, side);
        var merged = $.extend(true, {}, defaults, presets);

        // We save the merged list so we can print out an up-to-date PRESET
        // card or override them during the the MDC build
        var merged_dest = getDictInit(resp, 'data', 'presets', 'merged', airframe);
        if (!merged_dest.priority) {
          merged_dest.priority = getDict(airframes, airframe, 'radios', 'priority')
          merged_dest.data = {};
        }
        merged_dest['data'][side] = merged;

        var dest = getDictInit(resp, 'data', 'presets', 'lookups', airframe);
        dest[side] = build_preset_lookups(airframe, merged);
      }
    }

    // Merge "all" presets into both red / blue so we can look in one location
    if (!resp.data.agencies) { resp.data.agencies = {} }
    for (const [agency, agency_info] of Object.entries(getDict(resp, 'data', 'agencies', 'all'))) {
      for (const side of ['blue', 'red']) {
        if (!resp.data.agencies[side]) { resp.data.agencies[side] = {}; }
        if (!resp.data.agencies[side][agency]) {
          resp.data.agencies[side][agency] = agency_info;
        }
      }
    }

    // We also merge the DCS airfield agencies / Custom Airfield agencies lists
    var agency_map = [
      ['twr', 'Tower'],
      ['atis', 'ATIS'],
      ['uhf', 'AI Tower', 'pri'],
      ['vhf', 'AI Tower', 'sec'],
      ['par', 'PAR / LSO'],
      ['gnd', 'Ground'],
      ['ctrl', 'Control'],
    ];

    for (const [af, af_data] of Object.entries(getDict(resp, 'data', 'airfields'))) {
      for (var [key, agency, target] of agency_map) {

        if (!af_data[key]) { continue; }
        if (!target) { target = "pri"; }


        // We add the agency to both the ICAO and the Full name for ease of lookup
        var agency_name = `${af}: ${agency}`;
        for (const side of ['blue', 'red']) {
          if (!resp.data.agencies[side]) { resp.data.agencies[side] = {}; }
          if (!resp.data.agencies[side][agency_name]) {
            resp.data.agencies[side][agency_name] = {};
            if (af_data.icao) {
              resp.data.agencies[side][agency_name]['alt_names'] = [
                `${af_data.icao}: ${agency}`
              ];
            }
          }
          resp.data.agencies[side][agency_name][target] = af_data[key]
        }
      }
    }

    mission_data = resp;

    // Update our default bulls / presets
    data_update_default_bulls();
    update_presets();

    if (typeof(callback) === "function") {
      callback();
    }
  });
}

$("#data-mission").change(function(e) {
  data_mission_set();
});

function data_update_default_bulls() {

  var bulls = getDict(mission_data, 'data', 'bullseye', $('#data-side').val());
  $('#waypoints-bullseye-name').val(bulls['name']);
  $('#waypoints-bullseye-lat')[0].setAttribute('data-raw', bulls['lat']);
  $('#waypoints-bullseye-lon')[0].setAttribute('data-raw', bulls['lon']);

  // Refresh Waypoint Display, this maybe absent on first load as waypoints.js
  // loaded after data.js but that's ok
  if(typeof(waypoint_update) === "function") {
    waypoint_update();
  }

}

$("#data-route-dialog-submit").click(function(e, data) {

  var dialog = $('#data-route-dialog');
  var xml = dialog.data('xml');

  dialog.modal('hide');

  // Store the route on the flight-aircraft
  var mission_route = $('#data-route-dialog-waypoints').val()
  var mission_route_data = mission_route == 'None' ? null : dialog.data('routes')[mission_route];

  // Store the route data
  $('#flight-airframe').data('route', mission_route_data);

  if (mission_route_data) {

    // If we have checked route-only, then we avoid doing a lot of things 
    mission_route_data.route_only = $("#data-route-dialog-route-only").is(':checked');
    
    // Store we have waypoint style; store it
    var wp_style = $("#data-route-dialog input[name=data-route-dialog-wp-style]:checked").val();
    if (wp_style) {
      mission_route_data.wp_style = wp_style;
    }

    // Handle CF specifics if we're loading everything
    if (!mission_route_data.route_only && mission_route_data.xml_format == "cf") {

      // Data -> Theatre
      var theater = xml.querySelector('Mission > Theater').textContent;
      $('#data-theatre').val(theater);

      // If we have an aircraft, set the selector
      if (mission_route_data.aircraft) {
        $('#flight-airframe').val(mission_route_data.aircraft).change();
      }

      // Update bulls, if we have a route selected, use side's bulls, else default blue
      var bulls = xml.querySelector(mission_route_data.side + "Bullseye");
      $('#waypoints-bullseye-name').val(bulls.getElementsByTagName("Name")[0].textContent);

      var bulls_lat = bulls.getElementsByTagName("Lat")[0].textContent;
      $('#waypoints-bullseye-lat').attr('data-raw', bulls_lat);

      var bulls_lon = bulls.getElementsByTagName("Lon")[0].textContent;
      $('#waypoints-bullseye-lon').attr('data-raw', bulls_lon);
    }
  }

  // Trigger the route-updated
  $('#flight-airframe').trigger('data-route-updated');

  // Store the route for poi
  var poi_route = $('#data-route-dialog-poi').val()
  var poi_route_data = poi_route == 'None' ? null : dialog.data('routes')[poi_route];
  $('#flight-airframe').data('poi', poi_route_data).trigger('data-poi-updated');

  // Update coordiantes
  coordinate_update_fields();

});

/******************************************************************************
* Export / Import
******************************************************************************/

function data_export() {
    var form = $("#data-form")
    var disabled = form.find(':input:disabled').removeAttr('disabled')
    var data = form.serializeObject()
    disabled.attr('disabled', 'disabled');
    return data
}

function data_load(data, callback) {

  api_get('squadrons', function(resp) {

    // DOM update the data-squadron selection box
    var input = $('#data-squadron')
    input.empty();
    for (var sqn of resp) {
      // The default is either the one from initial data (saved MDC) or the DB default
      var def = data && data.squadron ? sqn.idx == data.squadron : sqn.is_default === 1; 
      var option = new Option(sqn.name, sqn.idx, def, def);
      input.append(option)
    }

    // Load the squadron data, we already set the default to match our squadron above
    data_squadron_set(null, function() {
      data_mission_set(data ? data.mission : null, function() {
        callback();
      });
    });
  });

  // We can always change side
  if (data) {
    $('#data-side').val(data.side).change();
  }
}

$('#data-side').on('change', function() {
  update_presets();
  data_update_default_bulls();
});


/******************************************************************************
* Init
******************************************************************************/

zip.workerScriptsPath = 'js/zip-js/';
