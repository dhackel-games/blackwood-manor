<!-- 2026-11-07_plan_todo_DoomsdayClock_Lane8-ManorQuintet.md. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.003:acoven. -->

# Lane 8: ManorQuintet

Status: todo. Master: [2026-11-07_plan_todo_DoomsdayClock.md](2026-11-07_plan_todo_DoomsdayClock.md).

* mod:c55+s60='copilot:gpt-5.6-terra:1M:xhigh'
* Produces: `web/js/manor/{diamond,photograph,corkscrew,snuffbox,weathercock}.js` (`corkscrew.js` also holds the WINE BOTTLE) and `web/tests/features/manor-quintet.feature` (the lane orchestrator spawns one task worker per heirloom).
* Not produces: realm modules, `fridge.js`, the shared high handler, the `letter` save migration (Lane 10), `::win`.
* Depends on: Lane 2 and Lane 9; each heirloom also waits for Lane 1 to record its exact grammar and text (designs ratified by AndrewC 2026-11-08, master Section 7).
* Worktree: orchestrator-assigned absolute path, stated in the spawn brief; first preflight is `pwd` match.
* Operator actions surface: [2026-11-07_plan_todo_DoomsdayClock.md#operator-next-actions](2026-11-07_plan_todo_DoomsdayClock.md#operator-next-actions) (record/reference only; no numbered lists in chat).

## Tasks

* [ ] BLACKWOOD DIAMOND (ratified by AndrewC 2026-11-08): a COAL stack in the PARLOR's cold fireplace gives one lump at a time (a second is refused until the first is used up); the KITCHEN MICROWAVE dial reads only `1 · 100 · M · B · T`, with no units or clue anywhere; PUT COAL IN MICROWAVE, SET DIAL TO <setting>, START per Lane 1 grammar; 1 or 100 leaves the lump unchanged, M makes graphite and T makes dust (lump consumed), B yields `blackwoodDiamond` (`pendingHeirloom: true`); +5 once.
* [ ] SILVER WEATHERCOCK (ratified by AndrewC 2026-11-08): four fixed ROOF GARGOYLES (BURPER, FARTER, SHITTER, HORIZON-GAZER) per master Section 7.2; TURN WEATHERCOCK TO FACE <gargoyle or direction>; each of the first three awards +2 once (`gargoyleBurper`, `gargoyleFarter`, `gargoyleShitter`) and replies from its own 12-entry `flavorPools` pool (36 original lines); the HORIZON-GAZER speaks the master 7.2.4 line and breaks off `silverWeathercock` (`pendingHeirloom: true`); +5 once; no fight. Roof access stays as built: flight through the ATTIC skylight, or ATTIC north (`vaultFound`) to the HIDDEN VAULT, UP to the BELFRY, WEST to the ROOF.
* [ ] SNUFFBOX (ratified by AndrewC 2026-11-08): a MARBLE BUST of Great-Grandpa Blackwood on the LANDING; EXAMINE BUST shows a silver glint up the left nostril (hidden sight shows it too, through the Lane 9 P7 hook); PICK NOSE or PICK BUST'S NOSE yields `snuffbox` (`pendingHeirloom: true`); +5 once. PICK already parses as TAKE, so the NOSE is a fixed bust part whose take handler yields the box. Use via Lane 9 `highSource`: SNIFF or USE takes one pinch for 6 stacking high turns with a sneeze opening; 3 pinches (`manor:snuffPinches`), then EMPTY but still an heirloom; first sniff earns +5 use; HUD stays 🍄.
* [ ] BARONESS PHOTOGRAPH (ratified by AndrewC 2026-11-08): piece A is the existing `letter` in the porch MAILBOX (recommendation for Lane 1: keep the `letter` id, text, pickup, and `letterRead` award, adding PHOTO PIECE names); piece B lies on the ground in `hedgeMazeLoop`; piece C hangs on a nail on the PRIVY wall; piece D is tucked in a rotting LIBRARY book (SEARCH BOOKS or READ BOOK; hidden sight reveals it through the Lane 9 P7 hook); COMBINE yields `baronessPhotograph` (`pendingHeirloom: true`), THE BARONESS beside a GRANDFATHER CLOCK at 1:30; READ PHOTOGRAPH shows the letter text with no second award; BURN LETTER is already refused on local main (D28); +5 once. The 1:30 time is a future hook only.
* [ ] CORKSCREW (ratified by AndrewC 2026-11-08): `corkscrew` (`pendingHeirloom: true`) lies in `wineCellar` beside the CRYSTAL DECANTER; no puzzle and no puzzle award; its normal one-time +5 use is OPEN BOTTLE WITH CORKSCREW.
* [ ] WINE BOTTLE (non-heirloom, ratified by AndrewC 2026-11-08) per master Section 7.6: one dusty bottle with a broken cork always in `wineCellar`, a fresh one appearing whenever none remains there; OPEN BOTTLE WITH CORKSCREW is the only opener; DRINK WINE declares Lane 9 `highSource` (10 turns per sip, 4 sips in `manor:wineSips`, destroyed when empty, wine-sip opening); pickup and use award only the first time, never on refills.
* [ ] DIAL disambiguation (D33) with the microwave: DIAL GARY, DIAL PHONE, DIAL HOTLINE, and bare DIAL with no dial in view call Gary; TURN DIAL TO B, SET DIAL TO B, SPIN DIAL, and DIAL B with a dial (MICROWAVE or SAFE) in view operate it; implemented as a generic dialable-object rule with no puzzle knowledge in the engine, with scenarios for each form.
* [ ] Gary hints and room search text for all five (PARLOR coal, KITCHEN microwave, LANDING bust, ROOF gargoyles, photo pieces); `web/js/map.js` and `web/view2d/roomdata.json` item updates.
* [ ] Feature covers every microwave setting and the one-lump limit, each gargoyle award once with pool cycling, the HORIZON-GAZER release, PICK NOSE, the bust glint and book piece under hidden sight, COMBINE with missing and complete pieces, the letter readable after COMBINE with `letterRead` once, each award once, the three snuff pinches stacking then EMPTY, and the WINE BOTTLE (refused without the CORKSCREW, four stacking sips, empty bottle destroyed, refill with no second award).

## Acceptance

* `cd web && npm test -- --tags "not @win and not @maxscore"` exit 0.
* Tests and docs land in the same commits as the code they cover.

## Decisions

* Designs ratified by AndrewC 2026-11-08 (master D24, D25, D29); D28 and D33 ratified; D26 stays OPEN in the master.

<!-- end 2026-11-07_plan_todo_DoomsdayClock_Lane8-ManorQuintet.md -->
