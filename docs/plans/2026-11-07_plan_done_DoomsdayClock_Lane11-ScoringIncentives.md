<!-- 2026-11-07_plan_done_DoomsdayClock_Lane11-ScoringIncentives.md. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.001:acoven. -->

# Lane 11: ScoringIncentives

Status: done (filename flips to _done_ in a separate post-merge commit per plan_organization). Master: [2026-11-07_plan_done_DoomsdayClock.md](2026-11-07_plan_done_DoomsdayClock.md).

* mod:c45+s80='copilot:gpt-5.6-terra:1M:xhigh'
* Produces: scoring changes in `web/js/world.js` and `web/tests/features/progress-scoring.feature`.
* Not produces: `::win` route, planner.
* Depends on: Phase A WAIT gate.
* Worktree: orchestrator-assigned absolute path, stated in the spawn brief; first preflight is `pwd` match.
* Operator actions surface: [2026-11-07_plan_done_DoomsdayClock.md#operator-next-actions](2026-11-07_plan_done_DoomsdayClock.md#operator-next-actions) (record/reference only; no numbered lists in chat).

## Tasks

* [x] ONE TRIP bonus (+25 once): a single PUT/DROP ALL IN RQ that seats all 24 heirlooms when none were previously seated.
* [x] Carry capacity: raise the BACKPACK `carryCapacity` (now 20) to fit 24 heirlooms plus required tools at deposit time (measure peak load; recommend 36).
* [x] Keep body-fire brazier as the highest-paying method (30 versus 10); add a scenario proving ignition several turns before arrival still awards 30 plus survival when the brazier is reached within the burn limit.
* [x] Record verified evidence: the MATCH already lights the CANDLE (no change).
* [x] Update the derived maximum and `@maxscore` assertions; document in `web/DESIGN.md` §8.

## Acceptance

* `cd web && npm test -- --tags "not @win"` exit 0.
* Tests and docs land in the same commits as the code they cover.

## Decisions

* D-L11-01: ONE TRIP is `progressAward:oneTrip`; the reliquary bulk handler records its starting seats and awards only after its final transfer seats all 24. Any successful partial heirloom seating persists `oneTripForfeited`, including after a save restore.
* D-L11-02: D-L1-09's 36-slot BACKPACK covers the measured all-in peak of 24 heirlooms plus 12 tools; the reliquary's existing 36 places remain unchanged.
* D-L11-03: Body-fire remains +30 versus +10 for CANDLE/CANDELABRA. The new fire scenario reaches the BRAZIER after four burn-consuming turns, with two remaining, and awards both +30 and first-survival +10.
* D-L11-04: Verified existing evidence in `fire-food.feature`: the single MATCH lights the CANDLE; no production behavior changed.
* D-L11-05: `maximumScore()` derives 1316: +330 deposits, +310 pickups, +310 uses, +306 progression, and +60 standalone awards. The sibling `::win` route remains out of this lane.

<!-- end 2026-11-07_plan_done_DoomsdayClock_Lane11-ScoringIncentives.md -->
