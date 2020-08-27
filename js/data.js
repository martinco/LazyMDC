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
    mission_airfields = airfields[theatre];
    return;
  }

  mission_airfields = jQuery.extend(true, {}, airfields[theatre])

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

    // Handle name changes between CF + DCS
    if (aircraft == "F-16C bl.52d") {
      aircraft = "F-16C"
    }

    var units = route_xml.querySelector('Units').textContent;

    var route_title = `[${task}] ${name} ${units}x${aircraft}`

    // Store so we can fire the event
    route_data[name] = {
      side: side,
      aircraft: aircraft,
      task: task,
      units: units,
      xml: route_xml
    }

    // Add options to route selector
    select_wp.append(new Option(route_title, name));
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

    // If the mission contains a theatre, update it
    if (mission_data[mission].theatre) {
      $('#data-theatre').val(mission_data[mission].theatre).change()
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
  }
});

$('#data-theatre').change(function(e) {
  generate_mission_airfields()
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
  $('#flight-airframe').data('route', mission_route_data);

  if (mission_route_data) {
    $('#flight-airframe').val(mission_route_data.aircraft).change();
  }


});

/******************************************************************************
* Export / Import
******************************************************************************/

function data_export() {
    return $('#data-form').serializeObject()
}

function data_load(data) {
    $('#data-mission').val(data.mission).change()
    $('#data-theatre').val(data.theatre).change()
}



/******************************************************************************
* Init
******************************************************************************/

zip.workerScriptsPath = 'js/zip-js/';

// opulate the Mission Data
(function() {

  var input = $('#data-mission')
  for (x in mission_data) {
    var def = mission_data[x].default === true
    var option = new Option(x, x, def, def)
    input.append(option)
  }

}())

generate_mission_airfields();
