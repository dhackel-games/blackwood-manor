# Chapter 2 — The Thirteen-Hour Clock & the Ouroboros (design update)

> **UPDATE 2026-09-15 — the simplified reliquary/clock seam is implemented.**
> The game shows its title and initial AI status, composes a fallback from
> 12 titles × 12 spooky moods × 12 garments, greets the player with it, asks
> them to say another name or type `call me {name}`, prefills `call me `, and
> continues into the first room without waiting. AI/name guidance is plain
> descriptive prose. CALL ME and MY NAME IS are synonyms: one supplied word
> replaces the generated first-name token for the joke, while two replace first
> and last. It then says “…just kidding, I'll call you {name} from now on” and
> stores only the supplied name. Bare, SAY, CALL ME, and MY NAME IS forms all
> use the joke. Authored `{{player_name}}` tokens are
> resolved through one output renderer. In BM1, put all thirteen heirlooms in
> the RELIQUARY, CLOSE it, OPEN the BELL CLOSET beside the front door, and PULL
> its lower rope. The remote belfry bell tolls, magical light consumes the
> separate items, the FRONT DOOR slams shut and then opens wide, and the floor
> trapdoor opens. EXAMINE the
> RELIQUARY to learn that the heirlooms became the COUNTDOWN CLOCK. Leaving
> through the front door wins; taking the clock opens the stair DOWN. Gary is
> alone beside a silent phone, surprised and excited; he knocks you out and
> escapes. You wake as a ghost still holding the clock, and only EXAMINE CLOCK
> explains its purpose. A Part-II death offers RESTART 1 for a fresh Part I or
> RESTART 2 for the serialized ghost-awakening checkpoint. The bone-key/Hollow
> Sanctum/spirit/silver-mirror branch and the separate Part-II naming prompt are
> retired.
>
> **➡️ UPDATE 2026-09-14 (evening) — Hour XIII is now integrated INLINE into the shipped
> game.** The seam and the first hour of the loop are built directly into `web/js/world.js`
> (not a separate page): finish BM1, seal the reliquary, `go down` → the Gary cliffhanger now
> *continues* into Part II — you wake a ghost holding the 13-hour clock, dive into the
> Thirteenth Hour, **find** the living queen at the statue, learn the mirror **pool**, and
> `yell` to petrify her (yelling without the pool trick now **kills** you) — then return the
> emerald to the garden to tick the clock XIII→XII. `::winmax2bell` performs
> every deterministic reward and stops before the lower bell rope; pull it,
> take the clock, and go down. Covered by `web/tests/features/part-two.feature`.
> The isolated `web/examples/bm2/`
> prototype referenced below is a **superseded scratch draft** (kept out of the repo); the
> inline `world.js` implementation is the source of truth. Hours XII–I and the ouroboros close
> remain to be built on this same pattern.

