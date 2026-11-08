// lane5.steps.js. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.001:acoven.
import assert from "node:assert";
import { Given, Then } from "@cucumber/cucumber";

Given("the stellar map is {word}", function (state) {
  assert.ok(["carried", "unread"].includes(state), `Unknown stellar-map state: ${state}`);
  if (state === "carried") this.game.moveItem("stellarMap", "inventory");
  else assert.equal(this.game.roomOf("stellarMap"), "mapRoom");
});

Then("the planetarium result is {word}", function (result) {
  if (result === "safe") {
    assert.equal(this.game.state.room, "planetarium");
    assert.equal(this.game.getFlag("onFire"), undefined);
    return;
  }
  assert.equal(this.game.state.room, "gate");
  if (result === "bunghole") {
    assert.equal(this.game.getFlag("onFire"), undefined);
    return;
  }
  assert.equal(result, "sirius");
  assert.equal(this.game.getFlag("onFire"), true);
  assert.equal(this.game.getFlag("burnTurns"), 0);
  assert.equal(this.game.world.fireStatus(this.game).remaining, 6);
});

Then("the Planetarium heirlooms remain pending and non-treasures", function () {
  for (const id of ["stellarMap", "goldEyepiece"]) {
    const item = this.game.world.items[id];
    assert.equal(item.pendingHeirloom, true, `${id} must remain pending`);
    assert.notEqual(item.treasure, true, `${id} must not yet be a treasure`);
    assert.equal(item.points, undefined, `${id} must not have a deposit value yet`);
  }
});

// end lane5.steps.js
