# Gary's brain (Mac daemon)

Gives Gary a real, on-device LLM voice when you play Blackwood Manor locally on a Mac.

Uses Apple's **Foundation Models** framework — the ~3B model built into macOS 26. Free,
private, offline. Nothing leaves the machine and there is no API key.

## Quick start (you have the repo)

Double-click **`web/Play Blackwood Manor.command`**.

That's it. On first run it builds this daemon (a minute or two, once), starts it, serves the
game on a free local port and opens your browser. Gary will think. The phone screen shows
**`◆ AI VOICE · on-device (daemon)`** when the model is live, and every line the model actually
wrote is marked with a **◆**.

If anything is missing it tells you exactly what — wrong macOS, Intel Mac, no Xcode — and the
game still plays with canned Gary.

> Clone with `git clone`, don't download the ZIP: files extracted from a downloaded ZIP are
> quarantined by Gatekeeper and macOS will refuse to run the `.command`.

## Using the model on the public site

The public site (`dhackel-games.github.io/blackwood-manor`) ships **canned Gary only**. Add
`?llm` to opt in:

```
https://dhackel-games.github.io/blackwood-manor/?llm
```

With the daemon running, that page will use it. The choice is remembered; `?llm=0` turns it
back off. Chrome will ask once for Local Network Access — that prompt is the whole reason this
is opt-in rather than automatic (see "Why a daemon?" below).

## Requirements

- macOS 26 (Tahoe) or later, Apple Silicon
- Apple Intelligence enabled in System Settings
- Xcode (for the one-time build)

There is no way to check the macOS version from the browser — the user-agent has been frozen at
`10.15` for years — so don't try. The daemon is the detector: it refuses to start and prints the
reason, and `/health` reports model availability.

## Build

```bash
cd mac/gary-daemon
swift build -c release
```

## Run

`web/Play Blackwood Manor.command` starts it automatically once it has been built. To run it
by hand:

```bash
./.build/release/GaryDaemon
```

It listens on `127.0.0.1:8138` and is local-only.

```bash
curl -s http://127.0.0.1:8138/health          # {"ok":true,"model":"available"}
```

## Why a daemon?

A browser can't talk to a Swift framework directly, so the model is exposed over local HTTP.

The public site deliberately never looks for it. Not because it can't — Chrome does allow an
`https:` page to reach `http://127.0.0.1` — but because Chrome gates loopback behind the **Local
Network Access permission**, and probing would prompt every stranger opening a text adventure to
allow "access to devices on your local network". Safari blocks it outright anyway. So:

- **Local play** (`http://127.0.0.1/…`) → the page reaches this daemon.
- **The iOS/macOS app** → uses the in-process `GaryBridge` instead; no daemon needed.
- **The public GitHub Pages site** → canned Gary, unless you add `?llm` to opt in.

If the daemon isn't running, the game silently falls back to canned Gary. Nothing breaks.

## What it will and won't do

The model only ever re-voices **conversational** turns. Hints, the meter, hang-ups, the fire
sequence and crisis handling are deterministic JavaScript and never reach the model — during
development the model was told to deliver a specific hint and silently dropped it. See
`web/DESIGN.md` §12.14.
