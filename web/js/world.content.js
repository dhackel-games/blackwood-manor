// world.content.js. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-12.071:dhackel.
//
// PLAYER-FACING PROSE for Blackwood Manor (content/logic split — backlog #9).
//   - This file holds ONLY static text: room names, descriptions, search text,
//     high-vision text. No logic, no handlers, no exits.
//   - world.js holds structure + behaviour (exits, item flags, on:{} handlers,
//     dynamic desc(ctx) methods) and merges this prose back in with
//     composeWorld(logicWorld, content), so the engine still receives one plain
//     world object.
// Editing copy? Edit it here. Adding rooms/items or behaviour? That's world.js.
//
// Migration is incremental: prose still living inline in world.js keeps working
// untouched (composeWorld only overlays the ids present here). Rooms/items are
// moved over batch by batch, each batch verified byte-identical by the suite.

export const content = {
  rooms: {
    gate: {
      name: "Front Gate",
      desc:
        "You stand at the rusted iron FRONT GATE of BLACKWOOD MANOR as the last light drains " +
        "from the sky. The MANOR looms beyond a dead lawn, its windows like sockets. A " +
        "gravel path leads NORTH to the PORCH. A low wall gives way EAST to the OVERGROWN " +
        "GARDEN, while a black yew opening enters the HEDGE MAZE to the WEST.",
      searchDesc:
        "Fresh scuffs disturb the gravel toward the EASTERN GARDEN. WEST, scorched leaves disappear into the HEDGE MAZE.",
    },

    garden: {
      name: "Overgrown Garden",
      desc:
        "Brambles have swallowed what was once a formal GARDEN. A weathered stone STATUE " +
        "of a robed woman leans amid the weeds, and a crumbling WELL shaft plunges into " +
        "blackness. A cold iron BRAZIER stands nearby. An ivy-choked brick OUTHOUSE squats to " +
        "the EAST; the FRONT GATE lies back to the WEST.",
      highDesc:
        "Stone and soil turn translucent. An IRON KEY glints beneath the STATUE, an ANCIENT COIN waits at the " +
        "bottom of the WELL, and old fire sleeps inside the BRAZIER.",
    },

    hedgeMazeGate: {
      name: "Hedge Maze: Yew Gate",
      desc:
        "Black yew walls swallow the sky. The FRONT GATE is EAST; passages run WEST and SOUTH, both " +
        "already looking suspiciously familiar.",
      searchDesc:
        "Freshly snapped twigs and one enormous scale lie toward the WESTERN PASSAGE.",
    },

    hedgeMazeKnot: {
      name: "Hedge Maze: Thorn Knot",
      desc:
        "Three thorn corridors knot together beneath clawed branches. The air to the SOUTH smells faintly of apples and smoke.",
      searchDesc:
        "A trail of scorched leaves continues SOUTH. The WESTERN corridor circles toward your own footprints.",
    },

    hedgeMazeLoop: {
      name: "Hedge Maze: Crooked Loop",
      desc:
        "The hedge bends back on itself with malicious precision. Every opening resembles the one you just used.",
      searchDesc:
        "Your overlapping footprints prove the NORTHERN opening is a loop; broken thorns point EAST toward the warmer air.",
    },
  },

  items: {},
};
