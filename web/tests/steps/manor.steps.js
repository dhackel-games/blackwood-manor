// manor.steps.js Copyright (c) 2026:dhackel-games. All Rights Reserved. Do Not Distribute.
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { After, Given, Then, When } from "@cucumber/cucumber";
import { createGame } from "../../js/core.js";
import { MAP_MARK } from "../../js/map.js";
import { CHEAT_PROMPTS, cheatMenu, cheatPrompt } from "../../js/cheat-prompts.js";
import { REQUIRED_FAMILY_ITEM_COUNT, world } from "../../js/world.js";

const realMathRandom = Math.random;

After(function () {
  Math.random = realMathRandom;
});

function commandsFrom(docString) {
  return docString.split("\n").map((line) => line.trim()).filter(Boolean);
}

function playSequence(context, docString, allowDeath) {
  context.log = [];
  for (const command of commandsFrom(docString)) {
    context.output = context.game.send(command);
    context.log.push(`> ${command}\n${context.output}`);
    if (context.game.state.dead) {
      if (allowDeath) break;
      throw new Error(`Unexpected death at "${command}":\n${context.output}`);
    }
  }
}

Given("a fresh manor game", function () {
  this.game = createGame(world);
  this.output = "";
  this.accumulatedOutput = "";
  // Lightning Jumps are a random per-turn hazard; scripted scenarios need
  // deterministic turns, so chaos is off unless a scenario explicitly re-enables it.
  this.game.setFlag("__noChaos", true);
});

Given("chaos events \\(lightning jumps) are enabled", function () {
  this.game.setFlag("__noChaos", false);
});

Given("the random number generator always returns {float}", function (value) {
  Math.random = () => value;
});

Given("the random number generator returns {float} then {float}", function (first, second) {
  const seq = [first, second];
  let i = 0;
  Math.random = () => (i < seq.length ? seq[i++] : seq[seq.length - 1]);
});

Given("the mystery package teleport selects room {string}", function (room) {
  const destinations = Object.keys(this.game.world.rooms).filter((id) => id !== this.game.state.room);
  const index = destinations.indexOf(room);
  assert.notEqual(index, -1, `Unknown teleport destination: ${room}`);
  const seq = [0.3, (index + 0.5) / destinations.length];
  let i = 0;
  Math.random = () => (i < seq.length ? seq[i++] : seq[seq.length - 1]);
});

Given("the lightning bolt teleport would select room {string}", function (room) {
  const destinations = Object.keys(this.game.world.rooms).filter((id) => id !== this.game.state.room);
  const index = destinations.indexOf(room);
  assert.notEqual(index, -1, `Unknown teleport destination: ${room}`);
  // 0.0 makes the bolt spawn (below LIGHTNING_CHANCE); the second value aims the
  // teleport at `room`'s slot in the FULL room list. If the bolt honours its
  // no-jump list, `room` is filtered out and you land somewhere else entirely.
  const seq = [0.0, (index + 0.5) / destinations.length];
  let i = 0;
  Math.random = () => (i < seq.length ? seq[i++] : seq[seq.length - 1]);
});

Given("the player is in room {string}", function (room) {
  this.game.state.room = room;
});

Given("the player is on fire", function () {
  this.game.setFlag("onFire", true);
});

Given("item {string} is carried", function (item) {
  this.game.moveItem(item, "inventory");
});

// Secret-ending setup: pre-fill the reliquary with every heirloom AND bonus
// treasure, leaving exactly one named piece in the player's hands to deposit.
Given("every treasure but the {string} is already in the reliquary", function (itemId) {
  for (const [id, def] of Object.entries(world.items)) {
    if ((def.treasure || def.bonusTreasure) && id !== itemId) {
      this.game.moveItem(id, "reliquary");
    }
  }
  this.game.moveItem(itemId, "inventory");
});

Given("item {string} uses wear slot {string}", function (item, slot) {
  this.game.item(item).wearSlot = slot;
});

Given("flag {string} is set", function (flag) {
  this.game.setFlag(flag);
});

Given("flag {string} is {int}", function (flag, value) {
  this.game.setFlag(flag, value);
});

When("I play this command sequence:", function (docString) {
  playSequence(this, docString, false);
});

