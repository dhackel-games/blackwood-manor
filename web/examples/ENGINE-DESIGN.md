# Engine design & simplification backlog — Dave & Andy Games

A living design doc for turning the Blackwood Manor engine into a genre-neutral
text-adventure engine. Add to it freely; it is not shipped to players.

## The core insight

Blackwood is already ~70% **data-driven**. Items aren't defined by code — they're
rows of declarative properties that generic engine *systems* interpret:

```
lightSource, lit, fuel, selfPowered, lowFuelMsg    → light/fuel system
wearable, wearSlot, grantsFlight, grantsDarkVision → wearable-capability system
container, capacity, openable, open, locked, keyId → container/lock system
treasure, points, progressPoints, progressFlag     → scoring system
```

Every simplification below is the **same move**: take behaviour that's currently
sprinkled through imperative handlers and express it as a **data table** read by
**one generic system**. The engine stops knowing about candles and grues; it
knows about `lightSource`, `capability`, `recipe`, `award`, `verb`. Different
rows → different genre. That is what makes it reusable for a space game, an
office game, or a submarine adventure.

## Backlog (each: what's spread out today → the table → status)

### 1. Item capability table
- **Today:** most items are clean data, but the interesting ones hand-roll logic
  in `on:{verb}` (candlestick `light`, `brazier`, match/self-fire, mystery
  package) — see `web/js/world.js` `candlestick:` (~4151), `brazier:` (~lightBrazier).
- **Target:** declarative capabilities: `flame:{lightsWith:"match", duration:120,
  oneTimeSource:true}`, `goesIn:"reliquary"`, `grants:["flight"]`. Extend the
  property vocabulary the engine already interprets; delete the bespoke handlers.
- **Status:** planned. Migrate behind a shim so `on:{}` keeps working during transition.

### 2. Achievements / scoring table  ✅ PROTOTYPED
- **Today (Blackwood):** `PROGRESS_AWARDS` is a table, but it's *fired* from ~25
  scattered `awardProgress(ctx, "…")` calls buried in handlers across `world.js`.
- **Target:** declarative triggers `{ id, points, message?, when(game)=>bool }`,
  fired once by one system — no award bookkeeping in handlers.
- **Status:** **built additively.** Generic interpreter = `checkAchievements()` in
  `web/js/core.js` (no-op unless a game defines `world.achievements`). Demonstrated
  in `web/examples/spaceport/world.js` (`achievements:[…]`) and covered by
  `web/tests/features/example-game.feature`. Blackwood defines no table → identical
  behaviour (full suite green). Next: migrate Blackwood's `awardProgress` calls onto
  this table.

### 3. Rooms auto-compose from the item list
- **Today:** room prose re-types item names by hand ("a cold iron BRAZIER stands…").
- **Target:** items carry `roomDesc`/`loc` (many already do); the room renderer
  appends placed items automatically. Adding an item to a room = one row.
- **Status:** planned (additive).

### 4. Verb + synonym table
- **Today:** `web/js/parser.js` hardcodes English verbs/directions.
- **Target:** a per-game `verbs` table. The multi-genre unlock: sub adds
  `dive/surface/ballast`, office adds `email/print/schmooze`, space adds
  `dock/vent/compute` — no parser edits.
- **Status:** planned.

### 5. Interaction / recipe table
- **Today:** "match + candle", "candle + brazier", "fire + wrapper" logic is
  scattered prose.
- **Target:** `recipes` rows: `use match on candle → light it, consume match`.
  Collapses many handlers into data; new combos are trivial.
- **Status:** planned.

### 6. Message / string table
- **Today:** user-facing strings welded into logic (grue warning, Gary lines,
  fail text).
- **Target:** keyed message table → reskin tone per game (spooky → corporate →
  naval), single place to edit copy, engine ships no game-specific prose.
- **Status:** planned (pure extraction, backward-compatible).

### 7. HUD slots as per-game config
- **Today:** `web/js/hud.js` `HUD_SLOT_DEFINITIONS` mixes generic slots (score,
  inventory, phone) with Blackwood-specific ones (reliquary, vision).
- **Target:** move content slots into game data (`hudSlots:[…]`). Sub shows
  `depth/oxygen`; office shows `deadline/boss-mood` — same slot framework.
- **Status:** planned.

### 8. Effects / capabilities registry (lightweight ECS)
- **Today:** `grantsFlight`, `grantsDarkVision`, `carryCapacity` are ad-hoc
  booleans checked in various places.
- **Target:** a small named-effect component list any item/room/state can grant.
  The abstraction that lets 1–7 compose cleanly.
- **Status:** planned.

## Multi-genre payoff (same tables, different rows)

| System            | Blackwood            | Space               | Office              | Submarine          |
|-------------------|----------------------|---------------------|---------------------|--------------------|
| light/fuel        | candle, headlamp     | oxygen, torch       | phone battery       | dive light         |
| container/lock    | reliquary, cellar    | airlock             | filing cabinet      | torpedo tube       |
| capability/effect | winged shoes (fly)   | mag-boots           | keycard badge       | rebreather         |
| recipe            | match→candle         | fuel→thruster       | coffee→focus        | ballast→depth      |
| achievements      | heirlooms returned   | reach escape pod    | ship the project    | survive to surface |
| HUD slots         | reliquary, phone     | oxygen, hull        | deadline, boss-mood | depth, air         |
| verbs             | ring, burn           | dock, vent          | email, schmooze     | dive, surface      |

## Sequencing (low → high risk)

1. **#2 achievements** ✅ + **#6 messages** — pure extraction, backward-compatible.
2. **#3 room auto-compose** — additive, shrinks `world.js`.
3. **#1 item capabilities + #5 recipes** — heart of the idea; migrate behind a
   compatibility shim so `on:{}` still works mid-migration.
4. **#4 verbs + #7 HUD + #8 effects** — the generalizations that flip it into a
   genre-neutral engine.

## Migration principles

- **Additive first.** Prove each system on `web/examples/spaceport` before touching
  Blackwood's `world.js` (hot file, frequent Andy commits — minimize conflicts).
- **No-op without the table.** A game that doesn't declare the new table behaves
  exactly as before (see #2's `checkAchievements`). Keeps the full suite green at
  every step.
- **Shim, don't rip.** For behaviour still in `on:{}`, keep the handler path working
  while the declarative path is introduced; migrate item-by-item.
