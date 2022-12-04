////////////////////////////////////////////////////////////
// MIZ HANDLING
////////////////////////////////////////////////////////////

zip.workerScriptsPath = kneeboard_root + '../js/zip-js/';

MissionProcessor = function() {

  // These globals are used for A-10 / F-16 radios when lacking an avionics folder
  global_settings = {
    'UHF_RADIO': null,      // A-10 and F-16 default UHF
    'VHF_RADIO': null,      // F-16 default VHF
    'VHF_AM_RADIO': null,   // A-10 default VHF AM
    'VHF_FM_RADIO': null,   // A-10 default VHF FM
  }

  mission = null;

  // storing avionics data by module => unitid
  avionics = {}

  dictionary = {};

  this.process = function(input, cb) {

    if (input === undefined) {
      return;
    }

    // Pull out individual avionics for the F-16 / A-10s, eugh
    let re_avionics = /Avionics\/(?<module>[^\/]+)\/(?<unitid>[0-9]+)\/(?<radio>[^\/]+)\/SETTINGS.lua/i

    // input will either be js or cf
    var file = input.files[0];

    var ext = file.name.split('.').splice(-1)[0];
    if (ext == "miz") {

      var deferreds = {
        'uhf': null,
        'vhf_am': null,
        'vhf_fm': null,
        'vhf': null,
        'mission': null,
        'avionics': null,
      }

      var todo_avionics = {
        'processed': 0,
        'count': 0,
      }

      zip.createReader(new zip.BlobReader(file), function(zipReader) {
        zipReader.getEntries(function(entries) {
          entries.forEach(function(entry) {

            if (entry.filename === "VHF_FM_RADIO/SETTINGS.lua") {
              deferreds['vhf_fm'] = $.Deferred();

              entry.getData(new zip.TextWriter(), function(data) {
                var ast = luaparse.parse(data, { 'comments': false });
                global_settings['VHF_FM_RADIO'] = parseLUATable(ast.body[0].init[0]);
                deferreds['vhf_fm'].resolve();
              });
            }

            if (entry.filename === "VHF_AM_RADIO/SETTINGS.lua") {
              deferreds['vhf_am'] = $.Deferred();
              entry.getData(new zip.TextWriter(), function(data) {
                var ast = luaparse.parse(data, { 'comments': false });
                global_settings['VHF_AM_RADIO'] = parseLUATable(ast.body[0].init[0]);
                deferreds['vhf_am'].resolve();
              });
            }

            if (entry.filename === "UHF_RADIO/SETTINGS.lua") {
              deferreds['uhf'] = $.Deferred();
              entry.getData(new zip.TextWriter(), function(data) {
                var ast = luaparse.parse(data, { 'comments': false });
                global_settings['UHF_RADIO'] = parseLUATable(ast.body[0].init[0]);
                deferreds['uhf'].resolve();
              });
            }

            if (entry.filename === "VHF_RADIO/SETTINGS.lua") {
              deferreds['vhf'] = $.Deferred();
              entry.getData(new zip.TextWriter(), function(data) {
                var ast = luaparse.parse(data, { 'comments': false });
                global_settings['VHF_RADIO'] = parseLUATable(ast.body[0].init[0]);
                deferreds['vhf'].resolve();
              });
            }

            if (entry.filename === "l10n/DEFAULT/dictionary") {
              deferreds['dictionary'] = $.Deferred();
              entry.getData(new zip.TextWriter(), function(data) {
                var ast = luaparse.parse(data, { 'comments': false });
                dictionary = parseLUATable(ast.body[0].init[0]);
                deferreds['dictionary'].resolve();
              });
            }

            if (entry.filename === "mission") {
              deferreds['mission'] = $.Deferred();
              foo = entry.getData(new zip.TextWriter(), function(data) {
                var ast = luaparse.parse(data, { 'comments': false });
                mission = parseLUATable(ast.body[0].init[0]);
                deferreds['mission'].resolve();
              });
            }


            let match = re_avionics.exec(entry.filename);
            if (match) {

              // Increment pending count so we know we're done
              todo_avionics.count += 1

              if (!(deferreds['avionics'])) {
                deferreds['avionics'] = $.Deferred();
                deferreds['avionics'].progress(function() {
                  todo_avionics.processed += 1
                  if (todo_avionics.count === todo_avionics.processed) {
                    console.log("COMPLETE")
                    deferreds['avionics'].resolve();
                  } else {
                    console.log("waiting", todo_avionics.processed, todo_avionics.count);
                  }
                })
              }

              let groups = match.groups;

              // Prep target module, unitid 
              if (!(groups.module in avionics)) { avionics[groups.module] = {} };
              if (!(groups.unitid in avionics[groups.module])) { avionics[groups.module][groups.unitid] = {} };

              entry.getData(new zip.TextWriter(), function(data) {
                console.log(entry.filename)
                var ast = luaparse.parse(data, { 'comments': false });
                console.log("Completed", groups.module, groups.unitid, groups.radio)
                avionics[groups.module][groups.unitid][groups.radio] = parseLUATable(ast.body[0].init[0]);
                console.log(avionics);

                // Mark it processed, and notify
                deferreds['avionics'].notify();
              });
              
            };
          })

          // If we're here, complete
          process_stage2(Object.values(deferreds).filter((x) => { return x != null } ),  cb);
        })

      }, function(message) {
        alert("Failed to load file");
      });
    } else if (ext == "cf" ) {
      zip.createReader(new zip.BlobReader(file), function(zipReader) {
        zipReader.getEntries(function(entries) {
          entries.forEach(function(entry) {
            if (entry.filename === "mission.xml") {
              text = entry.getData(new zip.TextWriter(), function(text) {

                // Parse XML
                var parser = new DOMParser();
                var xml = parser.parseFromString(text,"text/xml");

                process_stage2_cf(xml, cb);

              })
              return
            }
          });
        });
      });
    }

    // Replace fileInput so we can retrigger same file
    $(input).val('')
  };

  function process_stage2_cf(xml, cb) {

    var waypoints = {};

    // process our polygons to waypoints (Ranges, MOAs etc)
    var polypoints = {}
    xml.querySelectorAll('Polygon').forEach(function(area) {
      var name = area.getElementsByTagName('Name')[0].textContent;
      var points = area.querySelectorAll('Polypoint');

      // Process them to adict indexed with east / west offset
      dict = {};
      Object.values(points).map(function(x) {
        var n = x.getElementsByTagName('Name')[0].textContent;
        var lat = parseFloat(x.getElementsByTagName('Lat')[0].textContent);
        var lon = parseFloat(x.getElementsByTagName('Lon')[0].textContent);
        dict[n] = {n, lat, lon};
      });

      Object.values(dict).sort(function(a,b) { return a.lon > b.lon ? 1 : -1 }).forEach(function(a,b){
        a.east = b
      });

      Object.values(dict).sort(function(a,b) { return a.lat > b.lat ? 1 : -1 }).forEach(function(a,b){
        a.north = b
      });

      if (points.length == 4) {
        // Update the name to be consistent
        Object.values(dict).forEach(function(x) {
          var nn = x.north < 2 ? "S" : "N";
          nn += x.east < 2 ? "W" : "E";
          x.n = nn;
        });
        polypoints[name] = dict;
      } else if (points.length <= 6) {
        // If we get here, then who the hell knows how to handle 5 points since
        // it's a pain in the ass, and really accounts for just a few ranges (1, 3, 15)
        polypoints[name] = dict;
      }
    });

    for (const [zone, points] of Object.entries(polypoints)) {
      for (const [point, data] of Object.entries(points)) {
        waypoints[`${zone}: ${data.n}`] = {
          lat: data.lat.toFixed(12),
          lon: data.lon.toFixed(12),
        }
      }
    }

    // Nav Points have quite the overlap with DCS points
    xml.querySelectorAll('RefPoint').forEach(function(np) {
      var name = np.getElementsByTagName('Name')[0].textContent;
      var lat = parseFloat(np.getElementsByTagName('Lat')[0].textContent).toFixed(12);
      var lon = parseFloat(np.getElementsByTagName('Lon')[0].textContent).toFixed(12);
      waypoints[name] = {
        'lat': lat,
        'lon': lon,
      };
    });

    // Killboxes
    xml.querySelectorAll('AOR').forEach(function(np) {

      // Helper function for direct
      let get_lat_lon = (lat, lon, brg, range) => {
        var r = geod.Direct(lat, lon, brg, range);
        return {
          'lat': r.lat2.toFixed(12),
          'lon': r.lon2.toFixed(12),
        }
      }

      // Lat, Lon is an anchor point midpoint of the "width line"
      // Length is distance along the Hot BRG the rectangle extends
      
      let name = np.getElementsByTagName('Name')[0].textContent;

      let brg = parseInt(np.getElementsByTagName('Brg')[0].textContent);
      let lat = parseFloat(np.getElementsByTagName('Lat')[0].textContent).toFixed(12);
      let lon = parseFloat(np.getElementsByTagName('Lon')[0].textContent).toFixed(12);

      // NM
      let width_m = Number((parseFloat(np.getElementsByTagName('Width')[0].textContent)*926).toFixed(2));
      let length_m = Number((parseFloat(np.getElementsByTagName('Length')[0].textContent)*1852).toFixed(2));

      // Get our far anchor
      let far_anchor = get_lat_lon(lat, lon, brg, length_m);

      // We want the points to make a nice square if we go P1 -> P2 -> P3 -> P4
      //
      // Start near right, far right, far left, near left - this way we dont
      // have to worry about cardinal directions

      waypoints[`${name}: P1`] = get_lat_lon(lat, lon, brg+90, width_m)
      waypoints[`${name}: P2`] = get_lat_lon(far_anchor.lat, far_anchor.lon, brg+90, width_m)
      waypoints[`${name}: P3`] = get_lat_lon(far_anchor.lat, far_anchor.lon, brg-90, width_m)
      waypoints[`${name}: P4`] = get_lat_lon(lat, lon, brg-90, width_m)
    });

    var data = {
      "format": "cf",
      "waypoints": waypoints,
    };

    if (typeof(cb) === "function") {
      cb(data);
    }
  }

  function process_stage2(deferreds, cb) {

    $.when(...deferreds).then(function() {

      // presets = get_mission_presets(mission);

      var data = {
        "format": "miz",
        "mission_airfields": custom_airfields(),
        "navpoints": {
          "navpoint": navpoints(),
          "trigger": triggers(),
          "tanker": tankers(),
        },
        "theatre": mission.theatre,
        "presets": presets(),
        "bullseye": bullseye(),
      }

      if (typeof(cb) === "function") {
        cb(data);
      }
    });
  };

  function dcstoll(theatre, obj) {

    var theatres = {
      'PersianGulf': {
        'northing': 2894932.9363,
        'easting': 424243.9786,
        'zone': 40,
      },
      'Nevada': {
        'northing': 4410028.064,
        'easting': 693996.81,
        'zone': 11
      },
      'Caucasus': {
        'northing': 4998115,
        'easting': 599517,
        'zone': 36,
      },
      'Normandy': {
        'northing': 5484813,
        'easting': 695526,
        'zone': 30,
      },
      'TheChannel': {
        'northing': 5636888,
        'easting': 400623,
        'zone': 31,
      },
      'Syria': {
        'northing': 3879865,
        'easting': 217198,
        'zone': 37,
      },
      'MarianaIslands': {
        'northing': 1491809,
        'easting': 261577,
        'zone': 55,
      }
    }

    var PG_origin_northing = theatres[theatre].northing;
    var PG_origin_easting = theatres[theatre].easting;
    var PG_UTM_zone = theatres[theatre].zone;

    // internal Geographic UTMWGS(UTM utm)
    var east = PG_origin_easting + obj.y;
    var north = PG_origin_northing + obj.x;
    var zone = PG_UTM_zone;

    // https://gis.stackexchange.com/questions/75528/undersMath.tanding-terms-in-length-of-degree-formula/75535
    //
    // major radius (a):       6 378 137.000
    // flattening   (f):       1/298.257223563
    // minor raidus (b):       a x (1-f)
    //                 :       6,356,752.3142451794975639665996337
    //
    // circumfrance (C):       C = 2 x π x √((a2 + b2) ÷ 2) 
    
    // mean value of a degree of latitude in meters
    var lat_deg_in_m = 111132.952548947;


    var num2 = 0.144318132579788;
    var num3 = 0.000212048798064968;
    var num4 = 4.26695481590016E-07;

    // if (band.ToCharArray()[0] < 'N' && band != "")
    //     north -= 10000000.0;

    // Latitude Degress:  north / (UTM Scale Factor) / m per deg
    var lat_deg = north / 0.9996 / lat_deg_in_m; // num5
    var lat_rad = lat_deg * Math.PI / 180.0; // num6
    var num7 = lat_deg + num2 * Math.sin(2.0 * lat_rad) + num3 * Math.sin(4.0 * lat_rad) + num4 * Math.sin(6.0 * lat_rad); // num 7

    var num8 = num7 * Math.PI / 180.0;
    var num9 = Math.tan(num8);
    var num10 = num9 * num9;
    var num11 = num10 * num10;
    var num12 = Math.cos(num8);


    var num13 = 0.00673949674227643 * (num12 * num12);

    // Radius of curvature at poles
    var x1 = 6399593.62575849 / Math.sqrt(1.0 + num13);

    var num14 = Math.pow(x1, 2.0);
    var num15 = Math.pow(x1, 3.0);
    var num16 = Math.pow(x1, 4.0);
    var num17 = Math.pow(x1, 5.0);
    var num18 = Math.pow(x1, 6.0);

    var num19 = ((zone - 30) * 6 - 3);
    var x2 = (east - 500000.0) / 0.9996;
    var num21 = Math.pow(x2, 3.0);
    var num22 = Math.pow(x2, 4.0);
    var num23 = Math.pow(x2, 5.0);
    var num24 = Math.pow(x2, 6.0);
    var num26 = num9 * (5.0 + 3.0 * num10 + 6.0 * num13 * (1.0 - num10)) / (24.0 * num16);
    var num27 = -num9 * (61.0 + 90.0 * num10 + 45.0 * num11) / (720.0 * num18);
    var num28 = 1.0 / (x1 * num12);
    var num29 = -(1.0 + 2.0 * num10 + num13) / (6.0 * num15 * num12);
    var num30 = (5.0 + 28.0 * num10 + 24.0 * num11) / (120.0 * num17 * num12);
    var lon = num19 + 180.0 / Math.PI * (num28 * x2 + num29 * num21 + num30 * num23);


    var num20 = Math.pow(x2, 2.0);
    var num25 = -num9 * (1.0 + num13) / (2.0 * num14);
    var lat = num7 + 180.0 / Math.PI * (num25 * num20 + num26 * num22 + num27 * num24);

    obj.lat = Number(lat.toFixed(12));
    obj.lon = Number(lon.toFixed(12));
    return obj
  }

  parseLUATable = function(ast, obj) {

    obj = obj || {}

    function _removeQuotes(str) {
      var char0 = str.charAt(0)
      if (["'", '"'].includes(char0) && str.charAt(str.length - 1) === char0) {
        return str.substr(1, str.length - 2)
      }
      return str
    }

    function _getValue(value) {
      var retval = null
      if (value.type == "StringLiteral") {
        retval = _removeQuotes(value.raw)
      } else if (value.type == "NumericLiteral") {
        retval = value.value
      } else if (value.type == "UnaryExpression") {
        if (value.operator == "-") {
          retval = - value.argument.value;
        }
      } else if (value.type == "BooleanLiteral") {
        retval = value.value
      }
      return retval
    }

    function _visit(node, obj) {
      if (node.type == "TableConstructorExpression") {
        for (let j = 0; j < node.fields.length; j++) {
          _visit(node.fields[j], obj);
        }
      } else if (node.type == 'TableKey') {
        var key = _getValue(node.key);
        var value = _getValue(node.value)

        if (value !== null) {
          obj[key] = value;
        } else {
          if (["TableConstructorExpression", "TableKey"].includes(node.type)) {
            obj[key] = {};
            _visit(node.value, obj[key]);
          } else {
            console.log("FATAL", node);
          }
        }
      } else {
        console.log("FATAL", node);
      }
    }
    _visit(ast, obj);
    return obj;
  }


  function navpoints() {

    var retval = {};         
    for (const [coalition, coalition_data] of Object.entries(mission.coalition)) {
      var navpoints = {}
      for (var [nav_id, nav_data] of Object.entries(coalition_data.nav_points)) {
        var name = nav_data['callsignStr']
        if (navpoints[name] === undefined) {
          dcstoll(mission.theatre, nav_data)
          navpoints[name] = {
            //"label": name,
            "lat": nav_data.lat,
            "lon": nav_data.lon
          }
        }
      }
      if (navpoints) {
        //retval[coalition] = Object.values(navpoints);
        retval[coalition] = navpoints;
      }
    }
    return retval;
  }

  function bullseye() {

    var retval = {};

    for (const [coalition, coalition_data] of Object.entries(mission.coalition)) {
      var bulls = coalition_data.bullseye
      dcstoll(mission.theatre, bulls)
      retval[coalition] = bulls;
    }

    return retval;

  }

  function get_presets_from_avionics(type, unit_id) {

    // We return an array of radios, similar to other units, in the order
    // specified by radio_names to keep consistency
    
    var order = type.startsWith('A-10C')
      ? ['UHF_RADIO', 'VHF_AM_RADIO', 'VHF_FM_RADIO']
      : ['UHF_RADIO', 'VHF_RADIO'];

    var output = {};

    var idx = 1;
    for (radio of order) {
      var presets = {};
      if (avionics?.[type]?.[unit_id]?.[radio]?.presets) {
        presets = avionics[type][unit_id][radio].presets;
      } else if (global_settings?.[radio]?.presets) {
        presets = global_settings[radio].presets;
      } else {
        console.log("FAILED", type, unit_id, radio)
        idx += 1;
        continue;
      }

      // If we have no presets in avionics, no global settings, then it's just
      // DCS defaults, which we'll leave as empty
      
      // Presets is now a dict of preset => hz
      var freqs = {};
      for (const [x, freq] of Object.entries(presets)) {
        freqs[x] = freq / 1000000
      }

      output[idx] = {'channels': freqs};
      idx += 1;
    }

    return output;

  }

  function custom_airfields() {
    // Output Dict of FARPs, Carriers, etc.
    var output = {};
    var match_type = function(typ) {
      if (["FARP", "Invisible FARP"].includes(typ)) { return true; }
      if (typ.match(/^(CVN_[0-9]+|LHA_[^ ]+)$/)) { return true; }
      return false;
    }

    for (const coalition in mission.coalition) {
      for (const [country_id, country_data] of Object.entries(mission.coalition[coalition].country)) {
        for (const [elem, elem_data] of Object.entries(country_data)) {

          if (!["static", "ship"].includes(elem)) { continue; }
          if (!elem_data.group) { continue; }

          for (const [group_id, group_data] of Object.entries(elem_data.group)) {
            if (!group_data.units || !group_data.units[1]) { continue; }
            if (match_type(group_data.units[1].type)) {
              var name = dictionary[group_data.units[1].name] || group_data.units[1].name;
              var obj = {
                x: group_data.x,
                y: group_data.y,
                dcs_name: name,
                dcs_type: group_data.units[1].type,
                side: coalition,
              }

              // If we have a freq > 300000000, uhf, else vhf
              var freq = parseInt(group_data.units[1].frequency);
              if (!isNaN(freq)) {
                freq /= 1000000;
                if (freq >= 300) {
                  obj.uhf = freq.toFixed(3);
                } else {
                  obj.vhf = freq.toFixed(3);
                }
              }

              dcstoll(mission.theatre, obj)
              output[name] = obj
            }
          }
        }
      }
    }
    return output;
  }

  function triggers() {
    var triggers = {};
    if (mission.triggers && mission.triggers.zones) {
      for (const [zone_id, zone_data] of Object.entries(mission.triggers.zones)) {

        // For some sanity, exclude those without names
        if (zone_data.name.startsWith('New Trigger Zone')) { continue; };

        triggers[zone_data.name] = {
          x: zone_data.x,
          y: zone_data.y,
        }
        dcstoll(mission.theatre, triggers[zone_data.name])
        //triggers.push(obj)
      }
    }
    return {
      "all": triggers
    };
  }

  function tankers() {

    // Get the position of the tanker
    var tankers = {};

    for (const [coalition, coalition_data] of Object.entries(mission.coalition)) {
      for (const [country_id, country_data] of Object.entries(coalition_data.country)) {
        for (const [elem, elem_data] of Object.entries(country_data)) {
          if (elem != "plane") { continue; }

          for (const [group_id, group_data] of Object.entries(elem_data.group)) {
            var group_name = dictionary[group_data.name] ? dictionary[group_data.name] : group_data.name;

            // Ensure the group has AI units in it
            var has_ai = false;
            for (const [_, unit_data] of Object.entries(group_data.units)) {
              if (["Player", "Client"].includes(unit_data.skill)) { continue; }
              has_ai = true;
              break
            }

            if (!has_ai) { continue; }

            // Then we scan the group waypoints
            var points = getDict(group_data, 'route', 'points');
            var has_orbit = false;
            var has_tanker = false;
            var tanker = {};

            for (const [_, point] of Object.entries(points)) {
              var tasks = getDict(point, 'task', 'params', 'tasks');

              for (const [_, task] of Object.entries(tasks)) {
                switch(task.id) {
                  case "Orbit":
                    has_orbit = true;
      
                    // m/s
                    // gs   1.852;
                    tanker.speed = (Math.round((point.speed * 3.6) / 1.852 / 5) * 5).toFixed(0);
                    tanker.alt = Math.round(point.alt*3.28084/100)*100;
                    tanker.x = point.x;
                    tanker.y = point.y;

                    // override altitude / speed from params if set
                    var params = getDict(task, 'params');
                    if (params.speed) { tanker.speed = (Math.round((params.speed * 3.6) / 1.852 / 5) * 5).toFixed(0); }
                    if (params.alt) { tanker.alt = Math.round(params.alt*3.28084 / 100)*100; }

                    break;
                  case "Tanker":
                    has_tanker = true;
                    break
                }
              }
              
              if (has_orbit && has_tanker) {
                break;
              }
            }

            // We have our tanker
            if (has_orbit && has_tanker) {
              dcstoll(mission.theatre, tanker)
              if (!tankers[coalition]) { tankers[coalition] = {}; }
              tankers[coalition][group_name] = tanker;
            }
          }
        }
      }
    }
    return tankers;
  }

  function presets() {

    // Iterate through the units and pull out the map per airframe, we do this so
    // we can find which has the most populous to treat as the "correct" values 
    //
    // maps = coalition -> type -> [unit_data, map]

    // Radio Names are funny, so we just label them Radio 1, 2, 3 unless they have an index
    var radio_names = {
      'A-10C': ['U', 'V', 'F'],
      'F-16C': ['U', 'V'],
      'AV8BNA': ['PRI', 'SEC', 'RCS'],
      'F-14B': ['FWD', 'AFT'],
      'F-16C': ['U', 'V'],
      'FA-18C': ['PRI', 'SEC'],
      'Ka-50': ['VHF', 'ARK'],
      'Mi-8MT': ['UV', 'FM'],
      'SA342L': ['FM'],
      'SA342M': ['FM'],
      'SA342Minigun': ['FM'],
      'SA342Mistral': ['FM'],
      'UH-1H': ['UHF'],
      'AH-64D': ['V', 'U', 'FM1', 'FM2'],
    }

    var errors = [];
    var maps = {};

    for (const [coalition, coalition_data] of Object.entries(mission.coalition)) {
      for (const [country_id, country_data] of Object.entries(coalition_data.country)) {
        for (const [elem, elem_data] of Object.entries(country_data)) {
          if (!["plane", "helicopter"].includes(elem)) { continue }

          for (const [group_id, group_data] of Object.entries(elem_data.group)) {
            var group_name = dictionary[group_data.name] ? dictionary[group_data.name] : group_data.name;

            for (const [_, unit_data] of Object.entries(group_data.units)) {
              if (!['Client', 'Player'].includes(unit_data.skill)) { continue; }

              // Type mapping, after we have the data
              var type = unit_data.type;
              if (type == "FA-18C_hornet") { type = "FA-18C"; };
              if (type == "F-16C_50") { type = "F-16C"; };
              if (type == "AH-64D_BLK_II") { type = "AH-64D"; };

              // A-10C_2 and A-10C
              if (type.startsWith('A-10C')) { type = "A-10C"; };


              // Unit ID is useful for tracking which one, whilst unit_name maps to a dictionary object
              var unit_id = unit_data.unitId;
              var unit_name = dictionary[unit_data.name] ? dictionary[unit_data.name] : unit_data.name

              // A-10C etc. don't store them in the mission table, so we load
              // from either the avionics folder, or the global which allows us
              // to handle them the same as any other airframe, with just a
              // different data location
              
              var radio_data = unit_data.Radio || {};

              if (['A-10C', 'F-16C'].includes(type)) {
                // use original type for the avionics folder names
                avionics_data = get_presets_from_avionics(unit_data.type, unit_id);

                // Merge avionics data with radio_data (if it exists, F-16 uses it)
                for (const [key, value] of Object.entries(avionics_data)) {
                  radio_data[key] = value;
                }
              }

              // We have radios configured ?
              if (Object.keys(radio_data).length === 0) { continue; };

              // Ensure we have the maps
              if (maps[coalition] === undefined) { maps[coalition] = {}; }
              if (maps[coalition][type] === undefined) {
                maps[coalition][type] = {
                  // Used in next section for merging
                  'hashes': {}, 
                  // Unit info
                  'units': [],
                }
              };

              // Build our radio object
              var info = {};

              for (const [radio_id, data] of Object.entries(radio_data)) {

                var radio_name = 'Radio ' + radio_id;
                try {
                  radio_name = radio_names[type][radio_id-1];
                } catch {}

                info[radio_name] = {};

                for (const [preset_id, preset_value] of Object.entries(data.channels)) {

                  var value = preset_value.toFixed(3);
                  info[radio_name][preset_id] = value;
              }
            }

            maps[coalition][type]['units'].push(
              {
                id: unit_id,
                type: type,
                group: group_name,
                name: unit_name,
                map: info,
                hash: $.md5(JSON.stringify(info)),
              });
            }
          }
        }
      }
    }
    
    // Now we can go through our maps and find the most populous, and error on the rest, and prepare our output
    var outmap = {};

    for (const [coalition, airframes] of Object.entries(maps)) {
      if (coalition == "neutrals") {
        continue;
      }
      for (const [airframe, airframe_info] of Object.entries(airframes)) {

        // Go through the units and sum the caches, and reference the obj
        for (const unit of airframe_info.units) {
          if (airframe_info.hashes[unit.hash] === undefined) {
            airframe_info.hashes[unit.hash] = { 'count': 0 }
          };

          airframe_info.hashes[unit.hash]['count']++;
          if (!airframe_info.hashes[unit.hash]['map']) {
            airframe_info.hashes[unit.hash]['map'] = unit.map;
          }
        }
        
        var keys = Object.keys(airframe_info.hashes);

        // Find the most populous key, and iterate the units once more to generate errors
        var m_hash = keys.reduce((a, b) => airframe_info.hashes[a].count > airframe_info.hashes[b].count ? a : b);
        var m_map = airframe_info.hashes[m_hash].map;

        // Store the master output map for this airframe
        //    output -> airframe -> coalition -> radio_name -> preset_id
        if (outmap[airframe] === undefined) { outmap[airframe] = {}; }
        if (outmap[airframe][coalition] === undefined) { outmap[airframe][coalition] = {}; }

        for (const [radio_name, radio_presets] of Object.entries(m_map)) {
          if (outmap[airframe][coalition][radio_name] === undefined) { outmap[airframe][coalition][radio_name] = {}; }
          for (const [preset_id, preset_value] of Object.entries(radio_presets)) {
            if (outmap[airframe][coalition][radio_name][preset_id] === undefined) { outmap[airframe][coalition][radio_name][preset_id] = {}; }
            outmap[airframe][coalition][radio_name][preset_id] = preset_value;
          }
        }

        if (keys.length > 1) {

          for (const unit of airframe_info.units) {
            if (unit.hash == m_hash) { continue; }

            // Iterate through each radio and compare to the master_map and identify items
            for (const [radio_name, radio_data] of Object.entries(unit.map)) {
              m_radio_data = m_map[radio_name];

              for (const [preset_id, preset_value] of Object.entries(radio_data)) {
                if (m_radio_data[preset_id] != preset_value) {
                  errors.push(`${coalition} - ${unit.type}: "${unit.group}" > "${unit.name}", ${radio_name} preset ${preset_id}, ${preset_value} != ${m_radio_data[preset_id]}`);
                }
              }
            }
          }
        }
      }
    }

    return {
      'errors': errors,
      'presets': outmap,
    };
  }
}


