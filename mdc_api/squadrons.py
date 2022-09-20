
import json
import re
import validators

from contextlib import closing
from deepmerge import always_merger
from flask import jsonify, request

from flask_jwt_extended import (
    jwt_optional, get_jwt_identity, get_jwt_claims)

from mdc_api import (
    app, mysql, require_roles, success, fail, bad_request)


SQUADRON_NAME_RE = re.compile(r'^[a-z0-9_ -]{4,}$', re.IGNORECASE)
SQL_HEADER_RE = re.compile(r'^[A-Za-z0-9_-]+$')


###############################################################################
# FUNCTIONS
###############################################################################


def _modify_member(cur, change):
    id = change.get('id')
    if not id or not isinstance(id, int):
        return

    changes = change.get('changes', [])
    if not changes or not isinstance(changes, dict):
        return

    keys = []
    values = []

    for key, value in changes.items():
        if not SQL_HEADER_RE.match(key):
            continue

        keys.append("%s=%%s" % key)
        values.append(value)

    if not keys or not values:
        return

    # Lastly, add our idx to args
    values.append(id)

    cur.execute(
        'UPDATE squadron_members SET %s WHERE idx=%%s' % (",".join(keys)),
        values)


def _create_member(cur, sqn_id, change):

    changes = change.get('changes', [])
    if not changes or not isinstance(changes, dict):
        return

    keys = []
    values = []

    for key, value in changes.items():
        if not SQL_HEADER_RE.match(key):
            continue

        if key == 'squadron_id':
            continue

        keys.append(key)
        values.append(value)

    if not keys or not values:
        return

    # Ensrue we have a name provided
    if 'name' not in keys:
        return

    keys.append('squadron_id')
    values.append(sqn_id)

    cur.execute(
        'INSERT INTO squadron_members(%s) VALUES (%s)' % (
            ",".join(keys),
            ",".join(['%s'] * len(keys))),
        values)


def _delete_member(cur, change):
    id = change.get('id')
    if not id or not isinstance(id, int):
        return

    cur.execute('DELETE FROM squadron_members WHERE idx=%s', (id,))


def lookup_squadron_members(sqn_id, member_id=None, inactive=False):

    with closing(mysql.connection.cursor()) as cur:

        query = (
            'SELECT idx, name, bort_18, bort_14, active '
            'FROM squadron_members '
            'WHERE squadron_id = %s ')

        args = [sqn_id]

        if member_id:
            query += 'AND idx = %s '
            args.append(member_id)

        if not inactive:
            query += 'AND active=1 '

        query += 'ORDER BY name'

        cur.execute(query, args)

        members = []
        for row in cur:
            idx, name, bort_18, bort_14, active = row

            member = {
                'id': idx,
                'name': name,
            }

            if inactive:
                member['active'] = active == 1

            borts = {}
            if bort_18:
                borts['FA-18C'] = bort_18
            if bort_14:
                borts['F-14B'] = bort_14

            if borts:
                member['borts'] = borts

            members.append(member)

        if not members:
            return []

        if member_id:
            return members[0]

        return members


def lookup_squadron_missions(sid, show_all=False):

    missions = []

    with closing(mysql.connection.cursor()) as cur:

        cur.execute((
            'SELECT '
            '   sm.idx, sm.name, sm.is_default, sm.active '
            'FROM squadron_missions AS sm '
            'WHERE sm.squadron_id=%s '
            'ORDER BY name'), (sid,))

        for row in cur:
            idx, name, default, active = row
            if not active and not show_all:
                continue
            missions.append({
                'id': idx,
                'name': name,
                'active': active == 1,
                'is_default': default == 1,
            })

    return missions


def lookup_squadron_callsigns(sid):
    with closing(mysql.connection.cursor()) as cur:

        cur.execute((
            'SELECT s.name, sc.callsigns '
            'FROM squadrons AS s '
            'LEFT JOIN squadron_callsigns AS sc '
            'ON sc.squadron_id = s.idx '
            'WHERE s.idx = %s'), (sid,))

        row = cur.fetchone()
        if not row:
            return []

        return json.loads(row[1]) if row[1] else []


def lookup_squadron_freqs(sid):
    with closing(mysql.connection.cursor()) as cur:

        cur.execute((
            'SELECT s.name, sf.frequencies '
            'FROM squadrons AS s '
            'LEFT JOIN squadron_frequencies AS sf '
            'ON sf.squadron_id = s.idx '
            'WHERE s.idx = %s'), (sid,))

        row = cur.fetchone()
        if not row:
            return {}

        return json.loads(row[1]) if row[1] else {}

