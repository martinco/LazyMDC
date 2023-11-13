import os
import click
import hashlib

from contextlib import closing

from .app import app, mysql

@click.group()
def cli():
    pass

@click.command()
@click.option('--username', required=True, help='User to create or reset')
@click.option('--password', required=True, help='Password to set')
def reset_pw(username, password):
    """
    Create or reset a username / password
    """

    salt = os.urandom(16)
    with app.app_context():
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


@click.command()
def list_users():
    """
    List users and their ids
    """
    with app.app_context():
        with closing(mysql.connection.cursor()) as cur:
            cur.execute('SELECT idx, username FROM users')
            for idx, username in cur:
                print(f"{idx}: {username}")


@click.command()
def list_squadrons():
    """
    List squadrons and their ids
    """
    with app.app_context():
        with closing(mysql.connection.cursor()) as cur:
            cur.execute('SELECT idx,name FROM squadrons')
            for idx, name in cur:
                print(f"{idx}: {name}")


@click.command()
@click.option('--uid', required=True, type=int, help='User to grant admin rights to')
def grant_admin(uid):
    """
    Grant global admin rights to user
    """
    with app.app_context():
        with closing(mysql.connection.cursor()) as cur:
            cur.execute((
                'INSERT INTO user_permissions(user_id,permission_id,restricts) '
                'SELECT %s,idx,0 FROM permissions'),
                (uid,))

            mysql.connection.commit()


@click.command()
@click.option('--uid', required=True, type=int, help='User to grant permission')
@click.option('--sid', required=True, type=int, help='Squadron to restrict to')
def grant_squadron(uid, sid):
    """
    Grant squadron rights to user
    """
    with app.app_context():
        with closing(mysql.connection.cursor()) as cur:
            cur.execute((
                'INSERT INTO user_permissions(user_id,permission_id,restricts) '
                'SELECT %s,idx,%s FROM permissions '
                'WHERE name="squadron-edit"'),
                (uid, sid))

            mysql.connection.commit()


cli.add_command(reset_pw)
cli.add_command(list_users)
cli.add_command(list_squadrons)
cli.add_command(grant_admin)
cli.add_command(grant_squadron)


if __name__ == '__main__':
    cli()