////////////////////////////////////////////////////////////
// SIDE NAV FUNCTIONS
////////////////////////////////////////////////////////////

function squadrons_cleanup_nav() {
  $('a[href^="#squadrons-edit"]').parent().remove();
}

$(document).on('hide.bs.tab', 'a[href^="#squadrons-edit-"]', function(x) {
  if (!x.relatedTarget.getAttribute('href').startsWith('#squadrons-edit-')) {
    squadrons_cleanup_nav();
  }
  // If we've moved off child nav items, then delete those
  if (!x.relatedTarget.getAttribute('href').startsWith('#squadrons-edit-theatres-edit')) {
    $('a[href="#squadrons-edit-theatres-edit"]').parent().remove();
  }
  // If we've moved off child nav items, then delete those
  if (!x.relatedTarget.getAttribute('href').startsWith('#squadrons-edit-missions-edit')) {
    $('a[href="#squadrons-edit-missions-edit"]').parent().remove();
  }
});

////////////////////////////////////////////////////////////
// EDIT HANDLER
////////////////////////////////////////////////////////////

function squadrons_members_delete(e) {
  var sqn_id = url_elems()[1];
  var row = $(e).closest('tr');

  // If we're a new row, then just remove it as it doesn't exist
  if (row[0].hasAttribute('data-create')) {
    row.remove();
    return;
  }

  // Toggle delete state
  if (row[0].hasAttribute('data-delete')) {
    row[0].removeAttribute('data-delete', 1);
    row[0].cells[0].innerHTML = '';
  } else {
    row[0].setAttribute('data-delete', 1);
    row[0].cells[0].innerHTML = '<span style="color:red" data-feather="alert-triangle" alt="will be deleted"></span>';
    feather.replace();
  }
}

