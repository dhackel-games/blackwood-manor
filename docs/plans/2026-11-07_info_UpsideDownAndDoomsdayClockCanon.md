<!-- 2026-11-07_info_UpsideDownAndDoomsdayClockCanon.md. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.005:acoven. -->

# The Upside Down and Doomsday Clock canon

This is the exact player-facing text and constant contract for Lanes 2 through 10. The [master plan](2026-11-07_plan_todo_DoomsdayClock.md) owns scope and award values; the quoted strings here are literal content, not examples. Existing prose not specifically replaced here stays unchanged.

## Conventions and parser grammar

* Each new heirloom has `pendingHeirloom: true` until Lane 10 enables all eleven as `treasure: true` together. Scoring uses master Section 8 exclusively. Show ` (+N)` only on the first award, using the existing award formatter; do not print it on repeats. Unlisted commands retain the existing generic refusal in `commands.js`.
* Puzzle handlers and quoted prose live in content modules. Lane 2 adds these generic canonical verbs and synonyms to `parser.js`, with the quoted default refusals in `commands.js`: `combine` accepts COMBINE, ASSEMBLE ("Those pieces do not fit together."); `spell` accepts SPELL, TYPE ("There is nothing here to spell on."); `kick` accepts KICK, BOOT ("Kicking that would not help."); `fight` accepts FIGHT, BRAWL ("There is no fight to pick here."); `turn` accepts TURN, ROTATE, SPIN ("Nothing here turns."); `set` accepts SET, ADJUST ("There is nothing here to set."); `start` accepts START, RUN, ACTIVATE ("Nothing here starts."); `pour` accepts POUR, TIP ("You have nothing suitable to pour there."); `fill` accepts FILL, REFILL ("There is nothing here to fill that with."); `stomp` accepts STOMP, STAMP ("Stomping changes nothing."); `smother` accepts SMOTHER, SUFFOCATE ("There is nothing here to smother."). Retain the parser's existing TURN ON and TURN OFF normalization.
* Existing mappings stay: FEED and OFFER are GIVE, SNIFF is SMELL, ANSWER is SAY, PICK is TAKE, and BOARD and RIDE are ENTER. HELP, CALL, HINT, and explicit DIAL GARY, DIAL PHONE, DIAL HOTLINE call Gary's paid hints; INFO, ?, and COMMANDS print the free command reference. The setting DIAL rule appears in the manor section.
* Normalize punctuation and articles in item-target matching only where a puzzle says so. `SAY "title"` retains its quoted words; parser splitting on a preposition does not excuse a handler from accepting the grammar below. Case does not matter. All named-room flight via WINGED SHOES or shared high includes every realm room and works both ways with the existing flight rules.
* Hidden sight from a positive `high` flag, worn XRAY GOGGLES, or worn OBSIDIAN EYE automatically performs every SEARCH-only discovery on entering or LOOKing in its room. Its `highDesc` may not claim an accessible item or direction that a movement or TAKE handler then rejects. Physical obstructions, such as a still burning CAMPFIRE or a closed bookcase, must be described as obstructions rather than invisible barriers. The ATTIC NORTH `vaultFound`, NURSERY IN `wallGapFound`, and LIBRARY DOWN `leverPulled` passages follow this rule; the LIBRARY lever still has to be pulled to move the bookcase.
* Text tone: fair, classic adventure puzzles painted with hysterically junior-high-boy absurdity and affectionate Stranger Things and Narnia nicknames. No holiday theme, burrito or Taco Tuesday mechanic, reproduced lyrics, in-game trivia lecture, or invented hint for the LOWER PANEL or MICROWAVE solution.

## Canonical identities and collision policy

* New `ROOM_SHORT_NAMES`, each unique against `world.js`: `waylampClearing: "waylamp"` (WAYLAMP CLEARING; aliases "waylamp", "lamp clearing", "upside down clearing"); `cheeseGrotto: "grotto"` (CHEESE GROTTO; "cheese grotto", "grotto"); `avClubDen: "avden"` (AV CLUB DEN; "av club", "av den", "radio den"); `planetarium: "planetarium"` (PLANETARIUM; "dome"); `mapRoom: "maproom"` (MAP ROOM; "map room", "chart room"); `shack: "shack"` (SHACK; "letter shack", "alphabet shack"); `oakUndercroft: "undercroft"` (OAK UNDERCROFT; "under the oak", "below", "oak undercroft"). These aliases identify rooms for named flight; bare MAP keeps its existing map command.
* New realm `ITEM_SHORT_NAMES`, each unique against `world.js`: `minersLocker: "locker"`; `upsideDownCampfire: "downfire"`; `stream: "stream"`; `demogorgonzola: "demo"`; `demogorgonzolaRind: "rind"`; `cabinetRadio: "cabinet"`; `portableTransistorRadio: "transistor"`; `projector: "projector"`; `stellarMap: "starmap"`; `goldEyepiece: "eyepiece"`; `alphabetWall: "alphabet"`; `kidsDrawing: "drawing"`; `purpleCrayon: "crayon"`; `lowerPanel: "lowerpanel"`; `cyanGem: "cyan"`; `magentaGem: "magenta"`; `yellowGem: "yellow"`.
* New manor `ITEM_SHORT_NAMES`, each unique against `world.js`: `fridge: "fridge"`; `milkJug: "jug"`; `limburgerCheese: "limburger"`; `epoissesCheese: "epoisses"`; `munsterCheese: "munster"`; `coalStack: "coalstack"`; `coalLump: "coal"`; `microwave: "microwave"`; `microwaveDial: "mdial"`; `blackwoodDiamond: "diamond"`; `gargoyleBurper: "burper"`; `gargoyleFarter: "farter"`; `gargoyleShitter: "shitter"`; `gargoyleHorizonGazer: "horizongazer"`; `silverWeathercock: "weathercock"`; `marbleBust: "bust"`; `bustNose: "nose"`; `snuffbox: "snuffbox"`; `photoPieceB: "pieceb"`; `photoPieceC: "piecec"`; `photoPieceD: "pieced"`; `rottingBook: "rottingbook"`; `baronessPhotograph: "baronessphoto"`; `corkscrew: "corkscrew"`; `wineBottle: "winebtl"`.
* Preserve existing `ITEM_SHORT_NAMES` `milk: "milk"`, `letter: "letter"`, `oakMechanism: "panel"`, `oakPlatform: "platform"`, and `clockTalisman: "gclock"`; preserve existing room short names `wineCellar: "wine"` and `greatOak: "oak"`. The existing MILK `names` includes BOTTLE, so neither WINE BOTTLE nor MILK JUG registers bare BOTTLE as a name or short name. In the WINE CELLAR, TAKE BOTTLE contextually takes the offered WINE BOTTLE only if MILK is not in scope; otherwise it says "Which BOTTLE? Try WINE BOTTLE or MILK." Everywhere else BOTTLE remains MILK. Bare RADIO in AV CLUB DEN addresses the CABINET RADIO; elsewhere it addresses the carried PORTABLE TRANSISTOR RADIO. Use explicit CABINET RADIO or TRANSISTOR RADIO to disambiguate when both are in scope.
* Existing `letter` is PHOTO PIECE A, not a second item. Its `names` gain "photo piece a", "piece a", "letter"; its existing `letterRead` progress, pickup history, and warning text remain intact. Existing `milk` moves into the new FRIDGE only on a fresh game or when a migrated save still leaves it at its original KITCHEN location; never duplicate or relocate milk already taken or drunk.

