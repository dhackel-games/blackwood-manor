<!-- README.md. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-15.102:acoven. -->

# Blackwood Manor

A haunted-mansion text adventure in the classic Zork style — pure static files,
with no framework, backend, or runtime dependencies. You've inherited a cursed Victorian
estate; recover the family heirlooms, deposit them in the reliquary in the Royal
Hall, close it, open the bell closet beside the front door, and pull its rope.
Leave through the opened front door to escape, or take the clock the heirlooms
become and follow it into Part II. Linger in the dark, and something finds you.

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

- **Your name:** before the first room appears, the game asks `What should we
  call you?` Respond with a bare name, `say "Jeb"`, `call me Foo`, or
  `call me "Foo"`. Startup order is title banner, initial AI status, name
  question, then the first room. Blank, SKIP, or NO THANKS assigns the silly
  fallback **Professor Spooky Pants**; `call me <name>` changes it later without
  spending a turn. `RESTART 2` uses the same ordering and asks again before the
  ghost awakening. HUD and navigation remain gated until naming is complete.
  Authored `{{player_name}}` tokens in rooms, items, Gary dialogue, and endings
  are resolved by the engine's single `showMessage` renderer before display or speech.
- **Move:** `north` / `n`, `south` / `s`, `east` / `e`, `west` / `w`,
  `northeast` / `ne`, `northwest` / `nw`, `southeast` / `se`,
  `southwest` / `sw`, `up` / `u`, `down` / `d`, `in`, `out`. The touch
  controls use an eight-arrow compass plus `⇧`/`⇩` and `→□`/`□→` for vertical
  and portal movement. A green `▴`/`▾` disclosure on the typeahead's top edge
  collapses or restores navigation. Open, one frame encloses navigation and
  typeahead; collapsed, that frame encloses typeahead alone. The compact L/M/S
  selector shares the frame's upper-left border and ends flush with the 9-grid.
  The 3×3 compass stays centered when space permits and slides toward that
  selector as the viewport narrows, preserving a readable action area. The nine
  action shortcuts fill all remaining space through the frame's right edge and
  stack below navigation on phone-width screens.
  `leave` and `exit` mean `out`.
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
- **Touch controls:** direction and action buttons remain usable while the
  software keyboard is open and can be collapsed with the chat-box disclosure.
  The three-square picker
  selects small, medium, or large navigation buttons and remembers the choice;
  touch-capable browsers and the native app default to large. **🪲** opens the
  repository's new-issue form in a separate browser window and prefills its
  title with the current room and its body with `Describe issue here`. Typing
  `bug <description>` instead puts that text into the issue body without
  advancing the game turn. The first body line is the complete copyright/version
  string; HUD diagnostics no longer duplicate it. Both paths append turns and commands since the latest
  page reload or restart, every HUD value, and `Inv: ...`. Newlines are URL-encoded;
  exceptionally long histories retain both ends and mark the omitted middle. If
  Gary was called, the report also includes numbered Gary/user dialogue with
  compact unambiguous speaker labels.
- **Gary's voice:** tap the speaker circle or voice-status line to unmute him.
  The adjacent icon selector offers robot male/female and Australian
  male/female presets and remembers your choice. MIC stays active across pauses
  and transient browser speech-network interruptions until tapped again to
  stop; recognized text remains editable and submits only through the normal
  arrow/Enter control.
- **Gary's hints:** a bare HINT remains progression-aware; asking for a hint
  about a subject such as the dragon searches the complete authored hint catalog.
- **Sound effects:** the leftmost HUD `🔇`/`🔊` button controls environmental
  burp, barf, fart, and mushroom sounds; the icon shows the current state.
- **Score:** the HUD's `🏆 score/turns` readout keeps points and elapsed turns in
  one compact slot. Meaningful puzzle breakthroughs and intermediate keys award
  one-time progress points, including +5 for reading the mailbox letter;
  `::winmax2bell` performs every deterministic scoring challenge, deposits all
  thirteen heirlooms, closes the reliquary, and stops immediately before the
  main-floor bell rope. `::powerup` equips reusable powers; `::winquick1`
  completes the shorter required-heirloom route and stops after the bell but
  before walking out. These are the only three sysop shortcuts. The maximum route intentionally
  leaves the random MYSTERY PACKAGE unopened.
- **Flavor variety:** recurring ambient and Gary lines use 12-entry round-robin
  pools whose counters persist in saved games, so a line cannot repeat early.
- **Things:** `take <x>` / `t <x>`, `take all` / `get all`, `drop <x>`, `drop all`,
  `inventory` (`i`). DROP ALL leaves worn equipment equipped.
- **Reliquary:** the glass-fronted cabinet can be opened and closed, and any
  unworn item can be deposited. PUT auto-opens it; the completed cabinet must
  be explicitly CLOSED before the lower BELL ROPE will complete the ritual. The
  `💎` HUD appears after the first deposit as `required/13 +extra`. Pulling the
  prepared closet rope rings the remote belfry bell, flashes magical light,
  transforms the thirteen heirlooms into the COUNTDOWN CLOCK, slams the FRONT
  DOOR shut and then wide open, and opens the floor trapdoor. EXAMINE the
  RELIQUARY to discover the clock. Leaving ends the game; carrying the clock is
  required before descending to Gary.
- **Belfry and Bat Sight Mirror:** the great BELL and upper ROPE are in the
  BELFRY, where the rope continues through a hole in the floor. Pulling either
  end rings `DONG... DONG...`, scatters the bats, awards +5, and drops the
  required BAT SIGHT MIRROR (+20 when deposited). `LOOK IN MIRROR AT <room>`
  views any Part-I room without moving there. The mirror replaces the removed
  Family Ring; the Ravenblood Signet is now the **Ravenblood Ring**.
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
  `verbose`, `brief`, `help`, `quit`. In the iOS app, VERSION reports the
  installed native app identity separately from the local selected content and
  remote content source; RELOAD still puts the greatest content version into
  persistent cache. Web manifests never imply that a native app update exists.
  TestFlight installs compare their installed Info.plist version/build against
  the `LATEST_APP_BUILD_AVAILABLE` `YYYYMMDDBBB` number in `versions.json`,
  advanced only after App Store Connect confirms internal availability. App
  Store installs query Apple's catalog.
  VERSION prints the numeric content version and browser continuous-update
  status, or the iOS local-cache and content-source versions.
  In a browser, RELOAD/REFRESH reloads the latest content-version-keyed web files.
  After a Part-II death, `restart 1` starts the entire game over and `restart 2`
  restores the serialized checkpoint at the ghost awakening.
  Page load, RESTART, and successful RESTORE mark timestamped transcript session
  anchors; the end-game “Jump to the top” link returns to the latest one.
- **One-word targeting:** every room and item has a globally unique canonical
  one-word name (for example `rq`, `frontd`, `grandbr`, `ravenblood`, and `dreadvault`).
  Existing full names remain accepted, while generated SYSOP MENU (`::`) routes use the
  compact forms so command and bug histories stay readable.
- **Derived actions:** inferred command sequences use semicolons and full uppercase
  item titles, such as `(unlock FRONT DOOR; open FRONT DOOR)`.
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
js/native.js          native bridge detection, messaging, and version formatting
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
