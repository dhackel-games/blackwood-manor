<!-- 2026-11-07_plan_todo_DoomsdayClock_Lane12-RoutePlanner.md. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.001:acoven. -->

# Lane 12: RoutePlanner

Status: done (filename flips to _done_ in a separate post-merge commit per plan_organization). Master: [2026-11-07_plan_todo_DoomsdayClock.md](2026-11-07_plan_todo_DoomsdayClock.md).

* mod:c72+s65='copilot:gpt-6-sol:1M:max'
* Produces: `web/tools/route-plan.mjs`, `web/tests/features/route-planner.feature`, `web/tests/steps/lane12.steps.js`, and usage in `web/README.md`.
* Not produces: `sysop-menu.js`, game modules.
* Depends on: Phase A WAIT gate.
* Worktree: orchestrator-assigned absolute path, stated in the spawn brief; first preflight is `pwd` match.
* Operator actions surface: [2026-11-07_plan_todo_DoomsdayClock.md#operator-next-actions](2026-11-07_plan_todo_DoomsdayClock.md#operator-next-actions) (record/reference only; no numbered lists in chat).

## Tasks

* [x] Load the real `world` and compute shortest walking distances honoring `via` flags, lift beats, and ejections to `gate`.
* [x] Model tasks (take, use, puzzle steps) with prerequisites, the fridge-cheese crossing, one opening named flight, burn-turn timing, and bulk take and deposit.
* [x] Search orderings (exact or bounded branch and bound) minimizing room transitions; emit the command list plus metrics: transitions, revisits per room, named flights, ratio per heirloom.
* [x] Tool never imported by game code; usage documented in `web/README.md`.
* [x] Feature proves distances on known pairs and a deterministic small-problem ordering.

## Acceptance

* `cd /Users/acoven/dev/bm/wt-lane12-routeplanner/web && npm test -- --tags "not @win"`: exit 0, 719 scenarios and 6068 steps passed on the merged Lane 11 base.
* `cd /Users/acoven/dev/bm/wt-lane12-routeplanner/web && npx cucumber-js tests/features/route-planner.feature --import 'tests/steps/**/*.js' --format progress`: exit 0, 8 scenarios and 68 steps passed.
* `cd /Users/acoven/dev/bm/wt-lane12-routeplanner/web && node tools/route-plan.mjs`: exit 0; 232 commands, 68 walked transitions, 4 lift moves, 1 ejection, 24 heirlooms, 1 PUT ALL IN RQ, ONE TRIP awarded, and derived maximum 1316/1316.
* `cd /Users/acoven/dev/bm/wt-lane12-routeplanner/web && node --input-type=module -e 'import assert from "node:assert/strict"; import { spawnSync } from "node:child_process"; const run = () => spawnSync(process.execPath, ["tools/route-plan.mjs"], { encoding: "utf8" }); const a = run(), b = run(); assert.equal(a.status, 0, a.stderr); assert.equal(b.status, 0, b.stderr); assert.equal(a.stdout, b.stdout); console.log("identical command list and metrics (2 consecutive runs)");'`: exit 0; both complete outputs byte-identical.
* Tests and docs accompany the code in both commits.

## Decisions

* D-L12-01: Resolve navigation from the actual merged `world.rooms`. Treat `via` flags, the open locker, powered vertical movement, the two-beat upper lift, and the four-beat lower lift as physical edges. Model a forced ejection as a task that changes rooms, never as a free walking exit.
* D-L12-02: A DAG covers all 24 heirlooms and all 62 Part I portable pickup/use ledgers, including the fridge cheeses, both panels, five manor heirlooms, every realm puzzle, and the reliquary ritual. Use TAKE ALL where the engine awards it correctly; individually take deliberate gems and items with custom TAKE handlers.
* D-L12-03: Fly first to SHAFT for the BACKPACK, HEADLAMP, and WINGED SHOES. Search without a second flight and with each of 29 legal second-flight starts. A bounded beam/branch-and-bound search uses 72 states per layer and at most 18,000 expansions per refined start; choose a second flight only if a fully executed route saves non-flight room changes. GARDEN wins here: 80 without it versus 73 with it.
* D-L12-04: Ignite with the BURRITO WRAPPER in the ROYAL HALL; SOUTH, SOUTH, EAST reaches the BRAZIER on turn four, and LIGHT BRAZIER puts the player out, earning the +30 body-fire method and survival award. Later, PROJECTOR 4 ejects the player burning to GATE; EXTINGUISH SELF immediately prevents a second burn penalty.
* D-L12-05: Seed the dev-only radio fixture with `0x1a2b3c4d` for reproducible output, then read each `realm:radioRound.correctOption` after its persisted LCG draw. Lane 13 must compute live answers, not hardcode the three printed fixture answers.
* D-L12-06: Report `transitions` as directional walking moves, matching the trace's 77/13 = 5.9 baseline; report lift moves and ejection separately, and minimize total non-flight room changes. The selected route walks 68 transitions (2.83 per heirloom), changes rooms 73 times excluding flights, flies to SHAFT and GARDEN, and visits the ROYAL HALL eight times (seven revisits).
* D-L12-07: The coordinator requested the completed Lane 11 branch locally merged at `c21dd44` (wave head `b24ed66`); its `cmd.itemId` bulk fix, BACKPACK capacity 36, and ONE TRIP +25 are exercised directly without altering game modules. Peak carried load is 32 and the derived maximum is 1316.

<!-- end 2026-11-07_plan_todo_DoomsdayClock_Lane12-RoutePlanner.md -->
