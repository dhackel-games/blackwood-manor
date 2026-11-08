// lane4.steps.js. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.001:acoven.

import assert from "node:assert";
import { Given, Then, When } from "@cucumber/cucumber";
import { createGame } from "../../js/core.js";
import { RADIO_SONGS } from "../../js/upsidedown/radio-clues.js";
import { world } from "../../js/world.js";

function lcg(seed) {
  return (Math.imul(1664525, seed) + 1013904223) >>> 0;
}

function canonicalFirstRound(seed) {
  let state = seed >>> 0;
  const draw = (candidates) => {
    state = lcg(state);
    return candidates[state % candidates.length];
  };
  const songIndex = draw(RADIO_SONGS.map((_, index) => index));
  state = lcg(state);
  const clueIndex = state % 5;
  const distractors = RADIO_SONGS.map((_, index) => index).filter((index) => index !== songIndex);
  const optionIndices = [];
  for (let count = 0; count < 4; count++) {
    state = lcg(state);
    optionIndices.push(distractors.splice(state % distractors.length, 1)[0]);
  }
  optionIndices.push(songIndex);
  for (let index = optionIndices.length - 1; index > 0; index--) {
    state = lcg(state);
    const other = state % (index + 1);
    [optionIndices[index], optionIndices[other]] = [optionIndices[other], optionIndices[index]];
  }
  return {
    songIndex,
    clueIndex,
    optionIndices,
    correctOption: optionIndices.indexOf(songIndex) + 1,
  };
}

function round(context) {
  return context.game.getFlag("realm:radioRound");
}

function answerCorrectly(context, byTitle = false) {
  const active = round(context);
  if (byTitle) {
    const title = RADIO_SONGS[active.optionIndices[active.correctOption - 1]].title;
    context.output = context.game.send(`say "${title}"`);
  } else {
    context.output = context.game.send(`answer ${active.correctOption}`);
  }
}

Given("a fresh radio quiz game seeded with {int}", function (seed) {
  this.game = createGame(world);
  this.game.send("Jeb");
  this.game.setFlag("__noChaos", true);
  this.game.state.room = "avClubDen";
  this.game.setFlag("realm:radioSeed", seed >>> 0);
  this.output = "";
  this.firstTransistorUse = "";
  this.secondTransistorUse = "";
});

Given("the active radio title is {string}", function (title) {
  const songIndex = RADIO_SONGS.findIndex((song) => song.title === title);
  assert.notEqual(songIndex, -1, `Unknown radio title: ${title}`);
  const optionIndices = [songIndex, ...RADIO_SONGS
    .map((_, index) => index)
    .filter((index) => index !== songIndex)
    .slice(0, 4)];
  this.game.setFlag("realm:radioRound", {
    songIndex,
    clueIndex: 0,
    optionIndices,
    correctOption: 1,
  });
  this.game.setFlag("realm:radioStreak", 0);
});

When("I start the cabinet radio", function () {
  this.output = this.game.send("turn on radio");
});

Then("the radio catalog has twenty songs with five clues each", function () {
  assert.equal(RADIO_SONGS.length, 20);
  assert.ok(RADIO_SONGS.every((song) =>
    typeof song.title === "string"
      && song.clues.length === 5
      && song.clues.every((clue) => typeof clue === "string" && clue.length > 0)));
});

Then("the active radio round matches the canonical LCG draw for seed {int}", function (seed) {
  assert.deepEqual(round(this), canonicalFirstRound(seed));
});

Then("the active radio round lists its answer exactly once", function () {
  const active = round(this);
  assert.equal(active.optionIndices.filter((index) => index === active.songIndex).length, 1);
  assert.equal(new Set(active.optionIndices).size, 5);
  assert.equal(active.optionIndices[active.correctOption - 1], active.songIndex);
});

When("I answer the active radio title", function () {
  answerCorrectly(this, true);
});

When("I answer the active radio option correctly by number", function () {
  answerCorrectly(this);
});

When("I answer the active radio option incorrectly", function () {
  const active = round(this);
  const wrong = active.correctOption === 1 ? 2 : 1;
  this.output = this.game.send(`answer ${wrong}`);
});

Then("the radio streak is {int}", function (streak) {
  assert.equal(this.game.getFlag("realm:radioStreak"), streak);
});

Then("the cabinet radio is open", function () {
  assert.equal(this.game.item("cabinetRadio").open, true);
});

Then("the portable transistor radio is revealed", function () {
  assert.equal(this.game.roomOf("portableTransistorRadio"), "cabinetRadio");
  assert.ok(this.game.visibleItems().some((item) => item.id === "portableTransistorRadio"));
});

Then("the radio quiz score is {int}", function (score) {
  assert.equal(this.game.state.score, score);
});

When("I replay the opened cabinet radio", function () {
  this.output = this.game.send("turn on radio");
});

When("I take and use the portable transistor radio twice", function () {
  this.output = this.game.send("take transistor");
  this.firstTransistorUse = this.game.send("use transistor");
  this.secondTransistorUse = this.game.send("listen to transistor");
});

Then("the portable transistor radio earns pickup without a keepsake-use award", function () {
  assert.match(this.output, /Taken\. \(\+5\)/);
  assert.doesNotMatch(this.firstTransistorUse, /\(\+5\)/);
  assert.doesNotMatch(this.secondTransistorUse, /\(\+5\)/);
  assert.equal(this.game.getFlag("progressItem:portableTransistorRadio"), true);
  assert.equal(this.game.getFlag("useItem:portableTransistorRadio"), undefined);
});

When("I save the current radio state", function () {
  this.currentRadioState = {
    round: this.game.getFlag("realm:radioRound"),
    streak: this.game.getFlag("realm:radioStreak"),
    seed: this.game.getFlag("realm:radioSeed"),
  };
});

Then("the current radio state is unchanged", function () {
  assert.deepEqual(this.game.getFlag("realm:radioRound"), this.currentRadioState.round);
  assert.equal(this.game.getFlag("realm:radioStreak"), this.currentRadioState.streak);
  assert.equal(this.game.getFlag("realm:radioSeed"), this.currentRadioState.seed);
});

When("I save the active radio round", function () {
  this.radioSnapshot = this.game.snapshot();
  this.savedRadioRound = this.game.getFlag("realm:radioRound");
  this.savedRadioStreak = this.game.getFlag("realm:radioStreak");
  this.savedRadioSeed = this.game.getFlag("realm:radioSeed");
});

When("I restore the active radio round", function () {
  this.game.restore(this.radioSnapshot);
});

Then("the saved radio round and streak are preserved", function () {
  assert.deepEqual(this.game.getFlag("realm:radioRound"), this.savedRadioRound);
  assert.equal(this.game.getFlag("realm:radioStreak"), this.savedRadioStreak);
  assert.equal(this.game.getFlag("realm:radioSeed"), this.savedRadioSeed);
});

// end lane4.steps.js
