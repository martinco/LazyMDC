// Whooop


$(document).on('data-mission-changed', codeword_reset);

function agency_autocomplete(input, fields) {
  $(input).autocomplete({
    source: function(request, response) {
      response(
        match_keys_in_dict(
          getDict(mission_data, 'data', 'agencies', $('#data-side').val()),
          request.term,
          'alt_names'))
    },
    minLength: 1,
    select: function( event, ui) {

      var row = event.target.parentElement.parentElement;

      // Set this now, so presets can lookup the full value, not the partial
      event.target.value = ui.item.label;

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

      update_presets();

      presets_update_inuse();

    }
  });
}

function comms_add(opts) {
    
  var data = {
    'agency': '',
    'tcn': '',
    'pri': null,
    'sec': null,
    'notes': '',
  }
  
  jQuery.extend(true, data, opts)
    
    
  $("#comms-table > tbody").append(`<tr>
      <td class="input-container text-center border-right-0"><i data-feather="more-vertical"></i></td>
      <td class="input-container border-left-0"><input onchange="presets_update_inuse();" value="${data['agency']}"></td>
      <td class="input-container text-center"><input value="${data['tcn']}"></td>
      <td class="input-container text-center font-weight-bold"><input class="freq-autocomplete freq-preset" data-title-col="1" value="${data.pri ? data.pri.value || "" : ""}"></td>
      <td class="text-center"></td>
      <td class="input-container text-center font-weight-bold"><input class="freq-autocomplete freq-preset" data-title-col="1" value="${data.sec ? data.sec.value || "" : ""}"></td>
      <td class="text-center"></td>
      <td class="input-container border-right-0"><input value="${data['notes']}"></td>
      <td class="input-container text-center border-left-0">
        <button type="button" class="btn btn-link btn-sm p-0 pt-0.5" onclick='$(this).closest("tr").remove(); presets_update_inuse();'>
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
  agency_autocomplete(last[0].cells[1].firstChild, [2,3,5])
  tcn_formatter(last[0].cells[1].firstChild)

  feather.replace()

}

$('#comms-add').click(function() {
  comms_add()
});

// CODEWORD

function codeword_reset() {
  // Triggered when mission changes, so populate with mission defaults from
  // admin
  
  $("#codewords-table > tbody").empty();
  
  // Admin stores them by just codeword - action
  for (const [codeword, data] of Object.entries(mission_data?.data?.codewords || {})) {
    codeword_add({codeword: codeword, action: data.action})
  }

}

function codeword_add(data) {
  data = data || {}
    
  $("#codewords-table > tbody").append(`<tr>
      <td class="input-container text-center border-right-0"><i data-feather="more-vertical"></i></td>
      <td class="input-container text-center border-left-0"><input class="text-uppercase" value="${data.codeword||""}"></td>
      <td class="input-container border-right-0"><input value="${data.action||""}"></td>
      <td class="input-container text-center border-left-0">
        <button type="button" class="btn btn-link btn-sm p-0 pt-0.5" onclick='$(this).closest("tr").remove(); presets_update_inuse();'>
          <i data-feather="delete"></i>
        </button>
      </td>
    </tr>
  `)

  // Setup
  feather.replace()

}

$('#codewords-add').click(function() {
  codeword_add()
});

function comms_export() {

    var ret = {
        'codewords': [],
        'agencies': [],
        'ramrod': $("#comms-ramrod").val(),
    }
    
    $("#comms-table > tbody > tr").each(function(idx, tr) {
      var row = get_row_data(tr, ['-', 'agency', 'tcn', 'pri', '-', 'sec', '-', 'notes']);
      row['pri'] = freq_to_obj(row['pri']);
      row['sec'] = freq_to_obj(row['sec']);
      ret['agencies'].push(row)
    });

    $("#codewords-table > tbody > tr").each(function(idx, tr) {
      var row = get_row_data(tr, ['-', 'codeword', 'action']);
      if (row.codeword === "" || row.action === "") return;
      ret['codewords'].push({'codeword': row.codeword, action: row.action})
    });
    
    return ret
}

function comms_load(data, callback) {

  if (data) {
    
    $("#comms-ramrod").val(data['ramrod'])

    $('#comms-table > tbody').empty()

    data['agencies'].forEach(function(data) {
        comms_add(data)
    });

    $('#codewords-table > tbody').empty();
    (data?.codewords || []).forEach(function(data) {
        codeword_add(data)
    });
  }

  update_presets();

  presets_update_inuse();

  
  callback();
  
}

$('#comms-table > tbody').sortable({
  items: 'tr',
})

$('#codewords-table > tbody').sortable({
  items: 'tr',
})
