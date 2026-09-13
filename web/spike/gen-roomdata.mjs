// gen-roomdata.mjs — author-time extractor (SPIKE, isolated).
//
// Pulls the REAL room descriptions + item placements out of the shipped world
// data (world.js / world.content.js) and freezes them into a static
// roomdata.json that the spike page reads at runtime. This keeps the spike from
// importing any engine LOGIC in the browser — it only ever loads plain JSON.
//
// Regenerate after world edits:  node web/spike/gen-roomdata.mjs
//
// The engine sources import each other with a "?v=source" cache-buster that
// only the browser understands, so we copy the handful of pure-data modules to
// a temp dir with that suffix stripped, import the composed `world`, and dump
// what we need.

import { mkdtempSync, copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const jsDir = join(here, "..", "js");

// Only the pure-data modules world.js transitively needs. None touch the DOM.
const MODULES = ["map.js", "compose.js", "world.content.js", "world.js"];

const tmp = mkdtempSync(join(tmpdir(), "bm-roomdata-"));
for (const m of MODULES) {
  const src = readFileSync(join(jsDir, m), "utf8").replaceAll("?v=source", "");
  writeFileSync(join(tmp, m), src);
}

const { world } = await import(pathToFileURL(join(tmp, "world.js")).href);

// Resolve an item's owning room by walking loc -> (item | room).
const rooms = world.rooms || {};
function roomOf(item) {
  let loc = item.loc, guard = 0;
  while (loc && !rooms[loc] && guard++ < 10) {
    const parent = world.items[loc];
    if (!parent) return null;
    loc = parent.loc;
  }
  return loc && rooms[loc] ? loc : null;
}

function kindOf(it) {
  if (it.takeable) return "takeable";
  if (it.container) return "container";
  if (it.scenery) return "scenery";
  return "fixture";
}

const out = {};
for (const [id, r] of Object.entries(rooms)) {
  out[id] = { name: r.name || id, desc: (r.desc || "").trim(), items: [] };
}
for (const [id, it] of Object.entries(world.items || {})) {
  const room = roomOf(it);
  if (!room || !out[room]) continue;
  const label = (it.names && it.names[0]) || id;
  out[room].items.push({ id, label, kind: kindOf(it) });
}

// Stable ordering: takeable first (the interesting stuff), then by label.
const rank = { takeable: 0, container: 1, scenery: 2, fixture: 3 };
for (const r of Object.values(out)) {
  r.items.sort((a, b) => (rank[a.kind] - rank[b.kind]) || a.label.localeCompare(b.label));
}

writeFileSync(join(here, "roomdata.json"), JSON.stringify(out, null, 2) + "\n");
const n = Object.keys(out).length;
const items = Object.values(out).reduce((s, r) => s + r.items.length, 0);
console.log(`wrote roomdata.json — ${n} rooms, ${items} placed items`);
