
function theatre_edit(e) {


  var row = $(e.currentTarget);

  // If we have a child already; replace
  $('#side-nav a[href="#theatres-edit"]').remove();

  my_row = row;

  var nn = nav_item('theatres-edit', row.data('name'), 'map-pin', 1);
  $('#side-nav a[href="#theatres"]').after(nn);

  // Add new child NAV
  feather.replace();

  $('#side-nav a[href="#theatres-edit"]').tab('show');

}


function theatre_add() {

  var dlg = $('#theatre-add-dialog');

  dlg.modal({
    backdrop: 'static',
  });

}


function theatre_add_row(id, name) {

  var row = $(`
    <tr data-id="${id}" data-name="${name}">
      <td>${name}</td>
      <td class="text-center">
        <button class="btn btn-sm btn-primary" type="button")'>Edit</button>
      </td>
    </tr>
  `);

  row.on('click', theatre_edit);

  $('#theatres-table tbody').append(row);
}


function theatres_refresh() {

  // Remove child
  $('#side-nav a[href="#theatres-edit"]').remove();

  // Load up theatres and update the table
  api_get('theatres', function(res) {
    
    // Save theatre data, and build our table of theatres, with an edit button
    theatres = res;

    $('#theatres-table tbody').empty();

    for (const [theatre, data] of Object.entries(theatres)) {
      theatre_add_row(theatre, data['display_name']);
    }

  });
}

// Theatre name validity
$('#theatre-add-display-name').on('change', function(e) {
  var error = '';
  var name = $(this).val();

  if (Object.values(theatres).map(function(x) { return x.display_name } ).includes(name)) {
    error = 'A theatre of this name already exists, please update that instead'
  }

  // Set validity
  this.setCustomValidity(error);
  var inval = $(this).parent().find('div.invalid-feedback')[0]
  if (inval) {
    inval.innerHTML = error;
  }
})

// Theatre add JSON validity
$('#theatre-add-json').on('change', function(e) {
    var error = '';
    var json = null;

    try {
      json = JSON.parse($(this).val());
    } catch {}

    if(!json) {
      error = 'This does not appear to be valid JSON, please verify you have copied in the contents of the file'
    } else if (!json.theatre) {
      error = 'Theatre not in the JSON, please verify you copied all the content'
    } else if (theatres[json.theatre]) {
      error = 'A theatre already exists with that name, please update the existing theatre';
    }

    // Set validity
    this.setCustomValidity(error);
    var inval = $(this).parent().find('div.invalid-feedback')[0]
    if (inval) {
      inval.innerHTML = error;
    }
});

$('#theatre-add-button').click(theatre_add);

$('#theatre-add-submit').click(function() {
  var dlg = $('#theatre-add-dialog'); 
  var form = $('#theatre-add-form');

  // Required etc. is ok, but not nessesarilly things like the JSON
  form[0].classList.add('was-validated');
  if (form[0].checkValidity() !== true) {
    return;
  }

  var data = {
    'display_name': $('#theatre-add-display-name').val(),
    'data': JSON.parse($('#theatre-add-json').val()),
  }

  api_post(
    'theatres/create',
    data,
    function(response) {
      console.log(response);
    });
  console.log("Get Attem");

});
