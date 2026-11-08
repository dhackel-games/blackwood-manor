<!-- 2026-11-07_plan_todo_DoomsdayClock.md. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-07.001:acoven. -->

# Doomsday Clock: master orchestration

Status: todo. Phase A builds the new content. Phase B (`::win`, route, and scoring incentives) cannot start until every Phase A lane is complete and validated, per AndrewC 2026-11-07: "dont do anything with ::win yet until we build the new section."

## Current status

* Planning complete; no implementation started; `::win` untouched.
* Todos: 0 done / 90 total (0%); 90 remaining.
* Coding progress: none. Design proposed below for review.
* Average task duration: UNKNOWN (0 measured tasks).
* Completion ETA: UNKNOWN.
* Next shareable build: UNKNOWN; requires the single release PR to merge, a content stamp, and the Pages deploy (OTA). No native change is planned, so no TestFlight build is needed.
* BLOCKERS: EMPTY.
* Status surfaces: this repository has no `code/README.md`, so no dashboard was written there.

## Stated goals

* G1:Lanternwild: Players who move DREADMAW can step through a MINERS' LOCKER in the MINING GALLERY into an upside-down, wonder-first winter otherworld. There they solve five classic-inspired challenges, recover seven heirlooms, and return through a root gate beneath the GREAT OAK. Proved by: Lanes 2 to 8. Artifact: `web/tests/features/lanternwild-*.feature`, `oak-tree-fort.feature`.
* G2:DoomsdayClock: The reliquary ritual requires 24 heirlooms (13 existing manor, 4 new manor and grounds, 7 Lanternwild) that become a 24-hour DOOMSDAY CLOCK. Old saves migrate fairly, and every surface agrees: text, HUD, Part II, Gary, the 2D tray, and docs. Proved by: Lanes 9 and 10. Artifact: `manor-quartet.feature`, `heirloom-migration.feature`, `part-two.feature`, `true-ending.feature`.
* G3:EfficientWin: `::win` gathers the gear once and then walks everything. It takes everything in each room, uses items on arrival (arriving at the brazier already ablaze), and deposits all 24 heirlooms with one PUT ALL IN RQ. Scoring rewards that play style. Proved by: Lanes 11 to 13. Artifact: the `sysop-menu.feature` trace scenario.

## PRD

* 1. Problem
  * 1.1. Part I has 13 heirlooms in a fully explored manor; playtesters want a surprising new region and a bigger final countdown.
  * 1.2. `::win` doubles back constantly. Traced 2026-11-07 against `8ff6efb`: 77 room transitions, ROYAL HALL visited 8 times, LANDING 6, GATE 5, and DINING ROOM 5, with 13 single-item reliquary deposits.
* 2. Personas
  * 2.1. Player: explores for wonder and points. Concern: saved progress and score must never be lost or silently changed.
  * 2.2. Designer (DavidH, AndrewC): verifies the whole game with `::win`. Concern: the route must be a credible physical playthrough.
* 3. Business opportunity
  * 3.1. A new realm, four new manor puzzles, and a 24-hour clock extend Part I replay and enlarge Part II's spine using static web content only.
* 4. Recommended approach
  * 4.1. Build the content (realm, root-gate lift, manor quartet, 24-heirloom clock) first. Then rebuild `::win` around gear first, walk everything, and deposit once. Ship both in one PR.
* 5. Outcomes
  * 5.1. Given DREADMAW has moved, when the player OPENS the LOCKER and goes IN, then they arrive in the WAYLAMP CLEARING with stars beneath the ice underfoot.
  * 5.2. Given all five realm challenges are solved, when the player seats the three INVERTED GEMS in reverse order under the oak and boards the lift as it reaches the lowest stop, then it carries them up to the GREAT OAK or the TREE FORT.
  * 5.3. Given 24 heirlooms are carried, when the player types PUT ALL IN RQ, then all 24 seat at once and the ONE TRIP bonus is awarded.
  * 5.4. Given a fresh game, when the designer runs `::win`, then it ends alive in the ROYAL HALL holding the DOOMSDAY CLOCK with the derived maximum score.
* 6. Primary measurement
  * 6.1. `::win` room transitions per required heirloom. The baseline is 77/13 = 5.9, from the existing trace step. Target: below 5.9 with 24 heirlooms. The trace scenario measures it locally; no player data is collected.

## TRD

