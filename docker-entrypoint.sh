#!/bin/sh
# 只替換 BACKEND_HOST、BACKEND_PORT 兩個環境變數
# nginx 自身的 $uri、$proxy_add_x_forwarded_for 等變數不受影響
set -e

envsubst '${BACKEND_HOST} ${BACKEND_PORT}' \
  < /etc/nginx/templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
