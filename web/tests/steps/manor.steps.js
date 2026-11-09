// manor.steps.js. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.005:acoven.
import assert from "node:assert";
import { existsSync, readFileSync } from "node:fs";
import { After, Given, Then, When } from "@cucumber/cucumber";
import { composeDefaultPlayerName, createGame } from "../../js/core.js";
import { MAP_MARK } from "../../js/map.js";
import { parse } from "../../js/parser.js";
import {
  SYSOP_COMMANDS,
  SYSOP_MENU_COMMAND,
  SYSOP_MENU_DISCOVERY_MESSAGE,
  SYSOP_MENU_PASSWORDS,
  expandSysopCommand,
  isSysopMenuPassword,
  pathToRoom,
  renderSysopMenu,
  persistSysopMenuUnlock,
  shortestCommand,
  sysopCommand,
  sysopMenuAction,
} from "../../js/sysop-menu.js";
import { CYCLING_FLAVOR_POOLS, REQUIRED_FAMILY_ITEM_COUNT, world } from "../../js/world.js";

const realMathRandom = Math.random;

After(function () {
  Math.random = realMathRandom;
});

function commandsFrom(docString) {
  return docString.split("\n").map((line) => line.trim()).filter(Boolean);
}

function playSequence(context, docString, allowDeath) {
  context.log = [];
  for (const command of commandsFrom(docString)) {
    context.output = context.game.send(command);
    context.log.push(`> ${command}\n${context.output}`);
    if (context.game.state.dead) {
      if (allowDeath) break;
      throw new Error(`Unexpected death at "${command}":\n${context.output}`);
    }
  }
}

Given("a fresh manor game", function () {
  this.game = createGame(world);
  this.game.send("Jeb");
  this.output = "";
  this.accumulatedOutput = "";
  // Lightning Jumps are a random per-turn hazard; scripted scenarios need
  // deterministic turns, so chaos is off unless a scenario explicitly re-enables it.
  this.game.setFlag("__noChaos", true);
});

Given("the radio seed is {int}", function (seed) {
  this.game.setFlag("realm:radioSeed", seed >>> 0);
});

Given("a fresh unnamed manor game", function () {
  this.game = createGame(world);
  this.output = this.game.startMessage();
  this.accumulatedOutput = "";
  this.game.setFlag("__noChaos", true);
});

Given("chaos events \\(lightning jumps) are enabled", function () {
  this.game.setFlag("__noChaos", false);
});

Given("the random number generator always returns {float}", function (value) {
  Math.random = () => value;
});

Given("the random number generator returns {float} then {float}", function (first, second) {
  const seq = [first, second];
  let i = 0;
  Math.random = () => (i < seq.length ? seq[i++] : seq[seq.length - 1]);
});

Given("the mystery package teleport selects room {string}", function (room) {
  const destinations = Object.keys(this.game.world.rooms).filter((id) =>
    id !== this.game.state.room
    && this.game.world.rooms[id].phase !== 2
    && this.game.world.rooms[id].randomTeleport !== false
    && (this.game.getFlag("oakLightAligned") || id !== "treeFort"));
  const index = destinations.indexOf(room);
  assert.notEqual(index, -1, `Unknown teleport destination: ${room}`);
  const seq = [0.3, (index + 0.5) / destinations.length];
  let i = 0;
  Math.random = () => (i < seq.length ? seq[i++] : seq[seq.length - 1]);
});

Given("the mystery package teleport would select room {string}", function (room) {
  const destinations = Object.keys(this.game.world.rooms).filter((id) =>
    id !== this.game.state.room && this.game.world.rooms[id].randomTeleport !== false);
  const index = destinations.indexOf(room);
  assert.notEqual(index, -1, `Unknown teleport destination: ${room}`);
  const seq = [0.3, (index + 0.5) / destinations.length];
  let i = 0;
  Math.random = () => (i < seq.length ? seq[i++] : seq[seq.length - 1]);
});

Given("the lightning bolt teleport would select room {string}", function (room) {
  const destinations = Object.keys(this.game.world.rooms).filter((id) => id !== this.game.state.room);
  const index = destinations.indexOf(room);
  assert.notEqual(index, -1, `Unknown teleport destination: ${room}`);
  // 0.0 makes the bolt spawn (below LIGHTNING_CHANCE); the second value aims the
  // teleport at `room`'s slot in the FULL room list. If the bolt honours its
  // no-jump list, `room` is filtered out and you land somewhere else entirely.
  const seq = [0.0, (index + 0.5) / destinations.length];
  let i = 0;
  Math.random = () => (i < seq.length ? seq[i++] : seq[seq.length - 1]);
});

Given("the player is in room {string}", function (room) {
  this.game.state.room = room;
});

Given("the player is on fire", function () {
  this.game.setFlag("onFire", true);
});

Given("item {string} is carried", function (item) {
  this.game.moveItem(item, "inventory");
  if (item === "xrayGoggles") {
    this.game.destroy("belfryBats");
    this.game.setFlag("belfryBatsScattered", true);
  }
});

Given("item {string} has been destroyed", function (item) {
  this.game.destroy(item);
});

Given("item {string} rests in room {string}", function (item, room) {
  this.game.moveItem(item, room);
});

Given("the backpack is worn", function () {
  this.game.moveItem("backpack", "inventory");
  this.game.item("backpack").worn = true;
});

Given("the restored candelabra is carried", function () {
  this.game.destroy("mirrorShard");
  this.game.destroy("candlestick");
  this.game.destroy("candelabraFrame");
  this.game.moveItem("candelabra", "inventory");
  this.game.item("candelabra").lit = true;
  this.game.setFlag("candelabraShardInstalled");
  this.game.setFlag("candelabraCandleInstalled");
  this.game.setFlag("candelabraRestored");
});

Given("an already-solved oak has its platform at the roots", function () {
  this.game.setFlag("oakLightAligned");
  this.game.setFlag("brazierLit");
  this.game.setFlag("oakGemSlots", {
    top: "greenGlassStone",
    middle: "emberStone",
    bottom: "blueGlassStone",
  });
  this.game.moveItem("emberStone", "oakMechanism");
  this.game.moveItem("oakPlatform", "greatOak");
});

When("the room is automatically described", function () {
  this.output = this.game.describeRoom();
});

When("I unlock the sysop game state with {string}", function (password) {
  const action = sysopMenuAction(password, !!this.game.getFlag("sysopMenuUnlocked"));
  assert.equal(action.unlocked, true, `Expected sysop password ${password} to unlock the menu.`);
  persistSysopMenuUnlock(this.game, action);
});

Given("the four-beat oak lift is below while I wait at the fort", function () {
  this.game.setFlag("oakLightAligned");
  this.game.setFlag("oak:lowerPanelAligned");
  this.game.setFlag("oak:liftBeat", 3);
  this.game.moveItem("oakPlatform", "below");
  this.game.state.room = "treeFort";
});

const PRE_REDESIGN_TREASURES = [
  "batSightMirror", "spyglass", "familyCrest", "candlestick", "grimoire",
  "talisman", "musicBox", "rubyRing", "goldLocket", "ancientCoin",
  "crystalDecanter", "ancestralPortrait", "backwardsWatch",
];

const INCORRECT_REDESIGN_TREASURES = [
  "xrayGoggles", "spyglass", "familyCrest", "candelabra", "grimoire",
  "talisman", "musicBox", "rubyRing", "goldLocket", "ancientCoin",
  "crystalDecanter", "ancestralPortrait", "blackwoodHammer",
];
const LANE10_HEIRLOOMS = [
  "demogorgonzolaRind", "portableTransistorRadio", "goldEyepiece", "purpleCrayon",
  "stellarMap", "kidsDrawing", "blackwoodDiamond", "baronessPhotograph",
  "rustedWeathervane", "snuffbox", "corkscrew",
];

function deleteLane10Items(snapshot) {
  for (const id of LANE10_HEIRLOOMS) delete snapshot.state.items[id];
}

function oldTreasures() {
  return Object.entries(world.items)
    .filter(([id, item]) => item.treasure && !LANE10_HEIRLOOMS.includes(id))
    .map(([id]) => id);
}

function preRedesignSnapshot(game) {
  const snapshot = game.snapshot();
  for (const id of ["familyRing", "blackwoodHammer", "candelabra", "candelabraFrame", "mirrorShard", "studyDrawer"]) {
    delete snapshot.state.items[id];
  }
  snapshot.state.items.batSightMirror = {
    id: "batSightMirror",
    names: ["bat sight mirror", "mirror", "hand mirror"],
    loc: null,
    takeable: true,
    treasure: true,
    points: 20,
  };
  snapshot.state.items.backwardsWatch.loc = "betweenWalls";
  snapshot.state.items.backwardsWatch.worn = false;
  snapshot.state.items.backwardsWatch.treasure = true;
  snapshot.state.items.backwardsWatch.points = 12;
  snapshot.state.items.candlestick.loc = "diningRoom";
  snapshot.state.items.candlestick.treasure = true;
  snapshot.state.items.candlestick.points = 10;
  snapshot.state.items.xrayGoggles.loc = "nightDrawer";
  snapshot.state.items.xrayGoggles.worn = false;
  delete snapshot.state.items.xrayGoggles.treasure;
  delete snapshot.state.items.xrayGoggles.points;
  delete snapshot.state.flags.heirloomRedesignMigrated;
  delete snapshot.state.flags.candelabraShardInstalled;
  delete snapshot.state.flags.candelabraCandleInstalled;
  delete snapshot.state.flags.candelabraRestored;
  return snapshot;
}

function precedingRedesignSnapshot(game) {
  const snapshot = game.snapshot();
  delete snapshot.state.items.familyRing;
  delete snapshot.state.items.studyDrawer;
  snapshot.state.items.xrayGoggles.treasure = true;
  snapshot.state.items.xrayGoggles.points = 20;
  snapshot.state.items.backwardsWatch.loc = "nightDrawer";
  snapshot.state.items.backwardsWatch.worn = false;
  delete snapshot.state.items.backwardsWatch.treasure;
  delete snapshot.state.items.backwardsWatch.points;
  snapshot.state.flags.heirloomRedesignMigrated = true;
  delete snapshot.state.flags.heirloomCorrectionMigrated;
  return snapshot;
}

