
import hashlib
import os

from contextlib import closing
from functools import wraps

from flask import request, jsonify

from flask_jwt_extended import (
    JWTManager, jwt_required, jwt_optional, create_access_token,
    get_jwt_identity, get_jwt_claims, verify_jwt_in_request,
    set_access_cookies, unset_access_cookies)

from mdc_api import app, mysql
from mdc_api.utils import bad_request, fail, denied, success


# JWT Manager
jwt = JWTManager(app)


# Role Check Decorator
def require_roles(*required_roles):

    # Ensure each args is a string
    if not all(isinstance(elem, str) for elem in required_roles):
        raise Exception('Usage: require_roles(<str>, <str>, ...)')

    def decorator(f):
        @wraps(f)
        def check_roles(*args, **kwargs):

            # Verify we're JWTd up
            verify_jwt_in_request()

            user_roles = get_jwt_claims().get('roles', [])

            if not list(required_roles) <= user_roles:
                return denied()

            return f(*args, **kwargs)
        return check_roles
    return decorator


@app.route('/user/login', methods=['POST'])
def login():

    # Ensure we have username, password
    if not request.json:
        return bad_request('invalid json')

    username = request.json.get('username', None).strip()
    password = request.json.get('password', None)

    if not username or not password:
        return bad_request('invalid parameters')

    # Lookup user
    with closing(mysql.connection.cursor()) as cur:
        cur.execute((
            'SELECT idx, salt, iter, password, password_reset '
            'FROM users where username=%s'), (username,))

        res = cur.fetchone()
        if not res:
            return fail("Invalid username or password")

        idx, salt, iters, pwhash, reset = res

        dk = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode(),
            bytes.fromhex(salt),
            iters)

        if dk.hex() != pwhash:
            return fail("Invalid username or password")

        # Lookup roles
        roles = []
        cur.execute((
            'SELECT p.name '
            'FROM user_permissions up '
            'JOIN permissions p '
            '   ON up.permission_id = p.idx '
            'JOIN users u '
            '   ON up.user_id = u.idx '
            'WHERE u.idx = %s'), (idx,))

        for row in cur:
            roles.append(row[0])

        # Create Token and cookify it
        access_token = create_access_token(
            identity=username,
            user_claims={
                'roles': roles,
            })

        resp = jsonify({
            'success': True,
            'username': username,
            'roles': roles,
        })
        set_access_cookies(resp, access_token)

        return resp, 200


@app.route('/user/create', methods=['POST'])
@require_roles('users-create')
def create():

    # Ensure we have username, password
    if not request.json:
        return bad_request('invalid json...')

    username = request.json.get('username', None).strip()
    password = request.json.get('password', None)
    salt = os.urandom(16)

    if not username or not password:
        return bad_request('invalid parameters')

    # Create Useer
    with closing(mysql.connection.cursor()) as cur:

        dk = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode(),
            salt,
            1000)

        cur.execute((
            'INSERT INTO users (username, salt, iter, password) '
            'VALUES (%s, %s, %s, %s) '
            'ON DUPLICATE KEY UPDATE salt=%s,iter=%s,password=%s'),
            (username, salt.hex(), 1000, dk.hex(),
             salt.hex(), 1000, dk.hex()))

        mysql.connection.commit()

        return success()

    return fail("Not sure")


@app.route('/user/whoami', methods=['GET', 'POST'])
@jwt_optional
def whoami():
    identity = get_jwt_identity()
    if not identity:
        return jsonify({})

    roles = get_jwt_claims().get('roles', [])
    return jsonify({'username': identity, 'roles': roles})


@app.route('/user/logout', methods=['GET', 'POST'])
@jwt_required
def logout():
    resp = jsonify({
        "logout": True,
    })
    unset_access_cookies(resp)
    return resp, 200
