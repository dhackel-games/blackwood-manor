// lane11.steps.js. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.001:acoven.

import assert from "node:assert";
import { Given, Then } from "@cucumber/cucumber";
import { REQUIRED_FAMILY_ITEM_COUNT, world } from "../../js/world.js";

Given("all required heirlooms are ready for one all-in deposit", function () {
  for (const [id, item] of Object.entries(world.items)) {
    if (item.treasure) this.game.moveItem(id, "inventory");
  }
  this.game.moveItem("backpack", "inventory");
  this.game.item("backpack").worn = true;
  this.game.item("reliquary").open = true;
  this.game.state.room = "grandHall";
});

Then("the backpack provides {int} slots for the bulk deposit", function (capacity) {
  assert.equal(this.game.item("backpack").carryCapacity, capacity);
  assert.equal(this.game.inventoryCapacity(), capacity);
  assert.equal(this.game.inventoryLoad(), REQUIRED_FAMILY_ITEM_COUNT);
});

Then("the score is recorded before a repeated all-in deposit", function () {
  this.oneTripRepeatScore = this.game.state.score;
});

Then("the repeated all-in deposit does not change the score", function () {
  assert.equal(this.game.state.score, this.oneTripRepeatScore);
});

// end lane11.steps.js
