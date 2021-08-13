#!/bin/bash

pushd "$(dirname "$0")"

# Rebuild Source Dist
rm -rf dist
venv/bin/python setup.py sdist

# Create VENV and run it
sudo -s <<'AS_ROOT'

id -u mdc_api > /dev/null 2>&1 || useradd mdc_api -m -d /var/empty/mdc_api -k /dev/null -r -s /bin/false

mkdir -p /opt/mdc_api_devel
[ -d /opt/mdc_api_devel/env ] || python3 -m venv /opt/mdc_api_devel/env
. /opt/mdc_api_devel/env/bin/activate 
pip install --upgrade dist/*
deactivate

if systemctl is-active mdc_api_devel > /dev/null 2>&1; then
  systemctl reload mdc_api_devel
else
  systemctl start mdc_api_devel
fi

AS_ROOT
