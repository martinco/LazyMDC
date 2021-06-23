
function threats_autocomplete(input, fields) {
  $(input).autocomplete({
    source: function(request, response) {
      response(match_key_in_arr(threats, "label", request.term))
    },
    minLength: 1,
    select: function( event, ui) {
      
      var tr = event.target.closest('tr')

      var itms = ['rwr', 'type', 'cms', 'rmin', 'rmax', 'hmin', 'hmax', 'notes']

      var i = 1;
      for (var itm of itms) {
        var clear = true;

        // If we have an autocomplete field, we only replace it if its not been
        // altered or empty
        var current = tr.cells[i].firstChild.value;
        var ac_value = tr.cells[i].firstChild.getAttribute('data-ac');
        if (current != "" && ac_value && current != ac_value) {
          console.log(itm, "a", current, "b", ac_value);
          clear = false;
        };

        if (clear) {
          if (ui.item[itm]) {
            tr.cells[i].firstChild.value = ui.item[itm];
            tr.cells[i].firstChild.setAttribute('data-ac', ui.item[itm]);
          } else {
            tr.cells[i].firstChild.value = "";
            tr.cells[i].firstChild.removeAttribute('data-ac');
          }
        }
        i++;
      }
    }
  });
}

function threats_add(opts) {

    var data = {
        'threat': '',
        'rwr': '',
        'type': '',
        'cms': '',
        'rmin': '',
        'rmax': '',
        'amin': '',
        'amax': '',
        'notes': '',
    }
    
    jQuery.extend(true, data, opts)


  $("#threats-table > tbody").append(`<tr>
      <td class="input-container"><input value="${data['threat']}" required></td>
      <td class="input-container text-center"><input value="${data['rwr']}"></td>
      <td class="input-container text-center"><input value="${data['type']}"></td>
      <td class="input-container text-center"><input value="${data['cms']}"></td>
      <td class="input-container text-center"><input type="number" step="any" class="nospin" value="${data['rmin']}"></td>
      <td class="input-container text-center"><input type="number" step="any" class="nospin" value="${data['rmax']}"></td>
      <td class="input-container text-center"><input type="number" step="any" class="nospin" value="${data['amin']}"></td>
      <td class="input-container text-center"><input type="number" step="any" class="nospin" value="${data['amax']}"></td>
      <td class="input-container border-right-0"><input value="${data['notes']}"></td>
      <td class="input-container text-center border-left-0">
        <button class="btn btn-link btn-sm p-0 pt-0.5" onclick='$(this).closest("tr").remove();' type="button">
          <i data-feather="delete"></i>
        </button>
      </td>
    </tr>
  `)

  var last = $('#threats-table > tbody > tr:last')

  // Setup
  threats_autocomplete(last[0].cells[0].firstChild)

  feather.replace()

}

$('#threats-add').click(function() {
  threats_add()
});


function threats_export() {

    var ret = {
        'threats': [],
    }
    
    $("#threats-table > tbody > tr").each(function(idx, tr) {
        ret['threats'].push(get_row_data(tr, ['threat', 'rwr', 'type', 'cms', 'rmin', 'rmax', 'amin', 'amax', 'notes']))
    })
    
    return ret
}

function threats_load(data, callback) {

    if (!data) { callback(); return; }
    
    $('#threats-table > tbody').empty()

    data['threats'].forEach(function(data) {
        threats_add(data)
    });

    callback();
}
