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

# Stamp a manifest into the bundled copy so the app can compare its baked-in
# version against GitHub Pages and self-update the cached web content. Uses the
# same generator (and version scheme: commit timestamp) as the Pages workflow so
# the two manifests are directly comparable.
VERSION="$(git -C "$SRC" show -s --format=%ct HEAD 2>/dev/null || echo 0)"
COMMIT="$(git -C "$SRC" rev-parse --short HEAD 2>/dev/null || echo local)"
node "$SRC/tools/gen-web-manifest.mjs" "$DST" "$VERSION" "$COMMIT"
