<!-- 2026-11-07_plan_todo_DoomsdayClock.md. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.001:acoven. -->

# Doomsday Clock: master orchestration

Status: todo. Plan v2 (2026-11-08) replaces the v1 realm and manor design with the design AndrewC ratified on 2026-11-08. Phase A builds the new content. Phase B (`::win`, route, and scoring incentives) cannot start until every Phase A lane is complete and validated, per AndrewC: "dont do anything with ::win yet until we build the new section."

## Current status

* Plan v2 written; no implementation started; `::win` untouched.
* Todos: 0 done / 106 total (0%); 106 remaining.
* Coding progress: none. Realm and shared high are ratified; the manor quintet is pitched and under refinement with AndrewC.
* Average task duration: UNKNOWN (0 measured tasks).
* Completion ETA: UNKNOWN.
* Next shareable build: UNKNOWN; requires the single release PR to merge, a content stamp, and the Pages deploy (OTA). No native change is planned, so no TestFlight build is needed.
* BLOCKERS: EMPTY.
* Status surfaces: `code/README.md` does not exist in this repository, so no dashboard was written there.

## Stated goals

* G1:Realm: Players who get past DREADMAW can climb into a MINERS' LOCKER in the MINING GALLERY and reach a Stranger Things and Narnia parody realm (working name Lanternwild). They solve four classic adventure puzzles, recover six heirlooms, and return through a root gate beneath the GREAT OAK. Proved by: Lanes 2 to 7. Artifact: `web/tests/features/lanternwild-*.feature`, `oak-tree-fort.feature`.
* G2:DoomsdayClock: The reliquary ritual requires 24 heirlooms (13 existing, 5 new manor, 6 realm) that become a 24-hour DOOMSDAY CLOCK. Old saves migrate fairly, and every surface agrees: text, HUD, Part II, Gary, the 2D tray, and docs. Proved by: Lanes 8 to 10. Artifact: `manor-quintet.feature`, `shared-high.feature`, `heirloom-migration.feature`, `part-two.feature`, `true-ending.feature`.
* G3:EfficientWin: `::win` gathers the gear once and then walks everything. It takes everything in each room, uses items on arrival (arriving at the brazier already ablaze), and deposits all 24 heirlooms with one PUT ALL IN RQ. Scoring rewards that play style. Proved by: Lanes 11 to 13. Artifact: the `sysop-menu.feature` trace scenario.

## PRD

* 1. Problem
  * 1.1. Part I has 13 heirlooms in a fully explored manor; playtesters want a surprising new region and a bigger final countdown.
  * 1.2. `::win` doubles back constantly. Traced 2026-11-07 against `8ff6efb`: 77 room transitions, ROYAL HALL visited 8 times, LANDING 6, GATE 5, and DINING ROOM 5, with 13 single-item reliquary deposits.
* 2. Personas
  * 2.1. Player: explores for laughs, wonder, and points. Concern: saved progress and score must never be lost or silently changed.
  * 2.2. Designer (DavidH, AndrewC): verifies the whole game with `::win`. Concern: the route must be a credible physical playthrough.
* 3. Business opportunity
  * 3.1. A parody realm, five new manor puzzles, and a 24-hour clock extend Part I replay and enlarge Part II's spine using static web content only.
* 4. Recommended approach
  * 4.1. Build the content (realm, root-gate lift, manor quintet, shared high, 24-heirloom clock) first. Then rebuild `::win` around gear first, walk everything, and deposit once. Ship both in one PR.
* 5. Outcomes
  * 5.1. Given DREADMAW has moved, when the player OPENS the LOCKER and goes IN, then they arrive in the realm hub, and OUT returns them to the MINING GALLERY.
  * 5.2. Given the player carries the three fridge cheeses, when they FEED them to DEMOGORGONZOLA in any order, then its face opens like a flower and it yields the DEMOGORGONZOLA RIND.
  * 5.3. Given the player tells the planetarium projector 4, when the star flares, then they stand at the FRONT GATE on fire, one step west of the BRAZIER.
  * 5.4. Given all four realm puzzles are solved, when the player seats the three INVERTED GEMS in reverse order and boards the lift as it reaches BELOW, then it carries them up to the GREAT OAK or the TREE FORT.
  * 5.5. Given the player holds the SNUFFBOX, when they SNIFF it, then they gain six turns of the same high the mushrooms give, shown by the existing 🍄 indicator.
  * 5.6. Given 24 heirlooms are carried, when the player types PUT ALL IN RQ, then all 24 seat at once and the ONE TRIP bonus is awarded.
  * 5.7. Given a fresh game, when the designer runs `::win`, then it ends alive in the ROYAL HALL holding the DOOMSDAY CLOCK with the derived maximum score.
* 6. Primary measurement
  * 6.1. `::win` room transitions per required heirloom. The baseline is 77/13 = 5.9, from the existing trace step. Target: below 5.9 with 24 heirlooms. The trace scenario measures it locally; no player data is collected.

## TRD

