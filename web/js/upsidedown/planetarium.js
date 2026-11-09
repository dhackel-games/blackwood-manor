// planetarium.js. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-09.002:acoven.

const DIAL_FLAG = "realm:projectorDial";
const PROJECTOR_PROMPT = "Set the PROJECTOR's DIAL to a number from 1 to 5, then flick its bulb SWITCH.";
const INVALID_SELECTION = "The DIAL only goes from 1 to 5.";

const SAFE_CONSTELLATIONS = {
  1: "The dome draws a giant ladle over a tiny celery moon. Somehow the stars manage to look refrigerated.",
  3: "A celestial belt rides much too high. Orion reaches behind himself and discovers that the universe has no mercy.",
  5: "A huge backside constellation rises over the horizon. The brass projector clears its throat in a way that sounds like a snicker.",
};

function projectorPrompt() {
  return PROJECTOR_PROMPT;
}

function setDial(ctx, cmd) {
  const selection = String(cmd.iobj || cmd.dobj || "").match(/\d+/)?.[0];
  if (!selection) return PROJECTOR_PROMPT;
  if (!/^[1-5]$/.test(selection)) return INVALID_SELECTION;
  ctx.setFlag(DIAL_FLAG, Number(selection));
  return `You click the DIAL to ${selection}.`;
}

function describeDial(ctx) {
  const setting = ctx.getFlag(DIAL_FLAG);
  return setting
    ? `The PROJECTOR's DIAL is numbered 1 to 5 and set to ${setting}.`
    : "The PROJECTOR's DIAL is numbered 1 to 5; its pointer rests between numbers.";
}

function flickSwitch(ctx) {
  const setting = ctx.getFlag(DIAL_FLAG);
  if (!setting) return "You flick the bulb SWITCH. The bulb flickers, but the DIAL isn't set to a number, so nothing projects.";
  return `You flick the bulb SWITCH and the PROJECTOR blazes on.\n\n${project(ctx, setting)}`;
}

function project(ctx, number) {
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
  ctx.setFlag("realm:siriusFired");
  ctx.setFlag("onFire", true);
  ctx.setFlag("burnTurns", 0);
  ctx.setFlag("burnGrace", true);
  ctx.setFlag("selfFireAwaitingSurvival", false);
  return "A furious white star flares. Its heat lights your clothes like a badly planned torch and hurls you through the dome. " +
    "You hit the FRONT GATE still ON FIRE with all your possessions." +
    `\n\n${ctx.describeRoom()}`;
}

function useProjector(ctx, cmd) {
  if (cmd.iobj && /\d/.test(cmd.iobj)) return setDial(ctx, cmd);
  return ctx.getFlag(DIAL_FLAG) ? flickSwitch(ctx) : projectorPrompt();
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
      use: useProjector,
      start: useProjector,
      on: flickSwitch,
      set: setDial,
      turn: setDial,
    },
  },
  projectorDial: {
    names: ["dial", "projector dial", "knob"],
    adjectives: ["projector", "numbered", "brass"],
    loc: "planetarium",
    fixed: true,
    scenery: true,
    on: { set: setDial, turn: setDial, move: setDial, examine: describeDial },
  },
  projectorSwitch: {
    names: ["switch", "bulb switch", "button", "bulb button", "bulb"],
    adjectives: ["bulb", "projector"],
    loc: "planetarium",
    fixed: true,
    scenery: true,
    on: { push: flickSwitch, on: flickSwitch, use: flickSwitch, turn: flickSwitch },
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
      desc: (ctx) => `A brass star PROJECTOR with a numbered DIAL and a bulb SWITCH. ${describeDial(ctx)}`,
    },
    projectorDial: {
      desc: describeDial,
    },
    projectorSwitch: {
      desc: "A stubby bulb SWITCH on the PROJECTOR's side, waiting to be flicked.",
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
    projectorDial: "dial",
    projectorSwitch: "switch",
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
    text: "SET the PROJECTOR's DIAL to a number from 1 to 5, then FLICK the SWITCH. READ the STELLAR MAP next door to see what each number shows.",
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
  (ctx) => ({
    topics: ["fire", "burning", "burn", "brazier", "front gate"],
    done: !(ctx.getFlag("realm:siriusFired") && ctx.getFlag("onFire")),
    text: "You're ON FIRE at the FRONT GATE: go EAST and LIGHT the GARDEN BRAZIER before you burn out.",
  }),
];

const roomHooks = {};

const flavorPools = {};

export default { rooms, items, content, shortNames, progressAwards, hints, roomHooks, flavorPools };

// end planetarium.js
