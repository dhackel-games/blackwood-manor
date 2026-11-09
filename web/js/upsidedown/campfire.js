// campfire.js. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.010:acoven.

function normalized(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isFireTarget(value) {
  return ["fire", "campfire", "upsidedowncampfire", "flames"].includes(normalized(value));
}

function isJugTarget(value) {
  return ["jug", "milkjug", "emptymilkjug", "waterjug"].includes(normalized(value));
}

function isWaterTarget(value) {
  return ["water", "streamwater", "jug", "milkjug", "emptymilkjug", "waterjug"].includes(normalized(value));
}

function fireOut(ctx) {
  return !!ctx.getFlag("realm:campfireOut");
}

function fireDescription(ctx) {
  if (!fireOut(ctx)) {
    return "The flames of the CAMPFIRE point down, as if the earth has ordered a very small barbecue. Something hard sits beneath the hot ash, but the fire bars your hands. The nearby STREAM could fill a JUG; you could also risk your shoes.";
  }
  return ctx.roomOf("cyanGem") === "waylampClearing"
    ? "A cold ring of ash surrounds the CYAN GEM. The downward flames have finally given up."
    : "A cold ring of ash marks the extinguished CAMPFIRE. There is no second GEM.";
}

function roomDescription(ctx) {
  const fire = fireOut(ctx)
    ? ctx.roomOf("cyanGem") === "waylampClearing"
      ? "Cold ash surrounds a CYAN GEM beside the STREAM."
      : "Cold ash marks where the CAMPFIRE burned, and the STREAM gurgles beside it."
    : "An UPSIDE-DOWN CAMPFIRE burns with its flames pointing into the dirt, and a STREAM gurgles beside it.";
  return "A lonely WAYLAMP shines beside a wood that appears to have failed an inspection of reality. " +
    `${fire} The MINERS' LOCKER stands behind you. Paths lead NORTH to a cheesy cave, EAST to a club den, ` +
    "WEST to a rickety SHACK, and SOUTH down among enormous exposed roots.";
}

function roomSearchDescription(ctx) {
  return fireOut(ctx)
    ? ctx.roomOf("cyanGem") === "waylampClearing"
      ? "The ashes give up the CYAN GEM. The STREAM continues to offer water."
      : "The cold ashes hold no second gem. The STREAM continues to offer water."
    : "Heat keeps you back from a hard shape in the ashes. The STREAM is close enough to fill a JUG; you could also risk your shoes on that fire.";
}

function streamDescription() {
  return "A shallow STREAM runs over pebbles beside the CAMPFIRE. Its water is clean enough to carry in a JUG, not as a separate item.";
}

function wineBottle(ctx) {
  return ctx.inventory().find((item) =>
    (item.id === "wineBottle" || item.templateId === "wineBottle")
      && ["wine", "winebottle", "dustywinebottle", "vintage", "bottle"].includes(normalized(item.names?.[0]))
  ) || ctx.inventory().find((item) => item.id === "wineBottle" || item.templateId === "wineBottle");
}

function spendWine(ctx, bottle) {
  const sips = { ...(ctx.getFlag("manor:wineSips") || {}) };
  const consumed = (Number(sips[bottle.id]) || 0) + 1;
  sips[bottle.id] = consumed;
  ctx.setFlag("manor:wineSips", sips);
  if (bottle.highSource) bottle.highSource.doses = Math.max(0, 4 - consumed);
  if (consumed >= 4) ctx.destroy(bottle.id);
}

function extinguish(ctx, prefix) {
  ctx.setFlag("realm:campfireOut");
  ctx.moveItem("cyanGem", "waylampClearing");
  const points = ctx.awardProgress("campfireOut");
  return `${prefix} In the cold ashes lies a CYAN GEM, etched with tiny BM initials. (+${points})`;
}

function pourOnFire(ctx, cmd) {
  if (!isFireTarget(cmd.iobj)) return null;
  if (fireOut(ctx)) return "The CAMPFIRE is already out. The CYAN GEM lies in its ashes.";

  const poured = normalized(cmd.dobj);
  if (["wine", "winebottle", "dustywinebottle", "vintage", "bottle"].includes(poured)) {
    const bottle = wineBottle(ctx);
    if (!bottle) return "You need an opened WINE BOTTLE in your hands.";
    if (!bottle.open) return "The WINE BOTTLE is corked. Only the CORKSCREW can open it.";
    const use = ctx.awardUse(bottle);
    spendWine(ctx, bottle);
    return extinguish(ctx, "You tip wine into the upside-down flames. They cough, blush, and go out.") + use;
  }
  if (["milk", "bottleofmilk"].includes(poured)) {
    if (!ctx.has("milk")) return "You need the BOTTLE OF MILK in your hands.";
    const use = ctx.awardUse(ctx.item("milk"));
    ctx.destroy("milk");
    return extinguish(ctx, "You pour MILK into the flames. The fire sulks like a child denied dessert and goes out.") + use;
  }
  if (isWaterTarget(poured)) {
    const jug = ctx.item("milkJug");
    if (!ctx.has("milkJug")) {
      return "The STREAM is beside the fire, but you need to bring the MILK JUG and FILL it first.";
    }
    if (!jug.filled) return "The MILK JUG is EMPTY. FILL JUG at the STREAM.";
    jug.filled = false;
    return extinguish(ctx, "A JUG of STREAM water hisses into the fire. The downward flames roll over and quit.");
  }
  return "That is not WINE, MILK, or JUG water, and the flames refuse to notice.";
}

function bodyExtinguish(ctx, cmd) {
  if (!isFireTarget(cmd.dobj)) return null;
  if (fireOut(ctx)) return "The CAMPFIRE is already out. The CYAN GEM lies in its ashes.";
  return extinguish(ctx, cmd.verb === "stomp"
    ? "You stomp the flames flat with your shoes. Your soles protest, but the fire is out."
    : "You smother the fire with your body. It loses the argument without setting you alight.");
}

function fillJug(ctx, cmd) {
  if (!isJugTarget(cmd.dobj)) return null;
  if (ctx.state.room !== "waylampClearing") {
    return ctx.has("milkJug") ? "There is no STREAM here to fill the JUG." : null;
  }
  if (!ctx.has("milkJug")) return "You need the EMPTY MILK JUG from the KITCHEN FRIDGE.";
  const jug = ctx.item("milkJug");
  if (jug.filled) return "The JUG is already full.";
  jug.filled = true;
  return "You dip the MILK JUG into the STREAM and lift it out full of water." + ctx.awardUse(jug);
}

function takeUnseenGem(ctx, cmd) {
  if (fireOut(ctx) || !["cyan", "cyangem", "cyanstone"].includes(normalized(cmd.dobj))) return null;
  return "The flames bar your hand. Put the CAMPFIRE out before touching the ashes.";
}

const rooms = {};
const items = {
  upsideDownCampfire: {
    names: ["upside-down campfire", "campfire", "fire", "flames"],
    adjectives: ["upside-down"],
    loc: "waylampClearing",
    fixed: true,
    scenery: true,
    on: {
      examine: fireDescription,
      search: fireDescription,
      pour: pourOnFire,
      extinguish: bodyExtinguish,
      stomp: bodyExtinguish,
      smother: bodyExtinguish,
    },
  },
  stream: {
    names: ["stream", "water", "brook"],
    loc: "waylampClearing",
    fixed: true,
    scenery: true,
    on: {
      examine: streamDescription,
      search() {
        return "The water is within reach. FILL a JUG to carry it.";
      },
      fill: fillJug,
    },
  },
  cyanGem: {
    names: ["cyan gem", "gem", "cyan", "cyan stone"],
    adjectives: ["cyan"],
    loc: null,
    takeable: true,
  },
  milkJug: {
    on: { fill: fillJug },
  },
};
const content = {
  rooms: {
    waylampClearing: {
      desc: roomDescription,
      searchDesc: roomSearchDescription,
    },
  },
  items: {
    upsideDownCampfire: {
      roomDesc(ctx) {
        return fireOut(ctx)
          ? "Cold ashes mark the place where the UPSIDE-DOWN CAMPFIRE burned."
          : "An UPSIDE-DOWN CAMPFIRE drives its flames straight into the dirt.";
      },
      desc: fireDescription,
    },
    stream: {
      roomDesc: "A clear STREAM burbles within arm's reach of the CAMPFIRE.",
      desc: streamDescription,
    },
    cyanGem: {
      roomDesc: "A CYAN GEM gleams in the cold ash.",
      desc: "A translucent CYAN GEM cut into a prism that fits an iron slot. Tiny BM initials run along one facet.",
    },
  },
};
const shortNames = {
  items: {
    upsideDownCampfire: "downfire",
    stream: "stream",
    cyanGem: "cyan",
  },
};
const progressAwards = {
  campfireOut: 5,
};
const hints = [
  (ctx) => ({
    topics: ["campfire", "fire", "flames", "downfire"],
    done: fireOut(ctx),
    text: "The UPSIDE-DOWN CAMPFIRE hides something. STOMP it, SMOTHER it, or POUR WINE, MILK, or JUG water ON FIRE.",
  }),
  {
    topics: ["stream", "brook", "water"],
    done: false,
    text: "The STREAM is next to the fire. TAKE the EMPTY MILK JUG from the KITCHEN FRIDGE, then FILL JUG here.",
  },
  (ctx) => ({
    topics: ["cyan", "cyangem", "cyanstone"],
    done: ctx.has("cyanGem"),
    text: "Once the fire is out, TAKE the CYAN GEM from the ashes and bring it below the GREAT OAK.",
  }),
];
const ROOM_IDS = [
  "gate", "garden", "hedgeMazeGate", "hedgeMazeKnot", "hedgeMazeLoop", "dragonCaveMouth",
  "dragonAntechamber", "mineGallery", "deepShaft", "trollGate", "dreadmawVault", "privy",
  "greatOak", "treeFort", "porch", "grandHall", "parlor", "library", "secretChamber",
  "diningRoom", "kitchen", "wineCellar", "crypt", "landing", "nursery", "masterBedroom",
  "study", "hallBedroom", "attic", "roof", "belfry", "hiddenVault", "garysLair",
  "betweenWalls", "p2_awakening", "t13_medusaGarden", "waylampClearing", "grotto",
  "avClubDen", "planetarium", "mapRoom", "shack", "below",
];
const roomHooks = Object.fromEntries(ROOM_IDS.map((id) => [id, { fill: fillJug }]));
roomHooks.waylampClearing = {
  fill: fillJug,
  pour: pourOnFire,
  stomp: bodyExtinguish,
  smother: bodyExtinguish,
  take: takeUnseenGem,
};
const flavorPools = {};

export default { rooms, items, content, shortNames, progressAwards, hints, roomHooks, flavorPools };

// end campfire.js
