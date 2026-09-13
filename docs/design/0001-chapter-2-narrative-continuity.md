# Chapter 2 — Narrative continuity (playtest feedback + options)

- **Status:** exploring (no decision yet)
- **Date:** 2026-09-13
- **Source:** First real external playtest — Andy's daughter (self-described horror-movie
  fan), ~5 minutes with shipped Chapter 1 (Blackwood Manor / "bm1"), reacting to the
  pitch for Chapter 2 ("bm2", the Gary role-reversal spike).
- **Why it matters:** First outside feedback. She independently spotted a real
  motivational-continuity hole between the chapters before we shipped a line of bm2.

---

## The problem she found (the "continuation problem")

Restated:

- **bm1:** Gary (the ghost you reach on the rotary phone) *helps* the player, because
  Gary is himself trapped and wants the curse lifted so he can **escape**.
- **bm2 (as prototyped):** the player *becomes* Gary and the goal reads as
  *"lure/kill everyone."* Killing people does not obviously get Gary out — so his
  motivation flips between chapters with no bridge. Helpful-Gary → murderer-Gary is a
  character discontinuity, not just a mechanics change.

Her verbatim beats:

> "Gary in bm1 is trying to help people because he's trying to escape."
> "It sounds like Gary in bm2 is trying to kill everyone, which wouldn't lead to him
> escaping."

---

## Canon we must respect (from the shipped game)

Any fix has to stay consistent with what bm1 already establishes:

- **The curse & the fix:** the letter states the family's **heirlooms must be returned
  to the RELIQUARY in the Royal Hall — all of them — its doors closed, and the BELL
  rung, or the curse never lifts.** (`world.content.js` letter; `world.js`
  `REQUIRED_FAMILY_ITEM_COUNT = 13`.)
- **The heirlooms:** 13 Blackwood ("BM") family pieces scattered across the manor and
  grounds (family ring, crest, spyglass, protective charm, Woodblack watch, …). The
  reliquary has 13 heirloom-shaped recesses — this placement puzzle is the spine of bm1.
- **Gary:** a comedic ghost who works a foul basement **"Call-Cave"** beneath the Royal
  Hall (green rotary phone, burritos, mini-fridge). Room search text:
  *"Whoever worked down here left in a violent hurry — and took your heirlooms with them."*
  So Gary is tied to the heirlooms and to something violent that already happened.

Key insight: **the heirloom/reliquary loop already exists.** A good Chapter 2 should
*reuse* it, not contradict it.

---

## Her suggestions

1. **Look at the game _Kindergarten_** (Con Man Games). Relevant DNA: a single
   **repeating day** (Groundhog-Day loop that resets the world), dark-comedy tone,
   **multiple solution paths** per objective, and **inventory/puzzle chains that span the
   whole map** and persist across loops. Morally gray "help someone / harm someone" is
   the core verb — a natural fit for a role-reversed Gary.

2. **Widows-Bay / _Lost_-style time-loop / origin story.** *"How did the original
   Blackwood family die?"* Her pitch:
   - Gary **killed them** — for the good of *{something}*.
   - The cycle repeats: either a **brand-new family** arrives, **or** you're thrown
     **back in time and *are* Gary at the beginning, alongside the original family.**
   - Your job: **get the family to drop each heirloom in the exact room it needs to be in
     for bm1's puzzle to work** — literally *placing the puzzle pieces* that the bm1
     player later has to collect.
   - **But you also have to kill them.** So the "bigger evil" needs to be worked out:
     maybe the family were **vampires** who'd have slaughtered everyone else, so Gary
     killing them is protective. Maybe the **heirlooms combine into a mega-weapon.**

---

## Reference research (2026-09-13)

### _Widow's Bay_ (Apple TV, 2026) — supernatural mystery-comedy, folk horror

Premise: a widower mayor tries to revive a remote New England island town and collides
with a **centuries-old curse tied to the island's founding bloodline that requires ongoing
sacrifices** to appease the forces protecting/menacing the town. Tone is horror + comedy +
small-town satire ("Parks and Rec meets Midnight Mass," Stephen-King coastal). Motifs:
cursed fog, haunted inn, **ancient bells ringing**, vengeful spirits, a traumatic
**generational cycle** the characters try to break.

**Why the daughter name-checked it — and why it fits BM:**
- **Bloodline curse + required ritual** ≈ Blackwood's curse that only lifts when the
  family's 13 heirlooms are returned to the reliquary and the **BELL is rung.** BM already
  has the "ancient bell" and "founding-family curse" beats.
- **Generational cycle, not a literal sci-fi time loop.** The show repeats via history/
  supernatural means, not a Groundhog-Day mechanic. That's a useful distinction for us:
  the daughter's "thrown back in time as Gary" can be framed as a **cursed re-enactment /
  the cycle repeating**, which is more on-genre than hard time travel.
- **Tone target confirmed.** Horror-comedy that plays curse dread straight while staying
  funny — exactly BM's register (Gary's burritos + "regert" note over real gothic menace).

### _Kindergarten_ (Con Man Games, 2017) — dark-comedy time-loop puzzler

Structure worth stealing (cutesy **pixel** art hiding gleeful cartoon violence — same
tonal trick as our 8-bit tile view):
- **Repeating day as the core frame.** One Monday relived over and over, split into fixed
  **phases** (School Yard → Morning → Lunch → Recess → Show & Tell). Choices in a phase
  change later phases and unlock new routes.
- **Branching, mutually-exclusive missions.** Each loop you can only complete some
  objectives; finishing an arc grants items/knowledge that unlock others next loop. This
  is what creates replay — you *must* re-run with new info.
