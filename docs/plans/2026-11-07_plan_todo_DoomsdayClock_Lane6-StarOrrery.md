<!-- 2026-11-07_plan_todo_DoomsdayClock_Lane6-StarOrrery.md. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-07.001:acoven. -->

# Lane 6: StarOrrery

Status: todo. Master: [2026-11-07_plan_todo_DoomsdayClock.md](2026-11-07_plan_todo_DoomsdayClock.md).

* ModelPicker: mod:c55+s80='copilot:gpt-5.6-terra:1M:xhigh'
* Produces: `web/js/lanternwild/orrery.js` and `web/tests/features/lanternwild-orrery.feature`.
* Not produces: other modules, `::win`.
* Depends on: Lane 2.
* Worktree: orchestrator-assigned absolute path, stated in the spawn brief; first preflight is `pwd` match.
* Operator actions surface: [2026-11-07_plan_todo_DoomsdayClock.md#operator-next-actions](2026-11-07_plan_todo_DoomsdayClock.md#operator-next-actions) (record/reference only; no numbered lists in chat).

## Tasks

* [ ] Fox, hare, and badger TRACKS circle the WAYLAMP; COUNT TRACKS (or COUNT <animal> TRACKS) reports tally-glyph counts from Lane 1.
* [ ] STAR STAIR descends through the ice to the STAR ORRERY with three animal rings.
* [ ] SET <animal> RING TO <n>; the third ring set evaluates; a wrong set spins all rings back to zero.
* [ ] Correct alignment sets `lanternwild:orreryDone`, awards +10 once, and yields the STARGLASS ASTROLABE (`pendingHeirloom`, 15).
* [ ] Gary hints; feature covers counting, wrong reset, success, award once, and item rewards.

## Acceptance

* `cd web && npm test -- --tags "not @win and not @maxscore"` exit 0.
* Tests and docs land in the same commits as the code they cover.

## Decisions

* None yet.

<!-- end 2026-11-07_plan_todo_DoomsdayClock_Lane6-StarOrrery.md -->
