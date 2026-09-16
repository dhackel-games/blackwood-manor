Feature: Part II — the Thirteenth Hour
  The Gary cliffhanger no longer ends the game; it opens Blackwood Manor Part II.
  As a ghost loose in the manor's own time you must recover the first scattered
  heirloom — the queen's emerald — from a petrifying gaze, using a mirror-still pool.

  Background:
    Given a fresh manor game

  Scenario Outline: Restart commands select the requested game part
    Then restart command "<command>" selects Part <part>

    Examples:
      | command              | part |
      | restart              | 1    |
      | restart 1            | 1    |
      | restart at beginning | 1    |
      | restart part 1       | 1    |
      | restart 2            | 2    |
      | restart at 2         | 2    |
      | restart part 2       | 2    |

  Scenario: Browser restart handling exposes both game parts
    Then browser restart handling supports both game parts

  Scenario: The descent seams straight into Part II as a ghost holding the clock
    When I fast-forward into Part II
    Then the game is alive
    And the game is not won
    And the current room is "p2_awakening"
    And the output contains "CLOCK"
    And the output contains "EXAMINE the CLOCK"
    And the output does not contain "thirteen Blackwood heirlooms are inside it"
    And flag "partII" is true

  Scenario: Examining the clock explains it before the ghost enters the thirteenth hour
    When I fast-forward into Part II
    And I send "examine clock"
    Then the output contains "thirteen Blackwood heirlooms are inside it"
    And flag "clockExplained" is true
    And I send "use clock"
    Then the current room is "t13_medusaGarden"
    And the output contains "THIRTEENTH HOUR"

  Scenario: Yelling before finding the queen is harmless and points you at the statue
    When I fast-forward into Part II
    And I send "examine clock"
    And I send "use clock"
    And I send "yell"
    Then the game is alive
    And flag "emeraldFreed" is unset
    And the output contains "haven't even found her"

  Scenario: Finding the queen but yelling without the pool trick is fatal
    When I fast-forward into Part II
    And I send "examine clock"
    And I send "use clock"
    And I send "examine statue"
    And I send "yell"
    Then the game is dead
    And flag "queenFound" is true
    And flag "emeraldFreed" is unset
    And the output contains "still WATER"
    And the output contains "RESTART 1"
    And the output contains "RESTART 2"
    And checkpoint "partII" exists

  Scenario: Restarting Part II restores the serialized ghost awakening
    When I fast-forward into Part II
    And I round-trip the game snapshot
    And I send "examine clock"
    And I send "use clock"
    And I send "examine statue"
    And I send "yell"
    Then the game is dead
    When I restart from checkpoint "partII"
    Then the game is alive
    And the game is not won
    And the current room is "p2_awakening"
    And flag "playerName" is unset
    And flag "clockExplained" is false
    And the output contains "What should we call you?"
    When I send "call me Ada"
    Then flag "playerName" equals "Ada"
    And the output contains "You are a ghost, Ada"
    And the output contains "EXAMINE the CLOCK"

  Scenario: Finding the queen and using the mirror pool frees the emerald safely
    When I fast-forward into Part II
    And I send "examine clock"
    And I send "use clock"
    And I send "examine statue"
    And I send "examine pool"
    And I send "yell"
    Then the game is alive
    And flag "emeraldFreed" is true
    And the output contains "greying to STONE"

  Scenario: Returning the emerald to the garden closes Hour XIII (full seam from the brink)
    When I execute sysop command "::winmax2bell"
    And I send "open bell closet"
    And I send "pull bell rope"
    And I send "examine reliquary"
    And I send "open reliquary"
    And I send "take clock"
    And I send "go down"
    And I send "examine clock"
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
