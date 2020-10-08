#!/bin/env python

import json
import requests
from lxml import html

r = requests.get('http://132virtualwing.org/index.php/page/roster')
document = html.document_fromstring(r.text)

# Airframes
AIRFRAMES = {
    '108th': 'F-14B',
    '494th': 'FA-18C',
}

# There is no current single location for bort info
BORTS = {
    '108th': {
        'Entropy': 201,
        'Pikes': 202,
        'DeMonteur': 203,
        'Evilivan': 204,
        'Level': 205,
        'InFlames': 206,
        'FurFace': 207,
        'Exon': 208,
        'Bear': 209,
        'Fritter': 210,
    },
    '494th': {
        'Artur': 322,
        'Ashilta': 304,
        'Bolo': 316,
        'Evo': 320,
        'Gumidek': 318,
        'Hamster': 310,
        'Hitch': 311,
        'Kimkiller': 308,
        'Level': 313,
        'Lion': 313,
        'Photun': 314,
        'Teddy': 317,
        'Thumper': 302,
        'Worg': 312,
    },
}

# Iterate each squadron
pilots = {}
for sqn in document.findall('.//div[@class="squadron"]'):
    sqn_name = sqn.find('div[@class="sq_info"]').text.split()[0]
    for pilot in sqn.findall('.//div[@class="pilotname"]'):
        pilot_name = pilot.text.strip();

        if pilot_name not in pilots:
            pilots[pilot_name] = {}

        if sqn_name not in AIRFRAMES:
            continue

        if sqn_name not in BORTS:
            continue

        if pilot_name not in BORTS[sqn_name]:
            continue

        pilots[pilot_name][AIRFRAMES[sqn_name]] = BORTS[sqn_name][pilot_name]

# Format to how jquery wants it so we can use as is
output = []
for pilot, data in pilots.items():
    data['label'] = pilot
    output.append(data)

print(json.dumps(output, sort_keys=True, indent=2))