function squadrons_edit_mission_delete_managed_row(e) {
  var sqn_id = url_elems()[1];
  var row = $(e).closest('tr');

  // If we're a new row, then just remove it as it doesn't exist
  if (row[0].hasAttribute('data-create')) {
    row.remove();
    return;
  }

  // Toggle delete state
  if (row[0].hasAttribute('data-delete')) {
    row[0].removeAttribute('data-delete', 1);
    row[0].cells[0].innerHTML = '';
  } else {
    row[0].setAttribute('data-delete', 1);
    row[0].cells[0].innerHTML = '<span style="color:red" data-feather="alert-triangle" alt="will be deleted"></span>';
    feather.replace();
  }
}

function squadrons_add_frequency_row(code, freq) {

  var html = null;

  if (code) {
    html = `
      <tr>
      <td class="input-container border-right-0 text-center"></td>
      <td class="input-container border-left-0"><input class="input-full" data-base="${code}" value="${code}"></td>
      <td class="input-container"><input class="input-full text-right freq" data-base="${freq || ""}" value="${freq || ""}"></td>
      <td class="input-container text-center border-left-0">
        <button class="btn btn-link btn-sm p-0 pt-0.5" type="button" onclick='squadrons_edit_mission_delete_managed_row(this);'>
          <i data-feather="delete"></i>
        </button>
      </td>
    </tr>`;
  } else {
    html = `
      <tr data-create>
      <td class="input-container border-right-0 text-center"><span style="color:green" data-feather="plus-circle"></span></td>
      <td class="input-container border-left-0"><input class="input-full"></td>
      <td class="input-container"><input class="input-full text-right freq"></td>
      <td class="input-container text-center border-left-0">
        <button class="btn btn-link btn-sm p-0 pt-0.5" type="button" onclick='squadrons_edit_mission_delete_managed_row(this);'>
          <i data-feather="delete"></i>
        </button>
      </td>
    </tr>`;
  }

  $('#squadrons-edit-frequencies-table tbody').append($(html));
  feather.replace();
}

function squadrons_edit_mission_add_agency(agency, data, add=false) {

  var html = null;

  if (agency && data) {
    if (add) {
      html = `
        <tr data-create>
        <td class="input-container border-right-0 text-center"><span style="color:green" data-feather="plus-circle"></span></td>`;
    } else {
      html = `
        <tr>
        <td class="input-container border-right-0 text-center"></td>`;
    }

    html += `
      <td class="input-container border-left-0"><input class="input-full" data-base="${agency}" value="${agency}"></td>
      <td class="input-container">
        <select data-base="${data.side || "all"}" class="input-full">
          <option value="all" ${!data.side || data.side == "all" ? ' selected' : ''}>all</option>
          <option${data.side == "blue" ? ' selected' : ''}>blue</option>
          <option${data.side == "red" ? ' selected' : ''}>red</option>
        </select>
      </td>
      <td class="input-container"><input class="input-full text-right tcn" data-base="${data.tcn || ""}" value="${data.tcn || ""}"></td>
      <td class="input-container"><input class="input-full text-right freq" data-base="${data.pri || ""}" value="${data.pri || ""}"></td>
      <td class="input-container border-right-0"><input class="input-full text-right freq" data-base="${data.sec || ""}" value="${data.sec || ""}"></td>
      <td class="input-container text-center border-left-0">
        <button class="btn btn-link btn-sm p-0 pt-0.5" type="button" onclick='squadrons_edit_mission_delete_managed_row(this);'>
          <i data-feather="delete"></i>
        </button>
      </td>
    </tr>`;
  } else {
    html = `
      <tr data-create>
      <td class="input-container border-right-0 text-center"><span style="color:green" data-feather="plus-circle"></span></td>
      <td class="input-container border-left-0"><input class="input-full"></td>
      <td class="input-container">
        <select class="input-full">
          <option value="all" selected>all</option>
          <option>blue</option>
          <option>red</option>
        </select>
      </td>
      <td class="input-container"><input class="input-full text-right tcn"></td>
      <td class="input-container"><input class="input-full text-right freq"></td>
      <td class="input-container border-right-0"><input class="input-full text-right freq"></td>
      <td class="input-container text-center border-left-0">
        <button class="btn btn-link btn-sm p-0 pt-0.5" type="button" onclick='squadrons_edit_mission_delete_managed_row(this);'>
          <i data-feather="delete"></i>
        </button>
      </td>
    </tr>`;
  }

  $('#squadrons-edit-mission-edit-agencies-table tbody').append($(html));
  feather.replace();
}

function squadrons_add_callsign_row(callsign) {

  var html = null;

  if (callsign) {
    html = `
      <tr>
      <td class="input-container border-right-0 text-center"></td>
      <td class="input-container border-left-0 border-right-0"><input class="input-full" data-base="${callsign}" value="${callsign}"></td>
      <td class="input-container text-center border-left-0">
        <button class="btn btn-link btn-sm p-0 pt-0.5" type="button" onclick='squadrons_edit_mission_delete_managed_row(this);'>
          <i data-feather="delete"></i>
        </button>
      </td>
    </tr>`;
  } else {
    html = `
      <tr data-create>
      <td class="input-container border-right-0 text-center"><span style="color:green" data-feather="plus-circle"></span></td>
      <td class="input-container border-left-0 border-right-0"><input class="input-full"></td>
      <td class="input-container text-center border-left-0">
        <button class="btn btn-link btn-sm p-0 pt-0.5" type="button" onclick='squadrons_edit_mission_delete_managed_row(this);'>
          <i data-feather="delete"></i>
        </button>
      </td>
    </tr>`;
  }

  $('#squadrons-edit-callsigns-table tbody').append($(html));
  feather.replace();
}

function squadrons_add_members_row(member) {

  var html = ``;

  if (member) {
    html = `
      <tr data-id="${member.id}">
      <td class="input-container border-right-0 text-center"></td>
      <td class="input-container border-left-0"><input class="input-full" data-base="${member.name}" value="${member.name || ""}"></td>
      <td class="input-container"><input class="input-full text-right pr-2" data-base="${member.borts ? member.borts['FA-18C'] || "" : ""}" value="${member.borts ? member.borts['FA-18C'] || "" : ""}"></td>
      <td class="input-container"><input class="input-full text-right pr-2" data-base="${member.borts ? member.borts['F-14B'] || "" : ""}" value="${member.borts ? member.borts['F-14B'] || "" : ""}"></td>
      <td class="text-center border-right-0"><input type="checkbox" name="active" data-base="${member.active == 1 ? 1 : 0}" ${member.active == 1 ? 'checked' : ''}></td>
      <td class="input-container text-center border-left-0">
        <button class="btn btn-link btn-sm p-0 pt-0.5" type="button" onclick='squadrons_members_delete(this);'>
          <i data-feather="delete"></i>
        </button>
      </td>
    </tr>`;
  } else {
    html = `
      <tr data-create>
      <td class="input-container border-right-0 text-center"><span style="color:green" data-feather="plus-circle"></span></td>
      <td class="input-container border-left-0"><input class="input-full"></td>
      <td class="input-container"><input class="input-full text-right pr-2"></td>
      <td class="input-container"><input class="input-full text-right pr-2"></td>
      <td class="text-center border-right-0">
        <input type="checkbox" name="active" checked>
      </td>
      <td class="input-container text-center border-left-0">
        <button class="btn btn-link btn-sm p-0 pt-0.5" type="button" onclick='squadrons_members_delete(this);'>
          <i data-feather="delete"></i>
        </button>
      </td>
    </tr>`;
  }

  $('#squadrons-edit-members-table tbody').append($(html));
  feather.replace();
}

