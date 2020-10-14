#!/bin/sh

# Re-compile static website to /app/build
npm run export

# Copy generated files to nginx's default home
cp -vr /app/build/* /var/www/html

# Run nginx daemon
exec /usr/sbin/nginx -c /etc/nginx/nginx.conf -g "daemon off;"
