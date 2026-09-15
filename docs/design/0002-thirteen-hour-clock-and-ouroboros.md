# Chapter 2 — The Thirteen-Hour Clock & the Ouroboros (design update)

> **➡️ UPDATE 2026-09-14 (evening) — Hour XIII is now integrated INLINE into the shipped
> game.** The seam and the first hour of the loop are built directly into `web/js/world.js`
> (not a separate page): finish BM1, seal the reliquary, `go down` → the Gary cliffhanger now
> *continues* into Part II — you wake a ghost holding the 13-hour clock, dive into the
> Thirteenth Hour, **find** the living queen at the statue, learn the mirror **pool**, and
> `yell` to petrify her (yelling without the pool trick now **kills** you) — then return the
> emerald to the garden to tick the clock XIII→XII. Jump there with the new **`::brink`** sysop
> command (poised at end of BM1, bell unrung) then `go down`, or `::garycliff` to drop straight
> in. Covered by `web/tests/features/part-two.feature`. The isolated `web/examples/bm2/`
> prototype referenced below is a **superseded scratch draft** (kept out of the repo); the
> inline `world.js` implementation is the source of truth. Hours XII–I and the ouroboros close
> remain to be built on this same pattern.

- **Status:** **PROPOSED (2026-09-14, David + Andy — verbal working session); BM2 FULL
  13-period loop BUILT & playable to the ouroboros 2026-09-14.** Major evolution of the
  RATIFIED Chapter-2 canon in
  [`0001-chapter-2-narrative-continuity.md`](./0001-chapter-2-narrative-continuity.md).
  This doc *supersedes the open BM2 dials* in 0001 (it resolves "two candidate BM2 designs"
  and the "8-bit room + video screen" presentation lean) and **proposes concrete changes to
  BM1's shipped ending.** A runnable BM2 prototype now lives at
  [`web/examples/bm2/`](../../web/examples/bm2/) (`world.js` + a headless `play.mjs` smoke
  test): it plays **all thirteen hours 13 → 0 to the become-Gary ouroboros**, with two hard
  hero scenes (Medusa/emerald + the dragon/RING peeled from a painting), the try-over retry
  mechanic, the name-at-boot identity, and the clock-back text map. It is **fully isolated
  from BM1** (under `examples/`, not the shipped `js/` bundle; all 384 cucumber scenarios still
  pass; 30/30 BM2 smoke checks pass). **David was away when the loop was built, so Q4/Q5 (and
  the hour order + try-over count) are baked in PROVISIONALLY — see "Provisionally decided"
  below.** **BM1-touching changes remain UNBUILT and need David's explicit go — they hit
  `web/js/world.js` and the 383-scenario test suite.**
