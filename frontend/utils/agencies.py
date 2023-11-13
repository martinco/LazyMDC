#!/bin/env python

import re
import argparse
import csv
import json


p = argparse.ArgumentParser(
    description="""
    Process a CSV with Agency information to help build mission data for use in
    the MDC toolchain
    """)
p.add_argument(
    'CSV',
    type=argparse.FileType('r'),
    help='CSV file with AGENCY,PRI,SEC,TCN fields')
args = p.parse_args()

reader = csv.DictReader(args.CSV)

agencies = []

for itm in reader:

    if 'AGENCY' not in itm:
        continue

    d = {
        'label': itm['AGENCY']
    }

    n = 0
    for x in ['PRI', 'SEC']:
        if x not in itm or not itm[x]:
            continue

        try:
            val = "%.3f" % float(itm[x].strip())
        except ValueError:
            continue

        d[x.lower()] = val
        n += 1

    if 'TCN' in itm and itm['TCN']:
        m = re.match(r'\s*([0-9]+)\s*([XY])', itm['TCN'])
        if m:
            d['tcn'] = m.group(1) + m.group(2)
            n += 1

    if n:
        agencies.append(d)

print json.dumps({'agencies': agencies}, indent=2)
