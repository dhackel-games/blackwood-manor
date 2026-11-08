<!-- 2026-11-08_plan_inProgress_GargoylePayoffs.md. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.003:acoven. -->

# Gargoyle Payoffs: master orchestration

Status: in progress on branch `fix/gargoyle-payoffs`.

## Stated goals

* G1:Foreshadow: the NORTH, WEST, and SOUTH gargoyle descriptions end with what is about to happen ("about to burp", dreading a fart, "as if trying to hold back a poop explosion").
* G2:Payoff: turning the vane at a gargoyle explicitly plays it out: it comes to life, burps / farts / sharts on the player, apologizes, and turns back to stone (AndrewC: "it comes to life and sharts magnificently splattering you, then apologizes and turns back to stone").

## Todos

* [x] T1: foreshadow endings on gargoyle `desc`, `roomDesc`, and roof `searchDesc` (`web/js/manor/weathervane.js`).
* [x] T2: rewrite all 36 pool lines; drop stale "silver vane" text; hint uses direction form.
* [x] T3: feature assertions plus a pool-wide scenario that every line comes to life, acts, apologizes, and returns to stone.
* [x] T4: DESIGN §12.37.2.
* [ ] T5: content stamp, full suite, ARCH/QUALITY/PROCESS triad plus one fix pass.
* [ ] T6: PR (reviewer `none`), CI `web-tests`, merge, Pages verify, reload notice.

<!-- end 2026-11-08_plan_inProgress_GargoylePayoffs.md -->
