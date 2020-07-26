
geod = GeographicLib.Geodesic.WGS84;


function coordinate_dd2ddm(dd, precision) {

  if (isNaN(dd) || dd === "") {
    return ["", "", true];
  }

  var work = Math.abs(dd)
  deg = Math.floor(work);
  min = ((work - deg) * 60).toFixed(precision);
  if (min == 60) {
    min = 0;
    deg += 1;
  }
  return [deg, min, dd >= 0];
}

function coordinate_dd2dms(dd, precision) {

  if (isNaN(dd) || dd === "") {
    return ["", "", "", true];
  }

  var work, deg, sec, mins;

  work = Math.abs(dd)

  // returns array of deg, mins, sec
  deg  = Math.floor(work);
  work -= deg;
  work *= 60;

  mins = Math.floor(work);

  sec = work - mins;
  sec *= 60;

  // Round secs, and bubble
  sec = Number(sec.toFixed(precision))
  if (sec == 60) {
    sec = 0;
    mins++;
  }

  if (mins == 60) {
    mins = 0;
    deg++;
  }

  return [deg, mins, sec, dd >= 0]
}

function coordinate_display_format(td) {

  var elem = $(td)
  var value = parseFloat(td.getAttribute('data-raw'))
  var method = td.tagName == 'INPUT' ? 'val' : 'html'

  if (isNaN(value)) {
    elem[method]("")
    return;
  }

  var axis = elem.hasClass('coord-lon') ?
         value >= 0 ? "E " : "W " :
         value >= 0 ? "N " : "S ";

  var coordDisplay = td.getAttribute('data-fmt') || $('input[name=flight-coord]:checked').val()
  var llPrecision = td.getAttribute('data-dmp');
  if (llPrecision == null) {
    llPrecision = parseInt($("#flight-coord-decimals").val());
  } else {
    llPrecision = parseInt(llPrecision);
  }


  if (coordDisplay == 'ddm') {
    var arr = coordinate_dd2ddm(value, llPrecision);
    var deg = arr[0];
    var min = arr[1];

    elem[method](axis + pad(deg, 2) + "\xB0 " + pad(min, 2, null, llPrecision) + "'")
    return 
  }

  if (coordDisplay == 'dms') {

    var arr = coordinate_dd2dms(value, Math.max(llPrecision, 0));

    var deg = arr[0];
    var min = arr[1];
    var sec = arr[2];

    var rv = axis + pad(deg, 2) + "\xB0 " + pad(min, 2) + "' "

    // we do not add " as it's not seconds, but 1/6th of a minutes
    if (llPrecision == -1) {
      rv += (sec / 10).toFixed(0)
    } else {
      rv += pad(sec,2,null,llPrecision) + "\"";
    }

    elem[method](rv)
    return

  }

  // Default to DD
  elem[method](value.toFixed(llPrecision))
  return
}

function coordinate_input(td, lat_idx) {

  // Get the lat / lon from the table, and update coordinates before showing
  // Lat  stores if we are in an override state or not 
  var tr = td.closest('tr')

  // Get upstream defaults
  var coordDisplay = $('input[name=flight-coord]:checked').val()
  var llPrecision = parseInt($("#flight-coord-decimals").val())

  var lat_elem = td.closest('tr').cells[lat_idx]
  var fmt = lat_elem.getAttribute('data-fmt')

  var dlg = $('#coordinate-dialog');

  dlg.data({
    'lat': lat_elem.getAttribute('data-raw'),
    'lon': td.closest('tr').cells[lat_idx+1].getAttribute('data-raw'),
    'fmt': fmt || coordDisplay,
    'dmp': lat_elem.getAttribute('data-dmp') || llPrecision,
    'fmt_override': fmt !== null,
    'tr': tr,
    'lat_idx': lat_idx,
  })

  coordinate_update_fields();

  dlg.modal({
    backdrop: 'static',
  });
}


function coordinate_update_fields() {
  
  var dlg = $('#coordinate-dialog')
  var lat = parseFloat(dlg.data('lat'))
  var lon = parseFloat(dlg.data('lon'))

  lat = isNaN(lat) ? "" : lat
  lon = isNaN(lon) ? "" : lon

  $("#coordinate-dd-lat").val(lat)
  $("#coordinate-dd-lon").val(lon)

  var lat_ddm = coordinate_dd2ddm(lat, 5) 
  var lon_ddm = coordinate_dd2ddm(lon, 5) 

  $("#coordinate-ddm-lat-deg").val(lat_ddm[0])
  $("#coordinate-ddm-lat-min").val(lat_ddm[1])
  $("#coordinate-ddm-lat-axis").val(lat_ddm[2] ? 'N' : 'S')

  $("#coordinate-ddm-lon-deg").val(lon_ddm[0])
  $("#coordinate-ddm-lon-min").val(lon_ddm[1])
  $("#coordinate-ddm-lon-axis").val(lon_ddm[2] ? 'E' : 'W')

  var lat_dms = coordinate_dd2dms(lat, 3) 
  var lon_dms = coordinate_dd2dms(lon, 3) 

  $("#coordinate-dms-lat-deg").val(lat_dms[0])
  $("#coordinate-dms-lat-min").val(lat_dms[1])
  $("#coordinate-dms-lat-sec").val(lat_dms[2])
  $("#coordinate-dms-lat-axis").val(lat_dms[3] ? 'N' : 'S')

  $("#coordinate-dms-lon-deg").val(lon_dms[0])
  $("#coordinate-dms-lon-min").val(lon_dms[1])
  $("#coordinate-dms-lon-sec").val(lon_dms[2])
  $("#coordinate-dms-lon-axis").val(lon_dms[3] ? 'E' : 'W')

  // Override Attributes
  var dp = dlg.data('dmp')
  var fmt = dlg.data('fmt')
  var set = dlg.data('fmt_override')

  $('#coordinate-override-'+fmt).prop("checked", true).click();
  $('#coordinate-override-decimals').val(dp);
  $('#coordinate-override-unset').toggle(set);

}



