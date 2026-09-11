# mushroom-flight.feature Copyright (c) 2026:dhackel-games. All Rights Reserved. Do Not Distribute.

@walkthrough @mushroom
Feature: Mushroom vision and flight
  While the mushroom high lasts, the player sees hidden clues immediately and
  can float to named rooms or across vertical obstacles, without immunity from
  darkness or supernatural hazards.

  Background:
    Given a fresh manor game
    And the player is in room "kitchen"
    When I send "eat mushrooms"

  Scenario: Fresh mushrooms grow inside the outhouse toilet hole
    Given a fresh manor game
    And the player is in room "privy"
    When I send "look"
    Then the output contains "TOILET HOLE"
    And the output contains "purple glimmer"
    When I send "take mushrooms"
    Then the output contains "can't see"
    When I send "look in toilet"
    Then the output contains "MUSHROOMS"
    And the output contains "literal shit and piss"
    When I send "get mushrooms from toilet"
    Then the output contains "coated in literal shit and piss"
    And item "outhouseMushrooms" is in "inventory"
    When I send "eat mushrooms"
    Then the output contains "literal shit and piss"
    And the output contains "actual human waste"
    And flag "high" equals 12
    And item "outhouseMushrooms" is destroyed
    And item "mushrooms" is in "kitchen"

  Scenario: Reaching into the toilet requires looking first
    Given a fresh manor game
    And the player is in room "privy"
    When I send "reach into toilet for mushrooms"
    Then the output contains "LOOK IN THE TOILET first"
    When I send "look in toilet"
    And I send "reach into toilet for mushrooms"
    Then the output contains "coated in literal shit and piss"
    And item "outhouseMushrooms" is in "inventory"

  Scenario: Dried kitchen mushrooms are half-strength and hint that flight is possible
    Then the output contains "dried kitchen mushrooms"
    Then the output contains "so light you could FLY TO any room you can name"
    And flag "high" equals 6

  Scenario: Eating dried and fresh mushrooms adds both durations
    Given a fresh manor game
    And the player is in room "kitchen"
    And item "outhouseMushrooms" is carried
    When I send "eat dried mushrooms"
    And I send "eat fresh mushrooms"
    Then flag "high" equals 18

  Scenario: First glance reveals hidden objects
    When the player moves directly to room "gate"
    And I send "east"
    Then the output contains "MUSHROOM VISION"
    And the output contains "IRON KEY"
    And the output contains "ANCIENT COIN"
    And the output contains "BRAZIER"

  Scenario Outline: High players can travel directly to named rooms
    When I send "<command>"
    Then the current room is "<room>"

    Examples:
      | command                    | room          |
      | go to attic                | attic         |
      | float to nursery           | nursery       |
      | fly to front gate          | gate          |
      | go master bedroom          | masterBedroom |

  Scenario: Players cannot fly to named rooms when sober
    Given a fresh manor game
    When I send "fly to attic"
    Then the current room is "gate"
    And the output contains "can't go that way"

  Scenario: High players float into and out of the well without a rope
    When the player moves directly to room "garden"
    And I send "down"
    Then the game is alive
    And item "ancientCoin" is in "garden"
    And the output contains "float back into the garden"

  Scenario: High players reach the attic without lowering its ladder
    When I send "take all"
    And the player moves directly to room "landing"
    And I send "up"
    Then the game is alive
    And the current room is "attic"
    And the output contains "float through the closed trap-door"

  Scenario: Darkness still gives one warning turn before the grue attacks
    When I send "fly to wine cellar"
    Then the game is alive
    And the output matches "pitch black|grue"
    When I send "wait"
    Then the game is dead
    And the output contains "grue"

  Scenario: The crypt wraith still kills an unprotected high player
    When I send "float to crypt"
    Then the game is dead
    And the output contains "WRAITH"

# end mushroom-flight.feature