function squadrons_populate_frequencies(elems, callback) {

  api_get('squadrons/' + elems[0] + '/frequencies', function(data) {
    $('#squadrons-edit-frequcneies').find('.title').html('Frequencies: ' + data.name);

    $('#squadrons-edit-frequencies-table tbody').empty();

    for (const [code, freq] of Object.entries(data.frequencies)) {
      squadrons_add_frequency_row(code, freq)
    }

    if (typeof(callback) === "function") {
      callback();
    }
  });

}

function squadrons_populate_callsigns(elems, callback) {

  api_get('squadrons/' + elems[0] + '/callsigns', function(data) {
    $('#squadrons-edit-frequcneies').find('.title').html('Frequencies: ' + data.name);

    $('#squadrons-edit-callsigns-table tbody').empty();

    for (const callsign of data.callsigns.sort()) {
      squadrons_add_callsign_row(callsign)
    }

    if (typeof(callback) === "function") {
      callback();
    }
  });

}

function squadrons_populate_members(elems, callback) {

  api_get('squadrons/' + elems[0] + '/members?inactive=1', function(data) {
    var tbody = $('#squadrons-edit-members-table tbody');
    tbody.empty();
    for (var member of data) {
      squadrons_add_members_row(member)
    }

    if (typeof(callback) === "function") {
      callback();
    }
  });

}

function squadron_populate_theatre_airfield(id, af_data, overrides) {

  overrides = overrides || {};

  var tbody = $('#squadrons-edit-theatre-edit-airfield-table > tbody');

  var row = `
    <tr data-id="${id}">
      <td data-base="${af_data.dcs_name}">${af_data.display_name || af_data.dcs_name}</td>`;

  if (overrides.uhf) {
    row += `<td class="input-container modified"><input class="input-full text-right freq" data-base="${af_data.uhf || ""}" value="${overrides.uhf}"></td>`;
  } else {
    if (af_data.uhf) {
      row += `<td class="input-container"><input class="input-full text-right freq" data-base="${af_data.uhf}" value="${af_data.uhf}"></td>`;
    } else {
      row += `<td class="input-container"><input class="input-full text-right freq"></td>`;
    }
  }

  if (overrides.vhf) {
    row += `<td class="input-container modified"><input class="input-full text-right freq" data-base="${af_data.vhf || ""}" value="${overrides.vhf}"></td>`;
  } else {
    if (af_data.vhf) {
      row += `<td class="input-container"><input class="input-full text-right freq" data-base="${af_data.vhf}" value="${af_data.vhf}"></td>`;
    } else {
      row += `<td class="input-container"><input class="input-full text-right freq"></td>`;
    }
  }

  row += `
      <td class="input-container"><input class="input-full text-right freq" value="${overrides.par || ""}"></td>
      <td class="input-container"><input class="input-full text-right freq" value="${overrides.atis || ""}"></td>
      <td class="input-container"><input class="input-full text-right freq" value="${overrides.gnd || ""}"></td>
      <td class="input-container"><input class="input-full text-right freq" value="${overrides.twr || ""}"></td>
      <td class="input-container"><input class="input-full text-right freq" value="${overrides.ctrl || ""}"></td>
  `;

  if (overrides.tcn) {
    row += `<td class="input-container modified"><input class="input-full tcn text-right" data-base="${af_data.tcn || ""}" value="${overrides.tcn}"></td>`;
  } else {
    if (af_data.tcn) {
      row += `<td class="input-container"><input class="input-full text-right tcn" data-base="${af_data.tcn}" value="${af_data.tcn}"></td>`;
    } else {
      row += `<td class="input-container"><input class="input-full text-right tcn" data-base=""></td>`;
    }
  }

  row += '</tr>';

  var elem = $(row);
  tbody.append(elem);

  // Process coordinates
  elem.find('.coord-ctrl').each(function(idx, elem) { coords.format_td(elem); });

}

function squadrons_theatres_save() {

  var overrides = {};

  var theatre = parseInt($('#squadrons-edit-theatres-edit').data('theatre'));
  var squadron = parseInt($('#squadrons-edit-theatres-edit').data('squadron'));

  $("#squadrons-edit-theatre-edit-airfield-table > tbody > tr").each(function(a, tr) {
    if (tr.cells.length) {

      // Overrides
      var id = $(tr).data('id');
      var data = get_modified_row_data(tr, ['-', 'uhf', 'vhf', 'par', 'atis', 'gnd', 'twr', 'ctrl', 'tcn']);

      // data-base might be empty if we're removing an item from DCS on update
      var name = tr.cells[0].getAttribute('data-base');
      if (!name) {
        return
      }
      delete(data['dcs_name']);

      if (Object.keys(data).length) {
        if (!overrides.airfields) { overrides.airfields = {} };
        overrides.airfields[id] = data;
      }
    }
  });

  data = {
    'theatre':  theatre,
    'squadron': squadron,
    'overrides': overrides,
  };

  var elems = url_elems();
  api_post(
    'squadrons/'+elems[1]+'/theatres/' + elems[3],
    data,
    function() {
      update_content();
    });
}

function squadrons_populate_theatres_edit(theatre_id, callback) {

  api_get('squadrons/'+(url_elems()[1])+'/theatres/' + theatre_id + '?merged=0', function(data) {

    // If we have a child already; replace
    $('#side-nav a[href="#squadrons-edit-theatres-edit"]').remove();
    var nn = nav_item('squadrons-edit-theatres-edit', data.display_name, 'map-pin', 'squadrons/' + url_elems()[1] + '/theatres/'+data.id, 2);
    $('#side-nav a[href="#squadrons-edit-theatres"]').parent().after(nn);

    // Update icon
    feather.replace();

    // Populate the content 

    var container = $('#squadrons-edit-theatres-edit');
    container.find('.tab-title').html(data['display_name']);
    container.data('squadron', url_elems()[1]);
    container.data('theatre', theatre_id);

    // Empty the airfields
    $('#squadrons-edit-theatre-edit-airfield-table > tbody').empty();

    // we just care about merged defaults
    if (data.base.airfields) {
      var sorted_airfields = Object.entries(data.base.airfields).sort(
          (a,b) => a[1].dcs_name.toLowerCase().localeCompare(b[1].dcs_name.toLowerCase()));
      for (const [id, af_data] of sorted_airfields) {
        squadron_populate_theatre_airfield(id, af_data, getDict(data.overrides, 'airfields', id));
      }
    }

    // And switch to tab
    $('#side-nav a[href="#squadrons-edit-theatres-edit"]').tab('show');

    if (typeof(callback) === "function") {
      callback();
    }

  })
}

function squadrons_populate_theatres(elems, callback) {

  // If we have an ID below, then we're in the edit window
  if (elems.length == 3) {
    squadrons_populate_theatres_edit(elems[2], callback);
    return;
  }

  api_get('theatres', function(res) {
    $('#squadrons-edit-theatres-table tbody').empty();

    for (const [theatre, data] of Object.entries(res)) {
      var row = $(`
        <tr data-id="${data.id}">
          <td class="border-right-0">${data.display_name}</td>
          <td class="text-center border-left-0">
            <button class="btn btn-sm btn-primary" type="button")'>Edit</button>
          </td>
        </tr>
      `);

      row.on('click', function(evt) { squadrons_populate_theatres_edit($(evt.target).closest('tr').data('id')); });
      $('#squadrons-edit-theatres-table tbody').append(row);
    }

    if (typeof(callback) === "function") {
      callback();
    }
  });
}

function squadrons_populate_missions(elems, callback) {

  // If we have an ID below, then we're in the edit window
  if (elems.length == 3) {
    squadrons_populate_missions_edit(elems[0], elems[2], callback);
    return;
  }

  api_get('squadrons/'+elems[0]+'/missions?all=1', function(res) {
    $('#squadrons-edit-missions-table tbody').empty();

    for (var data of res['missions']) {
      var html = `
        <tr data-sqn="${data.squadron}" data-id="${data.id}">
          <td class="border-right-0">${data.name}</td>`;

      // Default Radio
      html += `<td class="text-center border-left-0 border-right-0"><input name="is_default" type="radio"${data.is_default ? ' checked' : ''}></td>`;
          
      // Active Checkbox
      html += `<td class="text-center border-left-0 border-right-0"><input name="active" type="checkbox"${data.active ? ' checked' : ''}></td>`;

      // Actions
      html += `
          <td class="text-center border-left-0">
            <button class="btn btn-sm btn-primary mr-2" type="button" name="edit">Edit</button>
            <button class="btn btn-sm btn-primary" name="delete" type="button">Delete</button>
          </td>
        </tr>
      `;

      row = $(html);

      var edit_handler = function(evt) {
        if (evt.target != evt.currentTarget) { return; }
        var elems = url_elems();
        squadrons_populate_missions_edit(elems[1], $(evt.target).closest('tr').data('id')); 
      }

      $(row[0].cells[0]).on('click', edit_handler);
      row.find('button[name="edit"]').on('click', edit_handler);
      row.find('button[name="delete"]').on('click', function(evt) {

        var id = $(evt.target).closest('tr').data('id');

        // Confirm the dialog before submitting
        var dlg = $('#admin-confirmation-dialog');
        var elems = url_elems();
        dlg.data({
          'squadron': elems[1],
          'mission': id,
        });

        dlg.find('button[name="confirm"]').one('click', function(e) {
          var dlg = $('#admin-confirmation-dialog');

          var data = dlg.data();
          api_delete(`squadrons/${data.squadron}/missions/${data.mission}`, function() {
            dlg.modal('hide');
            update_content();
          });
        });

        // Show the dialog
        dlg.modal({
          backdrop: 'static',
        });

      });

      row.find('input[name="active"]').on('change', function(evt) {
        var elem = $(this);
        var id = elem.closest('tr').data('id');
        var elems = url_elems();

        console.log($(this).is(':checked'));
        api_post(`/squadrons/${elems[1]}/missions/${id}`, {
          'squadron': parseInt(elems[1]),
          'mission': id,
          'update': {
            'active': $(this).is(':checked')
          }
        });
      });

      row.find('input[name="is_default"]').on('change', function(evt) {

        var elem = $(this);
        var id = elem.closest('tr').data('id');
        var elems = url_elems();

        api_post(`/squadrons/${elems[1]}/missions`, {
          'squadron': parseInt(elems[1]),
          'default': id,
        });
      });
      $('#squadrons-edit-missions-table tbody').append(row);
    }
  });
}

function squadrons_insert_airfield(table, id, af_data, overrides, name_editable, new_item=false) {

  overrides = overrides || {};

  var tbody = $('#' +table+ ' > tbody');

  var row = `
    <tr data-id="${id}">
      <td class="border-right-0">`;

  if (new_item) {
    row += '<span style="color:green" data-feather="plus-circle"></span>';
  }

  row += '</td>';

  if (name_editable) {
    row += `<td class="input-container border-left-0${overrides['display_name'] ? ' modified' : ''}"><input data-base="${af_data.display_name || af_data.dcs_name}" class="input-full" value="${overrides.display_name || af_data.display_name || af_data.dcs_name}"></td>`;
  } else {
    row += `<td data-base="${af_data.dcs_name}" class="input-container border-left-0">${af_data.display_name || af_data.dcs_name}</td>`;
  }

  if (af_data.dcs_type) {
    row += `<td data-base="${af_data.dcs_type}">${af_data.dcs_type}</td>`;
  }

  if (table == "squadrons-edit-mission-edit-custom-airfield-table") {
    row += `<td class="coord coord-ctrl" data-base-lat="${af_data.lat}" data-base-lon="${af_data.lon}" data-lat="${af_data.lat}" data-lon="${af_data.lon}"></td>`;
    row += `<td class="coord"></td>`;
  }

  var itms = [
    ['uhf', 'freq'],
    ['vhf', 'freq'],
    ['par', 'freq'],
    ['atis', 'freq'],
    ['gnd', 'freq'],
    ['twr', 'freq'],
    ['ctrl', 'freq'],
    ['tcn', 'tcn']
  ]

  for (var itm of itms) {
    var base = af_data[itm[0]] || "";
    row += `<td class="input-container${overrides[itm[0]] ? ' modified' : ''}"><input data-base="${base}" class="input-full text-right ${itm[1]}" value="${overrides[itm[0]] || base}"></td>`;
  }

  row += `</tr>`;
  var elem = $(row);
  elem.data('base', af_data);
  tbody.append(elem);

  // Process coordinates
  elem.find('.coord-ctrl').each(function(idx, elem) { coords.format_td(elem); });

  feather.replace();
}

