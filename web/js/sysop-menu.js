// sysop-menu.js. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-09.002:acoven.

import { RADIO_SONGS } from "./upsidedown/radio-clues.js?v=source";

const DIRECTION_SHORTCUTS = Object.freeze({
  north: "n",
  northeast: "ne",
  east: "e",
  southeast: "se",
  south: "s",
  southwest: "sw",
  west: "w",
  northwest: "nw",
  up: "u",
  down: "d",
  in: "in",
  out: "out",
});

export function shortestCommand(command) {
  const text = String(command || "").trim();
  const direction = DIRECTION_SHORTCUTS[text.toLowerCase()];
  if (direction) return direction;
  const shortened = text
    .replace(/^open\b/i, "o")
    .replace(/^close\b/i, "c")
    .replace(/^(?:take|get)\b/i, "t")
    .replace(/^place\b/i, "put")
    .replace(/^(?:use|wear|don|eat)\b/i, "u")
    .replace(/^extinguish\b/i, "ext")
    .replace(/^remove\b/i, "doff")
    .replace(/^offer\b/i, "give")
    .replace(/^enter\b/i, "in")
    .replace(/^(?:go|fly)\s+/i, "g ")
    .replace(/^unlock\b/i, "un")
    .replace(/^lock\b/i, "lk")
    .replace(/^wait$/i, "z")
    .replace(/\s+with\s+/i, " w/");
  return shortened.replace(/^(turn|point|move|rotate)\s+(?:weathervane|vane)\s+(north|east|south|west)$/i,
    (_, verb, target) => `${verb} vane ${DIRECTION_SHORTCUTS[target.toLowerCase()]}`);
}

const join = (commands) => commands.map(shortestCommand).join("; ");

export const SYSOP_MENU_COMMAND = "::";
export const SYSOP_MENU_DISCOVERY_MESSAGE =
  "You've discovered the sysop menu. Please invoke it the first time with your password via ::<password>";
export const SYSOP_MENU_PASSWORDS = Object.freeze(["werdna", "evad", "divad"]);

export function isSysopMenuPassword(command) {
  const normalized = String(command || "").trim().toLowerCase();
  return SYSOP_MENU_PASSWORDS.some((password) => normalized === `::${password}`);
}

export function sysopMenuAction(command, unlocked) {
  const normalized = String(command || "").trim().toLowerCase();
  if (!normalized.startsWith(SYSOP_MENU_COMMAND)) return { handled: false, unlocked };
  if (isSysopMenuPassword(normalized)) {
    return { handled: true, unlocked: true, showMenu: true };
  }
  if (!unlocked) {
    return { handled: true, unlocked: false, message: SYSOP_MENU_DISCOVERY_MESSAGE };
  }
  if (normalized === SYSOP_MENU_COMMAND) {
    return { handled: true, unlocked: true, showMenu: true };
  }
  const shortcut = sysopCommand(normalized);
  return shortcut
    ? { handled: true, unlocked: true, shortcut }
    : {
        handled: true,
        unlocked: true,
        message: `Unknown sysop menu command. Type ${SYSOP_MENU_COMMAND} to list available commands.`,
      };
}

export function persistSysopMenuUnlock(game, action) {
  if (!action?.unlocked || game.getFlag("sysopMenuUnlocked")) return false;
  game.setFlag("sysopMenuUnlocked");
  return true;
}

const POWERUP = [
  "{{pathto:PRIVY}}",
  "{{flightmushroom}}",
  "fly shaft",
  "wear backpack",
  "fly gallery",
  "wear headlamp",
  "fly dreadvault",
  "wear shoes",
  "fly belfry",
  "pull bellrope",
  "wear goggles",
  "fly study",
  "open studrawer",
  "wear bmwatch",
  "fly parlor",
  "move profile",
  "open safe with 7 3 9",
  "wear talisman",
  "fly astral",
  "wear obsidian",
];

// Walk (never fly) through the front door to the Baron's portrait in the Parlor.
const BARON_VISIT = [
  "{{baronwalk}}",
  "talk to baron",
  "talk to baron",
  "talk to baron",
  "talk to baron",
  "talk to baron",
];

