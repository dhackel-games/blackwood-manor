// world.content.js. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-21.106:acoven.
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
        "{{player_name}}, you stand at the rusted iron FRONT GATE of BLACKWOOD MANOR as the last light drains " +
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
        "The outer CAVE widens around rusted mine rails and abandoned ore carts. Splintered timbers and drifts " +
        "of black dust fill the carts. DREADMAW'S CAVE MOUTH is WEST; the tunnel continues EAST into a MINING GALLERY.",
      searchDesc:
        "Every ore cart has been picked clean. The rails vanish EAST beneath old timber braces.",
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
        "The PORCH boards sag under your weight. A brass MAILBOX is bolted beside a great oak " +
        "FRONT DOOR, its wood black with age. The path returns SOUTH to the FRONT GATE.",
    },

    grandHall: {
      name: "Royal Hall",
      desc:
        "A vast, cobwebbed ROYAL HALL rises two storeys to a shattered chandelier. A royal " +
        "staircase climbs UP into shadow. Set into the far wall is a stone RELIQUARY, and " +
        "beside the great FRONT DOOR is a narrow wooden BELL CLOSET. Doorways lead EAST to the " +
        "PARLOR and WEST to the DINING ROOM; the PORCH lies SOUTH. The hall repeats " +
        "your smallest movement half a beat late.",
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
        "A long banquet table lies buried under dust and fallen plaster. Old silver fittings for a CANDELABRA " +
        "and its single CANDLE scar the table's center. " +
        "The ROYAL HALL is EAST; a swinging door leads SOUTH to the KITCHEN.",
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
        "with one glass eye fixed on you. On a shelf sits a JEWELED MUSIC BOX. The UPSTAIRS LANDING lies EAST.",
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
      highDesc: "The dark wood becomes glassy, revealing a RAVENBLOOD RING inside the locked JEWELRY BOX.",
    },

    study: {
      name: "Study",
      desc:
        "A book-lined STUDY with a great oak DESK. A leather-bound DIARY lies open upon it, as though its writer " +
        "had just stepped away. Beneath the writing surface is a shallow DESK DRAWER with a BM-stamped brass pull. " +
        "The UPSTAIRS LANDING lies NORTH.",
      searchDesc:
        "The DIARY is open to a page dog-eared so aggressively it can only be important. Several numbers are " +
        "underlined in ink. The shallow DESK DRAWER beneath it looks intact and easy to OPEN.",
    },

    hallBedroom: {
      name: "Hall Bedroom",
      desc:
        "A narrow HALL BEDROOM lies NORTH of the UPSTAIRS LANDING. A neatly made BED faces a broken MIRROR with " +
        "a jagged center. Beside it stands a NIGHT TABLE with a small LAMP and a closed BM-handled DRAWER.",
    },

    attic: {
      name: "Attic",
      desc:
        "A vast, raftered ATTIC, silver with moonlight through a broken skylight. Amid the " +
        "shrouded lumber leans a small ANCESTRAL PORTRAIT in a gilt frame. Its painted eyes find " +
        "you immediately. The ladder leads DOWN.",
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
        "The BELFRY crouches above the roofline around a weather-blackened BELL. The rafters vanish into " +
        "layers of restless shadow. A thick ROPE hangs from the bell's wheel and passes through a fitted HOLE in the floor, " +
        "continuing down through the house. The MANOR ROOF is WEST. A narrow maintenance hatch descends DOWN " +
        "into the ASTRAL CHAMBER.",
      searchDesc:
        "The BELL ROPE is worn smooth where hands have pulled it. The hatch ladder drops directly beside the OBSIDIAN EYE.",
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

    garysLair: {
      name: "Gary's Call-Cave",
      desc:
        "A cramped, foul basement office beneath the ROYAL HALL: a battered desk, a green ROTARY PHONE, " +
        "cold burrito wrappers, a jar of MUSHROOMS, and a humming mini-FRIDGE. The stair climbs back UP.",
      searchDesc:
        "Gary left in a violent hurry. The ROTARY PHONE hangs silent, and the COUNTDOWN CLOCK remains with you.",
    },

    betweenWalls: {
      name: "The Space Between the Walls",
      desc:
        "You are somewhere the blueprints of BLACKWOOD MANOR insist does not exist: a dust-soft crawl-gap " +
        "between exposed beams, lit by no source you can name. Old newspaper insulation bulges from the studs. " +
        "A BLACKWOOD HAMMER lies half-buried in sawdust, its dark handle stamped with a BM insignia. There is no proper door here — " +
        "only the cramped gap OUT.",
      searchDesc:
        "Whoever built this space built it to be forgotten. Between the exposed beams, the BLACKWOOD HAMMER'S " +
        "BM-marked handle is the only thing the sawdust has not swallowed.",
    },
  },

  items: {
    bell: {
      desc: "A weather-blackened brass BELL filling most of the BELFRY. Its wheel holds the thick rope that " +
        "drops through a fitted hole in the floor.",
    },
    belfryBellRope: {
      desc: "A thick BELL ROPE descending from the great bell's wheel through a fitted HOLE in the belfry floor.",
    },
    belfryBats: {
      roomDesc: "Hundreds of black BATS crowd the rafters. Smoked lenses glint inside their roost.",
      desc: "Hundreds of black BATS hang in tight folds from the rafters. A pair of dark-glass goggles in " +
        "Blackwood brass is tangled among them.",
    },
    bellCloset: {
      desc: "A narrow wooden BELL CLOSET beside the FRONT DOOR. A small brass bat is nailed above its handle.",
    },
    closetBellRope: {
      desc: "The lower end of the BELFRY'S thick pull-rope. It descends from a fitted hole in the closet ceiling.",
    },
    mysteryPackage: {
      roomDesc: "A suspiciously nice, ribbon-tied PACKAGE sits on the floor, propped against the wall.",
      desc: "A beautifully wrapped package, ribbon and all, entirely out of place in this cobwebbed ruin. A " +
        "small card is tucked under the bow. It reads:\n\n" +
        "\"{{player_name}}: DO NOT OPEN ME. NOPE NOPE NOPE. You are going to regert it! That's right — regert, not regret.\"",
      text:
        "\"{{player_name}}: DO NOT OPEN ME. NOPE NOPE NOPE. You are going to regert it! That's right — regert, not regret.\"",
    },
    lightningBolt: {
      roomDesc: "A jagged bolt of LIGHTNING is speared into the floor here, hissing and crackling, scorch " +
        "marks spreading outward.",
      desc: "Still crackling, blue-white and hair-raising, driven into the floorboards like it's daring you " +
        "to get closer.",
    },
    statue: {
      desc: "A robed stone woman, features worn smooth. She leans oddly, as if something props her up.",
    },
    well: {
      desc: "A round stone well, its bucket and windlass long gone. The shaft drops into " +
        "pure black — a long way DOWN. Without a ROPE to climb back out, going DOWN there " +
        "would be the last thing you ever did.",
    },
    frontKey: {
      desc: "A heavy iron door-key, cold and gritty with earth. Age has left a deep crack along its shaft.",
    },
    mailbox: {
      desc: "A dented brass mailbox bolted to the PORCH rail.",
    },
    letter: {
      desc: "A single sheet of good paper, water-stained.",
      text:
        "The letter reads: \"To {{player_name}}, whoever inherits this cursed MANOR — the family's heirlooms must be returned " +
        "to the RELIQUARY in the ROYAL HALL, all of them, its doors CLOSED, and the BELL rung, or the curse will never lift. " +
        "Do not linger in the dark. And God help you in the CRYPT.\"",
    },
    brazier: {
      roomDesc: "A cold iron BRAZIER stands on a tripod amid the weeds, heaped with damp moss.",
      desc: "A cold iron brazier on a rusted tripod, heaped with grave-damp moss and packed black kindling. " +
        "Old scorch-marks ring its base. A lone match won't touch moss this wet, but a sustained candle flame " +
        "worked around the whole bowl might.",
    },
    emberStone: {
      desc: "A deep-green EMERALD GEM, warm from the brazier and faceted so precisely that even weak sunlight " +
        "passes through it in a narrow green beam.",
    },
    oakMechanism: {
      desc: "A dark iron PANEL inset in the GREAT OAK, fitted with three vertically stacked slots beneath " +
        "a web of small mirrors and sun shafts.",
    },
    greenGlassStone: {
      desc: "A translucent RUBY GEM cut into a deep red prism that fits one of the GREAT OAK'S three slots.",
    },
    blueGlassStone: {
      desc: "A translucent SAPPHIRE GEM cut into a deep blue prism that fits one of the GREAT OAK'S three slots.",
    },
    oakPlatform: {
      desc: "A broad wooden PLATFORM hanging from old but sturdy ropes. It shuttles between the roots and the TREE FORT.",
    },
    signalFlags: {
      desc: "A string of faded SIGNAL FLAGS spells something that was probably hilarious to children a century ago.",
    },
    blanketHideout: {
      desc: "A blanket HIDEOUT occupies one corner, furnished with a cracked compass, three acorn cups, and a sign: NO ADULTS.",
    },
    woodenSlingshot: {
      desc: "A forked wooden SLINGSHOT has been nailed to the wall after what appears to have been one incident too many.",
    },
    spyglassCradle: {
      desc: "The iron swivel CRADLE is rusted solid, aimed permanently at the manor's BELFRY.",
    },
    spyglass: {
      roomDesc: "A brass SPYGLASS marked BM sits in a rusted swivel cradle aimed at the distant BELFRY.",
      desc: "A handsome brass SPYGLASS. The initials BM are etched into its barrel, identifying it as a Blackwood heirloom.",
    },
    mushrooms: {
      roomDesc: "A dried cluster of shriveled purple MUSHROOMS rests on the windowsill.",
      desc: "Dried purple mushrooms, faintly luminous and just as potent as a fresh cluster.",
    },
    outhouseMushrooms: {
      roomDesc: "Inside the TOILET HOLE, fresh MUSHROOMS glisten with unmistakable crap and piss.",
      desc: "Fresh, crap-fueled purple mushrooms from inside the TOILET HOLE. They are visibly wet with literal waste.",
    },
    burrito: {
      roomDesc: "A foil-wrapped GARY'S MEGA ASS BLOW TAQUERIA DEATH WISH SPICY BURRITO sweats on the table.",
      desc: "Gary's Mega Ass Blow Taqueria Death Wish Spicy Burrito is an aged, foil-wrapped monument to bad " +
        "judgment. A forensic cross-section reveals two kinds of beans, three kinds of cheese, four kinds of meat, " +
        "and highly questionable lettuce that looks capable of carrying Cyclospora cayetanensis. Against all " +
        "available evidence, it may be edible if you're feeling adventurous.",
    },
    obsidianEye: {
      roomDesc: "A cold OBSIDIAN EYE rests on the plinth, watching.",
      desc: "A sphere of black volcanic glass, cold as the CRYPT and faintly, wrongly aware. Its underside is " +
        "unnaturally adhesive: WEAR it on your FOREHEAD as a third eye to expose things the MANOR keeps hidden. " +
        "It does not produce light. Inside it, something already knows you.",
    },
    burritoWrapper: {
      roomDesc: "The crumpled BURRITO WRAPPER and its greasy tin foil lie here.",
      desc: "The used burrito wrapper is laminated with a stubborn sheet of tin foil. It smells dangerous, but " +
        "its shiny inner surface looks capable of redirecting a brief digestive flame.",
    },
    milk: {
      roomDesc: "A cold BOTTLE OF MILK sits untouched in the pantry nook.",
      desc: "A sealed glass bottle of fresh milk, impossibly cold and apparently safe to drink.",
    },
    apple: {
      roomDesc: "A single crisp red APPLE sits in a shallow pantry basket.",
      desc: "A flawless red apple. In this KITCHEN, its lack of mould is almost supernatural.",
    },
    toilet: {
      roomDesc: "A rough TOILET HOLE gapes beneath the wooden seat. A faint purple glimmer leaks from below the rim.",
      desc: "A wooden seat over a raw hole in the earth. Something faintly purple glimmers below. It has no plumbing.",
    },
    dreadmaw: {
      desc: "DREADMAW THE DRAGON: an ancient female dragon armoured in plates like burnt cathedral stone. " +
        "She is sleeping directly across the CAVE entrance.",
    },
    goldDoubloon: {
      desc: "A heavy GOLD DOUBLOON stamped with DREADMAW's horned profile and a sun being swallowed. " +
        "Around its edge, one word has been etched by hand: LORE.",
    },
    dragonVaultDoor: {
      desc: "A seamless black VAULT DOOR with no keyhole. One rune resembles a listening ear.",
    },
    caveTroll: {
      desc: "A broad male TROLL with granite-coloured warts sits before the VAULT DOOR. He looks more literary than hungry.",
    },
    dragonHoard: {
      desc: "A mountainous dragon hoard filling DREADMAW'S VAULT: gold, gems, crowns, and several objects too cursed-looking to price.",
    },
    backpack: {
      roomDesc: "A sturdy canvas BACKPACK hangs from an abandoned ore cart.",
      desc: "A sturdy mining BACKPACK with enough pockets and straps to raise your carrying capacity to twenty items.",
    },
    headlamp: {
      roomDesc: "A battered mining HEADLAMP hangs from a timber support.",
      desc: "A battery-powered mining HEADLAMP with a cracked elastic strap. Its sealed lamp still promises two hundred turns of light.",
    },
    familyCrest: {
      roomDesc: "The BLACKWOOD FAMILY CREST rests on a velvet cushion beside the hoard.",
    },
    wingedShoes: {
      roomDesc: "A pair of golden WINGED SHOES rests atop a heap of coins.",
      desc: "Golden WINGED SHOES with living white feathers at each ankle. Worn on the FEET, they grant true flight.",
    },
    hallBed: {
      desc: "A narrow BED made with yellowed but carefully tucked linen.",
    },
    hallMirror: {
      desc:
        "The HALL BEDROOM MIRROR is broken around its center. Its surviving glass gives you back as a reflection " +
        "standing slightly farther away than it should.",
    },
    nightTable: {
      desc: "A small NIGHT TABLE holding a LAMP and a shallow DRAWER.",
    },
    nightDrawer: {
      desc: "A shallow wooden DRAWER in the NIGHT TABLE, fitted with a dark brass pull stamped BM.",
    },
    familyRing: {
      roomDesc: "A heavy BLACKWOOD FAMILY RING rests inside the drawer, its raised BM initials dark with age.",
      desc: "A heavy gold BLACKWOOD FAMILY RING. The broad signet bears raised BM initials polished smooth by " +
        "generations of nervous hands.",
    },
    bedsideLamp: {
      desc: "A small electric LAMP with a cloth shade and a working pull-chain.",
    },
    xrayGoggles: {
      roomDesc: "BLACKWOOD XRAY GOGGLES rest beneath the abandoned bat roost.",
      desc: "Antique XRAY GOGGLES built from blackened brass, smoked crystal, and fitted leather. A tiny BM " +
        "monogram is worked into the bridge. Worn over the EYES, the lenses expose hidden structure and make " +
        "darkness legible.",
    },
    frontDoor: {
      desc: "A great oak door, black with age, with a heavy iron lock.",
    },
    candlestick: {
      roomDesc: "A single unburnt CANDLE lies beside the incomplete candelabra.",
      desc: "The manor's sole portable CANDLE: old white wax around a silver socket, dry enough to take the " +
        "single MATCH. The socket looks made for the candelabra on the dining table.",
    },
    candelabraFrame: {
      roomDesc: "A rundown, incomplete CANDELABRA is fixed to the table beside the manor's sole CANDLE.",
      desc: "A rundown silver CANDELABRA fixed to the dining table. Its central candle socket is empty, and a " +
        "mirror-shaped recess interrupts the inscription around its base.",
    },
    candelabra: {
      roomDesc: "A beautiful BLACKWOOD CANDELABRA burns with steady blue-white light.",
      desc: "A restored silver BLACKWOOD CANDELABRA, its central mirror shard and sole candle held in a BM-marked " +
        "setting. Five blue-white flames burn without consuming the wax. Around its base the complete inscription " +
        "reads: \"BM — WHEN THE LAST LIGHT MEETS BROKEN GLASS, THE HOUSE REMEMBERS.\"",
    },
    matches: {
      desc: "A box holding a single dry match. Just one.",
    },
    rope: {
      desc: "A coil of stout rope, still sound.",
    },
    cellarDoor: {
      desc: "A heavy trap-door set flush in the KITCHEN floor, iron-ringed.",
    },
    lever: {
      desc: "A brass lever set into the shelving where a book should be.",
    },
    grimoire: {
      desc: "A heavy black grimoire, clasped in tarnished silver — a priceless first edition.",
      text: "The grimoire is written in a hand that hurts to follow. You snap it shut. Some things are worth money, not reading.",
    },
    portrait: {
      desc: "A grim PROFILE PAINTING of the patriarch. The frame stands slightly proud of the wall, as if hinged.",
    },
    safe: {
      desc: "A squat iron safe set into the wall, fitted with a combination dial.",
    },
    talisman: {
      desc: "A silver talisman on a chain, warm to the touch and graven with wards against the dead. The back " +
        "bears the BM crest, identifying the protective charm as a Blackwood family heirloom.",
    },
    desk: {
      desc: "A great oak DESK with the leather-bound DIARY open on top and one shallow DRAWER beneath the writing surface.",
    },
    studyDrawer: {
      desc: "A shallow oak DESK DRAWER with a BM-stamped brass pull. Unlike the desk's other seams, it looks ready to OPEN.",
    },
    diary: {
      desc: "A leather-bound diary in a spidery hand. Its ink feathers as you watch, as though freshly written.",
    },
    wallpaper: {
      desc: "Long tongues of wallpaper hang loose from the plaster. Low near the baseboard, one strip has " +
        "pulled almost all the way free, and the lath behind it sounds hollow when you rap on it.",
    },
    musicBox: {
      desc: "A jeweled music box, its lid inlaid with mother-of-pearl.",
    },
    tinyKey: {
      desc: "A tiny brass key, no longer than your thumbnail, made for a single delicate mechanism.",
    },
    jewelryBox: {
      desc: "A dark walnut jewelry box with a tiny keyhole.",
    },
    rubyRing: {
      desc: "The RAVENBLOOD RING: a heavy gold band set with a dark red garnet like a suspended drop of blood. " +
        "The initials BM are embossed inside the band, marking it as a Blackwood family heirloom.",
    },
    wraith: {
      desc: "A shroud of cold hatred, kept at bay by the TALISMAN. It hisses from the corners.",
    },
    goldLocket: {
      desc: "A gold locket, cold as the grave, its clasp shaped like clasped hands.",
    },
    cord: {
      desc: "A frayed cord dangling from the ATTIC trap-door in the ceiling.",
    },
    ancientCoin: {
      desc: "An ancient coin, worn smooth, stamped with a face no one remembers.",
    },
    crystalDecanter: {
      desc: "A cut-crystal decanter, still full, throwing splinters of colour even in the gloom.",
    },
    ancestralPortrait: {
      desc: "A small ANCESTRAL PORTRAIT painted in miniature and set in a gilt frame — a woman who looks " +
        "unsettlingly like the STATUE in the GARDEN. Her gaze settles on you.",
    },
    mirrorShard: {
      roomDesc: "A jagged MIRROR SHARD sits loose in the broken frame's center.",
      desc: "A palm-sized MIRROR SHARD worked free from the HALL BEDROOM MIRROR. Its nonreflective back is " +
        "blackened silver bearing only part of an inscription: \"...GLASS, THE HOUSE REMEMBERS.\"",
    },
    backwardsWatch: {
      roomDesc: "A BM WATCH rests inside the open DESK DRAWER, its empty face looking elsewhere.",
      desc: "A tarnished brass BM WATCH. Its front is an empty, mirror-like face that reflects nothing but seems " +
        "to be looking into somewhere else. Its nonreflective back bears a BM insignia above the inscription: " +
        "\"WHAT TIME TAKES, BLOOD REMEMBERS.\" Worn on the WRIST, it can scry rooms and prepare routes.",
    },
    blackwoodHammer: {
      roomDesc: "A BLACKWOOD HAMMER lies in the sawdust between the exposed beams.",
      desc: "A compact iron BLACKWOOD HAMMER with a dark ash handle. A deep BM insignia is branded into the grip, " +
        "marking it as a family heirloom rather than an ordinary tool.",
    },
  },
};