###############################################################################
# SQUADRONS
###############################################################################


@app.route('/squadrons')
@jwt_optional
def squadrons():
    """
    Returns a list of squadrons, if show_all then it shows inactive and those
    without missions
    """

    show_all = request.args.get('all', '0') == "1"
    show_editable = request.args.get('editable', '0') == "1"
    identity = get_jwt_identity()

    try:
        editable = get_jwt_claims().get('roles', {}).get('squadron-edit', [])
    except (KeyError, AttributeError):
        editable = []

    # If we request editable, but have no identity, nothing to do
    if show_editable and not identity:
        return jsonify([])

    with closing(mysql.connection.cursor()) as cur:

        cur.execute((
            'SELECT s.idx, s.name, s.url, s.is_default, s.active, COUNT(sm.idx) AS missions '
            'FROM squadrons s '
            '   LEFT JOIN squadron_missions sm '
            '   ON s.idx = sm.squadron_id '
            '       AND sm.active=1 '
            'GROUP BY s.idx '
            'ORDER BY s.name'))

        # Make into dict
        retval = [];

        cols = [col[0] for col in cur.description]
        for row in cur.fetchall():

            row = dict(zip(cols, row))

            # Don't show inactive
            if row['active'] == 0 and not show_all:
                continue

            # Don't show squadrons with no missions
            if row['missions'] == 0 and not show_all:
                continue

            # If we're editable then don't show if we haven't got rights
            if show_editable:
                if row['idx'] not in editable and 0 not in editable:
                    continue

            retval.append(row)

        return jsonify(retval)


@app.route('/squadrons', methods=['POST'])
@require_roles('squadrons-create')
def create_squadron():

    if not request.json:
        return bad_request('invalid json')

    default = request.json.get('default')
    if default:
        with closing(mysql.connection.cursor()) as cur:
            cur.execute(
                'UPDATE squadrons SET is_default=IF(idx=%s, 1, 0)', (default,))
            mysql.connection.commit()

    create = request.json.get('create')
    if create:
        name = create.get('name', '').strip()
        url = create.get('url', '').strip()

        if not name:
            return bad_request('invalid json')

        if not SQUADRON_NAME_RE.match(name):
            return fail((
                'Invalid squadron name, '
                'must be at least 4 alpha numeric characters'), 'name')

        if url and not validators.url(url):
            return fail('Invalid URL', 'url')

        with closing(mysql.connection.cursor()) as cur:
            try:
                cur.execute(
                    'INSERT INTO squadrons(name, url) VALUES(%s, %s)',
                    (name, url))
                mysql.connection.commit()
            except mysql.connection.IntegrityError as err:
                if err.args[0] != 1062:
                    raise
                return fail("This squadron name is already in use", "name")

    return success()


@app.route('/squadrons/<int:sid>')
def get_squadron(sid):

    with closing(mysql.connection.cursor()) as cur:

        cur.execute((
            'SELECT idx, name, url '
            'FROM squadrons '
            'WHERE idx=%s'), (sid,))

        row = cur.fetchone()

        if not row:
            return fail("Invalid squadron: %i" % sid)

        row = dict(zip(['id', 'name', 'url'], row))

        row['members'] = lookup_squadron_members(sid)
        row['missions'] = lookup_squadron_missions(sid)
        row['callsigns'] = lookup_squadron_callsigns(sid)
        row['freqs'] = lookup_squadron_freqs(sid)

        return jsonify(row)


@app.route('/squadrons/<int:sid>', methods=['post'])
@require_roles('squadron-edit')
def post_squadron(sid):

    if not request.json:
        return bad_request('invalid json 1')

    r_sid = request.json.get('squadron')
    if not r_sid or r_sid != sid:
        return bad_request('invalid json 2')

    update = request.json.get('update')
    if not update:
        return bad_request('invalid json 3')

    keys = []
    values = []
    for key, value in update.items():
        if not SQL_HEADER_RE.match(key):
            continue

        keys.append("%s=%%s" % key)
        values.append(value)

    values.append(sid)

    with closing(mysql.connection.cursor()) as cur:

        cur.execute(
            'UPDATE squadrons SET {keys} WHERE idx=%s'.format(
                keys=','.join(keys)
            ), values)

        mysql.connection.commit()

    return success()


