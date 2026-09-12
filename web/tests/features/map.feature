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
    And the output contains "Front Gate: WEST to Hedge Maze; EAST to Garden."
    And the output contains none of:
      | Royal Hall |
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

  Scenario: Map lists canonical names for every visited location
    When I send "look"
    And I send "east"
    And I send "east"
    And I send "map"
    Then the output contains "Visited Locations"
    And the output does not contain "(FLY TO ...)"
    And the output contains "Front Gate"
    And the output contains "Overgrown Garden"
    And the output contains "Ivy-Choked Privy"
    And the output does not contain "Royal Hall"

  Scenario: The map's ticker-tape holes stay in straight columns
    When I send "map"
    Then the map sprocket holes are column-aligned

  Scenario: The grounds map places the maze west and garden east of the gate
    When I send "look"
    And I send "west"
    And I send "map"
    Then the output contains "X Hedge Maze"
    And the output contains "Front Gate"
    When I send "east"
    And I send "east"
    And I send "map"
    Then the output contains "X Garden"

  Scenario: The oak and tree fort appear on their own connected map levels
    Given the player is in room "greatOak"
    When I send "look"
    And I send "map"
    Then the output contains "X Great Oak"
    And the output does not contain "TREE CANOPY"
    Given the player is in room "treeFort"
    When I send "map"
    Then the output contains "X Tree Fort"
    And the output contains "(Great Oak)"

  Scenario: The renamed astral chamber remains hidden until visited
    Given the player is in room "belfry"
    When I send "map"
    Then the output does not contain "Astral Chamber"
    Given the player is in room "hiddenVault"
    When I send "map"
    Then the output contains "X Astral Chamber"

# end map.feature
