var sections = {};
var pages = [];

var re_mgrs = new RegExp([
    /^([0-9]+[A-Z])/,
    /([A-Z][A-Z])/,
    /([0-9]+)/,
].map(r => r.source).join(''));

function text_r90(text) {
  return `
    <div style="width:100%; height:100%; position:relative">
      <div style="position:absolute; left:50%; top:50%">
        <div class="text-r90">${text}</div>
      </div>
    </div>`;
}

function round_to(num, decimals=1) {
  return Math.round(num * (10**decimals)) / (10**decimals);
}

function display_coord(data, info) {

  // if lat_fmt or flight-coord
  var coord = info['lat_fmt'] === undefined ? data.flight['flight-coord'] : info['lat_fmt'];
  var decimals = parseInt(info['lat_dmp'] === undefined ? data.flight['flight-coord-decimals'] : info['lat_dmp']);

  if (coord === 'mgrs') {

    // Make sure lat, lon are nice
    let lat = parseFloat(info['lat']);
    let lon = parseFloat(info['lon']);

    if (isNaN(lat) || isNaN(lon)) {
      return ["", ""];
    }


    // Insert a space half way through
    let re = re_mgrs.exec(proj4.mgrs.forward([lon, lat], decimals));
    let dec = re[3].length/2
    let loc = re[3].slice(0, dec) + " " + re[3].slice(dec);
    return [`${re[1]} ${re[2]} ${loc}`, ""]
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
      axis = pos > 0 ? "N" : "S"
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


function Page1(data) {
  let page = new Page(data, "px", 1)

  const clsid_renames = {

    '{88D18A5E-99C8-4B04-B40B-1C02F2018B6E}': '4 AGM114K',
    '{EFT_230GAL}': 'FT 230 GAL',
    '{M261_INBOARD_DE_M151_C_M257}': 'M257+M151',
    '{M261_INBOARD_DE_M151_C_M274}': 'M274+M151',
    '{M261_M151_M433}': 'M151 HE',
    '{M261_M229}': 'M229 DP',
    '{M261_M257}': 'M257 IL',
    '{M261_M274}': 'M274 SM',
    '{M261_M282}': 'M282 MP',
    'M261_MK151': 'M151 HE',
    '{M261_OUTBOARD_AB_M151_E_M257}': 'M151+M257',
    '{M261_OUTBOARD_AB_M151_E_M274}': 'M151+M274',
    '{M299_1xAGM_114K_OUTBOARD_PORT}': '1 AGM114K',
    '{M299_1xAGM_114K_OUTBOARD_STARBOARD}': '1 AGM114K',
    '{M299_2xAGM_114K}': '2 AGM114K',
    '{M299_3xAGM_114K_OUTBOARD_PORT}': '3 AGM114K',
    '{M299_3xAGM_114K_OUTBOARD_STARBOARD}': '3 AGM114K',
    '{M299_1xAGM_114L_OUTBOARD_PORT}': '1 AGM114L',
    '{M299_1xAGM_114L_OUTBOARD_STARBOARD}': '1 AGM114L',
    '{M299_2xAGM_114L}': '2 AGM114L',
    '{M299_3xAGM_114L_OUTBOARD_PORT}': '3 AGM114L',
    '{M299_3xAGM_114L_OUTBOARD_STARBOARD}': '3 AGM114L',
    '{M299_EMPTY}': 'M299 EMPTY',
  }

  const get_pylon_name = (data) => {
    if (!data || !data.clsid) return "";
    if (clsid_renames[data.clsid]) return clsid_renames[data.clsid];
    return data.store;
  }
  
  // We have fixed header, so just write one big table instead
  // page. 
  let content = `
    <table class='std'>
      <colgroup>
        <col style="width:75px">
        <col style="width:44px">
        <col style="width:44px">
        <col style="width:44px">
        <col style="width:44px">
        <col style="width:44px">
        <col style="width:44px">
        <col style="width:44px">
        <col style="width:44px">
        <col style="width:44px">
        <col style="width:44px">
        <col style="width:44px">
        <col style="width:44px">
        <col style="width:44px">
        <col style="width:44px">
        <col />
      </colgroup>
      <tbody>
      `;

  // FLIGHT
  content += `
        <tr class="bordered-b2">
          <td class="text-col-title">CALLSIGN:</td>
          <td class="text-bold text-light text-upper" colspan=4>${data.mission["mission-callsign"]} ${data.mission["mission-flight-number"]}</td>
          <td class="text-col-title text-ar" colspan=2>TASKING:</td>
          <td class="text-bold text-light text-upper" colspan=6>${data.mission["mission-desc"]}</td>
          <td class="text-col-title text-ar" colspan=2>MISSION:</td>
          <td class="text-bold text-light text-upper" colspan=2>${data.mission["mission-id"]}</td>
        </tr>
        <tr class="bordered">
          <td class="text-bold bordered-b2" rowspan=6>${text_r90("FLIGHT")}</td>
          <td class="text-col-title"></td>
          <td class="text-col-title" colspan=2>PILOT</td>
          <td class="text-col-title" colspan=2>CPG</td>
          <td class="text-col-title" colspan=2>OUTR PYL L</td>
          <td class="text-col-title" colspan=2>INNR PYL L</td>
          <td class="text-col-title" colspan=2>INNR PYL R</td>
          <td class="text-col-title" colspan=2>OUTR PYL R</td>
          <td class="text-col-title">LSR</td>
          <td class="text-col-title" colspan=2>IFF M1|M3</td>
        </tr>
        `;

  for (let x=0; x < 4; x++) {
    // Underline is for PIC - so needs toggling
    content += `
      <tr class="bordered-b ${x % 2 == 0 ? "bg-dark" : ""}">
        <td class="bordered text-bold text-center">#${x+1}</td>
        <td class="bordered-vdash-r text-up text-bold text-light" colspan=2>${data.flight.members?.[x]?.pilot||""}</td>
        <td class="bordered-vdash-r text-up text-bold text-light" colspan=2>${data.flight.members?.[x]?.cpg||""}</td>`;

    if(data.flight.members?.[x]?.pilot||"" !== "") {
        content += `
          <td class="bordered-vdash-r text-light text-center" colspan=2>${get_pylon_name(data.loadout.pylons[x][0])}</td>
          <td class="bordered-vdash-r text-light text-center" colspan=2>${get_pylon_name(data.loadout.pylons[x][1])}</td>
          <td class="bordered-vdash-r text-light text-center" colspan=2>${get_pylon_name(data.loadout.pylons[x][2])}</td>
          <td class="bordered-vdash-r text-light text-center" colspan=2>${get_pylon_name(data.loadout.pylons[x][3])}</td>
        `;
    } else {
        content += `
          <td class="bordered-vdash-r text-light text-center" colspan=2></td>
          <td class="bordered-vdash-r text-light text-center" colspan=2></td>
          <td class="bordered-vdash-r text-light text-center" colspan=2></td>
          <td class="bordered-vdash-r text-light text-center" colspan=2></td>
        `;
    }

    content += `
        <td class="bordered-vdash-r text-light text-center">${data.flight.members?.[x]?.lsr||""}</td>
        <td class="bordered-vdash-r text-light text-center" colspan=2>${data.flight.members?.[x]?.pilot ? `${pad(x+1,2)}|${data.flight.members?.[x]?.squawk|""}` : ""}</td>
      </tr>
    `;
  }

  content += `
    <tr class="bg-dark bordered-b2">
      <td class="text-col-title">FUEL</td>
      <td class="text-bold text-light" colspan=2>${data.loadout.fuel}%</td>
      <td class="text-col-title">GUN</td>
      <td class="text-up text-light" colspan=1>${data.loadout.gun}%</td>
      <td class="text-col-title text-ar" colspan=2>FLARE</td>
      <td class="text-up text-light" colspan=1>${data.loadout.flare}</td>
      <td class="text-col-title text-ar" colspan=2>CHAFF</td>
      <td class="text-up text-light" colspan=6>${data.loadout.chaff}</td>
    </tr>
  `;

  // PACKAGE
  
  content += `
    <tr class="bordered">
      <td class="text-bold bordered-b2" rowspan=5>${text_r90("PACKAGE")}</td>
      <td class="text-col-title" colspan=3>CALLSIGN</td>
      <td class="text-col-title" colspan=2>A/C</td>
      <td class="text-col-title" colspan=2>PRI FREQ</td>
      <td class="text-col-title" colspan=2>SEC FREQ</td>
      <td class="text-col-title" colspan=2>LSR</td>
      <td class="text-col-title" colspan=5>TASK</td>
    </tr>
  `;

  for (let x=0; x < 4; x++) {
    content += `
      <tr class="bordered-b ${x % 2 == 0 ? "bg-dark" : ""} ${x == 3 ? "bordered-b2" : ""}">
        <td class="bordered-vdash-r text-item text-al" colspan=3>${data?.package?.members?.[x]?.callsign||""}</td>
        <td class="bordered-vdash-r text-item" colspan=2>${data?.package?.members?.[x]?.aircraft||""}</td>
        <td class="bordered-vdash-r text-item" colspan=2>${data?.package?.members?.[x]?.freq?.value||""}</td>
        <td class="bordered-vdash-r text-item" colspan=2>${data?.package?.members?.[x]?.freq_sec?.value||""}</td>
        <td class="bordered-vdash-r text-item" colspan=2>${data?.package?.members?.[x]?.lsr||""}</td>
        <td class="bordered-vdash-r text-item text-al" colspan=5>${data?.package?.members?.[x]?.mission||""}</td>
      </tr>
    `;
  }

  // FREQUENCIES
  let comms_rows = 6;
  content += `
    <tr class="bordered">
      <td class="text-bold" rowspan=${comms_rows+1}>${text_r90("FREQUENCIES")}</td>
      <td class="text-col-title" colspan=4>ITEM</td>
      <td class="text-col-title" colspan=2>CODE</td>
      <td class="text-col-title bordered-r2" colspan=2>FREQ</td>
      <td class="text-col-title" colspan=4>ITEM</td>
      <td class="text-col-title" colspan=2>CODE</td>
      <td class="text-col-title" colspan=2>FREQ</td>
    </tr>
  `;

  for (let x=0; x < comms_rows; x++) {
    // Ok we just fill down the column, then onto the 2nd column using the three flight frequencies first
    
    let [freq1, freq2] = (() => {
      // return the two freqs for the columns we have
      
      let col1 = {}
      let col2 = {}

      let flight_freq = ["pri", "sec", "ter"][x];
      let flight_freq_names = ["primary", "secondary", "tertiary"]
      if (flight_freq) {
        col1 = {
          'pri': data?.mission?.[`mission-${flight_freq}-freq`] || {},
          'agency': `INT ${flight_freq_names[x].toUpperCase()}`,
        } 
      } else {
        col1 = data?.comms?.agencies?.[x-3]||{};
      }

      col2 = data?.comms?.agencies?.[comms_rows-3+x] || {};

      return [col1,col2]
    })();

    content += `
      <tr class="bordered ${x == comms_rows-1 ? "bordered-b2" : ""} ${x % 2 == 0 ? "bg-dark" : ""}">
        <td class="bordered-vdash-r text-item text-al" colspan=4>${freq1.agency||""}</td>
        <td class="bordered-vdash-r text-item" colspan=2>${freq1.pri?.code||""}</td>
        <td class="bordered-r2 text-item" colspan=2>${freq1.pri?.value||""}</td>

        <td class="bordered-vdash-r text-item text-al" colspan=4>${freq2.agency||""}</td>
        <td class="bordered-vdash-r text-item" colspan=2>${freq2?.pri?.code||""}</td>
        <td class="bordered text-item" colspan=2>${freq2?.pri?.value||""}</td>
      </tr>
    `;
  }

  // AIRFIELD
  content += `
    <tr class="bordered">
      <td class="text-bold bordered-b2" rowspan=4>${text_r90("AIRFIELD")}</td>
      <td class="text-col-title" colspan=2></td>
      <td class="text-col-title" colspan=2>ICAO</td>
      <td class="text-col-title" colspan=2>GND</td>
      <td class="text-col-title" colspan=2>TWR</td>
      <td class="text-col-title" colspan=2>ATIS</td>
      <td class="text-col-title" colspan=2>AI ATC</td>
      <td class="text-col-title" colspan=2>ELEV(FT)</td>
      <td class="text-col-title" colspan=2>TIME</td>
    </tr>
  `;

  let waypoints = data?.waypoint?.waypoints || {};
  let deparr_times = {
    'dep': waypoints?.[0]?.tot,
    'arr': waypoints?.[waypoints.length-1]?.tot,
  }

  for (const loc of ['dep', 'arr', 'alt']) {
    let ld = data?.deparr?.[loc];
    if (ld.usedep === true) {
      ld = data?.deparr?.dep;
      if (loc == "arr" || data?.deparr?.arr?.usedep) {
        ld = {
          "icao": '"',
          "gnd": { "value": '"' },
          "twr": { "value": '"' },
          "atis": { "value": '"' },
          "vhf": { "value": '"' },
          "alt": '"',
        }
      }
    }

    let af_name = ld?.icao;
    if (!af_name || af_name === '----') {
      af_name = ld.location.replace("FARP", "").trim();
    }

    content += `
      <tr class="bordered-vdash-r bordered-b ${loc == 'arr' ? 'bg-dark' : ''} ${loc == 'alt' ? 'bordered-b2': ''}">
        <td class="text-col-title" colspan=2>${loc}</td>
        <td class="text-item" colspan=2>${af_name}</td>
        <td class="text-item" colspan=2>${ld?.gnd?.value||""}</td>
        <td class="text-item" colspan=2>${ld?.twr?.value||""}</td>
        <td class="text-item" colspan=2>${ld?.atis?.value||""}</td>
        <td class="text-item" colspan=2>${ld?.vhf?.value||""}</td>
        <td class="text-item" colspan=2>${ld?.alt||""}</td>
        <td class="text-item" colspan=2>${deparr_times[loc] || ""}</td>
      </tr>
      `;
  }



  // ROUTE

  let route_count = 19;
  content += `
    <tr class="bordered">
      <td class="text-bold" rowspan=${route_count+3}>${text_r90("ROUTE")}</td>
      <td class="text-col-title">TSD</td>
      <td class="text-col-title">TYPE</td>
      <td class="text-col-title">IDENT</td>
      <td class="text-col-title">FREE</td>
      <td class="text-col-title" colspan=4>MGRS or LAT/LON</td>
      <td class="text-col-title">ELEV</td>
      <td class="text-col-title">DIR</td>
      <td class="text-col-title">TIME</td>
      <td class="text-col-title" colspan=5>REMARKS</td>
    </tr>
  `;

  // Dictionmary of tag => TSD ID
  let tagged_waypoints = {}

  for (let x=0; x < route_count; x++) {
    let wp = data?.waypoint?.waypoints?.[x] || {};

    for (const tag of wp.tags || []) {
      tagged_waypoints[tag] = wp.typ;
    }

    let [lat, lon] = display_coord(data, wp);
    let ll = (() => {
      if (lon === "") {
        return `<td class="text-item" colspan=4>${lat}</td>`;
      };
      return `<td class="text-item" colspan=2>${lat}</td>
              <td class="text-item" colspan=2>${lon}</td>`;
    })();

    let dir = wp.tbrg ? pad(wp.tbrg, 3) : "";

    content += `
      <tr class="bordered-b bordered-vdash-r ${x == route_count -1 ? "bordered-b2" : ""} ${x % 2 == 0 ? "bg-dark" : ""}">
        <td class="text-item text-bold">${wp.typ||""}</td>
        <td class="text-item">${lat === "" ? "" : wp.db||""}</td>
        <td class="text-item">${lat === "" ? "" : wp.ident||""}</td>
        <td class="text-item">${wp.free||wp.typ||""}</td>
        ${ll}
        <td class="text-item text-center">${wp.alt||""}</td>`;
    if (x == 0) {
      content += `
        <td class="text-item" style="background:#222" colspan=2></td>
      `;
    } else {
      content += `
        <td class="text-item">${dir}</td>
        <td class="text-item">${(wp.time||"").substring(1)}</td>
      `;
    }

    content += `
        <td class="text-item text-al" colspan=5>${wp.name||""}</td>
      </td>
    `;
  }

  // Fence in info
  content += `
    <tr class="bordered">
      <td class="text-col-title" colspan=2>FENCE IN</td>
      <td class="text-col-title" colspan=2>HOLDING</td>
      <td class="text-col-title" colspan=2>RV</td>
      <td class="text-col-title bordered-r2" colspan=2>FENCE OUT</td>
      <td class="text-col-title" colspan=2>PLAYTIME</td>
      <td class="text-col-title bordered-r2" colspan=2>ETE</td>
      <td class="text-col-title" colspan=2>JOKER</td>
      <td class="text-col-title" colspan=2>BINGO</td>
    </tr>
    <tr class="bordered-vdash-r bordred-b2">
      <td class="text-item" colspan=2>${tagged_waypoints['Fence In'] || "-"}</td>
      <td class="text-item" colspan=2>${tagged_waypoints['Holding'] || "-"}</td>
      <td class="text-item" colspan=2>${tagged_waypoints['RV'] || "-"}</td>
      <td class="text-item bordered-r2" colspan=2>${tagged_waypoints['Fence Out']||"-"}</td>
      <td class="text-item" colspan=2>${data?.waypoint?.endurance|| ""}</td>
      <td class="text-item bordered-r2" colspan=2>${data?.waypoint?.ete||""}</td>
      <td class="text-item" colspan=2>${data.loadout.joker|""}</td>
      <td class="text-item" colspan=2>${data.loadout.bingo|""}</td>
  `;

  content += `
      </tbody>
    </table>`;


  page.append($(content));

}


function Page2(data) {
  let page = new Page(data, "px", 2)

  // We have fixed header, so just write one big table instead
  // page. 
  let content = `
    <table class='std'>
      <colgroup>
        <col style="width:75px">
        <col style="width:44px">
        <col style="width:44px">
        <col style="width:44px">
        <col style="width:44px">
        <col style="width:44px">
        <col style="width:44px">
        <col style="width:44px">
        <col style="width:44px">
        <col style="width:44px">
        <col style="width:44px">
        <col style="width:44px">
        <col style="width:44px">
        <col style="width:44px">
        <col style="width:44px">
        <col />
      </colgroup>
      <tbody>
      `;

  content += `
    <tr>
      <td class="bordered-b2 text-col-title" colspan=17>TACTICAL INFORMATION</td>
    </tr>`;

  // BATTLEFIELD GEOMETRY
  let battlefield_geom_count = 24;
  content += `
    <tr class="bordered">
      <td class="text-bold" rowspan=${battlefield_geom_count+1}>${text_r90("BATTLEFIELD GEOMETRY")}</td>
      <td class="text-col-title">TSD</td>
      <td class="text-col-title">TYPE</td>
      <td class="text-col-title">IDENT</td>
      <td class="text-col-title">FREE</td>
      <td class="text-col-title" colspan=4>MGRS or LAT/LON</td>
      <td class="text-col-title">ELEV</td>
      <td class="text-col-title" colspan=7>REMARKS</td>
    </tr>
  `;

  for (let x=0; x < battlefield_geom_count; x++) {
    let wp = data?.waypoint?.poi?.[x] || {};
    console.log(wp);

    let [lat, lon] = display_coord(data, wp);
    let ll = (() => {
      if (lon === "") {
        return `<td class="text-item" colspan=4>${lat}</td>`;
      };
      return `<td class="text-item" colspan=2>${lat}</td>
              <td class="text-item" colspan=2>${lon}</td>`;
    })();

    console.log("poi", ll, lat, lon);

    if (lat !== "") {
      content += `
        <tr class="bordered-b bordered-vdash-r ${x % 2 == 0 ? "bg-dark" : ""} ${x == battlefield_geom_count-1 ? "bordered-b2" : ""}">
          <td class="text-item text-bold">${wp.typ||""}</td>
          <td class="text-item">${wp.db||""}</td>
          <td class="text-item">${wp.ident||""}</td>
          <td class="text-item">${wp.free||wp.typ||""}</td>
          ${ll}
          <td class="text-item text-center">${wp.alt||""}</td>
          <td class="text-item text-al" colspan=7>${wp.name||""}</td>
        </td>
      `;
    } else {
      content += `
        <tr class="bordered-b bordered-vdash-r ${x % 2 == 0 ? "bg-dark" : ""} ${x == battlefield_geom_count-1 ? "bordered-b2" : ""}">
          <td/>
          <td/>
          <td/>
          <td/>
          <td colspan=4/>
          <td/>
          <td colspan=7/>
        </tr>
      `;
    }
  }

  // TARGET AND THREAT INFORMATION
  let tgth_count = 11;
  content += `
    <tr class="bordered">
      <td class="text-bold" rowspan=${tgth_count+1}>${text_r90("TARGET & THREAT INFORMATION")}</td>
      <td class="text-col-title text-al" colspan=6>TARGETS</td>
      <td class="text-col-title">km</td>
      <td class="text-col-title bordered-r2">nm</td>
      <td class="text-col-title text-al" colspan=6>THREATS</td>
      <td class="text-col-title">km</td>
      <td class="text-col-title">nm</td>
    </tr>
  `;

  let threats = data?.threats?.threats || [];
  let targets = data?.threats?.targets || [];

  for (let x=0; x < tgth_count; x++) {
    let wp = data?.waypoint?.poi?.[x] || {};
    let threat = threats?.[x] || {};
    let target = targets?.[x] || {};

    content += `
      <tr class="bordered-b bordered-vdash-r ${x % 2 == 0 ? "bg-dark" : ""} ${x == tgth_count-1 ? "bordered-b2" : ""}">
        <td class="text-item" colspan=2>${target.threat|| ""}</td>
        <td class="text-item" colspan=2>${target.type || ""}</td>
        <td class="text-item" colspan=2>${target.tracker || ""}</td>
        <td class="text-item">${round_to(target.rmax*1.852,1)||""}</td>
        <td class="text-item bordered-r2">${round_to(target.rmax)||""}</td>

        <td class="text-item" colspan=2>${threat.threat || ""}</td>
        <td class="text-item" colspan=2>${threat.report_name||""}</td>

        <td class="text-item text-al" colspan=2>${threat.type|| ""}</td>
        <td class="text-item">${round_to(threat.rmax*1.852,1)||""}</td>
        <td class="text-item">${round_to(threat.rmax)||""}</td>
      </td>
    `;
  }

  // TARGETS AND WEAPONS
  let tw_count = 6;
  content += `
    <tr class="bordered">
      <td class="text-bold" rowspan=${tw_count+1}>${text_r90("TARGETS & WEAPONS")}</td>
      <td class="text-col-title text-al" colspan=2>PRIORITY</td>
      <td class="text-col-title" colspan=6>TYPE / OBJECT</td>
      <td class="text-col-title" colspan=4>WEAPON MATCH <span style="font-size: 9px">(prio)</span></td>
      <td class="text-col-title" colspan=4>REMARKS</td>
    </tr>
  `;

  for (let x=0; x < tw_count; x++) {
    console.log(data);
    let prio = data?.threats.priorities?.[x] || {};

    content += `
      <tr class="bordered-b bordered-vdash-r ${x % 2 == 0 ? "bg-dark" : ""} ${x == 12 ? "bordered-b2" : ""}">
        <td class="text-item text-bold text-light " colspan=2>${x+1}</td>
        <td class="text-item text-bold text-al" colspan=6>${prio.type||""}</td>
        <td class="text-item text-al" colspan=4>${prio.weapon|| ""}</td>
        <td class="text-item" colspan=4>${prio.notes|| ""}</td>
      </tr>
    `;
  }


  content += `
    </tbod>
    </table>`;

  page.append($(content));

}

var Page = function(data, unit, id) {

  this.id = id || 1;

  // Page DIV container fixed 1200px 
  // this.page = $(`<div id="page${this.id}" style="height:1200px; background:${"#"+((1<<24)*Math.random()|0).toString(16)}"></div>`);
  this.page = $(`
    <div id="page${this.id}" style="position: absolute; top: ${(id-1)*1200}px; height:100%; width: 780px; padding:10px; height:1200px;">
      <div style="position: absolute; top: 1180px; text-align: right; width:780px; font-size:12px;">${mdc_key}</div>
    </div>
  `);

  // Content is the entire page (inc. header)
  this.content = $(`<div class="content"></div>`);
  this.page.append(this.content);

  // Body contains the variable sections
  this.body = $(`<div class="section-body"></div>`);
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
    ];

    for (var s of single_page_expansions) {
      for (var c of this.body.children()) {
        var attr = c.getAttribute('data-section');
        if (attr == s)  {
          sections[s].extend(c, 1170-this.height());
        }
      }
    }
  }

  this.fits = function() {
    return this.content.height() < 1170;
  }

  this.next = function() {
    return new Page(data, unit, id+1)
  }
}

