<!-- README.md. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-12.068:acoven. -->

# Blackwood Manor

A haunted-mansion text adventure in the classic Zork style — pure static files,
with no framework, backend, or runtime dependencies. You've inherited a cursed Victorian
estate; recover the family heirlooms, deposit them in the reliquary in the Royal
Hall, and ring the bell to lift the curse and escape alive. Linger in the dark,
and something finds you.

## Play

Double-click **`Play Blackwood Manor.command`** (the file with the manor icon).
It starts a tiny local web server and opens the game in your browser. Progress
auto-saves to your browser. The launcher sends `no-store` headers so a changed
`ui.js` can never be combined with stale dependency modules.

> Don't open `index.html` directly — Chrome blocks the game's JavaScript modules
> over `file://`, so it must be served over `http://` (which the launcher does).
> The first time you double-click the `.command`, macOS may ask you to confirm
> opening it; click **Open**.

### Commands

- **Move:** `north` / `n`, `south` / `s`, `east` / `e`, `west` / `w`,
  `northeast` / `ne`, `northwest` / `nw`, `southeast` / `se`,
  `southwest` / `sw`, `up` / `u`, `down` / `d`, `in`, `out`. The touch
  controls use an eight-arrow compass plus `⇧`/`⇩` and `→□`/`□→` for vertical
  and portal movement. `leave` and `exit` mean `out`.
  First-entry and extended descriptions name every currently usable direction;
  brief revisits show their abbreviations on a separate line.
  `go <visible door/object>` infers `enter <object>`, including obvious unlock
  and open steps; named-room GO remains available while flying.
- **Mushroom powers:** while high, hidden clues appear on first entry, vertical
  movement needs no rope or ladder, and `go to <room>`, `float to <room>`, or
  `fly to <room>` carries you directly there. Eating another mushroom cluster
  adds its full duration to the remaining high. The trip's third eye reveals
  hidden clues and lets you see in dark rooms. The HUD tracks the trip itself
  as `🍄`, vision as `👁️`, and flight as `🪽`, allowing those capabilities to
  diverge. Supernatural hazards still apply.
- **Equipment:** wearable items occupy HEAD, FOREHEAD, EYES, FEET, FINGER, WRIST, or NECK.
  Worn gear is marked in INVENTORY and does not consume carrying capacity. A
  HEADLAMP provides 200 turns of light with a `💡` HUD countdown; XRAY GOGGLES
  show `👁️ ∞` and reveal the same clues as mushroom vision; WINGED SHOES show
  `🪽 ∞` and provide permanent named-room flight while worn.
  The OBSIDIAN EYE must be worn on the FOREHEAD to provide permanent hidden
  sight (`👁️ ∞`); it can coexist with XRAY GOGGLES but does not illuminate darkness.
- **Look around:** `look` (`l`), `examine` (`ex`/`x`), and `search` without an
  object reprint the room, show its ASCII art, add a closer-search hint, and list
  things you can act on. Room art also appears the first time you enter each room.
  With an object, `search <thing>`, `ex <thing>`, `examine <thing>`, `look <thing>`,
  and `look at <thing>` all show its deeper details.
- **Touch controls:** direction and action buttons remain visible and usable at all
  times, including while the software keyboard is open. **🪲** opens the
  repository's new-issue form in a separate browser window and prefills its
  title with the current room and its body with `Describe issue here`. Typing
  `bug <description>` instead puts that text into the issue body without
  advancing the game turn. Both paths append turns and commands since the latest
  page reload or restart, every HUD value, and `Inv: ...`. Newlines are URL-encoded;
  exceptionally long histories retain both ends and mark the omitted middle.
- **Gary's voice:** tap the speaker circle or voice-status line to unmute him.
  The adjacent icon selector offers robot male/female and Australian
  male/female presets and remembers your choice. MIC stays active across pauses
  until tapped again to submit.
