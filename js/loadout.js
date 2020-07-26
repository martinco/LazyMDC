
loadout_airframe_defaults = {
  "F-14B": {
    "pylons": [
      ["1a", ""],
      ["1b", ""],
      ["2", ""],
      ["3", ""],
      ["4", ""],
      ["5", ""],
      ["6", ""],
      ["7", ""],
      ["8b", ""],
      ["8a", ""]
    ],
    "empty_lbs": 44040,
    "chaff": 0,
    "flare": 60,
    "fuel": 100,
    "fuel_lbs": 16200,
    "gun": 100,
    "gun_lbs": 520,
    "joker": 5000,
    "bingo": 4000,
    "cvn": true,
    "mtow_field": 72000,
    "mtow_cvn": 76000,
    "mlw_field": 60000,
    "mlw_cvn": 44000,
    "comments": '* If loading LAU-138, you have an additional 40 chaff',
  },
  "A-10C": {
    "pylons": [
      ["1", ""],
      ["2", ""],
      ["3", ""],
      ["4", ""],
      ["5", ""],
      ["6", ""],
      ["7", ""],
      ["8", ""],
      ["9", ""],
      ["10", ""],
      ["11", ""]
    ],
    "empty_lbs": 24967,
    "chaff": 240,
    "flare": 120,
    "fuel": 100,
    "fuel_lbs": 11087,
    "gun": 100,
    "gun_lbs": 1775,
    "joker": 3000,
    "bingo": 2000,
    "comments": "",
    "cvn": false,
    "mtow_field": 72000,
    "mlw_field": 60000,
  },
  "FA-18C": {
    "pylons": [
      ["1", ""],
      ["2", ""],
      ["3", ""],
      ["4", ""],
      ["5", ""],
      ["6", ""],
      ["7", ""],
      ["8", ""],
      ["9", ""]
    ],
    "empty_lbs": 25642,
    "chaff": 60,
    "flare": 30,
    "fuel": 100,
    "fuel_lbs": 10803,
    "gun": 100,
    "gun_lbs": 331,
    "joker": 4500,
    "bingo": 3000,
    "comments": "",
    "cvn": true,
    "mtow_field": 72000,
    "mtow_cvn": 76000,
    "mlw_field": 60000,
    "mlw_cvn": 44000,
  },
  "F-16C": {
    "pylons": [
      ["1", ""],
      ["2", ""],
      ["3", ""],
      ["4", ""],
      ["5L", ""],
      ["5", ""],
      ["5R", ""],
      ["6", ""],
      ["7", ""],
      ["8", ""],
      ["9", ""],
    ],
    "empty_lbs": 19899+1567, // 1567 is under weapons, but unable to be removed so we count it on empty
    "chaff": 60,
    "flare": 60,
    "fuel": 100,
    "fuel_lbs": 7163,
    "joker": 3000,
    "bingo": 2000,
    "gun": 100,
    "gun_lbs": 294,
    "comments": "",
    "cvn": false,
    "mtow_field": 72000,
    "mlw_field": 60000,
  },
}
// Process new Combat Flite

$(document).on('flight-airframe-changed', function(e) {

  loadout_set({
    'pylons': get_loadout_from_xml($('#flight-airframe').data('route')),
  });

});

function get_loadout_from_xml(route) {

  // Chaff, Flares, GunAmmoType/GunAmmo, InitFuel are available, but not sure it's that useful as
  if (!route) { 
    return {}
  }

  // Return List of stores, pylon name => load
  var stores_obj = new Object();

  // Get our type mapping of int pylons -> name
  var type_map = stores_map[route.aircraft] || {};
  var stores = route.xml.querySelector('FlightMembers > FlightMember > Aircraft > Stores').childNodes;

  // Get all the stores / pylons, these are unordered, 1 indexed
  for(var i = 0, j=stores.length; i < j; i++) {

    if (stores[i].tagName !== 'Store') { continue; }

    var pylon = parseInt(stores[i].getElementsByTagName("Pylon")[0].textContent)
    var load = stores[i].getElementsByTagName("StoreName")[0].textContent

    var pylon_name = type_map[pylon] || pylon.toFixed();
    stores_obj[pylon_name] = { 'store': load }
  }

  return stores_obj;
}

function loadout_update_weight() {
    var type = $('#flight-airframe').val();

    if (!type) {
      return;
    }

    var empty_weight = loadout_airframe_defaults[type]['empty_lbs'];
    var total = empty_weight;
    var stores = 0;

    var gun_lbs = Math.round($("#loadout-gun").val()/100 * loadout_airframe_defaults[type]['gun_lbs']);
    var fuel_lbs = Math.round($("#loadout-fuel").val()/100 * loadout_airframe_defaults[type]['fuel_lbs']);
  
    $('#loadout-fuel_lbs').val(fuel_lbs);
    $('#loadout-gun_lbs').val(gun_lbs);

    total += gun_lbs;
    total += fuel_lbs;

    $(".pylon-select").each(function(idx, pyl) {
      var w = Math.round($(pyl).find("option:selected").data('pyl-weight') || 0);
      total += w
      stores += w
    })

    total = Math.round(total)
    $("#loadout-table-weight").html(total)

    return {
      'total': total,
      'stores': Math.round(stores),
      'owe': empty_weight,
    }
}

