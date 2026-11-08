# route-planner.feature. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.001:acoven.

@unit
Feature: Development-only route planner
  Walking follows the real room graph, gated exits, and the moving oak platform.

  Scenario: Ordinary exits and a locked front door
    Given the route has no unlocked exits
    When I plan a walk from "gate" to "privy"
    Then the planned walk has 2 room transitions
    And the planned walk commands are "e; e"
    When I plan a walk from "gate" to "grandHall"
    Then the planned walk is unreachable
    Given route flag "frontDoorOpen" is set
    When I plan a walk from "gate" to "grandHall"
    Then the planned walk has 2 room transitions
    And the planned walk commands are "n; n"

  Scenario: The mine locker is an explicit portal, not an ordinary exit
    Given the route has no unlocked exits
    When I plan a walk from "mineGallery" to "waylampClearing"
    Then the planned walk is unreachable
    Given the route locker is open
    When I plan a walk from "mineGallery" to "waylampClearing"
    Then the planned walk has 1 room transition
    And the planned walk commands are "in"

  Scenario: The aligned lift rides the actual four-beat cycle
    Given the route has no unlocked exits
    And route flag "oak:lowerPanelAligned" is set
    And route lift beat is 3
    When I plan a walk from "below" to "greatOak"
    Then the planned walk has 1 room transition
    And the planned walk commands are "in platform; z; out"
    When I plan a walk from "below" to "treeFort"
    Then the planned walk has 2 room transitions
    And the planned walk commands are "in platform; z; z; out"
    Given route lift beat is 0
    When I plan a walk from "greatOak" to "below"
    Then the planned walk has 1 room transition
    And the planned walk commands are "z; z; in platform; z; out"

  Scenario: The attic skylight requires physical flight, not a named teleport
    Given the route has no unlocked exits
    When I plan a walk from "attic" to "roof"
    Then the planned walk is unreachable
    Given the route has winged shoes
    When I plan a walk from "attic" to "roof"
    Then the planned walk has 1 room transition
    And the planned walk commands are "u"

  Scenario: The small problem finds the shorter collection order
    When I order the porch and garden collections
    Then the planned task order is "porch, garden"
    And the planned task route has 4 room transitions
    And the planned task commands are "n; open mailbox; s; e; take all; e"

  Scenario: Prerequisites and a puzzle ejection are state transitions
    When I order the key and manor door tasks
    Then the planned task order is "key, door"
    And the planned task route has 4 room transitions
    When I order the safe constellation and burning ejection
    Then the planned task order is "safe, eject"
    And the planned task route has 1 room transition
    And the planned task commands are "say 1; say 4; extinguish self"

# end route-planner.feature
