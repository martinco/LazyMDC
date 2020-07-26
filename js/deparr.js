
function setup_airfield(elem_id, airfield) {
    
    var [prefix, path] = /^(([^-]+-){2}).*/.exec(elem_id).slice(1,3);
        
    if (!mission_airfields[airfield] ) { return; }

    af_data = mission_airfields[airfield];
    
      // Departure ? If so used to update minimal arrival / alternate info
      var departure = prefix == "deparr-dep-"

      // Remove last - for path, and for alt, use arrival vfr
      path = path.slice(0,-1);
      if (path == "alt") {
        path = "arr"
      }

      // Handle the simple stuff
      (['tcn', 'par', 'atis', 'gnd', 'twr', 'ctrl', 'alt']).forEach(function(e) {
        var tgt = prefix + e;
        var val = af_data.hasOwnProperty(e) ? af_data[e] : ""
        $("#"+tgt).val(val).change()
      });

      // If we have an ICAO, set it
      $("#" + prefix + "icao").val(af_data.icao || "----")

      // Update Runway / Depature Info 
      var rw = $("#" + prefix + "runway")
      rw.children('option:not(:first)').remove();

      // If we are a Departure, we should set Arrival/Alternate minimal too
      // (Use Departure)
      
      var arr_rw = null;
      var alt_rw = null;

      if (departure) {
        arr_rw = $("#deparr-arr-min-runway")
        alt_rw = $("#deparr-alt-min-runway")
        arr_rw.children('option:not(:first)').remove();
        alt_rw.children('option:not(:first)').remove();

        var arr_vfr = $("#deparr-arr-min-vfr")
        var alt_vfr = $("#deparr-alt-min-vfr")
        arr_vfr.children('option:not(:first)').remove()
        alt_vfr.children('option:not(:first)').remove()
        alt_vfr.prop('disabled', 'disabled')
        arr_vfr.prop('disabled', 'disabled')

      }

      if (af_data.runways) {
        for (const [hdg, data] of Object.entries(af_data.runways)) {

          // Lookup VFR departures / arrivals for this
          var vfr = []
          if (af_data.vfr && af_data.vfr[path] && af_data.vfr[path][hdg]) {
            vfr = af_data.vfr[path][hdg]
          }

          // Get Arrivals if we're departure for the alt/arr minimal
          var vfr_arr = []
          if (departure && af_data.vfr && af_data.vfr['arr'] && af_data.vfr['arr'][hdg]) {
            vfr_arr = af_data.vfr['arr'][hdg]
          }

          // Get all our runways so we don't have to do things twice
          var rws = []

          if (data && typeof(data) == "object") {
            for (const [id, ils] of Object.entries(data)) {
              rws.push([hdg, hdg + id, ils])
            }
          } else {
            rws.push([hdg, hdg, data ? data : null])
          }

          rws.forEach(function(data) {

            var [hdg, name, ils] = data;

            var option = new Option(name, name)
            $(option).data('vfr', vfr)
            $(option).data('ils', ils)
            rw.append(option)

            if (departure) {
              [arr_rw,alt_rw].forEach(function(y) {
                var option = new Option(name, name)
                $(option).data('vfr', vfr_arr)
                $(option).data('ils', ils)
                y.append(option)
              })
            }
          });
        }
      }

      // Reset VFR Departures
      var dep = $("#" + prefix + "dep")
      dep.children('option:not(:first)').remove();
      dep.prop('disabled', 'disabled');

      if (departure) {
      }

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

function deparr_runway_update(event) {

  var option = $("option:selected", this);

  // Split to our prefix
  var prefix_data = /^(([^-]+-){2})(min-)?.*/.exec(this.id);
  var prefix = prefix_data[1];
  var min = prefix_data[3];

  if (min) {
    prefix = prefix+min;
  }

  $("#" + prefix + "ils").val(option.data('ils') || "----")

  // Disable, remove children and populate VFR if we have it
  var vfr = option.data('vfr')

  var vfr_sel = $("#" + prefix + "vfr")
  vfr_sel.children('option:not(:first)').remove();

  if (vfr) {
    for (var r of vfr) {
      vfr_sel.append(new Option(r, r))
      vfr_sel.removeAttr('disabled');
    }
  } else {
    vfr_sel.eq(0).prop('selected', true);
    vfr_sel.prop('disabled', 'disabled');
  }
  
}

// Set location autocompletes
$(".deparr-location").each(function(index, input) {
  deparr_location_autocomplete(input);
});

$(".deparr-runway").each(function(index, input) {
  $(input).on('change', deparr_runway_update);
});

function deparr_pst(evt) {
  $("#" + evt.target.id + "-pst").val(lookup_preset($(evt.target).val()))
}

// Changes for PST
$(".deparr-pst").each(function(index, input) {
  $(input).on('change', deparr_pst)
});

$(document).on('flight-airframe-changed', function(e) {
  $(".deparr-pst").each(function(index, input) {
    $(input).change()
  })
});

function deparr_load(data) {
    // Handle in order as we need to rely on the clicks() to trigger select updates for the values
    // This means we have to do it in order...
    
    // UseDep
    
    // Handle the Arr/Alt Radios
    ['alt', 'arr'].forEach(function(x) {
        var val = data[x]['usedep'] ? "true" : "false";
        $('#deparr-' + x + '-usedep-' + val).click();
    });
    
    ['dep', 'alt', 'arr'].forEach(function(loc) {
        
        var usedep = data[loc].hasOwnProperty('usedep') ? data[loc]['usedep'] : false;
        var skip = {};
        
        // Location first to populate runway, then runway, then VFR
        ['location', 'runway', 'vfr'].forEach(function(id) {
            var elem_id = usedep ? "#deparr-" + loc + "-min-" + id : "#deparr-" + loc + "-" + id;
            var elem = $(elem_id)
            
            if (id == 'runway') {
                setup_airfield(elem_id.substr(1), skip['location'])
            }
            
            elem.val(data[loc][id]).change()
            skip[id] = data[loc][id]
            
        });
        
        for (const [k, v] of Object.entries(data[loc])) {
            if (skip[k]) {
                continue
            }
            var elem_id = '#deparr-' + loc + "-" + k;
            var elem = $(elem_id);
            if (elem) {
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
    
    var use_min = {}
    ret['alt']['usedep'] = use_min['alt'] = data['alt-usedep'] == "true"
    ret['arr']['usedep'] = use_min['arr'] = data['arr-usedep'] == "true"
    
    for (var [k, v] of Object.entries(data)) {
        var loc = k.substr(0,3)
        k = k.substr(4)
        if (k == 'usedep') { continue }
        if (['alt', 'arr'].includes(loc) && use_min[loc]) {
            if (k.startsWith('min-')) {
                ret[loc][k.substr(4)] = v
            }
        } else {
            ret[loc][k] = v
        }
    }
    
    return ret
    
}



