// world.js — "Escape the Derelict" — a Dave & Andy Games example world.
//
// CONTENT/CODE SPLIT (Andy's proposal, prototyped here):
//   - world.content.json  = ALL player-facing prose (room/item text, messages,
//     banners, achievement lines). No code. Editable by anyone; localizable.
//   - world.js (this file) = structure + logic ONLY: exits, item flags,
//     handlers, achievement predicates. No long descriptions.
// composeWorld() merges the two by id, so the engine still receives one plain
// world object and needs no changes. Compare this file's size to the prose it
// used to carry — the logic is now the whole story.

import content from "./world.content.json" with { type: "json" };

// --- tiny content/logic merger (would live in a shared engine util for real) --
function composeWorld(logic, text) {
  const mergeById = (structure = {}, prose = {}) => {
    const out = {};
    for (const id of new Set([...Object.keys(structure), ...Object.keys(prose)])) {
      out[id] = { ...structure[id], ...prose[id] };
    }
    return out;
  };
  return {
    config: { ...logic.config, ...text.config },
    rooms: mergeById(logic.rooms, text.rooms),
    items: mergeById(logic.items, text.items),
    achievements: (logic.achievements || []).map((a) => ({ ...a, ...(text.achievements?.[a.id] || {}) })),
  };
}

const T = content.messages;

// --- structure + logic only (prose comes from world.content.json) ------------
const logic = {
  config: { start: "cabin", maxCarry: 6 },

  rooms: {
    cabin: { exits: { north: "corridor" } },
    corridor: { exits: { north: "bridge", south: "cabin", down: "shaft" } },
    bridge: { exits: { south: "corridor" } },
    shaft: { dark: true, exits: { up: "corridor" } },
  },

  items: {
    keycard: { loc: "cabin", takeable: true },
    lamp: { loc: "cabin", takeable: true, lightSource: true, lit: true },
    pod: {
      loc: "bridge",
      fixed: true,
      on: {
        use(ctx) {
          if (!ctx.has("keycard")) return T.podLocked;
          return ctx.win(T.podLaunch);
        },
      },
    },
  },

  achievements: [
    { id: "salvage", points: 5, when: (g) => g.has("keycard") },
    { id: "navigator", points: 10, when: (g) => g.state.room === "bridge" },
    { id: "spelunker", points: 5, when: (g) => g.state.room === "shaft" },
    { id: "escapee", points: 25, when: (g) => g.state.won === true },
  ],
};

export const world = composeWorld(logic, content);
export default world;
