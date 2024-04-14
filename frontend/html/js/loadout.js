
loadout_validation = true;
loadout_type = undefined;

// On new aircraft, always clear loadout
$(document).on('flight-airframe-changed', function(e) {
  loadout_set();
});

// This gets triggered anytime CF imports so it might have no route, but the
// aircraft change would have happened from loadout_set
$('#flight-airframe').on('data-route-updated', function(e) {

  var route_data = $('#flight-airframe').data('route');
  if (route_data && !route_data.route_only && route_data.use_loadout) {
    if (route_data.xml_format == 'cf') {
      loadout_set({
        'pylons': get_loadout_from_xml(route_data),
      })
    } else if (route_data.xml_format == 'miz') {
      loadout_set(get_loadout_from_miz(route_data));
    }
  }

});

function get_loadout_from_miz(route) {

  let primary = route?.group_data?.units?.["1"].payload;
  if (!primary) { return {}; }

  var ac_info = airframes[route.aircraft];

  // Resulting Loadout Template
  let loadout = {}

  if (primary?.chaff) { loadout.chaff = primary.chaff; }
  if (primary?.flare) { loadout.flare = primary.flare; }
  if (primary?.gun) { loadout.gun = primary.gun; }
  if (primary?.fuel) { loadout.fuel = Math.min(Math.round(primary.fuel * 2.204678 * 100 / ac_info.fuel_lbs), 100) }

  let type_map = ac_info['loadout_map'] || {};

  // Map DCS ordering to a lookup, so we can process in order of the MDC display
  let stores_obj = {}
  for (const[pylon_id, pylon_data] of Object.entries(primary.pylons)) {
    var pylon_name = type_map[pylon_id] || pylon_id;
    stores_obj[pylon_name] = { 'pylon': pylon_name, 'clsid': pylon_data.CLSID };
  }

  // Convert to an ordered list as per the loadout defaults (we want this to be
  // ordered to match the order of the aircraft image / MDC)

  loadout.pylons = [];
  for (var data of airframes[route.aircraft]['pylons']) {
    var store = stores_obj[data[0]];
    if (store?.clsid) {
      loadout.pylons.push(store)
    } else {
      loadout.pylons.push({"pylon": data[0], "store": "" })
    }
  }

  return loadout

}

function get_loadout_from_xml(route) {

  // Chaff, Flares, GunAmmoType/GunAmmo, InitFuel are available, but not sure it's that useful as
  if (!route) { 
    return {}
  }

  // Get our type mapping of int pylons -> name, as combat flite uses 11 for 5R
  // etc. which is as per DCS, but not really what the user sees

  var type_map = airframes[route.aircraft]['loadout_map'] || {};
  var stores = route.xml.querySelector('FlightMembers > FlightMember > Aircraft > Stores').childNodes;

  // Get all the stores / pylons, these are unordered, and additionally the
  // names may not match what's in DCS, but the CLSID will

  var stores_obj = {};
  for(var i = 0, j=stores.length; i < j; i++) {

    if (stores[i].tagName !== 'Store') { continue; }

    var pylon = parseInt(stores[i].getElementsByTagName("Pylon")[0].textContent)
    var load = stores[i].getElementsByTagName("StoreName")[0].textContent
    var clsid = stores[i].getElementsByTagName("CLSID")[0].textContent

    var pylon_name = type_map[pylon] || pylon.toFixed();
    stores_obj[pylon_name] = { 'pylon': pylon_name, 'store': load, 'clsid': clsid }
  }

  // Convert to an ordered list as per the loadout defaults (we want this to be
  // ordered to match the order of the aircraft image / MDC)


  var output = []

  var pylons = airframes[route.aircraft]['pylons']
  for (var data of pylons) {
    var store = stores_obj[data[0]];
    if (store) {
      output.push(store)
    } else {
      output.push({"pylon": data[0], "store": "" })
    }
  }

  return output;
}

