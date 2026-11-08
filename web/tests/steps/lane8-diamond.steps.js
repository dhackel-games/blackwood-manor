// lane8-diamond.steps.js. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.001:acoven.

import assert from "node:assert";
import { Given, Then } from "@cucumber/cucumber";

Given("the visible dial is {string}", function (kind) {
  if (kind === "microwave") {
    this.game.state.room = "kitchen";
    return;
  }
  if (kind === "safe") {
    this.game.state.room = "parlor";
    this.game.send("move painting");
    return;
  }
  if (kind === "none") {
    this.game.state.room = "grandHall";
    return;
  }
  throw new Error(`Unknown dial kind "${kind}"`);
});

Then("the visible dial setting is {string}", function (setting) {
  assert.equal(this.game.item("microwaveDial").setting, setting);
});

Then("the microwave coal outcome is {string}", function (outcome) {
  const coalLocation = this.game.roomOf("coalLump");
  if (outcome === "unchanged") {
    assert.equal(coalLocation, "microwave");
    assert.equal(this.game.item("microwave").open, false);
    return;
  }
  assert.equal(coalLocation, null);
  if (outcome === "consumed") {
    assert.equal(this.game.roomOf("blackwoodDiamond"), null);
    assert.equal(this.game.item("microwave").open, true);
    return;
  }
  if (outcome === "diamond") {
    assert.equal(this.game.roomOf("blackwoodDiamond"), "microwave");
    assert.equal(this.game.getFlag("manor:diamondMade"), true);
    assert.equal(this.game.getFlag("progressAward:diamondMade"), true);
    return;
  }
  throw new Error(`Unknown microwave outcome "${outcome}"`);
});

Then("the Blackwood Diamond is a treasure heirloom worth {int}", function (points) {
  const diamond = this.game.world.items.blackwoodDiamond;
  assert.equal(diamond.treasure, true);
  assert.equal(diamond.points, points);
});

Then("the Diamond award was granted only once", function () {
  assert.equal(this.game.getFlag("progressAward:diamondMade"), true);
  assert.equal(this.game.state.score, 15);
});

Then("the DIAL call state is {string}", function (value) {
  assert.equal(!!this.game.getFlag("onCall"), value === "true");
});

// end lane8-diamond.steps.js
