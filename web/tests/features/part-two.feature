Feature: Part II — the Thirteenth Hour
  The Gary cliffhanger no longer ends the game; it opens Blackwood Manor Part II.
  As a ghost loose in the manor's own time you must recover the first scattered
  heirloom — the queen's emerald — from a petrifying gaze, using a mirror-still pool.

  Background:
    Given a fresh manor game

  Scenario: The descent seams straight into Part II as a ghost holding the clock
    When I execute sysop command "::garycliff"
    Then the game is alive
    And the game is not won
    And the current room is "p2_awakening"
    And the output contains "CLOCK"
    And flag "partII" is true

  Scenario: Naming the ghost and diving into the thirteenth hour
    When I execute sysop command "::garycliff"
    And I send "say David"
    And I send "use clock"
    Then the current room is "t13_medusaGarden"
    And the output contains "THIRTEENTH HOUR"

  Scenario: Yelling before finding the queen is harmless and points you at the statue
    When I execute sysop command "::garycliff"
    And I send "say David"
    And I send "use clock"
    And I send "yell"
    Then the game is alive
    And flag "emeraldFreed" is unset
    And the output contains "haven't even found her"

  Scenario: Finding the queen but yelling without the pool trick is fatal
    When I execute sysop command "::garycliff"
    And I send "say David"
    And I send "use clock"
    And I send "examine statue"
    And I send "yell"
    Then the game is dead
    And flag "queenFound" is true
    And flag "emeraldFreed" is unset
    And the output contains "still WATER"

  Scenario: Finding the queen and using the mirror pool frees the emerald safely
    When I execute sysop command "::garycliff"
    And I send "say David"
    And I send "use clock"
    And I send "examine statue"
    And I send "examine pool"
    And I send "yell"
    Then the game is alive
    And flag "emeraldFreed" is true
    And the output contains "greying to STONE"

  Scenario: Returning the emerald to the garden closes Hour XIII (full seam from the brink)
    When I execute sysop command "::brink"
    And I send "go down"
    And I send "say David"
    And I send "use clock"
    And I send "examine statue"
    And I send "examine pool"
    And I send "yell"
    And I send "use clock"
    And I send "south"
    And I send "south"
    And I send "east"
    And I send "put emerald in bush"
    Then the current room is "garden"
    And flag "emeraldFreed" is true
    And flag "hour13Done" is true
    And flag "clockHour" equals 12
    And the output contains "HOUR XIII CLOSED"
