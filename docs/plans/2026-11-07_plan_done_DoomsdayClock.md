<!-- 2026-11-07_plan_done_DoomsdayClock.md. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.004:acoven. -->

# Doomsday Clock: master orchestration

Status: done. Released in PR #10 (merge commit 2bbece5) on 2026-11-08; content 2026.11.8 build 1 (20261108001) is live on GitHub Pages.

## Current status

* Shipped: THE UPSIDE DOWN, the manor quintet, the shared high, 24 heirlooms and the DOOMSDAY CLOCK, HELP/INFO, ONE TRIP scoring, and the planner-driven `::win` (2 flights, 68 walking transitions, 1316/1316).
* Todos: 115 done / 115 total (100%); 0 remaining.
* Coding progress: complete and released; 744/744 scenarios pass on the merged head.
* Average task duration: UNKNOWN (0 measured tasks).
* Completion ETA: done 2026-11-08.
* Next shareable build: live now; GitHub Pages serves CONTENT_VERSION 20261108001 and installed iOS apps update over the air. No TestFlight build was needed.
* BLOCKERS: EMPTY.
* Status surfaces: `code/README.md` does not exist in this repository, so no dashboard was written there.

## Stated goals

* G1:Realm: Players who get past DREADMAW can climb into a MINERS' LOCKER in the MINING GALLERY and reach THE UPSIDE DOWN, a Stranger Things and Narnia parody realm. They solve four classic adventure puzzles, recover six heirlooms, and ride the oak lift up from the LOWER PANEL beneath the GREAT OAK. Proved by: Lanes 2 to 7. Artifact: `web/tests/features/upsidedown-*.feature`, `oak-tree-fort.feature`.
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
  * 4.1. Build the content (realm, lower panel lift, manor quintet, shared high, 24-heirloom clock) first. Then rebuild `::win` around gear first, walk everything, and deposit once. Ship both in one PR.
* 5. Outcomes
  * 5.1. Given DREADMAW has moved, when the player OPENS the LOCKER and goes IN, then they arrive in the realm hub, and OUT returns them to the MINING GALLERY.
  * 5.2. Given the player carries the three fridge cheeses, when they FEED them to DEMOGORGONZOLA in any order, then its face opens like a flower and it yields the DEMOGORGONZOLA RIND.
  * 5.3. Given the player tells the planetarium projector 4, when the star flares, then they stand at the FRONT GATE on fire, one step west of the BRAZIER.
  * 5.4. Given the player has put out the UPSIDE-DOWN CAMPFIRE, when they seat the YELLOW, MAGENTA, and CYAN GEMS top to bottom in the LOWER PANEL and board the lift as it reaches BELOW, then it carries them up to the GREAT OAK or the TREE FORT, and they may ride back down at will.
  * 5.5. Given the player holds the SNUFFBOX, when they SNIFF it, then they gain six turns of the same high the mushrooms give, shown by the existing 🍄 indicator.
  * 5.6. Given 24 heirlooms are carried, when the player types PUT ALL IN RQ, then all 24 seat at once and the ONE TRIP bonus is awarded.
  * 5.7. Given a fresh game, when the designer runs `::win`, then it ends alive in the ROYAL HALL holding the DOOMSDAY CLOCK with the derived maximum score.
* 6. Primary measurement
  * 6.1. `::win` room transitions per required heirloom. The baseline is 77/13 = 5.9, from the existing trace step. Target: below 5.9 with 24 heirlooms. The trace scenario measures it locally; no player data is collected.

## TRD

* 1. Terminology and Scope
  * 1.1. Realm: the new otherworld, THE UPSIDE DOWN (D20); code paths use `upsidedown`. Heirloom: a `treasure: true` item the reliquary requires. Manor quintet: the five new manor heirlooms. Shared high: the one trip state (flag `high`) that mushrooms and snuff both start. FRONT GATE: the start room `gate`. Lift stops: BELOW (the LOWER PANEL room beneath the GREAT OAK; Lane 1 names it), GROUND (GREAT OAK), and ABOVE (TREE FORT).
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
  * 3.5. P5:MinimalCrossings: realm puzzles MUST be solvable with nothing from the manor except the three fridge cheeses; optional alternative solutions (MILK, WINE, or the MILK JUG on the campfire) may use manor items.
  * 3.6. P6:ExecutableProof: every puzzle, ejection, death, award, migration, and route claim MUST be proved by executable Gherkin in the same commit as its code.
  * 3.7. P7:HiddenSightIsSearch (ratified by AndrewC 2026-11-08): hidden sight from any source (the high, XRAY GOGGLES, OBSIDIAN EYE) MUST automatically reveal everything a SEARCH would find; the game NEVER shows a revealed direction or detail that is then refused.
  * 3.8. Cross-cutting:
    * 3.8.1. Analytics: none exists and none is added.
    * 3.8.2. Observability: bug reports (`issue-report.js`) MUST include the realm room, lift stop, and puzzle flags.
    * 3.8.3. Auth: not applicable.
    * 3.8.4. Security: no new network calls. Firefly credentials stay in environment variables only.
    * 3.8.5. Accessibility: everything is completable by typed commands and screen readers, with no color-only clues.
    * 3.8.6. Internationalisation: English only, with new prose kept in content exports.
    * 3.8.7. Copyright: real song titles are allowed; every radio clue and all other prose is original text.
