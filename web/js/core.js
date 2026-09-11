// core.js — game state + rules. DOM-free and content-free. Testable in Node.
//
// Design: the world (rooms/items) is shared, read-only, and may contain handler
// FUNCTIONS (item.on / room.on). Per-game MUTABLE state lives entirely in `state`:
//   - state.items[id] is a deep DATA clone of world.items[id] (handlers stripped),
//     including its live `loc` (roomId | "inventory" | containerId | null).
//   - state.flags holds boolean/other game flags.
// This keeps games isolated without ever cloning functions.

import { parse, splitCommands } from "./parser.js";
import { commands } from "./commands.js";

const DARK_WARNING = "It is pitch black. You are likely to be eaten by a grue.";

const DIRECTION_ORDER = [
  "north", "northeast", "east", "southeast",
  "south", "southwest", "west", "northwest",
  "up", "down", "in", "out",
];
const DIRECTION_SHORT = {
  north: "n", northeast: "ne", east: "e", southeast: "se",
  south: "s", southwest: "sw", west: "w", northwest: "nw",
  up: "u", down: "d", in: "in", out: "out",
};

function cloneData(def, id) {
  const { on, ...data } = def;                 // strip handlers
  const copy = JSON.parse(JSON.stringify(data)); // deep-clone plain data
  copy.id = id;
  return copy;
}