## Realm room atlas and portal

* All seven new rooms belong to THE UPSIDE DOWN; none is dark or gated by completion. Walking exits are reciprocal unless explicitly stated. All `desc`, `searchDesc`, and `highDesc` strings below are complete text for the named room; a room with `highDesc: none` has no hidden sight-only prose or discovery.
* `waylampClearing`, WAYLAMP CLEARING, exits NORTH CHEESE GROTTO, EAST AV CLUB DEN, WEST SHACK, SOUTH OAK UNDERCROFT, OUT MINING GALLERY through the locker. `desc` while the fire burns: "A lonely WAYLAMP shines beside a wood that appears to have failed an inspection of reality. An UPSIDE-DOWN CAMPFIRE burns with its flames pointing into the dirt, and a STREAM gurgles beside it. The MINERS' LOCKER stands behind you. Paths lead NORTH to a cheesy cave, EAST to a club den, WEST to a rickety SHACK, and SOUTH beneath the GREAT OAK." `desc` after extinction: replace the second sentence with "Cold ash surrounds a CYAN GEM beside the STREAM." `searchDesc` while burning: "Heat keeps you back from a hard shape in the ashes. The STREAM is close enough to fill a JUG; you could also risk your shoes on that fire." `searchDesc` after extinction: "The ashes give up the CYAN GEM. The STREAM continues to offer water." `highDesc`: none; hidden sight returns the appropriate `searchDesc`, never names the gem before the fire is out.
* `cheeseGrotto`, CHEESE GROTTO, exit SOUTH WAYLAMP CLEARING. `desc`: "The CHEESE GROTTO smells like a locker room built inside another locker room. DEMOGORGONZOLA squats beneath a shelf of stalactites, its closed face puckered like a flower bud. The only path leads SOUTH to the WAYLAMP." `searchDesc`: "The creature sniffs at your pockets. Its jaws snap on a falling pebble; a stain on the stone suggests anyone poking it will be gulped whole. It looks hungry for something even smellier than itself." `highDesc`: none.
* `avClubDen`, AV CLUB DEN, exits WEST WAYLAMP CLEARING, NORTH PLANETARIUM. `desc`: "A dusty AV CLUB DEN has three broken folding chairs, a heroic tangle of extension cords, and a CABINET RADIO the size of a disappointed refrigerator. Its dial points to a quiz show that refuses to end. WEST leads to the WAYLAMP; NORTH leads to a domed PLANETARIUM." `searchDesc`: "The CABINET RADIO has five numbered buttons and a door with a hidden hinge. The hinge can open only after the quiz is won." `highDesc`: none.
* `planetarium`, PLANETARIUM, exits SOUTH AV CLUB DEN, EAST MAP ROOM. `desc`: "A plain PLANETARIUM dome looms above a single brass PROJECTOR. The ceiling is marked with five groups of stars; one patch looks like a drain and another has scorched the plaster. SOUTH returns to the AV CLUB DEN; EAST opens into a MAP ROOM." `searchDesc`: "The PROJECTOR bears a number key and two safety sketches, a figure stretched into a noodle and another on fire. Bad selections can throw you to the FRONT GATE. If you arrive there burning, the GARDEN BRAZIER is one step EAST." `highDesc`: none.
* `mapRoom`, MAP ROOM, exit WEST PLANETARIUM. `desc`: "A tiny MAP ROOM is wallpapered in star charts with more confidence than scientific merit. A STELLAR MAP rests on a lectern. WEST returns to the PLANETARIUM." `searchDesc`: "The STELLAR MAP numbers five patterns in a fixed order. The brass projector next door asks only for a number." `highDesc`: none.
* `shack`, SHACK, exit EAST WAYLAMP CLEARING. `desc`: "A run-down SHACK leans against the trees. The ALPHABET WALL carries letters A through Z, each beneath a tiny bulb. A KID'S DRAWING hangs on the door, and the path EAST returns to the WAYLAMP." `searchDesc`: "The drawing has enough arrows to turn a single rude noise into a road map. The wall's bulbs twitch when someone spells on it; their colors mean nothing." `highDesc`: none.
* `oakUndercroft`, OAK UNDERCROFT, the lift stop `below`, exit NORTH WAYLAMP CLEARING. `desc` before alignment: "The OAK UNDERCROFT is a chamber hollowed among roots as thick as bridge cables. A LOWER PANEL holds three vertical slots beneath a dangling PLATFORM shaft. NORTH returns to the WAYLAMP CLEARING. The shaft continues UP, but no lift stops here yet." `desc` after alignment: replace the final sentence with "The shaft continues UP, and a PLATFORM now visits this BELOW stop." `searchDesc`: "The LOWER PANEL has TOP, MIDDLE, and BOTTOM slots. LOOK UP or WAIT to check the moving PLATFORM; ENTER PLATFORM only when it is here." `highDesc`: none. The BELOW room is reachable on foot from the beginning, even if neither panel has been aligned.
* `minersLocker`, MINERS' LOCKER, fixed, openable, not takeable, starts closed in `mineGallery`; `names`: "miners' locker", "miners locker", "locker", "wardrobe"; `desc`: "A dented MINERS' LOCKER stands where miners once hung their gear. The hinge bends farther inward than the back wall permits. It has a handle and no lock." Add this exact sentence to the existing MINING GALLERY `desc` after its rail description: "A dented MINERS' LOCKER stands against one timber support." Add to its `searchDesc`: "The LOCKER has a real handle, a hinge, and a draft that smells of wet trees." OPEN LOCKER: "The LOCKER swings open onto a lamplit forest instead of its own back wall. You can go IN." Reopen: "The LOCKER is already open." ENTER LOCKER, CLIMB IN LOCKER, GO IN, and bare IN from `mineGallery` while open enter `waylampClearing`; closed refusal: "The MINERS' LOCKER is shut. OPEN it first." First entry appends "The world folds around the hinge; you step into THE UPSIDE DOWN. (+20)" before the destination room description; later entries say "You duck through the locker into THE UPSIDE DOWN." without an award. OUT, GO OUT, LEAVE, or EXIT from `waylampClearing` returns to `mineGallery` with "You climb out through the MINERS' LOCKER into the MINING GALLERY." Closing the locker from inside never traps the player; OUT opens it inward. The existing DREADMAW route already controls access to the gallery; there is no second dragon gate.
* Realm discovery uses `awardProgress("realmDiscovered")` for +20 once, persisted as `progressAward:realmDiscovered`. `realm:discovered` is not a second award flag. Entering by named flight for the first time also awards discovery on arrival. `roomShortNames` and room aliases resolve flight in both directions, including OAK UNDERCROFT, without bypassing the LOWER PANEL's lift activation.

