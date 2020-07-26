
$(document).on('flight-airframe-changed', function(e) {

  var route = $('#flight-airframe').data('route');
  if (!route) { return }

  console.log(route)

  $('#mission-id').val(route.xml.querySelector('MSNnumber').textContent)

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
