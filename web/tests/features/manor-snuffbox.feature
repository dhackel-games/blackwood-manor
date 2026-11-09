# manor-snuffbox.feature. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-09.001:acoven.

@lane8
Feature: Great-Grandpa Blackwood's snuffbox
  The LANDING bust yields a three-pinch heirloom through its left nostril.

  Background:
    Given a fresh manor game
    And the player is in room "landing"

  Scenario: The bust glint leads to the snuffbox
    When I send "examine bust"
    Then the output contains "silver glint"
    When I send "pick bust's nose"
    Then the output contains "pull out a SNUFFBOX"
    And flag "manor:snuffboxFound" is true
    And the snuffbox is carried as a treasure heirloom
    And the game score is 10
    When I send "pick nose"
    Then the output contains "already picked that nostril clean"
    When I send "search"
    Then the output does not contain "nostril"
    When I send "examine bust"
    Then the output does not contain "glint"

  Scenario: Hidden sight reveals the snuffbox before retrieval
    Given flag "high" is 1
    When I send "look"
    Then the output contains "Hidden sight picks out a silver box"
    And the output contains "PICK NOSE"

  Scenario: Gary directs the player to the bust
    When I call Gary and say "hint bust"
    Then the output contains "EXAMINE the MARBLE BUST on the LANDING"

  Scenario: Three pinches stack then leave the heirloom empty
    When I send "pick nose"
    And I send "sniff snuffbox"
    Then flag "high" equals 6
    And the snuffbox has 2 pinches remaining
    And the shared-high HUD remains a mushroom
    When I send "use snuffbox"
    Then flag "high" equals 12
    And the snuffbox has 1 pinches remaining
    When I send "smell snuffbox"
    Then flag "high" equals 18
    And flag "manor:snuffPinches" equals 3
    And the snuffbox has 0 pinches remaining
    And the snuffbox is carried as a treasure heirloom
    And the game score is 25
    When I send "sniff snuffbox"
    Then the output contains "The SNUFFBOX is EMPTY. It is still an heirloom, but there is nothing left to sniff."

  Scenario: Pinches persist across restore without renewing the use award
    When I send "pick nose"
    And I send "sniff snuffbox"
    And I send "sniff snuffbox"
    Then the snuffbox has 1 pinches remaining
    And the game score is 25
    When I round-trip the game snapshot
    Then the snuffbox has 1 pinches remaining
    When I send "sniff snuffbox"
    Then the snuffbox has 0 pinches remaining
    And flag "manor:snuffPinches" equals 3
    And the game score is 25
    When I send "sniff snuffbox"
    Then the output contains "The SNUFFBOX is EMPTY"
    And the game score is 25

# end manor-snuffbox.feature
