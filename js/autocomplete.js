// Lookup functions that don't belong to specific pages, mostly helpers

function freq_autocomplete(input) {

  // Set on focus out to update preset
  $(input).autocomplete({
    source: function(request, response) {
      response(match_labels_in_arr(freqs, request.term).slice(0,15))
    },
    minLength: 1,
    select: function( event, ui) {
      //event.target.parentElement.parentElement.cells[fields[0]].children[0].value = ui.item.data;
    }
  });

  // Attach validator
  $(input).on('change', function(e) {
    // Validate 
    var msg = "Please enter a valid frequency"

    var elem = $(this);

    if (elem.hasClass('freq-autocomplete-optional') && elem.val() == "") { 
      this.setCustomValidity('');
      return
    }

    // There was a request to allow commas for expedited entry, as it doesn't
    // cause much pain to have we will facilitate that here
    var val = elem.val().replace(',', '.');
    var float_val = parseFloat(val).toFixed(3)

    if (isNaN(float_val)) {
      if (val.match(/^MIDS[- ][0-9]+$/i)) {
        elem.val(val.toUpperCase().replace('-', ' '))
        this.setCustomValidity('');
      } else {
        this.setCustomValidity(msg);
        var inval = elem.parent().find('div.invalid-feedback')[0]
        if (inval) {
          inval.innerHTML = msg;
        }
      }
    } else {
      this.setCustomValidity('');
      elem.val(float_val)
    }

    // Lookup preset
    if (elem.hasClass('freq-preset')) {
      elem.closest('tr')[0].cells[elem.parent().index()+1].innerHTML = lookup_preset(float_val)
    }
  });

}

function match_item_in_arr(arr, find) {
  var i, l, matches = [];

  for (i = 0, l=arr.length; i < l; i++) {
    if (arr[i].toLowerCase().indexOf(find.toLowerCase()) !== -1) {
      matches.push({'value': arr[i]});
    }
  }

  return matches;

}

function match_labels_in_arr(arr, find, mapper) {
  var i, l, matches = [];

  if (!mapper) {
    mapper = function(x) { return x };
  }

  for (i = 0, l=arr.length; i < l; i++) {
    if (arr[i].label && arr[i].label.toLowerCase().indexOf(find.toLowerCase()) !== -1) {
      matches.push(mapper(arr[i]))
    } else if (arr[i].alt_label) {
      if (Array.isArray(arr[i].alt_label)) {
        for (var label of arr[i].alt_label) {
          if (label.toLowerCase().indexOf(find.toLowerCase()) !== -1) {
            matches.push(mapper(arr[i]))
              break
          }
        }
      } else if (arr[i].alt_label.toLowerCase().indexOf(find.toLowerCase()) !== -1) {
        matches.push(mapper(arr[i]))
      }
    }
  }

  return matches;
}

function waypoint_lookup_function(request, response, airfields_only=false) {

  function hasMatch(fs) {
    if (typeof fs !== 'string' || fs === "") {
      return false
    }
    return fs.toLowerCase().indexOf(request.term.toLowerCase()) !== -1;
  }

  var i, l, theatre, obj, matches = [];

  if (request.term === "") {
    response([]);
    return
  }

  // search airfields on ICAO / Label
  for (const [key, value] of Object.entries(mission_airfields)) {
    if (hasMatch(key) || (value.hasOwnProperty('icao') && hasMatch(value['icao']))) {
      value['label'] = key
      matches.push(value)
    }
  }

  if (airfields_only) {
    response(matches);
    return;
  }

  var mission = $('#data-mission').val();
  var navpoints = []
  try {
    navpoints = mission_data[mission]['navpoints']
  } catch {}

  // search navaids on Label
  navpoints.forEach(function(obj) {
    if (hasMatch(obj.label)) {
      matches.push(obj);
    }
  });

  response(matches.sort((a, b) => { return a.label > b.label ? 1 : -1 } ));
}
