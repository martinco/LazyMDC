
$(document).on('flight-airframe-changed', function(e) {

  var route = $('#flight-airframe').data('route');
  if (!route) { return }

  console.log(route)

  $('#mission-id').val(route.xml.querySelector('MSNnumber').textContent)

});

$('#mission-callsign').autocomplete({
    source: function(request, response) {
      var mission = $('#data-mission').val();
      var lookup = callsigns;

      if (mission_data[mission] && mission_data[mission]['callsigns']) {
        lookup = mission_data[mission]['callsigns'];
      }

      response(match_item_in_arr(lookup, request.term))

    },
    minLength: 1,
});

function mission_export() {
  return get_form_data($("#mission-form"))
}

function mission_load(data) {
  for (const [key, value] of Object.entries(data)) {
    var input = $("#" + key)
    if (input) {
      input.val(value)
    }
  }
}
