<!-- 2026-11-07_plan_done_DoomsdayClock_Lane2-RealmHub.md. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.004:acoven. -->

# Lane 2: RealmHub

Status: done (filename flips to _done_ in a separate post-merge commit per plan_organization). Master: [2026-11-07_plan_done_DoomsdayClock.md](2026-11-07_plan_done_DoomsdayClock.md).

* mod:c50+s80='copilot:gpt-5.6-terra:1M:xhigh'
* Produces: `web/js/upsidedown/realm.js`, every module stub, module registration, generic verbs, and `web/tests/features/upsidedown-realm.feature`.
* Not produces: puzzle logic, manor heirloom logic, shared high logic, `::win`, heirloom count.
* Depends on: Lane 1.
* Worktree: orchestrator-assigned absolute path, stated in the spawn brief; first preflight is `pwd` match.
* Operator actions surface: [2026-11-07_plan_done_DoomsdayClock.md#operator-next-actions](2026-11-07_plan_done_DoomsdayClock.md#operator-next-actions) (record/reference only; no numbered lists in chat).

## Tasks

* [x] Create `web/js/upsidedown/index.js` plus stubs `realm.js`, `demogorgonzola.js`, `radio.js`, `radio-clues.js`, `planetarium.js`, `shack.js`, `campfire.js`, `lowerpanel.js`, and `web/js/manor/index.js` plus stubs `fridge.js`, `diamond.js`, `photograph.js`, `corkscrew.js`, `snuffbox.js`, `weathercock.js`; each exports `{ rooms, items, content, shortNames, progressAwards, hints, roomHooks, flavorPools }`.
* [x] Merge modules once in `world.js` (rooms, items, short names, progress awards, hints, and `flavorPools` into `CYCLING_FLAVOR_POOLS` with `cycleFlavor` reachable through `ctx`) and chain `roomHooks` onto existing room `on` handlers without replacing them.
* [x] Add the generic verbs Lane 1 lists to `parser.js` with default refusals in `commands.js`; no puzzle knowledge in the engine.
* [x] Define all realm room shells and exits in `realm.js`; MINERS' LOCKER in `mineGallery` (OPEN LOCKER, IN) and OUT back to the gallery; a walking exit to the BELOW room that holds the LOWER PANEL, open from the start.
* [x] Award realm discovery (+20) once on first entry.
* [x] Flight parity (D10): WINGED SHOES and the high's named-room flight reach and leave realm rooms exactly as manor rooms; no realm special case.
* [x] Add a realm floor to `web/js/map.js` and matching `web/view2d/tilemap.js` layout and `web/view2d/roomdata.json` entries.
* [x] List every new file in `web/versions.json` `CONTENT_FILES`; `manifest.feature` passes.
* [x] Include realm room, lift stop, and puzzle flags in `web/js/issue-report.js` reports.
* [x] Tag existing `::win` trace scenarios `@win` and maximum-score assertions `@maxscore` (tags only; no `::win` logic change).
* [x] Write `upsidedown-realm.feature`: locker entry and return, discovery award once, named flight into and out of the realm, map floor shown.
* [x] Add the realm entry to `web/README.md` commands and a new `web/DESIGN.md` §12.36 realm section.

## Acceptance

* `cd web && npm test -- --tags "not @win and not @maxscore"` exit 0. Stubs load; the game is unchanged outside the gallery.
* Tests and docs land in the same commits as the code they cover.

## Decisions

* D-L2-01: Realm rooms opt out of random package/lightning teleports so adding the
  optional realm does not alter existing deterministic teleport destinations.
  Named flight remains entirely generic (D10).

<!-- end 2026-11-07_plan_done_DoomsdayClock_Lane2-RealmHub.md -->
