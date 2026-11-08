<!-- 2026-11-07_plan_todo_DoomsdayClock_Lane9-SharedHigh.md. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.001:acoven. -->

# Lane 9: SharedHigh

Status: todo. Master: [2026-11-07_plan_todo_DoomsdayClock.md](2026-11-07_plan_todo_DoomsdayClock.md).

* mod:c45+s85='copilot:gpt-5.6-terra:1M:xhigh'
* Produces: the shared high in `web/js/world.js` (`beginHigh`, the `highSource` merge hook, flavor pools) and `web/tests/features/shared-high.feature`.
* Not produces: snuffbox item or puzzle, realm modules, `::win`.
* Depends on: Lane 2.
* Worktree: orchestrator-assigned absolute path, stated in the spawn brief; first preflight is `pwd` match.
* Operator actions surface: [2026-11-07_plan_todo_DoomsdayClock.md#operator-next-actions](2026-11-07_plan_todo_DoomsdayClock.md#operator-next-actions) (record/reference only; no numbered lists in chat).

## Tasks

* [ ] Extract `beginHigh(ctx, { opening, turns })` from `eatMushrooms`: it adds turns to the `high` flag, keeps grace, third eye vision, dark sight, named-room flight, the attic vision, and its once-only award, and returns the opening line plus shared text.
* [ ] Replace the fixed paragraph beginning "The house isn't haunted, man" with a new 12-entry generic pool in `CYCLING_FLAVOR_POOLS` read through `cycleFlavor`; the FLY TO and THIRD EYE capability sentences stay fixed so the mechanic is always taught.
* [ ] Reword the two `MUSHROOM_REVELATIONS` lines that say "mushrooms" generically; keep the pool key so saved counters survive.
* [ ] Keep only source-specific openings: fresh toilet mushrooms, dried mushrooms, and a snuff sneeze line exported for Lane 8.
* [ ] Add the `highSource: { opening, turns, doses }` merge hook: items declaring it get the shared handler on EAT, SNIFF, or USE; `doses` decrements and the item stays when empty; without `doses` the item is consumed.
* [ ] Confirm the HUD 🍄 trip indicator shows for any high source with no HUD code change beyond the `high` flag.
* [ ] Feature covers mushrooms unchanged in effect, stacking, 12 entries without early repeat across save and restore, a fixture `highSource` item with doses, and no "mushroom" in shared text; existing `mushroom-vision.feature`, `mushroom-flight.feature`, and `flavor-variety.feature` stay green.
* [ ] Update `web/DESIGN.md` §12.23 to describe the shared high.

## Acceptance

* `cd web && npm test -- --tags "not @win and not @maxscore"` exit 0.
* Tests and docs land in the same commits as the code they cover.

## Decisions

* None yet.

<!-- end 2026-11-07_plan_todo_DoomsdayClock_Lane9-SharedHigh.md -->