function historicalFamilyRingSnapshot(game) {
  const snapshot = game.snapshot();
  for (const id of ["blackwoodHammer", "candelabra", "candelabraFrame", "mirrorShard", "studyDrawer"]) {
    delete snapshot.state.items[id];
  }
  snapshot.state.items.backwardsWatch.loc = "betweenWalls";
  snapshot.state.items.backwardsWatch.worn = false;
  delete snapshot.state.items.backwardsWatch.treasure;
  delete snapshot.state.items.backwardsWatch.points;
  snapshot.state.items.candlestick.loc = "diningRoom";
  snapshot.state.items.candlestick.treasure = true;
  snapshot.state.items.candlestick.points = 10;
  snapshot.state.items.xrayGoggles.loc = "nightDrawer";
  snapshot.state.items.xrayGoggles.worn = false;
  delete snapshot.state.items.xrayGoggles.treasure;
  delete snapshot.state.items.xrayGoggles.points;
  delete snapshot.state.flags.heirloomRedesignMigrated;
  delete snapshot.state.flags.heirloomCorrectionMigrated;
  return snapshot;
}

function restorePrePortableRewards(context, configure) {
  const snapshot = context.game.snapshot();
  delete snapshot.state.flags.portableRewardLedgerVersion;
  configure(snapshot.state);
  context.game.restore(snapshot);
}

function markCandelabraRestored(snapshot, location) {
  snapshot.state.items.candlestick.loc = null;
  snapshot.state.items.mirrorShard.loc = null;
  snapshot.state.items.candelabraFrame.loc = null;
  snapshot.state.items.candelabra.loc = location;
  snapshot.state.items.candelabra.lit = true;
  snapshot.state.flags.candelabraCandleInstalled = true;
  snapshot.state.flags.candelabraShardInstalled = true;
  snapshot.state.flags.candelabraRestored = true;
  delete snapshot.state.flags["progressAward:candelabraRestored"];
}

Given("a pre-redesign save with replaced heirlooms deposited is restored", function () {
  const snapshot = preRedesignSnapshot(this.game);
  for (const id of PRE_REDESIGN_TREASURES) snapshot.state.items[id].loc = "reliquary";
  snapshot.state.items.xrayGoggles.loc = "inventory";
  snapshot.state.items.xrayGoggles.worn = true;
  snapshot.state.flags["progressItem:xrayGoggles"] = true;
  snapshot.state.flags["progressAward:belfryMirrorFreed"] = true;
  snapshot.state.flags.belfryBatsScattered = true;
  snapshot.state.flags["heirloomScore:batSightMirror"] = true;
  snapshot.state.flags["heirloomScore:backwardsWatch"] = true;
  snapshot.state.flags["heirloomScore:candlestick"] = true;
  snapshot.state.flags.curseLiftable = true;
  snapshot.state.score = 200;
  this.game.restore(snapshot);
});

Given("a legacy thirteen-deposit save is restored", function () {
  const snapshot = this.game.snapshot();
  deleteLane10Items(snapshot);
  for (const id of oldTreasures()) snapshot.state.items[id].loc = "reliquary";
  snapshot.state.flags.curseLiftable = true;
  snapshot.state.flags.reliquarySealed = true;
  snapshot.state.flags["heirloomScore:familyCrest"] = true;
  snapshot.state.flags["progressAward:candelabraRestored"] = true;
  snapshot.state.score = 195;
  this.game.restore(snapshot);
});

Given("a legacy bell-rung save is restored", function () {
  const snapshot = this.game.snapshot();
  deleteLane10Items(snapshot);
  for (const id of oldTreasures()) snapshot.state.items[id].loc = "clockTalisman";
  snapshot.state.items.clockTalisman.loc = "reliquary";
  snapshot.state.flags.curseLiftable = true;
  snapshot.state.flags.bellRung = true;
  snapshot.state.flags.heirloomsTransformed = true;
  snapshot.state.flags.floorDoorOpen = true;
  snapshot.state.flags["progressAward:bellRung"] = true;
  snapshot.state.flags["progressAward:candelabraRestored"] = true;
  snapshot.state.score = 200;
  this.game.restore(snapshot);
});

Given("a legacy Part II save after the old scene is restored", function () {
  const snapshot = this.game.snapshot();
  deleteLane10Items(snapshot);
  for (const id of oldTreasures()) snapshot.state.items[id].loc = "clockTalisman";
  snapshot.state.items.clockTalisman.loc = "inventory";
  snapshot.state.flags.partII = true;
  snapshot.state.flags.bellRung = true;
  snapshot.state.flags.heirloomsTransformed = true;
  snapshot.state.flags.hour13Done = true;
  snapshot.state.flags.clockHour = 12;
  snapshot.state.flags["progressAward:bellRung"] = true;
  snapshot.state.flags["progressAward:candelabraRestored"] = true;
  snapshot.state.score = 225;
  this.game.restore(snapshot);
});

Given("a legacy collected PHOTO PIECE A save is restored", function () {
  const snapshot = this.game.snapshot();
  snapshot.state.items.letter.loc = "inventory";
  snapshot.state.flags.letterRead = true;
  snapshot.state.flags["progressAward:letterRead"] = true;
  snapshot.state.flags["progressItem:letter"] = true;
  snapshot.state.score = 15;
  this.game.restore(snapshot);
});

Given("a legacy burned-letter save is restored", function () {
  const snapshot = this.game.snapshot();
  snapshot.state.items.letter.loc = null;
  snapshot.state.flags.letterBurned = true;
  snapshot.state.flags.letterRead = true;
  snapshot.state.flags["progressAward:letterRead"] = true;
  snapshot.state.flags["progressItem:letter"] = true;
  snapshot.state.score = 15;
  this.game.restore(snapshot);
});

Given("a pre-redesign transformed heirloom save is restored", function () {
  const snapshot = preRedesignSnapshot(this.game);
  for (const id of PRE_REDESIGN_TREASURES) snapshot.state.items[id].loc = "clockTalisman";
  snapshot.state.items.xrayGoggles.loc = "inventory";
  snapshot.state.items.xrayGoggles.worn = true;
  snapshot.state.items.clockTalisman.loc = "reliquary";
  snapshot.state.flags["progressItem:xrayGoggles"] = true;
  snapshot.state.flags["progressAward:belfryMirrorFreed"] = true;
  snapshot.state.flags["progressAward:bellRung"] = true;
  snapshot.state.flags.belfryBatsScattered = true;
  snapshot.state.flags["heirloomScore:batSightMirror"] = true;
  snapshot.state.flags["heirloomScore:backwardsWatch"] = true;
  snapshot.state.flags["heirloomScore:candlestick"] = true;
  snapshot.state.flags.curseLiftable = true;
  snapshot.state.flags.bellRung = true;
  snapshot.state.flags.floorDoorOpen = true;
  snapshot.state.flags.heirloomsTransformed = true;
  snapshot.state.score = 205;
  this.game.restore(snapshot);
});

Given("a pre-redesign carried-equipment save is restored", function () {
  const snapshot = preRedesignSnapshot(this.game);
  snapshot.state.items.batSightMirror.loc = "inventory";
  snapshot.state.items.backwardsWatch.loc = "inventory";
  snapshot.state.items.candlestick.loc = "inventory";
  snapshot.state.items.candlestick.lit = true;
  snapshot.state.items.candlestick.fuel = 73;
  snapshot.state.items.xrayGoggles.loc = "inventory";
  snapshot.state.items.xrayGoggles.worn = true;
  snapshot.state.flags["progressItem:xrayGoggles"] = true;
  snapshot.state.score = 5;
  this.game.restore(snapshot);
});

Given("a pre-redesign save with a deposited mirror and untouched goggles is restored", function () {
  const snapshot = preRedesignSnapshot(this.game);
  snapshot.state.items.batSightMirror.loc = "reliquary";
  snapshot.state.items.belfryBats.loc = null;
  snapshot.state.flags["progressAward:belfryMirrorFreed"] = true;
  snapshot.state.flags.belfryBatsScattered = true;
  snapshot.state.flags["heirloomScore:batSightMirror"] = true;
  snapshot.state.score = 25;
  this.game.restore(snapshot);
});

Given("a preceding-redesign save with the goggles deposited is restored", function () {
  const snapshot = precedingRedesignSnapshot(this.game);
  for (const id of INCORRECT_REDESIGN_TREASURES) snapshot.state.items[id].loc = "reliquary";
  markCandelabraRestored(snapshot, "reliquary");
  snapshot.state.items.backwardsWatch.loc = "inventory";
  snapshot.state.items.backwardsWatch.worn = true;
  snapshot.state.flags["progressItem:xrayGoggles"] = true;
  snapshot.state.flags["progressAward:belfryGogglesFreed"] = true;
  snapshot.state.flags.belfryBatsScattered = true;
  snapshot.state.flags["heirloomScore:xrayGoggles"] = true;
  snapshot.state.flags.curseLiftable = true;
  snapshot.state.score = 200;
  this.game.restore(snapshot);
});

Given("a preceding-redesign transformed heirloom save is restored", function () {
  const snapshot = precedingRedesignSnapshot(this.game);
  for (const id of INCORRECT_REDESIGN_TREASURES) snapshot.state.items[id].loc = "clockTalisman";
  markCandelabraRestored(snapshot, "clockTalisman");
  snapshot.state.items.backwardsWatch.loc = "inventory";
  snapshot.state.items.backwardsWatch.worn = true;
  snapshot.state.items.clockTalisman.loc = "reliquary";
  snapshot.state.flags["progressItem:xrayGoggles"] = true;
  snapshot.state.flags["progressAward:belfryGogglesFreed"] = true;
  snapshot.state.flags["progressAward:bellRung"] = true;
  snapshot.state.flags.belfryBatsScattered = true;
  snapshot.state.flags["heirloomScore:xrayGoggles"] = true;
  snapshot.state.flags.curseLiftable = true;
  snapshot.state.flags.bellRung = true;
  snapshot.state.flags.floorDoorOpen = true;
  snapshot.state.flags.heirloomsTransformed = true;
  snapshot.state.score = 205;
  this.game.restore(snapshot);
});

