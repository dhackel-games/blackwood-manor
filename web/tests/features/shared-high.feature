# shared-high.feature. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.001:acoven.

@unit @lane9
Feature: Shared high sources
  Every declared high source shares one stacking trip, while each source
  retains its own opening and dose lifecycle.

  Scenario: High reactions complete a cycle across save and restore
    Given a fresh shared-high fixture game
    When I take 6 cycle doses
    And I save and restore the shared-high fixture game
    And I take 6 cycle doses
    Then the shared-high reaction history has 12 distinct entries
    When I take 1 cycle doses
    Then the shared-high reaction history repeats its first entry after a full cycle

  Scenario: Declared source doses stack, keep snuff, and destroy wine
    Given a fresh shared-high fixture game
    When I send "sniff test snuff"
    Then flag "high" equals 6
    And fixture source "testSnuff" has 2 doses remaining
    When I send "use test snuff"
    Then flag "high" equals 12
    And fixture source "testSnuff" has 1 doses remaining
    When I send "sniff test snuff"
    Then flag "high" equals 18
    And fixture source "testSnuff" has 0 doses remaining
    And item "testSnuff" is in "inventory"
    When I send "sniff test snuff"
    Then the output contains "test SNUFFBOX is empty"
    Given a fresh shared-high fixture game
    When I send "drink test wine"
    And I send "drink test wine"
    And I send "drink test wine"
    And I send "drink test wine"
    Then flag "high" equals 40
    And item "testWine" is destroyed

  Scenario: Shared high text stays source-neutral and mushrooms retain their duration
    Given a fresh manor game
    And the player is in room "kitchen"
    When I send "eat mushrooms"
    Then flag "high" equals 12
    And the output contains "dried KITCHEN MUSHROOMS"
    And all shared-high text is source-neutral

# end shared-high.feature