## Kitchen fridge and the DEMOGORGONZOLA

* Add to existing KITCHEN `desc`: "A rattling FRIDGE stands beside a MICROWAVE with a very small dial." Add to KITCHEN `searchDesc`: "The FRIDGE has a handle and no lock. The MICROWAVE has a dial marked only 1 · 100 · M · B · T." The dial has no units or clue here, elsewhere, or in Gary's hints.
* `fridge`, FRIDGE, `names`: "fridge", "refrigerator", "icebox"; fixed, openable, starts closed, contents the existing MILK, `milkJug`, and three cheeses. `roomDesc`: "A rattling FRIDGE holds court beside the MICROWAVE." `desc`: "A heavy FRIDGE with a loose handle and a motor that groans as if it knows what is inside." OPEN FRIDGE: "You open the FRIDGE. MILK, an EMPTY MILK JUG, LIMBURGER, ÉPOISSES, and MUNSTER greet you with four different levels of bad judgment." If a saved game has moved or consumed an item, list only the actual remaining contents. Closed TAKE refusal: "The FRIDGE is closed. OPEN it first." Reopen: "The FRIDGE is already open."
* `milkJug`, EMPTY MILK JUG, `names`: "jug", "milk jug", "empty milk jug", "water jug"; adjectives "empty", "milk", "water", "filled"; starts empty in FRIDGE, portable, non-heirloom. `roomDesc`: "An EMPTY MILK JUG waits in the FRIDGE." `desc` when empty: "A rinsed MILK JUG with a wide mouth and a handle built for hauling water. It is EMPTY." `desc` when filled: "The MILK JUG sloshes with fresh STREAM water. It can be POURED ON FIRE or POURED OUT." No BOTTLE alias. Its stream and fire behavior is specified below.
* `limburgerCheese`, LIMBURGER, `names`: "limburger", "limburger cheese"; portable, starts in FRIDGE. `roomDesc`: "A square of LIMBURGER sulks behind the milk." `desc`: "LIMBURGER smells like a gym sock that died in a hot car; your eyes water through the fridge door."
* `epoissesCheese`, ÉPOISSES, `names`: "époisses", "epoisses", "époisses cheese", "epoisses cheese"; portable, starts in FRIDGE. `roomDesc`: "A box of ÉPOISSES threatens to leak through the shelf." `desc`: "ÉPOISSES oozes out of its box like it is trying to escape, and smells like a sweaty armpit's armpit."
* `munsterCheese`, MUNSTER, `names`: "munster", "munster cheese"; portable, starts in FRIDGE. `roomDesc`: "A wedge of MUNSTER makes the fridge light blink." `desc`: "MUNSTER is so rank the fridge light flickers; it smells like a locker room hug from the whole football team."
* TAKE CHEESE without a specific cheese while several are visible: "Which CHEESE? Try LIMBURGER, ÉPOISSES, or MUNSTER." EAT any of these cheeses: "This is food for something with a larger digestive tract and worse manners. You leave the CHEESE intact." Do not destroy cheese except when successfully feeding it. Save migration supplies the new FRIDGE, JUG, and all three cheeses to older saves without moving MILK already in inventory, already deposited elsewhere, or already drunk.
* `demogorgonzola`, DEMOGORGONZOLA, `names`: "demogorgonzola", "monster", "cheese monster", "creature"; fixed in CHEESE GROTTO. `roomDesc`: "DEMOGORGONZOLA waits with its face closed like a fistful of petals." `desc`: "A hungry cheese monster with a face that opens like a flower. Its nose follows anything stinky; its jaws have already swallowed an entire explorer's boot. Poke or attack it and it will gulp you down and cough you up at the FRONT GATE, possessions and all." Safe inspection verbs: LOOK around the room, LOOK AT or EXAMINE DEMOGORGONZOLA, and SMELL DEMOGORGONZOLA. SEARCH DEMOGORGONZOLA is also safe because the existing parser maps targeted SEARCH to EXAMINE. SMELL returns "It smells your pockets before you finish smelling it. Three distinct cheese odors seem to interest it."
* Successful grammar: GIVE or OFFER or FEED <LIMBURGER|ÉPOISSES|MUNSTER> TO <DEMOGORGONZOLA|MONSTER|CREATURE|CHEESE MONSTER>; in the grotto, GIVE or FEED <cheese> with no target also uses the only monster. The cheese must be carried; otherwise "Bring the CHEESE here in your own hands first." Each distinct cheese is consumed once, in any order. For the first two, return "DEMOGORGONZOLA gulps down the {CHEESE}. One face-petal unfolds. ({N}/3)" with the actual name and count. Already fed cheese: "That cheese is already in its stomach. The beast wants a different stink." Non-cheese gifts and every physical or directed social interaction, including ATTACK, FIGHT, TOUCH, KICK, TAKE, PUSH, PULL, MOVE, TALK TO, SAY TO, USE ON, BURN, and THROW AT DEMOGORGONZOLA, swallow; LOOK, EXAMINE, and SMELL do not. A failed gift is not consumed.
* The third distinct cheese sets `realm:demoFed`, grants `awardProgress("demoFed")` +10 once (`progressAward:demoFed`), and puts `demogorgonzolaRind` on the grotto floor. Success: "The last cheese disappears. DEMOGORGONZOLA'S face opens petal by petal like a ghastly flower; it spits out a DEMOGORGONZOLA RIND, bows with its entire throat, and waits for more. (+10)" Refeeding after success: "All three cheeses have done their work. The RIND is on the grotto floor." The monster remains dangerous if poked.
* Swallow/ejection text for every unsafe interaction: "You have been warned about those jaws. DEMOGORGONZOLA opens like a flower made of bad decisions, swallows you whole, and coughs you out at the FRONT GATE. You keep every possession, including anything you tried to give it. You do not keep your dignity." Move to `gate` with inventory, equipment, puzzle flags, and score unchanged; do not kill the player or remove an offered item. The warning is visible in both the grotto `searchDesc` and the creature `desc` before any unsafe verb.
* `demogorgonzolaRind`, DEMOGORGONZOLA RIND, `names`: "demogorgonzola rind", "rind", "cheese rind"; portable heirloom, appears only after feeding, deposit 15. `roomDesc`: "A DEMOGORGONZOLA RIND lies where the creature spat it." `desc`: "A stiff, many-lobed cheese RIND that smells of three lunches arguing over custody. A tiny BM stamp marks it as an heirloom." USE RIND: "You brandish the RIND. DEMOGORGONZOLA hiccups from somewhere very far away." plus normal first-time use award. TAKE before feeding: "There is no RIND on the floor yet."
* Gary hint lines, selected by topic and room: FRIDGE, "That FRIDGE in the KITCHEN smells like a packed gym bag. TAKE three different stinky cheeses before you go caving."; DEMOGORGONZOLA, "LOOK or SMELL, but do not touch the thing. FEED it LIMBURGER, ÉPOISSES, and MUNSTER in any order."; RIND, "When its face opens, check the CHEESE GROTTO floor for the RIND."

