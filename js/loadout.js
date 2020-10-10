
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

  // Get our type mapping of int pylons -> name, as combat flite uses 11 for 5R
  // etc. which is as per DCS, but not really what the user sees

  var type_map = stores_map[route.aircraft] || {};
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

    $(".pylon-select").each(function(idx, pyl) {
      var w = Math.round($(pyl).find("option:selected").data('pyl-weight') || 0);
      total += w*2.20462
      stores += w*2.20462
    })

    total = Math.round(total)
    $("#loadout-table-weight").html(total)

    return {
      'total': total,
      'stores': Math.round(stores),
      'oew': empty_weight,
    }
}

function get_pylon_options(type, id, val = "") {

  id = id + 1;

  var pylon_data = airframes[$('#flight-airframe').val()]['loadout'];
  output = "";

  var selected_weight = 0

  for (var [name, info] of Object.entries(pylon_data[id])) {
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

  // we don't want to modify opts, so clone it
  opts = opts || {}
  opts = jQuery.extend(true, {}, opts)

  var type = $('#flight-airframe').val();
  if (!type) {
    return;
  }

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

    var [pyl_opts, pyl_weight] = get_pylon_options(type, pylon_index, pylons[pylon_index][1])

    pyl_body += `
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
    var weight = option.data('pyl-weight') || 0;
    option.closest('tr').find('td:last').html(weight.toFixed() || "");

    // Add up all selected weights and update total
    loadout_update_weight()

  });

  $("#loadout-comments").html(values.comments)

  loadout_update_weight()

}

function loadout_export() {
  var ret = get_form_data($("#loadout-form"));
  ret['pylons'] = []

  // Load our pylons separately, as we want more data
  $("#loadout-pyl-table .pylon-select").each(function(idx, select) {
    var itm = select.options[select.selectedIndex];
    ret['pylons'].push({
      'pyl': select.getAttribute('data-pyl-name'),
      'store': select.options[select.selectedIndex].textContent,
      'weight': Math.round(itm.getAttribute('data-pyl-weight')*2.20462),
      'clsid': itm.getAttribute('data-pyl-clsid'),
    })
  });


  var type_data = airframes[$('#flight-airframe').val()];

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
