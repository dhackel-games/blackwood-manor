// cheat-prompts.js Copyright (c) 2026:dhackel-games. All Rights Reserved. Do Not Distribute.

const join = (commands) => commands.join("; ");

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
  "take ember stone",
  "fly great oak",
  "take all",
  "put ember stone in mechanism",
  "put green stone in mechanism",
  "put blue stone in mechanism",
  "enter platform",
  "wait",
  "take spyglass",
  "fly garden",
];

const CRYPT_LOOT_ROUTE = [
  "fly crypt",
  "take gold locket",
  "remove talisman",
];

const POWERUP = [
  "{{pathto:PRIVY}}",
  "eat mushrooms",
  "fly dreadmaw vault",
  "wear winged shoes",
  "fly deep mining shaft",
  "wear backpack",
  "fly mining gallery",
  "wear headlamp",
  "fly hall bedroom",
  "open drawer",
  "wear goggles",
  "fly parlor",
  "move painting",
  "open safe with 7 3 9",
  "wear talisman",
  "fly astral chamber",
  "wear obsidian eye",
];

const QUICK_COLLECTION = [
  "{{pathto:PRIVY}}",
  "eat mushrooms",
  "fly dreadmaw vault",
  "wear winged shoes",
  "take family crest",
  "fly dragon cave antechamber",
  "take family ring",
  "fly deep mining shaft",
  "wear backpack",
  "fly hall bedroom",
  "open drawer",
  "wear goggles",
  "fly dining room",
  "take candlestick",
  "fly kitchen",
  "take matches",
  "light candle",
  "fly garden",
  "{{oakspyglass}}",
  "down",
  "take ancient coin",
  "fly hidden chamber",
  "take grimoire",
  "fly nursery",
  "open music box",
  "take tiny key",
  "take music box",
  "fly grand bedroom",
  "unlock jewelry box with tiny key",
  "open jewelry box",
  "take ruby ring",
  "fly parlor",
  "move painting",
  "open safe with 7 3 9",
  "wear talisman",
  "{{cryptloot}}",
  "fly wine cellar",
  "take crystal decanter",
  "fly attic",
  "take ancestral portrait",
  "fly royal hall",
];

const REQUIRED_DEPOSITS = [
  "put family crest in reliquary",
  "put family ring in reliquary",
  "put spyglass in reliquary",
  "put candlestick in reliquary",
  "put grimoire in reliquary",
  "put music box in reliquary",
  "put ruby ring in reliquary",
  "put gold locket in reliquary",
  "put talisman in reliquary",
  "put ancient coin in reliquary",
  "put crystal decanter in reliquary",
  "put ancestral portrait in reliquary",
];

const DAWN_ENDING = [
  "close reliquary",
  "ring bell",
  "take bone key",
  "unlock secret door with bone key",
  "open secret door",
  "north",
  "north",
  "north",
];

const MAX_COLLECTION = [
  "{{pathto:PRIVY}}",
  "eat mushrooms",
  "fly kitchen",
  "take apple",
  "fly cave mouth",
  "offer apple to dragon",
  "fly dreadmaw vault",
  "wear winged shoes",
  "take family crest",
  "fly dragon cave antechamber",
  "take family ring",
  "fly mining gallery",
  "wear headlamp",
  "fly deep mining shaft",
  "wear backpack",
  "fly hall bedroom",
  "open drawer",
  "wear goggles",
  "fly parlor",
  "move painting",
  "open safe with 7 3 9",
  "wear talisman",
  "fly astral chamber",
  "take obsidian eye",
  "wear obsidian eye",
  "fly dining room",
  "take candlestick",
  "fly kitchen",
  "take matches",
  "light candle",
  "drink milk",
  "fly garden",
  "{{oakspyglass}}",
  "down",
  "take ancient coin",
  "fly hidden chamber",
  "take grimoire",
  "fly nursery",
  "open music box",
  "take tiny key",
  "take music box",
  "fly grand bedroom",
  "unlock jewelry box with tiny key",
  "open jewelry box",
  "take ruby ring",
  "{{cryptloot}}",
  "fly wine cellar",
  "take crystal decanter",
  "fly attic",
  "take ancestral portrait",
  "fly royal hall",
  "open package",
  "take backwards watch",
  "fly royal hall",
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
    description: "Collect every scoring reward and take the dawn ending with the mirror.",
    compoundPrompt: join([
      ...MAX_COLLECTION,
      ...REQUIRED_DEPOSITS,
      "close reliquary",
      "ring bell",
      "take bone key",
      "unlock secret door with bone key",
      "open secret door",
      "north",
      "north",
      "take silver mirror",
      "north",
    ]),
  }),
]);

const normalize = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");

function resolveRoomId(game, target) {
  const wanted = normalize(target);
  return Object.entries(game.world.rooms).find(([id, room]) =>
    [id, room.name, ...(room.aliases || [])].some((name) => normalize(name) === wanted))?.[0] || null;
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
    if (start === destination) return prefix;
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
      if (next === destination) return [...prefix, ...directions];
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
      return ["fly tree fort", "take spyglass", "fly garden"];
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
  return expanded.split(";").map((command) => command.trim()).filter((command) => {
    if (!command) return false;
    const take = /^(?:take|get)\s+(.+)$/i.exec(command);
    if (take && game.find(take[1], game.inventory())) return false;
    const wear = /^wear\s+(.+)$/i.exec(command);
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
    ...CHEAT_PROMPTS.map((entry) =>
      `${entry.cmd.padEnd(12)} ${entry.name} — ${entry.description}`),
  ].join("\n");
}

// end cheat-prompts.js
