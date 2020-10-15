#!/bin/sh

# Re-compile static website to /app/build
npm run export

# Copy generated files to nginx's default home
cp -r /app/build/* /var/www/html

# forward request and error logs to docker log collector
ln -sf /dev/stdout /var/log/nginx/access.log
ln -sf /dev/stderr /var/log/nginx/error.log

echo "Starting nginx..."

# Run nginx daemon
exec /usr/sbin/nginx -c /etc/nginx/nginx.conf -g 'daemon off;'