const WIN_RECOVERY_OPENING = [
  "west", "move statue", "take iron", "west", "north",
  "open mailbox", "read letter", "open frontd with iron", "north", "read package",
  "west", "take candle", "south", "take matches", "take apple", "light candle",
  "north", "east", "south", "south", "west", "west", "south",
  "offer apple to dragon", "east", "east", "down",
];

const WIN = [
  "{{winopening}}",
  "use backpack", "up", "use headlamp", "down", "east",
  "say lore", "east", "use shoes", "take crest", "fly garden",
  "move statue", "take iron", "west", "north", "open mailbox", "read letter",
  "open frontd with iron", "north", "read package", "east", "move profile",
  "open safe with 7 3 9", "take coal", "wear talisman", "west", "up",
  "pick nose", "sniff snuffbox", "pull cord", "up", "take ancestral", "up",
  "turn vane n", "turn vane w", "turn vane s", "turn vane e",
  "take vane", "east", "pull bellrope", "wear goggles", "down",
  "use obsidian", "south", "down", "west", "pull wallpaper", "take musicbox",
  "open musicbox", "take tiny", "in", "take bmhammer", "out", "west", "south",
  "open fridge", "take all", "use burrito", "open cellard", "{{windried}}", "wait", "wait",
  "use milk", "put coal in microwave", "set dial to B", "start microwave", "take diamond",
  "down", "take all", "open wine bottle with corkscrew", "drink wine", "south", "take locket",
  "north", "up", "north", "{{wincandlestick}}", "light candle", "east", "light self with wrapper",
  "south", "south", "east", "{{winbrazier}}", "down", "take all", "west", "west", "south",
  "take pieceb", "east", "south", "give apple to dragon", "east", "east", "in locker",
  "fill jug", "pour jug on fire", "take cyan", "west", "spell fart", "take all",
  "east", "north",
  "give cheeses to dg", "take rind",
  "south", "south", "{{winoak}}", "north", "east", "turn on cabinet radio", "{{winradio}}", "take transistor", "north",
  "set dial to 1", "push button", "take eyepiece", "east", "read starmap", "west", "set dial to 4", "push button",
  "ext self", "north", "north", "up", "south", "open studrawer", "take all", "read diary",
  "wear bmwatch", "north", "east", "open jewelry with tiny", "take ravenblood",
  "west", "north", "take shard", "open drawer", "take family",
  "south", "down", "west", "put candle in fixture", "put shard in fixture", "take candelabra",
  "east", "east", "south", "pull lever", "take pieced",
  "combine pieces", "read baronessphoto", "down", "read grimoire", "up", "north", "west",
  "open rq", "put all in rq", "close rq", "open bellcloset", "pull closetrope",
  "open rq", "read gclock",
];

const WIN_OAK_ROUTE = [
  "fill slots ymc", "enter platform", "wait", "out", "fill slots res", "wait", "wait", "wait",
  "enter platform", "wait", "out", "take spyglass", "wait", "wait", "wait",
  "enter platform", "wait", "wait", "out",
];

export const SYSOP_COMMANDS = Object.freeze([
  Object.freeze({
    cmd: "::baron",
    name: "Meet the Baron",
    description: "Walk to the Parlor and speak to Baron Munchhausen the Third in the portrait hiding the safe — path shown, no flying.",
    compoundPrompt: join(BARON_VISIT),
  }),
  Object.freeze({
    cmd: "::powerup",
    name: "Power Up",
    description: "Acquire and wear every reusable power item, including the BM Watch.",
    compoundPrompt: join(POWERUP),
  }),
  Object.freeze({
    cmd: "::win",
    name: "Complete Part I",
    description: "Follow the planner-verified full route, use two flights and EXT at the fire, seal all heirlooms in one transfer, and take the clock; INFO documents POUR/USE, FILL, STOMP, SMOTHER, SPELL, COMBINE, TURN/SET/START, and DIAL.",
    compoundPrompt: join(WIN),
  }),
]);

