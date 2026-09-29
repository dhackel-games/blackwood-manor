# baron-clues.feature Copyright (c) 2026:dhackel-games. All Rights Reserved. Do Not Distribute.

@unit
Feature: Baron Munchhausen the Third leaks heirloom locations
  The walled-in Baron greets a visitor once, then alternates between grandiose
  tall tales and "helpful" clues that name a real, still-hidden heirloom and the
  real room it waits in — always wrapped in a Munchausen embellishment.

  Scenario: The first exchange is always his grand introduction
    Given a fresh manor game
    And the player is in room "betweenWalls"
    When I play this command sequence:
      """
      talk to baron
      """
    Then the output contains "BARON MUNCHHAUSEN THE THIRD, at your service"
    And the output does not contain "leans from the studs"

  Scenario: After the introduction he leaks where a hidden heirloom hides
    Given a fresh manor game
    And the player is in room "betweenWalls"
    And the random number generator always returns 0.0
    When I play this command sequence:
      """
      talk to baron
      talk to baron
      """
    Then the output contains "The BARON leans from the studs"
    And the output contains "Great Siege of the Chandeliers"
    And the output contains "SPYGLASS"
    And the output contains "BLACKWOOD TREE FORT"

  Scenario: A clue about a room whose name starts with "The" reads cleanly
    Given a fresh manor game
    And every treasure but the "blackwoodHammer" is already in the reliquary
    And item "blackwoodHammer" rests in room "betweenWalls"
    And the player is in room "betweenWalls"
    And the random number generator always returns 0.0
    When I play this command sequence:
      """
      talk to baron
      talk to baron
      """
    Then the output contains "The BARON leans from the studs"
    And the output contains "SPACE BETWEEN THE WALLS"
    And the output does not contain "the THE "

  Scenario: When he chooses a tall tale, no clue leaks through
    Given a fresh manor game
    And the player is in room "betweenWalls"
    And the random number generator always returns 0.9
    When I play this command sequence:
      """
      talk to baron
      talk to baron
      """
    Then the output contains "rode a cannonball in through the BELFRY"
    And the output does not contain "leans from the studs"

  Scenario: With every heirloom already recovered he has nothing left to leak
    Given a fresh manor game
    And every treasure but the "blackwoodHammer" is already in the reliquary
    And the player is in room "betweenWalls"
    And the random number generator always returns 0.0
    When I play this command sequence:
      """
      talk to baron
      talk to baron
      """
    Then the output does not contain "leans from the studs"

# end baron-clues.feature
