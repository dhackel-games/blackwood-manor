// engine.steps.js. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-15.102:acoven.
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { After, Before, Given, Then, When } from "@cucumber/cucumber";
import { createGame, parseRestartTarget } from "../../js/core.js";
import { HELP_TEXT } from "../../js/commands.js";
import { clean as garyClean, isLocalPage } from "../../js/gary-brain.js";
import { HUD_SLOT_DEFINITIONS, HudSlot, hudStateSummary } from "../../js/hud.js";
import {
  bugReportBody,
  bugReportDescription,
  bugReportUrl,
  createBugTrace,
  DEFAULT_ISSUE_DESCRIPTION,
  formatGaryDialogue,
  formatCommandHistory,
  MAX_BUG_HISTORY_CHARS,
  recordBugCommand,
  recordBugDialogue,
  updateBugDialogue,
} from "../../js/issue-report.js";
import {
  GARY_VOICE_PRESETS,
  estimatedSpeechDurationMs,
  garyVoiceProfile,
  pickGaryVoice,
} from "../../js/gary-voice.js";
import { parse, splitCommands } from "../../js/parser.js";

const versionMetadata = JSON.parse(
  readFileSync(new URL("../../versions.json", import.meta.url), "utf8"));
const {
  APP_VERSION,
  BUILD,
  CONTENT_VERSION,
  COPYRIGHT,
  LATEST_APP_BUILD_AVAILABLE,
} = versionMetadata;
const VERSION = `${COPYRIGHT} ${APP_VERSION} (build ${BUILD})`;

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

