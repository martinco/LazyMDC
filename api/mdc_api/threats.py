
import json

from contextlib import closing
from deepmerge import always_merger
from flask import jsonify, request

from mdc_api import (
    app, mysql, require_roles, success, fail, bad_request)


###############################################################################
# THREATS
###############################################################################

@app.route('/threats')
def threats():
    """
    Returns a list of squadrons, if show_all then it shows inactive and those
    without missions
    """

    merged = request.args.get('merged', '1') == "1"

    with closing(mysql.connection.cursor()) as cur:

        cur.execute('SELECT base, overrides FROM general where name="threats"')

        row = cur.fetchone()

        if not row:
            return jsonify({})

        base, overrides = row

        # Decode our data
        base = json.loads(base) if base else {}
        overrides = json.loads(overrides) if overrides else {}

        if merged:

            # base is now the DCS + Squadron Defaults
            base = always_merger.merge(base, overrides)

            # Flatten down sources
            output = {}
            for src, items in base.items():
                output.update({k: v for k,v in items.items() if 'active' not in v or v['active'] != 0})

            # Make into an array ordered by name to "just work"
            array = sorted([v for k,v in output.items()], key=lambda x: x['name'])

            # make it have label just to keep jquery sorts happy without having
            # to munge it
            for item in array:
                item['label'] = item.pop("name")

            return jsonify(array)

        return jsonify({
            'base': base,
            'overrides': overrides
        })


@app.route('/threats', methods=['POST'])
@require_roles('squadrons-create')
def threats_post():

    if not request.json:
        return bad_request('invalid json')

    base = request.json.get('base')
    overrides = request.json.get('overrides')

    if not base and not overrides:
        return bad_request('invalid json')

    with closing(mysql.connection.cursor()) as cur:
        try:
            str_base = json.dumps(base)
            str_overrides = json.dumps(overrides)

            cur.execute((
                'INSERT INTO general(name, base, overrides) '
                'VALUES("threats", %s, %s) '
                'ON DUPLICATE KEY UPDATE '
                '   base=%s,overrides=%s'),
                (str_base, str_overrides, str_base, str_overrides))

            mysql.connection.commit()
        except mysql.connection.IntegrityError as err:
            if err.args[0] != 1062:
                raise
            return fail("This squadron name is already in use", "name")

    return success()
