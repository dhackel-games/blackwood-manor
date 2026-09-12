// hud.js Copyright (c) 2026:dhackel-games. All Rights Reserved. Do Not Distribute.

export class HudSlot {
  constructor({ id, emoji = "", calculate }) {
    this.id = id;
    this.emoji = emoji;
    this.calculate = calculate;
    this.element = null;
    this.emojiElement = null;
    this.valueElement = null;
  }

  mount(document, container) {
    const element = document.createElement("span");
    element.id = `hud-${this.id}`;
    element.className = `hud-slot hud-slot--${this.id}`;
    element.hidden = true;

    if (this.emoji) {
      const emoji = document.createElement("span");
      emoji.className = "hud-slot-emoji";
      emoji.setAttribute("aria-hidden", "true");
      emoji.textContent = typeof this.emoji === "function" ? "" : this.emoji;
      element.append(emoji, " ");
      this.emojiElement = emoji;
    }

    this.valueElement = document.createElement("span");
    this.valueElement.className = "hud-slot-value";
    element.appendChild(this.valueElement);
    container.appendChild(element);
    this.element = element;
  }

  update(context) {
    const value = this.calculate(context);
    const visible = value !== null && value !== undefined && value !== "";
    this.element.hidden = !visible;
    if (this.emojiElement && typeof this.emoji === "function") {
      this.emojiElement.textContent = this.emoji(context);
    }
    this.valueElement.textContent = visible ? String(value) : "";
  }
}

export const HUD_SLOT_DEFINITIONS = Object.freeze([
  {
    id: "score",
    emoji: "🏆",
    calculate: ({ game }) => `${game.state.score}/${game.state.turns}`,
  },
  {
    id: "inventory",
    emoji: ({ game }) => game.has("backpack") ? "👜" : "👤",
    calculate: ({ game }) => `${game.inventoryLoad()}/${game.inventoryCapacity()}`,
  },
  {
    id: "bill",
    emoji: "☎",
    calculate: ({ game }) => `$${((game.state.flags.phoneBill || 0) / 100).toFixed(2)}`,
  },
  {
    id: "reliquary",
    emoji: "💎",
    calculate: ({ game, world }) => {
      const status = world.reliquaryStatus?.(game);
      if (!status) return null;
      return `${status.contributing}/${status.required} +${status.nonContributing}`;
    },
  },
  {
    id: "bm",
    emoji: "💩",
    calculate: ({ game, world }) => {
      const status = world.digestiveStatus?.(game);
      if (!status) return null;
      const width = 8;
      const filled = Math.min(width, Math.round((status.percent / 100) * width));
      return `BM ▐${"█".repeat(filled)}${"░".repeat(width - filled)} ${status.percent}%`;
    },
  },
  {
    id: "sick",
    emoji: "🤮",
    calculate: ({ game, world }) => {
      const status = world.digestiveStatus?.(game);
      return status
        ? `${status.remaining} · ${status.name} ${status.emoji} (${status.phaseIndex + 1}/4)`
        : null;
    },
  },
  {
    id: "high",
    emoji: "🍄",
    calculate: ({ game }) => {
      const turns = game.state.flags.high || 0;
      return turns > 0 ? turns : null;
    },
  },
  {
    id: "vision",
    emoji: "👁️",
    calculate: ({ game, world }) => {
      const status = world.visionStatus?.(game);
      if (!status) return null;
      return status.permanent ? "∞" : status.remaining;
    },
  },
  {
    id: "flight",
    emoji: "🪽",
    calculate: ({ game, world }) => {
      const status = world.flightStatus?.(game);
      if (!status) return null;
      return status.permanent ? "∞" : status.remaining;
    },
  },
  {
    id: "fire",
    emoji: "🔥",
    calculate: ({ game, world }) => {
      const status = world.fireStatus?.(game);
      return status ? status.remaining : null;
    },
  },
  {
    id: "light",
    emoji: "💡",
    calculate: ({ game, world }) => {
      const status = world.lightStatus?.(game);
      if (!status) return null;
      return status.permanent ? "∞" : status.remaining;
    },
  },
]);

export function createHud(document) {
  const container = document.getElementById("hud-slots");
  if (!container) throw new Error("Missing #hud-slots container");
  const slots = HUD_SLOT_DEFINITIONS.map((definition) => new HudSlot(definition));
  for (const slot of slots) slot.mount(document, container);
  return {
    slots,
    update(context) {
      for (const slot of slots) slot.update(context);
    },
  };
}

// end hud.js
