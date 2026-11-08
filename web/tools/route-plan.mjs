// route-plan.mjs. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.001:acoven.
import { pathToFileURL } from "node:url";
import { createGame } from "../js/core.js";
import { world } from "../js/world.js";

const LIFT_STOPS = ["greatOak", "treeFort", "greatOak", "below"];
const UPPER_STOPS = ["greatOak", "treeFort"];
const DIRECTIONS = {
  north: "n", south: "s", east: "e", west: "w",
  northeast: "ne", northwest: "nw", southeast: "se", southwest: "sw",
  up: "u", down: "d", in: "in", out: "out",
};

function enabled(flags, name) {
  return flags instanceof Set ? flags.has(name) : !!flags?.[name];
}

function stopList(flags) {
  return enabled(flags, "oak:lowerPanelAligned") ? LIFT_STOPS
    : enabled(flags, "oakLightAligned") ? UPPER_STOPS : null;
}

function compareCost(a, b) {
  return a.transitions - b.transitions
    || a.walkingTransitions - b.walkingTransitions
    || a.commands.length - b.commands.length;
}

function navigationKey(state) {
  return `${state.room}|${state.beat ?? "-"}|${Number(state.riding)}`;
}

function advanceLift(state, stops, grace = false) {
  if (!stops || grace) return state;
  const beat = (state.beat + 1) % stops.length;
  return {
    ...state,
    beat,
    room: state.riding ? stops[beat] : state.room,
  };
}

function neighbors(state, options, stops) {
  const { room, riding, beat } = state;
  const next = [];
  if (!riding) {
    for (const [direction, exit] of Object.entries(world.rooms[room].exits || {})) {
      if (typeof exit === "object" && exit.via && !enabled(options.flags, exit.via)) continue;
      const destination = typeof exit === "string" ? exit : exit.to;
      if (!destination || !world.rooms[destination] || world.rooms[destination].phase === 2) continue;
      next.push({ command: DIRECTIONS[direction] || direction,
        state: advanceLift({ room: destination, beat, riding }, stops), walking: true });
    }
    if (room === "mineGallery" && options.lockerOpen) {
      next.push({ command: "in",
        state: advanceLift({ room: "waylampClearing", beat, riding }, stops), walking: true });
    }
    if (room === "waylampClearing") {
      next.push({ command: "out",
        state: advanceLift({ room: "mineGallery", beat, riding }, stops), walking: true });
    }
    if (room === "landing" && (options.canFly || enabled(options.flags, "ladderDown")
      && options.inventoryLoad <= 2)) {
      next.push({ command: "u",
        state: advanceLift({ room: "attic", beat, riding }, stops), walking: true });
    }
    if (room === "attic" && options.canFly) {
      next.push({ command: "u",
        state: advanceLift({ room: "roof", beat, riding }, stops), walking: true });
    }
    if (stops?.includes(room) && stops[beat] === room) {
      next.push({ command: "in platform", state: { room, beat, riding: true }, walking: false });
    }
  } else {
    next.push({ command: "out", state: { room, beat, riding: false }, walking: false });
  }
  if (stops?.includes(room)) {
    next.push({ command: "z", state: advanceLift(state, stops), walking: false });
  }
  return next;
}

/**
 * Shortest executable walk in the merged world, with the lift beat advanced
 * after every command. Named flights and puzzle ejections are separate actions.
 */
export function shortestWalk(from, to, options = {}) {
  if (!world.rooms[from] || !world.rooms[to]) throw new Error(`Unknown room: ${from} or ${to}`);
  const stops = stopList(options.flags);
  const beat = stops
    ? Number.isInteger(options.liftBeat) ? options.liftBeat
      : stops.length === 4 ? 3 : 0
    : null;
  const initial = {
    room: from,
    beat: beat == null ? null : ((beat % stops.length) + stops.length) % stops.length,
    riding: false,
    commands: [],
    transitions: 0,
    walkingTransitions: 0,
  };
  const queue = [initial];
  const best = new Map([[navigationKey(initial), initial]]);
  while (queue.length) {
    queue.sort(compareCost);
    const current = queue.shift();
    if (best.get(navigationKey(current)) !== current) continue;
    if (current.room === to && !current.riding) {
      return {
        commands: current.commands,
        transitions: current.transitions,
        walkingTransitions: current.walkingTransitions,
        liftBeat: current.beat,
      };
    }
    for (const edge of neighbors(current, options, stops)) {
      const candidate = {
        ...edge.state,
        commands: [...current.commands, edge.command],
        transitions: current.transitions + Number(edge.state.room !== current.room),
        walkingTransitions: current.walkingTransitions
          + Number(edge.walking && edge.state.room !== current.room),
      };
      const key = navigationKey(candidate);
      if (best.has(key) && compareCost(best.get(key), candidate) <= 0) continue;
      best.set(key, candidate);
      queue.push(candidate);
    }
  }
  return null;
}

export function walkingDistance(from, to, options = {}) {
  return shortestWalk(from, to, options)?.transitions ?? Infinity;
}

/**
 * Exact Held–Karp-style search for small task sets. Dependencies and exit
 * flags are applied before considering each successor, never after travel.
 */
export function solveSmallProblem({ start, end, tasks, flags = {}, canFly = false,
  lockerOpen = false }) {
  if (tasks.length > 12) throw new Error("Small-problem solver supports at most twelve tasks.");
  const indexes = new Map(tasks.map((task, index) => [task.id, index]));
  for (const task of tasks) {
    for (const dependency of task.dependsOn || []) {
      if (!indexes.has(dependency)) throw new Error(`Unknown prerequisite: ${dependency}`);
    }
  }
  const finished = (1 << tasks.length) - 1;
  const memo = new Map();
  function visit(room, mask) {
    const key = `${room}|${mask}`;
    if (memo.has(key)) return memo.get(key);
    const activeFlags = { ...flags };
    for (const [index, task] of tasks.entries()) {
      if (mask & (1 << index)) Object.assign(activeFlags, task.grants);
    }
    if (mask === finished) {
      const walk = shortestWalk(room, end, { flags: activeFlags, canFly, lockerOpen });
      return walk ? { transitions: walk.transitions, commands: walk.commands, order: [] } : null;
    }
    let best = null;
    for (const [index, task] of tasks.entries()) {
      if (mask & (1 << index)
        || (task.dependsOn || []).some((id) => !(mask & (1 << indexes.get(id))))) continue;
      const walk = task.room
        ? shortestWalk(room, task.room, { flags: activeFlags, canFly, lockerOpen })
        : { transitions: 0, commands: [] };
      if (!walk) continue;
      const arrival = task.room || room;
      const destination = task.movesTo || arrival;
      const continuation = visit(destination, mask | (1 << index));
      if (!continuation) continue;
      const candidate = {
        transitions: walk.transitions + Number(destination !== arrival)
          + continuation.transitions,
        commands: [...walk.commands, ...(task.commands || []), ...continuation.commands],
        order: [task.id, ...continuation.order],
      };
      if (!best || candidate.transitions < best.transitions
        || candidate.transitions === best.transitions
          && candidate.commands.length < best.commands.length) best = candidate;
    }
    memo.set(key, best);
    return best;
  }
  return visit(start, 0);
}

function main() {
  const game = createGame(world);
  game.send("Jeb");
  console.log("Route planner: real world loaded, 24 heirlooms.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

// end route-plan.mjs
