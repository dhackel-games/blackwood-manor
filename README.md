<!-- README.md. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-13.085:acoven. -->

# Blackwood Manor

A classic-style haunted-mansion **text adventure** (Zork-like), built as pure static
web files — with a grumpy 1-900 **hint line** ("Gary") who slowly turns into your
therapist the more you call him. Cruel-but-fair: darkness kills, light is limited,
and there's a hidden wing after you win.

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
./release-testflight.sh --no-upload  # archive and export locally
./release-testflight.sh              # archive, export, and upload
```

The release script runs `copy-web.sh` before generating the Xcode project, so the
archive always contains the current canonical files from `web/`. It reads the
date-only `YYYY.M.D` version from `web/package.json` and uses the checked-in build
when it is newer than the published TestFlight marker, otherwise incrementing it.
After upload, it waits for App Store Connect processing, assigns the build to an
internal beta group, verifies that testers can receive it, writes
`web/latest_app_build_available.json`, and commits and pushes that marker. Set
`ASC_BETA_GROUP_ID` or `ASC_BETA_GROUP_NAME` when the app has multiple internal
groups. A temporary remote Git release lock serializes publishers without
changing the public marker before a build is actually available.
