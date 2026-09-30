# manor-adventure.feature. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-21.107:acoven.

@walkthrough
Feature: Blackwood Manor adventure
  The complete mansion must remain solvable while its deliberate death traps,
  inspection clues and alternate movement phrases keep working.

  Background:
    Given a fresh manor game

  Scenario: Complete the manor and leave through the opened front door
    When I play this command sequence:
      """
      east
      search statue
      take iron key
      west
      north
      unlock door with iron key
      open door
      north
      west
      take candle
      south
      take matches
      take rope
      take apple
      light candle
      eat burrito
      wait
      wait
      wait
      wait
      drink milk
      open cellar
      down
      take decanter
      up
      north
      east
      put decanter in reliquary
      south
      south
      west
      west
      south
      offer apple to dragon
      east
      east
      wear headlamp
      down
      take backpack
      east
      say lore to troll
      east
      take family crest
      take winged shoes
      wear winged shoes
      west
      west
      up
      west
      west
      north
      east
      east
      north
      north
      put family crest in reliquary
      drop doubloon
      south
      south
      east
      light self on fire
      light brazier
      take emerald gem
      east
      east
      take ruby gem
      take sapphire gem
      put ruby gem in top slot
      put emerald gem in middle slot
      put sapphire gem in bottom slot
      enter platform
      wait
      take spyglass
      wait
      enter platform
      wait
      west
      west
      enter well
      take ancient coin
      west
      north
      north
      put ancient coin in reliquary
      put spyglass in reliquary
      drop rope
      up
      south
      read diary
      open desk drawer
      wear watch
      north
      north
      examine mirror
      take shard
      open drawer
      take family ring
      south
      west
      pull wallpaper
      in
      take hammer
      out
      put hammer in reliquary
      west
      put shard in candelabra
      put candle in candelabra
      take candelabra
      east
      up
      west
      open music box
      take tiny key
      take music box
      east
      east
      unlock jewelry box with tiny key
      open jewelry box
      take ravenblood ring
      west
      pull cord
      drop music box
      drop ravenblood ring
      drop wrapper
      up
      take miniature
      up
      east
      pull bell rope
      take xray goggles
      wear xray goggles
      west
      down
      down
      take music box
      take ravenblood ring
      down
      put music box in reliquary
      put ravenblood ring in reliquary
      put family ring in reliquary
      put miniature in reliquary
      east
      move painting
      open safe
      take talisman
      wear talisman
      south
      pull lever
      down
      take grimoire
      up
      north
      west
      put grimoire in reliquary
      west
      south
      down
      south
      take locket
      north
      up
      north
      east
      put locket in reliquary
      remove talisman
      put talisman in reliquary
      put candelabra in reliquary
      close reliquary
      open bell closet
      pull bell rope
      south
      """
    Then the game is won
    And the game score is 460
    And the player rank contains "Master of Blackwood Manor"

  Scenario: Entering the well without a rope is fatal
    When I play until death:
      """
      east
      enter well
      """
    Then the game is dead

  Scenario: Entering the crypt without the talisman is fatal
    When I play until death:
      """
      east
      search statue
      take iron key
      west
      north
      unlock door with iron key
      open door
      north
      west
      take candle
      south
      take matches
      light candle
      open cellar
      down
      south
      """
    Then the game is dead

  Scenario: Climbing to the attic while overloaded is fatal
    When I play until death:
      """
      east
      search statue
      take iron key
      west
      north
      unlock door with iron key
      open door
      north
      west
      take candle
      south
      take rope
      take apple
      north
      east
      up
      pull cord
      up
      """
    Then the game is dead

  Scenario: Going down reaches the garden well
    When I send "east"
    And I send "down"
    Then the output matches "well|fall|plunge|dry"
    And the game is dead

  Scenario Outline: Entering the open front door walks into the house
    Given the player is in room "porch"
    And item "frontKey" is carried
    When I send "unlock door with iron key"
    And I send "open door"
    And I send "enter <target>"
    Then the current room is "grandHall"

    Examples:
      | target  |
      | door    |
      | house   |
      | manor   |
      | mansion |

  Scenario: IN with an object is ENTER with that object
    Given the player is in room "porch"
    And item "frontKey" is carried
    When I send "in door"
    Then the output contains "(unlock FRONT DOOR with IRON KEY; open FRONT DOOR; enter FRONT DOOR)"
    And the current room is "grandHall"

  Scenario: Opening a locked door with its key derives unlock then open
    Given the player is in room "porch"
    And item "frontKey" is carried
    When I send "o frontd w/iron"
    Then the output contains "(open FRONT DOOR with IRON KEY)"
    And item "frontDoor" is open
    And item "frontKey" is destroyed
    And the current room is "porch"

  Scenario: The tiny key is consumed by the jewelry-box lock
    Given the player is in room "masterBedroom"
    And item "tinyKey" is carried
    When I send "unlock jewelry box with tiny key"
    Then item "jewelryBox" is unlocked
    And item "tinyKey" is destroyed
    And the output contains "disappears into the jewelry box"

  Scenario: GO DOOR infers ENTER and derives the required door actions
    Given the player is in room "porch"
    And item "frontKey" is carried
    When I send "go door"
    Then the output contains "(unlock FRONT DOOR with IRON KEY; open FRONT DOOR; enter FRONT DOOR)"
    And item "frontDoor" is open
    And the current room is "grandHall"

  Scenario: IN derives unlock, open, and enter for a carried door key
    Given the player is in room "porch"
    And item "frontKey" is carried
    When I send "in"
    Then the output contains "(unlock FRONT DOOR with IRON KEY; open FRONT DOOR; enter FRONT DOOR)"
    And the current room is "grandHall"
    When I send "out"
    Then the current room is "porch"

  Scenario Outline: LEAVE and EXIT use the room's OUT route
    Given the player is in room "grandHall"
    When I send "<command>"
    Then the current room is "porch"

    Examples:
      | command |
      | leave   |
      | exit    |

  Scenario: Every room explicitly tracks IN and OUT behavior
    Then every manor room declares implicit IN and OUT routing

  Scenario: Entering the cellar door descends through it
    Given the player is in room "kitchen"
    When I send "open cellar"
    And I send "enter cellar door"
    Then the current room is "wineCellar"

  Scenario: Direction summaries show visible exits without spoiling hidden routes
    Given the player is in room "porch"
    When I send "look"
    Then the output contains line "Directions you can go: north, south"
    Given item "frontKey" is carried
    When I send "unlock door with iron key"
    And I send "open door"
    And I send "look"
    Then the output contains line "Directions you can go: north, south"
    Given a fresh manor game
    And the player is in room "garden"
    When I send "look"
    Then the output contains line "Directions you can go: east, west, down"

  Scenario: Hidden directions join the list as soon as they are revealed
    Given the player is in room "library"
    When I send "look"
    Then the output contains line "Directions you can go: north"
    When I send "pull lever"
    And I send "look"
    Then the output contains line "Directions you can go: north, down"
    Given a fresh manor game
    And the player is in room "grandHall"
    When I send "look"
    Then the output does not contain line "Directions you can go: east, south, west, up, down"
    And every treasure but the "familyCrest" is already in the reliquary
    And item "familyCrest" is carried
    When I send "put family crest in reliquary"
    And I send "close reliquary"
    And I send "open bell closet"
    And I send "pull bell rope"
    And I send "look"
    Then the output contains line "Directions you can go: east, south, west, up, down"

  Scenario: Handler-driven directions appear when available
    Given the player is in room "landing"
    When I send "look"
    Then the output does not contain line "Directions you can go: north, east, south, west, up, down"
    When I send "pull cord"
    And I send "look"
    Then the output contains line "Directions you can go: north, east, south, west, up, down"

  Scenario: Pulling the prepared closet rope creates the clock without ending the game
    Given the player is in room "grandHall"
    And every treasure but the "familyCrest" is already in the reliquary
    When I send "put family crest in reliquary"
    And I send "close reliquary"
    And I send "open bell closet"
    And I send "pull bell rope"
    And I send "examine reliquary"
    Then the output contains "COUNTDOWN CLOCK"
    And the game is not won
    And item "clockTalisman" is in "reliquary"

  Scenario: The prepared closet rope remains inert until the reliquary is closed
    Given the player is in room "grandHall"
    And every treasure but the "familyCrest" is already in the reliquary
    When I send "put family crest in reliquary"
    And I send "open bell closet"
    And I send "open reliquary"
    And I send "pull bell rope"
    Then the output contains "CLOSE the doors first"
    And flag "bellRung" is unset
    And item "clockTalisman" is in "__void"
    When I send "close reliquary"
    And I send "pull bell rope"
    Then flag "bellRung" is set
    And item "clockTalisman" is in "reliquary"

  Scenario: Reading a nearby diary implicitly gets it first
    Given the player is in room "study"
    When I send "read diary"
    Then the output contains "(get LEATHER DIARY; read LEATHER DIARY)"
    And item "diary" is in "inventory"
    And flag "knowsCombo" is true

  Scenario: The Ravenblood Ring is visibly a family heirloom
    Given item "rubyRing" is carried
    When I send "examine ruby ring"
    Then the output contains "RAVENBLOOD RING"
    Then the output contains "BM"
    And the output contains "Blackwood family heirloom"

  Scenario: A known safe code can be typed without reading the diary
    Given the player is in room "parlor"
    When I send "move painting"
    And I send "open safe"
    Then the output contains "type it now"
    And flag "knowsCombo" is unset
    When I send "7 3 9"
    Then the output contains "safe clicks open"
    And item "safe" is open

  Scenario: A safe code can be supplied inline
    Given the player is in room "parlor"
    When I send "move painting"
    And I send "open safe with 7 3 9"
    Then the output contains "safe clicks open"
    And item "safe" is open

  Scenario: Every room has compact art and a closer-inspection tidbit
    Then every manor room has searchable detail and narrow ASCII art

  Scenario: Deep inspection reveals hidden objects through every inspection vocabulary
    Given the player is in room "garden"
    When I send "look"
    Then the output contains "_[]_"
    And the output contains "CLOSER INSPECTION"
    And the output contains "statue"
    And the output contains "movable"
    And the output contains "THINGS YOU CAN ACT ON"
    And the output contains "STATUE: MOVE, PUSH, PULL, EXAMINE"
    When I send "look at statue"
    Then the output contains "key"
    And item "frontKey" is in "garden"
    Given a fresh manor game
    And the player is in room "parlor"
    When I send "ex painting"
    Then the output contains "SAFE"
    And item "safe" is in "parlor"

  Scenario: Lifting the statue reveals the hidden key
    Given the player is in room "garden"
    When I send "lift statue"
    Then the output contains "key"
    And item "frontKey" is in "garden"

  Scenario: Room descriptions emphasize fixed scenery without claiming portable props remain
    Then these room descriptions contain uppercase interactables:
      | room          | labels                           |
      | garden        | STATUE,WELL,BRAZIER              |
      | privy         | TOILET                           |
      | porch         | MAILBOX,FRONT DOOR               |
      | grandHall     | RELIQUARY,FRONT DOOR,BELL CLOSET |
      | parlor        | PROFILE PAINTING                 |
      | library       | LEVER                            |
      | diningRoom    | CANDELABRA                       |
      | kitchen       | CELLAR DOOR                      |
      | crypt         | WRAITH                           |
      | landing       | CORD                             |
      | nursery       | WALLPAPER                        |
      | masterBedroom | JEWELRY BOX                      |
      | study         | DESK,DRAWER                      |
      | hallBedroom   | MIRROR,NIGHT TABLE               |

  @room-prose
  Scenario Outline: Portable objects appear while present and vanish from room prose when carried away
    Given item "xrayGoggles" is carried
    When I send "wear goggles"
    Given the player is in room "<room>"
    When I send "look"
    Then the output contains "<item prose>"
    And the output contains "<fixed scenery>"
    Given item "<item>" is carried
    When I send "look"
    Then the output does not contain "<item prose>"
    And the output contains "<fixed scenery>"

    Examples:
      | room          | item              | item prose                       | fixed scenery                            |
      | mineGallery   | headlamp          | battered mining HEADLAMP         | MINING GALLERY follows a rusted rail line |
      | deepShaft     | backpack          | sturdy canvas BACKPACK           | Broken ladders and narrow ledges        |
      | dreadmawVault | familyCrest       | BLACKWOOD FAMILY CREST rests here | velvet cushion                          |
      | dreadmawVault | wingedShoes       | golden WINGED SHOES rests here   | heap of coins                            |
      | treeFort      | spyglass          | valuable brass SPYGLASS marked BM | rusted swivel cradle                    |
      | secretChamber | grimoire          | heavy black GRIMOIRE             | single lectern                           |
      | diningRoom    | candlestick       | sole portable CANDLE             | silver fittings shaped for a CANDELABRA |
      | kitchen       | matches           | box of MATCHES sits here         | heavy CELLAR DOOR                        |
      | kitchen       | rope              | coil of stout ROPE               | heavy CELLAR DOOR                        |
      | kitchen       | burrito           | SPICY BURRITO sweats here        | heavy CELLAR DOOR                        |
      | wineCellar    | crystalDecanter   | intact CRYSTAL DECANTER          | Stone steps climb UP                     |
      | crypt         | goldLocket        | GOLD LOCKET lies here            | central sarcophagus                      |
      | nursery       | musicBox          | JEWELED MUSIC BOX rests here     | WALLPAPER peeling                       |
      | study         | diary             | leather-bound DIARY lies open here | BM-stamped brass pull                  |
      | attic         | ancestralPortrait | valuable ANCESTRAL PORTRAIT      | broken skylight                          |
      | hiddenVault   | obsidianEye       | cold OBSIDIAN EYE rests here     | low stone plinth                         |
      | betweenWalls  | blackwoodHammer   | BLACKWOOD HAMMER lies here       | cramped gap OUT                          |

  @room-prose
  Scenario Outline: A moved prop no longer describes its original hiding place
    Given the player is in room "grandHall"
    And item "<item>" rests in room "grandHall"
    When I send "look"
    Then the output contains "<item prose>"
    And the output does not contain "<old placement>"

    Examples:
      | item              | item prose                         | old placement              |
      | mushrooms         | purple MUSHROOMS rests here        | windowsill                 |
      | outhouseMushrooms | Fresh MUSHROOMS glisten here       | Inside the TOILET HOLE     |
      | milk              | BOTTLE OF MILK sits here           | pantry nook                |
      | apple             | red APPLE sits here                | pantry basket              |
      | familyRing        | BLACKWOOD FAMILY RING rests here   | inside the drawer          |
      | xrayGoggles       | BLACKWOOD XRAY GOGGLES rest here   | abandoned bat roost        |
      | mirrorShard       | MIRROR SHARD lies here             | broken frame's center      |
      | backwardsWatch    | BM WATCH rests here                | inside the open DESK DRAWER |
      | ancestralPortrait | valuable ANCESTRAL PORTRAIT        | shrouded lumber            |

  @room-prose
  Scenario: Hidden vision leaves enduring clues rather than claiming retrieved items remain
    Given item "xrayGoggles" is carried
    When I send "wear goggles"
    Given item "frontKey" is carried
    And item "ancientCoin" is carried
    And the player is in room "garden"
    When I send "look"
    Then the output contains "IRON KEY-shaped hollow"
    And the output contains "ANCIENT COIN-shaped print"
    And the output does not contain "IRON KEY glints beneath"
    Given item "musicBox" is carried
    And item "tinyKey" is carried
    And the player is in room "nursery"
    When I send "look"
    Then the output contains "TINY KEY-shaped scuff"
    And the output contains "WALLPAPER"
    And the output does not contain "TINY KEY gleams inside"
    Given item "rubyRing" is carried
    And the player is in room "masterBedroom"
    When I send "look"
    Then the output contains "RAVENBLOOD RING-shaped depression"
    And the output does not contain "RAVENBLOOD RING inside"

  @room-prose
  Scenario: The privy still points to its crop after the mushrooms are taken
    Given the player is in room "privy"
    When I send "look"
    Then the output contains "purple glimmer"
    When I send "look in toilet"
    And I send "look"
    Then the output contains "fresh MUSHROOMS glisten"
    When I send "take fresh mushrooms"
    And I send "look"
    Then the output does not contain "fresh MUSHROOMS glisten"
    And the output contains "purple glimmer"
    And the output contains "TOILET HOLE"

  @room-prose
  Scenario: The dining table retains its fittings after the completed candelabra leaves
    Given the restored candelabra is carried
    And the player is in room "diningRoom"
    When I send "look"
    Then the output contains "silver fittings shaped for a CANDELABRA"
    And the output does not contain "incomplete CANDELABRA"
    And the output does not contain "beautiful BLACKWOOD CANDELABRA"

  @room-prose
  Scenario: Reading the diary removes it from the Study without erasing the desk
    Given the player is in room "study"
    When I send "look"
    Then the output contains "leather-bound DIARY lies open here"
    When I send "read diary"
    Then item "diary" is in "inventory"
    When I send "look"
    Then the output does not contain "leather-bound DIARY lies open here"
    And the output contains "great oak DESK"
    And the output contains "DESK DRAWER"
    When I round-trip the game snapshot
    And I send "look"
    Then the output does not contain "leather-bound DIARY lies open here"
    And the output contains "great oak DESK"

  @room-prose
  Scenario: Moving a cellar treasure does not make an unlit cellar readable
    Given the player is in room "wineCellar"
    And item "crystalDecanter" is carried
    When I send "look"
    Then the output contains "pitch black"
    And the output does not contain "CRYSTAL DECANTER"

  @room-prose
  Scenario: The Baron is painted in the Parlor, not walled up with the hammer
    Given the player is in room "parlor"
    When I send "look"
    Then the output contains "PROFILE PAINTING of BARON MUNCHHAUSEN THE THIRD"
    And the output contains "cold fireplace"
    Given the player is in room "betweenWalls"
    When I send "look"
    Then the output does not contain "wig-crowned figure"
    And the output does not contain "BARON MUNCHHAUSEN THE THIRD"
    And the output contains "exposed beams"

  @room-prose
  Scenario: The ancestral portrait takes its watchful gaze out of the Attic when carried
    Given the player is in room "attic"
    When I send "look"
    Then the output contains "eyes find you"
    When I send "take miniature"
    Then item "ancestralPortrait" is in "inventory"
    When I send "look"
    Then the output does not contain "eyes find you"
    And the output contains "broken skylight"

  Scenario: Portrait and miniature refer to one attic object
    Given the player is in room "attic"
    When I send "look"
    Then the output does not contain "There is a MINIATURE here"
    And the output does not contain "There is a PORTRAIT here"
    When I send "examine portrait"
    Then the output contains "painted in miniature"
    When I send "examine miniature"
    Then the output contains "ANCESTRAL PORTRAIT"

# end manor-adventure.feature
