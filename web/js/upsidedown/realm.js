// realm.js. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-09.002:acoven.

function enterRealm(ctx) {
  const locker = ctx.item("minersLocker");
  if (!locker?.open) return "The MINERS' LOCKER is shut. OPEN it first.";
  ctx.state.room = "waylampClearing";
  const points = ctx.awardProgress("realmDiscovered");
  const arrival = points
    ? `The world folds around the hinge; you step into THE UPSIDE DOWN. (+${points})`
    : "You duck through the locker into THE UPSIDE DOWN.";
  return `${arrival}\n\n${ctx.describeRoom()}`;
}

function leaveRealm(ctx) {
  const locker = ctx.item("minersLocker");
  if (locker) locker.open = true;
  ctx.state.room = "mineGallery";
  return "You climb out through the MINERS' LOCKER into the MINING GALLERY.\n\n" +
    ctx.describeRoom();
}

function discoverRealmByFlight(ctx) {
  const points = ctx.awardProgress("realmDiscovered");
  return points ? `You arrive in THE UPSIDE DOWN. (+${points})` : null;
}

const realmRoom = (exits) => ({
  realm: true,
  randomTeleport: false,
  exits,
  onEnter: discoverRealmByFlight,
});

const rooms = {
  mineGallery: {
    interceptImplicitNavigation: true,
  },
  waylampClearing: {
    ...realmRoom({
      north: "grotto",
      east: "avClubDen",
      west: "shack",
      south: "below",
    }),
    aliases: ["waylamp", "lamp clearing", "upside down clearing"],
    extraDirections: ["out"],
    on: {
      go(ctx, cmd) {
        return cmd.dobj === "out" ? leaveRealm(ctx) : null;
      },
    },
  },
  grotto: {
    ...realmRoom({ south: "waylampClearing" }),
    aliases: ["livarot grotto", "livarot", "cheese grotto", "grotto"],
  },
  avClubDen: {
    ...realmRoom({ west: "waylampClearing", north: "planetarium" }),
    aliases: ["av club", "av den", "radio den"],
  },
  planetarium: {
    ...realmRoom({ south: "avClubDen", east: "mapRoom" }),
    aliases: ["dome"],
  },
  mapRoom: {
    ...realmRoom({ west: "planetarium" }),
    aliases: ["map room", "chart room"],
  },
  shack: {
    ...realmRoom({ east: "waylampClearing" }),
    aliases: ["letter shack", "alphabet shack"],
  },
  below: {
    ...realmRoom({ north: "waylampClearing" }),
    aliases: ["under the oak", "below", "oak undercroft"],
  },
};

const items = {
  minersLocker: {
    names: ["miners' locker", "miners locker", "locker", "wardrobe"],
    loc: "mineGallery",
    fixed: true,
    scenery: true,
    openable: true,
    open: false,
    enterTo: "waylampClearing",
    on: {
      open(ctx) {
        const locker = ctx.item("minersLocker");
        const points = ctx.awardProgress("lockerFound");
        if (locker.open) return "The LOCKER is already open." + (points ? ` (+${points})` : "");
        locker.open = true;
        return "The LOCKER swings open onto a lamplit forest instead of its own back wall. You can go IN." +
          (points ? ` (+${points})` : "");
      },
      enter: enterRealm,
    },
  },
};

