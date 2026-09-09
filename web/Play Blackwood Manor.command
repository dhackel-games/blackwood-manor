#!/bin/bash
# Double-click to play Blackwood Manor.
# Serves the game on a FREE local port (so it never collides with another
# local server) and opens it in your browser.
cd "$(dirname "$0")" || exit 1

export PATH="/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin:/usr/local/bin"
PY=/usr/bin/python3
command -v "$PY" >/dev/null 2>&1 || PY=python3

# Reuse a server we already started, otherwise start a fresh one on a free port.
PIDF=".server.pid"
if [ -f "$PIDF" ] && kill -0 "$(cat "$PIDF")" 2>/dev/null; then
  PORT=$(ps -p "$(cat "$PIDF")" -o command= | grep -o 'http.server [0-9]*' | awk '{print $2}')
else
  PORT=$("$PY" -c 'import socket;s=socket.socket();s.bind(("127.0.0.1",0));print(s.getsockname()[1]);s.close()')
  nohup "$PY" -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1 &
  echo $! > "$PIDF"
  sleep 1
fi

open "http://127.0.0.1:$PORT/index.html"
echo "🏚  Blackwood Manor is open in your browser (http://127.0.0.1:$PORT)."
echo "    You can close this Terminal window."
