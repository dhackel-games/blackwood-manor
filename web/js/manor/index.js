// index.js. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.001:acoven.

import corkscrew from "./corkscrew.js?v=source";
import diamond from "./diamond.js?v=source";
import fridge from "./fridge.js?v=source";
import photograph from "./photograph.js?v=source";
import snuffbox from "./snuffbox.js?v=source";
import weathercock from "./weathercock.js?v=source";

const modules = [fridge, diamond, photograph, corkscrew, snuffbox, weathercock];

function mergeRoomHooks(current, additions) {
  const merged = { ...current };
  for (const [roomId, handlers] of Object.entries(additions || {})) {
    merged[roomId] = { ...(merged[roomId] || {}) };
    for (const [verb, handler] of Object.entries(handlers)) {
      const prior = merged[roomId][verb];
      merged[roomId][verb] = prior
        ? [...(Array.isArray(prior) ? prior : [prior]), handler]
        : handler;
    }
  }
  return merged;
}

function mergeModules(entries) {
  return entries.reduce((merged, module) => ({
    rooms: { ...merged.rooms, ...(module.rooms || {}) },
    items: { ...merged.items, ...(module.items || {}) },
    content: {
      rooms: { ...merged.content.rooms, ...(module.content?.rooms || {}) },
      items: { ...merged.content.items, ...(module.content?.items || {}) },
    },
    shortNames: {
      rooms: { ...merged.shortNames.rooms, ...(module.shortNames?.rooms || {}) },
      items: { ...merged.shortNames.items, ...(module.shortNames?.items || {}) },
    },
    progressAwards: { ...merged.progressAwards, ...(module.progressAwards || {}) },
    hints: [...merged.hints, ...(module.hints || [])],
    roomHooks: mergeRoomHooks(merged.roomHooks, module.roomHooks),
    flavorPools: { ...merged.flavorPools, ...(module.flavorPools || {}) },
  }), {
    rooms: {},
    items: {},
    content: { rooms: {}, items: {} },
    shortNames: { rooms: {}, items: {} },
    progressAwards: {},
    hints: [],
    roomHooks: {},
    flavorPools: {},
  });
}

export default mergeModules(modules);

// end index.js
