// sysop-menu.js. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-21.107:acoven.

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
  return text
    .replace(/^open\b/i, "o")
    .replace(/^close\b/i, "c")
    .replace(/^(?:take|get)\b/i, "t")
    .replace(/^place\b/i, "put")
    .replace(/^(?:use|wear|don|eat|drink)\b/i, "u")
    .replace(/^remove\b/i, "doff")
    .replace(/^offer\b/i, "give")
    .replace(/^enter\b/i, "in")
    .replace(/^(?:go|fly)\s+/i, "g ")
    .replace(/^unlock\b/i, "un")
    .replace(/^lock\b/i, "lk")
    .replace(/^wait$/i, "z")
    .replace(/\s+with\s+/i, " w/");
}

const join = (commands) => commands.map(shortestCommand).join("; ");

export const SYSOP_MENU_COMMAND = "::";
export const SYSOP_MENU_DISCOVERY_MESSAGE =
  "You've discovered the sysop menu. Please invoke it the first time with your password via ::<password>";
export const SYSOP_MENU_PASSWORDS = Object.freeze(["werdna", "evad"]);

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
  "west", "take candle", "south",
  "take matches", "take coil", "take apple", "light candle",
  "north", "east", "south", "south", "west", "west", "south",
  "offer apple to dragon", "use doubloon", "east", "east", "down",
];

const WIN_FRONT_ENTRANCE = [
  "east", "move statue", "take iron", "west", "north",
  "open mailbox", "read letter", "open frontd with iron", "north", "read package",
];

const WIN_DRAGON_VISIT = [
  "south", "south", "west", "west", "south", "offer apple to dragon",
  "use doubloon", "north", "east", "east",
];

const WIN_OAK_PANEL = [
  "take ruby", "take sapphire",
  "put ruby in top", "put emerald in middle", "put sapphire in bottom",
];

const WIN_OAK_PLATFORM = [
  "enter platform", "wait", "use spyglass", "take spyglass",
  "enter platform", "wait",
];

const WIN = [
  "{{pathto:PRIVY}}", "{{winopening}}",
  "wear backpack", "up", "wear headlamp", "down", "east",
  "talk troll", "say lore", "east", "wear shoes", "take crest",
  "west", "west", "up", "west", "west", "north", "east", "east",
  "{{winfront}}",
  "west", "{{wincandle}}", "south",
  "{{windried}}", "{{winkitchenbasics}}", "{{winlightcandle}}",
  "use burrito", "open cellard", "down", "take decanter", "up", "use milk",
  "north", "east", "put crest in rq", "put decanter in rq",
  "{{windragon}}",
  "east", "remove shoes", "down", "take ancient",
  "{{winbrazier}}", "{{winemerald}}", "wear shoes",
  "east", "east", "{{winoak}}", "west", "west", "west", "north", "north",
  "put ancient in rq", "put spyglass in rq",
  "east", "move profile", "open safe with 7 3 9", "wear talisman",
  "south", "pull lever", "down", "read grimoire", "up", "north", "west",
  "put grimoire in rq", "up", "south", "read diary", "open studrawer", "wear bmwatch",
  "north", "north", "open drawer", "take family", "take shard", "south",
  "west", "take musicbox", "open musicbox", "take tiny", "pull wallpaper",
  "in", "take bmhammer", "out",
  "put family in rq", "put musicbox in rq", "put bmhammer in rq",
  "up", "east", "open jewelry with tiny", "take ravenblood", "west",
  "pull cord", "up", "take ancestral", "up", "east", "pull bellrope",
  "wear goggles", "down", "wear obsidian", "south", "down", "down",
  "put ancestral in rq", "put ravenblood in rq",
  "west", "put candle in fixture", "put shard in fixture",
  "take candelabra", "east", "put candelabra in rq",
  "west", "south", "down", "south", "take locket",
  "north", "up", "north", "east", "remove talisman",
  "put talisman in rq", "put locket in rq",
  "close rq", "open bellcloset", "pull closetrope",
  "open rq", "take gclock", "read gclock",
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
    description: "Walk the full collectible and puzzle route, seal the heirlooms, ring the bell, and take the clock; choose either ending yourself.",
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
    const platformHere = game.roomOf("oakPlatform") === "treeFort";
    if (game.getFlag("oakLiftRiding") && platformHere) {
      prefix.push("wait");
    } else if (platformHere) {
      prefix.push("out", "wait");
    } else {
      prefix.push("wait", "out", "wait");
    }
    start = "greatOak";
    if (start === destination) return prefix.map(shortestCommand);
  }

  const queue = [{ room: start, directions: [] }];
  const visited = new Set([start]);
  while (queue.length) {
    const current = queue.shift();
    for (const [direction, exit] of Object.entries(game.world.rooms[current.room]?.exits || {})) {
      if (typeof exit === "object" && exit.via && !game.getFlag(exit.via)) continue;
      const next = typeof exit === "object" ? exit.to : exit;
      if (!next || visited.has(next)) continue;
      const directions = [...current.directions, direction];
      if (next === destination) return [...prefix, ...directions].map(shortestCommand);
      visited.add(next);
      queue.push({ room: next, directions });
    }
  }
  throw new Error(`No available path from ${game.state.room} to ${destination}`);
}