function loadout_update_weight() {
    var type = $('#flight-airframe').val();

    if (!type) {
      return;
    }

    var empty_weight = airframes[type]['empty_lbs'];
    var total = empty_weight;
    var stores = 0;

    var gun_pct = $("#loadout-gun").val()
    if (gun_pct) {
      var gun_lbs = Math.round(gun_pct/100 * airframes[type]['gun_lbs']);
      $('#loadout-gun_lbs').val(gun_lbs);
      total += gun_lbs;
    }

    var fuel_lbs = Math.round($("#loadout-fuel").val()/100 * airframes[type]['fuel_lbs']);
    $('#loadout-fuel_lbs').val(fuel_lbs);
    total += fuel_lbs;

    // If we're an apache, update this to the base weight of each element
    if(type === 'AH-64D') {

      for (let x = 1 ; x < 5; x++) {
        let flight_member_weight = total;
        let tr = $(`#loadout-pyl-table-ah64 > tbody > tr:nth-child(${x})`);
        for (let y = 2; y <= 6; y++) {
          let select = tr[0].cells[y].firstElementChild;
          let itm = select.options[select.selectedIndex];

          flight_member_weight += Math.round(itm.getAttribute('data-pyl-weight')*2.20462)
        }

        // If we have an FCR add in that too
        if (tr[0].cells[1].firstElementChild.checked) flight_member_weight += Math.round(237.23 * 2.20462)

        // Update lbs
        tr[0].cells[7].innerText = flight_member_weight;
      }

    } else {

      var pyl_kg = 0
      $(".pylon-select").each(function(idx, pyl) {
        var w = $(pyl).find("option:selected").data('pyl-weight') || 0;
        pyl_kg += w
      })


      var pyl_lbs = pyl_kg * 2.20462;
      total += pyl_lbs;
      stores += pyl_lbs;

      //console.log(`Gun: ${gun_lbs}, Empty: ${empty_weight}, Fuel: ${fuel_lbs}, Stores: ${pyl_lbs}, Total :${total}`);

      total = Math.round(total)
      $("#loadout-table-weight").html(total)
    }

    return {
      'total': total,
      'stores': Math.round(stores),
      'oew': empty_weight,
    }
}

function get_pylon_options(type, name, val = "") {

  // The loadout is straight from PyDCS so needs some massaging at times as the
  // ordering might not be the same

  var loadout_map = {}
  Object.keys(airframes[type]['loadout_map'] || {}).map(function(key, idx) {
    loadout_map[airframes[type]['loadout_map'][key]] = key
  });

  // So first we lookup if it's remapped, if not use the same as name
  var pylon_game_id = loadout_map[name] || name;

  // If we have data, enumerate the options
  var pylon_data = airframes[type]['loadout'][pylon_game_id];

  if (!pylon_data) {
    return ["", 0];
  }

  var output = "";
  var selected_weight = 0;

  for (var [name, info] of Object.entries(pylon_data)) {
    var weight = info['weight']

    // val might be a dict from CF, so if it's a dict, so if dict, check store
    // and clsid else just check name

    var selected = false;
    if (typeof(val) == "object") {
      if (name == val['store']) {
        selected_weight = weight;
        selected = true;
      } else if (info['clsid'] == val['clsid']) {
        selected_weight = weight;
        selected = true;
      }
    } else if (name == val) {
      selected_weight = weight;
      selected = true;
    }

    output += `<option${selected ? ' selected' : ''} data-pyl-weight="${weight}" data-pyl-clsid="${info['clsid']}">${name}</option>\n`
  }

  return [output, Math.round(selected_weight*2.20462)]
}

function loadout_preset_apply(evt, member_index) {

  if (!evt.value) { return; }

  let type = $('#flight-airframe').val();
  if (!type) { return; }

  // Find preset values
  if (!airframes[type].loadout_presets) { return; }
  let presets = airframes[type].loadout_presets[evt.value];
  if (!presets) { return; }

  // If we're a member index, take our presets.pylons and push it to member
  // index instead
  if (member_index !== undefined) {
    // Avoid overwriting our pylons
    presets = jQuery.extend(true, {}, presets)

    // Keep FCR
    presets.fcr = get_ah64_fcr()

    let new_pylons = loadout_get_pylons();
    new_pylons[member_index] = presets.pylons;
    presets.pylons = new_pylons;
  }

  // Update our pylon selects
  loadout_set(presets)

}