Given("a preceding-redesign save with withdrawn goggles credit is restored", function () {
  const snapshot = precedingRedesignSnapshot(this.game);
  snapshot.state.items.xrayGoggles.loc = "inventory";
  snapshot.state.items.xrayGoggles.worn = true;
  snapshot.state.flags["progressItem:xrayGoggles"] = true;
  snapshot.state.flags["heirloomScore:xrayGoggles"] = true;
  snapshot.state.score = 20;
  this.game.restore(snapshot);
});

Given("a historical save with the family ring worn is restored", function () {
  const snapshot = historicalFamilyRingSnapshot(this.game);
  snapshot.state.items.familyRing.loc = "inventory";
  snapshot.state.items.familyRing.worn = true;
  snapshot.state.flags["heirloomScore:familyRing"] = true;
  snapshot.state.score = 20;
  this.game.restore(snapshot);
});

Given("a build-three save with the untouched desk watch is restored", function () {
  const snapshot = this.game.snapshot();
  delete snapshot.state.items.studyDrawer;
  snapshot.state.items.backwardsWatch.loc = "study";
  snapshot.state.items.backwardsWatch.worn = false;
  this.game.restore(snapshot);
});

Given("a pre-bonus save with the restored candelabra is restored", function () {
  const snapshot = this.game.snapshot();
  markCandelabraRestored(snapshot, "inventory");
  snapshot.state.score = 0;
  this.game.restore(snapshot);
});

Given("a pre-roost save with undiscovered goggles is restored", function () {
  const snapshot = this.game.snapshot();
  snapshot.state.items.xrayGoggles.loc = null;
  snapshot.state.items.belfryBats.loc = "belfry";
  delete snapshot.state.flags.belfryBatsScattered;
  this.game.restore(snapshot);
});

Given("a legacy pre-oak save with the ember deposited is restored", function () {
  const snapshot = this.game.snapshot();
  const addedForOak = [
    "oakMechanism", "greenGlassStone", "blueGlassStone", "oakPlatform",
    "signalFlags", "blanketHideout", "woodenSlingshot", "spyglassCradle", "spyglass",
  ];
  for (const id of addedForOak) delete snapshot.state.items[id];
  snapshot.state.items.emberStone.loc = "reliquary";
  snapshot.state.items.emberStone.treasure = true;
  delete snapshot.state.items.talisman.treasure;
  delete snapshot.state.items.talisman.points;
  snapshot.state.items.silverChalice = {
    id: "silverChalice", names: ["chalice"], loc: "dreadmawVault",
    takeable: true, bonusTreasure: true, points: 20,
  };
  snapshot.state.items.jeweledCrown = {
    id: "jeweledCrown", names: ["crown"], loc: "dreadmawVault",
    takeable: true, bonusTreasure: true, points: 25,
  };
  this.game.restore(snapshot);
});

Given("a solved-oak save without the platform is restored", function () {
  const snapshot = this.game.snapshot();
  snapshot.state.flags.oakLightAligned = true;
  snapshot.state.items.oakPlatform.loc = null;
  snapshot.state.items.emberStone.loc = "oakMechanism";
  this.game.restore(snapshot);
});

Given("a completed pre-watch save is restored", function () {
  const snapshot = preRedesignSnapshot(this.game);
  for (const id of PRE_REDESIGN_TREASURES) {
    if (id !== "backwardsWatch") snapshot.state.items[id].loc = "reliquary";
  }
  delete snapshot.state.items.backwardsWatch.treasure;
  snapshot.state.items.backwardsWatch.loc = "betweenWalls";
  snapshot.state.flags.curseLiftable = true;
  snapshot.state.flags.floorDoorOpen = true;
  snapshot.state.score = 0;
  this.game.restore(snapshot);
});

Given("an in-progress pre-watch save with the watch already claimed is restored", function () {
  const snapshot = preRedesignSnapshot(this.game);
  delete snapshot.state.items.backwardsWatch.treasure;
  snapshot.state.items.backwardsWatch.loc = "inventory";
  snapshot.state.score = 12;
  this.game.restore(snapshot);
});

Given("a legacy accidental-fire save is restored", function () {
  const snapshot = this.game.snapshot();
  snapshot.state.flags.maxBurnTurns = 2;
  snapshot.state.flags.onFire = false;
  snapshot.state.score = 0;
  this.game.restore(snapshot);
});

Given("a legacy save with a carried coin and credited key and pack is restored", function () {
  restorePrePortableRewards(this, (state) => {
    state.room = "garden";
    state.items.ancientCoin.loc = "inventory";
    state.flags.wellLooted = true;
    state.flags["progressAward:wellLooted"] = true;
    state.items.frontKey.loc = "inventory";
    state.flags.statueMoved = true;
    state.flags["progressAward:statueKeyRevealed"] = true;
    state.flags["progressItem:frontKey"] = true;
    state.items.backpack.loc = "inventory";
    state.flags["progressItem:backpack"] = true;
    state.score = 20;
  });
});

Given("a legacy save with consumed food and generated items is restored", function () {
  restorePrePortableRewards(this, (state) => {
    state.room = "kitchen";
    state.items.mushrooms.loc = null;
    state.items.outhouseMushrooms.loc = null;
    state.flags.outhouseMushroomsFound = true;
    state.flags.vaultFound = true;
    state.flags["progressAward:mushroomVisionOpened"] = true;
    state.items.burrito.loc = null;
    state.items.burritoWrapper.loc = "inventory";
    state.flags.ateBurrito = true;
    state.flags.ateSuperBurrito = true;
    state.items.milk.loc = null;
    state.flags.drankMilk = true;
    state.items.apple.loc = null;
    state.items.goldDoubloon.loc = "inventory";
    state.flags.dragonMoved = true;
    state.items.matches.loc = null;
    state.items.candlestick.loc = "inventory";
    state.items.candlestick.lit = true;
    state.score = 25;
  });
});

Given("a legacy save with the candle and shard installed is restored", function () {
  restorePrePortableRewards(this, (state) => {
    state.room = "diningRoom";
    state.items.mirrorShard.loc = null;
    state.items.candlestick.loc = null;
    state.items.candelabraFrame.loc = null;
    state.items.candelabra.loc = "diningRoom";
    state.flags.mirrorShardFreed = true;
    state.flags.candelabraCandleInstalled = true;
    state.flags.candelabraShardInstalled = true;
    state.flags.candelabraRestored = true;
    state.flags["progressAward:candelabraRestored"] = true;
    state.score = 20;
  });
});

Given("a legacy save with the iron key consumed on unlocking is restored", function () {
  restorePrePortableRewards(this, (state) => {
    state.room = "porch";
    state.items.frontDoor.locked = false;
    state.flags.statueMoved = true;
    state.flags["progressAward:statueKeyRevealed"] = true;
    state.score = 5;
  });
});

Given("a legacy deposited watch with no portable ledger is restored", function () {
  const snapshot = preRedesignSnapshot(this.game);
  delete snapshot.state.flags.portableRewardLedgerVersion;
  snapshot.state.items.backwardsWatch.loc = "reliquary";
  snapshot.state.flags["heirloomScore:backwardsWatch"] = true;
  snapshot.state.score = 12;
  this.game.restore(snapshot);
});

Given("a legacy save with only unproven portable history is restored", function () {
  restorePrePortableRewards(this, (state) => {
    state.room = "grandHall";
    state.items.mysteryPackage.loc = null;
    state.flags["flavorCycle:packageOpenings"] = 1;
    state.items.letter.loc = null;
    state.flags.letterBurned = true;
    state.items.outhouseMushrooms.loc = "privy";
    state.flags.outhouseMushroomsFound = true;
  });
});

Given("a save with the Baron behind the wallpaper is restored", function () {
  const snapshot = this.game.snapshot();
  snapshot.state.items.baronMunchhausen.loc = "betweenWalls";
  snapshot.state.flags.baronLine = 2;
  this.game.restore(snapshot);
});

// Secret-ending setup: pre-fill the reliquary with every required heirloom,
// leaving exactly one named piece in the player's hands to deposit.
Given("every treasure but the {string} is already in the reliquary", function (itemId) {
  for (const [id, def] of Object.entries(world.items)) {
    if (def.treasure && id !== itemId) {
      this.game.moveItem(id, "reliquary");
    }
  }
  this.game.moveItem(itemId, "inventory");
  this.game.destroy("belfryBats");
  this.game.setFlag("belfryBatsScattered", true);
  if (this.game.roomOf("xrayGoggles") === "belfryBats") {
    this.game.moveItem("xrayGoggles", "belfry");
  }
});

Given("item {string} uses wear slot {string}", function (item, slot) {
  this.game.item(item).wearSlot = slot;
});

Given("flag {string} is set", function (flag) {
  this.game.setFlag(flag);
});

Given("flag {string} is {int}", function (flag, value) {
  this.game.setFlag(flag, value);
});

When("I play this command sequence:", function (docString) {
  playSequence(this, docString, false);
});

When("I execute sysop command {string}", function (command) {
  const shortcut = sysopCommand(command);
  assert.ok(shortcut, `Unknown sysop command: ${command}`);
  this.output = this.game.send(expandSysopCommand(shortcut, this.game));
});

When("I execute sysop command {string} through {string}", function (command, lastStep) {
  const shortcut = sysopCommand(command);
  assert.ok(shortcut, `Unknown sysop command: ${command}`);
  const steps = expandSysopCommand(shortcut, this.game).split("; ");
  const final = shortestCommand(lastStep);
  const index = steps.indexOf(final);
  assert.ok(index >= 0, `${command} does not include ${lastStep}`);
  assert.equal(steps.lastIndexOf(final), index, `${lastStep} must occur only once`);
  this.output = this.game.send(steps.slice(0, index + 1).join("; "));
});

