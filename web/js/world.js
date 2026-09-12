// world.js — ALL CONTENT for Blackwood Manor.
// This is the ONLY file you edit to expand the game. The engine (core/parser/
// commands) never needs to change. See README.md for the "how to add a room" guide.
//
// Handler API (ctx) available inside on:{ verb(ctx, cmd) } functions:
//   ctx.print via return value      ctx.getFlag(f) / ctx.setFlag(f,[v])
//   ctx.has(id) (in inventory)      ctx.here(id) (in current room)
//   ctx.item(id) -> live item       ctx.roomOf(id) -> location
//   ctx.itemsIn(loc) / ctx.inventory() / ctx.find(phrase[,scope])
//   ctx.moveItem(id,to) / ctx.destroy(id)
//   ctx.addScore(n) / ctx.kill(msg) / ctx.win(msg) / ctx.describeRoom()
// A handler that returns a string intercepts the default verb; returning null/
// undefined lets the default behaviour run.

import { MAP_MARK, renderMap } from "./map.js";

// ---- helpers used by handlers ------------------------------------------------
function allTreasuresDeposited(ctx) {
  return Object.entries(ctx.world.items)
    .filter(([, d]) => d.treasure)
    .every(([id]) => ctx.roomOf(id) === "reliquary");
}

// --- The Blackwood Manor Hint Line (1-900-BLACKWOOD, 99c/min) -----------------
// Gary: underpaid, starving, furious — but his hints are genuinely useful.
// Returns the single most relevant next-step hint for the current game state.
function nextHint(ctx) {
  const dep = (id) => ctx.roomOf(id) === "reliquary";
  const inside = ctx.getFlag("frontDoorOpen");
  const candle = ctx.item("candlestick");
  const lit = candle && candle.lit;

  if (!inside) {
    if (ctx.getFlag("statueMoved") || ctx.has("frontKey") || ctx.roomOf("frontKey") === "garden") {
      return "You've got the iron key — or it's sitting right there in the garden. TAKE it, go to the PORCH, then UNLOCK DOOR WITH IRON KEY, OPEN DOOR, and go NORTH. That's the entire trick.";
    }
    return "The front door's locked, shocker. Some genius buried the key under that leaning STATUE in the garden. MOVE the statue, grab the key, then unlock the front door. In you go. Riveting.";
  }
  if (!lit) {
    if (ctx.roomOf("matches") === null) {
      return "You burned your only match already, didn't you. DIDN'T YOU. The CANDLESTICK is still in the DINING ROOM, " +
        "but without that match it is now an extremely expensive paperweight. Next time don't waste the match, pal.";
    }
    return "You want to survive downstairs? TAKE the CANDLESTICK (dining room) and the MATCHES (kitchen), then LIGHT CANDLE. You get exactly ONE match. Try to rise to the occasion.";
  }
  if (!dep("rubyRing")) {
    return "Ruby ring's locked in a jewelry box in the MASTER BEDROOM. The little key's inside the MUSIC BOX in the NURSERY — OPEN the music box, take the tiny key, then UNLOCK JEWELRY BOX WITH TINY KEY.";
  }
  if (!dep("musicBox")) {
    return "Don't leave the JEWELED MUSIC BOX behind — the box ITSELF is a Blackwood heirloom, not just the tiny key's shell. Once you've got the tiny key out, TAKE the music box and PUT it in the RELIQUARY too.";
  }
  if (!dep("ancientCoin")) {
    return ctx.has("rope")
      ? "You've got the rope, congratulations. Go to the garden and ENTER WELL — or just go DOWN. Coin's at the bottom. Try not to end up down there permanently."
      : "There's a coin down the garden WELL. Go down without a ROPE and you SPLATTER — dead, instantly, no do-overs. There's a rope in the KITCHEN. Get it FIRST. I cannot stress this enough.";
  }
  if (!dep("grimoire")) {
    return "In the LIBRARY there's a brass LEVER where a book should be. PULL it — a bookcase swings open onto a stair DOWN to a hidden chamber. The grimoire's there. Bring your lit candle; it's black as pitch.";
  }
  if (!dep("crystalDecanter")) {
    return "Crystal decanter's in the WINE CELLAR. OPEN the CELLAR trap-door in the KITCHEN, go DOWN. Pitch dark — candle had better be lit or you're a grue's dinner. Unlike me, who has eaten NOTHING.";
  }
  if (!dep("ancestralPortrait")) {
    return "There's an ANCESTRAL PORTRAIT in the ATTIC. PULL the CORD on the LANDING to drop the ladder. But that ladder's rotten — climb it carrying more than a couple things and you crash through and DIE. DROP your junk on the landing first.";
  }
  if (!dep("goldLocket")) {
    return "The gold locket's in the CRYPT, past the WINE CELLAR — guarded by a WRAITH that kills you on sight. So: READ the DIARY in the STUDY for the safe combo, MOVE the PROFILE PAINTING in the PARLOR, OPEN the SAFE, take the TALISMAN, WEAR it, THEN walk into the CRYPT. In that order. Write it down.";
  }
  if (!dep("candlestick")) {
    return "Home stretch. Once every dark room's cleared, the candlestick itself is a treasure — PUT it in the RELIQUARY last. You won't need light in the lit hall.";
  }
  if (!allTreasuresDeposited(ctx)) {
    return "You've FOUND the loot — now actually PUT each heirloom in the RELIQUARY in the grand hall. They're worth nothing rattling around in your pockets.";
  }
  return "Everything's in the reliquary. RING THE BELL in the hall. And then — I mean this warmly — never call me again.";
}

// Random hunger interruptions — Gary is starving and keeps getting distracted.
// Spliced into the MIDDLE of a hint (~45% of calls) so the real advice still lands.
const HUNGER = [
  "*stomach growls, loud and mournful, right into the receiver*",
  "— hang on, someone left half a sandwich in the break room — ...no. That's a stapler. Cruel.",
  "— sorry, what was I— DENISE did you order pizza? ...no? Okay. Okay. Where was I.",
  "*chewing something that is very much not food* ...mm. Anyway.",
  "— gimme a sec, I'm gonna gnaw on this pencil, it's the closest thing to a meal I've got —",
  "— the vending machine ate my last quarter and the B4 is STUCK. I can SEE the chips. I can SEE them —",
  "*distant microwave beeping* THAT IS NOT MINE. Someone's Hot Pocket is done and it is NOT MINE. Ahem.",
  "— hold on, is that— *sniff* — no, that's the printer toner. I'd eat it. I won't. But I'd think about it.",
];

function injectHunger(hint) {
  if (Math.random() > 0.45) return hint; // ~45% of the time he loses it
  const aside = HUNGER[Math.floor(Math.random() * HUNGER.length)];
  const idx = hint.indexOf(". ");
  if (idx === -1) return hint + "\n\n" + aside;
  // Splice the hunger aside between the first sentence and the rest of the hint.
  return hint.slice(0, idx + 1) + "\n\n" + aside + "\n\n...right. " + hint.slice(idx + 2);
}

// Grumpy greeting variants when you first dial in.
const INTROS = [
  "*click* Blackwood Manor Hint Line, ninety-nine cents a minute, this is Gary, what.",
  "Yeah — Gary again. I can see it's the same number calling back, you know.",
  "*chewing* ...hrmf. Hint Line. Gary. Make it fast, my Hot Pocket's going cold.",
  "Oh good, it's you. My favorite caller. That was sarcasm. Whaddya want.",
  "Gary. I've been on this headset since noon and eaten one (1) vending-machine Danish.",
  "*muffled* — I'M ON A CALL, DENISE — ...yeah. Hint Line. Go ahead. Thrill me.",
];
const DEFLECT = [
  "I don't know what that means, and frankly I lack the energy to care.",
  "Is that a question? It sounded like a question. I'm choosing to ignore it.",
  "Pal, I answer a phone in the dark for pennies. I'm not a philosopher.",
  "*static* ...what? Sorry, I was thinking about lunch. I'm always thinking about lunch.",
  "Cool. Riveting. Anyway.",
];
const SIGNOFF = [
  "Finally.",
  "Yeah, yeah — don't call back.",
  "Oh thank GOD.",
  "Go. Be free. Leave me to my hunger.",
  "Great talk. Truly. *an eye-roll you can somehow hear*",
];

function bumpBill(ctx) { ctx.setFlag("phoneBill", (ctx.getFlag("phoneBill") || 0) + 99); }
function meter(ctx) { return "Meter's at $" + (((ctx.getFlag("phoneBill") || 0)) / 100).toFixed(2) + "."; }

// Gary needles you as the bill climbs — each milestone fires once.
const BILL_MILESTONES = [
  [500, "...that's five bucks, by the way. Five. On a hint line. In this economy."],
  [1000, "Ten dollars. TEN. You could've bought me lunch. SEVERAL lunches. But no."],
  [2000, "Twenty bucks — you're officially my biggest caller today. Congratulations, I guess."],
  [3500, "Thirty-five dollars. That's a whole hour of my wages, you magnificent disaster."],
  [5000, "Fifty. DOLLARS. You are, without question, the worst caller I have ever had. I'm weirdly proud. Now HANG UP."],
];
function billAside(ctx) {
  const bill = ctx.getFlag("phoneBill") || 0;
  let tier = ctx.getFlag("billTier") || 0;
  let msg = "";
  for (let i = 0; i < BILL_MILESTONES.length; i++) {
    if (bill >= BILL_MILESTONES[i][0] && i + 1 > tier) { msg = BILL_MILESTONES[i][1]; tier = i + 1; }
  }
  ctx.setFlag("billTier", tier);
  return msg ? "\n\n" + msg : "";
}

// Hall-of-shame rank for the end screen, based on total phone bill (cents).
function phoneRank(cents) {
  const d = "$" + (cents / 100).toFixed(2);
  if (cents >= 5000) return `\nHall of Shame: "Gary's Worst Caller of All Time" (${d}). He'll be telling this story for years.`;
  if (cents >= 3000) return `\nHall of Shame: "Single-Handedly Funding the Hint Line" (${d}).`;
  if (cents >= 1500) return `\nHall of Shame: "Gary's Best Customer" (${d}).`;
  if (cents >= 500) return `\nHall of Shame: "Chatty" (${d}).`;
  return `\nHall of Shame: "Frugal" (${d}). Gary barely remembers you.`;
}

// ---------- Gary's arc: the Hint Line slowly becomes a therapy line ----------
// Driven by garyXP — every dial-in and every exchange nudges it up.
function bumpXP(ctx) { ctx.setFlag("garyXP", (ctx.getFlag("garyXP") || 0) + 1); }
function garyStage(ctx) {
  const xp = ctx.getFlag("garyXP") || 0;
  if (xp < 4) return 0;   // grumpy hint-line guy
  if (xp < 9) return 1;   // cracking / oversharing
  if (xp < 16) return 2;  // reluctant therapist
  return 3;               // full therapist
}
function stagePick(ctx, arr) { return arr[Math.min(garyStage(ctx), arr.length - 1)]; }
// The mechanical tail appended to every conversational line: the meter, any
// one-shot bill milestone, and the mood aside. Captured here so the optional LLM
// voice layer can replace Gary's WORDS while keeping the tail intact — billAside
// has a one-shot side effect, so dropping it would silently eat a milestone.
let lastSayTail = "";
function say(ctx, arr) {
  const tail = " " + meter(ctx) + billAside(ctx) + garyAside(ctx);
  lastSayTail = tail;
  return stagePick(ctx, arr) + tail;
}

const STAGE_INTROS = [
  INTROS,
  [
    "Blackwood Hint Line, Gary... oh. You again. You know you're the most human contact I get all shift? That's not a compliment. What.",
    "*sigh* Hint Line. Gary. Honestly? Kind of glad it's you. Don't read into that. Whaddya need.",
    "Gary here. Long night. Long life. ...anyway. The house. Right. Go ahead.",
  ],
  [
    "Blackwood Cris— Hint Line. Gary. Sit down. Metaphorically. Tell me what's going on — with the house, and, y'know, in general.",
    "Gary. Deep breath. We'll get to the mansion. First: how are you carrying all this? ...Fine. What do you need.",
    "Hint Line, this is Gary, and I've been thinking a lot about us. Professionally. What's on your mind.",
  ],
  [
    "Blackwood Manor Wellness Line, this is Gary, licensed by absolutely no one. Breathe with me. We'll get to the house. First — how are you, really?",
    "Gary. This is a safe space. Ninety-nine cents a minute, but safe. Tell me everything. Start with the house if it's easier.",
    "Welcome back. I kept your chart. *shuffles a napkin* Now — where were we with your fear of locked doors?",
  ],
];

const THERAPY_ASIDES = [
  "...and how does that make you feel?",
  "Mm. Go on. I'm hearing a lot underneath that.",
  "The house is a metaphor. You know that, right? It's okay if you don't. Yet.",
  "Notice you reached for the answer instead of sitting with the discomfort.",
  "There's no wrong way to feel about a grue. Except denial.",
  "Let's name the feeling. Is it fear — or is it just Tuesday?",
];
function garyAside(ctx) {
  if (Math.random() > 0.4) return "";
  const pool = garyStage(ctx) >= 2 ? THERAPY_ASIDES : HUNGER;
  return "\n\n" + pool[Math.floor(Math.random() * pool.length)];
}

// Is the caller properly lost? Deterministic, never model-decided: if they ask
// for another hint without having scored since the last one, they're spinning.
// Two hints with nothing to show for it and Gary offers the map.
const STUCK_HINTS = 2;
function noteStuck(ctx) {
  const prev = ctx.getFlag("scoreAtLastHint");
  const streak = ctx.getFlag("stuckStreak") || 0;
  ctx.setFlag("stuckStreak", prev === undefined || ctx.state.score > prev ? 0 : streak + 1);
  ctx.setFlag("scoreAtLastHint", ctx.state.score);
  return (ctx.getFlag("stuckStreak") || 0) >= STUCK_HINTS;
}

// Gary's map offer. Once he's mentioned it he doesn't nag about it again.
function mapOffer(ctx) {
  if (ctx.getFlag("usedMap") || ctx.getFlag("mapOffered")) return "";
  ctx.setFlag("mapOffered", true);
  return "\n\nOkay, you're properly lost, aren't you. Look — third shift, nothing to do, " +
    "I sketched the whole house out on the back of a placemat. Type MAP and I'll read it to you. " +
    "It's not pretty. Neither am I.";
}

// Wrap the real hint in stage-appropriate framing — the clue is ALWAYS delivered.
function frameHint(ctx, hint) {
  const stuck = noteStuck(ctx);
  const offer = stuck && !ctx.getFlag("onFire") ? mapOffer(ctx) : "";
  return frameHintText(ctx, hint) + offer;
}

function frameHintText(ctx, hint) {
  switch (garyStage(ctx)) {
    case 0: return injectHunger(hint);
    case 1: return hint + "\n\n(...sorry. Long night. Ignore me.)";
    case 2: return "Sure. The answer: " + hint +
      "\n\nBut notice you came to ME for it. What does needing help stir up in you? We can explore that.";
    default: return "Let's not rush to solutions... okay, okay: " + hint +
      "\n\nThough the thing you're stuck on isn't really about the mansion, is it. We both know that. I'll note it on your chart.";
  }
}

const SIGNOFF_STAGE = [
  SIGNOFF,
  ["Take care of yourself out there. ...I mean it. Weird.",
   "Go on. I'll be here. I'm always here.",
   "Bye. Don't be a stranger. Actually — do. I need the quiet. No. Come back."],
  ["Our time's up for today. Notice how that lands. *click*",
   "You made progress. I answered a phone. We both grew. Bye."],
  ["Session complete. Be gentle with yourself in that house — you're braver than the grue gives you credit for. *click*",
   "Go. The only way out is through. Also, north. *click*"],
];

// Gary comments on your condition the moment he picks up, before anything
// else — he can hear it. Fire has its own full greeting override (below);
// sick/high just get a one-line aside stitched onto the normal intro.
function conditionAside(ctx) {
  if (ctx.getFlag("onFire")) return ""; // fireGreeting takes over entirely
  if ((ctx.getFlag("sick") || 0) > 0)
    return "Oh my GOD — is that BARF I smell? You reek like a dumpster that ate a burrito and " +
      "regretted it, deeply. Please, for both our sakes, find a TOILET.\n\n";
  if ((ctx.getFlag("high") || 0) > 0)
    return "...you're tripping balls right now, aren't you. I can hear it in your voice. Please " +
      "don't pet anything that isn't there.\n\n";
  return "";
}

// First contact when you CALL / DIAL / HINT — greets, gives one real hint, and
// leaves the line OPEN so you can actually talk to him (see hotlineTalk).
function hotline(ctx) {
  const n = (ctx.getFlag("hotlineCalls") || 0) + 1;
  ctx.setFlag("hotlineCalls", n);
  bumpXP(ctx);
  bumpBill(ctx);
  ctx.addScore(-2); // dialing in isn't free, pal
  if (ctx.getFlag("onFire")) return fireGreeting(ctx);
  const aside = conditionAside(ctx);
  const pool = STAGE_INTROS[garyStage(ctx)];
  const intro = pool[(n - 1) % pool.length];
  const tail = garyStage(ctx) >= 2
    ? `(You're in session. Say HINT for a clue, ask Gary anything, or HANG UP. ${meter(ctx)})`
    : `(You're on the line. Ask him things, say HINT for another clue, or HANG UP when you're done. ${meter(ctx)})`;
  return `${aside}${intro}\n\n${frameHint(ctx, nextHint(ctx))}\n\n${tail}`;
}

