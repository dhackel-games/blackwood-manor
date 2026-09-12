Feature: The secret Gary cliffhanger ending
  Depositing every required heirloom into the reliquary opens a hidden staircase
  in the floor of the royal hall. Going DOWN leads to Gary's basement call-cave
  and the true cliffhanger ending — while the dawn ending via the BELL stays
  fully available, so the player gets a choice.

  Scenario: Depositing everything opens a secret staircase in the floor
    Given a fresh manor game
    And flag "frontDoorOpen" is set
    And the player is in room "grandHall"
    And every treasure but the "familyCrest" is already in the reliquary
    When I send "put family crest in reliquary"
    Then the output contains "STAIRCASE"
    And the output contains "DOWN"
    And flag "floorDoorOpen" equals 1

  Scenario: Descending the floor stair triggers the Gary cliffhanger ending
    Given a fresh manor game
    And flag "frontDoorOpen" is set
    And the player is in room "grandHall"
    And every treasure but the "familyCrest" is already in the reliquary
    When I send "put family crest in reliquary"
    And I send "down"
    Then the current room is "garysLair"
    And the output contains "GARY"
    And the output contains "FREEDOM"
    And the output contains "TO BE CONTINUED"
    And the game is won

  Scenario: The floor stays shut until every required heirloom is deposited
    Given a fresh manor game
    And flag "frontDoorOpen" is set
    And the player is in room "grandHall"
    And every treasure but the "familyCrest" is already in the reliquary
    When I send "down"
    Then the current room is "grandHall"
    And the game is not won

  Scenario: With every heirloom deposited, the dawn bell ending is still available
    Given a fresh manor game
    And flag "frontDoorOpen" is set
    And the player is in room "grandHall"
    And every treasure but the "familyCrest" is already in the reliquary
    When I send "put family crest in reliquary"
    And I send "close reliquary"
    And I send "ring bell"
    Then the output contains "BONE KEY"
    And the current room is "grandHall"
    And the game is not won

  Scenario: Once the reliquary is filling, a telephone rings from below (foreshadowing)
    Given a fresh manor game
    And chaos events (lightning jumps) are enabled
    And flag "frontDoorOpen" is set
    And the player is in room "grandHall"
    And every treasure but the "familyCrest" is already in the reliquary
    And flag "floorDoorOpen" is set
    And the random number generator always returns 0.0
    When I send "wait"
    Then the output contains "RINGING"
