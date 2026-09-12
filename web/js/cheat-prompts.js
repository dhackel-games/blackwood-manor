// cheat-prompts.js Copyright (c) 2026:dhackel-games. All Rights Reserved. Do Not Distribute.

export const CHEAT_PROMPTS = Object.freeze([
  Object.freeze({
    cmd: ":powerup",
    name: "Power Up",
    description: "Get every portable item and equip one item in every available body slot.",
    compoundPrompt: "su give all; su equip all",
  }),
  Object.freeze({
    cmd: ":winquick",
    name: "Quick Win",
    description: "Deposit only the required family heirlooms and jump to the dawn ending.",
    compoundPrompt: "su fill required; su win",
  }),
  Object.freeze({
    cmd: ":winmax",
    name: "Maximum Win",
    description: "Collect everything, set the maximum attainable score, and win.",
    compoundPrompt: "su give all; su fill; su maxscore; su win",
  }),
]);

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