function squadrons_populate_missions_edit_presets(data, callback) {
  // Presets
  var preset_nav = $('#squadrons-edit-missions-edit-presets-tab');
  var preset_cont = $('#squadrons-edit-missions-edit-presets-tabContent');
  
  // Reset
  preset_nav.empty();
  preset_cont.empty();

  // It's easier here to map our presets to have coalition under the freq ratehr than where it is 
  var presets = {};
  console.log("LOAD PRESETS", data);
  for (const [ac, ac_data] of Object.entries(getDict(data, 'presets', 'presets'))) {
    presets[ac] = {};
    for (const [side, radio_data] of Object.entries(ac_data)) {
      for (const [radio, freqs] of Object.entries(radio_data)) {
        if (!presets[ac][radio]) { presets[ac][radio] = {}; }
        for (const [preset, freq] of Object.entries(freqs)) {
          if (!presets[ac][radio][preset]) { presets[ac][radio][preset] = {}; }
          presets[ac][radio][preset][side] = freq;
        }
      }
    }
  }

  Object.keys(presets).sort().forEach(function(airframe, idx) {

    // Add nav item
    preset_nav.append($(`
      <li class="nav-item" style="width:100%">
        <a class="nav-link vpill${idx == 0 ? ' active' : ''}" id="pills-home-tab" data-toggle="pill" href="#pills-${airframe}" role="tab" aria-controls="pills-${airframe}" aria-selected="${idx == 0 ? ' true' : 'false'}">${airframe}</a>
      </li>`));

    // Build preset pane, for each radio:
    //
    //    <RADIO: COMM-1>
    //  <PRESET> <BLUE> <RED>
    //     1     234.4  245.5
    //     2     134.4  145.5

    var pane_content = $(`<div class="tab-pane ${idx == 0 ? ' active' : ''}" id="pills-${airframe}" role="tabpanel" aria-labelledby="pills-profile-tab"></div>`);

    html = '';

    var radio_count = Object.keys(presets[airframe]).length;

    // Take the width, minus the number of frequencies, minus the 10px spacings for inter-radios, and 5px border each size
    var div_width = (910 - 80*2*radio_count - 10*(radio_count-1) - 10) / radio_count;

    for (const [radio_name, radio_presets] of Object.entries(presets[airframe]).sort()) {

      html += `
        <table class="table table-striped" data-radio-name="${radio_name}" style="width:160px; float:left; margin:5px">
          <colgroup>
            <col style="width:${div_width}px"/>
            <col style="width:80px"/>
            <col style="width:80px"/>
          </colgroup>

          <thead class="thead-light">
            <tr>
              <th colspan=3 class="text-center">${radio_name}</th>
            </tr>
            <tr>
              <th class="">PST</th>
              <th class="text-center">BLUE</th>
              <th class="text-center">RED</th>
            </tr>
          </thead>
          <tbody>`;

      // Now we fill each row
      for (const [pst_id, pst] of Object.entries(radio_presets)) {
        html += `
          <tr>
            <td>${pst_id}</td>
            <td class="text-right freq">${pst.blue || ""}</td>
            <td class="text-right freq">${pst.red || ""}</td>
          </tr>`;
      }

      html += `
            </tbody>
          </table>`;

    }

    pane_content.append($(html));
    preset_cont.append(pane_content);
  });

  // Handle warnings
  if ((getDict(data, 'presets').errors || []).length == 0) {
    $('#squadrons-edit-missions-edit-presets-warnings').hide();
  } else {
    $('#squadrons-edit-missions-edit-presets-warnings').show();
    $('#squadrons-edit-missions-edit-presets-warnings-content').empty();
    $('#squadrons-edit-missions-edit-presets-warnings-content').html(data.presets.errors.join("\n"));
  }

  if (typeof(callback) === "function") {
    callback();
  }
}

function squadrons_populate_missions_edit(sqn_id, mission_id, callback) {
  
  api_get('squadrons/'+sqn_id+'/missions/' + mission_id + '?merged=0', function(data) {

    // Update Nav
    var nav = $('#side-nav a[href="#squadrons-edit-missions-edit"]');
    if (!nav.length) {
      $('#side-nav a[href="#squadrons-edit-missions-edit"]').remove();
      var nn = nav_item('squadrons-edit-missions-edit', data.name, 'map-pin', 'squadrons/' + sqn_id + '/missions/'+mission_id, 2);
      $('#side-nav a[href="#squadrons-edit-missions"]').parent().after(nn);
    } else {
      nav.find(".nav-title").text(data.name);
    }

    // Reset Coords to what we have displayed
    coords.set_display_format($("input[name=squadrons-edit-mission-coord]:checked").val());
    coords.set_display_decimals(parseInt($("#flight-coord-decimals").val()));

    // Display Name
    $('#squadrons-edit-mission-edit-display-name').val(data.name);

    // Save the squadron id / mission id for keeping
    $('#squadrons').data('mission_data', data);

    // Bullseyes
    $("#squadrons-edit-mission-edit-bullseye-table > tbody > tr").each(function(a, tr) {
      if (tr.cells.length) {
        var k = tr.cells[0].getAttribute('data-base');
        if (k in getDict(data, 'data', 'bullseye')) {
          var bulls = data.data.bullseye[k];

          // Base Values
          tr.cells[1].firstChild.setAttribute("data-base", bulls.name);
          tr.cells[1].firstChild.value = bulls.name;

          tr.cells[2].setAttribute("data-base-lat", bulls.lat);
          tr.cells[2].setAttribute("data-base-lon", bulls.lon);

          var lat = bulls.lat;
          var lon = bulls.lon;

          // Overrides
          var overrides = getDict(data, 'overrides', 'bullseye', k);
          if (overrides) {
            if (overrides.name) { $(tr.cells[1]).addClass("modified"); tr.cells[1].firstChild.value = overrides.name; }
            if (overrides.lat) { lat = overrides.lat; $(tr.cells[2]).addClass("modified"); }
            if (overrides.lon) { lon = overrides.lon; $(tr.cells[3]).addClass("modified"); }
          }

          // Set data-raw for reset
          tr.cells[2].setAttribute("data-lat", lat);
          tr.cells[2].setAttribute("data-lon", lon);

          coords.format_td(tr.cells[2]);
        }
      }
    });

    // DCS Airfields
    $("#squadrons-edit-mission-edit-airfield-table > tbody").empty();
    for (const [id, info] of Object.entries(getDict(data, 'data', 'airfields'))) {
      squadrons_insert_airfield("squadrons-edit-mission-edit-airfield-table", id, info, getDict(data, 'overrides', 'airfields', id), false);
    }

    // Mission Airfields
    $("#squadrons-edit-mission-edit-custom-airfield-table > tbody").empty();
    for (const [id, info] of Object.entries(getDict(data, 'data', 'mission_airfields'))) {
      squadrons_insert_airfield("squadrons-edit-mission-edit-custom-airfield-table", id, info, getDict(data, 'overrides', 'mission_airfields', id), true);
    }

    // Navpoints
    $("#squadrons-edit-mission-edit-navpoints-table > tbody").empty();

    for (const [type, coalitions] of Object.entries(getDict(data, 'data', 'navpoints'))) {
      if (type == "custom") { continue; }
      for (const [coalition, points] of Object.entries(coalitions)) {
        for (const [np_name, np_data] of Object.entries(points)) {
          squadrons_edit_navpoint_add(type, coalition, np_name, np_data, getDict(data.overrides, 'navpoints', type, coalition, np_name));
        }
      }
    }

    for (const [tr_name, tr_data] of Object.entries(getDict(data, 'overrides', 'navpoints', 'custom', 'all'))) {
      // Custom navpoints only have the data, never overrides
      squadrons_edit_navpoint_add("custom", "all", tr_name, tr_data, {}, false, true);
    }

    // Agencies
    $("#squadrons-edit-mission-edit-agencies-table > tbody").empty();
    for (const [agency_side, agencies] of Object.entries(getDict(data, 'overrides', 'agencies'))) {
      for (const[agency, agency_data] of Object.entries(agencies)) {
        // Custom navpoints only have the data, never overrides
        squadrons_edit_mission_add_agency(agency, agency_data);
      }
    }

    // Codeword
    $("#squadrons-edit-mission-edit-codeword-table > tbody").empty();
    for (const [codeword, codeword_data] of Object.entries(getDict(data, 'overrides', 'codewords'))) {
      // Custom navpoints only have the data, never overrides
      squadrons_edit_mission_add_codeword(codeword, codeword_data);
    }

    squadrons_populate_missions_edit_presets(data.data);

    // Update icons
    feather.replace();

    // And switch to tab
    $('#side-nav a[href="#squadrons-edit-missions-edit"]').tab('show');

    if (typeof(callback) === "function") {
      callback();
    }
  });

}

function squadrons_edit_navpoint_add(type, coalition, name, data, overrides, new_item=false, deletable=false) {

  overrides = overrides || {};
  new_item = new_item || false;

  var for_coalition = overrides.side === undefined ? coalition : overrides.side;

  var row = `
    <tr data-id="${name || ""}"${deletable && !name ? ' data-create' : ''}>
      <td class="border-right-0">`;

  if (new_item) {
    row += '<span style="color:green" data-feather="plus-circle"></span>';
  }
  
  row += `</td>
      <td class="text-center row-selector border-left-0"><input type="checkbox" name="select"></td>
      <td>${type}</td>
      <td class="input-container${for_coalition != coalition ? ' modified' : ''}">
        <select data-base="${coalition}" class="input-full" data-npname='coalition'>
          <option value="all" ${for_coalition == "all" ? ' selected' : ''}>all</option>
          <option${for_coalition == "blue" ? ' selected' : ''}>blue</option>
          <option${for_coalition == "red" ? ' selected' : ''}>red</option>
        </select>
      </td>`;

  if (data) {
    row += `<td class="input-container${overrides.name ? ' modified' : ''}"><input class="input-full" data-base="${name}" value="${overrides.name || name}"></td>`;
    row += `<td class="coord coord-ctrl${overrides.lat ? ' modified' : ''}" onClick="coordinate_input(this, 5);" data-base-lat="${data.lat}"  data-lat="${overrides.lat || data.lat}" data-lon="${overrides.lon || data.lon}" data-base-lon="${data.lon}"></td>`;
    row += `<td class="coord${overrides.lon ? ' modified' : ''}" onClick="coordinate_input(this, 5);"></td>`;
    row += `<td class="input-container${overrides.alt ? ' modified' : ''}"><input class="input-full text-right" data-base="${data.alt || 0}" value="${overrides.alt || data.alt || 0}"></td>`;
    row += `<td class="text-center border-right-0${overrides.hide ? ' modified' : ''}"><input type="checkbox" name="hidden" data-npname='hide' data-base="0" ${overrides.hide || data.hide == 1 ? 'checked' : ''}></td>`;
  } else {

    row += `<td class="input-container"><input class="input-full" `;
    if (overrides.name) { row += `data-base="${overrides.name}" `; }
    row += `value="${overrides.name || name || ""}"></td>`;

    row += `<td class="coord coord-ctrl" onClick="coordinate_input(this, 5);" data-lat="${overrides.lat || ""}" data-lon="${overrides.lon || ""}" `;
    if (overrides.lat) { row += `data-base-lat="${overrides.lat}" `; }
    if (overrides.lon) { row += `data-base-lon="${overrides.lon}" `; }
    row += `"></td>`;

    row += `<td class="coord" onClick="coordinate_input(this, 5);"></td>`;

    row += `<td class="input-container"><input class="input-full text-right" value="${overrides.alt || 0}"`;
    if (overrides.alt) { row += `data-base="${overrides.alt}" `; }
    row += `></td>`;

    row += `<td class="text-center border-right-0${overrides.hide ? ' modified' : ''}"><input type="checkbox" name="hidden" data-npname='hide' data-base="0" ${overrides.hide || data.hide == 1 ? 'checked' : ''}></td>`;
  }

  if (deletable) {
    row += `
      <td class="input-container text-center border-left-0">
        <button class="btn btn-link btn-sm p-0 pt-0.5" type="button" onclick='squadrons_edit_mission_delete_managed_row(this);'>
          <i data-feather="delete"></i>
        </button>
      </td>`;
  } else {
    row += `<td class="input-container text-center border-left-0"></td>`;
  }


  elem = $(row);
  if (data && name) {
    elem.data({
      'data': data,
      'name': name,
      'type': type,
      'side': coalition,
    });
  }
  elem.find('.coord-ctrl').each(function(idx, elem) { coords.format_td(elem); });

  $("#squadrons-edit-mission-edit-navpoints-table > tbody").append(elem);

  // Update icons
  feather.replace();

}

