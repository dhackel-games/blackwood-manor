<!-- 0001-chapter-2-narrative-continuity.md. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-21.108:acoven. -->

# Chapter 2 — Narrative continuity (playtest feedback + options)

> **CORRECTION 2026-09-21:** The required set remains thirteen. The +20 slot
> belongs to the BLACKWOOD FAMILY RING in the HALL BEDROOM night-table drawer.
> BELFRY bats still drop BM-marked XRAY GOGGLES, but the goggles are
> non-heirloom EYES equipment. The non-heirloom BM WATCH waits inside the
> STUDY desk drawer beneath the leather-bound diary and retains the retired Bat Sight Mirror's
> room/object `SHOW`/`SCRY` and route behavior. Its empty mirror face behaves
> like a crystal ball worn on the wrist. A BM-marked BLACKWOOD HAMMER holds the +12 heirloom role
> between the walls. The old candlestick is now the sole portable CANDLE;
> together with the removable HALL BEDROOM MIRROR SHARD, it restores the +10
> DINING ROOM CANDELABRA. Completing that restoration awards a separate,
> non-farmable +20 puzzle bonus.
>
> **➡️ UPDATE 2026-09-14 — see [`0002-thirteen-hour-clock-and-ouroboros.md`](./0002-thirteen-hour-clock-and-ouroboros.md).**
> Major evolution of this doc: the **13-hour clock**, a reworked **BM1 ending** (ring →
> heirlooms vanish + clock appears + front door opens; **walk out = win**, **leave with the
> talisman = extra points**, **use the talisman in the reliquary = down to Gary = phase 2**),
> and **BM2 as a 13-time-period ouroboros** (scatter each heirloom in time; at clock 13→1 you
> *become* Gary). 0002 resolves several open dials below (incl. the "two candidate BM2 designs"
> and the presentation lean). Read 0002 for the current direction.

