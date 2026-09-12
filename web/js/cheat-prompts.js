// cheat-prompts.js Copyright (c) 2026:dhackel-games. All Rights Reserved. Do Not Distribute.

const join = (commands) => commands.join("; ");

const POWERUP = [
  "{{pathto:PRIVY}}",
  "eat mushrooms",
  "fly dreadmaw vault",
  "wear winged shoes",
  "fly deep mining shaft",
  "take backpack",
  "fly mining gallery",
  "wear headlamp",
  "fly hall bedroom",
  "open drawer",
  "wear goggles",
  "fly parlor",
  "move painting",
  "open safe with 7 3 9",
  "wear talisman",
  "fly hidden vault",
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
  "take backpack",
  "fly hall bedroom",
  "open drawer",
  "wear goggles",
  "fly dining room",
  "take candlestick",
  "fly kitchen",
  "take matches",
  "light candle",
  "fly garden",
  "light brazier",
  "take ember stone",
  "down",
  "take ancient coin",
  "fly hidden chamber",
  "take grimoire",
  "fly nursery",
  "open music box",
  "take tiny key",
  "take music box",
  "fly master bedroom",
  "unlock jewelry box with tiny key",
  "open jewelry box",
  "take ruby ring",
  "fly parlor",
  "move painting",
  "open safe with 7 3 9",
  "wear talisman",
  "fly crypt",
  "take gold locket",
  "fly wine cellar",
  "take crystal decanter",
  "fly attic",
  "take ancestral portrait",
  "fly grand hall",
];

const REQUIRED_DEPOSITS = [
  "put family crest in reliquary",
  "put family ring in reliquary",
  "put ember stone in reliquary",
  "put candlestick in reliquary",
  "put grimoire in reliquary",
  "put music box in reliquary",
  "put ruby ring in reliquary",
  "put gold locket in reliquary",
  "put ancient coin in reliquary",
  "put crystal decanter in reliquary",
  "put ancestral portrait in reliquary",
];

const DAWN_ENDING = [
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
  "take silver chalice",
  "take jeweled crown",
  "fly dragon cave antechamber",
  "take family ring",
  "fly mining gallery",
  "wear headlamp",
  "fly deep mining shaft",
  "take backpack",
  "fly hall bedroom",
  "open drawer",
  "wear goggles",
  "fly parlor",
  "move painting",
  "open safe with 7 3 9",
  "wear talisman",
  "fly hidden vault",
  "take obsidian eye",
  "wear obsidian eye",
  "fly dining room",
  "take candlestick",
  "fly kitchen",
  "take matches",
  "light candle",
  "drink milk",
  "fly garden",
  "light brazier",
  "take ember stone",
  "down",
  "take ancient coin",
  "fly hidden chamber",
  "take grimoire",
  "fly nursery",
  "open music box",
  "take tiny key",
  "take music box",
  "fly master bedroom",
  "unlock jewelry box with tiny key",
  "open jewelry box",
  "take ruby ring",
  "fly crypt",
  "take gold locket",
  "fly wine cellar",
  "take crystal decanter",
  "fly attic",
  "take ancestral portrait",
  "fly grand hall",
  "open package",
  "take backwards watch",
  "fly grand hall",
];

const BONUS_DEPOSITS = [
  "put silver chalice in reliquary",
  "put jeweled crown in reliquary",
];

export const CHEAT_PROMPTS = Object.freeze([
  Object.freeze({
    cmd: ":powerup",
    name: "Power Up",
    description: "Acquire and equip every reusable power item.",
    compoundPrompt: join(POWERUP),
  }),
  Object.freeze({
    cmd: ":winquick",
    name: "Quick Win",
    description: "Collect the minimum required heirlooms and take the dawn ending.",
    compoundPrompt: join([...QUICK_COLLECTION, ...REQUIRED_DEPOSITS, ...DAWN_ENDING]),
  }),
  Object.freeze({
    cmd: ":winmax",
    name: "Maximum Win",
    description: "Collect every scoring reward and take the dawn ending with the mirror.",
    compoundPrompt: join([
      ...MAX_COLLECTION,
      ...REQUIRED_DEPOSITS,
      ...BONUS_DEPOSITS,
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
  const queue = [{ room: game.state.room, directions: [] }];
  const visited = new Set([game.state.room]);
  while (queue.length) {
    const current = queue.shift();
    for (const [direction, exit] of Object.entries(game.world.rooms[current.room]?.exits || {})) {
      if (typeof exit === "object" && exit.via && !game.getFlag(exit.via)) continue;
      const next = typeof exit === "object" ? exit.to : exit;
      if (!next || visited.has(next)) continue;
      const directions = [...current.directions, direction];
      if (next === destination) return directions;
      visited.add(next);
      queue.push({ room: next, directions });
    }
  }
  throw new Error(`No available path from ${game.state.room} to ${destination}`);
}

export function expandCheatPrompt(shortcut, game) {
  const expanded = shortcut.compoundPrompt.replace(/\{\{pathto:([^}]+)\}\}/gi,
    (_, target) => pathToRoom(game, target).join("; "));
  return expanded.split(";").map((command) => command.trim()).filter(Boolean).join("; ");
}

export function cheatPrompt(command) {
  const normalized = String(command || "").trim().toLowerCase();
  return CHEAT_PROMPTS.find((entry) => entry.cmd === normalized) || null;
}

export function cheatMenu() {
  return [
    "== HIDDEN COMMANDS ==",
    ...CHEAT_PROMPTS.map((entry) =>
      `${entry.cmd.padEnd(12)} ${entry.name} — ${entry.description}`),
  ].join("\n");
}

// end cheat-prompts.js