const normalize = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");

function resolveRoomId(game, target) {
  const wanted = normalize(target);
  return Object.entries(game.world.rooms).find(([id, room]) =>
    [game.world.roomShortNames?.[id], id, room.name, ...(room.aliases || [])]
      .filter(Boolean)
      .some((name) => normalize(name) === wanted))?.[0] || null;
}

function nextRadioSeed(seed) {
  return (Math.imul(1664525, seed) + 1013904223) >>> 0;
}

function radioSeed(game) {
  const saved = game.getFlag("realm:radioSeed");
  if (Number.isInteger(saved)) return saved >>> 0;
  const seed = Math.floor(Math.random() * 0x100000000) >>> 0;
  game.setFlag("realm:radioSeed", seed);
  return seed;
}

function drawRadioRound(seed, previousSong) {
  const draw = (count) => {
    seed = nextRadioSeed(seed);
    return seed % count;
  };
  const songCandidates = RADIO_SONGS
    .map((_, index) => index)
    .filter((index) => index !== previousSong);
  const songIndex = songCandidates[draw(songCandidates.length)];
  draw(RADIO_SONGS[songIndex].clues.length);
  const distractorCandidates = RADIO_SONGS
    .map((_, index) => index)
    .filter((index) => index !== songIndex);
  const optionIndices = [];
  for (let count = 0; count < 4; count++) {
    optionIndices.push(distractorCandidates.splice(draw(distractorCandidates.length), 1)[0]);
  }
  optionIndices.push(songIndex);
  for (let index = optionIndices.length - 1; index > 0; index--) {
    const other = draw(index + 1);
    [optionIndices[index], optionIndices[other]] = [optionIndices[other], optionIndices[index]];
  }
  return {
    seed,
    round: {
      songIndex,
      optionIndices,
      correctOption: optionIndices.indexOf(songIndex) + 1,
    },
  };
}

function validRadioRound(round) {
  return round
    && Number.isInteger(round.songIndex)
    && Array.isArray(round.optionIndices)
    && Number.isInteger(round.correctOption);
}

function winRadioAnswers(game) {
  if (game.getFlag("realm:radioWon")) return [];
  let seed = radioSeed(game);
  let previousSong = game.getFlag("realm:radioPreviousSong");
  let round = validRadioRound(game.getFlag("realm:radioRound"))
    ? game.getFlag("realm:radioRound")
    : null;
  let streak = Number(game.getFlag("realm:radioStreak")) || 0;
  const answers = [];
  while (streak < 3) {
    if (!round) {
      ({ seed, round } = drawRadioRound(seed, previousSong));
      previousSong = round.songIndex;
    }
    answers.push(`answer ${round.correctOption}`);
    streak++;
    round = null;
  }
  return answers;
}

function navigationLinkCommands(game, room) {
  return (game.world.navigationLinks || [])
    .filter((link) => link.from === room && (!link.when || link.when(game)))
    .map((link) => {
      const commands = typeof link.commands === "function" ? link.commands(game) : link.commands;
      return {
        to: link.to,
        commands: Array.isArray(commands) ? commands : [commands],
      };
    })
    .filter((link) => link.to && link.commands.every(Boolean));
}

