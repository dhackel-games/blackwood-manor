<!-- 2026-11-07_plan_todo_DoomsdayClock_Lane9-ManorQuartet.md. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-07.001:acoven. -->

# Lane 9: ManorQuartet

Status: todo. Master: [2026-11-07_plan_todo_DoomsdayClock.md](2026-11-07_plan_todo_DoomsdayClock.md).

* ModelPicker: mod:c50+s80='copilot:gpt-5.6-terra:1M:xhigh'
* Produces: `web/js/manor/{map,weathercock,snuffbox,corkscrew}.js` and `web/tests/features/manor-quartet.feature` (lane orch spawns one task worker per heirloom).
* Not produces: Lanternwild modules, `::win`.
* Depends on: Lane 2.
* Worktree: orchestrator-assigned absolute path, stated in the spawn brief; first preflight is `pwd` match.
* Operator actions surface: [2026-11-07_plan_todo_DoomsdayClock.md#operator-next-actions](2026-11-07_plan_todo_DoomsdayClock.md#operator-next-actions) (record/reference only; no numbered lists in chat).

## Tasks

* [ ] ESTATE MAP: four MAP PIECES at the GATE, HEDGE MAZE LOOP, PORCH, and ROOF; COMBINE PIECES yields the BLACKWOOD ESTATE MAP (`pendingHeirloom`, 15); puzzle +5 once.
* [ ] WEATHERCOCK: ROOF gargoyle gazes give the compass order; TURN WEATHERVANE TO <direction> in order opens the CHIMNEY CACHE; wrong turn resets; SILVER WEATHERCOCK (`pendingHeirloom`, 15); +5 once.
* [ ] SNUFFBOX: PARLOR urns plus two portraits flanking the Baron; ASK <portrait> ABOUT SNUFFBOX yields liar/truth/alternating statements; OPEN the deduced urn yields the BLACKWOOD SNUFFBOX (`pendingHeirloom`, 10); wrong urn releases harmless snuff and resets; +5 once.
* [ ] CORKSCREW: KNOCK on WINE CELLAR casks; the hollow cask's BUNG can be UNSCREWed for the BLACKWOOD CORKSCREW (`pendingHeirloom`, 10); +5 once.
* [ ] Gary hints and room search text for all four; `map.js` and `view2d/roomdata.json` item updates.
* [ ] Feature covers each puzzle's success, reset, award once, and item rewards.

## Acceptance

* `cd web && npm test -- --tags "not @win and not @maxscore"` exit 0.
* Tests and docs land in the same commits as the code they cover.

## Decisions

* None yet.

<!-- end 2026-11-07_plan_todo_DoomsdayClock_Lane9-ManorQuartet.md -->
