# Blackwood Manor — Design

*A haunted-mansion text adventure in the classic Zork style. Personal project for David Hackel (with Andy Coven).*

Original design: 2026-09-05. **Sections 1–11 below are the original v1 spec, kept as history.
Section 12 is the living record of everything built since — read it for current state.**

> **Distribution:** now a git repo at **github.com/dhackel-games/blackwood-manor** (public), auto-published to **https://dhackel-games.github.io/blackwood-manor/** via GitHub Pages. Also a native iOS wrapper (`ios/`). It is no longer in HackelFamilyBrain/iCloud.

---

## 1. Premise & goal

You arrive at dusk at **Blackwood Manor**, a decaying Victorian estate you've just
inherited. The family was cursed; the heirlooms are scattered and guarded through the
house and the catacombs beneath it. Your goal: **recover the family heirlooms, deposit
them in the reliquary in the Grand Hall, and lift the curse to escape alive.** Linger in
the dark too long, and something finds you.

This is the haunted analog of Zork's "collect treasures into the trophy case."
**Win condition:** all heirlooms deposited in the reliquary + the final ritual performed.

Difficulty: **classic / cruel** — sudden death, darkness kills, limited light, inventory
limits, and one or two authentic unwinnable soft-locks (autosave + SAVE are the safety net).

---

## 2. Architecture — data-driven vanilla JS (no build, no framework, no server)

A generic engine that knows nothing about the mansion, driven by a content file you edit
to expand.

```
haunted-mansion-adventure/
├── index.html
├── css/style.css
├── js/
│   ├── core.js       # pure game state + logic (no DOM) — testable in Node
│   ├── parser.js     # input → {verb, dobj, prep, iobj}
│   ├── commands.js   # generic verb handlers (take, open, unlock, go…)
│   ├── world.js      # ★ ALL CONTENT: rooms, items, puzzles — EDIT TO EXPAND
│   ├── ui.js         # DOM adapter: terminal display, input, history
│   └── save.js       # localStorage autosave + SAVE/RESTORE
├── tests/walkthrough.js   # scripted solve + death paths, runs in Node
├── DESIGN.md
└── README.md         # how to play + how to add a room
```

**Expandability contract:** adding a room, item, or puzzle means editing only `world.js`.
The engine never changes. Core logic is DOM-free so a Node script can play a full winning
walkthrough and assert victory (regression safety as the world grows).

Pure static files — open `index.html` in a browser directly from iCloud. No server, no
build step, no dependencies.

---

## 3. World data model

Every room and item is a plain object.

```js
rooms: {
  library: {
    name: "Library",
    desc: "Floor-to-ceiling shelves sag under rotting books...",
    exits: { west: "grandHall", down: { to: "secretChamber", via: "leverPulled" } },
    dark: false,
  }
}

items: {
  candlestick: {
    names: ["candlestick", "candle"], adjectives: ["silver"],
    loc: "diningRoom", takeable: true, treasure: true, points: 10,
    lightSource: true, lit: false, fuel: 60,   // burns down each turn when lit
    desc: "A tarnished silver candlestick.",
  }
}
```

Item flags: `takeable, container, openable, open, locked, key (which lock), lightSource,
lit, fuel, fixed, treasure, worn, edible, weight, points, capacity, contents`.

Room fields: `name, desc, exits, dark, flags`. Exits are either a room id string or an
object `{ to, via (flag required), locked, lockedMsg }`.

