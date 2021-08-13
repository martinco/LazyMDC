# MDC API

This is the backend of the LazyMDC frontend 

## Installation

```
python3 -mvenv venv
venv/bin/pip install -r requirements.txt
```

## Development

When developing i use `./run.py`

This just runs the flask app in the local terminal and is suitable for iterative appraoch

## Deploy 

I've got a few deploy scripts that I use that my be of use

## Proxy

The frontend assumes the api is on ./api (relative to index.html)

This is then passed though to hupper via a simple proxypass:

```
ProxyPass /api/ http://127.0.0.1:5002/
```

## User Accesss

This is indirectly accessed via the frontend, both from a regular user and /admin 

Admin credentials

```
username: admin
password: admin
```

New users and altering existing users passwords isn't currently in the admin
interface, so I just have a helper script

```
venv/bin/python tools/create-user-or-reset-pw.py admin newpass
```

## Notes

This is all very early days and started as a transition of static JSON dicts to
db to offload administrative duties to mission makers etc.

As such for now the Admin side of things is very single-user at a time, as the
entire data for the section you're in is saved, and there isn't any locking to
alert that someone is currently in there (on my list of things to avoid
conflicts forming)

