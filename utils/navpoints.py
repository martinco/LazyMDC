#!/bin/python
#
# Downloads the given Combat Flite files and populates the navpoints with any
# RefPoints and the center of any AAR Orbits for the Theatre found
#

import sys
import json
import requests
import xml.etree.ElementTree as ET
import zipfile

from geographiclib.geodesic import Geodesic
from io import BytesIO

GEOD = Geodesic.WGS84


if __name__ == '__main__':

    if len(sys.argv) != 2:
        print "Usage: %s [CombatFlite URL]" % sys.argv[0]
        sys.exit()

    source = sys.argv[1]

    if source[0:7] == 'file://':
        cf_bytes = open(source[7:])
    else:
        cf_req = requests.get(source)
        cf_bytes = BytesIO(cf_req.content)

    root = None

    with zipfile.ZipFile(cf_bytes) as z:
        with z.open('mission.xml') as m:
            root = ET.parse(m).getroot()

    data = {
        'theatre': root.find('Theater').text,
        'navpoints': [],
    }

    points = data['navpoints']

    # Reference points from mission XML
    ref_points = root.findall(".//RefPoint")
    for x in ref_points:
        new_ref = {
            "label": x.find('Name').text,
            "lat": float(x.find('Lat').text),
            "lon": float(x.find('Lon').text),
        }

        if new_ref in points:
            print "FOUND DUPE: %s" % new_ref
            continue

        points.append(new_ref)

    # Orbits from Mission XML
    orbits = root.findall(".//Orbit[Type='AAR']")
    for x in orbits:

        lat = float(x.find('Lat2').text)
        lon = float(x.find('Lon2').text)
        brg = float(x.find('Brg').text)
        leg = float(x.find('Leg').text)
        width = float(x.find('Width').text)

        # Center is at  leg/2 on brg from lat, lon
        leg_mid = GEOD.Direct(lat, lon, brg, leg/2*1852)
        orb_mid = GEOD.Direct(
            leg_mid['lat2'], leg_mid['lon2'], brg-90, width/2*1852)

        points.append({
            "label": x.find('Name').text,
            "lat": orb_mid['lat2'],
            "lon": orb_mid['lon2'],
        })

    # Sort navpoints based on Label
    data['navpoints'] = sorted(data['navpoints'], key=lambda x: x['label'])

    # Work around https://bugs.python.org/issue16333
    for line in json.dumps(data, indent=2).splitlines():
        print line.rstrip()
