# cheat-prompts.feature. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-12.068:acoven.

@unit
Feature: Hidden compound prompt shortcuts
  Double-colon shortcuts prepare editable command chains without appearing in
  public HELP or executing until the player submits the replacement. The menu
  remains locked until its owner password is entered once.

  Background:
    Given a fresh manor game

  Scenario: The hidden menu is generated from the prompt catalog
    Then the hidden cheat menu command is "::"
    And the magic menu unlock passwords are "werdna,evad"
    And the hidden cheat catalog defines "::powerup,::winquick,::garycliff,::winmax"
    And the magic menu uses the shared command title description format
    And every hidden compound prompt uses shortest command forms
    And every hidden prompt uses globally unique one-word targets
    And hidden shortcuts replace the editable command prompt without executing
    And public HELP does not reveal hidden cheat commands
    And no hidden cheat prompt uses the removed su command

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
      | take family crest       | get family crest     |
      | wear winged shoes       | don winged shoes     |
      | remove talisman         | doff talisman        |
      | offer apple to dragon   | give apple to dragon |
      | place ruby gem in panel | put ruby gem in panel |
      | enter platform          | in platform          |
      | wait                    | z                    |

  Scenario: Prompt expansion skips items already carried or worn
    Given item "backpack" is carried
    And item "wingedShoes" is carried
    When I send "wear winged shoes"
    Then hidden cheat "::powerup" omits "take backpack"
    And hidden cheat "::powerup" includes "don backpack"
    And hidden cheat "::powerup" omits "don shoes"

  Scenario: Powerup equips a backpack that is already carried but not worn
    Given item "backpack" is carried
    When I execute hidden cheat "::powerup"
    Then item "backpack" is worn in slot "back"

  Scenario: Powerup collects and equips every reusable power item
    When I execute hidden cheat "::powerup"
    And item "backpack" is worn in slot "back"
    And item "headlamp" is worn in slot "head"
    And item "xrayGoggles" is worn in slot "eyes"
    And item "wingedShoes" is worn in slot "feet"
    And item "talisman" is worn in slot "neck"
    And item "obsidianEye" is worn in slot "forehead"
    And item "rubyRing" is in "jewelryBox"
    And the game is not won

  Scenario: Quick win deposits only required heirlooms
    When I execute hidden cheat "::winquick"
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
    And I execute hidden cheat "::winquick"
    Then the game is won
    And every required family item is in the reliquary

  Scenario: An already-solved oak still uses its one-word room alias
    Given flag "oakLightAligned" is set
    Then hidden cheat "::winquick" includes "fly fort"
    And hidden cheat "::winquick" omits "fly tree fort"

  Scenario: Quick win skips the crypt after its heirlooms are deposited
    Given item "goldLocket" is carried
    And item "talisman" is carried
    And the player is in room "grandHall"
    When I send "put gold locket in reliquary"
    And I send "put talisman in reliquary"
    And I execute hidden cheat "::winquick"
    Then the game is won
    And the game is alive
    And every required family item is in the reliquary

  Scenario: Gary cliffhanger collects the minimum heirlooms and descends
    When I execute hidden cheat "::garycliff"
    Then the game is won
    And the current room is "garysLair"
    And the output contains "FREEDOM"
    And the output contains "TO BE CONTINUED"
    And every required family item is in the reliquary

  Scenario: Maximum win earns every deterministic scoring reward
    When I execute hidden cheat "::winmax"
    Then the game is won
    And flag "progressAward:trollRiddleSolved" is set
    And flag "progressAward:oakPanelAligned" is set
    And flag "progressAward:burritoSurvived" is set
    And flag "progressAward:selfFireSurvived" is set
    And item "mysteryPackage" is in "grandHall"
    And the game score is 485

# end cheat-prompts.feature
