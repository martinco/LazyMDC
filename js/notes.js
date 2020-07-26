
function notes_export() {
  return {
    'html': tinyMCE.editors['notes-mce'].getContent()
  }
}

function notes_load(data) {
  tinyMCE.editors['notes-mce'].setContent(data['html'])
}