- **Action-point economy ("Apples").** A hard per-phase budget on how many actions you can
  take, forcing planning and prioritization.
- **Cross-loop inventory puzzles.** Gather/trade/combine items (Money, Nugget, Key Mold, …)
  across runs; some combinations only become possible after learning something in another
  arc.

**Mechanics this suggests for bm2:**
- A **loop/day frame** ("one night," reset on failure/dawn) instead of a single linear run
  — turns "you have to place 13 heirlooms *and* deal with the family" into a learnable,
  replayable puzzle rather than one brittle sequence.
- An **action budget per phase** (Gary's haunting energy?) as the pacing/tension knob.
- **Heirloom placement as the cross-loop inventory puzzle:** figure out, over several
  loops, which family member must carry/drop which heirloom in which room so bm1's map ends
  up correctly "authored."
- **Mutually-exclusive family arcs** (befriend/scare/eliminate each Blackwood) so no single
  loop solves everything — matching Kindergarten's replay engine.

Sources: Widow's Bay — Apple TV coverage/reviews; Kindergarten — Steam, developer
postmortem (Game Developer), community wiki.

---

## Why this is strong (it closes the loop instead of bolting on a sequel)

If Gary killed the family **for a reason** and was **cursed for it**, then:

- **Motivation is continuous.** Gary in bm1 helps the inheritor because completing the
  reliquary ritual is *the only thing that frees him from the punishment for the killing.*
  He's "annoyed but helpful-ish" (David's phrasing) — a guy paying off an eternal debt.
- **The killing stops being gratuitous.** It becomes a tragic/justified act ("bigger
  evil"), so player-as-Gary killing the family reads as *stopping something worse*, not
  senseless murder — which was exactly the daughter's objection.
- **bm2 reuses bm1's mechanics inverted.** bm1 = *gather* 13 heirlooms *into* the
  reliquary. bm2 = *distribute* the same 13 heirlooms *into the rooms where bm1 will find
  them*, while managing/eliminating the family. Same objects, mirrored verb. The spike's
  tile view + live engine (`game.itemsIn(room)`) already tracks item-in-room state, so
  this is buildable on what we have.

---

## Options to resolve the continuity (scoped by blast radius)

Leaning: **most work lands in Chapter 2**; Chapter 1 needs at most small reframing lines.

- **Option A — Backstory-only (smallest, Chapter 2 only).**
  Keep bm2 as "become Gary," but reframe the *goal* from "kill everyone" to
  **"do what you were damned for"**: neutralize the family-as-bigger-evil *and* set the
  heirlooms in place. No time-travel framing; bm2 is a flashback/origin. bm1 unchanged;
  optionally add one or two lines to Gary's phone dialog hinting he's serving a sentence.

- **Option B — Time-loop / prequel (her full pitch, Chapter 2 heavy).**
  bm2 = you're Gary at the beginning, with the living Blackwood family. Dual objective:
  (1) **stage the heirlooms** into their bm1 rooms (a placement puzzle that literally
  authors bm1's map), (2) **remove the family** because of the bigger evil. Ends by
  sealing Gary into the curse the bm1 player later encounters. Requires defining the
  "bigger evil" and family AI/schedules (Kindergarten-style). Chapter 1 stays canon;
  its existing letter/reliquary become the "prophecy" the prequel fulfills.

- **Option C — Recut Gary's whole arc (largest; touches Chapter 1).**
  Rewrite bm1 Gary dialog to plant the origin explicitly (he confesses he killed them to
  stop the {evil}), making bm2 a straight continuation. Highest narrative cohesion,
  highest risk — bm1 is shipped and has a 383-scenario test suite, so text changes must
  not break walkthrough expectations.

**Recommendation to discuss:** start with **Option A's backstory** as the connective
tissue (cheap, unblocks writing), and prototype **Option B's heirloom-placement mechanic**
in the existing tile spike (it's the fun, novel verb and reuses our live-engine wiring).
Fall back to Chapter-1 line tweaks (Option C) only if playtests say the setup isn't landing.

---

## Open questions (to think about / bring to Andy)

- **Gary's backstory — the big one.** Who was Gary to the Blackwoods (servant?
  groundskeeper? the family's own black sheep — "Gary Blackwood"?)? Why him? David's ask:
  *"What is his backstory?"*
- **What is the "bigger evil"?** Vampires? A ritual the family was about to complete? Do
  the **13 heirlooms combine into a mega-weapon** (which is *why* they must be scattered/
  contained rather than assembled)? That would make bm1's "return them to the reliquary"
  quietly ominous — reassembling the weapon.
- **Who's the bm2 protagonist-victim relationship?** Brand-new family vs. time-travel to
  the original family. The original-family version is stronger (it authors bm1) but harder.
- **Tone calibration.** _Kindergarten_ is dark-comedy; bm1 is comedic-gothic (Gary's
  burritos, "regert"). Keep bm2 morally gray but funny, or let it go darker as the origin?
- **Does any of this require Chapter-1 edits?** Likely only optional Gary phone lines; the
  letter + reliquary already support the "scatter/collect heirlooms" symmetry.

---

## Next steps

- [ ] David + Andy settle **Gary's backstory** and **the bigger evil** (unblocks everything).
- [x] Research **_Kindergarten_** and **_Widow's Bay_** — captured above (loop/phase/
      action-budget mechanics; bloodline-curse + generational-cycle tone).
- [ ] Decide Option A vs B (vs C) once backstory exists.
- [ ] If B: prototype the **heirloom-placement (reverse-reliquary)** verb in the tile spike,
      using the live engine's per-room item state; consider a **loop/day frame** and
      **action budget** borrowed from _Kindergarten_.