Then("the traced win route begins {string}", function (prefix) {
  const expected = prefix.split("; ");
  assert.deepEqual(this.tracedSteps?.slice(0, expected.length), expected);
});

Then("the traced win route omits worn-equipment removal steps", function () {
  assert.ok(this.tracedSteps?.every((step) => !/^(?:doff|remove)\b/i.test(step)), this.tracedSteps?.join("; "));
});

Then("the traced win route opens the locker only while entering it", function () {
  const openings = this.tracedWinSteps?.filter(({ beforeLockerOpen, afterLockerOpen }) =>
    !beforeLockerOpen && afterLockerOpen);
  assert.deepEqual(openings?.map(({ step }) => step), ["in locker"]);
  assert.match(openings[0].output, /\(open MINERS' LOCKER; enter MINERS' LOCKER\)/);
});

Then("the traced win route uses required heirlooms only for state-changing effects", function () {
  const allowed = new Set(["talisman"]);
  for (const step of this.tracedSteps || []) {
    const action = parse(step);
    if (action.verb !== "use") continue;
    const itemId = Object.entries(world.itemShortNames)
      .find(([, alias]) => alias === action.dobj)?.[0];
    if (world.items[itemId]?.treasure) {
      assert.ok(allowed.has(itemId), `Redundant heirloom use: ${step}`);
    }
  }
});

Then("the traced win route uses TAKE ALL only for two or more items", function () {
  for (const { step, takeAllCount } of this.tracedWinSteps || []) {
    if (parse(step).verb === "take" && /^(?:take|get|t) (?:all|everything)$/i.test(step)) {
      assert.ok(takeAllCount >= 2, `${step} collected ${takeAllCount} item(s)`);
    }
  }
});

Then("the traced win route never takes an item the next action derives", function () {
  const implicitVerbs = new Set(["use", "read", "eat", "drink", "wear", "pour"]);
  const itemId = (action) => Object.entries(world.itemShortNames)
    .find(([, alias]) => alias === action.dobj)?.[0];
  for (let index = 0; index < (this.tracedSteps?.length || 0) - 1; index += 1) {
    const take = parse(this.tracedSteps[index].step);
    const next = parse(this.tracedSteps[index + 1].step);
    if (take.verb === "take" && !["all", "everything"].includes(take.dobj)
        && implicitVerbs.has(next.verb)) {
      assert.notEqual(itemId(take), itemId(next),
        `${this.tracedSteps[index].step}; ${this.tracedSteps[index + 1].step}`);
    }
  }
});

When("I trace sysop command {string}", function (command) {
  const shortcut = sysopCommand(command);
  assert.ok(shortcut, `Unknown sysop command: ${command}`);
  const steps = expandSysopCommand(shortcut, this.game).split("; ");
  this.tracedSteps = steps;
  assert.ok(steps.length <= 256, "The engine must execute the entire prompt");
  let flights = 0;
  let traversals = 0;
  let maxLoad = 0;
  let bulkReliquaryDeposits = 0;
  let singleReliquaryDeposits = 0;
  const tracedWinSteps = [];
  for (const [index, step] of steps.entries()) {
    const action = parse(step);
    const beforeRoom = this.game.state.room;
    const beforeScore = this.game.state.score;
    const beforeFly = this.game.world.canFly(this.game);
    const beforeRiding = !!this.game.getFlag("oakLiftRiding");
    const beforePlatform = this.game.roomOf("oakPlatform");
    const beforeFire = !!this.game.getFlag("onFire");
    const beforeLockerOpen = !!this.game.item("minersLocker")?.open;
    const takeAllCount = action.verb === "take" && ["all", "everything"].includes(action.dobj)
      ? this.game.visibleItems().filter((candidate) => candidate.takeable && !this.game.has(candidate.id)).length
      : null;
    const itemId = Object.entries(world.itemShortNames)
      .find(([, alias]) => alias === action.dobj)?.[0]
      || this.game.find(action.dobj)?.id
      || this.game.find(action.dobj, this.game.inventory())?.id;
    const item = this.game.item(itemId);
    const beforeLoc = item?.loc;
    const beforeOpen = item?.open;
    const beforeWorn = item?.worn;
    const beforeUse = this.game.getFlag(`useItem:${itemId}`);
    this.output = this.game.send(step);
    const afterLockerOpen = !!this.game.item("minersLocker")?.open;
    tracedWinSteps.push({ step, beforeLockerOpen, afterLockerOpen, takeAllCount, output: this.output });
    const detail = `${index + 1}/${steps.length}: ${step} in ${beforeRoom}\n${this.output}`;
    assert.equal(this.game.state.turns, index + 1, detail);
    assert.equal(this.game.state.dead, false, detail);
    assert.equal(this.game.state.won, false, detail);
    assert.ok(this.game.inventoryLoad() <= this.game.inventoryCapacity(), detail);
    maxLoad = Math.max(maxLoad, this.game.inventoryLoad());

    switch (action.verb) {
      case "go": {
        if (step.startsWith("g ")) {
          flights++;
          assert.equal(beforeFly, true, detail);
          const destinations = { shaft: "deepShaft", garden: "garden" };
          assert.equal(this.game.state.room, destinations[action.dobj], detail);
        } else if (action.dobj === "out" && beforeRiding) {
          assert.equal(this.game.state.room, beforeRoom, detail);
        } else if (beforeRoom === "garden" && action.dobj === "down") {
          assert.equal(this.game.getFlag("wellLooted"), true, detail);
          if (this.game.has("rope")) {
            assert.equal(this.game.getFlag("useItem:rope"), true, detail);
          } else {
            assert.equal(beforeFly, false, detail);
          }
          assert.ok(this.game.state.score > beforeScore, detail);
        } else {
          const exit = world.rooms[beforeRoom].exits?.[action.dobj];
          const adjacent = beforeRoom === "landing" && action.dobj === "up"
            ? "attic"
            : beforeRoom === "attic" && action.dobj === "up"
              ? "roof"
              : beforeRoom === "mineGallery" && action.dobj === "in"
                ? "waylampClearing"
                : beforeRoom === "waylampClearing" && action.dobj === "out"
                  ? "mineGallery"
              : typeof exit === "object" ? exit?.to : exit;
          assert.ok(adjacent, detail);
          if (typeof exit === "object" && exit.via) {
            assert.equal(this.game.getFlag(exit.via), true, detail);
          }
          assert.equal(this.game.state.room, adjacent, detail);
          traversals++;
        }
        break;
      }
      case "take":
        if (["all", "everything"].includes(action.dobj)) break;
        if (step === "pick nose") break;
        assert.ok(item, detail);
        if (this.game.roomOf(itemId) !== "inventory") break;
        assert.notEqual(beforeLoc, "inventory", detail);
        assert.equal(this.game.roomOf(itemId), "inventory", detail);
        assert.equal(this.game.getFlag(item.progressFlag || `progressItem:${itemId}`), true, detail);
        break;
      case "use":
      case "wear":
        assert.ok(item, detail);
        if (beforeUse || beforeWorn) break;
        assert.ok((!beforeUse && this.game.getFlag(`useItem:${itemId}`))
          || (!beforeWorn && this.game.item(itemId).worn), detail);
        break;
      case "read":
        break;
      case "put":
        if (["all", "everything"].includes(action.dobj) && action.iobj === "rq") {
          bulkReliquaryDeposits++;
          break;
        }
        if (action.iobj === "rq") singleReliquaryDeposits++;
        break;
      case "open":
      case "close":
        break;
      case "remove":
        assert.equal(beforeWorn, true, detail);
        assert.equal(this.game.item(itemId).worn, false, detail);
        break;
      case "enter":
        if (action.dobj === "locker") {
          assert.equal(this.game.state.room, "waylampClearing", detail);
        } else {
          assert.equal(this.game.getFlag("oakLiftRiding"), true, detail);
        }
        break;
      case "wait":
        break;
      case "talk":
      case "say":
      case "give":
      case "turn":
      case "set":
      case "start":
      case "fill":
      case "pour":
      case "spell":
      case "combine":
      case "look":
      case "smell":
        break;
      case "pull":
      case "move":
      case "light":
        break;
      case "extinguish":
        assert.equal(this.game.getFlag("onFire"), false, detail);
        break;
      default:
        break;
    }
  }
  this.winRoute = {
    steps: steps.length,
    flights,
    traversals,
    maxLoad,
    bulkReliquaryDeposits,
    singleReliquaryDeposits,
  };
  this.tracedWinSteps = tracedWinSteps;
});

When("I fast-forward into Part II", function () {
  for (const [id, definition] of Object.entries(world.items)) {
    if (definition.treasure) this.game.moveItem(id, "reliquary");
  }
  this.game.state.room = "grandHall";
  this.game.setFlag("curseLiftable");
  this.game.send("close reliquary");
  this.game.send("open bell closet");
  this.game.send("pull bell rope");
  this.game.send("open reliquary");
  this.game.send("take clock");
  this.output = this.game.send("down");
});

When("I play until death:", function (docString) {
  playSequence(this, docString, true);
});

When("the player moves directly to room {string}", function (room) {
  this.game.state.room = room;
});

When("I wait at most {int} turns until death", function (limit) {
  for (let i = 0; i < limit && !this.game.state.dead; i++) {
    this.output = this.game.send("wait");
  }
});

When("I wait {int} turns", function (turns) {
  for (let i = 0; i < turns; i++) {
    this.output = this.game.send("wait");
    assert.equal(this.game.state.dead, false, `Player died on wait ${i + 1}`);
  }
});

When("I wait through the full burrito course", function () {
  this.accumulatedOutput = "";
  for (let i = 0; i < 40 && !this.game.state.dead; i++) {
    this.accumulatedOutput += "\n" + this.game.send("wait");
  }
});

When("I win with {string}", function (message) {
  this.output = this.game.win(message);
});

