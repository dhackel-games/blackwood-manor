// tilemap.js — CHAPTER 2 PHASE-0 SPIKE (isolated; not part of the shipped game).
//
// Goal: prove an 8-bit, Ultima-style top-down tile view of the manor can be
// rendered from the SAME spatial data the text game's MAP command already uses
// (floors as a grid of rooms + links + fog-of-war), and that it coexists with
// the text engine (bottom = transcript + stats, top = this canvas).
//
// ISOLATION NOTE: the FLOORS/LABELS data below is COPIED verbatim from
// web/js/map.js so this spike touches nothing in web/js, web/css or index.html.
// That guarantees the current game and its 365 tests are completely unaffected.
// In Phase 1 (real integration) map.js would export this data and we'd share it.
//
// ART SEAM: rendering is split into (1) pure layout -> a tile-type grid, and
// (2) a drawer. The drawer paints flat "programmer-art" blocks today, but takes
// an optional { atlas, atlasMap } so a Firefly/NanoBanana 16x16 tileset drops in
// with zero layout changes (see spike/README.md for the generation prompt).

// ---------------------------------------------------------------------------
// Manor layout — COPIED from web/js/map.js (do not edit here; edit map.js and
// re-copy during Phase 1 integration).
// ---------------------------------------------------------------------------
export const LABELS = {
  hedgeMazeGate: "Hedge Maze", dragonCaveMouth: "Dragon Cave",
  dragonAntechamber: "Antechamber", mineGallery: "Mine Gallery",
  deepShaft: "Deep Shaft", trollGate: "Troll Gate", dreadmawVault: "Dreadmaw Vault",
  gate: "Front Gate", garden: "Garden", privy: "Privy", greatOak: "Great Oak", porch: "Porch",
  grandHall: "Royal Hall", parlor: "Parlor", library: "Library",
  diningRoom: "Dining Rm", kitchen: "Kitchen", landing: "Landing",
  nursery: "Nursery", masterBedroom: "Grand Bedroom", hallBedroom: "Hall Bedroom", study: "Study",
  attic: "Attic", wineCellar: "Cellar", crypt: "Crypt",
  roof: "Roof", belfry: "Belfry", hiddenVault: "Astral Chamber",
  treeFort: "Tree Fort",
  secretChamber: "Hidden Rm", hollowPassage: "Passage", hollowSanctum: "Sanctum",
};

export const SECRET = new Set([
  "hollowPassage", "hollowSanctum", "secretChamber", "hiddenVault", "dreadmawVault",
]);

