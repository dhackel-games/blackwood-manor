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

const OPENING = [
  "e", "e", "look in toilet", "take piecec", "use fresh",
  "fly shaft", "use backpack", "u", "use headlamp",
  "d", "e", "say lore", "e", "use shoes", "take crest",
];

const TASKS = [
  { id: "mazePiece", room: "hedgeMazeLoop", commands: ["take pieceb"] },
  { id: "gardenKey", room: "garden", commands: ["move statue", "take iron"] },
  { id: "porchDoor", room: "porch", dependsOn: ["gardenKey"],
    commands: ["open mailbox", "read letter", "open frontd with iron"],
    grants: { frontDoorOpen: true } },
  { id: "hallPackage", room: "grandHall", commands: ["read package"] },
  { id: "kitchenBasics", room: "kitchen",
    commands: ["open fridge", "take all", "use burrito", "open cellard", "use dried",
      "wait", "wait", "use milk"],
    grants: { cellarOpen: true } },
  { id: "parlorSafe", room: "parlor",
    commands: ["move profile", "open safe with 7 3 9", "take coal", "wear talisman"] },
  { id: "kitchenDiamond", room: "kitchen", dependsOn: ["kitchenBasics", "parlorSafe"],
    commands: ["put coal in microwave", "set dial to B", "start microwave", "take diamond"] },
  { id: "diningCandle", room: "diningRoom", dependsOn: ["kitchenBasics"],
    commands: ["take candlestick", "light candle"] },
  { id: "library", room: "library",
    commands: ["pull lever", "read book", "take pieced"],
    grants: { leverPulled: true } },
  { id: "secretChamber", room: "secretChamber", dependsOn: ["library"],
    commands: ["read grimoire"] },
  { id: "wineCellar", room: "wineCellar", dependsOn: ["kitchenBasics"],
    commands: ["take all", "open wine bottle with corkscrew", "drink wine"] },
  { id: "crypt", room: "crypt", dependsOn: ["wineCellar", "parlorSafe"],
    commands: ["take locket"] },
  { id: "landing", room: "landing",
    commands: ["pick nose", "sniff snuffbox", "pull cord"],
    grants: { ladderDown: true } },
  { id: "hallBedroom", room: "hallBedroom",
    commands: ["take shard", "open drawer", "take family"] },
  { id: "nursery", room: "nursery",
    commands: ["pull wallpaper", "take musicbox", "open musicbox", "take tiny"],
    grants: { wallGapFound: true } },
  { id: "betweenWalls", room: "betweenWalls",
    commands: ["take bmhammer"] },
  { id: "masterBedroom", room: "masterBedroom", dependsOn: ["nursery"],
    commands: ["open jewelry with tiny", "take ravenblood"] },
  { id: "study", room: "study",
    commands: ["open studrawer", "take all", "read diary", "wear bmwatch"] },
  { id: "attic", room: "attic",
    commands: ["take ancestral"] },
  { id: "roof", room: "roof",
    commands: ["turn vane n", "turn vane w", "turn vane s", "turn vane e",
      "take vane"] },
  { id: "belfry", room: "belfry",
    commands: ["pull bellrope", "wear goggles"] },
  { id: "hiddenVault", room: "hiddenVault",
    commands: ["use obsidian"] },
  { id: "dragon", room: "dragonCaveMouth", dependsOn: ["kitchenBasics"],
    commands: ["give apple to dragon"],
    grants: { dragonMoved: true } },
  { id: "bodyFire", room: "grandHall", dependsOn: ["kitchenBasics", "porchDoor"],
    commands: ["light self with wrapper", "s", "s", "e", "light brazier"],
    movesTo: "garden", movesCost: 3 },
  { id: "gardenWell", room: "garden", dependsOn: ["bodyFire"],
    commands: ["down", "take all"] },
  { id: "oakPanel", room: "greatOak", dependsOn: ["gardenWell"],
    commands: ["take ruby", "take sapphire", "put ruby in top",
      "put emerald in middle", "put sapphire in bottom"],
    grants: { oakLightAligned: true } },
  { id: "treeFort", room: "treeFort", dependsOn: ["lowerPanel"],
    commands: ["take spyglass", "wait"] },
  { id: "realmCampfire", room: "waylampClearing", dependsOn: ["kitchenBasics"],
    commands: ["fill jug", "pour jug on fire", "take cyan"] },
  { id: "lowerPanel", room: "below", dependsOn: ["realmCampfire"],
    commands: ["take magenta", "take yellow", "put yellow in top slot",
      "put magenta in middle slot", "put cyan in bottom slot"],
    grants: { "oak:lowerPanelAligned": true } },
  { id: "grotto", room: "cheeseGrotto", dependsOn: ["kitchenBasics"],
    commands: ["give limburger to dg", "give epoisses to dg",
      "give munster to dg", "take rind"] },
  { id: "shack", room: "shack",
    commands: ["spell fart", "take all", "read drawing"] },
  { id: "radio", room: "avClubDen",
    commands: ["turn on cabinet radio", "@answer", "@answer", "@answer",
      "take transistor"] },
  { id: "mapRoom", room: "mapRoom",
    commands: ["read starmap"] },
  { id: "planetariumSafe", room: "planetarium",
    commands: ["say 1", "take eyepiece"] },
  { id: "planetariumEject", room: "planetarium",
    dependsOn: ["realmCampfire", "lowerPanel", "grotto", "shack", "radio",
      "mapRoom", "planetariumSafe"],
    commands: ["say 4", "ext self"], movesTo: "gate", movesCost: 1 },
  { id: "combinePhoto", room: null, dependsOn: ["mazePiece", "porchDoor", "library"],
    commands: ["combine pieces", "read baronessphoto"] },
  { id: "diningRestore", room: "diningRoom",
    dependsOn: ["diningCandle", "hallBedroom"],
    commands: ["put candle in fixture", "put shard in fixture", "take candelabra"] },
];
TASKS.push({
  id: "deposit", room: "grandHall", dependsOn: TASKS.map((task) => task.id),
  commands: ["open rq", "put all in rq", "close rq",
    "open bellcloset", "pull closetrope", "open rq", "read gclock"],
});

