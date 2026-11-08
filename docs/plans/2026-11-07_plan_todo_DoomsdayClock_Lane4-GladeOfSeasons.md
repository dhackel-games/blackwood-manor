<!-- 2026-11-07_plan_todo_DoomsdayClock_Lane4-GladeOfSeasons.md. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-07.001:acoven. -->

# Lane 4: GladeOfSeasons

Status: todo. Master: [2026-11-07_plan_todo_DoomsdayClock.md](2026-11-07_plan_todo_DoomsdayClock.md).

* ModelPicker: mod:c55+s80='copilot:gpt-5.6-terra:1M:xhigh'
* Produces: `web/js/lanternwild/seasons.js` and `web/tests/features/lanternwild-seasons.feature`.
* Not produces: other modules, `::win`.
* Depends on: Lane 2.
* Worktree: orchestrator-assigned absolute path, stated in the spawn brief; first preflight is `pwd` match.
* Operator actions surface: [2026-11-07_plan_todo_DoomsdayClock.md#operator-next-actions](2026-11-07_plan_todo_DoomsdayClock.md#operator-next-actions) (record/reference only; no numbered lists in chat).

## Tasks

* [ ] SNOW HOURGLASS: TURN swaps the glade between LONG AGO and NOW, with distinct room text.
* [ ] BIRCH CATKIN and PINECONE placed per Lane 1; BURY CATKIN works only in LONG AGO (NOW: frozen ground refusal).
* [ ] In NOW, the grown silver birch can be CLIMBed to take the SILVER BOUGH (`pendingHeirloom`, 10).
* [ ] PUT PINECONE IN SAP in LONG AGO; in NOW the sap-knot holds the AMBER RELIC (`pendingHeirloom`, 10).
* [ ] Both artifacts obtained set `lanternwild:seasonsDone` and award +10 once.
* [ ] Gary hints; feature covers both orders, refusals, award once, item rewards, and no farming.

## Acceptance

* `cd web && npm test -- --tags "not @win and not @maxscore"` exit 0.
* Tests and docs land in the same commits as the code they cover.

## Decisions

* None yet.

<!-- end 2026-11-07_plan_todo_DoomsdayClock_Lane4-GladeOfSeasons.md -->
