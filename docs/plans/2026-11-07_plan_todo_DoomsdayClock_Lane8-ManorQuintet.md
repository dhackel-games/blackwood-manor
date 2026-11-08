<!-- 2026-11-07_plan_todo_DoomsdayClock_Lane8-ManorQuintet.md. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.001:acoven. -->

# Lane 8: ManorQuintet

Status: todo. Master: [2026-11-07_plan_todo_DoomsdayClock.md](2026-11-07_plan_todo_DoomsdayClock.md).

* mod:c55+s60='copilot:gpt-5.6-terra:1M:xhigh'
* Produces: `web/js/manor/{diamond,estatemap,corkscrew,snuffbox,weathercock}.js` and `web/tests/features/manor-quintet.feature` (the lane orchestrator spawns one task worker per heirloom).
* Not produces: realm modules, `fridge.js`, the shared high handler, `::win`.
* Depends on: Lane 2 and Lane 9; each heirloom also waits for its refined design in the Lane 1 canon doc (designs are under refinement with AndrewC).
* Worktree: orchestrator-assigned absolute path, stated in the spawn brief; first preflight is `pwd` match.
* Operator actions surface: [2026-11-07_plan_todo_DoomsdayClock.md#operator-next-actions](2026-11-07_plan_todo_DoomsdayClock.md#operator-next-actions) (record/reference only; no numbered lists in chat).

## Tasks

* [ ] BLACKWOOD DIAMOND (under refinement): KITCHEN MICROWAVE dial SECONDS, YEARS, CENTURIES, EONS; COAL on EONS yields the DIAMOND (`pendingHeirloom: true`); too short gives slightly older coal; too long gives dust; coal source per D24; +5 once.
* [ ] ESTATE MAP (under refinement): four MAP PIECES at the refined locations (pitched: privy TOILET, DREADMAW's nostril, Baron portrait's mouth, under a mattress); COMBINE yields the ESTATE MAP (`pendingHeirloom: true`); +5 once.
* [ ] CORKSCREW (under refinement): KNOCK on WINE CELLAR casks with knock-knock joke replies; the hollow cask yields the CORKSCREW (`pendingHeirloom: true`); +5 once.
* [ ] SNUFFBOX (under refinement): PARLOR liar-logic puzzle with Baron Munchhausen and two portraits yields the SNUFFBOX (`pendingHeirloom: true`); +5 once. Ratified use via Lane 9 `highSource`: SNIFF or USE takes one pinch for 6 stacking high turns with a sneeze opening; 3 pinches (`manor:snuffPinches`), then EMPTY but still an heirloom; first sniff earns +5 use.
* [ ] WEATHERCOCK (under refinement): ROOF gargoyle gazes give a compass order; TURN WEATHERVANE through it opens the CHIMNEY CACHE with the SILVER WEATHERCOCK (`pendingHeirloom: true`) and a rooster crow; a wrong turn resets; +5 once.
* [ ] Gary hints and room search text for all five; `web/js/map.js` and `web/view2d/roomdata.json` item updates.
* [ ] Feature covers each puzzle's success, reset or failure, award once, item rewards, and the three snuff pinches stacking then EMPTY.

## Acceptance

* `cd web && npm test -- --tags "not @win and not @maxscore"` exit 0.
* Tests and docs land in the same commits as the code they cover.

## Decisions

* None yet.

<!-- end 2026-11-07_plan_todo_DoomsdayClock_Lane8-ManorQuintet.md -->
