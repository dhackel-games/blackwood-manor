// weathercock.js. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.001:acoven.

const WEATHERCOCK_FREED = "manor:weathercockFreed";

const DESTINATIONS = {
  burper: {
    direction: "north",
    pool: "gargoyleBurper",
    aliases: ["burper", "burping gargoyle", "north gargoyle", "north"],
  },
  farter: {
    direction: "east",
    pool: "gargoyleFarter",
    aliases: ["farter", "farting gargoyle", "east gargoyle", "east"],
  },
  shitter: {
    direction: "south",
    pool: "gargoyleShitter",
    aliases: ["shitter", "pooping gargoyle", "south gargoyle", "south"],
  },
  horizonGazer: {
    direction: "west",
    aliases: ["horizon-gazer", "horizon gazer", "gazer", "west gargoyle", "west"],
  },
};

const WEATHERCOCK_NAMES = ["silver weathercock", "weathercock", "rooster", "weathervane", "vane"];

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
    WEATHERCOCK_NAMES.some((name) => phrase === normalized(name) + destination.direction));
}

function weathercockDescription(ctx) {
  return ctx.getFlag(WEATHERCOCK_FREED)
    ? "A SILVER WEATHERCOCK with a bent swivel and a BM stamped under one wing. Its bolt is gone; the rooster can no longer be turned."
    : "A silver rooster on an iron swivel. Its beak can face NORTH, EAST, SOUTH, or WEST. The HORIZON-GAZER's stone fingers touch the post's bolt; turn toward the other faces before that one if you want to hear them.";
}

function weathercockRoomDescription(ctx) {
  return ctx.getFlag(WEATHERCOCK_FREED)
    ? "A loose SILVER WEATHERCOCK lies by the snapped post."
    : "A SILVER WEATHERCOCK turns on a post between four stone faces.";
}

function turnWeathercock(ctx, cmd, bareDestination = null) {
  if (ctx.getFlag(WEATHERCOCK_FREED)) {
    return "The WEATHERCOCK is free of its post. It can no longer be turned.";
  }
  const requested = bareDestination || destinationFrom(cmd.iobj);
  if (!requested) {
    return cmd.iobj
      ? "The rooster has four perches: NORTH, EAST, SOUTH, WEST."
      : "Face the WEATHERCOCK toward which gargoyle or direction?";
  }

  const weathercock = ctx.item("silverWeathercock");
  if (!requested.pool) {
    ctx.setFlag(WEATHERCOCK_FREED);
    weathercock.fixed = false;
    const points = ctx.awardProgress("weathercockFreed");
    return "For centuries I have longed to wander past that horizon, but the curse of this stone holds me fast. You, rooster, I can set free.\n\n" +
      "Its stone hand snaps the post's bolt. The SILVER WEATHERCOCK drops free for you to TAKE." +
      (points ? ` (+${points})` : "") + ctx.awardUse(weathercock);
  }

  const points = ctx.awardProgress(requested.pool);
  return ctx.cycleFlavor(requested.pool) + (points ? ` (+${points})` : "") + ctx.awardUse(weathercock);
}

function takeWeathercock(ctx) {
  if (!ctx.getFlag(WEATHERCOCK_FREED)) {
    return "The WEATHERCOCK is bolted to its post. Face it toward the gargoyles first.";
  }
  ctx.item("silverWeathercock").fixed = false;
  return null;
}

function useWeathercock(ctx) {
  return ctx.getFlag(WEATHERCOCK_FREED)
    ? "The freed WEATHERCOCK no longer turns. Its silver beak makes a fine pointer."
    : null;
}

function stoneGargoyle() {
  return "The gargoyle is stone. Try facing the WEATHERCOCK toward it instead.";
}