function coordinate_dd_update() {
  // Update our table's data-raw, then refresh
  var lat_raw = parseFloat($("#coordinate-dd-lat").val())
  var lon_raw = parseFloat($("#coordinate-dd-lon").val())

  var dlg = $('#coordinate-dialog')
  dlg.data('lat', lat_raw.toFixed(12))
  dlg.data('lon', lon_raw.toFixed(12))

  coordinate_update_fields()
}

function coordinate_ddm_update() {

  var dlg = $('#coordinate-dialog')

  var lat_deg = parseInt($("#coordinate-ddm-lat-deg").val()) || 0;
  var lat_min = parseFloat($("#coordinate-ddm-lat-min").val()) || 0;
  var lat_axis = $("#coordinate-ddm-lat-axis").val() == 'N' ? 1 : -1;
  var lat_raw = (lat_deg + lat_min / 60) * lat_axis

  dlg.data('lat', lat_raw.toFixed(12))

  var lon_deg = parseInt($("#coordinate-ddm-lon-deg").val()) || 0;
  var lon_min = parseFloat($("#coordinate-ddm-lon-min").val()) || 0;
  var lon_axis = $("#coordinate-ddm-lon-axis").val() == 'E' ? 1 : -1;
  var lon_raw = (lon_deg + lon_min / 60) * lon_axis
  dlg.data('lon', lon_raw.toFixed(12))

  coordinate_update_fields()
}

function coordinate_dms_update() {

  var dlg = $('#coordinate-dialog')

  var lat_deg = parseInt($("#coordinate-dms-lat-deg").val()) || 0;
  var lat_min = parseInt($("#coordinate-dms-lat-min").val()) || 0;
  var lat_sec = parseFloat($("#coordinate-dms-lat-sec").val()) || 0;
  var lat_axis = $("#coordinate-dms-lat-axis").val() == 'N' ? 1 : -1;
  var lat_raw = (lat_deg + (lat_min / 60) + (lat_sec / 60 / 60)) * lat_axis

  dlg.data('lat', lat_raw.toFixed(12))

  var lon_deg = parseInt($("#coordinate-dms-lon-deg").val()) || 0;
  var lon_min = parseInt($("#coordinate-dms-lon-min").val()) || 0;
  var lon_sec = parseFloat($("#coordinate-dms-lon-sec").val()) || 0;
  var lon_axis = $("#coordinate-dms-lon-axis").val() == 'E' ? 1 : -1;
  var lon_raw = (lon_deg + (lon_min / 60) + (lon_sec / 60 / 60)) * lon_axis
  dlg.data('lon', lon_raw.toFixed(12))

  coordinate_update_fields()
}


// All the event handlers for changed on the coordinate input page...
$('#coordinate-dd-lat').change(coordinate_dd_update);
$('#coordinate-dd-lon').change(coordinate_dd_update);

$('#coordinate-ddm-lat-deg').change(coordinate_ddm_update);
$('#coordinate-ddm-lat-min').change(coordinate_ddm_update);
$('#coordinate-ddm-lat-axis').change(coordinate_ddm_update);
$('#coordinate-ddm-lon-deg').change(coordinate_ddm_update);
$('#coordinate-ddm-lon-min').change(coordinate_ddm_update);
$('#coordinate-ddm-lon-axis').change(coordinate_ddm_update);

$('#coordinate-dms-lat-deg').change(coordinate_dms_update);
$('#coordinate-dms-lat-min').change(coordinate_dms_update);
$('#coordinate-dms-lat-sec').change(coordinate_dms_update);
$('#coordinate-dms-lat-axis').change(coordinate_dms_update);
$('#coordinate-dms-lon-deg').change(coordinate_dms_update);
$('#coordinate-dms-lon-min').change(coordinate_dms_update);
$('#coordinate-dms-lon-sec').change(coordinate_dms_update);
$('#coordinate-dms-lon-axis').change(coordinate_dms_update);