When("I execute hidden cheat {string}", function (command) {
  const shortcut = cheatPrompt(command);
  assert.ok(shortcut, `Unknown hidden cheat: ${command}`);
  this.output = this.game.send(shortcut.compoundPrompt);
});

When("I play until death:", function (docString) {
  playSequence(this, docString, true);
});

When("the player moves directly to room {string}", function (room) {
  this.game.state.room = room;
});

When("I wait at most {int} turns until death", function (limit) {
  for (let i = 0; i < limit && !this.game.state.dead; i++) {
    this.output = this.game.send("wait");
  }
});

When("I wait {int} turns", function (turns) {
  for (let i = 0; i < turns; i++) {
    this.output = this.game.send("wait");
    assert.equal(this.game.state.dead, false, `Player died on wait ${i + 1}`);
  }
});

When("I wait through the full burrito course", function () {
  this.accumulatedOutput = "";
  for (let i = 0; i < 40 && !this.game.state.dead; i++) {
    this.accumulatedOutput += "\n" + this.game.send("wait");
  }
});

When("I win with {string}", function (message) {
  this.output = this.game.win(message);
});

When("I add {int} points", function (points) {
  this.game.addScore(points);
});

When("I ask Gary for {int} hints", function (count) {
  this.accumulatedOutput = "";
  for (let i = 0; i < count; i++) {
    this.accumulatedOutput += "\n" + this.game.send("hint");
  }
  this.output = this.accumulatedOutput;
});

When("I call Gary and say {string}", function (line) {
  this.game.send("call");
  this.billBefore = this.game.getFlag("phoneBill") || 0;
  this.playerLine = line;
  this.output = this.game.send(line);
});

Then("the game is won", function () {
  const context = Array.isArray(this.log) ? this.log.slice(-6).join("\n\n") : (this.output || "");
  assert.equal(this.game.state.won, true, context);
});

Then("the game is not won", function () {
  assert.equal(this.game.state.won, false);
});

Then("the game score is {int}", function (score) {
  assert.equal(this.game.state.score, score);
});

Then("the player rank contains {string}", function (rank) {
  assert.match(this.game.rank(), new RegExp(rank, "i"));
});

Then("item {string} is destroyed", function (item) {
  assert.equal(this.game.roomOf(item), null);
});

Then("item {string} is open", function (item) {
  assert.equal(this.game.item(item).open, true);
});

Then("item {string} is worn in slot {string}", function (item, slot) {
  const worn = this.game.item(item);
  assert.equal(worn.worn, true);
  assert.equal(worn.wearSlot, slot);
  assert.equal(this.game.equipped(slot)?.id, item);
});

Then("item {string} is not worn", function (item) {
  assert.notEqual(this.game.item(item).worn, true);
});

Then("item {string} is unlit", function (item) {
  assert.equal(this.game.item(item).lit, false);
});

Then("the inventory load is {int}", function (load) {
  assert.equal(this.game.inventoryLoad(), load);
});

Then("the inventory capacity is {int}", function (capacity) {
  assert.equal(this.game.inventoryCapacity(), capacity);
});

Then("the hidden cheat menu command is {string}", function (command) {
  assert.equal(command, ":?");
  assert.match(cheatMenu(), /== HIDDEN COMMANDS ==/);
});

Then("the hidden cheat catalog defines {string}", function (commands) {
  assert.deepEqual(CHEAT_PROMPTS.map((entry) => entry.cmd), commands.split(","));
  for (const entry of CHEAT_PROMPTS) {
    assert.equal(typeof entry.name, "string");
    assert.equal(typeof entry.description, "string");
    assert.equal(typeof entry.compoundPrompt, "string");
    assert.ok(entry.compoundPrompt.includes(";"), `${entry.cmd} must prepare a compound prompt`);
  }
});

Then("hidden shortcuts replace the editable command prompt without executing", function () {
  const ui = readFileSync(new URL("../../js/ui.js", import.meta.url), "utf8");
  assert.match(ui, /if \(command === ":\?"\)/);
  assert.match(ui, /input\.value = shortcut\.compoundPrompt/);
  assert.match(ui, /input\.setSelectionRange\(input\.value\.length, input\.value\.length\)/);
  assert.equal(cheatPrompt("::"), null);
});

Then("public HELP does not reveal hidden cheat commands", function () {
  const help = this.game.send("help");
  for (const entry of CHEAT_PROMPTS) assert.ok(!help.includes(entry.cmd));
  assert.ok(!help.includes(":?"));
});

