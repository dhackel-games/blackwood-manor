// demogorgonzola.js. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.001:acoven.

const CHEESE_IDS = ["limburgerCheese", "epoissesCheese", "munsterCheese"];
const UNSAFE_VERBS = [
  "open", "close", "unlock", "lock", "take", "drop", "read", "move", "push", "pull",
  "on", "off", "light", "extinguish", "attack", "eat", "drink", "wear", "remove",
  "throw", "put", "enter", "climb", "reach", "ring", "touch", "listen", "combine",
  "spell", "kick", "fight", "turn", "set", "start", "pour", "fill", "stomp", "smother",
  "burn", "use", "flush", "talk", "say", "wake", "pray", "sit", "show", "route",
];

function normalized(value) {
  return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function cheeseId(ctx, phrase) {
  const wanted = normalized(phrase);
  return CHEESE_IDS.find((id) => {
    const item = ctx.world.items[id];
    return [id, ...(item?.names || [])].some((name) => normalized(name) === wanted);
  });
}

function fedCount(ctx) {
  return CHEESE_IDS.filter((id) => ctx.roomOf(id) === null).length;
}

function swallow(ctx) {
  ctx.state.room = "gate";
  return "You have been warned about those jaws. DEMOGORGONZOLA opens like a flower made of bad decisions, swallows you whole, and coughs you out at the FRONT GATE. You keep every possession, including anything you tried to give it. You do not keep your dignity.\n\n" +
    ctx.describeRoom();
}

function feedDemogorgonzola(ctx, cmd) {
  const id = cheeseId(ctx, cmd.dobj);
  if (!id) return swallow(ctx);
  if (ctx.getFlag("realm:demoFed")) {
    const rindOnFloor = ctx.roomOf("demogorgonzolaRind") === "cheeseGrotto";
    return rindOnFloor
      ? "All three cheeses have done their work. The RIND is on the grotto floor."
      : "All three cheeses have done their work. The RIND has already been claimed.";
  }
  if (ctx.roomOf(id) === null) {
    return "That cheese is already in its stomach. The beast wants a different stink.";
  }
  if (!ctx.has(id)) return "Bring the CHEESE here in your own hands first.";

  const cheese = ctx.item(id);
  const use = ctx.awardUse(cheese);
  ctx.destroy(id);
  const count = fedCount(ctx);
  if (count < CHEESE_IDS.length) {
    return `DEMOGORGONZOLA gulps down the ${cheese.names[0].toUpperCase()}. One face-petal unfolds. (${count}/3)${use}`;
  }

  ctx.setFlag("realm:demoFed");
  ctx.moveItem("demogorgonzolaRind", "cheeseGrotto");
  const points = ctx.awardProgress("demoFed");
  return "The last cheese disappears. DEMOGORGONZOLA'S face opens petal by petal like a ghastly flower; it spits out a DEMOGORGONZOLA RIND, bows with its entire throat, and waits for more." +
    (points ? ` (+${points})` : "") + use;
}

function smellDemogorgonzola() {
  return "It smells your pockets before you finish smelling it. Three distinct cheese odors seem to interest it.";
}

function rindDescription() {
  return "A stiff, many-lobed cheese RIND that smells of three lunches arguing over custody. A tiny BM stamp marks it as an heirloom.";
}

const rooms = {};
const items = {
  demogorgonzola: {
    names: ["demogorgonzola", "monster", "cheese monster", "creature"],
    loc: "cheeseGrotto",
    fixed: true,
    on: {
      give: feedDemogorgonzola,
      smell: smellDemogorgonzola,
      ...Object.fromEntries(UNSAFE_VERBS.map((verb) => [verb, swallow])),
    },
  },
  demogorgonzolaRind: {
    names: ["demogorgonzola rind", "rind", "cheese rind"],
    loc: null,
    takeable: true,
    pendingHeirloom: true,
    points: 15,
    on: {
      use(ctx) {
        return "You brandish the RIND. DEMOGORGONZOLA hiccups from somewhere very far away." +
          ctx.awardUse(ctx.item("demogorgonzolaRind"));
      },
    },
  },
};
const content = {
  rooms: {
    cheeseGrotto: {
      name: "Cheese Grotto",
      desc(ctx) {
        const creature = ctx.getFlag("realm:demoFed")
          ? "DEMOGORGONZOLA squats beneath the stalactites, its face open like a very rude flower."
          : "DEMOGORGONZOLA squats beneath a shelf of stalactites, its closed face puckered like a flower bud.";
        return `The CHEESE GROTTO smells like a locker room built inside another locker room. ${creature} The only path leads SOUTH to the WAYLAMP.`;
      },
      searchDesc:
        "The creature sniffs at your pockets. Its jaws snap on a falling pebble; a stain on the stone suggests anyone poking it will be gulped whole. It looks hungry for something even smellier than itself.",
    },
  },
  items: {
    demogorgonzola: {
      roomDesc(ctx) {
        return ctx.getFlag("realm:demoFed")
          ? "DEMOGORGONZOLA waits with its face open like a very rude flower."
          : "DEMOGORGONZOLA waits with its face closed like a fistful of petals.";
      },
      desc: "A hungry cheese monster with a face that opens like a flower. Its nose follows anything stinky; its jaws have already swallowed an entire explorer's boot. Poke or attack it and it will gulp you down and cough you up at the FRONT GATE, possessions and all.",
    },
    demogorgonzolaRind: {
      roomDesc: "A DEMOGORGONZOLA RIND lies where the creature spat it.",
      desc: rindDescription,
    },
  },
};
const shortNames = {
  items: {
    demogorgonzola: "demo",
    demogorgonzolaRind: "rind",
  },
};
const progressAwards = {
  demoFed: { points: 10, maximumScore: false },
};
const hints = [
  (ctx) => ({
    topics: ["demogorgonzola", "monster", "creature", "cave", "grotto"],
    done: !!ctx.getFlag("realm:demoFed"),
    text: "LOOK or SMELL, but do not touch the thing. FEED it LIMBURGER, ÉPOISSES, and MUNSTER in any order.",
  }),
  (ctx) => ({
    topics: ["rind", "demogorgonzola rind"],
    done: ctx.roomOf("demogorgonzolaRind") === "inventory"
      || ctx.roomOf("demogorgonzolaRind") === "reliquary",
    text: "When its face opens, check the CHEESE GROTTO floor for the RIND.",
  }),
];
const roomHooks = {
  cheeseGrotto: {
    give(ctx, cmd) {
      return cmd.iobj ? null : feedDemogorgonzola(ctx, cmd);
    },
    take(ctx, cmd) {
      return normalized(cmd.dobj) === "rind" && !ctx.getFlag("realm:demoFed")
        ? "There is no RIND on the floor yet."
        : null;
    },
  },
};
const flavorPools = {};

export default { rooms, items, content, shortNames, progressAwards, hints, roomHooks, flavorPools };

// end demogorgonzola.js