function squadrons_edit_missions_edit_save() {

  var overrides = {};
  var base = {};

  var mission_data = $('#squadrons').data('mission_data');

  var sqn_id = mission_data.squadron;
  var msn_id = mission_data.id;
  var display_name = $('#squadrons-edit-mission-edit-display-name').val();

  // Bulls overrides
  $("#squadrons-edit-mission-edit-bullseye-table > tbody > tr").each(function(a, tr) {
    if (tr.cells.length) {

      // override
      var data = get_modified_row_data(tr, ["-", "name", "lat", "-"]);
      var name = tr.cells[0].getAttribute('data-base');
      if (Object.keys(data).length) {
        if (!overrides.bullseye) { overrides.bullseye = {} };
        overrides.bullseye[name] = data;
      }

      // base 
      var data = get_base_row_data(tr, ["side", "name", "lat", "-"]);
      var name = data['side'];
      delete(data['side']);
      if (Object.keys(data).length) {
        if (!base.bullseye) { base.bullseye = {} };
        base.bullseye[name] = data;
      }
    }
  });
  
  // DCS Airfields: indexed by airfield ID, there is no base to worry about as
  // it's all inherited and can't be edited here
  
  $("#squadrons-edit-mission-edit-airfield-table > tbody > tr").each(function(a, tr) {
    if (tr.cells.length) {

      // Overrides
      var id = $(tr).data('id');
      var data = get_modified_row_data(tr, ['-', '-', 'uhf', 'vhf', 'par', 'atis', 'gnd', 'twr', 'ctrl', 'tcn']);

      if (Object.keys(data).length) {
        if (!overrides.airfields) { overrides.airfields = {} };
        overrides.airfields[id] = data;
      }
    }
  });

  // Mission Airfields: indexed by DCS Name
  $("#squadrons-edit-mission-edit-custom-airfield-table > tbody > tr").each(function(a, tr) {
    if (tr.cells.length) {

      // If we have no ID then we don't exist (deleted)
      if (!tr.hasAttribute('data-id')) { return; }

      var id = $(tr).data('id');
      var af_base = $(tr).data('base');

      // Overrides
      var data = get_modified_row_data(tr, ['', 'display_name', '', 'lat', '-', 'uhf', 'vhf', 'par', 'atis', 'gnd', 'twr', 'ctrl', 'tcn']);
      if (Object.keys(data).length) {
        if (!overrides.mission_airfields) { overrides.mission_airfields = {} };
        overrides.mission_airfields[id] = data;
      }

      // af_base wont exist on custom entries, only as an override
      if (af_base) {
        if (base.mission_airfields === undefined) { base.mission_airfields = {}; }
        base.mission_airfields[id] = af_base;
      }
    }
  });

  // Navpoints - oh so many sources of navpoints 
  $("#squadrons-edit-mission-edit-navpoints-table > tbody > tr").each(function(a, tr) {
    if (tr.cells.length) {

      // If we have no ID then we don't exist (deleted)
      if (!tr.hasAttribute('data-id')) { return; }
      if (tr.hasAttribute("data-delete")) { return; }

      var np_data = $(tr).data() || {};
      var type = np_data.type || "custom";

      // Overrides
      var data = get_modified_row_data(tr, ['-', '-', 'type', 'side', 'name', 'lat', '-', 'alt', 'hide']);
      var name = np_data.name || data.name;

      // Refuse to save if we have no name, lat or lon
      if (!name || !(data.lat || (np_data && np_data.data.lat)) || !(data.lon || (np_data || np_data.data.lon))) { return; }

      // As type is fixed, we nuke it from here
      delete(data['type']);

      // navpoints have a data, custom do not
      if (type == "custom") {

        if (overrides.navpoints === undefined) { overrides.navpoints = {}; }
        if (overrides.navpoints[type] === undefined) { overrides.navpoints[type] = {}; }
        if (overrides.navpoints[type]["all"] === undefined) { overrides.navpoints[type]["all"] = {}; }

        var cdata = get_row_data(tr, ['-', '-', 'type', 'side', 'name', 'lat', '-', 'alt', 'hide']);
        if (cdata.lat) {
          overrides.navpoints[type]["all"][cdata.name] = {
            'lat': cdata.lat[0],
            'lon': cdata.lat[1],
          }

          if (cdata.hide) {
            overrides.navpoints[type]["all"][cdata.name].hide = 1;
          }
        }

      } else if (Object.keys(data).length) {
        if (!overrides.navpoints) { overrides['navpoints'] = {} };
        if (!overrides.navpoints[type]) { overrides.navpoints[type] = {} };

        // Navpoints are actually IP points, and are coded to a given side
        var side = np_data.side || "all";
        if (!overrides.navpoints[type][side]) { overrides.navpoints[type][side] = {} }; 
        overrides.navpoints[type][side][name] = data 
      } 
      
      if (np_data && np_data.data && type != "custom") {
        if (base.navpoints === undefined) { base.navpoints = {}; }
        if (base.navpoints[type] === undefined) { base.navpoints[type] = {}; }

        var side = np_data.side || "all";
        if (!base.navpoints[type][side]) { base.navpoints[type][side] = {} }; 
        base.navpoints[type][side][np_data.name] = np_data.data;
      } 
    }
  });

  overrides['agencies'] = {};

  // Agencies - simple collection into overrides
  $("#squadrons-edit-mission-edit-agencies-table > tbody > tr").each(function(a, tr) {

    // If the row is marked for delete, ignore it
    if (tr.hasAttribute("data-delete")) {
      return;
    }

    // Otherwise simply collect the data
    var mods = get_row_data(tr, ['-', 'agency', 'side', 'tcn', 'pri', 'sec']);
    var name = mods['agency'];
    delete(mods['agency']);


    // Skip empty names
    if (name == "") {
      return;
    }

    // Skip if all values are empty
    if (Object.values(mods).filter(x => x != "").length == 0) {
      return;
    }

    if (!overrides['agencies'][mods['side']]) {
      overrides['agencies'][mods['side']] = {};
    }

    overrides['agencies'][mods['side']][name] = mods;
  });

  // codeword - simple collection into overrides
  overrides['codewords'] = {};
  $("#squadrons-edit-mission-edit-codeword-table > tbody > tr").each(function(a, tr) {

    // If the row is marked for delete, ignore it
    if (tr.hasAttribute("data-delete")) {
      return;
    }

    // Otherwise simply collect the data
    var mods = get_row_data(tr, ['-', 'codeword', 'action']);
    var name = mods['codeword'];
    delete(mods['agency']);

    // Skip empty names
    if (name === "") return;

    // Skip if all values are empty
    if (Object.values(mods).filter(x => x != "").length == 0) {
      return;
    }

    overrides['codewords'][name] = mods;
  });

  // Bring in presets as we were
  base['presets'] = mission_data.data.presets;
  console.log("PPPP RESETS", base['presets']);

  data = {
    'squadron': sqn_id,
    'mission':  msn_id,
    'update':  {
      'name': display_name,
      'base': base,
      'overrides': overrides,
    }
  };

  var elems = url_elems();
  api_post(
    'squadrons/'+elems[1]+'/missions/' + elems[3],
    data,
    function() {
      update_content(function() {
        $("#side-bar").overhang({
            custom: true,
            primary: "#444444",
            accent: "#222222",
            message: "Saved",
        });
      });
    });
}


function squadrons_populate_edit(elems, callback) {

  // Which tab we show is baed on the URL
  var id = elems[0];

  // Navigate to page / default page
  var page = elems[1];
  if (page === undefined) {
    page = "missions"
  }

  // Add the required nav items if needed, if we delete, then nav gets confused
  // and doesn't highlight nicely
  if ($('#side-bar a[href="#squadrons-edit-missions"]').length == 0) {
    var p = $('#sidebar a[href="#squadrons"]').parent();

    // Populate nav
    var base_url = 'squadrons/' + id;
    var navs = [
      ['Callsigns', 'list', 'callsigns'],
      ['Frequency Codes', 'activity', 'frequencies'],
      ['Missions', 'crosshair', 'missions'],
      ['Members', 'users', 'members'],
      ['Theatres', 'globe', 'theatres'],
    ]

    for (var nav of navs) {
      var n = nav_item('squadrons-edit-' + nav[2], nav[0], nav[1], base_url + '/' + nav[2], 1);
      p.after(n);
    }
  }

  // Build the page or continue processing
  var fn = "squadrons_populate_"+page; 
  if (typeof window[fn] === "function") {
    window[fn](elems, callback);
  }

  // Update icon
  feather.replace();

  // If we are > 2 then the child function is responible 
  if (elems.length > 2) {
    return;
  }

  // Ensure correct tab content eselected
  $('#side-bar a[href="#squadrons-edit-'+page+'"]').tab('show');

  // callback
  if (typeof(callback) === "function") {
    callback()
  }

}

function squadrons_edit(evt) {
  // Don't trigger on the embedded items like hyperlinks / svgs etc.
  if (evt.target != evt.currentTarget) { return; }
  squadrons_populate_edit([$(evt.currentTarget).closest('tr').data('id')]);
}


////////////////////////////////////////////////////////////
// TABLE MANAGEMENT
////////////////////////////////////////////////////////////

function squadrons_add_row(id, squadron, url, editable, active, is_default) {

  var html = `
    <tr data-id="${id}" style="height: 42px">
      <td class="border-right-0">${squadron}`;
  if (url) {
    html += `&nbsp;<a href="${url}"><i data-feather="globe"></i></a>`;
  }
  html += `</td>`;

  // Default Radio
  html += `<td class="text-center border-left-0 border-right-0"><input name="is_default" type="radio"${is_default ? ' checked' : ''}></td>`;
      
  // Active Checkbox
  html += `<td class="text-center border-left-0 border-right-0"><input name="active" type="checkbox"${active ? ' checked' : ''}></td>`;

  // Actions
  html += `
      <td class="text-center border-left-0">
        <button class="btn btn-sm btn-primary mr-2" type="button" name="edit">Edit</button>
        <button class="btn btn-sm btn-primary" name="delete" type="button">Delete</button>
      </td>
    </tr>
  `;


  var row = $(html);
  $(row[0].cells[0]).on('click', squadrons_edit);

  row.find('button[name="edit"]').on('click', squadrons_edit);
  row.find('button[name="delete"]').on('click', function(evt) {

    var id = $(evt.target).closest('tr').data('id');

    // Confirm the dialog before submitting
    var dlg = $('#admin-confirmation-dialog');
    dlg.data('squadron', id);
    dlg.find('button[name="confirm"]').one('click', function(e) {
      var dlg = $('#admin-confirmation-dialog');
      var sqn = dlg.data().squadron;
      api_delete(`squadrons/${sqn}`, function() {
        dlg.modal('hide');
        update_content();
      });
    });

    // Show the dialog
    dlg.modal({
      backdrop: 'static',
    });

  });
  row.find('input[name="active"]').on('change', function(evt) {
    var elem = $(this);
    var id = elem.closest('tr').data('id');

    api_post(`/squadrons/${id}`, {
      'squadron': id,
      'update': {
        'active': $(this).is(':checked')
      }
    });
  });
  row.find('input[name="is_default"]').on('change', function(evt) {
    var id = $(this).closest('tr').data('id');

    api_post('/squadrons', {
      'default': id,
    });
  });

  $('#squadrons-table tbody').append(row);

  if(url) {
    feather.replace();
  }
}


////////////////////////////////////////////////////////////
// INIT
////////////////////////////////////////////////////////////

