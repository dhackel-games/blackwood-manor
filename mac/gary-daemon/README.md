# Gary's brain (Mac daemon)

Gives Gary a real, on-device LLM voice when you play Blackwood Manor locally on a Mac.

Uses Apple's **Foundation Models** framework — the ~3B model built into macOS 26. Free,
private, offline. Nothing leaves the machine and there is no API key.

## Requirements

- macOS 26 (Tahoe) or later, Apple Silicon
- Apple Intelligence enabled in System Settings

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

Safari can't talk to a Swift framework directly, and an **HTTPS page can't call
`http://127.0.0.1`** (mixed content). So:

- **Local play** (`http://127.0.0.1/…`) → the page reaches this daemon.
- **The iOS/macOS app** → uses the in-process `GaryBridge` instead; no daemon needed.
- **The public GitHub Pages site** → always the hand-written canned Gary.

If the daemon isn't running, the game silently falls back to canned Gary. Nothing breaks.

## What it will and won't do

The model only ever re-voices **conversational** turns. Hints, the meter, hang-ups, the fire
sequence and crisis handling are deterministic JavaScript and never reach the model — during
development the model was told to deliver a specific hint and silently dropped it. See
`web/DESIGN.md` §12.14.
