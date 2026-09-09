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
    if (ctx.roomOf("matches") === null && !ctx.has("candlestick")) {
      return "You burned your only match already, didn't you. DIDN'T YOU. Look — grab the CANDLESTICK in the DINING ROOM anyway; you'll want it. Next time don't waste the match, pal.";
    }
    return "You want to survive downstairs? TAKE the CANDLESTICK (dining room) and the MATCHES (kitchen), then LIGHT CANDLE. You get exactly ONE match. Try to rise to the occasion.";
  }
  if (!dep("rubyRing")) {
    return "Ruby ring's locked in a jewelry box in the MASTER BEDROOM. The little key's inside the MUSIC BOX in the NURSERY — OPEN the music box, take the tiny key, then UNLOCK JEWELRY BOX WITH TINY KEY.";
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
    return "There's a portrait in the ATTIC. PULL the CORD on the LANDING to drop the ladder. But that ladder's rotten — climb it carrying more than a couple things and you crash through and DIE. DROP your junk on the landing first.";
  }
  if (!dep("goldLocket")) {
    return "The gold locket's in the CRYPT, past the wine cellar — guarded by a WRAITH that kills you on sight. So: READ the DIARY in the STUDY for the safe combo, MOVE the PORTRAIT in the PARLOR, OPEN the SAFE, take the TALISMAN, WEAR it, THEN walk into the crypt. In that order. Write it down.";
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
function say(ctx, arr) { return stagePick(ctx, arr) + " " + meter(ctx) + billAside(ctx) + garyAside(ctx); }

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

// Wrap the real hint in stage-appropriate framing — the clue is ALWAYS delivered.
function frameHint(ctx, hint) {
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

// First contact when you CALL / DIAL / HINT — greets, gives one real hint, and
// leaves the line OPEN so you can actually talk to him (see hotlineTalk).
function hotline(ctx) {
  const n = (ctx.getFlag("hotlineCalls") || 0) + 1;
  ctx.setFlag("hotlineCalls", n);
  bumpXP(ctx);
  bumpBill(ctx);
  ctx.addScore(-2); // dialing in isn't free, pal
  const pool = STAGE_INTROS[garyStage(ctx)];
  const intro = pool[(n - 1) % pool.length];
  const tail = garyStage(ctx) >= 2
    ? `(You're in session. Say HINT for a clue, ask Gary anything, or HANG UP. ${meter(ctx)})`
    : `(You're on the line. Ask him things, say HINT for another clue, or HANG UP when you're done. ${meter(ctx)})`;
  return `${intro}\n\n${frameHint(ctx, nextHint(ctx))}\n\n${tail}`;
}

// While you're on the line, everything you type is routed here (core.send).
function hotlineTalk(ctx, text) {
  const t = (text || "").trim().toLowerCase();
  bumpBill(ctx); // the meter runs whether you're getting help or just chatting
  bumpXP(ctx);   // and every exchange nudges Gary further along his arc

  if (/\b(hang\s*up|hangup|good\s*bye|bye|later|never\s*mind|nevermind|leave|go away)\b/.test(t) || /i'?m done/.test(t)) {
    ctx.setFlag("onCall", false);
    const arr = SIGNOFF_STAGE[garyStage(ctx)];
    return arr[Math.floor(Math.random() * arr.length)] + " " + meter(ctx) + billAside(ctx) + " *click*";
  }
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

function descendWell(ctx) {
  if (!ctx.has("rope")) {
    return ctx.kill(
      "You clamber over the mossy lip of the well and lower yourself into the dark — " +
      "but there is nothing to hold to. You plunge, and strike the dry stone bottom " +
      "with a final, sickening crack."
    );
  }
  if (ctx.getFlag("wellLooted")) return "You climb down again, but the well is empty now.";
  ctx.setFlag("wellLooted");
  ctx.moveItem("ancientCoin", "garden");
  return "Bracing against the rope, you descend into the well. At the muddy bottom your " +
    "fingers close on a cold disc of metal — an ancient coin! You climb back into the last grey light.";
}

// ---- the world ---------------------------------------------------------------
export const world = {
  config: { start: "gate", maxCarry: 6, title: "Blackwood Manor" },
  hotline,     // dial-in greeting for the 1-900 hint line (see below)
  hotlineTalk, // conversation handler while you're on the line
  phoneRank,   // hall-of-shame bill rank for the end screen

  rooms: {
    gate: {
      name: "Front Gate",
      desc:
        "You stand at the rusted iron gate of Blackwood Manor as the last light drains " +
        "from the sky. The house looms beyond a dead lawn, its windows like sockets. A " +
        "gravel path leads north to the porch, and a low wall gives way east to an " +
        "overgrown garden.",
      exits: { north: "porch", east: "garden" },
    },

    garden: {
      name: "Overgrown Garden",
      desc:
        "Brambles have swallowed what was once a formal garden. A weathered stone statue " +
        "of a robed woman leans amid the weeds, and a crumbling well shaft plunges into " +
        "blackness. The gate lies back to the west.",
      exits: { west: "gate" },
      on: {
        // "down" / "go down" / "climb down" all attempt the well.
        go(ctx, cmd) {
          if (cmd.dobj !== "down") return null;
          return descendWell(ctx);
        },
      },
    },

    porch: {
      name: "Front Porch",
      desc:
        "The porch boards sag underfoot. A brass mailbox is bolted beside a great oak " +
        "front door, its wood black with age. The path returns south to the gate.",
      exits: {
        south: "gate",
        north: { to: "grandHall", via: "frontDoorOpen", lockedMsg: "The front door is shut fast." },
      },
    },

    grandHall: {
      name: "Grand Hall",
      desc:
        "A vast, cobwebbed hall rises two storeys to a shattered chandelier. A grand " +
        "staircase climbs up into shadow. Set into the far wall is a stone RELIQUARY, and " +
        "above it hangs a great brass bell on a frayed rope. Doorways lead east to the " +
        "parlor and west to the dining room; the porch lies south.",
      exits: {
        south: "porch", east: "parlor", west: "diningRoom", up: "landing",
        north: { to: "hollowPassage", via: "secretWingOpen",
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
          if (!it.treasure) return `The reliquary is meant for the family heirlooms; it will not accept the ${it.names[0]}.`;
          ctx.moveItem(it.id, "reliquary");
          ctx.addScore(it.points || 0);
          let msg = `You lay the ${it.names[0]} in the reliquary. It settles with a low, resonant hum.`;
          if (allTreasuresDeposited(ctx)) {
            ctx.setFlag("curseLiftable");
            msg += "\n\nAs the last heirloom touches stone, every heirloom begins to glow. The air " +
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
      desc:
        "A mouldering parlor of draped furniture. Above the cold fireplace hangs a huge, " +
        "grim PORTRAIT of a bearded patriarch, whose eyes seem to track you. An archway " +
        "returns west to the hall; a low door leads south to the library.",
      exits: { west: "grandHall", south: "library" },
    },

    library: {
      name: "Library",
      desc:
        "Floor-to-ceiling shelves sag under rotting books. One shelf bears a curious brass " +
        "LEVER where a book should be. The parlor lies north.",
      exits: {
        north: "parlor",
        down: { to: "secretChamber", via: "leverPulled", lockedMsg: "The shelves stand solid and shut." },
      },
    },

    secretChamber: {
      name: "Hidden Chamber",
      desc:
        "A cramped stone chamber that has not seen daylight in a century. A single lectern " +
        "stands at its centre. The only way out is the stair up.",
      dark: true,
      exits: { up: "library" },
    },

    diningRoom: {
      name: "Dining Room",
      desc:
        "A long banquet table lies buried under dust and fallen plaster. Upon it, " +
        "improbably, stands a tarnished silver CANDLESTICK, its candle unburnt. The hall " +
        "is east; a swinging door leads south to the kitchen.",
      exits: { east: "grandHall", south: "kitchen" },
    },

    kitchen: {
      name: "Kitchen",
      desc:
        "A cavernous scullery of cold ranges and rusted hooks. A coil of stout ROPE hangs " +
        "on one hook, and a box of MATCHES sits on the sill. A heavy CELLAR door is set in " +
        "the floor. The dining room lies north.",
      exits: {
        north: "diningRoom",
        down: { to: "wineCellar", via: "cellarOpen", lockedMsg: "The cellar door is shut." },
      },
    },

    wineCellar: {
      name: "Wine Cellar",
      desc:
        "Racks of burst and blackened bottles line a dripping vault. One survivor gleams: " +
        "a CRYSTAL DECANTER of something that still catches the light. Stone steps climb up " +
        "to the kitchen; an arch leads south, deeper, into a cold that raises the hairs on your neck.",
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
      desc:
        "A low crypt of Blackwood dead. The wraith that guards it cowers from the talisman " +
        "at your breast, hissing in the corners. On the central sarcophagus lies a GOLD " +
        "LOCKET. The only way out is north.",
      dark: true,
      exits: { north: "wineCellar" },
    },

    landing: {
      name: "Upstairs Landing",
      desc:
        "A long gallery landing overlooks the hall below. Doors open west to a nursery, " +
        "east to the master bedroom, and south to a study. A frayed CORD dangles from a " +
        "trap-door in the ceiling. The stairs go down.",
      exits: { down: "grandHall", west: "nursery", east: "masterBedroom", south: "study" },
      on: {
        // The attic ladder is flimsy: climb it laden and it — and you — come down hard.
        go(ctx, cmd) {
          if (cmd.dobj !== "up") return null;
          if (!ctx.getFlag("ladderDown")) return "There is no way up; the trap-door is shut.";
          if (ctx.inventory().length > 2) {
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
      desc:
        "A child's nursery, its wallpaper peeling in long tongues. A rocking horse stares " +
        "with one glass eye. On a shelf sits a JEWELED MUSIC BOX. The landing lies east.",
      exits: { east: "landing" },
    },

    masterBedroom: {
      name: "Master Bedroom",
      desc:
        "A great canopied bed rots beneath a collapsed tester. On the vanity stands a locked " +
        "JEWELRY BOX of dark walnut. The landing lies west.",
      exits: { west: "landing" },
    },

    study: {
      name: "Study",
      desc:
        "A book-lined study with a great oak DESK. A leather-bound DIARY lies open upon it, " +
        "as though its writer had just stepped away. The landing lies north.",
      exits: { north: "landing" },
    },

    attic: {
      name: "Attic",
      desc:
        "A vast, raftered attic, silver with moonlight through a broken skylight. Amid the " +
        "shrouded lumber leans a small ANCESTRAL PORTRAIT in a gilt frame. The ladder leads down.",
      exits: { down: "landing" },
    },

    // --- The hidden wing, revealed only after the curse is lifted (bell rung) ---
    hollowPassage: {
      name: "Hollow Passage",
      desc:
        "A narrow passage of pale stone the manor kept hidden all this time. It is oddly warm, " +
        "and lit by no lamp you can find — as if the walls themselves remember daylight. The hall " +
        "lies back to the south; the passage runs north.",
      exits: { south: "grandHall", north: "hollowSanctum" },
    },
    hollowSanctum: {
      name: "The Hollow Sanctum",
      desc:
        "A round, domed chamber at the manor's secret heart, filled with a soft grey light. The pale " +
        "SPIRIT of a robed woman waits beside a pedestal, and upon the pedestal rests a SILVER MIRROR. " +
        "Beyond her, an archway opens NORTH onto a growing dawn.",
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
  },

  items: {
    // --- reliquary & bell (grand hall) ---
    reliquary: {
      names: ["reliquary"], loc: "grandHall", fixed: true, container: true, capacity: 20,
      desc: "A niche of carved stone, hungry-looking, waiting to be filled with the family's heirlooms.",
    },
    bell: {
      names: ["bell", "rope"], adjectives: ["brass", "great"], loc: "grandHall", fixed: true, scenery: true,
      desc: "A great brass bell hung above the reliquary, a frayed pull-rope trailing from it.",
    },

    // --- getting inside ---
    statue: {
      names: ["statue", "woman"], adjectives: ["stone", "robed"], loc: "garden", fixed: true, scenery: true,
      desc: "A robed stone woman, features worn smooth. She leans oddly, as if something props her up.",
      on: {
        move: revealKey, push: revealKey, search: reveal_search_statue, examine: null,
      },
    },
    well: {
      names: ["well", "shaft"], loc: "garden", fixed: true, scenery: true,
      desc: "A round stone well, its bucket and windlass long gone. The shaft drops into " +
        "pure black — a long way down. Without a rope to climb back out, going down there " +
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
      desc: "A dented brass mailbox bolted to the porch rail.",
    },
    letter: {
      names: ["letter"], loc: "mailbox", takeable: true, readable: true,
      desc: "A single sheet of good paper, water-stained.",
      text:
        "The letter reads:\n" +
        "  \"To whoever inherits this cursed house — the family's heirlooms must be returned\n" +
        "   to the reliquary in the hall, all of them, and the bell rung, or the curse will\n" +
        "   never lift. Do not linger in the dark. And God help you in the crypt.\"",
    },
    frontDoor: {
      names: ["door"], adjectives: ["front", "oak", "great"], loc: "porch", fixed: true, scenery: true,
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
          const match = ctx.inventory().find((i) =>
            (i.names || []).some((n) => n === "match" || n === "matches"));
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
      names: ["cellar", "trapdoor"], adjectives: ["heavy"], loc: "kitchen", fixed: true, scenery: true,
      desc: "A heavy trap-door set flush in the kitchen floor, iron-ringed.",
      on: {
        open(ctx) {
          if (ctx.getFlag("cellarOpen")) return "The cellar door already gapes open.";
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

    // --- parlor safe (behind the portrait) ---
    portrait: {
      names: ["portrait", "painting"], adjectives: ["grim", "patriarch", "huge"], loc: "parlor",
      fixed: true, scenery: true,
      desc: "A grim patriarch glares from the canvas. The frame stands slightly proud of the wall, as if hinged.",
      on: { move: revealSafe, push: revealSafe, search: revealSafe },
    },
    safe: {
      names: ["safe"], adjectives: ["iron"], loc: null, fixed: true, container: true, openable: true,
      open: false, locked: true, capacity: 3,
      desc: "A squat iron safe set into the wall, fitted with a combination dial.",
      on: {
        open(ctx) {
          const s = ctx.item("safe");
          if (s.open) return "The safe already stands open.";
          if (s.locked) {
            if (!ctx.getFlag("knowsCombo"))
              return "The safe has a combination dial. You try a few turns at random; it does not yield.";
            s.locked = false;
          }
          s.open = true;
          const inside = ctx.itemsIn("safe");
          return "You dial the combination from the diary — seven left, three right, nine left — and " +
            "the safe clicks open" +
            (inside.length ? ", revealing " + inside.map((x) => "a " + x.names[0]).join(", ") + "." : ".");
        },
      },
    },
    talisman: {
      names: ["talisman", "amulet"], adjectives: ["silver", "protective"], loc: "safe", takeable: true,
      wearable: true, worn: false,
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
            "  \"I have hidden the talisman in the wall-safe behind my own portrait in the parlor.\n" +
            "   The combination, lest I forget in my terror: 7 left, 3 right, 9 left. If the wraith\n" +
            "   takes me, whoever comes after must WEAR the talisman before they dare the crypt.\"";
        },
      },
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
      treasure: true, points: 20,
      desc: "A heavy gold ring set with a ruby like a drop of blood.",
    },

    // --- crypt ---
    wraith: {
      names: ["wraith", "ghost", "spirit"], loc: "crypt", fixed: true, scenery: true,
      desc: "A shroud of cold hatred, kept at bay by the talisman. It hisses from the corners.",
    },
    goldLocket: {
      names: ["locket"], adjectives: ["gold"], loc: "crypt", takeable: true, treasure: true, points: 20,
      desc: "A gold locket, cold as the grave, its clasp shaped like clasped hands.",
    },

    // --- landing cord (attic ladder) ---
    cord: {
      names: ["cord"], adjectives: ["frayed"], loc: "landing", fixed: true, scenery: true,
      desc: "A frayed cord dangling from a trap-door in the ceiling.",
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
      names: ["miniature", "portrait"], adjectives: ["ancestral", "small", "gilt"], loc: "attic",
      takeable: true, treasure: true, points: 20,
      desc: "A small ancestral portrait in a gilt frame — a woman who looks unsettlingly like the statue in the garden.",
    },

    // --- Post-game (appear only after the bell is rung) ---
    boneKey: {
      names: ["key"], adjectives: ["bone", "pale", "slender"], loc: null, takeable: true,
      desc: "A slender key carved from old bone, still faintly warm to the touch.",
    },
    secretDoor: {
      names: ["door", "seam"], adjectives: ["secret", "hidden", "north"], loc: null, fixed: true, scenery: true,
      openable: true, open: false, locked: true, keyId: "boneKey",
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
      desc: "The pale spirit of a robed woman — the face from the garden statue and the little portrait. " +
        "She was weeping, but her eyes are kind now.",
      on: {
        pray: () => "She bows her head. \"You lifted what my own blood could not. Take the mirror, and go and live — since I no longer can.\"",
        give: () => "She shakes her head gently. \"I need nothing now but rest, and you have given me that.\"",
        attack: () => "You couldn't — and wouldn't. She means you no harm.",
      },
    },
    silverMirror: {
      names: ["mirror"], adjectives: ["silver"], loc: "hollowSanctum", takeable: true,
      desc: "An age-clouded silver hand-mirror. In it, for just a moment, you see the manor whole and " +
        "bright and full of the living.",
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
function reveal_search_statue(ctx) { return revealKey(ctx); }
function revealSafe(ctx) {
  if (ctx.getFlag("safeRevealed")) return "The portrait already hangs aside, baring the iron safe.";
  ctx.setFlag("safeRevealed");
  ctx.moveItem("safe", "parlor");
  return "You swing the heavy portrait aside on a hidden hinge. Set into the wall behind it is a squat iron SAFE.";
}
