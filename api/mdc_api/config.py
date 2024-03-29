
class ConfigBase(object):
    DEBUG = True
    MYSQL_HOST = "database"
    MYSQL_DB = "mdc_api"
    MYSQL_USER = "mdc_api"
    MYSQL_PASSWORD = "mdc_api"

    JWT_SECRET_KEY = "asoufbaousfbaosufgb"
    JWT_TOKEN_LOCATION = ['cookies']

    # Only over SSL
    JWT_COOKIE_SECURE = True

    # For now, we don't CSRF protect
    JWT_COOKIE_CSRF_PROTECT = False

    # Persistent Cookies
    JWT_SESSION_COOKIE = False

    # Cookies never expire
    JWT_ACCESS_TOKEN_EXPIRES = False
