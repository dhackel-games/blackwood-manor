# manor-adventure.feature Copyright (c) 2026:dhackel-games. All Rights Reserved. Do Not Distribute.

@walkthrough
Feature: Blackwood Manor adventure
  The complete mansion must remain solvable while its deliberate death traps,
  hidden wing, inspection clues, and alternate movement phrases keep working.

  Background:
    Given a fresh manor game

  Scenario: Complete the manor and escape with the hidden mirror
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
      take candlestick
      south
      take matches
      take rope
      take apple
      light candle
      eat burrito
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
      take family ring
      east
      wear headlamp
      down
      take backpack
      east
      say lore to troll
      east
      take family crest
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
      put family ring in reliquary
      drop doubloon
      south
      south
      east
      light self on fire
      light brazier
      take ember stone
      east
      east
      take green stone
      take blue stone
      put ember stone in mechanism
      put green stone in mechanism
      put blue stone in mechanism
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
      north
      west
      open music box
      take tiny key
      take music box
      east
      east
      unlock jewelry box with tiny key
      open jewelry box
      take ring
      west
      pull cord
      drop music box
      drop ring
      drop wrapper
      up
      take miniature
      down
      take music box
      take ring
      down
      put music box in reliquary
      put ring in reliquary
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
      put candlestick in reliquary
      close reliquary
      ring bell
      take bone key
      unlock secret door with bone key
      open secret door
      north
      north
      take mirror
      north
      """
    Then the game is won
    And the game score is 262
    And the player rank contains "Master of Blackwood Manor"

  Scenario: The silver mirror is an optional thirty-point trophy
    Given the player is in room "hollowSanctum"
    And flag "usedHelp" is set
    And flag "usedInspection" is set
    And flag "usedSaveRestore" is set
    When I send "north"
    Then the game is won
    And the game score is 0
    And the output contains "optional 30 points"
    Given a fresh manor game
    And the player is in room "hollowSanctum"
    And item "silverMirror" is carried
    And flag "usedHelp" is set
    And flag "usedInspection" is set
    And flag "usedSaveRestore" is set
    When I send "north"
    Then the game is won
    And the game score is 30
    And the output contains "optional trophy"

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
      take candlestick
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
      take candlestick
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
    Then the output contains "(unlock door with key, open door, in door)"
    And the current room is "grandHall"

  Scenario: Opening a locked door with its key derives unlock then open
    Given the player is in room "porch"
    And item "frontKey" is carried
    When I send "open door with key"
    Then the output contains "(unlock door with key, open door)"
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
    Then the output contains "(unlock door with key, open door, enter door)"
    And item "frontDoor" is open
    And the current room is "grandHall"

  Scenario: IN derives unlock, open, and enter for a carried door key
    Given the player is in room "porch"
    And item "frontKey" is carried
    When I send "in"
    Then the output contains "(unlock door with key, open door, enter door)"
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
    Then the output does not contain line "Directions you can go: north, east, south, west, up"
    Given flag "curseLiftable" is set
    When I send "close reliquary"
    And I send "ring bell"
    And I send "look"
    Then the output contains line "Directions you can go: north, east, south, west, up"

  Scenario: Handler-driven directions appear when available
    Given the player is in room "landing"
    When I send "look"
    Then the output does not contain line "Directions you can go: north, east, south, west, up, down"
    When I send "pull cord"
    And I send "look"
    Then the output contains line "Directions you can go: north, east, south, west, up, down"
    Given a fresh manor game
    And the player is in room "hollowSanctum"
    When I send "look"
    Then the output contains line "Directions you can go: north, south"

  Scenario: Ringing the prepared bell reveals rather than ends the hidden wing
    Given the player is in room "grandHall"
    And flag "curseLiftable" is set
    When I send "close reliquary"
    And I send "ring bell"
    Then the output matches "BONE KEY|SECRET DOOR"
    And the game is not won
    And item "boneKey" is in "grandHall"
    When I send "take bone key"
    And I send "unlock secret door with bone key"
    Then item "boneKey" is destroyed
    And item "secretDoor" is unlocked

  Scenario: The prepared bell remains inert until the reliquary is closed
    Given the player is in room "grandHall"
    And flag "curseLiftable" is set
    When I send "open reliquary"
    And I send "ring bell"
    Then the output contains "CLOSE RELIQUARY"
    And flag "bellRung" is unset
    And item "boneKey" is destroyed
    When I send "close reliquary"
    And I send "ring bell"
    Then flag "bellRung" is set
    And item "boneKey" is in "grandHall"

  Scenario: Reading a nearby diary implicitly gets it first
    Given the player is in room "study"
    When I send "read diary"
    Then the output contains "(get diary, read diary)"
    And item "diary" is in "inventory"
    And flag "knowsCombo" is true

  Scenario: The ruby ring is visibly a Blackwood heirloom
    Given item "rubyRing" is carried
    When I send "examine ruby ring"
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

  Scenario: Room descriptions emphasize interactable objects
    Then these room descriptions contain uppercase interactables:
      | room          | labels                           |
      | garden        | STATUE,WELL,BRAZIER              |
      | privy         | TOILET                           |
      | porch         | MAILBOX,FRONT DOOR               |
      | grandHall     | RELIQUARY,BELL                   |
      | parlor        | PROFILE PAINTING                 |
      | library       | LEVER                            |
      | diningRoom    | CANDLESTICK                      |
      | kitchen       | ROPE,MATCHES,CELLAR DOOR         |
      | wineCellar    | CRYSTAL DECANTER                 |
      | crypt         | WRAITH,GOLD LOCKET               |
      | landing       | CORD                             |
      | nursery       | JEWELED MUSIC BOX                |
      | masterBedroom | JEWELRY BOX                      |
      | study         | DESK,DIARY                       |
      | attic         | ANCESTRAL PORTRAIT               |
      | hollowSanctum | SPIRIT,SILVER MIRROR             |

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
