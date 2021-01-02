
function threats_delete(e) {
  var row = $(e).closest('tr');

  // If we're a new row, then just remove it as it doesn't exist
  if (row[0].hasAttribute('data-create')) {
    row.remove();
    return;
  }

  // Toggle delete state
  if (row[0].hasAttribute('data-delete')) {
    row[0].removeAttribute('data-delete', 1);
    row[0].cells[0].innerHTML = '';
  } else {
    row[0].setAttribute('data-delete', 1);
    row[0].cells[0].innerHTML = '<span style="color:red" data-feather="alert-triangle" alt="will be deleted"></span>';
    feather.replace();
  }
}

function threats_add_row(dcs_type, threat, overrides) {

  threat = threat || {};
  overrides = overrides || {};

  var html = ``;

  var cols = [
    ['name', 'text', 'input-full', ""],
    ['type', 'text', 'input-full', ""],
    ['rwr', 'text', 'input-full', ""],
    ['cms', 'text', 'input-full', ""],
    ['rmin', 'number', 'input-full nospin text-right pr-2', 0],
    ['rmax', 'number', 'input-full nospin text-right pr-2', 0],
    ['hmin', 'number', 'input-full nospin text-right pr-2', 0],
    ['hmax', 'number', 'input-full nospin text-right pr-2', 0],
    ['notes', 'text', 'input-full', ""],
  ]

  if (Object.keys(threat).length + Object.keys(overrides).length) {

    // Always first ocl
    if (dcs_type) {
      html += `<tr data-id="${dcs_type}">`;
    } else {
      html += `<tr>`;
    }

    html += `<td class="input-container border-right-0 text-center"></td>`;

    for (var id in cols) {
      var [key, input_type, input_class, default_value] = cols[id];

      if (id == 0) {
        html += `<td class="input-container border-left-0">`;
      } else {
        html += `<td class="input-container">`;
      }

      var base = threat[key] || default_value;
      var value = overrides[key] || threat[key] || default_value;

      if (threat[key] !== undefined && base != value) {
        input_class += ' modified';
      }

      html += `<input type=${input_type} class="${input_class}" value="${value}" `;
      if (threat[key] !== undefined) {
        html += `data-base="${threat[key]}" `;
      }
      html += `>`;
    }

    // Our active checkbox
    if (dcs_type) {
      html += `<td class="text-center border-right-0${overrides.active == 0 ? ' modified' : ''}"><input type="checkbox" name="active" data-base="1" ${overrides.active != 0 ? 'checked' : ''}></td>`;
    } else {
      html += `<td class="text-center border-right-0"><input type="checkbox" name="active" ${overrides.active != 0 ? 'checked' : ''}></td>`;
    }
    
    if (!dcs_type) {
      html += `
        <td class="input-container text-center border-left-0">
          <button class="btn btn-link btn-sm p-0 pt-0.5" type="button" onclick='threats_delete(this);'>
            <i data-feather="delete"></i>
          </button>
        </td>`;
    } else {
      html += `<td class="input-container text-center border-left-0"></td>`;
    }

    html += `</tr>`;

  } else {
    html += `
      <tr data-create>
        <td class="input-container border-right-0 text-center"><span style="color:green" data-feather="plus-circle"></span></td>
        <td class="input-container border-left-0"><input class="input-full"></td>
        <td class="input-container"><input class="input-full"></td>
        <td class="input-container"><input class="input-full"></td>
        <td class="input-container"><input class="input-full"></td>
        <td class="input-container"><input type=number class="input-full nospin text-right pr-2"></td>
        <td class="input-container"><input type=number class="input-full nospin text-right pr-2"></td>
        <td class="input-container"><input type=number class="input-full nospin text-right pr-2"></td>
        <td class="input-container"><input type=number class="input-full nospin text-right pr-2"></td>
        <td class="input-container border-right-0"><input class="input-full"></td>
        <td class="text-center border-right-0"><input type="checkbox" name="active" checked></td>
        <td class="input-container text-center border-left-0">
          <button class="btn btn-link btn-sm p-0 pt-0.5" type="button" onclick='threats_delete(this);'>
            <i data-feather="delete"></i>
          </button>
        </td>
      </tr>`;
  }

  $('#threats-input-table tbody').append($(html));
  feather.replace();
}