When("I add {int} points", function (points) {
  this.game.addScore(points);
});

When("I ask Gary for {int} hints", function (count) {
  this.accumulatedOutput = "";
  for (let i = 0; i < count; i++) {
    this.accumulatedOutput += "\n" + this.game.send("hint");
  }
  this.output = this.accumulatedOutput;
});

When("I call Gary and say {string}", function (line) {
  this.game.send("call");
  this.billBefore = this.game.getFlag("phoneBill") || 0;
  this.playerLine = line;
  this.output = this.game.send(line);
});

When("I round-trip the game snapshot", function () {
  const restored = createGame(world);
  restored.restore(this.game.snapshot());
  this.game = restored;
});

When("a fresh mushroom crop regrows naturally", function () {
  const rolls = this.game.getFlag("frontDoorOpen") ? [0.99, 0] : [0];
  Math.random = () => rolls.shift() ?? 0.99;
  this.game.setFlag("__noChaos", false);
  this.output = this.game.send("wait");
  this.game.setFlag("__noChaos", true);
  assert.equal(this.game.roomOf("outhouseMushrooms"), "privy");
});

When("I restart from checkpoint {string}", function (name) {
  const restored = this.game.restoreCheckpoint(name);
  assert.ok(restored, `Missing checkpoint: ${name}`);
  if (name === "partII") {
    delete this.game.state.flags.playerName;
    delete this.game.state.flags.playerNameDefaulted;
    this.game.useDefaultPlayerName();
    this.output = this.game.startMessage();
  } else {
    this.output = restored.message;
  }
});

Then("the game is won", function () {
  const context = Array.isArray(this.log) ? this.log.slice(-6).join("\n\n") : (this.output || "");
  assert.equal(this.game.state.won, true, context);
});

Then("the game is not won", function () {
  assert.equal(this.game.state.won, false);
});

Then("checkpoint {string} exists", function (name) {
  assert.equal(this.game.hasCheckpoint(name), true);
});

Then("the game score is {int}", function (score) {
  assert.equal(this.game.state.score, score);
});

Then("the score equals the derived Part I maximum", function () {
  assert.equal(this.game.state.score, world.maximumScore(this.game));
});

Then("the derived Part I maximum is {int}", function (score) {
  assert.equal(world.maximumScore(this.game), score);
});

Then("every Part I portable has its pickup and use rewards", function () {
  const portable = Object.entries(world.items)
    .filter(([, item]) => item.takeable && item.phase !== 2);
  assert.equal(portable.length, 62);
  for (const [id, item] of portable) {
    assert.equal(this.game.getFlag(item.progressFlag || `progressItem:${id}`), true,
      `${id} was not acquired`);
    if (world.hasScoringUse({ ...item, id })) {
      assert.equal(this.game.getFlag(`useItem:${id}`), true, `${id} was not used`);
    } else {
      assert.equal(this.game.getFlag(`useItem:${id}`), undefined, `${id} earned a keepsake-use award`);
    }
  }
  assert.equal(this.game.getFlag("progressItem:emeraldOfTheQueen"), undefined);
});

Then("the win route used at most two named flights", function () {
  assert.ok(this.winRoute);
  assert.ok(this.winRoute.flights <= 2, JSON.stringify(this.winRoute));
});

Then("the win route used exactly {int} named flights", function (expected) {
  assert.ok(this.winRoute);
  assert.equal(this.winRoute.flights, expected, JSON.stringify(this.winRoute));
  assert.ok(this.winRoute.traversals > 60, JSON.stringify(this.winRoute));
  assert.ok(this.winRoute.maxLoad <= 36, JSON.stringify(this.winRoute));
});

Then("the win route used exactly one bulk RQ deposit", function () {
  assert.ok(this.winRoute);
  assert.equal(this.winRoute.bulkReliquaryDeposits, 1, JSON.stringify(this.winRoute));
});

Then("the win route used zero single-item RQ deposits", function () {
  assert.ok(this.winRoute);
  assert.equal(this.winRoute.singleReliquaryDeposits, 0, JSON.stringify(this.winRoute));
});

Then("the win route uses fewer than {float} transitions per heirloom", function (maximum) {
  assert.ok(this.winRoute);
  const heirlooms = Object.values(world.items)
    .filter((item) => item.treasure && item.phase !== 2).length;
  assert.ok(this.winRoute.traversals / heirlooms < maximum, JSON.stringify(this.winRoute));
});

Then("both endings remain independently available", function () {
  assert.equal(this.game.state.room, "grandHall");
  assert.equal(this.game.getFlag("bellRung"), true);
  assert.equal(this.game.getFlag("heirloomsTransformed"), true);
  assert.equal(this.game.getFlag("floorDoorOpen"), true);
  assert.equal(this.game.has("clockTalisman"), true);
  assert.equal(this.game.getFlag("partII"), undefined);
  const snapshot = this.game.snapshot();
  const front = createGame(world);
  front.restore(snapshot);
  assert.match(front.send("south"), /You keep walking/);
  assert.equal(front.state.won, true);
  assert.equal(front.state.score, this.game.state.score + 25);
  const gary = createGame(world);
  gary.restore(snapshot);
  assert.match(gary.send("down"), /FREEEEDOMMM/);
  assert.equal(gary.state.won, false);
  assert.equal(gary.getFlag("partII"), true);
  assert.equal(gary.state.score, this.game.state.score);
});
Then("the player rank contains {string}", function (rank) {
  assert.match(this.game.rank(), new RegExp(rank, "i"));
});

Then("item {string} is destroyed", function (item) {
  assert.equal(this.game.roomOf(item), null);
});

Then("item {string} is open", function (item) {
  assert.equal(this.game.item(item).open, true);
});

Then("item {string} is closed", function (item) {
  assert.equal(this.game.item(item).open, false);
});

Then("item {string} is worn in slot {string}", function (item, slot) {
  const worn = this.game.item(item);
  assert.equal(worn.worn, true);
  assert.equal(worn.wearSlot, slot);
  assert.equal(this.game.equipped(slot)?.id, item);
});

Then("item {string} is not worn", function (item) {
  assert.notEqual(this.game.item(item).worn, true);
});

Then("item {string} is unlit", function (item) {
  assert.equal(this.game.item(item).lit, false);
});

Then("the inventory load is {int}", function (load) {
  assert.equal(this.game.inventoryLoad(), load);
});

Then("the inventory capacity is {int}", function (capacity) {
  assert.equal(this.game.inventoryCapacity(), capacity);
});

Then("the sysop menu command is {string}", function (command) {
  assert.equal(command, SYSOP_MENU_COMMAND);
  assert.match(renderSysopMenu(), /== SYSOP MENU ==/);
});

Then("the sysop menu unlock passwords are {string}", function (passwords) {
  assert.deepEqual(SYSOP_MENU_PASSWORDS, passwords.split(","));
  for (const password of SYSOP_MENU_PASSWORDS) assert.equal(isSysopMenuPassword(`::${password}`), true);
  assert.equal(isSysopMenuPassword("::wrong"), false);
  assert.equal(SYSOP_MENU_DISCOVERY_MESSAGE,
    "You've discovered the sysop menu. Please invoke it the first time with your password via ::<password>");
  assert.deepEqual(sysopMenuAction("::", false), {
    handled: true, unlocked: false, message: SYSOP_MENU_DISCOVERY_MESSAGE,
  });
  assert.deepEqual(sysopMenuAction("::win", false), {
    handled: true, unlocked: false, message: SYSOP_MENU_DISCOVERY_MESSAGE,
  });
  assert.deepEqual(sysopMenuAction("::werdna", false), {
    handled: true, unlocked: true, showMenu: true,
  });
  assert.deepEqual(sysopMenuAction("::", true), {
    handled: true, unlocked: true, showMenu: true,
  });
  assert.equal(sysopMenuAction("::win", true).shortcut?.cmd, "::win");
  assert.deepEqual(sysopMenuAction(":powerup", true), { handled: false, unlocked: true });
});

Then("obsolete win shortcuts are rejected", function () {
  for (const old of [
    "::winquick", "::wintobell", "::wintofoor", "::winquick1",
    "::winmaxbell", "::winmaxfrontd", "::winmaxgary", "::winmax2bell",
  ]) {
    assert.equal(sysopCommand(old), null, old);
    assert.equal(sysopMenuAction(old, true).shortcut, undefined, old);
    assert.ok(!renderSysopMenu().includes(old), old);
  }
});
Then("the sysop command catalog defines {string}", function (commands) {
  assert.deepEqual(SYSOP_COMMANDS.map((entry) => entry.cmd), commands.split(","));
  for (const entry of SYSOP_COMMANDS) {
    assert.equal(typeof entry.name, "string");
    assert.equal(typeof entry.description, "string");
    assert.equal(typeof entry.compoundPrompt, "string");
    assert.ok(entry.compoundPrompt.includes(";"), `${entry.cmd} must prepare a compound prompt`);
  }
});

Then("the sysop menu uses the shared command title description format", function () {
  const menu = renderSysopMenu().split("\n");
  assert.equal(menu[1], "COMMAND | TITLE / DESCRIPTION");
  for (const entry of SYSOP_COMMANDS) {
    assert.ok(menu.some((line) =>
      line.includes(`${entry.cmd.padEnd(14)} | ${entry.name} / ${entry.description}`)));
  }
});

Then("the 2D Baron appears in the Parlor portrait", function () {
  const view = readFileSync(new URL("../../view2d/tilemap.html", import.meta.url), "utf8");
  const start = view.indexOf("function drawBaron(layout)");
  const end = view.indexOf("// Highlight the room", start);
  assert.ok(start >= 0 && end > start);
  const art = view.slice(start, end);
  assert.match(art, /b\.id === "parlor"/);
  assert.doesNotMatch(art, /b\.id === "betweenWalls"/);
  assert.match(art, /ctx\.strokeRect/);
  assert.match(view, /drawBaron\(layout\);\s*drawReachable\(layout\);\s*drawItemIcons\(layout\)/);
  assert.match(view, /const wasAtBaron = gary === "parlor"/);
  assert.match(view, /<b>Study diary<\/b>[\s\S]*<b>calling Gary<\/b>/);
});

