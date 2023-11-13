#!/bin/python
#
# Script to dump out frequencies from:
#   http://132virtualwing.org/index.php/page/freqlist
#

import json
import requests

from lxml import html

r = requests.get('http://132virtualwing.org/index.php/page/freqlist')
html = html.document_fromstring(r.text)
table = html.xpath('//table[@id="freqlist"]')[0]

colors = {}
for row in table:

    color = row[0].text

    if not color:
        continue

    if color not in colors:
        colors[color] = []

    j = 0
    for td in row[1:-1]:

        # Add 1 here for the missing gaps
        j += 1

        if td.tag == 'th':
            continue

        text = td.text

        if not text:
            continue

        colors[color].append({
            "code": "%s %i" % (color, j),
            "label": "%.03f: %s %i" % (float(td.text), color, j),
            "value": "%.03f" % (float(td.text))
        })

# Sort our colors for output
out = []
for k in sorted(colors.keys()):
    out.extend(colors[k])

# Work around https://bugs.python.org/issue16333
for row in json.dumps(out, indent=2).splitlines():
    print row.rstrip()