const content = {
  rooms: {
    mineGallery: {
      desc:
        "A timber-braced MINING GALLERY follows a rusted rail line. A dented MINERS' LOCKER stands against one timber support. " +
        "The DRAGON CAVE ANTECHAMBER is WEST; a ladder descends DOWN into a DEEP MINING SHAFT.",
      searchDesc:
        "One timber support is worn smooth where mining gear once hung. The rails and fresher TROLL footprints both continue DOWN. " +
        "The LOCKER has a real handle, a hinge, and a draft that smells of wet trees.",
    },
    waylampClearing: {
      name: "Waylamp Clearing",
      desc:
        "A lonely WAYLAMP shines beside a wood that appears to have failed an inspection of reality. An UPSIDE-DOWN CAMPFIRE burns with its flames pointing into the dirt, and a STREAM gurgles beside it. The MINERS' LOCKER stands behind you. Paths lead NORTH to a cheesy cave, EAST to a club den, WEST to a rickety SHACK, and SOUTH down among enormous exposed roots.",
      searchDesc:
        "Heat keeps you back from a hard shape in the ashes. The STREAM is close enough to fill a JUG; you could also risk your shoes on that fire.",
    },
    grotto: {
      name: "Livarot Grotto",
      desc:
        "The LIVAROT GROTTO smells like a locker room built inside another locker room. DEMOGORGONZOLA squats beneath a shelf of stalactites, its closed face puckered like a flower bud. The only path leads SOUTH to the WAYLAMP.",
      searchDesc:
        "The creature sniffs at your pockets. Its jaws snap on a falling pebble; a stain on the stone suggests anyone poking it will be gulped whole. It looks hungry for something even smellier than itself.",
    },
    avClubDen: {
      name: "AV Club Den",
      desc:
        "A dusty AV CLUB DEN has three broken folding chairs, a heroic tangle of extension cords, and a CABINET RADIO the size of a disappointed refrigerator. A card taped to it reads: NAME THAT TUNE! THREE RIGHT IN A ROW OPENS THE CABINET. WEST leads to the WAYLAMP; NORTH leads to a domed PLANETARIUM.",
      searchDesc: (ctx) => ctx.getFlag("realm:radioWon")
        ? "The CABINET RADIO's door hangs open."
        : "The CABINET RADIO has five numbered answer buttons and a locked door. Something rattles inside the cabinet when you knock.",
    },
    planetarium: {
      name: "Planetarium",
      desc:
        "A PLANETARIUM dome arches over a single brass PROJECTOR with a numbered DIAL and a bulb SWITCH. SOUTH returns to the AV CLUB DEN; EAST opens into a MAP ROOM.",
      searchDesc:
        "The PROJECTOR's dial is numbered 1 to 5.",
    },
    mapRoom: {
      name: "Map Room",
      desc:
        "A tiny MAP ROOM is wallpapered in star charts. A STELLAR MAP rests on a lectern. WEST returns to the PLANETARIUM.",
      searchDesc:
        "The STELLAR MAP lists five projections by number.",
    },
    shack: {
      name: "Shack",
      desc:
        "A run-down SHACK leans against the trees. The ALPHABET WALL has a light for every letter A through Z, with a switch below each light so you can spell out a word. A KID'S DRAWING hangs on the door, and the path EAST returns to the WAYLAMP.",
      searchDesc:
        "The KID'S DRAWING shows a MONSTER with STINK FUMES pouring out of its rear end, and arrows everywhere pointing at the fumes. Flip the ALPHABET WALL's switches to SPELL a word; the light over each letter turns on as you go.",
    },
    below: {
      name: "Oak Undercroft",
      desc:
        "The OAK UNDERCROFT is a chamber hollowed among roots as thick as bridge cables. A LOWER PANEL holds three vertical slots beneath a dangling PLATFORM shaft. NORTH returns to the WAYLAMP CLEARING. The shaft continues UP, but no lift stops here yet.",
      searchDesc:
        "The LOWER PANEL has TOP, MIDDLE, and BOTTOM slots. LOOK UP or WAIT to check the moving PLATFORM; ENTER PLATFORM only when it is here.",
    },
  },
  items: {
    minersLocker: {
      desc:
        "A dented MINERS' LOCKER stands where miners once hung their gear. The hinge bends farther inward than the back wall permits. It has a handle and no lock.",
    },
  },
};

const shortNames = {
  rooms: {
    waylampClearing: "waylamp",
    grotto: "grotto",
    avClubDen: "avden",
    planetarium: "planetarium",
    mapRoom: "maproom",
    shack: "shack",
    below: "undercroft",
  },
  items: {
    minersLocker: "locker",
  },
};

const progressAwards = {
  lockerFound: 5,
  realmDiscovered: 20,
};

const hints = [];

const roomHooks = {
  mineGallery: {
    go(ctx, cmd) {
      return cmd.dobj === "in" ? enterRealm(ctx) : null;
    },
  },
};

const flavorPools = {};
const navigationLinks = [
  {
    from: "mineGallery",
    to: "waylampClearing",
    commands: ["in"],
    when: (ctx) => !!ctx.item("minersLocker")?.open,
  },
  {
    from: "waylampClearing",
    to: "mineGallery",
    commands: ["out"],
  },
];

export default {
  rooms, items, content, shortNames, progressAwards, hints, roomHooks, flavorPools, navigationLinks,
};

// end realm.js
