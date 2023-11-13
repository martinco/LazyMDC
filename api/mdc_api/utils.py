
import os
import json
import inspect

from flask import jsonify
from mdc_api import app


def cur_row_as_dict(cur, row):
    cols = [col[0] for col in cur.description]
    return dict(zip(cols, row))


def success():
    return jsonify({"success": True})


def denied(message=None):
    return app.response_class(
        response=json.dumps({
            "success": False,
            "message": message or "You do not have access to this resource",
        }),
        status=403,
        mimetype='application/json')


def fail(message, elem=None):
    frame, filename, lineno, function, context, index = inspect.stack()[1]
    filename = filename.replace(os.path.dirname(__file__)+os.path.sep, '')
    retval = {
        "success": False,
        "message": message,
        "path": filename,
        "line": lineno,
    }
    if elem:
        retval['elem'] = elem

    return jsonify(retval)


def bad_request(message=None):
    return app.response_class(
        response=json.dumps({
            "error": message or "Invalid request",
        }),
        status=400,
        mimetype='application/json')
