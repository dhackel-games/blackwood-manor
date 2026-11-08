// lane8-weathercock.steps.js. Copyright (c) 2026:dhackel-games. All Rights Reserved. Do Not Distribute.

import assert from "node:assert";
import { Then, When } from "@cucumber/cucumber";
import { world } from "../../js/world.js";

const POOL_KEYS = {
  burper: "gargoyleBurper",
  farter: "gargoyleFarter",
  shitter: "gargoyleShitter",
};

function poolKey(target) {
  const key = POOL_KEYS[target];
  assert.ok(key, `Unknown gargoyle pool "${target}"`);
  return key;
}

When("I turn the weathercock toward {string} {int} times, saving after {int}", function (target, count, saveAfter) {
  const key = poolKey(target);
  const pool = world.flavorPools[key];
  assert.equal(pool.length, 12);
  this.weathercockReplies = [];
  for (let index = 0; index < count; index += 1) {
    this.output = this.game.send(`turn weathercock to face ${target}`);
    const reply = pool.find((line) => this.output.includes(line));
    assert.ok(reply, `Missing ${target} pool reply in:\n${this.output}`);
    this.weathercockReplies.push(reply);
    if (index + 1 === saveAfter) {
      const snapshot = this.game.snapshot();
      this.game.restore(snapshot);
    }
  }
});

Then("the weathercock {string} replies cover a full unique cycle after restore", function (target) {
  const key = poolKey(target);
  const pool = world.flavorPools[key];
  assert.deepEqual(this.weathercockReplies.slice(0, 12), pool);
  assert.equal(new Set(this.weathercockReplies.slice(0, 12)).size, 12);
  assert.equal(this.weathercockReplies[12], this.weathercockReplies[0]);
  assert.equal(this.game.getFlag(`flavorCycle:${key}`), 1);
});

Then("the roof gargoyles are fixed and the weathercock is a treasure", function () {
  for (const id of [
    "gargoyleBurper",
    "gargoyleFarter",
    "gargoyleShitter",
    "gargoyleHorizonGazer",
  ]) {
    assert.equal(this.game.roomOf(id), "roof");
    assert.equal(this.game.item(id).fixed, true);
  }
  const weathercock = this.game.item("silverWeathercock");
  assert.equal(weathercock.loc, "roof");
  assert.equal(weathercock.fixed, true);
  assert.equal(weathercock.takeable, true);
  assert.equal(weathercock.treasure, true);
  assert.equal(weathercock.points, 10);
});

// end lane8-weathercock.steps.js
