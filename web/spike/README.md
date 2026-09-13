# Chapter 2 — 8-bit tile-map spike (Phase 0)

A throwaway proof-of-concept that renders Blackwood Manor's existing floor data
as an Ultima III/IV-style top-down tile screen on an HTML canvas. It exists to
answer three questions **before** we commit to Chapter 2:

1. Is the text game's room / link / fog data enough to drive a tile view? — **yes.**
2. Is "8-bit map up top, text + stats down below" feasible in the current shell? — **yes.**
3. Is the art a drop-in, or a rewrite? — **drop-in** (swap one atlas image).

## Isolation guarantee

Everything lives under `web/spike/`. It is **not** part of the shipped bundle:

- The manifest test only checks `index.html` + `css/**` + `js/**`, so nothing
  here can break the 365-scenario suite (verified: 365/365 still pass).
- `ios/copy-web.sh` only ships `index.html` + `css` + `js`, so the spike never
  enters the iOS app.
- GitHub Pages uploads all of `web/`, so this page *is* viewable at
  `…/blackwood-manor/spike/tilemap.html` once pushed — handy for phone review.

The floor layout in `tilemap.js` is **copied** from `web/js/map.js` on purpose,
so the spike imports nothing from the live game. Phase 1 would make `map.js`
export that data and delete the copy.

## Run it

```bash
# Browser (interactive: floor selector, fog toggle, atlas loader)
cd web && python3 -m http.server 8080
# open http://localhost:8080/spike/tilemap.html

# Headless PNG previews (no browser, no deps) -> web/spike/preview/*.png
node web/spike/preview.mjs          # all floors
node web/spike/preview.mjs 2 --fog  # ground floor, demo fog-of-war
```

## Phase 1 — what's playable now

The page is now interactive, not just a render test:

- **Move Gary** with arrow keys / WASD, or click an adjacent lit room. Each room
  redraws in 8-bit the moment you enter; unvisited rooms stay fogged.
- **Fixed viewport layout:** the map scrolls (and auto-centers on Gary) while the
  stats row and the amber **text panel** stay pinned at the bottom — they never
  scroll away. Classic "screen up top, text that stays put" arrangement.
- **Room inspector (right panel):** click any room you've already seen to read its
  **real description and item list** (pulled from the shipped world data). A small
  diamond marks seen rooms that contain items — gold = has takeable loot,
  blue = has other stuff.
- **Reveal all (map view):** a pure connectivity view of the whole manor — useful
  on its own for seeing how everything links, independent of gameplay.
- **Lure loop (early):** press **B** (or the button) to drop bait in Gary's room.
  A wandering guest paths toward the nearest bait (`guestStep`); reaching it
  counts as "lured". This is the seed of the Chapter-2 manipulation mechanic.

### roomdata.json (generated, do not hand-edit)

Descriptions + item placements come from the shipped game, frozen at author time
so the browser page never imports any engine *logic*:

```bash
node web/spike/gen-roomdata.mjs   # regenerate after world.js / world.content.js edits
```

It copies the pure-data engine modules to a temp dir (stripping the browser-only
`?v=source` cache-buster), imports the composed `world`, and writes
`web/spike/roomdata.json` (room name, description, `[{label, kind}]` items).



`drawToCanvas` paints flat placeholder blocks today, but takes an optional
`{ atlas, atlasMap }`. Drop a Firefly tileset in and click **load Firefly
atlas…** on the page — the layout is unchanged, only the pixels swap.

### Tileset spec (what to generate)

- **Tile size:** 32 × 32 px in the bundled atlas (the renderer's `atlasTile`).
  Generate larger if you like — the loader resizes down, nearest-neighbor.
- **Layout:** a single horizontal strip, **8 tiles wide × 1 tile tall**
  (256 × 32 px for the bundled atlas), in this exact left-to-right order:

  | # | tile      | meaning                                   |
  |---|-----------|-------------------------------------------|
  | 0 | VOID      | outside the manor / empty black           |
  | 1 | FLOOR     | walkable room interior (floorboards)      |
  | 2 | WALL      | room perimeter (stone/wood wall)          |
  | 3 | DOOR      | doorway where a corridor meets a room     |
  | 4 | CORRIDOR  | passage between rooms (dim planking)      |
  | 5 | FOG       | unexplored room ("?????")                 |
  | 6 | STAIR     | noted exit: stairs / ladder / trapdoor    |
  | 7 | PLAYER    | you = Gary the ghost (glowing wisp)       |

- **Transparency:** VOID and FOG may be fully opaque; PLAYER should sit on top of
  a FLOOR tile, so give it a transparent background.
- **Palette (match the moody CRT identity):** deep near-black `#05070a`,
  dark-purple floor `#241a2e`, dim-mauve stone wall `#6b5a7a`, amber door
  `#b8863b`, phosphor-green Gary `#49ff7a`, icy-blue stair `#7ad0ff`,
  indigo fog `#0e1230`. Limited palette, ~4–5 shades per tile.

### Firefly / NanoBanana prompt

> 8-bit pixel-art tileset, 16×16 pixel tiles arranged as a single horizontal
> strip of 8 tiles (128×16 px), top-down view for a haunted-Victorian-manor
> dungeon-crawler. Left to right: (1) empty black void, (2) worn wooden
> floorboards in dark purple, (3) grey-mauve carved stone wall block, (4) an
> amber wooden door, (5) dim wooden corridor planking, (6) a swirling indigo
> "unexplored" fog tile, (7) an icy-blue stone staircase going down, (8) a
> glowing phosphor-green ghost wisp on a transparent background. Limited retro
> palette, hard-edged pixels, no anti-aliasing, no gradients, crisp 1990s
> tile-map style, high contrast, spooky mood. Each tile clearly distinct and
> tileable edge-to-edge.

Save the result as `web/spike/atlas.png` (a 256×32 strip of eight 32×32 tiles)
and it loads automatically; the "load Firefly atlas…" button lets you try a
different one live. If a model can't do a clean strip, generate the 8 tiles
individually and I'll stitch them.

**Bundled art:** `web/spike/atlas.png` was generated with **NanoBanana
(Gemini Flash, via Firefly)** — it produced a clean, correctly-ordered 8-tile
strip with distinct tiles and a transparent-keyed ghost. Firefly's native model
gave a mis-proportioned strip with muddy, hard-to-distinguish tiles, so
NanoBanana is the recommended generator for future tiles.

## What this is NOT

Still a spike: no win/lose/escape rules, no scoring economy, no Chapter-2 story
beats yet — the lure loop is a bare feel-test, not a designed game. It proves the
data, rendering, layout, and core interactions; the actual Chapter-2 design is
the next step.

## Architecture principle

This spike follows **ADR 0001 — Web-first engine, thin native shell**
(`docs/adr/0001-web-first-engine-thin-native-shell.md`): the entire game/engine
is web; the native layer stays a thin shell so we can eventually port to
Android by reusing the whole web engine. All Chapter 2 code lives in web.