- **Status:** **IMPLEMENTED through Hour XIII inline in `web/js/world.js`.**
  The name-at-boot flow, reliquary-to-clock transformation, front-door ending,
  clock-key staircase, revised Gary encounter, ghost awakening, and first
  thirteen-hour scene are part of the continuous shipped game. Hours XII–I and
  the ouroboros close remain unbuilt. The excluded `web/examples/bm2/`
  prototype is superseded and is not the source of truth.
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
| BM1 ring payoff | Ring bell → **BONE KEY** + north **SECRET DOOR** → HOLLOW SANCTUM "dawn" ending | Pull the entry-closet rope → remote belfry toll, heirlooms vanish, front door slams then opens wide, floor trapdoor opens |
| BM1 clean win | Dawn / HOLLOW SANCTUM | **Walk out the open front door** after ringing the bell. |
| BM1 → Gary hand-off | Deposit + **CLOSE** reliquary opens the stair; go DOWN | EXAMINE the transformed reliquary, TAKE the COUNTDOWN CLOCK, then use the already-open stair DOWN. |
| Presentation | Open dial: "8-bit room + video screen of the castle" | The **screen is the back of the clock** (Marauder's-Map). **Text-first now; 8-bit later.** |
| Identity | Gary = disowned heir; "it's you" implied | Ask `What should we call you?` before BM1 and carry the answer through authored `{{player_name}}` tokens. |

**Unchanged / still canon (from 0001):** reliquary = **prison/containment** (bell *imprisons*,
doesn't destroy — now literalized: the heirlooms disappear); tone = **tragic but funny**;
Gary = disowned heir acting in **self-preservation** because completing the rite **kills him**;
**"Gary profits when you fail."**

---

## Part A — BM1 ending implementation

1. Put all thirteen heirlooms in the RELIQUARY. The last deposit only confirms
   that the set is complete; it does not open the floor.
2. CLOSE the RELIQUARY, OPEN the BELL CLOSET beside the FRONT DOOR, and PULL its
   lower rope. The remote belfry toll flashes magical light, transforms the
   heirlooms into the COUNTDOWN CLOCK, slams the FRONT DOOR shut and then wide
   open, and opens the floor trapdoor.
3. EXAMINE the RELIQUARY to discover the clock. Its purpose is not explained in
   BM1.
4. Leave SOUTH/OUT through the open front door for the clean ending.
5. Alternatively, OPEN the RELIQUARY and TAKE the CLOCK. The staircase is
   already open, but DOWN requires the clock and then reaches Gary.
6. Gary is alone beside a silent phone. He recognizes `{{player_name}}`, reacts
   with surprise and excitement, clubs the player with the receiver, and exits.
7. The player wakes alone as a ghost holding the clock. EXAMINE CLOCK explains
   the thirteen-hour loop; USE CLOCK enters Hour XIII.
8. Entering Part II captures the ghost awakening as a serialized checkpoint.
   Part-II deaths offer RESTART 1 or RESTART 2; both use the nonblocking random
   fallback / prefilled CALL ME intro before their first room.

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

**Worked example 1 — the bats / the BAT SIGHT MIRROR (BM1: belfry).**
The great bell's rope runs from the BELFRY through the house to a closet beside
the front door. Pulling either end rings **DONG... DONG...**, scatters the bats,
and drops their silver mirror onto the belfry floor. Its black glass can scry any
named Part-I room.

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
| — | BAT SIGHT MIRROR | Belfry | Pulling either bell rope scatters the bats and drops it from their roost. |
| — | Family CREST | Dreadmaw's vault | Lost/sealed during the working; Dreadmaw set as its warden. |
| — | GRIMOIRE | Secret chamber | The family's assembly-rite book — hidden behind the wall as the working began. |
| — | RAVENBLOOD RING | Jewelry box | The line's ring — set aside by a family member in an ordinary moment. |
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

## Implementation status

**BM1 and seam work completed 2026-09-15:**
1. The opening name prompt and `{{player_name}}` rendering pipeline are live.
2. The full, closed reliquary transforms into the COUNTDOWN CLOCK when the bell
   rings; the front door opens and the floor rumbles.
3. The front door is the clean ending. The bone key, secret north door, Hollow
   Sanctum, robed spirit, and silver mirror are removed.
4. Taking the clock opens DOWN; Gary is alone beside a silent phone and knocks
   the player into Part II.
5. The ghost must EXAMINE CLOCK before USE CLOCK enters Hour XIII.

**BM2 new scaffolding (new module(s); does *not* touch BM1 tests):**
5. `bm2/` engine seam that boots from the BM2 seed (score + `holdsClock`). **[slice: BUILT as a
   standalone world at `web/examples/bm2/world.js` on the generic engine; boot-from-seed wiring
   still TODO — the slice reads `flags.playerName` and starts fresh.]**
6. **Name-at-boot identity**: **[BUILT]** capture the player's name before BM1
   with bare-name, SAY, or CALL ME syntax; carry it through explicit
   `{{player_name}}` templates. There is no second naming prompt after Gary's blow.
7. **13 time-period scenes**: map + time-overlay + cast-overlay; one findable heirloom each +
   clue stubs. **[SUPERSEDED PROTOTYPE — all 13 hours were sketched, including hour XIII
   Medusa/emerald and an obsolete hour-II dragon/ring scene. Current hour II is the Bat Sight Mirror
   in the belfry; Hours XII–I remain unbuilt inline. The 11 easy
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

The excluded `web/examples/bm2/` prototype is superseded. The inline
`web/js/world.js` implementation and Cucumber features are authoritative.

---

## Open questions (bring to David/Andy)

**Answered by David 2026-09-14** (folded into the design above):
- **Q1 — Dawn / HOLLOW SANCTUM ending:** **retired.** The front door is the clean win.
- **Q2 — Bone key / north secret door:** **retired.**
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
| VI | RAVENBLOOD RING (`rubyRing`) | jewelry box | slipped off and set aside |
| V | WOODBLACK WATCH (`backwardsWatch`) | between the walls | dropped in a chase |
| IV | PORTRAIT (`ancestralPortrait`) | attic | painted, then exiled (painter tie-in) |
| III | FAMILY CREST (`familyCrest`) | Dreadmaw's vault | sealed in as Dreadmaw is made its warden |
| II | BAT SIGHT MIRROR (`batSightMirror`) | belfry | **HARD** — ring the bell, scatter the bats, and recover the mirror dropped from their roost |
| I | TALISMAN (`talisman`) | locked safe | locked away the night it all broke — the final placement triggers the ouroboros |

*(The eleven lighter origins are FIRST-DRAFT flavor — provisional, trivially editable in
`web/examples/bm2/world.js`'s `HOURS` table.)*

**Still genuinely open (need David/Andy):**
- **Confirm or override Q4 / Q5** and the eleven lighter origins above.
- **Hours XII–I and the ouroboros close:** implement them inline after the
  validated Hour-XIII pattern.

---

## Next steps

- [x] Stand up the **BM2 module**: name-at-boot + a fully-playable time period driving the clock.
      *(Built first as the **Medusa/emerald** hero scene at `web/examples/bm2/`.)*
- [x] Text-first clock-back **map** (EXAMINE/READ the clock). *(8-bit pass still scheduled off the
      tilemap spike.)*
- [x] **Try-overs** retry mechanic (spend-and-rewind on a failed challenge).
- [ ] **Wire Hours XII–I inline** using the validated Hour-XIII seam. Hour II now
      returns the BAT SIGHT MIRROR to the BELFRY; the excluded dragon/ring
      prototype scene is retired.
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
