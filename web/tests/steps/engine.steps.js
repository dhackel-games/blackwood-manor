// engine.steps.js Copyright (c) 2026:dhackel-games. All Rights Reserved. Do Not Distribute.
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { After, Before, Given, Then, When } from "@cucumber/cucumber";
import { createGame } from "../../js/core.js";
import { clean as garyClean, isLocalPage } from "../../js/gary-brain.js";
import { parse, splitCommands } from "../../js/parser.js";
import { VERSION } from "../../js/version.js";

const COPYRIGHT_VERSION =
  "Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-11.0a13:acoven";
const NONE = "[none]";
const EMPTY = "[empty]";

function value(text) {
  if (text === NONE) return null;
  if (text === EMPTY) return "";
  return text.replaceAll("<NL>", "\n").replaceAll("\\u201c", "\u201c");
}

function fixture() {
  return {
    config: { start: "hall", maxCarry: 5 },
    rooms: {
      hall: {
        name: "Hall",
        art: "[HALL ART]",
        desc: "A dusty hall.",
        searchDesc: "Scratches on the floor suggest the locked box has been moved recently.",
        exits: { north: "study", down: "cellar" },
      },
      study: {
        name: "Study",
        art: "[STUDY ART]",
        desc: "A small study.",
        exits: { south: "hall" },
      },
      cellar: {
        name: "Cellar",
        art: "[CELLAR ART]",
        desc: "A damp cellar.",
        dark: true,
        exits: { up: "hall" },
      },
    },
    items: {
      key: {
        names: ["key"],
        adjectives: ["brass"],
        loc: "hall",
        takeable: true,
        desc: "A brass key.",
      },
      desk: { names: ["desk"], loc: "study", fixed: true, desc: "A heavy desk." },
      candle: {
        names: ["candle", "candlestick"],
        adjectives: ["silver"],
        loc: "hall",
        takeable: true,
        lightSource: true,
        lit: false,
        fuel: 5,
        desc: "A silver candle.",
      },
      match: { names: ["match", "matches"], loc: "hall", takeable: true, desc: "A match." },
      box: {
        names: ["box"],
        loc: "hall",
        container: true,
        openable: true,
        open: false,
        locked: true,
        keyId: "key",
        capacity: 3,
        desc: "A small locked box.",
      },
      note: {
        names: ["note"],
        loc: "box",
        takeable: true,
        readable: true,
        text: "It reads: BEWARE THE DARK.",
        desc: "A folded note.",
      },
    },
  };
}

Before(function () {
  this.game = null;
  this.output = "";
  this.snapshot = null;
  this.originalLocation = Object.getOwnPropertyDescriptor(globalThis, "location");
});

After(function () {
  if (this.originalLocation) {
    Object.defineProperty(globalThis, "location", this.originalLocation);
  } else {
    delete globalThis.location;
  }
});

Given("a fresh fixture game", function () {
  this.game = createGame(fixture());
});

Given("a fresh fixture game with a working lever", function () {
  const world = fixture();
  world.items.lever = {
    names: ["lever"],
    loc: "hall",
    fixed: true,
    desc: "A rusty lever.",
    on: {
      pull: (ctx) => {
        ctx.setFlag("leverPulled");
        return "The lever clicks.";
      },
    },
  };
  this.game = createGame(world);
});

Given("a fresh fixture game with carry limit {int}", function (limit) {
  const world = fixture();
  world.config.maxCarry = limit;
  this.game = createGame(world);
});

Given("the player is in fixture room {string}", function (room) {
  this.game.state.room = room;
});

When("I send {string}", function (command) {
  this.output = this.game.send(command);
});

When("I repeatedly send {string} at most {int} times until death", function (command, limit) {
  for (let i = 0; i < limit && !this.game.state.dead; i++) {
    this.output = this.game.send(command);
  }
});

When("I save a game snapshot", function () {
  this.snapshot = this.game.snapshot();
});

When("I restore that snapshot into a fresh fixture game", function () {
  const restored = createGame(fixture());
  restored.restore(this.snapshot);
  this.game = restored;
});

Then("the current room is {string}", function (room) {
  assert.equal(this.game.state.room, room);
});

Then("the current room is not {string}", function (room) {
  assert.notEqual(this.game.state.room, room);
});

Then("item {string} is in {string}", function (item, location) {
  assert.equal(this.game.roomOf(item), location);
});

Then("room {string} contains exactly {string}", function (room, items) {
  assert.deepEqual(
    this.game.itemsIn(room).map((item) => item.id).sort(),
    items.split(",").sort(),
  );
});

Then("inventory contains exactly {string}", function (items) {
  assert.deepEqual(
    this.game.inventory().map((item) => item.id).sort(),
    items.split(",").filter(Boolean).sort(),
  );
});

Then("finding {string} returns item {string}", function (phrase, item) {
  assert.equal(this.game.findItem(phrase).id, item);
});

Then("finding {string} returns nothing", function (phrase) {
  assert.equal(this.game.findItem(phrase), null);
});

