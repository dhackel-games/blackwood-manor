# Blackwood Manor

A classic-style haunted-mansion **text adventure** (Zork-like), built as pure static
web files — with a grumpy 1-900 **hint line** ("Gary") who slowly turns into your
therapist the more you call him. Cruel-but-fair: darkness kills, light is limited,
and there's a hidden wing after you win.

## Layout

- **`web/`** — the game. Pure static HTML/CSS/JS, no build step, no dependencies.
- **`ios/`** — a native iOS wrapper (SwiftUI + `WKWebView`) that bundles `web/` for
  offline play on iPhone. Optional — the web version is the whole game.

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
npm test          # or: node tests/walkthrough.js
```

Plays a complete winning walkthrough (asserts the score) plus the death traps and
the Gary hint-line behavior.

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
