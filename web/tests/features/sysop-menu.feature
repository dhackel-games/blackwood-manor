# sysop-menu.feature. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-09.002:acoven.

@unit
Feature: Maintained sysop shortcuts
  The hidden menu keeps the Baron and power-up helpers, plus one complete
  physical win route that stops with the clock before either ending.

  Background:
    Given a fresh manor game

  Scenario: The hidden menu contains the maintained shortcuts
    Then the sysop menu command is "::"
    And the sysop menu unlock passwords are "werdna,evad,divad"
    And the sysop command catalog defines "::baron,::powerup,::win"
    And the sysop menu uses the shared command title description format
    And obsolete win shortcuts are rejected
    And every hidden compound prompt uses shortest command forms
    And every hidden prompt uses globally unique one-word targets
    And hidden shortcuts replace the editable command prompt without executing
    And public INFO does not reveal sysop commands
    And no sysop command uses the removed su command

  Scenario: Sysop access never survives a reload or restart
    Then sysop access is session-only in the text game and the 2D view

  Scenario Outline: Any sysop password expands a worn backpack, and the expansion survives restore
    Given the backpack is worn
    Then the inventory capacity is 36
    And the inventory HUD shows "🎒" with "0/36"
    When I unlock the sysop game state with "<password>"
    Then flag "sysopMenuUnlocked" is set
    And the inventory capacity is 100
    And the inventory HUD shows "🎒" with "0/100"
    When I round-trip the game snapshot
    Then flag "sysopMenuUnlocked" is set
    And the inventory capacity is 100
    And the inventory HUD shows "🎒" with "0/100"

    Examples:
      | password |
      | ::werdna |
      | ::evad   |
      | ::divad  |

  Scenario: Dynamic path tokens resolve from the current room
    Then the path from the current room to "PRIVY" is "e; e"

  Scenario: Dynamic paths wait through the four-beat oak lift
    Given the four-beat oak lift is below while I wait at the fort
    Then the path from the current room to "PRIVY" is "z; z; out; z; w"

  Scenario: Compound prompts use the shortest safe command aliases
    Then long commands shorten as:
      | long                              | short                    |
      | north                             | n                        |
      | southwest                         | sw                       |
      | up                                | u                        |
      | down                              | d                        |
      | open bell closet                  | o bell closet            |
      | close reliquary                   | c reliquary              |
      | take family crest                 | t family crest           |
      | wear winged shoes                 | u winged shoes           |
      | extinguish self                   | ext self                 |
      | offer apple to dragon             | give apple to dragon     |
      | place ruby gem in panel           | put ruby gem in panel    |
      | unlock front door with iron key   | un front door w/iron key |
      | use mushrooms                     | u mushrooms              |
      | drink milk                        | drink milk               |
      | fly kitchen                       | g kitchen                |
      | enter platform                    | in platform              |
      | wait                              | z                        |

  Scenario: The single win prompt starts with the backpack and walks the remaining map
    Then sysop command "::win" contains sequence "e; e; look in toilet; t piecec; u fresh; g shaft; u backpack; u; u headlamp"
    And sysop command "::win" contains sequence "g garden; move statue; t iron"
    And sysop command "::win" contains sequence "t spyglass; z; z; z"
    And sysop command "::win" includes "pull bellrope"
    And sysop command "::win" includes "u goggles"
    And sysop command "::win" includes "read package"
    And sysop command "::win" includes "light self w/wrapper"
    And sysop command "::win" includes "put candle in fixture"
    And sysop command "::win" includes "put shard in fixture"
    And sysop command "::win" includes "pull closetrope" exactly once
    And sysop command "::win" contains sequence "c rq; o bellcloset; pull closetrope; o rq; read gclock"
    And sysop command "::win" omits "g fort"
    And sysop command "::win" omits "g belfry"
    And sysop command "::win" omits "open package"
    And sysop command "::win" omits "o locker"
    And sysop command "::win" contains sequence "give apple to dragon; e; e; in locker; fill jug"
    And sysop command "::win" includes "in locker" exactly once
    And sysop command "::win" omits "doff"
    And every hidden prompt avoids an explicit take immediately before direct use

  Scenario: The win prompt derives its radio answers from the persisted LCG seed
    Given the radio seed is 1
    Then sysop command "::win" contains sequence "turn on cabinet radio; answer 4; answer 2; answer 5"

  Scenario: Powerup still equips the current reusable gear
    Then sysop command "::powerup" contains sequence "g shaft; u backpack; g gallery; u headlamp; g dreadvault; u shoes"
    And sysop command "::powerup" includes "u shoes"
    And sysop command "::powerup" includes "u goggles"
    And sysop command "::powerup" includes "o studrawer"
    And sysop command "::powerup" includes "u bmwatch"
    And sysop command "::powerup" includes "u obsidian"
    And sysop command "::powerup" includes "pull bellrope"
    And sysop command "::powerup" contains sequence "g study; o studrawer; u bmwatch"

  Scenario: Meet the Baron walks through the front door to the Parlor portrait
    When I execute sysop command "::baron"
    Then the current room is "parlor"
    And flag "frontDoorOpen" is set
    And flag "wallGapFound" is unset
    And flag "seen:parlor" is set
    And item "baronMunchhausen" is in "parlor"
    And the output contains "Baron Munchhausen"
    And the output contains "READ the leather-bound DIARY"
    And the output contains "CALL GARY"

  Scenario: Meet the Baron reaches the Parlor without flying or entering the nursery gap
    Then sysop command "::baron" contains sequence "o frontd w/iron"
    And sysop command "::baron" contains sequence "o frontd w/iron; n; e"
    And sysop command "::baron" omits "pull wallpaper"
    And sysop command "::baron" includes "talk to baron"

  Scenario: Powerup equips every reusable power item without ending the game
    When I execute sysop command "::powerup"
    Then item "backpack" is worn in slot "back"
    And item "headlamp" is worn in slot "head"
    And item "xrayGoggles" is worn in slot "eyes"
    And item "wingedShoes" is worn in slot "feet"
    And item "talisman" is worn in slot "neck"
    And item "obsidianEye" is worn in slot "forehead"
    And item "backwardsWatch" is worn in slot "wrist"
    And item "studyDrawer" is open
    And item "familyRing" is in "nightDrawer"
    And item "mirrorShard" is in "hallBedroom"
    And item "candlestick" is in "diningRoom"
    And item "candelabra" is destroyed
    And item "batSightMirror" is absent from game state
    And the game is not won
    And the game score is 120

  @win @maxscore
  Scenario: Every physical win step executes, with planner route metrics, and the clock remains in hand
    When I trace sysop command "::win"
    Then the game is alive
    And the traced win route begins "e; e; look in toilet; t piecec; u fresh"
    And the traced win route omits worn-equipment removal steps
    And the traced win route opens the locker only while entering it
    And the traced win route uses required heirlooms only for state-changing effects
    And the traced win route uses TAKE ALL only for two or more items
    And the traced win route never takes an item the next action derives
    And the game is not won
    And the current room is "grandHall"
    And the win route used at most two named flights
    And the win route used exactly 2 named flights
    And the win route used exactly one bulk RQ deposit
    And the win route used zero single-item RQ deposits
    And the win route uses fewer than 5.9 transitions per heirloom
    And the score equals the derived Part I maximum
    And every Part I portable has its pickup and use rewards
    And flag "reliquarySealed" is false
    And flag "progressAward:reliquarySealed" is set
    And flag "bellRung" is set
    And flag "floorDoorOpen" is set
    And item "bellCloset" is open
    And item "frontDoor" is open
    And item "clockTalisman" is carried
    And flag "progressAward:trollRiddleSolved" is set
    And flag "progressAward:oakPanelAligned" is set
    And flag "progressAward:belfryGogglesFreed" is set
    And flag "progressAward:burritoSurvived" is set
    And flag "progressAward:selfFireSurvived" is set
    And flag "progressAward:mushroomVisionOpened" is set
    And flag "progressAward:atticLadderLowered" is set
    And flag "progressAward:letterRead" is set
    And item "mysteryPackage" is carried
    And every required family item is inside the Doomsday Clock
    And item "familyRing" is in "clockTalisman"
    And item "blackwoodHammer" is in "clockTalisman"
    And item "candelabra" is in "clockTalisman"
    And item "mirrorShard" is destroyed
    And item "candlestick" is destroyed
    And item "backwardsWatch" is worn in slot "wrist"
    And item "xrayGoggles" is worn in slot "eyes"
    And flag "progressAward:candelabraRestored" is set
    And the game score is 1236

  @win @maxscore
  Scenario: Repeating the completed prompt cannot choose the front-door ending
    When I execute sysop command "::win"
    Then the game is alive
    And the game is not won
    And the current room is "grandHall"
    And item "clockTalisman" is carried
    And the game score is 1236
    And both endings remain independently available
    Then sysop command "::win" includes "read gclock"
    And sysop command "::win" omits "s"
    And sysop command "::win" omits "d"
    When I execute sysop command "::win"
    Then the game is not won
    And the current room is "grandHall"
    And item "clockTalisman" is carried
    And the game score is 1236
    And both endings remain independently available
    When I send "use clock"
    Then the current room is "grandHall"
    And flag "partII" is unset
    And the game score is 1236

  @win @maxscore
  Scenario: After the bell, the prompt opens the sealed reliquary and takes the clock safely
    When I execute sysop command "::win" through "pull closetrope"
    Then the current room is "grandHall"
    And flag "bellRung" is set
    And item "clockTalisman" is in "reliquary"
    And item "reliquary" is closed
    And the game score is 1226
    And sysop command "::win" contains sequence "o rq; read gclock"
    And sysop command "::win" omits "s"
    And sysop command "::win" omits "d"
    When I execute sysop command "::win"
    Then the game is not won
    And the current room is "grandHall"
    And item "clockTalisman" is carried
    And the game score is 1236
    And both endings remain independently available

  @win @maxscore
  Scenario: After the bell, the prompt takes the clock from an already open reliquary
    When I execute sysop command "::win" through "pull closetrope"
    And I send "open reliquary"
    Then item "reliquary" is open
    And sysop command "::win" contains sequence "read gclock"
    And sysop command "::win" omits "o rq"
    And sysop command "::win" omits "s"
    When I execute sysop command "::win"
    Then the game is not won
    And the current room is "grandHall"
    And item "clockTalisman" is carried
    And the game score is 1236
    And both endings remain independently available

  @win
  Scenario: The complete route recovers physically when both mushroom batches are gone
    Given flag "outhouseMushroomsFound" is set
    And item "outhouseMushrooms" has been destroyed
    And item "mushrooms" has been destroyed
    When I trace sysop command "::win"
    Then item "wingedShoes" is worn in slot "feet"
    And item "backwardsWatch" is worn in slot "wrist"
    And item "xrayGoggles" is worn in slot "eyes"
    And the win route used at most two named flights
    And the current room is "grandHall"
    And the game is alive
    And flag "bellRung" is set
    And item "clockTalisman" is carried
    And every required family item is inside the Doomsday Clock
    And the game score is 1191

  Scenario: Powerup still recovers with shoes when both mushroom batches are gone
    Given flag "outhouseMushroomsFound" is set
    And item "outhouseMushrooms" has been destroyed
    And item "mushrooms" has been destroyed
    When I execute sysop command "::powerup"
    Then item "wingedShoes" is worn in slot "feet"
    And item "backwardsWatch" is worn in slot "wrist"
    And item "xrayGoggles" is worn in slot "eyes"
    And the current room is "hiddenVault"
    And the game is alive

  @win
  Scenario: An already-solved oak uses its physical platform instead of flying to the fort
    Given an already-solved oak has its platform at the roots
    Then sysop command "::win" contains sequence "fill slots ymc; z; z; in platform; z; out"
    And sysop command "::win" contains sequence "z; z; z; in platform; z; out; t spyglass; z; z; z"
    And sysop command "::win" omits "g fort"
    When I trace sysop command "::win"
    Then the game is alive
    And the current room is "grandHall"
    And item "clockTalisman" is carried
    And flag "bellRung" is set
    And flag "progressItem:spyglass" is set
    And flag "useItem:spyglass" is set
    And the win route used at most two named flights

# end sysop-menu.feature
