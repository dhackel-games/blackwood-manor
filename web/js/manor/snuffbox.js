// snuffbox.js. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-09.001:acoven.

function takeBustNose(ctx) {
  if (ctx.getFlag("manor:snuffboxFound")) return "You already picked that nostril clean.";
  if (ctx.inventoryLoad() >= ctx.inventoryCapacity()) {
    return "Your hands are full. Make room before PICKing the NOSE.";
  }
  ctx.setFlag("manor:snuffboxFound");
  ctx.moveItem("snuffbox", "inventory");
  const points = ctx.awardProgress("snuffboxFound");
  return "You PICK the bust's LEFT NOSTRIL and pull out a SNUFFBOX. Great-Grandpa looks mildly impressed." +
    (points ? ` (+${points})` : "");
}

function describeBust(ctx) {
  return ctx.getFlag("manor:snuffboxFound")
    ? "The MARBLE BUST's left nostril is empty. Great-Grandpa still looks smug."
    : "Great-Grandpa Blackwood has the nose of a man who considered breathing a competitive sport. A silver glint peeks up his LEFT NOSTRIL.";
}

function describeSnuffbox(ctx) {
  const remaining = ctx.item("snuffbox").highSource.doses;
  if (!remaining) {
    return "An EMPTY silver SNUFFBOX stamped BM. Its lid still bears Great-Grandpa's nose; the box remains an heirloom.";
  }
  return `A silver SNUFFBOX stamped BM, with ${remaining} fragrant pinch${remaining === 1 ? "" : "es"} left inside. Its lid bears a nose large enough to have its own portrait.`;
}

function useSnuffbox(ctx, cmd) {
  const snuffbox = ctx.item("snuffbox");
  if (snuffbox.highSource.doses > 0) {
    ctx.setFlag("manor:snuffPinches", (Number(ctx.getFlag("manor:snuffPinches")) || 0) + 1);
  }
  return ctx.world.useHighSource(ctx, snuffbox, cmd);
}

const rooms = {};
const items = {
  marbleBust: {
    names: ["marble bust", "bust", "grandpa", "great-grandpa"],
    adjectives: ["marble"],
    loc: "landing",
    fixed: true,
    scenery: true,
    on: { examine: describeBust, search: describeBust },
  },
  bustNose: {
    names: ["nose", "bust's nose", "left nostril", "nostril"],
    adjectives: ["bust's", "left", "marble"],
    loc: "landing",
    fixed: true,
    scenery: true,
    on: { take: takeBustNose },
  },
  snuffbox: {
    names: ["snuffbox", "snuff box", "silver snuffbox"],
    adjectives: ["silver"],
    loc: null,
    takeable: true,
    treasure: true,
    points: 10,
    highSource: {
      opening: "You sniff a pinch from the SNUFFBOX. Your nose fires a sneeze large enough to rattle a portrait, and the world answers by going sideways.",
      turns: 6,
      doses: 3,
      whenEmpty: "keep",
      actions: "smell,use",
      emptyMessage: "The SNUFFBOX is EMPTY. It is still an heirloom, but there is nothing left to sniff.",
    },
    on: { examine: describeSnuffbox, smell: useSnuffbox, use: useSnuffbox },
  },
};
function landingLadder(ctx) {
  return ctx.getFlag("ladderDown")
    ? "The lowered ATTIC ladder groans under its own weight. Climbing it while heavily laden would be suicidal."
    : "The CORD is connected to the ceiling trap-door and has a clean, hand-width patch near its end. Pulling it should lower something.";
}

const content = {
  rooms: {
    landing: {
      desc:
        "A long UPSTAIRS LANDING overlooks the ROYAL HALL below. Doors open WEST to the NURSERY, " +
        "EAST to the GRAND BEDROOM, NORTH to the HALL BEDROOM, and SOUTH to the STUDY. A frayed CORD dangles from a " +
        "trap-door in the ceiling. The stairs go DOWN. A MARBLE BUST of Great-Grandpa Blackwood stands beside the stairs, his heroic nose tilted into the light.",
      searchDesc(ctx) {
        const ladder = landingLadder(ctx);
        return ctx.getFlag("manor:snuffboxFound")
          ? ladder
          : `${ladder} The MARBLE BUST's left nostril holds a small silver glint.`;
      },
      highDesc(ctx) {
        return ctx.getFlag("manor:snuffboxFound")
          ? landingLadder(ctx)
          : "Hidden sight picks out a silver box lodged in the bust's left nostril. You can PICK NOSE to retrieve it.";
      },
    },
  },
  items: {
    marbleBust: {
      roomDesc: "A MARBLE BUST guards the stairs with a spectacular nose.",
      desc: (ctx) => "Great-Grandpa Blackwood has the nose of a man who considered breathing a competitive sport." +
        (ctx.getFlag("manor:snuffboxFound") ? "" : " A silver glint peeks up his LEFT NOSTRIL."),
    },
    bustNose: {
      roomDesc: "Great-Grandpa's marble NOSE leads the way.",
      desc: (ctx) => ctx.getFlag("manor:snuffboxFound")
        ? "Great-Grandpa's marble NOSE, as heroic as ever."
        : "The LEFT NOSTRIL of the bust shelters a silver glint you could reach by PICKing.",
    },
    snuffbox: {
      roomDesc: "A silver SNUFFBOX rests here, its lid decorated with a very smug nose.",
      desc: "A silver SNUFFBOX stamped BM, with 3 fragrant pinches left inside. Its lid bears a nose large enough to have its own portrait.",
    },
  },
};
const shortNames = { items: { marbleBust: "bust", bustNose: "nose", snuffbox: "snuffbox" } };
const progressAwards = { snuffboxFound: 5 };
const hints = [
  (ctx) => ({
    topics: ["bust", "grandpa", "landing", "nostril", "nose"],
    done: !!ctx.getFlag("manor:snuffboxFound"),
    text: "EXAMINE the MARBLE BUST on the LANDING. Great-Grandpa's LEFT NOSTRIL has a silver glint.",
  }),
  (ctx) => ({
    topics: ["bust", "nostril", "nose", "snuffbox"],
    done: !!ctx.getFlag("manor:snuffboxFound"),
    text: "PICK NOSE or PICK BUST'S NOSE to get the SNUFFBOX.",
  }),
  (ctx) => ({
    topics: ["snuffbox", "snuff", "pinch", "sniff"],
    done: (Number(ctx.getFlag("manor:snuffPinches")) || 0) >= 3,
    text: "SNIFF the box for a shared high. It has three pinches and remains an heirloom when EMPTY.",
  }),
];
const roomHooks = {};
const flavorPools = {};

export default { rooms, items, content, shortNames, progressAwards, hints, roomHooks, flavorPools };

// end snuffbox.js
