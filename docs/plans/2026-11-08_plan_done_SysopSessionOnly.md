<!-- 2026-11-08_plan_done_SysopSessionOnly.md. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.004:acoven. -->

# Sysop Session Only: master orchestration

Status: done. Merged as PR #12.

## Stated goals

* G1:Relock: AndrewC: "when i restart or reload the app it looks like i can do ::win without putting in my pw, maybe reset that more aggressively". Every reload and every RESTART (Part I or II), in the text game and the 2D view, must ask for the sysop password again.

## Root cause

* The unlock was remembered in localStorage (`blackwood-sysop-menu-unlocked-v1`, legacy `blackwood-magic-menu-unlocked-v1`) and the text-game gate also trusted the saved `sysopMenuUnlocked` game flag, which reload restores.

## Todos

* [x] T1: `web/js/ui.js` and `web/view2d/tilemap.html` keep the unlock in page memory only; boot wipes both legacy keys; RESTART re-locks; the gate ignores the saved flag (which still sizes the 100-slot BACKPACK).
* [x] T2: the one-shot text/2D mode handoff carries the unlock so switching modes is not a reload.
* [x] T3: regression scenario in `sysop-menu.feature`; README and DESIGN wording.
* [x] T4: content stamp, full suite, headless reload check, ARCH/QUALITY/PROCESS triad plus one fix pass.
* [x] T5: PR (reviewer `none`), CI `web-tests`, merge, Pages verify, reload notice.

<!-- end 2026-11-08_plan_done_SysopSessionOnly.md -->