export function pathToRoom(game, target) {
  const destination = resolveRoomId(game, target);
  if (!destination) throw new Error(`Unknown path target: ${target}`);
  if (game.state.room === destination) return [];

  let start = game.state.room;
  const prefix = [];
  if (start === "treeFort") {
    if (!game.getFlag("oakLightAligned")) {
      if (game.world.canFly?.(game)) return [`fly ${target.toLowerCase()}`];
      throw new Error(`No available path from ${game.state.room} to ${destination}`);
    }
    const stops = game.getFlag("oak:lowerPanelAligned")
      ? ["greatOak", "treeFort", "greatOak", "below"]
      : ["greatOak", "treeFort"];
    let beat = Number(game.getFlag("oak:liftBeat"));
    if (!Number.isInteger(beat) || beat < 0 || beat >= stops.length) {
      beat = game.roomOf("oakPlatform") === "treeFort" ? 1 : 0;
    }
    let platform = stops[beat];
    let grace = !!game.getFlag("oakLiftGrace");
    const waitFor = (room) => {
      for (let count = 0; platform !== room && count <= stops.length; count++) {
        prefix.push("wait");
        if (grace) grace = false;
        else {
          beat = (beat + 1) % stops.length;
          platform = stops[beat];
        }
      }
      if (platform !== room) throw new Error(`No available path from ${game.state.room} to ${destination}`);
    };
    if (game.getFlag("oakLiftRiding") && platform === "treeFort") {
      waitFor("greatOak");
    } else {
      waitFor("treeFort");
      prefix.push("out", "wait");
    }
    start = "greatOak";
    if (start === destination) return prefix.map(shortestCommand);
  }

  const queue = [{ room: start, commands: [] }];
  const visited = new Set([start]);
  while (queue.length) {
    const current = queue.shift();
    const exits = Object.entries(game.world.rooms[current.room]?.exits || {}).flatMap(([direction, exit]) => {
      if (typeof exit === "object" && exit.via && !game.getFlag(exit.via)) return [];
      const next = typeof exit === "object" ? exit.to : exit;
      return next ? [{ to: next, commands: [direction] }] : [];
    });
    for (const edge of [...exits, ...navigationLinkCommands(game, current.room)]) {
      if (visited.has(edge.to)) continue;
      const commands = [...current.commands, ...edge.commands];
      if (edge.to === destination) return [...prefix, ...commands].map(shortestCommand);
      visited.add(edge.to);
      queue.push({ room: edge.to, commands });
    }
  }
  throw new Error(`No available path from ${game.state.room} to ${destination}`);
}

