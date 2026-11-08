// lane3.steps.js. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.001:acoven.

import assert from "node:assert";
import { Given, Then } from "@cucumber/cucumber";

Given("a pre-fridge save with milk {string} is restored", function (location) {
  const snapshot = this.game.snapshot();
  for (const id of ["fridge", "milkJug", "limburgerCheese", "epoissesCheese", "munsterCheese"]) {
    delete snapshot.state.items[id];
  }
  snapshot.state.items.milk.loc = location === "destroyed" ? null : location;
  this.game.restore(snapshot);
});

Given("the milk jug is filled", function () {
  this.game.item("milkJug").filled = true;
});

Then("item {string} is gone", function (id) {
  assert.equal(this.game.roomOf(id), null);
});

Then("item {string} is pending heirloom worth {int} and not treasure", function (id, points) {
  const item = this.game.world.items[id];
  assert.equal(item.pendingHeirloom, true);
  assert.equal(item.treasure, undefined);
  assert.equal(item.points, points);
});

// end lane3.steps.js
