# Renders the two model sprites the pictures need into sprites/<name>.json. Usage: run.sh <repo root>
D=$1; H=$(cd "$(dirname "$0")" && pwd); R=/tmp/zyx-sprite; rm -rf $R; mkdir -p $R $H/../sprites
cp $H/index.html $R/; ln -s $D/apps/good/node_modules/three $R/three; ln -s $D/apps/good/public/good.glb $R/good.glb; ln -s $D/apps/web/public/zyx.svg $R/zyx.svg
(cd $R && python3 -m http.server 8766 >/dev/null 2>&1 &) ; for i in 1 2 3 4 5; do curl -sf -o /dev/null http://127.0.0.1:8766/ && break; sleep 1; done
pw open http://127.0.0.1:8766/ --tab sprite >/dev/null; pw wait 1500 --tab sprite >/dev/null
pw eval "window.shot('good', ${GOOD_UNITS:-4.2}, 27, ${GOOD_TURN:-0})" --tab sprite > $H/../sprites/good.json
pw eval "window.shot('zyx', ${ZYX_UNITS:-4.0}, 27, ${ZYX_TURN:-0.785})" --tab sprite > $H/../sprites/zyx.json
pw console --tab sprite | tail -3; pw close --tab sprite >/dev/null
kill $(ss -ltnp | grep ":8766 " | sed -E "s/.*pid=([0-9]+).*/\1/") 2>/dev/null
wc -c $H/../sprites/*.json
