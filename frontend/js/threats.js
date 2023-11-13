$('#flight-airframe').on('flight-airframe-changed', function(e) {
  var type = $('#flight-airframe').val();

  // hide or show targets based on airframe
  $('#threats-targets-group').toggle(airframes?.[type]?.threats_use_targets === true);


  let threats_prio_count = airframes?.[type]?.threats_prio_count || 0;
  // hide or show targets based on airframe
  $('#threats-prio-group').toggle(threats_prio_count > 0);

  if (threats_prio_count > 0) {
    // Create our prio group
    $('#threats-prio-table > tbody').empty();
    for (let x = 0; x < threats_prio_count; x++) {
      threats_prio_add();
    }
    threats_prio_renumber();
  }
});

function threats_autocomplete(input, fields) {
  $(input).autocomplete({
    source: function(request, response) {
      response(match_key_in_arr(threats, "label", request.term, (x) => { x.value = x.short_name || x.label;  return x }))
    },
    minLength: 1,
    select: function( event, ui) {

      var tr = event.target.closest('tr')

      var itms = ['report_name', 'rwr', 'type', 'tracker', 'cms', 'rmin', 'rmax', 'hmin', 'hmax']

      // First item is either the short name, or the regular name
      let display_name = ui.item.short_name || ui.item.label;
      tr.cells[0].firstChild.value = display_name;

      var i = 2;
      for (var itm of itms) {

        var clear = true;

        // If we have an autocomplete field, we only replace it if its not been
        // altered or empty
        var current = tr.cells[i].firstChild.value;
        var ac_value = tr.cells[i].firstChild.getAttribute('data-ac');
        if (current != "" && ac_value && current != ac_value) {
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


function threats_add(opts, table="threats-table") {

    var data = {
        'threat': '',
        'report_name': '',
        'rwr': '',
        'type': '',
        'cms': '',
        'rmin': '',
        'rmax': '',
        'amin': '',
        'amax': '',
    }
    
    jQuery.extend(true, data, opts)


  $("#"+table+"> tbody").append(`<tr>
      <td class="input-container border-right-0"><i data-feather="more-vertical"></i></td>
      <td class="input-container border-left-0"><input value="${data['threat']}" required></td>
      <td class="input-container text-center"><input value="${data['report_name']}"></td>
      <td class="input-container text-center"><input value="${data['rwr']}"></td>
      <td class="input-container text-center"><input value="${data['type']}"></td>
      <td class="input-container text-center"><input value="${data['tracker']||""}"></td>
      <td class="input-container text-center"><input value="${data['cms']}"></td>
      <td class="input-container text-center"><input type="number" step="any" class="nospin" value="${data['rmin']}"></td>
      <td class="input-container text-center"><input type="number" step="any" class="nospin" value="${data['rmax']}"></td>
      <td class="input-container text-center"><input type="number" step="any" class="nospin" value="${data['amin']}"></td>
      <td class="input-container text-center border-right-0"><input type="number" step="any" class="nospin" value="${data['amax']}"></td>
      <td class="input-container text-center border-left-0">
        <button class="btn btn-link btn-sm p-0 pt-0.5" onclick='$(this).closest("tr").remove();' type="button">
          <i data-feather="delete"></i>
        </button>
      </td>
    </tr>
  `)

  var last = $('#'+table+' > tbody > tr:last')

  // Setup
  threats_autocomplete(last[0].cells[1].firstChild)

  feather.replace()

}

$('#threats-add').click(function() {
  threats_add()
});

$('#threats-targets-add').click(function() {
  threats_add({}, "threats-targets-table");
});


// Threats Prio Table
function threats_prio_add(data) { 
  let html = `
    <tr>
  `
  $("#threats-prio-table tbody").append(`<tr>
      <td class="input-container border-right-0"><i data-feather="more-vertical"></i></td>
      <td class="input-container border-left-0 text-center"></td>
      <td class="input-container"><input value="${data?.type || ""}"></td>
      <td class="input-container"><input value="${data?.weapon || ""}"></td>
      <td class="input-container"><input value="${data?.notes || ""}"></td>
    </tr>
  `);
}

function threats_prio_renumber(data) { 
  $('#threats-prio-table > tbody > tr').each((idx, b) => {
    b.cells[1].innerText = idx+1;
  });
  feather.replace()
}

$('#threats-prio-add').click(() => {
  threats_prio_add();
});


function threats_export() {

  var ret = {
    'threats': [],
    'targets': [],
    'priorities': [],
  }

  $("#threats-table > tbody > tr").each(function(idx, tr) {
    ret['threats'].push(get_row_data(tr, ['-', 'threat', 'report_name', 'rwr', 'type', 'tracker', 'cms', 'rmin', 'rmax', 'amin', 'amax']))
  })

  $("#threats-targets-table > tbody > tr").each(function(idx, tr) {
    ret['targets'].push(get_row_data(tr, ['-', 'threat', 'report_name', 'rwr', 'type', 'tracker', 'cms', 'rmin', 'rmax', 'amin', 'amax']))
  })

  $('#threats-prio-table > tbody > tr').each((idx, tr) => {
    ret['priorities'].push(get_row_data(tr, ['-', '-', 'type', 'weapon', 'notes']));
  });

  return ret
}

function threats_load(data, callback) {

    if (!data) { callback(); return; }
    
    $('#threats-table > tbody').empty()
    data['threats'].forEach(function(data) {
        threats_add(data)
    });

    $('#threats-targets-table > tbody').empty();
    (data['targets']||[]).forEach(function(data) {
        threats_add(data, "threats-targets-table")
    });

    $('#threats-prio-table > tbody').empty();
    let type = $('#flight-airframe').val();
    let threats_prio_count = airframes?.[type]?.threats_prio_count || 0;
    for (let x = 0; x < threats_prio_count; x++) {
      threats_prio_add(data?.priorities?.[x] || {})
    }
    threats_prio_renumber();

    callback();
}


$('#threats-table > tbody').sortable({
  items: 'tr',
})

$('#threats-targets-table > tbody').sortable({
  items: 'tr',
})

$('#threats-prio-table > tbody').sortable({
  items: 'tr',
  update: threats_prio_renumber,
})
