<!-- 2026-11-07_plan_todo_DoomsdayClock_Lane6-Shack.md. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.002:acoven. -->

# Lane 6: Shack

Status: done (filename flips to _done_ in a separate post-merge commit per plan_organization). Master: [2026-11-07_plan_todo_DoomsdayClock.md](2026-11-07_plan_todo_DoomsdayClock.md).

* mod:c40+s85='copilot:gpt-5.6-terra:1M:xhigh'
* Produces: `web/js/upsidedown/shack.js` and `web/tests/features/upsidedown-shack.feature`.
* Not produces: other modules, `::win`, any color mechanic or holiday decor.
* Depends on: Lane 2.
* Worktree: orchestrator-assigned absolute path, stated in the spawn brief; first preflight is `pwd` match.
* Operator actions surface: [2026-11-07_plan_todo_DoomsdayClock.md#operator-next-actions](2026-11-07_plan_todo_DoomsdayClock.md#operator-next-actions) (record/reference only; no numbered lists in chat).

## Tasks

* [x] SHACK: a small rundown room whose wall has letters A to Z painted under bulbs; text-only, no color mechanic.
* [x] KID'S DRAWING on the door (DEMOGORGONZOLA farting, many arrows pointing at the fart): takeable, `pendingHeirloom: true`.
* [x] Spelling per Lane 1 grammar accepts FART, STINK, or CHEESE; any other word flickers and resets.
* [x] Success makes the wall spit out the PURPLE CRAYON (`pendingHeirloom: true`), sets `realm:shackSpelled`, and awards +10 once; later spellings only flicker.
* [x] Gary hint entries for the wall, drawing, and crayon.
* [x] Feature covers each accepted word, a rejected word, drawing pickup, award once, and replay without farming.

## Acceptance

* `cd web && npm test -- --tags "not @win and not @maxscore"` exit 0.
* Tests and docs land in the same commits as the code they cover.

## Decisions

* D-L6-01: The generic parser removes article `A` from space-separated `F A R T`.
  The SHACK content hook restores its normalized `F R T` form to `FART`, preserving
  the canonical spelling grammar without adding realm knowledge to the parser.

<!-- end 2026-11-07_plan_todo_DoomsdayClock_Lane6-Shack.md -->
