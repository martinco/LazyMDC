var sections = {};
var pages = []
var foo;

geod = GeographicLib.Geodesic.WGS84;

var re_mgrs = new RegExp([
    /^([0-9]+[A-Z])/,
    /([A-Z][A-Z])/,
    /([0-9]+)/,
].map(r => r.source).join(''));

function get_brg(from_lat, from_lon, to_lat, to_lon, kmh=false) {
  // Get Distance (nm) / Azimuth
  var r = geod.Inverse(from_lat, from_lon, to_lat, to_lon);
  var distance = r.s12/1000;

  var azi = r.azi1;
  if (azi < 0) {
    azi += 360;
  }

  if (!kmh) {
    distance /= 1.852;
  }

  return [Math.round(azi).toString().padStart(3, '0'), Math.round(distance).toFixed(0)]
}

function display_coord(data, info, split_mgrs=false) {

  // if lat_fmt or flight-coord
  var coord = info['lat_fmt'] === undefined ? data.flight['flight-coord'] : info['lat_fmt'];
  var decimals = parseInt(info['lat_dmp'] === undefined ? data.flight['flight-coord-decimals'] : info['lat_dmp']);

  if (coord === 'mgrs') {

    // Make sure lat, lon are nice
    let lat = parseFloat(info['lat']);
    let lon = parseFloat(info['lon']);

    if (isNaN(lat) || isNaN(lon)) {
      return ["", "", true];
    }


    // Insert a space half way through
    let re = re_mgrs.exec(proj4.mgrs.forward([lon, lat], decimals));
    let dec = re[3].length/2
    let loc = re[3].slice(0, dec) + " " + re[3].slice(dec);
    return [`${re[1]} ${re[2]}${split_mgrs ? '<br>' : ' '}${loc}`, '']
  }

  return [
    ll(data, info, true),
    ll(data, info, false),
  ]

}

function ll(data, info, lat) {

  if (!info) return "";

  var prefix = lat ? 'lat' : 'lon';

  // No data, return empty line
  if (!info[prefix]) return ""

  var pos = parseFloat(info[prefix])

  if (isNaN(pos)) return info;

  var pad = 0;

  if (lat) {
      axis = pos > 0 ? "N " : "S "
      pad = 2
  } else {
      axis = pos > 0 ? "E" : "W"
      pad = 3
  }

  // Get Coordinate Format

  var coord = info['lat_fmt'] === undefined ? data.flight['flight-coord'] : info['lat_fmt'];
  var decimals = parseInt(info['lat_dmp'] === undefined ? data.flight['flight-coord-decimals'] : info['lat_dmp']);

  var dec_width = 2 + decimals

  // Add one for the decimal point
  if (decimals) dec_width += 1

  if (coord == 'dd') {
    return pos.toFixed(decimals);
  }

  var work = Math.abs(pos)
  var deg = Math.floor(work)

  work -= deg
  work *= 60

  if (coord == "ddm") {

    min = Math.round((work + Number.EPSILON) * (10**decimals)) / (10**decimals)
    if (min == 60) {
      min = 0
      deg += 1
    }

    return `${axis}${deg.toString().padStart(pad)}&deg;${min.toFixed(decimals).padStart(dec_width, 0)}`
  }

  var min = Math.floor(work)
  work -= min
  work *= 60

  var sec = Math.round((work + Number.EPSILON) * (10**decimals)) / (10**decimals)

  if (sec == 60) {
    sec = 0
    min += 1
  }

  if (min == 60) {
    min = 0
    deg += 1
  }

  // DMS
  return `${axis}`
    + `${deg.toString().padStart(pad)}&deg;`
    + `${min.toString().padStart(2, 0)}'`
    + `${sec.toFixed(decimals).padStart(dec_width, 0)}`

}

function alt_formatter(data, alt) {

  if (!alt) {
    return ''
  }

  var alt_i = parseInt(alt)
  var trans = parseInt(data.waypoint['transition-alt']);

  if (isNaN(alt_i)) return alt;
  if (isNaN(trans)) return alt;

  if (alt_i > trans)
    return `FL${alt_i/100}`

  return alt_i.toFixed()
}

function dist_formatter(dist) {
  // Round to nearest whole number to avoid DP and save space
  var float_val = parseFloat(dist);
  if (isNaN(float_val)) {
    return "";
  }
  return Math.round(float_val).toFixed();
}

function gs_formatter(gs) {
  var float_val = parseFloat(gs);
  if (isNaN(float_val)) {
    return "";
  }
  return (Math.round(float_val / 5)*5).toFixed(0);
}

var getUrlParameter = function getUrlParameter(sParam) {
  var sPageURL = window.location.search.substring(1),
  sURLVariables = sPageURL.split('&'),
  sParameterName,
    i;

  for (i = 0; i < sURLVariables.length; i++) {
    sParameterName = sURLVariables[i].split('=');

    if (sParameterName[0] === sParam) {
      return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
    }
  }
};

