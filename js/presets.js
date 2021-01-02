
function presets_load(data, callback) {
  callback();
}

function presets_export() {
  // For now we just dump the airframe merged results
  var merged = $.extend(true, {}, getDict(mission_data, 'data', 'presets', 'merged', $('#flight-airframe').val()));
  var side = $('#data-side').val();

  // Also lookup the code, since it's nice to have
  for (var [radio, presets] of Object.entries(merged.data[side])) {
    for (var key of Object.keys(presets)) {
      var freq = presets[key];
      var code = lookup_freq_code(freq)

      presets[key] = {
        'value': freq
      }
      if (code) {
        presets[key]['code'] = code;
      }
    }
  }

  return {
    'priority': merged.priority,
    'radios': merged.data[side],
  }
}
