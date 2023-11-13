
function api_get(path, callback) {
  return $.get(
    kneeboard_root + '../api/' + path,
    function(obj) {
      if (!obj) {
        console.log("fatal call 1");
        return;
      }

      if (typeof obj !== "object") {
        console.log("fatal 2");
        return;
        // fatal error
      }

      if (typeof callback === "function") {
        callback(obj);
      }
    },
    "json"
  ).fail(function() {
    console.log("fatal 3");
  });
}

function api_delete(path, callback) {
  $.ajax({
    url: kneeboard_root + '../api/' + path,
    type: "DELETE",
    success: function(obj) {
      if (!obj) {
        console.log("fatal call 1");
        return;
      }

      if (typeof obj !== "object") {
        console.log("fatal 2");
        return;
        // fatal error
      }

      if (typeof callback === "function") {
        callback(obj);
      }
    },
    dataType: "json"
  }).fail(function() {
    console.log("fatal 3");
    return;
  });
}

function api_put(path, data, callback) {
  $.ajax({
    url: kneeboard_root + '../api/' + path,
    type: "PUT",
    data: JSON.stringify(data),
    success: function(obj) {
      if (!obj) {
        console.log("fatal call 1");
        return;
      }

      if (typeof obj !== "object") {
        console.log("fatal 2");
        return;
        // fatal error
      }

      if (typeof callback === "function") {
        callback(obj);
      }
    },
    dataType: "json"
  }).fail(function() {
    console.log("fatal 3");
    return;
  });
}

function api_post(path, data, callback) {
  $.post(
    kneeboard_root + '../api/' + path,
    JSON.stringify(data),
    function(obj) {
      if (!obj) {
        console.log("fatal call 1");
        return;
      }

      if (typeof obj !== "object") {
        console.log("fatal 2");
        return;
        // fatal error
      }

      if (typeof callback === "function") {
        callback(obj);
      }
    },
    "json"
  ).fail(function() {
    console.log("fatal 3");
    return;
  });
}
