// shack.js. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.006:acoven.

const ACCEPTED_WORDS = new Set(["FART", "STINK", "CHEESE"]);
const WALL_NAMES = new Set(["alphabet wall", "wall", "letters", "bulbs"]);
const CRAYON_NAMES = new Set(["purple crayon", "crayon", "wax stick"]);

function spelledWord(value) {
  const parts = String(value || "").trim().split(/\s+/).filter(Boolean);
  const word = parts.length > 1 && parts.every((part) => part.length === 1)
    ? parts.join("")
    : parts.join(" ");
  // The generic parser removes article A, including the A in "F A R T".
  return word.toUpperCase() === "FRT" ? "FART" : word.toUpperCase();
}

function spellAlphabetWall(ctx, cmd) {
  if (cmd.prep && (cmd.prep !== "on" || !WALL_NAMES.has(cmd.iobj || ""))) return null;
  if (!cmd.dobj) return "Spell what on the ALPHABET WALL?";

  const word = spelledWord(cmd.dobj);
  if (!ACCEPTED_WORDS.has(word)) {
    return "The bulbs blink through your word, make a rude raspberry, and go dark. Try another word.";
  }
  if (ctx.getFlag("realm:shackSpelled")) {
    return "The wall gives one sleepy blink. It has no second CRAYON.";
  }

  ctx.setFlag("realm:shackSpelled");
  ctx.moveItem("purpleCrayon", "shack");
  const points = ctx.awardProgress("shackSpelled");
  return `The bulbs spell ${word} back at you. The wall hiccups and spits out a PURPLE CRAYON with a tiny BM stamped on its wrapper. (+${points})`;
}

function inspectUnspawnedCrayon(ctx, cmd) {
  if (!ctx.getFlag("realm:shackSpelled") && CRAYON_NAMES.has(cmd.dobj || "")) {
    return "The wall has not spat out a CRAYON yet.";
  }
  return null;
}

function drawingTaken(ctx) {
  return ctx.roomOf("kidsDrawing") !== "shack";
}

const rooms = {};
const items = {
  alphabetWall: {
    names: ["alphabet wall", "wall", "letters", "bulbs"],
    adjectives: ["alphabet"],
    loc: "shack",
    fixed: true,
    scenery: true,
  },
  kidsDrawing: {
    names: ["kid's drawing", "kids drawing", "drawing", "picture"],
    adjectives: ["kid's", "kids"],
    loc: "shack",
    takeable: true,
    treasure: true,
    points: 10,
    on: {
      read(ctx) {
        return "There are no written words, just the MONSTER, the green STINK FUMES blasting out of its rear end, and a swarm of arrows all pointing at the fumes." +
          ctx.awardUse(ctx.item("kidsDrawing"));
      },
      use(ctx) {
        return "There are no written words, just the MONSTER, the green STINK FUMES blasting out of its rear end, and a swarm of arrows all pointing at the fumes." +
          ctx.awardUse(ctx.item("kidsDrawing"));
      },
    },
  },
  purpleCrayon: {
    names: ["purple crayon", "crayon", "wax stick", "stick"],
    adjectives: ["purple", "wax"],
    loc: null,
    takeable: true,
    treasure: true,
    points: 15,
    on: {
      use(ctx) {
        return "You sketch a heroic butt, sign it anonymously, and tuck the PURPLE CRAYON away." +
          ctx.awardUse(ctx.item("purpleCrayon"));
      },
    },
  },
};
const content = {
  rooms: {
    shack: {
      name: "Shack",
      desc(ctx) {
        return drawingTaken(ctx)
          ? "A run-down SHACK leans against the trees. The ALPHABET WALL carries letters A through Z, each beneath a tiny bulb. The door has one lonely nail where a KID'S DRAWING once hung, and the path EAST returns to the WAYLAMP."
          : "A run-down SHACK leans against the trees. The ALPHABET WALL carries letters A through Z, each beneath a tiny bulb. A KID'S DRAWING hangs on the door, and the path EAST returns to the WAYLAMP.";
      },
      searchDesc(ctx) {
        return drawingTaken(ctx)
          ? "The door's nail remembers a drawing of a farting monster covered in arrows. The wall's bulbs twitch when someone spells on it; their colors mean nothing."
          : "The KID'S DRAWING shows a MONSTER with STINK FUMES pouring out of its rear end, and arrows everywhere pointing at the fumes. The wall's bulbs twitch when someone spells on it; their colors mean nothing.";
      },
    },
  },
  items: {
    alphabetWall: {
      roomDesc: "The ALPHABET WALL has a tiny bulb under each letter.",
      desc: "Letters A through Z are painted on the ALPHABET WALL, one bulb per letter. No bulb color matters; the door's KID'S DRAWING is the clue.",
    },
    kidsDrawing: {
      roomDesc: "A KID'S DRAWING of a MONSTER with STINK FUMES coming out of its rear end hangs on the door.",
      desc: "A crayon drawing of a big lumpy MONSTER (it looks a lot like DEMOGORGONZOLA) bent over, with wavy green STINK FUMES pouring out of its rear end. Dozens of arrows drawn from every corner of the page all point straight at the fumes, and one extra arrow points at another arrow just to be sure. There are no words, only a small BM signature squeezed into a corner.",
    },
    purpleCrayon: {
      roomDesc: "A PURPLE CRAYON lies where the wall spat it.",
      desc: "A slightly chewed PURPLE CRAYON in a paper wrapper stamped BM. Its tip is shaped like a very small guilty finger.",
    },
  },
};
const shortNames = {
  items: {
    alphabetWall: "alphabet",
    kidsDrawing: "drawing",
    purpleCrayon: "crayon",
  },
};
const progressAwards = {
  shackSpelled: 10,
};
const hints = [
  (ctx) => ({
    topics: ["alphabet", "wall", "letters", "bulbs"],
    done: !!ctx.getFlag("realm:shackSpelled"),
    text: "Those bulbs answer to SPELL, not SAY. Look closely at the KID'S DRAWING on the door.",
  }),
  (ctx) => ({
    topics: ["kid", "kids", "drawing", "picture", "arrows", "fart"],
    done: drawingTaken(ctx),
    text: "All those arrows point to a fart. FART, STINK, or CHEESE will do the trick.",
  }),
  (ctx) => ({
    topics: ["purple", "crayon", "wax"],
    done: ctx.has("purpleCrayon"),
    text: "When the wall spits out a CRAYON, remember to TAKE it. The drawing is an heirloom too.",
  }),
];
const roomHooks = {
  shack: {
    spell: spellAlphabetWall,
    examine: inspectUnspawnedCrayon,
  },
};
const flavorPools = {};

export default { rooms, items, content, shortNames, progressAwards, hints, roomHooks, flavorPools };

// end shack.js
