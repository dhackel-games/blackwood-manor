#!/bin/bash
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
