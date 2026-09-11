# Blackwood Manor — Implementation Plan

> **Current test layout (2026-09-10):** This is the original implementation plan, so its
> references to `tests/walkthrough.js` are historical. All executable tests now live as
> Gherkin in `tests/features/`, with Cucumber definitions in `tests/steps/`; run `npm test`.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **No-git zone:** This project lives in HackelFamilyBrain (iCloud). Do NOT run `git` here. The "checkpoint" step in each task is running the test suite — iCloud auto-saves the files.

**Goal:** A browser-playable, classic/cruel haunted-mansion text adventure ("Blackwood Manor") in the Zork style, built as static files with a data-driven engine that is trivially expandable by editing one content file.

**Architecture:** A DOM-free core (`core.js`) holds all game state and rules and is testable in Node. `parser.js` turns input into a command structure; `commands.js` holds generic verb handlers; `world.js` holds ALL content (rooms/items/puzzles). `ui.js` is the browser adapter (terminal render, input, history); `save.js` handles localStorage. A Node walkthrough test drives the DOM-free core through a full winning playthrough plus death paths.

**Tech Stack:** Vanilla ES modules (JavaScript), HTML, CSS. No framework, no build step, no dependencies. Node (already installed) only for running the test file.

---

## File Structure

```
haunted-mansion-adventure/
├── index.html            # loads modules, holds the terminal DOM
├── css/style.css         # green-on-black CRT terminal
├── js/
│   ├── core.js           # Game class: state + rules, DOM-free, ES module
│   ├── parser.js         # parse(input, game) -> {verb, dobj, prep, iobj, error}
│   ├── commands.js       # verb handlers keyed by verb; uses ctx API
│   ├── world.js          # ★ CONTENT: rooms, items, puzzles, config
│   ├── ui.js             # browser adapter: render, input line, history
│   └── save.js           # localStorage serialize/deserialize
├── tests/walkthrough.js  # node test: winning path + death paths
├── DESIGN.md
├── PLAN.md
└── README.md             # how to play + how to add a room
```

**Module boundaries:**
- `core.js` knows rules, not content or DOM. Exposes a `Game` object with a `send(input)` method returning printed text, and a `ctx` API for content handlers.
- `world.js` is pure data + optional handler functions. The only file you edit to expand the game.
- `parser.js`, `commands.js` are generic engine — never contain mansion-specific strings.
- `ui.js`, `save.js` are the only browser-coupled files. `core.js` must import neither.

**Testing note:** `core.js`, `parser.js`, `commands.js`, `world.js` are plain ES modules importable in Node ≥ 20 (`node --experimental-default-type=module` not needed if we use `.js` with `"type":"module"` via a minimal `package.json`, OR name test with explicit import). Plan uses a minimal `package.json` with `"type": "module"`.

---

## Task 1: Scaffold + package.json + smoke test

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `css/style.css`
- Create: `js/core.js` (stub)
- Create: `tests/walkthrough.js` (smoke)

- [ ] **Step 1: Create `package.json`** so Node treats `.js` as ES modules.

```json
{
  "name": "blackwood-manor",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": { "test": "node tests/walkthrough.js" }
}
```

- [ ] **Step 2: Create stub `js/core.js`.**

```js
export function createGame(world) {
  return {
    world,
    send(input) { return `You said: ${input}`; },
  };
}
```

- [ ] **Step 3: Write the smoke test `tests/walkthrough.js`.**

```js
import { createGame } from "../js/core.js";
import assert from "node:assert";

const g = createGame({});
assert.equal(g.send("hello"), "You said: hello");
console.log("OK: smoke test passed");
```

- [ ] **Step 4: Run the smoke test.**

Run: `cd ~/repos/HackelFamilyBrain/projects/haunted-mansion-adventure && npm test`
Expected: `OK: smoke test passed`

- [ ] **Step 5: Create `index.html`** (module wiring; UI filled in Task 8).

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Blackwood Manor</title>
  <link rel="stylesheet" href="css/style.css" />
</head>
<body>
  <div id="crt">
    <div id="transcript" aria-live="polite"></div>
    <div id="inputline"><span id="prompt">&gt;</span><input id="cmd" autofocus autocomplete="off" spellcheck="false" /></div>
  </div>
  <script type="module" src="js/ui.js"></script>
</body>
</html>
```

- [ ] **Step 6: Create minimal `css/style.css`** (full CRT styling in Task 8).

```css
:root { --green:#33ff66; --bg:#0a0f0a; }
* { box-sizing:border-box; }
html,body { margin:0; height:100%; background:var(--bg); }
#crt { height:100%; display:flex; flex-direction:column; padding:1rem;
  font-family:"SFMono-Regular",Consolas,"Liberation Mono",Menlo,monospace;
  color:var(--green); font-size:16px; line-height:1.4; }
#transcript { flex:1; overflow-y:auto; white-space:pre-wrap; }
#inputline { display:flex; gap:.5rem; }
#cmd { flex:1; background:transparent; border:none; color:var(--green);
  font:inherit; outline:none; }
```

- [ ] **Step 7: Checkpoint — re-run `npm test`.** Expected: still passes.

---

## Task 2: Core state model

Defines the game state, item/room lookup, and the `ctx` API used by content handlers. Content-free and DOM-free.

**Files:**
- Modify: `js/core.js`
- Modify: `tests/walkthrough.js`

- [ ] **Step 1: Write failing tests** (replace smoke test body).

```js
import { createGame } from "../js/core.js";
import assert from "node:assert";