export function expandSysopCommand(shortcut, game) {
  if (shortcut.cmd === "::win" && game.getFlag("bellRung")) {
    if (game.roomOf("clockTalisman") === "reliquary") {
      return join([
        ...pathToRoom(game, "grandHall"),
        ...(game.item("reliquary").open ? [] : ["open rq"]),
        "read gclock",
      ]);
    }
    return join([game.has("clockTalisman") ? "read gclock" : "inventory"]);
  }

  const flightMushroomRoute = (() => {
    if (game.world.canFly?.(game)) return [];
    const freshLocation = game.roomOf("outhouseMushrooms");
    if (freshLocation === "inventory" || freshLocation === "privy") return ["use fresh"];
    if (!game.getFlag("outhouseMushroomsFound")) return ["look in toilet", "use fresh"];

    const driedLocation = game.roomOf("mushrooms");
    if (driedLocation === "inventory") return ["use dried"];
    if (driedLocation === "kitchen") {
      return [
        "west",
        "move statue",
        "take iron",
        "west",
        "north",
        "open frontd with iron",
        "north",
        "west",
        "south",
        "use dried",
      ];
    }
    if (game.roomOf("wingedShoes") === "inventory") return ["wear shoes"];

    const route = [];
    if (!game.getFlag("dragonMoved")) {
      if (game.roomOf("apple") === "inventory") {
        route.push("west", "west", "west", "west", "south");
      } else if (game.roomOf("apple") === "kitchen") {
        route.push(
          "west",
          "move statue",
          "take iron",
          "west",
          "north",
          "open frontd with iron",
          "north",
          "west",
          "south",
          "take apple",
          "north",
          "east",
          "south",
          "south",
          "west",
          "west",
          "south",
        );
      } else {
        return ["use fresh"];
      }
      route.push("offer apple to dragon");
    } else {
      route.push("west", "west", "west", "west", "south");
    }
    route.push("east", "east", "wear headlamp", "down", "wear backpack", "east");
    if (!game.getFlag("dragonVaultOpen")) route.push("talk to troll", "say lore");
    route.push("east", "wear shoes");
    return route;
  })();
  const winRecovery = shortcut.cmd === "::win" && !game.world.canFly?.(game)
    && game.getFlag("outhouseMushroomsFound")
    && !["inventory", "privy"].includes(game.roomOf("outhouseMushrooms"));
  const winOpening = winRecovery
    ? ["east", "east", "take piecec", ...WIN_RECOVERY_OPENING]
    : ["east", "east", "look in toilet", "take piecec", "use fresh", "fly shaft"];
  const baronWalkRoute = (() => {
    // Never fly — show the route through the front door from a fresh start.
    const toParlor = game.getFlag("frontDoorOpen")
      ? pathToRoom(game, "parlor")
      : [
          "east", "move statue", "take iron", "west",
          "north", "open frontd with iron", "north",
          "east",
        ];
    return toParlor;
  })();
  const expanded = shortcut.compoundPrompt
    .replace(/\{\{pathto:([^}]+)\}\}/gi, (_, target) => pathToRoom(game, target).join("; "))
    .replace(/\{\{baronwalk\}\}/gi, join(baronWalkRoute))
    .replace(/\{\{flightmushroom\}\}/gi, join(flightMushroomRoute))
    .replace(/\{\{winopening\}\}/gi, join(winOpening))
    .replace(/\{\{windried\}\}/gi,
      join(["inventory", "kitchen"].includes(game.roomOf("mushrooms")) ? ["use dried"] : []))
    .replace(/\{\{wincandlestick\}\}/gi, join(winRecovery ? [] : ["take candlestick"]))
    .replace(/\{\{winbrazier\}\}/gi,
      join(game.getFlag("brazierLit") ? ["ext"] : ["light brazier"]))
    .replace(/\{\{winradio\}\}/gi, join(winRadioAnswers(game)));
  const filterCommands = (text) => {
    const removed = new Set();
    return text.split(";").map(shortestCommand).filter((command) => {
      if (!command) return false;
      const take = /^(?:take|get|t)\s+(.+)$/i.exec(command);
      if (take && game.find(take[1], game.inventory())) return false;
      const remove = /^(?:remove|doff)\s+(.+)$/i.exec(command);
      if (remove) {
        const item = game.find(remove[1], game.inventory());
        if (item) removed.add(item.id);
      }
      const wear = /^(?:wear|don|u)\s+(.+)$/i.exec(command);
      if (wear) {
        const item = game.find(wear[1], game.inventory());
        if (item?.worn && !removed.has(item.id)) return false;
        if (item) removed.delete(item.id);
      }
      return true;
    });
  };
  if (shortcut.cmd !== "::win") return filterCommands(expanded).join("; ");

  let oakRoute = [...WIN_OAK_ROUTE];
  if (game.getFlag("oakLightAligned") && !game.getFlag("oak:lowerPanelAligned")) {
    let platform = game.roomOf("oakPlatform");
    let grace = !!game.getFlag("oakLiftGrace");
    const beforeOak = filterCommands(expanded.split("{{winoak}}")[0]).length;
    for (let step = 0; step < beforeOak; step++) {
      if (grace) grace = false;
      else platform = platform === "greatOak" ? "treeFort" : "greatOak";
    }
    const beat = platform === "treeFort" ? 1 : platform === "greatOak" ? 0 : 3;
    oakRoute = [
      ...WIN_OAK_ROUTE.slice(0, 1),
      ...Array.from({ length: (3 - beat + 4) % 4 }, () => "wait"),
      ...WIN_OAK_ROUTE.slice(1),
    ];
  }
  return filterCommands(expanded.replace("{{winoak}}", join(oakRoute))).join("; ");
}

export function sysopCommand(command) {
  const normalized = String(command || "").trim().toLowerCase();
  return SYSOP_COMMANDS.find((entry) => entry.cmd === normalized) || null;
}

export function renderSysopMenu() {
  return [
    "== SYSOP MENU ==",
    "COMMAND | TITLE / DESCRIPTION",
    ...SYSOP_COMMANDS.map((entry) =>
      `${entry.cmd.padEnd(14)} | ${entry.name} / ${entry.description}`),
  ].join("\n");
}

// end sysop-menu.js
