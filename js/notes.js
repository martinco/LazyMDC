
function notes_export() {
  return {
    'html': tinymce ? tinymce.editors['notes-mce'].getContent() : '',
  }
}

function notes_load(data, callback) {
  if (data && tinymce) {
    tinymce.editors['notes-mce'].setContent(data['html'])
  }
  callback();
}
