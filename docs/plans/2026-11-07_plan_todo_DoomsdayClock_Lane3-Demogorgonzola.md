<!-- 2026-11-07_plan_todo_DoomsdayClock_Lane3-Demogorgonzola.md. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.001:acoven. -->

# Lane 3: Demogorgonzola

Status: todo. Master: [2026-11-07_plan_todo_DoomsdayClock.md](2026-11-07_plan_todo_DoomsdayClock.md).

* mod:c45+s85='copilot:gpt-5.6-terra:1M:xhigh'
* Produces: `web/js/lanternwild/demogorgonzola.js`, `web/js/manor/fridge.js`, the MILK starting-location line in `web/js/world.js`, and `web/tests/features/lanternwild-demogorgonzola.feature`.
* Not produces: other modules, `::win`.
* Depends on: Lane 2.
* Worktree: orchestrator-assigned absolute path, stated in the spawn brief; first preflight is `pwd` match.
* Operator actions surface: [2026-11-07_plan_todo_DoomsdayClock.md#operator-next-actions](2026-11-07_plan_todo_DoomsdayClock.md#operator-next-actions) (record/reference only; no numbered lists in chat).

## Tasks

* [ ] KITCHEN FRIDGE in `fridge.js`: a fixed openable container; new games start the existing MILK and the three Lane 1 cheeses inside; drinking MILK is unchanged.
* [ ] Save compatibility: older saves gain the FRIDGE and cheeses without moving a MILK the player already took or drank.
* [ ] Three takeable CHEESE items with stench descriptions; EAT CHEESE is refused with a gag so no cheese can be lost.
* [ ] DEMOGORGONZOLA in the CHEESE GROTTO: GIVE or FEED accepts each cheese in any order and consumes it; after the third its face opens like a flower and it yields the DEMOGORGONZOLA RIND (`pendingHeirloom: true`, points per master Section 8); sets `realm:demoFed`; +10 once.
* [ ] Every other interaction (ATTACK, FIGHT, TOUCH, KICK, TAKE, GIVE of a non-cheese, and the Lane 1 list) swallows the player, who reappears at `gate` with inventory kept.
* [ ] Room and creature text foreshadow the swallow and the cheese craving (P3).
* [ ] Gary hint entries for the fridge, cheeses, creature, and rind.
* [ ] Feature covers fridge contents, two different feeding orders, each swallow verb landing at `gate`, award once, rind pickup and use rewards, and replay without farming.

## Acceptance

* `cd web && npm test -- --tags "not @win and not @maxscore"` exit 0.
* Tests and docs land in the same commits as the code they cover.

## Decisions

* None yet.

<!-- end 2026-11-07_plan_todo_DoomsdayClock_Lane3-Demogorgonzola.md -->
