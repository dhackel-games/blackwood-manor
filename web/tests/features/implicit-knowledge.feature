# implicit-knowledge.feature. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.002:copilot.

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

  Scenario: TAKE opens a known closed mailbox before taking its letter once
    Given the player is in room "porch"
    When I send "open mailbox"
    And I send "close mailbox"
    And I send "take letter"
    Then the output contains "(open BRASS MAILBOX; take PHOTO LETTER)"
    And item "letter" is in "inventory"
    And the game score is 5

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

  Scenario Outline: Closed fridge milk uses the knowledge-gated action pipeline
    Given the player is in room "kitchen"
    When I send "<command>"
    Then the output equals "You can't see any milk here."
    When I send "open fridge"
    And I send "close fridge"
    And I send "<command>"
    Then the output contains "(open FRIDGE; get COLD MILK; drink COLD MILK)"
    And item "milk" is destroyed
    And the game score is 15

    Examples:
      | command    |
      | use milk   |
      | drink milk |
      | pour milk  |

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

  Scenario: Automatic hidden-sight toilet reveal preserves Extra Super Duper Helpless
    Given the player is in room "privy"
    And item "xrayGoggles" is carried
    When I send "wear goggles"
    And the room is automatically described
    Then flag "outhouseMushroomsFound" is set
    And flag "usedInspection" is unset

# end implicit-knowledge.feature
