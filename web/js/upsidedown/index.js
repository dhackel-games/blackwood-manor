// index.js. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.001:acoven.

import campfire from "./campfire.js?v=source";
import demogorgonzola from "./demogorgonzola.js?v=source";
import lowerpanel from "./lowerpanel.js?v=source";
import planetarium from "./planetarium.js?v=source";
import radio from "./radio.js?v=source";
import radioClues from "./radio-clues.js?v=source";
import realm from "./realm.js?v=source";
import shack from "./shack.js?v=source";

const modules = [realm, demogorgonzola, radio, radioClues, planetarium, shack, campfire, lowerpanel];

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

function mergeContent(current, additions) {
  const merged = { ...current };
  for (const [id, prose] of Object.entries(additions || {})) {
    merged[id] = { ...(merged[id] || {}), ...prose };
  }
  return merged;
}

function mergeModules(entries) {
  return entries.reduce((merged, module) => ({
    rooms: { ...merged.rooms, ...(module.rooms || {}) },
    items: { ...merged.items, ...(module.items || {}) },
    content: {
      rooms: mergeContent(merged.content.rooms, module.content?.rooms),
      items: mergeContent(merged.content.items, module.content?.items),
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
