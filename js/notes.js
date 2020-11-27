
function notes_export() {
  return {
    'html': tinymce ? tinymce.editors['notes-mce'].getContent() : '',
  }
}

function notes_load(data) {
  if (tinymce) {
    tinymce.editors['notes-mce'].setContent(data['html'])
  }
}