export function expandSysopCommand(shortcut, game) {
  const flightMushroomRoute = (() => {
    if (game.world.canFly?.(game)) return [];
    const freshLocation = game.roomOf("outhouseMushrooms");
    if (freshLocation === "inventory" || freshLocation === "privy") return ["use fresh"];
    if (!game.getFlag("outhouseMushroomsFound")) return ["use fresh"];

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
  const freshAvailable = !game.getFlag("outhouseMushroomsFound")
    || ["inventory", "privy"].includes(game.roomOf("outhouseMushrooms"));
  const winRoutes = {
    winopening: winRecovery
      ? WIN_RECOVERY_OPENING
      : [...(freshAvailable ? ["use fresh"] : []), "fly shaft"],
    winfront: winRecovery ? ["north", "north"] : WIN_FRONT_ENTRANCE,
    wincandle: winRecovery ? [] : ["take candle"],
    windried: ["inventory", "kitchen"].includes(game.roomOf("mushrooms")) ? ["use dried"] : [],
    winkitchenbasics: winRecovery ? [] : ["take coil", "take matches", "take apple"],
    winlightcandle: winRecovery ? [] : ["light candle"],
    windragon: winRecovery ? ["south", "south"] : WIN_DRAGON_VISIT,
    winbrazier: game.getFlag("brazierLit")
      ? (game.getFlag("progressAward:selfFireSurvived")
        ? ["use wrapper"]
        : ["light self with wrapper", "extinguish self"])
      : ["light self with wrapper", "light brazier"],
    winemerald: game.getFlag("oakLightAligned") ? [] : ["take emerald"],
  };
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
    .replace(/\{\{(winopening|winfront|wincandle|windried|winkitchenbasics|winlightcandle|windragon|winbrazier|winemerald)\}\}/gi,
      (_, key) => join(winRoutes[key.toLowerCase()]));
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

  const oakRoute = [
    ...(game.getFlag("oakLightAligned") ? [] : WIN_OAK_PANEL),
    ...(["inventory", "reliquary", "clockTalisman"].includes(game.roomOf("spyglass"))
      ? [] : WIN_OAK_PLATFORM),
  ];
  if (game.getFlag("oakLightAligned") && oakRoute.includes("enter platform")) {
    let platform = game.roomOf("oakPlatform");
    let grace = !!game.getFlag("oakLiftGrace");
    const beforeOak = filterCommands(expanded.split("{{winoak}}")[0]).length;
    for (let step = 0; step < beforeOak; step++) {
      if (grace) grace = false;
      else platform = platform === "greatOak" ? "treeFort" : "greatOak";
    }
    if (platform === "treeFort") oakRoute.unshift("wait");
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
