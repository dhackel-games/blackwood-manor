# end-awards.feature Copyright (c) 2026:dhackel-games. All Rights Reserved. Do Not Distribute.

@unit
Feature: End-game self-reliance awards
  Successful players earn score bonuses for avoiding assistance, inspection,
  and explicit save-state recovery.

  Background:
    Given a fresh manor game

  Scenario: HELPLESS rewards finishing without maps or requested help
    Given flag "usedInspection" is set
    And flag "usedSaveRestore" is set
    When I win with "You escape."
    Then the output contains "Helpless"
    And the output does not contain "Extra Super Duper Helpless"
    And the output does not contain "No Takebacks"
    And the game score is 15

  Scenario: EXTRA SUPER DUPER HELPLESS adds a bonus for never inspecting
    Given flag "usedSaveRestore" is set
    When I win with "You escape."
    Then the output contains "Helpless"
    And the output contains "Extra Super Duper Helpless"
    And the game score is 35

  Scenario: LOOK preserves HELPLESS but disqualifies its higher tier
    Given flag "usedSaveRestore" is set
    When I send "look"
    And I win with "You escape."
    Then the output contains "Helpless"
    And the output does not contain "Extra Super Duper Helpless"
    And the game score is 15

  Scenario Outline: Player-requested guidance disqualifies both HELPLESS tiers
    Given flag "usedInspection" is set
    And flag "usedSaveRestore" is set
    When I send "<command>"
    And I win with "You escape."
    Then the output does not contain "BADGE: \"Helpless\""
    And the output does not contain "Extra Super Duper Helpless"

    Examples:
      | command |
      | map     |
      | help    |
      | call    |

  Scenario: Derived convenience actions do not count as inspection help
    Given flag "usedSaveRestore" is set
    And the player is in room "study"
    When I send "read diary"
    And I win with "You escape."
    Then the output contains "Extra Super Duper Helpless"
    And the game score is 35

  Scenario: NO TAKEBACKS rewards a finish without SAVE or RESTORE
    Given flag "usedHelp" is set
    And flag "usedInspection" is set
    When I win with "You escape."
    Then the output contains "No Takebacks"
    And the game score is 10

  Scenario: An explicit save-state action disqualifies NO TAKEBACKS
    Given flag "usedHelp" is set
    And flag "usedInspection" is set
    And flag "usedSaveRestore" is set
    When I win with "You escape."
    Then the output does not contain "No Takebacks"
    And the game score is 0

# end end-awards.feature
