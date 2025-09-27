#!/bin/sh
set -e

# 启动 dnsmasq 后台
dnsmasq --addn-hosts=/app/data/extra_hosts.conf &

# 启动主服务（前台）
exec node dist/main.js