<!-- 2026-11-07_plan_done_DoomsdayClock_Lane13-WinRoute.md. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.004:acoven. -->

# Lane 13: WinRoute

Status: done (filename flips to _done_ in a separate post-merge commit per plan_organization). Master: [2026-11-07_plan_done_DoomsdayClock.md](2026-11-07_plan_done_DoomsdayClock.md).

* mod:c60+s75='copilot:gpt-5.6-terra:1M:xhigh'
* Produces: `::win` rewrite in `web/js/sysop-menu.js` and `web/tests/features/sysop-menu.feature`.
* Not produces: new content, planner internals.
* Depends on: Lanes 11 and 12.
* Worktree: orchestrator-assigned absolute path, stated in the spawn brief; first preflight is `pwd` match.
* Operator actions surface: [2026-11-07_plan_done_DoomsdayClock.md#operator-next-actions](2026-11-07_plan_done_DoomsdayClock.md#operator-next-actions) (record/reference only; no numbered lists in chat).

## Tasks

* [x] Opening: KITCHEN FRIDGE cheeses with the other early gear, privy mushrooms, one named flight to the shaft; BACKPACK, HEADLAMP, troll riddle, vault (TAKE ALL).
* [x] Realm in one pass: feed DEMOGORGONZOLA, answer the radio quiz from its drawn clues until three in a row, take the STELLAR MAP and pick a safe number, spell the wall, take the drawing, put out the campfire for the CYAN GEM, align the LOWER PANEL, ride the lift up from BELOW.
* [x] Walk the remaining grounds and manor in planner order with TAKE ALL per room, solving the five manor puzzles and using items on arrival (face the BURPER, FARTER, and SHITTER before the HORIZON-GAZER; open and drink one WINE BOTTLE before the CORKSCREW is deposited); ignite self early enough to arrive at the brazier ablaze.
* [x] One PUT ALL IN RQ; CLOSE RQ; open closet; pull rope; take and read the DOOMSDAY CLOCK; stop in the ROYAL HALL.
* [x] Update `pathToRoom` for the four-beat lift and keep the no-mushroom and after-bell recovery paths working.
* [x] Trace scenario asserts: two or fewer named flights, one bulk deposit, zero single-item RQ deposits, alive in the ROYAL HALL holding the clock, score equals the derived maximum, transitions per heirloom below 5.9; remove the `@win` exclusion.
* [x] Update `web/DESIGN.md` §8 route statistics and the sysop description.

## Acceptance

* `cd web && npm test` exit 0 (full suite).
* Tests and docs land in the same commits as the code they cover.

## Validation

* `cd /Users/acoven/dev/bm/wt-lane13-winroute/web && npm test` — exit 0; 729 scenarios and 6221 steps passed.
* `cd /Users/acoven/dev/bm/wt-lane13-winroute/web && npm test -- --tags @win` — exit 0; 8 scenarios and 146 steps passed.
* `cd /Users/acoven/dev/bm/wt-lane13-winroute/web && node tools/route-plan.mjs` — exit 0; 232 commands, 68 walking transitions, 24 heirlooms, two named flights, one bulk deposit, and 1316/1316.

## Decisions

* D-L13-01: Expand radio answers from the persisted LCG state. An unset seed is initialized and persisted during expansion, so the later CABINET RADIO draw consumes the same state and three answers remain deterministic.
* D-L13-02: When the upper oak puzzle was already solved, calculate the pre-alignment lift beat and wait only until the four-beat platform reaches BELOW before boarding; fresh runs retain the planner's 232-command route.
* D-L13-03: Preserve an inventory DOOMSDAY CLOCK during save migration after heirloom transformation; otherwise the post-bell `::win` recovery and Part II branch lose the carried clock on restore.

<!-- end 2026-11-07_plan_done_DoomsdayClock_Lane13-WinRoute.md -->
