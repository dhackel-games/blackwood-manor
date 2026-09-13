#!/bin/bash
# copy-web.sh. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-12.067:acoven.
# Refresh the bundled web game from ../web (the source of truth in this repo).
# Run this after changing the game, then rebuild the app.
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
SRC="$HERE/../web"
DST="$HERE/Resources/www"
rm -rf "$DST"; mkdir -p "$DST"
cp "$SRC/index.html" "$DST/"
cp -R "$SRC/css" "$SRC/js" "$DST/"
echo "Copied web game -> $DST"

# Stamp the declared content identity into every module URL and manifest. Pages
# uses the same value, so bundled and deployed artifacts are byte-identical.
node "$SRC/tools/gen-web-manifest.mjs" "$DST"
