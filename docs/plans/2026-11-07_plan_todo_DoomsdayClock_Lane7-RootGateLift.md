<!-- 2026-11-07_plan_todo_DoomsdayClock_Lane7-RootGateLift.md. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.001:acoven. -->

# Lane 7: RootGateLift

Status: todo. Master: [2026-11-07_plan_todo_DoomsdayClock.md](2026-11-07_plan_todo_DoomsdayClock.md).

* mod:c65+s80='copilot:gpt-5.6-terra:1M:xhigh'
* Produces: `web/js/lanternwild/rootgate.js`, oak lift changes, `web/tests/features/lanternwild-rootgate.feature`, and `oak-tree-fort.feature` updates.
* Not produces: `::win`, `sysop-menu.js` path helpers.
* Depends on: Lanes 3 to 6.
* Worktree: orchestrator-assigned absolute path, stated in the spawn brief; first preflight is `pwd` match.
* Operator actions surface: [2026-11-07_plan_todo_DoomsdayClock.md#operator-next-actions](2026-11-07_plan_todo_DoomsdayClock.md#operator-next-actions) (record/reference only; no numbered lists in chat).

## Tasks

* [ ] When `realm:demoFed`, `realm:radioWon`, `realm:eyepieceDropped`, and `realm:shackSpelled` are all set, set `realm:allSolved` once and open the ROOT HOLLOW with the three INVERTED GEMS from the Lane 1 source (recommended: a root nest).
* [ ] ROOT PANEL accepts INVERTED SAPPHIRE top, INVERTED EMERALD middle, INVERTED RUBY bottom only; wrong placement is refused with a mirrored-order clue; bulk transfer refused.
* [ ] Seating all three sets `oak:rootGateOpen` and awards +10 once.
* [ ] After the gate opens, the lift cycles one beat per turn: GROUND, ABOVE, GROUND, BELOW, GROUND; before it opens, the existing GROUND and ABOVE cycle is unchanged (D7).
* [ ] From the ROOT HOLLOW, LOOK UP and WAIT report the platform stop; ENTER PLATFORM works only at BELOW; riding carries the player to GROUND then ABOVE; OUT at GROUND exits to the GREAT OAK.
* [ ] From the GREAT OAK, a rider descends to BELOW once the gate is open.
* [ ] Existing `oak-tree-fort.feature` scenarios pass unchanged before the gate opens; new scenarios prove the Lane 1 four-beat table.
* [ ] Gary hint entries for the hollow, panel, and lift.

## Acceptance

* `cd web && npm test -- --tags "not @win and not @maxscore"` exit 0. The canon lift timing table matches scenario output beat for beat.
* Tests and docs land in the same commits as the code they cover.

## Decisions

* None yet.

<!-- end 2026-11-07_plan_todo_DoomsdayClock_Lane7-RootGateLift.md -->