- **Sound effects:** the leftmost HUD `🔇`/`🔊` button controls environmental
  burp, barf, fart, and mushroom sounds; the icon shows the current state.
- **Score:** the HUD's `🏆 score/turns` readout keeps points and elapsed turns in
  one compact slot. Meaningful puzzle breakthroughs and intermediate keys award
  one-time progress points; `::winmax` performs every deterministic scoring
  challenge and intentionally leaves the random MYSTERY PACKAGE unopened.
- **Flavor variety:** recurring ambient and Gary lines use 12-entry round-robin
  pools whose counters persist in saved games, so a line cannot repeat early.
- **Things:** `take <x>`, `take all` / `get all`, `drop <x>`, `drop all`,
  `inventory` (`i`). DROP ALL leaves worn equipment equipped.
- **Reliquary:** the glass-fronted cabinet can be opened and closed, and any
  unworn item can be deposited. PUT auto-opens it; the completed cabinet must
  be explicitly CLOSED before the BELL will answer. The `💎` HUD appears after
  the   first deposit as `required/13 +extra`. The BM SPYGLASS in the TREE FORT,
  the BM-crested protective TALISMAN, and the inscribed BACKWARDS WATCH are
  required heirlooms; the EMERALD GEM from the GARDEN BRAZIER unlocks the
  SPYGLASS route.
- **Carrying capacity:** the HUD shows `👤 used/6` initially. The BACKPACK in the
  DEEP MINING SHAFT is worn automatically when taken, raises capacity to 20,
  and changes that indicator to `👜 used/20`.
- **Implicit actions:** if a visible portable item must be held to `read`, `eat`,
  `drink`, `wear`, or `use` it, the game automatically gets it and prints the derived
  sequence. TOILET mushrooms also derive the missing `look in toilet` step.
  `talk` infers `talk to <character>` when exactly one talkable character is present.
- **Interact:** `open`/`close <x>`, `unlock <x> with <y>`, `put <x> in <y>`,
  `read <x>`, `push`/`pull`/`move <x>`, `light <x>`, `turn on/off <x>`,
  `use <x>` (contextually WEARs equipment or EATs/DRINKs food), `wear`/`remove <x>`,
  `ring <x>`, `enter <x>` (including doors, the house,
  cellar, well, and toilet)
  `say <words>` and `yell <words>` repeat the utterance; the **Say** shortcut
  prefills the command. Speech near sleeping DREADMAW wakes her violently.
  A revealed SAFE accepts `open safe with 7 3 9`, or `open safe` followed by
  typing `7 3 9`.
  `open door with key` derives `(unlock door with key, open door)`; `enter door`
  also derives any obvious unlock/open steps before going through.
- **DREADMAW:** the FRONT GATE leads west into a small HEDGE MAZE. Jostling the
  sleeping dragon gets you burned; bring the kitchen APPLE and use variants such
  as `offer apple to dragon`, `give apple with dragon`, or `put apple on dragon`.
  Beyond her, a MINING GALLERY and DEEP SHAFT lead to the TROLL GATE and
  DREADMAW'S VAULT.
- **Meta:** `score`, `save`, `restore`, `restart`, `ver`/`version`/`build`,
  `reload`/`refresh`,
  `verbose`, `brief`, `help`, `quit`. In the iOS app, VERSION compares the
  bundled, cached, and GitHub.io `CONTENT_VERSION` values from `version.js`;
  RELOAD puts the greatest version into persistent cache. A changed
  `manifest.json` independently offers an iOS app update through TestFlight.
  In a browser, RELOAD/REFRESH reloads the latest content-version-keyed web files.
- **One-word targeting:** every room and item has a globally unique canonical
  one-word name (for example `grand`, `bloodsignet`, `iron`, and `dreadvault`).
  Existing full names remain accepted, while generated `::` routes use the
  compact forms so command and bug histories stay readable.
