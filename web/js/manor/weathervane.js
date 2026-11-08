// weathervane.js. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.001:acoven.

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
  if (ctx.getFlag(WEATHERVANE_FREED)) {
    return "The WEATHERVANE is free of its post. It can no longer be turned.";
  }
  const requested = bareDestination || destinationFrom(cmd.iobj);
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
    return "For centuries I have longed to wander past that horizon, but the curse of this stone holds me fast. You, vane, I can set free.\n\n" +
      "Its curled stone tail snaps the post's bolt. The RUSTED WEATHERVANE drops free for you to TAKE." +
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
    names: ["puff-cheeked gargoyle", "north gargoyle", "burper", "burping gargoyle"],
    loc: "roof",
    fixed: true,
    on: { attack: stoneGargoyle, fight: stoneGargoyle },
  },
  gargoyleNosePinch: {
    names: ["nose-pinching gargoyle", "east gargoyle", "farter", "farting gargoyle"],
    loc: "roof",
    fixed: true,
    on: { attack: stoneGargoyle, fight: stoneGargoyle },
  },
  gargoyleRearGuard: {
    names: ["rear-guarding gargoyle", "south gargoyle", "shitter", "pooping gargoyle"],
    loc: "roof",
    fixed: true,
    on: { attack: stoneGargoyle, fight: stoneGargoyle },
  },
  gargoyleFarGazing: {
    names: ["far-gazing gargoyle", "west gargoyle", "horizon-gazer", "horizon gazer", "gazer"],
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
        "The ridge from the BELFRY is solid enough to walk. The NORTH GARGOYLE has ballooned cheeks and a free fist against its chest; the EAST GARGOYLE faces away, its curled stone tail bracing the WEATHERVANE post while one arm points SOUTHEAST at the TREE FORT; the SOUTH GARGOYLE guards its own backside; the WEST GARGOYLE pinches its nose with watering eyes.",
    },
  },
  items: {
    gargoylePuffCheeks: {
      roomDesc: "The PUFF-CHEEKED GARGOYLE faces NORTH, one hand on the WEATHERVANE post and its free fist against its chest.",
      desc: "The puff-cheeked gargoyle grips the center post with one hand, cheeks swollen and free fist pressed to its chest.",
    },
    gargoyleNosePinch: {
      roomDesc: "The NOSE-PINCHING GARGOYLE faces WEST, one hand on the post and its free hand pinching its nose.",
      desc: "The nose-pinching gargoyle grips the center post with one hand, pinches its nose with the other, and looks offended by an inescapable wind.",
    },
    gargoyleRearGuard: {
      roomDesc: "The REAR-GUARDING GARGOYLE faces SOUTH, one hand on the post and its free hand guarding its backside.",
      desc: "The rear-guarding gargoyle grips the center post with one hand and guards its own backside with the other.",
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
    text: "TURN VANE TO FACE a gargoyle or direction. The FAR-GAZING GARGOYLE EAST points SOUTHEAST toward the TREE FORT and frees the RUSTED WEATHERVANE.",
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
    "The north gargoyle pats its chest and makes the gutter ring.",
    "Its puffed cheeks deflate like sad bagpipes; three pigeons resign.",
    "One stone fist thumps its chest, and a deep rumble rolls down the roof like a loose barrel.",
    "It holds both cheeks swollen until a gutter pipe answers with a rude echo.",
    "Its fist remains over its heart while its mouth releases an extremely personal thunderclap.",
    "Its cheeks bulge so far that the silver vane seems to duck.",
    "A squeak slips through clenched lips and frightens a piece of mortar loose.",
    "It taps its chest, waits for applause, and supplies its own booming encore.",
    "Air escapes its puffed cheeks in a long note that sounds like a tuba clearing its throat.",
    "Its free fist rises to its chest just before a pigeon learns about shock waves.",
    "Its cheeks inflate like two tiny moons, then collapse into one enormous stone rumble.",
    "It slaps its chest and answers the rusted vane with an uninvited digestive fanfare.",
  ],
  gargoyleNosePinch: [
    "The west gargoyle pinches its nose and points accusingly at an innocent cloud.",
    "One hand stays over its nose while a suspicious breeze arrives from behind the stone.",
    "It holds its nostrils shut and insists the sound came from the BELFRY.",
    "Its nose-pinching fingers tighten; a pigeon on the gutter makes a rapid career change.",
    "Its pose says innocence while the air says it needs a lawyer.",
    "A squeak rises from the roof, and it covers its nose with renewed commitment.",
    "The gargoyle keeps one hand clamped over its nose, then blames a passing leaf.",
    "Its free hand waves the air away while its other hand guards its nostrils.",
    "It pinches its nose so tightly that the next gust whistles through a crack in the stone.",
    "It looks upwind and acts surprised when the smell keeps up.",
    "Its fingers stay on its nose while the silver vane points directly at the culprit.",
    "It refuses to uncover its nostrils until the last pigeon has evacuated.",
  ],
  gargoyleRearGuard: [
    "The south gargoyle clutches its stone rear. Even the mortar looks nervous.",
    "Its free hand stays behind it while it asks the weather for privacy.",
    "It checks its backside twice and discovers that granite is not reassuring.",
    "Its free hand covers the danger zone so firmly that the roof slate blushes.",
    "It squeezes its stone cheeks together and apologizes to the gutter.",
    "One marble palm guards its backside as if a small disaster has applied for entry.",
    "It leans forward without moving its free hand. Nobody asks why.",
    "Its free hand stays behind it while the gargoyle gives the horizon a worried look.",
    "It pats its stone backside, counts the cracks, and decides not to trust the count.",
    "A gust hits; it grabs its rear with fresh architectural urgency.",
    "Its free hand shelters the back of its stone trousers from a crisis that cannot be seen.",
    "It folds around its backside like a very small, very embarrassed fortress.",
  ],
};

export default { rooms, items, content, shortNames, progressAwards, hints, roomHooks, flavorPools };

// end weathervane.js
