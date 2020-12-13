var sections = {};
var pages = []

function ll(data, info, lat) {

  if (!info) return "";

  var prefix = lat ? 'lat' : 'lon';

  // No data, return empty line
  if (!info[prefix]) return ""

  var pos = parseFloat(info[prefix])

  if (isNaN(pos)) return info;

  var pad = 0;

  if (lat) {
      axis = pos > 0 ? "N" : "S"
      pad = 2
  } else {
      axis = pos > 0 ? "E" : "W"
      pad = 3
  }

  // Get Coordinate Format
  
  var dmp_override = info[`${prefix}_dmp`]
  var fmt_override = info[`${prefix}_fmt`]

  var coord = fmt_override === undefined ? data.flight['flight-coord'] : fmt_override;
  var decimals = parseInt(dmp_override === undefined ? data.flight['flight-coord-decimals'] : dmp_override);

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

    return `${axis}${deg.toString().padStart(pad, 0)}&deg;${min.toFixed(decimals).padStart(dec_width, 0)}`
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
    + `${deg.toString().padStart(pad, 0)}&deg;`
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
          <col style="width: 115${unit}" />
          <col style="width: 90${unit}" />
          <col style="width: 90${unit}" />`

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
            <th>PRI</th>
            <th>SEC</th>`;

    if (package) {
      html += `
            <th>PACKAGE</th>`;
    }

    html += `
            <th>MISSION</th>
            <th>ID</th>
            <th>PAGE</th>
          </tr>
          
          <tr>
            <td class="text-center">${data['mission']['mission-callsign']}</td>
            <td class="text-center text-bold">${data['mission']['mission-pri-freq']}</td>
            <td class="text-center text-bold">${data['mission']['mission-sec-freq']}</td>`;

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

        html += member[col[0] == "#" ? 'id' : col[0].toLowerCase()];

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
      <table class="kb-width std" style="table-layout: fixed">

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
          <td class="text-center text-bold">${member['freq']}</td>
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
      <table class="kb-width std" style="table-layout: fixed">
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

    var tables = Object.keys(data.profiles.harm);

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
      <table class="kb-width std" style="table-layout: fixed; border:0px">
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
    var loop_count = Math.max(pylons_count, other_col.length + mtow_rows, lbs_col.length + mtow_rows)

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
        html += `<td class="bg-blank rb2" style="border:0" colspan=3></td>`;
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
      this.force_newpage_after = true
    }
  }

  this.table = function () {
    var table = $(`
      <table class="kb-width std" style="table-layout: fixed">
        <colgroup>
          <col style="width:37${unit}" />
          <col style="width:150${unit}" />
          <col style="width:150${unit}" />
          <col />
          <col style="width:70${unit}" />
          <col style="width:38${unit}" />
          <col style="width:38${unit}" />
          <col style="width:60${unit}" />
          <col style="width:60${unit}" />
        </colgroup>
        <tbody>
          <tr class="header">
            <th>ID</th>
            <th>LAT</th>
            <th>LON</th>
            <th>NAME</th>
            <th>ALT</th>
            <th>GS</th>
            <th>${data.waypoint['gs-units'] == "kmh" ? 'KM' : 'NM'}</th>
            <th>TOT</th>
            <th>ACT</th>
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
    for (var wp of data.waypoint.waypoints) {

      // EMPTY rows if no lat or lon
      var lat = ll(data, wp, true);
      var lon = ll(data, wp, false);

      // Declutter here too
      if (last) {
        if (last.gs == wp.gs) { wp.gs = ""; } else { last.gs = wp.gs };
        if (last.alt == wp.alt) { wp.alt = ""; } else { last.alt = wp.alt };
      }

      if (wp.name || wp.act != '00:00' || (lat && lon)) {
        content.push($(`
          <tr>
            <td class="text-center">${wp.typ}</td>
            <td class="text-center text-bold">${lat}</td>
            <td class="text-center text-bold">${lon}</td>
            <td class="lp5">${wp.name}</td>
            <td class="text-center">${alt_formatter(data, wp.alt | '')}</td>
            <td class="text-center">${gs_formatter(wp.gs)}</td>
            <td class="text-right rp5">${dist_formatter(wp.dist)}</td>
            <td class="text-center">${wp.tot}</td>
            <td class="text-center">${wp.act == '00:00' ? '' : wp.act}</td>
          </tr>`));
      } else {
        content.push($(`<tr><td class="text-center">${wp.typ}</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`));
      }

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
        
        while (extension > 0) {
          var row = $(`<tr><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`);
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
      <table class="kb-width std" style="table-layout: fixed">
        <colgroup>
          <col />
          <col style="width:150${unit}" />
          <col style="width:150${unit}" />
        </colgroup>

        <tbody>
          <tr>
            <th>Point of Interest</th>
            <th>LAT</th>
            <th>LON</th>
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
      content.push($(`
        <tr>
          <td class="lp5">${elem['name']}</td>
          <td class="text-center text-bold">${ll(data, elem, true)}</td>
          <td class="text-center text-bold">${ll(data, elem, false)}</td>
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
      <table class="kb-width std">
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
  this.page = $(`<div id="page${this.id}" style="position: absolute; top: ${(id-1)*1200}px; height:100%; width: 780px"></div>`);

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
                <td class="text-center text-bold">${ll(data, data.waypoint.bullseye, true)}</td>
                <td class="text-center text-bold">${ll(data, data.waypoint.bullseye, false)}</td>
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

          <col style="width:76${unit}" />
          <col class="" style="width:50${unit}" />

        </colgroup>

        <tbody>

          <tr class="header">
            <th></th>
            <th>LOCATION</th>
            <th>TCN</th>
            <th colspan=2>ATIS</th>
            <th colspan=2>GND</th>
            <th colspan=2>TWR</th>
            <th colspan=2>CTRL</th>
          </tr>
        </tbody>
      </table>`);
  }

  this.content = (function() {

    var elems = [];

    ['dep', 'arr', 'alt'].forEach(function(x) {
      var elem = data.deparr[x];
      if (elem.usedep) {
        elem = data.deparr.dep;
      }

      // Empty ? skip it 
      var nonempty = Object.values(elem).filter(function(x) { return x != "" && x != "----"});
      if (!nonempty.length) {
        return;
      }

      elems.push($(`
          <tr>
            <td class="text-center">${x.toUpperCase()}</td>
            <td class="lp5 overflow-hidden">${elem.location}</td>
            <td class="text-right rp5 text-bold">${elem.tcn}</td>

            <td class="text-center text-bold rb0">${elem.atis}</td>
            <td class="text-center lb0 text-pst text-bottom">${elem['atis-pst']}</td>

            <td class="text-center text-bold rb0">${elem['gnd']}</td>
            <td class="text-center lb0 text-pst text-bottom">${elem['gnd-pst']}</td>

            <td class="text-center text-bold rb0">${elem['twr']}</td>
            <td class="text-center lb0 text-pst text-bottom">${elem['twr-pst']}</td>

            <td class="text-center text-bold rb0">${elem['ctrl']}</td>
            <td class="text-center lb0 text-pst text-bottom">${elem['ctrl-pst']}</td>
          </tr>
      `));
    });

    return elems
  })();
}

function Agencies (data, unit) {
  var data = data;
  var unit = unit;

  this.table = function() {
    return $(`
      <table class="kb-width std" style="table-layout: fixed">

        <colgroup>
          <col style="width:265${unit}" />
          <col style="width:48${unit}" />
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

      if (elem['pri'].startsWith('MIDS')) {
        elem_html += `<td class="text-center align-top text-bold rb0" colspan=2>${elem['pri']}</td>`;
      } else {
        elem_html += `
          <td class="text-center text-bold rb0 align-top">${elem['pri']}</td>
          <td class="text-center lb0 pt3 text-pst align-top">${elem['pri_pst']}</td>`;
      }

      if (elem['sec'].startsWith('MIDS')) {
        elem_html += `<td class="text-center text-bold rb0" colspan=2>${elem['sec']}</td>`;
      } else {
        elem_html += `
          <td class="text-center text-bold rb0">${elem['sec']}</td>
          <td class="text-center lb0 text-pst text-bottom">${elem['sec_pst']}</td>`;
      }

      elem_html += `
          <td class="">${elem['notes']}</td>
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
      <table class="kb-width std" style="table-layout: fixed">

        <colgroup>
          <col />
          <col style="width:80${unit}" />
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
          console.log(nt[0]);
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
    'loadout',
    'loadout-notes',
    'f16cmds',
    'f16harm',
    'ramrod',
    'waypoints',
    'sequence',
    'poi',
    'package',
    'deparr',
    'agencies',
    'threats',
    'notes',
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
  };

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

  this.process_section = function() {
    // This mybe called for the same thing in the event of a new page, but it
    // shouldn't be triggered on BR or so as these need to get filtered

    var key = section_order[section_id];
    
    section = sections[key];
    if (section === undefined) {
      // We are at the end, expand pages and download

      for (var x of pages) {
        x.expand();
        x.header.set_page_count(pages.length);
      }

      // This is very important: it is used by pyppeteer to start processing
      $('body').append($(`<div style="display:none" id="page_count">${pages.length}</div>`));
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
      body = header.find('.body')
      if (!body[0]) {
        body = header.find('tbody');
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
      builder = new Builder(data, "px")
      builder.build()
    });
  };
});
