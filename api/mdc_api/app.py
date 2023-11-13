
import json

from flask import Flask
from flask_mysqldb import MySQL
from werkzeug.routing import BaseConverter


class RegexConverter(BaseConverter):
    def __init__(self, url_map, *items):
        super(RegexConverter, self).__init__(url_map)
        self.regex = items[0]

# Init app
app = Flask(__name__)
app.url_map.converters['regex'] = RegexConverter
app.config.from_object('mdc_api.config.ConfigBase')
app.config.from_envvar('MDC_API_CONFIG', silent=True)

mysql = MySQL(app)


# Default response for any invalid requests
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catchall(path):
    return app.response_class(
        response=json.dumps({
            "error": "invalid request",
        }),
        status=400,
        mimetype='application/json')
