-- Simple script that writes out airbase locations and tacans to a file
-- CHANGE dest
local export_dir = "C:\\DCS\\output"

-- Load in JSON and the terrain's beacons.lua
local JSON = dofile('Scripts\\JSON.lua')
dofile('Mods\\terrains\\' .. env.mission.theatre .. '\\beacons.lua')

-- Functions
function get_nearest_tacan(to)
    
    local closest = nil
    
    for _, beacon in pairs(beacons) do
  
    if beacon["type"] == BEACON_TYPE_TACAN or beacon["type"] == BEACON_TYPE_VORTAC then
      local dist = ((beacon["position"][1] - to.x)^2 + (beacon["position"][3] - to.z)^2)^0.5;
      if closest ~= nil then
        if dist < closest[1] then
          closest = {dist, beacon}
        end
      else
        closest = {dist, beacon}
      end
    end
    end
    
    return closest
end

-- Main 

local data = {}
data['theatre'] = env.mission.theatre;
data['airfields'] = {};
data['bullseye'] = {};

-- Iterate all the coalition's and collect their default bullsye and airbase positions
for c_name, c_id in pairs(coalition.side) do
    
  local pos = {coord.LOtoLL(coalition.getMainRefPoint(c_id))};

  data['bullseye'][c_name] = {
    ['lat'] = pos[1],
    ['lon'] = pos[2],
    ['name'] = 'BULLS',
  }

  for k, v in ipairs(coalition.getAirbases(c_id)) do
    local point = v:getPoint();
    local pos = {coord.LOtoLL(point)};
    local name = v:getName();

    local afdata = {
      ["lat"] = pos[1],
      ["lon"] = pos[2],
      ["alt"] = math.floor(pos[3]*3.28084),
    }

    -- lookup TCN info if something is closer than 7000 for additional help
    -- we use 7000 because Kish island is no where near the iarfield
    local tcn = get_nearest_tacan(point)
    if tcn ~= nil and tcn[1] < 7000 then
      local pos = {coord.LOtoLL(tcn[2].position)}
      afdata['tcn'] = {
        ['channel'] = tcn[2].channel,
        ['lat'] = pos[1],
        ['lon'] = pos[2],
        ['distance'] = tonumber(string.format("%.2f", tcn[1]/1000)),
      }
    end

    data['airfields'][name] = afdata;
  end
end

-- write out data
local file = io.open(export_dir .. "\\" .. env.mission.theatre .. ".json", "w")
file:write(JSON:encode(data):gsub("\n", "") .. "\n");
file:close()
