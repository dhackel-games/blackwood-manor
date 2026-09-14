# sysop-menu.feature. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-13.086:acoven.

@unit
Feature: Sysop compound command shortcuts
  Double-colon shortcuts prepare editable command chains without appearing in
  public HELP or executing until the player submits the replacement. The menu
  remains locked until its owner password is entered once.

  Background:
    Given a fresh manor game

  Scenario: The hidden menu is generated from the prompt catalog
    Then the sysop menu command is "::"
    And the sysop menu unlock passwords are "werdna,evad"
    And the sysop command catalog defines "::powerup,::winquick,::garycliff,::winmax"
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
      | long                    | short                |
      | north                   | n                    |
      | southwest               | sw                   |
      | up                      | u                    |
      | down                    | d                    |
      | open mailbox            | o mailbox            |
      | close reliquary         | c reliquary          |
      | take family crest       | t family crest       |
      | wear winged shoes       | u winged shoes        |
      | don talisman            | u talisman            |
      | remove talisman         | doff talisman        |
      | offer apple to dragon   | give apple to dragon |
      | place ruby gem in panel | put ruby gem in panel |
      | unlock front door with iron key | un front door w/iron key     |
      | use mushrooms           | u mushrooms          |
      | eat mushrooms           | u mushrooms          |
      | drink milk              | u milk               |
      | fly kitchen             | g kitchen             |
      | lock front door with iron key | lk front door w/iron key |
      | enter platform          | in platform          |
      | wait                    | z                    |

  Scenario: Collection prompts bulk-take rooms and let direct use acquire visible gear
    Then sysop command "::powerup" includes "u shoes"
    And sysop command "::powerup" includes "u fresh"
    And sysop command "::powerup" omits "t shoes"
    And sysop command "::winquick" includes "t all"
    And sysop command "::winquick" includes "u shoes"
    And sysop command "::winquick" contains sequence "g dreadvault; u shoes; t all"
    And sysop command "::winquick" includes "u fresh"
    And sysop command "::winquick" omits "t shoes"
    And sysop command "::winquick" omits "t crest"
    And sysop command "::winmax" includes "t all"
    And sysop command "::winmax" includes "u shoes"
    And sysop command "::winmax" contains sequence "u shoes; t all"
    And sysop command "::winmax" includes "u fresh"
    And sysop command "::winmax" omits "t shoes"
    And sysop command "::winmax" omits "t crest"
    And sysop command "::winquick" includes "put crest in rq"
    And sysop command "::winquick" omits "put crest in reliquary"
    And sysop command "::garycliff" includes "c rq"
    And sysop command "::winmax" includes "c rq"
    And every hidden prompt avoids an explicit take immediately before direct use

  Scenario: Powerup targets fresh mushrooms when both varieties are carried
    Given flag "outhouseMushroomsFound" is set
    And item "mushrooms" is carried
    And item "outhouseMushrooms" is carried
    When I execute sysop command "::powerup"
    Then item "wingedShoes" is worn in slot "feet"
    And the game is not won

  Scenario: Powerup falls back to dried mushrooms after the privy crop is gone
    Given flag "outhouseMushroomsFound" is set
    And item "outhouseMushrooms" is destroyed
    Then sysop command "::powerup" includes "u dried"
    When I execute sysop command "::powerup"
    Then item "wingedShoes" is worn in slot "feet"
    And the game is not won

  Scenario Outline: Every sysop route recovers on foot when both mushroom batches are gone
    Given flag "outhouseMushroomsFound" is set
    And item "outhouseMushrooms" has been destroyed
    And item "mushrooms" has been destroyed
    When I execute sysop command "<command>"
    Then item "wingedShoes" is worn in slot "feet"
    And the current room is "<room>"
    And the game is alive

    Examples:
      | command     | room           |
      | ::powerup   | hiddenVault    |
      | ::winquick  | hollowSanctum  |
      | ::garycliff | garysLair      |
      | ::winmax    | hollowSanctum  |

  Scenario Outline: Shoes-only flight acquires dark vision before entering the shaft
    Given flag "outhouseMushroomsFound" is set
    And item "outhouseMushrooms" has been destroyed
    And item "mushrooms" has been destroyed
    And item "wingedShoes" is carried
    When I execute sysop command "<command>"
    Then the game is alive
    And the current room is "<room>"

    Examples:
      | command     | room          |
      | ::powerup   | hiddenVault   |
      | ::winquick  | hollowSanctum |
      | ::garycliff | garysLair     |

  Scenario: Prompt expansion skips items already carried or worn
    Given item "backpack" is carried
    And item "wingedShoes" is carried
    When I send "wear winged shoes"
    Then sysop command "::powerup" omits "t backpack"
    And sysop command "::powerup" includes "u backpack"
    And sysop command "::powerup" omits "u shoes"

  Scenario: Powerup equips a backpack that is already carried but not worn
    Given item "backpack" is carried
    When I execute sysop command "::powerup"
    Then item "backpack" is worn in slot "back"

  Scenario: Powerup collects and equips every reusable power item
    When I execute sysop command "::powerup"
    And item "backpack" is worn in slot "back"
    And item "headlamp" is worn in slot "head"
    And item "xrayGoggles" is worn in slot "eyes"
    And item "wingedShoes" is worn in slot "feet"
    And item "talisman" is worn in slot "neck"
    And item "obsidianEye" is worn in slot "forehead"
    And item "rubyRing" is in "jewelryBox"
    And the game is not won

  Scenario: Quick win deposits only required heirlooms
    When I execute sysop command "::winquick"
    Then the game is won
    And every required family item is in the reliquary

  Scenario: Quick win remains valid after the mirrored gem panel was already solved
    Given the player is in room "greatOak"
    And item "emberStone" is carried
    When I send "take all"
    And I send "put ruby gem in bottom slot"
    And I send "put emerald gem in middle slot"
    And I send "put sapphire gem in top slot"
    And I send "wait"
    And I execute sysop command "::winquick"
    Then the game is won
    And every required family item is in the reliquary

  Scenario: An already-solved oak still uses its one-word room alias
    Given flag "oakLightAligned" is set
    Then sysop command "::winquick" includes "g fort"
    And sysop command "::winquick" omits "g tree fort"

  Scenario: Quick win skips the crypt after its heirlooms are deposited
    Given item "goldLocket" is carried
    And item "talisman" is carried
    And the player is in room "grandHall"
    When I send "put gold locket in reliquary"
    And I send "put talisman in reliquary"
    And I execute sysop command "::winquick"
    Then the game is won
    And the game is alive
    And every required family item is in the reliquary

  Scenario: Gary cliffhanger collects the minimum heirlooms and descends
    When I execute sysop command "::garycliff"
    Then the game is won
    And the current room is "garysLair"
    And the output contains "FREEDOM"
    And the output contains "TO BE CONTINUED"
    And every required family item is in the reliquary

  Scenario: Maximum win earns every deterministic scoring reward
    When I execute sysop command "::winmax"
    Then the game is won
    And flag "progressAward:trollRiddleSolved" is set
    And flag "progressAward:oakPanelAligned" is set
    And flag "progressAward:burritoSurvived" is set
    And flag "progressAward:selfFireSurvived" is set
    And item "mysteryPackage" is in "grandHall"
    And the game score is 485

# end sysop-menu.feature
