
geod = GeographicLib.Geodesic.WGS84;

const PROJ4_THEATRES = {
  'PersianGulf': {
    'central_meridian': 57,
    'easting': 75755.99999999645,
    'northing': -2894933.0000000377,
  },
  'Nevada': {
    'central_meridian': -117,
    'easting': -193996.80999964548,
    'northing': -4410028.063999966,
  },
  'Caucasus': {
    'central_meridian': 33,
    'easting': -99516.9999999732,
    'northing': -4998114.999999984,
  },
  'Normandy': {
    'central_meridian': -3,
    'easting': -195526.00000000204,
    'northing': -5484812.999999951,
  },
  'TheChannel': {
    'central_meridian': 3,
    'easting': 99376.00000000288,
    'northing': -5636889.00000001,
  },
  'Syria': {
    'central_meridian': 39,
    'easting': 282801.00000003993,
    'northing': -3879865.9999999935,
  },
  'MarianaIslands': {
    'central_meridian': 147,
    'easting': 238417.99999989968,
    'northing': -1491840.000000048,
  },
  'SinaiMap': {
    'central_meridian': 33,
    'easting': 169221.9999999585,
    'northing': -3325312.9999999693,
  },
  'Kola': {
    'central_meridian': 21,
    'easting': -62702.00000000087,
    'northing': -7543624.999999979
  }
}


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

var Coords = function() {

  this._theatre = '';
  this._theatre_name = '';
  this._display_format = 'ddm';
  this._display_decimals = 3;

  // This is awful, but the proj4js doesn't quite expose what we want and this
  // is easier
  this._re_mgrs = new RegExp([
        /^([0-9]+[A-Z])/,
        /([A-Z][A-Z])/,
        /([0-9]+)/,
  ].map(r => r.source).join(''))

  this.get_transform = function(theatre) {

    let origins = PROJ4_THEATRES[theatre];

    return '+proj=tmerc ' +
      '+lat_0=0 ' +
      `+lon_0=${origins.central_meridian} ` +
      '+k_0=0.9996 ' +
      `+x_0=${origins.easting} ` +
      `+y_0=${origins.northing} ` + 
      '+towgs84=0,0,0,0,0,0,0 ' +
      '+units=m ' +
      '+vunits=m ' +
      '+ellps=WGS84 ' +
      '+no_defs ' +
      '+axis=neu';
  }

  this.set_theatre = function(theatre) {
    this._theatre_name = theatre;
    this._theatre = this.get_transform(theatre);
  }

  this.xz_to_ll = function(x, z) {
    let ll = proj4(
      this._theatre,
      proj4.Proj("WGS84"),
      proj4.toPoint([z, x]));

    return {
      'x': x,
      'z': z,
      'lat': ll.y,
      'lon': ll.x,
    }
  }

  this.ll_to_xz = function(lat, lon, theatre) {
    var xy = proj4(
      proj4.Proj("WGS84"),
      this._theatre,
      proj4.toPoint([lon, lat]));

    return {
      'x': Math.round(xy.y) + 0,
      'z': Math.round(xy.x) + 0,
      'lat': lat,
      'lon': lon,
    }
  }

  this.ll_to_mgrs = function(lat, lon, accuracy) {
    if (isNaN(lat) || isNaN(lon)) {
      return "";
    }
    let re = this._re_mgrs.exec(proj4.mgrs.forward([lon, lat], accuracy));


    // Insert a space half way through
    let dec = re[3].length/2
    let loc = re[3].slice(0, dec) + " " + re[3].slice(dec);

    return `${re[1]} ${re[2]} ${loc}`
  }


  this.set_display_format = function(new_format) {
    if (new_format == this._display_format) { return; }
    this._display_format = new_format;
    this.update_display();
  }

  this.set_display_decimals = function(new_decimals) {
    if (new_decimals == this._display_decimals) { return; }
    this._display_decimals = new_decimals;
    this.update_display();
  }

  this.dd2dms = function(dd, precision) {

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

  this.format_ll = function(lat, lon, llPrecision, display_format) {

    if (display_format == undefined) {
      display_format = this._display_format;
    }

    if (isNaN(llPrecision) || llPrecision==undefined) {
      llPrecision = this._display_decimals;
    }
   
    if (display_format == "mgrs") {
      return [this.ll_to_mgrs(lat, lon, llPrecision), ""]
    }

    return [
      this.format_value(lat, false, llPrecision, display_format),
      this.format_value(lon, true, llPrecision, display_format)
    ]
  }

  this.format_value = function(value, lon=false, llPrecision, display_format) {
    if (isNaN(value)) {
      return ""
    }

    var axis = lon ?
           value >= 0 ? "E " : "W " :
           value >= 0 ? "N " : "S ";

    if (isNaN(llPrecision) || llPrecision==undefined) {
      llPrecision = this._display_decimals;
    }

    if (display_format == undefined) {
      display_format = this._display_format;
    }
   
    var deg_pad = 2;

    if (display_format == 'ddm' || display_format == 'cf') {
      var arr = coordinate_dd2ddm(value, llPrecision);
      var deg = arr[0];
      var min = arr[1];

      if (display_format == 'cf') {
        return axis + pad(deg, lon ? 3 : 2, "0") + " " + pad(min, 2, 0, llPrecision);
      }

      return axis + pad(deg, deg_pad, " ") + "\xB0" + pad(min, 2, null, llPrecision) + "'";

    }

    if (display_format == 'dms') {

      var arr = this.dd2dms(value, Math.max(llPrecision, 0));

      var deg = arr[0];
      var min = arr[1];
      var sec = arr[2];

      var rv = axis + pad(deg, deg_pad, " ") + "\xB0" + pad(min, 2) + "'"

      // we do not add " as it's not seconds, but 1/6th of a minutes
      if (llPrecision == -1) {
        rv += (sec / 10).toFixed(0)
      } else {
        rv += pad(sec,2,null,llPrecision) + "\"";
      }

      return rv;
    }

    // Default to DD
    return value.toFixed(llPrecision);
  }

  this.format_td = function(td) {

    var lat_elem = $(td)

    // If the td has a override, use it 
    let [lat, lon] = this.format_ll(
      parseFloat(td.getAttribute('data-lat')),
      parseFloat(td.getAttribute('data-lon')),
      parseInt(td.getAttribute('data-dmp')),
      td.getAttribute('data-fmt'));

    // Lat elem is current
    if(lat_elem.tagName == 'INPUT') {
      lat_elem.val(lat);
    } else {
      if (td.hasAttribute('data-fmt-combo')) {
        lat_elem.html(`${lat} ${lon}`);
      } else {
        lat_elem.html(lat);
      }
    }

    // Lon elem is next
    let tr = lat_elem.closest('tr')
    if (tr[0] && td.cellIndex) {

      let lon_elem = $(tr[0].cells[td.cellIndex+1]);
      if(lon_elem.tagName == 'INPUT') {
        lon_elem.val(lon);
      } else {
        lon_elem.html(lon);
      }

      // If no lon, then we're probably MGRS and can merge the cells
      if (lon === '') {
        lon_elem.css('display', 'none');
        lat_elem.attr('colspan', 2);
      } else {
        lat_elem.removeAttr('colspan');
        lon_elem.css('display', '');
      }
    }
    return
  }

  this.update_display = function() {
    $('.coord-ctrl').each(function(idx, td) {
      this.format_td(td);
    }.bind(this));
  }

};

coords = new Coords();

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/ /g, "&nbsp;");
}



