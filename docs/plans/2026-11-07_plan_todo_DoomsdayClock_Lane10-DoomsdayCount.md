<!-- 2026-11-07_plan_todo_DoomsdayClock_Lane10-DoomsdayCount.md. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.002:acoven. -->

# Lane 10: DoomsdayCount

Status: todo. Master: [2026-11-07_plan_todo_DoomsdayClock.md](2026-11-07_plan_todo_DoomsdayClock.md).

* mod:c65+s75='copilot:gpt-5.6-terra:1M:xhigh'
* Produces: the 24-heirloom switch across `web/js/world.js`, `web/js/howto.js`, tests, and docs.
* Not produces: `::win` route, route planner.
* Depends on: Lanes 7 and 8.
* Worktree: orchestrator-assigned absolute path, stated in the spawn brief; first preflight is `pwd` match.
* Operator actions surface: [2026-11-07_plan_todo_DoomsdayClock.md#operator-next-actions](2026-11-07_plan_todo_DoomsdayClock.md#operator-next-actions) (record/reference only; no numbered lists in chat).

## Tasks

* [ ] Flip all eleven `pendingHeirloom` items (six realm; five manor: `blackwoodDiamond`, `silverWeathercock`, `snuffbox`, `baronessPhotograph`, `corkscrew`) to `treasure: true`; set `REQUIRED_FAMILY_ITEM_COUNT = 24`; remove the `pendingHeirloom` field.
* [ ] Reliquary: 24 recesses ringed like a clock face in text and art; the bell answers only when all 24 are seated.
* [ ] Rename the clock to the DOOMSDAY CLOCK with COUNTDOWN CLOCK names as aliases; describe 24 hours.
* [ ] Part II: the clock starts at XXIV; relabel the implemented Medusa/emerald scene Hour XXIV; ticking moves to XXIII; update `part-two.feature`.
* [ ] Replace every stale "thirteen"/13-heirloom reference in `world.js`, `howto.js`, HUD, and features.
* [ ] Save migration: saves with `curseLiftable` but fewer than 24 seated clear it; bell-rung and Part II saves keep their state; the `letter` item becomes PHOTO PIECE A at its saved location with `letterRead` and pickup history preserved; saves with `letterBurned` follow master D28; no award is invented or erased; prove in `heirloom-migration.feature`.
* [ ] 2D tray: emoji for all 11 new heirlooms; run `web/tools/gen-firefly-icons.py` for PNGs only if Firefly credentials exist in the environment.
* [ ] Gary progression hints cover all 24, including the CORKSCREW tradeoff (depositing it ends new WINE BOTTLES).
* [ ] Apply the D26 values, recompute the derived maximum, update `@maxscore` assertions, and document the breakdown in `web/DESIGN.md` §8.
* [ ] Docs: `README.md`, `web/README.md`, `web/DESIGN.md` §7, §8, §12.36; correction banners in `docs/design/0001` and `0002` pointing to `docs/plans/2026-11-07_info_UpsideDownAndDoomsdayClockCanon.md`.

## Acceptance

* `cd web && npm test -- --tags "not @win"` exit 0; `rg -i "thirteen heirloom"` returns no gameplay matches.
* Tests and docs land in the same commits as the code they cover.

## Decisions

* None yet.

<!-- end 2026-11-07_plan_todo_DoomsdayClock_Lane10-DoomsdayCount.md -->