- **Status:** **scatter + Ravenblood framing, BM2=sequel, reliquary=prison, tone=tragic-but-funny,
  Gary=disowned-heir-in-self-preservation (completing the rite kills him) all RATIFIED
  (2026-09-13).** BM2 = the SEQUEL documented in `web/DESIGN.md` §12.30 (you = the HELD tenant
  working Gary's phone line; **Gary = free-roaming ghost saboteur**) — see "BM2 premise & roles"
  below. **One open dial:** **BM2 gameplay/presentation** — David's lean is an **8-bit room you
  stand in + a video screen showing the whole castle**.
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
  grounds (family ring, crest, spyglass, protective charm, music box, …). The
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

## Backstory synthesis — the "guardian / scattered-ritual" theory (working direction, 2026-09-13)

This is the direction David + the canon are converging on. It's built entirely from
things already in the shipped game, so it needs **no bm1 mechanics changes** (maybe 1–2
optional flavor lines).

### What the shipped game already establishes (canon we can lean on)

- **bm1 completion literally frees Gary.** The secret "true ending" (`world.js`
  `garyEnding`): once all 13 heirlooms are in the reliquary, a trapdoor opens; you go DOWN
  into Gary's call-cave; Gary — *"You actually FINISHED it. Do you have any idea what that
  means for me?"* — clubs you with the phone receiver, grabs your heirlooms, and bolts
  screaming **"FREEEEDOMMM!"** Title card: **"TO BE CONTINUED in BLACKWOOD MANOR II: HELD —
  you leave as its newest tenant."** So **yes: completing the collection releases Gary and
  binds the player as the new tenant/guardian.** (This is the bonk → wake-as-Gary hand-off.)
- **The bell ending:** gathering + sealing + ringing "shatters the curse of Blackwood" and
  raises a BONE KEY + opens a SECRET DOOR. The ritual is a real, load-bearing device.
- **The "bigger evil" is already named in the loot.** Two of the 13 heirlooms are a
  **GRIMOIRE** (spellbook) and a **RAVENBLOOD SIGNET** — i.e. the Blackwoods are the
  **Ravenblood line, practitioners.** The 13 heirlooms read naturally as **components of a
  ritual/working** ("Voltron"), not just valuables.
- **The 13 are scattered into the deadliest, most hidden rooms:** spyglass→tree fort,
  family ring→Hall Bedroom drawer, crest→Dreadmaw's vault, grimoire→secret chamber,
  talisman→a locked safe, music box→nursery, Ravenblood Ring→jewelry box, locket→crypt,
  decanter→wine cellar, portrait→attic, Blackwood hammer→the space-between-walls,
  restored candelabra→dining room, coin→well. This is a **deliberate hide-so-none-reassemble
  pattern**, which is exactly why bm1 is a dangerous dungeon crawl to recover them.

### The theory (spine)

1. The Blackwoods (Ravenblood line) were the **bigger evil** — practitioners assembling a
   ritual/weapon whose components are the 13 heirlooms. Completed, the pieces **combine**
   ("Voltron") into something that would have consumed the town.
2. **Gary — the DISOWNED HEIR who tried to do the right thing — killed them to stop the
   working** and **scattered the 13 pieces** into the manor's most inaccessible/lethal corners
   so they could never be recombined. (This answers David's #3: *the items are where they are
   because Gary hid them there.*) He started **noble**; the curse and centuries alone eroded it.
3. For that act, the manor's curse **chained Gary as its guardian** — trapped, unable to
   leave, reduced to working a hint-line phone in a basement call-cave.
4. **A guardian can only be freed by getting someone else to re-complete the ritual**
   (re-gather all 13 into the reliquary, seal, ring) — which **transfers the binding.** So
   Gary "helps" every looter who wanders in (the hint line) **not out of kindness but to
   recruit his replacement.** When bm1's player finishes, Gary escapes and the player
   becomes the new tenant/guardian — "HELD."
   - **This resolves the daughter's continuity problem exactly:** helpful-Gary and
     murderer-Gary are the same motive — *get free.* He helped in bm1 to escape; he killed
     in the past to stop the ritual (and got cursed for it). No character flip.

> **RATIFIED 2026-09-13 (David):** the *deliberate-scatter* reading and the
> *Ravenblood-line / heirlooms-are-ritual-components* framing are locked as working canon.
> ("That's not random decoration — it reads as deliberately scattered so no one could
> quickly reassemble them… the Blackwoods were the Ravenblood line, practitioners. The
> heirlooms are ritual components.")
>
> **RATIFIED 2026-09-13 (David, round 2):**
> - **BM2 is a SEQUEL** — you play through bm1 first, *then* bm2 (you = the HELD tenant). The
>   "play-Gary prequel" is demoted to backstory/flashback.
> - **Reliquary = CONTAINMENT / PRISON (Idea A).** It does **not** destroy the heirlooms;
>   **ringing the bell imprisons them** (permanent binding). Idea C (unmaking/forge) is out.
> - **Tone = tragic BUT funny** — Gary stays a tragic figure, in bm1's comedic-gothic voice;
>   not a cartoon villain (Idea D's pure-villain read is out as the main line).
>
> **Still open:** **BM2 gameplay/presentation** — David's current lean is an **8-bit room you
> stand in with a video screen showing the whole castle** (see BM2 premise section).
>
> **RATIFIED 2026-09-13 (David, round 3):**
> - **Gary = the DISOWNED HEIR who originally tried to do the right thing.** He killed the
>   family / scattered the pieces to stop the working — a *heroic* act that got him disowned and
>   cursed as guardian. He started noble; centuries of imprisonment eroded that.
> - **Gary now acts in pure SELF-PRESERVATION because completing the ritual KILLS him.** A
>   completed rite = his death. So in bm1 he takes the selfish exit (flees rather than ring the
>   bell) and in bm2 he sabotages the guest — not from malice, but because success is fatal to
>   him. This *resolves* "why Gary profits when you fail": your failure keeps him alive.

### The reliquary paradox — why scattering AND gathering are both anti-weapon (idea menu)

Open problem: if Gary scattered the pieces to keep them apart, why does he help the bm1
player pull them all *back together* into the reliquary? Resolution hinges on **"together"
having two meanings** — loose-and-together = an *assemblable bomb*; sealed-in-the-reliquary
= *inert prison*. Canon pointer: the bell ending says *"the curse of Blackwood shatters like
dropped glass,"* so the reliquary **breaks** something — it is **not** an assembly altar.

- **Idea A — Reliquary = PRISON (lead).** Scattering was a leaky **stopgap**; the reliquary
  seal (doors closed + bell) is the *permanent* containment, and **only a living hand can
  perform it** (a dead/cursed guardian can't). So Gary lures a living soul to finish the
  true binding. He *does* want them together — but only where they're safe.
- **Idea B — Two rituals, same 13 pieces.** The **grimoire** = the family's *assembly rite*
  (builds the weapon); the **reliquary + bell** = the *counter-rite* (seals/unmakes it).
  Both scattering and reliquary-gathering are anti-weapon. (Explains why the grimoire and
  ravenblood signet are themselves two of the 13.)
- **Idea C — Reliquary CHANGES them (unmaking/forge).** The vault + bell **disenchants** the
  pieces — the literal "curse shatters." Gary couldn't reach the reliquary himself, so he
  hid them and waits for someone to bring them to be un-made. Tightest fit to canon wording.
- **Idea D — Dark twist: gathering FREES the evil, and Gary tricks you.** Completing the set
  actually **releases** the bound thing (or *is* the weapon's birth); the guardian rides its
  coattails out — hence Gary's glee (*"do you know what this MEANS for me?"*) while you're
  **HELD.** Requires Gary's **moral fall**: he scattered them to save everyone, but after an
  eternity chained he'll now doom the world just to escape. Best horror gut-punch (very
  Widow's Bay), but makes Gary a villain rather than a tragic helper.

**The rule that dissolves the paradox under any of A–D:** separate the **two effects** of
finishing the reliquary — (1) **neutralize the weapon** (world-level, genuinely good) and
(2) **rotate the guardian binding** onto whoever completes it (personal, the trap). Gary
helps because #2 frees *him*; the world is saved regardless; the completer just gets stuck.
That makes both the "good" ending and the "you're the new tenant" ending simultaneously true
— and keeps Gary's single motive (*get out*) consistent across both chapters.

**Working lean → RATIFIED 2026-09-13:** **Idea A (reliquary = PRISON)** is the canon function
— gathering + sealing + **ringing the bell imprisons** the heirlooms permanently; it does
**not** destroy/unmake them (Idea C out). **B**'s "grimoire = assembly rite vs reliquary =
counter-binding" still layers on top cleanly. The **two-effects rule** holds (neutralize the
weapon by imprisoning it + rotate the guardian binding). Tone = **tragic but funny** — Idea D's
pure-villain twist is **out** as the main line (could survive only as a hidden/alt ending).

### Ending mechanics — the "unrung bell" (how bm1's shipped endings already encode Idea A)

David's question (2026-09-13): in Idea A the world is only saved if the player *completes*
the rite — but what about the players who don't? The shipped state machine already answers
this cleanly. **Verified canon facts:**

- **Deposit-then-seal-then-ring is a two-step rite.** Depositing all 13 sets `curseLiftable`
  but the doors are still open ("CLOSE them first"); **closing** the reliquary sets
  `reliquarySealed` and the flagstones fold open into a **trapdoor** (`floorDoorOpen`).
- **You can reach Gary with the bell UNRUNG.** `go down` only requires *sealed + trapdoor
  open* — it does **not** check `bellRung`. So descending is literally *"I gathered and
  sealed but never rang."* The rite is left **one toll short.**
- **The bell only tolls over a full, sealed reliquary.** Open or empty, it gives a canon
  **"dull clunk"** / "the heirlooms are not all gathered."
- **Gary robs the vault on his way out.** `garyEnding`: *"YOUR heirlooms already bundled
  under one arm."* And the coda states the incentive outright: **"In BM2, Gary profits when
  you fail."** (`saveBm2Seed` persists the score.)

**The reconciliation (two acts, two masters):**

- **Gather + seal the 13** = *provisionally binds the weapon* **and** *cracks Gary's cage*
  (the trapdoor **is** his prison door opening). This is **release**, not completion.
- **Ring the bell** = the **final lock** — the world-saving completion and the player's clean
  win. Per DESIGN.md §12.30 the "dawn" ending is the full sequence: deposit all 13 → **ring
  bell** → take the **BONE KEY** north through the HOLLOW PASSAGE to the HOLLOW SANCTUM → step
  into the dawn. Ringing is the pivot that opens that path. This is **completion**, not release.
- So **release (cage) and completion (world) are two different acts.** Gary escapes on the
  *first* while sabotaging the *second*: the moment your gathering cracks his cage he bolts
  up, **grabs the pieces** (which empties the vault and **kills the bell — "dull clunk"**),
  **bonks you**, and flees. The toll never happens. → *your failure = Gary's win*, exactly
  as the coda says.

**Why Gary can't/won't just ring it himself** (pick a flavor — all fit canon):

1. **He can't** — the bell answers only a *free, living* hand; a guardian's pull is the
   "dull clunk." (That's *why* he runs a hint line: to lure in someone who *can* do the parts
   he can't.)
2. **He won't** — ringing **locks the pieces away from him forever**; he wants the loot
   (freedom/leverage), so finishing is the last thing he'd do.
3. **He can't have both** — the instant he **takes the pieces**, the vault is empty, so the
   bell has nothing to consecrate ("dull clunk"). **Taking the loot *is* what stops the ring.**

**Consequence = the BM2 premise, for free:** the weapon is left only *provisionally* bound,
its 13 components **loose in the world in Gary's arms**, and you — the newly bound tenant —
**cannot ring a bell over an empty vault.** *That unfinished toll is Blackwood Manor II.*
(And it's why the players who DO ring the bell get the clean "dawn" win — they completed the
world-save before curiosity sent them down the stairs.)

### Where the "Voltron assemble" lives (David's ask)

- **In bm2 as the ticking-clock threat:** the living family is *mid-working*; if they
  finish assembling the heirlooms the weapon wakes. Gary's job across the loop is to **break
  up the set** — get each family member to carry their piece off to the room where it'll be
  hidden, and see that it stays there (often via the member's death) — **before** the family
  can complete the assembly. The climax is a near-assembly you avert.
- Optional bm1 echo: reframe "return them to the reliquary" as *quietly ominous* — the
  hero is unwittingly **re-collecting a weapon**, and the reliquary is a **containment/binding
  vault**, not a trophy case. (Flavor only; no mechanics change.)

### Who is the bm1 protagonist? (David's question)

- **Current canon = a random looter / inheritor** — *"you came to loot a haunted house,"*
  *"whoever inherits this cursed manor."* Not established as family.
- Either reading works for the guardianship-transfer. A **returning Blackwood** would add a
  revenge/bloodline layer (and make "HELD" crueler — you're re-bound to your own family's
  sin), but it's optional and heavier. Recommendation: keep the **random inheritor** default;
  hold the family-member angle as a possible New Game+ / alternate framing.

### Consequences for bm2 design

- The **reverse-reliquary placement puzzle** now has a reason: you're **scattering a ritual**,
  authoring bm1's exact map as the by-product.
- Each **family member = a Kindergarten-style arc** ending in their piece reaching its hiding
  room. The room each piece ends in is motivated (nursery=child, attic=portrait, crypt, the
  safe, the dragon caves as a *dump-it-where-nothing-comes-back* move, etc.).
- **Win/lose:** win = all 13 scattered + family neutralized before the working completes;
  lose = the family finishes assembling (weapon wakes) or dawn/energy runs out → loop resets.

---

## IMPORTANT — there are now TWO candidate BM2 designs (reconcile before building)

> **➡️ RESOLVED in [`0002-thirteen-hour-clock-and-ouroboros.md`](./0002-thirteen-hour-clock-and-ouroboros.md)
> (2026-09-14):** the prequel and the sequel are **fused into one ouroboros** — you scatter the
> 13 heirlooms across **13 time periods** (the prequel verb), and finishing **turns you into
> Gary** for the next tenant's run (the sequel frame). The phone-line sequel of §12.30 is
> superseded by the scatter-in-time loop. The section below is kept for history.

Discovered 2026-09-13: **BM2 is already spec'd in `web/DESIGN.md` §12.30** (and grows from the
Gary hint-line tech in §12.3). That documented BM2 is a **sequel**, not the prequel the
playtest brainstorm drifted toward. Both are viable; they are *different games*:

- **BM2-PREQUEL** (the daughter's pitch / Option B / everything above this line): the **past**.
  You play **Gary**, scatter the ritual, run Kindergarten-style family arcs, and *author* bm1's
  map. Great mechanic; but it's an invented direction.
- **BM2-SEQUEL = the documented canon (DESIGN.md §12.30).** The **present, right after bm1's
  secret ending.** Quote: *"The $0.99/min phone-answering economy — **you working Gary's line
  to buy your freedom**, with inverted scoring — is **BM2 proper**… Gary profits when the
  player fails."* So canon BM2 = **you are the new HELD tenant**, stuck in the call-cave,
  **working Gary's old 1-900 hint line** (§12.3 infra: `onCall`, `nextHint`, `phoneBill`) to
  earn your release.

**Recommendation:** treat the **sequel as BM2 proper** (it's already written + half-built in
engine), and demote the prequel's best bits (scatter puzzle, family arcs) to **origin
backstory / an optional flashback**. The scatter/Ravenblood lore we ratified is the *history*;
the sequel is the *game*.

## BM2 premise & roles — the sequel (David's synthesis, 2026-09-13)

David reconstructed the §12.30 premise from first principles and added the missing antagonist.
Working shape:

- **You (BM2 protagonist) = the new guardian** — the bm1 looter who got HELD. You are *not*
  Gary. You're trapped in the basement, working the phone line.
- **Your goal = get a NEW guest to complete the rite** — come through the manor, gather the 13,
  seal, **ring the bell** — because a *completed* rite is your release. (Per David:
  **completing the ritual = passing away / true rest**, the good exit — versus Gary's selfish
  exit.)
- **Gary = the escaped predecessor, now a free-roaming GHOST antagonist.** He **actively
  thwarts** you: **steals/moves items, feeds the guest bad hints** — a dark inversion of his
  bm1 helpful-ish hint line. This is the literal embodiment of the canon coda **"Gary profits
  when you fail."**
- **Why Gary sabotages (his motive — RATIFIED):** **completing the ritual KILLS him**, so he
  acts in pure **self-preservation**. He started as the **disowned heir who tried to do the
  right thing** (killed the family / scattered the pieces to stop the working) and was cursed
  as guardian for it; centuries of imprisonment eroded the nobility. He took the **selfish
  exit** (grabbed the pieces and fled instead of ringing the bell), so he never passed on —
  a **restless ghost**, not free. A guest completing the rite = **his death**, so he wrecks
  every attempt. This is exactly why *"Gary profits when you fail"* — your failure keeps him
  alive.
- **How the manor is re-stocked:** the departing guardian **re-distributes the 13 pieces back**
  into the manor's deadly corners and disappears — this is the **cycle's reset** and *reuses
  the scatter idea* (now performed by the freed guardian, not the family). Gary did it after
  bm1; you did too if you ever flee. It's why every new guest finds the same dungeon crawl.

### Why this connects cleanly to canon + to what we've built

- **Matches DESIGN.md §12.30 verbatim** (phone line, buy your freedom, inverted scoring, "Gary
  profits when you fail") — David's idea *is* the documented BM2, plus an antagonist.
- **Inverts Gary's arc, not his character:** bm1 = Gary's (self-serving) *helpful* hint line;
  bm2 = your *helpful* hint line vs Gary's *sabotage*. Same phone, flipped polarity.
- **Reuses the spike we already built:** the tile view's **wandering GUEST NPC** = the guest
  you're guiding; the **bait/influence** verbs = your guardian tools; **Gary = a second roaming
  influencer**; the **live engine already wired in** means the guest can really gather/seal/ring.
  The tile view gives §12.30's phone game a **spatial body** it didn't have on paper.

### Open reconciliations for the sequel

- **BM2 presentation — David's current lean (2026-09-13):** a single **8-bit room you occupy**
  (Gary's old call-cave / your cell) **with a video screen on the wall showing the whole
  castle** — you watch the guest move through the manor on that screen and act from your room.
  This is a clean fit: it keeps the §12.30 "stuck in the basement" premise literal, gives the
  tile-view a **diegetic reason to exist** (it's the monitor you're watching), and still lets
  you work the phone line + counter Gary. **Not locked** — needs a small prototype to feel out.
- **Why "Gary profits when you fail" — RESOLVED:** **completing the ritual kills Gary**, so a
  guest's *failure* literally keeps him alive. Pure self-preservation, not spite.
- **World-stakes:** since Gary robbed the vault, the weapon has been only *provisionally* bound
  and its 13 pieces loose ever since. A guest completing bm2's rite is what finally **seals it
  for good** — so bm2 has world-stakes, not just personal ones.

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

**RESOLVED 2026-09-13 (David):** BM2 = **sequel** · reliquary = **containment/prison** (bell
imprisons, doesn't destroy) · tone = **tragic but funny** · **Gary = disowned heir who tried to
do the right thing, now in self-preservation mode because completing the ritual KILLS him.**
Remaining open items below.

- **BM2 gameplay/presentation (the one big open dial).** David's lean: an **8-bit room you
  stand in with a video screen showing the whole castle** — watch the guest on the screen, act
  from your cell, work the phone line, counter Gary. Needs a small prototype to confirm the feel.
- **Minor lore to nail:** why the phone / call-cave specifically became Gary's prison-station,
  and how much of the "disowned heir tried to do right" origin we *show* vs. imply.
- **Does any of this require Chapter-1 edits?** Looks like **no mechanics changes** — at
  most 1–2 optional Gary phone lines; the letter + reliquary + secret ending already carry
  the whole loop.
- **Edge case (optional bm1 tweak):** `go down` → Gary ending doesn't check `bellRung`, so a
  player can *ring the bell (save the world) and still* drop to the "Gary profits when you
  fail" hand-off. If we want the failure-framing airtight, gate the Gary ending on
  `!bellRung` (or have ringing steal/close the trapdoor). Touches the shipped game + its
  383-scenario suite, so only on David's explicit say-so.

---

## Next steps

- [x] Establish a working **backstory + "bigger evil"** — the guardian/scattered-ritual
      synthesis (grounded in the shipped secret ending + grimoire/ravenblood loot).
- [ ] David + Andy **ratify or adjust** the synthesis (esp. Gary's exact relationship to the
      family, and containment-vs-assembly for the reliquary).
- [x] Research **_Kindergarten_** and **_Widow's Bay_** — captured above (loop/phase/
      action-budget mechanics; bloodline-curse + generational-cycle tone).
- [ ] Decide Option A vs B (vs C). Current lean: **A's backstory now + prototype B's
      scatter/placement mechanic.**
- [ ] Prototype the **heirloom-placement (reverse-reliquary)** verb in the tile spike, using
      the live engine's per-room item state; consider a **loop/night frame** and **action
      budget** borrowed from _Kindergarten_.
