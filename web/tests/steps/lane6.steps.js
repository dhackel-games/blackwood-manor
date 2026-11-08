// lane6.steps.js. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.001:acoven.
import assert from "node:assert";
import { Then } from "@cucumber/cucumber";

Then("item {string} is in room {string}", function (item, room) {
  assert.equal(this.game.roomOf(item), room);
});

Then("item {string} is a treasure heirloom", function (item) {
  const definition = this.game.world.items[item];
  assert.ok(definition, `Missing item "${item}"`);
  assert.equal(definition.treasure, true);
});

// end lane6.steps.js
