# Adding a new theatre

- Ensure mission scripting enabled

  - edit `<DCS>\Scripts\missionScripting.lua`

    - Comment out `--` io / lfs / require / loadlib lines

- I like to have Witchcraft loaded via script (more flexible) so have `<Saved Games>\DCS\Scripts\load-witchcraft.lua`

    ```lua
    dofile(lfs.writedir().."Scripts\\mist_4_3_74.lua")

    witchcraft = {}
    witchcraft.host = "127.0.0.1"
    witchcraft.port = 3005
    dofile(lfs.writedir().."Scripts\\witchcraft.lua")
    witchcraft.start(_G)
    ```
    
- Start up ME / Select Map

    - Add Trigger 

        - MISSION START

        - DO SCRIPT

            ```
            dofile(lfs.writedir()..[[Scripts\\\\load-witchcraft.lua]])
            ```

- Start DCS WitchCraft 

- Fly Mission

- Connect to DCS WitchCraft  LUA Console and run

    ```lua
    local theatre = "Syria"

    local data = {
      [theatre] = {
        ["display_name"] = theatre,
        ["bullseye"] = {
          ["name"] = "Somewhere",
          ["lat"] = 23.24242,
          ["lon"] = 42.24242,
        },
        ["airfields"] = {},
      }
    }
    for coid=0,2,1 do
      for k, v in ipairs(coalition.getAirbases(coid)) do
        local pos = {coord.LOtoLL(v:getPoint())};
        local name = v:getName();
        data[theatre]['airfields'][name] = {
          ["lat"] = pos[1],
          ["lon"] = pos[2],
          ["alt"] = math.floor(pos[3]*3.28084),
        }
      end
    end
    return data
    ```

- Merge in with existing theatres.json

- Update the airfields with ICAO / TCN information where needed
