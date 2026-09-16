# AGENTS.md — Blackwood Manor

Web-based text adventure (ES modules) with a thin native **iOS WKWebView shell**
that self-updates its web content **over-the-air** from GitHub Pages.

## Repo / accounts
- Remote: `https://dhackel-games@github.com/dhackel-games/blackwood-manor.git` (github.com, **not** Adobe GHE).
- **Two gh accounts on this machine:** `dhackel_adobe` (David's primary — keep active by default)
  and `dhackel-games` (repo owner — **required for pushes**).
- git uses gh as the github.com credential helper, so plain `git push` authenticates as the
  **active** gh account. To push: `gh auth switch --user dhackel-games`, push, then
  `gh auth switch --user dhackel_adobe` to restore.
- No auto-commit unless explicitly asked.

## Run / test the web game
- Serve (`file://` fails — ES-module CORS): `cd web && python3 -m http.server 8817` → http://localhost:8817/
- Tests: `cd web && npm test` (cucumber-js). One feature:
  `npx cucumber-js "tests/features/X.feature" --import "tests/steps/**/*.js"`.
- Sysop menu: type `::` in-game → password `evad`. Maintained shortcuts:
  `::powerup`, `::winquick1`, and `::winmax2bell`. `::winquick1` stops after
  the bell ritual but before walking out. The last earns every
  deterministic reward, deposits all 13 heirlooms, closes the reliquary, and
  stops before pulling the main-floor bell rope.

## ⚠️ The two facts that always cause confusion

### 1. Why a web push does NOT reach the phone
The iOS app pulls web content OTA from `https://dhackel-games.github.io/blackwood-manor/`
(auto-deployed by `.github/workflows/pages.yml` on every push to `main`). It only downloads
when the published `CONTENT_VERSION` (in `web/versions.json`) is **strictly greater** than what's
installed (`ios/Sources/WebContent.swift`: `guard remote.sortKey > localKey`). A normal code push
does **not** bump `CONTENT_VERSION`, so a phone already at that version sees "up-to-date" and skips
the change. **To ship to phones you must bump the version — the release script does this.**

`CONTENT_VERSION = f(APP_VERSION, BUILD) = YYYYMMDDBBB`, validated in three places (Swift
`parse()`, `web/tools/gen-web-manifest.mjs`, and `web/tests/steps/engine.steps.js`) and coupled to
`web/package.json` version (a test pins it), `web/versions.json`, and `ios/project.yml`
(MARKETING_VERSION / CURRENT_PROJECT_VERSION). **Don't hand-edit these piecemeal — let the release
script stamp them.**

### 2. TestFlight release — MUST be run by David in his own terminal
`ios/release-testflight.sh` stamps the next version+build, runs `copy-web.sh` (bundles current
`web/`), `xcodegen`, `xcodebuild archive`+export, uploads via `xcrun altool`, waits for App Store
Connect processing, distributes to the internal **"BM Testers"** group, and commits the published
build number back to `main`.

Prereqs: clean worktree, on `main`, `local == origin/main`; ASC API key
(`~/.appstoreconnect/private_keys/*.p8`) + `ASC_KEY_ID` / `ASC_ISSUER_ID` env vars (these live in
David's `~/.zshrc`); Xcode, `xcodegen`, `node`.

**THE AGENT SANDBOX CANNOT RUN THE UPLOAD.** The ASC keys live in `~/.zshrc`; loading them needs an
interactive/login shell (`zsh -il…`), which the sandbox **hard-blocks** as "unsafe credential
exposure risk." Do **not** waste turns retrying `zsh -ilc` — it is denied by design. David runs it:
```bash
gh auth switch --user dhackel-games && \
( cd ~/repos/blackwood-manor/ios && ./release-testflight.sh ); \
gh auth switch --user dhackel_adobe
```
The agent **can** do a credential-free dry run (build+archive+export, no upload/creds) via plain
`bash`/`zsh -c`: `cd ios && ./release-testflight.sh --no-upload`.

Last published TestFlight build: **100** (2026-09-15; source of truth = `LATEST_APP_BUILD_AVAILABLE`
in `web/versions.json`).

## BM2 (Part II — the Thirteen-Hour Clock)
Integrated inline in `web/js/world.js` as one continuous game: name the player → put all 13
heirlooms in the reliquary → close it → open the bell closet beside the front door → pull the
lower rope. The remote belfry bell toll transforms the heirlooms into the countdown clock,
slams the front door shut and then wide open, and opens the floor trapdoor. Leaving ends BM1.
Examining the reliquary, taking the clock, and going down reaches Gary; he is alone beside a
silent phone, knocks the player out, and leaves them as a ghost holding the clock.
`examine clock` explains the loop.
Part-II death offers `RESTART 1` for a fresh Part I (including naming) or `RESTART 2` for the
serialized ghost-awakening checkpoint and a fresh name prompt before the room appears.
Hour-13 slice: `use clock` → `examine statue` (find the living queen) → `examine pool` → `yell`
(she turns to stone by the water; yelling after finding her but before knowing the pool = death)
→ carry emerald to the garden bush → clock ticks 13→12. Design:
`docs/design/0002-thirteen-hour-clock-and-ouroboros.md`. `web/examples/bm2/` is a superseded broken
prototype — kept locally per David, excluded via `.git/info/exclude` (do not delete).

The Bat Sight Mirror replaces the removed Family Ring as a required heirloom.
Pulling either bell rope scatters the belfry bats (+5) and drops the mirror;
`LOOK IN MIRROR AT <room>` scries any Part-I room. The former Ravenblood Signet
is now the Ravenblood Ring.

## Engine invariants (enforced by tests)
Every room needs `art` + `searchDesc` + `IMPLICIT_NAVIGATION` + `ROOM_SHORT_NAMES`; every item needs
`ITEM_SHORT_NAMES`; short-names globally unique matching `/^[a-z0-9]+$/`. Part II rooms are `phase:2`
and excluded from `teleportRandom`. Player-facing prose uses explicit `{{player_name}}` tokens;
all display and speech output passes through `game.showMessage()` before it reaches the player.
Startup is nonblocking: title, initial AI status, Professor Spooky Pants fallback, an intro
name request with `call me ` prefilled, then the first room immediately. The same applies to
`RESTART 2`; `CALL ME <name>` renames the player without spending a turn.
