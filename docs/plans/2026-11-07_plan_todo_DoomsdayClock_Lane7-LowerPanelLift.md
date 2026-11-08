<!-- 2026-11-07_plan_todo_DoomsdayClock_Lane7-LowerPanelLift.md. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.004:acoven. -->

# Lane 7: LowerPanelLift

Status: todo. Master: [2026-11-07_plan_todo_DoomsdayClock.md](2026-11-07_plan_todo_DoomsdayClock.md).

* mod:c65+s80='copilot:gpt-5.6-terra:1M:xhigh'
* Produces: `web/js/upsidedown/campfire.js`, `web/js/upsidedown/lowerpanel.js`, oak lift changes, `web/tests/features/upsidedown-campfire.feature`, `web/tests/features/upsidedown-lowerpanel.feature`, and `oak-tree-fort.feature` updates.
* Not produces: `::win`, `sysop-menu.js` path helpers, the MILK JUG item (Lane 3), the WINE BOTTLE item (Lane 8).
* Depends on: Lanes 3 and 8 (the campfire accepts the fridge MILK and JUG and the WINE BOTTLE).
* Worktree: orchestrator-assigned absolute path, stated in the spawn brief; first preflight is `pwd` match.
* Operator actions surface: [2026-11-07_plan_todo_DoomsdayClock.md#operator-next-actions](2026-11-07_plan_todo_DoomsdayClock.md#operator-next-actions) (record/reference only; no numbered lists in chat).

## Tasks

* [x] UPSIDE-DOWN CAMPFIRE near the realm entrance (master Section 5.8, D36): POUR WINE ON FIRE (an opened WINE BOTTLE), POUR MILK ON FIRE (consumes the MILK), POUR WATER ON FIRE or POUR JUG ON FIRE (a filled JUG, emptied), STOMP FIRE, or SMOTHER FIRE puts it out once, reveals the CYAN GEM in the ashes, sets `realm:campfireOut`, and awards +5 once.
* [x] STREAM beside the campfire (D37): FILL JUG and FILL JUG WITH WATER fill the EMPTY MILK JUG; the jug stays reusable.
* [x] LOWER PANEL at the BELOW stop (master Section 6, D30, D35) with oak panel mechanics (`putOakGem` style): starts with MAGENTA in TOP, MIDDLE empty, YELLOW in BOTTOM; per-slot placement and removal; solves only with YELLOW top, MAGENTA middle, CYAN bottom; a wrong full arrangement spits the gems out; bulk transfer refused; no hint text; slots persist in `oak:lowerPanelSlots`.
* [x] Correct alignment sets `oak:lowerPanelAligned`, awards +10 once, and immediately adds BELOW to the lift; no realm puzzle is required first.
* [x] Once aligned, the lift cycles one beat per turn: GROUND, ABOVE, GROUND, BELOW; before alignment, the existing GROUND and ABOVE cycle is unchanged (D7).
* [x] At BELOW, LOOK UP and WAIT report the platform stop; ENTER PLATFORM works only at BELOW; riding carries the player to GROUND then ABOVE; OUT at GROUND exits to the GREAT OAK.
* [x] From the GREAT OAK, a rider descends to BELOW once aligned, and round trips between the realm and the oak work repeatedly.
* [x] Existing `oak-tree-fort.feature` scenarios pass unchanged before alignment; new scenarios prove every campfire method, the jug fill and reuse, the panel initial state and reordering, and the Lane 1 four-beat table.
* [x] Gary hint entries for the campfire, stream, panel, and lift (no panel order hint).

## Acceptance

* `cd web && npm test -- --tags "not @win and not @maxscore"` exit 0. The canon lift timing table matches scenario output beat for beat.
* Tests and docs land in the same commits as the code they cover.

## Decisions

* LOWER PANEL, CYAN campfire, water, INVERTED CMY GEMS, and flight parity ratified by AndrewC 2026-11-08 (master D35, D36, D37, D30, D10).
* D-L7-01: Merge content prose by room and item id within the UPSIDE DOWN module seam, so puzzle-owned dynamic prose retains atlas-owned names and room details.
* D-L7-02: On lower-panel alignment, retain an active upper lift at its current GROUND or ABOVE stop; otherwise create the lift at BELOW, matching D-L1-04.

<!-- end 2026-11-07_plan_todo_DoomsdayClock_Lane7-LowerPanelLift.md -->
