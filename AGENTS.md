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
- Sysop menu: type `::` in-game → password `evad`. `::brink` seals the reliquary and stops
  at the bell (the BM1→BM2 seam).

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

Last published TestFlight build: **86** (2026-09-14; source of truth = `LATEST_APP_BUILD_AVAILABLE`
in `web/versions.json`).

## BM2 (Part II — the Thirteen-Hour Clock)
Integrated inline in `web/js/world.js` as one continuous game: play BM1 → seal reliquary →
`go down` → Part II ghost-loop. Hour-13 slice: arrival clue → `examine statue` (find the living
queen) → `examine pool` → `yell` (she turns to stone by the water; yelling after finding her but
before knowing the pool = death) → carry emerald to the garden bush → clock ticks 13→12. Design:
`docs/design/0002-thirteen-hour-clock-and-ouroboros.md`. `web/examples/bm2/` is a superseded broken
prototype — kept locally per David, excluded via `.git/info/exclude` (do not delete).

## Engine invariants (enforced by tests)
Every room needs `art` + `searchDesc` + `IMPLICIT_NAVIGATION` + `ROOM_SHORT_NAMES`; every item needs
`ITEM_SHORT_NAMES`; short-names globally unique matching `/^[a-z0-9]+$/`. Part II rooms are `phase:2`
and excluded from `teleportRandom`.
