#!/bin/env python

import json
import inspect

from dcs import planes, helicopters

PLANES = {
    'F-14B': None,
    'F-16C_50': 'F-16C',
    'FA-18C_hornet': 'FA-18C',
    'A-10C': None,
}

HELOS = {
    'Ka-50': None,
    'Mi-8MT': None,
    'UH-1H': None,
}


def map_output(output, plane_cls):
    for pyl in plane_cls.pylons:

        output[pyl] = {}

        pyl_name = "Pylon%s" % pyl
        pyl_cls = getattr(plane_cls, pyl_name)

        for member in inspect.getmembers(pyl_cls, lambda x: type(x) == tuple):
            _, tp = member
            output[pyl][tp[1]['name']] = {
                'weight': tp[1]['weight'],
                'clsid': tp[1]['clsid'],
            }

if __name__ == "__main__":

    output = {}

    for plane in PLANES:
        if plane not in planes.plane_map:
            continue
        name = PLANES[plane] or plane
        output[name] = {}
        map_output(output[name], planes.plane_map[plane])

    for helo in HELOS:
        if helo not in helicopters.helicopter_map:
            continue

        name = HELOS[helo] or helo
        output[name] = {}
        map_output(output[name], helicopters.helicopter_map[helo])

    print(json.dumps(output, indent=2, sort_keys=True, separators=(',', ': ')))