When("I restore that snapshot", function () {
  this.game.restore(this.snapshot);
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

Then("item {string} is unlocked", function (item) {
  assert.equal(this.game.item(item).locked, false);
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

Then("HELP is one alphabetized command-per-line data block", function () {
  const source = readFileSync(new URL("../../js/commands.js", import.meta.url), "utf8");
  assert.match(source, /export const HELP_TEXT = `COMMANDS[\s\S]+`;/);
  assert.match(source, /help\(ctx\)\s*\{[\s\S]*?return HELP_TEXT;\s*\}/);
  const commandLines = HELP_TEXT.split("\n").slice(2, HELP_TEXT.indexOf("\n\n") > -1
    ? HELP_TEXT.slice(0, HELP_TEXT.indexOf("\n\n")).split("\n").length
    : undefined);
  assert.equal(HELP_TEXT.split("\n")[1], "COMMAND | TITLE / DESCRIPTION");
  assert.ok(commandLines.every((line) => line.includes(" | ") && line.includes(" / ")),
    "each command must occupy one command | title / description line");
  const labels = commandLines.map((line) =>
    line.slice(0, line.indexOf(" | ")).replace(/[()]/g, "").split(/[\/,]/)[0].toLowerCase());
  const sorted = [...labels].sort((a, b) => a.localeCompare(b));
  assert.deepEqual(labels, sorted);
  assert.match(HELP_TEXT, /help\/\? \| Help \//);
  assert.match(HELP_TEXT, /\(l\)ook\/e\(x\)amine\/search \| Inspect \//);
  assert.match(HELP_TEXT,
    /\(n\)orth, \(s\)outh, \(e\)ast, \(w\)est, northeast \(ne\), northwest \(nw\), southeast \(se\), southwest \(sw\), \(u\)p, \(d\)own, in, out \| Directions \/ Go that direction\./);
  assert.match(HELP_TEXT, /get\/\(t\)ake\/grab <thing>\/all \| Take \//);
  assert.match(HELP_TEXT, /\(g\)o <room> \| Go \//);
  assert.match(HELP_TEXT, /\(c\)lose\/shut <thing> \| Close \//);
  assert.match(HELP_TEXT, /lock\/\(lk\) <thing> with <key> \| Lock \//);
  assert.match(HELP_TEXT, /unlock\/\(un\) <thing> with <key> \| Unlock \//);
  assert.match(HELP_TEXT, /put\/place <thing> in <container\/slot> \| Put \//);
  assert.match(HELP_TEXT, /say\/talk <words\/person> \| Speak \//);
  assert.match(HELP_TEXT, /\(u\)se\/wear\/don\/eat\/drink <thing> \| Use \//);
  assert.match(HELP_TEXT, /WITH may be shortened to w\//);
  assert.match(HELP_TEXT, /\nCHAINING\n/);
  assert.match(HELP_TEXT, /\nGARY'S HINT LINE\n/);
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

Then("restart command {string} selects Part {int}", function (input, part) {
  assert.equal(parseRestartTarget(input), part);
});

Then("browser startup shows title and AI before asking for the name", function () {
  const ui = readFileSync(new URL("../../js/ui.js", import.meta.url), "utf8");
  const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
  const css = readFileSync(new URL("../../css/style.css", import.meta.url), "utf8");
  assert.match(ui,
    /function beginSession\([\s\S]*showIntroBanner\(\)[\s\S]*completeSessionIntro\(\)/s);
  assert.match(ui,
    /function completeSessionIntro\(\) \{[\s\S]*announceModelCheck\(\)[\s\S]*showNamePrompt\(\)/s);
  assert.match(ui,
    /function showNamePrompt\(\) \{[\s\S]*print\("\\n" \+ game\.startMessage\(\)\)/s);
  assert.match(ui,
    /input\.placeholder = waitingForPrompt[\s\S]*"checking AI…"[\s\S]*"What should we call you\?"[\s\S]*"type command \/ tap button"/s);
  assert.match(ui, /input\.disabled = waitingForPrompt/);
  assert.match(ui, /mainGo\.disabled = waitingForPrompt/);
  assert.match(ui, /hudElement\.hidden = naming/);
  assert.match(ui, /controls\.hidden = naming/);
  assert.match(ui, /navDisclosure\.hidden = naming/);
  assert.match(html, /id=["']hud["'] hidden/);
  assert.match(html, /id=["']controls["'] hidden/);
  assert.match(html, /id=["']nav-disclosure["'][^>]*hidden/);
  assert.match(css, /#hud\[hidden\], #controls\[hidden\], #nav-disclosure\[hidden\]\s*\{\s*display:\s*none/);
  assert.match(ui,
    /\/\/ --- boot ---\s*beginSession\(\{ showSavedNotice: true \}\)/s);
  assert.match(ui,
    /garyBrain\.detect\(\)[\s\S]*modelCheckReady = true;[\s\S]*completeSessionIntro\(\)/s);
});

Then("browser restart handling supports both game parts", function () {
  const ui = readFileSync(new URL("../../js/ui.js", import.meta.url), "utf8");
  assert.match(ui, /const restartTarget = parseRestartTarget\(cmd\)/);
  assert.match(ui,
    /if \(restartTarget\) \{[\s\S]*if \(restartTarget === 2\) restartPartTwo\(\)[\s\S]*else \{[\s\S]*newGame\(\)/s);
  assert.match(ui,
    /function restartPartTwo\(\) \{[\s\S]*game\.restoreCheckpoint\("partII"\)[\s\S]*Restarting Part II/s);
  assert.match(ui,
    /function restartPartTwo\(\) \{[\s\S]*delete game\.state\.flags\.playerName[\s\S]*beginSession\(\{ message: "Restarting Part II\.\.\." \}\)/s);
});

Then("the copyright-version is exact", function () {
  const packageJson = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8"));
  const design = readFileSync(new URL("../../DESIGN.md", import.meta.url), "utf8");
  // The clean number we monitor stays locked to the App Store marketing version.
  assert.equal(APP_VERSION, packageJson.version);
  // Apple-style "version (build)" so the on-screen badge mirrors App Store Connect exactly.
  assert.equal(VERSION, `${COPYRIGHT} ${APP_VERSION} (build ${BUILD})`);
  const [year, month, day] = APP_VERSION.split(".");
  assert.equal(CONTENT_VERSION,
    Number(`${year}${month.padStart(2, "0")}${day.padStart(2, "0")}${BUILD.padStart(3, "0")}`));
  assert.ok(Array.isArray(versionMetadata.CONTENT_FILES));
  assert.match(design, /### Source-file identity header/);
  assert.match(design, /YYYY-MM-DD\.BBB:\{last editor\}/);
});

Then("the package version is the release date", function () {
  const packageJson = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8"));
  assert.equal(packageJson.version, "2026.9.11");
});

Then("the large title art has aligned top strokes", function () {
  const ui = readFileSync(new URL("../../js/ui.js", import.meta.url), "utf8");
  assert.match(ui,
    /` ____  _            _                             _\n \| __ \)\| \| __ _  ___\| \| ____      _____   ___   __\| \|/);
  assert.doesNotMatch(ui, /`  ____  _            _                     _/);
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

Then("the local launcher serves every file with no-store headers", function () {
  const launcher = readFileSync(new URL("../../Play Blackwood Manor.command", import.meta.url), "utf8");
  const server = readFileSync(new URL("../../tools/no-cache-server.py", import.meta.url), "utf8");
  assert.match(launcher, /tools\/no-cache-server\.py/);
  assert.doesNotMatch(launcher, /nohup[^\n]+-m http\.server/);
  assert.match(server, /Cache-Control", "no-store, no-cache, must-revalidate"/);
});

Then("the HUD has inventory, reliquary, bowel pressure, sickness phase, mushroom, vision, flight, fire, and light indicators", function () {
  const slots = new Map(HUD_SLOT_DEFINITIONS.map((slot) => [slot.id, slot]));
  assert.equal(slots.get("score").emoji, "🏆");
  assert.equal(slots.get("score").calculate({ game: { state: { score: 42, turns: 17 } } }), "42/17");
  assert.equal(slots.has("turns"), false);
  assert.equal(typeof slots.get("inventory").emoji, "function");
  assert.equal(slots.get("reliquary").emoji, "💎");
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
    assert.equal(typeof definition.label, "string");
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

Then("the HUD remains one non-wrapping row", function () {
  const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
  const css = readFileSync(new URL("../../css/style.css", import.meta.url), "utf8");
  assert.doesNotMatch(html, /id=["']hud-version["']/);
  assert.match(css, /#hud\s*\{[^}]*flex-wrap:\s*nowrap/s);
  assert.match(css, /#hud-slots\s*\{[^}]*flex-wrap:\s*nowrap[^}]*overflow-x:\s*auto/s);
  assert.match(css, /\.hud-slot\s*\{[^}]*flex:\s*0 0 auto/s);
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
    /if \(low === "restore"\)[\s\S]*?const restored = loadGame\(game\)[\s\S]*?if \(restored\) \{[\s\S]*?updateHud\(\)/);
});

Then("Save and Restore mark the no-takebacks disqualifier", function () {
  const ui = readFileSync(new URL("../../js/ui.js", import.meta.url), "utf8");
  assert.match(ui, /low === "save"[\s\S]*setFlag\("usedSaveRestore", true\)[\s\S]*saveGame\(game\)/);
  assert.match(ui, /low === "restore"[\s\S]*loadGame\(game\)[\s\S]*setFlag\("usedSaveRestore", true\)/);
});

Then("the inventory HUD shows {string} with {string}", function (emoji, value) {
  const definition = HUD_SLOT_DEFINITIONS.find((slot) => slot.id === "inventory");
  assert.ok(definition, "Missing inventory HUD slot");
  assert.equal(definition.emoji({ game: this.game, world: this.game.world }), emoji);
  assert.equal(definition.calculate({ game: this.game, world: this.game.world }), value);
});

Then("the reliquary HUD is hidden", function () {
  const definition = HUD_SLOT_DEFINITIONS.find((slot) => slot.id === "reliquary");
  assert.equal(definition.calculate({ game: this.game, world: this.game.world }), null);
});

Then("the reliquary HUD shows {string}", function (value) {
  const definition = HUD_SLOT_DEFINITIONS.find((slot) => slot.id === "reliquary");
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

Then("the shortcut strip keeps Look, Call, and question-mark Help without Examine or Hint", function () {
  const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
  assert.match(html, /<button[^>]+data-cmd=["']look["'][^>]*>\s*Look\s*<\/button>/);
  assert.match(html, /<button[^>]+data-cmd=["']call["'][^>]*>\s*Call\s*<\/button>/);
  assert.match(html, /<button[^>]+data-cmd=["']help["'][^>]+aria-label=["']help["'][^>]*>\s*\?\s*<\/button>/);
  assert.doesNotMatch(html, /<button[^>]+data-prefill=["']examine /);
  assert.doesNotMatch(html, /<button[^>]+data-cmd=["']hint["']/);
});

Then("the page has an icon-only Bug button", function () {
  const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
  assert.match(html, /<button[^>]+id=["']bug-report["'][^>]+aria-label=["']report a bug on GitHub["'][^>]*>\s*🪲\s*<\/button>/);
});

Then("bug reports include the current room in the issue title", function () {
  const url = new URL(bugReportUrl("Hall Bedroom"));
  assert.equal(url.searchParams.get("title"), 'Room "Hall Bedroom" Blackwood Manor issue');
  const ui = readFileSync(new URL("../../js/ui.js", import.meta.url), "utf8");
  assert.match(ui, /bugReportUrl\(game\.room\(\)\.name, body\)/);
});

Then("clicking the Bug button uses the default issue description", function () {
  const body = bugReportBody({
    version: "Copyright test 1.2.3",
    description: DEFAULT_ISSUE_DESCRIPTION,
  });
  const url = new URL(bugReportUrl("Hall Bedroom", body));
  assert.equal(url.searchParams.get("body").split("\n")[0], "Copyright test 1.2.3");
  assert.equal(url.searchParams.get("body").split("\n")[1], "Describe issue here");
  const ui = readFileSync(new URL("../../js/ui.js", import.meta.url), "utf8");
  assert.match(ui, /openBugReport\(DEFAULT_ISSUE_DESCRIPTION\)/);
});

Then("a Bug command uses its phrase as the issue description", function () {
  const description = "the mirror shows two of me";
  assert.equal(bugReportDescription(`bug ${description}`), description);
  assert.equal(bugReportDescription("bug"), "");
  assert.equal(bugReportDescription("buggy"), null);
  const body = bugReportBody({ version: "Copyright test 1.2.3", description });
  const url = new URL(bugReportUrl("Hall Bedroom", body));
  assert.equal(url.searchParams.get("title"), 'Room "Hall Bedroom" Blackwood Manor issue');
  assert.equal(url.searchParams.get("body").split("\n")[0], "Copyright test 1.2.3");
  assert.equal(url.searchParams.get("body").split("\n")[1], description);
  const ui = readFileSync(new URL("../../js/ui.js", import.meta.url), "utf8");
  assert.ok(ui.indexOf("bugReportDescription(cmd)") < ui.indexOf("game.send(cmd)"));
});

Then("bug reports include the full session trail, HUD state, and inventory", function () {
  const trace = createBugTrace("page reload");
  recordBugCommand(trace, "east");
  recordBugCommand(trace, "  take   rope ");
  recordBugCommand(trace, "again");
  recordBugCommand(trace, "bug the mirror shows two of me");
  trace.turns = 2;
  const game = createGame(fixture());
  const hud = hudStateSummary({ game, world: fixture() });
  const body = bugReportBody({
    version: "Copyright test 1.2.3",
    description: "the mirror shows two of me",
    turns: trace.turns,
    origin: trace.origin,
    commands: trace.commands,
    hud,
    inventory: ["BRASS KEY", "CANDLE (WORN)"],
  });
  assert.match(body,
    /^Copyright test 1\.2\.3\nthe mirror shows two of me\n\n2 turns from page reload: east; take rope; again; bug the mirror shows two of me/m);
  assert.match(body, /\nHUD: Score\/turns: 🏆 0\/0;/);
  assert.match(body, /\nInv: BRASS KEY, CANDLE \(WORN\)$/);
  const decoded = new URL(bugReportUrl("Hall Bedroom", body)).searchParams.get("body");
  assert.equal(decoded, body);
  assert.match(bugReportBody({ origin: "restart" }), /\n\n0 turns from restart:/);

  const ui = readFileSync(new URL("../../js/ui.js", import.meta.url), "utf8");
  assert.match(ui, /createBugTrace\("page reload"\)/);
  assert.match(ui, /bugTrace = createBugTrace\(origin\)/);
  assert.match(ui, /const submitted = cmd/);
  assert.match(ui, /recordBugCommand\(bugTrace, submitted\)[\s\S]*openBugReport/);
  assert.match(ui, /splitCommands\(submitted\)/);
  assert.match(ui, /recordBugCommand\(bugTrace, command\)/);
  assert.match(ui, /if \(!action\.handled\) return false;\s*recordBugCommand\(bugTrace, command\)/);
  assert.match(ui, /bugTrace\.turns \+= Math\.max\(0, game\.state\.turns - turnsBefore\)/);
  assert.match(ui, /hudStateSummary\(\{ game, world \}\)/);
  assert.match(ui, /inventoryForBugReport\(\)/);
  assert.match(ui, /version: Native\.version\(\)/);
  assert.doesNotMatch(ui, /`Version: \$\{Native\.version\(\)\}`/);
});

Then("overlong bug histories preserve both ends and mark the omission", function () {
  const commands = Array.from({ length: 1000 }, (_, index) => `command-${index}`);
  const formatted = formatCommandHistory(commands);
  assert.ok(formatted.length <= MAX_BUG_HISTORY_CHARS);
  assert.match(formatted, /^command-0;/);
  assert.match(formatted, /middle history omitted for URL length/);
  assert.match(formatted, /command-999$/);
});

Then("bug reports include numbered Gary dialogue with compact speaker labels", function () {
  const trace = createBugTrace();
  recordBugDialogue(trace, "gary", "foo");
  recordBugDialogue(trace, "user", "what they asked");
  const response = recordBugDialogue(trace, "gary", "draft response");
  updateBugDialogue(response, "response");
  recordBugDialogue(trace, "user", "additional question");
  recordBugDialogue(trace, "gary", "etc");
  assert.equal(formatGaryDialogue(trace.dialogue, trace.userName),
    "1. gary: foo\n" +
    "user: what they asked\n" +
    "2. g: response\n" +
    "u: additional question\n" +
    "3. g: etc");

  const named = createBugTrace();
  recordBugDialogue(named, "gary", "hello");
  recordBugDialogue(named, "user", "my name is Grace");
  recordBugDialogue(named, "gary", "hello Grace");
  recordBugDialogue(named, "user", "dragon hint please");
  assert.equal(formatGaryDialogue(named.dialogue, named.userName),
    "1. gary: hello\n" +
    "Grace: my name is Grace\n" +
    "2. ga: hello Grace\n" +
    "gr: dragon hint please");

  const body = bugReportBody({
    dialogue: trace.dialogue,
    userName: trace.userName,
  });
  assert.match(body,
    /\n\nGary dialogue:\n1\. gary: foo\nuser: what they asked\n2\. g: response/);

  const ui = readFileSync(new URL("../../js/ui.js", import.meta.url), "utf8");
  assert.match(ui, /if \(onCall\) recordBugDialogue\(bugTrace, "user", submitted\)/);
  assert.match(ui, /const dialogueEntry = recordBugDialogue\(bugTrace, "gary", out\)/);
  assert.match(ui, /updateBugDialogue\(dialogueEntry, spoken\)/);
  assert.match(ui, /dialogue: bugTrace\.dialogue/);
  assert.match(ui, /userName: bugTrace\.userName/);
});

Then("both submit controls use the same extra-thick SVG arrow", function () {
  const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
  const css = readFileSync(new URL("../../css/style.css", import.meta.url), "utf8");
  const arrows = [...html.matchAll(
    /<svg class=["']submit-arrow["'] viewBox=["']0 0 24 24["'][^>]*>\s*<path d=["']M12 2 3 12h5v10h8V12h5L12 2z["']><\/path>\s*<\/svg>/g)];
  assert.equal(arrows.length, 2);
  assert.match(html, /id=["']go["'][^>]+aria-label=["']submit command["']/);
  assert.match(html, /id=["']phone-go["'][^>]+aria-label=["']send to Gary["']/);
  assert.match(css, /\.entry-submit\s*\{[^}]*width:\s*2\.4rem[^}]*height:\s*2\.2rem[^}]*padding:\s*0/s);
  assert.match(css, /\.entry-submit \.submit-arrow\s*\{[^}]*width:\s*1\.65rem[^}]*height:\s*1\.65rem[^}]*fill:\s*currentColor/s);
});

Then("Gary's circular voice toggle contains a speaker icon", function () {
  const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
  assert.match(html, /<button[^>]+id=["']phone-avatar["'][^>]+type=["']button["'][^>]*>\s*🔊\s*<\/button>/);
});

Then("both entry rows place the microphone left of the text field and submit arrow", function () {
  const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
  const css = readFileSync(new URL("../../css/style.css", import.meta.url), "utf8");
  assert.match(html, /id=["']inputline["'][\s\S]*id=["']mic["'][\s\S]*id=["']cmd["'][\s\S]*id=["']go["']/);
  assert.doesNotMatch(html, /id=["']prompt["']/);
  assert.match(html, /class=["']phone-inputline["'][\s\S]*id=["']phone-mic["'][\s\S]*id=["']phone-cmd["'][\s\S]*id=["']phone-go["']/);
  assert.match(css, /#inputline\s*\{[^}]*gap:\s*0\.2rem/s);
  assert.match(css, /\.phone-inputline\s*\{[^}]*gap:\s*0\.2rem/s);
});

Then("both entry rows share text-aware submit styling with custom starter text", function () {
  const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
  const css = readFileSync(new URL("../../css/style.css", import.meta.url), "utf8");
  const ui = readFileSync(new URL("../../js/ui.js", import.meta.url), "utf8");
  assert.equal((html.match(/class=["']entry-submit["']/g) || []).length, 2);
  assert.match(css, /\.entry-submit\s*\{[^}]*background:\s*#020402[^}]*color:\s*var\(--dim\)/s);
  assert.match(css, /\.entry-submit\.has-text\s*\{[^}]*background:\s*var\(--green\)[^}]*color:\s*var\(--bg\)/s);
  assert.match(ui, /function createChatEntry\(\{ field, submit, starterText \}\)/);
  assert.match(ui, /submit\.classList\.toggle\("has-text", field\.value\.trim\(\)\.length > 0\)/);
  assert.match(ui, /starterText: "type command \/ tap button"/);
  assert.match(ui, /starterText: "say something to Gary…"/);
});

Then("game-over restart text links to the latest session start", function () {
  const ui = readFileSync(new URL("../../js/ui.js", import.meta.url), "utf8");
  const css = readFileSync(new URL("../../css/style.css", import.meta.url), "utf8");
  assert.match(ui, /let currentSessionAnchorId = ""/);
  assert.match(ui,
    /function sessionAnchorId\(date\)[\s\S]*date\.getFullYear\(\)[\s\S]*date\.getMonth\(\) \+ 1[\s\S]*date\.getDate\(\)[\s\S]*_` \+[\s\S]*date\.getHours\(\)[\s\S]*date\.getMinutes\(\)[\s\S]*date\.getSeconds\(\)/s);
  assert.match(ui, /anchor\.id = id/);
  assert.match(ui, /currentSessionAnchorId = id/);
  assert.match(ui, /link\.href = `#\$\{currentSessionAnchorId\}`/);
  assert.match(ui, /line\.append\("Type RESTART to play again\. \(Jump to the "\)/);
  assert.match(ui, /link\.textContent = "top"/);
  assert.match(ui,
    /function jumpToSessionStart\(id\)[\s\S]*anchor\.getBoundingClientRect\(\)\.top[\s\S]*transcript\.getBoundingClientRect\(\)\.top[\s\S]*transcript\.scrollTop \+= anchorTop - transcriptTop/s);
  assert.match(ui,
    /link\.addEventListener\("click", \(event\) => \{[\s\S]*event\.preventDefault\(\)[\s\S]*window\.history\.(?:pushState|replaceState)[\s\S]*jumpToSessionStart\(currentSessionAnchorId\)/s);
  assert.match(ui, /line\.append\(link, "\.\)"\)/);
  assert.match(ui, /function newGame[\s\S]*beginSession\(\{ showSavedNotice: true/);
  assert.match(ui, /if \(restored\) \{[\s\S]*markSessionStart\(\)/s);
  assert.match(ui, /\/\/ --- boot ---\s*beginSession\(\{ showSavedNotice: true \}\)/s);
  assert.match(ui, /if \(game\.state\.won\) printRestartPrompt\(\)/);
  assert.match(css, /\.session-restart a\s*\{[^}]*color:\s*var\(--green-bright\)[^}]*text-decoration:\s*underline/s);
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

Then("Gary offers persona and volume controls below his sole mute control", function () {
  const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
  const ui = readFileSync(new URL("../../js/ui.js", import.meta.url), "utf8");
  assert.match(html, /class=["']phone-name["']>\s*Gary\s*<\/div>[\s\S]*id=["']phone-avatar["'][\s\S]*class=["']voice-controls["']/);
  assert.match(html, /id=["']gary-voice["'][\s\S]*class=["']gary-volume-icon["'][^>]*>🔉<\/span>[\s\S]*id=["']gary-volume["'][^>]+type=["']range["'][^>]+min=["']0["'][^>]+max=["']100["']/);
  assert.doesNotMatch(html, /id=["']phone-mute["']|Tap Gary to hear him/);
  assert.doesNotMatch(ui, /phone-mute|Tap Gary to hear him/);
  assert.match(ui, /u\.volume = garyVolume/);
  assert.match(ui, /localStorage\.getItem\(GARY_VOLUME_KEY\)/);
  assert.match(ui, /localStorage\.setItem\(GARY_VOLUME_KEY, String\(garyVolume\)\)/);
  assert.match(ui, /phoneAvatar\.addEventListener\("click", toggleVoice\)/);
});

Then("Gary's help line keeps the game HUD visible", function () {
  const css = readFileSync(new URL("../../css/style.css", import.meta.url), "utf8");
  const ui = readFileSync(new URL("../../js/ui.js", import.meta.url), "utf8");
  assert.match(css, /#hud\s*\{[^}]*z-index:\s*60/s);
  assert.match(css, /#phone\s*\{[^}]*z-index:\s*50[^}]*--phone-hud-offset/s);
  assert.match(ui, /function syncPhoneHudOffset\(\)[\s\S]*getBoundingClientRect\(\)\.bottom/);
  assert.match(ui, /updatePhoneStatus\(\);\s*syncPhoneHudOffset\(\);\s*phone\.hidden = false/);
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
  const css = readFileSync(new URL("../../css/style.css", import.meta.url), "utf8");
  assert.match(ui, /recognition\.continuous = true/);
  assert.match(ui, /webTranscript \+= text\.trim\(\) \+ " "/);
  assert.match(ui, /webTranscript \+= webPartial\.trim\(\) \+ " "/);
  assert.match(ui, /if \(listening\) scheduleWebRecognition\(\)/);
  assert.match(ui, /const text = \(webTranscript \+ webPartial\)\.trim\(\)/);
  assert.match(ui, /targetInput\.placeholder = "listening… tap mic to stop"/);
  assert.match(ui, /function finishListening\(text\)[\s\S]*setEntryValue\(speechTarget, t\)/);
  assert.doesNotMatch(ui, /function finishListening\(text\)[\s\S]{0,220}handle\(t\)/);
  assert.match(css,
    /\.iconbtn\.listening\s*\{[^}]*background:\s*var\(--green\)[^}]*border-color:\s*var\(--green-bright\)[^}]*color:\s*var\(--bg\)/s);
  assert.match(css, /@keyframes micpulse[^}]*rgba\(67,255,122,0\.5\)/s);
});

Then("browser speech retries transient network interruptions", function () {
  const ui = readFileSync(new URL("../../js/ui.js", import.meta.url), "utf8");
  assert.match(ui, /const WEB_NETWORK_RETRY_INITIAL_MS = 1000/);
  assert.match(ui, /const WEB_NETWORK_RETRY_MAX_MS = 8000/);
  assert.match(ui,
    /if \(event\.error === "network"\) \{[\s\S]*Math\.min\(webNetworkRetryDelay \* 2, WEB_NETWORK_RETRY_MAX_MS\)[\s\S]*WEB_NETWORK_RETRY_INITIAL_MS[\s\S]*speechTarget\.placeholder = "speech network interrupted… retrying"[\s\S]*return;/s);
  assert.match(ui,
    /function scheduleWebRecognition\(\) \{[\s\S]*const delay = webNetworkRetryDelay \|\| WEB_RECOGNITION_RESTART_MS[\s\S]*webRestartTimer = setTimeout\(\(\) => \{[\s\S]*beginWebRecognition\(\)[\s\S]*\}, delay\)/s);
  assert.match(ui,
    /recognition\.onresult = \(event\) => \{[\s\S]*webNetworkRetryDelay = 0/s);
  assert.match(ui,
    /function stopListening\(\) \{[\s\S]*clearWebRestartTimer\(\)[\s\S]*webNetworkRetryDelay = 0/s);
  assert.doesNotMatch(ui,
    /if \(event\.error === "network"\) \{[^}]*speechRecognitionFailed/s);
});

Then("END CALL disables and stays visible 1.5 times longer while Gary finishes", function () {
  const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
  const css = readFileSync(new URL("../../css/style.css", import.meta.url), "utf8");
  const ui = readFileSync(new URL("../../js/ui.js", import.meta.url), "utf8");
  assert.match(html, /<button[^>]+id=["']phone-end["'][^>]*><span>END CALL<\/span><\/button>/);
  assert.match(css, /#phone-end\.closing::before\s*\{[^}]*animation:\s*end-call-progress/s);
  assert.match(ui, /phoneEnd\.disabled = true/);
  assert.match(ui, /const closeDelay = Math\.round\(duration \* 1\.5\)/);
  assert.match(ui, /--end-call-duration", `\$\{closeDelay\}ms`/);
  assert.match(ui, /Promise\.all\(\[speechDone, wait\(closeDelay\)\]\)/);
  assert.match(ui, /Promise\.all\(\[speechDone, wait\(closeDelay\)\]\)\.then\(\(\) => \{\s*endCallUI\(\)/s);
  assert.match(ui, /if \(onCall\)[\s\S]*finishPhoneCall\(out\)/);
  assert.ok(estimatedSpeechDurationMs("One two three.", 1) >= 1400);
});

Then("the movement controls form an eight-arrow compass around a center star", function () {
  const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
  const expected = [
    ["northwest", "nw", "↖"], ["north", "n", "↑"], ["northeast", "ne", "↗"], ["west", "w", "←"],
    ["east", "e", "→"], ["southwest", "sw", "↙"], ["south", "s", "↓"], ["southeast", "se", "↘"],
  ];
  for (const [direction, title, arrow] of expected) {
    assert.match(html, new RegExp(
      `<button[^>]+data-cmd=["']${direction}["'][^>]+title=["']${title}["'][^>]*>\\s*${arrow}\\s*</button>`));
  }
  assert.match(html, /<span class=["']compass-center["'][^>]*>\s*✦\s*<\/span>/);
  const css = readFileSync(new URL("../../css/style.css", import.meta.url), "utf8");
  assert.match(css, /#controls \.dpad button\s*\{[^}]*font-size:\s*1\.25rem[^}]*font-weight:\s*900/s);
  assert.match(css, /#controls \.northwest,[\s\S]*#controls \.southeast\s*\{[^}]*display:\s*flex[^}]*align-items:\s*center[^}]*justify-content:\s*center/s);
});

Then("Up, Down, In, and Out use compact directional glyphs", function () {
  const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
  const css = readFileSync(new URL("../../css/style.css", import.meta.url), "utf8");
  assert.match(html, /data-cmd=["']up["'][^>]+title=["']up["'][^>]*>[^<]*<span[^>]*>\s*⇧\s*<\/span>/);
  assert.match(html, /data-cmd=["']down["'][^>]+title=["']down["'][^>]*>[^<]*<span[^>]*>\s*⇩\s*<\/span>/);
  assert.match(html, /data-cmd=["']in["'][\s\S]*?<rect x=["']9["'] y=["']4["'] width=["']12["'] height=["']16["'][\s\S]*?<path d=["']M2 12h15M13 8l4 4-4 4["']/);
  assert.match(html, /data-cmd=["']out["'][\s\S]*?<rect x=["']3\.5["'] y=["']4["'] width=["']11["'] height=["']16["'][\s\S]*?<path d=["']M9 12h14M19 8l4 4-4 4["']/);
  assert.match(css, /#controls \.level-arrow span\s*\{[^}]*font-size:\s*1\.45rem[^}]*font-weight:\s*900/s);
  assert.match(css, /#controls \.portal-icon\s*\{[^}]*max-width:\s*1\.45rem[^}]*stroke-width:\s*1\.3/s);
});

Then("touch-capable movement controls are twenty-five percent larger without widening actions", function () {
  const css = readFileSync(new URL("../../css/style.css", import.meta.url), "utf8");
  assert.match(css,
    /@media \(any-pointer:\s*coarse\)[\s\S]*#controls\s*\{[^}]*--nav-button-size:\s*2\.96875rem[^}]*--action-button-height:\s*2\.96875rem/s);
  assert.match(css,
    /#controls \.dpad\s*\{[^}]*repeat\(3,\s*var\(--nav-button-size\)\)/s);
  assert.match(css,
    /#controls \.vertical-directions\s*\{[^}]*repeat\(2,\s*var\(--nav-button-size\)\)/s);
  assert.match(css,
    /#controls \.verb-row button\s*\{[^}]*height:\s*var\(--action-button-height\)/s);
  assert.doesNotMatch(css,
    /#controls \.verb-row button\s*\{[^}]*width:\s*2\.96875rem/s);
});

Then("the navigation selector sits left of a persistent disclosure control", function () {
  const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
  const css = readFileSync(new URL("../../css/style.css", import.meta.url), "utf8");
  const ui = readFileSync(new URL("../../js/ui.js", import.meta.url), "utf8");
  const picker = /id=["']nav-size-picker["'][\s\S]*?<\/div>\s*<\/div>/.exec(html)?.[0] || "";
  assert.deepEqual(
    [...picker.matchAll(/data-nav-size=["']([123])["']/g)].map((match) => match[1]),
    ["3", "2", "1"]);
  assert.match(picker, /role=["']radiogroup["']/);
  assert.equal((picker.match(/role=["']radio["']/g) || []).length, 3);
  assert.ok(html.indexOf('id="nav-size-picker"') < html.indexOf('class="movement-controls"'));
  assert.match(html,
    /id=["']command-panel["'][^>]+data-collapsed=["']false["'][\s\S]*id=["']controls-content["'][\s\S]*id=["']inputline["'][\s\S]*id=["']nav-disclosure["'][^>]+aria-controls=["']controls-content["'][^>]+aria-expanded=["']true["'][\s\S]*>\s*<span[^>]*>\s*▴\s*<\/span>/);
  assert.ok(html.indexOf('id="controls-content"') < html.indexOf('id="nav-disclosure"'));
  assert.match(css, /#controls\[data-nav-size=["']1["']\][^}]*--nav-button-size:\s*1\.7rem/s);
  assert.match(css, /#controls\[data-nav-size=["']2["']\][^}]*--nav-button-size:\s*2\.375rem/s);
  assert.match(css, /#controls\[data-nav-size=["']3["']\][^}]*--nav-button-size:\s*2\.96875rem/s);
  assert.match(css, /#controls\s*\{[^}]*--nav-picker-width:\s*1\.6875rem/s);
  assert.match(css,
    /#controls \.nav-size-picker button\s*\{[^}]*width:\s*var\(--nav-picker-width\)[^}]*min-width:\s*var\(--nav-picker-width\)/s);
  assert.match(css,
    /#controls \.nav-size-picker\s*\{[^}]*position:\s*relative[^}]*grid-column:\s*1[^}]*width:\s*var\(--nav-picker-width\)[^}]*height:\s*calc\(var\(--nav-button-size\) \+ var\(--nav-button-size\) \+ var\(--nav-button-size\) \+ 0\.24rem\)[^}]*margin-top:\s*0[^}]*margin-left:\s*-1px/s);
  assert.match(css, /\.nav-size-picker\s*\{[^}]*border:\s*1px solid var\(--dim\)[^}]*border-radius:\s*6px/s);
  assert.match(css, /\.nav-size-picker button\s*\{[^}]*background:\s*transparent[^}]*border:\s*0/s);
  assert.match(css, /\.nav-size-picker::before\s*\{[^}]*width:\s*1px[^}]*background:\s*var\(--dim\)/s);
  assert.match(css, /button\[aria-checked=["']true["']\] \.nav-size-swatch\s*\{[^}]*background:\s*currentColor/s);
  assert.match(css,
    /#command-panel\s*\{[^}]*border:\s*1px solid var\(--dim\)[^}]*border-radius:\s*8px/s);
  assert.match(css,
    /#inputline > \.nav-disclosure\s*\{[^}]*position:\s*absolute[^}]*top:\s*0[^}]*transform:\s*translateY\(-50%\)[^}]*width:\s*2rem[^}]*height:\s*2rem[^}]*background:\s*var\(--bg\)[^}]*border:\s*0[^}]*color:\s*var\(--green-bright\)[^}]*font-size:\s*2rem/s);
  assert.match(css,
    /#inputline > \.nav-disclosure span\s*\{[^}]*transform:\s*translateY\(-3\.5px\)/s);
  assert.match(css,
    /#command-panel\[data-collapsed=["']true["']\] #controls\s*\{\s*display:\s*none/s);
  assert.match(css,
    /#inputline\s*\{[^}]*border-top:\s*1px solid var\(--dim\)/s);
  assert.match(css,
    /#command-panel\[data-collapsed=["']true["']\] #inputline\s*\{\s*border-top:\s*0/s);
  assert.match(css, /#controls\s*\{[^}]*padding:\s*0 0 1\.1rem/s);
  assert.match(css, /#inputline\s*\{[^}]*padding:\s*1\.1rem 0\.4rem 0\.55rem/s);
  assert.match(ui, /localStorage\.getItem\(NAV_SIZE_KEY\)/);
  assert.match(ui, /localStorage\.getItem\(NAV_COLLAPSED_KEY\) === "true"/);
  assert.match(ui, /localStorage\.setItem\(NAV_SIZE_KEY, selected\)/);
  assert.match(ui, /localStorage\.setItem\(NAV_COLLAPSED_KEY, String\(isCollapsed\)\)/);
  assert.match(ui, /commandPanel\.dataset\.collapsed = String\(isCollapsed\)/);
  assert.match(ui, /navDisclosureIcon\.textContent = isCollapsed \? "▾" : "▴"/);
  assert.match(ui,
    /navDisclosure\.addEventListener\("click", \(\) => \{[\s\S]*applyNavCollapsed\(commandPanel\.dataset\.collapsed !== "true", true\)/s);
  assert.match(ui, /matchMedia\?\.\("\(any-pointer: coarse\)"\)/);
  assert.match(ui, /const prefersLargeNav = Native\.isMobileApp\(\) \|\| coarsePointer/);
  assert.match(ui, /const defaultNavSize = prefersLargeNav \? "3" : "1"/);
  assert.match(ui, /setAttribute\("aria-checked", String\(button\.dataset\.navSize === selected\)\)/);
  assert.match(css,
    /@media \(max-width:\s*600px\)[\s\S]*#controls \.nav-size-picker\s*\{[^}]*margin-top:\s*0/s);
});

Then("the compass centers responsively beside edge-aligned action shortcuts", function () {
  const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
  const css = readFileSync(new URL("../../css/style.css", import.meta.url), "utf8");
  const rows = [...html.matchAll(/<div class=["']verb-row["']>([\s\S]*?)<\/div>/g)];
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map((row) => (row[1].match(/<button\b/g) || []).length), [4, 5]);
  assert.match(rows[1][1], /data-cmd=["']inventory["'][\s\S]*data-cmd=["']map["'][\s\S]*data-cmd=["']call["']/);
  assert.ok(html.indexOf('id="nav-size-picker"') < html.indexOf('class="movement-controls"'));
  assert.ok(html.indexOf('class="movement-controls"') < html.indexOf('class="verbs"'));
  assert.match(css,
    /#controls\s*\{[^}]*--picker-to-dpad-gap:\s*0\.2rem[^}]*--movement-to-action-gap:\s*0\.5rem[^}]*--action-controls-min-width:\s*17rem[^}]*--dpad-min-left:\s*calc\(var\(--nav-picker-width\) \+ var\(--picker-to-dpad-gap\)\)[^}]*--dpad-centered-left:\s*calc\(50% - var\(--dpad-half-width\)\)[^}]*--dpad-max-left:\s*calc\([\s\S]*100% - var\(--movement-controls-width\) - var\(--movement-to-action-gap\) -[\s\S]*var\(--action-controls-min-width\)[\s\S]*--dpad-left:\s*clamp\(var\(--dpad-min-left\), var\(--dpad-centered-left\), var\(--dpad-max-left\)\)/s);
  assert.match(css,
    /#controls \.controls-content\s*\{[^}]*display:\s*block/s);
  assert.match(css,
    /#controls \.controls-content\s*\{[^}]*width:\s*calc\(100% \+ 1px\)[^}]*margin-top:\s*-1px/s);
  assert.match(css,
    /#controls \.movement-controls\s*\{[^}]*position:\s*absolute[^}]*top:\s*0[^}]*left:\s*var\(--dpad-left\)/s);
  assert.match(css,
    /#controls \.action-controls\s*\{[^}]*position:\s*absolute[^}]*top:\s*50%[^}]*right:\s*0[^}]*left:\s*calc\(var\(--dpad-left\) \+ var\(--movement-controls-width\) \+ var\(--movement-to-action-gap\)\)[^}]*width:\s*auto[^}]*max-width:\s*none[^}]*transform:\s*translateY\(-50%\)/s);
  assert.match(css,
    /@media \(max-width:\s*600px\)[\s\S]*#controls\s*\{[^}]*--dpad-max-left:\s*calc\(100% - var\(--movement-controls-width\)\)[\s\S]*#controls \.action-controls\s*\{[^}]*position:\s*static[^}]*width:\s*100%[^}]*max-width:\s*none[^}]*margin-top:\s*0\.5rem[^}]*transform:\s*none/s);
  assert.match(css, /#controls \.verbs\s*\{[^}]*width:\s*100%[^}]*min-width:\s*0[^}]*flex-direction:\s*column/s);
  assert.match(css, /#controls \.verb-row\s*\{[^}]*grid-template-columns:\s*repeat\(8,/s);
  assert.match(css, /#controls \.verb-row button\s*\{[^}]*grid-column:\s*span 2/s);
  assert.match(css, /#controls \.verb-row \.compact-action\s*\{\s*grid-column:\s*span 1/s);
});

Then("the iOS wrapper opens new-window web links externally", function () {
  const swift = readFileSync(new URL("../../../ios/Sources/BlackwoodApp.swift", import.meta.url), "utf8");
  assert.match(swift, /WKUIDelegate/);
  assert.match(swift, /navigationAction\.targetFrame == nil/);
  assert.match(swift, /UIApplication\.shared\.open\(url\)/);
});

Then("Version reports local and source content through the native bridge", function () {
  const ui = readFileSync(new URL("../../js/ui.js", import.meta.url), "utf8");
  const native = readFileSync(new URL("../../js/native.js", import.meta.url), "utf8");
  const gary = readFileSync(new URL("../../js/gary-brain.js", import.meta.url), "utf8");
  const app = readFileSync(new URL("../../../ios/Sources/BlackwoodApp.swift", import.meta.url), "utf8");
  const updater = readFileSync(new URL("../../../ios/Sources/WebContent.swift", import.meta.url), "utf8");
  assert.match(ui, /low === "ver" \|\| low === "version"/);
  assert.match(ui, /Native\.post\("content", \{ action: "version" \}\)/);
  assert.match(ui, /const message = Native\.version\(\)/);
  assert.match(native, /export class Native/);
  assert.match(native, /static isMobileApp\(\)/);
  assert.match(native, /static version\(\)/);
  assert.match(native, /`\$\{COPYRIGHT\} Web \$\{APP_VERSION\} \(Build \$\{BUILD\}\)\. `/);
  assert.match(native, /Content: Version \$\{CONTENT_VERSION\}\. Continuous updates\./);
  assert.match(native, /`\$\{COPYRIGHT\} iOS \$\{this\.appInstalledVersion\} \(Build \$\{this\.appInstalledBuild\}\)\. `/);
  assert.match(native, /Content: Local \$\{this\.contentLocal\}\. Source \$\{this\.contentSource \|\| "Unavailable"\}\./);
  assert.doesNotMatch(ui, /window\.webkit.*messageHandlers/);
  assert.doesNotMatch(gary, /window\.webkit.*messageHandlers/);
  assert.match(gary, /Native\.hasBridge\("gary"\)/);
  assert.match(gary, /Native\.post\("gary"/);
  assert.doesNotMatch(ui, /running in browser \(no self-update layer\)|GitHub\.io version: unavailable/);
  assert.match(app, /ucc\.add\(updaterBridge, name: "content"\)/);
  assert.match(app, /case "version":[\s\S]*contentUpdater\.versionLabels/);
  assert.match(app, /CFBundleShortVersionString/);
  assert.match(app, /CFBundleVersion/);
  assert.match(app, /window\.__appInstalledVersion/);
  assert.match(app, /values:\s*\[\s*appInstalledVersion,\s*appInstalledBuild,\s*labels\.contentLocal,\s*labels\.contentSource/s);
  assert.match(updater,
    /func versionLabels\(completion:[\s\S]*store\.cacheRelease \?\? store\.bundleRelease[\s\S]*fetchRemoteRelease/);
  assert.match(updater, /appendingPathComponent\("versions\.json"\)/);
});

Then("the iOS launch banner reports the live content source without a transcript echo", function () {
  const ui = readFileSync(new URL("../../js/ui.js", import.meta.url), "utf8");
  const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
  const css = readFileSync(new URL("../../css/style.css", import.meta.url), "utf8");
  const app = readFileSync(new URL("../../../ios/Sources/BlackwoodApp.swift", import.meta.url), "utf8");
  // On boot the web layer asks the native side for the real remote source version.
  assert.match(ui, /Native\.post\("content", \{ action: "version-banner" \}\)/);
  // The banner-only callback rewrites the existing intro without printing a new line.
  assert.match(ui, /window\.__contentBanner = \(appVersion, appBuild, contentLocalValue, contentSourceValue\) => \{[\s\S]*Native\.setContentVersions\(appVersion, appBuild, contentLocalValue, contentSourceValue\);[\s\S]*refreshIntroBanner\(\);[\s\S]*\};/);
  assert.doesNotMatch(ui, /__appUpdateNotice|iOS App Unavailable/);
  assert.match(ui, /introBannerElement = print\(bannerText\(\), "banner"\)/);
  assert.doesNotMatch(html, /id=["']hud-version["']/);
  assert.doesNotMatch(css, /#hud #hud-version/);
  // Native routes version-banner through versionLabels to the banner-only callback.
  assert.match(app, /case "version-banner":[\s\S]*contentUpdater\.versionLabels/);
  assert.match(app, /"window\.__contentBanner"/);
});

Then("Reload seeds the local cache and refreshes differing GitHub.io content", function () {
  const ui = readFileSync(new URL("../../js/ui.js", import.meta.url), "utf8");
  const app = readFileSync(new URL("../../../ios/Sources/BlackwoodApp.swift", import.meta.url), "utf8");
  const updater = readFileSync(new URL("../../../ios/Sources/WebContent.swift", import.meta.url), "utf8");
  assert.match(ui, /low === "reload" \|\| low === "refresh"/);
  assert.match(ui, /Native\.post\("content", \{ action: "refresh" \}\)/);
  assert.match(ui, /url\.searchParams\.set\("_bmrefresh", Date\.now\(\)\.toString\(\)\)/);
  assert.match(ui, /window\.location\.replace\(url\.toString\(\)\)/);
  assert.match(app, /case "refresh":[\s\S]*ensureCacheFromBundle\(\)[\s\S]*checkForUpdate/);
  assert.match(updater, /func checkForUpdate\(completion:/);
  assert.match(updater, /remote\.sortKey > localKey/);
  assert.match(app, /schemeHandler = AppSchemeHandler\([\s\S]*contentStore\.cacheRoot/);
});

Then("release-channel metadata decides whether a native iOS update is available", function () {
  const app = readFileSync(new URL("../../../ios/Sources/BlackwoodApp.swift", import.meta.url), "utf8");
  const appUpdate = readFileSync(new URL("../../../ios/Sources/AppUpdate.swift", import.meta.url), "utf8");
  const updater = readFileSync(new URL("../../../ios/Sources/WebContent.swift", import.meta.url), "utf8");
  const versionSource = readFileSync(new URL("../../versions.json", import.meta.url), "utf8");
  assert.doesNotMatch(updater, /checkForAppManifestChange|bundledManifestData/);
  assert.match(appUpdate, /https:\/\/itunes\.apple\.com\/lookup/);
  assert.match(appUpdate, /blackwood-manor\/versions\.json/);
  assert.match(appUpdate, /WebContentRelease\.parse\(data\)/);
  assert.match(appUpdate,
    /version\.compare\(installedVersion, options: \.numeric\)/);
  assert.match(appUpdate,
    /static func releaseNumber\(appVersion: String, build: String\)[\s\S]*WebContentRelease\.contentVersion/);
  assert.match(appUpdate, /release\.latestAppBuildAvailable > installedRelease/);
  assert.equal(JSON.parse(versionSource).LATEST_APP_BUILD_AVAILABLE,
    LATEST_APP_BUILD_AVAILABLE);
  assert.match(app,
    /appUpdateChecker\.check\(receiptURL: Bundle\.main\.appStoreReceiptURL\)/);
  assert.match(app, /AppUpdatePromptPolicy\.shouldPresent/);
  assert.match(app, /UIAlertAction\(title: "View Update"/);
  assert.match(app, /UIAlertAction\(title: "Not Now"/);
  assert.match(app, /UIApplication\.shared\.open\(update\.storeURL\)/);
  assert.match(appUpdate, /URL\(string: "itms-beta:\/\/"\)/);
  assert.doesNotMatch(app, /manifest\.json/);
  assert.ok(Number.isSafeInteger(LATEST_APP_BUILD_AVAILABLE));
  assert.ok(LATEST_APP_BUILD_AVAILABLE <= CONTENT_VERSION);
});

Then("local daemon status is announced in the transcript without console noise", function () {
  const ui = readFileSync(new URL("../../js/ui.js", import.meta.url), "utf8");
  const css = readFileSync(new URL("../../css/style.css", import.meta.url), "utf8");
  assert.doesNotMatch(ui, /if \(!s\.nativeApp && s\.provider !== "daemon"\) return;/);
  assert.match(ui, /function announceModelCheck\(\)[\s\S]*modelCheckAnnounced = true/s);
  assert.match(ui, /print\(modelStatusText\(\), garyBrain\.isAvailable\(\) \? "sys ok" : "sys"\)/);
  assert.match(ui, /his lines are marked ◆ AI\./);
  assert.doesNotMatch(ui, /gary scripted|· scripted/);
  assert.doesNotMatch(css, /gary\.scripted|· scripted/);
  assert.doesNotMatch(ui, /console\.log\(p[\s\S]*on-device voice active/);
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

Then("successful TestFlight releases publish verified app availability", function () {
  const script = readFileSync(new URL("../../../ios/release-testflight.sh", import.meta.url), "utf8");
  const verifier = readFileSync(
    new URL("../../../ios/tools/testflight-release.mjs", import.meta.url), "utf8");
  const lockIndex = script.indexOf("acquire_release_lock");
  const archiveIndex = script.indexOf("xcodebuild -project");
  const uploadIndex = script.indexOf("xcrun altool --upload-app");
  const verifyIndex = script.lastIndexOf("node tools/testflight-release.mjs");
  const publishIndex = script.lastIndexOf("versions.LATEST_APP_BUILD_AVAILABLE");
  const finalCommitIndex = script.lastIndexOf('git -C "$REPO_ROOT" commit');
  const finalPushIndex = script.lastIndexOf('git -C "$REPO_ROOT" push origin HEAD:main');
  assert.ok(lockIndex >= 0 && archiveIndex > lockIndex);
  assert.ok(uploadIndex >= 0 && verifyIndex > uploadIndex);
  assert.ok(publishIndex > verifyIndex);
  assert.ok(finalCommitIndex > publishIndex && finalPushIndex > finalCommitIndex);
  assert.match(script, /LOCK_REF="refs\/heads\/\$LOCK_BRANCH"/);
  assert.match(script, /commit-tree/);
  assert.equal((script.match(
    /--force-with-lease="\$LOCK_REF:\$(?:existing|LOCK_COMMIT)"/g) || []).length, 2);
  assert.match(script, /--latest-build/);
  assert.match(script, /CUR > LATEST_BUILD/);
  assert.match(script, /NEXT=\$\(\(LATEST_BUILD \+ 1\)\)/);
  assert.match(script, /ASC_RELEASE_LOCK_TIMEOUT/);
  assert.match(script, /cleanup_failed=1/);
  assert.match(script, /status" -eq 0 && "\$cleanup_failed" -eq 1/);
  assert.match(script, /ASC_BETA_GROUP_(?:ID|NAME)/);
  assert.match(verifier, /process\.env\.ASC_BETA_GROUP_NAME \|\| "BM Testers"/);
  assert.match(verifier, /\/v1\/builds/);
  assert.match(verifier, /processingState/);
  assert.match(verifier, /\/relationships\/builds/);
  assert.match(verifier, /\/betaTesters/);
  assert.match(verifier, /IN_BETA_TESTING/);
  assert.match(verifier, /hasAccessToAllBuilds/);
  assert.match(verifier, /appBuildVersion/);
  assert.match(verifier, /latestUploadedBuildNumber/);
  assert.ok(verifier.indexOf("await waitForInternalAvailability") <
    verifier.lastIndexOf("appBuildVersion("));
});

Then("iOS and Pages derive their deploy identity from CONTENT_VERSION", function () {
  const copy = readFileSync(new URL("../../../ios/copy-web.sh", import.meta.url), "utf8");
  const pages = readFileSync(
    new URL("../../../.github/workflows/pages.yml", import.meta.url), "utf8");
  assert.match(copy, /gen-web-manifest\.mjs"\s+"\$DST"\s*$/m);
  assert.match(pages, /gen-web-manifest\.mjs web\s*$/m);
  assert.doesNotMatch(copy, /git\b[\s\S]*(?:show|rev-parse)/);
  assert.doesNotMatch(pages, /git\b[\s\S]*(?:show|rev-parse)/);
});

Then("the TestFlight release replaces its repository-local build folder", function () {
  const script = readFileSync(new URL("../../../ios/release-testflight.sh", import.meta.url), "utf8");
  assert.match(script, /BUILD_ROOT="build"/);
  assert.match(script, /rm -rf "\$BUILD_ROOT"/);
  assert.match(script, /-derivedDataPath "\$DERIVED_DATA"/);
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