const TASK_INDEX = new Map(TASKS.map((task, index) => [task.id, index]));
const ALL_TASKS = (1n << BigInt(TASKS.length)) - 1n;
const INITIAL_FLAGS = { dragonVaultOpen: true };
const TRAVEL_CACHE = new Map();
const RELEVANT_FLAGS = [
  "frontDoorOpen", "cellarOpen", "dragonMoved", "dragonVaultOpen",
  "leverPulled", "wallGapFound", "vaultFound", "ladderDown",
  "oakLightAligned", "oak:lowerPanelAligned",
];

function taskBit(task) {
  return 1n << BigInt(TASK_INDEX.get(task.id));
}

function taskReady(task, mask) {
  return !(mask & taskBit(task))
    && (task.dependsOn || []).every((dependency) =>
      !!(mask & (1n << BigInt(TASK_INDEX.get(dependency)))));
}

function taskFlags(mask) {
  const flags = { ...INITIAL_FLAGS };
  for (const task of TASKS) {
    if (mask & taskBit(task)) Object.assign(flags, task.grants);
  }
  return flags;
}

function cachedWalk(from, to, flags) {
  const signature = RELEVANT_FLAGS.map((flag) => Number(enabled(flags, flag))).join("");
  const key = `${from}|${to}|${signature}`;
  if (!TRAVEL_CACHE.has(key)) {
    TRAVEL_CACHE.set(key, shortestWalk(from, to,
      { flags, lockerOpen: true, canFly: true }));
  }
  return TRAVEL_CACHE.get(key);
}

function performTask(state, task) {
  return {
    room: task.movesTo || state.room,
    mask: state.mask | taskBit(task),
    cost: state.cost + (task.movesCost || 0),
    steps: state.steps + task.commands.length,
    order: [...state.order, task.id],
  };
}

function closeLocalTasks(state) {
  let result = state;
  for (;;) {
    const task = TASKS.find((candidate) =>
      taskReady(candidate, result.mask) && !candidate.movesTo
        && (candidate.room === null || candidate.room === result.room));
    if (!task) return result;
    result = performTask(result, task);
  }
}

