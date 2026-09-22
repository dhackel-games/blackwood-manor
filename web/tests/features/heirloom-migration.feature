# heirloom-migration.feature. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-21.103:acoven.

@unit
Feature: Current-save heirloom redesign migration
  Saves from the Bat Sight Mirror, required Woodblack Watch, and silver
  candlestick schema retain their collection progress and useful equipment.

  Background:
    Given a fresh manor game

  Scenario: Deposited replacement progress maps one for one
    Given a current-head save with replaced heirlooms deposited is restored
    Then item "xrayGoggles" is in "reliquary"
    And item "blackwoodHammer" is in "reliquary"
    And item "candelabra" is in "reliquary"
    And item "candlestick" is destroyed
    And item "mirrorShard" is destroyed
    And item "candelabraFrame" is destroyed
    And item "backwardsWatch" is worn in slot "wrist"
    And item "batSightMirror" is absent from game state
    And flag "candelabraRestored" is set
    And flag "curseLiftable" is set
    And the game score is 200

  Scenario: Transformed replacement progress stays inside the countdown clock
    Given a current-head transformed heirloom save is restored
    Then every required family item is inside the countdown clock
    And item "xrayGoggles" is in "clockTalisman"
    And item "blackwoodHammer" is in "clockTalisman"
    And item "candelabra" is in "clockTalisman"
    And item "backwardsWatch" is worn in slot "wrist"
    And item "clockTalisman" is in "reliquary"
    And flag "heirloomsTransformed" is set
    And the game score is 205

  Scenario: Carried and worn equipment remains useful after migration
    Given a current-head carried-equipment save is restored
    Then item "xrayGoggles" is worn in slot "eyes"
    And item "backwardsWatch" is worn in slot "wrist"
    And item "blackwoodHammer" is carried
    And item "candlestick" is carried
    And item "candlestick" has fuel 73
    And item "candlestick" is lit
    And item "candelabra" is destroyed
    When I send "show kitchen"
    Then the output contains "WOODBLACK WATCH — KITCHEN"
    And the game score is 5

# end heirloom-migration.feature
