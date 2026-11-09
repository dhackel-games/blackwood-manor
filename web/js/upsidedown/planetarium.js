// planetarium.js. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-09.001:acoven.

const PROJECTOR_PROMPT = "Enter a number from 1 to 5 to pick that projection.";
const INVALID_SELECTION = "Enter a number from 1 to 5 to pick that projection.";

const SAFE_CONSTELLATIONS = {
  1: "The dome draws a giant ladle over a tiny celery moon. Somehow the stars manage to look refrigerated.",
  3: "A celestial belt rides much too high. Orion reaches behind himself and discovers that the universe has no mercy.",
  5: "A huge backside constellation rises over the horizon. The brass projector clears its throat in a way that sounds like a snicker.",
};

function projectorPrompt() {
  return PROJECTOR_PROMPT;
}

function selectionFrom(cmd) {
  if (["say", "code", "enter"].includes(cmd.verb)) return cmd.dobj || cmd.iobj || "";
  return cmd.iobj || "";
}

function selectConstellation(ctx, cmd) {
  const selection = selectionFrom(cmd).trim();
  if (!/^[1-5]$/.test(selection)) return INVALID_SELECTION;

  const number = Number(selection);
  if (SAFE_CONSTELLATIONS[number]) {
    let result = SAFE_CONSTELLATIONS[number];
    if (!ctx.getFlag("realm:eyepieceDropped")) {
      ctx.setFlag("realm:eyepieceDropped");
      ctx.moveItem("goldEyepiece", "planetarium");
      const points = ctx.awardProgress("eyepieceDropped");
      result += "\n\nA hatch in the PROJECTOR clicks open. A GOLD EYEPIECE rolls across the floor." +
        (points ? ` (+${points})` : "");
    }
    return result;
  }

  if (number === 2) {
    ctx.state.room = "gate";
    return "A starless ring unfolds at the dome's center. Your arms, legs, and dignity stretch into one spectacular noodle; " +
      "the ring slurps you through and spits you out at the FRONT GATE. Your possessions arrive with you, properly unstretched." +
      `\n\n${ctx.describeRoom()}`;
  }

  ctx.state.room = "gate";
  ctx.setFlag("onFire", true);
  ctx.setFlag("burnTurns", 0);
  ctx.setFlag("burnGrace", true);
  ctx.setFlag("selfFireAwaitingSurvival", false);
  return "A furious white star flares. Its heat lights your clothes like a badly planned torch and hurls you through the dome. " +
    "You hit the FRONT GATE still ON FIRE with all your possessions. The GARDEN BRAZIER is one step EAST; move before the existing burn timer wins." +
    `\n\n${ctx.describeRoom()}`;
}

function useProjector(ctx, cmd) {
  return cmd.iobj ? selectConstellation(ctx, cmd) : projectorPrompt();
}

function useEyepiece(ctx) {
  return "You peer through the EYEPIECE. Your own fingerprint looms like a planetary system of questionable hygiene." +
    ctx.awardUse(ctx.item("goldEyepiece"));
}

const rooms = {};

const items = {
  projector: {
    names: ["projector", "brass projector", "star projector"],
    adjectives: ["brass", "star"],
    loc: "planetarium",
    fixed: true,
    scenery: true,
    on: {
      examine: projectorPrompt,
      use: useProjector,
      start: projectorPrompt,
      set: selectConstellation,
      turn: selectConstellation,
    },
  },
  stellarMap: {
    names: ["stellar map", "star map", "chart", "map"],
    adjectives: ["stellar", "star"],
    loc: "mapRoom",
    takeable: true,
    readable: true,
    treasure: true,
    points: 10,
  },
  goldEyepiece: {
    names: ["gold eyepiece", "eyepiece", "brass ocular", "ocular"],
    // The generic parser retains THROUGH as an adjective in LOOK THROUGH EYEPIECE.
    adjectives: ["gold", "brass", "through"],
    loc: null,
    takeable: true,
    treasure: true,
    points: 15,
    on: {
      use: useEyepiece,
      examine(ctx, cmd) {
        return /^through\s+/.test(cmd.dobj || "") ? useEyepiece(ctx) : null;
      },
    },
  },
};

const content = {
  items: {
    projector: {
      roomDesc: "A brass PROJECTOR points at the dome.",
      desc: "A brass star PROJECTOR with a dial numbered 1 to 5. Enter a number from 1 to 5 to pick that projection.",
    },
    stellarMap: {
      roomDesc: "A STELLAR MAP rests on the lectern.",
      desc: "A folded STELLAR MAP listing five projections by number. A BM seal sits beneath a grease mark shaped like a thumb.",
      text: "STELLAR MAP\n1 BIG DIPPER OF RANCH\n2 BLACK BUNGHOLE\n3 ORION'S WEDGIE\n4 SERIOUS-SIRIUS\n5 URANUS MAJOR",
    },
    goldEyepiece: {
      roomDesc: "A GOLD EYEPIECE gleams beside the PROJECTOR.",
      desc: "A gold-rimmed EYEPIECE engraved BM. Held to an eye, it makes an ordinary thumbprint look like a small greasy planet.",
    },
  },
};

const shortNames = {
  items: {
    projector: "projector",
    stellarMap: "starmap",
    goldEyepiece: "eyepiece",
  },
};

const progressAwards = {
  eyepieceDropped: 10,
};

const hints = [
  {
    topics: ["projector", "planetarium", "dome", "number"],
    done: false,
    text: "Enter a number from 1 to 5 to pick a projection. READ the STELLAR MAP next door to see what each number shows.",
  },
  {
    topics: ["stellar", "map", "chart", "map room"],
    done: false,
    text: "The STELLAR MAP in the MAP ROOM lists what each number projects.",
  },
  {
    topics: ["eyepiece", "ocular", "gold"],
    done: false,
    text: "A safe constellation can shake an EYEPIECE out of the projector. The first safe choice is enough.",
  },
  {
    topics: ["fire", "burning", "burn", "brazier", "front gate"],
    done: false,
    text: "If the dome sends you to the FRONT GATE on fire, go EAST and LIGHT the GARDEN BRAZIER before you burn out.",
  },
];

const roomHooks = {
  planetarium: {
    say: selectConstellation,
    code: selectConstellation,
    enter(ctx, cmd) {
      return /^\d+$/.test(String(cmd.dobj || "").trim()) ? selectConstellation(ctx, cmd) : null;
    },
  },
};

const flavorPools = {};

export default { rooms, items, content, shortNames, progressAwards, hints, roomHooks, flavorPools };

// end planetarium.js