* 4. Architecture
  * 4.1. Entry: `mineGallery` gains a fixed MINERS' LOCKER. OPEN LOCKER then IN moves the player to the realm hub, and OUT from the hub returns to the gallery.
  * 4.2. Exit: the realm links on foot to the BELOW stop, where the LOWER PANEL stands. Aligning it adds BELOW to the oak lift, so travel between the realm and the oak goes both ways (D35).
  * 4.3. Modules:
    * 4.3.1. `web/js/upsidedown/index.js` aggregates `realm.js` (hub, locker), `campfire.js` (UPSIDE-DOWN CAMPFIRE, STREAM), `demogorgonzola.js`, `radio.js` with its data file `radio-clues.js`, `planetarium.js`, `shack.js`, and `lowerpanel.js`.
    * 4.3.2. `web/js/manor/index.js` aggregates `fridge.js`, `diamond.js`, `photograph.js`, `corkscrew.js`, `snuffbox.js`, and `weathercock.js`.
    * 4.3.3. Each module exports `{ rooms, items, content, shortNames, progressAwards, hints, roomHooks, flavorPools }`. `world.js` merges them once, chains any room hooks onto existing handlers, adds `flavorPools` to `CYCLING_FLAVOR_POOLS`, and lets module handlers call `cycleFlavor` through `ctx`.
  * 4.4. Verbs: Lane 2 adds the generic verbs Lane 1 lists (expected COMBINE, SPELL, KICK, FIGHT, TURN, SET, START, POUR, FILL, STOMP, SMOTHER) to `parser.js` with default refusals in `commands.js`. FEED already maps to GIVE, SNIFF to SMELL, ANSWER to SAY, and PICK to TAKE. HELP calls Gary's paid hint line, and INFO (also `?`, COMMANDS) prints the free command reference (done, Completed tasks). DIAL follows D33: with a dialable object in view and a setting target, it operates that dial; otherwise it calls Gary.
  * 4.5. Shared high: `world.js` owns `beginHigh(ctx, { opening, turns })`. Items declare `highSource: { opening, turns, doses, whenEmpty }` and the module merge attaches the shared handler, so content modules never import `world.js`.
  * 4.6. Flow: commands reach item and room `on` handlers exactly as manor content does. Awards use the existing `awardProgress`, `awardPickup`, and `awardUse`. Ejections move the player to `gate` and keep inventory.
  * 4.7. Canonical data: the heirloom set derives from `treasure: true`. `REQUIRED_FAMILY_ITEM_COUNT` becomes 24, and `maximumScore()` stays derived.
  * 4.8. External boundaries: the `versions.json` manifest, the `map.js` floor layout and `web/view2d` data, and the optional Firefly icon tool (the tray has a built-in emoji fallback).