Then("every portable item is in the inventory", function () {
  for (const [id, definition] of Object.entries(world.items)) {
    if (definition.takeable) assert.equal(this.game.roomOf(id), "inventory", id);
  }
});

Then("every required family item is in the reliquary", function () {
  for (const [id, definition] of Object.entries(world.items)) {
    if (definition.treasure) assert.equal(this.game.roomOf(id), "reliquary", id);
  }
});

Then("the game score equals the computed maximum", function () {
  assert.equal(this.game.state.score, world.maximumScore(this.game));
});

Then("the required family item count is {int}", function (count) {
  assert.equal(REQUIRED_FAMILY_ITEM_COUNT, count);
  assert.equal(this.game.world.config.requiredFamilyItemCount, count);
  assert.equal(Object.values(this.game.world.items).filter((item) => item.treasure).length, count);
});

Then("flag {string} is false", function (flag) {
  assert.equal(this.game.getFlag(flag), false);
});

Then("flag {string} is unset", function (flag) {
  assert.equal(this.game.getFlag(flag), undefined);
});

Then("flag {string} equals {int}", function (flag, expected) {
  assert.equal(this.game.getFlag(flag), expected);
});

Then("flag {string} is positive", function (flag) {
  assert.ok((this.game.getFlag(flag) || 0) > 0);
});

Then("the output equals {string}", function (text) {
  assert.equal(this.output, text);
});

Then("the output does not match {string}", function (pattern) {
  assert.doesNotMatch(this.output, new RegExp(pattern, "i"));
});

Then("the letter has no hard line breaks", function () {
  assert.doesNotMatch(this.game.item("letter").text, /[\r\n]/);
});

Then("every manor room has searchable detail and narrow ASCII art", function () {
  for (const [id, room] of Object.entries(world.rooms)) {
    assert.ok(typeof room.searchDesc === "string" || typeof room.searchDesc === "function",
      `${id} must define closer-inspection detail`);
    assert.equal(typeof room.art, "string", `${id} must define ASCII room art`);
    assert.ok(room.art.trim().length > 0, `${id} room art must not be empty`);
    assert.ok(Math.max(...room.art.split("\n").map((line) => line.length)) <= 32,
      `${id} room art must fit the narrow transcript`);
  }
});

Then("every manor room declares implicit IN and OUT routing", function () {
  assert.deepEqual(
    Object.keys(world.implicitNavigation).sort(),
    Object.keys(world.rooms).sort(),
  );
  for (const [id, route] of Object.entries(world.implicitNavigation)) {
    assert.ok(Object.hasOwn(route, "in"), `${id} must declare IN routing`);
    assert.ok(Object.hasOwn(route, "out"), `${id} must declare OUT routing`);
  }
});

Then("these room descriptions contain uppercase interactables:", function (table) {
  for (const row of table.hashes()) {
    const description = world.rooms[row.room].desc;
    for (const label of row.labels.split(",")) {
      assert.ok(description.includes(label), `${row.room} must emphasize ${label}`);
    }
  }
});

Then("these Gary lines are mechanical:", function (table) {
  for (const [line] of table.raw()) {
    assert.equal(world.garyTurnInfo(this.game, line).llmOk, false, line);
  }
});

Then("these Gary lines are conversational:", function (table) {
  for (const [line] of table.raw()) {
    const info = world.garyTurnInfo(this.game, line);
    assert.equal(info.llmOk, true, line);
    assert.equal(typeof info.playerLine, "string");
    assert.ok(info.situation && typeof info.situation.bill === "string");
  }
});

