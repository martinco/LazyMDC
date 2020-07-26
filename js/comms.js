// Whooop

function agency_autocomplete(input, fields) {
  $(input).autocomplete({
    source: function(request, response) {
      var mission = $('#data-mission').val();
      //try {
        response(match_labels_in_arr(mission_data[mission]['agencies'], request.term))
      //} catch {
        //response([])
      //}
    },
    minLength: 1,
    select: function( event, ui) {

      var row = event.target.parentElement.parentElement;

      var tcn = ui.item.tcn;
      if (tcn && fields[0]) { row.cells[fields[0]].firstChild.value = tcn };

      var pri = ui.item.pri;
      if (pri && fields[1]) {
        row.cells[fields[1]].firstChild.value = pri
      };

      var sec = ui.item.sec;
      if (sec && fields[2]) {
        row.cells[fields[2]].firstChild.value = sec
      };

      update_presets()

    }
  });
}

function comms_add(opts) {
    
  var data = {
    'agency': '',
    'tcn': '',
    'pri': '',
    'sec': '',
    'notes': '',
  }
  
  jQuery.extend(true, data, opts)
    
    
  $("#comms-table > tbody").append(`<tr>
      <td class="input-container"><input value="${data['agency']}"></td>
      <td class="input-container text-center"><input value="${data['tcn']}"></td>
      <td class="input-container text-center font-weight-bold"><input class="freq-autocomplete freq-preset" value="${data['pri']}"></td>
      <td class="text-center"></td>
      <td class="input-container text-center font-weight-bold"><input class="freq-autocomplete freq-preset" value="${data['sec']}"></td>
      <td class="text-center"></td>
      <td class="input-container border-right-0"><input value="${data['notes']}"></td>
      <td class="input-container text-center border-left-0">
        <button class="btn btn-link btn-sm p-0 pt-0.5" onclick='$(this).closest("tr").remove();'>
          <i data-feather="delete"></i>
        </button>
      </td>
    </tr>
  `)

  var last = $('#comms-table > tbody > tr:last')

  last.find('input.freq-autocomplete').each(function(idx, input) {
    freq_autocomplete(input)
  })

  // Setup
  agency_autocomplete(last[0].cells[0].firstChild, [1,2,4])

  feather.replace()

}

$('#comms-add').click(function() {
  comms_add()
});


function comms_export() {

    var ret = {
        'agencies': [],
        'ramrod': $("#comms-ramrod").val(),
    }
    
    $("#comms-table > tbody > tr").each(function(idx, tr) {
        ret['agencies'].push(get_row_data(tr, ['agency', 'tcn', 'pri', 'pri_pst', 'sec', 'sec_pst', 'notes']))
    })
    
    return ret
}

function comms_load(data) {
    
    $("#comms-ramrod").val(data['ramrod'])

    $('#comms-table > tbody').empty()

    data['agencies'].forEach(function(data) {
        comms_add(data)
    });
    
    update_presets()
}

