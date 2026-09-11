# mushroom-flight.feature Copyright (c) 2026:dhackel-games. All Rights Reserved. Do Not Distribute.

@walkthrough @mushroom
Feature: Mushroom vision and flight
  While the mushroom trip lasts, the player sees hidden clues immediately,
  sees in the dark, and can float to named rooms or across vertical
  obstacles — but gets no immunity from supernatural hazards.

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
    When I send "eat mushrooms"
    Then the output contains "(look in toilet, get mushrooms, eat mushrooms)"
    Then the output contains "literal shit and piss"
    And the output contains "actual human waste"
    And flag "high" equals 12
    And item "outhouseMushrooms" is destroyed
    And item "mushrooms" is in "kitchen"

  Scenario: An eaten batch of privy mushrooms can regrow given enough time
    Given a fresh manor game
    And the player is in room "privy"
    When I send "look in toilet"
    And I send "eat mushrooms"
    Given chaos events (lightning jumps) are enabled
    And the random number generator always returns 0.0
    When I send "wait"
    Then the output contains "stirs in the TOILET HOLE"
    And item "outhouseMushrooms" is in "privy"
    When I send "eat mushrooms"
    Then flag "high" is positive

  Scenario: A carried, uneaten batch of privy mushrooms does not regrow
    Given a fresh manor game
    And the player is in room "privy"
    When I send "look in toilet"
    And I send "take mushrooms"
    Given chaos events (lightning jumps) are enabled
    And the random number generator always returns 0.0
    When I send "wait"
    Then the output does not contain "stirs in the TOILET HOLE"
    And item "outhouseMushrooms" is in "inventory"

  Scenario Outline: Getting toilet mushrooms derives the missing look
    Given a fresh manor game
    And the player is in room "privy"
    When I send "<command>"
    Then the output contains "(look in toilet"
    Then the output contains "coated in literal shit and piss"
    And item "outhouseMushrooms" is in "inventory"

    Examples:
      | command                         |
      | get mushrooms from toilet       |
      | reach into toilet for mushrooms |

  Scenario: Dried kitchen mushrooms hint that flight is possible
    Then the output contains "dried kitchen mushrooms"
    Then the output contains "so light you could FLY TO any room you can name"
    And flag "high" equals 12

  Scenario: Eating dried and fresh mushrooms adds both durations
    Given a fresh manor game
    And the player is in room "kitchen"
    And item "outhouseMushrooms" is carried
    When I send "eat dried mushrooms"
    And I send "eat fresh mushrooms"
    Then flag "high" equals 24

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

  Scenario: The mushroom trip's third eye lights up dark rooms, no grue warning needed
    When I send "fly to wine cellar"
    Then the game is alive
    And the output contains "MUSHROOM VISION"
    And the output does not contain "pitch black"

  Scenario: The crypt wraith still kills an unprotected high player
    When I send "float to crypt"
    Then the game is dead
    And the output contains "WRAITH"

# end mushroom-flight.feature
