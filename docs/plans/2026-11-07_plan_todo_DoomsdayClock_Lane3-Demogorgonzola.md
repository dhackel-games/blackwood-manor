<!-- 2026-11-07_plan_todo_DoomsdayClock_Lane3-Demogorgonzola.md. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.004:acoven. -->

# Lane 3: Demogorgonzola

Status: done (filename flips to _done_ in a separate post-merge commit per plan_organization). Master: [2026-11-07_plan_todo_DoomsdayClock.md](2026-11-07_plan_todo_DoomsdayClock.md).

* mod:c45+s85='copilot:gpt-5.6-terra:1M:xhigh'
* Produces: `web/js/upsidedown/demogorgonzola.js`, `web/js/manor/fridge.js`, the MILK starting-location line in `web/js/world.js`, and `web/tests/features/upsidedown-demogorgonzola.feature`.
* Not produces: other modules, `::win`.
* Depends on: Lane 2.
* Worktree: orchestrator-assigned absolute path, stated in the spawn brief; first preflight is `pwd` match.
* Operator actions surface: [2026-11-07_plan_todo_DoomsdayClock.md#operator-next-actions](2026-11-07_plan_todo_DoomsdayClock.md#operator-next-actions) (record/reference only; no numbered lists in chat).

## Tasks

* [x] KITCHEN FRIDGE in `fridge.js`: a fixed openable container; new games start the existing MILK, the EMPTY MILK JUG (portable non-heirloom; normal first-time +5 pickup and +5 use; POUR OUT empties it anywhere), and the three cheeses (LIMBURGER, ÉPOISSES, MUNSTER) inside; drinking MILK is unchanged.
* [x] Save compatibility: older saves gain the FRIDGE, MILK JUG, and cheeses without moving a MILK the player already took or drank.
* [x] Three takeable CHEESE items with the Lane 1 stink lines (funny stink, no trivia); EAT CHEESE is refused with a gag so no cheese can be lost.
* [x] DEMOGORGONZOLA in the CHEESE GROTTO: GIVE or FEED accepts each cheese in any order and consumes it; after the third its face opens like a flower and it yields the DEMOGORGONZOLA RIND (`pendingHeirloom: true`, points per master Section 8); sets `realm:demoFed`; +10 once.
* [x] Every other interaction (ATTACK, FIGHT, TOUCH, KICK, TAKE, GIVE of a non-cheese, and the Lane 1 list) swallows the player, who reappears at `gate` with inventory kept.
* [x] Room and creature text foreshadow the swallow and the cheese craving (P3).
* [x] Gary hint entries for the fridge, cheeses, creature, and rind.
* [x] Feature covers fridge contents (MILK, JUG, three cheeses), two different feeding orders, each swallow verb landing at `gate`, award once, rind pickup and use rewards, and replay without farming.

## Acceptance

* `cd web && npm test -- --tags "not @win and not @maxscore"` exit 0.
* Tests and docs land in the same commits as the code they cover.

## Decisions

* D-L3-01: For a saved game whose FRIDGE contents have changed, OPEN FRIDGE says
  "You open the FRIDGE. Inside: {remaining contents}."; an empty FRIDGE says
  "You open the FRIDGE. It is empty." The canon requires listing only actual
  remaining contents but supplies no exact replacement sentence.
* D-L3-02: After feeding, the creature's displayed room line changes from its
  closed face to "DEMOGORGONZOLA waits with its face open like a very rude
  flower." This prevents the room display from contradicting the canon's
  state-aware grotto description; the canon supplies no replacement
  `roomDesc`.

## Validation

* `cd /Users/acoven/dev/bm/wt-lane3-demogorgonzola/web && npm test -- --tags '@lane3'` — exit 0; 57 scenarios and 435 steps passed.
* `cd /Users/acoven/dev/bm/wt-lane3-demogorgonzola/web && npm test -- --tags "not @win and not @maxscore"` — exit 0; 603 scenarios and 4931 steps passed.
* `cd /Users/acoven/dev/bm/wt-lane3-demogorgonzola/web && npm test` — exit 1; the existing `@win` `::win` trace remains at 825 while the derived maximum is 875 because it does not collect the new Lane 3 portable rewards. Lane 13 owns the route update.

<!-- end 2026-11-07_plan_todo_DoomsdayClock_Lane3-Demogorgonzola.md -->
