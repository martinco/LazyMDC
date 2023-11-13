
import json

from contextlib import closing
from deepmerge import always_merger
from flask import jsonify, request

from mdc_api import (
    app, mysql, require_roles, success, bad_request)


@app.route('/theatres')
def get_theatres():

    merged = request.args.get('merged', '1') != "0"
    theatres = {}

    with closing(mysql.connection.cursor()) as cur:

        cur.execute((
            'SELECT idx, theatre, display_name, next_airfield_id, data, overrides '
            'FROM theatres '
            'ORDER BY display_name'))

        for row in cur:
            idx, theatre, display_name, next_id, data, overrides = row

            base = json.loads(data) if data else {}
            overrides = json.loads(overrides) if overrides else {}

            if merged:
                theatres[theatre] = always_merger.merge(base, overrides)
            else:
                theatres[theatre] = {
                    'next_airfield_id': next_id,
                    'base': base,
                    'overrides': overrides,
                }

            theatres[theatre]['display_name'] = display_name
            theatres[theatre]['id'] = idx

        return jsonify(theatres)


@app.route('/theatres/<int:tid>')
def get_theatre(tid):

    merged = request.args.get('merged', '1') != "0"

    with closing(mysql.connection.cursor()) as cur:

        cur.execute((
            'SELECT idx, theatre, display_name, next_airfield_id, data, overrides '
            'FROM theatres '
            'WHERE idx=%s '
            'ORDER BY display_name'), (tid, ))

        for row in cur:
            idx, theatre, display_name, next_id, data, overrides = row

            base = json.loads(data) if data else {}
            overrides = json.loads(overrides) if overrides else {}

            if merged:
                data = always_merger.merge(base, overrides)
            else:
                data = {
                    'base': base,
                    'overrides': overrides,
                }

            data['next_airfield_id'] = next_id
            data['display_name'] = display_name
            data['name'] = theatre
            data['id'] = idx

            return jsonify(data)

    # Invalid theatre
    return bad_request('invalid theatre: %i' % tid)


@app.route('/theatres/<int:tid>', methods=['POST'])
@require_roles('theatre-create')
def set_theatre(tid):

    if not request.json:
        return bad_request('invalid json')

    if (not request.json['theatre_id']
            or (not request.json['base'] and not request.json['overrides'])
            or not isinstance(request.json['theatre_id'], int)):
        return bad_request('invalid json')

    if request.json['theatre_id'] != tid:
        return bad_request('request theatre_id does not match URL')

    # Build the parameters
    sets = []
    values = []

    base = request.json.get('base')
    if base:
        sets.append('data=%s')
        values.append(json.dumps(base))

    overrides = request.json.get('overrides')
    if overrides:
        sets.append('overrides=%s')
        values.append(json.dumps(overrides))

    display_name = request.json.get('display_name')
    if display_name:
        sets.append('display_name=%s')
        values.append(display_name)

    if not sets:
        return success()

    with closing(mysql.connection.cursor()) as cur:

        values.append(tid)

        cur.execute(
            'UPDATE theatres SET %s WHERE idx=%%s' % (",".join(sets)),
            values)

        mysql.connection.commit()

        return success()


@app.route('/theatres', methods=['POST'])
@require_roles('theatre-create')
def post_theatres():

    if not request.json:
        return bad_request('invalid json')

    if not all(k in request.json for k in ("display_name", "data")):
        return bad_request('invalid json')

    if not request.json['data']['theatre']:
        return bad_request('invalid json')

    with closing(mysql.connection.cursor()) as cur:

        cur.execute((
            'INSERT INTO theatres(theatre, display_name, data) '
            'VALUES (%s, %s, %s)'),
            (
                request.json['data']['theatre'],
                request.json['display_name'],
                json.dumps(request.json['data']),
            ))

        mysql.connection.commit()

    return success()
