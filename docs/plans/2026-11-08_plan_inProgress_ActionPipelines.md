<!-- 2026-11-08_plan_inProgress_ActionPipelines.md. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.001:acoven. -->

# Action Pipelines: master orchestration

Status: inProgress. Follow-up to the released [Doomsday Clock master](2026-11-07_plan_done_DoomsdayClock.md), driven by AndrewC's 2026-11-08 playtest notes on `::win` and verbs.

## Current status

* Code complete on branch `fix/sysop-divad`: 768/768 scenarios pass; `::win` is 222 steps (was 232), 68 walking transitions, 0 doffs, 0 take-then-use pairs, 1316/1316.
* Todos: 13 done / 17 total (76%); 4 remaining.
* Coding progress: implemented and locally validated; the one pre-push curmudgeon triad, its single fix pass, and the direct push remain.
* Average task duration: UNKNOWN (0 measured tasks).
* Completion ETA: UNKNOWN.
* Next shareable build: content 2026.11.8 build 2 (20261108002) goes live on GitHub Pages and to installed iOS apps by OTA as soon as the branch reaches origin/main and Pages deploys.
* BLOCKERS: EMPTY.

## Stated goals

* G1:NaturalVerbs: commands behave the way a player expects: USE (or POUR, WEAR) on something not yet held takes it first with full pickup credit; TAKE never wears; EXT puts out whatever is burning; short names read naturally (`dg`, `ext`).
* G2:LeanWin: `::win` contains only steps a careful player would type: no redundant takes, looks, doffs, or re-wears.

## Execution contract

* Moved from root `_goal.md` (AndrewC 2026-11-08: "move all that to a plan file"); binding for this master and any follow-up masters.
* Execute every unchecked todo in the active master orchestration in dependency order, and complete all in-scope work in the documents it links. Linked documents are binding.
* Balance delivery speed with the quality the goals and acceptance criteria require; never bypass a required gate, and never over-engineer.
* Deviate from the approved plan only for a critical correctness, safety, or verified-impossibility reason. Record the reason, evidence, and smallest plan change in the active master orchestration before proceeding.
* Every task-related open branch and worktree is part of this goal; the goal is not complete while any remains unresolved.
* Every change receives the one pre-push curmudgeon triad unless AndrewC waives it for that change. AndrewC waived the PR for this batch: it goes directly to origin/main.
* Historical goals G1:Realm, G2:DoomsdayClock, and G3:EfficientWin are complete and recorded in the [Doomsday Clock master](2026-11-07_plan_done_DoomsdayClock.md).

## Tasks

* [x] A. Implicit acquisition runs the full TAKE pipeline: `u obsidian` alone awards the +15 claim, +5 pickup, and +5 use once.
* [x] B. Rope descent while flying uses the ROPE and awards its one-time use; no `doff shoes` before the well.
* [x] C. PUT ALL IN RQ seats worn required heirlooms (rings, TALISMAN once the GOLD LOCKET is recovered); ONE TRIP still awarded.
* [x] D. Regenerate `::win` without redundant take, doff, or re-wear steps.
* [x] E. DEMOGORGONZOLA short name `dg` (`demo` kept as an alias).
* [x] F. `ext` parses as EXTINGUISH and `::win` emits it.
* [x] G. POUR WATER, MILK, or WINE ON SELF and USE JUG ON SELF put out a burning player with the same survival award rules.
* [x] H. INFO reference, sysop descriptions, and README document every new or changed verb.
* [x] I. POUR is equivalent to USE (`pour X on Y` = `use X on Y`).
* [x] J. Bare EXT targets whatever is burning: the player first, then the lit BRAZIER, CAMPFIRE, or CANDLE; nothing burning gives a clear refusal.
* [x] K. The PRIVY opening is `t all; u fresh`; no step is emitted that the next use would derive.
* [x] L. TAKE and TAKE ALL never wear; `u backpack` takes and wears; the auto-wear flag is removed.
* [x] M. `::divad` accepted as a sysop password alongside `::werdna` and `::evad`; content stamped 20261108002.
* [ ] Run the one pre-push ARCH/QUALITY/PROCESS curmudgeon triad on `fix/sysop-divad` and apply every finding in one fix pass.
* [ ] Final validation: full `cd web && npm test` exit 0 on the final head.
* [ ] Push directly to origin/main (PR waived by AndrewC) and verify the Pages deploy serves CONTENT_VERSION 20261108002.
* [ ] Tell AndrewC the build is ready to reload; flip this master to `_done_` in a separate commit.

## Decisions

* D1: Operator PR waiver for this batch (AndrewC 2026-11-08: "perfect thanks please push right to origin/main"); the triad still runs.
* D2: WEAR and DON stay equipment-only verbs; USE remains the contextual superset (pending AndrewC confirmation of a full synonym).

<!-- end 2026-11-08_plan_inProgress_ActionPipelines.md -->