export function createGame(world) {
  const cfg = world.config || {};
  const state = {
    room: cfg.start,
    turns: 0,
    score: 0,
    dead: false,
    won: false,
    flags: {},
    items: {},
  };
  for (const [id, def] of Object.entries(world.items || {})) {
    state.items[id] = cloneData(def, id);
    if (!("loc" in state.items[id])) state.items[id].loc = null;
  }

  const game = { world, state };
  let pending = null;    // one-shot message queued by tick (fuel/darkness)
  let grueKill = false;  // set when a second dark action occurs
  let darkWarningRendered = false;
  let deferStatusBanner = false;
  let describedRoomThisTurn = false;

  // --- lookups ---------------------------------------------------------------
  game.room = () => world.rooms[state.room];
  game.roomDef = (id) => world.rooms[id];
  game.itemsIn = (loc) =>
    Object.values(state.items).filter((it) => it.loc === loc);
  game.inventory = () => game.itemsIn("inventory");
  game.inventoryLoad = () => game.inventory().filter((item) => !item.worn).length;
  game.equipped = (slot) => game.inventory().find((item) => item.worn && (!slot || item.wearSlot === slot)) || null;
  game.roomOf = (id) => (state.items[id] ? state.items[id].loc : undefined);
  game.item = (id) => state.items[id] || null;

  game.visibleItems = () => {
    const out = [...game.inventory(), ...game.itemsIn(state.room)];
    for (const c of [...out]) {
      if (c.container && c.open) out.push(...game.itemsIn(c.id));
    }
    return out;
  };

  game.findItem = (phrase, scope) => {
    if (!phrase) return null;
    const words = phrase.toLowerCase().split(/\s+/).filter(Boolean);
    const noun = words[words.length - 1];
    const adjs = words.slice(0, -1);
    const candidates = scope || game.visibleItems();
    for (const it of candidates) {
      const names = (it.names || []).map((s) => s.toLowerCase());
      const iadj = (it.adjectives || []).map((s) => s.toLowerCase());
      if (names.includes(noun) && adjs.every((a) => iadj.includes(a) || names.includes(a))) {
        return it;
      }
    }
    return null;
  };
  game.find = (phrase, scope) => game.findItem(phrase, scope);

  // --- ctx API for content handlers -----------------------------------------
  game.getFlag = (f) => state.flags[f]; // raw value (numbers/strings/booleans), not coerced
  game.setFlag = (f, v = true) => { state.flags[f] = v; };
  game.has = (id) => state.items[id] && state.items[id].loc === "inventory";
  game.here = (id) => state.items[id] && state.items[id].loc === state.room;
  game.moveItem = (id, to) => { if (state.items[id]) state.items[id].loc = to; };
  game.destroy = (id) => { if (state.items[id]) state.items[id].loc = null; };
  game.addScore = (n) => { state.score += n; };
  const phoneBillLine = () => {
    const b = state.flags.phoneBill;
    if (!b) return "";
    let line = `\nHint Line phone bill: $${(b / 100).toFixed(2)} (Gary got a cut of exactly none of it).`;
    if (typeof world.phoneRank === "function") line += world.phoneRank(b);
    return line;
  };
  game.win = (msg) => {
    state.won = true;
    const badges = typeof world.endBadges === "function" ? (world.endBadges(game) || "") : "";
    return (msg ? msg + "\n\n" : "") +
      `    ****  You have escaped Blackwood Manor alive${state.flags.onFire ? " 🔥" : ""}.  ****\n\n` +
      `Your score is ${state.score} in ${state.turns} turns.\nRank: ${game.rank()}` +
      badges + phoneBillLine();
  };
  game.kill = (msg) => {
    state.dead = true;
    return `${msg}\n\n    ****  You have died.  ****\n\n` +
      `Your score is ${state.score} in ${state.turns} turns.\nRank: ${game.rank()}` +
      phoneBillLine() + `\n\nType RESTART, RESTORE, or QUIT.`;
  };
  game.rank = () => {
    const s = state.score;
    if (s >= 100) return "Master of Blackwood Manor";
    if (s >= 60) return "Seasoned Investigator";
    if (s >= 30) return "Amateur Ghost-Hunter";
    return "Trespasser";
  };

  // --- light / darkness ------------------------------------------------------
  game.activeLights = () => game.visibleItems().filter((i) => i.lightSource && i.lit);
  game.isLit = () => {
    const r = world.rooms[state.room];
    if (!r || !r.dark) return true;
    const enhancedVision = typeof world.hasMushroomVision === "function"
      && world.hasMushroomVision(game);
    // A carried flame, mushroom/XRAY vision, or the permanent Obsidian Eye
    // lets you see in otherwise pitch-black rooms.
    return game.activeLights().length > 0
      || !!state.flags.onFire
      || enhancedVision
      || !!state.flags.darkSight;
  };

  game.availableDirections = () => {
    const room = world.rooms[state.room];
    const directions = Object.entries(room.exits || {})
      .filter(([, exit]) => {
        if (typeof exit === "string") return true;
        const enhancedVision = (state.flags.high || 0) > 0
          || (typeof world.hasMushroomVision === "function" && world.hasMushroomVision(game));
        return enhancedVision || !exit.revealedBy || !!state.flags[exit.revealedBy];
      })
      .map(([direction]) => direction);
    const extra = typeof room.extraDirections === "function"
      ? room.extraDirections(game)
      : (room.extraDirections || []);
    return [...new Set([...directions, ...extra])]
      .sort((a, b) => DIRECTION_ORDER.indexOf(a) - DIRECTION_ORDER.indexOf(b));
  };

  // --- room description ------------------------------------------------------
  game.describeRoom = (force) => {
    if (!game.isLit()) {
      darkWarningRendered = true;
      return DARK_WARNING;
    }
    const r = world.rooms[state.room];
    const first = !state.flags["seen:" + state.room];
    state.flags["seen:" + state.room] = true;
    const verbose = state.flags.__verbose;
    const extended = force || first || verbose;
    let out = r.name.toUpperCase() + "\n";
    if ((force || first) && r.art) out += r.art + "\n";
    if (extended) out += r.desc + "\n";
    // Mushroom and XRAY vision reveal hidden detail on entry and every LOOK.
    const highOn = (state.flags.high || 0) > 0;
    const enhancedVision = typeof world.hasMushroomVision === "function"
      ? world.hasMushroomVision(game)
      : highOn;
    if (enhancedVision) {
      const visionSource = r.highDesc || r.searchDesc;
      const vision = typeof visionSource === "function" ? visionSource(game) : visionSource;
      const label = highOn ? "MUSHROOM VISION" : "XRAY VISION";
      if (vision) out += `${label}\n${vision}\n`;
    }
    const directions = game.availableDirections();
    out += extended
      ? `Directions you can go: ${directions.join(", ") || "nowhere"}\n`
      : `${directions.map((direction) => DIRECTION_SHORT[direction] || direction).join(", ") || "-"}\n`;
    const here = game.itemsIn(state.room).filter((i) => !i.scenery);
    for (const it of here) {
      out += (it.roomDesc || `There is a ${it.names[0].toUpperCase()} here.`) + "\n";
      if (it.container && it.open) {
        const inside = game.itemsIn(it.id);
        if (inside.length) {
          out += `The ${it.names[0]} contains:\n` +
            inside.map((x) => "  a " + x.names[0].toUpperCase()).join("\n") + "\n";
        }
      }
    }
    if (typeof world.statusBanner === "function") {
      if (deferStatusBanner) {
        describedRoomThisTurn = true;
      } else {
        const sb = world.statusBanner(game);
        if (sb) out += "\n" + sb + "\n";
      }
    }
    return out.trimEnd();
  };

  // --- turn tick (fuel burn + grue) -----------------------------------------
  function tick() {
    state.turns++;
    for (const it of game.activeLights()) {
      if (typeof it.fuel === "number") {
        if (it.lightGrace) { it.lightGrace = false; continue; }
        it.fuel--;
        if (it.fuel === 3) pending = it.lowFuelMsg || "The flame gutters low; it won't last much longer.";
        if (it.fuel <= 0) {
          it.lit = false;
          pending = it.outOfFuelMsg || `The ${it.names[0]} flickers and goes out.`;
        }
      }
    }
    if (game.isLit()) {
      state.flags.__darkWarned = false;
    } else if (!state.flags.__darkWarned) {
      state.flags.__darkWarned = true;
      if (!darkWarningRendered) pending = DARK_WARNING;
    } else {
      grueKill = true;
    }
    darkWarningRendered = false;
    // Generic per-turn content hook (e.g. the burn-up timer). Returns an optional
    // message; may call ctx.kill()/ctx.win() to end the game mid-tick.
    if (typeof world.tick === "function") {
      const m = world.tick(game);
      if (m != null) pending = pending ? pending + "\n\n" + m : m;
    }
  }

  function suffix() {
    let extra = "";
    if (pending) { extra += "\n" + pending; pending = null; }
    if (grueKill) {
      grueKill = false;
      extra += "\n\n" + game.kill("Oh no! You have walked into the slavering fangs of a lurking grue!");
    }
    return extra;
  }

  // Content override hook: item-targeted handler first, then room handler.
  function runHandlers(cmd) {
    const direct = cmd.dobj ? game.find(cmd.dobj) : null;
    const indirect = cmd.iobj ? game.find(cmd.iobj) : null;
    const targets = [];
    if (direct) targets.push(world.items[direct.id]);
    if (indirect && indirect.id !== direct?.id) targets.push(world.items[indirect.id]);
    targets.push(world.rooms[state.room]);
    for (const t of targets) {
      const h = t && t.on && t.on[cmd.verb];
      if (h) { const r = h(game, cmd); if (r != null) return r; }
    }
    return null;
  }

  function dispatchWithoutTick(cmd) {
    const override = runHandlers(cmd);
    if (override != null) return override;
    const handler = commands[cmd.verb];
    const result = handler ? handler(game, cmd) : "You can't do that.";
    return result == null ? "You can't do that." : result;
  }

  function prepareEntry(cmd, derivedSteps) {
    if (cmd.verb !== "enter" || !cmd.dobj) return null;
    const target = game.find(cmd.dobj);
    if (!target || !target.enterTo) return null;
    const definition = world.items[target.id];
    const canOpen = target.openable || !!definition?.on?.open;
    if (!canOpen || target.open) return null;

    if (target.locked) {
      const suppliedKey = cmd.iobj ? game.find(cmd.iobj, game.inventory()) : null;
      const knownKey = target.keyId ? game.item(target.keyId) : null;
      const key = suppliedKey || (knownKey?.loc === "inventory" ? knownKey : null);
      if (key) {
        const keyName = key.names[0];
        const unlock = { verb: "unlock", dobj: target.names[0], prep: "with", iobj: keyName };
        const result = dispatchWithoutTick(unlock);
        derivedSteps.push(`unlock ${target.names[0]} with ${keyName}`);
        if (target.locked) return result;
      }
    }

    const open = { verb: "open", dobj: target.names[0], prep: null, iobj: null };
    const result = dispatchWithoutTick(open);
    derivedSteps.push(`open ${target.names[0]}`);
    return target.open ? null : result;
  }

  function prepareOpenWithKey(cmd, derivedSteps) {
    if (cmd.verb !== "open" || !cmd.dobj || !cmd.iobj) return null;
    const target = game.find(cmd.dobj);
    if (!target?.locked || !target.keyId) return null;
    const unlock = { verb: "unlock", dobj: cmd.dobj, prep: "with", iobj: cmd.iobj };
    const result = dispatchWithoutTick(unlock);
    derivedSteps.push(`unlock ${cmd.dobj} with ${cmd.iobj}`);
    return target.locked ? result : null;
  }

  function implicitlyAcquire(cmd) {
    if (!["read", "eat", "drink", "wear"].includes(cmd.verb) || !cmd.dobj) return null;
    const item = game.find(cmd.dobj);
    if (!item || !item.takeable || game.has(item.id)) return null;
    if (game.inventoryLoad() >= (world.config.maxCarry ?? 99)) {
      return {
        blocked: `Your hands are full. You cannot get the ${item.names[0]} first.`,
        step: `get ${item.names[0]}`,
      };
    }
    game.moveItem(item.id, "inventory");
    return { step: `get ${item.names[0]}` };
  }

  // --- main loop -------------------------------------------------------------
  // Runs exactly one command. Returns { text, stop } — `stop` aborts the rest of
  // a chained line (parse error, game over, or we just picked up the phone).
  function runOne(input) {
    darkWarningRendered = false;
    let cmd = parse(input);
    if (cmd.error === "empty") return { text: "I beg your pardon?", stop: true };
    if (cmd.error === "unknown-verb") return { text: `I don't know the word "${cmd.word}".`, stop: true };

    const roomNavigation = world.implicitNavigation?.[state.room];
    const implicitNavigation = cmd.verb === "go" && cmd.dobj === "in" ? roomNavigation?.in
      : cmd.verb === "go" && cmd.dobj === "out" ? roomNavigation?.out
      : null;
    if (implicitNavigation) cmd = parse(implicitNavigation);
    const executionLabel = implicitNavigation || input.trim().toLowerCase();

    const derivedSteps = typeof world.deriveCommand === "function"
      ? (world.deriveCommand(game, cmd) || [])
      : [];
    const acquisition = implicitlyAcquire(cmd);
    if (acquisition) derivedSteps.push(acquisition.step);
    const preparationBlocked = acquisition?.blocked
      || prepareOpenWithKey(cmd, derivedSteps)
      || prepareEntry(cmd, derivedSteps);

    deferStatusBanner = true;
    describedRoomThisTurn = false;
    const override = preparationBlocked || runHandlers(cmd);
    let text;
    if (override != null) {
      text = override;
    } else {
      const handler = commands[cmd.verb];
      const r = handler ? handler(game, cmd) : "You can't do that.";
      text = r == null ? "You can't do that." : r;
    }
    if (!state.dead && !state.won) tick();
    deferStatusBanner = false;
    if (derivedSteps.length) {
      let finalStep = executionLabel;
      if (cmd.verb === "open" && derivedSteps.some((step) => step.startsWith("unlock "))) {
        finalStep = `open ${cmd.dobj}`;
      }
      const sequence = preparationBlocked ? derivedSteps : [...derivedSteps, finalStep];
      text = `(${sequence.join(", ")})\n\n${text}`;
    } else if (implicitNavigation) {
      text = `(${executionLabel})\n\n${text}`;
    }
    let result = text + suffix();
    if (describedRoomThisTurn && typeof world.statusBanner === "function") {
      const sb = world.statusBanner(game);
      if (sb) result += "\n\n" + sb;
    }
    return {
      text: result,
      stop: state.dead || state.won || !!state.flags.onCall,
    };
  }

  const MAX_CHAIN = 20;

  game.send = (input) => {
    if (state.dead || state.won) {
      // The game's over — you're no longer on the phone. Clearing this keeps a
      // death or win that happened mid-call from stranding the player on the
      // call screen, where the engine refuses every command (so hang-up can't
      // clear the call) and RESTART would be the only way out.
      state.flags.onCall = false;
      return "The game is over. Type RESTART to play again.";
    }
    // While on the hint line, everything you type goes to Gary verbatim (no
    // splitting — Gary should hear your commas) and no world turn passes.
    if (state.flags.onCall) {
      if (typeof world.hotlineTalk === "function") return world.hotlineTalk(game, input);
      state.flags.onCall = false;
      return "The line goes dead.";
    }

    const parts = splitCommands(input);
    if (!parts.length) return "I beg your pardon?";
    if (parts.length === 1) return runOne(parts[0]).text;

    const run = parts.slice(0, MAX_CHAIN);
    const out = [];
    let stopped = false;
    let prev = null;
    for (let part of run) {
      // AGAIN/G inside a chain repeats the previous command on the same line.
      if (/^(again|g)$/i.test(part)) {
        if (!prev) { out.push(`> ${part}\nNothing to repeat.`); stopped = true; break; }
        part = prev;
      }
      const { text, stop } = runOne(part);
      out.push(`> ${part}\n${text}`);
      prev = part;
      if (stop) { stopped = true; break; }
    }
    if (!stopped && parts.length > MAX_CHAIN) {
      out.push(`(Only the first ${MAX_CHAIN} commands on that line were carried out.)`);
    }
    return out.join("\n\n");
  };

  // --- save / restore --------------------------------------------------------
  game.snapshot = () => ({ state: JSON.parse(JSON.stringify(state)) });
  game.restore = (snap) => {
    const c = JSON.parse(JSON.stringify(snap.state));
    for (const k of Object.keys(state)) delete state[k];
    Object.assign(state, c);
    return true;
  };

  return game;
}
