// fridge.js. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.001:acoven.

const FRIDGE_ITEM_IDS = ["milk", "milkJug", "limburgerCheese", "epoissesCheese", "munsterCheese"];
const ROOM_IDS = [
  "gate", "garden", "hedgeMazeGate", "hedgeMazeKnot", "hedgeMazeLoop", "dragonCaveMouth",
  "dragonAntechamber", "mineGallery", "deepShaft", "trollGate", "dreadmawVault", "privy",
  "greatOak", "treeFort", "porch", "grandHall", "parlor", "library", "secretChamber",
  "diningRoom", "kitchen", "wineCellar", "crypt", "landing", "nursery", "masterBedroom",
  "study", "hallBedroom", "attic", "roof", "belfry", "hiddenVault", "garysLair",
  "betweenWalls", "p2_awakening", "t13_medusaGarden", "waylampClearing", "cheeseGrotto",
  "avClubDen", "planetarium", "mapRoom", "shack", "below",
];

function normalized(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function fridgeItemId(ctx, phrase) {
  const wanted = normalized(phrase);
  return FRIDGE_ITEM_IDS.find((id) => {
    const item = ctx.world.items[id];
    return [id, ...(item?.names || [])].some((name) => normalized(name) === wanted);
  });
}

function fridgeContents(ctx) {
  const labels = {
    milk: "MILK",
    milkJug: "an EMPTY MILK JUG",
    limburgerCheese: "LIMBURGER",
    epoissesCheese: "ÉPOISSES",
    munsterCheese: "MUNSTER",
  };
  return FRIDGE_ITEM_IDS.filter((id) => ctx.roomOf(id) === "fridge").map((id) => labels[id]);
}

function openFridge(ctx) {
  const fridge = ctx.item("fridge");
  if (fridge.open) return "The FRIDGE is already open.";
  fridge.open = true;
  const contents = fridgeContents(ctx);
  if (contents.length === FRIDGE_ITEM_IDS.length) {
    return "You open the FRIDGE. MILK, an EMPTY MILK JUG, LIMBURGER, ÉPOISSES, and MUNSTER greet you with four different levels of bad judgment.";
  }
  if (!contents.length) return "You open the FRIDGE. It is empty.";
  return `You open the FRIDGE. Inside: ${contents.join(", ")}.`;
}

function milkJugDescription(ctx) {
  return ctx.item("milkJug")?.filled
    ? "The MILK JUG sloshes with fresh STREAM water. It can be POURED ON FIRE or POURED OUT."
    : "A rinsed MILK JUG with a wide mouth and a handle built for hauling water. It is EMPTY.";
}

function pourOut(ctx, cmd) {
  if (!["out", "jugout", "milkjugout", "emptymilkjugout", "waterjugout"].includes(normalized(cmd.dobj))) {
    return null;
  }
  const jug = ctx.item("milkJug");
  if (!ctx.has("milkJug")) return null;
  if (!jug.filled) return "The JUG is already empty.";
  jug.filled = false;
  return "You tip out the JUG. It is EMPTY again." + ctx.awardUse(jug);
}

function drinkMilkFromFridge(ctx, cmd) {
  if (!["milk", "bottle"].includes(normalized(cmd.dobj)) || ctx.roomOf("milk") !== "fridge") {
    return null;
  }
  const milk = ctx.item("milk");
  ctx.moveItem("milk", "inventory");
  const pickup = ctx.awardPickup(milk);
  const result = ctx.world.items.milk.on.drink(ctx, cmd) + pickup;
  return cmd.verb === "use" ? `(get COLD MILK; drink COLD MILK)\n\n${result}` : result;
}

const rooms = {};
const items = {
  milk: { loc: "fridge" },
  fridge: {
    names: ["fridge", "refrigerator", "icebox"],
    loc: "kitchen",
    fixed: true,
    container: true,
    openable: true,
    open: false,
    capacity: 5,
    on: { open: openFridge },
  },
  milkJug: {
    names: ["empty milk jug", "milk jug", "jug", "water jug"],
    adjectives: ["empty", "milk", "water", "filled"],
    loc: "fridge",
    takeable: true,
    filled: false,
  },
  limburgerCheese: {
    names: ["limburger", "limburger cheese"],
    loc: "fridge",
    takeable: true,
    edible: true,
    on: {
      eat() {
        return "This is food for something with a larger digestive tract and worse manners. You leave the CHEESE intact.";
      },
    },
  },
  epoissesCheese: {
    names: ["époisses", "epoisses", "époisses cheese", "epoisses cheese"],
    loc: "fridge",
    takeable: true,
    edible: true,
    on: {
      eat() {
        return "This is food for something with a larger digestive tract and worse manners. You leave the CHEESE intact.";
      },
    },
  },
  munsterCheese: {
    names: ["munster", "munster cheese"],
    loc: "fridge",
    takeable: true,
    edible: true,
    on: {
      eat() {
        return "This is food for something with a larger digestive tract and worse manners. You leave the CHEESE intact.";
      },
    },
  },
};
const content = {
  rooms: {
    kitchen: {
      desc:
        "A cavernous scullery of cold ranges, rusted hooks, a dusty sill, and a pantry nook. " +
        "A heavy CELLAR DOOR is set in the floor. The DINING ROOM lies NORTH. " +
        "A rattling FRIDGE stands beside a MICROWAVE with a very small dial.",
      searchDesc:
        "One clean hook interrupts the rust; a patch of sill bears the imprint of a small box. " +
        "The CELLAR DOOR has a lift-ring, and the pantry baskets are almost empty. " +
        "The FRIDGE has a handle and no lock. The MICROWAVE has a dial marked only 1 · 100 · M · B · T.",
    },
  },
  items: {
    fridge: {
      roomDesc: "A rattling FRIDGE holds court beside the MICROWAVE.",
      desc: "A heavy FRIDGE with a loose handle and a motor that groans as if it knows what is inside.",
    },
    milkJug: {
      roomDesc: "An EMPTY MILK JUG waits in the FRIDGE.",
      desc: milkJugDescription,
    },
    limburgerCheese: {
      roomDesc: "A square of LIMBURGER sulks behind the milk.",
      desc: "LIMBURGER smells like a gym sock that died in a hot car; your eyes water through the fridge door.",
    },
    epoissesCheese: {
      roomDesc: "A box of ÉPOISSES threatens to leak through the shelf.",
      desc: "ÉPOISSES oozes out of its box like it is trying to escape, and smells like a sweaty armpit's armpit.",
    },
    munsterCheese: {
      roomDesc: "A wedge of MUNSTER makes the fridge light blink.",
      desc: "MUNSTER is so rank the fridge light flickers; it smells like a locker room hug from the whole football team.",
    },
  },
};
const shortNames = {
  items: {
    fridge: "fridge",
    milkJug: "jug",
    limburgerCheese: "limburger",
    epoissesCheese: "epoisses",
    munsterCheese: "munster",
  },
};
const progressAwards = {};
const hints = [
  {
    topics: ["fridge", "kitchen", "cheese", "cheeses", "limburger", "epoisses", "munster"],
    done: false,
    text: "That FRIDGE in the KITCHEN smells like a packed gym bag. TAKE three different stinky cheeses before you go caving.",
  },
];
const roomHooks = Object.fromEntries(ROOM_IDS.map((id) => [id, { pour: pourOut }]));
roomHooks.kitchen.take = (ctx, cmd) => {
  const fridge = ctx.item("fridge");
  const itemId = fridgeItemId(ctx, cmd.dobj);
  if (!itemId && normalized(cmd.dobj) !== "cheese") return null;
  if (!fridge?.open) return "The FRIDGE is closed. OPEN it first.";
  if (normalized(cmd.dobj) === "cheese") {
    return "Which CHEESE? Try LIMBURGER, ÉPOISSES, or MUNSTER.";
  }
  return null;
};
roomHooks.kitchen.drink = drinkMilkFromFridge;
roomHooks.kitchen.use = drinkMilkFromFridge;
const flavorPools = {};

export default { rooms, items, content, shortNames, progressAwards, hints, roomHooks, flavorPools };

// end fridge.js
