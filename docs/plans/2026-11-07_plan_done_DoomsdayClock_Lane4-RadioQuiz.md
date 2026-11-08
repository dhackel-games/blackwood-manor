<!-- 2026-11-07_plan_done_DoomsdayClock_Lane4-RadioQuiz.md. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.002:acoven. -->

# Lane 4: RadioQuiz

Status: done (filename flips to _done_ in a separate post-merge commit per plan_organization). Master: [2026-11-07_plan_done_DoomsdayClock.md](2026-11-07_plan_done_DoomsdayClock.md).

* mod:c55+s80='copilot:gpt-5.6-terra:1M:xhigh'
* Produces: `web/js/upsidedown/radio.js`, `web/js/upsidedown/radio-clues.js`, and `web/tests/features/upsidedown-radio.feature`.
* Not produces: other modules, `::win`, any song lyric.
* Depends on: Lane 2.
* Worktree: orchestrator-assigned absolute path, stated in the spawn brief; first preflight is `pwd` match.
* Operator actions surface: [2026-11-07_plan_done_DoomsdayClock.md#operator-next-actions](2026-11-07_plan_done_DoomsdayClock.md#operator-next-actions) (record/reference only; no numbered lists in chat).

## Tasks

* [x] Write `radio-clues.js`: about 20 real 1980s song titles with exactly 5 clues each (about 100 lines). Every clue is an original, hopelessly literal play-by-play paraphrase of a verse, such as "A fighter pilot will not shut up about one specific dangerous area." Titles only; never reproduce lyrics.
* [x] CABINET RADIO in the AV CLUB DEN: TURN ON or LISTEN starts a round showing one clue and five numbered titles (the answer plus four distinct distractors).
* [x] ANSWER <n> or SAY "<title>" answers; three correct in a row wins; a miss resets the streak and the radio plays the wrong song back in a cracking falsetto (described, never sung lyrics).
* [x] Draw each round from a deterministic PRNG seeded by the persisted `realm:radioSeed` flag; a test step fixes the seed.
* [x] Winning sets `realm:radioWon`, awards +10 once, and swings the cabinet open to reveal the PORTABLE TRANSISTOR RADIO (`pendingHeirloom: true`; scuffed leather case, strap, telescoping antenna).
* [x] Gary hint entries for the radio and the quiz.
* [x] Feature covers a seeded win, streak reset on a miss, the falsetto text, both answer forms, award once, the radio reward, replay without farming, and a data check that every song has exactly 5 clues and every round lists the answer once.
* [x] Record in this lane's Decisions that every clue was written originally and contains no lyric phrase.

## Acceptance

* `cd web && npm test -- --tags "not @win and not @maxscore"` exit 0. QUALITY confirms no reproduced lyrics.
* Tests and docs land in the same commits as the code they cover.

## Decisions

* D-L4-01: All 100 clue lines are the canonical original prose, copied verbatim from the canon's radio catalog; none reproduces a song lyric.

<!-- end 2026-11-07_plan_done_DoomsdayClock_Lane4-RadioQuiz.md -->
