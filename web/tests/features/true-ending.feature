Feature: The secret Gary cliffhanger ending
  Depositing EVERYTHING (every core heirloom AND every bonus treasure) into the
  reliquary opens a hidden staircase in the floor of the grand hall. Going DOWN
  leads to Gary's basement call-cave and the true cliffhanger ending — while the
  dawn ending via the BELL stays fully available, so the player gets a choice.

  Scenario: Depositing everything opens a secret staircase in the floor
    Given a fresh manor game
    And flag "frontDoorOpen" is set
    And the player is in room "grandHall"
    And every treasure but the "jeweledCrown" is already in the reliquary
    When I send "put crown in reliquary"
    Then the output contains "STAIRCASE"
    And the output contains "DOWN"
    And flag "floorDoorOpen" equals 1

  Scenario: Descending the floor stair triggers the Gary cliffhanger ending
    Given a fresh manor game
    And flag "frontDoorOpen" is set
    And the player is in room "grandHall"
    And every treasure but the "jeweledCrown" is already in the reliquary
    When I send "put crown in reliquary"
    And I send "down"
    Then the current room is "garysLair"
    And the output contains "GARY"
    And the output contains "FREEDOM"
    And the output contains "TO BE CONTINUED"
    And the game is won

  Scenario: The floor stays shut until literally everything is deposited
    Given a fresh manor game
    And flag "frontDoorOpen" is set
    And the player is in room "grandHall"
    And every treasure but the "jeweledCrown" is already in the reliquary
    When I send "down"
    Then the current room is "grandHall"
    And the game is not won

  Scenario: With everything deposited, the dawn bell ending is still available (the choice is preserved)
    Given a fresh manor game
    And flag "frontDoorOpen" is set
    And the player is in room "grandHall"
    And every treasure but the "jeweledCrown" is already in the reliquary
    When I send "put crown in reliquary"
    And I send "ring bell"
    Then the output contains "BONE KEY"
    And the current room is "grandHall"
    And the game is not won

  Scenario: Once the reliquary is filling, a telephone rings from below (foreshadowing)
    Given a fresh manor game
    And chaos events (lightning jumps) are enabled
    And flag "frontDoorOpen" is set
    And the player is in room "grandHall"
    And every treasure but the "jeweledCrown" is already in the reliquary
    And flag "floorDoorOpen" is set
    And the random number generator always returns 0.0
    When I send "wait"
    Then the output contains "RINGING"