## Cabinet radio quiz

* `cabinetRadio`, CABINET RADIO, `names`: "cabinet radio", "radio cabinet", "radio", "cabinet"; fixed in AV CLUB DEN. `roomDesc`: "A massive CABINET RADIO waits beneath a tangle of cords." `desc`: "The CABINET RADIO has five numbered buttons and a door whose hinge points inward. A faded card reads: THREE RIGHT IN A ROW. Turn it ON or LISTEN for a clue." Before winning, cabinet cannot be OPENed by force: "The cabinet door stays shut. It will swing open after three right answers in a row." Repeated start while a round is active redisplays the current clue and options without rerolling.
* Start grammar: TURN ON RADIO, TURN ON CABINET RADIO, LISTEN TO RADIO, LISTEN TO CABINET RADIO, LISTEN RADIO, or USE CABINET RADIO. A round prints exactly "The CABINET RADIO coughs awake.\nCLUE: {original clue}\n1. {title}\n2. {title}\n3. {title}\n4. {title}\n5. {title}\nANSWER 1 TO 5 or SAY the full song title. Correct in a row: {streak}/3." Each brace placeholder is replaced by the current round's value; each list position holds one unique actual title.
* Input grammar while a round is active: ANSWER <1|2|3|4|5>, SAY <1|2|3|4|5>, or SAY "<listed title>" with optional quotes. Canonical verb is SAY for ANSWER. Title matching is Unicode case-folded, NFKD accent-insensitive, punctuation-insensitive, whitespace-collapsed, and drops standalone articles A, AN, THE on both sides to tolerate the existing parser; full remaining title words and digits must match a displayed option. No prefix, partial title, artist name, lyric, or title not among the five counts. Invalid number: "Pick a number from 1 to 5; the clue hasn't changed." Unlisted or incomplete title: "That is not one of the five full song titles. The clue stays put." Missing answer: "ANSWER 1 TO 5 or SAY a listed song title." None consumes an attempt or rerolls; the command still consumes the normal game turn.
* Draw exactly one answer song from the twenty-song catalog below, one of its five clue lines, and four distinct distractor titles without replacement from the other nineteen. Put all five in a uniformly shuffled numbered order; exactly one is correct. Draw a new answer after each valid attempt and forbid an immediately repeated answer song; no other history exclusion. The persisted `realm:radioSeed` is the current unsigned 32-bit PRNG state; advance with `seed = (1664525 * seed + 1013904223) >>> 0`, then choose index `seed % candidateCount`, advancing once per choice. Initialize an unset seed to a random unsigned 32-bit value once and persist it; a test fixture may set it to a known value. Persist `realm:radioRound` with song index, clue index, five option indices, and correct option; persist `realm:radioStreak` in 0 through 2 and `realm:radioPreviousSong`. Save and restore never reroll an active round or reset its streak.
* Correct, before the third: "Correct. The CABINET RADIO applauds itself with a tinny drum roll. Streak: {N}/3." Then print the next round. Wrong valid option: "Wrong. The CABINET RADIO plays {chosen title} back in a cracking falsetto without getting through a single note. Streak: 0/3." Set `realm:radioStreak` to zero, then print the next round; do not print or sing lyrics. Off or no active round: "Turn on the CABINET RADIO or LISTEN first."
* Third consecutive correct answer sets `realm:radioWon`, awards `awardProgress("radioWon")` +10 once (`progressAward:radioWon`), opens the cabinet, and reveals `portableTransistorRadio`: "Three in a row! The CABINET RADIO rattles like a locker full of angry spoons. Its door swings wide, revealing a PORTABLE TRANSISTOR RADIO in a scuffed leather case. (+10)" Later answers and starts: "The cabinet has already opened. The PORTABLE TRANSISTOR RADIO is yours to take." No new rounds or award after winning.
* `portableTransistorRadio`, PORTABLE TRANSISTOR RADIO, `names`: "portable transistor radio", "transistor radio", "portable radio", "transistor"; portable, battery powered heirloom, inside cabinet until victory, deposit 15. `roomDesc`: "A PORTABLE TRANSISTOR RADIO rests inside the opened cabinet." `desc`: "A battery-powered PORTABLE TRANSISTOR RADIO in a scuffed leather case, with a strap and a telescoping antenna. A small BM stamp sits beneath the tuning knob." LISTEN TO or USE TRANSISTOR RADIO: "The TRANSISTOR RADIO crackles, catches one cheerful drum hit, and loses the station. No quiz follows." plus normal first-time use award. TAKE before winning: "The cabinet door hides whatever is inside."
* Gary hint lines: CABINET RADIO, "TURN ON or LISTEN TO the CABINET RADIO, then ANSWER with a number from 1 to 5 or SAY a full listed title."; quiz, "Get three right without a miss. A wrong answer puts your streak back at zero; remember the clue, not any song lyric."; transistor, "The cabinet swings open after three correct answers. TAKE the smaller RADIO inside."

