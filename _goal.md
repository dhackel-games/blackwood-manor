<!-- _goal.md. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.002:acoven. -->

# Goal

Active master orchestration: [docs/plans/2026-11-07_plan_todo_DoomsdayClock.md](docs/plans/2026-11-07_plan_todo_DoomsdayClock.md). Root pointer: [_orch.md](_orch.md).

* G1:Realm: a Stranger Things and Narnia parody realm, THE UPSIDE DOWN, behind a MINERS' LOCKER, with four classic adventure puzzles (DEMOGORGONZOLA, RADIO QUIZ, PLANETARIUM, SHACK), six heirlooms, and a root-gate return through the GREAT OAK lift.
* G2:DoomsdayClock: 24 required heirlooms (13 existing, 5 new manor, 6 realm) forming a 24-hour DOOMSDAY CLOCK, with fair save migration.
* G3:EfficientWin: `::win` gathers gear once, walks everything, uses items on arrival, and deposits all 24 heirlooms with one PUT ALL IN RQ.

## Execution contract

* Execute every unchecked todo in the active master orchestration in dependency order, and complete all in-scope work in the documents it links. Linked documents are binding.
* Do not touch `::win` until every Phase A lane is complete and validated (AndrewC: "dont do anything with ::win yet until we build the new section.").
* Balance delivery speed with the quality the goals and acceptance criteria require; never bypass a required gate, and never over-engineer.
* Deviate from the approved plan only for a critical correctness, safety, or verified-impossibility reason. Record the reason, evidence, and smallest plan change in the active master orchestration before proceeding.
* Every task-related open branch and worktree is part of this goal. Complete and push each through `prreview`; the goal is not complete while any remains unresolved.

<!-- end _goal.md -->
