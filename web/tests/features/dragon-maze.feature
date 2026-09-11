# dragon-maze.feature Copyright (c) 2026:dhackel-games. All Rights Reserved. Do Not Distribute.

@walkthrough @dragon
Feature: Dreadmaw's hedge maze and hoard
  A small hedge maze leads to DREADMAW THE DRAGON, who blocks her cave while
  sleeping. Any disturbance earns dragonfire; only an offered apple wakes her
  pleasantly, moves her aside, and awards a doubloon. A troll inside guards the
  vault with a missing-rhyme poem.

  Background:
    Given a fresh manor game

  Scenario: The short route through the maze reaches the sleeping dragon
    When I send "west"
    And I send "west"
    And I send "south"
    Then the current room is "dragonCaveMouth"
    And the output contains "DREADMAW THE DRAGON"

  Scenario Outline: Jostling Dreadmaw ignites the player but never moves her
    Given the player is in room "dragonCaveMouth"
    When I send "<command>"
    Then flag "onFire" is true
    And flag "dragonMoved" is unset
    And the output contains "without moving an inch"
    When I send "east"
    Then the current room is "dragonCaveMouth"
    And the output contains "sleeping across the entire cave mouth"

    Examples:
      | command        |
      | talk to dragon |
      | wake dragon    |
      | wake up dragon |
      | move dragon    |
      | push dragon    |
      | pull dragon    |
      | touch dragon   |
      | attack dragon  |
      | climb dragon   |
      | shake dragon   |
      | nudge dragon   |

  Scenario Outline: Offering the apple wakes Dreadmaw pleasantly
    Given item "apple" is carried
    And the player is in room "dragonCaveMouth"
    When I send "<command>"
    Then flag "dragonFriendly" is true
    And flag "dragonMoved" is true
    And flag "onFire" is unset
    And item "apple" is destroyed
    And item "goldDoubloon" is in "inventory"
    And the output contains "GOLD DOUBLOON"
    And the output contains "troll inside"

    Examples:
      | command                    |
      | offer apple to dragon      |
      | give apple with dragon     |
      | feed apple to dragon       |
      | put apple on dragon        |
      | put apple with dragon      |
      | put apple to dragon        |

  Scenario: Friendly Dreadmaw chats without breathing fire
    Given item "apple" is carried
    And the player is in room "dragonCaveMouth"
    When I send "offer apple to dragon"
    And I send "talk to dragon"
    Then flag "onFire" is unset
    And the output contains "apple-bringer"
    And the output contains "troll inside"

  Scenario Outline: A valid rhyming word opens Dreadmaw's inner vault
    Given item "apple" is carried
    And the player is in room "dragonCaveMouth"
    When I send "offer apple to dragon"
    And I send "east"
    Then the current room is "dragonAntechamber"
    When I send "talk to troll"
    Then the output contains "Name a rhyme to pass this door"
    And the output contains "guard no ____"
    When I send "say <rhyme>"
    Then flag "dragonVaultOpen" is true
    And the output contains "vault door rolls open"
    When I send "east"
    Then the current room is "dreadmawVault"
    And the output contains "DREADMAW'S VAULT"

    Examples:
      | rhyme  |
      | more   |
      | door   |
      | floor  |
      | core   |
      | roar   |
      | lore   |
      | shore  |
      | store  |
      | before |

  Scenario: A non-rhyming answer leaves the vault locked
    Given item "apple" is carried
    And the player is in room "dragonCaveMouth"
    When I send "offer apple to dragon"
    And I send "east"
    And I send "talk to troll"
    And I send "answer banana"
    Then flag "dragonVaultOpen" is unset
    And the output contains "does not rhyme"

  Scenario: The troll ignores answers until he has asked the riddle
    Given item "apple" is carried
    And the player is in room "dragonCaveMouth"
    When I send "offer apple to dragon"
    And I send "east"
    And I send "answer more"
    Then flag "dragonVaultOpen" is unset
    And the output contains "TALK TO TROLL"

  Scenario: Mushroom flight cannot bypass the sleeping dragon or sealed vault
    Given flag "high" is set
    When I send "fly to dragon cave antechamber"
    Then the current room is "gate"
    And the output contains "sealed barrier"
    Given flag "high" is set
    When I send "fly to dreadmaw vault"
    Then the current room is "gate"
    And the output contains "sealed barrier"

# end dragon-maze.feature
