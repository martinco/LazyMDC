/******************************************************************************
* Functions
******************************************************************************/

mission_airfields = {}

function generate_mission_airfields() {

  // When we change the mission_airfields we want to regenerate the waypoints /
  // airfields (carrier additions) 
  
  var theatre = $('#data-theatre').val();
  var mission = $('#data-mission').val();

  if (!mission_data.hasOwnProperty(mission) || !mission_data[mission].hasOwnProperty('airfields')) {
    mission_airfields = theatres[theatre]['airfields'];
    return;
  }

  mission_airfields = jQuery.extend(true, {}, theatres[theatre]['airfields'])

  for (const [key, value] of Object.entries(mission_data[mission]['airfields'])) {
    if (mission_airfields.hasOwnProperty(key)) {
      jQuery.extend(true, mission_airfields[key], value);
    } else {
      mission_airfields[key] = jQuery.extend(true, {}, value);
    }
  };

}

function data_process_cf(xml) {

  // Reset / Present the route dialog
  var select_wp = $("#data-route-dialog-waypoints");
  var select_poi = $("#data-route-dialog-poi");
  $("#data-route-dialog-poi-container").hide();

  // Reset the form to wipe out any previous routes (first option = None)
  select_wp.children('option:not(:first)').remove();
  select_poi.children('option:not(:first)').remove();

  // Build up a list of routes / store against their names so we can 
  var route_data = new Object(); 

  var routes = xml.getElementsByTagName("Route")

  // Iterate the routes and collect Name, Task, Side, AC
  for (var i = 0; i < routes.length; i++) {

    var route_xml = routes[i];
    console.log(route_xml);

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
        route_append = " - route only - Select F-16C_50 in CF for loadout";
        load_loadout = false;
      }
      aircraft = "F-16C"

    // F-18C Variants: F/A-18C, FA-18C_hornet
    } else if (aircraft == 'F/A-18C' || aircraft == 'FA-18C_hornet') {
      if (aircraft != 'FA-18C_hornet') {
        route_append = " - route only - Select FA-18C_hornet in CF for loadout";
        load_loadout = false;
      }
      aircraft = "FA-18C"

    // F-14 Variants: F-14A, F-14B
    } else if (aircraft.startsWith("F-14")) {
      if (aircraft != 'F-14B') {
        route_append = " - route only - select F-14B in CF for loadout";
        load_loadout = false;
      }
      aircraft = "FA-14B"

    // A-10 Variants: A-10A, A-10C
    } else if (aircraft.startsWith("A-10")) {
      if (aircraft != 'A-10C') {
        route_append = " - route only - Select A-10C in CF for loadout";
        load_loadout = false;
      }
      aircraft = "FA-14B"

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
      side: side,
      aircraft: aircraft,
      task: task,
      units: units,
      xml: route_xml
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
  console.log(file.name);
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
        save(data, true, true)
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
  }

  // Replace fileInput so we can retrigger same file
  $(input).val('')
}

/******************************************************************************
* Bindings
******************************************************************************/

$("#data-mission").change(function(e) {

  var mission = $(e.target).val()

  if (mission_data.hasOwnProperty(mission)) {

    // If the mission contains a theatre, update it, and disable theatre
    if (mission_data[mission].theatre) {
      var input_theatre = $('#data-theatre');
      input_theatre.val(mission_data[mission].theatre).change();
      input_theatre.attr('disabled', 'disabled');
    }
    
    // If the mission contains transition / FL info, update set those
    if (mission_data[mission].hasOwnProperty('navdata')) {
      if (mission_data[mission]['navdata'].hasOwnProperty('transition-alt')) {
        $("#waypoints-transition-alt").val(mission_data[mission]['navdata']['transition-alt'])
      }
      if (mission_data[mission]['navdata'].hasOwnProperty('transition-level')) {
        $("#waypoints-transition-level").val(mission_data[mission]['navdata']['transition-level'])
      }
    }

    // Update to the default bullseye for the mission
    // var bulls = mission_data[mission].bullseye ? mission_data[mission].bullseye :
  } else {
    $('#data-theatre').removeAttr('disabled');
  }

});

function data_update_default_bulls() {
  // Try Mission, then theatre
  var mission = $('#data-mission').val()
  var theatre = $('#data-theatre').val()

  var bulls = mission_data[mission] && mission_data[mission]['bullseye'] ?
              mission_data[mission]['bullseye'] : theatres[theatre]['bullseye'];

  $('#waypoints-bullseye-name').val(bulls['label']);
  $('#waypoints-bullseye-lat')[0].setAttribute('data-raw', bulls['lat']);
  $('#waypoints-bullseye-lon')[0].setAttribute('data-raw', bulls['lon']);

}

$('#data-theatre').change(function(e) {
  generate_mission_airfields()
  data_update_default_bulls();
});

$("#data-route-dialog-waypoints").change(function(e) {

  var value = $(e.target).val();
  var poi_container = $("#data-route-dialog-poi-container");
  var routes = $("#data-route-dialog").data('routes');
  
  var route = routes[value];

  if(route.aircraft == 'F-14B') {
    poi_container.show()
  } else {
    poi_container.hide()
  }

});

$("#data-route-dialog-submit").click(function(e, data) {

  var dialog = $('#data-route-dialog');
  var xml = dialog.data('xml');

  dialog.modal('hide');

  // Data -> Theatre
  var theater = xml.querySelector('Mission > Theater').textContent;
  $('#data-theatre').val(theater);

  // Store the route on the flight-aircraft
  var mission_route = $('#data-route-dialog-waypoints').val()
  var mission_route_data = mission_route == 'None' ? null : dialog.data('routes')[mission_route];
  $('#flight-airframe').data('route', mission_route_data).trigger('data-route-updated');

  if (mission_route_data && mission_route_data.aircraft) {
    $('#flight-airframe').val(mission_route_data.aircraft).change();
  }


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

function data_load(data) {
    $('#data-mission').val(data.mission).change()
    $('#data-theatre').val(data.theatre).change()
}



/******************************************************************************
* Init
******************************************************************************/

zip.workerScriptsPath = 'js/zip-js/';

// opulate the Mission Data / Theatres
(function() {

  var input = $('#data-theatre');
  for (var x in theatres) {
    var def = theatres[x].default === true
    var option = new Option(theatres[x].display_name, x, def, def)
    input.append(option)
  }

  var input = $('#data-mission')
  for (var x in mission_data) {
    var def = mission_data[x].default === true
    var option = new Option(x, x, def, def)
    input.append(option)
  }

  // Issue changed on mission to ensure the theatre / etc. gets updated
  $('#data-mission').change()

}())

generate_mission_airfields();
