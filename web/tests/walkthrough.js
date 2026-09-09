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

// ---------------------------------------------------------------------------
// 7. Andy's bit: mailbox -> letter -> burn -> light self on fire -> call Gary
// ---------------------------------------------------------------------------
{
  const g = createGame(world);
  g.send("north");                                   // gate -> porch
  assert.match(g.send("open mailbox"), /letter/i, "mailbox opens to reveal the letter");
  assert.equal(g.send("get letter"), "Taken.", "letter is takeable");
  assert.match(g.send("burn letter"), /alight|ash|flakes/i, "letter can be burned");
  assert.equal(g.roomOf("letter"), null, "burned letter is destroyed");

  const ablaze = g.send("light self on fire");
  assert.match(ablaze, /on fire/i, "you can light yourself on fire");
  assert.equal(g.getFlag("onFire"), true, "onFire flag set");

  const greet = g.send("call gary");                 // dial in while ablaze
  assert.match(greet, /burning|on fire/i, "Gary notices you're on fire");
  assert.match(greet, /dollar ninety-nine|1\.99/i, "Gary quotes $1.99 for the on-fire call");

  const fd = g.send("Gary call the fire department!");
  assert.match(fd, /2\.98/, "fire-department beat lands at $2.98");
  assert.match(fd, /pizza/i, "...and Gary wants pizza money");

  const rescued = g.send("here's the money");         // resolution beat
  assert.match(rescued, /fire brigade|hose|OUT/i, "the fire brigade eventually shows up");
  assert.equal(g.getFlag("onFire"), false, "no longer on fire after the rescue");

  // self-immolation works anywhere; generic lighting stays intact
  const g2 = createGame(world);
  assert.match(g2.send("burn self"), /on fire/i, "'burn self' also ignites");
  assert.match(g2.send("extinguish self"), /no longer on fire/i, "stop-drop-roll puts you out");
  assert.equal(g2.send("light mailbox"), "You can't light that.", "normal lighting unaffected");
  console.log("OK: mailbox/letter/burn + self-immolation + Gary fire call");
}

// ---------------------------------------------------------------------------
// 8. Burn-up timer, brazier challenge, kitchen foods, toilet, badges
// ---------------------------------------------------------------------------
{
  // Burn-up: you last a few turns, then you're ash.
  const g = createGame(world);
  g.send("light self on fire");
  let dead = false;
  for (let i = 0; i < 12 && !dead; i++) { g.send("wait"); dead = g.state.dead; }
  assert.ok(dead, "staying on fire should eventually kill you");

  // Fire ASCII banner + sick ASCII banner appear in room descriptions.
  const g2 = createGame(world);
  g2.send("light self on fire");
  assert.match(g2.send("look"), /ON   F I R E|🔥/, "fire art shows in the room description");

  // Brazier REQUIRES being on fire; lighting it rewards the ember + puts you out.
  const g3 = createGame(world);
  g3.state.room = "garden";
  assert.match(g3.send("light brazier"), /whole person|hisses/i, "brazier won't light without your own fire");
  g3.send("light self on fire");
  assert.match(g3.send("light brazier"), /EMBER STONE/, "on fire, the brazier lights and yields the ember");
  assert.equal(g3.getFlag("onFire"), false, "lighting the brazier dumps your fire into it");
  assert.equal(g3.roomOf("emberStone"), "garden", "ember stone appears");
  assert.equal(g3.getFlag("brazierLit"), true, "brazier is lit");

  // Kitchen foods: high / sick / good.
  let k = createGame(world); k.state.room = "kitchen";
  k.send("eat mushrooms"); assert.ok((k.getFlag("high") || 0) > 0, "mushrooms get you high");
  k = createGame(world); k.state.room = "kitchen";
  k.send("eat meat"); assert.ok((k.getFlag("sick") || 0) > 0, "rancid meat makes you sick");
  assert.match(k.send("look"), /VOMITING & DIARRHEA|🤢/, "sick art shows in the room description");
  k.send("eat cheese"); assert.equal(k.getFlag("sick"), 0, "good cheese cures the sickness");
  assert.equal(k.getFlag("ateGood"), true, "eating the cheese is recorded for the badge");

  // Sickness is lethal if uncured...
  const s = createGame(world); s.state.room = "kitchen";
  s.send("eat meat");
  let sdead = false;
  for (let i = 0; i < 25 && !sdead; i++) { s.send("wait"); sdead = s.state.dead; }
  assert.ok(sdead, "untreated sickness eventually kills you");
  // ...but the privy toilet cures it.
  const s2 = createGame(world); s2.state.room = "kitchen";
  s2.send("eat meat"); s2.state.room = "privy";
  assert.match(s2.send("use toilet"), /CURED/, "the toilet cures the sickness");
  assert.equal(s2.getFlag("sick"), 0, "sick flag cleared after the toilet");

  // Win-while-on-fire: 🔥 on the banner + the badge.
  const w = createGame(world);
  w.setFlag("onFire", true);
  const winText = w.win("You step into the dawn.");
  assert.match(winText, /alive 🔥/, "escape banner gets the fire emoji when ablaze");
  assert.match(winText, /Frying Pan/, "winning on fire earns the badge");
  console.log("OK: burn-up timer, brazier, foods, toilet, badges");
}

console.log("\nALL WALKTHROUGH TESTS PASSED");
