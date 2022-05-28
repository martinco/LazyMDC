
function download_export() {
  return {
    'template': $('#download-template').val()
  }
}

function download_load(data, callback) {
  if(data) {
    // Cater for the rename of standard -> original
    $('#download-template').val(data['template'].replace('Standard', 'Original'));
  }
  callback();
}

// Modal setup
//
// $(".button").click(function(){
//     $(this).find("span").animate({opacity:0},function(){
//             $(this).text("new text")
//                         .animate({opacity:1});  
//                             })
//                             });

function download_cpy(e) {

  // copy text to clipboard
  var elem = e.currentTarget.id.replace('-button', '')
  var input = $("#" + elem)[0];
  input.select();
  input.setSelectionRange(0, 99999);

  document.execCommand("copy");

  $("#"+elem+"-button-text").animate({opacity:0}, 200, function(e) {
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
};

$("#download-dialog-lnk-button").click(download_cpy);
$("#download-dialog-pdf-button").click(download_cpy);
$("#download-dialog-png-button").click(download_cpy);

function download(format) {

  var template = $('#download-template').val()

  // Silently save here, it's an unlikely scenario given it saves on the nav
  // click and the next click, but it's a noop if not same as last save
  save()

  var save_params = {
    update_id: false,
    callback: download_stage2,
    callback_args: [format, template],
  }

  // lets be protective - force save a snapshot
  if (["lnk", "png", "pdf"].includes(format)) {
    save_params["new_id"] = true
    save_params["force"] = true
  }
  
  save(save_params);
}

function download_stage2(key, format, template) {

  var mission_id = $("#mission-id").val() || key;
  var dl = "download?template=" + template + "&key=" + key + "&id=" + mission_id;

  if (format == 'json') {
    var a = document.createElement("a");
    a.href = "mdcs/" + key + ".json";
    a.setAttribute("download", mission_id + ".json");
    a.click();
    return
  } else if (format == 'lnk') {

    var dlg = $('#download-dialog');

    $('#download-dialog-png').val(window.location.origin + kneeboard_root + dl + "&output=png")
    $('#download-dialog-pdf').val(window.location.origin + kneeboard_root + dl + "&output=pdf")

    dlg.modal({
      backdrop: 'static',
    });

  } else if (format == 'html') {
    window.open("templates/" + template + "/template.htm?kb=" + key, "_blank");
  } else {
    window.location = dl + "&output=" + format;
  }
}


