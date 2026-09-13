// world.js — "Escape the Derelict" — a Dave & Andy Games example world.
//
// This is a COMPLETE, minimal second game that runs on the exact same engine as
// Blackwood Manor (../../js/core.js), with NO engine changes. It exists to prove
// the engine is game-agnostic and to serve as a copy-me template for the next
// game. See ../README.md for the full "build a new game" guide.
//
// The whole game is data + a couple of handler functions. The engine supplies
// movement, taking/dropping, containers, light/darkness (grue!), scoring, save/
// restore, the map, and the parser — none of which know anything about spaceships
// or mansions.

export const world = {
  // config: the only required field is `start`. maxCarry caps the inventory HUD.
  config: {
    start: "cabin",
    maxCarry: 6,
    // Engine end-banner text is game-supplied (see core.js game.win). Without
    // this the engine falls back to Blackwood Manor's line.
    winBanner: "You blast free of the derelict. Deep space swallows the wreck behind you.",
  },

  rooms: {
    cabin: {
      name: "Crew Cabin",
      desc: "A cramped bunk room aboard a derelict freighter. A hatch leads north.",
      exits: { north: "corridor" },
    },
    corridor: {
      name: "Corridor",
      desc: "A dim service corridor. The bridge is north; a maintenance shaft drops down.",
      exits: { north: "bridge", south: "cabin", down: "shaft" },
    },
    bridge: {
      name: "Bridge",
      desc: "Dead consoles and one escape pod, sealed behind a keycard reader.",
      exits: { south: "corridor" },
    },
    shaft: {
      // `dark: true` engages the engine's generic darkness + grue mechanic. Bring
      // a light source (see the lamp) or be eaten — no spaceship-specific code.
      name: "Maintenance Shaft",
      desc: "A black crawlspace of cables and coolant.",
      dark: true,
      exits: { up: "corridor" },
    },
  },

  items: {
    keycard: {
      names: ["keycard", "card"],
      adjectives: ["blue"],
      loc: "cabin",
      takeable: true,
      desc: "A blue crew keycard.",
    },
    lamp: {
      // A pre-lit light source: carrying it makes the engine treat dark rooms as lit.
      names: ["lamp", "lantern", "light"],
      loc: "cabin",
      takeable: true,
      lightSource: true,
      lit: true,
      desc: "A hand lamp, already glowing.",
    },
    pod: {
      names: ["pod", "escape pod", "reader"],
      loc: "bridge",
      fixed: true,
      desc: "A one-seat escape pod behind a keycard reader.",
      on: {
        // A handler that returns a string intercepts the default verb. Returning
        // ctx.win(...) ends the game. This is the ONLY bespoke logic in the game.
        use(ctx) {
          if (!ctx.has("keycard")) return "The reader blinks red. It needs a keycard.";
          ctx.addScore(5);
          return ctx.win("You slot the blue keycard. The pod's clamps release and it fires clear.");
        },
      },
    },
  },
};

export default world;
