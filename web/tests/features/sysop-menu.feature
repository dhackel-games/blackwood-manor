# sysop-menu.feature. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-15.102:acoven.

@unit
Feature: Maintained sysop shortcuts
  The hidden menu exposes power-up, quick-win, and maximum-score routes for the
  bell, front-door, and Gary stopping points.

  Background:
    Given a fresh manor game

  Scenario: The hidden menu contains the maintained shortcuts
    Then the sysop menu command is "::"
    And the sysop menu unlock passwords are "werdna,evad"
    And the sysop command catalog defines "::powerup,::winquick1,::winmax2bell,::winmaxfrontd,::winmaxgary"
    And the sysop menu uses the shared command title description format
    And every hidden compound prompt uses shortest command forms
    And every hidden prompt uses globally unique one-word targets
    And hidden shortcuts replace the editable command prompt without executing
    And public HELP does not reveal sysop commands
    And no sysop command uses the removed su command

  Scenario: Dynamic path tokens resolve from the current room
    Then the path from the current room to "PRIVY" is "e; e"

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
      | remove talisman                   | doff talisman            |
      | offer apple to dragon             | give apple to dragon     |
      | place ruby gem in panel           | put ruby gem in panel    |
      | unlock front door with iron key   | un front door w/iron key |
      | use mushrooms                     | u mushrooms              |
      | drink milk                        | u milk                   |
      | fly kitchen                       | g kitchen                |
      | enter platform                    | in platform              |
      | wait                              | z                        |

  Scenario: Winmax2bell includes the new mirror route and stops before the ritual
    Then sysop command "::winmax2bell" includes "g belfry"
    And sysop command "::winmax2bell" includes "pull bellrope"
    And sysop command "::winmax2bell" includes "t batsight"
    And sysop command "::winmax2bell" includes "put all in rq"
    And sysop command "::winmax2bell" includes "c rq"
    And sysop command "::winmax2bell" includes "o bellcloset"
    And sysop command "::winmax2bell" omits "pull closetrope"
    And sysop command "::winmax2bell" omits "put batsight in rq"
    And every hidden prompt avoids an explicit take immediately before direct use

  Scenario: Powerup and Quick Win use the current equipment and mirror routes
    Then sysop command "::powerup" contains sequence "g shaft; u backpack; g gallery; u headlamp; g dreadvault; u shoes"
    Then sysop command "::powerup" includes "u shoes"
    And sysop command "::powerup" includes "u goggles"
    And sysop command "::powerup" includes "u obsidian"
    And sysop command "::powerup" includes "pull bellrope"
    And sysop command "::powerup" includes "t batsight"
    And sysop command "::winquick1" includes "g belfry"
    And sysop command "::winquick1" includes "pull bellrope"
    And sysop command "::winquick1" includes "t batsight"
    And sysop command "::winquick1" includes "put all in rq"
    And sysop command "::winquick1" includes "pull closetrope"
    And sysop command "::winquick1" omits "south"
    And sysop command "::winquick1" contains sequence "g shaft; u backpack; g gallery; u headlamp; g dreadvault; u shoes"
    And sysop command "::winmax2bell" contains sequence "g shaft; u backpack; g gallery; u headlamp"
    And sysop command "::winmax2bell" contains sequence "u burrito; z; z; z; z; u milk"

  Scenario: Powerup equips every reusable power item without ending the game
    When I execute sysop command "::powerup"
    Then item "backpack" is worn in slot "back"
    And item "headlamp" is worn in slot "head"
    And item "xrayGoggles" is worn in slot "eyes"
    And item "wingedShoes" is worn in slot "feet"
    And item "talisman" is worn in slot "neck"
    And item "obsidianEye" is worn in slot "forehead"
    And item "batSightMirror" is carried
    And the game is not won
    And the game score is 60

  Scenario: Quick Part I stops after the bell before the front-door ending
    When I execute sysop command "::winquick1"
    Then the game is not won
    And the game is alive
    And the current room is "grandHall"
    And flag "bellRung" is set
    And item "frontDoor" is open
    And every required family item is inside the countdown clock
    And the game score is 315

  Scenario: Winmax2bell earns deterministic progress and stops at the closed reliquary
    When I execute sysop command "::winmax2bell"
    Then the game is alive
    And the game is not won
    And the current room is "grandHall"
    And flag "reliquarySealed" is true
    And flag "bellRung" is unset
    And item "bellCloset" is open
    And flag "progressAward:trollRiddleSolved" is set
    And flag "progressAward:oakPanelAligned" is set
    And flag "progressAward:belfryMirrorFreed" is set
    And flag "progressAward:burritoSurvived" is set
    And flag "progressAward:selfFireSurvived" is set
    And flag "progressAward:mushroomVisionOpened" is set
    And flag "progressAward:atticLadderLowered" is set
    And flag "progressAward:letterRead" is set
    And item "mysteryPackage" is in "grandHall"
    And every required family item is in the reliquary
    And the game score is 440

  Scenario: Winmaxfrontd takes the maximum route through the clean ending
    When I execute sysop command "::winmaxfrontd"
    Then the game is won
    And the output contains "You keep walking"
    And flag "bellRung" is set
    And the game score is 490

  Scenario: Winmaxgary takes the maximum route and descends into Part II
    When I execute sysop command "::winmaxgary"
    Then the game is alive
    And the game is not won
    And the current room is "p2_awakening"
    And flag "partII" is set
    And item "clockTalisman" is carried
    And the output contains "FREEEEDOMMM"
    And the game score is 445

  Scenario: Winmax2bell recovers with shoes when both mushroom batches are gone
    Given flag "outhouseMushroomsFound" is set
    And item "outhouseMushrooms" has been destroyed
    And item "mushrooms" has been destroyed
    When I execute sysop command "::winmax2bell"
    Then item "wingedShoes" is worn in slot "feet"
    And the current room is "grandHall"
    And the game is alive
    And every required family item is in the reliquary

  Scenario Outline: Restored shortcuts recover with shoes when mushrooms are gone
    Given flag "outhouseMushroomsFound" is set
    And item "outhouseMushrooms" has been destroyed
    And item "mushrooms" has been destroyed
    When I execute sysop command "<command>"
    Then item "wingedShoes" is worn in slot "feet"
    And the current room is "<room>"
    And the game is alive

    Examples:
      | command    | room        |
      | ::powerup  | hiddenVault |
      | ::winquick1 | grandHall   |

  Scenario: An already-solved oak still uses its one-word room alias
    Given flag "oakLightAligned" is set
    Then sysop command "::winmax2bell" includes "g fort"
    And sysop command "::winmax2bell" omits "g tree fort"

# end sysop-menu.feature
