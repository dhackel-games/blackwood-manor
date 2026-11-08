<!-- 2026-11-07_plan_todo_DoomsdayClock_Lane13-WinRoute.md. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-07.001:acoven. -->

# Lane 13: WinRoute

Status: todo. Master: [2026-11-07_plan_todo_DoomsdayClock.md](2026-11-07_plan_todo_DoomsdayClock.md).

* ModelPicker: mod:c60+s75='copilot:gpt-5.6-terra:1M:xhigh'
* Produces: `::win` rewrite in `web/js/sysop-menu.js` and `web/tests/features/sysop-menu.feature`.
* Not produces: new content, planner internals.
* Depends on: Lanes 11 and 12.
* Worktree: orchestrator-assigned absolute path, stated in the spawn brief; first preflight is `pwd` match.
* Operator actions surface: [2026-11-07_plan_todo_DoomsdayClock.md#operator-next-actions](2026-11-07_plan_todo_DoomsdayClock.md#operator-next-actions) (record/reference only; no numbered lists in chat).

## Tasks

* [ ] Opening: privy mushrooms, one named flight to the shaft; BACKPACK, HEADLAMP, troll riddle, vault (TAKE ALL: crest, shoes); REMOVE SHOES before the realm.
* [ ] Realm in one pass: all five challenges, casket, root panel, ride the lift up from BELOW.
* [ ] Walk the remaining grounds and manor in planner order with TAKE ALL per room, using items on arrival; ignite self early enough to arrive at the brazier ablaze.
* [ ] One PUT ALL IN RQ; CLOSE RQ; open closet; pull rope; take and read the DOOMSDAY CLOCK; stop in the ROYAL HALL.
* [ ] Update `pathToRoom` for the four-beat lift and keep the no-mushroom and after-bell recovery paths working.
* [ ] Trace scenario asserts: one named flight, one bulk deposit, zero single-item RQ deposits, alive in ROYAL HALL holding the clock, score equals derived maximum, transitions per heirloom below 5.9; remove the `@win` exclusion.
* [ ] Update `web/DESIGN.md` §8 route statistics and the sysop description.

## Acceptance

* `cd web && npm test` exit 0 (full suite).
* Tests and docs land in the same commits as the code they cover.

## Decisions

* None yet.

<!-- end 2026-11-07_plan_todo_DoomsdayClock_Lane13-WinRoute.md -->
