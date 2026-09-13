# Building a new game on the engine — Dave & Andy Games

Blackwood Manor's engine is game-agnostic. The files under `web/js/` split cleanly
into a **reusable engine** and **per-game content**, and this folder is a complete,
minimal second game (`spaceport/world.js`, "Escape the Derelict") that runs on that
engine with no engine changes. `web/tests/features/example-game.feature` plays it
end-to-end in CI, so the reusability guarantee can't silently regress.

## The reusable modules (no game content)

| Module | Role |
|--------|------|
| `js/core.js` | Game state + rules. `createGame(world)` → the live game. DOM-free, content-free. |
| `js/parser.js` | Raw input → `{ verb, dobj, prep, iobj }`. Generic vocabulary. |
| `js/commands.js` | Default verb handlers (take/drop/open/go/look/…). |
| `js/map.js` | ASCII map from visited rooms. |
| `js/save.js` | Save/restore. |
| `js/hud.js` | `HudSlot` class (the slot framework; see the backlog re: content-specific slots). |

Per-game content lives in **one file**: a `world` module like `spaceport/world.js`
(Blackwood's is `js/world.js`). The engine never imports the content — you pass it in.

## The world contract

```js
export const world = {
  config: {
    start: "roomId",       // required: starting room
    maxCarry: 6,           // optional: inventory cap (default 99)
    winBanner: "…",        // optional: end-screen banner (string or fn(game)=>string)
  },
  rooms: {
    roomId: {
      name: "Room Name",
      desc: "Long description.",
      dark: true,          // optional: engages the darkness + grue mechanic
      exits: { north: "otherRoomId", down: "…" },   // compass + up/down/in/out
    },
  },
  items: {
    itemId: {
      names: ["thing", "alias"],
      adjectives: ["blue"],
      loc: "roomId",       // roomId | "inventory" | containerId | null
      takeable: true,
      lightSource: true, lit: true,   // carry a lit light source to see in the dark
      fixed: true,         // can't be taken
      on: {                // handlers intercept a verb; return a string, or ctx.win(...)
        use(ctx) {
          if (!ctx.has("keycard")) return "It needs a keycard.";
          return ctx.win("You escape.");
        },
      },
    },
  },
};
```

Handler `ctx` API (see `js/world.js` header for the full list): `ctx.has(id)`,
`ctx.here(id)`, `ctx.item(id)`, `ctx.roomOf(id)`, `ctx.moveItem(id,to)`,
`ctx.addScore(n)`, `ctx.setFlag/getFlag`, `ctx.kill(msg)`, `ctx.win(msg)`.

## To make a new game

1. Copy `spaceport/world.js` to `<yourgame>/world.js` and rewrite the data.
2. Point a host at it: `createGame(yourWorld)` (see `js/ui.js` for the DOM adapter).
3. Add a feature that plays it (copy `tests/features/example-game.feature`).

## Generalization backlog (engine still leaks a little content)

These are the concrete blockers to a fully game-neutral engine, found while
building this example. Each is a small, backward-compatible follow-up:

- **Win banner** — ✅ done: `config.winBanner` (defaults to Blackwood's line).
- **Directions** — `parser.js` only knows compass + up/down/in/out; custom
  directions (e.g. fore/aft) aren't parsed. Make the direction vocabulary
  config-driven.
- **Lighting** — `light <thing>` assumes a match/flame item exists. Make the
  "ignition source" a config option (or let a `lightSource` be self-igniting).
- **HUD slots** — `hud.js` `HUD_SLOT_DEFINITIONS` mixes generic slots (score,
  inventory) with Blackwood-specific ones (reliquary, bowel pressure, mushroom,
  vision…). Move content slots into the game.
- **Branding/config** — `issue-report.js` (repo URL), `version.js`, and the iOS
  harness (`remoteBase`, bundle id, display name) hardcode Blackwood/`dhackel-games`.
  Lift into a per-game config so the studio identity is set in one place.