Puzzles that need custom logic attach a handler in the same file (still "edit world.js
only"):

```js
on: { unlock: (ctx) => { ctx.setFlag(...); ctx.print(...); ctx.kill(...); ctx.score(...); } }
```

The engine runs default behavior unless a handler overrides it. Declarative data for the
90% case; a JS escape hatch for the clever 10%. The `ctx` API exposed to handlers:
`print, moveItem, setFlag, getFlag, kill, addScore, unlock, has (in inventory), here
(item in room), destroy, spawn`.

---

## 4. The parser

Classic Infocom style, richer than strict two-word.

- **Structure:** `verb [article] [adjective] noun [preposition] [article] [adjective] noun]`
  → `unlock the oak door with the brass key`, `put locket in reliquary`
- **Directions:** `north/n, s, e, w, ne, nw, se, sw, up/u, down/d, in, out`
- **Verbs:** look/l, examine/x, go, take/get, drop, open, close, lock, unlock, read,
  search, move/push/pull, turn on/off, light, extinguish, attack/kill … with …, eat,
  drink, wear, remove, throw … at …, enter, climb, ring, touch, listen, smell, give … to …
- **Meta:** inventory/i, wait/z, again/g, look, score, save, restore, restart,
  verbose/brief, help, quit
- **Niceties:** synonyms, "it" pronoun resolution, up-arrow command history, tolerant of
  articles, helpful errors ("I don't know the word 'X'." / "You can't see any X here.").

---

## 5. Cruel mechanics (classic difficulty)

- **Darkness = death.** Enter a dark room with no active light source:
  *"It is pitch black. You are likely to be eaten by a grue."* Act again while still in
  the dark → eaten. Instant death.
- **Light is limited.** The candlestick has fuel that burns each turn while lit, with
  low-fuel warnings before it dies. Matches (to light it) are consumable.
- **Sudden-death traps:** the dry well (climb down without a rope → fatal fall), the crypt
  wraith (fatal without protection), the rotted attic floor (crashes through if you're
  overloaded).
- **Inventory limit:** carry capacity forces planning; interacts with the attic trap.
- **Poison / wrong-item deaths** for the reckless.
- **Soft-locks:** one or two authentic unwinnable states are possible (e.g., wasting a
  one-use consumable). Autosave + SAVE/RESTORE are the safety net.
- **Death screen:** score + rank, then RESTORE / RESTART / QUIT.

---

## 6. The mansion — v1 map (~16 rooms)

```
             [Attic]
                | (ladder)
[Nursery]—[Landing]—[Master Bedroom]
             |          |
          [Study]    (stairs)
                |
 EXTERIOR      GROUND FLOOR
 [Gate]     [Grand Hall / Reliquary]—[Parlor]
   |          |          |
 [Garden]—[Porch]    [Library]—(secret)—[Secret Chamber]
   |(well)     |
            [Dining Room]—[Kitchen]
                              | (dark, need light)
                          [Wine Cellar]—[Crypt]
```

16 rooms: exterior (Gate, Garden, Porch), ground floor (Grand Hall, Parlor, Library,
Secret Chamber, Dining Room, Kitchen), upstairs (Landing, Nursery, Study, Master Bedroom,
Attic), and the dark cellar/crypt (Wine Cellar, Crypt).

---

## 7. Puzzle & treasure chains (v1)

- **Get inside:** mailbox on the porch (a wink at Zork) holds a warning letter; the
  front-door key is hidden in the garden — under the statue, or down the well (needs a rope).
- **Make light:** silver candlestick (dining room) + matches (kitchen) → survive the
  cellar & crypt.
- **The diary** (study) reveals the **safe** combination (behind the portrait); the safe
  holds a treasure.
- **Music box** (nursery) yields a tiny key → opens the **jewelry box** (master bedroom) →
  ruby ring.
- **Library lever** opens the **secret chamber** → the curse's focus.
- **Crypt:** need protection (salt / talisman) to face the wraith and claim the final heirloom.
- **Win:** deposit all heirlooms in the **reliquary** + perform the ritual → curse lifts,
  you escape.

**~7 heirloom treasures**, each worth points: silver candlestick, gold locket,
first-edition grimoire, jeweled music box, ruby ring, ancient coin (well), crystal
decanter (wine cellar).

---

## 8. Scoring

Points for finding treasures, more for depositing them in the reliquary, plus milestone
points. `SCORE` shows points + turn count. End rank scales like Zork:
*Trespasser → Amateur Ghost-Hunter → Seasoned Investigator → Master of Blackwood Manor.*

---

## 9. Look & feel

Green-on-black **CRT terminal**: monospace, subtle scanline + faint flicker (toggleable),
blinking block cursor, ASCII title banner. Scrolling transcript, command line pinned at
the bottom, responsive for laptop/tablet. Up-arrow command history.

---

## 10. Testing

`tests/walkthrough.js` drives the DOM-free core through a **complete winning playthrough**
and asserts victory + final score, plus a few **death-path assertions** (grue, well,
overloaded attic). Run with `node tests/walkthrough.js` — the regression net for every
future expansion.

---

## 11. How to expand (the whole point)

Everything player-facing lives in `js/world.js`:
- **Add a room:** add an entry to `rooms` and wire an exit from an existing room.
- **Add an item:** add an entry to `items` with `loc` set to a room id.
- **Add a puzzle:** attach an `on: { verb: handler }` to a room or item using the `ctx` API.
- **Re-run** `node tests/walkthrough.js` to confirm nothing broke (update the walkthrough
  if the solution path changed).

---

# 12. Current state — everything built since v1 (living record)

*Last updated: 2026-09-09. This section supersedes the v1 spec where they differ.*

Everything is still **content-in-`world.js`, engine stays generic**. A few small, generic
hooks were added to the engine to support new content — none of them know anything about
the mansion.

## 12.1 Distribution & how to play
- **Web (canonical):** pure static files in `web/`. Play locally by double-clicking
  `web/Play Blackwood Manor.command` (serves on a free port over http so Chrome's `file://`
  module block doesn't bite). A LaunchAgent (`com.dhackel.blackwood-manor`) also serves it
  on `127.0.0.1:8137` from `web/`.
- **Live website:** pushing to `main` auto-deploys the `web/` folder to GitHub Pages via
  `.github/workflows/pages.yml` → **https://dhackel-games.github.io/blackwood-manor/**
  (`web/.nojekyll` keeps Pages from mangling the JS modules). Repo is public.
- **Push flow:** the game repo is on David's personal `dhackel-games` GitHub, so pushes need
  `gh auth switch --user dhackel-games` first, then switch back to `dhackel_adobe` (work repos
  use SSH and are unaffected). (Alternative that avoids switching accounts:
  `git -c credential.helper='!f() { echo username=dhackel-games; echo password=$T; }; f' push`
  with `T=$(gh auth token -u dhackel-games)`.)
- **Version stamp:** `web/js/version.js` is the single source of truth (`VERSION`,
  `BUILD_DATE`). It renders in the intro banner *and* in the always-visible HUD (top left),
  so you can confirm at a glance which build a browser is actually running. **Bump it in the
  same commit as any gameplay/engine change**, and keep `web/package.json` in sync. This
  matters because Pages serves `js/` with `cache-control: max-age=600` — a tab can lag ~10
  minutes behind a push, so if the HUD version is stale, hard-refresh (Cmd+Shift+R).
- **iOS:** `ios/` is a SwiftUI + `WKWebView` wrapper bundling `web/` for offline play, with a
  native `app://` scheme handler and a native speech-to-text bridge. Bundle
  `com.dhackel.BlackwoodManor`, team `9W789FP4LG`.

## 12.2 Generic engine hooks added since v1 (all optional, content-free)
- **`world.tick(game)`** — called once per world turn from `core.tick()`. Returns an optional
  message (appended to output) and may call `ctx.kill()` / `ctx.win()` to end the game
  mid-tick. Drives the **burn-up timer** and **food afflictions**.
- **`world.statusBanner(game)`** — returns a string appended to every room description
  (`core.describeRoom`). Drives the **ASCII fire / sickness art**.
- **`world.endBadges(game)`** — returns extra lines for the **win screen** (achievement badges).
- **Room-handler injection** — at module load, `world.js` wraps every room's
  `on.light/burn/extinguish/off` with a self-immolation interceptor, so "light self on fire"
  works in **any** room without per-room code (falls through to the normal command otherwise).
- **`game.getFlag` returns the raw value** (not coerced to boolean), so numeric flags
  (`phoneBill`, `burnTurns`, `sick`, `high`, `fireTab`, `garyXP`) work.
- **New parser verbs:** `burn`, `sit`, `use`, `flush` (plus the v1 set).
- **Command chaining** — `parser.splitCommands()` splits a raw line on `.`, `;`, `,` or a
  standalone `then`, and `game.send()` runs each part as its own turn (`runOne`), capped at
  20 per line. The chain **aborts** on an unknown word, on death/victory, or if you pick up
  the hint line, so a typo can't half-execute the rest. A single command returns its text
  verbatim; a chain prefixes each result with `> <cmd>` so the transcript stays readable.
  Input is **not** split while `onCall` — Gary hears your commas.

## 12.3 Gary, the 1-900 hint line (the centerpiece)
- `call`/`dial`/`hint` opens a **conversation** (`onCall` routes all input to
  `world.hotlineTalk` until you `hang up`). Grumpy, starving, underpaid operator who gives
  genuinely progress-aware hints (`nextHint`) but needles you.
- **Billing:** 99¢/min meter (`phoneBill`), milestone jabs at $5/$10/$20/$35/$50, and a
  **Hall-of-Shame rank** on the end screen (`phoneRank`): Frugal → Chatty → Best Customer →
  Funding the Hint Line → Worst Caller of All Time.
- **Hunger asides** spliced into ~45% of hints.
- **Therapist arc** driven by `garyXP` (bumps every dial-in + exchange), 4 stages:
  grumpy → cracking/oversharing → reluctant therapist → full "Wellness Line." The hint is
  ALWAYS still delivered (`frameHint` wraps `nextHint`); the call-screen subtitle changes with
  the stage. Hotline-only.

## 12.4 Voice
- **Gary speaks** via Web `speechSynthesis` (low, gruff), muted by default for work safety.
  **Toggle by tapping the pulsing "GARY" avatar** on the call screen (or the hint under it);
  avatar glows solid when voice is on.
- **Speech-to-text:** browsers use `webkitSpeechRecognition`; the iOS app uses a native
  `SFSpeechRecognizer` bridge exposed as `window.webkit.messageHandlers.speech`.

## 12.5 Hidden wing / true ending
- Ringing the bell (once all heirlooms are deposited) no longer ends the game — it lifts the
  curse, drops a **BONE KEY**, and opens a **secret door** in the Grand Hall → Hollow Passage
  → Hollow Sanctum, where a **SILVER MIRROR** and the matriarch's spirit wait. Take the mirror
  and step into the dawn for the true ending (+30). **Full win score 155** (125 heirlooms + 30
  mirror).

## 12.6 The fire subsystem (Andy's idea, expanded)
- **Self-immolation anywhere:** `light self on fire` / `burn self` / `light fire` → `onFire`.
- **Burn-up timer:** 5 escalating warning turns, then you burn to **ash** on the 6th
  (`stepBurn` / `BURN_LINES` / `BURN_DEATH`). Escapes: `extinguish self` (stop-drop-roll),
  the **brazier** (§12.7), or Gary's fire brigade (§12.8). The fire is paused only by NOT
  taking turns — and it even advances **on the phone** (see §12.8), so you can burn up on hold.
- **ASCII fire art** is stamped onto every room description while ablaze (`statusBanner`).
- **Burning the letter:** the Zork mailbox leaflet is now flammable (`burn letter`).

## 12.7 The brazier fire-puzzle (garden)
- A cold iron **brazier** whose grave-damp moss a match cannot light — the only way to light
  it is to be **on fire yourself** and `light brazier`. Your fire leaps into it: you're put
  out, the bowl blazes, and it yields an **EMBER STONE (+10)**. Optional, self-contained.

## 12.8 Gary while you're on fire
- Dialing in ablaze: Gary smells smoke, quotes a **$1.99** premium (`fireTab`, tracked
  separately from the main meter so the numbers land cleanly).
- **"Call the fire department!"** → he dials slowly, quotes **$2.98**, and demands **pizza money**.
- **Glass of water gag:** Gary periodically offers a glass of water; there is no water; biting
  wastes a turn and burns you more (a lone "yes" is water, but "yes, pizza money" is not).
- **Pizza:** when Gary finally eats a pizza there's a **50% chance** of a "biblical, two-ended
  gastrointestinal reckoning" (he abandons you to the brigade mid-catastrophe); otherwise he's,
  for one shining moment, happy. Either way the fire brigade hoses you out.
- Every line you speak while ablaze feeds the fire; dawdle long enough and you **burn up on hold**.

## 12.9 Food & afflictions (kitchen) + the privy
- **Strange mushrooms** → `high` (trippy per-turn flavor, harmless).
- **Rancid meat** → `sick` = violent vomiting & diarrhea; **lethal in ~20 turns if uncured**,
  with an **ASCII sick banner** on every room description and escalating dehydration warnings.
- **Good cheese** → real food: cures affliction, +5, "fortified" (and the "Ate Well" badge).
- **The privy** (ivy-choked outhouse east of the garden) has a **toilet**: `sit`/`use`/`flush`
  cures the sickness ("private, thorough, deeply cathartic").

## 12.10 End-screen badges (`endBadges`)
- 🔥 **"Out Of The Frying Pan"** — escaped *while still on fire* (the escape banner also gets a
  🔥 after "alive").
- 🕯️ **"The Old Ways"** — lit the brazier with your own body.
- 🥵 **"Slow Burn"** — stayed ablaze 4+ turns and lived.
- 🧀 **"Ate Well"** — ate the good cheese.

## 12.11 Testing
`node tests/walkthrough.js` now covers **10 groups**: engine units, full winning walkthrough,
death traps (attic/well/grue), Gary conversation + billing, hall-of-shame ranks, the hidden
wing, the mailbox→burn→self-immolation→Gary fire call, and the burn-up timer + brazier + foods
+ toilet + badges, plus the Gary voice-layer gate and the crisis guard. Keep it green on every change.

## 12.12 Command chaining (v2.1.0)
`splitCommands()` in `parser.js` splits an input line on `.` `;` `,` and a standalone `then`,
and `core.js` runs each fragment through `runOne()` in order. So
`n. open mailbox. get letter. read letter` works.

- **Aborts** the rest of the chain on: an unknown word, death, victory, or picking up the phone.
- **Never splits while `onCall`** — Gary is a conversation and commas belong to him.
- Capped at `MAX_CHAIN = 20`; `g`/`again` repeats the previous *chain*.
- `game.send()` stays **synchronous** so the engine and tests are unaffected.

## 12.13 The build stamp (v2.1.0)
`js/version.js` is the single source of truth (`VERSION`, `BUILD_DATE`), shown in the banner and
always-visible in the HUD. GitHub Pages serves `js/` with `cache-control: max-age=600` and module
imports aren't cache-busted, so a tab can lag ~10 minutes behind a push. If the HUD version
doesn't match what you deployed, hard-refresh. **Bump it in the same commit as any engine change.**

## 12.14 Gary's on-device brain (v2.2.0)
Gary can now *think*. He runs on **Apple Foundation Models** — the ~3B on-device model in
iOS 26 / macOS 26. Free, private, offline, no API key, no token cost.

**The one rule: the model is a VOICE, never a source of truth.**
During prototyping the model was explicitly instructed to deliver a specific hint and it
*silently dropped it*. In a hint line that is the unforgivable bug. So everything that matters
stays deterministic in JS — the real hint text, the meter, the bill milestones, XP/stage, rude
detection, hang-ups, score, and the fire rescue. The model only re-voices turns that are pure
conversation.

`world.garyTurnInfo(ctx, text)` is the gate. It returns `llmOk: false` for anything
`MECHANICAL`, anything while `onFire`, and anything matching `CRISIS`. `tests/walkthrough.js`
group 3b asserts this and will fail if a mechanical branch ever becomes model-voiced.

**Providers** (`js/gary-brain.js`, tried in order, every failure path returns `""` = use canned):

| Provider | Where | Transport |
|---|---|---|
| `native` | iOS/macOS app | `window.webkit.messageHandlers.gary` → `GaryBridge` |
| `daemon` | Mac, local play | `POST http://127.0.0.1:8138/gary` (`mac/gary-daemon`) |
| `null` | public web site | canned lines only |

The public GitHub Pages site is **always canned Gary**, by choice. The obvious guess is that
this is mixed-content blocking, but it was measured and it isn't: Chrome *does* let an `https:`
page reach `http://127.0.0.1` (verified — with Chrome's loopback check disabled, the live site
connected to the daemon and logged `on-device voice active via "daemon" provider`). What Chrome
now does is gate loopback behind the **Local Network Access permission**. Probing from the public
site would therefore ask every stranger who opens a text adventure whether it may "access devices
on your local network" — alarming, malware-shaped, and pointless, since anyone running the daemon
is playing locally anyway. Safari blocks the request outright regardless. So `isLocalPage()` skips
the probe unless the page is itself served from localhost. Smart Gary happens on local play
(`Play Blackwood Manor.command` starts the daemon if it's been built) or in the app.

**Personas** live as pure data in `js/gary-profile.js`. `HINTLINE_STAGES[0..3]` mirror
`garyStage()` (grumpy → cracking → reluctant therapist → full therapist); `FIREFIGHTER` exists
for the fire call. Swapping Gary's job is a data edit, not a code change.

**Lessons from a 3B model** (all encoded in `SHARED_RULES` / `clean()`):
- *Few-shot examples matter far more than description.* A prose persona produced a generic
  helpful assistant; three tone examples produced Gary. But it then parrots them verbatim
  unless told the examples are **tone only** and sampling is raised
  (`.random(top: 40)`, `temperature 1.0`).
- It leaks `Gary:` prefixes, wrapping/smart quotes, third-person narration
  (`Gary sighs and says, "…`), extra paragraphs, and motivational filler. `clean()` strips or
  rejects all of it; returning `""` falls back to the hand-written line, which is always safe.
- It swears. Hand-written Gary never does, so profanity is **rejected**, not just discouraged.
- *Reusing a session makes him drift.* A cached `LanguageModelSession` is much faster
  (~0.5s vs ~1.6s) because the KV cache stays warm, but the model follows its own
  accumulating transcript: by turn ~15 Gary had stopped being broke and was producing
  mystical free verse about a house he's never entered. Capping turns-per-session reduced it
  but didn't remove it. **Every request now gets a fresh session.** It costs ~1s, which reads
  as Gary pausing, and drift becomes structurally impossible.

**Crisis handling.** Late-stage Gary plays therapist as a joke. A real person typing real
despair is not a joke, so it is handled **deterministically before the meter runs and before
any model sees the text**: the bit drops, the call ends, nothing is billed, and it points at
988. `CRISIS` is deliberately narrow — this game is full of "kill the wraith" and "I died
again", so bare kill/die/dead must not match. Both directions are tested.


## 12.15 MAP MODE (v2.3.0)

`web/js/map.js` draws the manor as a hand-sketched floor plan on a torn-out page — Gary's
placemat. `MAP` (also `M`, `CHART`, `FLOORPLAN`) works in the game *and* on the phone, because
Gary tells you to type it and a hint line that lies to you is worse than no hint line.

**It orients you; it never solves anything.** That distinction drives every rule:

- Rooms you haven't entered render as `?????`, so you get the *shape* of the house — how many
  rooms, how they connect — without being handed the contents.
- The secret wing (`hollowPassage`, `hollowSanctum`) and the hidden chamber (`secretChamber`)
  are the best discoveries in the game, so they aren't drawn at all until you stand in one.
  Hiding them leaves gaps in the grid, and a conspicuous gap is itself a spoiler — hence the
  row compaction in `drawFloor()`.
- Landmarks like `(Porch)` repeat a room on another floor's panel for orientation. An anchor
  whose only partner is hidden is dropped: a lone `(Library)` floating in the BELOW panel
  announces the secret chamber as loudly as drawing it would.
- Footnotes name rooms ("Grand Hall goes UP to the Landing"), so they're gated behind
  `footIf` — a floor's note stays hidden until you've seen the room it's about.
- The room you're standing in always counts as seen, which also covers turn one.

All of the above is asserted in the test suite; the map is easy to make accidentally
spoiler-y, so the tests are the guard rail.

**Gary offers it when you're actually stuck**, and that judgment is deterministic
(`noteStuck()` in `world.js`), never the model's: ask for a hint twice without your score
moving and you're spinning, so he mentions the placemat — once, then never nags again.
Scoring a point resets the streak.

**Rendering.** The transcript is `white-space: pre-wrap`, which folds ASCII art into confetti
on a phone, and the TTS voice would cheerfully read the torn edge out loud. `renderMap()`
wraps its output in a `MAP_MARK` (U+001F) sentinel; `ui.js` splits on it to emit the block in
its own non-wrapping `.map` element and to strip it from anything sent to `garySpeak()`.
The `.map` font-size is a `clamp()` on viewport width so the widest panel fits an iPhone.


## 12.16 Telling the model apart from the script (v2.4.0)

The whole point of 12.14 is that a failed model call is *invisible* — `speak()` returns `""`
and the hand-written line runs instead. That is correct for players and terrible for whoever is
testing it: the first real playtest produced seven canned replies in a row and looked exactly
like a working model having a boring night. (It wasn't. The provider was `null`.)

So the state is now on screen, and it is stated **per line**, not just globally:

- **Header badge** — `◆ AI VOICE · on-device (daemon)` when a provider answered,
  `○ scripted Gary · tap` when not. Tapping it prints the reason into the transcript, so a
  remote tester can read it back instead of being asked to open devtools.
- **`Gary is thinking`** with a blinking cursor replaces the old bare `...` placeholder.
- **A `◆` and a left rule on every line the model actually wrote.** This is the important one.
  The badge only says a provider *exists*; the marker says *this specific sentence came from
  the model*. When `speak()` falls back mid-call the line is deliberately left unmarked —
  a badge that lies is worse than no badge.

**`?llm` opt-in.** The public site still never probes loopback by default, for the reason in
12.14 (Chrome's Local Network Access prompt). But "clone the repo and run a Swift daemon" is
not a thing you can ask a playtester to do just to see the feature, and the alternative was
shipping people a URL where the AI is silently absent. `?llm` opts in explicitly and is
remembered in `localStorage`; `?llm=0` opts out. The permission prompt then belongs to someone
who deliberately asked for it, which was always the real objection — not the prompt itself, but
showing it to strangers who never asked.

**Don't try to detect macOS from the browser.** The user-agent has been frozen at `10.15` for
years and will lie to you. The daemon is the detector: it refuses to boot when the model is
unavailable and prints why, and `/health` reports availability. The launcher surfaces that text
directly instead of guessing.