function ntos(x) {

  var n = parseFloat(x)
  if (isNaN(n)) {
    return ''
  }

  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function Header(data, unit, page) {

  var data = data;
  var unit = unit;
  var page = page;

  var package = data['package']['package-member'] != 'package-false';

  this.dom = function() {

    var html = `
      <table class="kb-width std" style="table-layout: fixed">

        <colgroup>
          <col style="width: 130${unit}" />
          <col style="width:77${unit}" />
          <col class="" style="width:50${unit}" />
          <col style="width:77${unit}" />
          <col class="" style="width:50${unit}" />`;

    if (package) {
      html += `
          <col style="width: 80${unit}" />
      `
    }

    html += `
          <col />
          <col style="width: 70${unit}" />
          <col style="width: 40${unit}" />
        </colgroup>

        <tbody>

          <tr class="header">
            <th>CALLSIGN</th>
            <th colspan=2>PRI</th>
            <th colspan=2>SEC</th>`;

    if (package) {
      html += `
            <th>PACKAGE</th>`;
    }

    var callsign = data['mission']['mission-callsign'];
    if (data['mission']['mission-flight-number']) {
      callsign += `-${data['mission']['mission-flight-number']}`;
    }

    html += `
            <th>MISSION</th>
            <th>ID</th>
            <th>PAGE</th>
          </tr>
          
          <tr>
            <td class="text-center">${callsign}</td>
            <td class="text-center text-bold rb0">${data['mission']['mission-pri-freq'] ? data['mission']['mission-pri-freq'].value || "" : ""}</td>
            <td class="lp5 lb0">${data['mission']['mission-pri-freq'] ? data['mission']['mission-pri-freq'].pst || "" : ""}</td>
            <td class="text-center text-bold rb0">${data['mission']['mission-sec-freq'] ? data['mission']['mission-sec-freq'].value || "" : ""}</td>
            <td class="lp5 lb0">${data['mission']['mission-sec-freq'] ? data['mission']['mission-sec-freq'].pst || "" : ""}</td>`;

    if (package) {
      html += `
            <td class="text-center overflow-hidden">${data['package']['package-name'].toUpperCase()}</td>`;
    }

    html += `
            <td class="lp5">${data["mission"]['mission-desc']}</td>
            <td class="text-center overflow-hidden">${data["mission"]['mission-id']}</td>
            <td class="text-center pageid">${page}</td>
          </tr>
        </tbody>
      </table>
    `;

    return $(html);
  }();

  this.set_page_count = function(count) {
    this.dom.find('.pageid').text(`${page}/${count}`);
  }

}

function Flight(data, unit) {

  var data = data;
  var unit = unit;

  var cols = (function() {
    // Variable columns base on AC etc.
    var ac = data['flight']['flight-airframe'];
    
    // Header, width, classes
    var cols = [
      ["#", 40, "text-center"],
      ["PILOT", 0, "lp5"],
    ]

    if (ac == "F-14B") {
      cols.push(
        ['RIO', 0, "lp5"])
    }

    if (data['flight']['members'][0] && data['flight']['members'][0]['mids a'] !== undefined) {
      cols.push(['MIDS A', 60, "text-center"]);
    }

    if (data['flight']['members'][0] && data['flight']['members'][0]['mids b'] !== undefined) {
      cols.push(['MIDS B', 60, "text-center"]);
    }

    if (data['flight']['members'][0] && data['flight']['members'][0]['hm device'] !== undefined) {
      cols.push(['HM DEVICE', 80, "text-center"]);
    }

    if (["F-14B", "FA-18C"].includes(ac)) {
      cols.push(['BORT', 60, "text-center"])
    }

    if (ac == "A-10C") {
      cols.push(...[
        ['GID', 60, "text-center"],
        ['OID', 60, "text-center"]])
    }

    if (!["UH-1H", "Ka-50", "Mi-8MT"].includes(ac)) {
      cols.push(['TCN', 60, "text-right rp5"]);
    }

    if (data['flight']['members'][0] && data['flight']['members'][0]['lsr'] !== undefined) {
      cols.push(['LSR', 60, "text-center"]);
    }

    if (data['flight']['members'][0] && data['flight']['members'][0]['lss'] !== undefined) {
      cols.push(['LSS', 60, "text-center"]);
    }

    cols.push(['SQUAWK', 60, "text-center"]);

    return cols;
  })();

  var header_data = (function() {

    var colgroup = `<colgroup>`;
    var header = `
      <tbody>
        <tr class="header">`;

    for (var col of cols) {
      colgroup += `<col`
      if (col[1]) {
        colgroup += ` style="width: ${col[1]}${unit}"`
      }
      colgroup += `/>`
      header += `<th>${col[0]}</th>`;
    }
    header += `</tr>`;

    return $(`
      <table class="kb-width std" style="table-layout: fixed">
      ${colgroup}
      ${header}`);

  })();

  this.table = function() {
    return $(header_data);
  }

  this.footer = function() {
    return $(`</tbody></table>`);
  }

  this.content = (function () {
    var elems = [];
    for (var member of data['flight']['members']) {
      var html = `<tr>`;
      for (var col of cols) {
        html += `<td`;
        if (col[2]) {
          html += ` class="${col[2]}"`;
        }
        html += `>`;

        if (col[0] == "#") {
          if (data['mission']['mission-flight-number']) {
            html += data['mission']['mission-flight-number'] + "-" + member['id'];
          } else {
            html += member['id'];
          }
        } else {
          html += member[col[0].toLowerCase()];
        }


        html += `</td>`;
      }
      html += `</tr>`;
      elems.push($(html));
    }
    return elems;
  })();

}

function Package(data, unit) {

  var data = data;
  var unit = unit;

  this.table = function() {
    return $(`
      <table class="kb-width std std-striped" style="table-layout: fixed">

        <colgroup>
          <col style="width:100${unit}" />
          <col style="width:140${unit}" />
          <col style="width:80${unit}" />
          <col style="width:60${unit}" />
          <col style="width:45${unit}" />
          <col style="" />
        </colgroup>

        <tbody>
          <tr class="header">
            <th>CALLSIGN</th>
            <th>AIRCRAFT</th>
            <th>FREQ</th>
            <th>TCN</th>
            <th>IDM</th>
            <th>MISSION</th>
          </tr>
        </tbody>
      </table>`);
  }

  this.content = (function () {

    if (data['package']['package-member'] == "package-false") {
      return [];
    }

    var elems = [];
    for (var member of data['package']['members']) {
      var non_empty = Object.values(member).filter(function(x) { return x });
      if (!non_empty.length) {
        continue
      }

      elems.push($(`
        <tr>
          <td class="lp5">${member['callsign']}</td>
          <td class="lp5">${member['aircraft']}</td>
          <td class="text-center text-bold">${member['freq'] ? member['freq'].value || "" : ""}</td>
          <td class="text-right rp5 text-bold">${member['tcn']}</td>
          <td class="lp5">${member['idm']}</td>
          <td class="lp5">${member['mission']}</td>
        </tr>`))
    }
    return elems;
  })();

}

function F16CMDS (data, unit) {
  var data = data;
  var unit = unit;

  this.nobreak = true;

  this.table = function() {
    
    if (!data.profiles || !data.profiles.cmds) {
      return $();
    }

    var modes = Object.keys(data.profiles.cmds);
    var cols = modes.length;

    var head = `
      <table class="kb-width std std-col" style="table-layout: fixed">
        <colgroup>
          <col style="width:40${unit}">`;

    for (var i=0; i < cols; i++) {
      head += '<col /><col />';
    }

    head += `
        </colgroup>
        <thead class="header">
          <tr>
            <th rowspan=2></th>`;

    for (const col in modes) {
      var mode = modes[col];
      var title = mode;
      if (data.profiles.cmds[mode]['MODIFIED']) {
        title = `**${title}**`;
      }
      head += `<th colspan=2 class="text-center text-bottom${col != cols-1 ? ' rb2' : ''}">${title}</th>`;
    }

    head += `
          </tr>
          <tr>
            <td style="display:none"></td>
    `;

    for (const col in modes) {
      var mode = modes[col];
      ['CHAFF', 'FLARE'].forEach(function(cms) {
        var title = cms;
        if (data.profiles.cmds[mode][cms]['MODIFIED']) {
          title = `**${cms}**`;
        }

        head += `
          <td class="text-center header${cms == 'FLARE' && col != cols-1 ? ' rb2' : ''}">${title}</td>`;
      });
    }


    head += `
        </tr>
      </thead>
      <tbody>
      </tbody>
    </table>`;

    return $(head);
  };

  this.content = (function() {

    var format = function(value, prefix) {
      prefix = prefix || 2;

      var dotIdx = value.indexOf('.');
      if (dotIdx == -1) {
        return value.padStart(prefix, " ");
      }
      
      var elems = value.split('.');
      return elems[0].padStart(prefix, " ") + "." + elems[1];
    }


    var elems = [];

    if (!data.profiles || !data.profiles.cmds) {
      return elems;
    }

    var modes = Object.keys(data.profiles.cmds);

    // Fields we want are: BQ, BI, SQ, SI, BINGO
    ['BQ', 'BI', 'SQ', 'SI'].forEach(function(param) {
      var row = `
        <tr>
          <td class="text-center">${param}</td>`;
          
      for (var idx in modes) {
        ['CHAFF', 'FLARE'].forEach(function(cms) {
          var mode = modes[idx]
          // The max is 3<DP>3, so we format appropriately
          var cls = 'lp5';
          if (cms == 'FLARE' && idx != modes.length -1) {
            cls += ' rb2';
          }
          row += `<td class="${cls}">${format(data.profiles.cmds[mode][cms][param], param == 'SI' ? 3 : 2).replace(/  /g, "&nbsp;")}</td>`;
        });
      };
      row += '</tr>';
      elems.push($(row));
    });

    return elems;
  })();

}

function F16Harm (data, unit) {
  var data = data;
  var unit = unit;

  this.nobreak = true;

  this.table = function() {
    
    if (!data.profiles || !data.profiles.harm) {
      return $();
    }

    var html = `
      <table class="kb-width std std-striped" style="table-layout: fixed">
        <colgroup>
          <col width="38${unit}"/>
          <col width="38${unit}"/>
          <col />
          <col width="38${unit}"/>
          <col width="38${unit}"/>
          <col />
          <col width="38${unit}"/>
          <col width="38${unit}"/>
          <col />
        </colgroup>
        <thead class="thead-light">
          <tr>
    `;

    for (var table = 0; table < 3; table++) {
      var title = 'TABLE ' + (table+1);
      if (data.profiles.harm[table].MODIFIED) {
        title = `**${title}**`;
      }
      html += `<th colspan=3 class="text-center${table == 2 ? '' :' rb2'}">${title}</th>`;
    }

    html += `
          </tr>
          <tr>
            <th class="text-center">ID</th>
            <th class="text-center">RWR</th>
            <th class="text-center rb2">Name</th>
            <th class="text-center">ID</th>
            <th class="text-center">RWR</th>
            <th class="text-center rb2">Name</th>
            <th class="text-center">ID</th>
            <th class="text-center">RWR</th>
            <th class="text-center">Name</th>
          </tr>
        </thead>
        <tbody>
        </tbody>
      </table>`;
    
    return $(html);
  };

  this.content = (function() {

    var elems = [];

    if (!data.profiles || !data.profiles.harm) {
      return elems;
    }

    for (var row = 0; row < 5; row++ ){

      var html = `<tr>`;
      for (var col = 0; col < 9; col++) {
        var table = Math.floor(col / 3);
        var attr = ['id', 'rwr', 'name'][col % 3];

        var cls = (col + 1) % 3  == 0
          ? (col != 8 ? 'lp5 rb2 text-harm' : 'lp5 text-harm')
          : "text-center";


        html += `<td class="${cls}">${data.profiles.harm[table]['values'][row][attr]}</td>`;
      }
      html += `</tr>`;
      elems.push($(html));
    }

    return elems;
  }.bind(this))();

}

function F16HTS (data, unit) {
  var data = data;
  var unit = unit;

  this.nobreak = true;

  this.table = function() {
    if (!data.profiles || !data.profiles.hts) {
      return $();
    }

    var html = `
    <table class="std std-striped" style="width: 100%; table-layout: fixed"">
      <colgroup>
        <col width="38${unit}"/>
        <col width="38${unit}"/>
        <col />
        <col width="38${unit}"/>
        <col width="38${unit}"/>
        <col />
        <col width="20%"/>
        <col />
      </colgroup>
      <thead class="thead-light">
        <tr>
          <th colspan=6 class="text-center rb2">HTS MAN TABLE</th>
          <th colspan=2 class="text-center">HTS CLASSES</th>
        </tr>
        </thead>
      <tbody>
      </tbody>
    </table>
    `;
    
    return $(html);
  };

  this.content = (function() {

    var elems = [];

    if (!data.profiles || !data.profiles.hts) {
      return elems;
    }

    for (var row = 0; row < 5; row++){

      var html = `<tr>`;
      for (var col = 0; col < 8; col++) {
          if (row == 0 && col < 6) {
            if (col % 3 == 0) html += `<th class="text-center">ID</th>`;
            if (col % 3 == 1) html += `<th class="text-center">RWR</th>`;
            if (col % 3 == 2) html += `<th class="text-center rb2">Name</th>`;
          }
          else if (row > 0 && col < 6) {
            var attr = ['id', 'rwr', 'name'][col % 3];

            let tableIdx = (row - 1) + (col > 2 ? 4 : 0);

            let content = "-";
            if (data.profiles.hts.hasOwnProperty('man') && data.profiles.hts.man.length > tableIdx) {
              content = data.profiles.hts.man[tableIdx][attr];
            }

            var cls = attr === "name"
              ? "lp5 rb2 text-harm"
              : "text-center";

            html += `<td class="${cls}">${content}</td>`;
          }
          else {
            let classId = row + 1 + (col == 7 ? 5 : 0);
            const on = !data.profiles.hts.hasOwnProperty('classes') || data.profiles.hts.classes.includes(classId);
            html += `<td class="text-left">${on ? "X" : "-"} CLASS ${classId}</td>`;
          }
      }
      html += `</tr>`;

      elems.push($(html));
    }

    return elems;
  }.bind(this))();

}

var Loadout = function(data, unit) {

  var data = data;
  var unit = unit;

  // This template has 27 character limit on store name, so these are required
  // to reamp long names to more kneeboard friendly format.

  var clsid_renames = {
    "LAU3_HE151": "LAU-3 - 19 MK151 HE",
    "LAU3_HE5": "LAU-3 - 19 MK5 HEAT",
    "LAU3_WP156": "LAU-3 - 19 MK156 WP",
    "LAU3_WP1B": "LAU-3 - 19 WTU-1/B WP",
    "LAU3_WP61": "LAU-3 - 19 MK61 WP",
    "{BRU33_LAU10}": "BRU-33 LAU-10 - 4 ZUNI MK71",
    "{BRU33_LAU61}": "BRU-33 LAU-61 - 19 M151",
    "{BRU33_LAU68}": "BRU-33 LAU-68 - 7 M151",
    "{BRU33_LAU68_MK5}": "BRU-33 LAU-68 - 7 MK5",
    "{BRU33_2*LAU10}": "BRU-33 - 2 LAU-10 - 4 ZUNI",
    "{BRU33_2*LAU61}": "BRU-33 - 2 LAU-61 - 19 M151",
    "{BRU33_2*LAU68}": "BRU-33 - 2 LAU-68 - 7 M151",
    "{BRU33_2*LAU68_MK5}": "BRU-33 - 2 LAU-68 - 7 MK5",
    "LAU-115_2*LAU-127_AIM-9L": "LAU-115 - 2 LAU-127 AIM-9L",
    "LAU-115_2*LAU-127_AIM-9M": "LAU-115 - 2 LAU-127 AIM-9M",
    "LAU-115_2*LAU-127_AIM-9X": "LAU-115 - 2 LAU-127 AIM-9X",
    "LAU-115_LAU-127_AIM-9L": "LAU-115C LAU-127 AIM-9L",
    "LAU-115_LAU-127_AIM-9M": "LAU-115C LAU-127 AIM-9M",
    "LAU-115_LAU-127_AIM-9X": "LAU-115C LAU-127 AIM-9X",
    "{FPU_8A_FUEL_TANK}": "FPU-8A Tank 330 gal",
    "LAU-105_1*AIM-9L_L": "LAU-105 AIM-9L",
    "LAU-105_1*AIM-9M_L": "LAU-105 AIM-9M",
    "LAU-105_2*AIM-9L": "LAU-105 - 2 AIM-9L",
    "{DB434044-F5D0-4F1F-9BA9-B73027E18DD3}": "LAU-105 - 2 AIM-9M",
    "{69926055-0DA8-4530-9F2F-C86B157EA9F6}": "LAU-131 - 7 M151 (HE)",
    "{2AF2EC3F-9065-4de5-93E1-1739C9A71EF7}": "LAU-131 - 7 M156 (WP)",
    "{DAD45FE5-CFF0-4a2b-99D4-5D044D3BC22F}": "LAU-131 - 7 M257",
    "{6D6D5C07-2A90-4a68-9A74-C5D0CFFB05D9}": "LAU-131 - 7 M274",
    "{319293F2-392C-4617-8315-7C88C22AF7C4}": "LAU-131 - 7 MK5 (HE)",
    "{1CA5E00B-D545-4ff9-9B53-5970E292F14D}": "LAU-131 - 7 MK61 (Practice)",
    "{D22C2D63-E5C9-4247-94FB-5E8F3DE22B71}": "LAU-131 - 7 Mk1 (Practice)",
    "{DDCE7D70-5313-4181-8977-F11018681662}": "LAU-131 - 7 WTU1B",
    "{LAU-131 - 7 AGR-20A}": "LAU-131 - 7 M151 HE APKWS",
    "{LAU-131 - 7 AGR-20 M282}": "LAU-131 M282 - MPP APKWS",
    "{A021F29D-18AB-4d3e-985C-FC9C60E35E9E}": "LAU-68 - 7 M151 (HE)",
    "{4F977A2A-CD25-44df-90EF-164BFA2AE72F}": "LAU-68 - 7 M156(WP)",
    "{647C5F26-BDD1-41e6-A371-8DE1E4CC0E94}": "LAU-68 - 7 M257",
    "{0877B74B-5A00-4e61-BA8A-A56450BA9E27}": "LAU-68 - 7 M274",
    "{FC85D2ED-501A-48ce-9863-49D468DDD5FC}": "LAU-68 - 7 MK1 (Practice)",
    "{174C6E6D-0C3D-42ff-BCB3-0853CB371F5C}": "LAU-68 - 7 MK5 (HE)",
    "{65396399-9F5C-4ec3-A7D2-5A8F4C1D90C4}": "LAU-68 - 7 MK61 (Practice)",
    "{1F7136CB-8120-4e77-B97B-945FF01FB67C}": "LAU-68 - 7 WTU1B (Practice)",
    "LAU_131x3_HYDRA_70_M151": "LAU-131*3 - 7 M151 (HE)",
    "LAU_131x3_HYDRA_70_M156": "LAU-131*3 - 7 M156 (WP)",
    "LAU_131x3_HYDRA_70_M257": "LAU-131*3 - 7 M257",
    "LAU_131x3_HYDRA_70_M274": "LAU-131*3 - 7 M274",
    "LAU_131x3_HYDRA_70_MK1": "LAU-131*3 - 7 MK1",
    "LAU_131x3_HYDRA_70_MK5": "LAU-131*3 - 7 MK5",
    "LAU_131x3_HYDRA_70_MK61": "LAU-131*3 - 7 MK61",
    "LAU_131x3_HYDRA_70_WTU1B": "LAU-131*3 - 7 WTU1B",
    "{64329ED9-B14C-4c0b-A923-A3C911DA1527}": "LAU-68*3 - 7 M151 (HE)",
    "{C2593383-3CA8-4b18-B73D-0E750BCA1C85}": "LAU-68*3 - 7 M156 (WP)",
    "{E6966004-A525-4f47-AF94-BCFEDF8FDBDA}": "LAU-68*3 - 7 M257",
    "{4C044B08-886B-46c8-9B1F-AB05B3ED9C1D}": "LAU-68*3 - 7 M274",
    "{443364AE-D557-488e-9499-45EDB3BA6730}": "LAU-68*3 - 7 MK1",
    "{9BC82B3D-FE70-4910-B2B7-3E54EFE73262}": "LAU-68*3 - 7 MK5 (HE)",
    "{C0FA251E-B645-4ce5-926B-F4BC20822F8B}": "LAU-68*3 - 7 MK61",
    "{A1853B38-2160-4ffe-B7E9-9BF81E6C3D77}": "LAU-68*3 - 7 WTU1B",
    "{LAU-131x3 - 7 AGR-20A}": "3 LAU-131 M151 - HE APKWS",
    "{LAU-131x3 - 7 AGR-20 M282}": "3 LAU-131 M282 - MPP APKWS",
    "LAU-105_1*AIM-9L_R": "LAU-105 AIM-9L",
    "LAU-105_1*AIM-9M_R": "LAU-105 AIM-9M",
    "{AV8BNA_AERO1D}": "AERO 1D 300gal Tank ",
    "{AV8BNA_AERO1D_EMPTY}": "AERO 1D 300gal Tank (Empty)",
    "{AIM-9M-ON-ADAPTER}": "LAU-7 AIM-9M",
    "{M2KC_02_RPL541}": "RPL 541 2000L Tank ",
    "{M2KC_02_RPL541_EMPTY}": "RPL 541 2000L Tank (Empty)",
    "{M2KC_RPL_522}": "RPL 522 1300L Tank",
    "{M2KC_RPL_522_EMPTY}": "RPL 522 1300L Tank (Empty)",
    "{M2KC_08_RPL541}": "RPL 541 2000L Tank ",
    "{M2KC_08_RPL541_EMPTY}": "RPL 541 2000L Tank (Empty)",
    "M261_MK151": "M261 - 19 MK151 HE",
    "M261_MK156": "M261 - 19 MK156 WP",
    "XM158_M151": "XM158 - 7 M151 HE",
    "XM158_M156": "XM158 - 7 M156 WP",
    "XM158_M257": "XM158 - 7 M257",
    "XM158_M274": "XM158 - 7 M274",
    "XM158_MK1": "XM158 - 7 MK1 Practice",
    "XM158_MK5": "XM158 - 7 MK5 HE",
  }

  this.table = function() {
    return $(`
      <table class="kb-width std std-striped" style="table-layout: fixed; border:0px">
        <colgroup>
          <col style="width:45${unit}" />
          <col />
          <col style="width:70${unit}" />
          <col style="width:80${unit}" />
          <col style="width:60${unit}" />
          <col style="width:80${unit}" />
          <col style="width:80${unit}" />
          <col style="width:80${unit}" />
        </colgroup>

        <tbody>
          <tr class="header">
            <th class="rb2" colspan=3>PYLONS</th>
            <th class="rb2" colspan=2>OTHER</th>
            <th colspan=3>WEIGHT</th>
          </tr>
        </tbody>
      </table>`);
  };

  this.content = [(function () {

    // Info Columns
    var other_col = [];
    if (data.loadout.gun) {
      other_col.push(['GUN', ntos(data['loadout']['gun']) + "%", "text-bold"]);
    }

    other_col.push(['FUEL', ntos(data['loadout']['fuel']) + "%", "text-bold"]);

    if (data.loadout.chaff) { other_col.push(['CHAFF', ntos(data.loadout.chaff), ""]); };
    if (data.loadout.flare) { other_col.push(['FLARE', ntos(data.loadout.flare), ""]); };
    if (data.loadout.tiger && data.loadout.tiger !== "0") { other_col.push(['TIGER', ntos(data.loadout.tiger), ""]); };
    if (data.loadout.joker) { other_col.push(['JOKER', ntos(data.loadout.joker), ""]); };
    if (data.loadout.bingo) { other_col.push(['BINGO', ntos(data.loadout.bingo), ""]); };

    // Weights Columns
    var weights = [];
    lbs_col = [];
    lbs_col.push(['EMPTY', ntos(data.loadout.weights.oew)]);
    lbs_col.push(['STORES', ntos(data.loadout.weights.stores)]);
    lbs_col.push(['FUEL', ntos(data.loadout.fuel_lbs)]);
    lbs_col.push(['TOTAL', ntos(data.loadout.weights.total)]);

    // MTOW/MLW Section 
    var mtow_field = ntos(data.loadout.weights.mtow_field);
    var mlw_field = ntos(data.loadout.weights.mlw_field);

    var single_max = mtow_field == mlw_field;
    var mtow_rows = single_max ? 2 : 3;

    // Table Sizing
    var pylons_count = data.loadout.pylons.length;
    var loop_count = Math.max(pylons_count, other_col.length, lbs_col.length + mtow_rows)

    html = "";
    for (var n = 0; n < loop_count; n++) {
      var elem = data.loadout.pylons[n] || {}

      var pyl_name = elem.pyl;
      var store = elem.store || '';
      var weight = '';

      if (store) {
        clsid = elem.clsid || '';
        weight = ntos(elem.weight || 0);

        if (clsid_renames[clsid]) {
          store = clsid_renames[clsid];
        }
      }

      var other_itm  = other_col[n];
      var lbs_itm = lbs_col[n];

      html += `
        <tr style="border:0">`

      if (pyl_name) {
        html += `
          <td class="text-center">${pyl_name}</td>
          <td class="lp5" style="overflow:hidden; white-space: nowrap">${store}</td>
          <td class="text-right rp5 rb2">${weight}</td>`;
      } else if (n < other_col.length) {
        html += `<td></td><td></td><td class="rb2"></td>`;
      } else {
        html += `<td class="bg-blank" style="border:0" colspan=3></td>`;
      }

      if (other_itm) {
        html += `
          <td class="lp5">${other_itm[0]}</td>
          <td class="text-center rb2 ${other_itm[2]}">${other_itm[1]}</td>`;
      } else {
        html += `<td class="bg-blank" style="border:0" colspan=2></td>`;
      }

      if (n == loop_count-mtow_rows) {
        html += `<th class="text-center"></th>`;

        if (data.loadout.weights.mtow_cvn) {
          html += `
            <th class="text-center">FIELD</th>
            <th class="text-center">CVN</th>`;
        } else if (data.loadout.weights.mtow_vtol) {
          html += `
            <th class="text-center">ROLLING</th>
            <th class="text-center">VTOL</th>`;
        } else {
          html += `<th colspan=2 class="text-center">FIELD</th>`;
        }
      } else if (n == loop_count-mtow_rows+1) {
        if (data.loadout.weights.mtow_cvn) {
          html += `
            <th class="text-center">MAX T/O</th>
            <td class="text-right rp5">${ntos(data['loadout']['weights']['mtow_field'])}</td>
            <td class="text-right rp5">${ntos(data['loadout']['weights']['mtow_cvn'])}</td>`;
        } else if (data.loadout.weights.mtow_vtol) {
          html += `
            <th class="text-center">${single_max ? 'MAX' : 'MAX T/O'}</th>
            <td class="text-right rp5">${ntos(data['loadout']['weights']['mtow_field'])}</td>
            <td class="text-right rp5">${ntos(data['loadout']['weights']['mtow_vtol'])}</td>`;
        } else {
          html += `<th class="text-center">${single_max ? 'MAX' : 'MAX T/O'}</th>
                    <td colspan=2 class="text-right rp5">${ntos(data['loadout']['weights']['mtow_field'])}</td>`;
        }
      } else if (n == loop_count-mtow_rows+2) {
        html += `<th class="text-center">MAX LDG</th>`;
        if (data.loadout.weights.mtow_cvn) {
          html += `
            <td class="text-right rp5">${ntos(data['loadout']['weights']['mlw_field'])}</td>
            <td class="text-right rp5">${ntos(data['loadout']['weights']['mlw_cvn'])}</td>`;
        } else {
          html += `
            <td colspan=2 class="text-right rp5">${ntos(data['loadout']['weights']['mlw_field'])}</td>`;
        }
      } else {
        if (lbs_itm ){
          html += `
              <td class="lp5">${lbs_itm[0]}</td>
              <td class="text-right rp5" colspan=2>${lbs_itm[1]}</td>`;
        } else {
          html += `<td class="bg-blank" style="border: none" colspan=3></td>`;
        }
      }
    }

    return $(html);
  })()];

}

var Tacans = function(data, unit) {

  let ac = data['flight']['flight-airframe'];

  this.single_page = true;
  this.force_newpage_before = false;
  this.force_newpage_after = true;
  this.breakable = false;

  this.table = function () {

    var html = `
      <table class="kb-width std std-striped" style="table-layout: fixed">
        <colgroup>
          <col />
        </colgroup>
        <tbody>
          <tr class="header">
            <th>TACAN POSITIONS</th>
          </tr>
        </tbody>
      </table>

      <div style="height:10px"></div>

      <table class="kb-width std std-striped" style="table-layout: fixed">
        <colgroup>
          <col style="width:75${unit}"/>
          <col  />
          <col style="width:150${unit}"/>
          <col style="width:150${unit}"/>
        </colgroup>
        <tbody>
          <tr class="header">
            <th>Channel</th>
            <th>Name</th>
            <th>LAT</th>
            <th>LON</th>
          </tr>
        </tbody>
      </table>`;

    return $(html);
  };

  this.get_data = function() {
    return data;
  }

  this.content = (function() {
    if (ac != 'F-14B') { return []; }

    var content = [];

    // Print out all the tacan stations LLs
    for (const tcn of Object.keys(data.mission['mission-beacons']||{}).sort((n1,n2) => parseInt(n1) - parseInt(n2))) {

      let info = data.mission['mission-beacons'][tcn];

      // we force them all to DDM, 1DP as that's all the F-14 has
      info['lat_fmt'] = 'ddm';
      info['lat_dmp'] = 1;
      
      let lat = ll(data, info, true);
      let lon = ll(data, info, false);

      content.push($(`
        <tr>
          <td class='text-center text-bold'>${tcn}</td>
          <td>${info.name}</td>
          <td class='text-center text-bold'>${lat}</td>
          <td class='text-center text-bold'>${lon}</td>
        </td>
      `));
    }

    return content
  })();
  
}

var Presets = function(data, unit) {

  var ac = data['flight']['flight-airframe'];
  var data = data.presets;
  var unit = unit;

  this.single_page = true;
  this.force_newpage_before = true;
  this.force_newpage_after = true;
  this.breakable = false;

  this.table = function () {

    var html = `
      <table class="kb-width std std-striped" style="table-layout: fixed">
        <colgroup>
          <col />
        </colgroup>
        <tbody>
          <tr class="header">
            <th>RADIO PRESETS</th>
          </tr>
        </tbody>
      </table>

      <div style="height:10px"></div>
    `;

    // 2 rows for each radio + 1 spacer, unless we're an AH-64D, in which case,
    // we have 4 radios, each with 10 presets, so can fit on one page with 2
    // tables
    
    var priorities = data.priority.length > 0 ? data.priority : Object.keys(data.radios);

    if (ac == 'AH-64D') {
    } else if (priorities.length > 0) {

      var col_group = '<col width=40px /><col width=85px/><col width=122px/><col width=18px/>'.repeat(priorities.length-1)

      var headers = `<td class="bg-blank" style="border:0"></td>`;
      for (const idx in priorities) {
        headers += `<th colspan=3>${priorities[idx]}</th>`;
        if (idx < priorities.length-1) {
          headers += '<td class="bg-blank" style="border:0"></td>';
        }
      }

      html += `
      <table class="kb-width std std-striped" style="table-layout: fixed">
        <colgroup>
          <col />
          ${col_group}
          <col width=40px /><col width=85px/><col width=122px/>
          <col />
        </colgroup>
        <tbody>
          <tr class="header">
            ${headers}
          </tr>
        </tbody>
      </table>`;
    }

    return $(html);
  };

  this.get_data = function() {
    return data;
  }

  this.content = (function() {
    var content = [];
    var last = {
      gs: "",
      alt: "",
    };

    if (!data) {
      return [];
    }

    // For the AH64, we yeet this up manually, ugh
    if (ac == 'AH-64D') {

      var priorities = data.priority.length ? data.priority : Object.keys(data.radios);
      for (var start of [0, 2]) {

        var html = `
        <div style="height:20px"></div>
        <table class="kb-width std std-striped" style="table-layout: fixed">
          <colgroup>
            <col/>
            <col width=40px /><col width=85px/><col width=122px/>
            <col/>
            <col width=40px /><col width=85px/><col width=122px/>
            <col/>
          </colgroup>
          <tbody>
            <tr class="header">
              <td class="bg-blank" style="border:0"></td>
              <th colspan=3>${priorities[start]}</th>
              <td class="bg-blank" style="border:0"></td>
              <th colspan=3>${priorities[start+1]}</th>
              <td class="bg-blank" style="border:0"></td>
            </tr>`;

        for (var x = 1; x <= 10; x++) {
          let label = x;
          let label_cls = "";
          let pst = data.radios[priorities[start]][x];

          if (pst.override) {
            label = `*${x}`;
            label_cls = 'text-bold';
          }
          
          html += `<tr>`;
          html += `
            <td class="bg-blank" style="border:0"></td>
            <td class="text-right rp5 ${label_cls}">${label}</td>
            <td class="text-bold text-right rp5">${pst.override || pst.value}</td>
            <td class="lp5">${pst.code ? pst.code : ""}</td>
            <td class="bg-blank" style="border:0"></td>
          `;

          pst = data.radios[priorities[start+1]][x];
          if (pst.override) {
            label = `*${x}`;
            label_cls = 'text-bold';
          }

          html += `
            <td class="text-right rp5 ${label_cls}">${label}</td>
            <td class="text-bold text-right rp5">${pst.override || pst.value}</td>
            <td class="lp5">${pst.code ? pst.code : ""}</td>
            <td class="bg-blank" style="border:0"></td>
          `;

          html += `</tr>`;
        }

        html += `
          </tbody>
        </table>
        <div style="height:20px"></div>`;

        content.push($(html));
      }

    } else {

      var priorities = data.priority.length ? data.priority : Object.keys(data.radios);
      if (priorities.length == 0) { 
        return [];
      }
      var presets = Math.max(...Object.values(data.radios).map(x => Object.keys(x).length));
      var radio_count = priorities.length
      var html = ``;

      // loop 1-30
      for (var x = 1; x <= presets; x++) {
        html += '<tr><td class="bg-blank" style="border:0"></td>';
        for (const [radio_id, radio] of Object.entries(priorities)) {
          var pst = data.radios[radio][x];
          if (pst) {

            let label = x;
            let label_cls = "";

            if (pst.override) {
              label = `*${x}`;
              label_cls = 'text-bold';
            }

            html += `
              <td class="text-right rp5 ${label_cls}">${label}</td>
              <td class="text-bold text-right rp5">${pst.override || pst.value}</td>
              <td class="lp5">${pst.code ? pst.code : ""}</td>`;
            if (radio_id < radio_count-1) {
              html += '<td class="bg-blank" style="border:0"></td>';
            }
          } else {
            html += `<td class="bg-blank" style="border:0" colspan=3></td>`;
            html += `<td class="bg-blank" style="border:0"></td>`;
          }
        }
        html += '<td class="bg-blank" style="border:0"></td></tr>';
      }

      content.push($(html));
    }
    return content
  })();
  
}

var Waypoints = function(data, unit) {
  var data = data;
  var unit = unit;

  this.force_newpage_after = false;
  this.breakable = true;
  var tables = [];

  this.on_break = function() {
    var poi = sections['poi'];
    var sequence = sections['sequence'];

    if (sequence.content.length) {
      sequence.force_newpage_after = true
    } else if (poi.content.length) {
      poi.force_newpage_after = true
    } else {
      this.force_newpage_after = false
    }
  }

  this.table = function () {
    var table = $(`
      <table class="kb-width std tbl-waypoints" style="table-layout: fixed">
        <colgroup>
          <col style="width:37${unit}" />
          <col style="width:150${unit}" />
          <col />
          <col style="width:60${unit}" />
          <col style="width:60${unit}" />
          <col style="width:55${unit}" />
          <col style="width:85${unit}" />
          <col style="width:55${unit}" />
          <col style="width:85${unit}" />
        </colgroup>
        <tbody>
          <tr class="header">
            <th>ID</th>
            <th>LAT/LON</th>
            <th>NAME</th>
            <th>ALT/GS</th>
            <th>BRG/${data.waypoint['gs-units'] == "kmh" ? 'KM' : 'NM'}</th>
            <th colspan=4>
          </tr>
        </tbody>
      </table>`);
    tables.push(table);
    return table;
  };

  this.content = (function() {
    var content = [];
    var last = {
      gs: "",
      alt: "",
    };

    let row = 0;

    // First wp with lat/long values
    let swing = null;

    for (var wp of data.waypoint.waypoints) {

      let is_last = true;
      // wp == data.waypoint.waypoints[data.waypoint.waypoints.length-1];

      // Declutter here too
      if (last) {
        if (last.gs == wp.gs) { wp.gs = ""; } else { last.gs = wp.gs };
        if (last.alt == wp.alt) { wp.alt = ""; } else { last.alt = wp.alt };
      }

      if (!swing && wp.lat && wp.lon) {
        swing = wp;
      }

      // EMPTY rows if no lat or lon
      let [lat, lon] = display_coord(data, wp, true);

      // If MGRS and just lat, then we're rowspan 2
      if (wp.name !== "" || wp.act !== '' || (lat !== "" && lon !== "")) {

        let num_rows = wp.notes ? 3 : 2;
        let html = '';

        if (row === 0) {
          html += `<tr>`;
        } else {
          html += `<tr class="wp-border-top">`;
        }

        html += `
            <td class="text-center" rowspan=${num_rows}>${wp.typ}</td>
            <td class="text-center text-bold" rowspan=${lon ? 1 : 2}>${lat}</td>
            <td class="lp5" style="white-space: normal" rowspan=2>${wp.name}</td>
            <td class="text-left lp5">${alt_formatter(data, wp.alt | '')}</td>
            <td class="text-left lp5">${wp.tbrg ? wp.tbrg.padStart(3, '0') : ''}</td>
        `;

        if (row === 0) {
          // First row has no TOT/SWING, so these are WALK / TO
          html += `
            <td class="wp-param text-left lp5">WALK</td>
            <td class="text-center">${data.waypoint['walk-time']}`;
        } else {
          // Otherwise, we're TOT / SWING
          html += `
            <td class="wp-param text-left lp5">TOT</td>
            <td class="text-center">${wp.tot}</td>`;
        }

        // Then we're two freeform fields, default to ACT
        html += `
          <td class="wp-param text-left lp5">ACT</td>
          <td class="text-center">${wp.act == '00:00' ? '' : wp.act}</td>
        </tr>`;


        // Second Row: -, LON, -, GS, RNG, TO/SWING, TCN in F-14 else POS from BULLS
        // IF we have no notes, it's a bold line bottom
        if (wp.notes || is_last) {
          html += `<tr>`;
        } else {
          html += `<tr class="bb2">`;
        }

        if (lon) {
          html += `<td class="text-center text-bold">${lon}</td>`;
        }

        html += `
          <td class="text-right rp5">${gs_formatter(wp.gs || '')}</td>
          <td class="text-right rp5">${Math.round(wp.dist) || ''}</td>
        `;

        if (row === 0) {
          html += `
            <td class="wp-param text-left lp5">T/O</td>
            <td class="text-center">${data.waypoint['to-time']||""}</td>`;
        } else {
          if (swing && wp.lat && wp.lon) {
            let [brg, rng] = get_brg(swing.lat, swing.lon, wp.lat, wp.lon, data.waypoint['gs-units'] == "kmh");
            html += `
              <td class="wp-param text-left lp5">SWING</td>
              <td class="text-center" style='white-space: pre'>${brg}/${rng.padStart(3)}</td>`;
          } else {
            html += `
              <td class="wp-param text-left lp5"></td>
              <td class="text-center"></td>`;
          }
        }

        if (data.flight['flight-airframe'] === 'F-14B' && wp.nearest_tcn) {
          html += `
            <td class="wp-param text-left lp5">${wp.nearest_tcn.channel}</td>
            <td class="text-center" style='white-space: pre'>${wp.nearest_tcn.brg.toFixed(0).padStart(3, '0')}/${wp.nearest_tcn.rng.toFixed(0).padStart(3, ' ')}</td>`;
        } else {
          // IF we have bulls, print BRG from bulls
          if (data.waypoint.bullseye && data.waypoint.bullseye.lat && data.waypoint.bullseye.lon && wp.lat && wp.lon) {
            let [brg, rng] = get_brg(data.waypoint.bullseye.lat, data.waypoint.bullseye.lon, wp.lat, wp.lon, data.waypoint['gs-units'] == "kmh");
            html += `
              <td class="wp-param text-left lp5">BULLS</td>
              <td class="text-center" style='white-space: pre'>${brg}/${rng.padStart(3)}</td>`;
          } else {
            html += `
              <td class="wp-param text-left lp5"></td>
              <td class="text-center"></td>`;
          }
        }

        html += `</tr>`;

        if (wp.notes) {
          if (is_last) {
            html += `<tr>`;
          } else {
            html += `<tr class="bb2">`;
          }
          html += `<td colspan=8 style="padding: 5px; white-space: normal">${wp.notes}</td></tr>`;
        }

        content.push($(html));

      } else {
        content.push($(`<tr class="wp-border-top" style="height:23px"><td class="text-center">${wp.typ}</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`));
      }

      row++;
    }

    return content
  })();

  this.extend = function(elem, extension) {
    for (var table of tables) {
      if (table[0] == elem) {

        var body = table.find('tbody');
        if (!body[0]) {
          return
        }

        let count = 0;
        
        while (extension > 0) {

          let cls = "tbl-waypoint-fill";
          if (count === 0) {
            cls += " wp-border-top";
            count++;
          }
          var row = $(`<tr class="${cls}"><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`);
          body.append(row);
          extension -= row.height();
          if (extension < 0) {
            row.remove();
            return;
          }
        }
        return
      }
    }
  }
}

var POI = function(data, unit) {
  var data = data;
  var unit = unit;

  this.breakable = true;
  this.force_newpage_after = false

  this.table = function () {
    return $(`
      <table class="kb-width std std-striped" style="table-layout: fixed">
        <colgroup>
          <col />
          <col style="width:150${unit}" />
          <col style="width:150${unit}" />
          <col style="width:60${unit}" />
        </colgroup>

        <tbody>
          <tr>
            <th>Point of Interest</th>
            <th>LAT</th>
            <th>LON</th>
            <th>ELEV</th>
          </tr>
        </tbody>
      </table>`)
  };

  this.content = (function() {
    if (!data.waypoint.poi) {
      return [];
    }

    var content = [];
    for (var elem of data.waypoint.poi) {

      // EMPTY rows if no lat or lon
      let [lat, lon] = display_coord(data, elem);
      let ll = (() => {
        if (lon === "") {
          return `<td class="text-center text-bold" colspan=2>${lat}</td>`;
        };
        return `<td class="text-center text-bold">${lat}</td>
                <td class="text-center text-bold">${lon}</td>
                <td class="text-center">${elem.alt || ''}</td>`;
      })();

      content.push($(`
        <tr>
          <td class="lp5">${elem['name']}</td>
          ${ll}
        </tr>`));
    }
    return content
  })();

  this.on_break = function() {
    // Normally we force a page break after poi to ensure waypoints expand, but
    // if we've broken, we don't want to do this to avoid the possibility of an
    // empty page at the end
    this.force_newpage_after = false
  }
}

var Sequence = function(data, unit) {
  var data = data;
  var unit = unit;

  this.force_newpage_after = false;

  this.show_notes = false;

  if  (data.waypoint.sequence)  {
    for (var elem of data.waypoint.sequence) {
      var seq = elem['seq'].replace(/^\s+|\s+$/g, ''); 
      var notes = elem['notes'].replace(/^\s+|\s+$/g, '');

      if (seq && notes) {
        this.show_notes = true;
        break;
      }
    }
  }

  this.table = function () {

    var html = `
      <table class="kb-width std std-striped">
        <colgroup>
          <col style="width:20${unit}" />
          <col />`;

    if (this.show_notes) {
      html += `<col />`;
    }

    html += `
        </colgroup>

        <tbody>
          <tr>
            <th>ID</th>
            <th>SEQ</th>`;

    if (this.show_notes) {
      html += `<th>NOTES</th>`;
    }

    html += `
          </tr>
        </tbody>
      </table>`;

    return $(html);
  };

  this.content = (function() {
    if (!data.waypoint.sequence) {
      return [];
    }

    var content = [];
    var non_empty = 0;

    for (var elem of data.waypoint.sequence) {
      var seq = elem['seq'].replace(/^\s+|\s+$/g, ''); 
      var notes = elem['notes'].replace(/^\s+|\s+$/g, '');

      if (seq || notes) {
        non_empty++;
      }

      var html = `
        <tr>
          <td class="text-center">${elem['id']}</td>
          <td class="text-center">${seq}</td>`;

      if (this.show_notes) {
        html += `<td class="lp5" style="max-width:300px; min-width:150px">${notes}</td>`;
      }

      html += `</tr>`;
      
      content.push($(html));
    }

    // Hide content if empty
    if (!non_empty) {
      return [];
    }

    return content
  }.bind(this))();
}

var Page = function(data, unit, id) {

  this.id = id || 1;

  // Page DIV container fixed 1200px 
  // this.page = $(`<div id="page${this.id}" style="height:1200px; background:${"#"+((1<<24)*Math.random()|0).toString(16)}"></div>`);
  this.page = $(`
    <div id="page${this.id}" style="position: absolute; top: ${(id-1)*1200}px; height:100%; width: 780px">
      <div style="position: absolute; top: 1180px; text-align: right; width:780px; font-size:12px;">${mdc_key}</div>
    </div>
  `);

  // Content is the entire page (inc. header)
  this.content = $(`<div class="content"></div>`);
  this.page.append(this.content);

  // Add our header spacing
  this.content.append(`<div style="height:20${unit}"></div>`);

  // Header for each page
  this.header = new Header(data, unit, id);
  this.content.append(this.header.dom);

  // Body contains the variable sections
  this.body = $(`<div class="body"></div>`);
  this.content.append(this.body);

  // And add the body to the main HTML
  $('body').append(this.page);

  this.append = function(dom) {
    this.body.append(dom);
  }

  this.prepend = function(dom) {
    this.body.prepend(dom);
  }

  this.height = function() {
    return this.content.height();
  }

  this.expand = function() {
    var single_page_expansions = [
      'notes',
      'waypoints',
    ];

    for (var s of single_page_expansions) {
      for (var c of this.body.children()) {
        var attr = c.getAttribute('data-section');
        if (attr == s)  {
          sections[s].extend(c, 1180-this.height());
        }
      }
    }
  }

  this.fits = function() {
    return this.content.height() < 1180;
  }

  this.next = function() {
    return new Page(data, unit, id+1)
  }
}

function RAMROD(data, unit) {

  var data = data;
  var unit = unit;

  this.content = [null];

  this.table = function() {
    // EMPTY rows if no lat or lon
    let [lat, lon] = display_coord(data, data.waypoint.bullseye);
    let ll = (() => {
      if (lon === "") {
        return `<td class="text-center text-bold" colspan=2>${lat}</td>`;
      };
      return `<td class="text-center text-bold">${lat}</td>
              <td class="text-center text-bold">${lon}</td>`;
    })();

    html = `
      <div style="overflow: auto">
        <div style="float: left; width: 529${unit}">
          <table class="std" style="width: 100%; table-layout: fixed">
            <colgroup>
              <col  />
              <col style="width:150${unit}"/>
              <col style="width:150${unit}"/>
            </colgroup>

            <tbody>
              <tr class="header">
                <th colspan=3>BULLSEYE</th>
              </tr>

              <tr>
                <td class="lp5">${data.waypoint.bullseye.name}</td>
                ${ll}
              </tr>
            </tbody>
          </table>
        </div>

        <div style="float: left; width: 10${unit}">&nbsp;</div>

        <div style="float: left; width: 241${unit}">
          <table class="std" style="width:100%; table-layout: fixed">
            <colgroup>
              <col />
              <col />
              <col />
              <col />
              <col />
              <col />
              <col />
              <col />
              <col />
              <col />
            </colgroup>

            <tbody>
              <tr class="header">
                <th colspan=10>RAMROD</th>
              </tr>

              <tr>`;
    for (var elem of data.comms.ramrod) {
      html += `<td class="text-center text-bold">${elem}</td>`;
    }

    html += `
              </tr>
            </tbody>
          </table>
        </div>
      </div>`;

    return $(html);
  }
}

function DepArr(data, unit) {
  var data = data;
  var unit = unit;

  this.table = function() {
    return $(`
      <table class="kb-width std" style="table-layout: fixed">

        <colgroup>
          <col style="width:37${unit}" />
          <col />
          <col style="width:60${unit}" />

          <col style="width:76${unit}" />
          <col class="" style="width:50${unit}" />

          <col style="width:77${unit}" />
          <col class="" style="width:50${unit}" />

          <col style="width:77${unit}" />
          <col class="" style="width:50${unit}" />

        </colgroup>

        <tbody>

          <tr class="header">
            <th></th>
            <th>LOCATION</th>
            <th>TCN</th>
            <th colspan=2>ATIS<br>GND</th>
            <th colspan=2>TWR/LSO<br>TMA/CCA</th>
            <th colspan=2>AI UHF<br>AI VHF</th>
          </tr>
        </tbody>
      </table>`);
  }

  this.content = (function() {

    var elems = [];
    var comparitor = {};
    var titles = {}
    var dep = null;
    var last_id = null;

    // What to show, it's one of:
    //  - ALL
    //  - DEP + ARR
    //  - DEP/ALT + ARR
    //  - DEP/ARR + ALT

    ['dep', 'arr', 'alt'].forEach((x) => {
      var elem = data.deparr[x];

      // Purge usedep just in case someone puts in the same for both DEP / ALT
      // or so and this allows us to consolidate, also allows the empty check
      // below to work
      var use_dep = elem.usedep;
      delete(elem['usedep']);

      // Empty ? skip it 
      var nonempty = Object.values(elem).filter(function(x) { return x && x != "" && x != "----"});
      if (!nonempty.length) {
        delete(data.deparr[x]);
        return;
      }

      // If we're just using dep and dep exists, append title
      if (use_dep && titles['dep']) {
        titles['dep'].push(x.toUpperCase());
        delete(data.deparr[x]);
        return;
      }

      var elem_json = JSON.stringify(elem);

      // Now check if we match any existing items
      ['dep', 'arr', 'alt'].forEach((y) => {
        if (comparitor[y] && comparitor[y] == elem_json) {
          titles[y].push(x.toUpperCase());
          delete(data.deparr[x]);
          return;
        }
      });

      // Stringify to compare
      comparitor[x] = elem_json;
      titles[x] = [x.toUpperCase()];
    });

    let row_id = 1;
    for (const [x, title] of Object.entries(titles)) {
      console.log(x, title, data.deparr)
      var elem = data.deparr[x];
      if (!elem) { continue; }
      row_id += 1;

      // All 3 - just use ALL
      let title_str = title.length == 3 ? "ALL" : title.join('<br>');

      var html = '';
      var stripe = row_id % 2 == 0 ? 'striped-even' : ''

      if (x == 'dep') {
        html += `<tr class="${stripe}">`;
      } else {
        html += `<tr class="bt2 ${stripe}">`;
      }

      html += `
            <td class="text-center" rowspan=2>${title_str}</td>
            <td class="lp5 overflow-hidden" rowspan=2>${elem.location}</td>
            <td class="text-center text-bold" rowspan=2>${elem.tcn}</td>`;

      for (const agency of ['atis', 'twr', 'uhf', '', 'gnd', 'ctrl', 'vhf']) {
        if (agency == '') {
          html += `</tr><tr class="${stripe}">`;
          continue
        }

        if (elem[agency]) {
          html += `
            <td class="text-center text-bold rb0">${elem[agency].value}</td>
            <td class="text-center lb0 text-pst text-bottom">${elem[agency].pst || ""}</td>`;
        } else {
          html += `<td colspan=2></td>`;
        }
      }

      html += '</tr>';
      elems.push($(html));
      last_id = x;
    };

    return elems
  })();
}

function Agencies (data, unit) {
  var data = data;
  var unit = unit;

  this.table = function() {
    return $(`
      <table class="kb-width std std-striped" style="table-layout: fixed">

        <colgroup>
          <col style="width:265${unit}" />
          <col style="width:60${unit}" />
          <col style="width:76${unit}" />
          <col style="width:50${unit}" />
          <col style="width:76${unit}" />
          <col style="width:50${unit}" />
          <col />
        </colgroup>

        <tbody>
          <tr class="header">
            <th>AGENCY</th>
            <th>TCN</th>
            <th colspan=2>PRI</th>
            <th colspan=2>SEC</th>
            <th>NOTES</th>
          </tr>
        </tbody>
      </table>`);
  }

  this.content = (function() {
    var elems = []
    for (elem of data.comms.agencies) {

      if (!elem['agency']) {
        continue
      }

      var elem_html = `
        <tr>
          <td class="overflow-hidden align-top">${elem['agency']}</td>
          <td class="text-right rp5 align-top text-bold">${elem['tcn']}</td>`;

      if (elem.pri) {
        if (elem.pri.value.startsWith('MIDS')) {
          elem_html += `<td class="text-center align-top text-bold rb0" colspan=2>${elem.pri.value}</td>`;
        } else {
          elem_html += `
            <td class="text-right rp2 text-bold rb0 align-top">${elem.pri.value}</td>
            <td class="text-left lb0 pt3 text-pst align-top">${elem.pri.pst || ""}</td>`;
        }
      } else {
        elem_html += `<td class="text-center align-top text-bold rb0" colspan=2></td>`;
      }

      if (elem.sec) {
        if (elem.sec.value.startsWith('MIDS')) {
          elem_html += `<td class="text-center text-bold rb0" colspan=2>${elem.sec.value}</td>`;
        } else {
          elem_html += `
            <td class="text-right rp2 text-bold rb0 align-top">${elem.sec.value}</td>
            <td class="text-left lb0 pt3 text-pst align-top">${elem.sec.pst || ""}</td>`;
        }
      } else {
        elem_html += `<td class="text-center align-top text-bold rb0" colspan=2></td>`;
      }

      var notes = elem['notes'];
      if (!notes) {
        if (elem['pri'] && elem['pri_code']) {
          notes = elem['pri_code'] || "-";
        } else if (elem['sec'] && elem['sec_code']) {
          notes = "-";
        }
        if (elem['sec'] && elem['sec_code']) {
          notes += "/" + (elem['sec_code'] || "-");
        }
      }

      elem_html += `
          <td style="white-space: normal">${notes}</td>
        </tr>`;

      elems.push($(elem_html));
    }

    return elems;
  })();

}

function Threats (data, unit) {
  var data = data;
  var unit = unit;

  this.nobreak = true;

  this.table = function() {
    return $(`
      <table class="kb-width std std-striped" style="table-layout: fixed">

        <colgroup>
          <col />
          <col style="width:85${unit}" />
          <col style="width:80${unit}" />
          <col style="width:60${unit}" />
          <col style="width:60${unit}" />
          <col style="width:60${unit}" />
          <col style="width:70${unit}" />
          <col style="width:80${unit}" />
        </colgroup>

        <tbody>
          <tr class="header">
            <th>THREAT</th>
            <th>RWR</th>
            <th>TYPE</th>
            <th>CMS</th>
            <th colspan=2>RNG (nm)</th>
            <th colspan=2>ALT (ft)</th>
          </tr>
        </tbody>
      </table>`);
  };

  this.content = (function() {

    var elems = [];

    for (var threat of data.threats.threats) {
      if (!threat['threat']) {
        continue
      }

      elems.push($(`
        <tr>
          <td class="lp5 overflow-hidden">${threat['threat']}</td>
          <td class="text-center">${threat['rwr']}</td>
          <td class="text-center">${threat['type']}</td>
          <td class="lp5">${threat['cms']}</td>
          <td class="rp5 text-right">${threat['rmin']}</td>
          <td class="rp5 text-right">${threat['rmax']}</td>
          <td class="rp5 text-right">${threat['amin']}</td>
          <td class="rp5 text-right">${ntos(threat['amax'])}</td>
        </tr>`));
    }
    return elems;
  })();

}

function PageBreak() {}

function Notes (data, unit) {
  var data = data;
  var unit = unit;
  var id = 1;

  var tables = [];

  this.breakable = true;

  this.table = function() {
    var table = $(`
      <table class="kb-width std-header" style="table-layout: fixed; line-height: normal">
        <colgroup>
          <col />
        </colgroup>

        <tbody>
          <tr class="header">
            <th>${data['title'] || "NOTES"}</th>
          </tr>
          <tr style="vertical-align: top">
            <!-- important do not create #text by adding space -->
            <td class="body" style="position: relative; border:1px solid black"></td>
          </tr>
        </tbody>
      </table>`);
    tables.push(table);
    return table;
  }

  this.content = (function() {

    if (!data || !data.html) {
      return [];
    }

    // Process the children
    var elems = [];
    for (var child of $(`<div>${data['html']}</div>`).contents()) {
      // Handle Page Breaks
      if (child.nodeType == Node.COMMENT_NODE && child.data.trim() == "pagebreak") {
        elems.push(new PageBreak);
        continue
      }

      // If a child is a table, we just duplicate the table for each row, this
      // helps provide a nicer continuity / page splitting behaviour

      if (child.tagName == "TABLE") {

        // We ignore height as we'll always be basing expansions on width
        $(child).css('height', '');

        var css_w = $(child).css('width').replace(/\s*%/, '');
        if (css_w > 90) {
          $(child).css('width', '100%');
        }

        // tinyMCE on deleting a col doesn't do well at resizing colgroups in
        // that if one has 3 cols at 33%, delete 1 col, 2 remaining are 33% so
        // we resize them all here based on the ratio
        var cols = $(child).find('colgroup > col');
        var ratio = Array.from(cols).reduce((x,y) => x + parseFloat($(y).css('width')), 0) / 100;

        cols.each(function(idx, col) {
          
          var css_w = parseFloat($(col).css('width')) / ratio;
          var evens = 100 / cols.length;

          // If we're close enough to an even split, make it so
          if (css_w > evens - 1 && css_w < evens + 1) {
            css_w = evens.toFixed(3) ;
          }

          $(col).css('width', css_w + '%')
        });

        $(child).find('tbody > tr').each(function(idx, row) {
          var nt = $(child.cloneNode(true));
          var tb = nt.find('tbody');
          if (!tb.length) {
            tb = $("<tbody></tbody>");
            nt.append(tb);
          }
          tb.empty().append(row);
          elems.push(nt);

          // Handle TDs
          var tds = $(row).find('> td');
          var evens = 100 / tds.length;
          tds.each(function(idx, td) {

            // If we're close enough to 50% make it 50% to make things prettier
            var css_w = $(td).css('width').replace(/\s*%/, '');
            if (css_w > evens - 1 && css_w < evens + 1) {
              $(td).css('width', evens.toFixed(2) + '%')
            }
            
            // remove height from td
            $(td).css("height", "")
          })

          // If someone has a huge tr height, reign it in to max-height
          //if (p.height() > th) {
          //  p.height(th) 
          //}


          // If we are 100% then force page break)
          if (nt.css('height') == '100%')  {
            nt.css('height', '');
          }
        });
      } else {
        elems.push($(child));
      }
    }
    return elems;

  })();

  this.extend = function(elem, extension) {
    for (var table of tables) {
      if (table[0] == elem) {
        var content = table.find('.body');
        content.css('height', (content.height() + extension) + "px").resize();
        return
      }
    }
  }
}


// This is effectively a loop 
function Builder(data, unit) {

  var data = data;
  var unit = unit;
  var elem = null;
  var ac = data['flight']['flight-airframe'];


  var section = null;
  var section_id = 0;

  var section_order = [
    'flight',
    'package',
    'loadout',
    'loadout-notes',
    'f16cmds',
    'f16harm',
    'f16hts',
    'deparr',
    'agencies',
    'threats',
    'ramrod',
    'notes',

    'waypoints',
    'sequence',
    'poi',

    'presets',
    'tacans',
  ];

  // Loadout notes moved from loadout to profiles, so allow both
  var loadout_notes = null;
  if (data.profiles && data.profiles.notes) {
    loadout_notes = data.profiles.notes;
  } else if (data.loadout && data.loadout.notes) {
    loadout_notes = data.loadout.notes;
  }

  sections = {
    'flight': new Flight(data, unit),
    'loadout': new Loadout(data, unit),
    'f16cmds': new F16CMDS(data, unit),
    'f16harm': new F16Harm(data, unit),
    'f16hts': new F16HTS(data, unit),
    'loadout-notes': new Notes(loadout_notes, unit),
    'ramrod': new RAMROD(data, unit),
    'waypoints': new Waypoints(data, unit),
    'poi': new POI(data, unit),
    'sequence': new Sequence(data, unit),
    'package': new Package(data, unit),
    'deparr': new DepArr(data, unit),
    'agencies': new Agencies(data, unit),
    'threats': new Threats(data, unit),
    'notes': new Notes(data.notes, unit),
    'presets': new Presets(data, unit),
    'tacans': new Tacans(data, unit),
  };

  // If we have notes, then expand them before waypoints
  if (sections['notes'].content.length > 0) {
    sections['waypoints'].force_newpage_before = true;
  }

  var page = new Page(data, unit, 1);
  var pages = [ page ];

  var body = null;

  var row = undefined;
  var rowid = 0;
  var section_id = 0;
  var new_section = true;

  $(document).on('RowRepeat', function() { this.row_complete(false) }.bind(this));
  $(document).on('RowComplete', function() { this.row_complete(true) }.bind(this));
  $(document).on('SectionComplete', function() { this.section_complete() }.bind(this));

  this.section_complete = function() {
    new_section = true;
    rowid = 0;
    section_id++;
    this.process_section()
  }

  this.build = function() {
    this.process_section()
  }

  this.row_complete = function(incr) {
    if (incr) {
      rowid++;
    }
    this.process_section()
  }

  this.resize_images = function(row) {

    var images = row.prop('tagName') == "IMG" ? $([row[0]]) : row.find('img');

    for (var img of images) {

      // Max width / height of a standalone image
      var tw = 776;
      var th = 1080;

      // If we're a stadalone image (i.e. just form part of the body), then
      // scale to fit on width, then downsize on height if required

      var p = $(img).parent();

      if (p.prop('tagName') == "TD" && !p.hasClass('body')) {

        // Max height remains based on max notes height above
        tw = p.width();

        cn = Array.from(img.parentElement.childNodes);
        previous = cn.slice(0, cn.indexOf(img));
        if (previous.length > 1) {
          var ndiv = $('<div></div>');
          ndiv.append(previous);
          $(img).before(ndiv);
          th -= ndiv.height();
        } else if (previous.length == 1 && previous[0].nodeType == Node.ELEMENT_NODE) {
          th -= $(previous[0]).height();
        }
      }

      pr = tw / th;
      ir = img.naturalWidth / img.naturalHeight;

      if (ir > pr) {
        img.setAttribute("width", tw + "px");
        img.removeAttribute("height");
        $(img).css('padding-left', 0);
      } else {

        img.removeAttribute("width");
        img.setAttribute("height", th + "px"); 

        // If we're vertically aligned, add pad the left to center it
        $(img).css('padding-left', (tw - (th / img.naturalHeight) * img.naturalWidth) / 2);
      }
    }
  }

  this.complete = function() {

    // The last page might be empty, so delete it if so (e.g. force_newpage_after set on last item)
    if (page.body.contents().length == 0) {
      pages.pop().page.remove();
    }

    // We are at the end, expand pages and download
    for (var x of pages) {
      x.expand();
      x.header.set_page_count(pages.length);
    }

    // This is very important: it is used by pyppeteer to start processing
    $('body').append($(`<div style="display:none" id="page_count">${pages.length}</div>`));
  }

  this.process_section = function() {
    // This mybe called for the same thing in the event of a new page, but it
    // shouldn't be triggered on BR or so as these need to get filtered

    var key = section_order[section_id];
    
    section = sections[key];
    if (section === undefined) {
      this.complete();
      return;
    }

    var row = section.content[rowid];
    if (row === undefined) {
      if (section.content.length > 0 && section.force_newpage_after) {
        page = page.next()
        pages.push(page);
      }

      $(document).trigger('SectionComplete');
      return
    }

    // Handle force newpage before section start
    if (section.content.length > 0 && section.force_newpage_before) {
      page = page.next()
      pages.push(page);
      section.force_newpage_before = false;
    }
    
    if (new_section) {

      // Always have a spacer between sections
      page.append($(`<div style="height:5px"></div>`));

      // Introduce Section Table
      header = section.table();
      header.attr('data-section', key);
      page.append(header);

      // If the header doesn't fit, we shuffle to the next page
      if (!page.fits()) {
        page = page.next()
        pages.push(page);

        page.append($(`<div style="height:5px"></div>`));
        page.append(header);
      }

      // Find where we add content, either a specific body class or a
      // tbody default for standard tables
      body = header.find('.body');
      if (!body[0]) {
        body = header.find('tbody').last();
      }

      new_section = false;
    }


    if (body && row) {

      // If the existing content is just a line break, remove it before adding
      // this keeps it nice if the split happens on a <br><img> to remove the
      // <br>

      var bc = body.contents()
      if (bc.length == 1 && bc[0].tagName == "BR") {
        bc[0].remove();
      }

      // Forced Page Break, we do this here so the BR cleanup above will have
      // happened
      if (row instanceof PageBreak) {

        // If there is no content after the page break, just complete
        if (!section.content[rowid+1]) {
          $(document).trigger('RowComplete');
          return;
        }

        if (body.contents().length != 0) {
          page = page.next();
          pages.push(page);
          new_section = true;
        } else if (rowid == 0) {
          // We honor the page break if it's the first row of the notes section
          page = page.next();
          pages.push(page);
          page.append($(`<div style="height:5${unit}"></div>`));
          page.append(header);
        }
        $(document).trigger('RowComplete');
        return;
      }

      var async = false;

      // Add the row 
      body.append(row);

      // Force tables > 100 to be 100 wide
      if (row.prop('tagName') == "TABLE") {

        // Sometimes, we get tables that are 99.7% or similar due to tinyMCE
        // resize events, so clearly if they're around 90% they really want to
        // be 100%, we just make them so
        
        if (row[0].style.width != "100%" && parseFloat(row[0].style.width) > 90) {
          row.css('width', '100%');

          // If we adjust, we want to resize before handling the images, so we retrigger the same row again
          $(document).trigger('RowRepeat');
          return
        }

        // If we are table and get resized, we need to update any images within
        // us to be handled by the cell container
        body.resize(function() {
          this.resize_images(row);
        }.bind(this));

      }

      // If we encounter images, they need some additional processing
      var images = row.prop('tagName') == "IMG" ? $([row[0]]) : row.find('img');

      if (images.length > 0) {
        var imlen = images.length;

        // Make a deferred which will handle the images once the've been loaded
        // and trigger the continuation of the notes generator on completion
        var defer = $.Deferred()
          .done(function() {
            this.resize_images(row);
            this.process_section_p2();
          }.bind(this))
          .progress(function(img) {
            imlen--;
            if(imlen <= 0) {
              defer.resolve()
            }
          })

        for (var img of images) {

          // This is important
          //
          // We leave the height as client provided, but not the width; this
          // enables us get rough spacing of when to split and what sizes to
          // put the images
          //
          // We compress width so that we don't mess up the fixed-width and
          // then allow the width to govern the resize; most noticable with
          // table content
          //
          // The height also helps avoid situations where they get downscaled
          // to high heaven and made to try and fit on the first page
          
          img.setAttribute("width", "2px");

          if (img.complete) {
            defer.notify(img);
          } else {
            $(img)
              .on('load',  function(e) { defer.notify(e.target); })
              .on('error', function(e) { defer.notify(e.target); });
          }
        }

        async = true;
      }

      if (!async) {
        // Whilst it's not async, we still need to wait for the row to render
        // before getting the height, otherwise we'll get row height and not
        // any wrapped height
        //
        // To do this we just start process_section_p2 at the end of the current
        // event queue
        setTimeout(this.process_section_p2, 0);
      }
    } else {
      $(document).trigger('SectionComplete');
    }
  }

  this.process_section_p2 = function() {

    // If the added row doesn't fit:
    //   If it's the first row item on the page
    //   If it's splittable section: continue on next page with new header
    //   Otherwise: move section onto next page 
    
    if (!page.fits()) {
      page_elems = page.body.contents().length;
      body_elems = body.contents().length;

      // If we're the first elem on the page, and first child and
      // oversize, there's nothing we can do so continue with next
      // elem
      if (page_elems <= 2 && body_elems == 1 ) {
        $(document).trigger('RowComplete');
        return
      }

      // If the last elem on the page is a BR or page break then we should just
      // skip it
      var row = section.content[rowid];
      if (row[0].tagName == "BR") {
        row.remove();
        $(document).trigger('RowComplete');
        return
      }

      // Nothing we can do if it's a single page section that doesn't fit
      if (section.single_page) {
        $(document).trigger('RowComplete');
        return;
      }

      page = page.next();
      pages.push(page);

      // If the first row didn't fit, or if the section is marked not to
      // be broken up across pages, we move the entire section
      //
      // We use child_count > 2 because of the spacer div after header

      if (!section.breakable || (rowid == 0 && page_elems > 2)) {

        page.append($(`<div style="height:5${unit}"></div>`));
        page.append(header);

      } else {

        // If we're in a breakable section, but it takes up < 1/4 the page,
        // then migrate to next page. This is useful for either waypoints or
        // more commonly notes

        if (header.height() < 300) {
          page.append($(`<div style="height:5${unit}"></div>`));
          page.append(header);
          $(document).trigger('RowComplete');
          return
        }

        // Call on_break if it exists with the row we broke on, this is
        // useful if we want to force a page break after a section like
        // waypoints if it spills over on to a second page to keep the
        // comms block together
        if (typeof section.on_break == "function") {
          section.on_break(rowid);
        }

        new_section = true;
      }

      // Continue to re-add the row 
      $(document).trigger('RowRepeat');
      return
    }

    $(document).trigger('RowComplete');
  }
}


$(function() {

  mdc_key = getUrlParameter('kb')
  if (mdc_key) {
    $.getJSON("../../mdcs/" + mdc_key + ".json").done(function(data) {
      mdc = data;
      builder2 = new Builder(data, "px")
      builder2.build()
    });
  };
});
