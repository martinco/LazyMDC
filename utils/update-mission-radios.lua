#!/usr/bin/lua

-------------------------------------------------------------------------------
-- update-mission-radios.lua <mission_in> <mission_out>
--
-- This:
--   - reads the mission lua table (first argument)
--   - replaces any Client type radio presets as defined in the table below
--   - Writes out the new mission lua table to the 2nd argument
--
-- Radio Presets
--
-- These are a straight copy from the mission LUA table, linked against the
-- airframe
--
-------------------------------------------------------------------------------

radios = {
  ["Mi-8MT"] =
  {
      [1] = 
      {
          ["channels"] = 
          {
              [1] = 126.1,
              [2] = 126.2,
              [4] = 237,
              [8] = 121.2,
              [16] = 233.25,
              [17] = 242.25,
              [9] = 229,
              [18] = 231.25,
              [5] = 119.2,
              [10] = 227.5,
              [20] = 136.25,
              [11] = 228.5,
              [3] = 127.1,
              [6] = 119.4,
              [12] = 228.25,
              [13] = 127.5,
              [7] = 121.1,
              [14] = 225.75,
              [15] = 235.75,
              [19] = 309,
          }, -- end of ["channels"]
      }, -- end of [1]
      [2] = 
      {
          ["channels"] = 
          {
              [7] = 38.2,
              [1] = 35.6,
              [2] = 32.9,
              [4] = 33.8,
              [8] = 33.5,
              [9] = 38.5,
              [5] = 36.3,
              [10] = 34.25,
              [3] = 48.5,
              [6] = 37.8,
          }, -- end of ["channels"]
      }, -- end of [2]
  }, -- end of ["Radio"]
  ["FA-18C_hornet"] =
  {
      [1] =
      {
          ["channels"] =
          {
              [1] = 230.25,
              [2] = 234.5,
              [3] = 245.25,
              [4] = 239,
              [5] = 227.75,
              [6] = 149,
              [7] = 148,
              [8] = 229,
              [9] = 242.5,
              [10] = 239.75,
              [11] = 243.75,
              [12] = 225.75,
              [13] = 235.75,
              [14] = 233.25,
              [15] = 234.75,
              [16] = 230.5,
              [17] = 236.5,
              [18] = 245,
              [19] = 228.75,
              [20] = 243,
          }, -- end of ["channels"]
          ["modulations"] =
          {
              [1] = 0,
              [2] = 0,
              [3] = 0,
              [4] = 0,
              [5] = 0,
              [6] = 0,
              [7] = 0,
              [8] = 0,
              [9] = 0,
              [10] = 0,
              [11] = 0,
              [12] = 0,
              [13] = 0,
              [14] = 0,
              [15] = 0,
              [16] = 0,
              [17] = 0,
              [18] = 0,
              [19] = 0,
              [20] = 0,
          }, -- end of ["modulations"]
      }, -- end of [1]
      [2] =
      {
          ["channels"] =
          {
              [1] = 309.1,
              [2] = 309.9,
              [3] = 309.5,
              [4] = 237,
              [5] = 228,
              [6] = 248,
              [7] = 235,
              [8] = 246.25,
              [9] = 230,
              [10] = 126.1,
              [11] = 126.2,
              [12] = 127.1,
              [13] = 230.25,
              [14] = 234.5,
              [15] = 245.25,
              [16] = 239,
              [17] = 227.75,
              [18] = 234,
              [19] = 228.25,
              [20] = 243,
          }, -- end of ["channels"]
          ["modulations"] =
          {
              [1] = 0,
              [2] = 0,
              [3] = 0,
              [4] = 0,
              [5] = 0,
              [6] = 0,
              [7] = 0,
              [8] = 0,
              [9] = 0,
              [10] = 0,
              [11] = 0,
              [12] = 0,
              [13] = 0,
              [14] = 0,
              [15] = 0,
              [16] = 0,
              [17] = 0,
              [18] = 0,
              [19] = 0,
              [20] = 0,
          }, -- end of ["modulations"]
      }, -- end of [2]
  }, -- end of ["Radio"]
  ["F-14B"] =
  {
      [1] =
      {
          ["channels"] =
          {
              [1] = 230.25,
              [2] = 234.5,
              [3] = 245.25,
              [4] = 239,
              [5] = 227.75,
              [6] = 225,
              [7] = 262,
              [8] = 249,
              [9] = 242.5,
              [10] = 239.75,
              [11] = 243.75,
              [12] = 225.75,
              [13] = 235.75,
              [14] = 233.25,
              [15] = 234.75,
              [16] = 230.5,
              [17] = 236.5,
              [18] = 245,
              [19] = 228.75,
              [20] = 243,
          }, -- end of ["channels"]
      }, -- end of [1]
      [2] =
      {
          ["channels"] =
          {
              [1] = 309.1,
              [2] = 309.9,
              [3] = 309.5,
              [4] = 237,
              [5] = 228,
              [6] = 248,
              [7] = 235,
              [8] = 246,
              [9] = 230,
              [10] = 126.1,
              [11] = 126.2,
              [12] = 127.1,
              [13] = 230.25,
              [14] = 234.5,
              [15] = 245.25,
              [16] = 239,
              [17] = 227.75,
              [18] = 234,
              [19] = 228.25,
              [20] = 243,
              [21] = 225,
              [22] = 258,
              [23] = 260,
              [24] = 270,
              [25] = 255,
              [26] = 259,
              [27] = 262,
              [28] = 257,
              [29] = 253,
              [30] = 263,
          }, -- end of ["channels"]
      }, -- end of [2]
  }, -- end of ["Radio"]
}