* 1. Terminology and Scope
  * 1.1. Lanternwild: the new otherworld. Heirloom: a `treasure: true` item the reliquary requires. Manor quartet: the four new manor and grounds heirlooms. Lift stops: BELOW (ROOT HOLLOW), GROUND (GREAT OAK), and ABOVE (TREE FORT).
  * 1.2. EXPLICITLY NOT DOING:
    * 1.2.1. Building Part II Hours XXIII to I.
    * 1.2.2. Making native iOS changes.
    * 1.2.3. Adding network calls or telemetry.
    * 1.2.4. Touching `::win` before Phase A completes.
* 2. Environment
  * 2.1. The game is pure static web (`web/`) using ES modules. Tests run with `cd web && npm test` (Cucumber). CI (`.github/workflows/ci.yml`) runs the same command on PRs, and Pages deploys `web/` on every push to main.
  * 2.2. Phones receive content only when `CONTENT_VERSION` increases (`ios/release-testflight.sh --stamp-only --force-next-build`). Every new file must also be listed in `web/versions.json` `CONTENT_FILES`.
* 3. Principles
  * 3.1. P1:ContentModules: new rooms, items, prose, and handlers MUST live in content modules registered by `world.js`. The engine (`core.js`, `parser.js`, `commands.js`) NEVER gains realm-specific knowledge.
  * 3.2. P2:WebFirst: all gameplay MUST stay in `web/` per ADR 0001. Native code NEVER changes for this work.
  * 3.3. P3:FairCruelty: every lethal outcome MUST be foreshadowed by visible text and a first warning.
  * 3.4. P4:NoFarming: every award MUST be granted once through a persisted flag. Save migration NEVER invents or erases earned points.
  * 3.5. P5:SelfContainedRealm: every Lanternwild challenge MUST be solvable with items found inside the realm.
  * 3.6. P6:ExecutableProof: every challenge, death, award, migration, and route claim MUST be proved by executable Gherkin in the same commit as its code.
  * 3.7. Cross-cutting:
    * 3.7.1. Analytics: none exists and none is added.
    * 3.7.2. Observability: bug reports (`issue-report.js`) MUST include the realm room, lift stop, and challenge flags.
    * 3.7.3. Auth: not applicable.
    * 3.7.4. Security: no new network calls. Firefly credentials stay in environment variables only.
    * 3.7.5. Accessibility: everything is completable by typed commands and screen readers, with no color-only clues.
    * 3.7.6. Internationalisation: English only, with new prose kept in content exports.
* 4. Architecture
  * 4.1. Entry: `mineGallery` gains a fixed MINERS' LOCKER. `in locker` moves the player to `waylampClearing`, and `out` from the clearing returns to the gallery.
  * 4.2. Exit: after all five challenges, the ROOT HOLLOW beneath the oak links to the oak lift's BELOW stop.
  * 4.3. Modules:
    * 4.3.1. `web/js/lanternwild/index.js` aggregates `realm.js` (hub, portal, flight hazard), the five challenge modules (`heckle.js`, `seasons.js`, `breath.js`, `orrery.js`, `drafts.js`), and `rootgate.js`.
    * 4.3.2. The manor quartet lives in `web/js/manor/`.
    * 4.3.3. Each module exports `{ rooms, items, content, shortNames, progressAwards, hints, roomHooks }`. `world.js` merges them once and chains any room hooks.
  * 4.4. Flow: commands reach item and room `on` handlers exactly as manor content does. Awards use the existing `awardProgress`, `awardPickup`, and `awardUse`.
  * 4.5. Canonical data: the heirloom set derives from `treasure: true`. `REQUIRED_FAMILY_ITEM_COUNT` becomes 24, and `maximumScore()` stays derived.
  * 4.6. External boundaries: the `versions.json` manifest, the `map.js` floor layout and `view2d` data, and the optional Firefly icon tool (the tray has a built-in emoji fallback).