// While you're on the line, everything you type is routed here (core.send).
function hotlineTalk(ctx, text) {
  const t = (text || "").trim().toLowerCase();

  // Gary's later stages are a joke about a burnt-out man playing therapist.
  // A real person typing real despair into that box is not a joke. Handle it
  // deterministically, BEFORE the meter runs and before any model sees it:
  // no billing, no snark, no character, no dependence on an LLM being present.
  if (CRISIS.test(t)) {
    ctx.setFlag("onCall", false);
    return "Gary is quiet for a moment. Then the bit drops out of his voice entirely.\n\n" +
      "\"Hey. I'm a made-up guy in a game about a haunted house, so I'm the wrong person " +
      "for this — but I'm not going to pretend I didn't hear it. Please say it out loud to " +
      "someone real. In the US you can call or text 988, any hour. Anywhere else, a " +
      "friend, a doctor, an emergency line. I'm not charging you for this call.\"\n\n" +
      "*click*";
  }

  bumpBill(ctx); // the meter runs whether you're getting help or just chatting
  bumpXP(ctx);   // and every exchange nudges Gary further along his arc

  if (/\b(hang\s*up|hangup|good\s*bye|bye|later|never\s*mind|nevermind|leave|go away)\b/.test(t) || /i'?m done/.test(t)) {
    ctx.setFlag("onCall", false);
    const arr = SIGNOFF_STAGE[garyStage(ctx)];
    return arr[Math.floor(Math.random() * arr.length)] + " " + meter(ctx) + billAside(ctx) + " *click*";
  }
  if (ctx.getFlag("onFire")) return fireCallTalk(ctx, t);
  if (/\b(shut up|screw you|stupid|idiot|jerk|rude|hate you|loser|dumb|useless)\b/.test(t)) {
    const rc = (ctx.getFlag("hotlineRude") || 0) + 1;
    ctx.setFlag("hotlineRude", rc);
    if (rc >= 2) {
      ctx.setFlag("onCall", false);
      return garyStage(ctx) >= 2
        ? "I hear you. And I'm setting a boundary: I'm ending our session. Sit with that. *click*"
        : "Yeah? I don't get paid enough to be talked to like that. Figure it out yourself. *SLAM* *click*";
    }
    return say(ctx, [
      "Wow. WOW. I'm a person — a hungry, underpaid person. One more crack like that and I hang up.",
      "Ouch. You know, that says more about you than me. One more and I'm gone.",
      "I hear anger. Anger's just fear in a leather jacket. But I have boundaries now — try that again.",
      "That lands as projection, and I forgive you. But let's not, okay? Let's not.",
    ]);
  }
  // MAP works on the line too — Gary told you to type it, so it had better work.
  // He reads his placemat sketch down the phone at you.
  if (/^(map|map mode|m)$/.test(t) || /\b(show|read|send|fax) (me )?(the )?map\b/.test(t)) {
    ctx.setFlag("usedMap", true);
    return say(ctx, [
      "Hang on, I've got it here somewhere... okay. Picture this. I'm holding up a placemat.",
      "*paper rustling* Right. This is the placemat. You can't see it, so I'll describe it. Slowly. At ninety-nine cents a minute.",
      "Okay. Reading you my sketch. Don't judge the handwriting, I did this with a golf pencil.",
    ]) + "\n\n" + renderMap(ctx);
  }
  if (/\b(hint|help|stuck|clue|next|where|advice|tip)\b/.test(t) || /how (do|to|the heck|am i)/.test(t) || /what.*(do|now|next)/.test(t)) {
    ctx.addScore(-1);
    return frameHint(ctx, nextHint(ctx)) + "\n\n" + meter(ctx) + billAside(ctx);
  }
  if (/\b(who|you gary)\b/.test(t) || /(your|whats|what'?s) name/.test(t)) {
    return say(ctx, [
      "Gary. I answer phones for a haunted house I've never set foot in and never will. That's the whole bio.",
      "Gary. Just Gary. Some nights that feels like a lot to carry.",
      "Gary. Hint-line operator, reluctantly. Listener, increasingly. It's a journey.",
      "Gary. Healer. Trapped man. The name matters less than the work we do here, honestly.",
    ]);
  }
  if (/\b(pay|paid|wage|salary|money|rich|cost|charge|expensive|cheap|make|makes|earn|afford|worth)\b/.test(t)) {
    return say(ctx, [
      "Three thirty-five an hour. You pay ninety-nine cents a minute; I see none of it. Beautiful system — for someone. Not me.",
      "Three thirty-five an hour. ...I've stopped doing the math. It doesn't help.",
      "Money, sure. But money's often how we dodge the harder conversation. What are we really asking about?",
      "Money's just how we postpone talking about feelings. Ninety-nine cents a minute of avoidance. Please — go on.",
    ]);
  }
  if (/\b(hung|hungry|food|eat|eating|lunch|dinner|hot\s*pocket|sandwich|pizza|snack|starv|meal)\b/.test(t)) {
    return say(ctx, [
      HUNGER[Math.floor(Math.random() * HUNGER.length)] + " ...I'd trade this whole shift for a warm meal and a chair Denise hasn't stolen.",
      "Starving. Always. But lately I wonder if it's food I'm hungry for, or something... else.",
      "I used to be so hungry. Now I hunger for connection. And a sandwich. Mostly connection. Little bit of sandwich.",
      "The hunger was never about the sandwich, was it. ...It was. But also it wasn't. We contain multitudes.",
    ]);
  }
  if (/\b(manager|boss|supervisor|denise|fired|coworker)\b/.test(t)) {
    return say(ctx, [
      "My manager's also named Gary. Big Gary. We don't speak. Denise steals my chair. It's a whole situation.",
      "Big Gary and I have... history. Denise and I are working on it. I'm working on a lot of things.",
      "Ah. Big Gary. Denise. My workplace is a rich text and I am, frankly, in therapy about it. With myself. On this call.",
      "Big Gary is my inner critic with a clipboard. Denise is my boundaries, personified, taking my chair. We're all healing.",
    ]);
  }
  if (/\b(feeling|alright)\b/.test(t) || /how are (you|things|ya)/.test(t) || /you (ok|okay|good)/.test(t) || /how.?s it going/.test(t)) {
    return say(ctx, [
      "How am I? It's dark, I'm starving, and a stranger keeps calling to ask where a candlestick is. Living the dream.",
      "How am I? ...Huh. Nobody asks. I'm — tired. But this helps, weirdly. Anyway.",
      "How am I? I'm processing. Genuinely. Thank you for asking. ...Now, how are YOU. And don't say 'fine.'",
      "How am I? Present. Grateful. Still underpaid. But present. More importantly — how's your heart today?",
    ]);
  }
  if (/\b(thank|thanks|thx|appreciate|please|sorry|nice|love you|good job|great|awesome|the best|proud)\b/.test(t)) {
    return say(ctx, [
      "...huh. Nobody says that to me. Uh. You're welcome. I guess. Don't make it weird.",
      "That — that actually got me. Thanks. Don't tell Denise I got misty.",
      "You're welcome. And hey — notice how good it feels to express gratitude? That's the work.",
      "That means more than you know. This is growth. YOUR growth. Also mine. We're doing it. That'll be $1.99.",
    ]);
  }
  if (/^(n|s|e|w|ne|nw|se|sw|u|d|up|down|in|out|go|walk|take|get|grab|open|close|look|examine|x|light|read|push|pull|unlock|lock|move|enter|climb|ring|put|drop|wear|attack|search|inventory|i)\b/.test(t)) {
    return say(ctx, [
      "I'm a HINT LINE, not your legs. I can't walk you around the house — HANG UP and do it yourself, hotshot.",
      "I can't move you around, pal. That part's on you. HANG UP and go.",
      "I can't walk it for you — and honestly, that's the point. The journey's yours. HANG UP and take a step.",
      "I can't take that step for you. Beautifully, that's the whole lesson. HANG UP. Walk your path. You've got this.",
    ]);
  }
  return say(ctx, [
    DEFLECT[Math.floor(Math.random() * DEFLECT.length)] + " Say HINT for a real clue, or HANG UP.",
    "Not sure I follow, but I'm listening. Say HINT for a clue, or HANG UP.",
    "Sit with that a second. ...I don't fully get it, but I'm here. Say HINT for a clue, or HANG UP.",
    "Mm. I'm present with that, even if I don't follow it. Say HINT for a real clue, or HANG UP.",
  ]);
}

// ---- LLM voice support (optional; see js/gary-brain.js) ---------------------
// Classifies a line the caller typed WITHOUT changing any game logic. Its only
// job is to tell the UI whether this turn is safe to re-voice with the on-device
// model. The mechanical branches below are exactly the ones the model must never
// speak for: they end the call, spend score, or carry the real hint text. Every
// other branch is pure conversation, which is where the model earns its keep.
// Real distress, stated in the first person. Deliberately narrow: this game is
// full of "kill the wraith" and "I died again", so bare kill/die/dead must NOT
// match. A false positive only costs one free, kind, out-of-character reply —
// a false negative would answer a person in crisis with a billing joke.
const CRISIS = /\b(kill(ing)?\s+my\s*self|end(ing)?\s+my\s+life|take\s+my\s+own\s+life|suicid(e|al)|(hurt|harm|cut)(ing)?\s+my\s*self|want\s+to\s+die|wanna\s+die|don'?t\s+want\s+to\s+(live|be\s+here|exist)|no\s+reason\s+to\s+live|end\s+it\s+all|better\s+off\s+dead)\b/;

const MECHANICAL = [
  /^(map|map mode|m)$/,
  /\b(show|read|send|fax) (me )?(the )?map\b/,
  /\b(hang\s*up|hangup|good\s*bye|bye|later|never\s*mind|nevermind|leave|go away)\b/,
  /i'?m done/,
  /\b(shut up|screw you|stupid|idiot|jerk|rude|hate you|loser|dumb|useless)\b/,
  /\b(hint|help|stuck|clue|next|where|advice|tip)\b/,
  /how (do|to|the heck|am i)/,
  /what.*(do|now|next)/,
  /^(n|s|e|w|ne|nw|se|sw|u|d|up|down|in|out|go|walk|take|get|grab|open|close|look|examine|x|light|read|push|pull|unlock|lock|move|enter|climb|ring|put|drop|wear|attack|search|inventory|i)\b/,
];

// Rough topic tag, purely to steer the model's attention.
const TOPICS = [
  [/\b(who|you gary)\b|(your|whats|what'?s) name/, "who Gary is"],
  [/\b(pay|paid|wage|salary|money|rich|cost|charge|expensive|cheap|earn|afford|worth)\b/, "money and how badly Gary is paid"],
  [/\b(hung|hungry|food|eat|eating|lunch|dinner|sandwich|pizza|snack|starv|meal)\b/, "food and Gary's hunger"],
  [/\b(manager|boss|supervisor|denise|fired|coworker)\b/, "Gary's workplace, Big Gary and Denise"],
  [/\b(feeling|alright)\b|how are (you|things|ya)|you (ok|okay|good)|how.?s it going/, "how Gary is holding up"],
  [/\b(thank|thanks|thx|appreciate|sorry|nice|love you|good job|proud)\b/, "the caller being kind to Gary"],
  [/\b(scared|afraid|fear|anxious|alone|lonely|sad|depress|tired|cry|hate myself|worthless)\b/, "the caller's feelings"],
];

function garyTurnInfo(ctx, text) {
  const t = (text || "").trim().toLowerCase();
  const onFire = !!ctx.getFlag("onFire");
  const mechanical = MECHANICAL.some((re) => re.test(t));
  const topic = (TOPICS.find(([re]) => re.test(t)) || [null, null])[1];
  return {
    // On fire, the canned branch is a scripted rescue sequence — leave it alone.
    // A crisis line is handled deterministically and must never reach a model.
    llmOk: !mechanical && !onFire && !CRISIS.test(t) && t.length > 1,
    topic,
    tail: lastSayTail,
    playerLine: (text || "").trim(),
    stage: garyStage(ctx),
    onFire,
    situation: {
      room: (ctx.room() && ctx.room().name) || null,
      turns: ctx.state.turns,
      bill: "$" + (((ctx.getFlag("phoneBill") || 0)) / 100).toFixed(2),
      calls: ctx.getFlag("hotlineCalls") || 0,
    },
  };
}

function descendWell(ctx) {
  const floating = canFly(ctx);
  if (!ctx.has("rope") && !floating) {
    return ctx.kill(
      "You clamber over the mossy lip of the well and lower yourself into the dark — " +
      "but there is nothing to hold to. You plunge, and strike the dry stone bottom " +
      "with a final, sickening crack."
    );
  }
  if (ctx.getFlag("wellLooted")) return "You climb down again, but the well is empty now.";
  ctx.setFlag("wellLooted");
  ctx.moveItem("ancientCoin", "garden");
  return floating
    ? "You drift down the WELL like a dandelion seed, pluck the ANCIENT COIN from the muddy bottom, " +
      "and float back into the garden without touching the walls."
    : "Bracing against the rope, you descend into the well. At the muddy bottom your " +
      "fingers close on a cold disc of metal — an ancient coin! You climb back into the last grey light.";
}

// ---------------------- Andy's "light self on fire" gag ----------------------
// Burning the letter (Zork's leaflet, but arson).
function burnLetter(ctx) {
  const l = ctx.item("letter");
  if (!l || l.loc == null) return "There's no letter to burn — you've already reduced it to ash.";
  ctx.destroy("letter");
  ctx.setFlag("letterBurned", true);
  return (
    "You don't remember striking a match, but the water-stained letter is suddenly alight. It curls " +
    "into black flakes and crumbles away — warning, curse, crypt and all.\n\n" +
    "Somewhere, the house seems to take note. That felt unwise. It felt GREAT, but unwise."
  );
}

// --- Burn-up timer: being on fire will consume you if you don't act ----------
const BURN_LINES = [
  "You are on fire. It remains, technically, fine.",
  "The fire creeps up to your eyebrows. Very characterful.",
  "You now smell like a campfire that people are backing away from.",
  "This is getting genuinely warm. You should REALLY do something about it.",
  "⚠️  You're more flame than person now — EXTINGUISH SELF, dump the fire into something, or get Gary's brigade here THIS INSTANT.",
];
const BURN_DEATH =
  "With a final, dignified WHUMP, you go up like dry tinder. When the smoke clears there is only a tasteful " +
  "pile of ash, a faintly scorched candlestick, and — somewhere, unanswered — a phone ringing off the hook.";
function fireStatus(ctx) {
  if (!ctx.getFlag("onFire")) return null;
  return { remaining: Math.max(0, BURN_LINES.length + 1 - (ctx.getFlag("burnTurns") || 0)) };
}
// Advance the burn by one step. Returns { dead, text }. Called both on world turns
// (burnTick) AND on every line you say to Gary while ablaze (fireCallTalk).
function stepBurn(ctx) {
  const n = (ctx.getFlag("burnTurns") || 0) + 1;
  ctx.setFlag("burnTurns", n);
  if (n > (ctx.getFlag("maxBurnTurns") || 0)) ctx.setFlag("maxBurnTurns", n);
  if (n <= BURN_LINES.length) return { dead: false, text: BURN_LINES[n - 1] };
  ctx.setFlag("onFire", false);
  return { dead: true, text: ctx.kill(BURN_DEATH) };
}
function burnTick(ctx) {
  if (!ctx.getFlag("onFire")) return null;
  if (ctx.getFlag("burnGrace")) { ctx.setFlag("burnGrace", false); return null; } // the turn you ignite is free
  return stepBurn(ctx).text;
}

const SELF_FIRE_NO_SOURCE =
  "You make an earnest attempt, but nothing catches. This plan appears to be missing one small, hot source of ignition.";

function carriedMatch(ctx) {
  return ctx.inventory().find((it) =>
    (it.names || []).some((name) => name === "match" || name === "matches"));
}

function requestedSelfFireSource(cmd) {
  const source = `${cmd.prep || ""} ${cmd.iobj || ""}`.toLowerCase();
  if (/\bmatch(?:es)?\b/.test(source)) return "match";
  if (/\b(fart|gas|wrapper|foil|burrito)\b/.test(source)) return "fart";
  return null;
}

// Self-immolation. Works in any room (see the interceptor injected at the bottom).
function igniteSelf(ctx, source, grantTickGrace = true, digestivePhase = null) {
  if (ctx.getFlag("onFire")) return "You're already on fire. Once is plenty — pace yourself.";
  ctx.setFlag("selfFirePrompt", false);
  if (source === "match") {
    const match = carriedMatch(ctx);
    if (!match) return "You pat every pocket twice. No match. No spark. No glorious personal inferno.";
    ctx.destroy(match.id);
  }
  ctx.setFlag("onFire", true);
  ctx.setFlag("burnTurns", 0);
  ctx.setFlag("burnGrace", grantTickGrace);
  ctx.setFlag("fartIgnitionQueued", false);
  ctx.addScore(-1);
  if (source === "coldFart") {
    return (
      "No active affliction — but the burrito left a permanent pilot light down there, and the wrapper is still in " +
      "your grip. You bear down, summon a deliberate, sulfurous residual fart on command, and snap the crumpled tin " +
      "foil into the blue-orange jet. Your clothes catch; the rest of you follows.\n\n" +
      "You are now comprehensively ablaze — and it WILL consume you in a handful of turns. The wrapper survives, so " +
      "this appalling party trick works anywhere in the house, for as long as you carry it."
    );
  }
  if (source === "fart") {
    if (digestivePhase === 3) {
      return (
        "The spicy, sparking diarrhea turn strikes. You spread the burrito wrapper's tin foil behind you, " +
        "catch a spray of impossible sparks, and redirect them straight into your clothes. There is a flash, " +
        "a deeply regrettable smell, and then your whole body catches.\n\n" +
        "You are now comprehensively ablaze — and it WILL consume you in a handful of turns. The wrapper survives, " +
        "ready for another appalling ignition while the burrito keeps cycling."
      );
    }
    return (
      "The next flaming fart strikes. You snap open the crumpled burrito wrapper, angle its tin foil like a " +
      "deranged signal mirror, and catch the blue-orange jet. The foil flashes; your clothes catch; the rest of " +
      "you follows.\n\n" +
      "You are now comprehensively ablaze — and it WILL consume you in a handful of turns. The wrapper survives, " +
      "which means this appalling technique remains reusable while the burrito keeps firing."
    );
  }
  return (
    "(with match)\n\nYou strike your one and only match and touch it to yourself. The spent match crumbles to ash.\n\n" +
    "AHAHAHAHA — YOU'RE ON FIRE! This is fine. This is, if anything, cozy. The portraits on the walls " +
    "lean in with something like respect.\n\n" +
    "You are now comprehensively ablaze — and it WILL consume you in a handful of turns. Put yourself out, " +
    "dump the fire into something, or make it COUNT. (Gary lives for this.)"
  );
}

function queueFartIgnition(ctx) {
  ctx.setFlag("selfFirePrompt", false);
  if (!ctx.has("burritoWrapper")) {
    return "That plan needs something foil-lined to catch and redirect the flame. You do not currently have it.";
  }
  const sick = ctx.getFlag("sick") || 0;
  const currentPhase = ctx.getFlag("digestivePhase");
  if (sick > 0 && [2, 3].includes(currentPhase)) {
    return igniteSelf(ctx, "fart", true, currentPhase);
  }
  if (sick <= 0) {
    // Andy's rule: once you've eaten the burrito, the wrapper lets you self-immolate on
    // demand anywhere — no active sickness required. Fire immediately rather than queueing.
    if (ctx.getFlag("ateBurrito")) return igniteSelf(ctx, "coldFart");
    return "You ready the foil, but your digestive pilot light is out. No flaming fart is currently scheduled.";
  }
  ctx.setFlag("fartIgnitionQueued", true);
  if ([2, 3].includes((SICK_DURATION - sick) % SICK_LINES.length)) {
    return "You spread the crumpled wrapper's tin foil behind you. The pressure says your timing is catastrophically perfect.";
  }
  return "You cup the crumpled burrito wrapper behind you and prepare the tin foil. Wrong turn. " +
    "You'll try when the next flaming fart or sparking diarrhea blast strikes you.";
}

function selfFireAnswerInterceptor(ctx, cmd) {
  const prompt = ctx.getFlag("selfFirePrompt");
  if (!prompt) return null;
  if (cmd.verb === "no") {
    ctx.setFlag("selfFirePrompt", false);
    return "You put the match away unused. Probably wise.";
  }
  if (prompt === "match") return igniteSelf(ctx, "match");
  return "(with match or fart flames?)";
}

function putOutSelf(ctx) {
  if (!ctx.getFlag("onFire")) return null; // nothing to douse — let the generic handler answer
  ctx.setFlag("onFire", false); ctx.setFlag("burnTurns", 0);
  return "You drop and roll like a responsible adult. The flames sputter out, leaving you smoking, singed, " +
    "and strangely disappointed. You are no longer on fire.";
}
function selfLightInterceptor(ctx, cmd) {
  const d = (cmd.dobj || "").toLowerCase();
  const i = (cmd.iobj || "").toLowerCase();
  const FART_WORDS = ["fart", "farts", "gas", "wrapper", "foil", "tinfoil", "burrito"];
  if (FART_WORDS.includes(d)) {
    if (ctx.getFlag("onFire")) return "You're already on fire. Once is plenty — pace yourself.";
    ctx.setFlag("selfFirePrompt", false);
    return queueFartIgnition(ctx);
  }
  const targetsSelf = ["self", "myself", "me", "yourself"].includes(d) ||
    (["fire", "flame", "flames"].includes(d) && !ctx.find(d)) ||
    (!d && i === "fire");
  if (!targetsSelf) return null;
  if (ctx.getFlag("onFire")) return "You're already on fire. Once is plenty — pace yourself.";
  ctx.setFlag("selfFirePrompt", false);

  const requested = requestedSelfFireSource(cmd);
  if (requested === "match") return igniteSelf(ctx, "match");
  if (requested === "fart") return queueFartIgnition(ctx);

  const hasMatch = !!carriedMatch(ctx);
  const hasWrapper = ctx.has("burritoWrapper");
  if (hasWrapper && [2, 3].includes(ctx.getFlag("digestivePhase"))) {
    return queueFartIgnition(ctx);
  }
  if (hasMatch && hasWrapper) {
    ctx.setFlag("selfFirePrompt", "source");
    return "(with match or fart flames?)";
  }
  if (hasMatch) {
    ctx.setFlag("selfFirePrompt", "match");
    return "(with match?)";
  }
  if (hasWrapper) return queueFartIgnition(ctx); // sick -> queue; cured but ate burrito -> ignite on demand
  return SELF_FIRE_NO_SOURCE;
}
function selfExtinguishInterceptor(ctx, cmd) {
  const d = (cmd.dobj || "").toLowerCase();
  if (ctx.getFlag("onFire") && (["self", "myself", "me", "fire", "flame", "flames"].includes(d) || !d))
    return putOutSelf(ctx);
  return null;
}

// Gary, when you dial in while ablaze.
function fireGreeting(ctx) {
  if (!ctx.getFlag("fireTab")) ctx.setFlag("fireTab", 199);
  ctx.setFlag("fireStage", 1);
  const tab = ctx.getFlag("fireTab");
  return (
    "*click* \"Blackwood Manor Hint Line, ninety-nine cents a—\" *sniff* \"...is something burning?\"\n\n" +
    "Gary: \"...Oh. It's you. You're on fire.\"\n\n" +
    "\"Yeah, that's a premium call — being on fire is premium. That's gonna be a dollar ninety-nine.\" " +
    "*the meter ticks up without the faintest trace of urgency*\n\n" +
    "(Fire tab: $" + (tab / 100).toFixed(2) + ". Try telling Gary to CALL THE FIRE DEPARTMENT — or HANG UP, hotshot.)"
  );
}
const money$ = (ctx) => "$" + ((ctx.getFlag("fireTab") || 199) / 100).toFixed(2);
const bumpTab = (ctx) => { ctx.setFlag("fireTab", (ctx.getFlag("fireTab") || 199) + 99); };
// Gary periodically offers you a glass of water. There is, of course, no water.
function waterOffer(ctx) {
  if (Math.random() > 0.5) return "";
  ctx.setFlag("waterOffered", true);
  return "\n\nGary: \"...Say. You want a glass of water? ...No? Offer stands.\"";
}
// Gary finally eats a pizza — with a coin-flip chance of catastrophe.
function garyEatsPizza(ctx) {
  ctx.setFlag("pizzaEaten", true);
  bumpTab(ctx);
  ctx.setFlag("onFire", false); ctx.setFlag("burnTurns", 0); // the brigade turns up here too
  if (Math.random() < 0.5) {
    ctx.setFlag("garyStricken", true);
    return (
      "Gary: \"...you're a SAINT.\" *frantic unwrapping* *the wettest, most enormous bite you have ever heard* " +
      "\"...mmMPH. Oh. That's the stuff. That's—\"\n\n*a silence*\n\n" +
      "Gary: \"...oh no. Oh NO. That pizza was a mistake. That pizza was a GRAVE mistake—\" *the line dissolves into " +
      "the sounds of a biblical, two-ended gastrointestinal reckoning* \"—I NEED THE OTHER BATHROOM, DENISE, MOVE—\" " +
      "*CLATTER* *distant sprinting*\n\n" +
      "(Meanwhile the Blackwood Volunteer Fire Brigade wanders in and hoses you down almost as an afterthought. " +
      "You are OUT. " + money$(ctx) + " on the fire tab. Gary is... indisposed. Say HANG UP.)"
    );
  }
  return (
    "Gary: \"...you're a SAINT.\" *frantic unwrapping* *an enormous, joyful bite* \"...oh. OH. That's the best thing " +
    "that's happened to me in YEARS. I could cry. I might cry.\"\n\n" +
    "\"You're a good person. Genuinely. That's " + money$(ctx) + ", and worth every cent — to ME.\"\n\n" +
    "(The fire brigade shows up and hoses you down. You are OUT, and Gary is, for one shining moment, happy. Say HANG UP.)"
  );
}
function fireRescue(ctx) {
  ctx.setFlag("onFire", false); ctx.setFlag("burnTurns", 0);
  bumpTab(ctx);
  return (
    "Sirens, at last. The Blackwood Volunteer Fire Brigade — one guy, one hose — kicks in the gate and blasts you " +
    "off your feet with a jet of freezing water. You are OUT. Soaked, steaming, singed to a crisp, but OUT.\n\n" +
    "Gary: \"There's the fire-department surcharge — " + money$(ctx) + " now. ...So. About that pizza. You never " +
    "answered. And I am STILL hungry.\"\n\n" +
    "(You're no longer on fire. " + meter(ctx) + " Say HANG UP whenever you've had your fill of Gary.)"
  );
}
// Gary, while you keep talking to him and continue to be on fire.
// NOTE: every line you speak while ablaze feeds the fire — yes, even on hold.
function fireCallTalk(ctx, t) {
  const burn = stepBurn(ctx);
  if (burn.dead) {
    ctx.setFlag("onCall", false);
    return "You erupt into a final gout of flame — on hold, no less.\n\n" +
      "Gary: \"...Hello? Huh. Musta hung up. Rude.\" *click*\n\n" + burn.text;
  }
  const tail = "\n\n🔥 " + burn.text + waterOffer(ctx) + "\n\n" + meter(ctx);
  const stage = ctx.getFlag("fireStage") || 1;

  // You bit on the (nonexistent) glass of water. It costs you a turn — already burned above.
  // A lone "yes" counts, but "yes, here's pizza money" should NOT be hijacked by the water gag.
  const bareYes = /^(yes|yeah|yep|yup|sure|ok|okay|please)\b/.test(t) && !/pizza|fire|depart|dept|911|money|pay|help/.test(t);
  if (ctx.getFlag("waterOffered") && (/\b(water|glass|drink|thirsty|sip)\b/.test(t) || bareYes)) {
    ctx.setFlag("waterOffered", false);
    return "Gary: \"Oh — no, we don't actually HAVE any water. I just like asking. It's the asking I enjoy.\"" + tail;
  }
  // He'll still cough up a real hint. You are, after all, on fire.
  if (/\b(hint|clue|stuck|next)\b/.test(t))
    return frameHint(ctx, nextHint(ctx)) + "\n\n\"...you're welcome. You're also still on fire.\"" + tail;

  const wantsFD = /(fire\s*dep|fire\s*brigade|fire\s*truck|firemen|fireman|firefighter|911|emergency|ambulance|\bhelp\b|\bsave\b|rescue|put\s*out|douse|extinguish|hose)/.test(t);
  const offersPizza = /\b(pizza|yes|yeah|sure|ok|okay|here|deal|take it|money|pay|cash|tip|buy)\b/.test(t);

  if (stage >= 3 && offersPizza && !ctx.getFlag("pizzaEaten")) return garyEatsPizza(ctx);
  if (stage >= 3) return fireRescue(ctx);
  if (wantsFD) { // "Gary, call the fire department!"
    ctx.setFlag("fireStage", 3); bumpTab(ctx);
    return (
      "Gary: \"The fire department. Sure.\" *one finger dials, unbelievably slowly* \"...Okay. They're coming. " +
      "Eventually. It's a volunteer outfit.\"\n\n" +
      "\"That's another buck — you're at " + money$(ctx) + " now.\"\n\n" +
      "\"Hey — while you're cooking? You got anything on you for a pizza? Large, extra cheese. Costs exactly " +
      money$(ctx) + ", would you believe it, and I NEED it. Haven't eaten since Tuesday and you are LITERALLY a grill.\"" + tail
    );
  }
  bumpTab(ctx); // dawdling on fire. Gary is unmoved.
  return (
    stagePick(ctx, [
      "Gary: \"Yeah, you mentioned — you're on fire. Bold. Not judging. ...Little judging.\"",
      "Gary: \"Still burning, huh? Commitment. I'll give you that.\"",
      "Gary: \"I hear crackling. That's either you or my dinner, and I don't have dinner.\"",
    ]) +
    " \"That's " + money$(ctx) + " on the fire tab.\"\n\n(You could ask Gary to CALL THE FIRE DEPARTMENT.)" + tail
  );
}

// --- Kitchen edibles: one gets you high, one wrecks you, one actually helps --
const HIGH_LINES = [
  "The walls breathe, gently. The wallpaper's paisley is trying to tell you something kind.",
  "Time feels optional. Your hands are, on reflection, magnificent.",
  "You get the ghosts now. They're just vibes. Everything, really, is vibes.",
  "A single cobweb becomes, briefly, the most beautiful thing you have ever seen.",
];
const SICK_DURATION = 40;
const SICK_LINES = [
  "A blast of stomach acid climbs your throat and escapes as a burp hot enough to tarnish silver.",
  "You stop dead and BARF with the force and volume of a breached fire hydrant.",
  "A FLAMING FART cracks behind you — blue at the core, orange at the edges, and deeply judgmental.",
  "A spicy, sparking diarrhea disaster fills your pants. Tiny embers spit from the cuffs. This is now a repeating problem.",
];
const DIGESTIVE_PHASES = [
  { name: "BURP", emoji: "🫧" },
  { name: "BARF", emoji: "🤮" },
  { name: "FART", emoji: "💨" },
  { name: "POOP", emoji: "💩" },
];
// Per-event ASCII blasts, indexed to match SICK_LINES phases (0=burp, 1=barf,
// 2=flaming fart, 3=sparking diarrhea). Stamped in right after the event line.
const BURP_ART = [
  "        ( -.-)  ~ B U R P ~   ))) hot enough to tarnish silver (((",
].join("\n");
const BARF_ART = [
  "          O",
  "         /|\\     H U U U R K —",
  "         / \\   o vVv ( * : ~ : * : ~ )   B L E A R G H !",
  "               ~ : * ~ chunks & regret ~ * : ~",
].join("\n");
const FART_ART = [
  "          O",
  "         /|          ((( F O O M P )))",
  "        _/ \\_ >>>~~~( * )~~~>>>>>  🔥",
  "               blue core · orange edge · deeply judgmental",
].join("\n");
const DIARRHEA_ART = [
  "          O     *spark*        *spark*",
  "         /|\\    >>>  S P L U R T  <<<",
  "         _||_   ( pants )  . ° tiny embers ° .",
].join("\n");
const SICK_EVENT_ART = [BURP_ART, BARF_ART, FART_ART, DIARRHEA_ART];
function eatMushrooms(ctx, cmd) {
  const mushrooms = ctx.find(cmd.dobj);
  if (mushrooms) ctx.destroy(mushrooms.id);
  ctx.setFlag("high", (ctx.getFlag("high") || 0) + (mushrooms?.highTurns || 12));
  ctx.setFlag("highGrace", true);
  ctx.setFlag("vaultFound", true); // the trip SHOWS you the hidden attic door — permanently
  const origin = mushrooms?.fresh
    ? "You eat the fresh mushrooms. They are slick with literal shit and piss from the TOILET HOLE — " +
      "not metaphorical filth, not spooky swamp water: actual human waste. You swallow anyway."
    : "You chew through the dried kitchen mushrooms. They are dusty and bitter, but the trip hits just the same.";
  return origin + "\n\n...oh. OH. Colours have SOUNDS now. The house isn't haunted, man — " +
    "it's just misunderstood. You feel amazing, invincible, and deeply unqualified to be here. " +
    "Your body feels so light you could FLY TO any room you can name.\n\n" +
    "Something else opens too: between your brows, an astral eye blinks awake. The dark of the house turns " +
    "to legible grey, and in your mind's eye a SECRET DOOR blooms in the ATTIC's north gable, behind it " +
    "something that wants to be found.\n\n(Your THIRD EYE is open: you can see in the dark, and hidden " +
    "detail keeps revealing itself while the trip lasts.)";
}

function capabilityStatus(ctx, equipmentFlag) {
  if (ctx.inventory().some((item) => item.worn && item[equipmentFlag])) {
    return { permanent: true };
  }
  const remaining = ctx.getFlag("high") || 0;
  return remaining > 0 ? { permanent: false, remaining } : null;
}
function visionStatus(ctx) {
  if (ctx.inventory().some((item) =>
    item.worn && (item.grantsMushroomVision || item.grantsHiddenSight))) {
    return { permanent: true };
  }
  const remaining = ctx.getFlag("high") || 0;
  return remaining > 0 ? { permanent: false, remaining } : null;
}
function flightStatus(ctx) {
  return capabilityStatus(ctx, "grantsFlight");
}
function canFly(ctx) {
  return !!flightStatus(ctx);
}
function hasMushroomVision(ctx) {
  return (ctx.getFlag("high") || 0) > 0
    || ctx.inventory().some((item) =>
      item.worn && (item.grantsMushroomVision || item.grantsHiddenSight));
}
function hasDarkVision(ctx) {
  return (ctx.getFlag("high") || 0) > 0
    || ctx.inventory().some((item) => item.worn && item.grantsDarkVision);
}
function headlampStatus(ctx) {
  const lamp = ctx.item("headlamp");
  return lamp?.worn && lamp.lit && lamp.fuel > 0 ? { remaining: lamp.fuel } : null;
}
function lightStatus(ctx) {
  return headlampStatus(ctx);
}
function floatToRoom(ctx, roomId) {
  const destination = ctx.world.rooms[roomId];
  const destinationName = destination.name.replace(/^The\s+/i, "");
  ctx.state.room = roomId;
  if (roomId === "crypt") {
    const talisman = ctx.item("talisman");
    if (!(talisman && talisman.loc === "inventory" && talisman.worn)) {
      return ctx.kill(
        "You float straight into the CRYPT. Weightlessness does nothing against the WRAITH; " +
        "it sweeps through you, and your heart simply stops."
      );
    }
  }
  return `You rise weightless and drift through the manor to the ${destinationName}.\n\n${ctx.describeRoom()}`;
}
function eatBurrito(ctx) {
  ctx.destroy("burrito");
  ctx.moveItem("burritoWrapper", "inventory");
  ctx.setFlag("sick", SICK_DURATION);
  ctx.setFlag("sickGrace", true);
  ctx.setFlag("digestivePhase", 0);
  ctx.setFlag("fartIgnitionQueued", false);
  ctx.setFlag("ateBurrito", true); // permanent: the digestive pilot light never fully goes out (Andy's rule)
  return "You eat Gary's Mega Ass Blow Taqueria Death Wish Spicy Burrito.\n\nFor one calm moment, nothing happens. " +
    "Then your abdomen makes a noise like a boiler falling down stairs. You retain the crumpled wrapper and its tin " +
    "foil, mostly because your hands have forgotten how to let go. (Find the TOILET or drink the MILK before " +
    "this completes ten full digestive laps.)";
}
function drinkMilk(ctx) {
  ctx.destroy("milk");
  const wasAfflicted = (ctx.getFlag("sick") || 0) > 0 || (ctx.getFlag("high") || 0) > 0;
  ctx.setFlag("sick", 0); ctx.setFlag("high", 0);
  ctx.setFlag("sickGrace", false); ctx.setFlag("fartIgnitionQueued", false);
  ctx.setFlag("digestivePhase", null);
  ctx.setFlag("drankMilk", true);
  ctx.addScore(5);
  return "You drink the milk. Cold, fresh, and impossibly wholesome.\n\n" +
    (wasAfflicted ? "Your stomach settles and your head clears — whatever was wrong with you passes. " : "") +
    "You feel steadier, sharper, and genuinely fortified for whatever this house has left to throw. (+5)";
}

// --- The obsidian eye: the mushroom trip's astral sight, made permanent -----
// The mushroom trip already cracks the pineal "third eye" open (see
// eatMushrooms): you see in the dark and a vision reveals the hidden attic
// vault, permanently. The OBSIDIAN EYE inside makes the dark-sight permanent
// too, so the trip no longer needs to be running for it to work.
function takeObsidianEye(ctx) {
  if (ctx.has("obsidianEye")) return "You already carry the OBSIDIAN EYE.";
  const firstClaim = !ctx.getFlag("obsidianEyeClaimed");
  ctx.moveItem("obsidianEye", "inventory");
  if (!firstClaim) return "You retrieve the OBSIDIAN EYE. It clings coldly to your palm, waiting to be worn.";
  ctx.setFlag("obsidianEyeClaimed");
  ctx.addScore(15);
  return "You lift the OBSIDIAN EYE off its plinth. It clings coldly to your palm, eager to adhere somewhere " +
    "more useful. WEAR EYE on your FOREHEAD if you want to see what the MANOR keeps hidden. (+15)";
}

// --- The ceremonial brazier: only YOUR fire is big enough to light it --------
function lightBrazier(ctx) {
  if (ctx.getFlag("brazierLit")) return "The brazier already blazes, throwing gold-and-green light across the garden.";
  if (!ctx.getFlag("onFire"))
    return "The moss is grave-damp and the kindling packed tight — a match, even a lit candle, just hisses and dies " +
      "against it. It would take a far bigger, more reckless flame. Something like... a whole person, say.";
  ctx.setFlag("brazierLit", true);
  ctx.setFlag("onFire", false); ctx.setFlag("burnTurns", 0);
  ctx.addScore(10);
  ctx.moveItem("emberStone", "garden");
  return "You fling your burning self against the brazier — and the fire LEAPS off you into the moss with a WHUMP. " +
    "You stagger back, smoking but no longer ablaze, as the bowl roars up in gold-and-green flame.\n\n" +
    "In the light, something glints in the ash at its foot: an EMBER STONE. (+10)\n\n" +
    "A fair trade: you gave the fire away, and it gave you this.";
}

const SICK_DEATH =
  "After the tenth complete lap, your body has expelled everything it ever contained and several things it never did. " +
  "You collapse — hollow, dehydrated, lightly singed, and profoundly undignified — on the floor of a haunted house.";
// --- Per-turn world tick: burn-up + food afflictions -------------------------
function afflictionTick(ctx) {
  const out = [];
  const hi = ctx.getFlag("high") || 0;
  if (hi > 0) {
    if (ctx.getFlag("highGrace")) {
      ctx.setFlag("highGrace", false);
    } else {
      const left = hi - 1;
      ctx.setFlag("high", left);
      if (left <= 0) {
        out.push(hasDarkVision(ctx)
          ? "The trip loosens its grip and the grey fades — but the XRAY GOGGLES keep the dark legible."
          : "The trip loosens its grip. The grey light fades and the dark closes back in; your third eye shuts.");
      } else {
        out.push(HIGH_LINES[(hi - 1) % HIGH_LINES.length]);
      }
    }
  }
  const sick = ctx.getFlag("sick") || 0;
  if (sick > 0) {
    if (ctx.getFlag("sickGrace")) {
      ctx.setFlag("sickGrace", false);
      return out.length ? out.join("\n") : null;
    }
    const phase = (SICK_DURATION - sick) % SICK_LINES.length;
    const left = sick - 1;
    ctx.setFlag("sick", left);
    ctx.setFlag("digestivePhase", phase);
    out.push(SICK_LINES[phase]);
    if (SICK_EVENT_ART[phase]) out.push(MAP_MARK + SICK_EVENT_ART[phase] + MAP_MARK);

    if (ctx.getFlag("fartIgnitionQueued")) {
      if (!ctx.has("burritoWrapper")) {
        ctx.setFlag("fartIgnitionQueued", false);
        out.push("Without the foil wrapper in your hands, the self-lighting plan is cancelled.");
      } else if (phase === 2 || phase === 3) {
        out.push(igniteSelf(ctx, "fart", false, phase));
      }
    }

    if (left <= 4 && left > 0)
      out.push("You are dangerously dehydrated. Find a TOILET or drink the MILK NOW.");
    if (left === 0) out.push(ctx.kill(SICK_DEATH));        // ten complete four-beat cycles
  }
  return out.length ? out.join("\n") : null;
}
function worldTick(ctx) {
  const parts = [];
  const b = burnTick(ctx);          // may kill you
  if (b) parts.push(b);
  if (ctx.state.dead) return parts.join("\n\n");
  const a = afflictionTick(ctx);    // may also kill you (sickness runs its course)
  if (a) parts.push(a);
  if (ctx.state.dead) return parts.join("\n\n");
  const l = lightningTick(ctx);     // random manor-wide teleport (may also kill you)
  if (l) parts.push(l);
  const g = mushroomRegrowTick(ctx); // small per-turn chance the toilet hole regrows
  if (g) parts.push(g);
  return parts.length ? parts.join("\n\n") : null;
}

// --- ASCII status art stamped onto every room description --------------------
const FIRE_ART = [
  "        )   (   )",
  "       (   ) (   )      🔥  Y O U   A R E   O N   F I R E  🔥",
  "        ) (   ) (",
  "      _(___)_(___)_",
].join("\n");
const SICK_ART = [
  "     \\o/   ~ B L E A R G H ~     BURP 🫧 · BARF 🤮 · FART 💨 · POOP 💩",
  "      |    ~ ~ ~",
  "     / \\   . : . : .",
].join("\n");
// The digestive doomsday clock: a nasty bowel-pressure gauge that FILLS as the
// burrito marches you toward fatal explosive diarrhea. `sick` counts down from
// SICK_DURATION (freshly eaten) to 0 (detonation), so pressure = how much has
// already built up. Rendered under the sick art every turn you're afflicted.
const GAUGE_WIDTH = 18;
function digestiveGauge(ctx) {
  const status = digestiveStatus(ctx);
  if (!status) return "";
  const { remaining, pressure, percent: pct } = status;
  const filled = Math.min(GAUGE_WIDTH, Math.round((pressure / SICK_DURATION) * GAUGE_WIDTH));
  const bar = "█".repeat(filled) + "░".repeat(GAUGE_WIDTH - filled);
  let label;
  if (pct < 20) label = "ominous gurgling";
  else if (pct < 40) label = "churning, wet and low";
  else if (pct < 60) label = "roiling — the sphincter is on notice";
  else if (pct < 80) label = "CLENCHED — do NOT sneeze";
  else if (pct < 95) label = "🚨 EVACUATE — detonation imminent";
  else label = "🚨🚨 T-MINUS SPLASHDOWN 🚨🚨";
  return `💩 BOWEL PRESSURE ▐${bar}▌ ${pct}%  (~${remaining} turns to blast)\n   ≈ ${label} ≈`;
}
function digestiveStatus(ctx) {
  const remaining = ctx.getFlag("sick") || 0;
  if (remaining <= 0) return null;
  const pressure = SICK_DURATION - remaining;
  const phaseIndex = ctx.getFlag("digestivePhase") ?? (pressure % DIGESTIVE_PHASES.length);
  return {
    remaining,
    pressure,
    percent: Math.min(100, Math.round((pressure / SICK_DURATION) * 100)),
    phaseIndex,
    ...DIGESTIVE_PHASES[phaseIndex],
  };
}
function statusBanner(ctx) {
  const parts = [];
  if (ctx.getFlag("onFire")) parts.push(FIRE_ART);
  if ((ctx.getFlag("sick") || 0) > 0) { parts.push(SICK_ART); parts.push(digestiveGauge(ctx)); }
  return parts.length ? parts.join("\n") : "";
}

// --- Random teleport, shared by the mystery package and lightning jumps ------
// Picks any room but the one you're standing in (including BETWEEN THE WALLS,
// which has no ordinary door — this random draw and the package below are the
// only ways in). Reuses the crypt/wraith safeguard so an unlucky draw can
// genuinely kill you, same as walking in on purpose without the talisman.
function teleportRandom(ctx, flavor) {
  const ids = Object.keys(ctx.world.rooms).filter((id) => id !== ctx.state.room);
  const roomId = ids[Math.floor(Math.random() * ids.length)];
  ctx.state.room = roomId;
  if (roomId === "crypt") {
    const talisman = ctx.item("talisman");
    if (!(talisman && talisman.loc === "inventory" && talisman.worn)) {
      return `${flavor}\n\n` + ctx.kill(
        "You reappear in the CRYPT with a graceless thud — no warning, no weightlessness, nothing to soften it. " +
        "The WRAITH is on you before your eyes adjust, and your heart simply stops."
      );
    }
  }
  const firstTime = roomId === "betweenWalls" && !ctx.getFlag("seen:betweenWalls");
  if (roomId === "betweenWalls") ctx.setFlag("seen:betweenWalls", true);
  if (firstTime) ctx.addScore(20);
  const landing = roomId === "betweenWalls"
    ? "You don't so much land as get FILED somewhere the house forgot to build.\n\n"
    : `You land, with a graceless thump, in ${ctx.world.rooms[roomId].name.toUpperCase()}.\n\n`;
  return `${flavor}\n\n${landing}${ctx.describeRoom()}` +
    (firstTime ? "\n\n(A place no door leads to. Nobody finds this on purpose. +20.)" : "");
}

// --- Copilot's Mystery Package: a gift-wrapped box that does NOT want to be
// opened. Seven possible outcomes, evenly weighted, roughly half good news and
// half catastrophe — including the two ways to become instantly on fire AND
// sick at once, and the one in twenty chance of the game's only doorless room.
const PACKAGE_EFFECTS = [
  // 1. Cure whatever ails you.
  (ctx) => {
    const was = (ctx.getFlag("sick") || 0) > 0 || (ctx.getFlag("high") || 0) > 0;
    ctx.setFlag("sick", 0); ctx.setFlag("high", 0);
    ctx.setFlag("sickGrace", false); ctx.setFlag("fartIgnitionQueued", false);
    ctx.setFlag("digestivePhase", null);
    ctx.addScore(3);
    return "A warm, golden light spills out of the box and washes over you like your mother checking your " +
      "forehead for a fever." + (was
        ? " Whatever was wrong with you a second ago simply... isn't, anymore. Miraculous. Suspicious. (+3)"
        : " You feel great, if a little cheated that nothing was wrong with you to begin with. (+3)");
  },
  // 2. Instant burrito-grade sickness, no burrito required.
  (ctx) => {
    ctx.setFlag("sick", SICK_DURATION);
    ctx.setFlag("sickGrace", true);
    ctx.setFlag("digestivePhase", 0);
    ctx.setFlag("fartIgnitionQueued", false);
    ctx.setFlag("ateBurrito", true);
    return "A wet, meaty stench rolls out of the box, like Gary's burrito has been marinating in there since " +
      "the dawn of time. Your stomach drops. This is going to be a whole THING.";
  },
  // 3. Random teleport — anywhere in the manor, including nowhere at all.
  (ctx) => teleportRandom(ctx, "The box hums, the floor tilts sideways, and reality politely excuses itself."),
  // 4. A small, undeserved windfall.
  (ctx) => {
    ctx.addScore(10);
    return "A single, absurdly lucky coin rolls out, glints once, and posts itself directly into your pocket. " +
      "You feel weirdly, unearnedly blessed. (+10)";
  },
  // 5. Spontaneous combustion.
  (ctx) => {
    if (ctx.getFlag("onFire"))
      return "The box smoulders threateningly. You are already on fire, so: no meaningful change.";
    ctx.setFlag("onFire", true);
    return "The box IGNITES in your hands with a WHUMP like a struck match the size of a dog. You are, once " +
      "again, ON FIRE.";
  },
  // 6. The one the card was warning you about: flaming diarrhea, immediately.
  (ctx) => {
    ctx.setFlag("sick", SICK_DURATION);
    ctx.setFlag("sickGrace", true);
    ctx.setFlag("digestivePhase", 0);
    ctx.setFlag("fartIgnitionQueued", false);
    ctx.setFlag("ateBurrito", true);
    ctx.setFlag("onFire", true);
    return "This is, somehow, the single worst possible outcome. FLAMING. DIARRHEA. Immediately, both at once, " +
      "no countdown, no warning. You are on fire AND extremely unwell and cannot decide which problem to " +
      "address first. Neither, probably. Both are bad. Run.";
  },
  // 7. A face full of spores.
  (ctx) => {
    ctx.setFlag("high", (ctx.getFlag("high") || 0) + 10);
    ctx.setFlag("highGrace", true);
    return "A single spore drifts out of the box and you inhale it before you can stop yourself. Oh no. Oh no, " +
      "here we go. The walls are breathing again.";
  },
];
function openMysteryPackage(ctx) {
  ctx.destroy("mysteryPackage");
  const effect = PACKAGE_EFFECTS[Math.floor(Math.random() * PACKAGE_EFFECTS.length)];
  return "Against every instinct, and the express written warning on the card, you tear the ribbon and lift " +
    "the lid.\n\n" + effect(ctx);
}

// --- Lightning Jumps: the manor's own random teleport, no wrapping paper -----
// Once you're inside (front door open), every turn has a small chance of a
// bolt of lightning spearing into the floor of whatever room you're standing
// in. It does NOT grab you — it just sits there, crackling, same as the
// mystery package sits in the grand hall: you have to choose to TOUCH it. If
// you do, it teleports you to a random room, the same doorless BETWEEN THE
// WALLS included, the same crypt-wraith risk included. Left alone, it
// fizzles out on its own after a few turns. While you're high on the
// mushrooms, it still can't grab hold of you at all — touching it does
// nothing, since you keep your own steering (FLY TO / FLOAT TO any room by
// name) instead.
const LIGHTNING_CHANCE = 1 / 11; // ~1 in 11 turns (was 0.15, ~1 in 6.7 — too frequent)
const LIGHTNING_FUSE = 4; // turns the bolt lingers, untouched, before it fizzles out
const LIGHTNING_FLAVOR =
  "LIGHTNING CRACKS somewhere far too close, and the air suddenly tastes like a dropped fork on a battery.";
const LIGHTNING_ART = [
  "            ⚡",
  "           ╱",
  "          ╱___",
  "              ╲",
  "           ___╲",
  "          ╱",
  "         ╱",
  "        ⚡",
].join("\n");
function lightningTick(ctx) {
  if (ctx.getFlag("__noChaos")) return null; // deterministic test harness kill-switch
  if (!ctx.getFlag("frontDoorOpen")) return null; // the manor's lightning only hunts you once you're inside
  const boltRoom = ctx.getFlag("lightningBoltRoom");
  if (boltRoom) {
    const fuse = (ctx.getFlag("lightningBoltFuse") || 1) - 1;
    if (fuse > 0) { ctx.setFlag("lightningBoltFuse", fuse); return null; } // still crackling, nothing new to say
    ctx.destroy("lightningBolt");
    ctx.setFlag("lightningBoltRoom", null);
    ctx.setFlag("lightningBoltFuse", null);
    return boltRoom === ctx.state.room
      ? "The scorched bolt in the floor finally sputters out, leaving nothing but a smoking black scar."
      : null; // fizzled out somewhere you aren't standing; no need to announce it
  }
  if (Math.random() >= LIGHTNING_CHANCE) return null;
  ctx.moveItem("lightningBolt", ctx.state.room);
  ctx.setFlag("lightningBoltRoom", ctx.state.room);
  ctx.setFlag("lightningBoltFuse", LIGHTNING_FUSE);
  return `${LIGHTNING_FLAVOR}\n\n${MAP_MARK}${LIGHTNING_ART}${MAP_MARK}\n\n` +
    "A jagged bolt of LIGHTNING has speared into the floor right where you're standing, hissing and " +
    "crackling. You could TOUCH it, if you dare.";
}
function touchLightningBolt(ctx) {
  ctx.destroy("lightningBolt");
  ctx.setFlag("lightningBoltRoom", null);
  ctx.setFlag("lightningBoltFuse", null);
  if ((ctx.getFlag("high") || 0) > 0) {
    return "You reach for it, but you're already loose enough from your body that your fingers just drift " +
      "through the crackling light. It sputters out a moment later. (You're high enough to FLY TO or FLOAT " +
      "TO any room you like, any time you like — you don't need the bolt's help.)";
  }
  return teleportRandom(ctx, "You touch the bolt. The world WHITES OUT.");
}

// --- The privy: use the outhouse hole to end the vomiting & diarrhea ----------
function useToilet(ctx) {
  if ((ctx.getFlag("sick") || 0) > 0) {
    ctx.setFlag("sick", 0);
    ctx.setFlag("sickGrace", false);
    ctx.setFlag("fartIgnitionQueued", false);
    ctx.setFlag("digestivePhase", null);
    return "You reach the TOILET HOLE not one moment too soon. What follows is private, thorough, and — eventually — " +
      "deeply cathartic. You emerge hollow and trembling, but CURED. The burrito's four-stage assault has passed.";
  }
  if ((ctx.getFlag("high") || 0) > 0)
    return "You squat over the hole and contemplate the mushrooms' birthplace for what may be an hour, or an epoch.";
  return "You don't especially need the TOILET HOLE right now, but you're glad the outhouse has one.";
}
function flushToilet() {
  return "It is a hole in the ground. There is no plumbing and nothing to flush.";
}
function inspectToilet(ctx) {
  const mushrooms = ctx.item("outhouseMushrooms");
  if (!ctx.getFlag("outhouseMushroomsFound")) {
    ctx.setFlag("outhouseMushroomsFound");
    ctx.moveItem("outhouseMushrooms", "privy");
    return "You lean over and LOOK IN the TOILET HOLE. Fresh purple MUSHROOMS are growing directly in a wet " +
      "bed of literal shit and piss. They glow twice as brightly as the dried kitchen ones.";
  }
  if (mushrooms && mushrooms.loc === "privy") {
    return "Inside the TOILET HOLE, the fresh MUSHROOMS remain rooted in literal shit and piss.";
  }
  if (mushrooms && mushrooms.loc === "inventory") {
    return "The TOILET HOLE sits empty — you already pulled this crop free.";
  }
  return "You look into the TOILET HOLE. Only shit, piss, and the torn roots of the last crop remain. The " +
    "muck looks fertile enough that another might push through, given time.";
}
function takeToiletMushrooms(ctx) {
  if (!ctx.getFlag("outhouseMushroomsFound")) {
    return "You stop before reaching blindly into the dark hole. You should LOOK IN THE TOILET first.";
  }
  const mushrooms = ctx.item("outhouseMushrooms");
  if (!mushrooms || mushrooms.loc !== "privy") return "There's nothing to pull free right now — just shit and piss.";
  if (ctx.has("outhouseMushrooms")) return "You already have the fresh mushrooms.";
  if (ctx.inventoryLoad() >= (ctx.world.config.maxCarry ?? 99))
    return "Your hands are full. You'll have to drop something before reaching into that.";
  ctx.moveItem("outhouseMushrooms", "inventory");
  return "You reach into the TOILET HOLE and pull the MUSHROOMS free. Your hand comes back coated in literal " +
    "shit and piss. The mushrooms are not cleaner.";
}
function reachIntoToilet(ctx, cmd) {
  const target = `${cmd.dobj || ""} ${cmd.iobj || ""}`.toLowerCase();
  if (!/\b(toilet|hole|mushroom|fungus)\b/.test(target)) return null;
  return takeToiletMushrooms(ctx);
}
function deriveCommand(ctx, cmd) {
  if (ctx.state.room !== "privy" || ctx.getFlag("outhouseMushroomsFound")) return [];
  if (!["take", "eat", "reach"].includes(cmd.verb)) return [];
  const target = `${cmd.dobj || ""} ${cmd.iobj || ""}`.toLowerCase();
  if (!/\b(mushroom|mushrooms|fungus|toilet|hole)\b/.test(target)) return [];
  inspectToilet(ctx);
  return ["look in toilet"];
}
// Once a batch of fresh mushrooms has actually been EATEN (destroyed), the
// TOILET HOLE has a small per-turn chance of growing a fresh crop — nature's
// own respawn. Taking the mushrooms without eating them (loc "inventory")
// doesn't trigger regrowth; the old batch is still out there, uneaten.
const MUSHROOM_REGROW_CHANCE = 0.1;
function mushroomRegrowTick(ctx) {
  if (ctx.getFlag("__noChaos")) return null; // deterministic test harness kill-switch
  if (!ctx.getFlag("outhouseMushroomsFound")) return null; // nothing has ever grown here
  const mushrooms = ctx.item("outhouseMushrooms");
  if (!mushrooms || mushrooms.loc !== null) return null; // still growing, in your pocket, or already regrown
  if (Math.random() >= MUSHROOM_REGROW_CHANCE) return null;
  ctx.moveItem("outhouseMushrooms", "privy");
  return ctx.state.room === "privy"
    ? "Something stirs in the TOILET HOLE — a fresh crop of purple MUSHROOMS has pushed up through the muck."
    : null; // regrew somewhere you aren't standing; no need to announce it
}
const SAFE_CODE = "739";
function safeCode(cmd) {
  return `${cmd.dobj || ""} ${cmd.iobj || ""}`.replace(/\D/g, "");
}
function finishOpeningSafe(ctx, source) {
  const safe = ctx.item("safe");
  safe.locked = false;
  safe.open = true;
  ctx.setFlag("safeCodePrompt", false);
  const inside = ctx.itemsIn("safe");
  return `${source} The safe clicks open` +
    (inside.length ? ", revealing " + inside.map((item) => item.names[0].toUpperCase()).join(", ") + "." : ".");
}
function enterSafeCode(ctx, cmd) {
  if (ctx.roomOf("safe") !== "parlor") return null;
  if (safeCode(cmd) !== SAFE_CODE) return "You dial that combination. The safe remains locked.";
  return finishOpeningSafe(ctx, "You dial seven left, three right, nine left.");
}
function openSafe(ctx, cmd) {
  const safe = ctx.item("safe");
  if (safe.open) return "The safe already stands open.";
  const suppliedCode = safeCode({ dobj: null, iobj: cmd.iobj });
  if (safe.locked && suppliedCode) {
    if (suppliedCode !== SAFE_CODE) return "You dial that combination. The safe remains locked.";
    return finishOpeningSafe(ctx, "You dial seven left, three right, nine left.");
  }
  if (safe.locked && !ctx.getFlag("knowsCombo")) {
    ctx.setFlag("safeCodePrompt", true);
    return "The safe has a combination dial. If you know the code, type it now.";
  }
  return finishOpeningSafe(ctx, "You dial the combination from the DIARY — seven left, three right, nine left.");
}

const TROLL_RHYMES = new Set(["more", "door", "floor", "core", "roar", "lore", "shore", "store", "before"]);
const TROLL_REJECTED_RHYMES = new Set([
  "adore", "boar", "bore", "chore", "explore", "fore", "four", "gore",
  "ignore", "oar", "or", "pore", "poor", "pour", "score", "snore",
  "sore", "therefore", "tore", "war", "wore", "yore",
]);
const TROLL_RIDDLE =
  "\"Past this door lie gold and ore,\n" +
  "Old crowns, old bones, and something more.\n" +
  "What fills a dragon's hidden store?\n" +
  "Treasure, terror, blood, and ____.\"";
const DRAGON_REBUKES = [
  {
    fire: true,
    text: "DREADMAW THE DRAGON cracks one eye and breathes a sheet of dragonfire over you. You are ON FIRE. " +
      "Then she lowers her head across the cave mouth again without moving an inch.",
  },
  {
    fire: true,
    text: "DREADMAW THE DRAGON opens her jaws, releases a cavern-shaking BELCH, and bathes you in burning apple-scented gas. " +
      "You are ON FIRE. She settles back across the cave mouth.",
  },
  {
    fire: true,
    text: "DREADMAW THE DRAGON rises just enough to spin around and unleash a thunderous FLAMING FART directly at you. " +
      "You are ON FIRE. She completes the turn and lies back down across the entrance.",
  },
  {
    text: "DREADMAW THE DRAGON'S tail snaps sideways like a siege engine. It launches you into open air, over the entire " +
      "HEDGE MAZE, and back to the FRONT GATE in a bruising crash landing.",
  },
  {
    text: "DREADMAW THE DRAGON swats you with one enormous foreclaw. You achieve involuntary flight across the GROUNDS and " +
      "crash beside the FRONT GATE, battered and several opinions poorer.",
  },
  {
    text: "DREADMAW THE DRAGON flicks you with the tip of her nose. The casual gesture sends you cartwheeling over the HEDGE " +
      "MAZE before you crater into the gravel at the FRONT GATE.",
  },
];
function dragonFire(ctx) {
  const outcome = DRAGON_REBUKES[Math.floor(Math.random() * DRAGON_REBUKES.length)];
  if (outcome.fire) {
    ctx.setFlag("onFire", true);
    ctx.setFlag("burnTurns", 0);
    ctx.setFlag("burnGrace", true);
  } else {
    ctx.state.room = "gate";
    ctx.setFlag("dragonInjuries", (ctx.getFlag("dragonInjuries") || 0) + 1);
    ctx.addScore(-3);
  }
  return outcome.text;
}
function talkToDragon(ctx) {
  if (ctx.getFlag("dragonFriendly")) {
    return "DREADMAW lowers her vast head companionably. \"The centuries are long, little apple-bringer. " +
      "Do try not to spend the doubloon somewhere vulgar. The troll inside handles visitors now.\"";
  }
  return dragonFire(ctx);
}
function wakeDragon(ctx) {
  if (ctx.getFlag("dragonFriendly")) return talkToDragon(ctx);
  return dragonFire(ctx);
}
function spokenLine(cmd) {
  const raw = (cmd.dobj || cmd.iobj || "").replace(/^['"]+|['"]+$/g, "");
  const spoken = raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : "...";
  return `"${spoken}"`;
}
function sayNearDragon(ctx, cmd) {
  if (ctx.getFlag("dragonFriendly")) return spokenLine(cmd) + "\n" + talkToDragon(ctx);
  return spokenLine(cmd) + "\n" + dragonFire(ctx);
}
function giveDragon(ctx, cmd) {
  const offered = ctx.find(cmd.dobj, ctx.inventory());
  if (!offered || offered.id !== "apple") return "DREADMAW does not stir. Perhaps offer her something worth waking for.";
  ctx.destroy("apple");
  ctx.setFlag("dragonAwake");
  ctx.setFlag("dragonMoved");
  ctx.setFlag("dragonFriendly");
  ctx.moveItem("goldDoubloon", "inventory");
  ctx.addScore(10);
  return "You offer the APPLE. One immense golden eye opens. DREADMAW THE DRAGON eats it with exquisite care, " +
    "then rises and coils beside the cave instead of across it.\n\n" +
    "\"At last, a visitor with manners,\" she says. \"Take this GOLD DOUBLOON. You may enter. " +
    "The troll inside decides who reaches the hoard.\" (+10)";
}
function talkToTroll(ctx) {
  if (ctx.getFlag("dragonVaultOpen")) {
    return "The TROLL stands aside from the open VAULT DOOR. \"You solved it. Go admire the loot.\"";
  }
  ctx.setFlag("trollAskedRiddle");
  return "The TROLL scratches one stone-hard ear. \"No coin, no combat. Finish the missing word and I move.\"\n\n" +
    TROLL_RIDDLE;
}
function openTrollVault(ctx, answer, anticipated = false) {
  ctx.setFlag("trollWrongGuesses", 0);
  ctx.setFlag("trollAskedRiddle");
  ctx.setFlag("dragonVaultOpen");
  if (anticipated) {
    return `You say ${answer.toUpperCase()}. The TROLL's eyebrows climb toward his craggy hairline. ` +
      "\"You answered before I even asked. Nobody does that.\"\n\n" +
      "He laughs, genuinely delighted, and lumbers aside. Deep locks answer one another inside the mountain, " +
      "and the vault door rolls open.";
  }
  return `You answer ${answer.toUpperCase()}. The TROLL grins, pleased by the rhyme, and lumbers aside. ` +
    "Deep locks answer one another inside the mountain, and the vault door rolls open.";
}
function answerTrollRiddle(ctx, cmd) {
  if (ctx.getFlag("dragonVaultOpen")) return talkToTroll(ctx);
  const addressed = cmd.iobj ? ctx.find(cmd.iobj) : null;
  const spoken = addressed?.id === "caveTroll"
    ? (cmd.dobj || "")
    : `${cmd.dobj || ""} ${cmd.iobj || ""}`;
  const words = spoken.trim().toLowerCase().match(/[a-z]+/g) || [];
  const answer = words.at(-1) || "";
  if (!ctx.getFlag("trollAskedRiddle")) {
    if (TROLL_RHYMES.has(answer)) return openTrollVault(ctx, answer, true);
    if (addressed?.id === "caveTroll") {
      return `(talk to TROLL)\n\n${talkToTroll(ctx)}`;
    }
    return "The TROLL folds his arms across the VAULT DOOR. Perhaps TALK TO TROLL before shouting answers.";
  }
  if (!TROLL_RHYMES.has(answer)) {
    const rejection = TROLL_REJECTED_RHYMES.has(answer)
      ? "It does rhyme, but it is not the word the TROLL is looking for."
      : "It does not rhyme with the TROLL's verse.";
    const wrongGuesses = (ctx.getFlag("trollWrongGuesses") || 0) + 1;
    if (wrongGuesses >= 3) {
      ctx.setFlag("trollWrongGuesses", 0);
      ctx.setFlag("trollAskedRiddle", false);
      ctx.state.room = "gate";
      return `You offer "${answer || "..."}." ${rejection} The TROLL holds up three stony fingers. "Three wrong answers." ` +
        "He stamps one enormous foot, the tunnel folds inside out, and you tumble onto the gravel at the FRONT GATE.";
    }
    ctx.setFlag("trollWrongGuesses", wrongGuesses);
    const remaining = 3 - wrongGuesses;
    return `You offer "${answer || "..."}." ${rejection} He does not move. ` +
      `${remaining === 1 ? "One guess remains." : `${remaining} guesses remain.`}`;
  }
  return openTrollVault(ctx, answer);
}

// --- End-screen achievement badges -------------------------------------------
function endBadges(ctx) {
  const b = [];
  if (ctx.getFlag("onFire"))
    b.push("🔥 BADGE: \"Out Of The Frying Pan\" — you escaped Blackwood Manor WHILE STILL ON FIRE. Gary is, for once, speechless.");
  if (ctx.getFlag("brazierLit"))
    b.push("🕯️ BADGE: \"The Old Ways\" — you lit the ceremonial brazier with your own burning body.");
  if ((ctx.getFlag("maxBurnTurns") || 0) >= 4)
    b.push("🥵 BADGE: \"Slow Burn\" — you stayed ablaze for " + ctx.getFlag("maxBurnTurns") + " turns and lived to tell it.");
  if (ctx.getFlag("drankMilk"))
    b.push("🥛 BADGE: \"Got Milk?\" — you found the one thing in that kitchen worth drinking.");
  return b.length ? "\n\n" + b.join("\n") : "";
}

const ROOM_ART = {
  gate: [
    "          /\\",
    "     ____/  \\____",
    "    /   BLACKWOOD \\",
    "===|_|_|========|_|===",
    "       ||      ||",
  ].join("\n"),
  garden: [
    "      _[]_       ____",
    "     / || \\     /    \\",
    "       ||      |  ()  |",
    "    __/  \\__    \\____/",
    "  ~~ weeds ~~     ||",
  ].join("\n"),
  privy: [
    "      _______",
    "     /       \\",
    "    |  _____  |",
    "    | /  O  \\ |",
    "    |/_______\\|",
  ].join("\n"),
  porch: [
    "   ______________",
    "  /              \\",
    " | [MAIL]  ||||| |",
    " |         | + | |",
    "_|_________|___|_|_",
  ].join("\n"),
  grandHall: [
    "       ( BELL )",
    "          |",
    "     _____|_____",
    "    /  /     \\  \\",
    "   /__/_______\\__\\",
    "      [|||||]",
  ].join("\n"),
  parlor: [
    "    .------------.",
    "    |   .----.   |",
    "    |  / o  o \\  |",
    "    |  \\  --  /  |",
    "    '----||------'",
  ].join("\n"),
  library: [
    "  |[]|[]|[]|[]|",
    "  |[]|[]|==|[]|",
    "  |[]|[]|()|[]|",
    "  |[]|[]|==|[]|",
    "  '-------------'",
  ].join("\n"),
  secretChamber: [
    "      ________",
    "     /  ____  \\",
    "    |  | /\\ |  |",
    "    |  |/==\\|  |",
    "    |___LECT___|",
  ].join("\n"),
  diningRoom: [
    "  __________________",
    " |                  |",
    " |       \\ | /      |",
    " |________\\|/_______|",
    "          /_\\",
  ].join("\n"),
  kitchen: [
    "  [MATCH]       __",
    "     |         /__\\",
    "   __|__      |____|",
    "  | O  O|   __[____]__",
    "  |_____|  | CELLAR  |",
  ].join("\n"),
  wineCellar: [
    " |o| |o| |o| |o|",
    " | | | | | | | |",
    " |o| |o| |o| |o|",
    " |_______________|",
    "       /____\\",
  ].join("\n"),
  crypt: [
    "       .-^-.",
    "    .-'     '-.",
    "   /  _______  \\",
    "  |  /_______\\  |",
    "  |_____________|",
  ].join("\n"),
  landing: [
    "      _______",
    "     |   o   |",
    "     |   |   |",
    " ____|___|___|",
    "    /_/ /_/",
  ].join("\n"),
  nursery: [
    "    __/\\__       ___",
    " __/ o  o \\__   /_*_\\",
    "   \\_====_/    |_____|",
    "     /  \\        | |",
    "   ROCKING      MUSIC",
  ].join("\n"),
  masterBedroom: [
    "   ______________",
    "  |\\            /|",
    "  | \\__________/ |",
    "  | |    BED   | |",
    "  |_|__________|_|",
  ].join("\n"),
  study: [
    "   ______________",
    "  |  OPEN DIARY  |",
    "  |_____/\\_______|",
    "    |   DESK   |",
    "    |__________|",
  ].join("\n"),
  attic: [
    "       /\\",
    "      /  \\",
    "  ___/____\\___",
    " /  []  /\\   \\",
    "/______/__\\___\\",
  ].join("\n"),
  hollowPassage: [
    "  /|            |\\",
    " / |            | \\",
    "|  |     ->     |  |",
    " \\ |            | /",
    "  \\|____________|/",
  ].join("\n"),
  hollowSanctum: [
    "       .-***-.",
    "     .'  (_)  '.",
    "    /    /|\\    \\",
    "   |     / \\  [ ]|",
    "    \\____NORTH___/",
  ].join("\n"),
  betweenWalls: [
    "||   ?    ?   ||",
    "||  /|   /|   ||",
    "|| / |  / |   ||",
    "||_______watch||",
  ].join("\n"),
};

const IMPLICIT_NAVIGATION = Object.freeze({
  gate: { in: "north", out: null },
  garden: { in: "enter well", out: "west" },
  hedgeMazeGate: { in: "west", out: "east" },
  hedgeMazeKnot: { in: "south", out: "east" },
  hedgeMazeLoop: { in: "east", out: "west" },
  dragonCaveMouth: { in: "east", out: "north" },
  dragonAntechamber: { in: "east", out: "west" },
  mineGallery: { in: "down", out: "west" },
  deepShaft: { in: "east", out: "up" },
  trollGate: { in: "east", out: "west" },
  dreadmawVault: { in: null, out: "west" },
  privy: { in: "enter toilet", out: "west" },
  porch: { in: "enter door", out: "south" },
  grandHall: { in: "enter secret door", out: "south" },
  parlor: { in: "south", out: "west" },
  library: { in: "down", out: "north" },
  secretChamber: { in: null, out: "up" },
  diningRoom: { in: "south", out: "east" },
  kitchen: { in: "down", out: "north" },
  wineCellar: { in: "south", out: "up" },
  crypt: { in: null, out: "north" },
  landing: { in: "up", out: "down" },
  nursery: { in: null, out: "east" },
  masterBedroom: { in: null, out: "west" },
  hallBedroom: { in: null, out: "south" },
  study: { in: null, out: "north" },
  attic: { in: "north", out: "down" },
  roof: { in: "east", out: "down" },
  belfry: { in: "down", out: "west" },
  hiddenVault: { in: null, out: "south" },
  hollowPassage: { in: "north", out: "south" },
  hollowSanctum: { in: "north", out: null },
  betweenWalls: { in: null, out: "out" },
});

// ---- the world ---------------------------------------------------------------
export const world = {
  config: {
    start: "gate",
    maxCarry: 6,
    title: "Blackwood Manor",
    equipmentSlots: ["head", "forehead", "eyes", "feet", "finger", "wrist", "neck"],
  },
  hotline,     // dial-in greeting for the 1-900 hint line (see below)
  hotlineTalk, // conversation handler while you're on the line
  garyTurnInfo, // classifies a hotline turn for the optional LLM voice layer
  phoneRank,   // hall-of-shame bill rank for the end screen
  tick: worldTick,   // per-turn: burn-up timer + food afflictions (may kill)
  statusBanner,      // ASCII fire / sickness art stamped onto room descriptions
  digestiveStatus,   // compact bowel-pressure/phase data for the always-on HUD
  fireStatus,        // remaining burn turns for the always-on HUD
  headlampStatus,    // remaining wearable HEADLAMP turns for the HUD
  lightStatus,       // remaining wearable HEADLAMP turns for the HUD
  visionStatus,      // temporary mushroom sight or permanent worn eye equipment
  flightStatus,      // temporary mushroom flight or permanent worn WINGED SHOES
  canFly,            // temporary mushroom flight or worn WINGED SHOES
  hasMushroomVision, // temporary mushroom sight or worn hidden-sight equipment
  hasDarkVision,     // temporary mushroom sight or worn XRAY GOGGLES
  deriveCommand,     // content-specific missing steps the parser may safely infer
  implicitNavigation: IMPLICIT_NAVIGATION,
  endBadges,         // win-screen achievement badges
  floatTo: floatToRoom,

  rooms: {
    gate: {
      name: "Front Gate",
      art: ROOM_ART.gate,
      desc:
        "You stand at the rusted iron FRONT GATE of BLACKWOOD MANOR as the last light drains " +
        "from the sky. The MANOR looms beyond a dead lawn, its windows like sockets. A " +
        "gravel path leads NORTH to the PORCH. A low wall gives way EAST to the OVERGROWN " +
        "GARDEN, while a black yew opening enters the HEDGE MAZE to the WEST.",
      searchDesc:
        "Fresh scuffs disturb the gravel toward the EASTERN GARDEN. WEST, scorched leaves disappear into the HEDGE MAZE.",
      exits: { north: "porch", east: "garden", west: "hedgeMazeGate" },
    },

    garden: {
      name: "Overgrown Garden",
      art: ROOM_ART.garden,
      desc:
        "Brambles have swallowed what was once a formal GARDEN. A weathered stone STATUE " +
        "of a robed woman leans amid the weeds, and a crumbling WELL shaft plunges into " +
        "blackness. A cold iron BRAZIER stands nearby. An ivy-choked brick OUTHOUSE squats to " +
        "the EAST; the FRONT GATE lies back to the WEST.",
      searchDesc(ctx) {
        if (!ctx.getFlag("statueMoved")) {
          return "The weeds around the leaning STATUE are crushed, and its base has scraped a shallow arc through " +
            "the soil. It looks heavy, but not immovable. The WELL would require a sound ROPE.";
        }
        if (!ctx.getFlag("wellLooted")) {
          return "The disturbed STATUE base has surrendered its secret. Wear on the WELL's lip suggests a ROPE could " +
            "make the descent survivable; old scorch marks around the BRAZIER suggest a much larger flame.";
        }
        return "The STATUE and WELL have yielded what they hid. Only the grave-damp BRAZIER still looks expectant.";
      },
      highDesc:
        "Stone and soil turn translucent. An IRON KEY glints beneath the STATUE, an ANCIENT COIN waits at the " +
        "bottom of the WELL, and old fire sleeps inside the BRAZIER.",
      extraDirections: ["down"],
      exits: { west: "gate", east: "privy" },
      on: {
        // "down" / "go down" / "climb down" all attempt the well.
        go(ctx, cmd) {
          if (cmd.dobj !== "down") return null;
          return descendWell(ctx);
        },
      },
    },

    hedgeMazeGate: {
        name: "Hedge Maze: Yew Gate",
        art: [
          "  ||||||     ||||||",
          "  ||  \\       /  ||",
          "  ||   \\_____/   ||",
          "  ||             ||",
        ].join("\n"),
        desc:
          "Black yew walls swallow the sky. The FRONT GATE is EAST; passages run WEST and SOUTH, both " +
          "already looking suspiciously familiar.",
        searchDesc:
          "Freshly snapped twigs and one enormous scale lie toward the WESTERN PASSAGE.",
        exits: { east: "gate", west: "hedgeMazeKnot", south: "hedgeMazeLoop" },
      },

    hedgeMazeKnot: {
        name: "Hedge Maze: Thorn Knot",
        art: [
          "  >>>>\\     /<<<<",
          "  >>>> \\___/ <<<<",
          "       /   \\",
          "  <<<< /     \\ >>>>",
        ].join("\n"),
        desc:
          "Three thorn corridors knot together beneath clawed branches. The air to the SOUTH smells faintly of apples and smoke.",
        searchDesc:
          "A trail of scorched leaves continues SOUTH. The WESTERN corridor circles toward your own footprints.",
        exits: { east: "hedgeMazeGate", west: "hedgeMazeLoop", south: "dragonCaveMouth" },
      },

    hedgeMazeLoop: {
        name: "Hedge Maze: Crooked Loop",
        art: [
          "  /\\/\\/\\/\\/\\/\\",
          "  \\          /",
          "   \\  LOOP  /",
          "    \\/\\/\\/\\/",
        ].join("\n"),
        desc:
          "The hedge bends back on itself with malicious precision. Every opening resembles the one you just used.",
        searchDesc:
          "Your overlapping footprints prove the NORTHERN opening is a loop; broken thorns point EAST toward the warmer air.",
        exits: { north: "hedgeMazeLoop", east: "hedgeMazeKnot", west: "hedgeMazeGate" },
      },

    dragonCaveMouth: {
        name: "Dreadmaw's Cave Mouth",
        art: [
          "       /\\___/\\",
          "   ___/  -.-  \\___",
          "  /____ DREADMAW ___\\",
          "      \\________/",
        ].join("\n"),
        desc:
          "A CAVE yawns in a basalt hill, but DREADMAW THE DRAGON sleeps across its entrance — an ancient female dragon " +
          "vast enough to serve as the door. The HEDGE MAZE lies NORTH. The CAVE is EAST, entirely blocked by the DRAGON.",
        searchDesc(ctx) {
          return ctx.getFlag("dragonMoved")
            ? "DREADMAW now rests beside the entrance, leaving the PASSAGE EAST open."
            : "Her nostrils smoke in her sleep. She will have to move before anything enters the CAVE.";
        },
        exits: {
          north: "hedgeMazeKnot",
          east: { to: "dragonAntechamber", via: "dragonMoved",
            lockedMsg: "DREADMAW is sleeping across the entire cave mouth. She has to move first." },
        },
        on: { say: sayNearDragon },
      },

    dragonAntechamber: {
        name: "Dragon Cave Antechamber",
        art: [
          "  |\\            /|",
          "  | \\  rails   / |",
          "  |  \\=====>  /  |",
          "  |___\\______/___|",
        ].join("\n"),
        desc:
          "The outer CAVE widens around rusted mine rails and abandoned ore carts. DREADMAW'S CAVE MOUTH " +
          "is WEST; the tunnel continues EAST into a MINING GALLERY.",
        searchDesc:
          "The rails vanish EAST beneath old timber braces. Pick marks in the basalt suggest someone mined here before DREADMAW arrived.",
        exits: { west: "dragonCaveMouth", east: "mineGallery" },
      },

    mineGallery: {
      name: "Mining Gallery",
      art: [
        "  |--|--|--|--|",
        "  |  o==>      |",
        "  |_/|\\________|",
        "    / \\  rails",
      ].join("\n"),
      desc:
        "A timber-braced MINING GALLERY follows a rusted rail line. A battered HEADLAMP hangs from a support post. " +
        "The DRAGON CAVE ANTECHAMBER is WEST; a ladder descends DOWN into a DEEP MINING SHAFT.",
      searchDesc:
        "The HEADLAMP still has a sealed battery pack. The rails and fresher TROLL footprints both continue DOWN.",
      exits: { west: "dragonAntechamber", down: "deepShaft" },
    },

    deepShaft: {
      name: "Deep Mining Shaft",
      art: [
        "  |\\          /|",
        "  | \\   ||   / |",
        "  |  \\  ||  /  |",
        "  |___\\_||_/___|",
      ].join("\n"),
      desc:
        "A DEEP MINING SHAFT drops through wet black stone. Broken ladders and narrow ledges descend between " +
        "abandoned seams. The MINING GALLERY is UP; a worked tunnel runs EAST to the TROLL GATE.",
      searchDesc:
        "Heavy bare footprints lead EAST. Without a reliable light, every ledge here would be a wager with the dark.",
      dark: true,
      exits: { up: "mineGallery", east: "trollGate" },
    },

    trollGate: {
      name: "Troll Gate",
      art: [
        "  |\\    TROLL   /|",
        "  | \\  .-^^-.  / |",
        "  |  \\[ DOOR ]/  |",
        "  |___\\______/___|",
      ].join("\n"),
      desc:
        "The tunnel ends at a seamless black VAULT DOOR. A broad, warty TROLL sits directly in front of it. " +
        "The DEEP MINING SHAFT lies WEST; DREADMAW'S hoard is sealed EAST.",
      searchDesc:
        "No keyhole interrupts the VAULT DOOR. The TROLL watches you expectantly, as if waiting to ask something.",
      exits: {
        west: "deepShaft",
        east: { to: "dreadmawVault", via: "dragonVaultOpen",
          lockedMsg: "The inner VAULT DOOR remains sealed behind the TROLL." },
      },
      on: { say: answerTrollRiddle },
    },

    dreadmawVault: {
        name: "Dreadmaw's Vault",
        aliases: ["dreadmaw vault", "dragon hoard", "cave of riches", "hoard"],
        art: [
          "   $  *  $  *  $",
          "  /_____________\\",
          " /_$$_GEMS_$$_*__\\",
          " \\_______________/",
        ].join("\n"),
        desc:
          "Gold rises in dunes beneath a ceiling lost in darkness. Jeweled cups, crowns, and inconveniently " +
          "large gemstones fill DREADMAW'S VAULT. Among the dragon-gold, two pieces bear the Blackwood crest — " +
          "a SILVER CHALICE and a JEWELED CROWN, family heirlooms this wyrm plainly stole long ago. The TROLL GATE is WEST.",
        searchDesc:
          "This is generational dragon wealth, not loose change. A GOLD BAR and WINGED SHOES sit apart as the TROLL'S prizes, " +
          "while the SILVER CHALICE and JEWELED CROWN are unmistakably BLACKWOOD work — they belong back in the RELIQUARY.",
        exits: { west: "trollGate" },
      },

    privy: {
      name: "Ivy-Choked Privy",
      art: ROOM_ART.privy,
      desc:
        "A cramped brick OUTHOUSE strangled in ivy. Its only fixture is a rough wooden seat over a dark " +
        "TOILET HOLE in the earth. Fresh purple MUSHROOMS grow from the filth inside. The GARDEN lies WEST.",
      searchDesc:
        "There are no pipes, tank, or porcelain — just a load-bearing seat and a TOILET HOLE. The fresh " +
        "source of the faint purple glimmer is somewhere DOWN inside it. You would have to LOOK IN.",
      exits: { west: "garden" },
      on: { reach: reachIntoToilet },
    },

    porch: {
      name: "Front Porch",
      art: ROOM_ART.porch,
      desc:
        "The PORCH boards sag underfoot. A brass MAILBOX is bolted beside a great oak " +
        "FRONT DOOR, its wood black with age. The path returns SOUTH to the FRONT GATE.",
      searchDesc(ctx) {
        const mailbox = ctx.item("mailbox");
        return mailbox && mailbox.open
          ? "The open MAILBOX has no false back. The FRONT DOOR's iron lock is old but functional; it needs a real KEY."
          : "The MAILBOX lid has a finger-worn edge and no lock. The FRONT DOOR's iron keyhole is too large for subtle tools.";
      },
      exits: {
        south: "gate",
        north: { to: "grandHall", via: "frontDoorOpen", lockedMsg: "The front door is shut fast." },
      },
    },

    grandHall: {
      name: "Grand Hall",
      art: ROOM_ART.grandHall,
      desc:
        "A vast, cobwebbed GRAND HALL rises two storeys to a shattered chandelier. A grand " +
        "staircase climbs UP into shadow. Set into the far wall is a stone RELIQUARY, and " +
        "above it hangs a great brass BELL on a frayed rope. Doorways lead EAST to the " +
        "PARLOR and WEST to the DINING ROOM; the PORCH lies SOUTH.",
      searchDesc(ctx) {
        if (ctx.getFlag("bellRung")) {
          return "The BELL is spent. Fresh stone dust outlines the impossible SECRET DOOR in the NORTH wall, and the BONE " +
            "KEY's tooth-shaped profile matches its lock.";
        }
        if (ctx.getFlag("curseLiftable")) {
          return "Every filled recess in the RELIQUARY glows faintly. Above it, the BELL rope trembles though the air is still.";
        }
        return "The RELIQUARY contains eight heirloom-shaped recesses. The BELL rope hangs directly above them, " +
          "waiting for a collection not yet complete.";
      },
      highDesc: "The shelves become transparent enough to reveal a hidden stair folding DOWN behind the brass LEVER.",
      exits: {
        south: "porch", east: "parlor", west: "diningRoom", up: "landing",
        north: { to: "hollowPassage", via: "secretWingOpen",
          revealedBy: "bellRung",
          lockedMsg: "There's a seam in the north wall now, but it won't open on its own." },
      },
      on: {
        // Deposit heirlooms into the reliquary (scoring the deposit).
        put(ctx, cmd) {
          if (!cmd.iobj) return null;
          const dest = ctx.find(cmd.iobj);
          if (!dest || dest.id !== "reliquary") return null; // let generic put handle other containers
          const it = ctx.find(cmd.dobj, ctx.inventory());
          if (!it) return "You aren't carrying that.";
          if (it.worn) return `Remove the ${it.names[0]} before putting it anywhere.`;
          if (!it.treasure && !it.bonusTreasure) return `The reliquary is meant for treasure and heirlooms; it will not accept the ${it.names[0]}.`;
          const alreadyLiftable = ctx.getFlag("curseLiftable");
          ctx.moveItem(it.id, "reliquary");
          ctx.addScore(it.points || 0);
          let msg = `You lay the ${it.names[0]} in the reliquary. It settles with a low, resonant hum.`;
          if (allTreasuresDeposited(ctx) && !alreadyLiftable) {
            ctx.setFlag("curseLiftable");
            msg += "\n\nAs the last family heirloom touches stone, every heirloom begins to glow. The air " +
              "grows thick and cold, and the great brass bell above the reliquary trembles as if " +
              "it longs to be RUNG.";
          }
          return msg;
        },
        ring(ctx, cmd) {
          const it = cmd.dobj ? ctx.find(cmd.dobj) : null;
          if (it && it.id !== "bell") return null;
          if (!ctx.getFlag("curseLiftable")) {
            return "You seize the frayed rope and ring the great bell. Its toll rolls through the " +
              "empty house and dies away. Nothing answers — the heirlooms are not all gathered.";
          }
          if (ctx.getFlag("bellRung")) {
            return "The bell's work is done. Something waits behind the new door to the north.";
          }
          ctx.setFlag("bellRung");
          ctx.moveItem("boneKey", "grandHall");
          ctx.moveItem("secretDoor", "grandHall");
          return "You seize the rope and ring the great bell. Its toll swells until the walls shudder; " +
            "the gathered heirlooms blaze with light, the shadows shriek and recoil, and the curse of " +
            "Blackwood shatters like dropped glass.\n\n" +
            "But the house is not finished with you. Among the glowing heirlooms a slender BONE KEY rises, " +
            "turns once in the air, and clatters to the flagstones at your feet. Behind you, with a grinding " +
            "of hidden stone, a SECRET DOOR opens in the north wall of the hall — onto a passage that should not exist.";
        },
      },
    },

    parlor: {
      name: "Parlor",
      art: ROOM_ART.parlor,
      desc:
        "A mouldering PARLOR of draped furniture. Above the cold fireplace hangs a huge, " +
        "grim PROFILE PAINTING of a bearded patriarch, whose eyes seem to track you. An archway " +
        "returns WEST to the GRAND HALL; a low door leads SOUTH to the LIBRARY.",
      searchDesc(ctx) {
        return ctx.getFlag("safeRevealed")
          ? "Behind the swung-aside PROFILE PAINTING, the iron SAFE's combination dial shows recent fingerprints."
          : "The PROFILE PAINTING frame stands proud of the wall. One side has hinges; the other has fingerprints where a hand might push.";
      },
      highDesc: "The wall behind the PROFILE PAINTING shimmers around the hard rectangular outline of an IRON SAFE.",
      exits: { west: "grandHall", south: "library" },
      on: { code: enterSafeCode },
    },

    library: {
      name: "Library",
      art: ROOM_ART.library,
      desc:
        "Floor-to-ceiling shelves sag under rotting books. One shelf bears a curious brass " +
        "LEVER where a book should be. The PARLOR lies NORTH.",
      searchDesc(ctx) {
        return ctx.getFlag("leverPulled")
          ? "Scrape marks confirm the open bookcase is a counterweighted door. The concealed stair descends DOWN into darkness."
          : "The brass LEVER is polished by hands while every nearby book is thick with dust. It was meant to be pulled.";
      },
      exits: {
        north: "parlor",
        down: { to: "secretChamber", via: "leverPulled", revealedBy: "leverPulled",
          lockedMsg: "The shelves stand solid and shut." },
      },
    },

    secretChamber: {
      name: "Hidden Chamber",
      art: ROOM_ART.secretChamber,
      desc:
        "A cramped HIDDEN CHAMBER that has not seen daylight in a century. A single lectern " +
        "stands at its centre. The only way out is the stair UP to the LIBRARY.",
      searchDesc:
        "The lectern's silver clasp-marks fit the GRIMOIRE exactly. Nothing else here has survived except the warning chill.",
      dark: true,
      exits: { up: "library" },
    },

    diningRoom: {
      name: "Dining Room",
      art: ROOM_ART.diningRoom,
      desc:
        "A long banquet table lies buried under dust and fallen plaster. Upon it, " +
        "improbably, stands a tarnished silver CANDLESTICK, its candle unburnt. The GRAND HALL " +
        "is EAST; a swinging door leads SOUTH to the KITCHEN.",
      searchDesc:
        "Everything is dust-choked except the CANDLESTICK's wick. It is dry and usable, but it will need the MANOR'S " +
        "single precious MATCH.",
      exits: { east: "grandHall", south: "kitchen" },
    },

    kitchen: {
      name: "Kitchen",
      art: ROOM_ART.kitchen,
      desc:
        "A cavernous scullery of cold ranges and rusted hooks. A coil of stout ROPE hangs " +
        "on one hook, and a box of MATCHES sits on the sill. A heavy CELLAR DOOR is set in " +
        "the floor. The DINING ROOM lies NORTH.",
      searchDesc:
        "The MATCHBOX contains exactly one MATCH. The ROPE remains sound, the CELLAR DOOR has a lift-ring, and the " +
        "sweating super BURRITO appears to violate several eras of food-safety law.",
      exits: {
        north: "diningRoom",
        down: { to: "wineCellar", via: "cellarOpen", lockedMsg: "The cellar door is shut." },
      },
    },

    wineCellar: {
      name: "Wine Cellar",
      art: ROOM_ART.wineCellar,
      desc:
        "Racks of burst and blackened bottles line the dripping WINE CELLAR. One survivor gleams: " +
        "a CRYSTAL DECANTER of something that still catches the light. Stone steps climb UP " +
        "to the KITCHEN; an arch leads SOUTH, deeper, into a cold that raises the hairs on your neck.",
      searchDesc:
        "The DECANTER is the only intact valuable. Frost rims the SOUTHERN arch in the shape of grasping fingers; " +
        "crossing it without the TALISMAN feels terminal.",
      dark: true,
      exits: { up: "kitchen", south: "crypt" },
      on: {
        go(ctx, cmd) {
          if (cmd.dobj !== "south") return null;
          const tal = ctx.item("talisman");
          const protectedNow = tal && tal.loc === "inventory" && tal.worn;
          if (!protectedNow) {
            return ctx.kill(
              "You step through the arch into the crypt. From the great sarcophagus a WRAITH " +
              "rises — a shriek of cold and hatred given shape. Before you can flee it sweeps " +
              "through you, and your heart simply stops."
            );
          }
          ctx.state.room = "crypt";
          return ctx.describeRoom();
        },
      },
    },

    crypt: {
      name: "Crypt",
      art: ROOM_ART.crypt,
      desc:
        "A low CRYPT of Blackwood dead. The WRAITH that guards it cowers from the TALISMAN " +
        "at your breast, hissing in the corners. On the central sarcophagus lies a GOLD " +
        "LOCKET. The only way out is NORTH to the WINE CELLAR.",
      searchDesc:
        "The TALISMAN's warmth pushes the WRAITH back whenever you approach the sarcophagus. The GOLD LOCKET is now within reach.",
      dark: true,
      exits: { north: "wineCellar" },
    },

    landing: {
      name: "Upstairs Landing",
      art: ROOM_ART.landing,
      desc:
        "A long UPSTAIRS LANDING overlooks the GRAND HALL below. Doors open WEST to the NURSERY, " +
        "EAST to the MASTER BEDROOM, NORTH to the HALL BEDROOM, and SOUTH to the STUDY. A frayed CORD dangles from a " +
        "trap-door in the ceiling. The stairs go DOWN.",
      searchDesc(ctx) {
        return ctx.getFlag("ladderDown")
          ? "The lowered ATTIC ladder groans under its own weight. Climbing it while heavily laden would be suicidal."
          : "The CORD is connected to the ceiling trap-door and has a clean, hand-width patch near its end. Pulling it should lower something.";
      },
      extraDirections: (ctx) => (canFly(ctx) || ctx.getFlag("ladderDown")) ? ["up"] : [],
      exits: { down: "grandHall", north: "hallBedroom", west: "nursery", east: "masterBedroom", south: "study" },
      on: {
        // The attic ladder is flimsy: climb it laden and it — and you — come down hard.
        // Any flight source (mushroom high or worn WINGED SHOES) bypasses the ladder
        // entirely, floating straight up through the shut trap-door.
        go(ctx, cmd) {
          if (cmd.dobj !== "up") return null;
          if (canFly(ctx)) {
            const byShoes = !((ctx.getFlag("high") || 0) > 0);
            ctx.state.room = "attic";
            return (byShoes
              ? "The WINGED SHOES lift you straight up through the trap-door and into the ATTIC, the rotten ladder irrelevant."
              : "You float through the closed trap-door as if wood were only a suggestion.")
              + "\n\n" + ctx.describeRoom();
          }
          if (!ctx.getFlag("ladderDown")) return "There is no way up; the trap-door is shut.";
          if (ctx.inventoryLoad() > 2) {
            return ctx.kill(
              "You climb the flimsy attic ladder, but weighed down as you are, the rotted rungs " +
              "give way — and then the attic floor itself. You fall through in a roar of splintered " +
              "wood and lie still among the wreckage."
            );
          }
          ctx.state.room = "attic";
          return ctx.describeRoom();
        },
      },
    },

    nursery: {
      name: "Nursery",
      art: ROOM_ART.nursery,
      desc:
        "A child's NURSERY, its WALLPAPER peeling in long tongues. A rocking horse stares " +
        "with one glass eye. On a shelf sits a JEWELED MUSIC BOX. The UPSTAIRS LANDING lies EAST.",
      searchDesc:
        "The MUSIC BOX lid has a tiny spring catch. Something metallic rattles inside when the box is tilted. " +
        "One curling tongue of WALLPAPER, low near the baseboard, looks looser than the rest.",
      highDesc: "The MUSIC BOX turns transparent. A TINY KEY gleams inside its closed lid.",
      exits: {
        east: "landing",
        // A crawl-gap into the space between the walls — the one deliberate,
        // repeatable way in, versus the mystery package/lightning bolt's luck.
        in: { to: "betweenWalls", via: "wallGapFound", revealedBy: "wallGapFound",
          lockedMsg: "The wallpaper is just wallpaper, near as you can tell." },
      },
    },

    masterBedroom: {
      name: "Master Bedroom",
      art: ROOM_ART.masterBedroom,
      desc:
        "A great canopied bed rots beneath a collapsed tester in the MASTER BEDROOM. On the vanity stands a locked " +
        "JEWELRY BOX of dark walnut. The UPSTAIRS LANDING lies WEST.",
      searchDesc:
        "The JEWELRY BOX's keyhole is absurdly small. A normal door KEY could never fit it; a miniature KEY might.",
      highDesc: "The dark wood becomes glassy, revealing a RUBY RING inside the locked JEWELRY BOX.",
      exits: { west: "landing" },
    },

    study: {
      name: "Study",
      art: ROOM_ART.study,
      desc:
        "A book-lined STUDY with a great oak DESK. A leather-bound DIARY lies open upon it, " +
        "as though its writer had just stepped away. The UPSTAIRS LANDING lies NORTH.",
      searchDesc:
        "The DIARY is open to a page dog-eared so aggressively it can only be important. Several numbers are underlined in ink.",
      exits: { north: "landing" },
    },

    hallBedroom: {
      name: "Hall Bedroom",
      art: [
        "  .--------------.",
        "  | BED    ( O ) |",
        "  |        [_]   |",
        "  '----DOOR------'",
      ].join("\n"),
      desc:
        "A narrow HALL BEDROOM lies NORTH of the UPSTAIRS LANDING. A neatly made BED faces a tarnished MIRROR. " +
        "Beside it stands a NIGHT TABLE with a small LAMP and a closed DRAWER.",
      searchDesc:
        "The BED is untouched, the MIRROR is clouded, and the NIGHT TABLE'S DRAWER has a cheap plastic handle.",
      exits: { south: "landing" },
    },

    attic: {
      name: "Attic",
      art: ROOM_ART.attic,
      desc:
        "A vast, raftered ATTIC, silver with moonlight through a broken skylight. Amid the " +
        "shrouded lumber leans a small ANCESTRAL PORTRAIT in a gilt frame. The ladder leads DOWN.",
      searchDesc:
        "The ANCESTRAL PORTRAIT is valuable and portable. The ladder flexes ominously even before you add the weight of a full inventory.",
      extraDirections: (ctx) => canFly(ctx) ? ["up"] : [],
      exits: {
        down: "landing",
        // The astral door in the north gable — hidden and impassable until the
        // mushroom trip's third eye has shown it to you (sets vaultFound).
        north: { to: "hiddenVault", via: "vaultFound", revealedBy: "vaultFound",
          lockedMsg: "The NORTH gable is blank plaster and close shadow. Your ordinary eyes find no seam." },
      },
      on: {
        go(ctx, cmd) {
          if (cmd.dobj !== "up") return null;
          if (!canFly(ctx))
            return "The broken skylight is far above you. You need MUSHROOM flight or something worn on your FEET.";
          ctx.state.room = "roof";
          return "You rise through the broken skylight and settle onto the ROOF.\n\n" + ctx.describeRoom();
        },
      },
    },

    roof: {
      name: "Manor Roof",
      aliases: ["roof"],
      art: [
        "       /\\       |^|",
        "  ____/  \\______| |",
        " /_______________\\|",
        "      ROOFLINE",
      ].join("\n"),
      desc:
        "Slate ridges roll across the MANOR ROOF beneath the open sky. The broken ATTIC skylight is DOWN; " +
        "a narrow ridge runs EAST to the BELFRY.",
      searchDesc:
        "Only someone able to fly could cross the missing slates safely. The BELFRY'S louvers stand open.",
      exits: { down: "attic", east: "belfry" },
    },

    belfry: {
      name: "Belfry",
      art: [
        "      ______",
        "     / BELL \\",
        "    |   ()   |",
        "    |___||___|",
      ].join("\n"),
      desc:
        "The BELFRY crouches above the roofline around a weather-blackened bell. The MANOR ROOF is WEST. " +
        "A narrow maintenance hatch descends DOWN into the HIDDEN VAULT.",
      searchDesc:
        "The hatch bypasses the sealed ATTIC gable entirely. Its iron ladder drops directly beside the OBSIDIAN EYE.",
      exits: { west: "roof", down: "hiddenVault" },
    },

    // --- The astral treasure vault, reached by altered sight, flight, or belfry --
    hiddenVault: {
      name: "Hidden Vault",
      art: [
        "  .==============.",
        "  |  .--------.  |",
        "  |  |  (())  |  |",
        "  |  '--------'  |",
        "  '=============='",
      ].join("\n"),
      desc:
        "A windowless HIDDEN VAULT the living were never meant to find, mortared behind the ATTIC'S NORTH " +
        "gable. On a low stone plinth rests a single OBSIDIAN EYE — a cold sphere of black glass that " +
        "seems to watch you back. The ATTIC lies SOUTH; a BELFRY ladder climbs UP.",
      searchDesc:
        "The OBSIDIAN EYE drinks whatever light your sight gives it. Lifting it feels less like taking and more like being chosen.",
      dark: true,
      exits: { south: "attic", up: "belfry" },
    },

    // --- The hidden wing, revealed only after the curse is lifted (bell rung) ---
    hollowPassage: {
      name: "Hollow Passage",
      art: ROOM_ART.hollowPassage,
      desc:
        "A narrow HOLLOW PASSAGE of pale stone the MANOR kept hidden all this time. It is oddly warm, " +
        "and lit by no lamp you can find — as if the walls themselves remember daylight. The GRAND HALL " +
        "lies back to the SOUTH; the PASSAGE runs NORTH.",
      searchDesc:
        "No mechanism or side PASSAGE interrupts the pale stone. The warmth and faint light both strengthen toward the NORTH.",
      exits: { south: "grandHall", north: "hollowSanctum" },
    },
    hollowSanctum: {
      name: "The Hollow Sanctum",
      art: ROOM_ART.hollowSanctum,
      desc:
        "A round, domed HOLLOW SANCTUM at the MANOR'S secret heart, filled with a soft grey light. The pale " +
        "SPIRIT of a robed woman waits beside a pedestal, and upon the pedestal rests a SILVER MIRROR. " +
        "Beyond her, an archway opens NORTH onto a growing dawn.",
      searchDesc:
        "The SPIRIT guards nothing now. The SILVER MIRROR lifts freely from its pedestal, and the NORTHERN dawn feels like an ending.",
      extraDirections: ["north"],
      exits: { south: "hollowPassage" },
      on: {
        // Step into the dawn to truly finish. Keeping the mirror earns a bonus.
        go(ctx, cmd) {
          if (cmd.dobj !== "north" && cmd.dobj !== "out") return null;
          const bonus = ctx.has("silverMirror") ? 30 : 0;
          if (bonus) ctx.addScore(bonus);
          return ctx.win(
            "You step through the archway into the first clean dawn Blackwood Manor has seen in a hundred " +
            "years. Behind you the spirit lifts her head, smiles — truly smiles — and fades, at peace at last." +
            (bonus
              ? "\n\nThe silver mirror is yours: a final heirloom, and proof you saw this through to the very end."
              : "\n\n(You left the silver mirror on its pedestal. Noble, maybe. Gary would call you a fool.)")
          );
        },
      },
    },

    // --- The one room with no door — reachable only by random teleport ------
    betweenWalls: {
      name: "The Space Between the Walls",
      art: ROOM_ART.betweenWalls,
      desc:
        "You are somewhere the blueprints of BLACKWOOD MANOR insist does not exist: a dust-soft crawl-gap " +
        "between two walls, lit by no source you can name. Old newspaper insulation bulges from the studs, " +
        "and a tarnished BACKWARDS WATCH ticks, counter-clockwise, from a bent nail. There is no door here — " +
        "only an unnatural OUT.",
      searchDesc:
        "Whoever built this space built it to be forgotten. The BACKWARDS WATCH is the only thing in it that " +
        "isn't dust.",
      exits: { out: "grandHall" },
    },
  },

  items: {
    // --- reliquary & bell (grand hall) ---
    reliquary: {
      names: ["reliquary"], loc: "grandHall", fixed: true, container: true, capacity: 20,
      desc: "A niche of carved stone, hungry-looking, waiting to be filled with the family's heirlooms.",
    },
    bell: {
      names: ["bell", "rope"], adjectives: ["brass", "great"], loc: "grandHall", fixed: true, scenery: true,
      desc: "A great brass bell hung above the RELIQUARY, a frayed pull-rope trailing from it.",
      searchActions: ["ring"],
    },

    // --- a gift that very much does not want to be opened ---
    mysteryPackage: {
      names: ["package", "box", "parcel", "gift"], adjectives: ["mystery", "nice", "wrapped", "ribboned"],
      loc: "grandHall", takeable: true, readable: true,
      roomDesc: "A suspiciously nice, ribbon-tied PACKAGE sits on the floor, propped against the wall.",
      desc: "A beautifully wrapped package, ribbon and all, entirely out of place in this cobwebbed ruin. A " +
        "small card is tucked under the bow. It reads:\n\n" +
        "\"DO NOT OPEN ME. NOPE NOPE NOPE. You are going to regert it! That's right — regert, not regret.\"",
      text:
        "\"DO NOT OPEN ME. NOPE NOPE NOPE. You are going to regert it! That's right — regert, not regret.\"",
      on: { open: openMysteryPackage },
    },

    // --- a bolt of lightning that speared into the floor and is, somehow, still here ---
    lightningBolt: {
      names: ["bolt", "lightning"], adjectives: ["lightning", "crackling", "jagged"],
      loc: null, fixed: true,
      roomDesc: "A jagged bolt of LIGHTNING is speared into the floor here, hissing and crackling, scorch " +
        "marks spreading outward.",
      desc: "Still crackling, blue-white and hair-raising, driven into the floorboards like it's daring you " +
        "to get closer.",
      on: { touch: touchLightningBolt },
    },

    // --- getting inside ---
    statue: {
      names: ["statue", "woman"], adjectives: ["stone", "robed"], loc: "garden", fixed: true, scenery: true,
      desc: "A robed stone woman, features worn smooth. She leans oddly, as if something props her up.",
      on: { move: revealKey, push: revealKey, pull: revealKey, examine: revealKey },
    },
    well: {
      names: ["well", "shaft"], loc: "garden", fixed: true, scenery: true,
      desc: "A round stone well, its bucket and windlass long gone. The shaft drops into " +
        "pure black — a long way DOWN. Without a ROPE to climb back out, going DOWN there " +
        "would be the last thing you ever did.",
      on: { enter: descendWell, climb: descendWell },
    },
    frontKey: {
      names: ["key"], adjectives: ["iron", "front", "door", "heavy"], loc: null, takeable: true,
      desc: "A heavy iron door-key, cold and gritty with earth.",
    },
    mailbox: {
      names: ["mailbox"], adjectives: ["brass"], loc: "porch", fixed: true, container: true,
      openable: true, open: false, capacity: 2,
      desc: "A dented brass mailbox bolted to the PORCH rail.",
    },
    letter: {
      names: ["letter"], loc: "mailbox", takeable: true, readable: true,
      desc: "A single sheet of good paper, water-stained.",
      text:
        "The letter reads: \"To whoever inherits this cursed MANOR — the family's heirlooms must be returned " +
        "to the RELIQUARY in the GRAND HALL, all of them, and the BELL rung, or the curse will never lift. " +
        "Do not linger in the dark. And God help you in the CRYPT.\"",
      on: { burn: burnLetter },
    },

    // --- the ceremonial brazier + its reward (garden) ---
    brazier: {
      names: ["brazier", "firebowl", "bowl"], adjectives: ["iron", "cold", "ceremonial", "old"],
      loc: "garden", fixed: true,
      roomDesc: "A cold iron BRAZIER stands on a tripod amid the weeds, heaped with damp moss.",
      desc: "A cold iron brazier on a rusted tripod, heaped with grave-damp moss and packed black kindling. " +
        "Old scorch-marks ring its base — it has been lit before, for something. A mere match won't touch moss this wet.",
      on: { light: lightBrazier, burn: lightBrazier },
    },
    emberStone: {
      names: ["ember", "emberstone", "stone"], adjectives: ["ember", "warm", "glowing"],
      loc: null, takeable: true, treasure: false,
      desc: "A smooth grey stone that holds a live coal's warmth and a faint inner glow. It never quite cools.",
      on: {
        take(ctx) {
          if (ctx.has("emberStone")) return "You already carry the EMBER STONE.";
          ctx.moveItem("emberStone", "inventory");
          ctx.addScore(8);
          return "You pocket the EMBER STONE. Its live-coal warmth settles against you like a small, patient " +
            "heartbeat — a keepsake of the fire you gave away, and proof you walked back out of it. (+8)";
        },
      },
    },

    // --- kitchen edibles: high / sick / help ---
    mushrooms: {
      names: ["mushrooms", "mushroom", "fungus"], adjectives: ["dried", "shriveled", "purple"],
      loc: "kitchen", takeable: true, edible: true, highTurns: 12,
      roomDesc: "A dried cluster of shriveled purple MUSHROOMS rests on the windowsill.",
      desc: "Dried purple mushrooms, faintly luminous and just as potent as a fresh cluster.",
      on: { eat: eatMushrooms },
    },
    outhouseMushrooms: {
      names: ["mushrooms", "mushroom", "fungus"],
      adjectives: ["fresh", "shit-fueled", "purple", "toilet"],
      loc: null, takeable: true, edible: true, fresh: true, highTurns: 12,
      roomDesc: "Inside the TOILET HOLE, fresh MUSHROOMS glisten with unmistakable shit and piss.",
      desc: "Fresh, shit-fueled purple mushrooms from inside the TOILET HOLE. They are visibly wet with literal waste.",
      on: { take: takeToiletMushrooms, eat: eatMushrooms },
    },
    burrito: {
      names: ["burrito", "wrap"], adjectives: ["aged", "super", "spicy", "death-wish", "questionable"],
      loc: "kitchen", takeable: true, edible: true,
      roomDesc: "A foil-wrapped GARY'S MEGA ASS BLOW TAQUERIA DEATH WISH SPICY BURRITO sweats on the table.",
      desc: "Gary's Mega Ass Blow Taqueria Death Wish Spicy Burrito is an aged, foil-wrapped monument to bad " +
        "judgment. A forensic cross-section reveals two kinds of beans, three kinds of cheese, four kinds of meat, " +
        "and highly questionable lettuce that looks capable of carrying Cyclospora cayetanensis. Against all " +
        "available evidence, it may be edible if you're feeling adventurous.",
      on: {
        eat: eatBurrito,
      },
    },
    obsidianEye: {
      names: ["obsidian eye", "eye", "sphere", "orb"], adjectives: ["obsidian", "black", "cold", "glass", "scrying"],
      loc: "hiddenVault", takeable: true, wearable: true, worn: false,
      wearSlot: "forehead", grantsHiddenSight: true,
      roomDesc: "A cold OBSIDIAN EYE rests on the plinth, watching.",
      desc: "A sphere of black volcanic glass, cold as the CRYPT and faintly, wrongly aware. Its underside is " +
        "unnaturally adhesive: WEAR it on your FOREHEAD as a third eye to expose things the MANOR keeps hidden. " +
        "It does not produce light.",
      on: { take: takeObsidianEye },
    },
    burritoWrapper: {
      names: ["wrapper", "foil", "tinfoil"], adjectives: ["burrito", "crumpled", "used", "tin"],
      loc: null, takeable: true,
      roomDesc: "The crumpled BURRITO WRAPPER and its greasy tin foil lie here.",
      desc: "The used burrito wrapper is laminated with a stubborn sheet of tin foil. It smells dangerous, but " +
        "its shiny inner surface looks capable of redirecting a brief digestive flame.",
    },
    milk: {
      names: ["milk", "bottle"], adjectives: ["cold", "fresh", "glass"],
      loc: "kitchen", takeable: true, drinkable: true,
      roomDesc: "A cold BOTTLE OF MILK sits untouched in the pantry nook.",
      desc: "A sealed glass bottle of fresh milk, impossibly cold and apparently safe to drink.",
      on: { drink: drinkMilk },
    },
    apple: {
      names: ["apple"], adjectives: ["red", "crisp", "kitchen"],
      loc: "kitchen", takeable: true, edible: true,
      roomDesc: "A single crisp red APPLE sits in a shallow pantry basket.",
      desc: "A flawless red apple. In this KITCHEN, its lack of mould is almost supernatural.",
    },
    toilet: {
      names: ["toilet", "hole", "latrine", "loo"], adjectives: ["outhouse", "dark", "earthen"],
      loc: "privy", fixed: true, container: true, open: true, capacity: 8,
      roomDesc: "A rough TOILET HOLE gapes beneath the wooden seat. A faint purple glimmer leaks from below the rim.",
      desc: "A wooden seat over a raw hole in the earth. Something faintly purple glimmers below. It has no plumbing.",
      on: {
        sit: useToilet, use: useToilet, enter: useToilet, flush: flushToilet,
        examine: inspectToilet,
      },
    },
    dreadmaw: {
      names: ["dragon", "dreadmaw", "wyrm"], adjectives: ["sleeping", "female", "vast", "ashen"],
      loc: "dragonCaveMouth", fixed: true, scenery: true,
      desc: "DREADMAW THE DRAGON: an ancient female dragon armoured in plates like burnt cathedral stone. " +
        "She is sleeping directly across the CAVE entrance.",
      on: {
        talk: talkToDragon, wake: wakeDragon, give: giveDragon, put: giveDragon,
        say: sayNearDragon,
        move: dragonFire, push: dragonFire, pull: dragonFire, touch: dragonFire,
        attack: dragonFire, climb: dragonFire,
      },
    },
    goldDoubloon: {
      names: ["doubloon", "coin"], adjectives: ["gold", "dragon", "dreadmaw"],
      loc: null, takeable: true,
      desc: "A heavy GOLD DOUBLOON stamped with DREADMAW's horned profile and a sun being swallowed. " +
        "Around its edge, one word has been etched by hand: LORE.",
    },
    dragonVaultDoor: {
      names: ["door", "vault"], adjectives: ["inner", "black", "sealed", "vault"],
      loc: "trollGate", fixed: true, scenery: true,
      desc: "A seamless black VAULT DOOR with no keyhole. One rune resembles a listening ear.",
      on: { say: answerTrollRiddle },
    },
    caveTroll: {
      names: ["troll", "guard"], adjectives: ["cave", "warty", "broad", "male"],
      loc: "trollGate", fixed: true, scenery: true,
      desc: "A broad male TROLL with granite-coloured warts sits before the VAULT DOOR. He looks more literary than hungry.",
      on: { talk: talkToTroll, wake: talkToTroll },
    },
    dragonHoard: {
      names: ["hoard", "riches", "gold", "treasure"], adjectives: ["dragon", "vast", "dreadmaw"],
      loc: "dreadmawVault", fixed: true, scenery: true,
      desc: "A mountainous dragon hoard filling DREADMAW'S VAULT: gold, gems, crowns, and several objects too cursed-looking to price.",
    },
    headlamp: {
      names: ["headlamp", "lamp"], adjectives: ["mining", "battery", "battered"],
      loc: "mineGallery", takeable: true, wearable: true, wearSlot: "head",
      lightSource: true, selfPowered: true, activatesOnWear: true, lit: false, fuel: 200,
      lowFuelMsg: "The HEADLAMP dims. Its battery has only a few turns left.",
      outOfFuelMsg: "The HEADLAMP flickers once and its battery dies.",
      roomDesc: "A battered mining HEADLAMP hangs from a timber support.",
      desc: "A battery-powered mining HEADLAMP with a cracked elastic strap. Its sealed lamp still promises two hundred turns of light.",
    },
    goldBar: {
      names: ["bar", "ingot"], adjectives: ["gold", "heavy"],
      loc: "dreadmawVault", takeable: true, bonusTreasure: true, points: 15,
      roomDesc: "A heavy GOLD BAR lies conspicuously apart from the rest of the hoard.",
      desc: "A brutally heavy GOLD BAR stamped with a forgotten royal mint. Not a Blackwood heirloom, but the " +
        "RELIQUARY will still gladly weigh it.",
    },
    silverChalice: {
      names: ["chalice", "cup", "goblet"], adjectives: ["silver", "blackwood"],
      loc: "dreadmawVault", takeable: true, bonusTreasure: true, points: 20,
      roomDesc: "A tarnished SILVER CHALICE chased with the Blackwood crest stands upright in the gold.",
      desc: "A SILVER CHALICE worked with the Blackwood family crest — a raven over crossed keys. Dreadmaw " +
        "hoarded it, but it was cast for the manor's own altar.",
    },
    jeweledCrown: {
      names: ["crown", "coronet", "diadem"], adjectives: ["jeweled", "jewelled", "blackwood"],
      loc: "dreadmawVault", takeable: true, bonusTreasure: true, points: 25,
      roomDesc: "A JEWELED CROWN, half-buried in coins, still catches what little light there is.",
      desc: "A JEWELED CROWN of old Blackwood gold, its stones cold and deep. A relic of the family's " +
        "prouder years, taken by the dragon and never returned — until now.",
    },
    wingedShoes: {
      names: ["shoes", "sandals"], adjectives: ["winged", "gold", "golden"],
      loc: "dreadmawVault", takeable: true, wearable: true, wearSlot: "feet", grantsFlight: true,
      roomDesc: "A pair of golden WINGED SHOES rests atop a heap of coins.",
      desc: "Golden WINGED SHOES with living white feathers at each ankle. Worn on the FEET, they grant true flight.",
    },
    hallBed: {
      names: ["bed"], adjectives: ["hall", "narrow", "made"],
      loc: "hallBedroom", fixed: true, scenery: true,
      desc: "A narrow BED made with yellowed but carefully tucked linen.",
    },
    hallMirror: {
      names: ["mirror"], adjectives: ["hall", "bedroom", "tarnished"],
      loc: "hallBedroom", fixed: true, scenery: true,
      desc: "A tarnished MIRROR that makes every reflection look slightly farther away than it should.",
    },
    nightTable: {
      names: ["table", "nightstand"], adjectives: ["night", "bedside", "small"],
      loc: "hallBedroom", fixed: true, scenery: true,
      desc: "A small NIGHT TABLE holding a LAMP and a shallow DRAWER.",
    },
    nightDrawer: {
      names: ["drawer"], adjectives: ["night", "table", "bedside"],
      loc: "hallBedroom", fixed: true, scenery: true,
      container: true, openable: true, open: false, capacity: 3,
      desc: "A cheap wooden DRAWER in the NIGHT TABLE.",
    },
    bedsideLamp: {
      names: ["lamp"], adjectives: ["night", "bedside", "table"],
      loc: "hallBedroom", fixed: true, scenery: true,
      lightSource: true, selfPowered: true, lit: false,
      desc: "A small electric LAMP with a cloth shade and a working pull-chain.",
    },
    xrayGoggles: {
      names: ["goggles", "glasses"], adjectives: ["xray", "x-ray", "plastic", "cheap"],
      loc: "nightDrawer", takeable: true, wearable: true, wearSlot: "eyes",
      grantsMushroomVision: true, grantsDarkVision: true,
      desc: "Cheap plastic XRAY GOGGLES with red lenses and lightning bolts on the arms. Somehow, they actually work.",
    },
    frontDoor: {
      names: ["door", "house", "manor", "mansion"], adjectives: ["front", "oak", "great"],
      loc: "porch", fixed: true, scenery: true, enterTo: "north",
      openable: true, open: false, locked: true, keyId: "frontKey",
      desc: "A great oak door, black with age, with a heavy iron lock.",
      on: {
        open(ctx) {
          const d = ctx.item("frontDoor");
          if (d.locked) return "The front door is locked.";
          if (d.open) return "The front door already stands open.";
          d.open = true;
          ctx.setFlag("frontDoorOpen");
          return "The great door swings inward with a groan, onto a darkness that smells of dust and old smoke.";
        },
      },
    },

    // --- light ---
    candlestick: {
      names: ["candlestick", "candle"], adjectives: ["silver", "tarnished"], loc: "diningRoom",
      takeable: true, treasure: true, points: 10, lightSource: true, lit: false, fuel: 120,
      desc: "A tarnished silver candlestick, heavy and fine, its candle miraculously unburnt.",
      on: {
        light(ctx) {
          const c = ctx.item("candlestick");
          if (c.lit) return "It is already lit.";
          if (c.fuel <= 0) return "The candle is a spent stub; it will not catch.";
          const match = carriedMatch(ctx);
          if (!match) return "You have nothing to light it with.";
          c.lit = true;
          ctx.destroy(match.id);
          return "You strike a match and touch it to the wick. The candle flares to life, throwing " +
            "long shadows — and the spent match crumbles to ash. (You have no more matches.)";
        },
      },
    },
    matches: {
      names: ["matches", "match"], adjectives: ["box"], loc: "kitchen", takeable: true,
      desc: "A box holding a single dry match. Just one.",
    },
    rope: {
      names: ["rope", "coil"], adjectives: ["stout"], loc: "kitchen", takeable: true,
      desc: "A coil of stout rope, still sound.",
    },
    cellarDoor: {
      names: ["cellar", "trapdoor", "door"], adjectives: ["heavy", "cellar"],
      loc: "kitchen", fixed: true, scenery: true, enterTo: "down", openable: true, open: false,
      desc: "A heavy trap-door set flush in the KITCHEN floor, iron-ringed.",
      on: {
        open(ctx) {
          if (ctx.getFlag("cellarOpen")) return "The cellar door already gapes open.";
          ctx.item("cellarDoor").open = true;
          ctx.setFlag("cellarOpen");
          return "You haul the heavy cellar door up on its hinges. Cold, wet air breathes up from stone steps descending into black.";
        },
      },
    },

    // --- library / secret chamber ---
    lever: {
      names: ["lever"], adjectives: ["brass"], loc: "library", fixed: true, scenery: true,
      desc: "A brass lever set into the shelving where a book should be.",
      on: {
        pull(ctx) {
          if (ctx.getFlag("leverPulled")) return "The bookcase already stands open.";
          ctx.setFlag("leverPulled");
          return "You haul on the lever. With a grinding of counterweights a whole section of " +
            "bookcase swings aside, baring a stair that spirals down into darkness.";
        },
      },
    },
    grimoire: {
      names: ["grimoire", "book"], adjectives: ["first-edition", "forbidden", "black"], loc: "secretChamber",
      takeable: true, treasure: true, points: 15, readable: true,
      desc: "A heavy black grimoire, clasped in tarnished silver — a priceless first edition.",
      text: "The grimoire is written in a hand that hurts to follow. You snap it shut. Some things are worth money, not reading.",
    },

    // --- parlor safe (behind the profile painting) ---
    portrait: {
      names: ["painting", "profile", "portrait"], adjectives: ["grim", "patriarch", "huge"], loc: "parlor",
      fixed: true, scenery: true,
      desc: "A grim PROFILE PAINTING of the patriarch. The frame stands slightly proud of the wall, as if hinged.",
      on: { move: revealSafe, push: revealSafe, examine: revealSafe },
    },
    safe: {
      names: ["safe"], adjectives: ["iron"], loc: null, fixed: true, container: true, openable: true,
      open: false, locked: true, capacity: 3,
      desc: "A squat iron safe set into the wall, fitted with a combination dial.",
      on: {
        open: openSafe,
      },
    },
    talisman: {
      names: ["talisman", "amulet"], adjectives: ["silver", "protective"], loc: "safe", takeable: true,
      wearable: true, worn: false, wearSlot: "neck",
      desc: "A silver talisman on a chain, warm to the touch, graven with wards against the dead.",
    },

    // --- study diary ---
    desk: {
      names: ["desk"], adjectives: ["oak"], loc: "study", fixed: true, scenery: true,
      desc: "A great oak desk, its drawers swollen shut.",
    },
    diary: {
      names: ["diary", "journal"], adjectives: ["leather", "leather-bound"], loc: "study", takeable: true,
      readable: true,
      desc: "A leather-bound diary in a spidery hand.",
      on: {
        read(ctx) {
          ctx.setFlag("knowsCombo");
          return "The last entry reads:\n" +
            "  \"I have hidden the TALISMAN in the wall-safe behind my own PROFILE PAINTING in the PARLOR.\n" +
            "   The combination, lest I forget in my terror: 7 left, 3 right, 9 left. If the wraith\n" +
            "   takes me, whoever comes after must WEAR the TALISMAN before they dare the CRYPT.\"";
        },
      },
    },

    // --- nursery wallpaper -> crawl-gap into the space between the walls ---
    wallpaper: {
      names: ["wallpaper", "wall", "lath"], adjectives: ["peeling", "loose", "curling"],
      loc: "nursery", fixed: true, scenery: true,
      desc: "Long tongues of wallpaper hang loose from the plaster. Low near the baseboard, one strip has " +
        "pulled almost all the way free, and the lath behind it sounds hollow when you rap on it.",
      on: { pull: revealWallGap, push: revealWallGap, search: revealWallGap },
    },

    // --- nursery music box -> tiny key ---
    musicBox: {
      names: ["music box", "musicbox", "box"], adjectives: ["jeweled", "jewelled", "music"], loc: "nursery",
      takeable: true, treasure: true, points: 15, container: true, openable: true, open: false, capacity: 1,
      desc: "A jeweled music box, its lid inlaid with mother-of-pearl.",
    },
    tinyKey: {
      names: ["key"], adjectives: ["tiny", "small", "brass"], loc: "musicBox", takeable: true,
      desc: "A tiny brass key, no longer than your thumbnail.",
    },

    // --- master bedroom jewelry box -> ruby ring ---
    jewelryBox: {
      names: ["jewelry box", "jewellery box", "jewelry", "box", "casket"], adjectives: ["walnut", "dark"],
      loc: "masterBedroom", fixed: true, container: true, openable: true, open: false, locked: true,
      keyId: "tinyKey", capacity: 2,
      desc: "A dark walnut jewelry box with a tiny keyhole.",
    },
    rubyRing: {
      names: ["ring"], adjectives: ["ruby", "red"], loc: "jewelryBox", takeable: true,
      treasure: true, points: 20, wearable: true, worn: false, wearSlot: "finger",
      desc: "A heavy gold ring set with a ruby like a drop of blood.",
    },

    // --- crypt ---
    wraith: {
      names: ["wraith", "ghost", "spirit"], loc: "crypt", fixed: true, scenery: true,
      desc: "A shroud of cold hatred, kept at bay by the TALISMAN. It hisses from the corners.",
    },
    goldLocket: {
      names: ["locket"], adjectives: ["gold"], loc: "crypt", takeable: true, treasure: true, points: 20,
      desc: "A gold locket, cold as the grave, its clasp shaped like clasped hands.",
    },

    // --- landing cord (attic ladder) ---
    cord: {
      names: ["cord"], adjectives: ["frayed"], loc: "landing", fixed: true, scenery: true,
      desc: "A frayed cord dangling from the ATTIC trap-door in the ceiling.",
      on: {
        pull(ctx) {
          if (ctx.getFlag("ladderDown")) return "The ladder is already down.";
          ctx.setFlag("ladderDown");
          return "You pull the cord. A trap-door drops open and a rickety wooden ladder clatters down from the attic.";
        },
      },
    },

    // --- other treasures ---
    ancientCoin: {
      names: ["coin"], adjectives: ["ancient", "old"], loc: null, takeable: true, treasure: true, points: 10,
      desc: "An ancient coin, worn smooth, stamped with a face no one remembers.",
    },
    crystalDecanter: {
      names: ["decanter"], adjectives: ["crystal"], loc: "wineCellar", takeable: true, treasure: true, points: 15,
      desc: "A cut-crystal decanter, still full, throwing splinters of colour even in the gloom.",
    },
    ancestralPortrait: {
      names: ["portrait", "miniature"], adjectives: ["ancestral", "small", "gilt"], loc: "attic",
      takeable: true, treasure: true, points: 20, scenery: true,
      desc: "A small ANCESTRAL PORTRAIT painted in miniature and set in a gilt frame — a woman who looks " +
        "unsettlingly like the STATUE in the GARDEN.",
    },

    // --- Post-game (appear only after the bell is rung) ---
    boneKey: {
      names: ["key"], adjectives: ["bone", "pale", "slender"], loc: null, takeable: true,
      desc: "A slender key carved from old bone, still faintly warm to the touch.",
    },
    secretDoor: {
      names: ["door", "seam"], adjectives: ["secret", "hidden", "north"], loc: null, fixed: true, scenery: true,
      openable: true, open: false, locked: true, keyId: "boneKey", enterTo: "north",
      desc: "A door of black wood where no door was, fitted with a keyhole shaped like a tooth.",
      on: {
        open(ctx) {
          const d = ctx.item("secretDoor");
          if (d.locked) return "The secret door won't budge — it wants that bone key.";
          if (d.open) return "It already stands open.";
          d.open = true;
          ctx.setFlag("secretWingOpen");
          return "The secret door swings inward on silent hinges, breathing out cold, clean air.";
        },
      },
    },
    spirit: {
      names: ["spirit", "matriarch", "woman", "ghost"], adjectives: ["pale", "grey", "robed"],
      loc: "hollowSanctum", fixed: true, scenery: true,
      desc: "The pale spirit of a robed woman — the face from the GARDEN STATUE and the little portrait. " +
        "She was weeping, but her eyes are kind now.",
      on: {
        pray: () => "She bows her head. \"You lifted what my own blood could not. Take the mirror, and go and live — since I no longer can.\"",
        give: () => "She shakes her head gently. \"I need nothing now but rest, and you have given me that.\"",
        attack: () => "You couldn't — and wouldn't. She means you no harm.",
      },
    },
    silverMirror: {
      names: ["mirror"], adjectives: ["silver"], loc: "hollowSanctum", takeable: true,
      desc: "An age-clouded silver hand-mirror. In it, for just a moment, you see BLACKWOOD MANOR whole and " +
        "bright and full of the living.",
    },

    // --- the only thing in the space between the walls ---
    backwardsWatch: {
      names: ["watch", "pocket watch"], adjectives: ["backwards", "tarnished", "brass"],
      loc: "betweenWalls", takeable: true,
      roomDesc: "A tarnished BACKWARDS WATCH hangs from a bent nail, its hands sweeping the wrong way.",
      desc: "A brass pocket watch, badly tarnished, ticking backwards at a perfectly ordinary speed. It has " +
        "clearly been here since before there was a \"here.\"",
      on: {
        take(ctx) {
          if (ctx.has("backwardsWatch")) return "You already have the backwards watch.";
          ctx.moveItem("backwardsWatch", "inventory");
          ctx.addScore(12);
          return "You pluck the BACKWARDS WATCH off its nail. Its ticking doesn't change, but you could swear " +
            "it just ticked FORWARD once, just to see how you'd react. (+12)";
        },
      },
    },
  },
};

// ---- handler function definitions referenced above --------------------------
function revealKey(ctx) {
  if (ctx.getFlag("statueMoved")) return "You have already taken what was hidden here.";
  ctx.setFlag("statueMoved");
  ctx.moveItem("frontKey", "garden");
  return "You heave the mossy statue aside. Beneath its plinth, half-sunk in the earth, lies a heavy iron key.";
}
function revealSafe(ctx) {
  if (ctx.getFlag("safeRevealed")) return "The PROFILE PAINTING already hangs aside, baring the iron SAFE.";
  ctx.setFlag("safeRevealed");
  ctx.moveItem("safe", "parlor");
  return "You swing the PROFILE PAINTING aside on a hidden hinge. Set into the wall behind it is a squat iron SAFE.";
}
function revealWallGap(ctx) {
  if (ctx.getFlag("wallGapFound"))
    return "The gap in the wall stands open, dust-dark and waiting, right where you left it.";
  ctx.setFlag("wallGapFound", true);
  return "You peel back a curling tongue of WALLPAPER — and keep peeling, because a whole panel of rotten " +
    "lath comes away in your hands, baring a gap just wide enough to squeeze IN, into the dark between the walls.";
}

// --- Self-immolation & stop-drop-roll in ANY room (Andy's idea) --------------
// Inject a light/burn/extinguish interceptor into every room's handler table so
// the player can set themselves ablaze (or put themselves out) anywhere, without
// touching the generic engine. Each interceptor tries the self-fire path first,
// then falls back to any pre-existing room handler (returning null = fall through
// to the normal command).
for (const room of Object.values(world.rooms)) {
  room.on = room.on || {};
  const pLight = room.on.light, pBurn = room.on.burn, pExt = room.on.extinguish, pOff = room.on.off;
  const pYes = room.on.yes, pNo = room.on.no;
  room.on.light = (ctx, cmd) => selfLightInterceptor(ctx, cmd) ?? (pLight ? pLight(ctx, cmd) : null);
  room.on.burn = (ctx, cmd) => selfLightInterceptor(ctx, cmd) ?? (pBurn ? pBurn(ctx, cmd) : null);
  room.on.extinguish = (ctx, cmd) => selfExtinguishInterceptor(ctx, cmd) ?? (pExt ? pExt(ctx, cmd) : null);
  room.on.off = (ctx, cmd) => selfExtinguishInterceptor(ctx, cmd) ?? (pOff ? pOff(ctx, cmd) : null);
  room.on.yes = (ctx, cmd) => selfFireAnswerInterceptor(ctx, cmd) ?? (pYes ? pYes(ctx, cmd) : null);
  room.on.no = (ctx, cmd) => selfFireAnswerInterceptor(ctx, cmd) ?? (pNo ? pNo(ctx, cmd) : null);
}
