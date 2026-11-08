// lane8-photograph.steps.js. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.001:acoven.

import assert from "node:assert";
import { Given, Then } from "@cucumber/cucumber";

Given("all loose photograph pieces are carried", function () {
  for (const id of ["letter", "photoPieceB", "photoPieceC", "photoPieceD"]) {
    this.game.moveItem(id, "inventory");
  }
});

Then("the Baroness Photograph is a pending heirloom worth {int}", function (points) {
  const photograph = this.game.world.items.baronessPhotograph;
  assert.equal(photograph.pendingHeirloom, true);
  assert.equal(photograph.treasure, undefined);
  assert.equal(photograph.points, points);
});

// end lane8-photograph.steps.js
