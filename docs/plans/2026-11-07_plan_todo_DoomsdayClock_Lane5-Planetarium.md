<!-- 2026-11-07_plan_todo_DoomsdayClock_Lane5-Planetarium.md. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.002:acoven. -->

# Lane 5: Planetarium

Status: todo. Master: [2026-11-07_plan_todo_DoomsdayClock.md](2026-11-07_plan_todo_DoomsdayClock.md).

* mod:c50+s85='copilot:gpt-5.6-terra:1M:xhigh'
* Produces: `web/js/upsidedown/planetarium.js` and `web/tests/features/upsidedown-planetarium.feature`.
* Not produces: other modules, burn-timer or brazier changes, `::win`.
* Depends on: Lane 2.
* Worktree: orchestrator-assigned absolute path, stated in the spawn brief; first preflight is `pwd` match.
* Operator actions surface: [2026-11-07_plan_todo_DoomsdayClock.md#operator-next-actions](2026-11-07_plan_todo_DoomsdayClock.md#operator-next-actions) (record/reference only; no numbered lists in chat).

## Tasks

* [ ] PLANETARIUM: a plain domed room with a brass PROJECTOR that always asks for a number 1 to 5 and never changes behavior; accepts the Lane 1 grammar (for example SAY 3, SET PROJECTOR TO 3).
* [ ] MAP ROOM off the planetarium holds the STELLAR MAP (`pendingHeirloom: true`); READ lists 1 BIG DIPPER OF RANCH, 2 BLACK BUNGHOLE, 3 ORION'S WEDGIE, 4 SERIOUS-SIRIUS, 5 URANUS MAJOR.
* [ ] Picks 1, 3, and 5 light that constellation on the dome; the first drops the GOLD EYEPIECE (`pendingHeirloom: true`), sets `realm:eyepieceDropped`, and awards +10 once; later picks only show it.
* [ ] Pick 2 stretches the player like spaghetti and ejects them to `gate` with inventory kept.
* [ ] Pick 4 sets the player on fire through the existing `onFire`/`burnTurns` state and deposits them at `gate` still burning.
* [ ] Dome and projector text foreshadow the bad numbers (P3).
* [ ] Gary hint entries for the projector, map, and eyepiece.
* [ ] Feature covers all five numbers, eyepiece once, map reading, and pick 4 then EAST to light the BRAZIER by body fire for +30.

## Acceptance

* `cd web && npm test -- --tags "not @win and not @maxscore"` exit 0.
* Tests and docs land in the same commits as the code they cover.

## Decisions

* None yet.

<!-- end 2026-11-07_plan_todo_DoomsdayClock_Lane5-Planetarium.md -->
