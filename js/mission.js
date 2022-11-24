
$(document).on('flight-airframe-changed', function(e) {

  var route = $('#flight-airframe').data('route');
  if (!route) { return }

  // If we're CF and the current value is empty, update to CF
  if (!route.route_only && route.xml_format == "cf" && !$('#mission-id').val()) {
    $('#mission-id').val(route.xml.querySelector('MSNnumber').textContent);
  }

});

$('#mission-callsign').autocomplete({
    source: function(request, response) {
      var mission = $('#data-mission').val();
      response(match_item_in_arr(squadron_data.callsigns ? squadron_data.callsigns : [], request.term))
    },
    minLength: 1,
});

function mission_export() {
  var data = get_form_data($("#mission-form"));
  data['mission-pri-freq'] = freq_to_obj(data['mission-pri-freq']);
  data['mission-sec-freq'] = freq_to_obj(data['mission-sec-freq']);
  data['mission-ter-freq'] = freq_to_obj(data['mission-ter-freq']);
  data['mission-beacons'] = mission_data.data.beacons;
  return data;
}

function mission_load(data, callback) {

  if (!data) { callback(); return; }

  for (const [key, value] of Object.entries(data)) {
    var input = $("#" + key)
    if (input) {
      if (input.hasClass("freq-pst")) {
        if(value) {
          input.val(value.value)
        }
      } else {
        input.val(value)
      }
    }
  }
  callback();
}
