# engine.feature Copyright (c) 2026:dhackel-games. All Rights Reserved. Do Not Distribute.

@unit
Feature: Generic text-adventure engine
  The content-free engine must preserve game state, parser-driven actions,
  inspection behavior, hazards, persistence, and command chaining.

  Background:
    Given a fresh fixture game

  Scenario: Initial state exposes the configured room and visible items
    Then the current room is "hall"
    And item "key" is in "hall"
    And room "hall" contains exactly "box,candle,key,match"
    And finding "brass key" returns item "key"
    And finding "nonsense" returns nothing

  Scenario: Movement and inventory actions update state
    When I send "look"
    Then the output contains "HALL"
    When I send "take key"
    Then the output contains "Taken"
    And inventory contains exactly "key"
    When I send "i"
    Then the output contains "brass key"
    When I send "north"
    Then the output contains "STUDY"
    And the current room is "study"
    When I send "take desk"
    Then the output contains "portable"
    When I send "drop key"
    Then the output contains "Dropped"
    And item "key" is in "study"
    When I send "south"
    Then the output contains "HALL"

  Scenario Outline: Every item-inspection phrase shows item detail
    When I send "<command>"
    Then the output contains "brass key"

    Examples:
      | command            |
      | search brass key   |
      | ex brass key       |
      | examine brass key  |
      | look brass key     |
      | look at brass key  |

  Scenario Outline: Every nounless inspection phrase searches the room
    When I send "<command>"
    Then the output contains these phrases in order:
      | A dusty hall.       |
      | CLOSER INSPECTION   |
    And the output contains "Scratches on the floor"
    And the output contains "KEY: TAKE"
    And the output contains "BOX: UNLOCK, OPEN, PUT ITEMS IN"

    Examples:
      | command  |
      | search   |
      | ex       |
      | examine  |
      | look     |
      | look at  |

  Scenario: Room art appears on first entry and explicit inspection
    When I send "look"
    Then the output contains "[HALL ART]"
    And the output contains line "Directions you can go: north, down"
    When I send "north"
    Then the output contains "[STUDY ART]"
    And the output contains line "Directions you can go: south"
    When I send "south"
    Then the output does not contain "[HALL ART]"
    And the output contains line "n, d"
    And the output does not contain "Directions you can go:"
    When I send "search"
    Then the output contains "[HALL ART]"
    And the output contains line "Directions you can go: north, down"

  Scenario: Locked containers can be opened and used with their key
    When I send "open box"
    Then the output contains "locked"
    When I send "take key"
    And I send "unlock box with key"
    Then the output contains "unlock"
    When I send "open box"
    Then the output matches "open|revealing"
    When I send "look"
    Then the output contains "note"
    When I send "read note"
    Then the output contains "BEWARE THE DARK"
    When I send "take note"
    Then the output contains "Taken"
    When I send "put note in box"
    Then the output contains "put"
    And item "note" is in "box"

  Scenario: Acting twice in darkness causes a grue death
    When I send "down"
    Then the output matches "pitch black|grue"
    When I send "look"
    Then the output contains "grue"
    And the game is dead

  Scenario: A lit candle permits dark-room travel until its fuel expires
    When I send "take candle"
    And I send "take match"
    And I send "light candle"
    Then the output matches "flick|life|lit"
    When I send "down"
    Then the output contains "CELLAR"
    And the game is alive
    When I repeatedly send "look" at most 8 times until death
    Then the game is dead

  Scenario: A snapshot restores room and inventory state
    When I send "take key"
    And I send "north"
    And I save a game snapshot
    And I restore that snapshot into a fresh fixture game
    Then the current room is "study"
    And inventory contains exactly "key"

  Scenario: Score reports points, turns, and rank
    When I send "score"
    Then the output contains "score is 0"
    When I send "score"
    Then the output contains "Trespasser"

  Scenario: Content handlers override generic commands
    Given a fresh fixture game with a working lever
    When I send "pull lever"
    Then the output contains "clicks"
    And flag "leverPulled" is true

  Scenario: Chained commands execute once each in order
    When I send "take key; go north"
    Then the output contains "> take key"
    And the output contains "> go north"
    And the turn count is 2
    And the current room is "study"

  Scenario: Chained directions move north and then south
    When I send "n; s"
    Then the turn count is 2
    And the current room is "hall"

  Scenario: An unknown chained command aborts later commands
    When I send "frobnicate key; go north"
    Then the output contains "I don't know the word \"frobnicate\""
    And the current room is not "study"

  Scenario: A single command has no chain prefix
    When I send "look"
    Then the output does not start with "> "

# end engine.feature
