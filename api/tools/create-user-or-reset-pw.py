#!venv/bin/python

import hashlib
import MySQLdb
import os
import sys

from contextlib import closing

username = sys.argv[1]
password = sys.argv[2]
salt = os.urandom(16)

mysql = MySQLdb.connect(
    host="localhost",
    user="mdc_devel",
    password="mdc_devel",
    database="mdc_devel",
)

# Create Useer
with closing(mysql.cursor()) as cur:

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

    mysql.commit()
