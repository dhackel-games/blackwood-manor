// engine.steps.js Copyright (c) 2026:dhackel-games. All Rights Reserved. Do Not Distribute.
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { After, Before, Given, Then, When } from "@cucumber/cucumber";
import { createGame } from "../../js/core.js";
import { clean as garyClean, isLocalPage } from "../../js/gary-brain.js";
import { HUD_SLOT_DEFINITIONS, HudSlot } from "../../js/hud.js";
import {
  bugReportDescription,
  bugReportUrl,
  DEFAULT_ISSUE_DESCRIPTION,
} from "../../js/issue-report.js";
import {
  GARY_VOICE_PRESETS,
  estimatedSpeechDurationMs,
  garyVoiceProfile,
  pickGaryVoice,
} from "../../js/gary-voice.js";
import { parse, splitCommands } from "../../js/parser.js";
import { VERSION, APP_VERSION, BUILD, COPYRIGHT } from "../../js/version.js";

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

When('I send "say {string}"', function (words) {
  this.output = this.game.send(`say "${words}"`);
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
  const packageJson = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8"));
  // The clean number we monitor stays locked to the App Store marketing version.
  assert.equal(APP_VERSION, packageJson.version);
  // Apple-style "version (build)" so the on-screen badge mirrors App Store Connect exactly.
  assert.equal(VERSION, `${COPYRIGHT} ${APP_VERSION} (build ${BUILD})`);
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

Then("the HUD has inventory, bowel pressure, sickness phase, mushroom, vision, flight, fire, and light indicators", function () {
  const slots = new Map(HUD_SLOT_DEFINITIONS.map((slot) => [slot.id, slot]));
  assert.equal(typeof slots.get("inventory").emoji, "function");
  assert.equal(slots.get("bm").emoji, "💩");
  assert.equal(slots.get("sick").emoji, "🤮");
  assert.equal(slots.get("high").emoji, "🍄");
  assert.equal(slots.get("vision").emoji, "👁️");
  assert.equal(slots.get("flight").emoji, "🪽");
  assert.equal(slots.get("fire").emoji, "🔥");
  assert.equal(slots.get("light").emoji, "💡");
});

Then("every HUD status is a HudSlot with an emoji and calculation", function () {
  for (const definition of HUD_SLOT_DEFINITIONS) {
    const slot = new HudSlot(definition);
    assert.equal(slot.id, definition.id);
    assert.equal(slot.emoji, definition.emoji || "");
    assert.equal(typeof slot.calculate, "function");
  }
});

Then("the sound-effects toggle is leftmost in the HUD slots and explains its state", function () {
  const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
  const ui = readFileSync(new URL("../../js/ui.js", import.meta.url), "utf8");
  assert.match(html, /id=["']hud-slots["']>\s*<button[^>]+id=["']sound-toggle["']/);
  assert.match(ui, /Sound effects off — click to turn on/);
  assert.match(ui, /Sound effects on — click to mute/);
  assert.match(ui, /setAttribute\("aria-pressed", String\(!sfxMuted\)\)/);
});

Then("the bowel meter has no trailing solid cap", function () {
  const definition = HUD_SLOT_DEFINITIONS.find((slot) => slot.id === "bm");
  const value = definition.calculate({
    game: this.game,
    world: { digestiveStatus: () => ({ percent: 50 }) },
  });
  assert.doesNotMatch(value, /▌/);
});

Then("the static control boxes are half size with readable text", function () {
  const css = readFileSync(new URL("../../css/style.css", import.meta.url), "utf8");
  assert.match(css, /#controls button\s*\{[^}]*min-width:\s*1\.6rem[^}]*min-height:\s*1\.25rem/s);
  assert.match(css, /#controls button\s*\{[^}]*font-size:\s*0\.8rem/s);
});

Then("a successful restore updates the HUD before returning", function () {
  const ui = readFileSync(new URL("../../js/ui.js", import.meta.url), "utf8");
  assert.match(ui,
    /if \(low === "restore"\)[\s\S]*?const restored = loadGame\(game\)[\s\S]*?if \(restored\) updateHud\(\)/);
});

Then("the inventory HUD shows {string} with {string}", function (emoji, value) {
  const definition = HUD_SLOT_DEFINITIONS.find((slot) => slot.id === "inventory");
  assert.ok(definition, "Missing inventory HUD slot");
  assert.equal(definition.emoji({ game: this.game, world: this.game.world }), emoji);
  assert.equal(definition.calculate({ game: this.game, world: this.game.world }), value);
});

Then("the page has a {string} touch command", function (direction) {
  const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
  assert.match(html, new RegExp(`data-cmd=["']${direction}["']`));
});

Then("the page has a {string} prefill control", function (value) {
  const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
  assert.match(html, new RegExp(`data-prefill=["']${value}["']`));
});

Then("the page has an icon-only Bug button", function () {
  const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
  assert.match(html, /<button[^>]+id=["']bug-report["'][^>]+aria-label=["']report a bug on GitHub["'][^>]*>\s*🪲\s*<\/button>/);
});

Then("bug reports include the current room in the issue title", function () {
  const url = new URL(bugReportUrl("Hall Bedroom"));
  assert.equal(url.searchParams.get("title"), 'Room "Hall Bedroom" Blackwood Manor issue');
  const ui = readFileSync(new URL("../../js/ui.js", import.meta.url), "utf8");
  assert.match(ui, /bugReportUrl\(game\.room\(\)\.name, description\)/);
});

Then("clicking the Bug button uses the default issue description", function () {
  const url = new URL(bugReportUrl("Hall Bedroom", DEFAULT_ISSUE_DESCRIPTION));
  assert.equal(url.searchParams.get("body"), "Describe issue here");
  const ui = readFileSync(new URL("../../js/ui.js", import.meta.url), "utf8");
  assert.match(ui, /openBugReport\(DEFAULT_ISSUE_DESCRIPTION\)/);
});

Then("a Bug command uses its phrase as the issue description", function () {
  const description = "the mirror shows two of me";
  assert.equal(bugReportDescription(`bug ${description}`), description);
  assert.equal(bugReportDescription("bug"), "");
  assert.equal(bugReportDescription("buggy"), null);
  const url = new URL(bugReportUrl("Hall Bedroom", description));
  assert.equal(url.searchParams.get("title"), 'Room "Hall Bedroom" Blackwood Manor issue');
  assert.equal(url.searchParams.get("body"), description);
  const ui = readFileSync(new URL("../../js/ui.js", import.meta.url), "utf8");
  assert.ok(ui.indexOf("bugReportDescription(cmd)") < ui.indexOf("game.send(cmd)"));
});

Then("Gary's send arrow is visually doubled without resizing its button", function () {
  const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
  const css = readFileSync(new URL("../../css/style.css", import.meta.url), "utf8");
  assert.match(html, /<button[^>]+id=["']phone-go["'][^>]+aria-label=["']send to Gary["'][^>]*>\s*<span[^>]+>\s*↑\s*<\/span>\s*<\/button>/);
  assert.match(css, /#phone-go span\s*\{[^}]*transform:\s*scale\(2\)/s);
});

Then("Gary's circular voice toggle contains a speaker icon", function () {
  const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
  assert.match(html, /<div[^>]+id=["']phone-avatar["'][^>]*>\s*🔊\s*<\/div>/);
});

Then("Gary offers robot and human voice icons", function () {
  const expected = [
    ["computer-male", "Computer male", "Fred", "🤖♂️"],
    ["computer-female", "Computer female", "Kathy", "🤖♀️"],
    ["australian-male", "Australian male", "Lee", "👨"],
    ["australian-female", "Australian female", "Karen", "👩"],
  ];
  const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
  const voices = expected.map(([, , name], index) => ({
    name,
    lang: index < 2 ? "en-US" : "en-AU",
  }));
  assert.deepEqual(GARY_VOICE_PRESETS.map(({ id, label }) => [id, label]),
    expected.map(([id, label]) => [id, label]));
  for (const [id, label, voiceName, icon] of expected) {
    assert.match(html, new RegExp(`<option value=["']${id}["'] title=["']${label}["']>${icon}</option>`));
    assert.equal(garyVoiceProfile(id).label, label);
    assert.equal(pickGaryVoice(voices, id).name, voiceName);
  }
});

Then("Gary remembers the selected voice preset", function () {
  const ui = readFileSync(new URL("../../js/ui.js", import.meta.url), "utf8");
  assert.match(ui, /localStorage\.getItem\(GARY_VOICE_PRESET_KEY\)/);
  assert.match(ui, /localStorage\.setItem\(GARY_VOICE_PRESET_KEY, garyVoicePreset\)/);
});

Then("Australian presets remain distinct when only the female accent is installed", function () {
  const voices = [
    { name: "Karen", lang: "en-AU" },
    { name: "Daniel", lang: "en-GB" },
  ];
  assert.equal(pickGaryVoice(voices, "australian-male").name, "Daniel");
  assert.equal(pickGaryVoice(voices, "australian-female").name, "Karen");
  assert.equal(pickGaryVoice([voices[0]], "australian-male"), null);
});

Then("browser speech accumulates finalized phrases until explicit submission", function () {
  const ui = readFileSync(new URL("../../js/ui.js", import.meta.url), "utf8");
  assert.match(ui, /recognition\.continuous = true/);
  assert.match(ui, /webTranscript \+= text\.trim\(\) \+ " "/);
  assert.match(ui, /webTranscript \+= webPartial\.trim\(\) \+ " "/);
  assert.match(ui, /if \(listening\) webRestartTimer = setTimeout\(beginWebRecognition, 100\)/);
  assert.match(ui, /const text = \(webTranscript \+ webPartial\)\.trim\(\)/);
});

Then("END CALL disables and shows progress until Gary finishes speaking", function () {
  const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
  const css = readFileSync(new URL("../../css/style.css", import.meta.url), "utf8");
  const ui = readFileSync(new URL("../../js/ui.js", import.meta.url), "utf8");
  assert.match(html, /<button[^>]+id=["']phone-end["'][^>]*><span>END CALL<\/span><\/button>/);
  assert.match(css, /#phone-end\.closing::before\s*\{[^}]*animation:\s*end-call-progress/s);
  assert.match(ui, /phoneEnd\.disabled = true/);
  assert.match(ui, /Promise\.all\(\[speechDone, wait\(duration\)\]\)/);
  assert.match(ui, /Promise\.all\(\[speechDone, wait\(duration\)\]\)\.then\(\(\) => \{\s*endCallUI\(\)/s);
  assert.match(ui, /if \(onCall\)[\s\S]*finishPhoneCall\(out\)/);
  assert.ok(estimatedSpeechDurationMs("One two three.", 1) >= 1400);
});

Then("the movement controls are labeled In and Out", function () {
  const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
  assert.match(html, /<button[^>]+data-cmd=["']in["'][^>]*>\s*In\s*<\/button>/);
  assert.match(html, /<button[^>]+data-cmd=["']out["'][^>]*>\s*Out\s*<\/button>/);
});

Then("the iOS wrapper opens new-window web links externally", function () {
  const swift = readFileSync(new URL("../../../ios/Sources/BlackwoodApp.swift", import.meta.url), "utf8");
  assert.match(swift, /WKUIDelegate/);
  assert.match(swift, /navigationAction\.targetFrame == nil/);
  assert.match(swift, /UIApplication\.shared\.open\(url\)/);
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
