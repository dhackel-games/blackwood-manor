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

    greatOak: {
      name: "The Great Oak",
      desc:
        "An immense GREAT OAK towers over a sunlit clearing EAST of the PRIVY. On the trunk's sunward backside, " +
        "a dark iron PANEL is inset beneath a high PULLEY. Tiny mirrors glint among the branches overhead. " +
        "The PRIVY path returns WEST.",
    },

    treeFort: {
      name: "Blackwood Tree Fort",
      desc:
        "A weathered TREE FORT fills the GREAT OAK'S crown. Faded SIGNAL FLAGS, a blanket HIDEOUT, a wooden " +
        "SLINGSHOT, and a crate-table surround a brass SPYGLASS in a rusted swivel cradle. The pulley PLATFORM " +
        "visits the railing every other turn.",
      searchDesc:
        "Child-sized chalk plans cover the planks. The SPYGLASS is unmistakably valuable, and its frozen cradle " +
        "aims directly toward BLACKWOOD MANOR'S distant BELFRY.",
    },

    porch: {
      name: "Front Porch",
      desc:
        "The PORCH boards sag underfoot. A brass MAILBOX is bolted beside a great oak " +
        "FRONT DOOR, its wood black with age. The path returns SOUTH to the FRONT GATE.",
    },

    grandHall: {
      name: "Royal Hall",
      desc:
        "A vast, cobwebbed ROYAL HALL rises two storeys to a shattered chandelier. A royal " +
        "staircase climbs UP into shadow. Set into the far wall is a stone RELIQUARY, and " +
        "above it hangs a great brass BELL on a frayed rope. Doorways lead EAST to the " +
        "PARLOR and WEST to the DINING ROOM; the PORCH lies SOUTH.",
      highDesc: "The shelves become transparent enough to reveal a hidden stair folding DOWN behind the brass LEVER.",
    },

    parlor: {
      name: "Parlor",
      desc:
        "A mouldering PARLOR of draped furniture. Above the cold fireplace hangs a huge, " +
        "grim PROFILE PAINTING of a bearded patriarch, whose eyes seem to track you. An archway " +
        "returns WEST to the ROYAL HALL; a low door leads SOUTH to the LIBRARY.",
      highDesc: "The wall behind the PROFILE PAINTING shimmers around the hard rectangular outline of an IRON SAFE.",
    },

    library: {
      name: "Library",
      desc:
        "Floor-to-ceiling shelves sag under rotting books. One shelf bears a curious brass " +
        "LEVER where a book should be. The PARLOR lies NORTH.",
    },

    secretChamber: {
      name: "Hidden Chamber",
      desc:
        "A cramped HIDDEN CHAMBER that has not seen daylight in a century. A single lectern " +
        "stands at its centre. The only way out is the stair UP to the LIBRARY.",
      searchDesc:
        "The lectern's silver clasp-marks fit the GRIMOIRE exactly. Nothing else here has survived except the warning chill.",
    },

    diningRoom: {
      name: "Dining Room",
      desc:
        "A long banquet table lies buried under dust and fallen plaster. Upon it, " +
        "improbably, stands a tarnished silver CANDLESTICK, its candle unburnt. The ROYAL HALL " +
        "is EAST; a swinging door leads SOUTH to the KITCHEN.",
      searchDesc:
        "Everything is dust-choked except the CANDLESTICK's wick. It is dry and usable, but it will need the MANOR'S " +
        "single precious MATCH.",
    },

    kitchen: {
      name: "Kitchen",
      desc:
        "A cavernous scullery of cold ranges and rusted hooks. A coil of stout ROPE hangs " +
        "on one hook, and a box of MATCHES sits on the sill. A heavy CELLAR DOOR is set in " +
        "the floor. The DINING ROOM lies NORTH.",
      searchDesc:
        "The MATCHBOX contains exactly one MATCH. The ROPE remains sound, the CELLAR DOOR has a lift-ring, and the " +
        "sweating super BURRITO appears to violate several eras of food-safety law.",
    },

    wineCellar: {
      name: "Wine Cellar",
      desc:
        "Racks of burst and blackened bottles line the dripping WINE CELLAR. One survivor gleams: " +
        "a CRYSTAL DECANTER of something that still catches the light. Stone steps climb UP " +
        "to the KITCHEN; an arch leads SOUTH, deeper, into a cold that raises the hairs on your neck.",
      searchDesc:
        "The DECANTER is the only intact valuable. Frost rims the SOUTHERN arch in the shape of grasping fingers; " +
        "crossing it without the TALISMAN feels terminal.",
    },

    crypt: {
      name: "Crypt",
      desc:
        "A low CRYPT of Blackwood dead. The WRAITH that guards it cowers from the TALISMAN " +
        "at your breast, hissing in the corners. On the central sarcophagus lies a GOLD " +
        "LOCKET. The only way out is NORTH to the WINE CELLAR.",
      searchDesc:
        "The TALISMAN's warmth pushes the WRAITH back whenever you approach the sarcophagus. The GOLD LOCKET is now within reach.",
    },

    landing: {
      name: "Upstairs Landing",
      desc:
        "A long UPSTAIRS LANDING overlooks the ROYAL HALL below. Doors open WEST to the NURSERY, " +
        "EAST to the GRAND BEDROOM, NORTH to the HALL BEDROOM, and SOUTH to the STUDY. A frayed CORD dangles from a " +
        "trap-door in the ceiling. The stairs go DOWN.",
    },

    nursery: {
      name: "Nursery",
      desc:
        "A child's NURSERY, its WALLPAPER peeling in long tongues. A rocking horse stares " +
        "with one glass eye. On a shelf sits a JEWELED MUSIC BOX. The UPSTAIRS LANDING lies EAST.",
      searchDesc:
        "The MUSIC BOX lid has a tiny spring catch. Something metallic rattles inside when the box is tilted. " +
        "One curling tongue of WALLPAPER, low near the baseboard, looks looser than the rest.",
      highDesc: "The MUSIC BOX turns transparent. A TINY KEY gleams inside its closed lid.",
    },

    masterBedroom: {
      name: "Grand Bedroom",
      desc:
        "A great canopied bed rots beneath a collapsed tester in the GRAND BEDROOM. On the vanity stands a locked " +
        "JEWELRY BOX of dark walnut. The UPSTAIRS LANDING lies WEST.",
      searchDesc:
        "The JEWELRY BOX's keyhole is absurdly small. A normal door KEY could never fit it; a miniature KEY might.",
      highDesc: "The dark wood becomes glassy, revealing a RAVENBLOOD SIGNET inside the locked JEWELRY BOX.",
    },

    study: {
      name: "Study",
      desc:
        "A book-lined STUDY with a great oak DESK. A leather-bound DIARY lies open upon it, " +
        "as though its writer had just stepped away. The UPSTAIRS LANDING lies NORTH.",
      searchDesc:
        "The DIARY is open to a page dog-eared so aggressively it can only be important. Several numbers are underlined in ink.",
    },

    hallBedroom: {
      name: "Hall Bedroom",
      desc:
        "A narrow HALL BEDROOM lies NORTH of the UPSTAIRS LANDING. A neatly made BED faces a tarnished MIRROR. " +
        "Beside it stands a NIGHT TABLE with a small LAMP and a closed DRAWER.",
      searchDesc:
        "The BED is untouched, the MIRROR is clouded, and the NIGHT TABLE'S DRAWER has a cheap plastic handle.",
    },

    attic: {
      name: "Attic",
      desc:
        "A vast, raftered ATTIC, silver with moonlight through a broken skylight. Amid the " +
        "shrouded lumber leans a small ANCESTRAL PORTRAIT in a gilt frame. The ladder leads DOWN.",
      searchDesc:
        "The ANCESTRAL PORTRAIT is valuable and portable. The ladder flexes ominously even before you add the weight of a full inventory.",
    },

    roof: {
      name: "Manor Roof",
      desc:
        "Slate ridges roll across the MANOR ROOF beneath the open sky. The broken ATTIC skylight is DOWN; " +
        "a narrow ridge runs EAST to the BELFRY.",
      searchDesc:
        "Only someone able to fly could cross the missing slates safely. The BELFRY'S louvers stand open.",
    },

    belfry: {
      name: "Belfry",
      desc:
        "The BELFRY crouches above the roofline around a weather-blackened bell. The MANOR ROOF is WEST. " +
        "A narrow maintenance hatch descends DOWN into the ASTRAL CHAMBER.",
      searchDesc:
        "The hatch bypasses the sealed ATTIC gable entirely. Its iron ladder drops directly beside the OBSIDIAN EYE.",
    },

    hiddenVault: {
      name: "Astral Chamber",
      desc:
        "A windowless ASTRAL CHAMBER the living were never meant to find, mortared behind the ATTIC'S NORTH " +
        "gable. On a low stone plinth rests a single OBSIDIAN EYE — a cold sphere of black glass that " +
        "seems to watch you back. The ATTIC lies SOUTH; a BELFRY ladder climbs UP.",
      searchDesc:
        "The OBSIDIAN EYE drinks whatever light your sight gives it. Lifting it feels less like taking and more like being chosen.",
    },

    hollowPassage: {
      name: "Hollow Passage",
      desc:
        "A narrow HOLLOW PASSAGE of pale stone the MANOR kept hidden all this time. It is oddly warm, " +
        "and lit by no lamp you can find — as if the walls themselves remember daylight. The ROYAL HALL " +
        "lies back to the SOUTH; the PASSAGE runs NORTH.",
      searchDesc:
        "No mechanism or side PASSAGE interrupts the pale stone. The warmth and faint light both strengthen toward the NORTH.",
    },

    hollowSanctum: {
      name: "The Hollow Sanctum",
      desc:
        "A round, domed HOLLOW SANCTUM at the MANOR'S secret heart, filled with a soft grey light. The pale " +
        "SPIRIT of a robed woman waits beside a pedestal, and upon the pedestal rests a SILVER MIRROR. " +
        "Beyond her, an archway opens NORTH onto a growing dawn.",
      searchDesc:
        "The SPIRIT guards nothing now. The SILVER MIRROR lifts freely from its pedestal, and the NORTHERN dawn feels like an ending.",
    },

    garysLair: {
      name: "Gary's Call-Cave",
      desc:
        "A cramped, foul basement office beneath the ROYAL HALL: a battered desk, a green ROTARY PHONE, " +
        "cold burrito wrappers, a jar of MUSHROOMS, and a humming mini-FRIDGE. The stair climbs back UP.",
      searchDesc: "Whoever worked down here left in a violent hurry — and took your heirlooms with them.",
    },

    betweenWalls: {
      name: "The Space Between the Walls",
      desc:
        "You are somewhere the blueprints of BLACKWOOD MANOR insist does not exist: a dust-soft crawl-gap " +
        "between two walls, lit by no source you can name. Old newspaper insulation bulges from the studs, " +
        "and a tarnished WOODBLACK WATCH hangs from a bent nail. There is no proper door here — " +
        "only the cramped gap OUT.",
      searchDesc:
        "Whoever built this space built it to be forgotten. The WOODBLACK WATCH is the only thing in it that " +
        "isn't dust.",
    },
  },

  items: {},
};