* 5. Realm design (ratified by AndrewC 2026-11-08; Lane 1 records exact text and constants in `docs/plans/2026-11-07_info_UpsideDownAndDoomsdayClockCanon.md`)
  * 5.1. Tone: classic adventure-game puzzles (Myst, Maniac Mansion, Monkey Island, King's Quest era) dressed in hysterically junior-high-boy absurd humor that parodies Stranger Things and Narnia. The joke is paint on a real, fair puzzle and never replaces the mechanic.
  * 5.2. Rooms (working names; Lane 1 fixes names and exits): WAYLAMP CLEARING (hub, a lone lamppost in a wood), CHEESE GROTTO, AV CLUB DEN, PLANETARIUM, MAP ROOM (off the planetarium), SHACK, and the BELOW room holding the LOWER PANEL (open from the start).
  * 5.3. Flight: WINGED SHOES and the high's named-room flight work in the realm exactly as everywhere else (D10).
  * 5.4. DEMOGORGONZOLA (a cheese monster whose face opens like a flower):
    * 5.4.1. The KITCHEN gains a FRIDGE holding the existing MILK, an EMPTY MILK JUG (D37), and three stinky cheeses (D23): LIMBURGER, ÉPOISSES, and MUNSTER. Descriptions are funny stink only, never trivia. Seed lines for Lane 1:
      * 5.4.1.1. LIMBURGER: "smells like a gym sock that died in a hot car; your eyes water through the fridge door."
      * 5.4.1.2. ÉPOISSES: "oozes out of its box like it is trying to escape, and smells like a sweaty armpit's armpit."
      * 5.4.1.3. MUNSTER (the real Alsatian stuff): "so rank the fridge light flickers; smells like a locker room hug from the whole football team."
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
  * 5.8. UPSIDE-DOWN CAMPFIRE (D36): a campfire whose flames point down burns near the realm entrance. Putting it out reveals the CYAN GEM in the ashes. Accepted methods (several on purpose, Zork style): POUR WINE ON FIRE (an opened WINE BOTTLE), POUR MILK ON FIRE (consumes the MILK), STOMP or SMOTHER FIRE with your body, and POUR WATER ON FIRE or POUR JUG ON FIRE (D37).
    * 5.8.1. Water (D37): a STREAM runs beside the campfire. FILL JUG at the stream (also FILL JUG WITH WATER) fills the EMPTY MILK JUG from the FRIDGE; pouring it on the fire empties it and puts the fire out. The jug is reusable, and POUR OUT empties it anywhere. It is a portable non-heirloom with the normal first-time +5 pickup and +5 use.
* 6. LOWER PANEL and oak lift (ratified by AndrewC 2026-11-08, D30 and D35)
  * 6.1. INVERTED GEMS: the complementary colors of the oak panel's RGB set: CYAN (opposite of the RUBY), MAGENTA (opposite of the EMERALD), and YELLOW (opposite of the SAPPHIRE).
  * 6.2. The LOWER PANEL stands at the lift's BELOW stop beneath the GREAT OAK and uses exactly the oak panel mechanics (`putOakGem` style): per-slot placement, TAKE to remove, a wrong full arrangement spits the gems out, and bulk transfer is refused. No hint text anywhere; like the oak, it needs outside knowledge.
  * 6.3. Initial state: MAGENTA seated in the TOP slot, MIDDLE empty, YELLOW seated in the BOTTOM slot. Solution: the oak order (RUBY top, EMERALD middle, SAPPHIRE bottom) reversed and inverted: YELLOW top, MAGENTA middle, CYAN bottom. The player reorders MAGENTA and YELLOW and supplies the CYAN GEM from the campfire (Section 5.8).
  * 6.4. Seating all three correctly sets `oak:lowerPanelAligned` and immediately gives the lift its BELOW stop; no other realm progress is required. The lift then runs a four-beat cycle, one beat per turn: GROUND, ABOVE, GROUND, BELOW. Before alignment, the existing GROUND and ABOVE cycle is unchanged.
  * 6.5. At BELOW, LOOK UP or WAIT shows where the platform is. Boarding when it reaches BELOW carries the rider up; stepping OUT at GROUND exits to the GREAT OAK, and staying aboard reaches the TREE FORT.
  * 6.6. From the GREAT OAK, a rider descends to BELOW once aligned, so back-and-forth travel between the realm and the oak is intended. Before alignment, nothing below the oak is reachable by lift.
* 7. Manor quintet (ratified by AndrewC 2026-11-08; same tone as Section 5.1; Lane 1 records exact grammar and text)
  * 7.1. BLACKWOOD DIAMOND (Maniac Mansion nod):
    * 7.1.1. The PARLOR's cold fireplace holds a stack of COAL. TAKE COAL yields one lump; a second is refused until the first is used up.
    * 7.1.2. The KITCHEN gains a MICROWAVE whose dial is labeled only `1 · 100 · M · B · T`. No units or clue appear anywhere; like the oak's RGB gems, it needs the outside knowledge that diamonds take about a billion years.
    * 7.1.3. PUT COAL IN MICROWAVE, SET DIAL TO <setting>, START (Lane 1 finalizes the grammar). 1 or 100 leaves the same lump unchanged for a retry. M turns it to graphite and T to dust; both consume the lump, so the player fetches another. B yields the BLACKWOOD DIAMOND (heirloom).
    * 7.1.4. No pressure gag, no beard or centuries jokes, and no geology book clue.
  * 7.2. SILVER WEATHERCOCK:
    * 7.2.1. Access: fly up through the ATTIC skylight, or walk through the ATTIC north door (revealed by `vaultFound`) to the HIDDEN VAULT, UP to the BELFRY, and WEST to the ROOF.
    * 7.2.2. Four fixed GARGOYLES (never randomized) ring the roof: the BURPER (cheeks puffed, fist to chest), the FARTER (holding its nose), the SHITTER (both hands covering its butt), and the HORIZON-GAZER (staring into the distance).
    * 7.2.3. TURN WEATHERCOCK TO FACE <gargoyle or direction>. Facing the BURPER, FARTER, or SHITTER awards +2 the first time per gargoyle (max +6, one persisted flag each), and that gargoyle answers from its own 12-entry pose-themed pool in `CYCLING_FLAVOR_POOLS` (36 lines total).
    * 7.2.4. Facing the HORIZON-GAZER makes it say "For centuries I have longed to wander past that horizon, but the curse of this stone holds me fast. You, rooster, I can set free." It breaks the weathercock off its post; TAKE SILVER WEATHERCOCK (heirloom). No fight.
    * 7.2.5. A freed weathercock can no longer be turned, so the three +2 awards come before the HORIZON-GAZER; Lane 1 hint text and the Lane 13 route respect that order.
  * 7.3. SNUFFBOX:
    * 7.3.1. A MARBLE BUST of Great-Grandpa Blackwood with a heroic nose stands on the upstairs LANDING. EXAMINE BUST reveals a silver glint up the left nostril.
    * 7.3.2. PICK NOSE (also PICK BUST'S NOSE) yields the SNUFFBOX (heirloom).
    * 7.3.3. Use (D18, unchanged): SNIFF or USE SNUFFBOX takes one pinch, adding 6 turns of the shared high (Section 10). Pinches stack like mushrooms. After 3 pinches the box is EMPTY but remains an heirloom. The first sniff earns the normal +5 use, and the HUD stays 🍄.
  * 7.4. BARONESS PHOTOGRAPH (replaces the ESTATE MAP everywhere; unrelated to the TROLL, whose riddle is unchanged):
    * 7.4.1. Four torn PHOTO PIECES COMBINE into a photograph of THE BARONESS standing beside a GRANDFATHER CLOCK whose hands read 1:30 (heirloom).
    * 7.4.2. Piece A: the porch MAILBOX. The existing warning LETTER is written on its back; READ keeps the existing text and the +5 `letterRead` award, and after COMBINE the letter stays readable on the back of the photograph. BURN LETTER is refused (D28, done).
    * 7.4.3. Piece B: on the ground in the HEDGE MAZE LOOP (`hedgeMazeLoop`).
    * 7.4.4. Piece C: on a nail on the PRIVY wall (not in the toilet).
    * 7.4.5. Piece D: tucked loosely inside a rotting LIBRARY book, found by SEARCH BOOKS or READ BOOK.
    * 7.4.6. Future hook (out of scope): a later puzzle uses the 1:30 time; nothing reads it now.
  * 7.5. CORKSCREW: simply placed in the WINE CELLAR beside the existing CRYSTAL DECANTER (heirloom). No puzzle; its use is opening the WINE BOTTLE (normal one-time +5 use).
  * 7.6. WINE BOTTLE (non-heirloom consumable, ratified by AndrewC 2026-11-08):
    * 7.6.1. The WINE CELLAR always offers one dusty WINE BOTTLE with a broken cork. TAKE BOTTLE yields one, and a fresh bottle appears whenever none remains in the cellar (bottomless, one at a time).
    * 7.6.2. OPEN BOTTLE WITH CORKSCREW is the only way to open it.
    * 7.6.3. DRINK WINE takes one sip, adding 10 turns of the shared high (Section 10; same powers, stacks). After 4 sips the empty bottle is destroyed and the player fetches another.
    * 7.6.4. Pickup and use award only the first time; refills never farm points, mirroring mushroom regrowth.
    * 7.6.5. Tradeoff: depositing the CORKSCREW heirloom ends access to new bottles.
* 8. Scoring (ratified by AndrewC 2026-11-08, D26: "just use reasonable point values"; this section is the single source for every new value; Lane 10 derives and documents the new maximum)
  * 8.1. Existing mechanics stay: +5 pickup and +5 use per portable item, each granted once through `awardProgress` flags. `maximumScore()` stays derived.
  * 8.2. Progress awards: realm discovery +20; each realm puzzle +10 (four); campfire put out +5 (once, any method); LOWER PANEL aligned +10; each manor puzzle +5 (four: DIAMOND made, PHOTOGRAPH combined, WEATHERCOCK freed, SNUFFBOX found; the CORKSCREW has no puzzle). The WINE BOTTLE, MILK JUG, and CYAN, MAGENTA, and YELLOW GEMS earn only the standard first-time pickup and use.
  * 8.3. Gargoyle awards: +2 the first time the weathercock faces each of the BURPER, FARTER, and SHITTER (max +6).
  * 8.4. Deposit values:
    * 8.4.1. Realm (80 total): DEMOGORGONZOLA RIND 15, PORTABLE TRANSISTOR RADIO 15, GOLD EYEPIECE 15, PURPLE CRAYON 15, STELLAR MAP 10, KID'S DRAWING 10.
    * 8.4.2. Manor (55 total): BLACKWOOD DIAMOND 15, BARONESS PHOTOGRAPH 15, SILVER WEATHERCOCK 10, SNUFFBOX 10, CORKSCREW 5.
  * 8.5. Phase B: the ONE TRIP bulk-deposit bonus is +25 once (Lane 11), alongside the BACKPACK capacity raise and the verified evidence below.
* 9. Doomsday clock
  * 9.1. The COUNTDOWN CLOCK becomes the 24-hour DOOMSDAY CLOCK; COUNTDOWN CLOCK names stay as aliases.
  * 9.2. The reliquary shows 24 recesses ringed like a clock face.
  * 9.3. Part II starts at XXIV. The implemented Medusa/emerald scene is relabeled Hour XXIV and ticks the clock to XXIII. Hours XXIII to I remain out of scope.
* 10. Shared high (ratified by AndrewC 2026-11-08)
  * 10.1. Mushrooms, snuff, and wine start one generic high: third eye vision, dark sight, and named-room flight. The HUD keeps the existing 🍄 trip indicator for all three.
  * 10.2. The fixed paragraph in `eatMushrooms` ("The house isn't haunted, man ... deeply unqualified to be here") becomes a 12-entry pool cycled by `cycleFlavor` through `CYCLING_FLAVOR_POOLS`, so saved counters prevent early repeats.
  * 10.3. Source API (Lane 9): mushrooms 12 turns per eating (consumed); snuff 6 turns per pinch, 3 pinches, kept when EMPTY; wine 10 turns per sip, 4 sips, destroyed when empty. Each source supplies its own opening line, then the shared 12-entry reaction pool.
  * 10.4. All shared text is generic ("you're high", "the trip"). Only the opening line differs by source: fresh toilet mushrooms, dried mushrooms, a snuff sneeze, or a wine sip. The two `MUSHROOM_REVELATIONS` lines that say "mushrooms" get generic wording.
* 11. ModelPicker (Copilot runtime; baseline recorded before spawn)
  * 11.1. Lane 1 Canon: mod:c70+s60='copilot:gpt-6-sol:1M:max'
  * 11.2. Lane 2 RealmHub: mod:c50+s80='copilot:gpt-5.6-terra:1M:xhigh'
  * 11.3. Lane 3 Demogorgonzola: mod:c45+s85='copilot:gpt-5.6-terra:1M:xhigh'
  * 11.4. Lane 4 RadioQuiz: mod:c55+s80='copilot:gpt-5.6-terra:1M:xhigh'
  * 11.5. Lane 5 Planetarium: mod:c50+s85='copilot:gpt-5.6-terra:1M:xhigh'
  * 11.6. Lane 6 Shack: mod:c40+s85='copilot:gpt-5.6-terra:1M:xhigh'
  * 11.7. Lane 7 LowerPanelLift: mod:c65+s80='copilot:gpt-5.6-terra:1M:xhigh'
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
    * 12.1.1. [Lane 1 Canon](2026-11-07_plan_done_DoomsdayClock_Lane1-Canon.md) runs first.
    * 12.1.2. [Lane 2 RealmHub](2026-11-07_plan_done_DoomsdayClock_Lane2-RealmHub.md) runs next.
    * 12.1.3. Then these run in parallel: [Lane 3 Demogorgonzola](2026-11-07_plan_done_DoomsdayClock_Lane3-Demogorgonzola.md), [Lane 4 RadioQuiz](2026-11-07_plan_done_DoomsdayClock_Lane4-RadioQuiz.md), [Lane 5 Planetarium](2026-11-07_plan_done_DoomsdayClock_Lane5-Planetarium.md), [Lane 6 Shack](2026-11-07_plan_done_DoomsdayClock_Lane6-Shack.md), and [Lane 9 SharedHigh](2026-11-07_plan_done_DoomsdayClock_Lane9-SharedHigh.md).
    * 12.1.4. [Lane 7 LowerPanelLift](2026-11-07_plan_done_DoomsdayClock_Lane7-LowerPanelLift.md) runs after Lanes 3 and 8 (the campfire accepts the fridge MILK and JUG and the WINE BOTTLE).
    * 12.1.5. [Lane 8 ManorQuintet](2026-11-07_plan_done_DoomsdayClock_Lane8-ManorQuintet.md) runs after Lane 9 (the snuffbox needs the high hook); each heirloom worker spawns only once Lane 1 records that heirloom's exact grammar and text.
    * 12.1.6. [Lane 10 DoomsdayCount](2026-11-07_plan_done_DoomsdayClock_Lane10-DoomsdayCount.md) runs last, after Lanes 7 and 8.
  * 12.2. WAIT: before spawning any Phase B lane, confirm every Phase A lane is done and that `cd web && npm test -- --tags "not @win"` exits 0 on the integration branch. AndrewC directive: "dont do anything with ::win yet until we build the new section."
  * 12.3. Phase B:
    * 12.3.1. [Lane 11 ScoringIncentives](2026-11-07_plan_done_DoomsdayClock_Lane11-ScoringIncentives.md) and [Lane 12 RoutePlanner](2026-11-07_plan_done_DoomsdayClock_Lane12-RoutePlanner.md) run in parallel.
    * 12.3.2. [Lane 13 WinRoute](2026-11-07_plan_done_DoomsdayClock_Lane13-WinRoute.md) runs after both.
    * 12.3.3. The single pre-PR triad follows.
    * 12.3.4. [Lane 14 ContentRelease](2026-11-07_plan_done_DoomsdayClock_Lane14-ContentRelease.md) runs last.
  * 12.4. Seam contract (fixed before any spawn):
    * 12.4.1. Lane 2 creates and registers every module stub in Section 4.3. Each later lane edits only its own modules, feature file, and lane-listed shared lines.
    * 12.4.2. Flag names: `realm:demoFed`, `realm:radioWon`, `realm:eyepieceDropped`, `realm:shackSpelled`, `realm:campfireOut`, `oak:lowerPanelAligned`, `oak:lowerPanelSlots`; radio seed `realm:radioSeed`; snuff pinches `manor:snuffPinches`; wine sips `manor:wineSips`; gargoyle award keys and flavor pools `gargoyleBurper`, `gargoyleFarter`, `gargoyleShitter`.
    * 12.4.3. Lift-stop values: `below`, `greatOak`, `treeFort`.
    * 12.4.4. New heirlooms ship as `pendingHeirloom: true` (not `treasure`) until Lane 10 flips all eleven at once, so the game stays winnable at 13 during Phase A.
    * 12.4.5. Phase A lanes validate with `cd web && npm test -- --tags "not @win and not @maxscore"`; Lane 10 drops `@maxscore`; Lane 13 runs the full suite.
  * 12.5. Release policy (D34): push all code only when the whole effort is done; plan docs may be pushed now. The two completed local main commits (Completed tasks) stay unpushed and ship with the release.
* 13. Decisions (newest first; AUTODECISIONS unless marked ratified; AndrewC may override any)
  * 13.1. D37: Water for the campfire (ratified by AndrewC 2026-11-08).
    * 13.1.1. Framing: POUR WATER ON FIRE was ratified as a method, but no carryable water existed.
    * 13.1.2. Options: add a water source, or drop the water method.
    * 13.1.3. **Chosen:** Section 5.8.1: a STREAM beside the campfire and a reusable EMPTY MILK JUG in the FRIDGE; FILL JUG, then POUR WATER ON FIRE or POUR JUG ON FIRE.
    * 13.1.4. Why: water on a fire is the most natural classic solution, and the jug stays useful as a refillable item.
  * 13.2. D36: CYAN GEM from the UPSIDE-DOWN CAMPFIRE (ratified by AndrewC 2026-11-08; replaces the MAGENTA source proposal).
    * 13.2.1. Framing: with MAGENTA and YELLOW pre-seated, only the CYAN GEM must be found.
    * 13.2.2. Options: one fixed method, or several classic methods.
    * 13.2.3. **Chosen:** Section 5.8: putting out the downward-burning campfire near the realm entrance reveals the CYAN GEM; WINE, MILK, a JUG of stream water (D37), STOMP, or SMOTHER all work.
    * 13.2.4. Why: multiple fair solutions are classic Zork style.
  * 13.3. D35: LOWER PANEL return path (ratified by AndrewC 2026-11-08).
    * 13.3.1. Framing: the return path used separate terms, flags, and a solve-everything gate.
    * 13.3.2. Options: a completion-gated gate, or a second oak-style panel.
    * 13.3.3. **Chosen:** Section 6: the LOWER PANEL beneath the GREAT OAK with oak panel mechanics, MAGENTA top and YELLOW bottom pre-seated, MIDDLE empty; alignment sets `oak:lowerPanelAligned` and adds BELOW to the lift at once; travel both ways is intended.
    * 13.3.4. Why: it reuses a proven mechanic and needs no new gating.
  * 13.4. D34: Release policy (ratified by AndrewC 2026-11-08).
    * 13.4.1. Framing: completed code commits exist on local main before the whole effort is done.
    * 13.4.2. Options: push code as it completes, or push all code once at the end.
    * 13.4.3. **Chosen:** push all code only when the whole effort is done; plan docs may be pushed now.
    * 13.4.4. Why: main never receives a partial 24-heirloom game (D5).
  * 13.5. D33: DIAL disambiguation (ratified by AndrewC 2026-11-08; Lane 8 implements it with the microwave).
    * 13.5.1. Framing: DIAL is a hotline verb, and the MICROWAVE (and the SAFE) have dials.
    * 13.5.2. Options: forbid DIAL for dials, or disambiguate by context.
    * 13.5.3. **Chosen:** DIAL GARY, DIAL PHONE, DIAL HOTLINE, and bare DIAL with no dial in view call Gary; TURN DIAL TO B, SET DIAL TO B, SPIN DIAL, and DIAL B with a dial in view operate the room's dial. Generic rule: a visible dialable object plus a setting target (not Gary or the phone) operates the dial.
    * 13.5.4. Why: players naturally type DIAL B at a dial, and the rule stays generic (P1).
  * 13.6. D32: HELP and INFO (ratified by AndrewC 2026-11-08; implemented on local main).
    * 13.6.1. Framing: HELP printed the command reference, while Gary's paid hint line needed CALL or HOTLINE.
    * 13.6.2. Options: keep HELP as the reference, or route HELP to Gary.
    * 13.6.3. **Chosen:** HELP calls Gary's paid hint line; INFO (also `?`, COMMANDS) prints the free command reference.
    * 13.6.4. Why: a player typing HELP wants help, and the reference stays one key away.
  * 13.7. D30: INVERTED CMY GEMS (ratified by AndrewC 2026-11-08).
    * 13.7.1. Framing: the LOWER PANEL needs three gems that mirror the oak's RGB set.
    * 13.7.2. Options: reuse the RGB colors, or use their complementary colors.
    * 13.7.3. **Chosen:** Section 6: CYAN, MAGENTA, and YELLOW, solved YELLOW top, MAGENTA middle, CYAN bottom, with no in-game hint.
    * 13.7.4. Why: the complement of RGB is a fair outside-knowledge puzzle in the oak's own style.
  * 13.8. D29: WINE BOTTLE (ratified by AndrewC 2026-11-08).
    * 13.8.1. Framing: the CORKSCREW needs a use, and the high gains a third source.
    * 13.8.2. Options: a decorative corkscrew, or a bottomless cellar bottle that only the CORKSCREW opens.
    * 13.8.3. **Chosen:** Section 7.6; 10 high turns per sip, 4 sips per bottle, first-time awards only.
    * 13.8.4. Why: it reuses the shared high and makes depositing the CORKSCREW a real tradeoff.
  * 13.9. D28: BURN LETTER versus PHOTO PIECE A (ratified by AndrewC 2026-11-08; implemented on local main).
    * 13.9.1. Framing: the BURN LETTER gag destroyed the `letter` item, which is now PHOTO PIECE A, so burning it would make the 24 unreachable.
    * 13.9.2. Options: keep the burn and respawn the piece, or remove the gag.
    * 13.9.3. **Chosen:** remove the gag; the generic burn refuses ("You can't quite bring yourself to set fire to the letter."). Lane 10 migration still restores PHOTO PIECE A to the MAILBOX for legacy saves where `letterBurned` is true and the letter was destroyed, with no award change (P4).
    * 13.9.4. Why: a required heirloom piece must never be destroyable.
  * 13.10. D27: P7:HiddenSightIsSearch (ratified by AndrewC 2026-11-08; replaces the OPEN SEARCH ATTIC proposal).
    * 13.10.1. Framing: hidden sight lists `revealedBy` exits that movement then refuses (Verified evidence).
    * 13.10.2. Options: reveal only on SEARCH with hidden sight, or make hidden sight automatically reveal whatever SEARCH would find.
    * 13.10.3. **Chosen:** the automatic reveal, as principle P7; Lane 9 implements and audits it.
    * 13.10.4. Why: the game never shows a passage or detail it then refuses.
  * 13.11. D26: Deposit and progress award values (ratified by AndrewC 2026-11-08).
    * 13.11.1. Framing: eleven new heirlooms, the new puzzles, the campfire, the panel, and three gargoyle replies need point values.
    * 13.11.2. Options: flat values for all, or weighted by puzzle effort.
    * 13.11.3. **Chosen:** the weighted values in Section 8, ratified as "just use reasonable point values"; Section 8 is the single source.
    * 13.11.4. Why: harder puzzles pay more, the CORKSCREW has no puzzle, and totals stay derived.
  * 13.12. D25: Manor heirloom designs (ratified by AndrewC 2026-11-08).
    * 13.12.1. Framing: the five pitched manor heirlooms needed fair final designs.
    * 13.12.2. Options: build the original pitches, or the refined designs.
    * 13.12.3. **Chosen:** Section 7: the microwave dial, four fixed roof gargoyles, the bust's nostril, the BARONESS PHOTOGRAPH (replacing the ESTATE MAP everywhere), and the CORKSCREW placed beside the decanter.
    * 13.12.4. Why: each is a fair classic puzzle with absurd paint; the photograph reuses the existing letter and plants the 1:30 clock hook.
  * 13.13. D24: Coal source for the BLACKWOOD DIAMOND (ratified by AndrewC 2026-11-08).
    * 13.13.1. Framing: the microwave needs COAL from somewhere fair.
    * 13.13.2. Options: an existing fireplace or grate, the mine, or a new coal scuttle.
    * 13.13.3. **Chosen:** a stack of COAL in the PARLOR's cold fireplace, carried one lump at a time.
    * 13.13.4. Why: the PARLOR text already shows the cold fireplace, and one lump at a time makes each wrong setting cost a trip.
  * 13.14. D23: Cheese choice (ratified by AndrewC 2026-11-08).
    * 13.14.1. Framing: three real, famously stinky cheeses go in the FRIDGE.
    * 13.14.2. Options: several famous stinkers were considered.
    * 13.14.3. **Chosen:** LIMBURGER, ÉPOISSES, and MUNSTER, described with funny stink lines only (Section 5.4.1).
    * 13.14.4. Why: the names are funny on their own, and stink jokes fit the tone better than trivia.
  * 13.15. D20: Realm name (ratified by AndrewC 2026-11-08).
    * 13.15.1. Framing: the realm needs a final display name.
    * 13.15.2. Options: keep the working name Lanternwild, THE UPSIDE BROWN, or THE UPSIDE DOWN.
    * 13.15.3. **Chosen:** THE UPSIDE DOWN; code paths use `upsidedown`, and the canon doc is `docs/plans/2026-11-07_info_UpsideDownAndDoomsdayClockCanon.md`.
    * 13.15.4. Why: it names the Stranger Things half of the parody outright, and nothing was built under the working name, so the path rename costs no churn.
  * 13.16. D19: v1 realm content withdrawn (ratified by AndrewC 2026-11-08).
    * 13.16.1. Framing: the v1 realm challenges, characters, items, and premise no longer fit.
    * 13.16.2. Options: keep parts, or replace them entirely.
    * 13.16.3. **Chosen:** replace them entirely with Sections 5 and 6.
    * 13.16.4. Why: the new realm is a comedy parody built on fair classic puzzles.
  * 13.17. D18: Snuffbox use (ratified by AndrewC 2026-11-08).
    * 13.17.1. Framing: the SNUFFBOX needs a use beyond deposit.
    * 13.17.2. Options: decorative only, or a limited high.
    * 13.17.3. **Chosen:** three stacking pinches of 6 high turns each; the empty box remains an heirloom; the first sniff earns +5 use.
    * 13.17.4. Why: it reuses the shared high and gives the snuffbox a real use.
  * 13.18. D17: Shared high (ratified by AndrewC 2026-11-08).
    * 13.18.1. Framing: mushrooms and snuff would otherwise duplicate the trip logic and text.
    * 13.18.2. Options: separate effects, or one generic high.
    * 13.18.3. **Chosen:** one generic high, the 🍄 indicator for both, a 12-entry cycling pool, and source-specific opening lines only.
    * 13.18.4. Why: one behavior, varied text, no early repeats.
  * 13.19. D16: P5:MinimalCrossings replaces P5:SelfContainedRealm (ratified by AndrewC 2026-11-08).
    * 13.19.1. Framing: the DEMOGORGONZOLA cheeses come from the manor FRIDGE.
    * 13.19.2. Options: a fully self-contained realm, or minimal crossings.
    * 13.19.3. **Chosen:** only the three fridge cheeses are required; MILK, WINE, and the MILK JUG are optional campfire alternatives (D36, D37).
    * 13.19.4. Why: one fair, telegraphed crossing ties the realm to the manor without sprawl.
  * 13.20. D15: Return path gating (ratified by AndrewC 2026-11-08; revised by D35).
    * 13.20.1. Framing: the return path could wait for full realm completion.
    * 13.20.2. Options: gate it on completion, or on the LOWER PANEL alone.
    * 13.20.3. **Chosen:** the LOWER PANEL alone; no realm puzzle must be solved first.
    * 13.20.4. Why: back-and-forth travel between the realm and the oak is intended.
  * 13.21. D14: SHACK alphabet wall (ratified by AndrewC 2026-11-08).
    * 13.21.1. Framing: parody the alphabet wall without a color mechanic or holiday theme.
    * 13.21.2. Options: one secret word, or several accepted words.
    * 13.21.3. **Chosen:** FART, STINK, or CHEESE all work; the KID'S DRAWING on the door is the clue and an heirloom.
    * 13.21.4. Why: the drawing's arrows make the answer fair and funny.
  * 13.22. D13: PLANETARIUM (ratified by AndrewC 2026-11-08).
    * 13.22.1. Framing: a Myst Stoneship nod with a fixed number puzzle.
    * 13.22.2. Options: a shuffled per-game mapping, or a fixed alphabetical mapping.
    * 13.22.3. **Chosen:** fixed alphabetical numbering explained by the STELLAR MAP; 1, 3, 5 are safe, 2 ejects, 4 ignites.
    * 13.22.4. Why: the map is the clue, and the burning exit chains into the brazier.
  * 13.23. D12: RADIO QUIZ (ratified by AndrewC 2026-11-08).
    * 13.23.1. Framing: an 80s name-that-tune that respects copyright.
    * 13.23.2. Options: quoted lyrics, or original literal paraphrases.
    * 13.23.3. **Chosen:** about 20 songs by 5 original clues, five numbered titles per round, three in a row wins, a miss resets, seedable random draw.
    * 13.23.4. Why: titles are not protected expression, the literal paraphrase is the joke, and seeding keeps tests deterministic.
  * 13.24. D11: DEMOGORGONZOLA (ratified by AndrewC 2026-11-08).
    * 13.24.1. Framing: a monster puzzle with a feeding solution.
    * 13.24.2. Options: an ordered feeding rule, or any order.
    * 13.24.3. **Chosen:** all three cheeses in any order; any other interaction swallows you to the FRONT GATE; no petal key.
    * 13.24.4. Why: the puzzle is finding the cheeses, not guessing an order.
  * 13.25. D10: Flight in the realm (ratified by AndrewC 2026-11-08; revised).
    * 13.25.1. Framing: WINGED SHOES and the high's named flight could reach realm rooms.
    * 13.25.2. Options: special-case the realm, or treat flight the same everywhere.
    * 13.25.3. **Chosen:** flight behaves the same everywhere, including THE UPSIDE DOWN, with no realm special case.
    * 13.25.4. Why: one consistent rule, and travel both ways is now intended anyway.
  * 13.26. D9: Realm theme and tone (ratified by AndrewC 2026-11-08).
    * 13.26.1. Framing: the realm needs a comic identity.
    * 13.26.2. Options: the v1 inverted fairy tale, or a Stranger Things and Narnia parody.
    * 13.26.3. **Chosen:** the parody, with classic fair puzzles and light upside-down touches; no holiday theme; no reuse of existing gags as mechanics.
    * 13.26.4. Why: the humor sells the puzzles without replacing them.
  * 13.27. D8: Split of the 24 (ratified by AndrewC 2026-11-08).
    * 13.27.1. Framing: 11 new heirlooms reach 24.
    * 13.27.2. Options: 13+7 realm+4 manor, or 13+6 realm+5 manor.
    * 13.27.3. **Chosen:** 13 existing, 5 manor, 6 realm.
    * 13.27.4. Why: four realm puzzles yield six heirlooms, and five manor puzzles are pitched.
  * 13.28. D7: Lift cycle before the LOWER PANEL aligns.
    * 13.28.1. Framing: the four-beat lift must not disturb existing play.
    * 13.28.2. Options: always four beats, or the existing two beats until the LOWER PANEL aligns.
    * 13.28.3. **Chosen:** two beats until the LOWER PANEL aligns.
    * 13.28.4. Why: this preserves the solved-oak experience and existing saves.
  * 13.29. D6: Part II hour labels.
    * 13.29.1. Framing: the clock now has 24 hours.
    * 13.29.2. Options: keep XIII, or relabel the implemented scene XXIV.
    * 13.29.3. **Chosen:** XXIV.
    * 13.29.4. Why: the clock now starts at 24.
  * 13.30. D5: `::win` coupling.
    * 13.30.1. Framing: requiring 24 heirlooms makes today's `::win` unwinnable.
    * 13.30.2. Options: two PRs with `::win` temporarily broken on main, stacked PRs, or one PR with a phase gate.
    * 13.30.3. **Chosen:** one PR with a phase gate.
    * 13.30.4. Why: main never receives content without the matching route. Phase A validates with `@win` scenarios excluded; the final gate runs the full suite.
  * 13.31. D4: Icons.
    * 13.31.1. Framing: eleven new heirlooms need tray art.
    * 13.31.2. Options: wait for Firefly PNGs, or use the tray's emoji fallback.
    * 13.31.3. **Chosen:** run the existing Firefly tool when credentials exist; otherwise ship the tray's built-in emoji.
    * 13.31.4. Why: no gameplay depends on art.
  * 13.32. D3: Prose location.
    * 13.32.1. Framing: parallel lanes write prose at once.
    * 13.32.2. Options: `world.content.js`, or a per-module `content` export.
    * 13.32.3. **Chosen:** per-module `content`.
    * 13.32.4. Why: parallel lanes then avoid collisions.
  * 13.33. D2: Realm exit.
    * 13.33.1. Framing: the realm needs a way back to the manor.
    * 13.33.2. Options: a GRAND BEDROOM wardrobe, or the oak lift's BELOW stop.
    * 13.33.3. **Chosen:** the oak lift's BELOW stop, opened by the LOWER PANEL (D35).
    * 13.33.4. Why: AndrewC's direction; the realm becomes a mine-to-oak traversal.
  * 13.34. D1: Portal.
    * 13.34.1. Framing: the realm needs an entrance.
    * 13.34.2. Options: a new side tunnel, or a MINERS' LOCKER in the MINING GALLERY.
    * 13.34.3. **Chosen:** the locker.
    * 13.34.4. Why: it sits after DREADMAW and before the TROLL, and the gallery already shows where mining gear hung.
* 14. Review gate (exactly one triad on the integrated batch, after Lane 13 and normal validation)
  * 14.1. ARCH brief: check P1 and P5.
    * 14.1.1. No realm or manor puzzle logic appears in `core.js`, `parser.js`, or `commands.js`; only generic verbs were added.
    * 14.1.2. Modules export the seam shape and never import `world.js`; the snuffbox and WINE BOTTLE reach the high only through `highSource`.
    * 14.1.3. Realm puzzles need nothing from the manor except the three fridge cheeses (MILK, WINE, and the MILK JUG are optional); the LOWER PANEL and lift cycle live in content; flight has no realm special case.
    * 14.1.4. The route planner lives under `web/tools/` and is never imported by the game.
  * 14.2. QUALITY brief:
    * 14.2.1. Every new feature file covers success, each ejection, the burning path to the brazier, each award exactly once, and replay without farming.
    * 14.2.2. Every one of the radio clues in `radio-clues.js` is an original literal paraphrase that contains no reproduced lyric phrase; titles only.
    * 14.2.3. The seeded radio draw is deterministic, and the shared high pool has 12 entries with no early repeat across save and restore and no "mushroom" in shared text.
    * 14.2.4. P7 holds: every `revealedBy` exit and search-only discovery is revealed by hidden sight, no refusal contradicts a revealed passage, and goggles-only and eye-only ATTIC access are proved.
    * 14.2.5. Migration covers saves that are 13-deposited, bell-rung, in Part II, and from before the FRIDGE existed.
    * 14.2.6. The trace asserts one named flight, one PUT ALL IN RQ, the derived maximum, and a transition ratio below 5.9.
    * 14.2.7. `npm test` exit 0 is recorded; no stale "thirteen" text remains; no holiday theme or reused existing gag appears; docs change in the same commits.
  * 14.3. PROCESS brief:
    * 14.3.1. Work happened only in assigned worktrees, with no per-lane PRs.
    * 14.3.2. Phase B began only after the recorded Phase A gate; its integrated `::win` route now covers the 24-heirloom release.
    * 14.3.3. Each manor heirloom worker spawned only after Lane 1 recorded its ratified design's exact grammar and text.
    * 14.3.4. The master status is current, and the CodeRabbit trigger follows the Coven route.

## Completed tasks

* [x] HELP calls Gary's paid hint line; INFO (also `?`, COMMANDS) prints the command reference (D32). Evidence: local main commit "feat(ui): HELP calls Gary's hint line; INFO and ? show the command reference"; `parser.js` hotline synonyms include help and an `info` verb replaces help; HELP_TEXT reordered; the `index.html` ? button sends `info`; banners read "Type INFO for commands."; Helpless badge text, README, DESIGN, and tests updated; 549/549 scenarios passed. Unpushed; ships with the release (D34).
* [x] BURN LETTER gag removed (D28). Evidence: local main commit "fix(world): remove the BURN LETTER gag so the mailbox letter cannot be destroyed"; `burnLetter` deleted; the generic burn refuses ("You can't quite bring yourself to set fire to the letter."); `fire-food.feature` updated; DESIGN line removed; 549/549 scenarios passed. Unpushed; ships with the release (D34).

## Closure

## AUTODECISIONS this wave

* D-L1: Lane 1 ratified the canon's exact puzzle grammar, prose, constants, lift timing, and Section 13 decisions.
* D-L2: Lane 2 kept realm rooms out of random teleports while retaining generic named flight.
* D-L3: Lane 3 made FRIDGE output reflect remaining contents and changed DEMOGORGONZOLA's displayed state after feeding.
* D-L4: Lane 4 used the canonical original radio-clue prose without reproduced lyrics.
* D-L5: Lane 5 recorded no additional implementation decision beyond the ratified Planetarium design.
* D-L6: Lane 6 restored space-separated F A R T after generic article removal without adding realm knowledge to the parser.
* D-L7: Lane 7 preserved module-owned dynamic prose and retained an active upper lift stop when the LOWER PANEL aligns.
* D-L8: Lane 8 preserved the nested letter, routed weathercock turns and dialables locally, assigned weathercock and snuffbox credits, and persisted shared wine identity and rewards.
* D-L9: Lane 9 ratified the shared wine high source and P7:HiddenSightIsSearch.
* D-L10: Lane 10 selected emoji tray fallbacks without Firefly credentials and preserved transformed-save award ledgers.
* D-L11: Lane 11 made ONE TRIP persisted, set BACKPACK capacity to 36, retained body-fire incentives, confirmed MATCH behavior, and derived 1316.
* D-L12: Lane 12 used the merged room graph, a 24-heirloom DAG, two selected flights, body-fire timing, persisted radio answers, and 68 walking transitions.
* D-L13: Lane 13 derived live radio answers, timed the pre-alignment lift, and preserved a carried DOOMSDAY CLOCK on restore.

## No new INTs

The triad's operator-noted surprises were ratified design changes, and its remaining defects are corrected and covered by executable tests rather than requiring new intervention work.

## Operator next actions

* No OPEN decisions remain; AndrewC may override any decision in Section 13.
* Push this plan docs branch when convenient; code pushes only once the whole effort is done (D34).

## Verified evidence

* The `::win` trace on `8ff6efb` took 165 steps and scored 825. It made 77 room transitions; the ROYAL HALL was visited 8 times, the LANDING 6, the GATE 5, and the DINING ROOM 5.
* The single MATCH already lights the CANDLE (step 39, +10: candle use plus match use).
* The brazier is lit by body fire (step 65, +40: brazier 30 plus survival 10). Body fire already outscores the candle (10) and the candelabra (10).
* The oak PANEL order is RUBY top, EMERALD middle, SAPPHIRE bottom; the RUBY and SAPPHIRE start in `oakMechanism`, and the EMERALD comes from the brazier (`OAK_GEMS` in `web/js/world.js`, checked 2026-11-08).
* The FRONT GATE (`gate`) exits east to the GARDEN, where the BRAZIER stands (checked in `web/js/world.js` on 2026-11-08).
* P7 verified: hidden sight from the high, XRAY GOGGLES, or OBSIDIAN EYE reveals and enables the ATTIC NORTH and NURSERY IN passages, while the LIBRARY refusal acknowledges the revealed stair and names its physical LEVER requirement.

<!-- end 2026-11-07_plan_done_DoomsdayClock.md -->