function choices(state) {
  const flags = taskFlags(state.mask);
  const seenRooms = new Set();
  const result = [];
  for (const task of TASKS) {
    if (!taskReady(task, state.mask) || task.room === null) continue;
    if (!task.movesTo) {
      if (seenRooms.has(task.room)) continue;
      seenRooms.add(task.room);
    }
    const travel = cachedWalk(state.room, task.room, flags);
    if (!travel) continue;
    const arrival = closeLocalTasks({
      ...state, room: task.room,
      cost: state.cost + travel.transitions,
      steps: state.steps + travel.commands.length,
    });
    const candidate = task.movesTo && taskReady(task, arrival.mask)
      ? closeLocalTasks(performTask(arrival, task))
      : arrival;
    if (candidate.mask === state.mask) continue;
    result.push(candidate);
  }
  return result;
}

const OPTIMISTIC_ROOMS = [...new Set(["dreadmawVault", "gate", "grandHall",
  ...TASKS.map((task) => task.room).filter(Boolean)])];
let optimisticCosts;

function optimisticDistances() {
  if (optimisticCosts) return optimisticCosts;
  const flags = Object.fromEntries(RELEVANT_FLAGS.map((name) => [name, true]));
  const distances = new Map();
  for (const from of OPTIMISTIC_ROOMS) {
    for (const to of OPTIMISTIC_ROOMS) {
      distances.set(`${from}|${to}`, shortestWalk(from, to,
        { flags, lockerOpen: true, canFly: true })?.transitions ?? Infinity);
    }
  }
  distances.set("planetarium|gate", 1);
  for (const via of OPTIMISTIC_ROOMS) {
    for (const from of OPTIMISTIC_ROOMS) {
      for (const to of OPTIMISTIC_ROOMS) {
        const key = `${from}|${to}`;
        distances.set(key, Math.min(distances.get(key),
          distances.get(`${from}|${via}`) + distances.get(`${via}|${to}`)));
      }
    }
  }
  optimisticCosts = distances;
  return distances;
}

function lowerBound(state) {
  const distances = optimisticDistances();
  let bound = distances.get(`${state.room}|grandHall`) || 0;
  for (const task of TASKS) {
    if (!task.room || state.mask & taskBit(task)) continue;
    const through = distances.get(`${state.room}|${task.room}`)
      + distances.get(`${task.room}|grandHall`);
    bound = Math.max(bound, through);
  }
  return bound;
}

function greedy(start, lookahead = 0) {
  let state = closeLocalTasks({ room: start, mask: 0n, cost: 0, steps: 0, order: [] });
  while (state.mask !== ALL_TASKS) {
    const next = choices(state).sort((a, b) =>
      (a.cost + lookahead * lowerBound(a)) - (b.cost + lookahead * lowerBound(b))
      || b.order.length - a.order.length
      || a.steps - b.steps
      || a.room.localeCompare(b.room));
    if (!next.length) return null;
    state = next[0];
  }
  return state;
}

function better(a, b) {
  return !b || a.cost < b.cost || a.cost === b.cost && a.steps < b.steps;
}

function boundedSearch(start, { beamWidth = 72, maxExpansions = 18000 } = {}) {
  let best = null;
  for (const lookahead of [0, 0.3, 0.7, 1]) {
    const solution = greedy(start, lookahead);
    if (solution && better(solution, best)) best = solution;
  }
  if (!best) throw new Error(`No complete task ordering from ${start}`);
  const initial = closeLocalTasks({ room: start, mask: 0n, cost: 0, steps: 0, order: [] });
  let frontier = [initial];
  const seen = new Map([[`${initial.mask}|${initial.room}`, initial.cost]]);
  let expansions = 0;
  while (frontier.length && expansions < maxExpansions) {
    const successors = [];
    expand: for (const state of frontier) {
      for (const next of choices(state)) {
        if (expansions >= maxExpansions) break expand;
        expansions++;
        if (next.mask === ALL_TASKS) {
          if (better(next, best)) best = next;
          continue;
        }
        if (next.cost + lowerBound(next) >= best.cost) continue;
        const key = `${next.mask}|${next.room}`;
        if (seen.has(key) && seen.get(key) <= next.cost) continue;
        seen.set(key, next.cost);
        successors.push(next);
      }
    }
    successors.sort((a, b) =>
      (a.cost + lowerBound(a)) - (b.cost + lowerBound(b))
      || a.cost - b.cost
      || b.order.length - a.order.length
      || a.steps - b.steps
      || a.room.localeCompare(b.room));
    frontier = successors.slice(0, beamWidth);
  }
  return { ...best, expansions };
}

