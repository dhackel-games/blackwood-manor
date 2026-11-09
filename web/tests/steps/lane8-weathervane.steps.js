// lane8-weathervane.steps.js. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-09.002:acoven.

import assert from "node:assert";
import { Given, Then, When } from "@cucumber/cucumber";
import { world } from "../../js/world.js";

const POOL_KEYS = {
  north: "gargoylePuffCheeks",
  east: "gargoyleNosePinch",
  south: "gargoyleRearGuard",
};

function poolKey(target) {
  const key = POOL_KEYS[target];
  assert.ok(key, `Unknown gargoyle pool "${target}"`);
  return key;
}

Given("a legacy vane save is restored", function () {
  const snapshot = this.game.snapshot();
  delete snapshot.state.items.rustedWeathervane;
  snapshot.state.items.silverWeathercock = {
    id: "silverWeathercock",
    names: ["silver weathercock", "weathercock", "vane"],
    adjectives: ["silver", "brass"],
    loc: "roof",
    worn: false,
    fixed: false,
    takeable: true,
    open: true,
    lit: true,
    fuel: 8,
  };
  snapshot.state.flags["manor:weathercockFreed"] = true;
  snapshot.state.flags["progressAward:weathercockFreed"] = true;
  snapshot.state.flags["progressItem:silverWeathercock"] = true;
  snapshot.state.flags["useItem:silverWeathercock"] = true;
  snapshot.state.flags["heirloomScore:silverWeathercock"] = true;
  this.game.restore(snapshot);
});

Then("the migrated weathervane keeps its current identity and mutable runtime state", function () {
  const vane = this.game.item("rustedWeathervane");
  assert.deepEqual(vane.names, ["rusted weathervane", "weathervane", "vane", "rooster", "iron rooster"]);
  assert.deepEqual(vane.adjectives, ["rusted", "iron"]);
  assert.equal(vane.fixed, false);
  assert.equal(vane.takeable, true);
  assert.equal(vane.open, true);
  assert.equal(vane.lit, true);
  assert.equal(vane.fuel, 8);
});

When("I turn the weathervane toward {string} {int} times, saving after {int}", function (target, count, saveAfter) {
  const key = poolKey(target);
  const pool = world.flavorPools[key];
  assert.equal(pool.length, 12);
  this.weathervaneReplies = [];
  for (let index = 0; index < count; index += 1) {
    this.output = this.game.send(`turn vane to face ${target}`);
    const reply = pool.find((line) => this.output.includes(line));
    assert.ok(reply, `Missing ${target} pool reply in:\n${this.output}`);
    this.weathervaneReplies.push(reply);
    if (index + 1 === saveAfter) {
      const snapshot = this.game.snapshot();
      this.game.restore(snapshot);
    }
  }
});

Then("the weathervane {string} replies cover a full unique cycle after restore", function (target) {
  const key = poolKey(target);
  const pool = world.flavorPools[key];
  assert.deepEqual(this.weathervaneReplies.slice(0, 12), pool);
  assert.equal(new Set(this.weathervaneReplies.slice(0, 12)).size, 12);
  assert.equal(this.weathervaneReplies[12], this.weathervaneReplies[0]);
  assert.equal(this.game.getFlag(`flavorCycle:${key}`), 1);
});

Then("the roof gargoyles are fixed and the weathervane is a treasure", function () {
  for (const id of [
    "gargoylePuffCheeks",
    "gargoyleNosePinch",
    "gargoyleRearGuard",
    "gargoyleFarGazing",
  ]) {
    assert.equal(this.game.roomOf(id), "roof");
    assert.equal(this.game.item(id).fixed, true);
  }
  const weathervane = this.game.item("rustedWeathervane");
  assert.equal(weathervane.loc, "roof");
  assert.equal(weathervane.fixed, true);
  assert.equal(weathervane.takeable, true);
  assert.equal(weathervane.treasure, true);
  assert.equal(weathervane.points, 10);
});

Then("every roof gargoyle reply comes to life, does its deed, apologizes, and turns back to stone", function () {
  const deeds = { gargoylePuffCheeks: /BURP/, gargoyleNosePinch: /FART/, gargoyleRearGuard: /SHART|SPLATTER|POOP EXPLOSION|ERUPTS/ };
  for (const [key, deed] of Object.entries(deeds)) {
    const pool = world.flavorPools[key];
    assert.equal(pool.length, 12);
    assert.equal(new Set(pool).size, 12, `${key} lines must be unique`);
    for (const line of pool) {
      assert.match(line, /(life|wak|animates|alive|blinks|twitches|shudders|springs)/i, `${key} must come to life: ${line}`);
      assert.match(line, deed, `${key} must perform its deed: ${line}`);
      assert.match(line, /(sorry|pardon|apolog|excuse me|forgive)/i, `${key} must apologize: ${line}`);
      const lastSentence = line.trim().split(/(?<=\.)\s+(?=[A-Z])/).pop();
      assert.match(lastSentence, /\b(stone|statue|petrif)/i, `${key} must end back in stone: ${line}`);
      assert.match(line, /\byou(r)?\b/i, `${key} must hit the player: ${line}`);
      assert.doesNotMatch(line, /silver|rooster|weathercock|BURPER|FARTER|SHITTER/i);
    }
  }
  const east = world.flavorPools.gargoyleFarGazing;
  for (const line of east) {
    assert.match(line, /(life|wak|stirs)/i, `east must come to life: ${line}`);
    assert.match(line.split(/(?<=\.)\s+(?=[A-Z])/).pop(), /\bstone\b/i, `east must end back in stone: ${line}`);
  }
});

// end lane8-weathervane.steps.js
