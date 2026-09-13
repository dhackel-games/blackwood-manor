// cheat-prompts.js. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-12.068:acoven.

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
    .replace(/^take\b/i, "get")
    .replace(/^place\b/i, "put")
    .replace(/^wear\b/i, "don")
    .replace(/^remove\b/i, "doff")
    .replace(/^offer\b/i, "give")
    .replace(/^enter\b/i, "in")
    .replace(/^wait$/i, "z");
}

const join = (commands) => commands.map(shortestCommand).join("; ");

export const MAGIC_MENU_COMMAND = "::";
export const MAGIC_MENU_DISCOVERY_MESSAGE =
  "You've discovered the magic menu. Please invoke it the first time with your password via ::<password>";
export const MAGIC_MENU_PASSWORDS = Object.freeze(["werdna", "evad"]);

export function isMagicMenuPassword(command) {
  const normalized = String(command || "").trim().toLowerCase();
  return MAGIC_MENU_PASSWORDS.some((password) => normalized === `::${password}`);
}

export function magicMenuAction(command, unlocked) {
  const normalized = String(command || "").trim().toLowerCase();
  if (!normalized.startsWith(MAGIC_MENU_COMMAND)) return { handled: false, unlocked };
  if (isMagicMenuPassword(normalized)) {
    return { handled: true, unlocked: true, showMenu: true };
  }
  if (!unlocked) {
    return { handled: true, unlocked: false, message: MAGIC_MENU_DISCOVERY_MESSAGE };
  }
  if (normalized === MAGIC_MENU_COMMAND) {
    return { handled: true, unlocked: true, showMenu: true };
  }
  const shortcut = cheatPrompt(normalized);
  return shortcut
    ? { handled: true, unlocked: true, shortcut }
    : {
        handled: true,
        unlocked: true,
        message: `Unknown magic menu command. Type ${MAGIC_MENU_COMMAND} to list available commands.`,
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
  "take spyglass",
  "wait",
  "enter platform",
  "wait",
  "west",
  "west",
];

const CRYPT_LOOT_ROUTE = [
  "fly crypt",
  "take locket",
  "remove talisman",
];

const POWERUP = [
  "{{pathto:PRIVY}}",
  "eat mushrooms",
  "fly dreadvault",
  "wear shoes",
  "fly shaft",
  "wear backpack",
  "fly gallery",
  "wear headlamp",
  "fly hallbedroom",
  "open drawer",
  "wear goggles",
  "fly parlor",
  "move profile",
  "open safe with 7 3 9",
  "wear talisman",
  "fly astral",
  "wear obsidian",
];

const QUICK_COLLECTION = [
  "{{pathto:PRIVY}}",
  "eat mushrooms",
  "fly dreadvault",
  "wear shoes",
  "take crest",
  "fly antechamber",
  "take family",
  "fly shaft",
  "wear backpack",
  "fly hallbedroom",
  "open drawer",
  "wear goggles",
  "fly dining",
  "take candlestick",
  "fly kitchen",
  "take matches",
  "light candle",
  "fly garden",
  "{{oakspyglass}}",
  "down",
  "take ancient",
  "fly hidden",
  "take grimoire",
  "fly nursery",
  "pull wallpaper",
  "in",
  "take watch",
  "out",
  "fly nursery",
  "open musicbox",
  "take tiny",
  "take musicbox",
  "fly grand",
  "unlock jewelry with tiny",
  "open jewelry",
  "take bloodsignet",
  "fly parlor",
  "move profile",
  "open safe with 7 3 9",
  "wear talisman",
  "{{cryptloot}}",
  "fly wine",
  "take decanter",
  "fly attic",
  "take ancestral",
  "fly royal",
];

const REQUIRED_DEPOSITS = [
  "put crest in reliquary",
  "put family in reliquary",
  "put spyglass in reliquary",
  "put candlestick in reliquary",
  "put grimoire in reliquary",
  "put musicbox in reliquary",
  "put bloodsignet in reliquary",
  "put locket in reliquary",
  "put talisman in reliquary",
  "put ancient in reliquary",
  "put decanter in reliquary",
  "put ancestral in reliquary",
  "put watch in reliquary",
];

const DAWN_ENDING = [
  "close reliquary",
  "ring bell",
  "take bone",
  "unlock secret with bone",
  "open secret",
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
  "unlock frontdoor with iron",
  "open frontdoor",
  "south",
  "east",
  "east",
  "eat mushrooms",
  "fly kitchen",
  "take apple",
  "fly cavemouth",
  "offer apple to dragon",
  "east",
  "take family",
  "east",
  "take headlamp",
  "wear headlamp",
  "down",
  "wear backpack",
  "east",
  "talk to troll",
  "say more",
  "east",
  "take shoes",
  "wear shoes",
  "take crest",
  "fly kitchen",
  "take rope",
  "open cellar",
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
  "take grimoire",
  "fly study",
  "read diary",
  "fly parlor",
  "move painting",
  "open safe with 7 3 9",
  "wear talisman",
  "fly hallbedroom",
  "open drawer",
  "wear goggles",
  "fly astral",
  "take obsidian",
  "wear obsidian",
  "fly dining",
  "take candlestick",
  "fly nursery",
  "pull wallpaper",
  "in",
  "take watch",
  "out",
  "fly nursery",
  "open musicbox",
  "take tiny",
  "take musicbox",
  "fly grand",
  "unlock jewelry with tiny",
  "open jewelry",
  "take bloodsignet",
  "{{cryptloot}}",
  "fly wine",
  "take decanter",
  "fly attic",
  "take ancestral",
  "fly royal",
];

export const CHEAT_PROMPTS = Object.freeze([
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
    compoundPrompt: join([...QUICK_COLLECTION, ...REQUIRED_DEPOSITS, "close reliquary", "down"]),
  }),
  Object.freeze({
    cmd: "::winmax",
    name: "Maximum Win",
    description: "Collect every deterministic scoring reward and take the dawn ending with the mirror.",
    compoundPrompt: join([
      ...MAX_COLLECTION,
      ...REQUIRED_DEPOSITS,
      "close reliquary",
      "ring bell",
      "take bone",
      "unlock secret with bone",
      "open secret",
      "north",
      "north",
      "take silver",
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

export function expandCheatPrompt(shortcut, game) {
  const oakRoute = (() => {
    const spyglassLocation = game.roomOf("spyglass");
    if (spyglassLocation === "inventory" || spyglassLocation === "reliquary") return [];
    if (game.getFlag("oakLightAligned")) {
      return ["fly fort", "take spyglass", "fly garden"];
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
    .replace(/\{\{oakspyglass\}\}/gi, join(oakRoute))
    .replace(/\{\{cryptloot\}\}/gi, join(cryptRoute));
  return expanded.split(";").map(shortestCommand).filter((command) => {
    if (!command) return false;
    const take = /^(?:take|get)\s+(.+)$/i.exec(command);
    if (take && game.find(take[1], game.inventory())) return false;
    const wear = /^(?:wear|don)\s+(.+)$/i.exec(command);
    if (wear) {
      const item = game.find(wear[1], game.inventory());
      if (item?.worn) return false;
    }
    return true;
  }).join("; ");
}

export function cheatPrompt(command) {
  const normalized = String(command || "").trim().toLowerCase();
  return CHEAT_PROMPTS.find((entry) => entry.cmd === normalized) || null;
}

export function cheatMenu() {
  return [
    "== MAGIC MENU ==",
    "COMMAND | TITLE / DESCRIPTION",
    ...CHEAT_PROMPTS.map((entry) =>
      `${entry.cmd.padEnd(14)} | ${entry.name} / ${entry.description}`),
  ].join("\n");
}

// end cheat-prompts.js