function coordinate_input(td, lat_idx, callback) {

  // Get the lat / lon from the table, and update coordinates before showing
  // Lat  stores if we are in an override state or not 
  var tr = td.closest('tr')

  // Get upstream defaults
  var coordDisplay = $('input[name=flight-coord]:checked').val()
  var llPrecision = parseInt($("#flight-coord-decimals").val())

  var lat_elem = td.closest('tr').cells[lat_idx];
  var fmt = lat_elem.getAttribute('data-fmt');

  var dlg = $('#coordinate-dialog');

  dlg.data({
    'lat': lat_elem.getAttribute('data-lat'),
    'lon': lat_elem.getAttribute('data-lon'),
    'fmt': fmt || coordDisplay,
    'dmp': lat_elem.getAttribute('data-dmp') || llPrecision,
    'fmt_override': fmt !== null,
    'tr': tr,
    'lat_idx': lat_idx,
    'callback': callback,
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

  var lat_dms = coords.dd2dms(lat, 3) 
  var lon_dms = coords.dd2dms(lon, 3) 

  $("#coordinate-dms-lat-deg").val(lat_dms[0])
  $("#coordinate-dms-lat-min").val(lat_dms[1])
  $("#coordinate-dms-lat-sec").val(lat_dms[2])
  $("#coordinate-dms-lat-axis").val(lat_dms[3] ? 'N' : 'S')

  $("#coordinate-dms-lon-deg").val(lon_dms[0])
  $("#coordinate-dms-lon-min").val(lon_dms[1])
  $("#coordinate-dms-lon-sec").val(lon_dms[2])
  $("#coordinate-dms-lon-axis").val(lon_dms[3] ? 'E' : 'W')

  // Update the text to the current display format
  if (lat && lon) {

    let [str_lat, str_lon] = coords.format_ll(lat, lon, dlg.data('dmp'), dlg.data('fmt'))
    $('#coordinate-string').val(`${str_lat} ${str_lon}`);

    [str_lat, str_lon] = coords.format_ll(lat, lon, 3, 'cf');
    $('#coordinate-cf-string').html(`${str_lat} ${str_lon}`);

  } else {
    $('#coordinate-string').val("");
    $('#coordinate-cf-string').val("");
  }
  
  // Override Attributes
  var dp = dlg.data('dmp')
  var fmt = dlg.data('fmt')
  var set = dlg.data('fmt_override')

  $('#coordinate-override-'+fmt).prop("checked", true).click();
  $('#coordinate-override-decimals').val(dp);
  $('#coordinate-override-unset').toggle(set);

}

function coordinate_focus_next(evt) {
  var tgt = $(evt.target);
  var inputs = $('#coordinate-dialog').find(':input');
  inputs.eq( inputs.index(tgt) + 1 ).focus().select();
}

function coordinate_dd_update(evt) {

  // Update our table's data-lat/lon, then refresh
  var lat_raw = parseFloat($("#coordinate-dd-lat").val())
  var lon_raw = parseFloat($("#coordinate-dd-lon").val())

  var dlg = $('#coordinate-dialog')
  dlg.data('lat', lat_raw.toFixed(12))
  dlg.data('lon', lon_raw.toFixed(12))

  coordinate_update_fields();

  coordinate_focus_next(evt);

}

function coordinate_ddm_update(evt) {

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

  coordinate_focus_next(evt);
}

function coordinate_dms_update(evt) {

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

  coordinate_focus_next(evt);
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

  var mod_lat = parseFloat(tr.cells[lat_idx].getAttribute('data-lat')) != lat;
  var mod_lon = parseFloat(tr.cells[lat_idx].getAttribute('data-lon')) != lon;

  tr.cells[lat_idx].setAttribute('data-lat', lat)
  tr.cells[lat_idx].setAttribute('data-lon', lon)

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

  // Update our fmt
  coords.format_td(tr.cells[lat_idx])

  var callback = dlg.data('callback');
  if (callback && typeof(callback) == "function") {
    callback();
  }

  // used by admin to highlight modified etc.
  if (mod_lat || mod_lon) {
    $(tr.cells[lat_idx]).trigger('coordinates-changed');
  }

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
  var cf_arr = /^\s*([NS])\s*([0-9]{1,2})\s+((?:[0-5]?[0-9])(?:\.[0-9]+)?)\s*,?\s*([EW])\s*([0-9]{1,3})\s+((?:[0-5]?[0-9])(?:\.[0-9]+)?)\s*$/.exec(str)
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
  var fseg_arr = /^\s*(?:Lat:\s*)?(-?[0-9]{1,2}(?:\.[0-9]*)?)\s*([NS])?\s*(?:,|\s)\s*(?:Long:\s*)?(-?[0-9]{1,3}(?:\.[0-9]*)?)\s*([EW])?\s*$/.exec(str)
  if (fseg_arr) {
    var lat = parseFloat(fseg_arr[1])
    var lon = parseFloat(fseg_arr[3])
    if (fseg_arr[2]) { lat *= (fseg_arr[2] == 'N' ? 1 : -1); }
    if (fseg_arr[4]) { lon *= (fseg_arr[4] == 'E' ? 1 : -1); }
    coordinate_update(lat, lon)
    return
  }

  // MGRS
  let mgrs_arr = new RegExp([
      /^\s*/,                                                        // Allow start padding
      /([0-6]?[0-9])\s*([ABCDEFGHJKLMNPQRSTYVWX])\s*/,               // Grid Zone: C-X omiiting I and O (not including poles / UPS)
      /([ABCDEFGHJKLMNPQRSTUVWXYZ])\s*([ABCDEFGHJKLMNPQRSTUV])\s*/,  // 100km square, column and row, [A-Z, A-V] excluding I and O
      /([0-9 ]+)/,                                                // location reference, this needs to be two groups of eql. length
                                                                     // But we'll handle that in the test function
      /$/
  ].map(function(r) {return r.source}).join('')).exec(str);

  if(mgrs_arr) {
    
    let mgrs = (() => {
      // Simple checks before sending it of to proj4
      
      let grid_zone = parseInt(mgrs_arr[0]);
      if (isNaN(grid_zone) || grid_zone > 60 || grid_zone == 0) { return null; }

      // ensure our numbers are multiple of 2
      let locref = mgrs_arr[5].replaceAll(' ', '');
      if (locref.length % 2 != 0) { return null; }

      // Finally we're good to go, just merge all our capture groups except 0
      mgrs_arr.shift();
      return proj4.mgrs.inverse(mgrs_arr.join('').replaceAll(' ', ''));

    })();

    if (mgrs) {
      coordinate_update(mgrs[1], mgrs[0])
      return
    }

  }

  // DMS
  //var dms_arr = /^\s*([NS])?\s*(-?[0-9]+)(?:\xB0|\s)\s*([0-9]+)(?:'|\s)\s*([0-9]+(?:\.[0-9]+)?)(?:"|\s)\s*([NS])?\s*([EW])?\s*(-?[0-9]+)(?:\xB0|\s)\s*([0-9]+)(?:'|\s)\s*([0-9]+(?:\.[0-9]+)?)"?\s*([EW])?\s*$/.exec(str);
  var dms_arr = new RegExp([
    /^\s*/,                                           // Allow start padding
    /([NS])?\s*/,                                     // We allow N at the start, or end, so it's optional
    /(-?[0-9]+)/,                                     // Degrees is always required
    /(?:(?:\xB0|\s)([0-9]+)\s*)?/,                    // Minutes are optional, but if present, need to be preceded by a space or degree sign, integer to differentiate between DMS / DDM
      /(?:(?:'|\s)\s*([0-9]+(?:\.[0-9]+)?)"?)?\s*/,   // Seconds are also optional, but if present, need to be preceeded by a ' or space from minutes and o ptioanll end in a "
      /([NS])?\s*/,                                   // Allow NS at end
    /([EW])?\s*/,                                     // Repeat for East West 
    /(-?[0-9]+)/,
    /(?:(?:\xB0|\s)([0-9]+))?\s*/,
      /(?:(?:'|\s)\s*([0-9]+(?:\.[0-9]+)?)"?)?\s*/,
      /([EW])?\s*/,
    /$/
  ].map(function(r) {return r.source}).join('')).exec(str);


  if (dms_arr) {
    var lat = parseInt(dms_arr[2]);
    if (dms_arr[3]) { lat += parseInt(dms_arr[3])/60; }
    if (dms_arr[4]) { lat += parseFloat(dms_arr[4])/3600; }
    if (dms_arr[1] && dms_arr[1] == 'S') { lat *= -1; }
    else if (dms_arr[5] && dms_arr[5] == 'S') { lat *= -1; }

    var lon = parseInt(dms_arr[7]);
    if (dms_arr[8]) { lon += parseInt(dms_arr[8])/60; }
    if (dms_arr[9]) { lon += parseFloat(dms_arr[9])/3600; }
    if (dms_arr[6] && dms_arr[6] == 'W') { lon *= -1; }
    else if (dms_arr[10] && dms_arr[10] == 'W') { lon *= -1; }

    coordinate_update(lat, lon)
    return
  }

  // DDM, This only needs to cater for full format DDM as leaving of the decimal makes it matched by DMS above
  var ddm_arr = new RegExp([
    /^\s*/,                            // Allow start padding
    /([NS])?\s*/,                      // We allow N at the start, or end, so it's optional
    /(-?[0-9]+)(?:\xB0|\s)\s*/,        // Degrees is always required and must end in a space to be valid
    /([0-9]+(?:\.[0-9]+)?)'?\s*/,      // Minutes
    /([NS])?\s*/,                      // Cater for NS at end of string
    /([EW])?\s*/,
    /(-?[0-9]+)(?:\xB0|\s)\s*/,
    /([0-9]+(?:\.[0-9]+)?)'?\s*/,
    /([EW])?\s*/,
    /$/
  ].map(function(r) {return r.source}).join('')).exec(str);
  
  if (ddm_arr) {
    var lat = parseInt(ddm_arr[2]) + parseFloat(ddm_arr[3])/60;
    if (ddm_arr[1] && ddm_arr[1] == 'S') { lat *= -1; }
    else if (ddm_arr[4] && ddm_arr[4] == 'S') { lat *= -1; }

    var lon = parseInt(ddm_arr[6]) + parseFloat(ddm_arr[7])/60;
    if (ddm_arr[5] && ddm_arr[5] == 'W') { lon *= -1; }
    else if (ddm_arr[8] && ddm_arr[8] == 'W') { lon *= -1; }

    coordinate_update(lat, lon)
    return
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

$("input[name=coordinate-override-fmt]").change(function() {
  let val = $(this).val();
  if (val === "mgrs" || val === "dd") {
    $("#coordinate-override-decimals").val(5);
  } else if (val == "ddm") {
    $("#coordinate-override-decimals").val(3);
  } else {
    $("#coordinate-override-decimals").val(0);
  }
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

  // Update the coord display to show the updated Set from String
  coordinate_update_fields()

  $("#coordinate-override-unset").show()
});

$('#coordinate-override-unset').click(function() {
  var dlg = $('#coordinate-dialog')
  dlg.data('fmt_override', false)
  $("#coordinate-override-unset").hide()
});


$('#coordinates-string-tooltip').tooltip({
  template: '<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner tooltip-coords"></div></div>'
});



