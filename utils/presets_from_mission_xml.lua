#!/usr/bin/lua
-- Just use jq -S '' after to format nicely

local https = require("ssl.https")

if #arg ~= 1 then
  print ("Usage: " .. arg[0] .. "[Uncompressed miz root]")
  print ("")
  print ("  Example: " .. arg[0] .. " https://raw.githubusercontent.com/132nd-vWing/ATRM/master/")
  os.exit()
end

local mission_root = arg[1]

-- Source mission table
local body, code = https.request(mission_root .. "mission")
loadstring(body)()

local radios = {
  U = mission_root .. "UHF_RADIO/SETTINGS.lua",
  V = mission_root .. "VHF_AM_RADIO/SETTINGS.lua",
  F = mission_root .. "VHF_FM_RADIO/SETTINGS.lua",
}

local json = require "lib/json"

output = {}
maps = {}

for cid,cdata in pairs(mission['coalition']['blue']['country']) do
  for ce_elem, ce_data in pairs(cdata) do
    if ce_elem == "plane" or ce_elem == "helicopter" then 
      for gid, gdata in pairs(ce_data['group']) do
        g_n = gdata['name']
        for u_id, u_data in pairs(gdata['units']) do
          if u_data['skill'] == 'Client' then
            if u_data['type'] ~= 'A-10C' and u_data['type'] ~= 'A-10C_2' then

              local t = u_data['type']

              if t == "FA-18C_hornet" then t = "FA-18C" end
              if t == "F-16C_50" then t = "F-16C" end

              local u_id = u_data['unitId']
              local u_n = u_data['name']

              if output[t] == nil then
                output[t] = {}
                maps[t] = {}
              end

              if u_data['Radio'] ~= nil then
                for radio_id, radio_data in pairs(u_data['Radio']) do

                  if maps[t][radio_id] == nil then
                    maps[t][radio_id] = {}
                  end


                  for k, v in pairs(radio_data['channels']) do

                    v = string.format("%.03f", v)

                    if maps[t][radio_id][k] == nil then
                      maps[t][radio_id][k] = v
                    end

                    if maps[t][radio_id][k] ~= nil and maps[t][radio_id][k] ~= v then
                      io.stderr:write("ALAAARM: ", g_n, " ", u_n, " ", t, " ", radio_id, " ", k, " ", maps[t][radio_id][k], " ", v, "\n")
                    end

                    vstr = v
                    rstr = ""..radio_id

                    if output[t][vstr] == nil then
                      output[t][vstr] = {}
                    end

                    if output[t][vstr][rstr] == nil then
                      output[t][vstr][rstr] = k
                    end
                  end
                end
              end
            end
          end
        end
      end
    end
  end
end

-- Handle A10C

output['A-10C'] = {}

for radio_id, url in pairs(radios) do

  local body, code = https.request(url)
  loadstring(body)()
  for k,v in pairs(settings['presets']) do

    vstr = string.format("%.03f", (v/1000000))
    rstr = radio_id.." "..k

    if output['A-10C'][vstr] == nil then
      output['A-10C'][vstr] = {}
    end

    output['A-10C'][vstr][rstr] = 1
  end
end


for ac, freqs in pairs(output) do

  if ac ~= 'A-10C' then
    for freq, sets in pairs(freqs) do
      for k,v in ipairs{"1", "2"} do
        if sets[v] == nil then
          sets[v] = "M"
        end
      end
      output[ac][freq] = sets["1"]..", "..sets["2"]
    end
  else
    for freq, psts in pairs(freqs) do
      itms = {}
      for k,v in pairs(psts) do
        table.insert(itms, k)
      end
      output[ac][freq] = table.concat(itms, ', ')
    end
  end
end

-- A-10C_2 uses same as A-10C
output['A-10C_2'] = output['A-10C']

print(json.encode({["presets"] = output}))
