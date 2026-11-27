#!/usr/bin/env bash
# The image as deployed: compose.yaml without a database, then the pages that
# answer without one. ci runs it with the image loaded as ghcr.io/zyx-tw/www:ci.
set -euo pipefail
trap 'docker compose logs; docker compose down -v' EXIT
sed -e 's/^WEB_VERSION=.*/WEB_VERSION=ci/' -e 's/^WEB_BIND=.*/WEB_BIND=127.0.0.1:3999/' .env.example > .env
docker compose up -d --wait web
base=http://127.0.0.1:3999
for path in / /project /info /privacy /terms /llms.txt /info.md /og/0.gif /icon.svg; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "$base$path")
  echo "$path $code"
  test "$code" = 200
done
curl -s -o /dev/null -w "%{redirect_url}\n" http://127.0.0.1:3999/og.gif | grep -q "^https://www.zyx.tw/og/"
# The prerendered Info has the heatmap when the build had the token.
# A GitHub outage at build time must not block a deploy; ISR fills it in.
curl -s http://127.0.0.1:3999/info | grep -q contributionLevel || echo "::warning::Info built without the heatmap"
echo smoke ok
