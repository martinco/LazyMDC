
// On new airframe, mission, or side update our working presets
$(document).on({
  'flight-airframe-changed': presets_reset,
  'data-mission-changed': presets_reset,
  'data-side-changed': presets_reset,
  'frequency-updated': presets_update_inuse,
});


function presets_update_inuse() {
  // Find all the presets in use, and update the table with info icons on those
  // in use, and a second block of in-use but without presets
  //
  // This is ugly as there isn't a standard way fo handling it across the pages
  // so we're very much bolt-on until we re-do the whole site, but at least we
  // have the functionality to add to requirements / UX

  let form_title = (elem) => {
    let retval = [];

    let prefix = elem.attr('data-prefix');
    if (prefix) { retval.push(prefix); }

    let title = elem.attr('data-title');
    if (title) {
      let value = $('#' + title).val();
      if (value) {
        retval.push(value);
      } else {
        retval.push(title);
      };
    }

    // If we have no retval yet, we just pick the row's first cell and suffix
    // column title
    if (!title) {

      // First child value
      let value = elem.closest('tr')[0].cells[0].firstChild.value;
      if (value) { retval.push(value); }

      // Column header
      value = elem.closest('table').find('th').eq(elem.parent().index()).text();
      if(value && value != 'FREQ') { retval.push(value); }
    }

    let suffix = elem.attr('data-suffix');
    if (suffix) { retval.push(suffix); }

    return retval.join(" ");
  }

  // Compile a list of all our frequencies 
  let inuse = {};

  $("input.freq-autocomplete:not(.freq-preset-table)").each(function(idx, elem) {

    // If we have a data-title => references a cell ID of  name
    // If we have a data-suffix => Append to name
    // If we have neither, don't know what to do
    let jelem = $(elem);

    let ignoreif = $(elem).attr('data-exclude-if-hidden');
    if (ignoreif && $('#' + ignoreif).is(':hidden')) {
      return;
    }

    let value = jelem.val();
    if (!value) { return; }
    inuse[value] = form_title(jelem);
  });

  // Copy in use and delete those we have set, so we can use the items
  let no_presets = jQuery.extend(true, {}, inuse);

  // Loop through our comms table
  $('#presets-container').find('table>tbody>tr').each((idx, tr) => {
    let pst = tr.cells[0].innerHTML;
    let val = tr.cells[1].firstElementChild.value;
    let mark = $(tr).find('.validation-info-mark');

    if (inuse[val]) {
      delete(no_presets[val]);
      if (mark.length == 0) {
        $(tr.cells[1]).append($(`<div class="validation-info-mark" data-content="${inuse[val]}" rel="popover" data-trigger="hover" ></div>`));
      } else {
        mark[0].setAttribute('data-content', inuse[val]);
      }
    } else {
      mark.remove();
    }
  });

  if (Object.keys(no_presets).length == 0) {
    $('#presets-missing-container').hide();
  } else {
    let tbody = $('#presets-missing-table-body');
    tbody.empty();
    for (const key of Object.keys(no_presets).sort()) {
      tbody.append($(`
        <tr>
          <td class='text-center font-weight-bold'>${key}</td>
          <td>${no_presets[key]}</td>
        </tr>
      `));
    }
    $('#presets-missing-container').show();
  }

}

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

  // Then we update all presets to show the correct presets
  update_presets();

  // Update our markers
  presets_update_inuse();

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
          <td class="input-container text-center font-weight-bold" style="position:relative">
            <input class="freq-autocomplete freq-preset-table input-full ${input_class}" data-orig="${info.value}" value="${active}" autocomplete="off">
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

  // And refresh our presets in use
  presets_update_inuse();
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

$('body').popover({
  placement: 'bottom',
  container: 'body',
  html: true,
  selector: '[rel="popover"]', 
  trigger: "hover",
});