$('#threats-add-button').on('click', function() {
  threats_add_row();
});

$('#threats-update-button').on('click', function() {

  var dlg = $("#threats-update-dialog");

  var form = dlg.find('form');
  var inval = form.find('.invalid-feedback')
  form[0].reset();

  inval.hide();
  
  form.on('submit', function(evt) {
    evt.preventDefault();

    // Read our file
    var file = $('#threats-update-file-input')[0].files[0];

    if (!file) {
      inval.html('You must select a valid json file').show();
      return;
    }

    inval.hide();

    // Proces file
    var reader = new FileReader();
    reader.readAsText(file, "UTF-8");
    reader.onload = function (evt) {
      try {
        json = JSON.parse(evt.target.result);
      } catch {
        inval.html('You must select a valid json file').show();
        return
      }

      for (var [type, data] of Object.entries(json)) {
        threats_add_row(type, data);
      }

      // Close our dialog, and update the rows
      dlg.modal('hide');
      form.off(evt);
    }
  });

  dlg.modal({
    backdrop: 'static',
  });

});

$('#threats-save').on('click', function() {

  var base = {};
  var overrides = {};

  $("#threats-input-table > tbody > tr").each(function(a, tr) {
    if (tr.cells.length) {

      // If we are deleting, skip
      if (tr.hasAttribute("data-delete")) { return; }

      // If we have an ID then we are imported
      var dcs_type = tr.getAttribute("data-id");

      // If we have a DCS type then we have both base  / modified
      if (dcs_type) {
        if (!base['import']) { base['import'] = {}; }
        base['import'][dcs_type] = get_base_row_data(tr, ['-', 'name', 'type', 'rwr', 'cms', 'rmin', 'rmax', 'hmin', 'hmax', 'notes']);

        var overs = get_modified_row_data(tr, ['-', 'name', 'type', 'rwr', 'cms', 'rmin', 'rmax', 'hmin', 'hmax', 'notes', 'active']);
        if (Object.keys(overs).length > 0) {
          if (!overrides['import']) { overrides['import'] = {}; }
          overrides['import'][dcs_type] = overs;
        }

      } else {
        var row = get_row_data(tr, ['-', 'name', 'type', 'rwr', 'cms', 'rmin', 'rmax', 'hmin', 'hmax', 'notes', 'active']);
        if (!row.name) {
          return;
        }
        if (!overrides['custom']) { overrides['custom'] = {}; }
        overrides['custom'][row.name] = row;
      }
    }
  });

  var retval = {
    'base': base,
    'overrides': overrides
  }

  api_post(
    `threats`,
    {
      "base": base,
      "overrides": overrides,
    },
    function(data) {
      update_content();
    }
  );
  
});

////////////////////////////////////////////////////////////
// INIT
////////////////////////////////////////////////////////////

function threats_refresh(elems, callback) {

  // Load up squadrons and update the table
  api_get('threats?merged=0', function(res) {

    $('#threats-input-table tbody').empty();

    for (const [src, threats] of Object.entries(getDict(res, 'base'))) {
      if (src == "custom") { continue; }
      for (var [threat, threat_data] of Object.entries(threats)) {
        threats_add_row(threat, threat_data, getDict(res, 'overrides', src, threat));
      }
    }

    for (const [threat, threat_data] of Object.entries(getDict(res, 'overrides', 'custom'))) {
      threats_add_row(null, null, threat_data);
    }

    // Sort by Threat
    var default_sort = $('#threats-input-table thead tr:last th:nth-child(2)');
    default_sort[0].setAttribute('data-sort-inverse', false)
    sort_th(default_sort[0])

    // Ensure correct tab data selected
    $('#side-nav a[href="#threats"]').tab('show');

    // callback
    if (typeof(callback) === "function") {
      callback()
    }

  });
}

sortable_table($("#threats-input-table"));