export const FLOORS = [
  {
    title: "UPSTAIRS",
    rooms: [
      { id: "attic", col: 1, row: 0 },
      { id: "nursery", col: 0, row: 1 },
      { id: "landing", col: 1, row: 1 },
      { id: "masterBedroom", col: 2, row: 1 },
      { id: "study", col: 1, row: 2 },
      { id: "hallBedroom", col: 2, row: 2 },
    ],
    links: [
      { a: "attic", b: "landing", note: "ladder" },
      { a: "nursery", b: "landing" },
      { a: "landing", b: "masterBedroom" },
      { a: "landing", b: "study" },
      { a: "landing", b: "hallBedroom" },
    ],
    start: "landing",
  },
  {
    title: "ROOFLINE",
    rooms: [
      { id: "attic", col: 0, row: 0, anchor: true },
      { id: "roof", col: 1, row: 0 },
      { id: "belfry", col: 2, row: 0 },
      { id: "hiddenVault", col: 2, row: 1 },
    ],
    links: [
      { a: "attic", b: "roof", note: "fly" },
      { a: "roof", b: "belfry" },
      { a: "belfry", b: "hiddenVault", note: "down" },
    ],
    start: "roof",
  },
  {
    title: "GROUND FLOOR",
    rooms: [
      { id: "hollowSanctum", col: 1, row: 0 },
      { id: "hollowPassage", col: 1, row: 1 },
      { id: "diningRoom", col: 0, row: 2 },
      { id: "grandHall", col: 1, row: 2 },
      { id: "parlor", col: 2, row: 2 },
      { id: "kitchen", col: 0, row: 3 },
      { id: "porch", col: 1, row: 3 },
      { id: "library", col: 2, row: 3 },
    ],
    links: [
      { a: "hollowSanctum", b: "hollowPassage" },
      { a: "hollowPassage", b: "grandHall" },
      { a: "diningRoom", b: "grandHall" },
      { a: "grandHall", b: "parlor" },
      { a: "diningRoom", b: "kitchen" },
      { a: "grandHall", b: "porch" },
      { a: "parlor", b: "library" },
    ],
    start: "grandHall",
  },
  {
    title: "THE GROUNDS",
    rooms: [
      { id: "porch", col: 1, row: 0, anchor: true },
      { id: "hedgeMazeGate", col: 0, row: 1 },
      { id: "gate", col: 1, row: 1 },
      { id: "garden", col: 2, row: 1 },
      { id: "privy", col: 3, row: 1 },
      { id: "greatOak", col: 4, row: 1 },
      { id: "dragonCaveMouth", col: 0, row: 2 },
    ],
    links: [
      { a: "porch", b: "gate" },
      { a: "hedgeMazeGate", b: "gate" },
      { a: "hedgeMazeGate", b: "dragonCaveMouth", note: "maze" },
      { a: "gate", b: "garden" },
      { a: "garden", b: "privy" },
      { a: "privy", b: "greatOak" },
    ],
    start: "gate",
  },
  {
    title: "TREE CANOPY",
    rooms: [
      { id: "treeFort", col: 0, row: 0 },
      { id: "greatOak", col: 0, row: 1, anchor: true },
    ],
    links: [
      { a: "treeFort", b: "greatOak", note: "lift" },
    ],
    start: "treeFort",
  },
  {
    title: "BELOW",
    rooms: [
      { id: "kitchen", col: 0, row: 0, anchor: true },
      { id: "library", col: 2, row: 0, anchor: true },
      { id: "wineCellar", col: 0, row: 1 },
      { id: "secretChamber", col: 2, row: 1 },
      { id: "crypt", col: 0, row: 2 },
    ],
    links: [
      { a: "kitchen", b: "wineCellar", note: "down" },
      { a: "wineCellar", b: "crypt" },
      { a: "library", b: "secretChamber", note: "down" },
    ],
    start: "wineCellar",
  },
  {
    title: "DREADMAW'S CAVE",
    rooms: [
      { id: "dragonCaveMouth", col: 0, row: 0, anchor: true },
      { id: "dragonAntechamber", col: 1, row: 0 },
      { id: "mineGallery", col: 2, row: 0 },
      { id: "deepShaft", col: 2, row: 1 },
      { id: "trollGate", col: 3, row: 1 },
      { id: "dreadmawVault", col: 4, row: 1 },
    ],
    links: [
      { a: "dragonCaveMouth", b: "dragonAntechamber" },
      { a: "dragonAntechamber", b: "mineGallery" },
      { a: "mineGallery", b: "deepShaft", note: "down" },
      { a: "deepShaft", b: "trollGate" },
      { a: "trollGate", b: "dreadmawVault" },
    ],
    start: "dragonAntechamber",
  },
];

// ---------------------------------------------------------------------------
// Tile model
// ---------------------------------------------------------------------------
export const TILE = Object.freeze({
  VOID: 0,     // outside the manor
  FLOOR: 1,    // walkable room interior
  WALL: 2,     // room perimeter
  DOOR: 3,     // opening where a corridor meets a room
  CORRIDOR: 4, // passage between rooms
  FOG: 5,      // room you have not entered yet (?????)
  STAIR: 6,    // a noted link: down / up / ladder / fly / lift / maze
  PLAYER: 7,   // you-are-here marker
});

// Order MUST match the Firefly tileset strip described in spike/README.md.
export const ATLAS_ORDER = [
  TILE.VOID, TILE.FLOOR, TILE.WALL, TILE.DOOR,
  TILE.CORRIDOR, TILE.FOG, TILE.STAIR, TILE.PLAYER,
];

// Moody haunted-manor palette with a phosphor-green "you" marker so the 8-bit
// screen still reads as the same product as the green-CRT text UI.
export const PALETTE = {
  [TILE.VOID]: "#05070a",
  [TILE.FLOOR]: "#241a2e",
  [TILE.WALL]: "#6b5a7a",
  [TILE.DOOR]: "#b8863b",
  [TILE.CORRIDOR]: "#2f2a22",
  [TILE.FOG]: "#0e1230",
  [TILE.STAIR]: "#7ad0ff",
  [TILE.PLAYER]: "#49ff7a",
  grid: "#000000",
  ink: "#c9f5d4",
};

