# oak-tree-fort.feature Copyright (c) 2026:dhackel-games. All Rights Reserved. Do Not Distribute.

@unit
Feature: The RGB oak lift and Blackwood tree fort
  The glass stones must focus sunlight in red-green-blue order before the
  alternating pulley platform can reach the fort and its family spyglass.

  Background:
    Given a fresh manor game
    And the player is in room "greatOak"
    And item "emberStone" is carried

  Scenario: The mechanism starts incomplete and explicitly hints RGB
    When I send "examine mechanism"
    Then the output contains "BLUE · GREEN"
    And the output contains "R G B"
    And flag "oakLightAligned" is unset

  Scenario: Any order other than RGB scatters the sunlight
    When I send "take blue stone"
    And I send "put blue stone in mechanism"
    Then the output contains "GREEN · BLUE"
    And the output contains "scatters uselessly"
    And flag "oakLightAligned" is unset
    And item "oakPlatform" is destroyed

  Scenario: Red green blue focuses the beam and lowers the platform
    When I send "take green stone"
    And I send "take blue stone"
    And I send "put ember stone in mechanism"
    And I send "put green stone in mechanism"
    And I send "put blue stone in mechanism"
    Then the output contains "RED · GREEN · BLUE"
    And the output contains "brilliant white beam"
    And flag "oakLightAligned" is set
    And item "oakPlatform" is in "greatOak"

  Scenario: TAKE ALL removes both installed stones without corrupting their order
    When I send "take all"
    Then item "greenGlassStone" is carried
    And item "blueGlassStone" is carried
    When I send "examine mechanism"
    Then the output contains "all three sockets are empty"
    When I send "put ember stone in mechanism"
    And I send "put green stone in mechanism"
    And I send "put blue stone in mechanism"
    Then flag "oakLightAligned" is set

  Scenario: Boarding waits one turn before carrying the player to the fort
    When I send "take green stone"
    And I send "take blue stone"
    And I send "put ember stone in mechanism"
    And I send "put green stone in mechanism"
    And I send "put blue stone in mechanism"
    And I send "step onto platform"
    Then the current room is "greatOak"
    And the output contains "next turn"
    When I send "wait"
    Then the current room is "treeFort"
    And the output contains "BLACKWOOD TREE FORT"

  Scenario: The empty platform alternates and carries the player back down
    When I send "take green stone"
    And I send "take blue stone"
    And I send "put ember stone in mechanism"
    And I send "put green stone in mechanism"
    And I send "put blue stone in mechanism"
    And I send "enter platform"
    And I send "wait"
    And I send "wait"
    Then item "oakPlatform" is in "greatOak"
    When I send "wait"
    Then item "oakPlatform" is in "treeFort"
    When I send "enter platform"
    And I send "wait"
    Then the current room is "greatOak"

  Scenario: Walking away after boarding disembarks instead of teleporting the player
    When I send "take green stone"
    And I send "take blue stone"
    And I send "put ember stone in mechanism"
    And I send "put green stone in mechanism"
    And I send "put blue stone in mechanism"
    And I send "enter platform"
    And I send "west"
    Then the current room is "privy"
    And flag "oakLiftRiding" is false

  Scenario: Hidden shortcuts can route down from the tree fort
    When I send "take green stone"
    And I send "take blue stone"
    And I send "put ember stone in mechanism"
    And I send "put green stone in mechanism"
    And I send "put blue stone in mechanism"
    And I send "enter platform"
    And I send "wait"
    Then the path from the current room to "PRIVY" is "out; wait; west"

  Scenario: Temporary flight cannot bypass an unsolved lift and strand the player
    Given flag "high" is 1
    When I send "fly tree fort"
    Then the current room is "greatOak"
    And the output contains "RGB sunlight"
    And the game is alive

  Scenario: The BM spyglass reveals the roof route and replaces the ember heirloom
    Given the player is in room "treeFort"
    When I send "examine spyglass"
    Then the output contains "BELFRY"
    And the output contains "ROOF"
    When I send "take spyglass"
    Then item "spyglass" is carried
    And the output contains "BM"
    Given the player is in room "grandHall"
    When I send "put spyglass in reliquary"
    Then the output contains "Family heirlooms: 1/12"
    And the game score is 8

  Scenario: The ember stone no longer contributes to the family collection
    Given the player is in room "grandHall"
    When I send "put ember stone in reliquary"
    Then the output contains "Family heirlooms: 0/12"
    And the output contains "does not contribute"
    When I send "take ember stone from reliquary"
    Then item "emberStone" is carried
    And the output contains "releases the non-contributing"

  Scenario: A stone nested in a deposited heirloom remains retrievable
    Given item "musicBox" is carried
    And the player is in room "grandHall"
    When I send "open music box"
    And I send "take tiny key"
    And I send "put ember stone in music box"
    And I send "put music box in reliquary"
    And I send "take ember stone from reliquary"
    Then item "emberStone" is carried
    And item "musicBox" is in "reliquary"
    And the output contains "releases the non-contributing"

  Scenario: A nested family heirloom can be recovered until it occupies its own recess
    Given item "musicBox" is carried
    And item "rubyRing" is carried
    And the player is in room "grandHall"
    When I send "open music box"
    And I send "take tiny key"
    And I send "put ruby ring in music box"
    And I send "put music box in reliquary"
    And I send "take ruby ring from reliquary"
    Then item "rubyRing" is carried
    And item "musicBox" is in "reliquary"
    And the output contains "releases the non-contributing"

  Scenario: Legacy saves gain the new oak objects and preserve completed heirloom progress
    Given a legacy pre-oak save with the ember deposited is restored
    Then item "spyglass" is in "reliquary"
    And item "greenGlassStone" is in "oakMechanism"
    And item "blueGlassStone" is in "oakMechanism"
    And item "oakPlatform" is destroyed
    And item "silverChalice" is absent from game state
    And item "jeweledCrown" is absent from game state

  Scenario: A completed legacy collection gains both current completion flags
    Given every treasure but the "emberStone" is already in the reliquary
    And a legacy pre-oak save with the ember deposited is restored
    Then flag "curseLiftable" is set
    And flag "floorDoorOpen" is set
    And item "talisman" is in "reliquary"

# end oak-tree-fort.feature
