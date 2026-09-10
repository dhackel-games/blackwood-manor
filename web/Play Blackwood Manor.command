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

# Gary's on-device brain (optional). If the daemon is already up, leave it. If it
# has never been built, build it now — that first build is the single thing that
# stood between a new Mac and a thinking Gary, and asking someone to run a swift
# command by hand loses most people. If any of it fails the game still runs with
# canned Gary; the page probes and silently falls back.
GARY_DIR="../mac/gary-daemon"
GARY_BIN="$GARY_DIR/.build/release/GaryDaemon"

gary_preflight() {
  # macOS 26+ and Apple Silicon are hard requirements of Foundation Models.
  local major arch
  major=$(sw_vers -productVersion | cut -d. -f1)
  arch=$(uname -m)
  if [ "$arch" != "arm64" ]; then
    echo "    ⚠️  Gary's brain needs an Apple Silicon Mac (this one is $arch)."
    return 1
  fi
  if [ "$major" -lt 26 ] 2>/dev/null; then
    echo "    ⚠️  Gary's brain needs macOS 26 (Tahoe) or later (this is macOS $major)."
    return 1
  fi
  if ! command -v swift >/dev/null 2>&1; then
    echo "    ⚠️  Xcode / the Swift toolchain isn't installed, so the brain can't be built."
    echo "        Install Xcode from the App Store, then run this again."
    return 1
  fi
  return 0
}

if ! curl -s -m 1 http://127.0.0.1:8138/health >/dev/null 2>&1; then
  if [ ! -x "$GARY_BIN" ] && [ -d "$GARY_DIR" ]; then
    if gary_preflight; then
      echo "🧠  First run: building Gary's brain. This takes a minute or two, only once…"
      ( cd "$GARY_DIR" && swift build -c release ) || echo "    ⚠️  Build failed — continuing with canned Gary."
    fi
  fi
  if [ -x "$GARY_BIN" ]; then
    nohup "$GARY_BIN" >/tmp/gary-daemon.log 2>&1 &
    sleep 2
  fi
fi
if curl -s -m 1 http://127.0.0.1:8138/health >/dev/null 2>&1; then
  echo "🧠  Gary's on-device brain is running (he'll actually think)."
else
  echo "💬  Gary is running on canned lines — the game plays fine either way."
  # The daemon exits with a precise reason (Apple Intelligence off, etc.).
  [ -s /tmp/gary-daemon.log ] && sed 's/^/    /' /tmp/gary-daemon.log | head -4
fi

open "http://127.0.0.1:$PORT/index.html"
echo "🏚  Blackwood Manor is open in your browser (http://127.0.0.1:$PORT)."
echo "    You can close this Terminal window."