// Room-block geometry, in tiles.
const ROOM_W = 7;
const ROOM_H = 5;
const CORR = 3;                 // corridor length between adjacent rooms
const CELL_W = ROOM_W + CORR;   // grid pitch
const CELL_H = ROOM_H + CORR;

const originX = (col) => col * CELL_W;
const originY = (row) => row * CELL_H;
const midX = (col) => originX(col) + (ROOM_W >> 1);
const midY = (row) => originY(row) + (ROOM_H >> 1);

/**
 * Pure layout: turn a floor (+ which rooms are "seen" + player room) into a
 * grid of TILE ids plus label boxes. No DOM — usable in the browser and Node.
 */
export function buildTileGrid(floor, { isSeen = () => true, playerRoom = null } = {}) {
  const rooms = floor.rooms;
  const maxCol = Math.max(...rooms.map((r) => r.col));
  const maxRow = Math.max(...rooms.map((r) => r.row));
  const w = originX(maxCol) + ROOM_W + 1;
  const h = originY(maxRow) + ROOM_H + 1;
  const grid = Array.from({ length: h }, () => new Array(w).fill(TILE.VOID));

  const set = (x, y, t) => {
    if (x >= 0 && x < w && y >= 0 && y < h) grid[y][x] = t;
  };
  const at = (x, y) => (x >= 0 && x < w && y >= 0 && y < h ? grid[y][x] : TILE.VOID);

  const byId = new Map(rooms.map((r) => [r.id, r]));
  const boxes = [];

  // Rooms
  for (const r of rooms) {
    const x0 = originX(r.col);
    const y0 = originY(r.row);
    const seen = isSeen(r.id);
    for (let y = 0; y < ROOM_H; y++) {
      for (let x = 0; x < ROOM_W; x++) {
        const border = x === 0 || y === 0 || x === ROOM_W - 1 || y === ROOM_H - 1;
        set(x0 + x, y0 + y, border ? TILE.WALL : (seen ? TILE.FLOOR : TILE.FOG));
      }
    }
    boxes.push({
      id: r.id, anchor: !!r.anchor, seen,
      label: seen ? (LABELS[r.id] || r.id) : "?????",
      x: x0, y: y0, w: ROOM_W, h: ROOM_H,
    });
  }

  // Corridors (links). Door tiles are punched where a corridor meets a wall.
  for (const link of floor.links) {
    const a = byId.get(link.a);
    const b = byId.get(link.b);
    if (!a || !b) continue;

    if (a.row === b.row) {
      const [l, r] = a.col < b.col ? [a, b] : [b, a];
      const y = midY(l.row);
      const from = originX(l.col) + ROOM_W - 1;
      const to = originX(r.col);
      set(from, y, TILE.DOOR);
      set(to, y, TILE.DOOR);
      for (let x = from + 1; x < to; x++) set(x, y, TILE.CORRIDOR);
      if (link.note) set(Math.floor((from + to) / 2), y, TILE.STAIR);
    } else if (a.col === b.col) {
      const [t, bt] = a.row < b.row ? [a, b] : [b, a];
      const x = midX(t.col);
      const from = originY(t.row) + ROOM_H - 1;
      const to = originY(bt.row);
      set(x, from, TILE.DOOR);
      set(x, to, TILE.DOOR);
      for (let y = from + 1; y < to; y++) set(x, y, TILE.CORRIDOR);
      if (link.note) set(x, Math.floor((from + to) / 2), TILE.STAIR);
    } else {
      // L-shaped fallback for diagonal links: vertical then horizontal.
      const x = midX(a.col);
      const yA = midY(a.row);
      const yB = midY(b.row);
      for (let y = Math.min(yA, yB); y <= Math.max(yA, yB); y++) {
        if (at(x, y) === TILE.VOID) set(x, y, TILE.CORRIDOR);
      }
      const xB = midX(b.col);
      for (let xx = Math.min(x, xB); xx <= Math.max(x, xB); xx++) {
        if (at(xx, yB) === TILE.VOID) set(xx, yB, TILE.CORRIDOR);
      }
      if (link.note) set(x, yB, TILE.STAIR);
    }
  }

  // Player marker (center of the room interior).
  const pid = playerRoom || floor.start;
  const pr = byId.get(pid);
  if (pr && isSeen(pr.id)) set(midX(pr.col), midY(pr.row), TILE.PLAYER);

  return { grid, w, h, boxes, playerRoom: pid };
}

