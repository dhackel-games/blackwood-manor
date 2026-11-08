// lane8-snuffbox.steps.js. Copyright (c) 2026:dhackel-games. All Rights Reserved. Do Not Distribute.

import assert from "node:assert";
import { Then } from "@cucumber/cucumber";
import { HUD_SLOT_DEFINITIONS } from "../../js/hud.js";

Then("the snuffbox is carried as a pending heirloom", function () {
  const snuffbox = this.game.item("snuffbox");
  assert.equal(snuffbox.loc, "inventory");
  assert.equal(snuffbox.pendingHeirloom, true);
});

Then("the snuffbox has {int} pinches remaining", function (pinches) {
  assert.equal(this.game.item("snuffbox").highSource.doses, pinches);
});

Then("the shared-high HUD remains a mushroom", function () {
  const high = HUD_SLOT_DEFINITIONS.find((slot) => slot.id === "high");
  assert.equal(high?.emoji, "🍄");
  assert.ok((this.game.getFlag("high") || 0) > 0);
});

// end lane8-snuffbox.steps.js
