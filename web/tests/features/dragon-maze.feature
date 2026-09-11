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

  Scenario Outline: Jostling Dreadmaw burns or launches the player but never moves her
    Given the player is in room "dragonCaveMouth"
    When I send "<command>"
    Then Dreadmaw's rebuke burns the player or launches them to the front gate
    And flag "dragonMoved" is unset

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

  Scenario Outline: Saying or yelling near sleeping Dreadmaw wakes her violently
    Given the player is in room "dragonCaveMouth"
    When I send "<command>"
    Then the output contains these phrases in order:
      | "Foo"                |
      | DREADMAW THE DRAGON |
    And Dreadmaw's rebuke burns the player or launches them to the front gate
    And flag "dragonMoved" is unset

    Examples:
      | command   |
      | say "foo" |
      | yell foo  |

  Scenario: A hostile wake-up never clears the cave entrance
    Given the player is in room "dragonCaveMouth"
    When I send "wake dragon"
    And the player moves directly to room "dragonCaveMouth"
    And I send "east"
    Then the current room is "dragonCaveMouth"
    And the output contains "sleeping across the entire cave mouth"

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

  Scenario: The doubloon carries the intended rhyme without making it mandatory
    Given item "apple" is carried
    And the player is in room "dragonCaveMouth"
    When I send "offer apple to dragon"
    And I send "examine doubloon"
    Then the output contains "etched by hand: LORE"

  Scenario Outline: A valid rhyming word opens Dreadmaw's inner vault
    Given item "apple" is carried
    And the player is in room "dragonCaveMouth"
    When I send "offer apple to dragon"
    And I send "east"
    Then the current room is "dragonAntechamber"
    When I play this command sequence:
      """
      east
      down
      east
      """
    Then the current room is "trollGate"
    When I send "talk to troll"
    Then the output contains "Past this door lie gold and ore"
    And the output contains "Treasure, terror, blood, and ____"
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

  Scenario: ENTER VAULT works the same as EAST once the door is open
    Given item "apple" is carried
    And the player is in room "dragonCaveMouth"
    When I send "offer apple to dragon"
    And I play this command sequence:
      """
      east
      east
      down
      east
      """
    Then the current room is "trollGate"
    When I send "enter vault"
    Then the current room is "trollGate"
    And the output contains "sealed behind the TROLL"
    When I send "talk to troll"
    And I send "say more"
    Then flag "dragonVaultOpen" is true
    When I send "enter vault"
    Then the current room is "dreadmawVault"

  Scenario: A non-rhyming answer leaves the vault locked
    Given item "apple" is carried
    And the player is in room "dragonCaveMouth"
    When I send "offer apple to dragon"
    And I play this command sequence:
      """
      east
      east
      down
      east
      """
    And I send "talk to troll"
    And I send "answer banana"
    Then flag "dragonVaultOpen" is unset
    And the output contains "does not rhyme"

  Scenario: The troll ignores answers until he has asked the riddle
    Given item "apple" is carried
    And the player is in room "dragonCaveMouth"
    When I send "offer apple to dragon"
    And I play this command sequence:
      """
      east
      east
      down
      east
      """
    And I send "answer more"
    Then flag "dragonVaultOpen" is unset
    And the output contains "TALK TO TROLL"

  Scenario: Mushroom flight can reach named rooms beyond the dragon and troll
    Given flag "high" is 4
    When I send "fly to dragon cave antechamber"
    Then the current room is "dragonAntechamber"
    When I send "fly to dreadmaw vault"
    Then the current room is "dreadmawVault"

# end dragon-maze.feature
