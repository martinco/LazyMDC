# Adding a new Mission

## Navpoints

Navpoints come from the CF file, at the moment CF has a nice x,y to lat,long
converter that I haven't had much chance to investigate and implement directly

As such, import the miz to CF and save it

```bash
./navpoints.py <Path/URL to .cf> > root.json
```

## Presets

Presets are pulled from the miz directly - you might see alerts if there are
airframes with varying presets, in such case it'll just pick the first one it
encounters

```bash
./presets_from_mission_xml.lua <URL to extracted miz> > presets.json

e.g: https://raw.githubusercontent.com/132nd-vWing/OPAR/master/
```

## Agencies

Agencies are normally created from various sources so there isn't an ideal root source.

If we order a CSV file with the following titles (Other columes are ignored):

```
AGENCY,PRI,SEC,TCN
AR606 - Texaco 1 - KC-135, 223.25, 121.22, 53Y
```

These can be imported as follows

```
./agencies.py <Agencies CSV> > agencies.json
```

## Merge

Label the field appropriate

```bash
jq -sS '{"132nd - OPAR": add}' root.json presets.json agencies.json > mission.json
```

# Merge (2)

Now we just copy teh dict and merge to the combined mission_data.json

```
jq -sS 'add' mission.json ../data/mission_data.json > new_mission_data.json
mv new_mission_data.json ../data/mission_data.json
```

