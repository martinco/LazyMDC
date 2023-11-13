FROM python:3

COPY mdc_api /data/build/mdc_api
COPY setup.py requirements.txt /data/build

RUN useradd --create-home --home /mdc_api mdc_api && \
		chown -R mdc_api:mdc_api /data

USER mdc_api
WORKDIR /data/build

RUN python3 -m pip install --upgrade pip
RUN python3 setup.py bdist_wheel 
RUN python3 -m pip install dist/mdc_api*.whl
RUN rm -rf /data/build

WORKDIR /data

EXPOSE 5001
CMD [ "/mdc_api/.local/bin/hupper", "-m", "waitress", "--host", "0.0.0.0", "--port", "5001", "mdc_api:app" ]