@app.route('/squadrons/<int:sid>', methods=['delete'])
@require_roles('squadrons-create')
def delete_squadron(sid):

    with closing(mysql.connection.cursor()) as cur:

        cur.execute('DELETE FROM squadrons WHERE idx=%s', (sid,))
        mysql.connection.commit()

    return success()


###############################################################################
# MEMBERS
###############################################################################


@app.route('/squadrons/<int:sid>/members')
def get_squadron_members(sid):
    include_inactive = request.args.get('inactive', '0') == "1"
    return jsonify(lookup_squadron_members(sid, inactive=include_inactive))


@app.route('/squadrons/<int:sid>/members', methods=['POST'])
@require_roles('squadron-edit', 'sid')
def post_squadron_members(sid):

    """
    Takes a list of changes:
    [
        {
            type: modify,
            id: <int:uid>,
            changes: {
                "bort_18": 124,
                "bort_14": 12
            }
        },
        {
            type: delete,
            id: <int:uid>
        },
        {
            type: create,
            name: 'foo',
            changes: {
                "bort_14": 12
            }
        },
        ...
    ]
    """

    if not request.json:
        return bad_request('invalid json')

    changes = request.json.get('changes', [])
    if not changes:
        return bad_request()

    with closing(mysql.connection.cursor()) as cur:

        for change in changes:
            ctype = change.get('type')
            if ctype == "modify":
                _modify_member(cur, change)
            elif ctype == "create":
                _create_member(cur, sid, change)
            elif ctype == "delete":
                _delete_member(cur, change)

        mysql.connection.commit()

    return success()


###############################################################################
# THEATRES
###############################################################################


@app.route('/squadrons/<int:sid>/theatres/<int:tid>')
def get_squadron_theatre(sid, tid):

    with closing(mysql.connection.cursor()) as cur:

        cur.execute((
            'SELECT t.idx, theatre, display_name, data, '
            '   t.overrides, st.overrides AS sqn_overrides '
            'FROM theatres AS t '
            'LEFT JOIN squadron_theatres AS st '
            '   ON t.idx = st.theatre_id '
            'AND st.squadron_id = %s '
            'WHERE t.idx=%s'), (sid, tid))

        row = cur.fetchone()

        if not row:
            fail("doesn't exist")

        idx, theatre, display_name, base, overrides, soverrides = row

        # Decode our data
        base = json.loads(base) if base else {}
        overrides = json.loads(overrides) if overrides else {}
        soverrides = json.loads(soverrides) if soverrides else {}

        # base is now the DCS + Squadron Defaults
        base = always_merger.merge(base, overrides)

        return jsonify({
            'base': base,
            'overrides': soverrides,
            'id': tid,
            'display_name': display_name,
        })


@app.route('/squadrons/<int:sid>/theatres/<int:tid>', methods=['POST'])
@require_roles('squadron-edit', 'sid')
def post_squadron_theatre(sid, tid):

    if not request.json:
        return bad_request()

    squadron = request.json.get('squadron')
    theatre = request.json.get('theatre')
    overrides = request.json.get('overrides')

    if (
            not squadron or squadron != sid
            or not theatre or theatre != tid
            or not overrides or not isinstance(overrides, dict)):

        return bad_request()

    overrides_json = json.dumps(overrides)

    with closing(mysql.connection.cursor()) as cur:

        cur.execute((
            'INSERT INTO squadron_theatres '
            '   (squadron_id, theatre_id, overrides, last_modified) '
            'VALUES (%s, %s, %s, NOW()) '
            'ON DUPLICATE KEY UPDATE overrides=%s,last_modified=NOW()'),
            (sid, tid, overrides_json, overrides_json))

        mysql.connection.commit()

    return success()


###############################################################################
# FREQUENCIES
###############################################################################


@app.route('/squadrons/<int:sid>/frequencies')
def get_squadron_freqs(sid):

    return jsonify({
        'frequencies': lookup_squadron_freqs(sid)
    })


@app.route('/squadrons/<int:sid>/frequencies', methods=['POST'])
@require_roles('squadron-edit', 'sid')
def post_squadron_freqs(sid):

    if not request.json:
        return bad_request('invalid json')

    id = request.json.get('id')
    if not id or id != sid:
        return bad_request('invalid json')

    frequencies = request.json.get('frequencies', [])
    if not frequencies:
        return bad_request()

    frequencies_json = json.dumps(frequencies)

    with closing(mysql.connection.cursor()) as cur:

        cur.execute((
            'INSERT INTO squadron_frequencies (squadron_id, frequencies) '
            'VALUES (%s, %s) '
            'ON DUPLICATE KEY UPDATE frequencies=%s'),
            (sid, frequencies_json, frequencies_json))

        mysql.connection.commit()

    return success()

