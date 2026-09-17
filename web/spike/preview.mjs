// preview.mjs — render a floor to a PNG using the SAME buildTileGrid() the
// browser uses, so the spike can be reviewed without a browser and its layout
// is verifiable in CI-like runs. No dependencies (built-in zlib only).
//
// Usage:
//   node web/spike/preview.mjs                 # all floors -> web/spike/preview/*.png
//   node web/spike/preview.mjs 2               # just floor index 2 (GROUND FLOOR)
//   node web/spike/preview.mjs 2 --fog         # with demo fog-of-war

import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { FLOORS, TILE, PALETTE, buildTileGrid } from "../view2d/tilemap.js";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "preview");
mkdirSync(outDir, { recursive: true });

const TILE_PX = 16;

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const RGB = Object.fromEntries(
  Object.entries(PALETTE)
    .filter(([k]) => !Number.isNaN(Number(k)))
    .map(([k, v]) => [k, hexToRgb(v)])
);

function renderPng(layout) {
  const { grid, w, h } = layout;
  const W = w * TILE_PX;
  const H = h * TILE_PX;
  const buf = new Uint8Array(W * H * 4);

  const put = (x, y, [r, g, b], a = 255) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = (y * W + x) * 4;
    buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = a;
  };

  for (let ty = 0; ty < h; ty++) {
    for (let tx = 0; tx < w; tx++) {
      const t = grid[ty][tx];
      const base = RGB[t] || RGB[TILE.VOID];
      for (let py = 0; py < TILE_PX; py++) {
        for (let px = 0; px < TILE_PX; px++) {
          let [r, g, b] = base;
          if (t !== TILE.VOID) {
            const edgeHi = px < 2 || py < 2;
            const edgeLo = px >= TILE_PX - 2 || py >= TILE_PX - 2;
            if (edgeHi) { r = Math.min(255, r + 26); g = Math.min(255, g + 26); b = Math.min(255, b + 26); }
            else if (edgeLo) { r = (r * 0.72) | 0; g = (g * 0.72) | 0; b = (b * 0.72) | 0; }
            const cx = px >= 6 && px < 10 && py >= 6 && py < 10;
            if (t === TILE.PLAYER && cx) { r = 6; g = 42; b = 18; }
            if (t === TILE.STAIR && cx) { r = 20; g = 40; b = 70; }
          }
          put(tx * TILE_PX + px, ty * TILE_PX + py, [r, g, b]);
        }
      }
    }
  }
  return encodePng(W, H, buf);
}

// --- minimal PNG encoder (truecolour + alpha) --------------------------------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const t = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([t, data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePng(w, h, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0;
    Buffer.from(rgba.buffer, y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0)),
  ]);
}
// -----------------------------------------------------------------------------

const args = process.argv.slice(2);
const fog = args.includes("--fog");
const only = args.find((a) => /^\d+$/.test(a));
const indices = only != null ? [Number(only)] : FLOORS.map((_, i) => i);

for (const i of indices) {
  const floor = FLOORS[i];
  if (!floor) { console.error(`no floor ${i}`); continue; }
  let hidden = new Set();
  if (fog) {
    const ids = floor.rooms.filter((r) => !r.anchor).map((r) => r.id);
    hidden = new Set(ids.filter((_, k) => k % 2 === 1));
  }
  const layout = buildTileGrid(floor, { isSeen: (id) => !hidden.has(id) });
  const png = renderPng(layout);
  const slug = floor.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const name = `${String(i)}-${slug}${fog ? "-fog" : ""}.png`;
  writeFileSync(join(outDir, name), png);
  console.log(`${name}  ${layout.w}x${layout.h} tiles  ->  ${png.length} bytes`);
}
