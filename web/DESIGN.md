<!-- DESIGN.md. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-12.067:acoven. -->

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
them in the reliquary in the Royal Hall, and lift the curse to escape alive.** Linger in
the dark too long, and something finds you.

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
├── tests/
│   ├── features/         # all executable Gherkin specifications
│   └── steps/            # Cucumber step definitions + fixtures
├── DESIGN.md
└── README.md         # how to play + how to add a room
```

**Expandability contract:** adding a room, item, or puzzle means editing only `world.js`.
The engine never changes. Core logic is DOM-free so a Node script can play a full winning
walkthrough and assert victory (regression safety as the world grows).

Pure static files with no application backend or framework. The local launcher
serves them over loopback because browser ES modules cannot run reliably from `file://`.

### Source-file identity header

Every maintained text source or test file that supports comments begins with:

```text
{comment} {filename}. Copyright (c) dhackel-games. All Rights Reserved. 2026...YYYY-MM-DD.BBB:{last editor}.
```

`BBB` is the zero-padded app build number and the final token names the last
editor. Use the language's native comment delimiter (`//`, `#`, `/* ... */`, or
`<!-- ... -->`); a required shebang remains line one and the identity header is
line two. Example for this build:

```js
// version.js. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-12.067:acoven.
```

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

Item flags: `takeable, container, openable, open, locked, keyId, lightSource,
selfPowered, lit, fuel, fixed, treasure, wearable, wearSlot, autoWearOnTake,
carryCapacity, worn, edible, points, capacity, roomDesc`.

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
  Equipped items remain in inventory but do not count toward this limit.
- **Poison / wrong-item deaths** for the reckless.
- **Soft-locks:** one or two authentic unwinnable states are possible (e.g., wasting a
  one-use consumable). Autosave + SAVE/RESTORE are the safety net.
- **Death screen:** score + rank, then RESTORE / RESTART / QUIT.

---

## 6. The mansion — v1 map (~16 rooms)

```
             [Attic]
                | (ladder)
[Nursery]—[Landing]—[Grand Bedroom]
             |          |
          [Study]    (stairs)
                |
 EXTERIOR      GROUND FLOOR
 [Gate]     [Royal Hall / Reliquary]—[Parlor]
   |          |          |
 [Garden]—[Porch]    [Library]—(secret)—[Secret Chamber]
   |(well)     |
            [Dining Room]—[Kitchen]
                              | (dark, need light)
                          [Wine Cellar]—[Crypt]
```

16 rooms: exterior (Gate, Garden, Porch), ground floor (Royal Hall, Parlor, Library,
Secret Chamber, Dining Room, Kitchen), upstairs (Landing, Nursery, Study, Grand Bedroom,
Attic), and the dark cellar/crypt (Wine Cellar, Crypt).

---

## 7. Puzzle & treasure chains (v1)

- **Get inside:** mailbox on the porch (a wink at Zork) holds a warning letter; the
  front-door key is hidden in the garden — under the statue, or down the well (needs a rope).
- **Make light:** silver candlestick (dining room) + matches (kitchen) → survive the
  cellar & crypt.
- **The diary** (study) reveals the **safe** combination (behind the portrait); the safe
  holds a treasure.
- **Music box** (nursery) yields a tiny key → opens the **jewelry box** (grand bedroom) →
  ruby ring.
- **Library lever** opens the **secret chamber** → the curse's focus.
- **Crypt:** need protection (salt / talisman) to face the wraith and claim the final heirloom.
- **Win:** deposit all heirlooms in the **reliquary** + perform the ritual → curse lifts,
  you escape.

**12 required family heirlooms**, each worth points: silver candlestick, gold locket,
first-edition grimoire, jeweled music box, ruby ring, ancient coin (well), crystal
decanter (wine cellar), ancestral portrait, the Blackwood family crest, and a dusty
Blackwood family ring marked BM, the BM spyglass recovered from the tree fort, and
the BM-crested protective talisman after it has served against the crypt wraith.

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

Executable Gherkin under `tests/features/` covers the DOM-free engine, a **complete winning
walkthrough**, Gary, fire and food behavior, map secrecy, and death paths. Cucumber step
definitions and fixtures live in `tests/steps/`. Run the complete local suite with `npm test`.

---

## 11. How to expand (the whole point)

Everything player-facing lives in `js/world.js`:
- **Add a room:** add an entry to `rooms` and wire an exit from an existing room.
- **Add an item:** add an entry to `items` with `loc` set to a room id.
- **Add a puzzle:** attach an `on: { verb: handler }` to a room or item using the `ctx` API.
- **Re-run** `npm test` to confirm nothing broke (update the walkthrough if the solution
  path changed).

