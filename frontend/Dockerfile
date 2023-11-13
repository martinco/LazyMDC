FROM php:8.2-apache

# Install python and chrome required libs
RUN apt-get update \
		&& apt-get install --no-install-recommends -y \
			python3 \
			python3-pip \
			python3-venv \
			libasound2 \
			libatk1.0-0 \
			libatk-bridge2.0-0 \
			libatspi2.0-0 \
			libcairo2 \
			libcups2 \
			libdrm2 \
		  libgbm1 \
			libglib2.0.0 \
			libnss3 \
			libpango-1.0-0 \
			libxcomposite1 \
			libxdamage1 \
			libxfixes3 \
			libxkbcommon0 \
			libxrandr2 \
			xcb \
		&& rm -rf /var/lib/apt/lists/*

COPY etc/requirements.txt /tmp/

RUN python3 -m venv /var/www/html/venv \
		&& /var/www/html/venv/bin/python3 -m pip install --upgrade pip \
		&& /var/www/html/venv/bin/python3 -m pip install -r /tmp/requirements.txt \
		&& rm -f /tmp/requirements.txt

# Apache/PHP Config
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"
RUN a2enmod proxy proxy_http proxy_http2 headers cgi rewrite

# Install pyppeteer
USER www-data
ENV PYPPETEER_HOME=/tmp PYPPETEER_CHROMIUM_REVISION=1204234
RUN venv/bin/pyppeteer-install

# And back to root
USER root

# Copy Content
COPY html/ /var/www/html/
COPY etc/apache.conf /etc/apache2/conf-enabled/mdc-api.conf

