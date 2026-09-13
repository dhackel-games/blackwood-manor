// engine.steps.js. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-12.067:acoven.
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { After, Before, Given, Then, When } from "@cucumber/cucumber";
import { createGame } from "../../js/core.js";
import { HELP_TEXT } from "../../js/commands.js";
import { clean as garyClean, isLocalPage } from "../../js/gary-brain.js";
import { HUD_SLOT_DEFINITIONS, HudSlot, hudStateSummary } from "../../js/hud.js";
import {
  bugReportBody,
  bugReportDescription,
  bugReportUrl,
  createBugTrace,
  DEFAULT_ISSUE_DESCRIPTION,
  formatCommandHistory,
  MAX_BUG_HISTORY_CHARS,
  recordBugCommand,
} from "../../js/issue-report.js";
import {
  GARY_VOICE_PRESETS,
  estimatedSpeechDurationMs,
  garyVoiceProfile,
  pickGaryVoice,
} from "../../js/gary-voice.js";
import { parse, splitCommands } from "../../js/parser.js";
import { VERSION, APP_VERSION, BUILD, CONTENT_VERSION, COPYRIGHT } from "../../js/version.js";

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
  assert.match(HELP_TEXT, /get\/take\/grab <thing>\/all \| Take \//);
  assert.match(HELP_TEXT, /say\/talk <words\/person> \| Speak \//);
  assert.match(HELP_TEXT, /use\/wear\/eat\/drink <thing> \| Use \//);
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

Then("the copyright-version is exact", function () {
  const packageJson = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8"));
  const versionSource = readFileSync(new URL("../../js/version.js", import.meta.url), "utf8");
  const design = readFileSync(new URL("../../DESIGN.md", import.meta.url), "utf8");
  // The clean number we monitor stays locked to the App Store marketing version.
  assert.equal(APP_VERSION, packageJson.version);
  // Apple-style "version (build)" so the on-screen badge mirrors App Store Connect exactly.
  assert.equal(VERSION, `${COPYRIGHT} ${APP_VERSION} (build ${BUILD})`);
  const [year, month, day] = APP_VERSION.split(".");
  assert.equal(CONTENT_VERSION,
    Number(`${year}${month.padStart(2, "0")}${day.padStart(2, "0")}${BUILD.padStart(3, "0")}`));
  assert.match(versionSource.split("\n")[0], new RegExp(
    `^// version\\.js\\. Copyright \\(c\\) dhackel-games\\. All Rights Reserved\\. ` +
    `2026\\.\\.\\.\\d{4}-\\d{2}-\\d{2}\\.${BUILD.padStart(3, "0")}:[a-z0-9_-]+\\.$`));
  assert.match(design, /### Source-file identity header/);
  assert.match(design, /YYYY-MM-DD\.BBB:\{last editor\}/);
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
  const body = bugReportBody({ description: DEFAULT_ISSUE_DESCRIPTION });
  const url = new URL(bugReportUrl("Hall Bedroom", body));
  assert.equal(url.searchParams.get("body").split("\n")[0], "Describe issue here");
  const ui = readFileSync(new URL("../../js/ui.js", import.meta.url), "utf8");
  assert.match(ui, /openBugReport\(DEFAULT_ISSUE_DESCRIPTION\)/);
});

Then("a Bug command uses its phrase as the issue description", function () {
  const description = "the mirror shows two of me";
  assert.equal(bugReportDescription(`bug ${description}`), description);
  assert.equal(bugReportDescription("bug"), "");
  assert.equal(bugReportDescription("buggy"), null);
  const body = bugReportBody({ description });
  const url = new URL(bugReportUrl("Hall Bedroom", body));
  assert.equal(url.searchParams.get("title"), 'Room "Hall Bedroom" Blackwood Manor issue');
  assert.equal(url.searchParams.get("body").split("\n")[0], description);
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
    description: "the mirror shows two of me",
    turns: trace.turns,
    origin: trace.origin,
    commands: trace.commands,
    hud,
    inventory: ["BRASS KEY", "CANDLE (WORN)"],
  });
  assert.match(body,
    /^the mirror shows two of me\n\n2 turns from page reload: east; take rope; again; bug the mirror shows two of me/m);
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
});

Then("overlong bug histories preserve both ends and mark the omission", function () {
  const commands = Array.from({ length: 1000 }, (_, index) => `command-${index}`);
  const formatted = formatCommandHistory(commands);
  assert.ok(formatted.length <= MAX_BUG_HISTORY_CHARS);
  assert.match(formatted, /^command-0;/);
  assert.match(formatted, /middle history omitted for URL length/);
  assert.match(formatted, /command-999$/);
});

Then("both send arrows are visually doubled and bold without resizing their buttons", function () {
  const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
  const css = readFileSync(new URL("../../css/style.css", import.meta.url), "utf8");
  assert.match(html, /<button[^>]+id=["']go["'][^>]+aria-label=["']submit command["'][^>]*>\s*<span[^>]+>\s*↑\s*<\/span>\s*<\/button>/);
  assert.match(html, /<button[^>]+id=["']phone-go["'][^>]+aria-label=["']send to Gary["'][^>]*>\s*<span[^>]+>\s*↑\s*<\/span>\s*<\/button>/);
  assert.match(css, /\.entry-submit span\s*\{[^}]*font-weight:\s*900[^}]*transform:\s*scale\(2\)/s);
});

Then("Gary's circular voice toggle contains a speaker icon", function () {
  const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
  assert.match(html, /<button[^>]+id=["']phone-avatar["'][^>]+type=["']button["'][^>]*>\s*🔊\s*<\/button>/);
});

Then("both entry rows place the microphone left of the text field and submit arrow", function () {
  const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
  assert.match(html, /id=["']inputline["'][\s\S]*id=["']prompt["'][\s\S]*id=["']mic["'][\s\S]*id=["']cmd["'][\s\S]*id=["']go["']/);
  assert.match(html, /class=["']phone-inputline["'][\s\S]*id=["']phone-mic["'][\s\S]*id=["']phone-cmd["'][\s\S]*id=["']phone-go["']/);
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
  assert.match(ui, /recognition\.continuous = true/);
  assert.match(ui, /webTranscript \+= text\.trim\(\) \+ " "/);
  assert.match(ui, /webTranscript \+= webPartial\.trim\(\) \+ " "/);
  assert.match(ui, /if \(listening\) webRestartTimer = setTimeout\(beginWebRecognition, 100\)/);
  assert.match(ui, /const text = \(webTranscript \+ webPartial\)\.trim\(\)/);
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

Then("action shortcuts occupy two equally wide rows beside movement", function () {
  const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
  const css = readFileSync(new URL("../../css/style.css", import.meta.url), "utf8");
  const rows = [...html.matchAll(/<div class=["']verb-row["']>([\s\S]*?)<\/div>/g)];
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map((row) => (row[1].match(/<button\b/g) || []).length), [4, 5]);
  assert.match(rows[1][1], /data-cmd=["']inventory["'][\s\S]*data-cmd=["']map["'][\s\S]*data-cmd=["']call["']/);
  assert.ok(html.indexOf('class="movement-controls"') < html.indexOf('class="verbs"'));
  assert.match(css, /#controls\s*\{[^}]*grid-template-columns:\s*auto minmax\(0, 28rem\)/s);
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

Then("Version reports cached and GitHub.io content through the native bridge", function () {
  const ui = readFileSync(new URL("../../js/ui.js", import.meta.url), "utf8");
  const app = readFileSync(new URL("../../../ios/Sources/BlackwoodApp.swift", import.meta.url), "utf8");
  const updater = readFileSync(new URL("../../../ios/Sources/WebContent.swift", import.meta.url), "utf8");
  assert.match(ui, /low === "ver" \|\| low === "version"/);
  assert.match(ui, /nativeContent\.postMessage\(\{ action: "version" \}\)/);
  assert.match(ui, /versionText\(\).*Cached content version:.*GitHub\.io content version:/s);
  assert.match(ui, /window\.__activeBuildLabel/);
  assert.match(app, /ucc\.add\(updaterBridge, name: "content"\)/);
  assert.match(app, /case "version":[\s\S]*contentUpdater\.versionLabels/);
  assert.match(app, /window\.__activeBuildLabel =/);
  assert.match(updater, /func versionLabels\(completion:[\s\S]*fetchRemoteRelease/);
  assert.match(updater, /appendingPathComponent\("js\/version\.js"\)/);
});

Then("Reload seeds the local cache and refreshes differing GitHub.io content", function () {
  const ui = readFileSync(new URL("../../js/ui.js", import.meta.url), "utf8");
  const app = readFileSync(new URL("../../../ios/Sources/BlackwoodApp.swift", import.meta.url), "utf8");
  const updater = readFileSync(new URL("../../../ios/Sources/WebContent.swift", import.meta.url), "utf8");
  assert.match(ui, /low === "reload" \|\| low === "refresh"/);
  assert.match(ui, /nativeContent\.postMessage\(\{ action: "refresh" \}\)/);
  assert.match(ui, /url\.searchParams\.set\("_bmrefresh", Date\.now\(\)\.toString\(\)\)/);
  assert.match(ui, /window\.location\.replace\(url\.toString\(\)\)/);
  assert.match(app, /case "refresh":[\s\S]*ensureCacheFromBundle\(\)[\s\S]*checkForUpdate/);
  assert.match(updater, /func checkForUpdate\(completion:/);
  assert.match(updater, /remote\.sortKey > localKey/);
  assert.match(app, /schemeHandler = AppSchemeHandler\([\s\S]*contentStore\.cacheRoot/);
});

Then("a changed app manifest offers an iOS update", function () {
  const app = readFileSync(new URL("../../../ios/Sources/BlackwoodApp.swift", import.meta.url), "utf8");
  const updater = readFileSync(new URL("../../../ios/Sources/WebContent.swift", import.meta.url), "utf8");
  assert.match(updater, /func checkForAppManifestChange/);
  assert.match(updater, /installed != remote/);
  assert.match(app, /A new version of Blackwood Manor is available! Download now\?/);
  assert.match(app, /UIAlertAction\(title: "Okay"/);
  assert.match(app, /UIAlertAction\(title: "Cancel"/);
  assert.match(app, /URL\(string: "itms-beta:\/\/"\)/);
});

Then("local daemon status is announced in the transcript without console noise", function () {
  const ui = readFileSync(new URL("../../js/ui.js", import.meta.url), "utf8");
  const css = readFileSync(new URL("../../css/style.css", import.meta.url), "utf8");
  assert.match(ui, /if \(!s\.nativeApp && s\.provider !== "daemon"\) return;/);
  assert.match(ui, /print\(modelStatusText\(\), garyBrain\.isAvailable\(\) \? "sys ok" : "sys"\)/);
  assert.match(ui, /Lines he actually generates are marked ◆ AI\./);
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
