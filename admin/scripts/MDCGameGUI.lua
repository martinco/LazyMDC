---------------------------------------
-- Initialization
---------------------------------------

_G.MDC = {}

MDC.info = function(msg, ...)
  log.write("MDC-Net", log.INFO, msg, unpack({...}))
end

MDC.info("Initializing MDC Hooks")

---------------------------------------
-- Paths for socket / JSON
---------------------------------------

local JSON = loadfile("Scripts\\JSON.lua")
if JSON == nil then
  local msg = "Failed to load JSON"
  MDC.info(msg)
  error(msg)
end

JSON = JSON()

MDC.info("Imports Completed")

--------------------------------------
-- Utils
--------------------------------------

MDC.cb = {}

MDC.cb.onMissionLoadEnd = function()

  -- load
  local retstr, err = net.dostring_in(
  'mission',
  "a_do_script('dofile(lfs.writedir()..\"Scripts\\\\\\\\MDC.lua\"); ')")

  if err then
    MDC.info("Mission command failed: see debug log: ".. retstr .. " : " ..err)
  end


end

--------------------------------------
-- Initialize Callbacks
--------------------------------------

DCS.setUserCallbacks(MDC.cb)