$('#coordinate-dialog-submit').click(function() {
  var dlg = $('#coordinate-dialog')
  var lat = parseFloat(dlg.data('lat'))
  var lon = parseFloat(dlg.data('lon'))

  var lat_idx = dlg.data('lat_idx')
  var tr = dlg.data('tr')

  lat = isNaN(lat) ? "" : lat
  lon = isNaN(lon) ? "" : lon

  tr.cells[lat_idx].setAttribute('data-raw', lat)
  tr.cells[lat_idx+1].setAttribute('data-raw', lon)

  // Update any override attributes
  if (dlg.data('fmt_override')) {
    tr.cells[lat_idx].setAttribute('data-fmt', dlg.data('fmt'))
    tr.cells[lat_idx].setAttribute('data-dmp', dlg.data('dmp'))

    tr.cells[lat_idx+1].setAttribute('data-fmt', dlg.data('fmt'))
    tr.cells[lat_idx+1].setAttribute('data-dmp', dlg.data('dmp'))
  } else {
    tr.cells[lat_idx].removeAttribute('data-fmt')
    tr.cells[lat_idx].removeAttribute('data-dmp')
    tr.cells[lat_idx+1].removeAttribute('data-fmt')
    tr.cells[lat_idx+1].removeAttribute('data-dmp')
  }

  coordinate_display_format(tr.cells[lat_idx])
  coordinate_display_format(tr.cells[lat_idx+1])

  $(document).trigger('coordinates-changed')

  dlg.modal('hide');

});

function coordinate_update(lat, lon) {
  var dlg = $('#coordinate-dialog')
  dlg.data('lat', lat.toFixed(12))
  dlg.data('lon', lon.toFixed(12))
  coordinate_update_fields()
}

function coordinate_from_string(str) {
  // Parse provided string to work out a lat/lon value
  

  // CF:      N 25 06.333 E 056 20.417
  var cf_arr = /^\s*([NS])\s*([0-9]{1,2})\s+((?:[0-5]?[0-9])(?:\.[0-9]+)?)\s*,?\s*([EW])\s([0-9]{1,3})\s+((?:[0-5]?[0-9])(?:\.[0-9]+)?)\s*$/.exec(str)
  if (cf_arr) {
    var lat = (parseInt(cf_arr[2]) + parseFloat(cf_arr[3])/60) * (cf_arr[1] == 'N' ? 1 : -1);
    var lon = (parseInt(cf_arr[5]) + parseFloat(cf_arr[6])/60) * (cf_arr[4] == 'E' ? 1 : -1);
    coordinate_update(lat, lon)
    return
  } 

  // FSE / GCE combined
  // FSE:     Lat: 10.25N, Long: 67.6498W
  // Google:  23.24124, 112.42424
  // Additionally:  23.24124S, 112.42424W
  // Additionally:  23, 112W
  var fseg_arr = /^\s*(?:Lat:\s*)?(-?[0-9]{1,2}(?:\.[0-9]*)?)([NS])?\s*,\s*(?:Long:\s*)?(-?[0-9]{1,3}(?:\.[0-9]*)?)([EW])?\s*$/.exec(str)
  if (fseg_arr) {
    var lat = parseFloat(fseg_arr[1])
    var lon = parseFloat(fseg_arr[3])
    if (fseg_arr[2]) { lat *= (fseg_arr[2] == 'N' ? 1 : -1); }
    if (fseg_arr[4]) { lon *= (fseg_arr[4] == 'E' ? 1 : -1); }
    coordinate_update(lat, lon)
  }

  // Invalid
  $('#coordinate-string-feedback').text("Invalid coordinate format").fadeIn(100);
  setTimeout(function() {
        $('#coordinate-string-feedback').fadeOut(400);
  }, 2000);

}

$('#coordinate-string-submit').click(function() {
  coordinate_from_string($('#coordinate-string').val())
});

$('#coordinate-offset-submit').click(function() {

  var dlg = $('#coordinate-dialog')

  var brg = parseFloat($('#coordinate-offset-brg').val()) || 0;
  var rng = (parseFloat($('#coordinate-offset-rng').val()) || 0) * 1852;

  var lat = parseFloat(dlg.data('lat'))
  var lon = parseFloat(dlg.data('lon'))

  var r = geod.Direct(lat, lon, brg, rng)

  dlg.data('lat', r.lat2.toFixed(12))
  dlg.data('lon', r.lon2.toFixed(12))

  coordinate_update_fields()
});

$('#coordinate-override-submit').click(function() {

  var dlg = $('#coordinate-dialog')
  var coordDisplay = $('input[name=coordinate-override-fmt]:checked').val()
  var llPrecision = parseInt($("#coordinate-override-decimals").val())

  dlg.data({
    'fmt_override': true,
    'fmt': coordDisplay,
    'dmp': llPrecision,
  })

  $("#coordinate-override-unset").show()
});

$('#coordinate-override-unset').click(function() {
  var dlg = $('#coordinate-dialog')
  dlg.data('fmt_override', false)
  $("#coordinate-override-unset").hide()
});
