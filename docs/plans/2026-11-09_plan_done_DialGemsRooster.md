<!-- 2026-11-09_plan_done_DialGemsRooster.md. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-09.002:acoven. -->

# Dial, gems, rooster: master orchestration

Status: done on branch `fix/dial-gems-rooster`.

## Stated goals

* G1:Dial: the projector is a DIAL set 1 to 5 plus a bulb SWITCH you flick; SAY <n> no longer projects.
* G2:NoNextSteps: success and hidden-sight text must not hand the player their next move (Gary hints excepted).
* G3:Gargoyles: roof gargoyles are described once, not twice.
* G4:Rooster: the weathervane carries an iron ROOSTER; the far-gazing gargoyle vows to set it free, breaks the vane off, and turns back to stone.
* G5:Gems: TAKE GEMS / TAKE ALL empties the slots; FILL SLOTS ymc and PUT GEMS IN SLOTS ymc (any reasonable order syntax) work for both panels.

## Todos

* [x] T1: planetarium DIAL/SWITCH items, FLICK/FLIP verbs; Sirius outcome no longer names the brazier route.
* [x] T2: removed next-step text (photo piece D, snuffbox PICK NOSE, bookcase LEVER, radio "yours to take", weathervane "for you to TAKE").
* [x] T3: roof description and search deduped; rooster wording; dedicated freeing text; east pool reworded.
* [x] T4: `web/js/gem-slots.js` shared by both panels; gem-order commas kept in `splitCommands`.
* [x] T5: `::win` drops the zero-point READ BOOK; 191 steps / 1236; planner; tests; DESIGN; stamp; triad; PR; merge.

<!-- end 2026-11-09_plan_done_DialGemsRooster.md -->
