// diamond.js. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.001:acoven.

const DIAL_SETTINGS = ["1", "100", "M", "B", "T"];
const COAL_TARGETS = new Set(["coal", "coallump", "lump", "coalstack", "stack"]);
const DIAMOND_TARGETS = new Set(["diamond", "blackwooddiamond", "gemstone"]);

function normalized(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function coalExists(ctx) {
  return ctx.roomOf("coalLump") != null;
}

function parlorDescription(ctx) {
  const coal = coalExists(ctx)
    ? "A stack of COAL sits in the cold fireplace, but no second lump is loose."
    : "A stack of COAL sits in the cold fireplace, with one loose lump near the grate.";
  return "A mouldering PARLOR of draped furniture. Above the cold fireplace hangs a huge, " +
    "grim PROFILE PAINTING of BARON MUNCHHAUSEN THE THIRD, whose painted eyes seem to track you. An archway " +
    "returns WEST to the ROYAL HALL; a low door leads SOUTH to the LIBRARY. " + coal;
}

function parlorSearchDescription(ctx) {
  const safe = ctx.getFlag("safeRevealed")
    ? "Behind the swung-aside PROFILE PAINTING, the iron SAFE's combination dial shows recent fingerprints."
    : "The PROFILE PAINTING frame stands proud of the wall. One side has hinges; the other has fingerprints where a hand might push.";
  return safe + " The cold fireplace has a reachable COAL stack, but only one loose lump at a time.";
}

function parlorHighDescription(ctx) {
  return "The wall behind the PROFILE PAINTING shimmers around the hard rectangular outline of an IRON SAFE. " +
    parlorSearchDescription(ctx);
}

function microwaveDescription(ctx) {
  const warning = ctx.getFlag("manor:microwaveStarted")
    ? ""
    : " A wrong setting could eat the COAL; the fireplace in the PARLOR may have another lump.";
  return "A MICROWAVE with a small dial marked 1 · 100 · M · B · T. Its door has a soot-dark window." + warning;
}

function takeCoal(ctx) {
  if (coalExists(ctx)) {
    return "One lump at a time. Use or recover the COAL you already took before taking another.";
  }
  const coal = ctx.item("coalLump");
  ctx.moveItem("coalLump", "inventory");
  return "You pry one lump of COAL from the cold fireplace." + ctx.awardPickup(coal);
}

function openMicrowave(ctx) {
  const microwave = ctx.item("microwave");
  if (microwave.open) return "The MICROWAVE is already open.";
  microwave.open = true;
  return "The MICROWAVE door drops open.";
}

function putInMicrowave(ctx, cmd) {
  const carried = ctx.find(cmd.dobj, ctx.inventory());
  if (!carried || carried.id !== "coalLump") {
    return "The MICROWAVE has room for one lump of COAL, not that.";
  }
  if (ctx.roomOf("coalLump") === "microwave") return "The MICROWAVE already holds COAL.";
  ctx.item("microwave").open = true;
  ctx.moveItem("coalLump", "microwave");
  return "You put the COAL in the MICROWAVE.";
}

function setMicrowaveDial(ctx, cmd) {
  const raw = String(cmd.setting || cmd.iobj || "").trim();
  if (!raw) {
    return cmd.verb === "set"
      ? "Set the DIAL to which mark?"
      : "The DIAL needs a setting.";
  }
  const setting = raw.toUpperCase();
  if (!DIAL_SETTINGS.includes(setting)) {
    return "The DIAL has only five marks: 1 · 100 · M · B · T.";
  }
  ctx.item("microwaveDial").setting = setting;
  return `The MICROWAVE DIAL clicks to ${setting}.`;
}

function spinMicrowaveDial(ctx) {
  const dial = ctx.item("microwaveDial");
  const current = DIAL_SETTINGS.indexOf(dial.setting || "1");
  const setting = DIAL_SETTINGS[(current + 1) % DIAL_SETTINGS.length];
  dial.setting = setting;
  return `The MICROWAVE DIAL clicks to ${setting}.`;
}

function turnMicrowaveDial(ctx, cmd) {
  return cmd.dialAction === "spin" ? spinMicrowaveDial(ctx) : setMicrowaveDial(ctx, cmd);
}

function dialMicrowave(ctx, cmd) {
  return setMicrowaveDial(ctx, cmd);
}

function startMicrowave(ctx) {
  const microwave = ctx.item("microwave");
  const coal = ctx.item("coalLump");
  ctx.setFlag("manor:microwaveStarted");
  if (ctx.getFlag("manor:diamondMade")) {
    return "The MICROWAVE has made its one DIAMOND. Another lump would only waste your time.";
  }
  if (coal.loc !== "microwave") {
    return "The MICROWAVE has nothing to cook. PUT a lump of COAL inside.";
  }
  microwave.open = false;
  const setting = ctx.item("microwaveDial").setting || "1";
  if (setting === "1") {
    return "The MICROWAVE hums, stops, and leaves the same lump of COAL unchanged inside." +
      ctx.awardUse(coal);
  }
  if (setting === "100") {
    return "The MICROWAVE rattles for a while, stops, and leaves the same lump of COAL unchanged inside." +
      ctx.awardUse(coal);
  }
  ctx.destroy("coalLump");
  microwave.open = true;
  if (setting === "M") {
    return "The MICROWAVE opens on a smear of graphite. Your lump of COAL is gone; fetch another from the PARLOR." +
      ctx.awardUse(coal);
  }
  if (setting === "T") {
    return "The MICROWAVE opens on a sad dusting of powder. Your lump of COAL is gone; fetch another from the PARLOR." +
      ctx.awardUse(coal);
  }
  ctx.setFlag("manor:diamondMade");
  ctx.moveItem("blackwoodDiamond", "microwave");
  const points = ctx.awardProgress("diamondMade");
  return "The MICROWAVE chimes. Where the COAL sat, a BLACKWOOD DIAMOND winks at you from the open tray." +
    (points ? ` (+${points})` : "") + ctx.awardUse(coal);
}

function useDiamond(ctx) {
  return "You turn the DIAMOND under the light and briefly give your own reflection a monocle." +
    ctx.awardUse(ctx.item("blackwoodDiamond"));
}

const rooms = {};
const items = {
  coalStack: {
    names: ["coal", "coal stack", "stack", "fireplace", "grate", "lump"],
    loc: "parlor",
    fixed: true,
    scenery: true,
    on: { take: takeCoal },
  },
  coalLump: {
    names: ["coal", "coal lump", "lump"],
    loc: null,
    takeable: true,
  },
  microwave: {
    names: ["microwave", "oven"],
    loc: "kitchen",
    fixed: true,
    container: true,
    openable: true,
    open: false,
    capacity: 1,
    on: {
      open: openMicrowave,
      put: putInMicrowave,
      start: startMicrowave,
    },
  },
  microwaveDial: {
    names: ["microwave dial", "dial", "setting knob", "knob"],
    adjectives: ["microwave", "setting"],
    loc: "kitchen",
    fixed: true,
    scenery: true,
    dialable: true,
    setting: "1",
    on: {
      dial: dialMicrowave,
      set: setMicrowaveDial,
      turn: turnMicrowaveDial,
    },
  },
  blackwoodDiamond: {
    names: ["blackwood diamond", "diamond", "gemstone"],
    adjectives: ["blackwood"],
    loc: null,
    takeable: true,
    pendingHeirloom: true,
    points: 15,
    on: { use: useDiamond },
  },
};
const content = {
  rooms: {
    parlor: {
      desc: parlorDescription,
      searchDesc: parlorSearchDescription,
      highDesc: parlorHighDescription,
    },
  },
  items: {
    coalStack: {
      roomDesc: "A stack of COAL rests in the cold fireplace.",
      desc: "A stack of black COAL sits behind the cold grate. One loose lump can be TAKEN while no earlier lump remains unused.",
    },
    coalLump: {
      roomDesc: "A lump of COAL rests here.",
      desc: "One soot-black lump of COAL, small enough to fit in the MICROWAVE.",
    },
    microwave: {
      roomDesc: "The MICROWAVE waits beside the FRIDGE.",
      desc: microwaveDescription,
    },
    microwaveDial: {
      roomDesc: "Its small DIAL reads 1 · 100 · M · B · T.",
      desc: "The DIAL reads 1 · 100 · M · B · T.",
    },
    blackwoodDiamond: {
      roomDesc: "The BLACKWOOD DIAMOND glitters in the MICROWAVE tray.",
      desc: "A sharp, cold BLACKWOOD DIAMOND cut into a many-faced stone. A tiny BM is engraved beneath one facet.",
    },
  },
};
const shortNames = {
  items: {
    coalStack: "coalstack",
    coalLump: "coal",
    microwave: "microwave",
    microwaveDial: "mdial",
    blackwoodDiamond: "diamond",
  },
};
const progressAwards = {
  diamondMade: { points: 5, maximumScore: false },
};
const hints = [
  {
    topics: ["coal", "lump", "fireplace", "parlor"],
    done: false,
    text: "The PARLOR has COAL in its cold fireplace. You may carry only one lump at a time.",
  },
  {
    topics: ["microwave", "oven", "dial", "kitchen"],
    done: false,
    text: "PUT COAL IN MICROWAVE, SET its DIAL to one of the printed marks, then START. Some settings leave the lump; others consume it.",
  },
  {
    topics: ["diamond", "gemstone"],
    done: false,
    text: "If a setting eats your COAL without making a DIAMOND, go back to the PARLOR for another lump.",
  },
];
const roomHooks = {
  parlor: {
    take(ctx, cmd) {
      return COAL_TARGETS.has(normalized(cmd.dobj)) ? takeCoal(ctx) : null;
    },
  },
  kitchen: {
    start: startMicrowave,
    take(ctx, cmd) {
      return DIAMOND_TARGETS.has(normalized(cmd.dobj)) && !ctx.getFlag("manor:diamondMade")
        ? "There is no DIAMOND in the MICROWAVE yet."
        : null;
    },
  },
};
const flavorPools = {};

export default { rooms, items, content, shortNames, progressAwards, hints, roomHooks, flavorPools };

// end diamond.js
