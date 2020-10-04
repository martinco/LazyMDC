
function download_export() {
  return {
    'template': $('#download-template').val()
  }
}

function download_load(data) {
  $('#download-template').val(data['template'])
}

// Modal setup
//
// $(".button").click(function(){
//     $(this).find("span").animate({opacity:0},function(){
//             $(this).text("new text")
//                         .animate({opacity:1});  
//                             })
//                             });


$("#download-button-copy").click(function(){ 

  // copy text to clipboard
  var input = $('#download-dialog-lnk')[0]
  input.select();
  input.setSelectionRange(0, 99999);

  document.execCommand("copy");

  $("#download-button-copy-text").animate({opacity:0}, 200, function(e) {
    $(this).html("Copied!");
    $(this).animate({opacity:1}, 200, function(e) {
      setTimeout(() => {
        $(this).animate({opacity:0}, 100, function() {
          $(this).html("Copy");
          $(this).animate({opacity:1}, 100);
        });
      }, 2000);
    });
  });
})


function download(format) {
  var template = $('#download-template').val()
  save(null, false, false, false, download_stage2, [format, template]);
}

function download_stage2(key, format, template) {
  if (format == 'json') {
    var mission_id = $("#mission-id").val()
    var a = document.createElement("a");
    a.href = "mdcs/" + key + ".json";
    a.setAttribute("download", mission_id + ".json");
    a.click();
    return
  } else if (format == 'lnk') {

    var dlg = $('#download-dialog');
    $('#download-dialog-lnk').val(window.location.origin + kneeboard_root + key);
    dlg.modal({
      backdrop: 'static',
    });

  } else {
    window.location = "templates/" + template + "/template.htm?kb=" + key + "&output=" + format;
  }
}