* 5. Lanternwild design (proposed; Lane 1 ratifies it into [`2026-11-07_info_LanternwildAndDoomsdayClockCanon.md`](2026-11-07_info_LanternwildAndDoomsdayClockCanon.md))
  * 5.1. Premise: a Blackwood ancestor hid seven heirlooms beyond the miners' locker, in a lamp-lit forest of endless winter where the world hangs upside down: stars glitter through clear ice underfoot. The tone is wonder and fairy-tale melancholy with Blackwood comedy, not horror.
  * 5.2. Rooms: LOCKER threshold, WAYLAMP CLEARING (hub), JAY ROOKERY, FROST COURT, GLADE OF SEASONS, HALL OF FROZEN BREATH, FROZEN LIBRARY, STAR STAIR, STAR ORRERY (beneath the ice), and ROOT HOLLOW (sealed until all five challenges are solved).
  * 5.3. Hazard: flight is inverted.
    * 5.3.1. Named flights into or out of the realm are refused.
    * 5.3.2. Walking past the clearing in worn WINGED SHOES warns once ("your heels tug toward the stars below"). A second step drops you into the sky, and you die.
    * 5.3.3. REMOVE SHOES is the fix.
  * 5.4. Challenge 1, Heckle Duel (Monkey Island insult swordfighting; Sam & Max topic trees):
    * 5.4.1. LISTEN in the JAY ROOKERY to learn four insult and retort pairs from bickering ice-jays.
    * 5.4.2. In the FROST COURT, the herald owl insults you. SAY or RETORT the matching comeback.
    * 5.4.3. Three straight wins yield the HERALD'S SEAL. Three losses fling you harmlessly back to the clearing.
  * 5.5. Challenge 2, Glade of Seasons (Day of the Tentacle cross-time passing):
    * 5.5.1. TURN the SNOW HOURGLASS to swap the glade between LONG AGO and NOW.
    * 5.5.2. BURY the BIRCH CATKIN in Long Ago. Back in Now, CLIMB the grown silver birch for the SILVER BOUGH.
    * 5.5.3. Press the PINECONE into fresh SAP in Long Ago; in Now it has become the AMBER RELIC.
  * 5.6. Challenge 3, Hall of Frozen Breath (Shivers vessel capture):
    * 5.6.1. EXAMINE reveals each of the four sprites' materials (wool, glass, silver, ice). COAX each into its matching vessel and SEAL it.
    * 5.6.2. A first wrong vessel warns; a second is lethal frostbite.
    * 5.6.3. Sealing all four releases the SNOW GLOBE and the SILVER WHISTLE.
  * 5.7. Challenge 4, Star Orrery (Riven counting; 7th Guest patterns):
    * 5.7.1. COUNT the fox, hare, and badger TRACKS circling the WAYLAMP.
    * 5.7.2. Below the ice, SET each animal ring of the ORRERY to its count.
    * 5.7.3. The right alignment yields the STARGLASS ASTROLABE; a wrong alignment resets the rings.
  * 5.8. Challenge 5, Frozen Drafts (Loom drafts; Enchanter spells as verbs):
    * 5.8.1. EXAMINE the dripping ICICLE at the WAYLAMP to learn THAW. HUM it BACKWARDS for FREEZE.
    * 5.8.2. HUM FREEZE at the INK RIVER to cross the FROZEN LIBRARY and READ the scroll warning never to freeze a person.
    * 5.8.3. Once the Heckle Duel opens the dais, HUM THAW at the frozen RIME DUCHESS. She wakes and gives the RIME CROWN.
    * 5.8.4. HUM FREEZE at her, or at yourself, is the foreshadowed death.
  * 5.9. Completion: when all five challenges are solved, the RIME DUCHESS gives a CASKET holding three INVERTED GEMS (ruby, emerald, sapphire, facets pointing down) and unseals the ROOT HOLLOW.
* 6. Root gate and oak lift (AndrewC 2026-11-07)
  * 6.1. The ROOT HOLLOW has an upside-down ROOT PANEL that mirrors the oak panel. Its order is the reverse of the manor panel: INVERTED SAPPHIRE top, INVERTED EMERALD middle, INVERTED RUBY bottom. Wrong placements are refused with a mirrored-order clue.
  * 6.2. Seating all three opens the ROOT GATE. The lift then runs a four-beat cycle, one beat per turn: GROUND, ABOVE, GROUND, BELOW, GROUND. Until the root gate opens, the existing GROUND and ABOVE cycle is unchanged.
  * 6.3. Arriving from below, the player observes the cycle from the ROOT HOLLOW (LOOK UP or WAIT shows where the platform is). Boarding when it reaches BELOW carries the rider up. Stepping OUT at GROUND exits to the GREAT OAK; staying aboard reaches the TREE FORT.
  * 6.4. From the GREAT OAK, a rider can descend to BELOW once the gate is open. Before it opens, BELOW shows sealed roots.