function routeOptions(game) {
  const lowerAligned = !!game.getFlag("oak:lowerPanelAligned");
  return {
    flags: game.state.flags,
    lockerOpen: true,
    canFly: game.world.canFly(game),
    inventoryLoad: game.inventoryLoad(),
    liftBeat: lowerAligned ? game.getFlag("oak:liftBeat")
      : game.roomOf("oakPlatform") === "treeFort" ? 1 : 0,
  };
}

function realize(order, secondFlight, earlySight = null) {
  const game = createGame(world);
  game.send("Jeb");
  game.setFlag("__noChaos", true);
  game.setFlag("realm:radioSeed", 0x1a2b3c4d);
  if (game.item("backpack").carryCapacity !== 36) {
    throw new Error("The full sweep requires the Lane 11 36-item BACKPACK");
  }
  const commands = [];
  const namedFlights = [];
  const visits = new Map([["gate", 1]]);
  const changes = { walking: 0, lift: 0, ejection: 0 };
  let peakLoad = 0;

  function send(command, task) {
    const beforeRoom = game.state.room;
    const beforeTurns = game.state.turns;
    const output = game.send(command);
    if (game.state.turns !== beforeTurns + 1 || game.state.dead || game.state.won) {
      throw new Error(`${task}: "${command}" in ${beforeRoom} failed at turn ${beforeTurns + 1}:\n${output}`);
    }
    if (game.inventoryLoad() > game.inventoryCapacity()) {
      throw new Error(`${task}: inventory exceeds its ${game.inventoryCapacity()}-item capacity`);
    }
    peakLoad = Math.max(peakLoad, game.inventoryLoad());
    commands.push(command);
    const afterRoom = game.state.room;
    if (beforeRoom === afterRoom) return output;
    visits.set(afterRoom, (visits.get(afterRoom) || 0) + 1);
    if (command.startsWith("fly ")) {
      namedFlights.push(command.slice(4));
    } else if (command === "say 4" && beforeRoom === "planetarium" && afterRoom === "gate") {
      changes.ejection++;
    } else if (command === "z" && ["below", "greatOak", "treeFort"].includes(beforeRoom)) {
      changes.lift++;
    } else if (/^(?:n|s|e|w|u|d|ne|nw|se|sw|in|out|in locker)$/.test(command)) {
      changes.walking++;
    } else {
      throw new Error(`${task}: unexpected relocation by "${command}" from ${beforeRoom} to ${afterRoom}`);
    }
    return output;
  }

  for (const command of OPENING) send(command, "opening");
  const openingTransitions = changes.walking + changes.lift + changes.ejection;
  if (game.state.room !== "dreadmawVault" || !game.item("wingedShoes").worn) {
    throw new Error("Opening did not equip the winged shoes in DREADMAW'S vault");
  }
  if (secondFlight) send(`fly ${world.roomShortNames[secondFlight]}`, "second flight");
  const completedEarly = new Set();
  if (earlySight === "belfry") {
    send("fly belfry", "third flight to permanent sight");
    for (const command of TASKS[TASK_INDEX.get("belfry")].commands) {
      send(command, "third flight to permanent sight");
    }
    completedEarly.add("belfry");
  } else if (earlySight === "hiddenVault") {
    send("fly astral", "third flight to permanent sight");
    for (const command of TASKS[TASK_INDEX.get("hiddenVault")].commands) {
      send(command, "third flight to permanent sight");
    }
    completedEarly.add("hiddenVault");
  }

  for (const id of order) {
    if (completedEarly.has(id)) continue;
    const task = TASKS[TASK_INDEX.get(id)];
    if (task.room && task.room !== game.state.room) {
      const walk = shortestWalk(game.state.room, task.room, routeOptions(game));
      if (!walk) throw new Error(`${id}: no physical route from ${game.state.room} to ${task.room}`);
      for (const rawCommand of walk.commands) {
        const command = rawCommand === "in" && game.state.room === "mineGallery"
          ? "in locker"
          : rawCommand;
        send(command, `walk to ${id}`);
      }
      if (game.state.room !== task.room) {
        throw new Error(`${id}: navigation ended in ${game.state.room}, not ${task.room}`);
      }
    }
    for (const entry of task.commands) {
      const command = entry === "@answer"
        ? `answer ${game.getFlag("realm:radioRound")?.correctOption}`
        : entry;
      if (command.includes("undefined")) throw new Error(`${id}: no seeded radio round to answer`);
      if (command === "put all in rq") {
        const carried = Object.entries(world.items)
          .filter(([, item]) => item.treasure)
          .filter(([itemId]) => game.roomOf(itemId) === "inventory");
        if (carried.length !== 24) {
          throw new Error(`${id}: ${carried.length}/24 carried heirlooms before the one bulk deposit`);
        }
      }
      const output = send(command, id);
      if (command === "put all in rq") {
        const seated = Object.entries(world.items).filter(([, item]) => item.treasure)
          .filter(([itemId]) => game.roomOf(itemId) === "reliquary");
        if (seated.length !== 24) {
          const missing = Object.entries(world.items)
            .filter(([, item]) => item.treasure)
            .filter(([itemId]) => game.roomOf(itemId) !== "reliquary")
            .map(([itemId]) => itemId);
          const extras = game.itemsIn("reliquary")
            .filter((item) => !world.items[item.id]?.treasure)
            .map((item) => item.id);
          throw new Error(`${id}: bulk deposit seated ${seated.length}/24; ` +
            `missing ${missing.join(", ")}; capacity ${game.item("reliquary").capacity}; ` +
            `load ${game.inventoryLoad()}; extras ${extras.join(", ")}; ` +
            `remaining ${game.inventory().filter((item) => !item.worn).map((item) => item.id).join(", ")}; ` +
            `transfer:\n${output}`);
        }
      }
    }
    for (const [flag, expected] of Object.entries(task.grants || {})) {
      if (!!game.getFlag(flag) !== !!expected) throw new Error(`${id}: did not set ${flag}`);
    }
    if (id === "bodyFire" && (game.getFlag("brazierMethod") !== "body"
      || !game.getFlag("progressAward:selfFireSurvived")
      || (game.getFlag("maxBurnTurns") || 0) < 3)) {
      throw new Error("Body-fire route must reach the BRAZIER on turn four and survive it");
    }
    if (task.movesTo && game.state.room !== task.movesTo) {
      throw new Error(`${id}: finished in ${game.state.room}, expected ${task.movesTo}`);
    }
  }
  const treasureIds = Object.entries(world.items)
    .filter(([, item]) => item.treasure).map(([id]) => id);
  const missing = treasureIds.filter((id) => game.roomOf(id) !== "clockTalisman");
  if (missing.length || game.state.room !== "grandHall" || !game.has("clockTalisman")) {
    throw new Error(`Incomplete Part I sweep: missing ${missing.join(", ") || "none"}; room ${game.state.room}`);
  }
  const bulkDeposits = commands.filter((command) => command === "put all in rq").length;
  if (bulkDeposits !== 1 || !game.getFlag("progressAward:oneTrip")
    || namedFlights.length > (earlySight ? 3 : 2) || namedFlights[0] !== "shaft") {
    throw new Error("Sweep must earn ONE TRIP with one bulk deposit and the allowed named flights");
  }
  const missingRewards = Object.entries(world.items)
    .filter(([, item]) => item.takeable && item.phase !== 2)
    .filter(([id, item]) => !game.getFlag(item.progressFlag || `progressItem:${id}`)
      || (world.hasScoringUse?.({ ...item, id }) && !game.getFlag(`useItem:${id}`)))
    .map(([id]) => id);
  if (missingRewards.length || game.state.score !== world.maximumScore(game)) {
    throw new Error(`Incomplete portable use or score: ${missingRewards.join(", ") || "none"}; ` +
      `${game.state.score}/${world.maximumScore(game)}`);
  }
  const roomChanges = changes.walking + changes.lift + changes.ejection;
  const revisits = Object.fromEntries([...visits]
    .map(([room, count]) => [room, count - 1])
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
  return {
    commands,
    metrics: {
      transitions: changes.walking,
      roomChangesIncludingLiftAndEjection: roomChanges,
      liftTransitions: changes.lift,
      ejectionTransitions: changes.ejection,
      transitionsPerHeirloom: Number((changes.walking / treasureIds.length).toFixed(2)),
      baseline: "77/13 = 5.9",
      namedFlights,
      secondFlightChosen: !!secondFlight,
      revisits,
      heirlooms: treasureIds.length,
      score: game.state.score,
      derivedMaximum: world.maximumScore(game),
      steps: commands.length,
      peakLoad,
      openingTransitions,
      bulkDeposits,
      oneTripAwarded: true,
    },
    game,
  };
}

/**
 * Evaluate the walk-only sweep and each legal second-flight starting room,
 * then refine the strongest starting points with a bounded beam search.
 */
export function planRoute({ beamWidth = 72, maxExpansions = 18000 } = {}) {
  TRAVEL_CACHE.clear();
  const noFlight = boundedSearch("dreadmawVault", { beamWidth, maxExpansions });
  const flightRooms = [...new Set(TASKS.map((task) => task.room))]
    .filter((room) => room && !["dreadmawVault", "treeFort", "crypt"].includes(room))
    .sort();
  const flightGreedy = flightRooms.map((room) => {
    let best = null;
    for (const lookahead of [0, 0.3, 0.7, 1]) {
      const result = greedy(room, lookahead);
      if (result && better(result, best)) best = result;
    }
    return { room, best };
  }).filter(({ best }) => best)
    .sort((a, b) => a.best.cost - b.best.cost
      || a.best.steps - b.best.steps || a.room.localeCompare(b.room));
  let bestFlight = null;
  for (const { room } of flightGreedy.slice(0, 4)) {
    const result = boundedSearch(room, { beamWidth, maxExpansions });
    if (!bestFlight || better(result, bestFlight.best)) bestFlight = { room, best: result };
  }
  const walked = realize(noFlight.order, null);
  const flown = bestFlight ? realize(bestFlight.best.order, bestFlight.room) : null;
  const useSecond = flown
    && flown.metrics.roomChangesIncludingLiftAndEjection
      < walked.metrics.roomChangesIncludingLiftAndEjection;
  const selected = useSecond ? bestFlight.best : noFlight;
  const realized = useSecond ? flown : walked;
  const sightCandidates = useSecond
    ? ["belfry", "hiddenVault"].map((target) => {
      try {
        return { target, route: realize(bestFlight.best.order, bestFlight.room, target) };
      } catch {
        return null;
      }
    }).filter(Boolean)
    : [];
  const bestSight = sightCandidates.sort((a, b) =>
    a.route.metrics.roomChangesIncludingLiftAndEjection - b.route.metrics.roomChangesIncludingLiftAndEjection
    || a.route.metrics.steps - b.route.metrics.steps
    || a.target.localeCompare(b.target))[0] || null;
  const useThird = !!bestSight && (
    bestSight.route.metrics.roomChangesIncludingLiftAndEjection
      < realized.metrics.roomChangesIncludingLiftAndEjection
    || bestSight.route.metrics.steps < realized.metrics.steps
  );
  const selectedRealized = useThird ? bestSight.route : realized;
  return {
    ...selectedRealized,
    comparison: {
      noSecondFlightRoomChanges: walked.metrics.roomChangesIncludingLiftAndEjection,
      bestSecondFlightRoomChanges: flown?.metrics.roomChangesIncludingLiftAndEjection ?? null,
      candidateStartsEvaluated: flightRooms.length,
      boundedExpansions: selected.expansions,
      selectedStart: useSecond ? bestFlight.room : "dreadmawVault",
      permanentSightCandidates: Object.fromEntries(sightCandidates.map(({ target, route }) => [target, {
        steps: route.metrics.steps,
        transitions: route.metrics.transitions,
        flights: route.metrics.namedFlights.length,
        score: route.metrics.score,
      }])),
      selectedPermanentSight: useThird ? bestSight.target : null,
    },
  };
}

function main() {
  const route = planRoute();
  console.log("Route commands (one command per turn):");
  for (const command of route.commands) console.log(`  ${command}`);
  console.log("Metrics:");
  console.log(JSON.stringify({ ...route.metrics, ...route.comparison }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

// end route-plan.mjs