Then("every hidden compound prompt uses shortest command forms", function () {
  const longForm = /^(?:north|northeast|east|southeast|south|southwest|west|northwest|up|down|open|close|take|place|wear|remove|offer|enter|wait)(?:\s|$)/i;
  for (const entry of SYSOP_COMMANDS) {
    for (const command of entry.compoundPrompt.split(";").map((part) => part.trim())) {
      if (!command.startsWith("{{")) assert.doesNotMatch(command, longForm, `${entry.cmd}: ${command}`);
    }
  }
});

Then("every hidden prompt avoids an explicit take immediately before direct use", function () {
  for (const entry of SYSOP_COMMANDS) {
    const commands = entry.compoundPrompt.split(";").map((part) => part.trim());
    for (let index = 0; index < commands.length - 1; index += 1) {
      const take = commands[index].match(/^t (\S+)$/);
      if (take) {
        assert.ok(!new RegExp(`^(?:u|read) ${take[1]}$`).test(commands[index + 1]),
          `${entry.cmd}: ${take[1]}`);
      }
    }
  }
});

Given("the player is awaiting self-fire survival", function () {
  this.game.setFlag("selfFireAwaitingSurvival", true);
});

Given("the self-dousing source {string} is ready", function (source) {
  if (["water", "jug"].includes(source)) {
    this.game.moveItem("milkJug", "inventory");
    this.game.item("milkJug").filled = true;
    return;
  }
  if (source === "milk") {
    this.game.moveItem("milk", "inventory");
    return;
  }
  if (source === "wine") {
    this.game.moveItem("wineBottle", "inventory");
    this.game.item("wineBottle").open = true;
    return;
  }
  throw new Error(`Unknown self-dousing source: ${source}`);
});

Then("command {string} behaves exactly like {string}", function (firstCommand, secondCommand) {
  const snapshot = this.game.snapshot();
  const first = createGame(world);
  first.restore(snapshot);
  const second = createGame(world);
  second.restore(snapshot);
  assert.equal(first.send(firstCommand), second.send(secondCommand));
  const firstSnapshot = first.snapshot();
  const secondSnapshot = second.snapshot();
  delete firstSnapshot.previousCommand;
  delete secondSnapshot.previousCommand;
  assert.deepEqual(firstSnapshot, secondSnapshot);
});

Then("every hidden prompt uses globally unique one-word targets", function () {
  assert.deepEqual(Object.keys(world.itemShortNames).sort(), Object.keys(world.items).sort());
  assert.deepEqual(Object.keys(world.roomShortNames).sort(), Object.keys(world.rooms).sort());
  const aliases = [
    ...Object.values(world.itemShortNames),
    ...Object.values(world.roomShortNames),
  ];
  assert.ok(aliases.every((alias) => /^[a-z0-9]+$/.test(alias)),
    "every canonical alias must be one lowercase word");
  assert.equal(new Set(aliases).size, aliases.length, "canonical aliases must be globally unique");

  const itemGame = createGame(world);
  for (const id of Object.keys(world.items)) itemGame.moveItem(id, "inventory");
  for (const [id, alias] of Object.entries(world.itemShortNames)) {
    assert.equal(itemGame.find(alias)?.id, id, `${alias} must resolve uniquely to ${id}`);
  }
  for (const [id, alias] of Object.entries(world.roomShortNames)) {
    const game = createGame(world);
    game.send("Jeb");
    game.setFlag("__noChaos");
    game.setFlag("oakLightAligned");
    game.moveItem("wingedShoes", "inventory");
    game.item("wingedShoes").worn = true;
    game.moveItem("talisman", "inventory");
    game.item("talisman").worn = true;
    game.send(`fly ${alias}`);
    assert.equal(game.state.room, id, `${alias} must resolve to ${id}`);
  }

  for (const shortcut of SYSOP_COMMANDS) {
    for (const command of expandSysopCommand(shortcut, this.game).split(";").map((part) => part.trim())) {
      const parsed = parse(command);
      if (parsed.verb === "go" && command.startsWith("g ")) {
        assert.ok(!/\s/.test(parsed.dobj), `${shortcut.cmd}: ${command}`);
      }
    }
  }
});

Then("hidden shortcuts replace the editable command prompt without executing", function () {
  const ui = readFileSync(new URL("../../js/ui.js", import.meta.url), "utf8");
  assert.match(ui, /sysopMenuAction\(command, sysopMenuUnlocked\)/);
  assert.match(ui, /persistSysopMenuUnlock\(game, action\)/);
  assert.match(ui, /if \(action\.showMenu\)/);
  assert.match(ui, /mainEntry\.setValue\(expandSysopCommand\(action\.shortcut, game\)\)/);
  assert.match(ui, /input\.setSelectionRange\(input\.value\.length, input\.value\.length\)/);
  assert.equal(sysopCommand("::"), null);
  assert.equal(sysopCommand(":powerup"), null);
});