###############################################################################
# CALLSIGNS
###############################################################################


@app.route('/squadrons/<int:sid>/callsigns')
def get_squadron_callsigns(sid):

    return jsonify({
        'name': sid,
        'callsigns': lookup_squadron_callsigns(sid),
    })


@app.route('/squadrons/<int:sid>/callsigns', methods=['POST'])
@require_roles('squadron-edit', 'sid')
def post_squadron_callsigns(sid):

    if not request.json:
        return bad_request('invalid json')

    id = request.json.get('id')
    if not id or id != sid:
        return bad_request('invalid json')

    callsigns = request.json.get('callsigns')
    if callsigns is None:
        return bad_request()

    callsigns_json = json.dumps(callsigns)

    with closing(mysql.connection.cursor()) as cur:

        cur.execute((
            'INSERT INTO squadron_callsigns (squadron_id, callsigns) '
            'VALUES (%s, %s) '
            'ON DUPLICATE KEY UPDATE callsigns=%s'),
            (sid, callsigns_json, callsigns_json))

        mysql.connection.commit()

    return success()


###############################################################################
# MISSIONS
###############################################################################


@app.route('/squadrons/<int:sid>/missions')
def get_squadron_missions(sid):

    show_all = request.args.get('all', '0') == "1"

    output = {
        'id': sid,
        'missions': lookup_squadron_missions(sid, show_all),
    }

    return jsonify(output)


@app.route('/squadrons/<int:sid>/missions', methods=['post'])
@require_roles('squadron-edit', 'sid')
def post_squadron_mission_create(sid):
    '''
    Post to create a new mission, on success, we reutrn the mission id
    On failure, we return a message
    '''

    if not request.json:
        return bad_request('invalid json 1')

    r_sid = request.json.get('squadron')
    if not r_sid or r_sid != sid:
        return bad_request('invalid json 2 %s %s' % (r_sid, sid))

    # This is either a create or set a default

    default = request.json.get('default')
    if default:
        with closing(mysql.connection.cursor()) as cur:
            cur.execute((
                'UPDATE squadron_missions '
                'SET is_default=IF(idx=%s, 1, 0) '
                'WHERE squadron_id=%s'), (default, sid))

            mysql.connection.commit()

    create = request.json.get('create')
    if create:
        # Require base and display_name
        base = create.get('base')
        display_name = create.get('display_name')
        theatre = base.get('theatre')

        if not base or not display_name or not theatre:
            return bad_request('invalid json 3')

        # Ensure no mission exists with the same name
        with closing(mysql.connection.cursor()) as cur:
            cur.execute((
                'SELECT 1 '
                'FROM squadron_missions '
                'WHERE squadron_id = %s '
                '   AND name = %s'), (sid, display_name))

            if cur.rowcount:
                return jsonify({
                    'success': False,
                    'message': 'name already in use',
                })

        # Make a new record
        with closing(mysql.connection.cursor()) as cur:

            # Find our theatre_id
            cur.execute(
                'SELECT idx FROM theatres WHERE theatre=%s',
                (theatre,))

            row = cur.fetchone()
            if not row:
                return fail("Invalid theatre: %s" % theatre)

            cur.execute((
                'INSERT INTO squadron_missions '
                '   (squadron_id, theatre_id, name, base) '
                'VALUES (%s, %s, %s, %s)'), (
                sid, row[0], display_name, json.dumps(base)))

            mysql.connection.commit()

            return jsonify({
                'success': True,
                'mission': cur.lastrowid,
            })

    return success();