function squadrons_refresh(elems, callback) {

  if (elems && elems.length) {
    squadrons_populate_edit(elems, callback);
    return
  }

  // Remove child
  squadrons_cleanup_nav();

  // Load up squadrons and update the table
  api_get('squadrons?all=1&editable=1', function(res) {

    // Save theatre data, and build our table of squadrons, with an edit button
    squadrons = res;

    $('#squadrons-table tbody').empty();

    for (const data of squadrons) {
      squadrons_add_row(data['idx'], data['name'], data['url'], data['editable'], data['active'] == 1, data['is_default'] == 1);
    }

    // Ensure correct tab data selected
    $('#side-nav a[href="#squadrons"]').tab('show');

    // callback
    if (typeof(callback) === "function") {
      callback()
    }

    // Show / Hide the add button
    $('#squadrons-add').toggle(admin_user?.roles?.["squadrons-create"] !== undefined);

  });
}

function squadrons_members_save() {
  var updates = {};
  var deletes = {};
  var creates = [];

  var cols = ['-', 'name', 'bort_18', 'bort_14', 'active'];

  $('#squadrons-edit-members-table tbody > tr').each(function(idx, tr) {

    // If the row is new, add it to creates
    if (tr.hasAttribute("data-id")) {
      var id = parseInt(tr.getAttribute("data-id"));
      if (isNaN(id)) { return; }

      if (tr.hasAttribute("data-delete")) {
        deletes[id] = 1;
      } else {
        var mods = get_modified_row_data(tr, cols);
        if (Object.keys(mods).length) {
          updates[id] = mods;
        }
      }
    } else {
      creates.push(get_row_data(tr, cols));
    }
  });
  
  // build up mods
  var mods = [];
  for (var c of creates) {
    if (c.name != "") {
      mods.push({
        "type": "create",
        "changes": c,
      })
    }
  }
  for (var id in deletes) {
    mods.push({
      "type": "delete",
      "id": parseInt(id),
    });
  }
  for (var [id, itms] of Object.entries(updates)) {
    mods.push({
      "type": "modify",
      "id": parseInt(id),
      "changes": itms,
    });
  }

  if (!mods.length) {
    return;
  }

  var sqn_id = parseInt(url_elems()[1]);
  if (isNaN(sqn_id)) { return; }
  api_post(
    `squadrons/${sqn_id}/members`,
    {
      "id": sqn_id,
      "changes": mods,
    },
    function(data) {
      update_content();
    }
  );

};

function squadrons_frequencies_save() {

  var save = {};

  var cols = ['-', 'name', 'freq'];

  $('#squadrons-edit-frequencies-table tbody > tr').each(function(idx, tr) {

    // If the row is marked for delete, ignore it
    if (tr.hasAttribute("data-delete")) {
      return;
    }

    // Otherwise simply collect the data into
    var mods = get_row_data(tr, cols);
    save[mods['name']] = mods['freq'];

  });

  var sqn_id = parseInt(url_elems()[1]);
  api_post(
    `squadrons/${sqn_id}/frequencies`,
    {
      "id": sqn_id,
      "frequencies": save,
    },
    function(data) {
      update_content();
    }
  );

};

function squadrons_callsigns_save() {

  var save = {};

  var cols = ['-', 'callsign'];

  $('#squadrons-edit-callsigns-table tbody > tr').each(function(idx, tr) {

    // If the row is marked for delete, ignore it
    if (tr.hasAttribute("data-delete")) {
      return;
    }

    // Otherwise simply collect the data into
    var mods = get_row_data(tr, cols);
    save[mods['callsign']] = 1;

  });

  var sqn_id = parseInt(url_elems()[1]);
  api_post(
    `squadrons/${sqn_id}/callsigns`,
    {
      "id": sqn_id,
      "callsigns": Object.keys(save),
    },
    function(data) {
      update_content();
    }
  );

};



$('#squadrons-add').on('click', function() {

  var dlg = $("#squadrons-edit-add-squadron-dialog");
  var form = dlg.find('form');
  form[0].reset();
  form.find('.invalid-feedback').hide();

  form.on('submit', function(evt) {
    evt.preventDefault();

    if (form[0].checkValidity() !== true) {
      return;
    }

    api_post('squadrons', {
        'create': form.serializeObject(),
    }, function(resp) {

      if (!resp.success) {
        var elem = resp.elem || "name";
        var input = form.find('input[name='+elem+']');
        var feedback = input.parent().find('.invalid-feedback');
        feedback.html(resp.message).show();
        return;
      }
      dlg.modal('hide');
      form.off(evt);
      update_content();
    });
  });

  dlg.modal({
    backdrop: 'static',
  });


});

$('#squadrons-add-member').on('click', function() { squadrons_add_members_row(); });
$('#squadrons-edit-members-save').on('click', squadrons_members_save);
sortable_table($("#squadrons-edit-members-table"));

$('#squadrons-add-frequency').on('click', function() { squadrons_add_frequency_row(); });
$('#squadrons-edit-frequencies-save').on('click', squadrons_frequencies_save);
sortable_table($("#squadrons-edit-frequencies-table"));

$('#squadrons-add-callsign').on('click', function() { squadrons_add_callsign_row(); });
$('#squadrons-edit-callsigns-save').on('click', squadrons_callsigns_save);
sortable_table($("#squadrons-edit-callsigns-table"));


$('#squadrons-edit-theatres-save').on('click', squadrons_theatres_save);

$('#squadrons-add-mission').on('click', function() { 
  // Dialog to add mission
});
//$('#squadrons-edit-mission-save').on('click', squadrons_mission_save);

// Coord formats
$("input[name=squadrons-edit-mission-coord]").change(function(evt) { coords.set_display_format(evt.target.value); });
$("#squadrons-edit-mission-coord-decimals").change(function(evt) { coords.set_display_decimals(evt.target.value); });

$('#squadrons-add-custom-navpoint').on('click', function() {
  squadrons_edit_navpoint_add("custom", null, null, null, null, null, true);
});

// AGENCIES
$('#squadrons-edit-mission-edit-agencies-button').on('click', function() {
  squadrons_edit_mission_add_agency();
});

$("#squadrons-edit-mission-edit-agencies-bulk-button").on('click', function() {
  var dlg = $('#squadrons-edit-mission-add-agencies-bulk-dialog');

  // Reset the form
  var form = dlg.find('form');
  form[0].reset();

  // Show the dialog
  dlg.modal({
    backdrop: 'static',
  });
});

$("#squadrons-edit-mission-add-agencies-bulk-dialog-submit").on('click', function() {
  var dlg = $('#squadrons-edit-mission-add-agencies-bulk-dialog');

  // Iterate the rows, split into agency, data and feed into add
  // squadrons_edit_mission_add_agency
  
  var get_freq = function(freq) {
    var float_val = parseFloat(freq).toFixed(3)
    if (isNaN(float_val)) {
      return "";
    }
    return float_val;
  }

  // Update existing entries if they have the same name
  var updates = {};

  var lines = $('#squadrons-edit-missions-add-agencies-bulk-csv').val().split(/\r?\n/);
  for (line of lines) {
    var [agency, side, tcn, pri, sec] = line.split(/,\s*/).map(s => s.trim());

    // Ensure agency ok
    if (agency == "") { continue }

    // if side isn't 
    side = side ? side.toLowerCase() : "all";
    if (!["all", "red", "blue"].includes(side.toLowerCase())) {
      side = "all"
    }

    // Validate the rest
    if (tcn) {
      var match = tcn.match(/^([0-9]+)\s*(X|Y)$/i);
      tcn = match ? match[1] + ' ' + match[2].toUpperCase() : "";
    }

    if (pri) {
      pri = get_freq(pri);
    }

    if (sec) {
      sec = get_freq(sec);
    }

    // Ensure rest aren't just empty
    if ([tcn, pri, sec].filter(x => typeof(x) == "string" && x != "").length == 0) {
      continue
    }

    // Add to update list keyed off agency
    updates[agency] = {
      'pri': pri,
      'sec': sec,
      'side': side,
      'tcn': tcn,
    }
  }

  $("#squadrons-edit-mission-edit-agencies-table > tbody > tr").each(function(a, tr) {

    // If the row is marked for delete, ignore it
    if (tr.hasAttribute("data-delete")) {
      return;
    }

    // collect the row data
    var headers = ['-', 'agency', 'side', 'tcn', 'pri', 'sec'];
    var row_data = get_row_data(tr, headers);
    var name = row_data['agency'];
    delete(row_data['agency']);

    // If we are updating this, go ahead
    if (updates[name]) {

      console.log(name, row_data)

      for (const [header, value] of Object.entries(row_data)) {
        var col = headers.indexOf(header);
        var upv = updates[name][header] || "";
        if (upv != value) {
          if (tr.cells[col].firstElementChild) {
            tr.cells[col].firstElementChild.setAttribute('data-base', upv);
          } else {
            tr.cells[col].innerHTML = upv;
          }
          $(tr.cells[col]).addClass('modified');
        }
      }

      delete(updates[name])
    }
  });

  for (var [agency, data] of Object.entries(updates)) {
    squadrons_edit_mission_add_agency(agency, data, true);
  }

  dlg.modal('hide');
});

// CODEWORDS 
//
$('#squadrons-edit-mission-edit-codeword-button').on('click', function() {
  squadrons_edit_mission_add_codeword();
});

$("#squadrons-edit-mission-edit-codeword-bulk-button").on('click', function() {
  var dlg = $('#squadrons-edit-mission-add-codeword-bulk-dialog');

  // Reset the form
  var form = dlg.find('form');
  form[0].reset();

  // Show the dialog
  dlg.modal({
    backdrop: 'static',
  });
});

$("#squadrons-edit-mission-add-codeword-bulk-dialog-submit").on('click', function() {
  var dlg = $('#squadrons-edit-mission-add-codeword-bulk-dialog');

  // we won't care about duplicates here given this will all be replaced soon
  var updates = {};

  var lines = $('#squadrons-edit-missions-add-codeword-bulk-csv').val().split(/\r?\n/);
  for (line of lines) {
    var [codeword, action] = line.split(/,\s*/).map(s => s.trim());

    // non empty
    if (action === "" || codeword === "") { continue }

    squadrons_edit_mission_add_codeword(codeword, {action: action}, true);
  }

  dlg.modal('hide');
});

function squadrons_edit_mission_add_codeword(codeword, data, add=false) {

  var html = null;

  if (codeword && data) {
    if (add) {
      html = `
        <tr data-create>
        <td class="input-container border-right-0 text-center"><span style="color:green" data-feather="plus-circle"></span></td>`;
    } else {
      html = `
        <tr>
        <td class="input-container border-right-0 text-center"></td>`;
    }

    html += `
      <td class="input-container border-left-0"><input class="input-full" data-base="${codeword}" value="${codeword}"></td>
      <td class="input-container border-right-0"><input class="input-full" data-base="${data.action || ""}" value="${data.action || ""}"></td>
      <td class="input-container text-center border-left-0">
        <button class="btn btn-link btn-sm p-0 pt-0.5" type="button" onclick='squadrons_edit_mission_delete_managed_row(this);'>
          <i data-feather="delete"></i>
        </button>
      </td>
    </tr>`;
  } else {
    html = `
      <tr data-create>
      <td class="input-container border-right-0 text-center"><span style="color:green" data-feather="plus-circle"></span></td>
      <td class="input-container border-left-0"><input class="input-full"></td>
      <td class="input-container border-right-0"><input class="input-full"></td>
      <td class="input-container text-center border-left-0">
        <button class="btn btn-link btn-sm p-0 pt-0.5" type="button" onclick='squadrons_edit_mission_delete_managed_row(this);'>
          <i data-feather="delete"></i>
        </button>
      </td>
    </tr>`;
  }

  $('#squadrons-edit-mission-edit-codeword-table tbody').append($(html));
  feather.replace();
}


// Mission 

$("#squadrons-edit-mission-edit-save").on('click', squadrons_edit_missions_edit_save);

$(".multi-select > tbody").click(function(e) {

  var tgt = $(e.target);
  console.log(tgt);
  var td = tgt.closest('td');

  if (!td.hasClass('row-selector')) { console.log("R1"); return; }

  var tbody = $(e.currentTarget);
  console.log(tbody);
  var chk = td.children("input:first")
  var state = chk.is(':checked');
  if (!chk.is(tgt)) { state = !state; }

  // If we're not control or shift, we uncheck all, then set our state
  if (!e.shiftKey && !e.ctrlKey) {
    tbody.find('.row-selector > input').prop('checked', false);
  }
  chk.prop('checked', state);

  // Always store the last clicked
  var rowIdx = td.closest('tr')[0].rowIndex;
  var lastRowIdx = tbody.data("lastRowIdx"); 
  tbody.data("lastRowIdx", rowIdx); 

  if (!lastRowIdx) { console.log("NORI"); return; }

  // If we're shift selecting, select all the ones from lastRowIdx to here
  if (!e.shiftKey) { console.log("NOS"); return; }
  tbody.find('tr > td:nth-child(2) > input').slice(...([lastRowIdx,rowIdx].sort((a,b) => a-b))).prop('checked', state);

});

