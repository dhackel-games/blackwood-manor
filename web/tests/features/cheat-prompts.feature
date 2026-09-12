# cheat-prompts.feature Copyright (c) 2026:dhackel-games. All Rights Reserved. Do Not Distribute.

@unit
Feature: Hidden compound prompt shortcuts
  Colon-prefixed shortcuts prepare editable command chains without appearing
  in the public HELP text or executing until the player submits the replacement.

  Background:
    Given a fresh manor game

  Scenario: The hidden menu is generated from the prompt catalog
    Then the hidden cheat menu command is ":?"
    And the hidden cheat catalog defines ":powerup,:winquick,:winmax"
    And hidden shortcuts replace the editable command prompt without executing
    And public HELP does not reveal hidden cheat commands
    And no hidden cheat prompt uses the removed su command

  Scenario: Dynamic path tokens resolve from the current room
    Then the path from the current room to "PRIVY" is "east; east"

  Scenario: Powerup collects and equips every reusable power item
    When I execute hidden cheat ":powerup"
    And item "backpack" is worn in slot "back"
    And item "headlamp" is worn in slot "head"
    And item "xrayGoggles" is worn in slot "eyes"
    And item "wingedShoes" is worn in slot "feet"
    And item "talisman" is worn in slot "neck"
    And item "rubyRing" is worn in slot "finger"
    And item "obsidianEye" is worn in slot "forehead"
    And the game is not won

  Scenario: Quick win deposits only required heirlooms
    When I execute hidden cheat ":winquick"
    Then the game is won
    And every required family item is in the reliquary
    And item "silverChalice" is in "dreadmawVault"

  Scenario: Maximum win sets the attainable maximum score
    Given the random number generator returns 0.30 then 0.99
    When I execute hidden cheat ":winmax"
    Then the game is won
    And the game score is 315

# end cheat-prompts.feature
