# progress-scoring.feature. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-12.067:acoven.

@unit
Feature: One-time rewards for meaningful progress
  Puzzle solutions and important intermediate keys should confirm progress with
  points, while repeated actions must never farm the same reward.

  Background:
    Given a fresh manor game

  Scenario: Finding the iron key and opening the manor reward each breakthrough once
    Given the player is in room "garden"
    When I send "move statue"
    Then the output contains "(+5)"
    And the game score is 5
    When I send "move statue"
    Then the game score is 5
    When I send "take iron key"
    Then the output contains "(+5)"
    And the game score is 10
    Given the player is in room "porch"
    When I send "unlock front door with iron key"
    And I send "open front door"
    Then the output contains "(+5)"
    And the game score is 15
    When I send "close front door"
    And I send "open front door"
    Then the game score is 15

  Scenario: Implicitly taking an intermediate key still awards its progress points
    Given the player is in room "garden"
    When I send "move statue"
    And I send "read iron"
    Then item "frontKey" is carried
    And the game score is 10

  Scenario: Legacy accidental fires do not count as deliberate survival
    Given a legacy accidental-fire save is restored
    Then flag "progressAward:selfFireSurvived" is unset
    And the game score is 0

  Scenario: Well, cellar, and library discoveries award once
    Given item "rope" is carried
    And the player is in room "garden"
    When I send "down"
    Then the output contains "(+5)"
    And the game score is 5
    When I send "down"
    Then the game score is 5
    Given the player is in room "kitchen"
    When I send "open cellar"
    Then the output contains "(+5)"
    And the game score is 10
    When I send "open cellar"
    Then the game score is 10
    Given the player is in room "library"
    When I send "pull lever"
    Then the output contains "(+5)"
    And the game score is 15
    When I send "pull lever"
    Then the game score is 15

  Scenario: Discovering and opening the hidden safe awards each step once
    Given the player is in room "study"
    When I send "read diary"
    Then the output contains "(+5)"
    And the game score is 5
    When I send "read diary"
    Then the game score is 5
    Given the player is in room "parlor"
    When I send "move painting"
    Then the output contains "(+5)"
    And the game score is 10
    When I send "open safe with 7 3 9"
    Then the output contains "(+5)"
    And the game score is 15
    When I send "close safe"
    And I send "open safe"
    Then the game score is 15

  Scenario: The tiny key route awards its container, key, and lock solution
    Given the player is in room "nursery"
    When I send "open music box"
    Then the output contains "(+5)"
    And the game score is 5
    When I send "take tiny key"
    Then the output contains "(+5)"
    And the game score is 10
    Given the player is in room "masterBedroom"
    When I send "unlock jewelry box with tiny key"
    And I send "open jewelry box"
    Then the output contains "(+5)"
    And the game score is 15
    When I send "close jewelry box"
    And I send "open jewelry box"
    Then the game score is 15

  Scenario: The nursery wall route rewards discovery and deliberate entry
    Given the player is in room "nursery"
    When I send "pull wallpaper"
    Then the output contains "(+5)"
    And the game score is 5
    When I send "pull wallpaper"
    Then the game score is 5
    When I send "in"
    Then the current room is "betweenWalls"
    And the output contains "(+20)"
    And the game score is 25
    When I send "take watch"
    Then the game score is 25

  Scenario: Passing the wraith with the talisman awards once
    Given item "talisman" is carried
    And flag "__suSight" is set
    And the player is in room "wineCellar"
    When I send "wear talisman"
    And I send "south"
    Then the output contains "(+5)"
    And the game score is 5
    When I send "north"
    And I send "south"
    Then the game score is 5

  Scenario: Sealing the collection and using both final keys rewards each step
    Given every treasure but the "ancestralPortrait" is already in the reliquary
    And the player is in room "grandHall"
    When I send "put ancestral portrait in reliquary"
    Then the game score is 20
    When I send "close reliquary"
    Then the output contains "(+5)"
    And the game score is 25
    When I send "open reliquary"
    And I send "close reliquary"
    Then the game score is 25
    When I send "ring bell"
    Then the output contains "(+5)"
    And the game score is 30
    When I send "take bone key"
    Then the output contains "(+5)"
    And the game score is 35
    When I send "unlock secret door with bone key"
    And I send "open secret door"
    Then the output contains "(+5)"
    And the game score is 40
    When I send "close secret door"
    And I send "open secret door"
    Then the game score is 40

# end progress-scoring.feature
