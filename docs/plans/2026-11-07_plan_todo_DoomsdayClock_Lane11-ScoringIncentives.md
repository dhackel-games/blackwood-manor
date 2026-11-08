<!-- 2026-11-07_plan_todo_DoomsdayClock_Lane11-ScoringIncentives.md. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.001:acoven. -->

# Lane 11: ScoringIncentives

Status: todo. Master: [2026-11-07_plan_todo_DoomsdayClock.md](2026-11-07_plan_todo_DoomsdayClock.md).

* mod:c45+s80='copilot:gpt-5.6-terra:1M:xhigh'
* Produces: scoring changes in `web/js/world.js` and `web/tests/features/progress-scoring.feature`.
* Not produces: `::win` route, planner.
* Depends on: Phase A WAIT gate.
* Worktree: orchestrator-assigned absolute path, stated in the spawn brief; first preflight is `pwd` match.
* Operator actions surface: [2026-11-07_plan_todo_DoomsdayClock.md#operator-next-actions](2026-11-07_plan_todo_DoomsdayClock.md#operator-next-actions) (record/reference only; no numbered lists in chat).

## Tasks

* [ ] ONE TRIP bonus (+25 once): a single PUT/DROP ALL IN RQ that seats all 24 heirlooms when none were previously seated.
* [ ] Carry capacity: raise the BACKPACK `carryCapacity` (now 20) to fit 24 heirlooms plus required tools at deposit time (measure peak load; recommend 36).
* [ ] Keep body-fire brazier as the highest-paying method (30 versus 10); add a scenario proving ignition several turns before arrival still awards 30 plus survival when the brazier is reached within the burn limit.
* [ ] Record verified evidence: the MATCH already lights the CANDLE (no change).
* [ ] Update the derived maximum and `@maxscore` assertions; document in `web/DESIGN.md` §8.

## Acceptance

* `cd web && npm test -- --tags "not @win"` exit 0.
* Tests and docs land in the same commits as the code they cover.

## Decisions

* None yet.

<!-- end 2026-11-07_plan_todo_DoomsdayClock_Lane11-ScoringIncentives.md -->
