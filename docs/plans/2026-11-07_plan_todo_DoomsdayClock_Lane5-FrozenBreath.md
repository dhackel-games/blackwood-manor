<!-- 2026-11-07_plan_todo_DoomsdayClock_Lane5-FrozenBreath.md. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-07.001:acoven. -->

# Lane 5: FrozenBreath

Status: todo. Master: [2026-11-07_plan_todo_DoomsdayClock.md](2026-11-07_plan_todo_DoomsdayClock.md).

* ModelPicker: mod:c55+s80='copilot:gpt-5.6-terra:1M:xhigh'
* Produces: `web/js/lanternwild/breath.js` and `web/tests/features/lanternwild-breath.feature`.
* Not produces: other modules, `::win`.
* Depends on: Lane 2.
* Worktree: orchestrator-assigned absolute path, stated in the spawn brief; first preflight is `pwd` match.
* Operator actions surface: [2026-11-07_plan_todo_DoomsdayClock.md#operator-next-actions](2026-11-07_plan_todo_DoomsdayClock.md#operator-next-actions) (record/reference only; no numbered lists in chat).

## Tasks

* [ ] Four sprites (wool, glass, silver, ice) and four fixed vessels; EXAMINE a sprite reveals its material by sensory clue.
* [ ] COAX <sprite> INTO <vessel> then SEAL <vessel>; a correct seal is permanent.
* [ ] First wrong vessel warns of frostbite; a second wrong vessel kills with foreshadowed text (P3).
* [ ] All four sealed set `lanternwild:breathDone`, award +10 once, and free the SNOW GLOBE (15) and SILVER WHISTLE (15) as `pendingHeirloom` items.
* [ ] Gary hints; feature covers each sprite, warning, death, award once, and item rewards.

## Acceptance

* `cd web && npm test -- --tags "not @win and not @maxscore"` exit 0.
* Tests and docs land in the same commits as the code they cover.

## Decisions

* None yet.

<!-- end 2026-11-07_plan_todo_DoomsdayClock_Lane5-FrozenBreath.md -->