## Radio song catalog

The following twenty titles are real songs from the 1980s. Only each title and one of its five original clue lines appear in a round; numbers and clues below are authoring indices, not answer positions. Clues describe situations literally and never quote or closely rewrite lyrics.

* "Take On Me":
  * Clue 1: "A nervous stranger tries to schedule romance before the calendar bites him."
  * Clue 2: "He cannot explain the plan, so he offers himself as both plan and warning label."
  * Clue 3: "A woman gets a very short window to decide whether an awkward suitor is worth the risk."
  * Clue 4: "The narrator admits his social skills need repairs but asks for a first date anyway."
  * Clue 5: "Two people negotiate whether a future together is worth one gloriously clumsy leap."
* "Eye of the Tiger":
  * Clue 1: "A bruised boxer returns to work because apparently his workplace is another boxing ring."
  * Clue 2: "An old opponent discovers that losing only made the fighter buy an earlier alarm clock."
  * Clue 3: "The contender describes survival as a training program with almost no days off."
  * Clue 4: "One determined athlete walks back into a fight holding a very suspicious amount of focus."
  * Clue 5: "A person compares competitive grit to the intense stare of a striped predator."
* "Every Breath You Take":
  * Clue 1: "A man with a clipboard mistakes a breakup for permission to audit somebody's schedule."
  * Clue 2: "The ex appoints himself chief inspector of absolutely everything the other person does."
  * Clue 3: "A romantic speech slowly reveals itself to be an unlicensed surveillance operation."
  * Clue 4: "Someone describes devotion by listing the hours he should have spent minding his business."
  * Clue 5: "An imaginary security camera follows an unwilling subject all the way through lunch."
* "Total Eclipse of the Heart":
  * Clue 1: "A heartbroken person reports that the lights in her entire emotional solar system have failed."
  * Clue 2: "The relationship's weather forecast is darkness with a chance of even more darkness."
  * Clue 3: "She wants an old flame to return before the sun files for permanent leave."
  * Clue 4: "A breakup grows so dramatic that an astronomer could use it to block daylight."
  * Clue 5: "Two lovers lose their bearings while one of their metaphorical planets eats the lamp."
