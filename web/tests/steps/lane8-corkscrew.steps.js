// lane8-corkscrew.steps.js. Copyright (c) 2026:dhackel-games. All Rights Reserved. Do Not Distribute.

import assert from "node:assert";
import { Given, Then } from "@cucumber/cucumber";
import { world } from "../../js/world.js";

function isWineBottle(item) {
  return item?.id === "wineBottle" || item?.templateId === "wineBottle";
}

Given("the wine cellar is lit", function () {
  this.game.moveItem("candlestick", "inventory");
  this.game.item("candlestick").lit = true;
});

Given("the derived maximum score is recorded", function () {
  this.wineMaximumScore = world.maximumScore(this.game);
});

Then("wine bottle {string} is offered on the cellar rack", function (id) {
  const bottles = this.game.itemsIn("wineCellar").filter(isWineBottle);
  assert.equal(bottles.length, 1, `Expected one offered bottle, found ${bottles.map((item) => item.id).join(", ")}`);
  assert.equal(bottles[0].id, id);
});

Then("wine bottle {string} has {int} consumed sip", function (id, sips) {
  const consumed = this.game.getFlag("manor:wineSips") || {};
  assert.equal(Number(consumed[id]) || 0, sips);
});

Then("wine bottle {string} has {int} consumed sips", function (id, sips) {
  const consumed = this.game.getFlag("manor:wineSips") || {};
  assert.equal(Number(consumed[id]) || 0, sips);
});

Then("wine bottle family rewards are earned once", function () {
  assert.equal(this.game.getFlag("progressItem:wineBottle"), true);
  assert.equal(this.game.getFlag("useItem:wineBottle"), true);
  assert.equal(this.game.getFlag("progressItem:wineBottle:2"), undefined);
  assert.equal(this.game.getFlag("useItem:wineBottle:2"), undefined);
});

Then("the derived maximum score is unchanged", function () {
  assert.equal(world.maximumScore(this.game), this.wineMaximumScore);
});

// end lane8-corkscrew.steps.js