* 1. Terminology and Scope
  * 1.1. Realm: the new otherworld, working name Lanternwild (final name OPEN, D20); code paths use `lanternwild` regardless. Heirloom: a `treasure: true` item the reliquary requires. Manor quintet: the five new manor heirlooms. Shared high: the one trip state (flag `high`) that mushrooms and snuff both start. FRONT GATE: the start room `gate`. Lift stops: BELOW (ROOT HOLLOW), GROUND (GREAT OAK), and ABOVE (TREE FORT).
  * 1.2. EXPLICITLY NOT DOING:
    * 1.2.1. Building Part II Hours XXIII to I.
    * 1.2.2. Making native iOS changes.
    * 1.2.3. Adding network calls or telemetry.
    * 1.2.4. Touching `::win` before Phase A completes.
    * 1.2.5. Reproducing song lyrics anywhere.
    * 1.2.6. Holiday theming of any kind.
    * 1.2.7. Reusing existing gags (burrito callbacks, Taco Tuesday) as new mechanics.
    * 1.2.8. An inverted world as the core premise; upside-down touches stay light.
* 2. Environment
  * 2.1. The game is pure static web (`web/`) using ES modules. Tests run with `cd web && npm test` (Cucumber). CI (`.github/workflows/ci.yml`) runs the same command on PRs, and Pages deploys `web/` on every push to main.
  * 2.2. Phones receive content only when `CONTENT_VERSION` increases (`ios/release-testflight.sh --stamp-only --force-next-build`). Every new file must also be listed in `web/versions.json` `CONTENT_FILES`.
* 3. Principles
  * 3.1. P1:ContentModules: new rooms, items, prose, and handlers MUST live in content modules registered by `world.js`. The engine (`core.js`, `parser.js`, `commands.js`) NEVER gains realm or manor puzzle knowledge; it may gain only generic verbs.
  * 3.2. P2:WebFirst: all gameplay MUST stay in `web/` per ADR 0001. Native code NEVER changes for this work.
  * 3.3. P3:FairCruelty: every punishing outcome (ejection to the FRONT GATE, burning, death) MUST be foreshadowed by text the player can read before triggering it.
  * 3.4. P4:NoFarming: every award MUST be granted once through a persisted flag. Save migration NEVER invents or erases earned points.
  * 3.5. P5:MinimalCrossings: realm puzzles MUST need nothing from the manor except the three fridge cheeses; everything else they need is found in the realm.
  * 3.6. P6:ExecutableProof: every puzzle, ejection, death, award, migration, and route claim MUST be proved by executable Gherkin in the same commit as its code.
  * 3.7. Cross-cutting:
    * 3.7.1. Analytics: none exists and none is added.
    * 3.7.2. Observability: bug reports (`issue-report.js`) MUST include the realm room, lift stop, and puzzle flags.
    * 3.7.3. Auth: not applicable.
    * 3.7.4. Security: no new network calls. Firefly credentials stay in environment variables only.
    * 3.7.5. Accessibility: everything is completable by typed commands and screen readers, with no color-only clues.
    * 3.7.6. Internationalisation: English only, with new prose kept in content exports.
    * 3.7.7. Copyright: real song titles are allowed; every radio clue and all other prose is original text.
* 4. Architecture
  * 4.1. Entry: `mineGallery` gains a fixed MINERS' LOCKER. OPEN LOCKER then IN moves the player to the realm hub, and OUT from the hub returns to the gallery.
  * 4.2. Exit: once every realm puzzle is solved, the ROOT HOLLOW opens and links to the oak lift's BELOW stop.
  * 4.3. Modules:
    * 4.3.1. `web/js/lanternwild/index.js` aggregates `realm.js` (hub, locker, flight refusal), `demogorgonzola.js`, `radio.js` with its data file `radio-clues.js`, `planetarium.js`, `shack.js`, and `rootgate.js`.
    * 4.3.2. `web/js/manor/index.js` aggregates `fridge.js`, `diamond.js`, `estatemap.js`, `corkscrew.js`, `snuffbox.js`, and `weathercock.js`.
    * 4.3.3. Each module exports `{ rooms, items, content, shortNames, progressAwards, hints, roomHooks }`. `world.js` merges them once and chains any room hooks onto existing handlers.
  * 4.4. Verbs: Lane 2 adds the generic verbs Lane 1 lists (expected KNOCK, COMBINE, SPELL, KICK, FIGHT) to `parser.js` with default refusals in `commands.js`. FEED already maps to GIVE, SNIFF to SMELL, and ANSWER to SAY.
  * 4.5. Shared high: `world.js` owns `beginHigh(ctx, { opening, turns })`. Items declare `highSource: { opening, turns, doses }` and the module merge attaches the shared handler, so content modules never import `world.js`.
  * 4.6. Flow: commands reach item and room `on` handlers exactly as manor content does. Awards use the existing `awardProgress`, `awardPickup`, and `awardUse`. Ejections move the player to `gate` and keep inventory.
  * 4.7. Canonical data: the heirloom set derives from `treasure: true`. `REQUIRED_FAMILY_ITEM_COUNT` becomes 24, and `maximumScore()` stays derived.
  * 4.8. External boundaries: the `versions.json` manifest, the `map.js` floor layout and `web/view2d` data, and the optional Firefly icon tool (the tray has a built-in emoji fallback).
