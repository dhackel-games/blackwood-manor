// engine.test.js — unit tests for the generic engine (no mansion content).
// Run: node tests/engine.test.js
import assert from "node:assert";
import { createGame } from "../js/core.js";
import { parse, splitCommands } from "../js/parser.js";

// ---------- shared fixture ----------
function fixture() {
  return {
    config: { start: "hall", maxCarry: 5 },
    rooms: {
      hall: { name: "Hall", desc: "A dusty hall.", exits: { north: "study", down: "cellar" } },
      study: { name: "Study", desc: "A small study.", exits: { south: "hall" } },
      cellar: { name: "Cellar", desc: "A damp cellar.", dark: true, exits: { up: "hall" } },
    },
    items: {
      key: { names: ["key"], adjectives: ["brass"], loc: "hall", takeable: true, desc: "A brass key." },
      desk: { names: ["desk"], loc: "study", fixed: true, desc: "A heavy desk." },
      candle: { names: ["candle", "candlestick"], adjectives: ["silver"], loc: "hall",
        takeable: true, lightSource: true, lit: false, fuel: 5, desc: "A silver candle." },
      match: { names: ["match", "matches"], loc: "hall", takeable: true, desc: "A match." },
      box: { names: ["box"], loc: "hall", container: true, openable: true, open: false,
        locked: true, keyId: "key", capacity: 3, desc: "A small locked box." },
      note: { names: ["note"], loc: "box", takeable: true, readable: true,
        text: "It reads: BEWARE THE DARK.", desc: "A folded note." },
    },
  };
}

// ---------- Task 2: core state ----------
{
  const g = createGame(fixture());
  assert.equal(g.state.room, "hall");
  assert.equal(g.roomOf("key"), "hall");
  assert.deepEqual(g.itemsIn("hall").map((i) => i.id).sort(),
    ["box", "candle", "key", "match"]);
  assert.equal(g.findItem("brass key").id, "key");
  assert.equal(g.findItem("nonsense"), null);
  console.log("OK: core state");
}

// ---------- Task 3: parser ----------
{
  const p = (s) => parse(s);
  assert.deepEqual(p("n"), { verb: "go", dobj: "north", prep: null, iobj: null });
  assert.deepEqual(p("take the brass key"),
    { verb: "take", dobj: "brass key", prep: null, iobj: null });
  assert.deepEqual(p("unlock the oak door with the brass key"),
    { verb: "unlock", dobj: "oak door", prep: "with", iobj: "brass key" });
  assert.deepEqual(p("look"), { verb: "look", dobj: null, prep: null, iobj: null });
  assert.deepEqual(p("turn on lamp"), { verb: "on", dobj: "lamp", prep: null, iobj: null });
  assert.equal(p("").error, "empty");
  assert.equal(p("frobnicate the widget").error, "unknown-verb");
  console.log("OK: parser");
}

// ---------- Task 4: movement + look + take/drop/inventory ----------
{
  const g = createGame(fixture());
  assert.match(g.send("look"), /HALL/);
  assert.match(g.send("take key"), /Taken/);
  assert.deepEqual(g.inventory().map((i) => i.id), ["key"]);
  assert.match(g.send("i"), /brass key/i);
  assert.match(g.send("north"), /STUDY/);
  assert.equal(g.state.room, "study");
  assert.match(g.send("take desk"), /portable/i); // fixed
  assert.match(g.send("drop key"), /Dropped/);
  assert.equal(g.roomOf("key"), "study");
  assert.match(g.send("south"), /HALL/);
  console.log("OK: movement + inventory");
}

