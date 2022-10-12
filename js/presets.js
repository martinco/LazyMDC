
// On new airframe, mission, or side update our working presets
$(document).on({
  'flight-airframe-changed': presets_reset,
  'data-mission-changed': presets_reset,
  'data-side-changed': presets_reset,
});


function presets_build_lookups() {

  if (!presets?.data) {
    return
  }

  // We have our merged preset data for the side, so make this simple
  var preset_lookups = {};
  for (const [radio, radio_presets] of Object.entries(presets.data)) {
    for (const [pst, freq] of Object.entries(radio_presets)) {
      let freq_act = freq.override || freq.value;
      if (!preset_lookups[freq_act]) { preset_lookups[freq_act] = []; };
      preset_lookups[freq_act].push([radio, parseInt(pst)])
    }
  }

  // Consolidate down to what's displayed
  // If single radio then show RADIO-<PST>
  // If multiple on same radio, we show RAIDO-<FIRST_PST>
  // If multiple on different radios, we go PST, PST in aircraft radio priority order
  
  for (var [freq, data] of Object.entries(preset_lookups)) {
    // data is [[RADIO, PST]], so find unique radios and lowest presets
    var v = {}
    data.forEach((x) => v[x[0]] = !v[x[0]] || v[x[0]] > x[1] ? x[1] : v[x[0]] );

    if (Object.keys(v).length == 1)  {
      var k = Object.keys(v)[0];
      preset_lookups[freq] = `${k} ${v[k]}`;
    } else {
      let airframe = $('#flight-airframe').val();
      var prio = getDict(airframes, airframe, 'radios', 'priority');
      if (typeof(prio) !== "array") {
        prio = Object.keys(v);
      }
      var elems = [];
      for (const pick of prio) {
        if (v[pick]) {
          elems.push(v[pick]);
        }
      }
      if (airframe == "AH-64D") {
        // If we have multiple, it must be on the FM since there can't be
        // overlaping freqs on any other radios, so prefix with FM
        preset_lookups[freq] = "FM " + elems.join(',');
      } else {
        preset_lookups[freq] = elems.join(',');
      }
    }
  }

  // Update our presets global manager
  presets.lookups = preset_lookups;

  // If we've updated these, we need to update the fields
  update_presets();

}


function presets_reset() {

  // When resetting, we take our original data, from merged mission data, and
  // dump it into the working set, which is referenced by presets_draw
  
  let airframe = $('#flight-airframe').val();
  if (!airframe) { return; }

  var side = $('#data-side').val();

  // Clone it so we don't edit it in place
  let base_presets = mission_data?.data?.presets?.merged?.[airframe]?.[side];
  if (base_presets) {
    presets = jQuery.extend(true, {}, base_presets)
  } else {
    presets = {}
  }

  // Update our lookus
  presets_build_lookups();

  presets_draw();

  // Update all the preset displays
  update_presets();
}

function presets_onchange(elem) {

  // What was edited
  let value = elem.value;
  let radio = elem.closest('table').getAttribute('data-radio');
  let key_td = elem.closest('tr').children[0];
  let preset = key_td.getAttribute('data-key');

  let data = presets.data?.[radio]?.[preset];

  // Reset if need
  if (value == data.value) {
    delete data.override;
    key_td.innerHTML = preset;
  } else {
    data.override = value;
    key_td.innerHTML = `*${preset}`;
  }

  $(elem).toggleClass('presets-freq-override', data.override !== undefined)
  $(key_td).toggleClass('font-weight-bold', data.override !== undefined)

  // Since we've updated, we need to update our lookups and presets
  presets_build_lookups();
  update_presets();
}

function presets_draw() {
  // Here we create a tables for our airframe, and when a user edits them
  // Update our preset codes
  
  let airframe = $('#flight-airframe').val();
  if (!airframe) { return; }
  var side = $('#data-side').val();

  // Clear and redraw data
  $('#presets-container').empty();

  // Calculate spacing
  let radios = presets.priority.length
  let block_width = Math.floor((918 - ((radios-1) * 20)) / radios)-1;

  // Also lookup the code, since it's nice to have
  for (const radio of presets.priority) {
    let preset_data = presets.data[radio];
    let tbl = $(`
      <table class="table table-striped" data-radio="${radio}" style="float: left; width: ${block_width}px; margin-right:${radios != 1 ? 20 : 0}px; margin-bottom: 0px">
        <colgroup>
          <col style="width:45px" />
          <col style="width:${block_width - 45}px" />
        </colgroup>

        <thead class="thead-light">
          <tr>
            <th class="text-center" colspan=2>${radio}</th>
          </tr>
          <tr>
            <th class="text-center">PST</th>
            <th class="text-center">FREQ</th>
          </tr>
        </thead>
        <tbody>
        </tbody>
      </table>
    `);

    let body = $(tbl.first('tbody'));

    for (const [key, info] of Object.entries(preset_data)) {

      let active = info.override || info.value;
      let key_class = info.override === undefined ? '' : 'font-weight-bold';
      let input_class = info.override === undefined ? '' : 'presets-freq-override';

      body.append($(`
        <tr>
          <td data-key="${key}" class="text-right ${key_class}">${info.override === undefined ? '' : '*'}${key}</td>
          <td class="input-container text-center font-weight-bold">
            <input class="freq-autocomplete input-full ${input_class}" data-orig="${info.value}" value="${active}" autocomplete="off">
          </td>
        </tr>`));
    }

    tbl.find('input.freq-autocomplete').each(function(idx, input) {
      freq_autocomplete(input, presets_onchange)
    })

    $('#presets-container').append(tbl);

    --radios;
  }

  // Add in expansion
  $('#presets-container').append('<div style="clear: both;"></div>');
}

function presets_load(data, callback) {

  // When we load our presets, we need to check all the values as the upstream
  // mission may have changed, so we want to persist the values

  if (data?.radios) {
    for (const [radio, mdc_presets] of Object.entries(data.radios)) {
      for (const [pst, value] of Object.entries(mdc_presets)) {
        let target = (() => {
          if (typeof value === 'object') {
            return value.override || value.value;
          }
          return value})();

        if (target !== presets.data[radio][pst].value) {
          presets.data[radio][pst].override = target;
        }
      }
    }
  }
  
  // Update our lookup tables
  presets_build_lookups();
  presets_draw();
  callback();
}

function presets_export() {

  // For each of our presets, add the color code for the MDC
  let retval = {
    'priority': presets.priority,
    'radios': {},
  }

  for (const [radio, preset_data] of Object.entries(presets.data)) {
    retval.radios[radio] = {};
    for (const[pst, info] of Object.entries(preset_data)) {
      let code = lookup_freq_code(info.override || info.value);
      retval.radios[radio][pst] = info
      if (code) {
        retval.radios[radio][pst].code = code
      }
    }
  }

  return retval;
}

// Allow resetting of presets to the original values
$.contextMenu({
  selector: 'input.presets-freq-override',
  callback: function(key, options) {
    if (key == 'reset') {
      this.val(this[0].getAttribute('data-orig')).change();
    }
  },
  items: {
    "reset": {name: "reset", icon: "rotate-left"},
  }
});