const world = {
  config: { start: "hall", maxCarry: 5 },
  rooms: {
    hall: { name: "Hall", desc: "A dusty hall.", exits: { north: "study" } },
    study: { name: "Study", desc: "A small study.", exits: { south: "hall" } },
  },
  items: {
    key: { names: ["key"], adjectives: ["brass"], loc: "hall", takeable: true, desc: "A brass key." },
    desk: { names: ["desk"], loc: "study", fixed: true, desc: "A heavy desk." },
  },
};

const g = createGame(world);
assert.equal(g.state.room, "hall");
assert.equal(g.roomOf("key"), "hall");
assert.deepEqual(g.itemsIn("hall").map(i => i.id), ["key"]);
assert.equal(g.findItem("brass key").id, "key");
assert.equal(g.findItem("nonsense"), null);
console.log("OK: core state");
```

- [ ] **Step 2: Run test, expect FAIL** (`g.state` undefined). Run: `npm test`.

- [ ] **Step 3: Implement core state in `js/core.js`.**

```js
export function createGame(world) {
  const cfg = world.config || {};
  const state = {
    room: cfg.start,
    turns: 0,
    score: 0,
    dead: false,
    won: false,
    flags: {},
    itemLoc: {},        // itemId -> roomId | "inventory" | containerId | null(destroyed)
  };
  // Seed item locations from world definition
  for (const [id, def] of Object.entries(world.items || {})) {
    state.itemLoc[id] = def.loc ?? null;
  }

  const game = {
    world, state,
    def(id) { return world.items[id] || world.rooms[id] || null; },
    roomOf(id) { return state.itemLoc[id]; },
    itemsIn(loc) {
      return Object.keys(world.items)
        .filter(id => state.itemLoc[id] === loc)
        .map(id => ({ id, ...world.items[id] }));
    },
    inventory() { return this.itemsIn("inventory"); },
    // Match "brass key" / "key" against names+adjectives of visible items
    findItem(phrase, scope) {
      const words = phrase.toLowerCase().split(/\s+/).filter(Boolean);
      const noun = words[words.length - 1];
      const adjs = words.slice(0, -1);
      const candidates = (scope || [
        ...this.inventory(),
        ...this.itemsIn(state.room),
      ]);
      for (const it of candidates) {
        const names = (it.names || []).map(s => s.toLowerCase());
        const iadj = (it.adjectives || []).map(s => s.toLowerCase());
        if (names.includes(noun) && adjs.every(a => iadj.includes(a) || names.includes(a))) {
          return it;
        }
      }
      return null;
    },
  };
  return game;
}
```

- [ ] **Step 4: Run test, expect PASS.** Run: `npm test`. Expected: `OK: core state`.

- [ ] **Step 5: Checkpoint — `npm test` green.**

---

## Task 3: Parser

Turns a raw string into `{verb, dobj, prep, iobj}` using a verb/synonym/direction table from `world.config` merged with engine defaults.

**Files:**
- Create: `js/parser.js`
- Modify: `tests/walkthrough.js` (append cases; keep prior asserts)

- [ ] **Step 1: Write failing tests** (append to test file before the final `console.log`, and update the final log text).

```js
import { parse } from "../js/parser.js";
const p = (s) => parse(s);
assert.deepEqual(p("n"), { verb: "go", dobj: "north", prep: null, iobj: null });
assert.deepEqual(p("take the brass key"),
  { verb: "take", dobj: "brass key", prep: null, iobj: null });
assert.deepEqual(p("unlock the oak door with the brass key"),
  { verb: "unlock", dobj: "oak door", prep: "with", iobj: "brass key" });
assert.deepEqual(p("look"), { verb: "look", dobj: null, prep: null, iobj: null });
assert.equal(p("").error, "empty");
assert.equal(p("frobnicate the widget").error, "unknown-verb");
console.log("OK: parser");
```

- [ ] **Step 2: Run test, expect FAIL** (`parse` not defined). Run: `npm test`.

- [ ] **Step 3: Implement `js/parser.js`.**

```js
const DIRECTIONS = {
  north:"north", n:"north", south:"south", s:"south", east:"east", e:"east",
  west:"west", w:"west", ne:"ne", nw:"nw", se:"se", sw:"sw",
  up:"up", u:"up", down:"down", d:"down", in:"in", out:"out",
};

// canonical verb -> synonyms
const VERBS = {
  go:["go","walk","move","run"], look:["look","l"], examine:["examine","x","inspect"],
  take:["take","get","grab","pick"], drop:["drop","discard"], open:["open"],
  close:["close","shut"], lock:["lock"], unlock:["unlock"], read:["read"],
  search:["search"], push:["push","press"], pull:["pull","lift"],
  on:["on"], off:["off"], light:["light"], extinguish:["extinguish","douse"],
  attack:["attack","kill","hit","strike"], eat:["eat"], drink:["drink"],
  wear:["wear","don"], remove:["remove","doff"], throw:["throw","toss"],
  put:["put","place","insert"], enter:["enter"], climb:["climb"], ring:["ring"],
  touch:["touch"], listen:["listen"], smell:["smell","sniff"], give:["give"],
  inventory:["inventory","i","inv"], wait:["wait","z"], again:["again","g"],
  score:["score"], save:["save"], restore:["restore","load"], restart:["restart"],
  verbose:["verbose"], brief:["brief"], help:["help","?"], quit:["quit"],
};
const SYN = {};
for (const [canon, list] of Object.entries(VERBS)) for (const w of list) SYN[w] = canon;

const ARTICLES = new Set(["the","a","an"]);
const PREPS = new Set(["with","in","into","on","onto","at","to","from","under","behind"]);

