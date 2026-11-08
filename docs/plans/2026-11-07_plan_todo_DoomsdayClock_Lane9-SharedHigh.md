<!-- 2026-11-07_plan_todo_DoomsdayClock_Lane9-SharedHigh.md. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.002:acoven. -->

# Lane 9: SharedHigh

Status: done. Master: [2026-11-07_plan_todo_DoomsdayClock.md](2026-11-07_plan_todo_DoomsdayClock.md).

* mod:c45+s85='copilot:gpt-5.6-terra:1M:xhigh'
* Produces: the shared high in `web/js/world.js` (`beginHigh`, the `highSource` merge hook, flavor pools), the P7:HiddenSightIsSearch reveal, `web/tests/features/shared-high.feature`, and `web/tests/features/hidden-sight.feature`.
* Not produces: snuffbox or WINE BOTTLE items or puzzles, realm modules, `::win`.
* Depends on: Lane 2.
* Worktree: orchestrator-assigned absolute path, stated in the spawn brief; first preflight is `pwd` match.
* Operator actions surface: [2026-11-07_plan_todo_DoomsdayClock.md#operator-next-actions](2026-11-07_plan_todo_DoomsdayClock.md#operator-next-actions) (record/reference only; no numbered lists in chat).

## Tasks

* [x] Extract `beginHigh(ctx, { opening, turns })` from `eatMushrooms`: it adds turns to the `high` flag, keeps grace, third eye vision, dark sight, named-room flight, the attic vision, and its once-only award, and returns the opening line plus shared text.
* [x] Replace the fixed paragraph beginning "The house isn't haunted, man" with a new 12-entry generic pool in `CYCLING_FLAVOR_POOLS` read through `cycleFlavor`; the FLY TO and THIRD EYE capability sentences stay fixed so the mechanic is always taught.
* [x] Reword the two `MUSHROOM_REVELATIONS` lines that say "mushrooms" generically; keep the pool key so saved counters survive.
* [x] Keep only source-specific openings: fresh toilet mushrooms, dried mushrooms, plus a snuff sneeze line and a wine sip line exported for Lane 8.
* [x] Add the `highSource: { opening, turns, doses, whenEmpty }` merge hook covering mushrooms (12 turns, consumed), snuff (6 per pinch, 3 pinches, `whenEmpty: "keep"`), and wine (10 per sip, 4 sips, `whenEmpty: "destroy"`): items declaring it get the shared handler on EAT, SNIFF, USE, or DRINK; `doses` decrements; without `doses` the item is consumed; every source shows its opening line, then the shared 12-entry pool.
* [x] Confirm the HUD 🍄 trip indicator shows for any high source with no HUD code change beyond the `high` flag.
* [x] Feature covers mushrooms unchanged in effect, stacking, 12 entries without early repeat across save and restore, fixture `highSource` items with doses kept and destroyed when empty, and no "mushroom" in shared text; existing `mushroom-vision.feature`, `mushroom-flight.feature`, and `flavor-variety.feature` stay green.
* [x] P7:HiddenSightIsSearch: any hidden sight (the high, worn XRAY GOGGLES, worn OBSIDIAN EYE) sets `vaultFound` on arriving in or looking at the ATTIC.
* [x] Audit every `revealedBy` exit (ATTIC NORTH `vaultFound`, NURSERY IN `wallGapFound`, LIBRARY DOWN `leverPulled`) and every search-only discovery so hidden sight reveals what SEARCH would find, granting existing awards once; expose a generic content hook that Lane 8 uses for the LIBRARY book photo piece and the LANDING bust glint.
* [x] No `lockedMsg` contradicts a vision that revealed the passage: physical mechanisms (the LIBRARY LEVER) may still need operating, but under hidden sight the refusal text acknowledges the seen passage; no puzzle knowledge enters `core.js` or `commands.js`.
* [x] `hidden-sight.feature` covers goggles-only and eye-only ATTIC access, the NURSERY and LIBRARY passages under hidden sight, and each award once.
* [x] Update `web/DESIGN.md` §12.23 to describe the shared high and P7.

## Acceptance

* `cd web && npm test -- --tags "not @win and not @maxscore"` exit 0.
* Tests and docs land in the same commits as the code they cover.

## Decisions

* Wine source (master D29) and P7:HiddenSightIsSearch (master D27) ratified by AndrewC 2026-11-08.

<!-- end 2026-11-07_plan_todo_DoomsdayClock_Lane9-SharedHigh.md -->
