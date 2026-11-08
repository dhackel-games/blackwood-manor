// corkscrew.js. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.001:acoven.

const WINE_OPENING =
  "You take a sip of WINE. It tastes like old plums and a badly kept promise; then the room decides it has elbows.";
const CLOSED_BOTTLE_DESC =
  "A dusty WINE BOTTLE with a broken cork lodged inside its neck. It cannot be opened without a CORKSCREW. Four sips remain.";
const BOTTLE_ROOM_DESC = "One dusty WINE BOTTLE with a broken cork waits on the rack.";

function normalized(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isWineBottle(item) {
  return item?.id === "wineBottle" || item?.templateId === "wineBottle";
}

function bottleSerial(item) {
  return Number(item?.serial) || (item?.id === "wineBottle" ? 1 : Number(item?.id?.split(":")[1])) || 0;
}

function wineBottles(ctx, location) {
  return ctx.itemsIn(location).filter(isWineBottle).sort((a, b) => bottleSerial(a) - bottleSerial(b));
}

function selectedWineBottle(ctx, phrase, { open } = {}) {
  const bottles = wineBottles(ctx, "inventory");
  const target = normalized(phrase);
  const explicit = bottles.find((bottle) => normalized(bottle.shortName) === target);
  if (explicit) return explicit;
  if (!["wine", "winebottle", "dustywinebottle", "vintage", "bottle"].includes(target)) return null;
  return bottles.find((bottle) => open === undefined || bottle.open === open) || null;
}

function bottleDescription(bottle) {
  const remaining = bottle.highSource?.doses ?? 0;
  return `An opened WINE BOTTLE, dusty and sharp-smelling, with ${remaining} sip${remaining === 1 ? "" : "s"} left.`;
}

function hasCorkscrew(ctx, cmd) {
  const corkscrew = cmd.iobj && ctx.find(cmd.iobj, ctx.inventory());
  return corkscrew?.id === "corkscrew";
}

function nextWineBottle(ctx) {
  const currentSerial = Math.max(1, Number(ctx.getFlag("manor:wineSerial")) || 1);
  const serial = currentSerial + 1;
  const id = `wineBottle:${serial}`;
  ctx.setFlag("manor:wineSerial", serial);
  ctx.state.items[id] = {
    id,
    templateId: "wineBottle",
    serial,
    shortName: `winebtl${serial}`,
    names: ["wine bottle", "wine", "dusty wine bottle", "vintage"],
    adjectives: ["wine", "dusty", "vintage"],
    loc: "wineCellar",
    takeable: true,
    progressFlag: "progressItem:wineBottle",
    useFlag: "useItem:wineBottle",
    roomDesc: BOTTLE_ROOM_DESC,
    desc: CLOSED_BOTTLE_DESC,
    open: false,
    highSource: {
      opening: WINE_OPENING,
      turns: 10,
      doses: 4,
      whenEmpty: "destroy",
      actions: ["drink"],
      emptyMessage: "You need an opened WINE BOTTLE to drink.",
    },
  };
}

function takeWine(ctx, cmd, suppliedBottle) {
  const bottle = suppliedBottle || ctx.find(cmd.dobj);
  if (!isWineBottle(bottle)) return null;
  if (ctx.has(bottle.id)) return "You already have that.";
  if (ctx.inventoryLoad() >= Math.max(ctx.inventoryCapacity(), bottle.carryCapacity || 0)) {
    return "Your hands are full. You'll have to drop something first.";
  }
  const offered = bottle.loc === "wineCellar";
  ctx.moveItem(bottle.id, "inventory");
  const pickup = ctx.awardPickup(bottle);
  if (!offered) return "Taken." + pickup;
  nextWineBottle(ctx);
  return "Taken." + pickup + "\n\nAnother dusty WINE BOTTLE waits on the rack, cork already broken.";
}

function takeCellarBottle(ctx, cmd) {
  if (normalized(cmd.dobj) !== "bottle") return null;
  const offered = wineBottles(ctx, "wineCellar")[0];
  if (!offered) return null;
  if (ctx.roomOf("milk") === "wineCellar") {
    return "Which BOTTLE? Try WINE BOTTLE or MILK.";
  }
  return takeWine(ctx, cmd, offered);
}

function openWineBottle(ctx, cmd) {
  const bottle = selectedWineBottle(ctx, cmd.dobj);
  if (!bottle) return "You need a WINE BOTTLE to open.";
  if (!hasCorkscrew(ctx, cmd)) {
    return "The WINE BOTTLE has a broken cork. Only a CORKSCREW can open it.";
  }
  if (bottle.open) return "The WINE BOTTLE is already open.";
  bottle.open = true;
  bottle.desc = bottleDescription(bottle);
  return "You twist the CORKSCREW into the broken cork and pull. The WINE BOTTLE opens with a tiny, scandalized pop." +
    ctx.awardUse(ctx.item("corkscrew"));
}

function openWithCorkscrew(ctx, cmd) {
  if (!["bottle", "wine", "winebottle", "dustywinebottle", "vintage"].includes(normalized(cmd.dobj))) {
    return null;
  }
  return openWineBottle(ctx, cmd);
}

function useCorkscrew(ctx) {
  if (!selectedWineBottle(ctx, "wine", { open: false })) {
    return "It needs a WINE BOTTLE with a broken cork.";
  }
  return "OPEN BOTTLE WITH CORKSCREW will do the job.";
}

function drinkWine(ctx, cmd) {
  const bottle = selectedWineBottle(ctx, cmd.dobj, { open: true })
    || selectedWineBottle(ctx, cmd.dobj);
  if (!bottle) return "You need an opened WINE BOTTLE to drink.";
  if (!bottle.open) return "The WINE BOTTLE is still corked. OPEN BOTTLE WITH CORKSCREW.";
  const sips = { ...(ctx.getFlag("manor:wineSips") || {}) };
  const consumed = (Number(sips[bottle.id]) || 0) + 1;
  sips[bottle.id] = consumed;
  ctx.setFlag("manor:wineSips", sips);
  bottle.highSource.doses = Math.max(0, 4 - (consumed - 1));
  const result = ctx.world.useHighSource(ctx, bottle, cmd);
  if (consumed === 4) {
    return result + "\n\nYou drain the last sip. The empty BOTTLE crumbles into harmless green dust.";
  }
  bottle.desc = bottleDescription(bottle);
  return result;
}

function cellarDescription(ctx) {
  const decanter = ctx.roomOf("crystalDecanter") === "wineCellar"
    ? "the CRYSTAL DECANTER"
    : "the decanter's dust outline";
  const corkscrew = ctx.roomOf("corkscrew") === "wineCellar";
  const bottle = wineBottles(ctx, "wineCellar")[0];
  const addition = corkscrew
    ? `A CORKSCREW lies beside ${decanter}; ${bottle ? "one dusty WINE BOTTLE with a broken cork waits on the rack." : "the rack is empty."}`
    : `${decanter === "the CRYSTAL DECANTER" ? "The CRYSTAL DECANTER" : "The decanter's dust outline"} stands beside an empty corkscrew mark; ${bottle ? "one dusty WINE BOTTLE with a broken cork waits on the rack." : "the rack is empty."}`;
  return "Racks of burst and blackened bottles line the dripping WINE CELLAR. Stone steps climb UP " +
    "to the KITCHEN; an arch leads SOUTH, deeper, into a cold that raises the hairs on your neck. " + addition;
}

function cellarSearchDescription(ctx) {
  const decanter = ctx.roomOf("crystalDecanter") === "wineCellar"
    ? "the CRYSTAL DECANTER"
    : "the decanter's dust outline";
  const corkscrew = ctx.roomOf("corkscrew") === "wineCellar";
  const addition = corkscrew
    ? `The CORKSCREW rests beside ${decanter}. The WINE BOTTLE has a broken cork that fingers cannot remove.`
    : `The space beside ${decanter} is empty; a WINE BOTTLE waits on the rack with a broken cork.`;
  return "The shattered racks show the outline of a bottle that once sat there. Frost rims the SOUTHERN arch " +
    "in the shape of grasping fingers; crossing it without the TALISMAN feels terminal. " + addition;
}

const rooms = {};
const items = {
  corkscrew: {
    names: ["corkscrew", "wine key", "opener"],
    adjectives: ["plain", "iron", "wine"],
    loc: "wineCellar",
    takeable: true,
    treasure: true,
    points: 5,
    on: { use: useCorkscrew, open: openWithCorkscrew },
  },
  wineBottle: {
    names: ["wine bottle", "wine", "dusty wine bottle", "vintage"],
    adjectives: ["wine", "dusty", "vintage"],
    loc: "wineCellar",
    takeable: true,
    serial: 1,
    shortName: "winebtl",
    open: false,
    progressFlag: "progressItem:wineBottle",
    useFlag: "useItem:wineBottle",
    highSource: {
      opening: WINE_OPENING,
      turns: 10,
      doses: 4,
      whenEmpty: "destroy",
      actions: ["drink"],
      emptyMessage: "You need an opened WINE BOTTLE to drink.",
    },
    on: { take: takeWine, open: openWineBottle, drink: drinkWine },
  },
};
const content = {
  rooms: {
    wineCellar: {
      desc: cellarDescription,
      searchDesc: cellarSearchDescription,
    },
  },
  items: {
    corkscrew: {
      roomDesc: "A CORKSCREW rests beside the CRYSTAL DECANTER.",
      desc: "A plain iron CORKSCREW with a BM stamped on the handle. Its spiral is sharp enough for a stubborn broken cork.",
    },
    wineBottle: {
      roomDesc: BOTTLE_ROOM_DESC,
      desc: CLOSED_BOTTLE_DESC,
    },
  },
};
const shortNames = {
  items: {
    corkscrew: "corkscrew",
    wineBottle: "winebtl",
  },
};
const progressAwards = {};
const hints = [
  {
    topics: ["corkscrew", "opener", "winekey"],
    done: false,
    text: "A CORKSCREW lies beside the CRYSTAL DECANTER in the WINE CELLAR. TAKE it before trying the WINE BOTTLE.",
  },
  {
    topics: ["wine", "winebottle", "bottle"],
    done: false,
    text: "OPEN BOTTLE WITH CORKSCREW, then DRINK WINE for a shared high. Each bottle has four sips; the cellar refills spent bottles.",
  },
  {
    topics: ["tradeoff", "reliquary"],
    done: false,
    text: "If you seal the CORKSCREW in the RELIQUARY, you cannot open a new WINE BOTTLE until you retrieve it.",
  },
];
const roomHooks = {
  wineCellar: { take: takeCellarBottle },
};
const flavorPools = {};

export default { rooms, items, content, shortNames, progressAwards, hints, roomHooks, flavorPools };

// end corkscrew.js
