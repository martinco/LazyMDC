#!/bin/bash

pushd "$(dirname "$0")"

# Rebuild Source Dist
rm -rf dist
venv/bin/python setup.py sdist

# Create VENV and run it
sudo -s <<'AS_ROOT'

id -u mdc_api > /dev/null 2>&1 || useradd mdc_api -m -d /var/empty/mdc_api -k /dev/null -r -s /bin/false

cp mdc_api.service /etc/systemd/system/mdc_api.service
systemctl daemon-reload
systemctl enable mdc_api

mkdir -p /opt/mdc_api
[ -d /opt/mdc_api/env ] || python3 -m venv /opt/mdc_api/env
. /opt/mdc_api/env/bin/activate 
pip install --upgrade dist/*
deactivate

[ -f /etc/sysconfig/mdc_api ] || cp mdc_api.sysconf /etc/sysconfig/mdc_api

if systemctl is-active mdc_api > /dev/null 2>&1; then
  systemctl reload mdc_api 
else
  systemctl start mdc_api
fi

AS_ROOT