* 5. Realm design (ratified by AndrewC 2026-11-08; Lane 1 records exact text and constants in `docs/plans/2026-11-07_info_LanternwildAndDoomsdayClockCanon.md`)
  * 5.1. Tone: classic adventure-game puzzles (Myst, Maniac Mansion, Monkey Island, King's Quest era) dressed in hysterically junior-high-boy absurd humor that parodies Stranger Things and Narnia. The joke is paint on a real, fair puzzle and never replaces the mechanic.
  * 5.2. Rooms (working names; Lane 1 fixes names and exits): WAYLAMP CLEARING (hub, a lone lamppost in a wood), CHEESE GROTTO, AV CLUB DEN, PLANETARIUM, MAP ROOM (off the planetarium), SHACK, and ROOT HOLLOW (sealed until every puzzle is solved).
  * 5.3. Flight: named flights into or out of the realm are refused. An inverted WINGED SHOES hazard remains an OPEN proposal only (D22) and is not built.
  * 5.4. DEMOGORGONZOLA (a cheese monster whose face opens like a flower):
    * 5.4.1. The KITCHEN gains a FRIDGE holding the existing MILK and three of the world's stinkiest cheeses (recommendation: Vieux-Boulogne, Époisses, Limburger; Stinking Bishop alternate; D23).
    * 5.4.2. GIVE or FEED it all three cheeses in any order; order never matters. After the third it yields the DEMOGORGONZOLA RIND (heirloom).
    * 5.4.3. Any other interaction (ATTACK, FIGHT, TOUCH, KICK, and the like) gets you swallowed; you reappear at the FRONT GATE.
  * 5.5. RADIO QUIZ (AV club name-that-tune):
    * 5.5.1. A big classic CABINET RADIO presents one clue plus five numbered song titles. The player answers with ANSWER <n> or by saying the title.
    * 5.5.2. Three correct in a row wins. A miss resets the streak, and the radio plays the wrong song back in a cracking falsetto.
    * 5.5.3. Each attempt draws randomly from a seedable source so tests are deterministic.
    * 5.5.4. Content: about 20 real 1980s songs with 5 clues each. Titles are fine; lyrics are never reproduced. Every clue is an original, hopelessly literal play-by-play paraphrase of a verse, for example "A fighter pilot will not shut up about one specific dangerous area."
    * 5.5.5. Winning swings the cabinet open to reveal the battery-powered PORTABLE TRANSISTOR RADIO (scuffed leather case, strap, telescoping antenna), an heirloom.
  * 5.6. PLANETARIUM (Myst Stoneship nod; a plain domed room):
    * 5.6.1. A brass PROJECTOR always just asks for a number 1 to 5; its behavior never changes.
    * 5.6.2. The MAP ROOM holds the STELLAR MAP (heirloom). Its numbering is alphabetical and fixed every game: 1 BIG DIPPER OF RANCH, 2 BLACK BUNGHOLE, 3 ORION'S WEDGIE, 4 SERIOUS-SIRIUS, 5 URANUS MAJOR.
    * 5.6.3. Picking 1, 3, or 5 lights that constellation on the dome. The first such pick drops the GOLD EYEPIECE (heirloom); later picks just show the constellation.
    * 5.6.4. Picking 2 stretches you like spaghetti and ejects you to the FRONT GATE with inventory kept.
    * 5.6.5. Picking 4 sets you on fire and deposits you at the FRONT GATE still burning. The existing body-fire burn timer applies, and the garden BRAZIER one step east allows the existing +30 body-fire lighting.
  * 5.7. SHACK (alphabet-wall parody; no color mechanic):
    * 5.7.1. A small rundown shack has the letters A to Z painted on its wall, each under a bulb.
    * 5.7.2. On the door hangs a KID'S DRAWING of DEMOGORGONZOLA farting, with many arrows pointing at the fart. It is takeable and is an heirloom.
    * 5.7.3. Spelling FART, STINK, or CHEESE on the wall (any one is accepted) makes the wall spit out the PURPLE CRAYON (heirloom).
  * 5.8. Completion: when DEMOGORGONZOLA is fed, the quiz is won, the eyepiece has dropped, and the wall has been spelled, `realm:allSolved` is set and the ROOT HOLLOW opens. The source of the three INVERTED GEMS is OPEN (D21); recommendation: solving the last puzzle reveals the ROOT HOLLOW, where the gems hang in a root nest.
* 6. Root gate and oak lift (AndrewC 2026-11-07)
  * 6.1. The ROOT HOLLOW has an upside-down ROOT PANEL that mirrors the oak panel. Its order is the reverse of the manor panel: INVERTED SAPPHIRE top, INVERTED EMERALD middle, INVERTED RUBY bottom. Wrong placements are refused with a mirrored-order clue.
  * 6.2. Seating all three opens the ROOT GATE. The lift then runs a four-beat cycle, one beat per turn: GROUND, ABOVE, GROUND, BELOW, GROUND. Until the root gate opens, the existing GROUND and ABOVE cycle is unchanged.
  * 6.3. Arriving from below, the player observes the cycle from the ROOT HOLLOW (LOOK UP or WAIT shows where the platform is). Boarding when it reaches BELOW carries the rider up. Stepping OUT at GROUND exits to the GREAT OAK; staying aboard reaches the TREE FORT.
  * 6.4. From the GREAT OAK, a rider can descend to BELOW once the gate is open. Before it opens, BELOW shows sealed roots.
* 7. Manor quintet (PITCHED; each item is under refinement with AndrewC, and Lane 1 records the refined design)
  * 7.1. BLACKWOOD DIAMOND (Maniac Mansion nod), under refinement: a MICROWAVE in the KITCHEN has a dial of SECONDS, YEARS, CENTURIES, and EONS. Microwaving COAL on EONS makes the DIAMOND; shorter settings yield slightly older coal, and longer ones yield dust. Coal source OPEN (D24).
  * 7.2. ESTATE MAP, under refinement: COMBINE four torn MAP PIECES into the ESTATE MAP. Pitched hiding places: the privy TOILET, DREADMAW's nostril, the Baron portrait's mouth, and under a mattress.
  * 7.3. CORKSCREW, under refinement: KNOCK on the WINE CELLAR casks; the hollow one yields the CORKSCREW. Knock-knock joke flavor is pitched.
  * 7.4. SNUFFBOX, under refinement: a liar-logic puzzle with Baron Munchhausen (a famous liar) and two portraits in the PARLOR. Ratified use: SNIFF or USE SNUFFBOX takes one pinch, adding 6 turns of the shared high (Section 10). Pinches stack like mushrooms. After 3 pinches the box is EMPTY but remains an heirloom. The first sniff earns the normal +5 use award.
  * 7.5. WEATHERCOCK, under refinement: the ROOF gargoyles' gazes give a compass order. TURN WEATHERVANE through it to open a CHIMNEY CACHE holding the SILVER WEATHERCOCK. The gag is the rooster crowing.
* 8. Scoring (values proposed, D26; Lane 10 derives and documents the new maximum)
  * 8.1. Existing mechanics stay: +5 pickup and +5 use per portable item, each granted once through `awardProgress` flags. `maximumScore()` stays derived.
  * 8.2. Proposed progress awards: realm discovery +20; each realm puzzle +10 (four); root gate opened +10; each manor puzzle +5 (five).
  * 8.3. Proposed deposit values:
    * 8.3.1. Realm (80 total): DEMOGORGONZOLA RIND 15, PORTABLE TRANSISTOR RADIO 15, GOLD EYEPIECE 15, PURPLE CRAYON 15, STELLAR MAP 10, KID'S DRAWING 10.
    * 8.3.2. Manor (65 total): BLACKWOOD DIAMOND 15, ESTATE MAP 15, SILVER WEATHERCOCK 15, SNUFFBOX 10, CORKSCREW 10.
  * 8.4. Phase B keeps the ONE TRIP bulk-deposit bonus, the BACKPACK capacity raise, and the verified evidence below.
* 9. Doomsday clock
  * 9.1. The COUNTDOWN CLOCK becomes the 24-hour DOOMSDAY CLOCK; COUNTDOWN CLOCK names stay as aliases.
  * 9.2. The reliquary shows 24 recesses ringed like a clock face.
  * 9.3. Part II starts at XXIV. The implemented Medusa/emerald scene is relabeled Hour XXIV and ticks the clock to XXIII. Hours XXIII to I remain out of scope.
* 10. Shared high (ratified by AndrewC 2026-11-08)
  * 10.1. Mushrooms and snuff start one generic high: third eye vision, dark sight, and named-room flight. The HUD keeps the existing 🍄 trip indicator for both.
  * 10.2. The fixed paragraph in `eatMushrooms` ("The house isn't haunted, man ... deeply unqualified to be here") becomes a 12-entry pool cycled by `cycleFlavor` through `CYCLING_FLAVOR_POOLS`, so saved counters prevent early repeats.
  * 10.3. All shared text is generic ("you're high", "the trip"). Only the opening line differs by source: fresh toilet mushrooms, dried mushrooms, or a snuff sneeze. The two `MUSHROOM_REVELATIONS` lines that say "mushrooms" get generic wording.
* 11. ModelPicker (Copilot runtime; baseline recorded before spawn)
  * 11.1. Lane 1 Canon: mod:c70+s60='copilot:gpt-6-sol:1M:max'
  * 11.2. Lane 2 RealmHub: mod:c50+s80='copilot:gpt-5.6-terra:1M:xhigh'
  * 11.3. Lane 3 Demogorgonzola: mod:c45+s85='copilot:gpt-5.6-terra:1M:xhigh'
  * 11.4. Lane 4 RadioQuiz: mod:c55+s80='copilot:gpt-5.6-terra:1M:xhigh'
  * 11.5. Lane 5 Planetarium: mod:c50+s85='copilot:gpt-5.6-terra:1M:xhigh'
  * 11.6. Lane 6 Shack: mod:c40+s85='copilot:gpt-5.6-terra:1M:xhigh'
  * 11.7. Lane 7 RootGateLift: mod:c65+s80='copilot:gpt-5.6-terra:1M:xhigh'
  * 11.8. Lane 8 ManorQuintet (one task worker per heirloom): mod:c55+s60='copilot:gpt-5.6-terra:1M:xhigh'
  * 11.9. Lane 9 SharedHigh: mod:c45+s85='copilot:gpt-5.6-terra:1M:xhigh'
  * 11.10. Lane 10 DoomsdayCount: mod:c65+s75='copilot:gpt-5.6-terra:1M:xhigh'
  * 11.11. Lane 11 ScoringIncentives: mod:c45+s80='copilot:gpt-5.6-terra:1M:xhigh'
  * 11.12. Lane 12 RoutePlanner: mod:c72+s65='copilot:gpt-6-sol:1M:max'
  * 11.13. Lane 13 WinRoute: mod:c60+s75='copilot:gpt-5.6-terra:1M:xhigh'
  * 11.14. Lane 14 ContentRelease: mod:c20+s90='copilot:gpt-6-luna:400K:medium'
  * 11.15. Reviewers:
    * 11.15.1. ARCH: mod:c75+s60='copilot:gpt-6-sol:1M:max'
    * 11.15.2. QUALITY and PROCESS: mod:c65+s60='copilot:gpt-5.6-terra:1M:xhigh'
* 12. planit lanes (one integration branch `wave/doomsday-clock`, one PR)
  * 12.1. Phase A:
    * 12.1.1. [Lane 1 Canon](2026-11-07_plan_todo_DoomsdayClock_Lane1-Canon.md) runs first.
    * 12.1.2. [Lane 2 RealmHub](2026-11-07_plan_todo_DoomsdayClock_Lane2-RealmHub.md) runs next.
    * 12.1.3. Then these run in parallel: [Lane 3 Demogorgonzola](2026-11-07_plan_todo_DoomsdayClock_Lane3-Demogorgonzola.md), [Lane 4 RadioQuiz](2026-11-07_plan_todo_DoomsdayClock_Lane4-RadioQuiz.md), [Lane 5 Planetarium](2026-11-07_plan_todo_DoomsdayClock_Lane5-Planetarium.md), [Lane 6 Shack](2026-11-07_plan_todo_DoomsdayClock_Lane6-Shack.md), and [Lane 9 SharedHigh](2026-11-07_plan_todo_DoomsdayClock_Lane9-SharedHigh.md).
    * 12.1.4. [Lane 7 RootGateLift](2026-11-07_plan_todo_DoomsdayClock_Lane7-RootGateLift.md) runs after Lanes 3 to 6.
    * 12.1.5. [Lane 8 ManorQuintet](2026-11-07_plan_todo_DoomsdayClock_Lane8-ManorQuintet.md) runs after Lane 9 (the snuffbox needs the high hook); each heirloom worker spawns only once Lane 1 records that heirloom's refined design.
    * 12.1.6. [Lane 10 DoomsdayCount](2026-11-07_plan_todo_DoomsdayClock_Lane10-DoomsdayCount.md) runs last, after Lanes 7 and 8.
  * 12.2. WAIT: before spawning any Phase B lane, confirm every Phase A lane is done and that `cd web && npm test -- --tags "not @win"` exits 0 on the integration branch. AndrewC directive: "dont do anything with ::win yet until we build the new section."
  * 12.3. Phase B:
    * 12.3.1. [Lane 11 ScoringIncentives](2026-11-07_plan_todo_DoomsdayClock_Lane11-ScoringIncentives.md) and [Lane 12 RoutePlanner](2026-11-07_plan_todo_DoomsdayClock_Lane12-RoutePlanner.md) run in parallel.
    * 12.3.2. [Lane 13 WinRoute](2026-11-07_plan_todo_DoomsdayClock_Lane13-WinRoute.md) runs after both.
    * 12.3.3. The single pre-PR triad follows.
    * 12.3.4. [Lane 14 ContentRelease](2026-11-07_plan_todo_DoomsdayClock_Lane14-ContentRelease.md) runs last.
  * 12.4. Seam contract (fixed before any spawn):
    * 12.4.1. Lane 2 creates and registers every module stub in Section 4.3. Each later lane edits only its own modules, feature file, and lane-listed shared lines.
    * 12.4.2. Flag names: `realm:demoFed`, `realm:radioWon`, `realm:eyepieceDropped`, `realm:shackSpelled`, `realm:allSolved`, `oak:rootGateOpen`; radio seed `realm:radioSeed`; snuff pinches `manor:snuffPinches`.
    * 12.4.3. Lift-stop values: `below`, `greatOak`, `treeFort`.
    * 12.4.4. New heirlooms ship as `pendingHeirloom: true` (not `treasure`) until Lane 10 flips all eleven at once, so the game stays winnable at 13 during Phase A.
    * 12.4.5. Phase A lanes validate with `cd web && npm test -- --tags "not @win and not @maxscore"`; Lane 10 drops `@maxscore`; Lane 13 runs the full suite.
* 13. Decisions (newest first; AUTODECISIONS unless marked ratified; AndrewC may override any)
  * 13.1. D26: Deposit and progress award values (OPEN).
    * 13.1.1. Framing: eleven new heirlooms and nine new puzzles need point values.
    * 13.1.2. Options: flat values for all, or weighted by puzzle effort.
    * 13.1.3. **Chosen:** OPEN; recommendation is the weighted values in Section 8.
    * 13.1.4. Why: harder puzzles pay more, and totals stay derived.
  * 13.2. D25: Manor puzzle details (OPEN).
    * 13.2.1. Framing: the five manor heirlooms are pitched and under refinement with AndrewC.
    * 13.2.2. Options: build the pitches as written, or refine each first.
    * 13.2.3. **Chosen:** OPEN; refine each with AndrewC, record it in the canon doc, then spawn its worker.
    * 13.2.4. Why: the snuffbox use is the only ratified manor mechanic.
  * 13.3. D24: Coal source for the BLACKWOOD DIAMOND (OPEN).
    * 13.3.1. Framing: the microwave needs COAL from somewhere fair.
    * 13.3.2. Options: an existing fireplace or grate, the mine, or a new coal scuttle.
    * 13.3.3. **Chosen:** OPEN; no recommendation yet.
    * 13.3.4. Why: it depends on the refined DIAMOND design (D25).
  * 13.4. D23: Cheese choice (OPEN).
    * 13.4.1. Framing: three real, famously stinky cheeses go in the FRIDGE.
    * 13.4.2. Options: Vieux-Boulogne, Époisses, Limburger, or Stinking Bishop.
    * 13.4.3. **Chosen:** OPEN; recommendation is Vieux-Boulogne, Époisses, and Limburger, with Stinking Bishop as the alternate.
    * 13.4.4. Why: they are widely cited as the stinkiest, and their names are funny on their own.
  * 13.5. D22: Inverted WINGED SHOES hazard (OPEN).
    * 13.5.1. Framing: v1 killed players who walked the realm in WINGED SHOES.
    * 13.5.2. Options: build the hazard, or rely on named-flight refusal alone.
    * 13.5.3. **Chosen:** OPEN; not built unless AndrewC ratifies it.
    * 13.5.4. Why: AndrewC did not ratify it, and flight refusal already prevents the cheat.
  * 13.6. D21: Source of the three INVERTED GEMS (OPEN).
    * 13.6.1. Framing: the root panel needs three INVERTED GEMS; the v1 source is withdrawn.
    * 13.6.2. Options: one gem per puzzle, three hidden finds, or a root nest revealed by the last solve.
    * 13.6.3. **Chosen:** OPEN; recommendation is that solving the last realm puzzle reveals the ROOT HOLLOW, where the three gems hang in a root nest.
    * 13.6.4. Why: completion stays the single trigger and no new character is needed.
  * 13.7. D20: Realm name (OPEN).
    * 13.7.1. Framing: the realm needs a final display name.
    * 13.7.2. Options: keep the working name Lanternwild, or choose a parody name.
    * 13.7.3. **Chosen:** OPEN; Lanternwild stays the working name, and code paths keep `lanternwild` whatever the display name.
    * 13.7.4. Why: renaming paths later would churn every lane.
  * 13.8. D19: v1 realm content withdrawn (ratified by AndrewC 2026-11-08).
    * 13.8.1. Framing: the v1 realm challenges, characters, items, and winter premise no longer fit.
    * 13.8.2. Options: keep parts, or replace them entirely.
    * 13.8.3. **Chosen:** replace them entirely with Sections 5 and 6.
    * 13.8.4. Why: the new realm is a comedy parody built on fair classic puzzles.
  * 13.9. D18: Snuffbox use (ratified by AndrewC 2026-11-08).
    * 13.9.1. Framing: the SNUFFBOX needs a use beyond deposit.
    * 13.9.2. Options: decorative only, or a limited high.
    * 13.9.3. **Chosen:** three stacking pinches of 6 high turns each; the empty box remains an heirloom; the first sniff earns +5 use.
    * 13.9.4. Why: it reuses the shared high and gives the snuffbox a real use.
  * 13.10. D17: Shared high (ratified by AndrewC 2026-11-08).
    * 13.10.1. Framing: mushrooms and snuff would otherwise duplicate the trip logic and text.
    * 13.10.2. Options: separate effects, or one generic high.
    * 13.10.3. **Chosen:** one generic high, the 🍄 indicator for both, a 12-entry cycling pool, and source-specific opening lines only.
    * 13.10.4. Why: one behavior, varied text, no early repeats.
  * 13.11. D16: P5:MinimalCrossings replaces P5:SelfContainedRealm (ratified by AndrewC 2026-11-08).
    * 13.11.1. Framing: the DEMOGORGONZOLA cheeses come from the manor FRIDGE.
    * 13.11.2. Options: a fully self-contained realm, or minimal crossings.
    * 13.11.3. **Chosen:** only the three fridge cheeses may cross.
    * 13.11.4. Why: one fair, telegraphed crossing ties the realm to the manor without sprawl.
  * 13.12. D15: Realm completion (ratified by AndrewC 2026-11-08).
    * 13.12.1. Framing: the return path must wait for full completion.
    * 13.12.2. Options: open the root gate per puzzle, or once all are solved.
    * 13.12.3. **Chosen:** once all are solved, keeping the Section 6 root panel and four-beat lift.
    * 13.12.4. Why: completion is the trigger, and the lift design was already approved.
  * 13.13. D14: SHACK alphabet wall (ratified by AndrewC 2026-11-08).
    * 13.13.1. Framing: parody the alphabet wall without a color mechanic or holiday theme.
    * 13.13.2. Options: one secret word, or several accepted words.
    * 13.13.3. **Chosen:** FART, STINK, or CHEESE all work; the KID'S DRAWING on the door is the clue and an heirloom.
    * 13.13.4. Why: the drawing's arrows make the answer fair and funny.
  * 13.14. D13: PLANETARIUM (ratified by AndrewC 2026-11-08).
    * 13.14.1. Framing: a Myst Stoneship nod with a fixed number puzzle.
    * 13.14.2. Options: a shuffled per-game mapping, or a fixed alphabetical mapping.
    * 13.14.3. **Chosen:** fixed alphabetical numbering explained by the STELLAR MAP; 1, 3, 5 are safe, 2 ejects, 4 ignites.
    * 13.14.4. Why: the map is the clue, and the burning exit chains into the brazier.
  * 13.15. D12: RADIO QUIZ (ratified by AndrewC 2026-11-08).
    * 13.15.1. Framing: an 80s name-that-tune that respects copyright.
    * 13.15.2. Options: quoted lyrics, or original literal paraphrases.
    * 13.15.3. **Chosen:** about 20 songs by 5 original clues, five numbered titles per round, three in a row wins, a miss resets, seedable random draw.
    * 13.15.4. Why: titles are not protected expression, the literal paraphrase is the joke, and seeding keeps tests deterministic.
  * 13.16. D11: DEMOGORGONZOLA (ratified by AndrewC 2026-11-08).
    * 13.16.1. Framing: a monster puzzle with a feeding solution.
    * 13.16.2. Options: an ordered feeding rule, or any order.
    * 13.16.3. **Chosen:** all three cheeses in any order; any other interaction swallows you to the FRONT GATE; no petal key.
    * 13.16.4. Why: the puzzle is finding the cheeses, not guessing an order.
  * 13.17. D10: Named flights in the realm (ratified by AndrewC 2026-11-08).
    * 13.17.1. Framing: mushroom or snuff flight could bypass the locker and root gate.
    * 13.17.2. Options: allow flight, or refuse named flights in both directions.
    * 13.17.3. **Chosen:** refuse named flights in both directions.
    * 13.17.4. Why: the locker and root gate stay the only ways in and out.
  * 13.18. D9: Realm theme and tone (ratified by AndrewC 2026-11-08).
    * 13.18.1. Framing: the realm needs a comic identity.
    * 13.18.2. Options: an inverted winter fairy tale, or a Stranger Things and Narnia parody.
    * 13.18.3. **Chosen:** the parody, with classic fair puzzles and light upside-down touches; no holiday theme; no reuse of existing gags as mechanics.
    * 13.18.4. Why: the humor sells the puzzles without replacing them.
  * 13.19. D8: Split of the 24 (ratified by AndrewC 2026-11-08).
    * 13.19.1. Framing: 11 new heirlooms reach 24.
    * 13.19.2. Options: 13+7 realm+4 manor, or 13+6 realm+5 manor.
    * 13.19.3. **Chosen:** 13 existing, 5 manor, 6 realm.
    * 13.19.4. Why: four realm puzzles yield six heirlooms, and five manor puzzles are pitched.
  * 13.20. D7: Lift cycle before the gate opens.
    * 13.20.1. Framing: the four-beat lift must not disturb existing play.
    * 13.20.2. Options: always four beats, or the existing two beats until the gate opens.
    * 13.20.3. **Chosen:** two beats until the gate opens.
    * 13.20.4. Why: this preserves the solved-oak experience and existing saves.
  * 13.21. D6: Part II hour labels.
    * 13.21.1. Framing: the clock now has 24 hours.
    * 13.21.2. Options: keep XIII, or relabel the implemented scene XXIV.
    * 13.21.3. **Chosen:** XXIV.
    * 13.21.4. Why: the clock now starts at 24.
  * 13.22. D5: `::win` coupling.
    * 13.22.1. Framing: requiring 24 heirlooms makes today's `::win` unwinnable.
    * 13.22.2. Options: two PRs with `::win` temporarily broken on main, stacked PRs, or one PR with a phase gate.
    * 13.22.3. **Chosen:** one PR with a phase gate.
    * 13.22.4. Why: main never receives content without the matching route. Phase A validates with `@win` scenarios excluded; the final gate runs the full suite.
  * 13.23. D4: Icons.
    * 13.23.1. Framing: eleven new heirlooms need tray art.
    * 13.23.2. Options: wait for Firefly PNGs, or use the tray's emoji fallback.
    * 13.23.3. **Chosen:** run the existing Firefly tool when credentials exist; otherwise ship the tray's built-in emoji.
    * 13.23.4. Why: no gameplay depends on art.
  * 13.24. D3: Prose location.
    * 13.24.1. Framing: parallel lanes write prose at once.
    * 13.24.2. Options: `world.content.js`, or a per-module `content` export.
    * 13.24.3. **Chosen:** per-module `content`.
    * 13.24.4. Why: parallel lanes then avoid collisions.
  * 13.25. D2: Realm exit.
    * 13.25.1. Framing: the realm needs a way back to the manor.
    * 13.25.2. Options: a GRAND BEDROOM wardrobe, or the root gate under the oak.
    * 13.25.3. **Chosen:** the root gate.
    * 13.25.4. Why: AndrewC's direction; the realm becomes a mine-to-oak traversal.
  * 13.26. D1: Portal.
    * 13.26.1. Framing: the realm needs an entrance.
    * 13.26.2. Options: a new side tunnel, or a MINERS' LOCKER in the MINING GALLERY.
    * 13.26.3. **Chosen:** the locker.
    * 13.26.4. Why: it sits after DREADMAW and before the TROLL, and the gallery already shows where mining gear hung.
* 14. Review gate (exactly one triad on the integrated batch, after Lane 13 and normal validation)
  * 14.1. ARCH brief: check P1 and P5.
    * 14.1.1. No realm or manor puzzle logic appears in `core.js`, `parser.js`, or `commands.js`; only generic verbs were added.
    * 14.1.2. Modules export the seam shape and never import `world.js`; the snuffbox reaches the high only through `highSource`.
    * 14.1.3. Realm puzzles need nothing from the manor except the three fridge cheeses; flight refusal and the lift cycle live in content.
    * 14.1.4. The route planner lives under `web/tools/` and is never imported by the game.
  * 14.2. QUALITY brief:
    * 14.2.1. Every new feature file covers success, each ejection, the burning path to the brazier, each award exactly once, and replay without farming.
    * 14.2.2. Every one of the radio clues in `radio-clues.js` is an original literal paraphrase that contains no reproduced lyric phrase; titles only.
    * 14.2.3. The seeded radio draw is deterministic, and the shared high pool has 12 entries with no early repeat across save and restore and no "mushroom" in shared text.
    * 14.2.4. Migration covers saves that are 13-deposited, bell-rung, in Part II, and from before the FRIDGE existed.
    * 14.2.5. The trace asserts one named flight, one PUT ALL IN RQ, the derived maximum, and a transition ratio below 5.9.
    * 14.2.6. `npm test` exit 0 is recorded; no stale "thirteen" text remains; no holiday theme or reused existing gag appears; docs change in the same commits.
  * 14.3. PROCESS brief:
    * 14.3.1. Work happened only in assigned worktrees, with no per-lane PRs.
    * 14.3.2. Phase B was spawned only after the recorded Phase A gate, and `::win` was untouched before it.
    * 14.3.3. Each manor heirloom worker spawned only after its refined design was recorded.
    * 14.3.4. The master status is current, and the CodeRabbit trigger follows the Coven route.

## Operator next actions

* Decide or override the OPEN decisions D20 to D26 in Section 13. Without a reply, Lane 1 proceeds on each recommendation and records it as an AUTODECISION; D24 and D25 wait for the manor refinement.
* Finish refining the five manor heirlooms in Section 7 with the main session so Lane 1 can record them.

## Verified evidence

* The `::win` trace on `8ff6efb` took 165 steps and scored 825. It made 77 room transitions; the ROYAL HALL was visited 8 times, the LANDING 6, the GATE 5, and the DINING ROOM 5.
* The single MATCH already lights the CANDLE (step 39, +10: candle use plus match use).
* The brazier is lit by body fire (step 65, +40: brazier 30 plus survival 10). Body fire already outscores the candle (10) and the candelabra (10).
* The FRONT GATE (`gate`) exits east to the GARDEN, where the BRAZIER stands (checked in `web/js/world.js` on 2026-11-08).

<!-- end 2026-11-07_plan_todo_DoomsdayClock.md -->