---

# 12. Current state — everything built since v1 (living record)

*Last updated: 2026-09-10. This section supersedes the v1 spec where they differ.*

Everything is still **content-in-`world.js`, engine stays generic**. A few small, generic
hooks were added to the engine to support new content — none of them know anything about
the mansion.

## 12.1 Distribution & how to play
- **Web (canonical):** pure static files in `web/`. Play locally by double-clicking
  `web/Play Blackwood Manor.command` (serves on a free port over http so Chrome's `file://`
  module block doesn't bite). Its custom Python handler sends `no-store` headers,
  preventing mixed-version ES-module caches. A LaunchAgent (`com.dhackel.blackwood-manor`) also serves it
  on `127.0.0.1:8137` from `web/`.
- **Live website:** pushing to `main` auto-deploys the `web/` folder to GitHub Pages via
  `.github/workflows/pages.yml` → **https://dhackel-games.github.io/blackwood-manor/**
  (`web/.nojekyll` keeps Pages from mangling the JS modules). The deployment
  manifest tool stamps every module URL with the same `CONTENT_VERSION` cache key, so a
  browser cannot mix modules from different builds. Repo is public.
- **Push flow:** the game repo is on David's personal `dhackel-games` GitHub, so pushes need
  `gh auth switch --user dhackel-games` first, then switch back to `dhackel_adobe` (work repos
  use SSH and are unaffected). (Alternative that avoids switching accounts:
  `git -c credential.helper='!f() { echo username=dhackel-games; echo password=$T; }; f' push`
  with `T=$(gh auth token -u dhackel-games)`.)
- **Copyright-version stamp:** `web/js/version.js` is the single source of truth (`VERSION`).
  It renders verbatim in the intro banner and always-visible HUD. Its format is
  `Copyright (c) dhackel-games. All Rights Reserved. 2026...YYYY-MM-DD.0aNN:username` where
  `0aNN` increments for each build on that date. **Bump it in the same commit as any
  gameplay/engine change** and encode the release date in `web/package.json` as the date-only
  SemVer `YYYY.M.D`. Pages serves `js/` with `cache-control: max-age=600`,
  so a stale tab can lag about 10 minutes behind a push; hard-refresh when the HUD stamp differs.
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
  **Toggle by tapping the pulsing speaker avatar** on the call screen (or the hint under it);
  avatar glows solid when voice is on.
- A compact selector beside the mute hint provides four remembered presets: COMPUTER MALE
  (the original Fred-style novelty voice), COMPUTER FEMALE, AUSTRALIAN MALE, and AUSTRALIAN
  FEMALE. Each preset prefers known system voices, falls back by locale, and supplies its
  own pitch and rate. Gendered fallback lists prevent the Australian presets from collapsing
  onto the same voice when only one Australian system voice is installed.
- **Speech-to-text:** browsers use `webkitSpeechRecognition`; the iOS app uses a native
  `SFSpeechRecognizer` bridge exposed as `window.webkit.messageHandlers.speech`.
  Both stay active across natural pauses and submit the accumulated phrase only
  when the MIC is tapped again.
- Ending a call keeps Gary's final line on screen, disables END CALL, fills that
  button as a speech-progress indicator, and dismisses the phone only after
  speech completion (or a bounded safety timeout).

## 12.5 Hidden wing / true ending
- Ringing the bell (once all heirlooms are deposited) no longer ends the game — it lifts the
  curse, drops a **BONE KEY**, and opens a **secret door** in the Royal Hall → Hollow Passage
  → Hollow Sanctum, where a **SILVER MIRROR** and the matriarch's spirit wait. The mirror is
  an optional +30-point trophy: it unlocks no route or ending, and stepping into the dawn
  without it still wins.

## 12.6 The fire subsystem (Andy's idea, expanded)
- **Self-immolation anywhere:** `light self on fire` / `burn self` / `light fire` requires
  a real ignition source. With only the one-use match, the parser asks `(with match?)`; only
  `YES` or an explicit `with match` consumes it. With both the match and burrito foil, it asks
  which source to use.
- **Fart-flame ignition:** eating the kitchen burrito leaves its crumpled foil wrapper in
  inventory. During the resulting digestive cycle, trying to ignite with the foil queues the
  attempt until the next flaming fart or spicy, sparking diarrhea beat. Either event can ignite
  the player. After the illness is cured or completes, the wrapper and permanent digestive
  pilot light allow on-demand self-immolation anywhere. The wrapper is reusable while carried;
  dropping it cancels a queued attempt.
- **Burn-up timer:** 5 escalating warning turns, then you burn to **ash** on the 6th
  (`stepBurn` / `BURN_LINES` / `BURN_DEATH`). Escapes: `extinguish self` (stop-drop-roll),
  the **brazier** (§12.7), or Gary's fire brigade (§12.8). The fire is paused only by NOT
  taking turns — and it even advances **on the phone** (see §12.8), so you can burn up on hold.
- The always-visible HUD shows `🔥 6 turns` immediately on ignition and counts down until
  the fire is extinguished or becomes fatal.
- **ASCII fire art** is stamped onto every room description while ablaze (`statusBanner`).
- The player's own flames count as a light source in dark rooms.
- **Burning the letter:** the Zork mailbox leaflet is now flammable (`burn letter`).

## 12.7 The brazier fire-puzzle (garden)
- A cold iron **brazier** whose grave-damp moss a lone match cannot light. A carried
  **lit candlestick** can ignite it by patiently lighting several points, or the player
  can be **on fire** and `light brazier` to transfer the whole blaze. Either route yields
  the red **EMBER STONE** needed by the GREAT OAK'S RGB mechanism and awards +10
  for solving the fire puzzle.

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
- **Strange mushrooms** → `high` (trippy per-turn flavor, harmless). The dried kitchen
  cluster lasts 6 turns. A purple glimmer subtly invites the player to `LOOK IN TOILET`;
  only then are the fresh, shit-and-piss-covered mushrooms revealed inside the OUTHOUSE's
  TOILET HOLE. They last 12 turns. `GET MUSHROOMS FROM TOILET` or
  `REACH INTO TOILET FOR MUSHROOMS` retrieves them after inspection.
- **Gary's Mega Ass Blow Taqueria Death Wish Spicy Burrito** contains two kinds of beans,
  three cheeses, four meats, and lettuce suggestive of *Cyclospora cayetanensis*. Eating it
  destroys the burrito, moves its crumpled wrapper and tin foil into inventory, and starts
  `sick`: stomach-acid burp → barf → flaming fart → spicy, sparking diarrhea. That four-turn
  cycle repeats ten times and is lethal after its 40th uncured beat. Each event carries its
  own non-wrapping ASCII drawing rendered through the same mobile-safe block path as MAP MODE.
- The always-visible HUD shows a compact `💩 BM` pressure bar and a `🤮` countdown with the
  current four-beat phase: `BURP 🫧`, `BARF 🤮`, `FART 💨`, or `POOP 💩`.
- **Cold milk** → a drinkable cure for the affliction, +5, "fortified" (and the "Got Milk?" badge).
- **The privy** (ivy-choked outhouse east of the garden) has a wooden seat over a raw
  **TOILET HOLE**. `SIT`/`USE` cures the sickness and cancels queued fart-flame ignition;
  `FLUSH` cannot work because there is no plumbing.

## 12.10 End-screen badges (`endBadges`)
- 🔥 **"Out Of The Frying Pan"** — escaped *while still on fire* (the escape banner also gets a
  🔥 after "alive").
- 🕯️ **"The Old Ways"** — lit the brazier with your own body.
- 🥵 **"Slow Burn"** — stayed ablaze 4+ turns and lived.
- 🥛 **"Got Milk?"** — drank the curative milk.
- 🆘 **"Helpless"** (+15) — finished without MAP, HELP, or Gary's CALL/HINT line.
- 🙈 **"Extra Super Duper Helpless"** (+20 beyond HELPLESS) — also never issued
  LOOK, EXAMINE, or SEARCH. Automatic prerequisite actions do not count.
- ⏩ **"No Takebacks"** (+10) — finished without explicitly using SAVE or RESTORE.

## 12.11 Testing
`npm test` runs all executable Gherkin. `npm run test:unit` selects engine state, parsing,
commands, inspection, persistence, build metadata, touch contracts, and Gary output guards via
the `@unit` tag. `npm run test:walkthrough` selects the full winning walkthrough, death traps,
Gary conversation and billing, the hidden wing, source-gated self-immolation, the burrito cycle,
map behavior, and badges via the `@walkthrough` tag.

## 12.12 Command chaining (v2.1.0)
`splitCommands()` in `parser.js` splits an input line on `.` `;` `,` and a standalone `then`,
and `core.js` runs each fragment through `runOne()` in order. So
`n. open mailbox. get letter. read letter` works.

- **Aborts** the rest of the chain on: an unknown word, death, victory, or picking up the phone.
- **Never splits while `onCall`** — Gary is a conversation and commas belong to him.
- Capped at `MAX_CHAIN = 20`; `g`/`again` repeats the previous *chain*.
- `game.send()` stays **synchronous** so the engine and tests are unaffected.

## 12.13 The copyright-version stamp (introduced v2.1.0)
`js/version.js` is the single source of truth for the exact copyright-version shown in the banner
and always-visible HUD. The current format combines owner, copyright range, build date, same-day
alphanumeric sequence, acting GitHub username, and rights notice. `package.json` carries the date-only SemVer
(`YYYY.M.D`). GitHub Pages does not cache-bust module imports, so a tab can lag about
10 minutes behind a push. If the HUD stamp differs from the deployed source, hard-refresh.

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
`MECHANICAL`, anything while `onFire`, and anything matching `CRISIS`.
`tests/features/gary-hotline.feature` asserts this and fails if a mechanical branch becomes
model-voiced.

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
Its final section is titled `Visited Locations`; fixed-width row padding keeps both columns
of tractor-feed sprocket holes aligned even though the page border itself is jagged.

**It orients you; it never solves anything.** That distinction drives every rule:

- Rooms you haven't entered render as `?????`, so you get the *shape* of the house — how many
  rooms, how they connect — without being handed the contents.
- The secret wing (`hollowPassage`, `hollowSanctum`), hidden chamber (`secretChamber`),
  ASTRAL CHAMBER, and DREADMAW'S inner vault are discoveries, so they aren't drawn at all
  until you stand in one.
  Hiding them leaves gaps in the grid, and a conspicuous gap is itself a spoiler — hence the
  row compaction in `drawFloor()`.
- Landmarks like `(Porch)` repeat a room on another floor's panel for orientation. An anchor
  whose only partner is hidden is dropped: a lone `(Library)` floating in the BELOW panel
  announces the secret chamber as loudly as drawing it would.
- Footnotes name rooms ("Royal Hall goes UP to the Landing"), so they're gated behind
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

**Discoverability (v2.5.0).** `MAP` also has a button in the touch bar, between `Inv` and
`Call`. A feature you only reach by typing a word nobody told you about is, for most players,
not a feature — Gary's offer only fires once you're measurably stuck, which is late, and the
`HELP` listing is a wall of text. The button costs one wrapped row (`#controls .verbs` is
`flex-wrap: wrap`) and no new wiring: `ui.js` binds every `#controls [data-cmd]` generically,
so `data-cmd="map"` routes through the same `handle()` path as typing it. It sits with the
orientation verbs rather than the phone cluster (`Call`/`Hint`) because `MAP` is ungated — it
is a game command, not a hint-line service, even though Gary is the one who hands it to you.


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

## 12.17 Deep inspection (v2.7.0)

The inspection vocabulary is deliberately forgiving. `SEARCH`, `EX`, `EXAMINE`, `LOOK`, and
`LOOK AT` all converge on the same item-detail path when given a noun. With no noun, each one
reprints the room's base description first, then adds:

- **`searchDesc`** — an authored string or state-aware function on every room. It gives a
  diegetic nudge toward hidden objects or non-obvious puzzle actions without calling Gary.
- **`THINGS YOU CAN ACT ON`** — generated from the live visible item data. It names portable
  and manipulable objects with valid verbs such as `TAKE`, `OPEN`, `READ`, `MOVE`, or `PULL`.

Hidden-object anchors use the same canonical item inspection handler, so `SEARCH STATUE`,
`EX STATUE`, and `LOOK AT STATUE` all discover the garden key rather than arbitrarily requiring
one preferred synonym. The same rule applies to the hinged parlor portrait and its safe.

## 12.18 Room ASCII art (v2.8.0)

Every room defines a compact `art` string depicting either the space or its primary feature.
`core.describeRoom()` renders it before the prose on first entry. Explicit nounless inspection
(`LOOK`, `SEARCH`, `EX`, or `EXAMINE`) renders it again before the room's `searchDesc` and
actionable-item list. Ordinary repeat entry omits the art so navigation does not flood the
transcript. Every art line is capped at 32 characters for the mobile layout.

## 12.19 Persistent touch controls

The control tray is a fixed layout child and never enters a hidden state. A 3×3
eight-arrow compass sits beside a 2×2 level/portal block (`⇧`, `⇩`, and
center-anchored In/Out SVG arrows). To its right, two equal-width action rows
hold four regular-width units apiece; `?` and 🪲 each occupy half a regular slot.
The transcript carries `min-height: 0` so additional room art and inspection
text scroll inside its allotted space rather than pushing controls below the
viewport. Button taps dispatch synchronously, keep the latest output visible,
and only return focus to the command field on pointer-fine desktop devices.

## 12.20 Available-direction summaries

First-entry, explicit-inspection, and verbose room descriptions append
`Directions you can go: north, east, ...`. Brief revisits instead show only
`n, e, ...` on a separate line. The list represents discovered exits: visible doors
remain listed while closed or locked, while secret routes carry a `revealedBy` flag and
join the list only after discovery. Handler-driven routes are data-declared through
`extraDirections`, including the garden well, the attic after its ladder drops, and the
sanctum's northern exit.

## 12.21 Bulk inventory actions

`TAKE ALL` and `GET ALL` collect every currently visible portable object, including
objects exposed inside open containers. The operation respects `maxCarry`, reports each
pickup, and names anything left behind when the player's hands fill. If no portable object
is reachable, it says so explicitly. `DROP ALL` moves every unworn carried item into the
current room and lists worn equipment that remains equipped.

## 12.22 TestFlight release

`ios/release-testflight.sh` refreshes `ios/Resources/www` from canonical `web/` before
generating the Xcode project, so an archive cannot silently contain stale game files.
TestFlight's displayed app version is the date-only `YYYY.M.D` value read from
`web/package.json`; `CURRENT_PROJECT_VERSION` remains a separate monotonically increasing
integer build number. The script archives and exports locally with `--no-upload`, or also
validates and uploads when App Store Connect credentials are available. Each run removes
the previous repository-local `ios/build/`, places DerivedData under that same directory,
and leaves only the current run's artifacts; global/shared Xcode DerivedData is untouched.

## 12.23 Mushroom vision and flight

Eating the strange mushrooms explicitly hints that the player feels light enough to
`FLY TO` a named room. While `high` remains positive:

- Room descriptions append one `THIRD EYE (👁️ N turns left)` heading followed by
  `highDesc` clues for hidden objects. Worn XRAY GOGGLES provide the same clue
  visibility and show `THIRD EYE (👁️ ∞)`.
- `GO TO <room>`, `FLOAT TO <room>`, and `FLY TO <room>` resolve room IDs or names and
  move there directly. Worn WINGED SHOES provide the same named-room flight without
  a countdown.
- The player can descend the garden well without a rope and float through the attic
  trap-door without lowering its ladder or shedding inventory.
- Mushroom vision sees through darkness, but an unprotected arrival in the crypt
  still triggers the wraith.
- Mushroom durations stack additively: both dried kitchen mushrooms and fresh
  TOILET-HOLE mushrooms add 12 turns. Eaten TOILET mushrooms can eventually regrow.
  The always-visible HUD keeps `🍄 <turns>` for the trip itself and also shows
  `👁️ <turns>` for vision and `🪽 <turns>` for flight so future effects can vary
  independently.

## 12.24 Declarative HUD slots

`js/hud.js` owns the HUD architecture. Each `HudSlot` definition provides an `id`, optional
`emoji`, and a `calculate({ game, world })` function. The shared renderer mounts slots,
updates their text, and hides inactive values uniformly. Score and turns share a compact
`🏆 score/turns` slot; phone bill, bowel
pressure, digestive phase, mushroom high, vision, flight, RELIQUARY progress, fire
countdown, and HEADLAMP battery are data entries in one registry rather than separate
DOM mutations in `ui.js`.

## 12.25 Derived actions and player-known codes

`core.runOne()` derives safe convenience actions before dispatch. `READ`, `EAT`, `DRINK`,
and `WEAR` automatically GET a visible portable target and print the complete parenthetical
sequence, such as `(get diary, read diary)`. The world-level `deriveCommand` hook supplies
content-specific prerequisites; TOILET mushroom commands become
`(look in toilet, get mushrooms, eat mushrooms)` without making the player repeat obvious
steps. A nounless `TALK` becomes `(talk to NAME)` when exactly one visible room object has
a TALK handler; ambiguous rooms are never guessed. Derived actions still respect carrying capacity.

The SAFE does not require the `knowsCombo` flag when the player already knows the answer.
After `OPEN SAFE` prompts for its dial, bare `7 3 9` opens it; `OPEN SAFE WITH 7 3 9` works
directly. Reading the DIARY remains the in-world route to learning that code.

Every room also has an explicit entry in `world.implicitNavigation`. Typed or touch-button
`IN` and `OUT` resolve through that table; `LEAVE` and `EXIT` are aliases for `OUT`.
Entering a closed door derives OPEN, and a carried matching key additionally derives UNLOCK.
`OPEN DOOR WITH KEY` runs and displays `(unlock door with key, open door)` as one turn.
`GO <visible door/object>` is normalized to `ENTER <object>` before those derived steps;
named-room GO remains flight when no visible enterable object matches.

## 12.26 Dreadmaw's maze and vault

The FRONT GATE is the grounds fork: east leads to the original garden, OUTHOUSE, and
WELL; west enters a three-room HEDGE MAZE whose short route is west, west, south.
The maze reaches DREADMAW THE DRAGON, an ancient female dragon sleeping across the
cave entrance. TALK, WAKE, MOVE, PUSH, PULL, TOUCH, ATTACK, CLIMB, SHAKE, or NUDGE
makes her randomly breathe fire, belch flame, spin and fart fire, strike with her
tail, swat with a foreclaw, or flick the player with her nose. Fire outcomes leave
the player burning at the cave; physical outcomes inflict injury and launch the
player over the HEDGE MAZE to crash at the FRONT GATE. None moves DREADMAW.
SAY/YELL/SHOUT near sleeping DREADMAW first echoes the utterance, then triggers
the same immobile dragonfire response. Elsewhere, speech echoes and does nothing;
inside the cave, SAY/ANSWER/RECITE supplies the TROLL's rhyme answer.

Only offering the kitchen APPLE wakes DREADMAW pleasantly and moves her aside.
`OFFER`/`GIVE`/`FEED`/`PUT APPLE TO`/`WITH`/`ON DRAGON` all use the same handler.
She awards a GOLD DOUBLOON and allows passage. The outer ANTECHAMBER leads through
a MINING GALLERY, where a 200-turn HEADLAMP hangs, and down a dark DEEP MINING SHAFT
to the TROLL GATE. A male cave TROLL blocks the inner VAULT DOOR there.
`TALK TO TROLL` makes him recite a poem whose final word is missing.
He accepts many valid rhymes through `SAY <word>` or `ANSWER <word>`, including MORE,
DOOR, FLOOR, CORE, ROAR, LORE, SHORE, STORE, and BEFORE. A valid rhyme makes him move
and opens DREADMAW'S VAULT. The intended environmental clue is optional:
`EXAMINE DOUBLOON` reveals LORE etched around its edge. Several alternate rhymes solve
the poem, while GORE is accurately acknowledged as a rhyme but rejected as the intended
word. `SAY <anything> TO TROLL` starts the conversation
without spending a guess; anticipating a valid rhyme before he asks delights him and
opens the VAULT immediately. After three wrong answers, the TROLL folds the
tunnel around the player and sends them back to the FRONT GATE; the three-guess attempt
then resets. Once the VAULT is open, the TROLL no longer repeats the challenge. The vault
contains the required BLACKWOOD FAMILY CREST and WINGED SHOES.

## 12.27 Equipment, hall bedroom, and roofline

Wearable items declare one of seven exclusive body slots: `head`, `forehead`, `eyes`,
`feet`, `finger`, `wrist`, or `neck`. A worn item remains in inventory, cannot be dropped
or put into a container until removed, and contributes zero to `inventoryLoad()`.
The existing TALISMAN and RUBY RING occupy NECK and FINGER; the new HEADLAMP,
XRAY GOGGLES, and WINGED SHOES occupy HEAD, EYES, and FEET.

The BACKPACK hangs on a miner's ledge in the DEEP MINING SHAFT. Taking it
automatically equips it on the BACK and raises carrying capacity from 6 to 20.
The HUD displays used slots as `👤 used/6` before acquisition and `👜 used/20`
afterward; worn equipment does not contribute to the used count.

The HEADLAMP activates when worn, has 200 turns of battery life, lights every room,
and reports remaining power in the `💡` HUD slot. The HALL BEDROOM lies NORTH of
the UPSTAIRS LANDING; its NIGHT TABLE DRAWER contains cheap plastic XRAY GOGGLES
that provide permanent mushroom-style clue vision and darkness sight while worn,
shown as `👁️ ∞`. WINGED SHOES similarly show permanent flight as `🪽 ∞`.
The OBSIDIAN EYE must be worn on the FOREHEAD, where it can coexist with EYES-slot
goggles. It permanently reveals hidden details (`👁️ ∞`) but does not illuminate
dark rooms or affect the `💡` slot; the HEADLAMP remains the durable light source.

Either an active mushroom high or worn WINGED SHOES enables named-room flight.
From the ATTIC, `UP` reaches the MANOR ROOF; the ROOF connects EAST to the BELFRY,
whose ladder descends into the ASTRAL CHAMBER. Both flight sources can also target
ROOF, BELFRY, ASTRAL CHAMBER, and every other named room directly. MAP renders the
HALL BEDROOM, a separate ROOFLINE, and the expanded DREADMAW'S CAVE mine while
preserving spoiler hiding for both secret destinations.

## 12.28 West-wing payoff and open reliquary deposits

- **West-wing payoff.** An ore cart in the CAVE ANTECHAMBER holds the required
  BLACKWOOD FAMILY RING (+20). DREADMAW'S VAULT holds the required BLACKWOOD FAMILY CREST
  (+15) and the wearable WINGED SHOES. The exported `REQUIRED_FAMILY_ITEM_COUNT`
  is the single source for the win threshold and RELIQUARY recess count.
- **Oak route.** The garden brazier's EMBER STONE is the red component for the
  GREAT OAK mechanism. Completing RED · GREEN · BLUE opens the route to the
  required BM SPYGLASS (+8) in the TREE FORT.
- **Consistency fixes.** The RELIQUARY reads its heirloom-recess count from the
  shared required-item constant. WINGED SHOES flight
  now floats up through the *shut* attic trap-door exactly like a mushroom high
  (previously the shoes still required the ladder to be lowered). Gary's hint line
  now explicitly reminds the player to deposit the JEWELED MUSIC BOX itself, not
  just harvest its tiny key.
- **Open deposits.** Any unworn carried item can be put into the RELIQUARY. Required
  heirlooms advance the shared total and score; ordinary objects are accepted but
  explicitly reported as non-contributing. The HUD appears after the first deposit
  in terse `💎 required/12 +extra` form. The RELIQUARY is a glass-fronted cabinet:
  PUT (and explicit retrieval) derives OPEN when needed, but the player must
  explicitly CLOSE the completed cabinet before RING BELL can finish the ritual.

Duplication across the game's several see-in-the-dark and flight mechanisms is a
known, deliberately-deferred design topic (to be revisited later), not addressed here.

### 12.29 Lightning bolt cleanup: use-it-or-lose-it, no jumping into special rooms

The random LIGHTNING BOLT (the manor's own doorless teleport) was tuned to stop it
feeling like a free skeleton key:

- **Use it or lose it.** `LIGHTNING_FUSE` is now `1` (was `4`): the bolt fizzles on
  the very next turn, so you must TOUCH it immediately or miss the window.
- **No special/guarded destinations.** Touching the bolt now teleports only to an
  *ordinary* room. A `LIGHTNING_NO_JUMP` set excludes the secret room
  (BETWEEN THE WALLS), the hidden vaults (ASTRAL CHAMBER), the win-critical hollow
  wing (HOLLOW PASSAGE / HOLLOW SANCTUM), the hidden grimoire chamber
  (SECRET CHAMBER), the wraith CRYPT, and the dragon's treasure vault
  (DREADMAW'S VAULT). The bolt relocates you; it never skips a puzzle or hands you
  an endgame/secret. A side effect: lightning can no longer randomly kill you via
  the crypt wraith.
- **Mystery package unchanged.** COPILOT'S MYSTERY PACKAGE keeps its full-chaos
  teleport (including the +20 BETWEEN THE WALLS jackpot and the crypt risk) — that
  unpredictability is its whole point; the exclusion applies to lightning only.

### 12.30 The secret Gary ending: complete the family collection

Blackwood Manor now has two endings, and completing the collection is a *choice*,
not a single scripted finish.

- **The dawn ending (unchanged).** Deposit all `REQUIRED_FAMILY_ITEM_COUNT` core
  heirlooms, RING THE BELL, take the BONE KEY north through the HOLLOW PASSAGE to
  the HOLLOW SANCTUM, and step into the dawn. This is the "good" ending and is
  untouched.
- **The secret cliffhanger ending.** When every required heirloom is deposited,
  a hidden STAIRCASE grinds open in the floor of the ROYAL HALL. CLOSE the
  RELIQUARY to seal the collection; only then does DOWN become available. Go DOWN and you
  finally meet the voice that's been "helping" you all night: GARY, in the flesh,
  in his squalid basement call-cave — rotary phone, spicy burrito, mushrooms, and
  a fridge of milk (recontextualising his hint-line persona). He clubs you with the
  receiver, grabs your loot, and bolts up the stairs howling "FREEDOM!" This is a
  deliberate **cliffhanger**, not a death or a clean win — it seeds *Blackwood Manor
  II: HELD*.
- **Mechanics.**
  - `everythingDeposited(ctx)` — every required `treasure` item resting in the
    RELIQUARY. When the final piece lands, the ROYAL HALL `put` handler sets the
    `floorDoorOpen` flag and announces the hidden stair. `extraDirections` and
    the DOWN handler additionally require `reliquarySealed`, set only by an
    explicit CLOSE; both the BELL and floor stair then become available.
  - A new terminal state `game.finish(msg, banner)` in `core.js` sits alongside
    `win`/`kill`: it stops the game via `won` and still prints the score/rank, but
    with fully custom framing (no "escaped alive" / "you have died" boilerplate).
  - `saveBm2Seed(ctx)` persists the final `{score, turns}` to `localStorage`
    (`blackwood-bm2-seed-v1`, browser-only, guarded) as the seed for BM2, where the
    scoring inverts: Gary profits when the player fails.
  - The new `garysLair` room is excluded from `LIGHTNING_NO_JUMP` targets so a lucky
    bolt can never drop you into the ending; it's reached on foot only.
- **Foreshadowing.** A `foreshadowTick` adds intensifying ambient dread — a dry
  scritch-scratch early, then faint BELLS and a far-off voice, and finally an
  insistent telephone RINGING from below once the floor opens. It's gated behind the
  same `__noChaos` test kill-switch as lightning and stays silent until you've begun
  filling the reliquary, so the deterministic canonical/early-game tests are
  unaffected.
- **The $0.99/min phone-answering economy** (you working Gary's line to buy your
  freedom, with inverted scoring) is BM2 proper — a separate genre shift — not built
  into BM1. Note the phone/`onCall`/`phoneBill` hint-line infrastructure already in
  the engine is the seed it will grow from.

### 12.31 The GREAT OAK RGB lift and TREE FORT

The path EAST of the PRIVY reaches a GREAT OAK with three sun-facing glass
sockets. BLUE and GREEN begin installed; the BRAZIER'S EMBER STONE supplies RED.
The player can remove and reinsert the stones, but only RED · GREEN · BLUE
focuses a white beam into the overhead pulley. Its PLATFORM then alternates
between the roots and the TREE FORT every turn. Boarding holds it for one turn,
then carries the player on the next.

The fort contains old signal flags, a blanket hideout, a nailed-up slingshot,
and a brass SPYGLASS etched BM. Its rusted cradle points at the BELFRY; looking
through it reveals the maintenance hatch inside the roofline and hints that the
ATTIC is not the manor's highest reachable level. The SPYGLASS replaces the
EMBER STONE as a +8 required heirloom; the newly BM-crested TALISMAN adds a
twelfth required heirloom after protecting the player from the WRAITH.

### 12.32 Twelve-line flavor cycles

`CYCLING_FLAVOR_POOLS` centralizes all 23 recurring randomized or rotating
player-facing text categories in `world.js`. Each pool has exactly 12 distinct
entries. `cycleFlavor()` stores a separate `flavorCycle:<pool>` counter in game
flags, so all twelve entries appear before any repeats and SAVE/RESTORE preserves
the next position. Random rolls still decide whether ambient events occur;
one-use mechanical outcomes such as the mystery package remain random rather
than being mistaken for repeatable flavor.

### 12.33 Reproduction-rich bug reports

The browser keeps an in-memory command trail and actual turn count beginning at
page reload, or resets both with origin `restart` when RESTART starts a new game.
Both `BUG <description>` and the 🪲 button append the trail, every HUD slot
(including inactive states), version/SFX state, and a comma-separated `Inv:`
line to the prefilled GitHub issue body. `URLSearchParams` safely encodes the
line breaks. The full trail remains in memory; only exceptionally long issue
URLs compact command history to a 6,000-character budget while retaining both
ends and an explicit omission marker.

### 12.34 Persistent iOS web-content updates

`version.js` owns content updates. Its `CONTENT_VERSION` is the numeric
`YYYYMMDDBBB` composition of `APP_VERSION` and zero-padded `BUILD`, followed by
`CONTENT_FILES` as the final declaration. iOS parses that stable data and chooses
the greatest `CONTENT_VERSION` among the bundled copy, persistent cache, and
GitHub.io copy. The winner is atomically written to Application Support and the
web view always serves `app://local/` from that cache. Thus an older cache cannot
hide newer content delivered in a new app, while a newer downloaded cache
survives an app update. Offline startup chooses between bundle and cache only.

`manifest.json` is independent of that comparison. A byte-for-byte difference
between the bundled and GitHub.io manifests prompts: “A new version of Blackwood
Manor is available! Download now?” with Okay/Cancel; Okay opens TestFlight. If
remote content wins, `CONTENT_FILES` supplies the individual static paths to
download. Native metadata checks use one-time query keys, and every winning
release file uses its `CONTENT_VERSION` query key so CDN cache ages cannot mix
generations. No manifest field selects or downloads web content.

The native `content` bridge exposes `VER` / `VERSION` / `BUILD` to print the
loaded build plus cached and remote content versions. `RELOAD` / `REFRESH`
repeats that check. In an ordinary browser, RELOAD performs a cache-busted page
navigation instead.
