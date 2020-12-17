
function setup_airfield(elem_id, airfield) {
    
    var [prefix, path] = /^(([^-]+-){2}).*/.exec(elem_id).slice(1,3);
        
    if (!mission_airfields[airfield] ) { return; }

    af_data = mission_airfields[airfield];
    
    // Departure ? If so used to update  arrival / alternate info
    var departure = prefix == "deparr-dep-";

    // Handle the simple stuff
    (['tcn', 'par', 'atis', 'gnd', 'twr', 'ctrl', 'alt']).forEach(function(e) {
      var tgt = prefix + e;
      var val = af_data.hasOwnProperty(e) ? af_data[e] : ""
      $("#"+tgt).val(val).change()
    });

    // If we have an ICAO, set it
    $("#" + prefix + "icao").val(af_data.icao || "----")

}

function deparr_location_autocomplete(input) {
  $(input).autocomplete({
    source: function(request, response) {
      waypoint_lookup_function(request, response, true)
    },
    minLength: 2,
    select: function(event, ui) {
      // Split to our direction + prefix
      setup_airfield(event.target.id, ui.item.label)
    }
  });
}

// Set location autocompletes
$(".deparr-location").each(function(index, input) {
  deparr_location_autocomplete(input);
});

$(document).on('flight-airframe-changed', function(e) {
  $(".deparr-pst").each(function(index, input) {
    $(input).change()
  })
});

function deparr_load(data) {
    // Handle in order as we need to rely on the clicks() to trigger select
    // updates for the values This means we have to do it in order...
    
    // Handle the Arr/Alt usedep radio buttons
    ['alt', 'arr'].forEach(function(x) {
        var val = data[x]['usedep'] ? "true" : "false";
        $('#deparr-' + x + '-usedep-' + val).click();
    });
    
    ['dep', 'alt', 'arr'].forEach(function(loc) {

        if (data[loc].hasOwnProperty('usedep') && data[loc]['usedep']) {
          return
        }
        
        // Handle location to prep the other fields, then we update them
        // with the saved data
        var elem_id = "#deparr-" + loc + "-location"
        var elem = $(elem_id)

        setup_airfield(elem_id.substr(1), data[loc]['location'])
        elem.val(data[loc]['location'])
            
        for (var [k, v] of Object.entries(data[loc])) {
            if (k == 'location') {
                continue
            }
            var elem_id = '#deparr-' + loc + "-" + k;
            var elem = $(elem_id);
            if (elem) {
                if (k == "icao") {
                  v = v || "----";
                }
                elem.val(v)
                if (elem.nodeType == "SELECT") {
                    elem.change()
                }
            }
            
        }
    })
}

function deparr_export() {
    
    var form = $("#deparr-form")
    
    // Temp enable disabled fields so we get the value (e.g. ICAO)
    var disabled = form.find(':input:disabled').removeAttr('disabled')
    var data = $("#deparr-form").serializeObject();
    disabled.attr('disabled', 'disabled');
    
    var ret = {
        'dep': {},
        'alt': {},
        'arr': {},
    }
    
    ret['alt']['usedep'] = data['alt-usedep'] == "true"
    ret['arr']['usedep'] = data['arr-usedep'] == "true"
    
    for (var [k, v] of Object.entries(data)) {
        var loc = k.substr(0,3)
        k = k.substr(4)
        if (k == 'usedep') { continue }
        ret[loc][k] = v
    }
    
    return ret
    
}



