
// Helper to get the number of seconds from a "HH:mm" string, used for
// calculating TOT
function get_seconds_from_time(time) {
  if (time == "") {
    return 0
  }

  // Regex is (H:)?M(:S)?, this also covers the 4 numbers case below
  var res = time.match(/^(?:([0-9]+):)?([0-9]+)?(?::([0-9]{1,2}))?$/);
  if (!res) {
    return 0
  }

  // If we have 4 numbers thats < 2400 then we can treat 1920 as 19:20
  // 4 numbers is ensured by the previous regex above
  if (time.length == 4) {
    var inttime = parseInt(time);
    if (!isNaN(inttime) && inttime <= 2400 && inttime >= 0) {
      res = [time, time.substring(0,2), time.substring(2,4)]
    }
  }

  var secs = 0;
  if (res[1]) { secs += parseInt(res[1])*3600; }
  if (res[2]) { secs += parseInt(res[2]*60); }
  if (res[3]) { secs += parseInt(res[3]); }
  return secs;
}

// Helper to get the "HH:mm:ss" string from number of seconds since 00:00 as the
// format used in DCS mission start
function get_time_from_seconds(seconds, duration, show_seconds=false) {

  duration = duration || false;

  if (seconds == 0) {
    return "";
  }

  let work = seconds;
  hours = Math.floor(seconds / 3600);

  work -= hours*3600;

  // If we are formatting a time we just want clock hours
  if (!duration)  {
    hours %= 24;
  }

  minutes = Math.floor(work / 60);
  work -= minutes * 60;

  if (show_seconds) {
    return pad(hours, 2)+":"+pad(minutes,2)+":"+pad(work, 2);
  }
  return pad(hours, 2)+":"+pad(minutes,2);
}