$('#squadrons-edit-mission-edit-navpoints-table > tbody').on('change', function(e) {
  // If we're blocked, don't process
  if ($(this).data('navpoint-process')) { return; }
  var tgt = $(e.target);
  // If we're selected
  if (tgt.closest('tr').find('td:nth-child(2) > input').is(":checked")) {
    var name = $(tgt).data('npname');
    if (name) {
      $(this).data('navpoint-process', true);
      if (tgt[0].type == "checkbox") {
        $(this).find('tr > td:nth-child(2) > input:checked').closest('tr').find('td > input[data-npname="'+name+'"]').not(tgt).prop('checked', tgt.is(':checked')).change();
      } else {
        $(this).find('tr > td:nth-child(2) > input:checked').closest('tr').find('td > select[data-npname="'+name+'"]').not(tgt).val(tgt.val()).change();
      }
      $(this).data('navpoint-process', false);
    }
  }
});

$('#squadrons-edit-mission-add-file-input').on('change', function(evt) {
  $('#squadrons-edit-mission-add-dialog').find('label[name="miz-label"]').html(evt.currentTarget.value.split(/[\/\\]+/).reverse()[0]);
});


$('#squadrons-edit-mission-edit-update').on('click', function() {
  var dlg = $('#squadrons-edit-mission-add-dialog');

  // Reset the form
  var form = dlg.find('form');
  form[0].reset();
  form[0].classList.remove('was-validated');

  dlg.find('.modal-title').html('Update mission');
  dlg.find('.display-name-container').hide();

  // Make name required
  form.find('input[name="display-name"]')[0].removeAttribute('required');

  // input should be miz or CF file only
  $("#squadrons-edit-mission-add-file-input").attr('accept', '.miz,.cf');
  $("#squadrons-edit-mission-add-file-input-label").html("Miz / CF file");
  $("#squadrons-edit-mission-add-dialog-cfinfo").show();

  dlg.data({
    'mode': 'update',
    'squadron': parseInt(url_elems()[1]),
  });

  // Show the dlg
  dlg.modal({
    backdrop: 'static',
  });
});


$('#squadrons-edit-missions-add-button').on('click', function() {

  var dlg = $('#squadrons-edit-mission-add-dialog');

  // Reset the form
  var form = dlg.find('form');
  form[0].reset();
  form[0].classList.remove('was-validated');

  dlg.find('.modal-title').html('Add new mission');
  dlg.find('.display-name-container').show();

  // Make name required
  form.find('input[name="display-name"]')[0].setAttribute('required', '');

  // input should be miz file only
  $("#squadrons-edit-mission-add-file-input").attr('accept', '.miz');
  $("#squadrons-edit-mission-add-file-input-label").html("miz file");
  $("#squadrons-edit-mission-add-dialog-cfinfo").hide();

  dlg.data({
    'mode': 'new',
    'squadron': parseInt(url_elems()[1]),
  });

  // Show the dlg
  dlg.modal({
    backdrop: 'static',
  });

});

$('#squadrons-edit-mission-add-dialog-display-name').on('change', function() {
  this.setCustomValidity('');
});

$('#squadrons-edit-mission-add-submit').click(function() {

  var dlg = $('#squadrons-edit-mission-add-dialog');
  var form = dlg.find('form');

  // Required etc. is ok, but not nessesarilly things like the JSON
  form[0].classList.add('was-validated');
  if (form[0].checkValidity() !== true) {
    return;
  }

  // Process MIZ file all rathre defered 
  mp = new MissionProcessor();
  mp.process($('#squadrons-edit-mission-add-file-input')[0], function(data) {

    var mode = dlg.data('mode') ;

    if (mode == "update") {
      dlg.modal('hide');

      switch (data.format) {
        case "miz":
          squadrons_update_mission_data(data);
          break;
        case "cf":
          squadrons_update_cf_data(data);
      }
    } else if (mode == "new") {

      var squadron = dlg.data('squadron');
      var name_input = form.find('input[name="display-name"]');
      var name = name_input.val();

      if (name) {
        var post = {
          'squadron': squadron,
          'create': {
            'display_name': name,
            'base': data,
          }
        };

        api_post(
          'squadrons/'+squadron+'/missions',
          post,
          function(resp) {
            if (resp.success) {
              dlg.modal('hide');
              squadrons_populate_missions_edit(squadron, resp.mission);
            }
          });
      }
    }
  });
});

function squadrons_update_cf_data(data) {
  // Called with data, a list of points from Mission Processor, here we just go
  // through each waypoint and if an existing point does not exist anywhere, we
  // add a custim point.
  
  var matches = {};
  var mission_data = $('#squadrons').data('mission_data');

  var exists = function(wp_name) {
    for (const [type, coalitions] of Object.entries(getDict(mission_data, 'data', 'navpoints'))) {
      if (type == "cfpoint") { continue; }
      for (const [coalition, points] of Object.entries(coalitions)) {
        if (Object.keys(points).includes(wp_name)) {
          return true;
        }
      }
    }
    return false;
  }

  $("#squadrons-edit-mission-edit-navpoints-table > tbody > tr").each(function(a, tr) {
    if (tr.cells.length) {

      // The type dictates where we pull the data from
      var type = tr.cells[2].textContent;
      if (type !== "cfpoint") { return; }

      var nav_data = $(tr).data();
      var updates = getDict(data, "waypoints", nav_data.name);

      if (Object.keys(updates).length) {
        // Store the match so we can iterate over all the mission airfields and
        // add any new ones
        
        matches[nav_data.name] = true;

        // we can only do lat/lon from cf
        let latlon = get_elem_data(tr.cells[5]);

        tr.cells[5].setAttribute("data-base-lat", updates.lat);
        tr.cells[5].setAttribute("data-base-lon", updates.lon);

        if (latlon[0] != updates.lat) { $(tr.cells[5]).addClass("modified"); }
        if (latlon[1] != updates.lon) { $(tr.cells[6]).addClass("modified"); }

      } else {

        // It no longer exists, mark for delete
        tr.cells[0].innerHTML = '<span style="color:red" data-feather="alert-triangle"></span>';

        // clear tr ID so it bypasses the save 
        tr.removeAttribute('data-id');

        update_feather = true;
      }
    }
  })

  // Add any new items
  for (const [np_name, np_data] of Object.entries(getDict(data, 'waypoints'))) {
    if (getDict(matches, np_name) !== true) {
      if (exists(np_name)) { continue; }
      console.log(np_data);
      squadrons_edit_navpoint_add("cfpoint", "all", np_name, np_data, {}, true);
    }
  }

}

function squadrons_update_mission_data(data) {
 
  update_feather = false;

  // This is called with new base data; we don't want to change data so we'll
  // set the new base values, but keep the existing values and mark them as
  // modified if need be, the hover state will show the original value

  $("#squadrons-edit-mission-edit-bullseye-table > tbody > tr").each(function(a, tr) {
    if (tr.cells.length) {
      var k = tr.cells[0].getAttribute('data-base');
      if (k in data.bullseye) {
        var bulls = data.bullseye[k];

        // Bulls Name
        tr.cells[1].firstChild.setAttribute("data-base", bulls.name);
        var current_value = get_elem_data(tr.cells[1]);
        if (current_value != bulls.name) {
          $(tr.cells[1]).addClass("modified");
        }

        tr.cells[2].setAttribute("data-base-lat", bulls.lat);
        tr.cells[2].setAttribute("data-base-lon", bulls.lon);

        let latlon = get_elem_data(tr.cells[2]);
        if (latlon[0] != bulls.lat) { $(tr.cells[2]).addClass("modified"); } 
        if (latlon[1] != bulls.lon) { $(tr.cells[3]).addClass("modified"); }
      }
    }
  });

  // Thankfully, nothing to do with DCS airfields :)
 

  // Mission Airfields, these maybe removed, they maybe renamed, plenty of
  // potential cleanup. so we iterate over the existing items first in the
  // table, and update / mark for delete
  
  var matches = {};
  $("#squadrons-edit-mission-edit-custom-airfield-table > tbody > tr").each(function(a, tr) {
    if (tr.cells.length) {

      // Unit name in DCS is data-base
      var af_name = tr.cells[1].firstChild.getAttribute('data-base');
      if (!af_name) { return; }

      var updates = getDict(data, 'mission_airfields', af_name);
      if (Object.keys(updates).length) {
        // Store the match so we can iterate over all the mission airfields and
        // add any new ones
        matches[af_name] = true;

        // Base on airfields is set on the custom data
        $(tr).data('base', updates);

        // We only can compare those that come from DCS so, just compare thses
        var row_cols = ['-', '-', 'dcs_type', '-', '-', 'uhf', 'vhf']
        var row_data = get_row_data(tr, row_cols);
        for (const [header, value] of Object.entries(row_data)) {
          var col = row_cols.indexOf(header);
          var upv = updates[header] || "";
          if (upv != value) {
            if (tr.cells[col].firstElementChild) {
              tr.cells[col].firstElementChild.setAttribute('data-base', upv);
            } else {
              tr.cells[col].innerHTML = upv;
            }
            $(tr.cells[col]).addClass('modified');
          }
        }

      } else {
        // It no longer exists, mark for delete
        tr.cells[0].innerHTML = '<span style="color:red" data-feather="alert-triangle"></span>';

        // clear tr ID so it bypasses the save 
        tr.removeAttribute('data-id');

        update_feather = true;

      }
    }
  })

  // Add any new items
  for (const [id, info] of Object.entries(getDict(data, 'mission_airfields'))) {
    if (matches[id]) { continue; }
    squadrons_insert_airfield("squadrons-edit-mission-edit-custom-airfield-table", id, info, {}, true, true);
  }

  // Navpoints
  matches = {};
  $("#squadrons-edit-mission-edit-navpoints-table > tbody > tr").each(function(a, tr) {
    if (tr.cells.length) {

      // The type dictates where we pull the data from
      var type = tr.cells[2].textContent;
      if (!type) { return; }

      // If it's custom or cf, then we don't own it
      if (["custom", "cfpoint"].includes(type)) { return; }

      var nav_data = $(tr).data();
      var side = nav_data.side || "all";
      var updates = getDict(data, "navpoints", type, side, nav_data.name);

      if (Object.keys(updates).length) {
        // Store the match so we can iterate over all the mission airfields and
        // add any new ones
        
        if (!matches[type]) { matches[type] = {} }
        if (!matches[type][side]) { matches[type][side] = {} }
        matches[type][side][nav_data.name] = true;

        // we can only do lat/lon from miz
        current_value = get_elem_data(tr.cells[5]);

        updates.lat = updates.lat.toFixed(12);
        updates.lon = updates.lon.toFixed(12);

        let has_update = false;

        console.log(current_value[0], updates.lat, typeof(current_value[0]), typeof(updates.lat));

        if (current_value[0] !== updates.lat) { $(tr.cells[5]).addClass("modified"); has_update = true; }
        if (current_value[1] !== updates.lon) { $(tr.cells[6]).addClass("modified"); has_update = true; }

        if (has_update) {

          // Update the base data which will be persisted to base
          $(tr).data({
            'data': updates,
          });

          // We also need to update the npdata of the row
          tr.cells[5].setAttribute("data-base-lat", updates.lat);
          tr.cells[5].setAttribute("data-base-lon", updates.lon);
        }
      } else {

        // It no longer exists, mark for delete
        tr.cells[0].innerHTML = '<span style="color:red" data-feather="alert-triangle"></span>';

        // clear tr ID so it bypasses the save 
        tr.removeAttribute('data-id');

        update_feather = true;
      }
    }
  });

  // Add any new items

  for (const [type, coalitions] of Object.entries(getDict(data, 'navpoints'))) {
    for (const [coalition, points] of Object.entries(coalitions)) {
      for (const [np_name, np_data] of Object.entries(points)) {
        if (getDict(matches, type, coalition, np_name) !== true) {
          squadrons_edit_navpoint_add(type, coalition, np_name, np_data, getDict(data.overrides, 'navpoints', type, coalition, np_name), true);
        }
      }
    }
  }

  // Presets are a straight copy, and redraw panes
  var c_data = $('#squadrons').data('mission_data');
  c_data.data.presets = data.presets;
  $('#squadrons').data('mission_data', c_data);
  squadrons_populate_missions_edit_presets(c_data.data);
   
  if (update_feather) {
    feather.replace();
  }

}
