// compose.js. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-12.071:dhackel.
//
// Content/logic merger for the "prose in JSON, logic in JS" split (backlog #9).
// A game keeps structure + behaviour in a `logic` object and all player-facing
// prose in a `content` object (typically loaded from a JSON file). composeWorld
// shallow-merges them by id so the engine still receives one plain world object
// and needs no changes.
//
//   logic.rooms[id]  = { exits, on, ... }        (structure + behaviour)
//   content.rooms[id] = { name, desc, ... }        (prose)
//   -> world.rooms[id] = { ...logic, ...content }   (prose wins on key clashes)
//
// Games that don't use the split simply never call this. It is additive and
// changes no existing behaviour.

function mergeDescription(structural, prose, key) {
  const dynamic = structural?.[key];
  const staticProse = prose?.[key];
  if (typeof dynamic !== "function" || typeof staticProse === "function") return staticProse;
  return (ctx) => dynamic(ctx) ?? staticProse;
}

function mergeById(structure = {}, prose = {}) {
  const out = {};
  for (const id of new Set([...Object.keys(structure), ...Object.keys(prose)])) {
    out[id] = { ...structure[id], ...prose[id] };
    for (const key of ["desc", "roomDesc", "searchDesc", "highDesc"]) {
      if (structure[id]?.[key] !== undefined && prose[id]?.[key] !== undefined) {
        out[id][key] = mergeDescription(structure[id], prose[id], key);
      }
    }
  }
  return out;
}

export function composeWorld(logic = {}, content = {}) {
  const world = {
    ...logic,
    config: { ...logic.config, ...content.config },
    rooms: mergeById(logic.rooms, content.rooms),
    items: mergeById(logic.items, content.items),
  };
  if (Array.isArray(logic.achievements)) {
    world.achievements = logic.achievements.map(
      (a) => ({ ...a, ...(content.achievements?.[a.id] || {}) }));
  }
  return world;
}
