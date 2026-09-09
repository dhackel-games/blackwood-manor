// walkthrough.js — end-to-end regression test for Blackwood Manor.
// Runs the engine unit tests first, then plays the real world to victory and
// verifies the cruel death traps fire. Run: node tests/walkthrough.js
import assert from "node:assert";
import { createGame } from "../js/core.js";
import { world } from "../js/world.js";
import "./engine.test.js"; // runs engine unit assertions on import

function play(cmds, { stopOnDeath = false } = {}) {
  const g = createGame(world);
  const log = [];
  for (const c of cmds) {
    const out = g.send(c);
    log.push(`> ${c}\n${out}`);
    if (g.state.dead && !stopOnDeath) {
      throw new Error(`Unexpected death at "${c}":\n${out}\n\n--- transcript ---\n${log.join("\n\n")}`);
    }
    if (g.state.dead && stopOnDeath) break;
  }
  return { g, log };
}

// ---------------------------------------------------------------------------
// 1. The winning walkthrough
// ---------------------------------------------------------------------------
const WIN = [
  // get inside
  "east", "search statue", "take iron key", "west", "north",
  "unlock door with iron key", "open door", "north",
  // grab the light + tools
  "west", "take candlestick", "south", "take matches", "take rope",
  "light candle", "open cellar", "down", "take decanter", "up", "north", "east",
  "put decanter in reliquary",
  // the well (needs rope)
  "south", "south", "east", "enter well", "take coin", "west", "north", "north",
  "put coin in reliquary", "drop rope",
  // upstairs: diary combo, music box + tiny key, ruby ring
  "up", "south", "read diary", "north", "west",
  "open music box", "take tiny key", "take music box", "east", "east",
  "unlock jewelry box with tiny key", "open jewelry box", "take ring", "west",
  // attic (must climb light — drop everything but nothing)
  "pull cord", "drop tiny key", "drop music box", "drop ring", "drop iron key",
  "up", "take miniature", "down", "take music box", "take ring", "down",
  "put music box in reliquary", "put ring in reliquary", "put miniature in reliquary",
  // parlor safe -> talisman; library secret chamber -> grimoire
  "east", "move portrait", "open safe", "take talisman", "wear talisman",
  "south", "pull lever", "down", "take grimoire", "up", "north", "west",
  "put grimoire in reliquary",
  // crypt (needs talisman worn) -> locket
  "west", "south", "down", "south", "take locket", "north", "up", "north", "east",
  "put locket in reliquary",
  // deposit the candlestick last, then ring the bell to lift the curse...
  "put candlestick in reliquary", "ring bell",
  // ...which opens the hidden wing: a bone key + secret door appear.
  "take bone key", "unlock secret door with bone key", "open secret door",
  "north", "north", "take mirror", "north",
];

{
  const { g, log } = play(WIN);
  assert.equal(g.state.won, true, "expected victory. transcript:\n" + log.slice(-6).join("\n\n"));
  assert.equal(g.state.score, 155, "expected 125 + 30 mirror bonus, got " + g.state.score);
  assert.match(g.rank(), /Master of Blackwood Manor/);
  console.log(`OK: full walkthrough win incl. hidden wing (score ${g.state.score}, ${g.state.turns} turns)`);
}

// ---------------------------------------------------------------------------
// 2. Death traps (content-specific; grue is covered in engine.test.js)
// ---------------------------------------------------------------------------
{ // the dry well without a rope
  const { g } = play(["east", "enter well"], { stopOnDeath: true });
  assert.equal(g.state.dead, true, "expected to die in the well without a rope");
  console.log("OK: death — the dry well");
}
{ // the crypt wraith without the talisman
  const { g } = play([
    "east", "search statue", "take iron key", "west", "north",
    "unlock door with iron key", "open door", "north",
    "west", "take candlestick", "south", "take matches", "light candle",
    "open cellar", "down", "south",
  ], { stopOnDeath: true });
  assert.equal(g.state.dead, true, "expected the wraith to kill an unprotected intruder");
  console.log("OK: death — the crypt wraith");
}
{ // the attic ladder while overloaded
  const { g } = play([
    "east", "search statue", "take iron key", "west", "north",
    "unlock door with iron key", "open door", "north",
    "west", "take candlestick", "south", "take rope", "north", "east",
    "up", "pull cord", "up",
  ], { stopOnDeath: true });
  assert.equal(g.state.dead, true, "expected the overloaded attic ladder to collapse");
  console.log("OK: death — the attic floor");
}