function loadout_set(opts) {

  var type = $('#flight-airframe').val();
  if (!type) {
    return;
  }

  var type_changed = type !== loadout_type;
  loadout_type = type;

  // If we are maintaining the same type of aircraft, we try and preserve the
  // loadout by default, this is useful if for instance we select a new route
  // and uncheck select loadout from route

  // If we're an apache we have data.loadout.pylons.[flight_member_id] instead
  
  opts = opts || {
    'pylons': type_changed ? [] : loadout_get_pylons(),
  }

  opts = jQuery.extend(true, {}, opts)

  // Copy our default and merge our opts
  var values = jQuery.extend(true, {}, airframes[type])
  var pylon_opts = opts.pylons || {}
  delete(opts.pylons)

  jQuery.extend(true, values, opts)

  // values.pylons is an ordered dict of ["pylon", "loadout"]
  // whilst pylons_opts should be, assume it's incomplete
  if (type === 'AH-64D') {
    // For the apache, we want per-member loadouts, so just create na array,
    // apache is limited to 4 and will be for hte life of this app, so meh
    //
    // Also values.pylons here is the default pylon info in the airframe
    //

    // List of pylons per flight member
    let ah64_pylons = [];

    for (let x = 0; x < 4; x ++) {
      let fm_pylons = []
      for (var id in values.pylons) {
        let selected_pylon = pylon_opts?.[x]?.[id];
        fm_pylons.push([values.pylons[id][0], selected_pylon ? selected_pylon : values.pylons[id][1]])
      }
      ah64_pylons.push(fm_pylons)
    }
    values.pylons = ah64_pylons
  } else {
    for (var id in values.pylons) {
      if (id in pylon_opts) {
        values.pylons[id][1] = pylon_opts[id]
      }
    }
  }

  pylons = values.pylons

  // Content Build
  var colgroup = `<col />`;
  var header = `<tr class="header">`;
  var body = `<tr>`;

  header += `<th>FLARE</th>`;
  body += `<td class="input-container"><input class="input-full" name="flare" value="${values.flare}"></td>`;

  if (values.chaff != undefined && values.chaff != "undefined") {
    colgroup = `<col />`;
    header += `<th>CHAFF</th>`;
    body += `<td class="input-container"><input class="input-full" name="chaff" value="${values.chaff}"></td>`;
  }

  if (values.gun != undefined && values.gun != "undefined") {
    colgroup += `<col />`;
    header += `<th>GUN %</th>`;
    body += `
        <td class="input-container">
          <input class="input-full" name="gun" type=number min=0 max=100 id="loadout-gun" value="${values.gun}">
          <input class="input-full" name="gun_lbs" hidden id="loadout-gun_lbs" value="${values.gun_lbs}">
        </td>`;
  }

  colgroup += `
        <col />
        <col />
        <col />`;

  header += `<th>FUEL %</th>`;

  if (values.tiger !== undefined) {
    header += `<th>TIGER</th>`;
  }

  header += `
          <th>JOKER</th>
          <th>BINGO</th>
        </tr>`

  body += `
      <td class="input-container">
        <input class="input-full" name="fuel" type=number min=0 max=100 id="loadout-fuel" value="${values.fuel}">
        <input class="input-full" name="fuel_lbs" hidden id="loadout-fuel_lbs" value="${values.fuel_lbs}">
      </td>`;

  if (values.tiger !== undefined) {
    body += `<td class="input-container"><input class="input-full" name="tiger" value="${values.tiger}"></td>`;
  }

  body += `
      <td class="input-container"><input class="input-full" name="joker" value="${values.joker}"></td>
      <td class="input-container"><input class="input-full" name="bingo" value="${values.bingo}"></td>`;

  // PYLON TABLE HANDLING
  if (type !== 'AH-64D') {

    $('#loadout-pyl-table').show();
    $('#loadout-preset-selector').show();
    $('#loadout-pyl-table-ah64').hide();

    var pyl_body = "";
    var pylon_index = 0;
    var pylon_count = pylons.length;

    while(pylon_index < pylon_count) {

      var [pyl_opts, pyl_weight] = get_pylon_options(type, pylons[pylon_index][0], pylons[pylon_index][1])

      pyl_body += `
          <tr>
            <td class="text-center">${pylons[pylon_index][0]}</td>
            <td class="input-container">
              <select class="input-full pylon-select" data-pyl-name="${pylons[pylon_index][0]}">
                <option data-pyl-weight="0"></option>${pyl_opts}
              </select>
            </td>
            <td style="text-align: right">${pyl_weight || ""}</td>
          </tr>
      `

      pylon_index++;
    }

    let loadout_presets = "<option value='' selected></option>";
    if (values.loadout_presets) {
      for (let id of Object.keys(values.loadout_presets).sort()) {
        loadout_presets += `<option value="${id}">${values.loadout_presets[id]['name']}</option>`;
      }
    }

    // Presets list
    $("#pylon-preset-select").empty().append(loadout_presets);

    // Pylon Table
    $("#loadout-pyl-table > tbody").empty().append(pyl_body)

  } else {
    $('#loadout-pyl-table').hide();
    $('#loadout-pyl-table-ah64').show();
    $('#loadout-preset-selector').hide();

    // In the apache, we just generate the 4 rows for each aircraft directly,
    // with presets and a total lbs
    
    let loadout_presets = "<option value='' selected></option>";
    if (values.loadout_presets) {
      for (let id in values.loadout_presets) {
        loadout_presets += `<option value="${id}">${values.loadout_presets[id]['name']}</option>`;
      }
    }
    
    let ah64_rows = '';

    for (let x = 0; x < 4; x++) {
      let unit_weight = 0;

      let pyl_opts = [
        get_pylon_options(type, pylons[x][0][0], pylons[x][0][1]),
        get_pylon_options(type, pylons[x][1][0], pylons[x][1][1]),
        get_pylon_options(type, pylons[x][2][0], pylons[x][2][1]),
        get_pylon_options(type, pylons[x][3][0], pylons[x][3][1]),
      ];
      let unit_loadout_weight = pyl_opts.reduce((c, itm) => c = c+itm[1], 0);

      ah64_rows += `
        <tr>
          <td class="text-center font-weight-bold">#${x+1}</td>
          <td class="text-center font-weight-bold">
              <input type="checkbox" class="input-full" style="height: 100%" ${opts?.fcr?.[x] === "1" ? "checked" : ""} onchange="loadout_update_weight()"/>
          </td>
          <td class="input-container">
            <select class="input-full pylon-preset-select" onchange="loadout_preset_apply(this, ${x});">
              ${loadout_presets}
            </select>
          </td>
          <td class="input-container">
            <select class="input-full" data-pyl-name="1" onchange="loadout_update_weight()">
              <option data-pyl-weight="0"></option>
              ${pyl_opts[0]}
            </select>
          </td>
          <td class="input-container">
            <select class="input-full" data-pyl-name="2" onchange="loadout_update_weight()">
              <option data-pyl-weight="0"></option>
              ${pyl_opts[1]}
            </select>
          </td>
          <td class="input-container">
            <select class="input-full" data-pyl-name="3" onchange="loadout_update_weight()">
              <option data-pyl-weight="0"></option>
              ${pyl_opts[2]}
            </select>
          </td>
          <td class="input-container">
            <select class="input-full" data-pyl-name="4" onchange="loadout_update_weight()">
              <option data-pyl-weight="0"></option>
              ${pyl_opts[3]}
            </select>
          </td>
          <td class="input-container text-center" data-unit-weight="${unit_loadout_weight}">${unit_loadout_weight}</td>
        </tr>
        `;
    }

    $('#loadout-pyl-table-ah64 > tbody').empty().append(ah64_rows);
  }

  // Update image
  $("#loadout-image").attr('src', "img/" + type + ".png")

  // Populate base weights
  $("#loadout-table > colgroup").empty().append(colgroup)
  $("#loadout-table > thead").empty().append(header)
  $("#loadout-table > tbody").empty().append(body)

  // Events
  $("#loadout-fuel").on('change', function(e) {
    loadout_update_weight()
  })

  $("#loadout-gun").on('change', function(e) {
    loadout_update_weight()
  })

  $(".pylon-select").on('change', function(e) {

    // Type
    var type = $('#flight-airframe').val();

    // Just bailk on ah64
    if (type === 'AH-64D') return;

    // Set current weight
    var option = $("option:selected", this);
    var weight = Math.round((option.data('pyl-weight') || 0)*2.20462);
    var select = option.closest('select')
    option.closest('tr').find('td:last').html(weight || "");

    // Some airframes like the m2k have loadout restrictions so we do them
    // here, we set loadout_validation to false to avoid a recursive loop on
    // the changed() event we want to call to update the weight values etc.
    
    if (loadout_validation) {
      if (type == 'M-2000C') {

        loadout_validation = false;

        var pylon_id = select.data('pyl-name');
        var pylon_store = select.val();
        var pylon_clsid = option.data('pyl-clsid')

        // Paired Elements
        var fuselage_pylons = [3, 4, 6, 7];
        var paired_pylons = [1,2,8,9];

        // Handle the 4 fuselage pylon rules
        if (fuselage_pylons.includes(pylon_id)) {
          for (var m of fuselage_pylons) {
            if (m == pylon_id) { continue; }

            // Normally, all 4 stores are the same, but if we select GBU, then
            // only 3 and 7 stay selected, and we de-select the other two
            var target_item = pylon_store;
            if (pylon_clsid == '{DB769D48-67D7-42ED-A2BE-108D566C8B1E}' && [4,6].includes(m)) {
              target_item = ""
            }

            $("select[data-pyl-name='"+m+"']").val(target_item).change();
          }
        } else if (paired_pylons.includes(pylon_id)) {
          // We just make the reciprical pylon match
          $("select[data-pyl-name='"+(Math.abs(pylon_id-10))+"']").val(pylon_store).change();
        }

        loadout_validation = true;
      }

      // Add up all selected weights and update total
      loadout_update_weight()
    }
  });

  $("#loadout-comments").html(values.comments)

  loadout_update_weight()

}

