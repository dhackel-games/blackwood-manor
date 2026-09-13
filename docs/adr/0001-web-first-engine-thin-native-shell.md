# ADR 0001 — Web-first engine, thin native shell

- **Status:** Accepted
- **Date:** 2026-09-13
- **Deciders:** David Hackel, Andy Coven
- **Applies to:** the whole product (Chapter 1, the Chapter 2 spike, and all
  future gameplay)

## Context

Blackwood Manor is a pure static web game (`web/`) wrapped by a native iOS app
(`ios/`) that bundles the web content and self-updates it from GitHub Pages. We
are prototyping a graphical "Chapter 2" (8-bit top-down view) and expect to add
more real-time rendering and game logic over time. We also want the option to
ship on **Android** later.

The risk at this moment of growth is that gameplay or rendering logic starts
leaking into platform-native code (Swift now, Kotlin later). Every line that
lives in the native layer is a line that must be re-written and re-tested per
platform, and a place where the platforms can silently diverge.

The current architecture already leans the right way:

- The **entire game and rendering engine is web** — HTML/CSS/JS + canvas. The
  Chapter 2 spike (`web/spike/`) is 100% web with no native code.
- The **iOS layer is a thin shell**: a SwiftUI `WKWebView` host plus a
  web-content self-updater.
- The **JS↔native bridge is tiny** — 5 `postMessage` actions today
  (`version`, `version-banner`, `refresh`, `start`, `stop`) via
  `web/js/native.js` (~51 lines).

## Decision

**The game and graphics engine is web-first and platform-agnostic. The native
layer is a thin shell only.**

Concretely:

1. **No engine code in native (Swift/Kotlin).** Rendering, input, movement, AI,
   game state, content, and UI live in web (`web/**`). Chapter 2 is no
   exception.
2. **The JS↔native bridge is a thin, documented contract.** A native action is
   added only for a device capability a browser genuinely cannot provide (e.g.
   offline persistence, background content update), and only when it is
   trivially re-implementable on another platform. The bridge is enumerated and
   kept small.
3. **No platform-WebView-only web APIs.** The game must run in a plain browser
   (which is how we develop and how collaborators test the spike), so we stick
   to standard, cross-browser web APIs.
4. **The cross-platform contract is the web engine + data schema, not native
   code.** Porting means re-implementing the shell, never the game.

## Consequences

**Positive**

- **Android port is a small, well-scoped job:** a native shell (WebView +
  content updater + the same small bridge) reusing 100% of the web engine —
  not a rewrite.
- One engine, one test surface (the web test suite), one place for game logic.
- Collaborators can build and try gameplay in a plain browser with no native
  toolchain (e.g. the live spike on GitHub Pages).

**Costs / trade-offs**

- We accept web/canvas performance characteristics instead of native rendering.
  Acceptable for this game's scope (tile/text, not a 3D engine); revisit only if
  a concrete performance need proves otherwise.
- Genuinely native features (haptics, native audio, store/IAP, notifications)
  must go through the bridge, and each such addition must be justified against
  rule 2 and be portable to Android.

**Guardrails to keep this true**

- New engine/gameplay files go under `web/` (for the spike, under `web/spike/`).
- Any new bridge action is documented here or alongside `web/js/native.js`, with
  a note on how it maps to Android.
- If you find yourself writing game logic in Swift, stop — it belongs in web.

## Alternatives considered

- **Native rendering per platform (Swift + Kotlin engines).** Rejected: highest
  fidelity but doubles the engine, the bug surface, and the maintenance; risks
  platform divergence. Not warranted for a tile/text game.
- **Cross-platform native framework (Flutter / React Native / KMM).** Rejected:
  the game is already web and works in a browser; adding a heavy framework buys
  us less portability than we already have and pulls logic out of the web engine
  we want to keep canonical.

## Status of the codebase vs. this decision

Already compliant. This ADR ratifies and protects the existing shape rather than
requesting a change.