-------------------------------------------------------------------------------
-- Serialization Functions
--
-- Modified from: DCS World\Scripts\Serializer.lua to handle strings that
-- contain numbers to ensure correct mission ordering as per the ME output
--
-- e.g:
--   foo12
--   foo102
-------------------------------------------------------------------------------

-- Return a table sorted by key as per ME output
function getSortedPairs(tableValue)
  local result = {}
  
  for key, value in pairs(tableValue) do
    table.insert(result, {key = key, value = value})
  end
  
  local sortFunction = function (pair1, pair2) 
    local t1 = type(pair1.key)
    local t2 = type(pair2.key)

    -- Handle simple number comparisons first
    if t1 == "number" and t2 == "number" then
      return pair1.key < pair2.key
    end

    -- Then we must have strings, so we break the string into number / string
    -- components then compare each so that foo102 comes after foo12 which
    -- wouldn't happen on a string match

    -- Collect type groups
    local grpa = getGroups(pair1.key)
    local grpb = getGroups(pair2.key)

    -- Now compare each group 
    local grplen = math.max(#grpa, #grpb)

    for i=1, grplen do
      local a = grpa[i]
      local b = grpb[i]

      local ta = type(a)
      local tb = type(b)

      if ta == tb then
        -- we only return if different to ensure we proceed through
        if a ~= b then
          return a < b
        end
      elseif ta == "string" and tb == "number" then
        return false
      else
        return true
      end
    end

    -- we should never get here as it means we got the same key twice
    return false
  end
  
  table.sort(result, sortFunction)
  
  return result
end

-- Split a string into string components and numeric components which
-- e.g: foo12bar => {"foo", 12, "bar"}
function getGroups(str)

  -- This only operates on strings
  if type(str) ~= "string" then
    return {str}
  end

  local groups = {""}
  local idx = 1
  local last_typ = nil

  local strlen = #str
  for i=1, strlen+1 do

    local letter = str:sub(i,i)
    local typ = "string"
    
    -- If it's a number, update the type
    local number = tonumber(letter)
    if number then typ = "number" end

    -- if we have something
    if last_typ ~= nil and (last_typ ~= typ or letter == "") then
    
      -- If the last type was a number, make the index a number
      -- before creating the next grouping
      if last_typ == "number" then
        groups[idx] = tonumber(groups[idx])
      end

      idx = idx + 1
      table.insert(groups, "")
    end

    groups[idx] = groups[idx] .. letter
    last_typ = typ
  end

  -- remove last group as it'll always be empty
  table.remove(groups, idx)

  return groups
end

function basicSerialize(o)
  if type(o) == "number" then
    return o
  elseif type(o) == "boolean" then
    return tostring(o)
  elseif type(o) == "string" then-- assume it is a string
    return string.format("%q", o)
  else
  return "nil"
  end
end

function serialize_failure_message(value,name)
  if name ~= nil then
    return "nil,--Cannot serialize a "..type(value).." :"..name.."\n"
  else
    return "nil,--Cannot serialize a "..type(value).."\n"
  end
end

function serialize_sorted(fout, name, value, level)

  local levelOffset = "    "
  
  if level == nil then 
    level = "" 
  end

  -- if level ~= "" then 
    -- level = level .. levelOffset 
  -- end
  
  if level == "" then
    fout:write(level, name, " = ")
  else
    fout:write(level, name, " =")
  end
  
  local valueType = type(value)
  
  if valueType == "number" or 
     valueType == "string" or 
   valueType == "boolean" then
    fout:write(" ", basicSerialize(value), ",\n")
  elseif valueType == "table" then
      fout:write("\n", level, "{\n") -- create a new table
      
      local sortedPairs = getSortedPairs(value)
      
      for i, pair in pairs(sortedPairs) do
        local k = pair.key        
        local key
        
        if type(k) == "number" then
          key = string.format("[%s]", k)
        else
          key = string.format("[%q]", k)
        end
        
        serialize_sorted(fout, key, pair.value, level .. levelOffset)    
      end

      if level == "" then
        fout:write(level.."} -- end of "..name.."\n")
      else
        fout:write(level.."}, -- end of "..name.."\n")
      end
  else
     fout:write(serialize_failure_message(value,name))
  end
end

-------------------------------------------------------------------------------
-- MAIN
-------------------------------------------------------------------------------

mission_file = arg[1]
mission_out = arg[2]

if mission_file == nil or mission_out == nil then
  local dn, bn, ext = string.match(arg[0], "(.-)([^\\/]-%.?([^%.\\/]*))$")

  print("Usage: " .. bn .." <mission> <mission_out>")
  print()
  print("  mission             mission file you wish to update")
  print("  mission_out         output mission file")
  print()
  return
end

-------------------------------------------------------------------------------
-- Replacement 
--
-- Here we load the mission file, and iterate through red / blue sides for
-- planes / helos of "Client" type and if their type matches one above, we
-- replace the readios
-------------------------------------------------------------------------------

dofile(mission_file)
for _, side in ipairs({'blue', 'red'}) do
  for country_id,country_data in pairs(mission['coalition'][side]['country']) do
    for country_elem_type, country_elem_data in pairs(country_data) do
      if country_elem_type == "plane" or country_elem_type == "helicopter" then 
        for group_id, group_data in pairs(country_elem_data['group']) do
          group_name = group_data['name']
          for unit_id, unit_data in pairs(group_data['units']) do
            if unit_data['skill'] == 'Client' then
              local radio = radios[unit_data['type']]
              if radio then
                unit_data['Radio'] = radio
              end
            end
          end
        end
      end
    end
  end
end

-------------------------------------------------------------------------------
-- Output
--
-- Just re-serialize the data and write it out
-------------------------------------------------------------------------------

local file, err = io.open(mission_out, 'w')
serialize_sorted(file, 'mission', mission)
file:write()
file:close()