function loadout_get_pylons() {
  var pylons = [];

  if (loadout_type !== 'AH-64D') {
    // Load our pylons separately, as we want more data
    $("#loadout-pyl-table .pylon-select").each(function(idx, select) {
      var itm = select.options[select.selectedIndex];
      pylons.push({
        'pyl': select.getAttribute('data-pyl-name'),
        'store': select.options[select.selectedIndex].textContent,
        'weight': Math.round(itm.getAttribute('data-pyl-weight')*2.20462),
        'clsid': itm.getAttribute('data-pyl-clsid'),
      })
    });
  } else {
    // We go for each flight member and gobble them up
    for (let x = 1 ; x < 5; x++) {
      $(`#loadout-pyl-table-ah64 > tbody > tr:nth-child(${x})`).each(function(idx, tr) {
        let member_pylons = []
        for (let y = 3; y < 7; y++) {
          let select = tr.cells[y].firstElementChild;
          let itm = select.options[select.selectedIndex];
          member_pylons.push(
            {
              'pyl': select.getAttribute('data-pyl-name'),
              'store': select.options[select.selectedIndex].textContent,
              'weight': Math.round(itm.getAttribute('data-pyl-weight')*2.20462),
              'clsid': itm.getAttribute('data-pyl-clsid'),
            }
          )
        }
        pylons.push(member_pylons);
      });
    }
  }

  return pylons;

}

