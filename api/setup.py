import os
import sys

from setuptools import setup

with open('requirements.txt') as f:
    requirements = f.readlines()

setup(
    name='mdc_api',
    version='1.1',
    long_description='API for MDC management',
    packages=['mdc_api'],
    include_package_data=True,
    zip_safe=False,
    install_requires=requirements,
)
