// lane12.steps.js. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.001:acoven.
import assert from "node:assert/strict";
import { Given, Then, When } from "@cucumber/cucumber";
import { shortestWalk, solveSmallProblem } from "../../tools/route-plan.mjs";

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

// end lane12.steps.js