function CodeWords(data, unit) {
  var data = data;
  var unit = unit;

  this.content = [null];

  this.table = function() {

    let html = `
      <table class='std'>
        <colgroup>
          <col style="width:75px">
          <col style="width:176px">
          <col style="width:176px">
          <col style="width:176px">
          <col />
        </colgroup>
        <tbody>
    `;

    // TARGETS AND WEAPONS
    let cw_count = 8;
    html += `
    <tr class="bordered-b2">
      <td class="text-col-title" colspan=5>ADDITIONAL INFORMATION</td>
    </tr>
      <tr class="bordered">
        <td class="text-bold" rowspan=${cw_count+1}>${text_r90("CODEWORDS")}</td>
        <td class="text-col-title">ACTION/EVENT</td>
        <td class="text-col-title">CODEWORD</td>
        <td class="text-col-title">ACTION/EVENT</td>
        <td class="text-col-title">CODEWORD</td>
      </tr>
    `;

    for (let x=0; x < cw_count; x++) {
      let left_cw = data?.comms?.codewords?.[x] || {};
      let right_cw = data?.comms?.codewords?.[x+cw_count] || {};

      html += `
        <tr class="bordered-b bordered-vdash-r ${x % 2 == 0 ? "bg-dark" : ""} ${x == 12 ? "bordered-b2" : ""}">
          <td class="text-item text-bold" >${left_cw.action||""}</td>
          <td class="text-item text-bold text-al">${left_cw.codeword || ""}</td>

          <td class="text-item text-bold">${right_cw.action|| ""}</td>
          <td class="text-item text-bold text-al">${right_cw.codeword || ""}</td>
        </tr>
      `;
    }

    html += `
            </tbody>
          </table>
    `;

    return $(html);
  }
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
      <table style="table-layout: fixed; line-height: normal">
        <colgroup>
          <col />
        </colgroup>

        <tbody>
          <tr class="header">
            <th class="text-col-title">${data['title'] || "NOTES"}</th>
          </tr>
          <tr style="vertical-align: top">
            <!-- important do not create #text by adding space -->
            <td class="section-body notes-content" style="overflow: normal; white-space: normal; position: relative; border:1px solid black"></td>
          </tr>
        </tbody>
      </table>`);
    tables.push(table);
    return table;
  }

  this.content = (function() {

    if (!data || !data.html) {
      return [""];
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
        var content = table.find('.section-body');
        content.css('height', (content.height() + extension) + "px").resize();
        return
      }
    }
  }
}

// This is effectively a loop 
function Builder(data, unit, start_page = 1) {

  var data = data;
  var unit = unit;
  var elem = null;
  var ac = data['flight']['flight-airframe'];


  var section = null;
  var section_id = 0;

  var section_order = [
    'codewords',
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
    'notes': new Notes(data.notes, unit),
    'codewords': new CodeWords(data, unit),
  };

  var page = new Page(data, unit, start_page);
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
      var tw = 781;
      var th = 1130;

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
    }
    console.log("CCCOMPLETE")

    // This is very important: it is used by pyppeteer to start processing
    $('body').append($(`<div style="display:none" id="page_count">${pages[pages.length-1].id}</div>`));
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

      // Introduce Section Table
      header = section.table();
      header.attr('data-section', key);
      page.append(header);

      // If the header doesn't fit, we shuffle to the next page
      if (!page.fits()) {
        page = page.next()
        pages.push(page);
        page.append(header);
      }

      // Find where we add content, either a specific body class or a
      // tbody default for standard tables
      body = header.find('.section-body');
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

        page.append(header);

      } else {

        // If we're in a breakable section, but it takes up < 1/4 the page,
        // then migrate to next page. This is useful for either waypoints or
        // more commonly notes

        if (header.height() < 300) {
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

console.log("FOO");

$(function() {

  mdc_key = getUrlParameter('kb')
  if (mdc_key) {
    $.getJSON("../../mdcs/" + mdc_key + ".json").done(function(data) {
      console.log(data);
      mdc = data;
      Page1(data);
      console.log("P1");
      Page2(data);
      console.log("P2");
      builder = new Builder(data, "px", 3);
      builder.build()
      console.log("P3");
    }).fail(function(err) {
      console.log("ERR", err)
    });
  };
});
