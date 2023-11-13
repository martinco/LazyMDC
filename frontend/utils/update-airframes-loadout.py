#!/bin/env python

import sys
import json
import argparse

if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('AIRFRAMES', help='existing airframes.json', type=argparse.FileType('r'))
    p.add_argument('UPDATES', help='new pylon information from PyDCS', type=argparse.FileType('r'))

    args = p.parse_args()

    data = json.load(args.AIRFRAMES)

    updates = json.load(args.UPDATES)

    for airframe, loadout in updates.items():
        if airframe not in data:
            print >> sys.stderr, "Not found:", airframe
            continue
        data[airframe]['loadout'] = loadout

    print(json.dumps(data, indent=2, sort_keys=True, separators=(',', ': ')))
