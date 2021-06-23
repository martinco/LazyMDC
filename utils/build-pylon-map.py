#!/usr/bin/python3

import inspect
import json
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), 'dcs'))

from dcs import planes, helicopters

PLANES = {
    'F-14B': None,
    'F-16C_50': 'F-16C',
    'FA-18C_hornet': 'FA-18C',
    'A-10C_2': 'A-10C',
    'AV8BNA': None,
    'M-2000C': None,
}

HELOS = {
    'Ka-50': None,
    'Mi-8MT': None,
    'UH-1H': None,
    'SA342L': None,
    'SA342M': None,
}

# Some weapons have very long names, and we want to shorten them
# So map CLSIDs to friendly names

NAME_LIMIT = 27

RENAMES = {
    "{A111396E-D3E8-4b9c-8AC9-2432489304D5}": "AN/AAQ-28 LITENING TGP",
    "LAU3_HE151": "LAU-3 - 19 MK151 HE",  # 33
    "LAU3_HE5": "LAU-3 - 19 MK5 HEAT",  # 33
    "LAU3_WP156": "LAU-3 - 19 MK156 WP",  # 33
    "LAU3_WP1B": "LAU-3 - 19 WTU-1/B WP",  # 35
    "LAU3_WP61": "LAU-3 - 19 MK61 WP",  # 32
    "{BRU33_LAU10}": "BRU-33 LAU-10 - 4 ZUNI MK71",  # 28
    "{BRU33_LAU61}": "BRU-33 LAU-61 - 19 M151",  # 42
    "{BRU33_LAU68}": "BRU-33 LAU-68 - 7 M151",  # 41
    "{BRU33_LAU68_MK5}": "BRU-33 LAU-68 - 7 MK5",  # 40
    "{BRU33_2*LAU10}": "BRU-33 - 2 LAU-10 - 4 ZUNI",  # 32
    "{BRU33_2*LAU61}": "BRU-33 - 2 LAU-61 - 19 M151",  # 46
    "{BRU33_2*LAU68}": "BRU-33 - 2 LAU-68 - 7 M151",  # 45
    "{BRU33_2*LAU68_MK5}": "BRU-33 - 2 LAU-68 - 7 MK5",  # 44
    "LAU-115_2*LAU-127_AIM-9L": "LAU-115 - 2 LAU-127 AIM-9L",  # 44
    "LAU-115_2*LAU-127_AIM-9M": "LAU-115 - 2 LAU-127 AIM-9M",  # 44
    "LAU-115_2*LAU-127_AIM-9X": "LAU-115 - 2 LAU-127 AIM-9X",  # 44
    "LAU-115_LAU-127_AIM-9L": "LAU-115C LAU-127 AIM-9L",  # 41
    "LAU-115_LAU-127_AIM-9M": "LAU-115C LAU-127 AIM-9M",  # 41
    "LAU-115_LAU-127_AIM-9X": "LAU-115C LAU-127 AIM-9X",  # 41
    "{FPU_8A_FUEL_TANK}": "FPU-8A Tank 330 gal",  # 28
    "LAU-105_1*AIM-9L_L": "LAU-105 AIM-9L",  # 32
    "LAU-105_1*AIM-9M_L": "LAU-105 AIM-9M",  # 32
    "LAU-105_2*AIM-9L": "LAU-105 - 2 AIM-9L",  # 36
    "{DB434044-F5D0-4F1F-9BA9-B73027E18DD3}": "LAU-105 - 2 AIM-9M",  # 36
    "{69926055-0DA8-4530-9F2F-C86B157EA9F6}": "LAU-131 - 7 M151 (HE)",  # 35
    "{2AF2EC3F-9065-4de5-93E1-1739C9A71EF7}": "LAU-131 - 7 M156 (WP)",  # 35
    "{DAD45FE5-CFF0-4a2b-99D4-5D044D3BC22F}": "LAU-131 - 7 M257",  # 55
    "{6D6D5C07-2A90-4a68-9A74-C5D0CFFB05D9}": "LAU-131 - 7 M274",  # 47
    "{319293F2-392C-4617-8315-7C88C22AF7C4}": "LAU-131 - 7 MK5 (HE)",  # 34
    "{1CA5E00B-D545-4ff9-9B53-5970E292F14D}": "LAU-131 - 7 MK61 (Practice)",  # 41
    "{D22C2D63-E5C9-4247-94FB-5E8F3DE22B71}": "LAU-131 - 7 Mk1 (Practice)",  # 40
    "{DDCE7D70-5313-4181-8977-F11018681662}": "LAU-131 - 7 WTU1B",  # 42
    "{LAU-131 - 7 AGR-20A}": "LAU-131 - 7 M151 HE APKWS",  # 65
    "{LAU-131 - 7 AGR-20 M282}": "LAU-131 7 M282 - MPP APKWS",  # 66
    "{A021F29D-18AB-4d3e-985C-FC9C60E35E9E}": "LAU-68 - 7 M151 (HE)",  # 34
    "{4F977A2A-CD25-44df-90EF-164BFA2AE72F}": "LAU-68 - 7 M156(WP)",  # 33
    "{647C5F26-BDD1-41e6-A371-8DE1E4CC0E94}": "LAU-68 - 7 M257",  # 54
    "{0877B74B-5A00-4e61-BA8A-A56450BA9E27}": "LAU-68 - 7 M274",  # 46
    "{FC85D2ED-501A-48ce-9863-49D468DDD5FC}": "LAU-68 - 7 MK1 (Practice)",  # 39
    "{174C6E6D-0C3D-42ff-BCB3-0853CB371F5C}": "LAU-68 - 7 MK5 (HE)",  # 33
    "{65396399-9F5C-4ec3-A7D2-5A8F4C1D90C4}": "LAU-68 - 7 MK61 (Practice)",  # 40
    "{1F7136CB-8120-4e77-B97B-945FF01FB67C}": "LAU-68 - 7 WTU1B (Practice)",  # 41
    "LAU_131x3_HYDRA_70_M151": "LAU-131*3 - 7 M151 (HE)",  # 37
    "LAU_131x3_HYDRA_70_M156": "LAU-131*3 - 7 M156 (WP)",  # 37
    "LAU_131x3_HYDRA_70_M257": "LAU-131*3 - 7 M257",  # 57
    "LAU_131x3_HYDRA_70_M274": "LAU-131*3 - 7 M274",  # 49
    "LAU_131x3_HYDRA_70_MK1": "LAU-131*3 - 7 MK1",  # 42
    "LAU_131x3_HYDRA_70_MK5": "LAU-131*3 - 7 MK5",  # 36
    "LAU_131x3_HYDRA_70_MK61": "LAU-131*3 - 7 MK61",  # 43
    "LAU_131x3_HYDRA_70_WTU1B": "LAU-131*3 - 7 WTU1B",  # 44
    "{64329ED9-B14C-4c0b-A923-A3C911DA1527}": "LAU-68*3 - 7 M151 (HE)",  # 36
    "{C2593383-3CA8-4b18-B73D-0E750BCA1C85}": "LAU-68*3 - 7 M156 (WP)",  # 36
    "{E6966004-A525-4f47-AF94-BCFEDF8FDBDA}": "LAU-68*3 - 7 M257",  # 56
    "{4C044B08-886B-46c8-9B1F-AB05B3ED9C1D}": "LAU-68*3 - 7 M274",  # 48
    "{443364AE-D557-488e-9499-45EDB3BA6730}": "LAU-68*3 - 7 MK1",  # 41
    "{9BC82B3D-FE70-4910-B2B7-3E54EFE73262}": "LAU-68*3 - 7 MK5 (HE)",  # 35
    "{C0FA251E-B645-4ce5-926B-F4BC20822F8B}": "LAU-68*3 - 7 MK61",  # 42
    "{A1853B38-2160-4ffe-B7E9-9BF81E6C3D77}": "LAU-68*3 - 7 WTU1B",  # 43
    "{LAU-131x3 - 7 AGR-20A}": "3 LAU-131 M151 - HE APKWS",  # 66
    "{LAU-131x3 - 7 AGR-20 M282}": "3 LAU-131 M282 - MPP APKWS",  # 67
    "LAU-105_1*AIM-9L_R": "LAU-105 AIM-9L",  # 32
    "LAU-105_1*AIM-9M_R": "LAU-105 AIM-9M",  # 32
    "{AV8BNA_AERO1D}": "AERO 1D 300gal Tank ",  # 30
    "{AV8BNA_AERO1D_EMPTY}": "AERO 1D 300gal Tank (Empty)",  # 37
    "{AIM-9M-ON-ADAPTER}": "LAU-7 AIM-9M",  # 30
    "{M2KC_02_RPL541}": "RPL 541 2000L Tank ",  # 30
    "{M2KC_02_RPL541_EMPTY}": "RPL 541 2000L Tank (Empty)",  # 37
    "{M2KC_RPL_522}": "RPL 522 1300L Tank",  # 29
    "{M2KC_RPL_522_EMPTY}": "RPL 522 1300L Tank (Empty)",  # 37
    "{M2KC_08_RPL541}": "RPL 541 2000L Tank ",  # 30
    "{M2KC_08_RPL541_EMPTY}": "RPL 541 2000L Tank (Empty)",  # 37
    "M261_MK151": "M261 - 19 MK151 HE",  # 32
    "M261_MK156": "M261 - 19 MK156 WP",  # 32
    "XM158_M151": "XM158 - 7 M151 HE",  # 31
    "XM158_M156": "XM158 - 7 M156 WP",  # 31
    "XM158_M257": "XM158 - 7 M257",  # 51
    "XM158_M274": "XM158 - 7 M274",  # 43
    "XM158_MK1": "XM158 - 7 MK1 Practice",  # 36
    "XM158_MK5": "XM158 - 7 MK5 HE",  # 30
}
RENAME_CLS = {}


def map_output(output, plane_cls):

    for pyl in plane_cls.pylons:

        pyl_name = "Pylon%s" % pyl
        try:
            pyl_cls = getattr(plane_cls, pyl_name)
        except Exception:
            continue

        output[pyl] = {}
        for member in inspect.getmembers(pyl_cls, lambda x: type(x) == tuple):
            _, tp = member
            template_name = tp[1]['name']

            if tp[1]['clsid'] in RENAMES:
                template_name = RENAMES[tp[1]['clsid']]

            if len(template_name) > NAME_LIMIT:
                if tp[1]['clsid'] not in RENAME_CLS:
                    print('"{}": "{}",  # {}'.format(
                        tp[1]['clsid'], template_name, len(template_name)),
                        file=sys.stderr)
                    RENAME_CLS[tp[1]['clsid']] = True

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