Then("Gary turn {string} has a meter tail", function (line) {
  assert.match(world.garyTurnInfo(this.game, line).tail, /Meter's at \$/);
});

Then("Gary turn {string} is mechanical", function (line) {
  assert.equal(world.garyTurnInfo(this.game, line).llmOk, false);
});

Then("Gary did not add a charge", function () {
  assert.equal(this.game.getFlag("phoneBill") || 0, this.billBefore);
});

Then("the crisis line never reaches Gary's model", function () {
  assert.equal(world.garyTurnInfo(this.game, this.playerLine).llmOk, false);
});

Then("Gary's phone ranks are:", function (table) {
  for (const row of table.hashes()) {
    assert.match(world.phoneRank(Number(row.cents)), new RegExp(row.rank, "i"));
  }
});

Then("the accumulated output contains {string} {int} times", function (text, count) {
  const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  assert.equal((this.accumulatedOutput.match(new RegExp(escaped, "gi")) || []).length, count);
});

Then("Dreadmaw's rebuke burns the player or launches them to the front gate", function () {
  const burned = this.game.getFlag("onFire") === true && this.game.state.room === "dragonCaveMouth";
  const launched = this.game.state.room === "gate"
    && (this.game.getFlag("dragonInjuries") || 0) > 0
    && /crash|crater/i.test(this.output);
  assert.ok(burned || launched, this.output);
});

Then("the troll riddle uses real line breaks", function () {
  assert.doesNotMatch(this.output, /\\n/);
  assert.ok(this.output.split("\n").includes("Old crowns, old bones, and something more."));
  assert.ok(this.output.split("\n").includes("What fills a dragon's hidden store?"));
});

Then("digestive status has {int} turns and phase {string}", function (remaining, phase) {
  const status = world.digestiveStatus(this.game);
  assert.ok(status, "digestive status must be active");
  assert.equal(status.remaining, remaining);
  assert.equal(status.name, phase);
});

Then("fire status has {int} turns", function (remaining) {
  const status = world.fireStatus(this.game);
  assert.ok(status, "fire status must be active");
  assert.equal(status.remaining, remaining);
});

Then("headlamp status has {int} turn(s)", function (remaining) {
  const status = world.headlampStatus(this.game);
  assert.ok(status, "headlamp status must be active");
  assert.equal(status.remaining, remaining);
});

Then("light status is permanent", function () {
  assert.deepEqual(world.lightStatus(this.game), { permanent: true });
});

Then("light status has {int} turn(s)", function (remaining) {
  assert.deepEqual(world.lightStatus(this.game), { remaining });
});

Then("light status is inactive", function () {
  assert.equal(world.lightStatus(this.game), null);
});

Then("vision status has {int} turn(s)", function (remaining) {
  assert.deepEqual(world.visionStatus(this.game), { permanent: false, remaining });
});

Then("flight status has {int} turn(s)", function (remaining) {
  assert.deepEqual(world.flightStatus(this.game), { permanent: false, remaining });
});

Then("vision status is permanent", function () {
  assert.deepEqual(world.visionStatus(this.game), { permanent: true });
});

Then("flight status is permanent", function () {
  assert.deepEqual(world.flightStatus(this.game), { permanent: true });
});

Then("the inline bowel status matches the current digestive state", function () {
  const status = world.digestiveStatus(this.game);
  assert.ok(status, "digestive status must be active");
  assert.match(this.output, new RegExp(`${status.percent}%`));
  assert.match(this.output, new RegExp(`~${status.remaining} turns to blast`));
});

Then("every sickness event drawing is marked as non-wrapping output", function () {
  const artBlocks = this.accumulatedOutput.split(MAP_MARK).filter((_, index) => index % 2 === 1);
  for (const marker of ["B U R P", "B L E A R G H", "F O O M P", "S P L U R T"]) {
    assert.ok(artBlocks.some((block) => block.includes(marker)), `${marker} must be in an art block`);
  }
});

Then("the map sprocket holes are column-aligned", function () {
  const map = this.output.split(MAP_MARK)[1];
  assert.ok(map, "Expected MAP output");
  const rows = map.split("\n");
  const sprocketRows = rows.filter((row) => row.startsWith("  o  "));
  assert.ok(sprocketRows.length > 2, "Expected multiple sprocket-hole rows");
  assert.deepEqual([...new Set(rows.map((row) => row.length))], [rows[0].length]);
  assert.deepEqual([...new Set(sprocketRows.map((row) => row.indexOf("o")))], [2]);
  assert.deepEqual([...new Set(sprocketRows.map((row) => row.lastIndexOf("o")))],
    [sprocketRows[0].lastIndexOf("o")]);
});

Then("the output contains regex {string} exactly {int} time", function (pattern, count) {
  assert.equal((this.output.match(new RegExp(pattern, "g")) || []).length, count);
});

Then("the output contains none of:", function (table) {
  for (const [text] of table.raw()) assert.ok(!this.output.includes(text), text);
});

// end manor.steps.js
