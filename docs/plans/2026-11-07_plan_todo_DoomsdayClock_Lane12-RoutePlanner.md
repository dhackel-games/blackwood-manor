<!-- 2026-11-07_plan_todo_DoomsdayClock_Lane12-RoutePlanner.md. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.001:acoven. -->

# Lane 12: RoutePlanner

Status: todo. Master: [2026-11-07_plan_todo_DoomsdayClock.md](2026-11-07_plan_todo_DoomsdayClock.md).

* mod:c72+s65='copilot:gpt-6-sol:1M:max'
* Produces: `web/tools/route-plan.mjs` and `web/tests/features/route-planner.feature`.
* Not produces: `sysop-menu.js`, game modules.
* Depends on: Phase A WAIT gate.
* Worktree: orchestrator-assigned absolute path, stated in the spawn brief; first preflight is `pwd` match.
* Operator actions surface: [2026-11-07_plan_todo_DoomsdayClock.md#operator-next-actions](2026-11-07_plan_todo_DoomsdayClock.md#operator-next-actions) (record/reference only; no numbered lists in chat).

## Tasks

* [ ] Load the real `world` and compute shortest walking distances honoring `via` flags, lift beats, and ejections to `gate`.
* [ ] Model tasks (take, use, puzzle steps) with prerequisites, the fridge-cheese crossing, one opening named flight, burn-turn timing, and bulk take and deposit.
* [ ] Search orderings (exact or bounded branch and bound) minimizing room transitions; emit the command list plus metrics: transitions, revisits per room, named flights, ratio per heirloom.
* [ ] Tool never imported by game code; usage documented in `web/README.md`.
* [ ] Feature proves distances on known pairs and a deterministic small-problem ordering.

## Acceptance

* `cd web && npm test -- --tags "not @win"` exit 0; `node tools/route-plan.mjs` prints identical metrics twice.
* Tests and docs land in the same commits as the code they cover.

## Decisions

* None yet.

<!-- end 2026-11-07_plan_todo_DoomsdayClock_Lane12-RoutePlanner.md -->
