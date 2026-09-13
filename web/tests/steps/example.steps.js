// example.steps.js — proves the shared engine runs a non-Blackwood game.
// Loads the Dave & Andy Games example world and reuses the generic engine steps
// (I send / the output contains / the current room is / the game is won ...).
import { Given } from "@cucumber/cucumber";
import { createGame } from "../../js/core.js";
import { world as spaceport } from "../../examples/spaceport/world.js";

// Sets this.game so all the generic engine.steps/manor.steps assertions apply.
Given("the example spaceport game", function () {
  this.game = createGame(spaceport);
});
