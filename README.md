<!-- README.md. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-21.105:acoven. -->

# Blackwood Manor

A classic-style haunted-mansion **text adventure** (Zork-like), built as pure static
web files — with a grumpy 1-900 **hint line** ("Gary") who slowly turns into your
therapist the more you call him. Cruel-but-fair: darkness kills, light is limited,
and there's a hidden wing after you win.

The thirteen-heirloom route includes the BLACKWOOD FAMILY RING in the
hall-bedroom night-table drawer, a BLACKWOOD HAMMER hidden between exposed wall
beams, and a restored dining-room CANDELABRA assembled from the manor's sole
candle and a shard worked free from the broken hall-bedroom mirror. Belfry bats
drop non-heirloom XRAY GOGGLES, while the non-heirloom BM WATCH rests on the
Study desk and provides remote room/object sight and route preparation.

## Layout

- **`web/`** — the game. Pure static HTML/CSS/JS, no build step, no dependencies.
- **`ios/`** — a native iOS wrapper (SwiftUI + `WKWebView`) that bundles `web/` for
  offline play on iPhone. Optional — the web version is the whole game.
- **`docs/adr/`** — architecture decision records.

## Architecture

The game and graphics engine are **web-first**; the native app is a **thin
shell** (WebView + content updater + a small JS↔native bridge). This keeps us
portable — an Android port reuses the whole web engine instead of rewriting it.
See [ADR 0001](docs/adr/0001-web-first-engine-thin-native-shell.md).

## Play it (web)

Double-click **`web/Play Blackwood Manor.command`** — it serves the game on a free
local port and opens your browser. (First time on macOS: right-click → Open to
get past Gatekeeper.)

Or from a terminal:

```bash
cd web
python3 -m http.server 8000
# then open the printed http://127.0.0.1:8000/ URL
```

> Don't open `web/index.html` directly — Chrome blocks the game's ES modules over
> `file://`, so it must be served over `http://`.

Gary's voice is **muted by default**; on the call screen tap **🔊 Gary: on** to enable it.

## Tests

```bash
cd web
npm test                  # all executable Gherkin scenarios
npm run test:unit         # engine/unit-tagged scenarios only
npm run test:walkthrough  # gameplay-tagged scenarios only
```

Runs the executable feature suite, including a complete winning walkthrough,
death traps, and Gary hint-line behavior.

## Editing / expanding

Everything player-facing lives in **`web/js/world.js`** — rooms, items, puzzles, and
Gary. The engine (`core.js`, `parser.js`, `commands.js`) never needs to change. See
`web/README.md` and `web/DESIGN.md` for the full guide and the "how to add a room"
walkthrough.

## Build the iOS app

```bash
cd ios
./copy-web.sh          # bundle the latest web/ into the app
xcodegen generate      # generate BlackwoodManor.xcodeproj from project.yml
open BlackwoodManor.xcodeproj
# select your device + team, then Run
```

Requires `xcodegen` (`brew install xcodegen`) and Xcode.

To make a TestFlight archive, refresh the bundled web game, select the next
unpublished iOS build number, archive, export, and optionally upload:

```bash
cd ios
./release-testflight.sh --stamp-only --force-next-build  # next OTA identity; no archive
./release-testflight.sh --no-upload  # archive and export locally
./release-testflight.sh              # archive, export, and upload
```

The release script runs `copy-web.sh` before generating the Xcode project, so the
archive always contains the current canonical files from `web/`. A native release
uses the current `YYYY.M.D` date. A genuinely new app date resets the build to `1`;
later app releases that day advance beyond both uploaded app builds and OTA content
builds. The script synchronizes `web/package.json`, `ios/project.yml`, native fields,
content fields, compatibility aliases, and `CONTENT_VERSION` to that same app
date/build. It refuses to rewind content identity if content-only releases already
used a higher build on the proposed app date.
Every web-content push intended for phones must first use
`--stamp-only --force-next-build`, because the updater only downloads a strictly
greater `CONTENT_VERSION`. This changes only `CONTENT_DATE`, `CONTENT_BUILD`, and
`CONTENT_VERSION` (plus legacy JSON aliases required by installed updaters);
`NATIVE_APP_VERSION`, `NATIVE_APP_BUILD`, app package, and project versions remain
untouched. The content build resets to 1 on a new date and increments for later
pushes that day.
After upload, it waits for App Store Connect processing, assigns the build to an
internal beta group, verifies that testers can receive it, writes
`LATEST_APP_BUILD_AVAILABLE` in `web/versions.json`, and commits and pushes that
version. It targets the internal **BM Testers** group by default; no group ID is
needed. `ASC_BETA_GROUP_ID` or `ASC_BETA_GROUP_NAME` can override that default.
A temporary remote Git release lock serializes publishers without
changing the public availability value before a build is actually available.