Then("the output contains {string}", function (text) {
  assert.match(this.output, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
});

Then("the output matches {string}", function (pattern) {
  assert.match(this.output, new RegExp(pattern, "i"));
});

Then("the output does not contain {string}", function (text) {
  assert.doesNotMatch(this.output, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
});

Then("the output does not start with {string}", function (text) {
  assert.ok(!this.output.startsWith(text));
});

Then("the output contains line {string}", function (line) {
  assert.ok(this.output.split("\n").includes(line), `Missing line "${line}" in:\n${this.output}`);
});

Then("the output does not contain line {string}", function (line) {
  assert.ok(!this.output.split("\n").includes(line), `Unexpected line "${line}" in:\n${this.output}`);
});

Then("the output contains these phrases in order:", function (table) {
  let previous = -1;
  for (const [phrase] of table.raw()) {
    const index = this.output.indexOf(phrase);
    assert.ok(index > previous, `Expected "${phrase}" after index ${previous} in:\n${this.output}`);
    previous = index;
  }
});

Then("the game is dead", function () {
  assert.equal(this.game.state.dead, true);
});

Then("the game is alive", function () {
  assert.equal(this.game.state.dead, false);
});

Then("flag {string} is true", function (flag) {
  assert.equal(this.game.getFlag(flag), true);
});

Then("the turn count is {int}", function (turns) {
  assert.equal(this.game.state.turns, turns);
});

Then("the following commands parse as:", function (table) {
  for (const row of table.hashes()) {
    assert.deepEqual(parse(value(row.input)), {
      verb: value(row.verb),
      dobj: value(row.direct),
      prep: value(row.preposition),
      iobj: value(row.indirect),
    }, row.input);
  }
});

Then("parsing {string} fails with {string}", function (input, error) {
  assert.equal(parse(value(input)).error, error);
});

Then("the following command lines split as:", function (table) {
  for (const row of table.hashes()) {
    const expected = row.commands === NONE ? [] : row.commands.split(" / ");
    assert.deepEqual(splitCommands(value(row.input)), expected, row.input);
  }
});

Then("the copyright-version is exact", function () {
  assert.equal(VERSION, COPYRIGHT_VERSION);
});

Then("the package version is the release date", function () {
  const packageJson = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8"));
  assert.equal(packageJson.version, "2026.9.11");
});

Then("the touch UI has no control-hiding typing state", function () {
  const ui = readFileSync(new URL("../../js/ui.js", import.meta.url), "utf8");
  const css = readFileSync(new URL("../../css/style.css", import.meta.url), "utf8");
  assert.doesNotMatch(ui, /classList\.add\(["']typing["']\)/);
  assert.doesNotMatch(css, /#crt\.typing\s+#controls/);
});

Then("the transcript shrinks and scrolls inside the viewport", function () {
  const css = readFileSync(new URL("../../css/style.css", import.meta.url), "utf8");
  assert.match(css, /#transcript\s*\{[^}]*min-height:\s*0/s);
});

Then("the controls remain pinned inside the viewport", function () {
  const css = readFileSync(new URL("../../css/style.css", import.meta.url), "utf8");
  assert.match(css, /#controls\s*\{[^}]*flex:\s*0 0 auto/s);
});

Then("the page has a {string} touch command", function (direction) {
  const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
  assert.match(html, new RegExp(`data-cmd=["']${direction}["']`));
});

Then("the TestFlight release refreshes the web bundle before generating the Xcode project", function () {
  const script = readFileSync(new URL("../../../ios/release-testflight.sh", import.meta.url), "utf8");
  const copyIndex = script.indexOf("./copy-web.sh");
  const generateIndex = script.indexOf("xcodegen generate");
  assert.ok(copyIndex >= 0, "release script must invoke copy-web.sh");
  assert.ok(generateIndex > copyIndex, "copy-web.sh must run before xcodegen");
});

Then("the iOS app version matches the date-only package version", function () {
  const packageJson = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8"));
  const project = readFileSync(new URL("../../../ios/project.yml", import.meta.url), "utf8");
  const versions = [...project.matchAll(/MARKETING_VERSION:\s*"([^"]+)"/g)].map((match) => match[1]);
  assert.ok(versions.length > 0, "project.yml must define MARKETING_VERSION");
  assert.ok(versions.every((version) => version === packageJson.version),
    `Expected every iOS app version to equal ${packageJson.version}; got ${versions.join(", ")}`);
});

Then("the TestFlight release synchronizes the app version from the package", function () {
  const script = readFileSync(new URL("../../../ios/release-testflight.sh", import.meta.url), "utf8");
  assert.match(script, /require\("\.\.\/web\/package\.json"\)\.version/);
  assert.match(script, /MARKETING_VERSION/);
});

Then("Gary cleaning produces:", function (table) {
  for (const row of table.hashes()) {
    assert.equal(garyClean(value(row.input)), value(row.output), row.input);
  }
});

Then("cleaning a null Gary reply produces an empty string", function () {
  assert.equal(garyClean(null), "");
});

Given("the page protocol is {string} and hostname is {string}", function (protocol, hostname) {
  const resolvedHostname = value(hostname);
  Object.defineProperty(globalThis, "location", {
    value: { protocol, hostname: resolvedHostname, href: `${protocol}//${resolvedHostname}/` },
    configurable: true,
  });
});

Then(/^the page is classified as (local|remote)$/, function (locality) {
  assert.equal(isLocalPage(), locality === "local");
});

// end engine.steps.js
