// lane9.steps.js. Copyright (c) 2026:dhackel-games. All Rights Reserved. Do Not Distribute.

import assert from "node:assert";
import { Given, Then, When } from "@cucumber/cucumber";
import { createGame } from "../../js/core.js";
import { HIGH_REACTIONS, SHARED_HIGH_CAPABILITY_TEXT, world } from "../../js/world.js";

function fixtureWorld() {
  return {
    ...world,
    items: {
      ...world.items,
      testSnuff: {
        names: ["test snuff", "snuff"],
        adjectives: ["test"],
        loc: "inventory",
        takeable: true,
        highSource: {
          opening: "The test SNUFFBOX makes the room wobble.",
          turns: 6,
          doses: 3,
          whenEmpty: "keep",
          actions: ["smell", "use"],
          emptyMessage: "The test SNUFFBOX is empty.",
        },
      },
      testWine: {
        names: ["test wine", "wine"],
        adjectives: ["test"],
        loc: "inventory",
        takeable: true,
        highSource: {
          opening: "The test WINE makes the room wobble.",
          turns: 10,
          doses: 4,
          whenEmpty: "destroy",
          actions: ["drink"],
        },
      },
      cycleTonic: {
        names: ["cycle tonic", "tonic"],
        adjectives: ["cycle"],
        loc: "inventory",
        takeable: true,
        highSource: {
          opening: "The cycle tonic makes the room wobble.",
          turns: 1,
          doses: 13,
          whenEmpty: "keep",
          actions: ["drink"],
        },
      },
    },
  };
}

function recordReaction(context) {
  const reaction = HIGH_REACTIONS.find((line) => context.output.includes(line));
  assert.ok(reaction, `Expected a shared high reaction in:\n${context.output}`);
  context.highReactions.push(reaction);
}

Given("a fresh shared-high fixture game", function () {
  this.game = createGame(fixtureWorld());
  this.game.send("Jeb");
  this.game.setFlag("__noChaos", true);
  this.highReactions = [];
});

When("I take {int} cycle doses", function (count) {
  for (let index = 0; index < count; index += 1) {
    this.output = this.game.send("drink cycle tonic");
    recordReaction(this);
  }
});

When("I save and restore the shared-high fixture game", function () {
  const restored = createGame(fixtureWorld());
  restored.restore(this.game.snapshot());
  this.game = restored;
});

Then("the shared-high reaction history has {int} distinct entries", function (count) {
  assert.equal(this.highReactions.length, count);
  assert.equal(new Set(this.highReactions).size, count);
});

Then("the shared-high reaction history repeats its first entry after a full cycle", function () {
  assert.equal(this.highReactions.at(-1), this.highReactions[0]);
});

Then("fixture source {string} has {int} doses remaining", function (item, doses) {
  assert.equal(this.game.item(item).highSource.doses, doses);
});

Then("all shared-high text is source-neutral", function () {
  for (const text of [
    ...HIGH_REACTIONS,
    ...world.flavorPools.mushroomRevelations,
    SHARED_HIGH_CAPABILITY_TEXT,
  ]) {
    assert.doesNotMatch(text, /mushroom/i);
  }
});

// end lane9.steps.js
