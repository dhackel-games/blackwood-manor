<!-- 2026-11-07_plan_todo_DoomsdayClock_Lane7-FrozenDrafts.md. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-07.001:acoven. -->

# Lane 7: FrozenDrafts

Status: todo. Master: [2026-11-07_plan_todo_DoomsdayClock.md](2026-11-07_plan_todo_DoomsdayClock.md).

* ModelPicker: mod:c55+s80='copilot:gpt-5.6-terra:1M:xhigh'
* Produces: `web/js/lanternwild/drafts.js` and `web/tests/features/lanternwild-drafts.feature`.
* Not produces: other modules, casket and root gate, `::win`.
* Depends on: Lanes 2 and 3 (flag name `lanternwild:heckleWon` is fixed).
* Worktree: orchestrator-assigned absolute path, stated in the spawn brief; first preflight is `pwd` match.
* Operator actions surface: [2026-11-07_plan_todo_DoomsdayClock.md#operator-next-actions](2026-11-07_plan_todo_DoomsdayClock.md#operator-next-actions) (record/reference only; no numbered lists in chat).

## Tasks

* [ ] EXAMINE the dripping ICICLE at the WAYLAMP teaches THAW; HUM THAW BACKWARDS (or HUM FREEZE once learned) casts FREEZE.
* [ ] HUM FREEZE AT the INK RIVER makes the FROZEN LIBRARY stacks crossable; READ SCROLL gives the never-freeze-a-person warning.
* [ ] The RIME DUCHESS dais requires `lanternwild:heckleWon`; HUM THAW AT DUCHESS sets `lanternwild:duchessThawed`, awards +10 once, and gives the RIME CROWN (`pendingHeirloom`, 20).
* [ ] HUM FREEZE at the Duchess or self: first attempt warns, second kills (P3).
* [ ] Gary hints; feature covers learning, river, scroll, gated dais, thaw, warnings, death, award once, and item rewards.

## Acceptance

* `cd web && npm test -- --tags "not @win and not @maxscore"` exit 0.
* Tests and docs land in the same commits as the code they cover.

## Decisions

* None yet.

<!-- end 2026-11-07_plan_todo_DoomsdayClock_Lane7-FrozenDrafts.md -->