* "Sweet Dreams (Are Made of This)":
  * Clue 1: "A traveler canvasses the world for a useful dream and finds an alarming selection of people."
  * Clue 2: "The narrator tries to classify ambition, then discovers that everybody shops for something different."
  * Clue 3: "An expedition in search of a decent night's fantasy somehow becomes a sociology survey."
  * Clue 4: "Some strangers exploit each other while the traveler keeps taking very bleak notes."
  * Clue 5: "A sleeper wants to know what dreams contain and receives a suspiciously global answer."
* "Girls Just Want to Have Fun":
  * Clue 1: "A young woman arrives home late and fields a parental inquiry about her social calendar."
  * Clue 2: "Her dad treats dancing with friends as a moral emergency; she requests a reasonable weekend."
  * Clue 3: "A group of women proposes that enjoying a night out should not require a permit."
  * Clue 4: "The narrator's main demand is recreation, not a debate with the household committee."
  * Clue 5: "A curfew meets a dance floor and receives a polite but enthusiastic rejection."
* "Billie Jean":
  * Clue 1: "A dancer meets a persuasive stranger and suddenly needs a lawyer specializing in paternity."
  * Clue 2: "A woman names a child's father; the accused narrator requests another round of evidence."
  * Clue 3: "One dance at a club turns into a family-tree argument nobody can settle by moonwalking."
  * Clue 4: "The speaker insists a public claim about his parenthood has been badly misfiled."
  * Clue 5: "A glamorous visitor carries an accusation more durable than the dance floor."
* "Beat It":
  * Clue 1: "Two street gangs prepare for a showdown; the sensible advice is to leave the postcode."
  * Clue 2: "A fight invitation arrives, and the narrator recommends the opposite of accepting it."
  * Clue 3: "A threatened person chooses an exit route over a fistful of very poor prizes."
  * Clue 4: "The proposed solution to neighborhood violence involves making oneself scarce with confidence."
  * Clue 5: "A bad guy wants a duel, but the speaker treats retreat as an Olympic event."
* "Thriller":
  * Clue 1: "A movie date goes wrong when the monster count becomes difficult to keep on one hand."
  * Clue 2: "Midnight brings suspicious noises, and the narrator keeps offering commentary instead of a taxi."
  * Clue 3: "A frightened companion learns that the horror show has apparently spilled into the street."
  * Clue 4: "The undead stage a surprise appearance while two living people negotiate who hides behind whom."
  * Clue 5: "A romantic evening is interrupted by teeth, shadows, and spectacularly bad costume choices."
* "Like a Virgin":
  * Clue 1: "A new romance makes somebody feel as if her battered heart has just left its packaging."
  * Clue 2: "She compares emotional recovery to starting a relationship with a brand-new instruction manual."
  * Clue 3: "The narrator has loved before but now describes a surprisingly fresh emotional reset."
  * Clue 4: "One attentive partner turns yesterday's complicated history into a very nervous first day."
  * Clue 5: "A person with plenty of experience suddenly feels unreasonably new to affection."
* "Material Girl":
  * Clue 1: "A suitor submits flowers; the narrator asks to see his financial references."
  * Clue 2: "One woman's dating criteria include jewelry, comfort, and a very sturdy wallet."
  * Clue 3: "Romance is treated like a shopping trip whose cashier refuses promises."
  * Clue 4: "A young woman inspects a world of luxury and decides the receipts are the interesting part."
  * Clue 5: "Attention without gifts gets politely sent to the back of the line."
* "Careless Whisper":
  * Clue 1: "A guilty dancer discovers that the ballroom floor has excellent memory for betrayal."
  * Clue 2: "Someone confesses a secret while a lonely saxophone appears to file the paperwork."
  * Clue 3: "Two partners share one last dance and a truly ruinous amount of unspoken information."
  * Clue 4: "A mistake in private becomes impossible to ignore when the music turns slow."
  * Clue 5: "The narrator blames his own loose tongue for the saddest dance invitation in town."
* "Never Gonna Give You Up":
  * Clue 1: "A very earnest man presents a lifetime warranty for his behavior toward one person."
  * Clue 2: "Every possible relationship failure is met with another emphatic promise not to do it."
  * Clue 3: "A suitor talks like a customer-service department that somehow means every guarantee."
  * Clue 4: "The narrator repeats his commitment so often that the contract needs a stapler."
  * Clue 5: "Somebody tries to prove loyalty with an itemized list of betrayals he refuses to commit."
* "Livin' on a Prayer":
  * Clue 1: "An out-of-work dockhand and a weary waitress try to build a future from very small paychecks."
  * Clue 2: "A couple audits their empty pockets and votes to keep hoping anyway."
  * Clue 3: "His guitar and her diner shifts are asked to fund a plan that badly needs investors."
  * Clue 4: "Two exhausted workers turn mutual stubbornness into the world's least secure savings account."
  * Clue 5: "A romance balances on hope while the household budget loudly requests a parachute."
* "Don't Stop Believin'":
  * Clue 1: "A few lonely travelers share a train and the idea that their lives might improve."
  * Clue 2: "Strangers gather under city lights, each carrying a different unfinished future."
  * Clue 3: "One passenger buys a ticket into a night full of other people's hopeful mistakes."
  * Clue 4: "The narrator watches people meet at an hour when nearly everyone should be asleep."
  * Clue 5: "A platform fills with dreamers who refuse to let the timetable decide their fate."