// ---------------------------------------------------------------------------
// Canvas drawer (browser). Draws flat blocks today; drops in a Firefly atlas
// when one is supplied. Node preview (spike/preview.mjs) reuses buildTileGrid
// with its own PNG writer, so this function is browser-only by design.
// ---------------------------------------------------------------------------
export function drawToCanvas(canvas, layout, opts = {}) {
  const { grid, w, h, boxes } = layout;
  const tile = opts.tile || 16;
  const scale = opts.scale || 2;
  const atlas = opts.atlas || null;      // HTMLImageElement of the tile strip
  const atlasMap = opts.atlasMap || null; // { [TILE]: sxIndex }
  const atlasTile = opts.atlasTile || 16; // source tile size in the atlas
  const showLabels = opts.showLabels !== false;

  canvas.width = w * tile;
  canvas.height = h * tile;
  canvas.style.width = `${w * tile * scale}px`;
  canvas.style.height = `${h * tile * scale}px`;
  canvas.style.imageRendering = "pixelated";

  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = PALETTE[TILE.VOID];
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const t = grid[y][x];
      const px = x * tile;
      const py = y * tile;
      if (atlas && atlasMap && atlasMap[t] != null) {
        // The ghost sprite has a transparent background, so lay a floor tile
        // beneath it (and beneath the stair) instead of showing the void.
        if ((t === TILE.PLAYER || t === TILE.STAIR) && atlasMap[TILE.FLOOR] != null) {
          ctx.drawImage(atlas, atlasMap[TILE.FLOOR] * atlasTile, 0, atlasTile, atlasTile, px, py, tile, tile);
        }
        ctx.drawImage(atlas, atlasMap[t] * atlasTile, 0, atlasTile, atlasTile, px, py, tile, tile);
        continue;
      }
      if (t === TILE.VOID) continue;
      ctx.fillStyle = PALETTE[t];
      ctx.fillRect(px, py, tile, tile);
      // Chunky bevel for depth.
      ctx.fillStyle = "rgba(255,255,255,0.10)";
      ctx.fillRect(px, py, tile, 2);
      ctx.fillRect(px, py, 2, tile);
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.fillRect(px, py + tile - 2, tile, 2);
      ctx.fillRect(px + tile - 2, py, 2, tile);
      if (t === TILE.PLAYER) {
        ctx.fillStyle = "#062a12";
        ctx.fillRect(px + tile / 2 - 2, py + tile / 2 - 2, 4, 4);
      }
      if (t === TILE.FOG) {
        ctx.fillStyle = "rgba(120,140,255,0.5)";
        ctx.fillRect(px + tile / 2 - 1, py + tile / 2 - 3, 2, 4);
        ctx.fillRect(px + tile / 2 - 1, py + tile / 2 + 2, 2, 2);
      }
    }
  }

  if (showLabels) {
    ctx.fillStyle = PALETTE.ink;
    ctx.font = `${Math.round(tile * 0.5)}px "Courier New", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const box of boxes) {
      const cx = (box.x + box.w / 2) * tile;
      const cy = (box.y + box.h / 2) * tile + tile * 0.9;
      ctx.globalAlpha = box.anchor ? 0.45 : 0.95;
      const text = box.anchor ? `(${box.label})` : box.label;
      ctx.fillText(text.toUpperCase(), cx, cy);
    }
    ctx.globalAlpha = 1;
  }
}

// ---------------------------------------------------------------------------
// Chapter 2 movement + AI helpers (pure; no DOM). These treat the whole manor
// as ONE connected graph: a room that appears on two floors (an "anchor") is
// the same physical node, so walking onto it moves you between floors — that's
// how stairs/ladders/the well work for free. All of this is spike-only logic
// that validates the core loop; none of it is in the shipped game.
// ---------------------------------------------------------------------------

// Unify rooms across floors. Returns:
//   home: id -> { floorIndex, col, row, label }  (the floor where it's "real")
//   adj:  id -> [ { id, note } ]                  (every connection, both ways)
export function buildManorGraph() {
  const home = new Map();
  const adj = new Map();
  const link = (a, b, note) => {
    if (!adj.has(a)) adj.set(a, []);
    if (!adj.get(a).some((n) => n.id === b)) adj.get(a).push({ id: b, note: note || null });
  };
  FLOORS.forEach((f, fi) => {
    for (const r of f.rooms) {
      if (!r.anchor && !home.has(r.id)) {
        home.set(r.id, { floorIndex: fi, col: r.col, row: r.row, label: LABELS[r.id] || r.id });
      }
    }
  });
  for (const f of FLOORS) {
    for (const l of f.links) { link(l.a, l.b, l.note); link(l.b, l.a, l.note); }
  }
  // Connections map.js encodes as prose in a floor's `foot` text rather than as
  // data links. Mirrored here (spike-only) so the manor is one walkable graph.
  const PROSE_STAIRS = [
    { a: "grandHall", b: "landing", note: "up" }, // "Royal Hall goes UP to the Landing."
  ];
  for (const s of PROSE_STAIRS) { link(s.a, s.b, s.note); link(s.b, s.a, s.note); }
  // Any room only ever seen as an anchor still needs a home (fallback to first).
  for (const id of adj.keys()) {
    if (!home.has(id)) {
      for (let fi = 0; fi < FLOORS.length; fi++) {
        const r = FLOORS[fi].rooms.find((rr) => rr.id === id);
        if (r) { home.set(id, { floorIndex: fi, col: r.col, row: r.row, label: LABELS[id] || id }); break; }
      }
    }
  }
  return { home, adj };
}

// Where a room sits on a given floor (real OR anchor), or null if absent.
export function coordsOnFloor(floorIndex, id) {
  const f = FLOORS[floorIndex];
  if (!f) return null;
  const r = f.rooms.find((rr) => rr.id === id);
  return r ? { col: r.col, row: r.row } : null;
}

// Pick the neighbour of `fromId` (on `floorIndex`) that best matches an arrow
// press (dx,dy in {-1,0,1}). Returns a neighbour id or null.
export function neighborInDirection(graph, floorIndex, fromId, dx, dy) {
  const cur = coordsOnFloor(floorIndex, fromId);
  if (!cur) return null;
  let best = null, bestScore = Infinity;
  for (const n of graph.adj.get(fromId) || []) {
    const nc = coordsOnFloor(floorIndex, n.id);
    if (!nc) continue; // neighbour is on another floor — use an exit button
    const ddx = nc.col - cur.col, ddy = nc.row - cur.row;
    const alignH = dx !== 0 && Math.sign(ddx) === dx && Math.abs(ddx) >= Math.abs(ddy);
    const alignV = dy !== 0 && Math.sign(ddy) === dy && Math.abs(ddy) >= Math.abs(ddx);
    if (!alignH && !alignV) continue;
    const score = Math.abs(ddx) + Math.abs(ddy);
    if (score < bestScore) { bestScore = score; best = n.id; }
  }
  return best;
}

// Neighbours reachable only by leaving this floor (stairs/ladder/well/etc.).
export function crossFloorExits(graph, floorIndex, fromId) {
  const out = [];
  for (const n of graph.adj.get(fromId) || []) {
    if (!coordsOnFloor(floorIndex, n.id)) {
      const h = graph.home.get(n.id);
      out.push({ id: n.id, note: n.note, label: (h && h.label) || n.id });
    }
  }
  return out;
}

// One step of Guest AI. Guests wander, but if any room they can reach holds
// bait they drift toward the nearest baited room (breadth-first over the manor
// graph). This is the seed of "manipulate the human": you place bait, they come.
export function guestStep(graph, guestId, baitSet, rng = Math.random) {
  const neighbours = (graph.adj.get(guestId) || []).map((n) => n.id);
  if (!neighbours.length) return guestId;

  // BFS to the nearest baited room; step toward it.
  if (baitSet && baitSet.size) {
    const prev = new Map([[guestId, null]]);
    const queue = [guestId];
    let target = null;
    while (queue.length) {
      const cur = queue.shift();
      if (baitSet.has(cur) && cur !== guestId) { target = cur; break; }
      for (const n of graph.adj.get(cur) || []) {
        if (!prev.has(n.id)) { prev.set(n.id, cur); queue.push(n.id); }
      }
    }
    if (target) {
      let step = target;
      while (prev.get(step) && prev.get(step) !== guestId) step = prev.get(step);
      return step;
    }
  }
  // No bait in reach: wander.
  return neighbours[Math.floor(rng() * neighbours.length)];
}
