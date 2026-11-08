// lane12.steps.js. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.001:acoven.
import assert from "node:assert/strict";
import { Given, Then, When } from "@cucumber/cucumber";
import { planRoute, shortestWalk, solveSmallProblem } from "../../tools/route-plan.mjs";

Given("the route has no unlocked exits", function () {
  this.routeOptions = { flags: {}, canFly: false, lockerOpen: false };
});

Given("route flag {string} is set", function (flag) {
  this.routeOptions.flags[flag] = true;
});

Given("the route locker is open", function () {
  this.routeOptions.lockerOpen = true;
});

Given("route lift beat is {int}", function (beat) {
  this.routeOptions.liftBeat = beat;
});

Given("the route has winged shoes", function () {
  this.routeOptions.canFly = true;
});

When("I plan a walk from {string} to {string}", function (from, to) {
  this.plannedWalk = shortestWalk(from, to, this.routeOptions);
});

Then("the planned walk is unreachable", function () {
  assert.equal(this.plannedWalk, null);
});

Then("the planned walk has {int} room transition(s)", function (transitions) {
  assert.ok(this.plannedWalk, "Expected a traversable walk");
  assert.equal(this.plannedWalk.transitions, transitions);
});

Then("the planned walk commands are {string}", function (commands) {
  assert.equal(this.plannedWalk.commands.join("; "), commands);
});

When("I order the porch and garden collections", function () {
  this.plannedTasks = solveSmallProblem({
    start: "gate", end: "privy",
    tasks: [
      { id: "garden", room: "garden", commands: ["take all"] },
      { id: "porch", room: "porch", commands: ["open mailbox"] },
    ],
  });
});

When("I order the key and manor door tasks", function () {
  this.plannedTasks = solveSmallProblem({
    start: "gate", end: "grandHall",
    tasks: [
      { id: "door", room: "porch", dependsOn: ["key"],
        commands: ["open frontd with iron"], grants: { frontDoorOpen: true } },
      { id: "key", room: "garden", commands: ["move statue", "take all"] },
    ],
  });
});

When("I order the safe constellation and burning ejection", function () {
  this.plannedTasks = solveSmallProblem({
    start: "planetarium", end: "gate",
    tasks: [
      { id: "eject", room: "planetarium", dependsOn: ["safe"], movesTo: "gate",
        commands: ["say 4", "extinguish self"] },
      { id: "safe", room: "planetarium", commands: ["say 1"] },
    ],
  });
});

Then("the planned task order is {string}", function (order) {
  assert.deepEqual(this.plannedTasks?.order, order.split(", "));
});

Then("the planned task route has {int} room transition(s)", function (transitions) {
  assert.equal(this.plannedTasks?.transitions, transitions);
});

Then("the planned task commands are {string}", function (commands) {
  assert.equal(this.plannedTasks?.commands.join("; "), commands);
});

When("I plan the complete Part I sweep", function () {
  this.fullRoute = planRoute();
});

Then("the planned player ends alive in the Royal Hall with all 24 heirlooms in the clock", function () {
  const { game, metrics } = this.fullRoute;
  assert.equal(game.state.dead, false);
  assert.equal(game.state.room, "grandHall");
  assert.equal(game.has("clockTalisman"), true);
  assert.equal(metrics.heirlooms, 24);
  const treasures = Object.entries(game.world.items).filter(([, item]) => item.treasure);
  assert.equal(treasures.length, 24);
  assert.ok(treasures.every(([id]) => game.roomOf(id) === "clockTalisman"));
});

Then("the planned sweep earns the derived maximum and ONE TRIP bonus", function () {
  const { game, metrics } = this.fullRoute;
  assert.equal(metrics.score, metrics.derivedMaximum);
  assert.equal(game.getFlag("progressAward:oneTrip"), true);
  assert.equal(metrics.oneTripAwarded, true);
});

Then("the planned sweep uses one bulk deposit and no more than two named flights", function () {
  const { commands, metrics } = this.fullRoute;
  assert.equal(commands.filter((command) => command === "put all in rq").length, 1);
  assert.equal(metrics.bulkDeposits, 1);
  assert.equal(metrics.namedFlights[0], "shaft");
  assert.ok(metrics.namedFlights.length <= 2);
  assert.ok(metrics.peakLoad <= 36);
});

Then("the planned sweep lights the brazier from body fire on its fourth turn", function () {
  assert.equal(this.fullRoute.game.getFlag("brazierMethod"), "body");
  assert.equal(this.fullRoute.game.getFlag("progressAward:selfFireSurvived"), true);
  assert.ok(this.fullRoute.game.getFlag("maxBurnTurns") >= 3);
  assert.ok(this.fullRoute.commands.join("; ").includes(
    "light self with wrapper; s; s; e; light brazier"));
});

Then("the planned transition ratio improves on the 77-for-13 baseline", function () {
  const { metrics } = this.fullRoute;
  assert.ok(metrics.transitions / 24 < 77 / 13);
  assert.equal(metrics.roomChangesIncludingLiftAndEjection,
    metrics.transitions + metrics.liftTransitions + metrics.ejectionTransitions);
});

Then("the optional second flight saves non-flight room transitions", function () {
  const { metrics, comparison } = this.fullRoute;
  assert.equal(metrics.secondFlightChosen, true);
  assert.equal(metrics.namedFlights.length, 2);
  assert.ok(comparison.bestSecondFlightRoomChanges < comparison.noSecondFlightRoomChanges);
  assert.equal(metrics.roomChangesIncludingLiftAndEjection,
    comparison.bestSecondFlightRoomChanges);
});

// end lane12.steps.js
