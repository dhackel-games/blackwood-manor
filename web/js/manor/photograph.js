// photograph.js. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.001:acoven.

const ROOM_IDS = [
  "gate", "garden", "hedgeMazeGate", "hedgeMazeKnot", "hedgeMazeLoop", "dragonCaveMouth",
  "dragonAntechamber", "mineGallery", "deepShaft", "trollGate", "dreadmawVault", "privy",
  "greatOak", "treeFort", "porch", "grandHall", "parlor", "library", "secretChamber",
  "diningRoom", "kitchen", "wineCellar", "crypt", "landing", "nursery", "masterBedroom",
  "study", "hallBedroom", "attic", "roof", "belfry", "hiddenVault", "garysLair",
  "betweenWalls", "p2_awakening", "t13_medusaGarden", "waylampClearing", "cheeseGrotto",
  "avClubDen", "planetarium", "mapRoom", "shack", "below",
];
const PIECE_IDS = ["letter", "photoPieceB", "photoPieceC", "photoPieceD"];
const PIECE_LABELS = {
  letter: "PHOTO PIECE A",
  photoPieceB: "PHOTO PIECE B",
  photoPieceC: "PHOTO PIECE C",
  photoPieceD: "PHOTO PIECE D",
};

function normalized(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function awardSuffix(points) {
  return points ? ` (+${points})` : "";
}

function photoPieceDFound(ctx) {
  return !!ctx.getFlag("manor:photoPieceDFound");
}

function revealPhotoPieceD(ctx) {
  if (photoPieceDFound(ctx)) return "The ROTTING BOOK has no second hidden piece.";
  ctx.setFlag("manor:photoPieceDFound");
  ctx.moveItem("photoPieceD", "library");
  return "You ease the ROTTING BOOK open. A loose PHOTO PIECE D slides onto the LIBRARY floor.";
}

function revealPhotoPieceDWithHiddenSight(ctx) {
  if (photoPieceDFound(ctx)) return null;
  ctx.setFlag("manor:photoPieceDFound");
  ctx.moveItem("photoPieceD", "library");
  return "Hidden sight shows a folded PHOTO PIECE D inside the ROTTING BOOK; it slips free where you can TAKE it.";
}

function readPhotographBack(ctx) {
  if (!ctx.isLit()) return "It's too dark to read.";
  const letter = ctx.item("letter");
  const photograph = ctx.item("baronessPhotograph");
  const points = ctx.awardProgress("letterRead");
  return `On the back of the BARONESS PHOTOGRAPH:\n${letter?.text || "It's blank."}` +
    awardSuffix(points) + ctx.awardUse(photograph);
}

function readFinishedLetter(ctx, cmd) {
  if (!ctx.has("baronessPhotograph")
      || !["letter", "backofphotograph"].includes(normalized(cmd.dobj))) {
    return null;
  }
  return readPhotographBack(ctx);
}

function combinePhotoPieces(ctx, cmd) {
  if (!["pieces", "photopieces"].includes(normalized(cmd.dobj))) return null;
  if (ctx.getFlag("manor:photoCombined")) {
    return "The BARONESS PHOTOGRAPH is already whole. Its LETTER is still readable on the back.";
  }

  const held = PIECE_IDS.filter((id) => ctx.has(id));
  const missing = PIECE_IDS.filter((id) => !ctx.has(id));
  if (missing.length) {
    const heldList = held.length ? held.map((id) => PIECE_LABELS[id]).join(", ") : "none";
    return `You have ${heldList}; still missing ${missing.map((id) => PIECE_LABELS[id]).join(", ")}. ` +
      "PHOTO PIECE A is the LETTER in the PORCH MAILBOX.";
  }

  const useAwards = PIECE_IDS.map((id) => ctx.awardUse(ctx.item(id))).join("");
  for (const id of PIECE_IDS) ctx.moveItem(id, "baronessPhotograph");
  ctx.setFlag("manor:photoCombined");
  ctx.moveItem("baronessPhotograph", "inventory");
  const pickup = ctx.awardPickup(ctx.item("baronessPhotograph"));
  const points = ctx.awardProgress("photoCombined");
  return "You fit four torn edges together. THE BARONESS stands beside a GRANDFATHER CLOCK whose hands read 1:30. " +
    "On the back, the warning LETTER is still legible. You now hold the BARONESS PHOTOGRAPH." +
    useAwards + pickup + awardSuffix(points);
}

function searchLibrary(ctx, cmd) {
  if (!["library", "books", "book", "rottingbook", "librarybook"].includes(normalized(cmd.dobj))) {
    return null;
  }
  return revealPhotoPieceD(ctx);
}

const rooms = {
  library: {
    hiddenSight: revealPhotoPieceDWithHiddenSight,
  },
};
const items = {
  letter: {
    names: ["letter", "photo piece a", "piece a", "photograph piece a", "piece", "a"],
    adjectives: ["photo", "piece", "photograph"],
  },
  photoPieceB: {
    names: ["photo piece b", "piece b", "photograph piece b", "b"],
    adjectives: ["photo", "piece", "photograph"],
    loc: "hedgeMazeLoop",
    takeable: true,
  },
  photoPieceC: {
    names: ["photo piece c", "piece c", "photograph piece c", "c"],
    adjectives: ["photo", "piece", "photograph"],
    loc: "privy",
    takeable: true,
  },
  rottingBook: {
    names: ["rotting book", "book", "books", "library book"],
    adjectives: ["rotting", "library"],
    loc: "library",
    fixed: true,
    readable: true,
    on: {
      read: revealPhotoPieceD,
      examine: revealPhotoPieceD,
    },
  },
  photoPieceD: {
    names: ["photo piece d", "piece d", "photograph piece d", "d"],
    adjectives: ["photo", "piece", "photograph"],
    loc: null,
    takeable: true,
  },
  baronessPhotograph: {
    names: ["baroness photograph", "photograph", "photo", "portrait", "baroness portrait"],
    adjectives: ["baroness"],
    loc: null,
    takeable: true,
    readable: true,
    treasure: true,
    points: 15,
    on: {
      read: readPhotographBack,
      use: readPhotographBack,
    },
  },
};
const content = {
  rooms: {
    hedgeMazeLoop: {
      searchDesc(ctx) {
        const piece = ctx.roomOf("photoPieceB") === "hedgeMazeLoop"
          ? "A torn PHOTO PIECE B rests against a root, not hidden under it."
          : "A root still holds the dust mark where PHOTO PIECE B lay.";
        return "Your overlapping footprints prove the NORTHERN opening is a loop; broken thorns point EAST toward the warmer air. " +
          piece;
      },
    },
    privy: {
      searchDesc(ctx) {
        const piece = ctx.roomOf("photoPieceC") === "privy"
          ? "A nail in the wall holds PHOTO PIECE C above the reach of the TOILET HOLE."
          : "A bare nail marks the place where PHOTO PIECE C hung, safely above the TOILET HOLE.";
        return "There are no pipes, tank, or porcelain — just a load-bearing seat and a TOILET HOLE. A faint " +
          "purple glimmer clings to the stains DOWN inside it. You would have to LOOK IN. Sunlight " +
          `flashes strangely through the leaves along the EASTERN path. ${piece}`;
      },
    },
    library: {
      searchDesc(ctx) {
        const original = ctx.getFlag("leverPulled")
          ? "Scrape marks confirm the open bookcase is a counterweighted door. The concealed stair descends DOWN into darkness."
          : "The brass LEVER is polished by hands while every nearby book is thick with dust. It was meant to be pulled.";
        const piece = photoPieceDFound(ctx)
          ? "The ROTTING BOOK is empty; PHOTO PIECE D is now loose on the floor."
          : "One ROTTING BOOK has a fat loose page hiding a folded PHOTO PIECE D; SEARCH BOOKS or READ BOOK.";
        return `${original} ${piece}`;
      },
    },
  },
  items: {
    letter: {
      desc: "A water-stained PHOTO PIECE A, torn at all four edges. The existing warning LETTER is written on its back.",
    },
    photoPieceB: {
      roomDesc: "A torn PHOTO PIECE B catches against a root in the HEDGE MAZE LOOP.",
      desc: "PHOTO PIECE B shows a lady's elbow and half a grandfather clock. Its ragged edge looks ready to meet another piece.",
    },
    photoPieceC: {
      roomDesc: "A torn PHOTO PIECE C hangs from a nail in the PRIVY wall, well clear of the TOILET HOLE.",
      desc: "PHOTO PIECE C shows half a clock face, mercifully dry despite its address.",
    },
    rottingBook: {
      roomDesc: "A ROTTING BOOK leans loosely between the other volumes.",
      desc(ctx) {
        return photoPieceDFound(ctx)
          ? "The ROTTING BOOK has surrendered the folded PHOTO PIECE D."
          : "A ROTTING BOOK whose loose pages have made room for something folded. SEARCH BOOKS or READ BOOK.";
      },
    },
    photoPieceD: {
      roomDesc: "PHOTO PIECE D lies beside the ROTTING BOOK.",
      desc: "PHOTO PIECE D shows the BARONESS'S face and a chipped wood frame behind her.",
    },
    baronessPhotograph: {
      roomDesc: "The assembled BARONESS PHOTOGRAPH lies here, its back covered in handwriting.",
      desc: "THE BARONESS stands beside a GRANDFATHER CLOCK whose hands read 1:30. Four seams cross the old photograph; the warning LETTER remains readable on its back. A BM stamp marks the frame.",
    },
  },
};
const shortNames = {
  items: {
    photoPieceB: "pieceb",
    photoPieceC: "piecec",
    photoPieceD: "pieced",
    rottingBook: "rottingbook",
    baronessPhotograph: "baronessphoto",
  },
};
const progressAwards = {
  photoCombined: 5,
};
const hints = [
  {
    topics: ["photo pieces", "pieces", "piece", "mailbox", "hedge", "privy", "library"],
    done: false,
    text: "Four pieces make one PHOTOGRAPH: the MAILBOX LETTER, a HEDGE MAZE LOOP scrap, one on the PRIVY wall, and one in a LIBRARY BOOK.",
  },
  {
    topics: ["book", "books", "rotting book", "library book"],
    done: false,
    text: "SEARCH BOOKS or READ BOOK in the LIBRARY, or use hidden sight, to loosen PHOTO PIECE D.",
  },
  {
    topics: ["photograph", "baroness", "photo"],
    done: false,
    text: "Carry all four PHOTO PIECES and COMBINE PIECES. READ the finished photograph for the unchanged LETTER on its back.",
  },
];
const roomHooks = Object.fromEntries(ROOM_IDS.map((id) => [id, {
  combine: combinePhotoPieces,
  read: readFinishedLetter,
}]));
roomHooks.library.search = searchLibrary;
roomHooks.library.examine = searchLibrary;
const flavorPools = {};

export default { rooms, items, content, shortNames, progressAwards, hints, roomHooks, flavorPools };

// end photograph.js
