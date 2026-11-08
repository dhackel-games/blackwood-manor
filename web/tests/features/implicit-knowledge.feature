# implicit-knowledge.feature. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.001:acoven.

@unit
Feature: Known targets for implicit actions
  Implicit actions may prepare a known item, but never discover a hidden one
  without an explicit inspection or permanent hidden sight.

  Background:
    Given a fresh manor game

  Scenario: A closed mailbox hides its letter until it has been opened once
    Given the player is in room "porch"
    When I send "read letter"
    Then the output equals "You can't see any letter here."
    When I send "open mailbox"
    And I send "close mailbox"
    And I send "read letter"
    Then the output contains "(open BRASS MAILBOX; get PHOTO LETTER; read PHOTO LETTER)"
    And flag "progressAward:letterRead" is set
    And the game score is 15

  Scenario: XRAY sight lists a closed mailbox's letter and makes it an implicit target
    Given item "xrayGoggles" is carried
    And the player is in room "porch"
    When I send "wear goggles"
    And I send "look"
    Then the output contains "THIRD EYE"
    And the output contains "Inside the BRASS MAILBOX, you see PHOTO LETTER."
    When I send "read letter"
    Then the output contains "(open BRASS MAILBOX; get PHOTO LETTER; read PHOTO LETTER)"

  Scenario: Closed fridge contents need discovery before USE can prepare them
    Given the player is in room "kitchen"
    When I send "use limburger"
    Then the output equals "You can't see any limburger here."
    When I send "open fridge"
    And I send "close fridge"
    And I send "use limburger"
    Then the output contains "(open FRIDGE; get LIMBURGER; eat LIMBURGER)"

  Scenario: Toilet mushrooms require a look unless hidden sight reveals them
    Given the player is in room "privy"
    When I send "use fresh"
    Then the output equals "You can't see any fresh here."
    When I send "look in toilet"
    And I send "use fresh"
    Then the output contains "(get FRESH MUSHROOMS; eat FRESH MUSHROOMS)"
    Given a fresh manor game
    And item "xrayGoggles" is carried
    And the player is in room "privy"
    When I send "wear goggles"
    And I send "look"
    Then the output contains "Fresh purple MUSHROOMS"
    When I send "use fresh"
    Then flag "high" is positive

# end implicit-knowledge.feature
