# hidden-sight.feature. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-09.002:acoven.

@walkthrough @lane9
Feature: Hidden sight parity
  A high, XRAY GOGGLES, and the OBSIDIAN EYE reveal the same searchable
  passages, without claiming an inaccessible route.

  Scenario: XRAY GOGGLES alone reveal and open the attic north door
    Given a fresh manor game
    And item "xrayGoggles" is carried
    And the player is in room "attic"
    When I send "wear goggles"
    And I send "north"
    Then flag "vaultFound" is set
    And the current room is "hiddenVault"
    And the output contains "ASTRAL CHAMBER"
    And the output does not contain "ordinary eyes find no seam"

  Scenario: The OBSIDIAN EYE alone reveals and opens the attic north door
    Given a fresh manor game
    And item "obsidianEye" is carried
    And the player is in room "attic"
    When I send "wear eye"
    And I send "north"
    Then flag "vaultFound" is set
    And the current room is "hiddenVault"

  Scenario: Hidden sight opens the nursery gap and grants its discovery once
    Given a fresh manor game
    And item "xrayGoggles" is carried
    And the player is in room "nursery"
    When I send "wear goggles"
    And I send "look"
    Then flag "wallGapFound" is set
    And flag "progressAward:wallGapFound" is set
    And the output contains "WALLPAPER hides a narrow opening"
    When I send "look"
    Then the output does not contain "(+5)"
    When I send "in"
    Then the current room is "betweenWalls"

  Scenario: Hidden-sight discoveries survive restore without another award
    Given a fresh manor game
    And item "xrayGoggles" is carried
    And the player is in room "nursery"
    When I send "wear goggles"
    And I send "look"
    And I round-trip the game snapshot
    And I send "look"
    Then flag "wallGapFound" is set
    And flag "progressAward:wallGapFound" is set
    And the output does not contain "(+5)"
    And the game score is 15

  Scenario: Hidden sight names the library obstruction instead of refusing a seen stair
    Given a fresh manor game
    And item "obsidianEye" is carried
    And the player is in room "library"
    When I send "wear eye"
    And I send "look"
    Then the output contains "A DOWN stair waits behind the bookcase"
    When I send "down"
    Then the output contains "You can see the stair behind the shelves, but the bookcase is still shut"
    And the output contains "the bookcase is still shut."
    When I send "pull lever"
    And I send "down"
    Then the current room is "secretChamber"

# end hidden-sight.feature
