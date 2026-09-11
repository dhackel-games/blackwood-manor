# Blackwood Manor

A haunted-mansion text adventure in the classic Zork style — pure static files,
no build step, no server, no dependencies. You've inherited a cursed Victorian
estate; recover the family heirlooms, deposit them in the reliquary in the Grand
Hall, and ring the bell to lift the curse and escape alive. Linger in the dark,
and something finds you.

## Play

Double-click **`Play Blackwood Manor.command`** (the file with the manor icon).
It starts a tiny local web server and opens the game in your browser. Progress
auto-saves to your browser.

> Don't open `index.html` directly — Chrome blocks the game's JavaScript modules
> over `file://`, so it must be served over `http://` (which the launcher does).
> The first time you double-click the `.command`, macOS may ask you to confirm
> opening it; click **Open**.

### Commands

- **Move:** `north` / `n`, `s`, `e`, `w`, `ne`, `nw`, `se`, `sw`, `up` / `u`,
  `down` / `d`, `in`, `out` — or just type the direction. The **In** and **Out**
  buttons use each room's tracked entrance/exit. `leave` and `exit` mean `out`.
  First-entry and extended descriptions name every currently usable direction;
  brief revisits show their abbreviations on a separate line.
- **Mushroom powers:** while high, hidden clues appear on first entry, vertical
  movement needs no rope or ladder, and `go to <room>`, `float to <room>`, or
  `fly to <room>` carries you directly there. Eating another mushroom cluster
  adds its full duration to the remaining high. The HUD shows the countdown as
  `🍄`; the trip's third eye also reveals hidden clues and lets you see in dark
  rooms. Supernatural hazards still apply.
- **Equipment:** wearable items occupy HEAD, EYES, FEET, FINGER, WRIST, or NECK.
  Worn gear is marked in INVENTORY and does not consume carrying capacity. A
  HEADLAMP provides 40 turns of light with a `💡` HUD countdown; XRAY GOGGLES
  reveal the same clues as mushroom vision; WINGED SHOES provide permanent
  named-room flight while worn.
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
  advancing the game turn.
- **Things:** `take <x>`, `take all` / `get all`, `drop <x>`, `inventory` (`i`)
- **Implicit actions:** if a visible portable item must be held to `read`, `eat`,
  `drink`, or `wear` it, the game automatically gets it and prints the derived
  sequence. TOILET mushrooms also derive the missing `look in toilet` step.
- **Interact:** `open`/`close <x>`, `unlock <x> with <y>`, `put <x> in <y>`,
  `read <x>`, `push`/`pull`/`move <x>`, `light <x>`, `turn on/off <x>`,
  `wear`/`remove <x>`, `ring <x>`, `enter <x>` (including doors, the house,
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
- **Meta:** `score`, `save`, `restore`, `restart`, `verbose`, `brief`, `help`, `quit`
- **`again` / `g`** repeats your last command; **↑ / ↓** scroll command history.

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
openable, open, locked, keyId, capacity, lightSource, selfPowered, lit, fuel,
wearable, wearSlot, worn, readable, text, edible, drinkable, roomDesc`.

Mark a treasure with `treasure: true` and `points: N` — it automatically becomes
part of the win condition (all treasures must reach the reliquary).

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
`roomOf(id)`, `itemsIn(loc)`, `inventory()`, `inventoryLoad()`, `equipped(slot)`,
`find(phrase)`, `moveItem(id,to)`, `destroy(id)`, `addScore(n)`, `kill(msg)`,
`win(msg)`, `describeRoom()`.

After any change, **run `npm test`** — and update the gameplay feature and steps
if you changed the solution path.
