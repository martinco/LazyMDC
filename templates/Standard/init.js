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
  var alt_i = parseInt(alt)
  var trans = parseInt(data.waypoint['transition-alt']);

  if (isNaN(alt_i)) return alt;
  if (isNaN(trans)) return alt;

  if (alt_i > trans)
    return `FL${alt_i/100}`

  return alt_i.toFixed()
}

function gs_formatter(gs) {
  return (Math.round(parseFloat(gs) / 5)*5).toFixed(0);
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
      <table class="kb-width" style="table-layout: fixed">

        <colgroup>
          <col style="width: 115${unit}" />
          <col style="width: 80${unit}" />
          <col style="width: 80${unit}" />`

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
      ["#", 30, "text-center"],
      ["PILOT", 0, "lp5"],
    ]

    if (ac == "F-14B") {
      cols.push(
        ['RIO', 0, "lp5"])
    }

    if (["F-14B", "FA-18C"].includes(ac)) {
      cols.push(['BORT', 60, "text-center"])
    }

    if (ac == "A-10C") {
      cols.push(...[
        ['GID', 60, "text-center"],
        ['OID', 60, "text-center"]])
    }

    cols.push(...[
      ['TCN', 60, "text-center"],
      ['LSR', 60, "text-center"],
      ['SQUAWK', 60, "text-center"],
    ])

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
      <table class="kb-width" style="table-layout: fixed">
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
      <table class="kb-width" style="table-layout: fixed">

        <colgroup>
          <col style="width:100${unit}" />
          <col style="width:140${unit}" />
          <col style="width:80${unit}" />
          <col style="width:45${unit}" />
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
    var elems = [];
    for (var member of data['package']['members']) {
      elems.push($(`
        <tr>
          <td class="lp5">${member['callsign']}</td>
          <td class="lp5">${member['aircraft']}</td>
          <td class="text-center text-bold">${member['freq']}</td>
          <td class="text-center text-bold">${member['tcn']}</td>
          <td class="lp5">${member['idm']}</td>
          <td class="lp5">${member['mission']}</td>
        </tr>`))
    }
    return elems;
  })();

}

var Loadout = function(data, unit) {

  var data = data;
  var unit = unit;
  

  this.table = function() {
    return $(`
      <table class="kb-width" style="table-layout: fixed; border:0px">
        <colgroup>
          <col style="width:40${unit}" />
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
      var weight = store ? ntos(elem.weight || 0) : '';

      var other_itm  = other_col[n];
      var lbs_itm = lbs_col[n];

      html += `
        <tr style="border:0">`

      if (pyl_name) {
        html += `
          <td class="text-center">${pyl_name}</td>
          <td class="lp5" style="overflow:hidden; white-space: nowrap">${store}</td>
          <td class="text-right rp5 rb2">${weight}</td>`;
      } else {
        html += `<td class="bg-blank" style="border:0" colspan=4></td>`;
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
        } else {
          html += `<th colspan=2 class="text-center">FIELD</th>`;
        }
      } else if (n == loop_count-mtow_rows+1) {
        if (data.loadout.weights.mtow_cvn) {
          html += `
            <th class="text-center">MAX T/O</th>
            <td class="text-right rp5">${ntos(data['loadout']['weights']['mtow_field'])}</td>
            <td class="text-right rp5">${ntos(data['loadout']['weights']['mtow_cvn'])}</td>`;
        } else {
          if (single_max) {
            html += `<th class="text-center">MAX</th>`;
          } else {
            html += `<th class="text-center">MAX T/O</th>`;
          }
          html += `<td colspan=2 class="text-right rp5">${ntos(data['loadout']['weights']['mtow_field'])}</td>`;
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
      <table class="kb-width" style="table-layout: fixed">
        <colgroup>
          <col style="width:37${unit}" />
          <col style="width:150${unit}" />
          <col style="width:150${unit}" />
          <col />
          <col style="width:70${unit}" />
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
    for (var wp of data.waypoint.waypoints) {

      // EMPTY rows if no lat or lon
      var lat = ll(data, wp, true);
      var lon = ll(data, wp, false);

      if (lat && lon) {
        content.push($(`
          <tr>
            <td class="text-center">${wp.typ}</td>
            <td class="text-center text-bold">${lat}</td>
            <td class="text-center text-bold">${lon}</td>
            <td class="lp5 overflow-hidden">${wp.name}</td>
            <td class="text-center">${alt_formatter(data, wp.alt | '')}</td>
            <td class="text-center">${gs_formatter(wp.gs)}</td>
            <td class="text-center">${wp.tot}</td>
            <td class="text-center">${wp.act == '00:00' ? '' : wp.act}</td>
          </tr>`));
      } else {
        content.push($(`<tr><td class="text-center">${wp.typ}</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`));
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
          var row = $(`<tr><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`);
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

  this.force_newpage_after = false

  this.table = function () {
    return $(`
      <table class="kb-width" style="table-layout: fixed">
        <colgroup>
          <col />
          <col style="width:150${unit}" />
          <col style="width:150${unit}" />
        </colgroup>

        <tbody>
          <tr>
            <th>POI</th>
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
}

var Sequence = function(data, unit) {
  var data = data;
  var unit = unit;

  this.force_newpage_after = false

  this.table = function () {
    return $(`
      <table class="kb-width" style="table-layout: fixed">
        <colgroup>
          <col style="width:20${unit}" />
          <col />
          <col />
        </colgroup>

        <tbody>
          <tr>
            <th>ID</th>
            <th>SEQ</th>
            <th>NOTES</th>
          </tr>
        </tbody>
      </table>`)
  };

  this.content = (function() {
    if (!data.waypoint.sequence) {
      return [];
    }

    var content = [];
    for (var elem of data.waypoint.sequence) {
      content.push($(`
        <tr>
          <td class="text-center">${elem['id']}</td>
          <td class="text-center">${elem['seq']}</td>
          <td class="lp5">${elem['notes']}</td>
        </tr>`));
    }
    return content
  })();
}

var Page = function(data, unit, id) {

  this.id = id || 1;

  // Page DIV container fixed 1200px 
  // this.page = $(`<div id="page${this.id}" style="height:1200px; background:${"#"+((1<<24)*Math.random()|0).toString(16)}"></div>`);
  this.page = $(`<div id="page${this.id}" style="position: absolute; top: ${(id-1)*1200}px; height:100%; width: 760px"></div>`);

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
        <div style="float: left; width: 509${unit}">
          <table style="width: 100%; table-layout: fixed">
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
          <table style="width:100%; table-layout: fixed">
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
      <table class="kb-width" style="table-layout: fixed">

        <colgroup>
          <col style="width:37${unit}" />
          <col />
          <col style="width:50${unit}" />

          <col style="width:75${unit}" />
          <col class="" style="width:49${unit}" />

          <col style="width:75${unit}" />
          <col class="" style="width:49${unit}" />

          <col style="width:75${unit}" />
          <col class="" style="width:49${unit}" />

          <col style="width:75${unit}" />
          <col class="" style="width:49${unit}" />

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

      elems.push($(`
          <tr>
            <td class="text-center">${x.toUpperCase()}</td>
            <td class="lp5 overflow-hidden">${elem.location}</td>
            <td class="text-center text-bold">${elem.tcn}</td>

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
      <table class="kb-width" style="table-layout: fixed">

        <colgroup>
          <col style="width:211${unit}" />
          <col style="width:45${unit}" />
          <col style="width:75${unit}" />
          <col style="width:49${unit}" />
          <col style="width:75${unit}" />
          <col style="width:49${unit}" />
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

      elems.push($(`
        <tr>
          <td class="overflow-hidden">${elem['agency']}</td>
          <td class="text-center text-bold">${elem['tcn']}</td>
          <td class="text-center text-bold rb0">${elem['pri']}</td>
          <td class="text-center lb0 text-pst text-bottom">${elem['pri_pst']}</td>
          <td class="text-center text-bold rb0">${elem['sec']}</td>
          <td class="text-center lb0 text-pst text-bottom">${elem['sec_pst']}</td>
          <td class="">${elem['notes']}</td>
        </tr>`));
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
      <table class="kb-width" style="table-layout: fixed">

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
      <table class="kb-width" style="table-layout: fixed; line-height: normal">
        <colgroup>
          <col />
        </colgroup>

        <tbody>
          <tr class="header">
            <th>NOTES</th>
          </tr>
          <tr style="vertical-align: top">
            <!-- important do not create #text by adding space -->
            <td class="body"></td>
          </tr>
        </tbody>
      </table>`);
    tables.push(table);
    return table;
  }

  this.content = (function() {

    if (!data.notes.html) {
      return [];
    }

    // Process the children
    var elems = [];
    for (var child of $(`<div>${data['notes']['html']}</div>`).contents()) {
      // Handle Page Breaks
      if (child.nodeType == Node.COMMENT_NODE && child.data.trim() == "pagebreak") {
        elems.push(new PageBreak);
        continue
      }

      elems.push($(child));
    }
    return elems;

  })();

  this.extend = function(elem, extension) {
    for (var table of tables) {
      if (table[0] == elem) {
        var content = table.find('.body');
        content.css('height', (content.height() + extension) + "px");
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
    'ramrod',
    'waypoints',
    'poi',
    'sequence',
    'package',
    'deparr',
    'agencies',
    'threats',
    'notes',
  ];

  sections = {
    'flight': new Flight(data, unit),
    'loadout': new Loadout(data, unit),
    'ramrod': new RAMROD(data, unit),
    'waypoints': new Waypoints(data, unit),
    'poi': new POI(data, unit),
    'sequence': new Sequence(data, unit),
    'package': new Package(data, unit),
    'deparr': new DepArr(data, unit),
    'agencies': new Agencies(data, unit),
    'threats': new Threats(data, unit),
    'notes': new Notes(data, unit),
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

  this.process_section = function() {

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

    row = section.content[rowid];
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
        if (body.contents().length != 0) {
          page = page.next();
          pages.push(page);
          new_section = true;
        }
        $(document).trigger('RowComplete');
        return;
      }

      var async = false;

      // If we encounter images, if they are over size width wise, resize
      if (row.prop('tagName') == "IMG") {
        if (row[0].complete !== true) {
          // Append a ready handler to continue
          row.on('load', function(e) {
            this.process_section_p2()
          }.bind(this));
          row.on('error', function(e) {
            this.process_section_p2()
          }.bind(this));
          async = true;
        }
      }

      body.append(row)

      if (!async) {
        this.process_section_p2()
      }
    } else {
      $(document).trigger('SectionComplete');
    }
  }

  this.process_section_p2 = function() {

    if (row.prop('tagName') == "IMG") {

      // we need to wait for the image to load to get correct
      // proportions for resize
      
      var max_width = 756;
      var max_height = 1080;

      var row_width = row.width();
      var row_height = row.height();

      // Find smallest scale factor
      var scale_factor = Math.min(max_width / row_width, max_height / row_height); 

      row.css('width', Math.round(row_width * scale_factor));
      row.css('height', Math.round(row_height * scale_factor));
    }

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
