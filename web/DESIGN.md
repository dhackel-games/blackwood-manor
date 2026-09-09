# Blackwood Manor — Design

*A haunted-mansion text adventure in the classic Zork style. Personal project for David Hackel. Lives in HackelFamilyBrain (iCloud) — no git, ever.*

Date: 2026-09-05

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
