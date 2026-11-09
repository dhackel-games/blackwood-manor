<!-- 2026-11-08_plan_done_WinNoReadDrawing.md. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.007:acoven. -->

# ::win skips reading the drawing: master orchestration

Status: done on branch `fix/win-no-read-drawing`.

## Stated goals

* G1:NoPointlessSteps: AndrewC: "dont read drawing if it doesnt give any points since you already know what to do". READ DRAWING scores 0 (kidsDrawing has no scoring use).

## Todos

* [x] T1: drop `read drawing` from `::win` (`web/js/sysop-menu.js`) and the planner (`web/tools/route-plan.mjs`); `::win` is 200 steps, 68 transitions, 1236/1236; lift-wait fixture sequence and DESIGN metrics updated.

<!-- end 2026-11-08_plan_done_WinNoReadDrawing.md -->
