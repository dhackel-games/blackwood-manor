<!-- 2026-11-07_plan_todo_DoomsdayClock_Lane14-ContentRelease.md. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.003:acoven. -->

# Lane 14: ContentRelease

Status: todo. Master: [2026-11-07_plan_todo_DoomsdayClock.md](2026-11-07_plan_todo_DoomsdayClock.md).

* mod:c20+s90='copilot:gpt-6-luna:400K:medium'
* Produces: the content stamp commit, the single PR, and its merge.
* Not produces: source changes.
* Depends on: the single pre-PR triad and its one fix-worker result.
* Worktree: orchestrator-assigned absolute path, stated in the spawn brief; first preflight is `pwd` match.
* Operator actions surface: [2026-11-07_plan_todo_DoomsdayClock.md#operator-next-actions](2026-11-07_plan_todo_DoomsdayClock.md#operator-next-actions) (record/reference only; no numbered lists in chat).

## Tasks

* [x] Run `ios/release-testflight.sh --stamp-only --force-next-build` and commit the content identity before final validation.
* [ ] Final head gate: full `npm test` exit 0 on HEAD; record `validated_final_sha`.
* [ ] Before opening one PR from `wave/doomsday-clock`, confirm the master Closure, AUTODECISIONS, and No new INTs recap are current; then post the exact `@coderabbitai review` comment and follow prreview's bounded lifecycle.
* [ ] Merge with a merge commit; verify server MERGED; Pages deploy succeeds; cleanup removes branch and worktree residue.
* [ ] Update master status; flip completed plan filenames to `_done_` in a separate commit.

## Acceptance

* PR MERGED with readback; `web/versions.json` CONTENT_VERSION increased; Pages run green.
* Tests and docs land in the same commits as the code they cover.

## Decisions

* Release policy (master D34): all code, including the two completed local main commits, pushes only when the whole effort is done; plan docs may be pushed earlier.

<!-- end 2026-11-07_plan_todo_DoomsdayClock_Lane14-ContentRelease.md -->