* "Footloose":
  * Clue 1: "A town regulates dancing so strictly that one teenager's shoes become political."
  * Clue 2: "The narrator responds to a no-dancing rule by assembling a very enthusiastic floor."
  * Clue 3: "A restless youngster wants to move his feet without asking the municipal council."
  * Clue 4: "The local authorities have confused a dance party with a public safety crisis."
  * Clue 5: "A pair of feet files for freedom from a town that seems allergic to rhythm."
* "Danger Zone":
  * Clue 1: "A pilot insists that the riskiest part of the sky deserves a return visit."
  * Clue 2: "The cockpit's warning lights become an oddly persuasive travel brochure."
  * Clue 3: "A fighter plane heads toward a place sensible air-traffic controllers avoid."
  * Clue 4: "One aviator describes a hazardous flight as though it were a desirable neighborhood."
  * Clue 5: "The narrator straps into a jet and treats enormous personal risk as a destination."
* "Africa":
  * Clue 1: "A traveler listens to faraway drums while trying to understand why the weather matters so much."
  * Clue 2: "A continent becomes the backdrop for a man's extremely elaborate internal travel diary."
  * Clue 3: "The narrator juggles a flight, a romance, and a rain cloud with suspiciously ceremonial timing."
  * Clue 4: "Someone surveys distant mountains and concludes that the journey is more personal than the map."
  * Clue 5: "A traveler hears a whole landscape calling and wonders whether his baggage is emotional."
* "Walk Like an Egyptian":
  * Clue 1: "Commuters begin posing like ancient wall paintings and somehow call it a dance."
  * Clue 2: "A line of people copies stiff museum poses instead of asking the curator for help."
  * Clue 3: "A movement instructor studies old stone figures and accidentally starts a fad."
  * Clue 4: "Everyone from street performers to office workers tries the same sideways historical strut."
  * Clue 5: "The dancers appear to have confused archaeology with a group fitness class."
* "99 Red Balloons":
  * Clue 1: "A crowd releases party decorations; the military interprets them as a very small invasion."
  * Clue 2: "A batch of floating toys triggers a geopolitical response that cannot be returned for a refund."
  * Clue 3: "A radar operator mistakes cheerful rubber spheres for an emergency worth mobilizing."
  * Clue 4: "The sky fills with birthday debris and the generals immediately choose the least birthday-like option."
  * Clue 5: "An innocent balloon launch escalates into a war with a truly embarrassing incident report."

## Planetarium and fixed constellation index

* `projector`, PROJECTOR, `names`: "projector", "brass projector", "star projector"; fixed in PLANETARIUM. `roomDesc`: "A brass PROJECTOR points at the dome." `desc`: "The PROJECTOR has five numbered positions and asks only for a number from 1 to 5. On its housing, a stick figure is drawn thin as a noodle beside another figure outlined in scorch marks. BAD CHOICES SEND YOU TO THE FRONT GATE; the GARDEN BRAZIER is one step EAST of that gate." LOOK, EXAMINE, USE, or START PROJECTOR always says "The PROJECTOR asks: Choose a number from 1 to 5." The prompt and all five outcomes remain available after the eyepiece drops.
* `stellarMap`, STELLAR MAP, `names`: "stellar map", "star map", "chart", "map"; portable heirloom in MAP ROOM, deposit 10. `roomDesc`: "A STELLAR MAP rests on the lectern." `desc`: "A folded STELLAR MAP inked with five labeled patterns and their numbers. A BM seal sits beneath a grease mark shaped like a thumb." READ STELLAR MAP prints exactly "STELLAR MAP\n1 BIG DIPPER OF RANCH\n2 BLACK BUNGHOLE\n3 ORION'S WEDGIE\n4 SERIOUS-SIRIUS\n5 URANUS MAJOR" plus the normal first-time use award. These fixed numbers are alphabetical by pattern name. No astronomy explanation appears in game.
* Selection grammar in PLANETARIUM: SAY <1..5>, ANSWER <1..5>, SET PROJECTOR TO <1..5>, TURN PROJECTOR TO <1..5>, or USE PROJECTOR WITH <1..5>; bare numerals use the existing CODE parser route and are accepted as an additional convenience only in this room. Out of range or nonnumeric: "The PROJECTOR asks for one number from 1 to 5." For every valid selection the PROJECTOR still asks the same fixed question on its next interaction; never remove a number.
* 1 BIG DIPPER OF RANCH, safe dome text: "The dome draws a giant ladle over a tiny celery moon. Somehow the stars manage to look refrigerated." 3 ORION'S WEDGIE, safe dome text: "A celestial belt rides much too high. Orion reaches behind himself and discovers that the universe has no mercy." 5 URANUS MAJOR, safe dome text: "A huge backside constellation rises over the horizon. The brass projector clears its throat in a way that sounds like a snicker." Each of these three returns its own text on every selection.
* The first selection of 1, 3, or 5 also sets `realm:eyepieceDropped`, awards `awardProgress("eyepieceDropped")` +10 once (`progressAward:eyepieceDropped`), and appends "A hatch in the PROJECTOR clicks open. A GOLD EYEPIECE rolls across the floor. (+10)" Subsequent safe selections append "The projector hatch is empty." The GOLD EYEPIECE is not consumed or duplicated by selecting another number.
* 2 BLACK BUNGHOLE, ejection dome text: "A starless ring unfolds at the dome's center. Your arms, legs, and dignity stretch into one spectacular noodle; the ring slurps you through and spits you out at the FRONT GATE. Your possessions arrive with you, properly unstretched." Move to `gate`; retain inventory, score, and existing puzzle flags; no fire or death.
* 4 SERIOUS-SIRIUS, burning ejection dome text: "A furious white star flares. Its heat lights your clothes like a badly planned torch and hurls you through the dome. You hit the FRONT GATE still ON FIRE with all your possessions. The GARDEN BRAZIER is one step EAST; move before the existing burn timer wins." Move to `gate`, set `onFire: true`, reset `burnTurns: 0`, preserve inventory, and use the existing body-fire countdown and BRAZIER award +30, never a new burn rule or award. The dome's drain and scorch marks, projector sketches, and preselection garden directions foreshadow both punishments.
* `goldEyepiece`, GOLD EYEPIECE, `names`: "gold eyepiece", "eyepiece", "brass ocular"; portable heirloom, spawned on PLANETARIUM floor after a safe selection, deposit 15. `roomDesc`: "A GOLD EYEPIECE gleams beside the PROJECTOR." `desc`: "A gold-rimmed EYEPIECE engraved BM. Held to an eye, it makes an ordinary thumbprint look like a small greasy planet." USE or LOOK THROUGH EYEPIECE: "You peer through the EYEPIECE. Your own fingerprint looms like a planetary system of questionable hygiene." plus normal first-time use award. Before drop: "The PROJECTOR hatch is still shut."
* Gary hint lines: PROJECTOR, "The brass PROJECTOR accepts only numbers 1 to 5. READ the STELLAR MAP next door before you pick one."; STELLAR MAP, "The STELLAR MAP in the MAP ROOM fixes the order. The dome's drain and scorch marks warn that not every number is kind."; EYEPIECE, "A safe constellation can shake an EYEPIECE out of the projector. The first safe choice is enough."; burning escape, "If the dome sends you to the FRONT GATE on fire, go EAST and LIGHT the GARDEN BRAZIER before you burn out."

