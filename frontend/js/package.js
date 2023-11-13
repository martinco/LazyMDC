/*
 * package.js: Javascript related to the package page
 */

$('#package-add-member').click(function() {
  package_add();
});


function package_add(vals) {

  var values = new Proxy(vals || {}, {
    get: (target, name) => name in target ? target[name] : ""
  })

  var html = `
    <tr>
      <td class="input-container"><input class="input-full package-name" value="${values.callsign}" pattern=".+" required></td>
      <td class="input-container"><input class="input-full" value="${values.aircraft}"></td>
      <td class="input-container text-center"><input class="input-full freq-autocomplete text-center" value="${values.freq ? values.freq.value || "" : ""}"></td>
      <td class="input-container text-center"><input class="input-full freq-autocomplete text-center" value="${values.freq_sec ? values.freq_sec.value || "" : ""}"></td>
      <td class="input-container text-center"><input class="input-full text-center" value="${values.tcn}" pattern="^[0-9]+\\s*(X|Y)$"></td>
      <td class="input-container text-center"><input class="input-full text-center nospin" type="number" min="1000", max="9999" value="${values.lsr}"></td>
      <td class="input-container" style="border-right: 0px"><input class="input-full" value="${values.mission}"></td>
      <td class="input-container text-center" style="border-left: 0px">
        <button type="button" class="btn btn-link btn-sm p-0 pt-0.5" onclick='$(this).closest("tr").remove();'>
          <i data-feather="delete"></i>
        </button>
      </td>
    </tr>`

  $("#package-members-table > tbody").append(html);

  var last = $("#package-members-table > tbody > tr:last");

  freq_autocomplete(last[0].cells[2].firstChild);
  freq_autocomplete(last[0].cells[3].firstChild);
  tcn_formatter(last[0].cells[3].firstChild);

  feather.replace()

}

$('#package-true').change(function(e) {

  // When true, we add  ap ackage if need be
  $('#package-members-table input.package-name').each(function(idx, input) {
    $(input).prop('required', 'required')
  })

  // And make any package-name  package name required
  $('#package-name').prop('required', 'required');

  // If we have no children, add one
  if ($('#package-members-table > tbody > tr').length == 0) {
    package_add()
  }

  $('#package-members-container').show()

});

$('#package-false').change(function(e) {

  $('#package-members-table input.package-name').each(function(idx, input) {
    $(input).prop('required', '');
  })

  // And make any package-name  package name required
  $('#package-name').prop('required', '');

  $('#package-members-container').hide()
});

function package_export() {
  var ret = get_form_data($("#package-form"));
  ret['members'] = []
  
  var headers = []
  $("#package-members-table > thead > tr > th").each(function(idx, row) {
    let header = row.getAttribute('data-raw') || row.innerText.toLowerCase();
    headers.push(header);
  })

  $("#package-members-table > tbody > tr").each(function(idx, row) {
    var row = get_row_data(row, headers);
    row['freq'] = freq_to_obj(row['freq']);
    row['freq_sec'] = freq_to_obj(row['freq_sec']);
    ret['members'].push(row);
  })

  return ret
}

function package_load(data, callback) {

  if (!data) { callback(); return; }

  var pkg = data['package-member'] || "package-false"
  $("label[for='"+pkg+"']").click()

  if (pkg != "package-false") {

    $("#package-name").val(data['package-name']);

    // Clear package
    $("#package-members-table > tbody").empty()

    data['members'].forEach(function(member) {
      package_add(member)
    });
  }

  callback();
}

$('#package-members-table > tbody').sortable({
  items: 'tr',
})
