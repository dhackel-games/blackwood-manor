// weathervane.js. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.005:acoven.

const WEATHERVANE_FREED = "manor:weathervaneFreed";

const DESTINATIONS = {
  puffCheeks: {
    direction: "north",
    pool: "gargoylePuffCheeks",
    aliases: ["puff-cheeked gargoyle", "north gargoyle", "north", "burper", "burping gargoyle"],
  },
  nosePinch: {
    direction: "west",
    pool: "gargoyleNosePinch",
    aliases: ["nose-pinching gargoyle", "west gargoyle", "west", "farter", "farting gargoyle"],
  },
  rearGuard: {
    direction: "south",
    pool: "gargoyleRearGuard",
    aliases: ["rear-guarding gargoyle", "south gargoyle", "south", "shitter", "pooping gargoyle"],
  },
  farGazing: {
    direction: "east",
    eastPool: "gargoyleFarGazing",
    aliases: ["far-gazing gargoyle", "east gargoyle", "east", "horizon-gazer", "horizon gazer", "gazer"],
  },
};

const WEATHERVANE_NAMES = ["rusted weathervane", "weathervane", "vane"];

function normalized(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function destinationFrom(value) {
  const requested = String(value || "").replace(/^face\s+/i, "");
  const wanted = normalized(requested);
  return Object.values(DESTINATIONS).find((destination) =>
    destination.aliases.some((alias) => normalized(alias) === wanted));
}

function bareTurnDestination(cmd) {
  const phrase = normalized(cmd.dobj);
  return Object.values(DESTINATIONS).find((destination) =>
    WEATHERVANE_NAMES.some((name) => phrase === normalized(name) + destination.direction
      || phrase === normalized(name) + destination.direction[0]));
}

function weathervaneDescription(ctx) {
  return ctx.getFlag(WEATHERVANE_FREED)
    ? "A RUSTED WEATHERVANE with a bent swivel and a BM stamped near its base. Its bolt is gone; it can no longer be turned."
    : "A RUSTED IRON WEATHERVANE on an iron swivel. It can face NORTH, EAST, SOUTH, or WEST. The FAR-GAZING GARGOYLE braces the center post with its curled stone tail and points SOUTHEAST toward the TREE FORT; turn toward the other faces before that one if you want to hear them.";
}

function weathervaneRoomDescription(ctx) {
  return ctx.getFlag(WEATHERVANE_FREED)
    ? "A loose RUSTED WEATHERVANE lies by the snapped post."
    : "A RUSTED WEATHERVANE turns on a post between four stone gargoyles.";
}

function turnWeathervane(ctx, cmd, bareDestination = null) {
  const requested = bareDestination || destinationFrom(cmd.iobj);
  if (ctx.getFlag(WEATHERVANE_FREED)) {
    // Pointing the freed vane back at the far-gazing gargoyle keeps its pool turning.
    return requested?.eastPool && ctx.state.room === "roof"
      ? ctx.cycleFlavor(requested.eastPool)
      : "The WEATHERVANE is free of its post. It can no longer be turned.";
  }
  if (!requested) {
    return cmd.iobj
      ? "The vane has four directions: NORTH, EAST, SOUTH, WEST."
      : "Face the WEATHERVANE toward which gargoyle or direction?";
  }

  const weathervane = ctx.item("rustedWeathervane");
  if (!requested.pool) {
    ctx.setFlag(WEATHERVANE_FREED);
    weathervane.fixed = false;
    const points = ctx.awardProgress("weathervaneFreed");
    return ctx.cycleFlavor(requested.eastPool) + "\n\n" +
      "With its last living twitch, its curled stone tail snaps the post's bolt. The RUSTED WEATHERVANE drops free for you to TAKE." +
      (points ? ` (+${points})` : "") + ctx.awardUse(weathervane);
  }

  const points = ctx.awardProgress(requested.pool);
  return ctx.cycleFlavor(requested.pool) + (points ? ` (+${points})` : "") + ctx.awardUse(weathervane);
}

function takeWeathervane(ctx) {
  if (!ctx.getFlag(WEATHERVANE_FREED)) {
    return "The WEATHERVANE is bolted to its post. Face it toward the gargoyles first.";
  }
  ctx.item("rustedWeathervane").fixed = false;
  return null;
}

function useWeathervane(ctx) {
  return ctx.getFlag(WEATHERVANE_FREED)
    ? "The freed WEATHERVANE no longer turns. Its rusted needle makes a fine pointer."
    : null;
}

function stoneGargoyle() {
  return "The gargoyle is stone. Try facing the WEATHERVANE toward it instead.";
}

const rooms = {};
const items = {
  gargoylePuffCheeks: {
    names: ["gargoyle", "puff", "burper", "burping gargoyle"],
    adjectives: ["north", "puff-cheeked", "puff", "burping"],
    loc: "roof",
    fixed: true,
    on: { attack: stoneGargoyle, fight: stoneGargoyle },
  },
  gargoyleNosePinch: {
    names: ["gargoyle", "nose", "farter", "farting gargoyle"],
    adjectives: ["west", "nose-pinching", "nose", "farting"],
    loc: "roof",
    fixed: true,
    on: { attack: stoneGargoyle, fight: stoneGargoyle },
  },
  gargoyleRearGuard: {
    names: ["gargoyle", "rear", "shitter", "pooping gargoyle"],
    adjectives: ["south", "rear-guarding", "rear", "pooping"],
    loc: "roof",
    fixed: true,
    on: { attack: stoneGargoyle, fight: stoneGargoyle },
  },
  gargoyleFarGazing: {
    names: ["gargoyle", "far", "gazer", "horizon-gazer", "horizon gazer"],
    adjectives: ["east", "far-gazing", "far", "horizon-gazing"],
    loc: "roof",
    fixed: true,
    on: { attack: stoneGargoyle, fight: stoneGargoyle },
  },
  rustedWeathervane: {
    names: WEATHERVANE_NAMES,
    adjectives: ["rusted", "iron"],
    loc: "roof",
    fixed: true,
    takeable: true,
    treasure: true,
    points: 10,
    on: {
      take: takeWeathervane,
      turn: turnWeathervane,
      use: useWeathervane,
    },
  },
};
const content = {
  rooms: {
    roof: {
      desc:
        "Slate ridges roll across the MANOR ROOF beneath the open sky. The broken ATTIC skylight is DOWN; " +
        "a narrow ridge runs EAST to the BELFRY. Four fixed GARGOYLES crouch around a RUSTED WEATHERVANE. Each grips its center post with one hand, except the FAR-GAZING GARGOYLE EAST, which faces away and braces it with a curled stone tail while pointing SOUTHEAST toward the TREE FORT.",
      searchDesc:
        "The ridge from the BELFRY is solid enough to walk. The NORTH GARGOYLE has ballooned cheeks and a free fist against its chest, about to burp; the EAST GARGOYLE faces away, its curled stone tail bracing the WEATHERVANE post while one arm points SOUTHEAST at the TREE FORT; the SOUTH GARGOYLE clamps a hand over its backside, trying to hold back a poop explosion; the WEST GARGOYLE pinches its nose with watering eyes, dreading the fart it is about to let rip.",
    },
  },
  items: {
    gargoylePuffCheeks: {
      roomDesc: "The PUFF-CHEEKED GARGOYLE faces NORTH, one hand on the WEATHERVANE post and its free fist against its chest, looking about to burp.",
      desc: "The puff-cheeked gargoyle grips the center post with one hand, cheeks swollen and free fist pressed to its chest, as if it is about to burp.",
    },
    gargoyleNosePinch: {
      roomDesc: "The NOSE-PINCHING GARGOYLE faces WEST, one hand on the post and its free hand pinching its nose, as if dreading the fart it is about to let rip.",
      desc: "The nose-pinching gargoyle grips the center post with one hand and pinches its nose with the other, as if dreading the fart it is about to let rip.",
    },
    gargoyleRearGuard: {
      roomDesc: "The REAR-GUARDING GARGOYLE faces SOUTH, one hand on the post and its free hand guarding its backside, as if trying to hold back a poop explosion.",
      desc: "The rear-guarding gargoyle grips the center post with one hand and clamps the other over its own backside, as if trying to hold back a poop explosion.",
    },
    gargoyleFarGazing: {
      roomDesc: "The FAR-GAZING GARGOYLE faces EAST away from the vane, its curled stone tail bracing the post while one arm points SOUTHEAST toward the TREE FORT.",
      desc: "The far-gazing gargoyle faces away from the vane, its curled stone tail braced on the post's bolt and one stone arm pointing SOUTHEAST toward the TREE FORT and its distant SPYGLASS.",
    },
    rustedWeathervane: {
      roomDesc: weathervaneRoomDescription,
      desc: weathervaneDescription,
    },
  },
};
const shortNames = {
  items: {
    gargoylePuffCheeks: "puff",
    gargoyleNosePinch: "pinchnose",
    gargoyleRearGuard: "rearguard",
    gargoyleFarGazing: "fargaze",
    rustedWeathervane: "vane",
  },
};
const progressAwards = {
  gargoylePuffCheeks: 2,
  gargoyleNosePinch: 2,
  gargoyleRearGuard: 2,
  weathervaneFreed: 5,
};
const hints = [
  {
    topics: ["roof", "attic", "belfry", "hidden vault", "vault", "skylight"],
    done: false,
    text: "From the ATTIC, fly through the skylight, or find the NORTH door with hidden sight, then go UP from the HIDDEN VAULT and WEST from the BELFRY.",
  },
  {
    topics: ["gargoyle", "gargoyles", "puff", "nose", "rear", "far", "burper", "farter", "shitter", "horizon gazer"],
    done: false,
    text: "The WEATHERVANE can face the NORTH, WEST, SOUTH, or EAST gargoyle. Visit the first three before the FAR-GAZING GARGOYLE EAST; a freed vane cannot turn again.",
  },
  {
    topics: ["weathervane", "vane"],
    done: false,
    text: "TURN VANE NORTH, WEST, SOUTH, or EAST. The FAR-GAZING GARGOYLE EAST points SOUTHEAST toward the TREE FORT and frees the RUSTED WEATHERVANE.",
  },
];
const roomHooks = {
  roof: {
    turn(ctx, cmd) {
      const destination = bareTurnDestination(cmd);
      return destination ? turnWeathervane(ctx, cmd, destination) : null;
    },
    move(ctx, cmd) {
      const destination = bareTurnDestination(cmd);
      return destination ? turnWeathervane(ctx, cmd, destination) : null;
    },
  },
};
const flavorPools = {
  gargoylePuffCheeks: [
    "The puff-cheeked gargoyle creaks to life, unleashes a BURP so huge it rattles every slate on the roof and blows your hair straight back, mutters \"pardon me,\" and settles back into stone.",
    "With a grinding of granite the gargoyle wakes, swells, and BURPS a gale of ancient pigeon breath into your face. It whispers \"so sorry, centuries of gas,\" and stiffens back into stone.",
    "It blinks to life, thumps its chest once, and BURPS loud enough to echo off the BELFRY, showering you in mortar dust. It bows apologetically and turns back to stone.",
    "The gargoyle comes alive just long enough to BURP a perfect smoke ring of grit around your head, coughs \"excuse me,\" and freezes back into stone.",
    "Stone cracks as it comes to life, cheeks pop, and a thunderous BURP sends three shingles cartwheeling past your ear. \"My apologies,\" it rumbles, and hardens back into stone.",
    "It wakes, gulps, and BURPS the alphabet up to G right in your face before running out of air. It murmurs \"forgive me\" and turns back to stone.",
    "The gargoyle shudders to life and lets loose a wet, gravelly BURP that sprays your face with warm moss. \"Terribly sorry,\" it sighs, and turns back to stone.",
    "It comes to life, its stone chest heaves, and a BURP like a cannon blast knocks you back a step. The gargoyle covers its mouth, mouths \"oops, pardon me,\" and turns back to stone.",
    "It comes alive and BURPS at you so hard its own ears flap, apologizes to you and then separately to the pigeons, and turns back to stone.",
    "With a crunch of waking granite it BURPS a cloud that smells like a cave full of old eggs straight up your nostrils, says \"sorry, that one got away from me,\" and stiffens back into stone.",
    "The gargoyle wakes, BURPS the deepest note ever heard in this county, and pelts you with pebbles. \"A thousand pardons,\" it groans, and petrifies again.",
    "It animates, holds the BURP for one dramatic beat, then releases it directly into your ear. \"Excuse me, that was rude,\" it apologizes, and returns to stone.",
  ],
  gargoyleNosePinch: [
    "The nose-pinching gargoyle grinds to life, lifts one stone leg, and FARTS a blast that flattens your hair and peels moss off the slates. Eyes watering, it gasps \"sorry, sorry,\" and turns back to stone.",
    "It wakes, swings its granite backside toward you, and FARTS with the force of a church organ. The smell arrives a second later and sits on your face. It apologizes through its pinched nose and stiffens back into stone.",
    "The gargoyle comes alive, squeaks out a tiny FART, looks relieved, then follows it with an enormous one that blows you clean off your feet. \"Excuse me,\" it wheezes, and turns back to stone.",
    "Granite shifts as it comes to life, cheeks clench, and a FART like tearing canvas blasts grit all over you. It pinches its nose harder, mumbles an apology, and turns back to stone.",
    "It wakes just long enough to FART a green-tinged cloud that drifts lazily onto you and refuses to leave. \"Unforgivable. I am so sorry,\" it admits, and turns back to stone.",
    "The gargoyle animates and FARTS three short notes at you that sound suspiciously like a doorbell, blushes through solid rock, apologizes, and petrifies back into stone.",
    "With a groan it comes alive and FARTS so hard it lifts an inch off the ridge. You are engulfed. It lands, whispers \"my deepest apologies,\" and turns to stone.",
    "It wakes, FARTS a long, wavering note directly at you, and finishes with a hopeful little squeak. \"Sorry about that,\" it says nasally, and stiffens back into stone.",
    "The gargoyle twitches to life and FARTS a gust that spins the WEATHERVANE twice and plasters a dead leaf to your forehead. It apologizes and freezes back into stone.",
    "It comes alive, aims carefully, and FARTS a hot blast that fogs your eyeballs. \"Sorry, that was not my best work,\" it mutters, returning to stone.",
    "Stone creaks as it comes to life, and a FART like a sputtering motorboat rattles past your knees and lingers in your clothes. The gargoyle waves an apologetic claw and hardens back into stone.",
    "It wakes and FARTS straight at you, a smell so old it has its own family crest, then sobs \"I'm so sorry,\" and turns back to stone, still pinching its nose.",
  ],
  gargoyleRearGuard: [
    "The rear-guarding gargoyle comes to life and SHARTS magnificently, splattering you from boots to eyebrows. It apologizes profusely and turns back to stone.",
    "It wakes, loses its grip on the situation, and a geyser of brown gravel SPLATTERS across you and the slates. \"I held it for three hundred years,\" it sobs, apologizes, and petrifies.",
    "Granite cracks as it comes to life, its hand slips, and a POOP EXPLOSION paints you and a startled pigeon the same shade of brown. It begs your pardon and turns back to stone.",
    "The gargoyle animates, clenches heroically, fails, and SHARTS a wet stone avalanche all over your shoes. \"Terribly sorry,\" it moans, and freezes back into stone.",
    "It comes alive with a gurgle, then ERUPTS behind itself; the blowback SPLATTERS you head to toe. It whispers \"so, so sorry\" and stiffens back into stone.",
    "It comes to life, its stone hand flies off its backside, and it SHARTS a brown comet across the roof, catching you on the backswing. It apologizes and hardens back into stone.",
    "The gargoyle wakes and sneezes, and the sneeze triggers a full POOP EXPLOSION that splatters you generously. \"Sorry, that's on me,\" it admits, and turns to stone.",
    "It springs to life, loses the battle instantly, and SHARTS a muddy spray that leaves a gargoyle-shaped outline around you. It apologizes and petrifies.",
    "It groans to life and relaxes for one fatal second; the resulting SPLATTER coats you and drips off the gutter. \"Forgive me,\" it begs, and freezes back into stone.",
    "It comes alive, does a frantic little dance, then SHARTS spectacularly, splattering you, the WEATHERVANE, and a passing moth. It apologizes and turns back to stone.",
    "The gargoyle wakes, releases three centuries of pressure in one brown BLAST that SPLATTERS you, then wipes your face with its free claw as an apology. It did not help. It turns back to stone.",
    "It animates, SHARTS with operatic volume, splattering you thoroughly, then bows, apologizes, and returns to solid stone with its hand clamped back over its rear.",
  ],
  gargoyleFarGazing: [
    "The far-gazing gargoyle grinds to life without turning around. \"For centuries I have longed to wander past that horizon, but the curse of this stone holds me fast. The vane, at least, I could set free.\" Then it turns back to stone, arm still pointing SOUTHEAST.",
    "Its stone shoulders crack awake. \"See that little wooden house up in the trees by the PRIVY? Somebody built a lookout there. I would give my tail to climb it.\" Its shoulders settle, and it turns back to stone.",
    "The gargoyle stirs to life, still facing away. \"A vane should point wherever the wind wants, not where a bolt says. Go on, little vane, be free.\" It hardens back into stone.",
    "It wakes with a sigh of gravel. \"There is a fort in the trees beyond the PRIVY. Someone up there has a SPYGLASS, and I swear they look back at me.\" The sigh trails off as it turns back to stone.",
    "The far-gazing gargoyle comes to life just long enough to say, \"My neighbors burp, fart, and worse. I only point, and somehow I am the weird one.\" Then it turns back to stone.",
    "It creaks to life and keeps pointing. \"Follow my arm. SOUTHEAST, past the PRIVY, up into the trees. Things are seen from there that cannot be seen from here.\" It turns back to stone mid-point.",
    "The gargoyle wakes. \"I set the vane free so at least one of us could travel. Carry it somewhere with a better view than this gutter.\" Its voice fades as it turns back to stone.",
    "Granite grinds as it comes to life. \"Some nights a lantern glows in that tree house near the PRIVY. I count the flickers. It is the only show in town.\" It settles back into stone.",
    "It wakes and flicks its curled tail at the empty post. \"Even rusted, a vane belongs to the wind, not to a roof. Freedom suits it.\" Then it turns back to stone.",
    "The far-gazing gargoyle twitches to life. \"I would turn around and say hello properly, but my neck has been stone since the Tudors.\" It turns back to stone, still facing away.",
    "It comes to life and whispers, \"The trees by the PRIVY hide a fort, and the fort hides an eye. Climb, look, and you will see what I cannot.\" It turns back to stone.",
    "Stone flakes from its brow as it wakes. \"One day the curse will break and I will walk SOUTHEAST until the horizon runs out. Until then, I point.\" It turns back to stone.",
  ],
};

export default { rooms, items, content, shortNames, progressAwards, hints, roomHooks, flavorPools };

// end weathervane.js