export function parse(input) {
  const raw = (input || "").trim().toLowerCase();
  if (!raw) return { verb: null, dobj: null, prep: null, iobj: null, error: "empty" };
  let words = raw.split(/\s+/).filter(w => !ARTICLES.has(w));

  // Bare direction => go <dir>
  if (words.length === 1 && DIRECTIONS[words[0]]) {
    return { verb: "go", dobj: DIRECTIONS[words[0]], prep: null, iobj: null };
  }

  let verb = SYN[words[0]];
  if (!verb) return { verb: null, dobj: null, prep: null, iobj: null, error: "unknown-verb", word: words[0] };
  let rest = words.slice(1);

  // "go north" / "go n"
  if (verb === "go" && rest.length && DIRECTIONS[rest[0]]) {
    return { verb: "go", dobj: DIRECTIONS[rest[0]], prep: null, iobj: null };
  }
  // "turn on/off X", "pick up X"
  if ((verb === "on" || verb === "off")) { /* handled below via prep-less */ }

  // split on preposition
  let prep = null, dobjWords = [], iobjWords = [], seenPrep = false;
  for (const w of rest) {
    if (!seenPrep && PREPS.has(w)) { prep = w; seenPrep = true; continue; }
    (seenPrep ? iobjWords : dobjWords).push(w);
  }
  const join = (arr) => (arr.length ? arr.join(" ") : null);
  return { verb, dobj: join(dobjWords), prep, iobj: join(iobjWords) };
}
```

- [ ] **Step 4: Run test, expect PASS.** Run: `npm test`. Expected: `OK: parser`.

- [ ] **Step 5: Checkpoint — `npm test` green.**

---

## Task 4: Command dispatch + movement + look + take/drop/inventory

Wires `parse` → handlers. Implements the always-needed verbs. Defines the `ctx` API. `send(input)` becomes the real game loop: parse, dispatch, tick turn, return text.

**Files:**
- Create: `js/commands.js`
- Modify: `js/core.js` (import parser + commands; real `send`, `ctx`, `describeRoom`, turn tick)
- Modify: `tests/walkthrough.js`

- [ ] **Step 1: Write failing tests** (append; update final log).

```js
{
  const g2 = createGame(world);
  assert.match(g2.send("look"), /Hall/);
  assert.match(g2.send("take key"), /Taken|taken/);
  assert.deepEqual(g2.inventory().map(i => i.id), ["key"]);
  assert.match(g2.send("i"), /brass key/i);
  assert.match(g2.send("north"), /Study/);
  assert.equal(g2.state.room, "study");
  assert.match(g2.send("take desk"), /can't|cannot/i);   // fixed item
  assert.match(g2.send("drop key"), /Dropped|dropped/);
  assert.equal(g2.roomOf("key"), "study");
  assert.match(g2.send("south"), /Hall/);
}
console.log("OK: movement + inventory");
```

- [ ] **Step 2: Run test, expect FAIL.** Run: `npm test`.

- [ ] **Step 3: Implement `js/commands.js`.**

```js
export const commands = {
  go(ctx, cmd) {
    const dir = cmd.dobj;
    const room = ctx.room();
    let exit = room.exits && room.exits[dir];
    if (!exit) return "You can't go that way.";
    if (typeof exit === "object") {
      if (exit.via && !ctx.getFlag(exit.via)) return exit.lockedMsg || "You can't go that way.";
      exit = exit.to;
    }
    ctx.state.room = exit;
    return ctx.describeRoom();
  },
  look(ctx) { return ctx.describeRoom(true); },
  examine(ctx, cmd) {
    const it = ctx.find(cmd.dobj);
    if (!it) return `You can't see any ${cmd.dobj || "that"} here.`;
    return it.desc || `You see nothing special about the ${it.names[0]}.`;
  },
  take(ctx, cmd) {
    const it = ctx.find(cmd.dobj);
    if (!it) return `You can't see any ${cmd.dobj || "that"} here.`;
    if (ctx.has(it.id)) return "You already have that.";
    if (it.fixed || !it.takeable) return "You can't take that.";
    if (ctx.inventory().length >= (ctx.world.config.maxCarry ?? 99))
      return "Your hands are full.";
    ctx.moveItem(it.id, "inventory");
    return "Taken.";
  },
  drop(ctx, cmd) {
    const it = ctx.find(cmd.dobj, ctx.inventory());
    if (!it) return "You aren't carrying that.";
    ctx.moveItem(it.id, ctx.state.room);
    return "Dropped.";
  },
  inventory(ctx) {
    const inv = ctx.inventory();
    if (!inv.length) return "You are empty-handed.";
    return "You are carrying:\n" + inv.map(i =>
      "  a " + [...(i.adjectives||[]).slice(0,1), i.names[0]].join(" ")).join("\n");
  },
  wait() { return "Time passes."; },
  help() {
    return "Verbs: look(l), examine(x), take, drop, inventory(i), go <dir> (n/s/e/w/u/d),\n" +
           "open, close, unlock ... with ..., read, put ... in ..., light, turn on/off,\n" +
           "search, push, pull, attack ... with ..., score, save, restore, restart, quit.";
  },
};
```

- [ ] **Step 4: Rewrite `send`/`ctx` in `js/core.js`** (replace stub; keep Task 2 helpers). Add near the end of `createGame`, before `return game;`:

```js
  const { parse } = await importParser();          // see note below
```

Because top-level dynamic import complicates Node, instead import statically at the TOP of `core.js`:

```js
import { parse } from "./parser.js";
import { commands } from "./commands.js";
```

Then define the loop inside `createGame` (add these methods to `game`):

```js
  game.room = () => world.rooms[state.room];
  game.getFlag = (f) => !!state.flags[f];
  game.setFlag = (f, v = true) => { state.flags[f] = v; };
  game.has = (id) => state.itemLoc[id] === "inventory";
  game.moveItem = (id, to) => { state.itemLoc[id] = to; };
  game.destroy = (id) => { state.itemLoc[id] = null; };
  game.addScore = (n) => { state.score += n; };
  game.find = (phrase, scope) => game.findItem(phrase, scope);
  game.kill = (msg) => {
    state.dead = true;
    return `${msg}\n\n    ****  You have died.  ****\n\nType RESTART, RESTORE, or QUIT.`;
  };
  game.describeRoom = (force) => {
    const r = world.rooms[state.room];
    const first = !state.flags["seen:" + state.room];
    state.flags["seen:" + state.room] = true;
    const verbose = state.flags["__verbose"];
    let out = r.name.toUpperCase() + "\n";
    if (force || first || verbose) out += r.desc + "\n";
    const here = game.itemsIn(state.room).filter(i => !i.scenery);
    for (const it of here) out += (it.roomDesc || `There is a ${it.names[0]} here.`) + "\n";
    return out.trimEnd();
  };

  game.send = (input) => {
    if (state.dead || state.won) {
      // allow only meta verbs; UI handles restart/restore/quit specially
    }
    const cmd = parse(input);
    if (cmd.error === "empty") return "I beg your pardon?";
    if (cmd.error === "unknown-verb") return `I don't know the word "${cmd.word}".`;

    // Content override hook: room or targeted item may intercept the verb.
    const override = runHandlers(game, cmd);
    let text;
    if (override != null) { text = override; }
    else {
      const handler = commands[cmd.verb];
      text = handler ? handler(game, cmd) : `You can't do that.`;
    }
    tick(game);                    // fuel burn, darkness check
    return text + darknessSuffix(game);
  };
```

Add helper functions at module scope (bottom of `core.js`):

```js
function runHandlers(game, cmd) {
  // item-targeted handler first, then current room handler
  const it = cmd.dobj ? game.find(cmd.dobj) : null;
  const targets = [it, game.room()].filter(Boolean);
  for (const t of targets) {
    const h = t.on && t.on[cmd.verb];
    if (h) { const r = h(game, cmd); if (r != null) return r; }
  }
  return null;
}
function tick(game) {
  game.state.turns++;
  burnLight(game);   // defined in Task 6; safe no-op stub until then
}
function darknessSuffix(game) { return ""; }  // replaced in Task 6
function burnLight(game) {}                    // replaced in Task 6
```

- [ ] **Step 5: Run tests, expect PASS.** Run: `npm test`. Expected: `OK: movement + inventory`.

- [ ] **Step 6: Checkpoint — `npm test` green.**

---

## Task 5: Containers, open/close, lock/unlock, put-in, read

**Files:**
- Modify: `js/commands.js`
- Modify: `tests/walkthrough.js`

- [ ] **Step 1: Write failing tests** (new block; extend the `world` fixture with a box + note).

```js
{
  const w2 = structuredClone(world);
  w2.items.box = { names:["box"], loc:"hall", container:true, openable:true, open:false,
    locked:true, keyId:"key", capacity:3, desc:"A small locked box." };
  w2.items.note = { names:["note"], loc:"box", takeable:true, readable:true,
    text:"It reads: BEWARE THE DARK.", desc:"A folded note." };
  const g3 = createGame(w2);
  assert.match(g3.send("open box"), /locked/i);
  assert.match(g3.send("take key"), /Taken/);
  assert.match(g3.send("unlock box with key"), /unlock/i);
  assert.match(g3.send("open box"), /open/i);
  assert.match(g3.send("look"), /note/i);          // contents now visible
  assert.match(g3.send("read note"), /BEWARE THE DARK/);
  assert.match(g3.send("take note"), /Taken/);
  assert.match(g3.send("put note in box"), /put|placed/i);
  assert.equal(g3.roomOf("note"), "box");
}
console.log("OK: containers");
```

- [ ] **Step 2: Run tests, expect FAIL.** Run: `npm test`.

- [ ] **Step 3: Add handlers to `js/commands.js`.**

```js
Object.assign(commands, {
  open(ctx, cmd) {
    const it = ctx.find(cmd.dobj);
    if (!it) return `You can't see any ${cmd.dobj || "that"} here.`;
    if (!it.openable) return "You can't open that.";
    if (it.locked) return `The ${it.names[0]} is locked.`;
    if (it.open) return "It's already open.";
    it.open = true;
    // reveal contents at room scope for listing
    return `You open the ${it.names[0]}.`;
  },
  close(ctx, cmd) {
    const it = ctx.find(cmd.dobj);
    if (!it || !it.openable) return "You can't close that.";
    if (!it.open) return "It's already closed.";
    it.open = false;
    return `You close the ${it.names[0]}.`;
  },
  unlock(ctx, cmd) {
    const it = ctx.find(cmd.dobj);
    if (!it) return `You can't see any ${cmd.dobj || "that"} here.`;
    if (!it.locked) return "It isn't locked.";
    const key = cmd.iobj ? ctx.find(cmd.iobj, ctx.inventory()) : null;
    if (!key) return `Unlock it with what?`;
    if (it.keyId !== key.id) return "That doesn't fit.";
    it.locked = false;
    return `You unlock the ${it.names[0]}.`;
  },
  lock(ctx, cmd) {
    const it = ctx.find(cmd.dobj);
    if (!it || !it.openable) return "You can't lock that.";
    if (it.open) return "You must close it first.";
    const key = cmd.iobj ? ctx.find(cmd.iobj, ctx.inventory()) : null;
    if (!key || it.keyId !== key.id) return "That doesn't fit.";
    it.locked = true;
    return `You lock the ${it.names[0]}.`;
  },
  put(ctx, cmd) {
    const it = ctx.find(cmd.dobj, ctx.inventory());
    if (!it) return "You aren't carrying that.";
    const dest = ctx.find(cmd.iobj);
    if (!dest || !dest.container) return "You can't put it there.";
    if (!dest.open) return `The ${dest.names[0]} is closed.`;
    if (ctx.itemsIn(dest.id).length >= (dest.capacity ?? 99)) return "There's no room.";
    ctx.moveItem(it.id, dest.id);
    return `You put the ${it.names[0]} in the ${dest.names[0]}.`;
  },
  read(ctx, cmd) {
    const it = ctx.find(cmd.dobj);
    if (!it) return `You can't see any ${cmd.dobj || "that"} here.`;
    if (!it.readable && !it.text) return "There's nothing to read on that.";
    return it.text || "It's blank.";
  },
});
```

- [ ] **Step 4: Make container contents visible in `describeRoom` and `find`.** In `js/core.js`, update `find` scope and room listing to include contents of open containers in the room/inventory. Replace `game.find` and the `here` line in `describeRoom`:

```js
  game.visibleItems = () => {
    const out = [...game.inventory(), ...game.itemsIn(state.room)];
    for (const c of [...out]) {
      if (c.container && c.open) out.push(...game.itemsIn(c.id));
    }
    return out;
  };
  game.find = (phrase, scope) => game.findItem(phrase, scope || game.visibleItems());
```

And in `describeRoom`, after listing `here`, also list open-container contents:

```js
    for (const it of here) {
      out += (it.roomDesc || `There is a ${it.names[0]} here.`) + "\n";
      if (it.container && it.open) {
        const inside = game.itemsIn(it.id);
        if (inside.length) out += `The ${it.names[0]} contains:\n` +
          inside.map(x => "  a " + x.names[0]).join("\n") + "\n";
      }
    }
```

- [ ] **Step 5: Run tests, expect PASS.** Run: `npm test`. Expected: `OK: containers`.

- [ ] **Step 6: Checkpoint — `npm test` green.**

---

## Task 6: Light, darkness, the grue, and fuel

Implements the signature cruel mechanic. A room with `dark:true` is lethal without an active light source in inventory/room. First action in the dark = warning; second = grue death. Lit light sources burn `fuel` each turn and gutter out.

**Files:**
- Modify: `js/core.js` (replace `darknessSuffix`, `burnLight`, add `isLit`, `isDark`)
- Modify: `js/commands.js` (light / extinguish / turn on-off)
- Modify: `tests/walkthrough.js`

- [ ] **Step 1: Write failing tests** (new block with a dark room + candle).

```js
{
  const w3 = structuredClone(world);
  w3.rooms.cellar = { name:"Cellar", desc:"A damp cellar.", dark:true, exits:{ up:"hall" } };
  w3.rooms.hall.exits.down = "cellar";
  w3.items.candle = { names:["candle","candlestick"], loc:"hall", takeable:true,
    lightSource:true, lit:false, fuel:3, desc:"A candle." };
  w3.items.match = { names:["match","matches"], loc:"hall", takeable:true, desc:"A match." };

  // die by entering dark without light, then acting again
  const dark = createGame(w3);
  dark.send("down");                                  // warning
  assert.match(dark.send("look"), /grue|pitch black/i);
  assert.equal(dark.state.dead, true);

  // survive with a lit candle
  const lit = createGame(w3);
  lit.send("take candle"); lit.send("take match");
  assert.match(lit.send("light candle"), /light|flame|lit/i);
  assert.match(lit.send("down"), /Cellar/);
  assert.equal(lit.state.dead, false);

  // fuel burns out
  lit.send("look"); lit.send("look");                 // burn remaining fuel
  assert.match(lit.send("look"), /goes out|gutters|darkness/i);
}
console.log("OK: light + grue");
```

- [ ] **Step 2: Run tests, expect FAIL.** Run: `npm test`.

- [ ] **Step 3: Implement light logic in `js/core.js`.** Replace the stub `darknessSuffix`/`burnLight` and add helpers on `game`:

```js
  game.activeLights = () => game.visibleItems().filter(i => i.lightSource && i.lit);
  game.isLit = () => {
    const r = world.rooms[state.room];
    if (!r.dark) return true;
    return game.activeLights().length > 0;
  };
```

Replace module-scope `tick`, `burnLight`, `darknessSuffix`:

```js
function tick(game) {
  game.state.turns++;
  burnLight(game);
  checkGrue(game);
}
function burnLight(game) {
  for (const it of game.activeLights()) {
    if (typeof it.fuel === "number") {
      it.fuel--;
      if (it.fuel === 2) game._pending = "The flame gutters low.";
      if (it.fuel <= 0) { it.lit = false; game._pending = `The ${it.names[0]} goes out.`; }
    }
  }
}
function checkGrue(game) {
  const s = game.state;
  if (game.isLit()) { s.flags.__darkWarned = false; return; }
  if (!s.flags.__darkWarned) {
    s.flags.__darkWarned = true;
    game._pending = "It is pitch black. You are likely to be eaten by a grue.";
  } else {
    game._grueKill = true;
  }
}
function darknessSuffix(game) {
  let extra = "";
  if (game._pending) { extra = "\n" + game._pending; game._pending = null; }
  if (game._grueKill) {
    game._grueKill = false;
    extra += "\n" + game.kill("Oh no! You have walked into the slavering fangs of a lurking grue!");
  }
  return extra;
}
```

Note: `describeRoom` must respect darkness. Update its top:

```js
  game.describeRoom = (force) => {
    if (!game.isLit()) return "It is pitch black. You are likely to be eaten by a grue.";
    /* ...existing body... */
  };
```

- [ ] **Step 4: Add light verbs to `js/commands.js`.**

```js
Object.assign(commands, {
  light(ctx, cmd) {
    const it = ctx.find(cmd.dobj);
    if (!it || !it.lightSource) return "You can't light that.";
    if (it.lit) return "It's already lit.";
    const hasMatch = ctx.inventory().some(i => (i.names||[]).includes("match") || (i.names||[]).includes("matches"));
    if (!hasMatch) return "You have nothing to light it with.";
    it.lit = true;
    return `The ${it.names[0]} flickers to life.`;
  },
  extinguish(ctx, cmd) {
    const it = ctx.find(cmd.dobj);
    if (!it || !it.lightSource) return "That isn't lit.";
    it.lit = false;
    return `You extinguish the ${it.names[0]}.`;
  },
  on(ctx, cmd) { return commands.light(ctx, cmd); },   // "turn on lamp" -> parser yields verb "on"
  off(ctx, cmd) { return commands.extinguish(ctx, cmd); },
});
```

- [ ] **Step 5: Run tests, expect PASS.** Run: `npm test`. Expected: `OK: light + grue`.

- [ ] **Step 6: Checkpoint — `npm test` green.**

---

## Task 7: Save / restore (localStorage) + serialization

State must round-trip. Item mutable flags (`open/locked/lit/fuel`) live on world objects, so serialize both `state` and a diff of mutable item fields.

**Files:**
- Create: `js/save.js`
- Modify: `js/core.js` (add `snapshot()` / `restore(snap)`)
- Modify: `tests/walkthrough.js`

- [ ] **Step 1: Write failing tests.**

```js
{
  const gs = createGame(structuredClone(world));
  gs.send("take key"); gs.send("north");
  const snap = gs.snapshot();
  const gs2 = createGame(structuredClone(world));
  gs2.restore(snap);
  assert.equal(gs2.state.room, "study");
  assert.deepEqual(gs2.inventory().map(i=>i.id), ["key"]);
}
console.log("OK: snapshot/restore");
```

- [ ] **Step 2: Run tests, expect FAIL.** Run: `npm test`.

- [ ] **Step 3: Add snapshot/restore to `js/core.js`.**

```js
  const MUT = ["open","locked","lit","fuel"];
  game.snapshot = () => ({
    state: structuredClone(state),
    items: Object.fromEntries(Object.entries(world.items).map(([id,def]) =>
      [id, Object.fromEntries(MUT.filter(k => k in def).map(k => [k, def[k]]))])),
  });
  game.restore = (snap) => {
    Object.assign(state, structuredClone(snap.state));
    for (const [id, fields] of Object.entries(snap.items || {}))
      Object.assign(world.items[id], fields);
  };
```

- [ ] **Step 4: Implement `js/save.js`** (browser localStorage wrapper).

```js
const KEY = "blackwood-save";
export function saveGame(game, slot = KEY) {
  try { localStorage.setItem(slot, JSON.stringify(game.snapshot())); return true; }
  catch { return false; }
}
export function loadGame(game, slot = KEY) {
  const raw = localStorage.getItem(slot);
  if (!raw) return false;
  try { game.restore(JSON.parse(raw)); return true; } catch { return false; }
}
export function hasSave(slot = KEY) { return !!localStorage.getItem(slot); }
```

- [ ] **Step 5: Run tests, expect PASS.** Run: `npm test`. Expected: `OK: snapshot/restore`.

- [ ] **Step 6: Checkpoint — `npm test` green.**

---

## Task 8: Browser UI (terminal), input, history, CRT styling, save wiring

Ties `core` to the DOM. Handles SAVE/RESTORE/RESTART/QUIT meta-verbs at the UI layer, command history, autosave after each turn, and the intro banner.

**Files:**
- Create: `js/ui.js`
- Modify: `css/style.css` (full CRT look)

- [ ] **Step 1: Implement `js/ui.js`.**

```js
import { createGame } from "./core.js";
import { world } from "./world.js";
import { saveGame, loadGame, hasSave } from "./save.js";

const transcript = document.getElementById("transcript");
const input = document.getElementById("cmd");
let game = createGame(world);
const history = []; let hi = 0;

const BANNER =
`BLACKWOOD MANOR
An Adventure in the Classic Style
=================================
Type HELP for commands. Type LOOK to look around.
`;

function print(text) {
  const div = document.createElement("div");
  div.textContent = text;
  transcript.appendChild(div);
  transcript.scrollTop = transcript.scrollHeight;
}
function echo(cmd) { print("\n> " + cmd); }

function start() {
  print(BANNER);
  if (hasSave()) print("(A saved game exists. Type RESTORE to continue it.)");
  print("\n" + game.describeRoom(true));
}

function handle(raw) {
  const cmd = raw.trim(); if (!cmd) return;
  echo(cmd); history.push(cmd); hi = history.length;
  const low = cmd.toLowerCase();

  if (low === "save")    { print(saveGame(game) ? "Saved." : "Save failed."); return; }
  if (low === "restore") { print(loadGame(game) ? game.describeRoom(true) : "No saved game."); return; }
  if (low === "restart") { game = createGame(world); print("\n" + game.describeRoom(true)); return; }
  if (low === "quit")    { print("Thanks for playing."); input.disabled = true; return; }

  const out = game.send(cmd);
  print(out);
  if (!game.state.dead && !game.state.won) saveGame(game);   // autosave
  if (game.state.won) print("\n*** You have escaped Blackwood Manor. ***");
}

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") { handle(input.value); input.value = ""; }
  else if (e.key === "ArrowUp") { if (hi>0){ hi--; input.value = history[hi] || ""; e.preventDefault(); } }
  else if (e.key === "ArrowDown") { if (hi<history.length){ hi++; input.value = history[hi] || ""; } }
});
document.getElementById("crt").addEventListener("click", () => input.focus());
start();
```

- [ ] **Step 2: Full CRT `css/style.css`** (replace file).

```css
:root { --green:#43ff7a; --dim:#1f7a3a; --bg:#050805; }
* { box-sizing:border-box; }
html,body { margin:0; height:100%; background:var(--bg); overflow:hidden; }
#crt { position:relative; height:100%; display:flex; flex-direction:column;
  padding:1.25rem 1.5rem;
  font-family:"SFMono-Regular",Consolas,"Liberation Mono",Menlo,monospace;
  color:var(--green); font-size:16px; line-height:1.45;
  text-shadow:0 0 4px rgba(67,255,122,.45); }
