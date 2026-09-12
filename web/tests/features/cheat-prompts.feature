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

  Scenario: Powerup collects every portable item and equips every power slot
    When I execute hidden cheat ":powerup"
    Then every portable item is in the inventory
    And item "backpack" is worn in slot "back"
    And item "headlamp" is worn in slot "head"
    And item "xrayGoggles" is worn in slot "eyes"
    And item "wingedShoes" is worn in slot "feet"
    And item "talisman" is worn in slot "neck"
    And item "rubyRing" is worn in slot "finger"
    And item "obsidianEye" is worn in slot "forehead"
    And the turn count is 0

  Scenario: Quick win deposits only required heirlooms
    When I execute hidden cheat ":winquick"
    Then the game is won
    And every required family item is in the reliquary
    And item "silverChalice" is in "dreadmawVault"

  Scenario: Maximum win sets the attainable maximum score
    When I execute hidden cheat ":winmax"
    Then the game is won
    And the game score is 315
    And the game score equals the computed maximum

# end cheat-prompts.feature
