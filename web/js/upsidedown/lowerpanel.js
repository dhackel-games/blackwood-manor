// lowerpanel.js. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-09.002:acoven.

import { fillGemSlots, fillOrderText, isTakeGems, takeAllGems } from "../gem-slots.js?v=source";

const LOWER_GEMS = Object.freeze({
  magentaGem: { label: "MAGENTA GEM", slot: "middle" },
  yellowGem: { label: "YELLOW GEM", slot: "top" },
  cyanGem: { label: "CYAN GEM", slot: "bottom" },
});
const SLOT_ORDER = Object.freeze(["bottom", "middle", "top"]);
const LIFT_STOPS = Object.freeze(["greatOak", "treeFort", "greatOak", "below"]);

function normalized(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function panelTarget(value) {
  return ["lowerpanel", "panelbelow", "undercroftpanel", "panel", "slots", "slot"].includes(normalized(value));
}

function namedSlot(value) {
  return /\b(top|middle|bottom)(?:\s+slot)?\b/.exec(String(value || "").toLowerCase())?.[1] || null;
}

function gemId(ctx, phrase) {
  const wanted = normalized(phrase);
  return Object.keys(LOWER_GEMS).find((id) => {
    const item = ctx.world.items[id];
    return [id, ...(item?.names || [])].some((name) => normalized(name) === wanted);
  }) || null;
}

function lowerPanelSlots(ctx) {
  const stored = ctx.getFlag("oak:lowerPanelSlots");
  const slots = stored && typeof stored === "object" && !Array.isArray(stored)
    ? Object.fromEntries(SLOT_ORDER.map((slot) => [slot, stored[slot] || null]))
    : { top: "magentaGem", middle: null, bottom: "yellowGem" };
  const seated = new Set();
  for (const slot of SLOT_ORDER) {
    const id = slots[slot];
    if (!LOWER_GEMS[id] || ctx.roomOf(id) !== "lowerPanel" || seated.has(id)) slots[slot] = null;
    else seated.add(id);
  }
  ctx.setFlag("oak:lowerPanelSlots", slots);
  return slots;
}

function slotContents(ctx) {
  const slots = lowerPanelSlots(ctx);
  return ["top", "middle", "bottom"].map((slot) =>
    `${slot.toUpperCase()} SLOT: ${slots[slot] ? LOWER_GEMS[slots[slot]].label : "EMPTY"}`).join("\n");
}

function lowerSlotSummary(ctx) {
  const slots = lowerPanelSlots(ctx);
  const parts = ["top", "middle", "bottom"].map((slot) => slots[slot]
    ? `the ${slot.toUpperCase()} SLOT holds the ${LOWER_GEMS[slots[slot]].label}`
    : `the ${slot.toUpperCase()} SLOT is EMPTY`);
  return `In the LOWER PANEL, ${parts[0]}, ${parts[1]}, and ${parts[2]}.`;
}

function oakLevelsKnown(ctx) {
  return !!(ctx.getFlag("seen:greatOak") && ctx.getFlag("seen:below"));
}

function describeLowerPanel(ctx) {
  return "An iron LOWER PANEL is set among the roots beside the shaft. Three vertical slots face it.\n\n" +
    `${slotContents(ctx)}\n\n` +
    (ctx.getFlag("oak:lowerPanelAligned")
      ? "The slots hold fast; the lift now includes BELOW."
      : "The gems can be TAKEN and PLACED into a named SLOT.");
}

function takeLowerGem(ctx, cmd) {
  if (ctx.getFlag("oak:lowerPanelAligned")) {
    return "The aligned gems hold fast in their slots. The PLATFORM keeps moving.";
  }
  const gem = cmd.itemId ? ctx.item(cmd.itemId) : ctx.find(cmd.dobj);
  if (!gem || !LOWER_GEMS[gem.id] || gem.loc !== "lowerPanel") return null;
  if (ctx.inventoryLoad() >= ctx.inventoryCapacity()) {
    return "Your hands are full. You'll have to drop something before removing the gem.";
  }
  const slots = lowerPanelSlots(ctx);
  const slot = SLOT_ORDER.find((candidate) => slots[candidate] === gem.id);
  ctx.moveItem(gem.id, "inventory");
  ctx.setFlag("oak:lowerPanelSlots", { ...slots, [slot]: null });
  return `You lift the ${LOWER_GEMS[gem.id].label} from the ${slot.toUpperCase()} SLOT.`;
}

function lowerPanel(ctx) {
  return {
    codes: { cyanGem: ["cyan", "c"], magentaGem: ["magenta", "m"], yellowGem: ["yellow", "y"] },
    labels: Object.fromEntries(Object.entries(LOWER_GEMS).map(([id, gem]) => [id, gem.label])),
    alignedMessage: () => ctx.getFlag("oak:lowerPanelAligned")
      ? "The LOWER PANEL is already aligned. Its gems are seated for good."
      : null,
    seatedIds: () => {
      const slots = lowerPanelSlots(ctx);
      return ["top", "middle", "bottom"].map((slot) => slots[slot]).filter(Boolean);
    },
    take: (id) => takeLowerGem(ctx, { itemId: id }),
    put: (id, slot) => putLowerGem(ctx, { dobj: ctx.item(id).names[0], iobj: `${slot} slot` }),
  };
}

function lowerBulkFill(ctx, cmd) {
  const order = fillOrderText(cmd);
  return order === null ? null : fillGemSlots(ctx, lowerPanel(ctx), order);
}

function takeFromLowerPanel(ctx, cmd) {
  if (isTakeGems(cmd)) {
    const taken = takeAllGems(ctx, lowerPanel(ctx), cmd);
    if (taken) return taken;
  }
  if (cmd.dobj === "all" || cmd.dobj === "everything") return null;
  const slot = namedSlot(cmd.dobj);
  if (!slot || (!panelTarget(cmd.iobj) && !/slot/i.test(String(cmd.dobj)))) return null;
  if (ctx.getFlag("oak:lowerPanelAligned")) {
    return "The aligned gems hold fast in their slots. The PLATFORM keeps moving.";
  }
  const id = lowerPanelSlots(ctx)[slot];
  if (!id) return `The ${slot.toUpperCase()} SLOT is EMPTY.`;
  return takeLowerGem(ctx, { itemId: id, dobj: LOWER_GEMS[id].label });
}

function initializeLowerLift(ctx) {
  const current = ctx.roomOf("oakPlatform");
  if (current === "greatOak") {
    ctx.setFlag("oak:liftBeat", 0);
  } else if (current === "treeFort") {
    ctx.setFlag("oak:liftBeat", 1);
  } else {
    ctx.moveItem("oakPlatform", "below");
    ctx.setFlag("oak:liftBeat", 3);
  }
  ctx.setFlag("oakLiftGrace");
}

function putLowerGem(ctx, cmd) {
  const bulk = lowerBulkFill(ctx, cmd);
  if (bulk) return bulk;
  const explicitSlot = namedSlot(cmd.iobj);
  if (!explicitSlot && !panelTarget(cmd.iobj)) return null;
  if (cmd.dobj === "all" || cmd.dobj === "everything") {
    return "The LOWER PANEL must be solved deliberately. Move one GEM at a time into a named SLOT.";
  }
  if (ctx.getFlag("oak:lowerPanelAligned")) {
    return "The LOWER PANEL is already aligned. Its gems are seated for good.";
  }
  const id = gemId(ctx, cmd.dobj);
  if (!id) return "Only the CYAN, MAGENTA, and YELLOW GEMS fit the LOWER PANEL.";
  if (!ctx.has(id)) return "You need to carry that GEM before placing it.";

  const slots = lowerPanelSlots(ctx);
  const slot = explicitSlot || SLOT_ORDER.find((candidate) => slots[candidate] == null);
  if (!slot) return "All three slots are occupied. TAKE a gem out before changing the arrangement.";
  if (slots[slot]) {
    return `The ${slot.toUpperCase()} SLOT already holds the ${LOWER_GEMS[slots[slot]].label}. TAKE it out first.`;
  }

  const gem = ctx.item(id);
  ctx.moveItem(id, "lowerPanel");
  const next = { ...slots, [slot]: id };
  ctx.setFlag("oak:lowerPanelSlots", next);
  const use = LOWER_GEMS[id].slot === slot ? ctx.awardUse(gem) : "";
  const placement = `You place the ${LOWER_GEMS[id].label} into the ${slot.toUpperCase()} SLOT.`;
  const solved = SLOT_ORDER.every((candidate) =>
    next[candidate] && LOWER_GEMS[next[candidate]].slot === candidate);

  if (!solved) {
    if (SLOT_ORDER.every((candidate) => next[candidate])) {
      for (const seated of Object.values(next)) ctx.moveItem(seated, "below");
      ctx.setFlag("oak:lowerPanelSlots", { top: null, middle: null, bottom: null });
      return `${placement} The beams collide in a muddy flash. The LOWER PANEL spits all three gems onto the OAK UNDERCROFT floor.${use}`;
    }
    return `${placement} Light passes through it, but the separate beams have not joined.${use}`;
  }

  ctx.setFlag("oak:lowerPanelAligned");
  initializeLowerLift(ctx);
  const points = ctx.awardProgress("lowerPanelAligned");
  return `${placement} Three beams join into a white shaft. The roots shiver, ropes pull taut, and the PLATFORM now visits BELOW. (+${points})${use}`;
}

function stopName(roomId) {
  return ({ greatOak: "GROUND", treeFort: "ABOVE", below: "BELOW" })[roomId];
}

function liftBeat(ctx) {
  const stored = Number(ctx.getFlag("oak:liftBeat"));
  if (Number.isInteger(stored) && stored >= 0 && stored < LIFT_STOPS.length) return stored;
  return LIFT_STOPS.indexOf(ctx.roomOf("oakPlatform")) || 0;
}

function platformAtBelow(ctx, cmd) {
  if (!/\b(platform|lift)\b/i.test(cmd.dobj || "")) return null;
  if (!ctx.getFlag("oak:lowerPanelAligned")) {
    return "No PLATFORM stops BELOW yet. The LOWER PANEL has not been aligned.";
  }
  const current = ctx.roomOf("oakPlatform");
  if (current !== "below") return `The PLATFORM is at ${stopName(current)}, not here. WAIT for it.`;
  return null;
}

function lookUp(ctx, cmd) {
  if (!["up", "down"].includes(normalized(cmd.dobj))) return null;
  if (!ctx.getFlag("oak:lowerPanelAligned")) {
    return ctx.getFlag("oakLightAligned")
      ? "The PLATFORM travels between GROUND and ABOVE, but it does not stop BELOW. The LOWER PANEL has not been aligned."
      : "No PLATFORM is moving. The LOWER PANEL has not been aligned.";
  }
  const beat = liftBeat(ctx);
  const current = LIFT_STOPS[beat];
  const next = LIFT_STOPS[(beat + 1) % LIFT_STOPS.length];
  return `The PLATFORM is at ${stopName(current)}; its next stop is ${stopName(next)}.`;
}

function waitForPlatform(ctx) {
  if (!ctx.getFlag("oak:lowerPanelAligned")) return null;
  const beat = liftBeat(ctx);
  const stop = ctx.getFlag("oakLiftGrace")
    ? LIFT_STOPS[beat]
    : LIFT_STOPS[(beat + 1) % LIFT_STOPS.length];
  return `The PLATFORM reaches ${stopName(stop)}.`;
}

function leavePlatform(ctx, cmd) {
  if (cmd.dobj !== "out" || !ctx.getFlag("oakLiftRiding") || ctx.roomOf("oakPlatform") !== "below") {
    return null;
  }
  ctx.setFlag("oakLiftRiding", false);
  ctx.setFlag("oakLiftGrace");
  return "You step off into the OAK UNDERCROFT.";
}

function liftRoute(ctx, from, to) {
  if (!ctx.getFlag("oak:lowerPanelAligned")) return null;
  let beat = liftBeat(ctx);
  let platform = LIFT_STOPS[beat];
  let grace = !!ctx.getFlag("oakLiftGrace");
  const commands = [];
  const waitFor = (stop) => {
    for (let count = 0; platform !== stop && count <= LIFT_STOPS.length; count += 1) {
      commands.push("wait");
      if (grace) grace = false;
      else {
        beat = (beat + 1) % LIFT_STOPS.length;
        platform = LIFT_STOPS[beat];
      }
    }
    return platform === stop;
  };
  if (!waitFor(from)) return null;
  commands.push("in platform");
  grace = false;
  if (!waitFor(to)) return null;
  return [...commands, "out"];
}

const rooms = {};
const items = {
  lowerPanel: {
    names: ["lower panel", "panel below", "undercroft panel", "panel"],
    adjectives: ["lower", "undercroft", "iron"],
    loc: "below",
    fixed: true,
    scenery: true,
    container: true,
    open: true,
    capacity: 3,
    bulkTransfer: false,
    bulkTransferMsg: "The LOWER PANEL must be solved deliberately. Move one GEM at a time into a named SLOT.",
    on: {
      examine: describeLowerPanel,
      search: describeLowerPanel,
      put: putLowerGem,
    },
  },
  magentaGem: {
    names: ["magenta gem", "gem", "magenta", "magenta stone"],
    adjectives: ["magenta"],
    loc: "lowerPanel",
    takeable: true,
    on: { take: takeLowerGem },
  },
  yellowGem: {
    names: ["yellow gem", "gem", "yellow", "yellow stone"],
    adjectives: ["yellow"],
    loc: "lowerPanel",
    takeable: true,
    on: { take: takeLowerGem },
  },
};
const content = {
  rooms: {
    below: {
      desc(ctx) {
        const known = oakLevelsKnown(ctx);
        const shaft = ctx.getFlag("oak:lowerPanelAligned")
          ? (known
            ? "A PLATFORM now rises out of the shaft and stops here on its rounds to the GREAT OAK and its TREE FORT."
            : "A PLATFORM now rises out of the shaft and stops here on its rounds.")
          : "No PLATFORM stops here yet; its ropes disappear down the shaft.";
        const view = known
          ? "The OAK UNDERCROFT hangs among the exposed roots of the GREAT OAK, turned upside down in this world: its colossal STUMP looms overhead, and the shaft between the roots drops DOWN to the GREAT OAK and, past its crown, the TREE FORT. "
          : "The OAK UNDERCROFT is a chamber among enormous exposed roots fanning out from a colossal STUMP overhead, as if a giant oak had been planted upside down. A shaft drops DOWN between the roots to somewhere you can't quite make out. ";
        return view +
          `A LOWER PANEL with three vertical slots stands beside the shaft. ${lowerSlotSummary(ctx)} NORTH returns to the WAYLAMP CLEARING. ` +
          shaft;
      },
    },
  },
  items: {
    lowerPanel: {
      roomDesc: (ctx) => lowerSlotSummary(ctx),
      desc: describeLowerPanel,
    },
    magentaGem: {
      roomDesc: "A MAGENTA GEM lies among the roots.",
      desc: "A translucent MAGENTA GEM in a carefully beveled iron-slot shape. Tiny BM initials cross one flat edge.",
    },
    yellowGem: {
      roomDesc: "A YELLOW GEM lies among the roots.",
      desc: "A translucent YELLOW GEM cut into a bright prism for an iron slot. Tiny BM initials gleam at its base.",
    },
  },
};
const shortNames = {
  items: {
    lowerPanel: "lowerpanel",
    magentaGem: "magenta",
    yellowGem: "yellow",
  },
};
const progressAwards = {
  lowerPanelAligned: 10,
};
const hints = [
  (ctx) => ({
    topics: ["lowerpanel", "panelbelow", "undercroft", "lower"],
    done: !!ctx.getFlag("oak:lowerPanelAligned"),
    text: "The LOWER PANEL has three slots. TAKE a gem to remove it, PUT one IN a named SLOT, and try again if a full arrangement spits them out.",
  }),
  (ctx) => ({
    topics: ["lift", "platform", "below"],
    done: false,
    text: "Once the LOWER PANEL answers, WAIT for the PLATFORM at BELOW, BOARD it, and OUT at GROUND or ABOVE. You can ride back down.",
  }),
];
const roomHooks = {
  below: {
    put: putLowerGem,
    fill: lowerBulkFill,
    take: takeFromLowerPanel,
    enter: platformAtBelow,
    climb: platformAtBelow,
    examine: lookUp,
    wait: waitForPlatform,
    go: leavePlatform,
  },
};
const flavorPools = {};
const navigationLinks = [
  ...["greatOak", "treeFort", "below"].flatMap((from) =>
    ["greatOak", "treeFort", "below"]
      .filter((to) => to !== from)
      .map((to) => ({
        from,
        to,
        commands: (ctx) => liftRoute(ctx, from, to),
        when: (ctx) => !!ctx.getFlag("oak:lowerPanelAligned"),
      }))),
];

export default {
  rooms, items, content, shortNames, progressAwards, hints, roomHooks, flavorPools, navigationLinks,
};

// end lowerpanel.js
