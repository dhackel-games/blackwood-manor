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

    dragonCaveMouth: {
      name: "Dreadmaw's Cave Mouth",
      desc:
        "A CAVE yawns in a basalt hill, but DREADMAW THE DRAGON sleeps across its entrance — an ancient female dragon " +
        "vast enough to serve as the door. The HEDGE MAZE lies NORTH. The CAVE is EAST, entirely blocked by the DRAGON.",
    },

    dragonAntechamber: {
      name: "Dragon Cave Antechamber",
      desc:
        "The outer CAVE widens around rusted mine rails and abandoned ore carts. A DUSTY FAMILY RING marked BM " +
        "lies in the grit of one cart. DREADMAW'S CAVE MOUTH is WEST; the tunnel continues EAST into a MINING GALLERY.",
      searchDesc:
        "The initials BM remain visible beneath the dust on the FAMILY RING. The rails vanish EAST beneath old timber braces.",
    },

    mineGallery: {
      name: "Mining Gallery",
      desc:
        "A timber-braced MINING GALLERY follows a rusted rail line. A battered HEADLAMP hangs from a support post. " +
        "The DRAGON CAVE ANTECHAMBER is WEST; a ladder descends DOWN into a DEEP MINING SHAFT.",
      searchDesc:
        "The HEADLAMP still has a sealed battery pack. The rails and fresher TROLL footprints both continue DOWN.",
    },

    deepShaft: {
      name: "Deep Mining Shaft",
      desc:
        "A DEEP MINING SHAFT drops through wet black stone. Broken ladders and narrow ledges descend between " +
        "abandoned seams. A discarded miner's BACKPACK rests on a dry ledge. The MINING GALLERY is UP; " +
        "a worked tunnel runs EAST to the TROLL GATE.",
      searchDesc:
        "The BACKPACK still looks sturdy despite its years underground. Heavy bare footprints lead EAST.",
    },

    trollGate: {
      name: "Troll Gate",
      desc:
        "The tunnel ends at a seamless black VAULT DOOR. A broad, warty TROLL sits directly in front of it. " +
        "The DEEP MINING SHAFT lies WEST; DREADMAW'S hoard is sealed EAST.",
      searchDesc:
        "No keyhole interrupts the VAULT DOOR. The TROLL watches you expectantly, as if waiting to ask something.",
    },

    dreadmawVault: {
      name: "Dreadmaw's Vault",
      desc:
        "Gold rises in dunes beneath a ceiling lost in darkness. Jeweled cups, crowns, and inconveniently " +
        "large gemstones fill DREADMAW'S VAULT. A BLACKWOOD FAMILY CREST rests on a velvet cushion beside " +
        "a pair of WINGED SHOES. The TROLL GATE is WEST.",
      searchDesc:
        "This is generational dragon wealth, not loose change. The BLACKWOOD FAMILY CREST waits apart as the " +
        "essential heirloom; the WINGED SHOES look made to be worn.",
    },

    privy: {
      name: "Ivy-Choked Privy",
      desc:
        "A cramped brick OUTHOUSE strangled in ivy. Its only fixture is a rough wooden seat over a dark " +
        "TOILET HOLE in the earth. Fresh purple MUSHROOMS grow from the filth inside. The GARDEN lies WEST; " +
        "a narrow path continues EAST toward an enormous OAK.",
      searchDesc:
        "There are no pipes, tank, or porcelain — just a load-bearing seat and a TOILET HOLE. The fresh " +
        "source of the faint purple glimmer is somewhere DOWN inside it. You would have to LOOK IN. Sunlight " +
        "flashes strangely through the leaves along the EASTERN path.",
    },
  },

  items: {},
};