function get_ah64_fcr() {
  return $('#loadout-pyl-table-ah64 > tbody').children().map(
    (idx, x) => x.cells[1].firstElementChild.checked ? "1" : "0").toArray()
}

function loadout_export() {
  var ret = get_form_data($("#loadout-form"));
  ret['pylons'] = loadout_get_pylons();

  var type = $('#flight-airframe').val();
  var type_data = airframes[type];

  if (!type_data) {
    return {}
  }

  // If we're an apache dump the FCR info too
  if (type == "AH-64D") {
    ret['fcr'] = get_ah64_fcr()
  }

  ret['weights'] = loadout_update_weight()

  ret['weights']['mtow_field'] = type_data['mtow_field'];
  ret['weights']['mlw_field'] = type_data['mlw_field'];

  if (type_data['cvn']) {
    ret['weights']['mtow_cvn'] = type_data['mtow_cvn'];
    ret['weights']['mlw_cvn'] = type_data['mlw_cvn'];
  }

  if (type_data['vtol']) {
    ret['weights']['mtow_vtol'] = type_data['mtow_vtol'];
    ret['weights']['mlw_vtol'] = type_data['mlw_vtol'];
  }

  return ret
}

function loadout_load(data, callback) {

  if (!data || data instanceof Array) { callback(); return; }

  // We store the pylon data in order, to the real name
  loadout_set(data);
 
  callback();
}
