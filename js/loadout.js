
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
    loadout_set({
      'pylons': get_loadout_from_xml(route_data),
    })
  }

});

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
  for (var id in values.pylons) {
    if (id in pylon_opts) {
      values.pylons[id][1] = pylon_opts[id]
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

  header += `
          <th>FUEL %</th>
          <th>JOKER</th>
          <th>BINGO</th>
        </tr>`

  body += `
      <td class="input-container">
        <input class="input-full" name="fuel" type=number min=0 max=100 id="loadout-fuel" value="${values.fuel}">
        <input class="input-full" name="fuel_lbs" hidden id="loadout-fuel_lbs" value="${values.fuel_lbs}">
      </td>
      <td class="input-container"><input class="input-full" name="joker" value="${values.joker}"></td>
      <td class="input-container"><input class="input-full" name="bingo" value="${values.bingo}"></td>`;


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

  // Update image
  $("#loadout-image").attr('src', "img/" + type + ".png")

  // Populate base weights
  $("#loadout-table > colgroup").empty().append(colgroup)
  $("#loadout-table > thead").empty().append(header)
  $("#loadout-table > tbody").empty().append(body)

  // Pylon Table
  $("#loadout-pyl-table > tbody").empty().append(pyl_body)

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

  return pylons;

}

function loadout_export() {
  var ret = get_form_data($("#loadout-form"));
  ret['pylons'] = loadout_get_pylons();

  var type = $('#flight-airframe').val();
  var type_data = airframes[type];

  if (!type_data) {
    return {}
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