* 7. Manor quartet (new heirlooms in the manor and grounds; mechanics avoid existing and realm verbs)
  * 7.1. ESTATE MAP (Monkey Island 2 map pieces): four torn MAP PIECES hide at the GATE, the HEDGE MAZE LOOP, the PORCH, and the ROOF. COMBINE the PIECES into the BLACKWOOD ESTATE MAP.
  * 7.2. WEATHERCOCK (Riven and Zork Nemesis mechanisms): the ROOF gargoyles' gazes give a compass order. TURN the WEATHERVANE through that order to blow open the CHIMNEY CACHE, which frees the SILVER WEATHERCOCK.
  * 7.3. SNUFFBOX (King's Quest VI liar logic): the Baron is a famous liar. ASK the Baron and two portraits flanking him in the PARLOR (one truthful, one alternating) ABOUT the hiding place. Their answers deduce which urn holds the BLACKWOOD SNUFFBOX. Opening the wrong urn releases a harmless cloud of snuff and resets the portraits.
  * 7.4. CORKSCREW (sound-for-hollow): KNOCK on the WINE CELLAR casks. The one that rings hollow has a loose BUNG; UNSCREW it to recover the BLACKWOOD CORKSCREW.
* 8. Scoring (Lane 10 derives and documents the new maximum)
  * 8.1. Realm discovery +20; each realm challenge +10; root gate opened +10; each quartet puzzle +5.
  * 8.2. Deposit values:
    * 8.2.1. Realm (100 total): SEAL 15, BOUGH 10, RELIC 10, GLOBE 15, WHISTLE 15, ASTROLABE 15, CROWN 20.
    * 8.2.2. Quartet (50 total): MAP 15, WEATHERCOCK 15, SNUFFBOX 10, CORKSCREW 10.
  * 8.3. Every new portable item keeps the existing +5 pickup and +5 use.
* 9. Doomsday clock
  * 9.1. The COUNTDOWN CLOCK becomes the 24-hour DOOMSDAY CLOCK; existing names stay as aliases.
  * 9.2. The reliquary shows 24 recesses ringed like a clock face.
  * 9.3. Part II starts at XXIV. The implemented Medusa/emerald scene is relabeled Hour XXIV and ticks the clock to XXIII. Hours XXIII to I remain future work.
* 10. ModelPicker (Copilot runtime; baseline recorded before spawn)
  * 10.1. Lane 1 Canon: mod:c70+s60='copilot:gpt-6-sol:1M:max'
  * 10.2. Lane 2 RealmHub: mod:c50+s80='copilot:gpt-5.6-terra:1M:xhigh'
  * 10.3. Lanes 3 to 7 (one per challenge): mod:c55+s80='copilot:gpt-5.6-terra:1M:xhigh'
  * 10.4. Lane 8 RootGateLift: mod:c65+s80='copilot:gpt-5.6-terra:1M:xhigh'
  * 10.5. Lane 9 ManorQuartet (one task worker per heirloom): mod:c50+s80='copilot:gpt-5.6-terra:1M:xhigh'
  * 10.6. Lane 10 DoomsdayCount: mod:c65+s75='copilot:gpt-5.6-terra:1M:xhigh'
  * 10.7. Lane 11 ScoringIncentives: mod:c45+s80='copilot:gpt-5.6-terra:1M:xhigh'
  * 10.8. Lane 12 RoutePlanner: mod:c72+s65='copilot:gpt-6-sol:1M:max'
  * 10.9. Lane 13 WinRoute: mod:c60+s75='copilot:gpt-5.6-terra:1M:xhigh'
  * 10.10. Lane 14 ContentRelease: mod:c20+s90='copilot:gpt-6-luna:400K:medium'
  * 10.11. Reviewers:
    * 10.11.1. ARCH: mod:c75+s60='copilot:gpt-6-sol:1M:max'
    * 10.11.2. QUALITY and PROCESS: mod:c65+s60='copilot:gpt-5.6-terra:1M:xhigh'
* 11. planit lanes (one integration branch `wave/doomsday-clock`, one PR)
  * 11.1. Phase A:
    * 11.1.1. [Lane 1 Canon](2026-11-07_plan_todo_DoomsdayClock_Lane1-Canon.md) runs first.
    * 11.1.2. [Lane 2 RealmHub](2026-11-07_plan_todo_DoomsdayClock_Lane2-RealmHub.md) runs next.
    * 11.1.3. Then these run in parallel: [Lane 3 HeckleDuel](2026-11-07_plan_todo_DoomsdayClock_Lane3-HeckleDuel.md), [Lane 4 GladeOfSeasons](2026-11-07_plan_todo_DoomsdayClock_Lane4-GladeOfSeasons.md), [Lane 5 FrozenBreath](2026-11-07_plan_todo_DoomsdayClock_Lane5-FrozenBreath.md), [Lane 6 StarOrrery](2026-11-07_plan_todo_DoomsdayClock_Lane6-StarOrrery.md), [Lane 7 FrozenDrafts](2026-11-07_plan_todo_DoomsdayClock_Lane7-FrozenDrafts.md), and [Lane 9 ManorQuartet](2026-11-07_plan_todo_DoomsdayClock_Lane9-ManorQuartet.md).
    * 11.1.4. [Lane 8 RootGateLift](2026-11-07_plan_todo_DoomsdayClock_Lane8-RootGateLift.md) runs after Lanes 3 to 7.
    * 11.1.5. [Lane 10 DoomsdayCount](2026-11-07_plan_todo_DoomsdayClock_Lane10-DoomsdayCount.md) runs last, after Lanes 8 and 9.
  * 11.2. WAIT: before spawning any Phase B lane, confirm every Phase A lane is done and that `npm test -- --tags "not @win"` exits 0 on the integration branch.
  * 11.3. Phase B:
    * 11.3.1. [Lane 11 ScoringIncentives](2026-11-07_plan_todo_DoomsdayClock_Lane11-ScoringIncentives.md) and [Lane 12 RoutePlanner](2026-11-07_plan_todo_DoomsdayClock_Lane12-RoutePlanner.md) run in parallel.
    * 11.3.2. [Lane 13 WinRoute](2026-11-07_plan_todo_DoomsdayClock_Lane13-WinRoute.md) runs after both.
    * 11.3.3. The single pre-PR triad follows.
    * 11.3.4. [Lane 14 ContentRelease](2026-11-07_plan_todo_DoomsdayClock_Lane14-ContentRelease.md) runs last.
  * 11.4. Seam contract (fixed before any spawn):
    * 11.4.1. Lane 2 creates and registers every module stub. Each later lane edits only its own module, feature file, and lane-listed shared lines.
    * 11.4.2. Flag names: `lanternwild:heckleWon`, `lanternwild:seasonsDone`, `lanternwild:breathDone`, `lanternwild:orreryDone`, `lanternwild:duchessThawed`, `lanternwild:allSolved`, `oak:rootGateOpen`.
    * 11.4.3. Lift-stop values: `below`, `greatOak`, `treeFort`.
    * 11.4.4. New heirlooms ship as `pendingHeirloom: true` (not `treasure`) until Lane 10 flips all eleven at once, so the game stays winnable at 13 during Phase A.
    * 11.4.5. Phase A lanes validate with `npm test -- --tags "not @win and not @maxscore"`; Lane 10 drops `@maxscore`; Lane 13 runs the full suite.
* 12. Decisions (AUTODECISIONS, newest first; AndrewC may override any)
  * 12.1. D12: Lift cycle before the gate opens.
    * 12.1.1. Options: always four beats, or the existing two beats until the gate opens.
    * 12.1.2. **Chosen:** two beats until the gate opens.
    * 12.1.3. Why: this preserves the solved-oak experience and existing saves.
  * 12.2. D11: Part II hour labels.
    * 12.2.1. Options: keep XIII, or relabel the implemented scene XXIV.
    * 12.2.2. **Chosen:** XXIV.
    * 12.2.3. Why: the clock now starts at 24.
  * 12.3. D10: `::win` coupling.
    * 12.3.1. Options: two PRs with `::win` temporarily broken on main, stacked PRs, or one PR with a phase gate.
    * 12.3.2. **Chosen:** one PR with a phase gate.
    * 12.3.3. Why: requiring 24 heirlooms makes today's `::win` unwinnable, so main must never receive content without the matching route. Phase A validates with `@win` scenarios excluded; the final gate runs the full suite.
  * 12.4. D9: Split of the 24.
    * 12.4.1. Options: 13+11 realm, 13+7 realm+4 manor, or 13+5 realm+6 manor.
    * 12.4.2. **Chosen:** 13+7 realm+4 manor.
    * 12.4.3. Why: this keeps the ratified five-challenge, seven-artifact realm and adds manor and grounds content per AndrewC.
  * 12.5. D8: Icons.
    * 12.5.1. Options: wait for Firefly PNGs, or use the tray's emoji fallback.
    * 12.5.2. **Chosen:** run the existing Firefly tool when credentials exist, otherwise ship the tray's built-in emoji.
    * 12.5.3. Why: no gameplay depends on art.
  * 12.6. D7: Prose location.
    * 12.6.1. Options: `world.content.js`, or a per-module `content` export.
    * 12.6.2. **Chosen:** per-module `content`.
    * 12.6.3. Why: parallel lanes then avoid collisions.
  * 12.7. D6: Self-contained realm.
    * 12.7.1. Options: allow manor-item dependencies, or none.
    * 12.7.2. **Chosen:** none.
    * 12.7.3. Why: `::win` can then clear the realm in one pass beside the mine gear.
  * 12.8. D5: Realm exit.
    * 12.8.1. Options: a GRAND BEDROOM wardrobe, or the root gate under the oak.
    * 12.8.2. **Chosen:** the root gate.
    * 12.8.3. Why: AndrewC's direction; the realm becomes a mine-to-oak traversal.
  * 12.9. D4: Flight in the realm.
    * 12.9.1. Options: allow flight, or block named flights and add the inverted-shoes hazard.
    * 12.9.2. **Chosen:** block named flights and add the hazard.
    * 12.9.3. Why: the upside-down rule becomes a fair puzzle, not a cheat.
  * 12.10. D3: Inverted gems source.
    * 12.10.1. Options: three hidden finds, or the Duchess's CASKET on full completion.
    * 12.10.2. **Chosen:** the CASKET.
    * 12.10.3. Why: solving everything is the stated trigger.
  * 12.11. D2: Portal.
    * 12.11.1. Options: a new side tunnel, or a MINERS' LOCKER in the MINING GALLERY.
    * 12.11.2. **Chosen:** the locker.
    * 12.11.3. Why: it sits after DREADMAW and before the TROLL, and the gallery already shows where mining gear hung.
  * 12.12. D1: Name.
    * 12.12.1. Options: Lanternwild, Underbough, or Rimewood.
    * 12.12.2. **Chosen:** Lanternwild.
    * 12.12.3. Why: it evokes lamp-lit wonder and borrows nothing from Narnia or Stranger Things.
* 13. Review gate (exactly one triad on the integrated batch, after Lane 13 and normal validation)
  * 13.1. ARCH brief: check P1 and P5.
    * 13.1.1. No realm or quartet logic appears in `core.js`, `parser.js`, or `commands.js`.
    * 13.1.2. Modules export the seam shape; the realm needs no manor item; flight refusal and the lift cycle live in content.
    * 13.1.3. The route planner lives under `web/tools/` and is never imported by the game.
  * 13.2. QUALITY brief:
    * 13.2.1. Every new feature file covers success, each warning, each death, each award exactly once, and replay without farming.
    * 13.2.2. Migration covers saves that are 13-deposited, bell-rung, and in Part II.
    * 13.2.3. The trace asserts one named flight, one PUT ALL IN RQ, the derived maximum, and a transition ratio below 5.9.
    * 13.2.4. `npm test` exit 0 is recorded; no stale "thirteen" text remains; docs change in the same commits.
  * 13.3. PROCESS brief:
    * 13.3.1. Work happened only in assigned worktrees, with no per-lane PRs.
    * 13.3.2. Phase B was spawned only after the recorded Phase A gate.
    * 13.3.3. The master status is current, and the CodeRabbit trigger follows the Coven route.

## Operator next actions

* Review Sections 5 to 9 and 12 and reply with any overrides. Without overrides, Lane 1 proceeds on the recommended choices.

## Verified evidence (2026-11-07)

* The `::win` trace on `8ff6efb` took 165 steps and scored 825. It made 77 room transitions; the ROYAL HALL was visited 8 times, the LANDING 6, the GATE 5, and the DINING ROOM 5.
* The single MATCH already lights the CANDLE (step 39, +10: candle use plus match use).
* The brazier is lit by body fire (step 65, +40: brazier 30 plus survival 10). Body fire already outscores the candle (10) and the candelabra (10).
* Research (Wikipedia, fetched 2026-11-07) used as challenge sources: Myst, Riven, The 7th Guest, Day of the Tentacle, Sam & Max Hit the Road, Monkey Island 1 and 2, King's Quest VI, Shivers, Loom, Enchanter, Zork Nemesis.

<!-- end 2026-11-07_plan_todo_DoomsdayClock.md -->