Then("no sysop command uses the removed su command", function () {
  for (const entry of SYSOP_COMMANDS) assert.doesNotMatch(entry.compoundPrompt, /\bsu(?:do)?\b/i);
  assert.match(this.game.send("su"), /don't know the word/i);
});

Then("the path from the current room to {string} is {string}", function (room, path) {
  assert.equal(pathToRoom(this.game, room).join("; "), path);
});

Then("long commands shorten as:", function (table) {
  for (const { long, short } of table.hashes()) assert.equal(shortestCommand(long), short);
});

Then("sysop command {string} omits {string}", function (command, omitted) {
  const shortcut = sysopCommand(command);
  assert.ok(shortcut, `Unknown sysop command: ${command}`);
  assert.ok(!expandSysopCommand(shortcut, this.game).split("; ").includes(omitted));
});

Then("sysop command {string} includes {string}", function (command, included) {
  const shortcut = sysopCommand(command);
  assert.ok(shortcut, `Unknown sysop command: ${command}`);
  assert.ok(expandSysopCommand(shortcut, this.game).split("; ").includes(included));
});

Then("sysop command {string} includes {string} exactly once", function (command, included) {
  const shortcut = sysopCommand(command);
  assert.ok(shortcut, `Unknown sysop command: ${command}`);
  const steps = expandSysopCommand(shortcut, this.game).split("; ");
  assert.equal(steps.filter((step) => step === included).length, 1, command);
});

Then("sysop command {string} contains sequence {string}", function (command, sequence) {
  const shortcut = sysopCommand(command);
  assert.ok(shortcut, `Unknown sysop command: ${command}`);
  assert.ok(expandSysopCommand(shortcut, this.game).includes(sequence));
});

Then("item {string} is absent from game state", function (item) {
  assert.equal(this.game.item(item), null);
});

Then("item {string} recognizes name {string}", function (item, name) {
  assert.ok(this.game.item(item)?.names?.includes(name), `${item} does not recognize ${name}`);
});

Then("sysop access is session-only in the text game and the 2D view", function () {
  const ui = readFileSync(new URL("../../js/ui.js", import.meta.url), "utf8");
  const map = readFileSync(new URL("../../view2d/tilemap.html", import.meta.url), "utf8");
  for (const [name, src] of [["ui.js", ui], ["tilemap.html", map]]) {
    assert.doesNotMatch(src, /localStorage\.setItem\([^)]*(SYSOP|sysop|magic-menu)/, `${name} must not remember the unlock`);
    assert.doesNotMatch(src, /localStorage\.getItem\([^)]*(SYSOP|sysop|MAGIC|magic-menu)/, `${name} must not read a remembered unlock`);
    assert.doesNotMatch(src, /getFlag\(\s*["']sysopMenuUnlocked/, `${name}: the saved game flag must not open the menu`);
    assert.match(src, /removeItem\((SYSOP_MENU_UNLOCK_KEY|"blackwood-sysop-menu-unlocked-v1")\)/, `${name} wipes the legacy unlock`);
    assert.match(src, /removeItem\((LEGACY_MAGIC_MENU_UNLOCK_KEY|"blackwood-magic-menu-unlocked-v1")\)/, `${name} wipes the older unlock`);
  }
  const fnBody = (src, name) => src.slice(src.indexOf(`function ${name}(`), src.indexOf("\n}", src.indexOf(`function ${name}(`)));
  assert.match(fnBody(ui, "newGame"), /sysopMenuUnlocked = false;/);
  assert.match(fnBody(ui, "restartPartTwo"), /sysopMenuUnlocked = false;/);
  assert.match(map.slice(map.indexOf("function restartGame("), map.indexOf("function restartGame(") + 600), /sysopUnlocked = false;/);
  assert.match(ui, /sysopMenuUnlocked = modeHandoff\.sysopUnlocked === true;/);
  assert.match(map, /sysopUnlocked = handoff\.sysopUnlocked === true;/);
});

Then("public INFO does not reveal sysop commands", function () {
  const help = this.game.send("info");
  for (const entry of SYSOP_COMMANDS) assert.ok(!help.includes(entry.cmd));
  assert.ok(!help.includes(SYSOP_MENU_COMMAND));
});

Then("every required family item is in the reliquary", function () {
  for (const [id, definition] of Object.entries(world.items)) {
    if (definition.treasure) assert.equal(this.game.roomOf(id), "reliquary", id);
  }
});

Then("every required family item is inside the Doomsday Clock", function () {
  for (const [id, definition] of Object.entries(world.items)) {
    if (definition.treasure) assert.equal(this.game.roomOf(id), "clockTalisman", id);
  }
});

Then("the BM Watch can view every Part I room", function () {
  this.game.moveItem("backwardsWatch", "inventory");
  const originalRoom = this.game.state.room;
  for (const [id, room] of Object.entries(world.rooms)) {
    if (room.phase === 2) continue;
    const seenBefore = this.game.getFlag(`seen:${id}`);
    const output = this.game.send(`look in watch at ${world.roomShortNames[id]}`);
    assert.match(output, /BM WATCH/i, id);
    assert.match(output, new RegExp(room.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), id);
    assert.equal(this.game.state.room, originalRoom, id);
    assert.equal(this.game.getFlag(`seen:${id}`), seenBefore, id);
  }
});

Then("the required family item count is {int}", function (count) {
  assert.equal(REQUIRED_FAMILY_ITEM_COUNT, count);
  assert.equal(this.game.world.config.requiredFamilyItemCount, count);
  assert.equal(Object.values(this.game.world.items).filter((item) => item.treasure).length, count);
});

Then("the required family items are exactly {string}", function (items) {
  const expected = items.split(",").sort();
  const actual = Object.entries(this.game.world.items)
    .filter(([, item]) => item.treasure)
    .map(([id]) => id)
    .sort();
  assert.deepEqual(actual, expected);
});

Then("item {string} is not a required family heirloom", function (item) {
  assert.equal(!!this.game.world.items[item]?.treasure, false);
  assert.equal(this.game.world.items[item]?.points, undefined);
});

Then("item {string} has heirloom deposit value {int}", function (item, points) {
  assert.equal(this.game.world.items[item]?.treasure, true);
  assert.equal(this.game.world.items[item]?.points, points);
});

Then("the required heirloom deposit total is {int}", function (points) {
  const total = Object.values(this.game.world.items)
    .filter((item) => item.treasure)
    .reduce((sum, item) => sum + (item.points || 0), 0);
  assert.equal(total, points);
});

Then("the Hall Bedroom has exactly one required heirloom", function () {
  const containingRoom = (item) => {
    let location = item.loc;
    const seen = new Set();
    while (location && !seen.has(location)) {
      if (world.rooms[location]) return location;
      seen.add(location);
      location = world.items[location]?.loc;
    }
    return null;
  };
  const heirlooms = Object.entries(world.items)
    .filter(([, item]) => item.treasure && containingRoom(item) === "hallBedroom")
    .map(([id]) => id);
  assert.deepEqual(heirlooms, ["familyRing"]);
});

Then("the player-facing heirloom catalogs and icons match the required set", function () {
  const expected = Object.entries(world.items)
    .filter(([, item]) => item.treasure)
    .map(([id]) => id)
    .sort();
  const parseJavascriptCatalog = (relativePath) => {
    const source = readFileSync(new URL(relativePath, import.meta.url), "utf8");
    const body = source.match(/const HEIRLOOMS = \[([\s\S]*?)\n\s*\];/)?.[1];
    assert.ok(body, `Missing HEIRLOOMS catalog in ${relativePath}`);
    return [...body.matchAll(/\["([^"]+)"/g)].map((match) => match[1]).sort();
  };
  assert.deepEqual(parseJavascriptCatalog("../../js/howto.js"), expected);
  assert.deepEqual(parseJavascriptCatalog("../../view2d/tilemap.html"), expected);

  const generator = readFileSync(new URL("../../tools/gen-firefly-icons.py", import.meta.url), "utf8");
  const generated = [...generator.matchAll(
    /^\s*\("([^"]+)",\s+"heirlooms\/[^"]+\.png"/gm,
  )].map((match) => match[1]).sort();
  assert.deepEqual(generated, expected);

  const versions = JSON.parse(readFileSync(new URL("../../versions.json", import.meta.url), "utf8"));
  const manifested = versions.CONTENT_FILES
    .filter((path) => path.startsWith("view2d/icons/heirlooms/"))
    .map((path) => path.split("/").at(-1).replace(/\.png$/, ""))
    .sort();
  const rendered = expected.filter((id) =>
    existsSync(new URL(`../../view2d/icons/heirlooms/${id}.png`, import.meta.url)));
  assert.deepEqual(manifested, rendered);
  const tilemap = readFileSync(new URL("../../view2d/tilemap.html", import.meta.url), "utf8");
  for (const id of LANE10_HEIRLOOMS) {
    assert.match(tilemap, new RegExp(`\\["${id}",\\s*"[^"]+"`), `${id} needs an emoji fallback`);
  }
  for (const retired of ["batSightMirror", "backwardsWatch", "candlestick", "xrayGoggles"]) {
    assert.equal(existsSync(
      new URL(`../../view2d/icons/heirlooms/${retired}.png`, import.meta.url),
    ), false, retired);
  }
  assert.ok(versions.CONTENT_FILES.includes("view2d/icons/equipment/xrayGoggles.png"));
  assert.equal(existsSync(
    new URL("../../view2d/icons/equipment/xrayGoggles.png", import.meta.url),
  ), true);
});

Then("the static 2D rooms show the redesigned and Lane 8 item placements", function () {
  const data = JSON.parse(readFileSync(new URL("../../view2d/roomdata.json", import.meta.url), "utf8"));
  const ids = (room) => data[room].items.map((item) => item.id).sort();
  assert.deepEqual(ids("diningRoom"), ["candelabraFrame", "candlestick"]);
  assert.deepEqual(ids("hallBedroom"),
    ["bedsideLamp", "familyRing", "hallBed", "hallMirror", "mirrorShard", "nightDrawer", "nightTable"]);
  assert.deepEqual(ids("study"), ["backwardsWatch", "desk", "diary", "studyDrawer"]);
  assert.deepEqual(ids("belfry"), ["belfryBats", "belfryBellRope", "bell", "xrayGoggles"]);
  assert.deepEqual(ids("betweenWalls"), ["blackwoodHammer"]);
  assert.deepEqual(ids("nursery"), ["musicBox", "tinyKey", "wallpaper"]);

  const entries = (room, expected) => {
    const expectedIds = new Set(expected.map((item) => item.id));
    const actual = data[room].items
      .filter((item) => expectedIds.has(item.id))
      .map(({ id, label, kind }) => ({ id, label, kind }))
      .sort((a, b) => a.id.localeCompare(b.id));
    assert.deepEqual(actual, expected.slice().sort((a, b) => a.id.localeCompare(b.id)), room);
  };
  entries("mineGallery", [
    { id: "minersLocker", label: "miners' locker", kind: "scenery" },
  ]);
  entries("waylampClearing", [
    { id: "stream", label: "stream", kind: "scenery" },
    { id: "upsideDownCampfire", label: "upside-down campfire", kind: "scenery" },
  ]);
  entries("cheeseGrotto", [
    { id: "demogorgonzola", label: "demogorgonzola", kind: "fixture" },
  ]);
  entries("avClubDen", [
    { id: "cabinetRadio", label: "cabinet radio", kind: "container" },
    { id: "portableTransistorRadio", label: "portable transistor radio", kind: "takeable" },
  ]);
  entries("planetarium", [
    { id: "projector", label: "projector", kind: "scenery" },
  ]);
  entries("mapRoom", [
    { id: "stellarMap", label: "stellar map", kind: "takeable" },
  ]);
  entries("shack", [
    { id: "alphabetWall", label: "alphabet wall", kind: "scenery" },
    { id: "kidsDrawing", label: "kid's drawing", kind: "takeable" },
  ]);
  entries("below", [
    { id: "lowerPanel", label: "lower panel", kind: "container" },
    { id: "magentaGem", label: "magenta gem", kind: "takeable" },
    { id: "yellowGem", label: "yellow gem", kind: "takeable" },
  ]);
  entries("parlor", [
    { id: "baronMunchhausen", label: "baron", kind: "scenery" },
    { id: "coalStack", label: "coal", kind: "scenery" },
  ]);
  entries("kitchen", [
    { id: "fridge", label: "fridge", kind: "container" },
    { id: "milkJug", label: "empty milk jug", kind: "takeable" },
    { id: "limburgerCheese", label: "limburger", kind: "takeable" },
    { id: "epoissesCheese", label: "époisses", kind: "takeable" },
    { id: "munsterCheese", label: "munster", kind: "takeable" },
    { id: "microwave", label: "microwave", kind: "container" },
    { id: "microwaveDial", label: "microwave dial", kind: "scenery" },
  ]);
  entries("landing", [
    { id: "marbleBust", label: "marble bust", kind: "scenery" },
    { id: "bustNose", label: "nose", kind: "scenery" },
  ]);
  entries("roof", [
    { id: "gargoylePuffCheeks", label: "puff-cheeked gargoyle", kind: "fixture" },
    { id: "gargoyleNosePinch", label: "nose-pinching gargoyle", kind: "fixture" },
    { id: "gargoyleRearGuard", label: "rear-guarding gargoyle", kind: "fixture" },
    { id: "gargoyleFarGazing", label: "far-gazing gargoyle", kind: "fixture" },
    { id: "rustedWeathervane", label: "rusted weathervane", kind: "takeable" },
  ]);
  entries("hedgeMazeLoop", [
    { id: "photoPieceB", label: "photo piece b", kind: "takeable" },
  ]);
  entries("privy", [
    { id: "photoPieceC", label: "photo piece c", kind: "takeable" },
  ]);
  entries("library", [
    { id: "rottingBook", label: "rotting book", kind: "fixture" },
  ]);
  entries("wineCellar", [
    { id: "corkscrew", label: "corkscrew", kind: "takeable" },
    { id: "wineBottle", label: "wine bottle", kind: "takeable" },
  ]);
});

Then("item {string} is lit", function (item) {
  assert.equal(this.game.item(item).lit, true);
});

Then("item {string} has fuel {int}", function (item, fuel) {
  assert.equal(this.game.item(item).fuel, fuel);
});

Then("item {string} has no finite fuel", function (item) {
  assert.equal(this.game.item(item).fuel, undefined);
});

Then("the default name uses three distinct twelve-entry pools", function () {
  const parts = world.config.defaultPlayerNameParts;
  for (const pool of [parts.titles, parts.moods, parts.garments]) {
    assert.equal(pool.length, 12);
    assert.equal(new Set(pool).size, 12);
  }
  assert.ok(parts.titles.includes("Captain"));
  assert.equal(composeDefaultPlayerName(parts, () => 0), "Professor Spooky McPoopypants");
  assert.equal(composeDefaultPlayerName(parts, () => 0.999), "Inspector Gassy Tootleggings");
  const sequence = [0.1, 0.1, 0.1];
  assert.equal(composeDefaultPlayerName(parts, () => sequence.shift()),
    "Doctor Craptastic Elastic");
});

Then("every recurring flavor pool has twelve distinct entries and cycles without repetition", function () {
  assert.deepEqual(Object.keys(CYCLING_FLAVOR_POOLS), [
    "hunger", "deflect",
    "stageIntros0", "stageIntros1", "stageIntros2", "stageIntros3",
    "therapyAsides",
    "signoffs0", "signoffs1", "signoffs2", "signoffs3",
    "waterOffers", "mushroomHigh",
    "mushroomRevelations", "highReactions",
    "sickBurp", "sickBarf", "sickFart", "sickPoop",
    "foreshadowEarly", "foreshadowMid", "foreshadowOpen",
    "lightning", "lightningInvitations", "packageOpenings",
    "mushroomRegrowth", "dragonRebukes",
    "gargoylePuffCheeks", "gargoyleNosePinch", "gargoyleRearGuard", "gargoyleFarGazing",
  ]);
  for (const [name, pool] of Object.entries(CYCLING_FLAVOR_POOLS)) {
    assert.equal(pool.length, 12, `${name} must have exactly twelve entries`);
    assert.equal(new Set(pool.map((entry) => JSON.stringify(entry))).size, 12,
      `${name} entries must be distinct`);
    const sequence = Array.from({ length: 13 }, () => world.nextFlavor(this.game, name));
    assert.equal(new Set(sequence.slice(0, 12).map((entry) => JSON.stringify(entry))).size, 12,
      `${name} repeated before completing its cycle`);
    assert.deepEqual(sequence[12], sequence[0], `${name} did not restart after twelve entries`);
  }
  const restored = createGame(world);
  restored.restore(this.game.snapshot());
  for (const [name, pool] of Object.entries(CYCLING_FLAVOR_POOLS)) {
    assert.deepEqual(world.nextFlavor(restored, name), pool[1],
      `${name} did not preserve its cycle counter across restore`);
  }
});

Then("flag {string} is false", function (flag) {
  assert.equal(this.game.getFlag(flag), false);
});

Then("flag {string} is unset", function (flag) {
  assert.equal(this.game.getFlag(flag), undefined);
});

Then("flag {string} equals {int}", function (flag, expected) {
  assert.equal(this.game.getFlag(flag), expected);
});

Then("flag {string} equals {string}", function (flag, expected) {
  assert.equal(this.game.getFlag(flag), expected);
});

Then("flag {string} is positive", function (flag) {
  assert.ok((this.game.getFlag(flag) || 0) > 0);
});

Then("the output equals {string}", function (text) {
  assert.equal(this.output, text);
});

Then("the output does not match {string}", function (pattern) {
  assert.doesNotMatch(this.output, new RegExp(pattern, "i"));
});

Then("the letter has no hard line breaks", function () {
  assert.doesNotMatch(this.game.item("letter").text, /[\r\n]/);
});

Then("every manor room has searchable detail and narrow ASCII art", function () {
  for (const [id, room] of Object.entries(world.rooms)) {
    if (room.realm) continue;
    assert.ok(typeof room.searchDesc === "string" || typeof room.searchDesc === "function",
      `${id} must define closer-inspection detail`);
    assert.equal(typeof room.art, "string", `${id} must define ASCII room art`);
    assert.ok(room.art.trim().length > 0, `${id} room art must not be empty`);
    assert.ok(Math.max(...room.art.split("\n").map((line) => line.length)) <= 32,
      `${id} room art must fit the narrow transcript`);
  }
});

Then("every manor room declares implicit IN and OUT routing", function () {
  const manorRooms = Object.fromEntries(
    Object.entries(world.rooms).filter(([, room]) => !room.realm));
  assert.deepEqual(
    Object.keys(world.implicitNavigation).sort(),
    Object.keys(manorRooms).sort(),
  );
  for (const [id, route] of Object.entries(world.implicitNavigation)) {
    assert.ok(Object.hasOwn(route, "in"), `${id} must declare IN routing`);
    assert.ok(Object.hasOwn(route, "out"), `${id} must declare OUT routing`);
  }
});

Then("these room descriptions contain uppercase interactables:", function (table) {
  for (const row of table.hashes()) {
    const rawDescription = world.rooms[row.room].desc;
    const description = typeof rawDescription === "function"
      ? rawDescription(this.game)
      : rawDescription;
    for (const label of row.labels.split(",")) {
      assert.ok(description.includes(label), `${row.room} must emphasize ${label}`);
    }
  }
});

Then("these Gary lines are mechanical:", function (table) {
  for (const [line] of table.raw()) {
    assert.equal(world.garyTurnInfo(this.game, line).llmOk, false, line);
  }
});

Then("these Gary lines are conversational:", function (table) {
  for (const [line] of table.raw()) {
    const info = world.garyTurnInfo(this.game, line);
    assert.equal(info.llmOk, true, line);
    assert.equal(typeof info.playerLine, "string");
    assert.ok(info.situation && typeof info.situation.bill === "string");
  }
});

Then("Gary turn {string} has a meter tail", function (line) {
  assert.match(world.garyTurnInfo(this.game, line).tail, /Meter's at \$/);
});

Then("Gary turn {string} is mechanical", function (line) {
  assert.equal(world.garyTurnInfo(this.game, line).llmOk, false);
});

Then("Gary did not add a charge", function () {
  assert.equal(this.game.getFlag("phoneBill") || 0, this.billBefore);
});

Then("the crisis line never reaches Gary's model", function () {
  assert.equal(world.garyTurnInfo(this.game, this.playerLine).llmOk, false);
});

Then("Gary's phone ranks are:", function (table) {
  for (const row of table.hashes()) {
    assert.match(world.phoneRank(Number(row.cents)), new RegExp(row.rank, "i"));
  }
});

Then("the accumulated output contains {string} {int} times", function (text, count) {
  const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  assert.equal((this.accumulatedOutput.match(new RegExp(escaped, "gi")) || []).length, count);
});

Then("Dreadmaw's rebuke burns the player or launches them to the front gate", function () {
  const burned = this.game.getFlag("onFire") === true && this.game.state.room === "dragonCaveMouth";
  const launched = this.game.state.room === "gate"
    && (this.game.getFlag("dragonInjuries") || 0) > 0
    && /crash|crater/i.test(this.output);
  assert.ok(burned || launched, this.output);
});

Then("the troll riddle uses real line breaks", function () {
  assert.doesNotMatch(this.output, /\\n/);
  assert.ok(this.output.split("\n").includes("Old crowns, old bones, and something more."));
  assert.ok(this.output.split("\n").includes("What fills a dragon's hidden store?"));
});

Then("digestive status has {int} turns and phase {string}", function (remaining, phase) {
  const status = world.digestiveStatus(this.game);
  assert.ok(status, "digestive status must be active");
  assert.equal(status.remaining, remaining);
  assert.equal(status.name, phase);
});

Then("fire status has {int} turns", function (remaining) {
  const status = world.fireStatus(this.game);
  assert.ok(status, "fire status must be active");
  assert.equal(status.remaining, remaining);
});

Then("headlamp status has {int} turn(s)", function (remaining) {
  const status = world.headlampStatus(this.game);
  assert.ok(status, "headlamp status must be active");
  assert.equal(status.remaining, remaining);
});

Then("light status is permanent", function () {
  assert.deepEqual(world.lightStatus(this.game), { permanent: true });
});

Then("light status has {int} turn(s)", function (remaining) {
  assert.deepEqual(world.lightStatus(this.game), { remaining });
});

Then("light status is inactive", function () {
  assert.equal(world.lightStatus(this.game), null);
});

Then("vision status has {int} turn(s)", function (remaining) {
  assert.deepEqual(world.visionStatus(this.game), { permanent: false, remaining });
});

Then("flight status has {int} turn(s)", function (remaining) {
  assert.deepEqual(world.flightStatus(this.game), { permanent: false, remaining });
});

Then("vision status is permanent", function () {
  assert.deepEqual(world.visionStatus(this.game), { permanent: true });
});

Then("flight status is permanent", function () {
  assert.deepEqual(world.flightStatus(this.game), { permanent: true });
});

Then("the inline bowel status matches the current digestive state", function () {
  const status = world.digestiveStatus(this.game);
  assert.ok(status, "digestive status must be active");
  assert.match(this.output, new RegExp(`${status.percent}%`));
  assert.match(this.output, new RegExp(`~${status.remaining} turns to blast`));
});

Then("every sickness event drawing is marked as non-wrapping output", function () {
  const artBlocks = this.accumulatedOutput.split(MAP_MARK).filter((_, index) => index % 2 === 1);
  for (const marker of ["B U R P", "B L E A R G H", "F O O M P", "S P L U R T"]) {
    assert.ok(artBlocks.some((block) => block.includes(marker)), `${marker} must be in an art block`);
  }
});

Then("the map sprocket holes are column-aligned", function () {
  const map = this.output.split(MAP_MARK)[1];
  assert.ok(map, "Expected MAP output");
  const rows = map.split("\n");
  const sprocketRows = rows.filter((row) => row.startsWith("  o  "));
  assert.ok(sprocketRows.length > 2, "Expected multiple sprocket-hole rows");
  assert.deepEqual([...new Set(rows.map((row) => row.length))], [rows[0].length]);
  assert.deepEqual([...new Set(sprocketRows.map((row) => row.indexOf("o")))], [2]);
  assert.deepEqual([...new Set(sprocketRows.map((row) => row.lastIndexOf("o")))],
    [sprocketRows[0].lastIndexOf("o")]);
});

Then("the output contains regex {string} exactly {int} time", function (pattern, count) {
  assert.equal((this.output.match(new RegExp(pattern, "g")) || []).length, count);
});

Then("the output contains none of:", function (table) {
  for (const [text] of table.raw()) assert.ok(!this.output.includes(text), text);
});

// end manor.steps.js