#crt::after { content:""; position:absolute; inset:0; pointer-events:none;
  background:repeating-linear-gradient(rgba(0,0,0,0) 0 2px, rgba(0,0,0,.18) 2px 3px); }
#transcript { flex:1; overflow-y:auto; white-space:pre-wrap; padding-right:.5rem; }
#transcript div { margin:0; }
#inputline { display:flex; gap:.5rem; align-items:center; border-top:1px solid var(--dim);
  padding-top:.5rem; }
#prompt { color:var(--green); }
#cmd { flex:1; background:transparent; border:none; color:var(--green); font:inherit;
  outline:none; caret-color:var(--green); text-shadow:inherit; }
@media (max-width:600px){ #crt{ font-size:14px; padding:.75rem; } }
```

- [ ] **Step 3: Manual browser check.** Open `index.html` in a browser (double-click from Finder / iCloud). Expected: banner + first room render; `look`, `help`, movement, `take`/`i` work; up-arrow recalls commands; `save` then reload + `restore` continues. (No automated assert — this is the DOM layer; logic is covered by Node tests.)

- [ ] **Step 4: Checkpoint — `npm test` still green** (UI changes must not break core). Run: `npm test`.

---

## Task 9: World content — Blackwood Manor (16 rooms, items, puzzles)

Author the full game in `js/world.js` to the schema proven by Tasks 2–7. This is content, validated by the Task 10 walkthrough. Build incrementally: rooms first, then items, then puzzle handlers, running the walkthrough after each layer.

**Files:**
- Create: `js/world.js`

- [ ] **Step 1: Config + all 16 rooms with exits** (map per DESIGN.md §6). Skeleton:

```js
export const world = {
  config: { start: "gate", maxCarry: 6, title: "Blackwood Manor" },
  rooms: {
    gate:      { name:"Front Gate", desc:"...", exits:{ north:"porch", east:"garden" } },
    garden:    { name:"Overgrown Garden", desc:"...", exits:{ west:"gate" } }, // + well
    porch:     { name:"Front Porch", desc:"...", exits:{ south:"gate",
                 north:{ to:"grandHall", via:"frontDoorOpen", lockedMsg:"The front door is locked." } } },
    grandHall: { name:"Grand Hall", desc:"...", exits:{ south:"porch", east:"parlor",
                 west:"diningRoom", up:"landing" } },
    parlor:    { name:"Parlor", desc:"...", exits:{ west:"grandHall", south:"library" } },
    library:   { name:"Library", desc:"...", exits:{ north:"parlor",
                 down:{ to:"secretChamber", via:"leverPulled", lockedMsg:"The shelves are solid." } } },
    secretChamber:{ name:"Secret Chamber", desc:"...", dark:true, exits:{ up:"library" } },
    diningRoom:{ name:"Dining Room", desc:"...", exits:{ east:"grandHall", south:"kitchen" } },
    kitchen:   { name:"Kitchen", desc:"...", exits:{ north:"diningRoom",
                 down:{ to:"wineCellar", via:"cellarOpen", lockedMsg:"The cellar door won't budge." } } },
    wineCellar:{ name:"Wine Cellar", desc:"...", dark:true, exits:{ up:"kitchen", south:"crypt" } },
    crypt:     { name:"Crypt", desc:"...", dark:true, exits:{ north:"wineCellar" } },
    landing:   { name:"Landing", desc:"...", exits:{ down:"grandHall", west:"nursery",
                 east:"masterBedroom", south:"study", up:{ to:"attic", via:"ladderDown",
                 lockedMsg:"There's no way up without the ladder." } } },
    nursery:   { name:"Nursery", desc:"...", exits:{ east:"landing" } },
    masterBedroom:{ name:"Master Bedroom", desc:"...", exits:{ west:"landing" } },
    study:     { name:"Study", desc:"...", exits:{ north:"landing" } },
    attic:     { name:"Attic", desc:"...", exits:{ down:"landing" } },
  },
  items: {},
};
```

Fill every `desc` with atmospheric prose (2–4 sentences, present tense, second person).

- [ ] **Step 2: Add items** — treasures, tools, keys, scenery — per DESIGN.md §7. Each with `names`, `adjectives`, `loc`, flags, `desc`, and `points` for treasures. Include: `mailbox` (container, fixed) + `letter`; `statue` (scenery) hiding `frontKey`; `rope`; `candlestick` (lightSource, fuel:60, treasure); `matches`; `diary` (readable); `portrait` (scenery, hides `safe`); `safe` (container, locked, combination); `musicBox` → `tinyKey`; `jewelryBox` (container, locked, keyId:tinyKey) + `rubyRing`; `lever` (scenery); `salt` or `talisman`; `wraith` (fixed, lethal); `reliquary` (container, fixed, in grandHall); treasures `goldLocket`, `grimoire`, `ancientCoin`, `crystalDecanter`, `jeweledMusicBox`.

- [ ] **Step 3: Add puzzle handlers** via `on:` using the `ctx` API. Examples to implement:
  - Front door: `frontDoor` item `on:{ unlock }` sets `frontDoorOpen`; or opening with `frontKey`.
  - Well: `garden`/`well` `on:{ climb, enter }` — without `rope` in inventory → `ctx.kill("You plunge into the dry well...")`; with rope → reveals `ancientCoin`.
  - Statue: `on:{ move, push, search }` reveals `frontKey`.
  - Safe: `on:{ unlock, open }` requiring the combination from `diary` (flag `knowsCombo` set by reading diary).
  - Lever: `on:{ pull }` sets `leverPulled`.
  - Cellar door: `on:{ open }` sets `cellarOpen`.
  - Ladder: attic `hatch` `on:{ pull }` sets `ladderDown`.
  - Wraith: entering `crypt` or `attack wraith` without `talisman` → `ctx.kill(...)`; with talisman worn → allows taking the final heirloom.
  - Attic floor: on entering `attic` with inventory weight over threshold → `ctx.kill("The rotted floor gives way...")`.
  - Reliquary: `put <treasure> in reliquary` → `ctx.addScore(points*2)`; when all treasures deposited, set `curseLiftable`.
  - Ritual/win: `ring bell` or `perform ritual` in grandHall when `curseLiftable` → `ctx.state.won = true`.

- [ ] **Step 4: Run the walkthrough** (Task 10) after each layer. Run: `npm test`. Iterate until green.

- [ ] **Step 5: Checkpoint — browser playtest** a few minutes; fix any prose/parse gaps.

---

## Task 10: End-to-end walkthrough test (winning path + death paths)

The regression net. Drives the DOM-free core through a complete solve and asserts victory + score, plus asserts each cruel death fires.

**Files:**
- Modify: `tests/walkthrough.js` (add a final section that imports `world` and plays it)

- [ ] **Step 1: Write the winning-walkthrough assertion.**

```js
import { world as manor } from "../js/world.js";
{
  const g = createGame(structuredClone(manor));
  const cmds = [ /* the exact solution sequence, authored alongside Task 9 */ ];
  let last = "";
  for (const c of cmds) { last = g.send(c); if (g.state.dead) throw new Error("Died at: "+c+" -> "+last); }
  assert.equal(g.state.won, true, "expected victory; last output:\n"+last);
  assert.ok(g.state.score > 0);
}
console.log("OK: full walkthrough win");
```

- [ ] **Step 2: Write death-path assertions.**

```js
{ // grue
  const g = createGame(structuredClone(manor));
  // navigate to a dark room with no light, act twice
  // (sequence authored with the map)
}
{ // well without rope
  const g = createGame(structuredClone(manor));
  // go to garden, climb into well without rope -> dead
}
console.log("OK: death paths");
```

- [ ] **Step 3: Run full suite.** Run: `npm test`. Expected: all `OK:` lines print, process exits 0.

- [ ] **Step 4: Checkpoint — suite green.**

---

## Task 11: Scoring, ranks, win + death screens

**Files:**
- Modify: `js/commands.js` (`score`) and `js/core.js` (rank in win/death output)

- [ ] **Step 1: Write failing test.**

```js
{
  const g = createGame(structuredClone(world));
  assert.match(g.send("score"), /score|points/i);
}
console.log("OK: score command");
```

- [ ] **Step 2: Run, expect FAIL.** Run: `npm test`.

- [ ] **Step 3: Implement `score` in `js/commands.js`.**

```js
commands.score = (ctx) =>
  `Your score is ${ctx.state.score} in ${ctx.state.turns} turns.\nRank: ${ctx.rank()}`;
```

Add `rank()` to `game` in `core.js`:

```js
  game.rank = () => {
    const s = state.score;
    if (s >= 100) return "Master of Blackwood Manor";
    if (s >= 60)  return "Seasoned Investigator";
    if (s >= 30)  return "Amateur Ghost-Hunter";
    return "Trespasser";
  };
```

- [ ] **Step 4: Run, expect PASS.** Run: `npm test`. Expected: `OK: score command`.

- [ ] **Step 5: Checkpoint — suite green.**

---

## Task 12: README (play + expansion guide)

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write `README.md`** covering: how to play (open `index.html`), the verb list, `SAVE`/`RESTORE`, and — the whole point — **how to expand** (add a room to `rooms`, an item to `items`, a puzzle via `on:` handlers), and `npm test` as the regression check. Include one worked "add a room" example.

- [ ] **Step 2: Final checkpoint — `npm test` green; open in browser and play a full loop.**

---

## Self-Review notes

- **Spec coverage:** premise/goal (T9), architecture/files (T1–T8), world data model (T2,T5,T9), parser (T3), cruel mechanics — darkness/grue/fuel (T6), traps/soft-locks (T9 handlers), 16-room map (T9), puzzle/treasure chains (T9), scoring/ranks (T11), CRT look (T8), testing (T10), expandability (T9 schema + T12 README). ✔ All DESIGN.md sections mapped.
- **No git:** every task uses `npm test` as its checkpoint; no `git` commands anywhere (HackelFamilyBrain rule). ✔
- **Type consistency:** `ctx` API (`print` is via return value; state mutators `setFlag/getFlag/has/moveItem/destroy/addScore/kill/find/inventory/itemsIn/room/describeRoom/rank/snapshot/restore/isLit/activeLights/visibleItems`) is defined in Tasks 2/4/6/7/11 and used consistently in T9 handlers. Item mutable fields (`open/locked/lit/fuel`) serialized in T7 match usage in T5/T6. ✔
- **Known follow-ups deferred (YAGNI):** multi-object commands ("take all"), NPC dialogue trees, sound — not in v1.