// ---------------------------------------------------------------------------
// 3. The 1-900 hint line (Gary)
// ---------------------------------------------------------------------------
{
  const g = createGame(world);
  const r1 = g.send("call");
  assert.match(r1, /Gary/, "hotline should introduce Gary");
  assert.match(r1, /statue/i, "first hint should point at the statue/key");
  assert.match(r1, /\$0\.99/, "should show a 99-cent meter");
  assert.equal(g.state.score, -2, "dialing in costs 2 points");
  assert.equal(g.getFlag("onCall"), true, "should stay on the line after calling");

  // you can actually talk to him now
  assert.match(g.send("who are you"), /Gary/i, "answers identity questions");
  assert.match(g.send("are you hungry"), /(meal|hungry|hot ?pocket|food|starv|eat)/i, "answers hunger questions");
  assert.match(g.send("how much do you get paid"), /(three thirty-five|hour|cent)/i, "answers pay questions");
  assert.match(g.send("north"), /HANG UP|hint line|legs/i, "refuses to move you while on the line");
  assert.match(g.send("hint"), /statue/i, "HINT still gives the real clue");

  const bye = g.send("hang up");
  assert.match(bye, /click/i, "hang up ends the call");
  assert.equal(g.getFlag("onCall"), false, "off the line after hanging up");

  // normal play resumes
  assert.match(g.send("east"), /GARDEN/, "movement works again after hanging up");
  console.log("OK: hint line (Gary) — conversational + billing");
}

// ---------------------------------------------------------------------------
// 4. Well is reachable via "down" / "climb down" (and lethal without a rope)
// ---------------------------------------------------------------------------
{
  const g = createGame(world);
  g.send("east");            // to garden
  const dead = g.send("down");
  assert.match(dead, /well|fall|plunge|dry/i, "‘down’ in the garden should attempt the well");
  assert.equal(g.state.dead, true, "down the well without a rope should be fatal");
  console.log("OK: well reachable via ‘down’ (fatal without rope)");
}

// ---------------------------------------------------------------------------
// 5. Gary's bill milestones + hall-of-shame ranks
// ---------------------------------------------------------------------------
{
  const g = createGame(world);
  g.send("call");
  let all = "";
  for (let i = 0; i < 6; i++) all += "\n" + g.send("hint"); // run the bill up past $5
  assert.match(all, /five bucks/i, "Gary should needle you when the bill crosses $5");
  assert.match(world.phoneRank(2000), /Best Customer/, "$20 -> Best Customer");
  assert.match(world.phoneRank(6000), /Worst Caller/, "$60 -> Worst Caller of All Time");
  assert.match(world.phoneRank(100), /Frugal/, "$1 -> Frugal");
  console.log("OK: bill milestones + hall-of-shame ranks");
}

// ---------------------------------------------------------------------------
// 6. Ringing the bell opens the hidden wing (doesn't end the game outright)
// ---------------------------------------------------------------------------
{
  // fast path: force the win-ready state, then confirm the bell reveals the wing
  const g = createGame(world);
  g.state.room = "grandHall";   // stand in the hall
  g.setFlag("curseLiftable");
  const rung = g.send("ring bell");
  assert.match(rung, /BONE KEY|SECRET DOOR/i, "bell should reveal the key + door");
  assert.equal(g.state.won, false, "ringing the bell should NOT end the game now");
  assert.equal(g.roomOf("boneKey"), "grandHall", "bone key should appear in the hall");
  console.log("OK: bell opens the hidden wing");
}

console.log("\nALL WALKTHROUGH TESTS PASSED");