// ---------- Task 5: containers ----------
{
  const g = createGame(fixture());
  assert.match(g.send("open box"), /locked/i);
  assert.match(g.send("take key"), /Taken/);
  assert.match(g.send("unlock box with key"), /unlock/i);
  assert.match(g.send("open box"), /open|revealing/i);
  assert.match(g.send("look"), /note/i);
  assert.match(g.send("read note"), /BEWARE THE DARK/);
  assert.match(g.send("take note"), /Taken/);
  assert.match(g.send("put note in box"), /put/i);
  assert.equal(g.roomOf("note"), "box");
  console.log("OK: containers");
}

// ---------- Task 6: light + grue + fuel ----------
{
  // die by entering dark without light, then acting again
  const dark = createGame(fixture());
  const warn = dark.send("down");
  assert.match(warn, /pitch black|grue/i);
  const dead = dark.send("look");
  assert.match(dead, /grue/i);
  assert.equal(dark.state.dead, true);
}
{
  // survive with a lit candle; fuel eventually runs out
  const lit = createGame(fixture());
  lit.send("take candle"); lit.send("take match");
  assert.match(lit.send("light candle"), /flick|life|lit/i);
  assert.match(lit.send("down"), /CELLAR/);
  assert.equal(lit.state.dead, false);
  // burn remaining fuel (started 5, minus turns already taken)
  let out = "";
  for (let i = 0; i < 8 && !lit.state.dead; i++) out = lit.send("look");
  assert.equal(lit.state.dead, true, "should die once candle burns out in the dark");
  console.log("OK: light + grue");
}

// ---------- Task 7: snapshot / restore ----------
{
  const g = createGame(fixture());
  g.send("take key"); g.send("north");
  const snap = g.snapshot();
  const g2 = createGame(fixture());
  g2.restore(snap);
  assert.equal(g2.state.room, "study");
  assert.deepEqual(g2.inventory().map((i) => i.id), ["key"]);
  console.log("OK: snapshot/restore");
}

// ---------- Task 11: score/rank ----------
{
  const g = createGame(fixture());
  assert.match(g.send("score"), /score is 0/i);
  assert.match(g.send("score"), /Trespasser/);
  console.log("OK: score command");
}

// ---------- content handler override ----------
{
  const w = fixture();
  w.items.lever = { names: ["lever"], loc: "hall", fixed: true, desc: "A rusty lever.",
    on: { pull: (ctx) => { ctx.setFlag("leverPulled"); return "The lever clicks."; } } };
  const g = createGame(w);
  assert.match(g.send("pull lever"), /clicks/);
  assert.equal(g.getFlag("leverPulled"), true);
  console.log("OK: handler override");
}

// ---------- command chaining ----------
{
  assert.deepEqual(splitCommands("n; open box; get key"), ["n", "open box", "get key"]);
  assert.deepEqual(splitCommands("n. s. e"), ["n", "s", "e"]);
  assert.deepEqual(splitCommands("take key then go north"), ["take key", "go north"]);
  assert.deepEqual(splitCommands("n, s"), ["n", "s"]);
  assert.deepEqual(splitCommands("look"), ["look"]);
  assert.deepEqual(splitCommands("  "), []);
  // "then" only splits as a standalone word, never inside one.
  assert.deepEqual(splitCommands("open thenardier"), ["open thenardier"]);
  console.log("OK: splitCommands");

  // A chained line runs one turn per command.
  const g = createGame(fixture());
  const out = g.send("take key; go north");
  assert.match(out, /> take key/);
  assert.match(out, /> go north/);
  assert.equal(g.state.turns, 2);
  assert.equal(g.state.room, "study");

  // An unknown word aborts the rest of the line rather than half-executing it.
  const g2 = createGame(fixture());
  const bad = g2.send("frobnicate key; go north");
  assert.match(bad, /I don't know the word "frobnicate"/);
  assert.notEqual(g2.state.room, "study");

  // A single command is returned verbatim, with no "> cmd" prefix.
  const g3 = createGame(fixture());
  assert.ok(!g3.send("look").startsWith("> "));
  console.log("OK: command chaining");
}

console.log("\nALL ENGINE TESTS PASSED");
