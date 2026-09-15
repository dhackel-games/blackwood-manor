// sysop-menu.js. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-14.098:acoven.

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

const OAK_SPYGLASS_ROUTE = [
  "light brazier",
  "take emerald",
  "east",
  "east",
  "take all",
  "put ruby in bottom",
  "put emerald in middle",
  "put sapphire in top",
  "enter platform",
  "wait",
  "take all",
  "wait",
  "enter platform",
  "wait",
  "west",
  "west",
];

const CRYPT_LOOT_ROUTE = [
  "fly crypt",
  "take all",
  "remove talisman",
];

const POWERUP = [
  "{{pathto:PRIVY}}",
  "{{flightmushroom}}",
  "fly dreadvault",
  "wear shoes",
  "fly hallbr",
  "open drawer",
  "wear goggles",
  "fly shaft",
  "wear backpack",
  "fly gallery",
  "wear headlamp",
  "fly parlor",
  "move profile",
  "open safe with 7 3 9",
  "wear talisman",
  "fly astral",
  "wear obsidian",
];

const QUICK_COLLECTION = [
  "{{pathto:PRIVY}}",
  "{{flightmushroom}}",
  "fly dreadvault",
  "wear shoes",
  "take all",
  "fly antechamber",
  "take all",
  "fly hallbr",
  "open drawer",
  "wear goggles",
  "fly shaft",
  "wear backpack",
  "fly dining",
  "take all",
  "fly kitchen",
  "take matches",
  "light candle",
  "fly garden",
  "{{oakspyglass}}",
  "down",
  "take ancient",
  "fly hidden",
  "take all",
  "fly nursery",
  "pull wallpaper",
  "in",
  "take all",
  "out",
  "fly nursery",
  "open musicbox",
  "take all",
  "fly grandbr",
  "open jewelry with tiny",
  "take all",
  "fly parlor",
  "move profile",
  "open safe with 7 3 9",
  "wear talisman",
  "{{cryptloot}}",
  "fly wine",
  "take all",
  "fly attic",
  "take all",
  "fly royal",
];

const REQUIRED_DEPOSITS = [
  "put crest in rq",
  "put family in rq",
  "put spyglass in rq",
  "put candlestick in rq",
  "put grimoire in rq",
  "put musicbox in rq",
  "put ravenblood in rq",
  "put locket in rq",
  "put talisman in rq",
  "put ancient in rq",
  "put decanter in rq",
  "put ancestral in rq",
  "put woodblack in rq",
];

const DAWN_ENDING = [
  "close rq",
  "ring bell",
  "take bone",
  "open secretd with bone",
  "north",
  "north",
  "north",
];

const MAX_COLLECTION = [
  "east",
  "move statue",
  "take iron",
  "west",
  "north",
  "open mailbox",
  "read letter",
  "open frontd with iron",
  "south",
  "east",
  "east",
  "{{flightmushroom}}",
  "fly kitchen",
  "take apple",
  "fly mouth",
  "offer apple to dragon",
  "east",
  "take all",
  "east",
  "wear headlamp",
  "down",
  "wear backpack",
  "east",
  "talk to troll",
  "say lore",
  "east",
  "wear shoes",
  "take all",
  "fly kitchen",
  "take rope",
  "open cellard",
  "eat burrito",
  "drink milk",
  "take matches",
  "fly garden",
  "down",
  "take ancient",
  "light self with match",
  "light brazier",
  "{{oakspyglass}}",
  "fly library",
  "pull lever",
  "down",
  "take all",
  "fly study",
  "read diary",
  "fly parlor",
  "move painting",
  "open safe with 7 3 9",
  "wear talisman",
  "fly hallbr",
  "open drawer",
  "wear goggles",
  "fly astral",
  "wear obsidian",
  "fly dining",
  "take all",
  "fly nursery",
  "pull wallpaper",
  "in",
  "take all",
  "out",
  "fly nursery",
  "open musicbox",
  "take all",
  "fly grandbr",
  "open jewelry with tiny",
  "take all",
  "{{cryptloot}}",
  "fly wine",
  "take all",
  "fly attic",
  "take all",
  "fly royal",
];

export const SYSOP_COMMANDS = Object.freeze([
  Object.freeze({
    cmd: "::powerup",
    name: "Power Up",
    description: "Acquire and equip every reusable power item.",
    compoundPrompt: join(POWERUP),
  }),
  Object.freeze({
    cmd: "::winquick",
    name: "Quick Win",
    description: "Collect the minimum required heirlooms and take the dawn ending.",
    compoundPrompt: join([...QUICK_COLLECTION, ...REQUIRED_DEPOSITS, ...DAWN_ENDING]),
  }),
  Object.freeze({
    cmd: "::garycliff",
    name: "Gary Cliffhanger",
    description: "Collect the minimum required heirlooms and descend to Gary's call-cave.",
    compoundPrompt: join([...QUICK_COLLECTION, ...REQUIRED_DEPOSITS, "close rq", "down"]),
  }),
  Object.freeze({
    cmd: "::winmax",
    name: "Maximum Win",
    description: "Collect every deterministic scoring reward and take the dawn ending with the mirror.",
    compoundPrompt: join([
      ...MAX_COLLECTION,
      ...REQUIRED_DEPOSITS,
      "close rq",
      "ring bell",
      "take bone",
      "open secretd with bone",
      "north",
      "north",
      "take all",
      "north",
    ]),
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
  const oakRoute = (() => {
    const spyglassLocation = game.roomOf("spyglass");
    if (spyglassLocation === "inventory" || spyglassLocation === "reliquary") return [];
    if (game.getFlag("oakLightAligned")) {
      return ["fly fort", "take all", "fly garden"];
    }
    return OAK_SPYGLASS_ROUTE;
  })();
  const cryptRoute = (() => {
    const locketLocation = game.roomOf("goldLocket");
    if (locketLocation !== "inventory" && locketLocation !== "reliquary") return CRYPT_LOOT_ROUTE;
    return game.roomOf("talisman") === "reliquary" ? [] : ["remove talisman"];
  })();
  const expanded = shortcut.compoundPrompt
    .replace(/\{\{pathto:([^}]+)\}\}/gi, (_, target) => pathToRoom(game, target).join("; "))
    .replace(/\{\{flightmushroom\}\}/gi, join(flightMushroomRoute))
    .replace(/\{\{oakspyglass\}\}/gi, join(oakRoute))
    .replace(/\{\{cryptloot\}\}/gi, join(cryptRoute));
  return expanded.split(";").map(shortestCommand).filter((command) => {
    if (!command) return false;
    const take = /^(?:take|get|t)\s+(.+)$/i.exec(command);
    if (take && game.find(take[1], game.inventory())) return false;
    const wear = /^(?:wear|don|u)\s+(.+)$/i.exec(command);
    if (wear) {
      const item = game.find(wear[1], game.inventory());
      if (item?.worn) return false;
    }
    return true;
  }).join("; ");
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