@app.route('/squadrons/<int:sid>/missions/<int:mid>')
def get_squadron_mission(sid, mid):

    # Return merged view rather than split out overrides
    merged = request.args.get('merged', '1') == "1"

    with closing(mysql.connection.cursor()) as cur:

        cur.execute((
            'SELECT '
            '   sm.idx, sm.name, '
            '   t.data, t.overrides, '
            '   st.overrides, '
            '   sm.base, sm.overrides '
            'FROM squadron_missions AS sm '
            'LEFT JOIN squadron_theatres AS st '
            '   ON st.squadron_id = sm.squadron_id '
            '   AND st.theatre_id = sm.theatre_id '
            'JOIN theatres AS t '
            '   ON sm.theatre_id = t.idx '
            'WHERE sm.squadron_id=%s '
            '   AND sm.idx=%s '
            'ORDER BY name'), (sid, mid))

        row = cur.fetchone()
        if not row:
            return bad_request()

        idx, name, t_base, t_overrides, st_overrides, m_base, m_overrides = row

        # Theatre Base
        base = json.loads(t_base) if t_base else {}

        # Theatre Overrides
        if t_overrides:
            always_merger.merge(base, json.loads(t_overrides))

        # Sqaudron Theatre Overrides
        if st_overrides:
            always_merger.merge(base, json.loads(st_overrides))

        # Finally, we bring in the mission base, which can clobber (e.g
        # bullseye), or add new keys (mission_airfields)
        if m_base:
            always_merger.merge(base, json.loads(m_base))

        overrides = json.loads(m_overrides) if m_overrides else {}

        if merged:
            always_merger.merge(base, overrides)

            # When we are merged, we merge mission_airfields and airfields
            new_airfields = dict()
            for k, v in base['airfields'].items():

                name = v['dcs_name']
                if 'display_name' in v:
                    name = v['display_name']

                new_airfields[name] = v

            if 'mission_airfields' in base:
                for k, v in base['mission_airfields'].items():
                    display_name = k
                    if 'display_name' in v:
                        display_name = v['display_name']
                    elif 'dcs_name' in v:
                        display_name = v['dcs_name']

                    new_airfields[display_name] = v

                del(base['mission_airfields'])

            base['airfields'] = new_airfields

            if 'navpoints' in base:
                # We also need to merge navpoints as they may be overridden to
                # allow all sides to use them, and between trigger, custom and
                # navpoints on the admin side and the frontend doesn't care the
                # source

                new_navpoints = []

                for np_type, sides in base['navpoints'].items():
                    for side, points in sides.items():
                        for np_name, np_data in points.items():

                            if not isinstance(np_data, dict):
                                continue

                            if 'hide' in np_data and np_data['hide'] == 1:
                                continue

                            if 'side' not in np_data:
                                np_data['side'] = side

                            # We want to know the real side in the
                            # side for say the A-10 DataLoader if we
                            # override a blue nav_point to be selectable by
                            # red and blue, a red A10 will need to manually
                            # enter the point
                            np_data['miz_side'] = side

                            label = np_name
                            if 'name' in np_data:
                                label = np_data['name']

                            np_data['label'] = label
                            new_navpoints.append(np_data)

                base['navpoints'] = new_navpoints

        response = {
            'id': idx,
            'squadron': sid,
            'name': name,
            'data': base,
        }

        if not merged:
            response['overrides'] = overrides

        return jsonify(response)

    return bad_request()


@app.route('/squadrons/<int:sid>/missions/<int:mid>', methods=['post'])
@require_roles('squadron-edit', 'sid')
def post_squadron_mission(sid, mid):

    if not request.json:
        return bad_request('invalid json 1')

    r_sid = request.json.get('squadron')
    if not r_sid or r_sid != sid:
        return bad_request('invalid json 2')

    r_mid = request.json.get('mission')
    if not r_mid or r_mid != mid:
        return bad_request('invalid json 3')

    # What updates
    update = request.json.get('update')
    if update:
        keys = []
        values = []
        for key, value in update.items():
            if not SQL_HEADER_RE.match(key):
                continue

            # base and overrides are json
            if key in ["base", "overrides"]:
                value = json.dumps(value)

            keys.append("%s=%%s" % key)
            values.append(value)

        values.append(mid)
        values.append(sid)

        with closing(mysql.connection.cursor()) as cur:

            cur.execute(
                'UPDATE squadron_missions SET {keys} WHERE idx=%s AND squadron_id=%s'.format(
                    keys=','.join(keys)
                ), values)

            mysql.connection.commit()

    return success()


@app.route('/squadrons/<int:sid>/missions/<int:mid>', methods=['delete'])
@require_roles('squadron-edit', 'sid')
def delete_squadron_mission(sid, mid):
    with closing(mysql.connection.cursor()) as cur:
        cur.execute((
            'DELETE FROM squadron_missions '
            'WHERE idx=%s AND squadron_id=%s'), (mid,sid))
        mysql.connection.commit()

    return success()
