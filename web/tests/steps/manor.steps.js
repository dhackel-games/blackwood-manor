// manor.steps.js Copyright (c) 2026:dhackel-games. All Rights Reserved. Do Not Distribute.
import assert from "node:assert";
import { Given, Then, When } from "@cucumber/cucumber";
import { createGame } from "../../js/core.js";
import { MAP_MARK } from "../../js/map.js";
import { world } from "../../js/world.js";

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

Given("flag {string} is set", function (flag) {
  this.game.setFlag(flag);
});

When("I play this command sequence:", function (docString) {
  playSequence(this, docString, false);
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
  assert.equal(this.game.state.won, true, this.log ? this.log.slice(-6).join("\n\n") : "");
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

Then("every sickness event drawing is marked as non-wrapping output", function () {
  const artBlocks = this.accumulatedOutput.split(MAP_MARK).filter((_, index) => index % 2 === 1);
  for (const marker of ["B U R P", "B L E A R G H", "F O O M P", "S P L U R T"]) {
    assert.ok(artBlocks.some((block) => block.includes(marker)), `${marker} must be in an art block`);
  }
});

Then("the output contains regex {string} exactly {int} time", function (pattern, count) {
  assert.equal((this.output.match(new RegExp(pattern, "g")) || []).length, count);
});

Then("the output contains none of:", function (table) {
  for (const [text] of table.raw()) assert.ok(!this.output.includes(text), text);
});

// end manor.steps.js
