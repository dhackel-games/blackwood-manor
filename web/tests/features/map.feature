# map.feature Copyright (c) 2026:dhackel-games. All Rights Reserved. Do Not Distribute.

@walkthrough
Feature: Spoiler-safe map mode
  The map must orient the player without exposing unvisited floors, hidden
  chambers, or the secret wing.

  Background:
    Given a fresh manor game

  Scenario: The initial map marks only the current known area
    When I send "map"
    Then the output contains "X Front Gate"
    And the output contains "?????"
    And the output does not match "UPSTAIRS|GROUND FLOOR|BELOW"
    And the output contains regex "X [A-Z]" exactly 1 time
    And the output contains none of:
      | Grand Hall |
      | Landing    |
      | well       |
      | Passage    |
      | Sanctum    |
      | Hidden Rm  |
      | Well       |

  Scenario: The hidden chamber remains absent from the library map
    Given the player is in room "library"
    When I send "map"
    Then the output contains "X Library"
    And the output does not contain "BELOW"
    And the output does not contain "Hidden Rm"

  Scenario: The secret wing appears after entering it
    Given the player is in room "hollowPassage"
    When I send "map"
    Then the output contains "X Passage"

  Scenario: Gary offers the map after repeated fruitless hints only once
    When I send "call"
    And I send "hint"
    And I send "hint"
    Then the output contains "Type MAP"
    When flag "mapOffered" is set
    And I send "hint"
    Then the output does not contain "Type MAP"

  Scenario: Map works without hanging up Gary
    When I send "call"
    And I send "map"
    Then flag "onCall" is true
    And the output contains "X Front Gate"

  Scenario: Scoring progress resets Gary's stuck streak
    When I send "call"
    And I send "hint"
    And I add 10 points
    And I send "hint"
    Then the output does not contain "Type MAP"

# end map.feature