## Shack alphabet wall

* `alphabetWall`, ALPHABET WALL, `names`: "alphabet wall", "wall", "letters", "bulbs"; fixed in SHACK. `roomDesc`: "The ALPHABET WALL has a tiny bulb under each letter." `desc`: "Letters A through Z are painted on the ALPHABET WALL, one bulb per letter. No bulb color matters; the door's KID'S DRAWING is the clue." SPELLED words are keyed as whole words; no color sequence or holiday motif exists.
* `kidsDrawing`, KID'S DRAWING, `names`: "kid's drawing", "kids drawing", "drawing", "picture"; portable heirloom hanging on the SHACK door, deposit 10. `roomDesc`: "A KID'S DRAWING hangs on the door." `desc`: "A crayon picture shows DEMOGORGONZOLA farting. At least nineteen arrows point at the fart, with one extra arrow pointing at an arrow. A small BM signature is squeezed into a corner." READ or USE DRAWING: "There are no written words. The arrows all accuse the same enormous fart." plus normal first-time use award. It can be taken before solving the wall.
* Accepted grammar: SPELL <word>, TYPE <word>, SPELL <word> ON WALL, TYPE <word> ON ALPHABET WALL, or SPELL <space-separated single letters> while inside the SHACK. Strip spaces between single letters and casefold; accept exactly FART, STINK, or CHEESE, one whole word per attempt. SAY FART is speech, not spelling. Blank attempt: "Spell what on the ALPHABET WALL?" Incorrect word: "The bulbs blink through your word, make a rude raspberry, and go dark. Try another word." No item or award on rejection.
* First accepted word sets `realm:shackSpelled`, awards `awardProgress("shackSpelled")` +10 once (`progressAward:shackSpelled`), and drops `purpleCrayon` on the SHACK floor. Success: "The bulbs spell {WORD} back at you. The wall hiccups and spits out a PURPLE CRAYON with a tiny BM stamped on its wrapper. (+10)" Repeat accepted word after victory: "The wall gives one sleepy blink. It has no second CRAYON." The KID'S DRAWING remains independently takeable.
* `purpleCrayon`, PURPLE CRAYON, `names`: "purple crayon", "crayon", "wax stick"; portable heirloom, deposit 15. `roomDesc`: "A PURPLE CRAYON lies where the wall spat it." `desc`: "A slightly chewed PURPLE CRAYON in a paper wrapper stamped BM. Its tip is shaped like a very small guilty finger." USE CRAYON: "You sketch a heroic butt, sign it anonymously, and tuck the PURPLE CRAYON away." plus normal first-time use award. Before success: "The wall has not spat out a CRAYON yet."
* Gary hint lines: ALPHABET WALL, "Those bulbs answer to SPELL, not SAY. Look closely at the KID'S DRAWING on the door."; KID'S DRAWING, "All those arrows point to a fart. FART, STINK, or CHEESE will do the trick."; PURPLE CRAYON, "When the wall spits out a CRAYON, remember to TAKE it. The drawing is an heirloom too."

## Campfire and lower panel

* Extinguish the UPSIDE-DOWN CAMPFIRE to uncover the CYAN GEM. The LOWER PANEL starts MAGENTA top, empty middle, YELLOW bottom; its solution is YELLOW top, MAGENTA middle, CYAN bottom.

## Manor puzzles and shared high

* The BLACKWOOD DIAMOND comes from a single lump of PARLOR COAL in the KITCHEN MICROWAVE set to B. The SILVER WEATHERCOCK, SNUFFBOX, BARONESS PHOTOGRAPH, and CORKSCREW complete the quintet.
* Fresh and dried mushrooms, snuff, and wine start one shared high with source-specific openings and a twelve-line cycling reaction pool; HUD indication remains 🍄.

## Scores and decisions

* All awards come exclusively from master Section 8, once per persisted award flag. Master Section 13 decisions D1 through D37 are resolved; their exact final values are recorded below as the contract is completed.

<!-- end 2026-11-07_info_UpsideDownAndDoomsdayClockCanon.md -->
