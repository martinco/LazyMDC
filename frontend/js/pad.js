
// Pad "n" to given width with 'z'. In the case of a number: pad the
// characteristic, and mantissa to desired precision 
//   e.g: (54.24, 3, null, 4) => 054.2400
function pad(n, width, z, precision) {

  z = z || '0';
  precision = precision || 0;

  var nn = parseFloat(n)
  if (!isNaN(nn)) {

    var nni = Math.floor(nn)

    // Turn our int into a string
    var nns = nni + '';

    // pad NN to width
    nns = nns.length >= width ? nns : new Array(width - nns.length + 1).join(z) + nns;

    // Then append any remainder, merging back to n 
    if (precision > 0) {
      n = nns + ((nn - nni).toFixed(precision) + '').substr(1)
    } else {
      n = nns
    }
  }

  // continue pad as before
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}