function get_pylon_options(type, id, val = "") {
  id = id + 1;
  if (!pylon_data[type]) { return [] }
  if (!pylon_data[type][id]) { return [] }
  output = "";

  var selected_weight = 0

  for (var [name, info] of Object.entries(pylon_data[type][id])) {
    var weight = Math.round(info['weight']*2.20462)

    if (name == val) {
      selected_weight = weight
    }
    output += `<option${name == val ? ' selected' : ''} data-pyl-weight="${weight}">${name}</option>\n`
  }

  return [output, selected_weight]
}

function loadout_set(opts) {

  // we don't want to modify opts, so clone it
  opts = opts || {}
  opts = jQuery.extend(true, {}, opts)

  var type = $('#flight-airframe').val();
  if (!type) {
    return;
    return;
  }

  // Copy our default and merge our opts
  var values = jQuery.extend(true, {}, loadout_airframe_defaults[type])
  var pylon_opts = opts.pylons || {}
  delete(opts.pylons)

  jQuery.extend(true, values, opts)

  // Merge pylon arrays
  for (var id in values.pylons) {
    if (id in pylon_opts) {
      values.pylons[id][1] = pylon_opts[id]['store']
    }
  }

  pylons = values.pylons

  // build body HTML
  var pylon_index = 0
  var pylon_count = pylons.length

  // Get first two
  var [pyl1_opts, pyl1_weight] = get_pylon_options(type, pylon_index, pylons[pylon_index][1])
  var [pyl2_opts, pyl2_weight] = get_pylon_options(type, pylon_index+1, pylons[pylon_index+1][1])

  var body = `
    <tr>
      <td class="input-container"><input class="input-full" name="flare" value="${values.flare}"></td>
      <td class="input-container"><input class="input-full" name="chaff" value="${values.chaff}"></td>
      <td class="input-container">
        <input class="input-full" name="gun" type=number min=0 max=100 id="loadout-gun" value="${values.gun}">
        <input class="input-full" name="gun_lbs" hidden id="loadout-gun_lbs" value="${values.gun_lbs}">
      </td>
      <td class="input-container">
        <input class="input-full" name="fuel" type=number min=0 max=100 id="loadout-fuel" value="${values.fuel}">
        <input class="input-full" name="fuel_lbs" hidden id="loadout-fuel_lbs" value="${values.fuel_lbs}">
      </td>
      <td class="input-container"><input class="input-full" name="joker" value="${values.joker}"></td>
      <td class="input-container"><input class="input-full" name="bingo" value="${values.bingo}"></td>
      <td class="text-center">${pylons[pylon_index][0]}</td>
      <td class="input-container">
        <select class="input-full pylon-select" data-pyl-name="${pylons[pylon_index][0]}">
          <option data-pyl-weight="0"></option>${pyl1_opts}
        </select>
      </td>
      <td style="text-align: right">${pyl1_weight}</td>
    </tr>
    <tr>
      <td class="input-container" colspan=6 rowspan=${pylon_count}><img width=100% alt=img src="img/${type}-light.png" /></td>
      <td class="text-center">${pylons[pylon_index+1][0]}</td>
      <td class="input-container">
        <select class="input-full pylon-select" data-pyl-name="${pylons[pylon_index+1][0]}">
          <option data-pyl-weight="0"></option>${pyl2_opts}
        </select>
      </td>
      <td style="text-align: right">${pyl2_weight}</td>
    </tr>
  `

  pylon_index += 2;

  while(pylon_index < pylon_count) {
    
    var [pyl_opts, pyl_weight] = get_pylon_options(type, pylon_index, pylons[pylon_index][1])

    body += `
        <tr>
          <td class="text-center">${pylons[pylon_index][0]}</td>
          <td class="input-container">
            <select class="input-full pylon-select" data-pyl-name="${pylons[pylon_index][0]}">
              <option data-pyl-weight="0"></option>${pyl_opts}
            </select>
          </td>
          <td style="text-align: right">${pyl_weight}</td>
        </tr>
    `

    pylon_index++;
  }

  // Populate base weights
  $("#loadout-empty-weight").val(values.empty_lbs)

  $("#loadout-table > tbody").empty().append(body)

  $("#loadout-comments").html(values.comments)

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
    var weight = option.data('pyl-weight') || 0;
    option.closest('tr').find('td:last').html(weight.toFixed() || "");

    // Add up all selected weights and update total
    loadout_update_weight()

  });

  loadout_update_weight()

}

function loadout_export() {
  var ret = get_form_data($("#loadout-form"));
  ret['pylons'] = []

  // Load our pylons separately, as we want more data
  $("#loadout-table .pylon-select").each(function(idx, select) {
    ret['pylons'].push({
      'pyl': select.getAttribute('data-pyl-name'),
      'store': select.options[select.selectedIndex].textContent,
      'weight': parseInt(select.options[select.selectedIndex].getAttribute('data-pyl-weight')),
    })
  });

  
  var type_data = loadout_airframe_defaults[$('#flight-airframe').val()];

  if (!type_data) { 
    return {}
  }

  // Set weights
  ret['weights'] = loadout_update_weight()

  ret['weights']['mtow_field'] = type_data['mtow_field'];
  ret['weights']['mlw_field'] = type_data['mlw_field'];

  if (type_data['cvn']) {
    ret['weights']['mtow_cvn'] = type_data['mtow_cvn'];
    ret['weights']['mlw_cvn'] = type_data['mlw_cvn'];
  }

  return ret
}

function loadout_load(data) {

  if (!data || data instanceof Array) {
    return
  }

  // We store the pylon data in order, to the real name
  loadout_set(data)
}
