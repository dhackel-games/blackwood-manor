<!-- 2026-11-07_plan_todo_DoomsdayClock_Lane2-RealmHub.md. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-07.001:acoven. -->

# Lane 2: RealmHub

Status: todo. Master: [2026-11-07_plan_todo_DoomsdayClock.md](2026-11-07_plan_todo_DoomsdayClock.md).

* ModelPicker: mod:c50+s80='copilot:gpt-5.6-terra:1M:xhigh'
* Produces: `web/js/lanternwild/realm.js`, module registration, and `web/tests/features/lanternwild-realm.feature`.
* Not produces: challenge logic, quartet logic, `::win`, heirloom count.
* Depends on: Lane 1.
* Worktree: orchestrator-assigned absolute path, stated in the spawn brief; first preflight is `pwd` match.
* Operator actions surface: [2026-11-07_plan_todo_DoomsdayClock.md#operator-next-actions](2026-11-07_plan_todo_DoomsdayClock.md#operator-next-actions) (record/reference only; no numbered lists in chat).

## Tasks

* [ ] Create `web/js/lanternwild/index.js` plus stubs `heckle.js`, `seasons.js`, `breath.js`, `orrery.js`, `drafts.js`, `rootgate.js`, and `web/js/manor/index.js` plus stubs `map.js`, `weathercock.js`, `snuffbox.js`, `corkscrew.js`; each exports `{ rooms, items, content, shortNames, progressAwards, hints, roomHooks }`.
* [ ] Merge modules once in `world.js` (rooms, items, short names, progress awards, hints) and chain `roomHooks` onto existing room `on` handlers without replacing them.
* [ ] Define all Lanternwild room shells and exits in `realm.js`; MINERS' LOCKER in `mineGallery` (OPEN LOCKER, IN) and OUT back to the gallery; ROOT HOLLOW sealed by `lanternwild:allSolved`.
* [ ] Award realm discovery (+20) once on first entry.
* [ ] Refuse named flights into and out of realm rooms; inverted WINGED SHOES warn once past the clearing, then kill on the next step; REMOVE SHOES clears the hazard.
* [ ] Add a Lanternwild floor to `web/js/map.js` and matching `view2d/tilemap.js` layout and `view2d/roomdata.json` entries.
* [ ] List every new file in `web/versions.json` `CONTENT_FILES`; `manifest.feature` passes.
* [ ] Include realm room and lift stop in `web/js/issue-report.js` reports.
* [ ] Tag existing `::win` trace scenarios `@win` and maximum-score assertions `@maxscore` (tags only; no `::win` logic change).
* [ ] Write `lanternwild-realm.feature`: locker entry and return, discovery award once, flight refusal both directions, shoes warning then death, map floor shown.
* [ ] Add the realm entry to `web/README.md` commands and a `web/DESIGN.md` §12.36 section.

## Acceptance

* `cd web && npm test -- --tags "not @win and not @maxscore"` exit 0; stubs load; existing game unchanged outside the gallery.
* Tests and docs land in the same commits as the code they cover.

## Decisions

* None yet.

<!-- end 2026-11-07_plan_todo_DoomsdayClock_Lane2-RealmHub.md -->