const rooms = {};
const items = {
  gargoyleBurper: {
    names: ["burper", "burping gargoyle", "north gargoyle"],
    loc: "roof",
    fixed: true,
    on: { attack: stoneGargoyle, fight: stoneGargoyle },
  },
  gargoyleFarter: {
    names: ["farter", "farting gargoyle", "east gargoyle"],
    loc: "roof",
    fixed: true,
    on: { attack: stoneGargoyle, fight: stoneGargoyle },
  },
  gargoyleShitter: {
    names: ["shitter", "pooping gargoyle", "south gargoyle"],
    loc: "roof",
    fixed: true,
    on: { attack: stoneGargoyle, fight: stoneGargoyle },
  },
  gargoyleHorizonGazer: {
    names: ["horizon-gazer", "horizon gazer", "gazer", "west gargoyle"],
    loc: "roof",
    fixed: true,
    on: { attack: stoneGargoyle, fight: stoneGargoyle },
  },
  silverWeathercock: {
    names: WEATHERCOCK_NAMES,
    adjectives: ["silver"],
    loc: "roof",
    fixed: true,
    takeable: true,
    pendingHeirloom: true,
    on: {
      take: takeWeathercock,
      turn: turnWeathercock,
      use: useWeathercock,
    },
  },
};
const content = {
  rooms: {
    roof: {
      desc:
        "Slate ridges roll across the MANOR ROOF beneath the open sky. The broken ATTIC skylight is DOWN; " +
        "a narrow ridge runs EAST to the BELFRY. Four fixed GARGOYLES ring a SILVER WEATHERCOCK: the BURPER NORTH, " +
        "the FARTER EAST, the SHITTER SOUTH, and the HORIZON-GAZER WEST. The last one's hand rests on the post's bolt.",
      searchDesc:
        "The ridge from the BELFRY is solid enough to walk. The BURPER puffs its cheeks and presses a fist to its chest, the FARTER holds its nose, the SHITTER covers its butt with both hands, and the HORIZON-GAZER watches the far edge of the sky with one hand ready to snap the WEATHERCOCK free.",
    },
  },
  items: {
    gargoyleBurper: {
      roomDesc: "The BURPER faces NORTH with cheeks inflated and a fist against its chest.",
      desc: "The BURPER holds a fist to its chest, cheeks swollen with a stone belch. It stares at the WEATHERCOCK's swivel.",
    },
    gargoyleFarter: {
      roomDesc: "The FARTER faces EAST, one hand pinching its nose.",
      desc: "The FARTER pinches its nose with a marble hand and looks offended by the wind it cannot escape.",
    },
    gargoyleShitter: {
      roomDesc: "The SHITTER faces SOUTH with both hands over its butt.",
      desc: "The SHITTER covers its rear with both hands as if it expects its stone trousers to betray it.",
    },
    gargoyleHorizonGazer: {
      roomDesc: "The HORIZON-GAZER faces WEST, its fingers resting on the post's bolt.",
      desc: "The HORIZON-GAZER stares past the far ridge, one hand at the WEATHERCOCK's bolt. It looks ready to free the rooster at the cost of ever hearing the other gargoyles.",
    },
    silverWeathercock: {
      roomDesc: weathercockRoomDescription,
      desc: weathercockDescription,
    },
  },
};
const shortNames = {
  items: {
    gargoyleBurper: "burper",
    gargoyleFarter: "farter",
    gargoyleShitter: "shitter",
    gargoyleHorizonGazer: "horizongazer",
    silverWeathercock: "weathercock",
  },
};
const progressAwards = {
  gargoyleBurper: { points: 2, maximumScore: false },
  gargoyleFarter: { points: 2, maximumScore: false },
  gargoyleShitter: { points: 2, maximumScore: false },
  weathercockFreed: { points: 5, maximumScore: false },
};
const hints = [
  {
    topics: ["roof", "attic", "belfry", "hidden vault", "vault", "skylight"],
    done: false,
    text: "From the ATTIC, fly through the skylight, or find the NORTH door with hidden sight, then go UP from the HIDDEN VAULT and WEST from the BELFRY.",
  },
  {
    topics: ["gargoyle", "gargoyles", "burper", "farter", "shitter", "horizon gazer"],
    done: false,
    text: "The WEATHERCOCK can face four fixed stone faces. Visit BURPER, FARTER, and SHITTER before HORIZON-GAZER; a freed rooster cannot turn again.",
  },
  {
    topics: ["weathercock", "rooster", "weathervane", "vane"],
    done: false,
    text: "TURN WEATHERCOCK TO FACE a gargoyle or direction. After the HORIZON-GAZER frees it, TAKE the SILVER WEATHERCOCK.",
  },
];
const roomHooks = {
  roof: {
    turn(ctx, cmd) {
      const destination = bareTurnDestination(cmd);
      return destination ? turnWeathercock(ctx, cmd, destination) : null;
    },
  },
};
const flavorPools = {
  gargoyleBurper: [
    "The BURPER pats its chest and lets out a belch that makes the gutter ring.",
    "The BURPER's puffed cheeks deflate like sad bagpipes; three pigeons resign.",
    "One stone fist thumps its chest, and a burp rolls down the roof like a loose barrel.",
    "The BURPER holds both cheeks swollen until a gutter pipe answers with a rude echo.",
    "Its fist remains over its heart while its mouth releases an extremely personal thunderclap.",
    "The BURPER's cheeks bulge so far that the weathercock seems to duck.",
    "A belch squeaks through the BURPER's clenched lips and frightens a piece of mortar loose.",
    "The BURPER taps its chest, waits for applause, and supplies its own booming encore.",
    "Air escapes its puffed cheeks in a long note that sounds like a tuba clearing its throat.",
    "The BURPER's fist rises to its chest just before a pigeon learns about shock waves.",
    "Its cheeks inflate like two tiny moons, then collapse into one enormous stone burp.",
    "The BURPER slaps its chest and answers the rooster with an uninvited digestive fanfare.",
  ],
  gargoyleFarter: [
    "The FARTER pinches its nose and points accusingly at an innocent cloud.",
    "One hand stays over its nose while a suspicious breeze arrives from behind the stone.",
    "The FARTER holds its nostrils shut and insists the sound came from the BELFRY.",
    "Its nose-pinching fingers tighten; a pigeon on the gutter makes a rapid career change.",
    "The FARTER's pose says innocence while the air says it needs a lawyer.",
    "A squeak rises from the roof, and the FARTER covers its nose with renewed commitment.",
    "The gargoyle keeps one hand clamped over its nose, then blames a passing leaf.",
    "The FARTER's free hand waves the air away while its other hand guards its nostrils.",
    "It pinches its nose so tightly that the next gust whistles through a crack in the stone.",
    "The FARTER looks upwind and acts surprised when the smell keeps up.",
    "Its fingers stay on its nose while the weathercock turns to point directly at the culprit.",
    "The FARTER refuses to uncover its nostrils until the last pigeon has evacuated.",
  ],
  gargoyleShitter: [
    "The SHITTER clutches its stone butt with both hands. Even the mortar looks nervous.",
    "Both hands remain on its rear while the SHITTER asks the weather for privacy.",
    "The SHITTER checks its butt twice and discovers that granite is not reassuring.",
    "Its hands cover the danger zone so firmly that the roof slate blushes.",
    "The SHITTER squeezes its stone cheeks together and apologizes to the gutter.",
    "Two marble palms guard its backside as if a small disaster has applied for entry.",
    "The SHITTER leans forward without taking either hand off its butt. Nobody asks why.",
    "Both hands stay on the rear while the gargoyle gives the horizon a worried look.",
    "The SHITTER pats its stone backside, counts the cracks, and decides not to trust the count.",
    "A gust hits; the SHITTER grabs its butt with fresh architectural urgency.",
    "Its hands shelter the rear of its stone trousers from a crisis that cannot be seen.",
    "The SHITTER folds around its backside like a very small, very embarrassed fortress.",
  ],
};

export default { rooms, items, content, shortNames, progressAwards, hints, roomHooks, flavorPools };

// end weathercock.js