- **`again` / `g`** repeats your last command; **↑ / ↓** scroll command history.
- **Self-reliance awards:** successful runs earn HELPLESS (+15) without
  MAP/CALL/HINT/HELP, EXTRA SUPER DUPER HELPLESS (+20 more) if they also avoid
  LOOK/EXAMINE/SEARCH, and NO TAKEBACKS (+10) without explicit SAVE/RESTORE.

### Survival tips (it is a *cruel* game)

- **Never move in the dark.** "It is pitch black. You are likely to be eaten by
  a grue." is your only warning. Keep a light burning.
- Your candle's fuel is **finite**, and you have exactly **one match**. Don't
  waste either — it is possible to strand yourself. `save` often.
- Some doors, drops, and the crypt are **lethal** without the right preparation.

## Project layout

```
index.html            the page + terminal DOM
css/style.css         green-on-black CRT styling
js/core.js            game state + rules (DOM-free, testable in Node)
js/parser.js          input -> { verb, dobj, prep, iobj }
js/commands.js        generic verb handlers
js/world.js           ★ ALL CONTENT — rooms, items, puzzles (edit this to expand)
js/hud.js             declarative HudSlot definitions and renderer
js/ui.js              browser terminal adapter
js/save.js                 localStorage save/restore
tests/features/*.feature   all executable Gherkin specifications
tests/steps/*.js           Cucumber step definitions and fixtures
DESIGN.md / PLAN.md        design doc and implementation plan
```

## Run the tests

```
npm test                  # all executable Gherkin scenarios
npm run test:unit         # engine/unit-tagged scenarios only
npm run test:walkthrough  # gameplay-tagged scenarios only
```

All test behavior is executable Gherkin. The gameplay-tagged scenarios play the
entire game to victory, check its final score, and cover each death trap. Run the
complete local suite after any change to the world.

## Expanding the game (the whole point)

**You only ever edit `js/world.js`.** The engine never needs to change.

### Add a room

```js
rooms: {
  conservatory: {
    name: "Conservatory",
    desc: "A glass-roofed ruin choked with dead ferns.",
    exits: { north: "grandHall" },   // and add `south: "conservatory"` to grandHall
  },
}
```

### Add an item

```js
items: {
  brassKey: {
    names: ["key"], adjectives: ["brass"], loc: "conservatory",
    takeable: true, desc: "A small brass key.",
  },
}
```

Useful item flags: `takeable, fixed, scenery, treasure, points, container,
openable, open, locked, keyId, capacity, carryCapacity, lightSource, selfPowered,
lit, fuel, wearable, wearSlot, autoWearOnTake, worn, readable, text, edible,
drinkable, progressPoints, progressFlag, depositScoreFlag, roomDesc`.

Mark a treasure with `treasure: true` and `points: N` — it automatically becomes
part of the win condition. `REQUIRED_FAMILY_ITEM_COUNT` records how many required
family treasures must reach the reliquary.

### Add a puzzle

Attach an `on: { verb(ctx, cmd) }` handler to any room or item. Return a string
to intercept the default verb; return nothing to let the default run.

```js
lever: {
  names: ["lever"], loc: "conservatory", fixed: true, scenery: true,
  desc: "A brass lever.",
  on: {
    pull(ctx) {
      if (ctx.getFlag("gatePulled")) return "The gate already stands open.";
      ctx.setFlag("gatePulled");
      return "With a clang, a hidden gate grinds open.";
    },
  },
}
```

Handler `ctx` API: `getFlag/setFlag`, `has(id)`, `here(id)`, `item(id)`,
`roomOf(id)`, `itemsIn(loc)`, `inventory()`, `inventoryLoad()`,
`inventoryCapacity()`, `equipped(slot)`, `find(phrase)`, `moveItem(id,to)`,
`destroy(id)`, `addScore(n)`, `kill(msg)`, `win(msg)`, `describeRoom()`.

After any change, **run `npm test`** — and update the gameplay feature and steps
if you changed the solution path.
