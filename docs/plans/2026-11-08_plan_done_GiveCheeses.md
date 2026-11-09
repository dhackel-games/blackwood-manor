<!-- 2026-11-08_plan_done_GiveCheeses.md. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.008:acoven. -->

# Give Cheeses: master orchestration

Status: done; merged via PR from `fix/give-all-cheeses`.

## Stated goals

* G1:Plural: AndrewC: "give cheeses to dg" feeds all three; "give cheese to dg" feeds one at a time (previously both got you swallowed).
* G2:GrottoName: rename the CHEESE GROTTO after a stinky cheese (AndrewC picked LIVAROT GROTTO; internal id `grotto`).

## Todos

* [x] T1: `web/js/upsidedown/demogorgonzola.js` CHEESE/CHEESES handling; scenario in `upsidedown-demogorgonzola.feature`.
* [x] T2: `::win` and planner use `give cheeses to dg` (198 steps, 1236/1236); DESIGN updated.
* [x] T3: CHEESE GROTTO is now LIVAROT GROTTO (display name, text, hints, docs, 2D roomdata); internal room id is now `grotto` (no save migration, per AndrewC); the "cheese grotto" alias remains.
* [x] T4: stamp, suite, triad, PR, merge.

<!-- end 2026-11-08_plan_done_GiveCheeses.md -->
