// lane7.steps.js. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.001:acoven.

import assert from "node:assert";
import { Given, Then } from "@cucumber/cucumber";

Given("the campfire method {string} is ready", function (method) {
  if (method === "wine") {
    this.game.moveItem("wineBottle", "inventory");
    this.game.item("wineBottle").open = true;
    return;
  }
  if (method === "milk") {
    this.game.moveItem("milk", "inventory");
    return;
  }
  if (method === "water") {
    this.game.moveItem("milkJug", "inventory");
    this.game.item("milkJug").filled = true;
    return;
  }
  assert.equal(method, "body", `Unknown campfire method: ${method}`);
});

Given("the aligned lower lift is at {string}", function (room) {
  const beats = { greatOak: 0, treeFort: 1, below: 3 };
  assert.ok(Object.hasOwn(beats, room), `Unknown lower lift stop: ${room}`);
  this.game.setFlag("oak:lowerPanelAligned");
  this.game.setFlag("oak:liftBeat", beats[room]);
  this.game.moveItem("oakPlatform", room);
  this.game.setFlag("oakLiftGrace", false);
});

Then("the milk jug is full", function () {
  assert.equal(this.game.item("milkJug").filled, true);
});

Then("the milk jug is empty", function () {
  assert.equal(this.game.item("milkJug").filled, false);
});

Then("lower panel slots are {string}, {string}, {string}", function (top, middle, bottom) {
  assert.deepEqual(this.game.getFlag("oak:lowerPanelSlots"), {
    top: top === "EMPTY" ? null : top,
    middle: middle === "EMPTY" ? null : middle,
    bottom: bottom === "EMPTY" ? null : bottom,
  });
});

// end lane7.steps.js
