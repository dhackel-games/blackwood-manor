<!-- 2026-11-07_plan_todo_DoomsdayClock_Lane3-HeckleDuel.md. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-07.001:acoven. -->

# Lane 3: HeckleDuel

Status: todo. Master: [2026-11-07_plan_todo_DoomsdayClock.md](2026-11-07_plan_todo_DoomsdayClock.md).

* ModelPicker: mod:c55+s80='copilot:gpt-5.6-terra:1M:xhigh'
* Produces: `web/js/lanternwild/heckle.js` and `web/tests/features/lanternwild-heckle.feature`.
* Not produces: other modules, `world.js` beyond Lane 2 registration, `::win`.
* Depends on: Lane 2.
* Worktree: orchestrator-assigned absolute path, stated in the spawn brief; first preflight is `pwd` match.
* Operator actions surface: [2026-11-07_plan_todo_DoomsdayClock.md#operator-next-actions](2026-11-07_plan_todo_DoomsdayClock.md#operator-next-actions) (record/reference only; no numbered lists in chat).

## Tasks

* [ ] ICE-JAYS in the JAY ROOKERY: each LISTEN teaches the next insult/retort pair in fixed rotation; RECALL RETORTS lists learned pairs.
* [ ] HERALD OWL duel in the FROST COURT: deterministic insult order; SAY "<retort>" or RETORT <keyword>; unlearned retorts draw mockery.
* [ ] Three straight wins set `lanternwild:heckleWon`, award +10 once, release the HERALD'S SEAL (`pendingHeirloom: true`, points 15), and open the dais.
* [ ] Three straight losses fling the player harmlessly to the WAYLAMP CLEARING.
* [ ] Gary hint entries for jays, owl, and seal.
* [ ] Feature covers learning, wins, losses, reset, award once, seal pickup/use rewards, and replay without farming.

## Acceptance

* `cd web && npm test -- --tags "not @win and not @maxscore"` exit 0.
* Tests and docs land in the same commits as the code they cover.

## Decisions

* None yet.

<!-- end 2026-11-07_plan_todo_DoomsdayClock_Lane3-HeckleDuel.md -->
