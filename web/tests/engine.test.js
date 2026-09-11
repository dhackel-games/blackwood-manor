// engine.test.js — unit tests for the generic engine (no mansion content).
// Run: node tests/engine.test.js
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { createGame } from "../js/core.js";
import { parse, splitCommands } from "../js/parser.js";
import { clean as garyClean, isLocalPage } from "../js/gary-brain.js";
import { VERSION } from "../js/version.js";

const COPYRIGHT_VERSION =
  "Copyright (c) dhackel-games 2026...2026-09-10.001:acoven. All Rights Reserved.";

assert.equal(VERSION, COPYRIGHT_VERSION, "the displayed copyright-version must remain exact");
const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
assert.equal(packageJson.version, "2026.9.10", "package SemVer must be the YYYY.M.D release date");

// ---------- shared fixture ----------
function fixture() {
  return {
    config: { start: "hall", maxCarry: 5 },
    rooms: {
      hall: { name: "Hall", art: "[HALL ART]", desc: "A dusty hall.",
        searchDesc: "Scratches on the floor suggest the locked box has been moved recently.",
        exits: { north: "study", down: "cellar" } },
      study: { name: "Study", art: "[STUDY ART]", desc: "A small study.", exits: { south: "hall" } },
      cellar: { name: "Cellar", art: "[CELLAR ART]", desc: "A damp cellar.", dark: true, exits: { up: "hall" } },
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
  assert.deepEqual(p("look at brass key"),
    { verb: "examine", dobj: "brass key", prep: null, iobj: null });
  assert.deepEqual(p("look brass key"),
    { verb: "examine", dobj: "brass key", prep: null, iobj: null });
  assert.deepEqual(p("search brass key"),
    { verb: "examine", dobj: "brass key", prep: null, iobj: null });
  assert.deepEqual(p("ex brass key"),
    { verb: "examine", dobj: "brass key", prep: null, iobj: null });
  assert.deepEqual(p("look at"), { verb: "look", dobj: null, prep: null, iobj: null });
  assert.deepEqual(p("turn on lamp"), { verb: "on", dobj: "lamp", prep: null, iobj: null });
  assert.deepEqual(p("yes"), { verb: "yes", dobj: null, prep: null, iobj: null });
  assert.deepEqual(p("no"), { verb: "no", dobj: null, prep: null, iobj: null });
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

// ---------- unified item and room inspection ----------
{
  const itemForms = [
    "search brass key",
    "ex brass key",
    "examine brass key",
    "look brass key",
    "look at brass key",
  ];
  for (const command of itemForms) {
    const g = createGame(fixture());
    assert.match(g.send(command), /brass key/i, `${command} should inspect the item`);
  }

  const roomForms = ["search", "ex", "examine", "look", "look at"];
  for (const command of roomForms) {
    const g = createGame(fixture());
    const output = g.send(command);
    assert.ok(output.indexOf("A dusty hall.") < output.indexOf("CLOSER INSPECTION"),
      `${command} should show the base room before deeper detail`);
    assert.match(output, /Scratches on the floor/, `${command} should show the room-specific tidbit`);
    assert.match(output, /KEY: TAKE/, `${command} should list takeable items`);
    assert.match(output, /BOX: UNLOCK, OPEN, PUT ITEMS IN/, `${command} should list manipulation verbs`);
  }
  console.log("OK: unified room + item inspection");
}

// ---------- room art display cadence ----------
{
  const g = createGame(fixture());
  assert.match(g.send("look"), /\[HALL ART\]/, "explicit room inspection shows room art");
  assert.match(g.send("north"), /\[STUDY ART\]/, "first entry shows room art");
  assert.doesNotMatch(g.send("south"), /\[HALL ART\]/, "ordinary re-entry does not repeat room art");
  assert.match(g.send("search"), /\[HALL ART\]/, "explicit search shows room art again");
  console.log("OK: room art display cadence");
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

  const directions = createGame(fixture());
  directions.send("n; s");
  assert.equal(directions.state.turns, 2, "n; s runs as two turns");
  assert.equal(directions.state.room, "hall", "n; s moves north and then returns south");

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

// ---------- Gary's LLM voice layer: output cleaning ----------
{
  // A small on-device model reliably leaks narration, name prefixes and smart
  // quotes. clean() is the guard; "" means "fall back to the canned line".
  assert.equal(garyClean('Gary: I didn\'t. It\'s been ten hours.'), "I didn't. It's been ten hours.");
  assert.equal(garyClean('"Every ninety seconds. Then I remember rent."'),
    "Every ninety seconds. Then I remember rent.");
  assert.equal(garyClean('Gary sighs and says, \u201CLoneliness is not an emotion I entertain.'),
    "Loneliness is not an emotion I entertain.");
  assert.equal(garyClean('Fine. Line one.\n\nDropped paragraph.'), "Fine. Line one.");
  assert.equal(garyClean('I am an AI assistant and cannot help.'), "");
  assert.equal(garyClean('Gary shrugs helplessly at the phone.'), "");
  // Canned Gary has zero profanity; a swearing line is a tonal break, so it is
  // rejected in favour of the hand-written fallback.
  assert.equal(garyClean("Fuck loneliness. It's not worth my $3.35/hr."), "");
  assert.equal(garyClean("I don't get paid enough for this."), "I don't get paid enough for this.");
  assert.equal(garyClean(''), "");
  assert.equal(garyClean(null), "");
  // Gary talks, he does not write verse: the model answers in short mystical
  // lines if left alone, and ignores "two sentences max" once it gets going.
  assert.equal(garyClean("It is not a dream I dream of.\nIt is my reality."),
    "It is not a dream I dream of. It is my reality.");
  assert.equal(
    garyClean("Been here a decade. They don't pay much. But it's stable. Now what do you want?"),
    "Been here a decade. They don't pay much.");
  assert.equal(garyClean("One sentence only"), "One sentence only");
  assert.equal(garyClean("'Been here over a decade.'"), "Been here over a decade.");
  assert.equal(garyClean("Yes. , I haven't eaten any food."), "Yes. I haven't eaten any food.");
  assert.equal(garyClean("I don't get paid enough."), "I don't get paid enough.");
  // Meta-preamble leak, seen live: the model announces the line before saying
  // it. Both shapes — inline, and as its own paragraph before the real reply.
  assert.equal(garyClean("Here's a possible response from Gary: Meter's at $1.98."),
    "Meter's at $1.98.");
  assert.equal(garyClean("Gary thinks for a second or two before answering:\n\nI'm wearing an old sweater."),
    "I'm wearing an old sweater.");
  assert.equal(garyClean("Sure, here you go: I haven't eaten since yesterday."),
    "I haven't eaten since yesterday.");
  // ...but an ordinary line that merely contains a colon must survive intact.
  assert.equal(garyClean("Look: I don't care."), "Look: I don't care.");
  assert.equal(garyClean("Rule one: don't die in the dark."), "Rule one: don't die in the dark.");
  console.log("OK: gary clean()");
}

// ---------- Gary's daemon probe must stay off the public site ----------
{
  // Chrome gates http://127.0.0.1 behind the Local Network Access permission,
  // so probing from the deployed site would prompt every visitor to allow
  // "access to devices on your local network" on a text adventure. Only a page
  // already served from this machine may look for the daemon.
  const realLocation = globalThis.location;
  const setHost = (protocol, hostname) => {
    Object.defineProperty(globalThis, "location",
      { value: { protocol, hostname, href: `${protocol}//${hostname}/` }, configurable: true });
  };

  setHost("https:", "dhackel-games.github.io");
  assert.equal(isLocalPage(), false, "public site must never probe the daemon");
  setHost("https:", "example.com");
  assert.equal(isLocalPage(), false, "no remote origin may probe the daemon");

  for (const h of ["localhost", "127.0.0.1", "::1"]) {
    setHost("http:", h);
    assert.equal(isLocalPage(), true, `${h} should probe the daemon`);
  }
  setHost("file:", "");
  assert.equal(isLocalPage(), true, "file:// should probe the daemon");

  if (realLocation === undefined) delete globalThis.location;
  else Object.defineProperty(globalThis, "location", { value: realLocation, configurable: true });
  console.log("OK: gary daemon probe scoped to local pages");
}

console.log("\nALL ENGINE TESTS PASSED");