- **Date:** 2026-09-14
- **Source:** Verbal notes, David + Andy (transcribed). "We know exactly what we want."
- **Why it matters:** This is the piece 0001 left open. It (a) collapses the prequel/sequel
  split into a single **ouroboros**, (b) gives BM2 a real core loop (scatter-in-time across
  **13 time periods**), and (c) introduces the artifact that unifies the whole game — a
  **13-hour clock** that is simultaneously the BM1 ring-payoff, the BM2 master timer, and the
  future 8-bit map surface (Marauder's-Map on its back).

---

## TL;DR — what changed vs. 0001

| Area | RATIFIED in 0001 | PROPOSED here (2026-09-14) |
|---|---|---|
| BM2 shape | Sequel: you work Gary's **phone line** watching a guest gather | Ghost **scatter-in-time**: you replay **13 time periods**, place each heirloom where BM1 will find it |
| Prequel vs sequel | Two rival designs; sequel = "proper," prequel demoted to backstory | **Fused into one loop** — the scatter IS the sequel, because finishing it turns you into Gary for the next cycle. **BM2 = BM1 + BM(−1), all one.** |
| BM1 ring payoff | Ring bell → **BONE KEY** + north **SECRET DOOR** → HOLLOW SANCTUM "dawn" ending | Ring bell → heirlooms **vanish**, a **13-hour clock** appears in the reliquary; **front door flings open** |
| BM1 clean win | Dawn / HOLLOW SANCTUM | **Walk out the open front door** to end the game; **leave *with the talisman* = extra points** (best clean score). |
| BM1 → Gary hand-off | Deposit + **CLOSE** reliquary opens the stair; go DOWN | **USE the TALISMAN in the reliquary** → trapdoor opens → go DOWN into phase 2 (you carry the clock). *Leaving with the talisman instead = extra points but no phase 2.* |
| Presentation | Open dial: "8-bit room + video screen of the castle" | The **screen is the back of the clock** (Marauder's-Map). **Text-first now; 8-bit later.** |
| Identity | Gary = disowned heir; "it's you" implied | **Explicit:** ask the player's name at boot; call the protagonist **"Gary"** throughout; **pay it off at the become-Gary moment** (clock 13 → 1) with the player's own name. You were Gary all along. |

**Unchanged / still canon (from 0001):** reliquary = **prison/containment** (bell *imprisons*,
doesn't destroy — now literalized: the heirlooms disappear); tone = **tragic but funny**;
Gary = disowned heir acting in **self-preservation** because completing the rite **kills him**;
**"Gary profits when you fail."**

---

## Part A — BM1 ending changes (touches the shipped game)

Grounded in `web/js/world.js` (current state machine): depositing all
`REQUIRED_FAMILY_ITEM_COUNT = 13` sets `curseLiftable` + `floorDoorOpen`; an explicit
**CLOSE** sets `reliquarySealed`; **RING** (needs sealed + liftable) sets `bellRung` and drops
the `boneKey` + north `secretDoor`; **GO DOWN** (needs `floorDoorOpen` + `reliquarySealed`,
*not* `bellRung`) runs `garyEnding()` and `saveBm2Seed()`.

Proposed new flow:

1. **Talisman stays simple.** The BM-crested TALISMAN is just another deposit; the **CLOSE**
   is the load-bearing ritual gate. *(Already true in code — no change; David: "just one extra
   thing, it goes into the reliquary, you close the reliquary… you have to close the reliquary
   or it will not work.")* Keep it that way.

2. **Pull the cord / ring the bell → the transformation.** Over a **full + sealed** reliquary,
   ringing triggers a bright light; **the 13 heirlooms disappear** and in their place sits a
   **beautiful mini grand clock, holdable, with 13 numbers, its hand on 13, ticking
   *backwards*.** The prose is **deliberately understated** — something like *"…and something in
   the RELIQUARY has changed"* — we do **not** describe the clock fully yet. (Mystery box.)

3. **The FRONT DOOR flings wide open.** The same beat announces the front door standing open.
   This is the **new nudge to leave**. Set `frontDoorOpen` (it already exists) at ring time.

4. **Leaving = the quick win.** Walking OUT through the open front door ends the game via
   `game.finish(...)` with your score. **Leaving *with the TALISMAN* grants extra points** — the
   best *clean* score. Restart offered. *(Replaces the HOLLOW-SANCTUM "dawn" walk as the
   canonical clean win — see Open Questions on whether dawn survives as an alternate.)*

5. **Using the talisman is the doorway to phase 2 (the fun part).** If instead you **USE the
   TALISMAN in the RELIQUARY**, the **trapdoor to Gary's cave opens** (`floorDoorOpen`). Go
   **DOWN** and it plays as today: Gary clubs you with the receiver ("puncture in the head, you
   pass out"), grabs the loot, and bolts howling **"FREEDOM!"** — and you drop into **BM2, back
   in time**, carrying the **13-hour clock**. David: *"the more fun part is going downstairs to
   start the 2nd phase — back in time!"*

   > Net changes from shipped code: (a) the trapdoor opens on **USE TALISMAN in reliquary** (not
   > on deposit/seal); (b) **leaving with the talisman** scores extra; (c) `saveBm2Seed()` must
   > persist that **you carry the 13-hour clock** into BM2.

**Scoring shape (proposed):** plain walk-out = a win; **walk out holding the TALISMAN = extra
points** (best clean score); **USE talisman → go DOWN** = the cliffhanger into BM2 (score saved
as the BM2 seed). The downstairs path forfeits the talisman-points but unlocks phase 2 — the
intended "more fun" route. Keep the inverted-scoring intent ("Gary profits when you fail").

---

## Part B — BM2 core loop: the Thirteen Time Periods (scatter-in-time)

You **wake as a ghost** in **the first of 13 time periods**, tasked with **replaying the scenes
in which the 13 heirlooms were created** — and, crucially, **placing each one where BM1 will
later find it.** You are not just hiding objects in space; **you are hiding them in time.**

Rules of the loop:

- **One heirloom per time period.** Each time zone contains exactly **one** of the 13 items,
  plus **clues** to the others. You must locate that period's item and **put it where it
  belongs** on BM1's map (its hiding room) — **not** in the reliquary. (You are *authoring* the
  BM1 dungeon: nursery=music box, crypt=locket, attic=portrait, the safe=talisman, the dragon
  antechamber=ring, etc. — the exact scatter BM1 players later un-do.)
- **The clock is the master timer.** It starts on **13**, ticking **down**. It will **not
  advance from 13 → 12 until you've found the 13th item and returned it to its place in your
  starting timeline** ("maybe a few days before — call it *zero time*"). Then 12 → 11, and so
  on. The clock is your progress bar **and** your pressure.
- **Return, don't hoard.** *"You have to put it back where it belongs… so that you can be Gary
  and escape."* Completing all 13 correct placements is the win condition.
- **Same manor, different times, different people.** **No new real estate** — every period
  reuses the existing manor/grounds map with a **time overlay** (state of rooms) and a
  **cast overlay** (which people are present). This is a deliberate cost-saver and a strong
  aesthetic ("it's still this manor, just a different time and different people present").

**Ordering (proposed):** periods run in **clock order 13 → 1**, i.e. roughly **reverse
chronology** — fitting a clock that ticks backwards and a ghost unwinding history. (Open: could
be creation-chronological instead; decide once a couple of scenes are written.)

---

## Part C — The Ouroboros close (become Gary; you were you all along)

When you place the items and the clock winds **from 13 back to 1**, the haunt intensifies
("heebie-jeebies"), and on the final tick **you see *yourself* entering the house to start the
game — you are now Gary.** The tenant who walks in and plays BM1 is **you**; at the very end it
is **you-as-Gary** who clubs them and runs out the door. You are **supporting yourself**: the
person Gary bonks in BM1 is the person who *became* Gary at the end of phase 2. **BM2 = BM1 +
BM(−1). It's all one — a snake eating its own tail. An ouroboros.**

**Identity mechanic (RATIFIED 2026-09-14, David):**
- At **boot**, **ask the player the name they'd like to go by.**
- Refer to the protagonist as **"Gary"** for the whole game (Gary is the placeholder).
- **Pay it off at the become-Gary moment** (clock 13 → 1): surface the player's **own name** —
  the ghost they've "become" is **themselves.** *(David: "we'll use that later in the game — of
  course you become Gary. But let's call him 'Gary' to start.")*
- **Candidate cipher (from the first session, optional):** render the on-screen "Gary" as the
  player's name **spelled backwards** ("David" → "Divad") for a subtler tell. Pick the exact
  transform at build time; keep it deterministic + shareable.

This is the payoff that unifies 0001's whole thesis (Gary's single motive = *get free*; helpful-
Gary and saboteur-Gary are the same person) — now it's the **same person as you**, forever.

---

## Part D — The Thirteen-Hour Clock (the unifying artifact)

One object does three jobs:

1. **BM1 ring-payoff** — appears when the bell tolls over the sealed reliquary (Part A).
2. **BM2 master timer** — 13 → 1, one tick per correctly-placed heirloom (Part B).
3. **The map surface (8-bit, later)** — the **back of the clock shows the entire house**, a
   live **Marauder's-Map** of the manor. This is the diegetic home for what 0001 called "a
   video screen showing the whole castle," and it reuses what we already have:
   - `web/js/map.js` (MAP MODE, §12.15) — existing room/graph map.
   - `web/spike/tilemap.js` + `web/spike/preview/` — the 8-bit tile spike.
   The clock-back is where those graduate from spike to feature. **Text-first now; the clock
   renders as text (a face with 13 numerals + a room list); 8-bit map lands in a later pass.**

Design intent: the clock is **mysterious in BM1** (barely described), **functional in BM2**
(timer + map), and **thematic throughout** (13 hours, running backwards = a life un-lived, a
loop that never reaches 0 in the player's favor).

---

## Part E — Heirloom-origin puzzles ("why is it *there*?")

Each of the 13 gets an **origin scene** whose logic **explains its BM1 hiding spot.** Two are
worked out; the rest are seeds to fill.

**Design law:** *the object's BM1 location must be earned by its origin.* Don't place things
randomly — invent the moment that logically strands each heirloom exactly where BM1 finds it.

**Worked example 1 — the dragon / the RING (BM1: dragon antechamber).**
Travel to a time/realm to find a **dragon** and bring it back to the antechamber, where it must
end up **asleep** (as BM1 encounters it). A small chain of challenges: the dragon lives **inside
a painting**; you **pull it out of the painting**. You **meet the painter in the woods**, and
**the painter has magic** (the pull-from-canvas verb comes from him). No new rooms — the woods +
a manor painting we already have.

**Worked example 2 — the emerald / the garden STATUE (BM1: emerald gem + the leaning garden
statue that hides the front-door key).**
The emerald comes from a **queen's necklace/dress**. In a struggle the necklace is **torn off**
and the gem **falls into the bush under the statue** — which is **how BM1 finds it there.** The
twist: **the "statue" is not a statue.** The woman is a **Medusa**; in the struggle she is turned
to **stone with the gem beneath her**, so the garden "statue" is her **petrified body**, emerald
lodged underneath. (In BM1, moving that statue yields the buried front-door key — the origin
scene now explains the whole tableau.) *Note: the EMERALD GEM currently belongs to the great-oak
gem-panel puzzle (§12.31), not the 13 required heirlooms — treat this as the origin of the
**garden statue + emerald** grounds-tableau; map it to a required heirloom or keep it as a
grounds set-piece when we lock the 13-row table.*

**First-draft origin table (seeds — refine per Design law):**

| # | Heirloom | BM1 hiding spot (from 0001) | Proposed origin-scene seed |
|---|---|---|---|
| 13 | (opening item — TBD) | — | The scene that first sets the clock ticking; likely the RING or GRIMOIRE. |
| — | Family RING | Dragon antechamber | **Worked ex. 1** — pulled from a painting; the sleeping dragon guards it. |
| — | Family CREST | Dreadmaw's vault | Lost/sealed during the working; Dreadmaw set as its warden. |
| — | GRIMOIRE | Secret chamber | The family's assembly-rite book — hidden behind the wall as the working began. |
| — | RAVENBLOOD SIGNET | Jewelry box | The line's seal — set aside by a family member in an ordinary moment. |
| — | TALISMAN (BM-crested) | Locked safe | Locked away for safekeeping the night it all went wrong. |
| — | MUSIC BOX | Nursery | Belonged to the Blackwood child — never leaves the nursery. |
| — | LOCKET | Crypt | Buried with someone; the crypt is its true home. |
| — | DECANTER | Wine cellar | Left mid-pour the night of the struggle. |
| — | PORTRAIT | Attic | Painted, then exiled to the attic (ties to the painter/dragon magic?). |
| — | WOODBLACK WATCH | Space-between-walls | Dropped/hidden in a chase through the manor's guts. |
| — | CANDLESTICK | Dining room | Ordinary object frozen at the scene of a family dinner gone wrong. |
| — | SPYGLASS | Tree fort | A child's treasure, carried up to the fort. |
| — | COIN | (dynamic) | The wildcard — placement chosen at runtime, as today. |
| — | *(emerald / garden statue tableau)* | Garden (under the statue) | **Worked ex. 2** — Medusa/queen; emerald beneath the petrified woman. |

*(Table shows 14 candidates; the canon 13 must include the emerald — see below — so one current
entry is swapped out to keep the count at 13. Which one is still open, Q5.)*

### RATIFIED 2026-09-14 (David) — the emerald & the Medusa (a HARD hero scene)
- **The emerald is one of the canon 13.** The garden **statue is critical to the house** — she is
  a **Medusa** who, in the struggle, **turns to stone herself.**
- **The challenge = make her drop the emerald** *before* she petrifies. **Fail → the emerald turns
  to stone too, and that attempt fails.** One of the "several hard" scenes (see Retry below).

### RATIFIED 2026-09-14 (David) — Retry & saves (the ghost's "try-overs")
- The player is a ghost with a small pool of **"try-overs" (≈3–5)** to **re-attempt a failed
  challenge** (e.g. the Medusa emerald-drop). Spend one to rewind the attempt.
- **Save/restore** works as usual (the engine already ships `web/js/save.js`).
- **Open:** exact count (3 or 5); behaviour at 0 (soft-lock → must RESTORE, or a full reset);
  whether try-overs replenish between periods.

---

## Reconciliation with ratified canon (0001 + DESIGN.md §12.30)

- **Resolves 0001's biggest open item** ("TWO candidate BM2 designs — reconcile before
  building"). The **prequel scatter** (Option B) and the **sequel** (§12.30) are the **same
  loop**: you scatter-in-time (prequel verb), and finishing **makes you Gary**, who is then
  bonked by the next tenant (sequel frame). The ouroboros is the bridge.
- **Reliquary = prison** (RATIFIED) is now **literal**: ringing makes the heirlooms *vanish*
  (imprisoned), replaced by the clock. Consistent with "the curse shatters like dropped glass"
  and Idea A.
- **Gary self-preservation / "profits when you fail"** (RATIFIED) holds: the **front door** is
  the clean escape (you win, Gary doesn't get you); going **DOWN** is the failure-for-you /
  win-for-Gary hand-off that seeds BM2.
- **Supersedes** the §12.30 **BONE KEY + HOLLOW SANCTUM "dawn"** payoff as the *primary* clean
  win (front door replaces it) and the §12.30 **phone-line** framing of BM2 (scatter-in-time
  replaces it). Both are **shipped/half-built**, so retiring them is a real edit — flagged
  below, needs David's go.
- **Presentation dial CLOSED:** the "8-bit room + video screen of the castle" becomes **the back
  of the clock** (Marauder's-Map), built on `map.js` + the tilemap spike.

---

## Presentation & phasing

- **Now (text-first):** all of the above as text. Clock = a described face (13 numerals, hand on
  N, ticking down) + a room list on its back. Time periods = the existing map with time/cast
  overlays. Ouroboros + name reveal = pure text.
- **Later (8-bit):** the **back-of-clock Marauder's-Map** as the first real 8-bit surface
  (graduate `spike/tilemap.js`), then optional per-period tile art. Keep the web-first / thin-
  native-shell architecture (ADR 0001) — no engine rewrite.

---

## Implementation plan (when greenlit)

**BM1 edits (in `web/js/world.js`; will touch the 383-scenario suite — do only on David's go):**
1. In the `ring` handler (over sealed + `curseLiftable`): spawn a new `thirteenHourClock` item
   **in the reliquary**, remove/hide the 13 deposited heirlooms, set `frontDoorOpen`, and print
   the understated "something has changed" line. Decide fate of `boneKey`/`secretDoor`/dawn path.
2. Front-door **leave** handler → `game.finish(maxEnding, banner)`.
3. **USE TALISMAN in reliquary** → set `floorDoorOpen`; **GO DOWN** → `garyEnding()` carrying the
   clock; `saveBm2Seed()` records `{score, turns, holdsClock:true}`. **Leaving with the talisman**
   → `game.finish()` with a bonus. (Reliquary EXAMINE can mention the clock obliquely.)
4. Update/annotate the affected walkthrough scenarios deliberately (don't just make tests pass —
   the ending genuinely changed).

**BM2 new scaffolding (new module(s); does *not* touch BM1 tests):**
5. `bm2/` engine seam that boots from the BM2 seed (score + `holdsClock`). **[slice: BUILT as a
   standalone world at `web/examples/bm2/world.js` on the generic engine; boot-from-seed wiring
   still TODO — the slice reads `flags.playerName` and starts fresh.]**
6. **Name-at-boot identity**: capture the player's name, display **"Gary"** through play, reveal
   at the **13 → 1** become-Gary beat. **[slice: BUILT — `SAY <name>` at the awakening sets
   `flags.playerName`; the ending renders "`<name> = GARY`". A real boot page can set the flag
   instead of the `SAY` capture.]**
7. **13 time-period scenes**: map + time-overlay + cast-overlay; one findable heirloom each +
   clue stubs. **[BUILT — all 13 hours playable. TWO hard hero scenes (hour XIII Medusa/emerald;
   hour II dragon/RING peeled from a painting) + 11 lighter "find-and-place" beats. The 11 easy
   origins are first-draft flavor.]**
8. **Clock timer**: 13 → 1, gated on correct placement; return-and-place step per item.
   **[BUILT — fixed reverse order 13 → 0. NAVIGATE-TO-PLACE (Model A, David 2026-09-14): after
   recovering an heirloom in its time-scene, the clock carries you HOME to a real, walkable
   present-day manor (17 rooms mirroring BM1's geography); you WALK the heirloom to its true
   hiding room and PUT it there. Correct room ticks the clock and unlocks the next hour; the wrong
   room refuses it. Supersedes the earlier single "zero-time hub" (Model B).]**
9. **Ouroboros close**: become-Gary → scripted BM1 replay → bonk → exit → (loops the seed).
   **[BUILT as the terminal beat — placing the last heirloom (hour I) reforms you into a body, a
   new tenant knocks, and the finish() banner reveals "`<name> = GARY`". The scripted BM1 replay/
   bonk is narrated, not yet interactively played.]**
10. **Clock-back map** (text now; 8-bit later via the spike). **[BUILT as text — EXAMINE/READ the
    clock shows the hour + a masked 13-hour list; future hours reveal as you reach them.]**
11. **Try-overs (the ghost's retries)**: a per-run counter (default **5**); a failed challenge
    spends one and rewinds the scene; at 0, SAVE/RESTORE/RESTART. **[BUILT — shared across both
    hard scenes: grabbing the queen or pulling the dragon early spends a try-over and rewinds.]**

**Run the loop:** `node web/examples/bm2/play.mjs` (full 13-hour transcript + 30 asserts),
`--quiet` (asserts only), or `--repl` (interactive). **Zero engine changes; zero BM1 changes.**

---

## Open questions (bring to David/Andy)

**Answered by David 2026-09-14** (folded into the design above):
- **Q1 — Dawn / HOLLOW SANCTUM ending:** effectively **retired** (it hangs off the bone key). The
  front door is the clean win. *(Say if you want dawn kept as a hidden alternate.)*
- **Q2 — Bone key / north secret door:** **retire it.**
- **Q3 — Time-period order:** **backwards, 13 → 1** ("jumping through time").
- **Q6 — Identity in BM2:** render the protagonist as **"`<your name> = Gary`"** (or a funny variant).
- **Q7 — Show vs imply:** **all 13** periods playable — **many easy, several hard.**
- **Q8 — Clock ↔ talisman:** the **clock is a SEPARATE item** — it **is the magical time-travel
  talisman**, created when the heirlooms are in the reliquary and the bell is rung.

**Provisionally decided 2026-09-14 (David was away; baked into the built prototype — please
confirm or override):**
- **Q4 — the return-and-place step → MODEL A (navigate-to-place).** *(Reworked 2026-09-14 per
  David: "I should have to make my way to the garden to put the emerald in the bush… BM1 and BM2
  are the same manor at different times.")* Recovered heirlooms are carried HOME to a real,
  navigable present-day **Blackwood Manor** (17 rooms mirroring BM1's geography — garden, crypt,
  nursery, Dreadmaw's vault, the dragon's antechamber…). You surface in the entrance hall and must
  physically WALK each heirloom to its true hiding room; only the correct room accepts it and ticks
  the clock. Continuity is echoed (the garden STATUE is the petrified queen; the antechamber
  PEDESTAL is where the painted dragon will sleep). *Supersedes the earlier single "zero-time hub"
  (Model B).*
- **Q5 — the canon 13 → the emerald replaces the COIN.** The dynamic wildcard COIN is dropped; the
  EMERALD joins as hour XIII. The other twelve mirror BM1's `treasure` items exactly.
- **Try-over count → 5.** (Within your "≈3–5"; at 0, RESTORE/RESTART.)
- **Hour order → fixed reverse 13 → 1** (below), hard scenes at **XIII** (emerald) and **II**
  (dragon), ouroboros at the **empty hour (0)** after the last placement.

**The provisional canon 13 (hour → heirloom → BM1 hiding spot), as built:**

| Hour | Heirloom (BM1 id) | BM1 hiding spot | Origin scene |
|---|---|---|---|
| XIII | EMERALD *(new; replaces coin)* | under the garden statue | **HARD** — Medusa/queen; wail to free the gem before she petrifies |
| XII | SPYGLASS (`spyglass`) | tree fort | a child leaves it in the fort |
| XI | CANDLESTICK (`candlestick`) | dining room | a family dinner before it curdled |
| X | DECANTER (`crystalDecanter`) | wine cellar | left mid-pour the night of the struggle |
| IX | MUSIC BOX (`musicBox`) | nursery | the Blackwood child's; never leaves |
| VIII | LOCKET (`goldLocket`) | crypt | lowered into the earth with its owner |
| VII | GRIMOIRE (`grimoire`) | secret chamber | the assembly-rite, hidden behind the wall |
| VI | RAVENBLOOD SIGNET (`rubyRing`) | jewelry box | slipped off and set aside |
| V | WOODBLACK WATCH (`backwardsWatch`) | between the walls | dropped in a chase |
| IV | PORTRAIT (`ancestralPortrait`) | attic | painted, then exiled (painter tie-in) |
| III | FAMILY CREST (`familyCrest`) | Dreadmaw's vault | sealed in as Dreadmaw is made its warden |
| II | FAMILY RING (`familyRing`) | dragon antechamber | **HARD** — peel the sleeping dragon (ring on claw) from a painting; the painter teaches the trick |
| I | TALISMAN (`talisman`) | locked safe | locked away the night it all broke — the final placement triggers the ouroboros |

*(The eleven lighter origins are FIRST-DRAFT flavor — provisional, trivially editable in
`web/examples/bm2/world.js`'s `HOURS` table.)*

**Still genuinely open (need David/Andy):**
- **Confirm or override Q4 / Q5** and the eleven lighter origins above.
- **Fate of the dawn / bone-key ending** (Q1–Q2): the plan retires it; say if you want it kept as a
  hidden alternate.
- **The BM1 ending rework** (Part A) — still unbuilt; needs your go before touching `world.js`.

---

## Next steps

- [x] Stand up the **BM2 module**: name-at-boot + a fully-playable time period driving the clock.
      *(Built first as the **Medusa/emerald** hero scene at `web/examples/bm2/`.)*
- [x] Text-first clock-back **map** (EXAMINE/READ the clock). *(8-bit pass still scheduled off the
      tilemap spike.)*
- [x] **Try-overs** retry mechanic (spend-and-rewind on a failed challenge).
- [x] **Wire the full 13-period loop** end-to-end: all thirteen hours 13 → 0, the **navigable
      present-day manor** (Model A, navigate-to-place), a **second** hard hero scene (dragon/RING
      peeled from a painting), and the **become-Gary ouroboros** close. *(Q5 baked in
      PROVISIONALLY — David was away; Q4 reworked to Model A per David's later navigate-to-place note.)*
- [ ] **David to confirm/override Q4 (navigate-to-place manor), Q5 (canon-13 swap), the hour order,
      the try-over count, and the 11 lighter origins.** Hours/spots are one-file edits in `HOURS`;
      the manor map is the `MANOR`/`SPOTS` tables in the same file.
- [ ] David/Andy **ratify or adjust** the narrative (esp. Open Q1–Q2: fate of the dawn/bone-key
      ending — currently retired).
- [ ] *(On David's go — BM1-touching, hits 383 tests)* Prototype the **BM1 ring → clock →
      front-door** ending change behind a flag; update the affected walkthrough scenarios
      deliberately.
- [ ] Make the **become-Gary BM1 replay** interactively playable (currently narrated), and add the
      **8-bit clock-back map** off the tilemap spike.
