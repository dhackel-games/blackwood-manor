<!-- 2026-11-07_plan_todo_DoomsdayClock_Lane8-RootGateLift.md. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-07.001:acoven. -->

# Lane 8: RootGateLift

Status: todo. Master: [2026-11-07_plan_todo_DoomsdayClock.md](2026-11-07_plan_todo_DoomsdayClock.md).

* ModelPicker: mod:c65+s80='copilot:gpt-5.6-terra:1M:xhigh'
* Produces: `web/js/lanternwild/rootgate.js`, oak lift changes, and `web/tests/features/lanternwild-rootgate.feature` plus `oak-tree-fort.feature` updates.
* Not produces: `::win`, `sysop-menu.js` path helpers.
* Depends on: Lanes 3 to 7.
* Worktree: orchestrator-assigned absolute path, stated in the spawn brief; first preflight is `pwd` match.
* Operator actions surface: [2026-11-07_plan_todo_DoomsdayClock.md#operator-next-actions](2026-11-07_plan_todo_DoomsdayClock.md#operator-next-actions) (record/reference only; no numbered lists in chat).

## Tasks

* [ ] When all five flags are set, TALK TO DUCHESS gives the CASKET of three INVERTED GEMS once and sets `lanternwild:allSolved`, unsealing the ROOT HOLLOW.
* [ ] ROOT PANEL accepts INVERTED SAPPHIRE top, INVERTED EMERALD middle, INVERTED RUBY bottom only; wrong placement is refused with a mirrored-order clue; bulk transfer refused.
* [ ] Seating all three sets `oak:rootGateOpen` and awards +10 once.
* [ ] After the gate opens, the lift cycles one beat per turn: GROUND, ABOVE, GROUND, BELOW, GROUND; before it opens, the existing GROUND and ABOVE cycle is unchanged (D12).
* [ ] From the ROOT HOLLOW, LOOK UP and WAIT report the platform stop; ENTER PLATFORM works only at BELOW; riding carries the player to GROUND then ABOVE; OUT at GROUND exits to the GREAT OAK.
* [ ] From the GREAT OAK, a rider descends to BELOW once the gate is open.
* [ ] Existing `oak-tree-fort.feature` scenarios still pass unchanged before the gate opens; new scenarios prove the four-beat table from Lane 1.
* [ ] Gary hints for casket, panel, and lift.

## Acceptance

* `cd web && npm test -- --tags "not @win and not @maxscore"` exit 0; lift timing table from the canon info doc matches scenario output beat for beat.
* Tests and docs land in the same commits as the code they cover.

## Decisions

* None yet.

<!-- end 2026-11-07_plan_todo_DoomsdayClock_Lane8-RootGateLift.md -->
