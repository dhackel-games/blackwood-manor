# heirloom-migration.feature. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-21.105:acoven.

@unit
Feature: Heirloom correction save migration
  Saves from both sides of the redesign retain collection credit while the
  Blackwood Family Ring takes the +20 slot and the goggles and BM Watch remain
  useful equipment.

  Background:
    Given a fresh manor game

  Scenario: Pre-redesign deposited mirror progress maps to the family ring
    Given a pre-redesign save with replaced heirlooms deposited is restored
    Then item "familyRing" is in "reliquary"
    And item "blackwoodHammer" is in "reliquary"
    And item "candelabra" is in "reliquary"
    And item "candlestick" is destroyed
    And item "mirrorShard" is destroyed
    And item "candelabraFrame" is destroyed
    And item "xrayGoggles" is worn in slot "eyes"
    And item "backwardsWatch" is in "study"
    And item "batSightMirror" is absent from game state
    And flag "candelabraRestored" is set
    And flag "heirloomScore:familyRing" is set
    And flag "heirloomScore:batSightMirror" is unset
    And flag "curseLiftable" is set
    And the game score is 200

  Scenario: Pre-redesign transformed mirror progress stays inside the countdown clock
    Given a pre-redesign transformed heirloom save is restored
    Then every required family item is inside the countdown clock
    And item "familyRing" is in "clockTalisman"
    And item "blackwoodHammer" is in "clockTalisman"
    And item "candelabra" is in "clockTalisman"
    And item "xrayGoggles" is worn in slot "eyes"
    And item "backwardsWatch" is carried
    And item "clockTalisman" is in "reliquary"
    And flag "heirloomsTransformed" is set
    And the game score is 205

  Scenario: Pre-redesign collected objects preserve ring, watch, and goggles ownership
    Given a pre-redesign carried-equipment save is restored
    Then item "familyRing" is carried
    And item "xrayGoggles" is worn in slot "eyes"
    And item "backwardsWatch" is carried
    And item "blackwoodHammer" is carried
    And item "candlestick" is carried
    And item "candlestick" has fuel 73
    And item "candlestick" is lit
    And item "candelabra" is destroyed
    When I send "show kitchen"
    Then the output contains "BM WATCH — KITCHEN"
    And the game score is 5

  Scenario: Pre-redesign untouched goggles move from the drawer to the emptied belfry
    Given a pre-redesign save with a deposited mirror and untouched goggles is restored
    Then item "familyRing" is in "reliquary"
    And item "xrayGoggles" is in "belfry"
    And flag "progressItem:xrayGoggles" is unset
    Given the player is in room "belfry"
    When I send "take goggles"
    Then item "xrayGoggles" is carried
    And flag "progressItem:xrayGoggles" is set
    And the game score is 30

  Scenario: Preceding-redesign deposited goggles transfer their +20 slot to the family ring
    Given a preceding-redesign save with the goggles deposited is restored
    Then item "familyRing" is in "reliquary"
    And item "xrayGoggles" is carried
    And item "xrayGoggles" is not a required family heirloom
    And item "backwardsWatch" is worn in slot "wrist"
    And flag "heirloomScore:familyRing" is set
    And flag "heirloomScore:xrayGoggles" is unset
    And flag "curseLiftable" is set
    And the game score is 200

  Scenario: Preceding-redesign transformed goggles transfer into the countdown clock
    Given a preceding-redesign transformed heirloom save is restored
    Then every required family item is inside the countdown clock
    And item "familyRing" is in "clockTalisman"
    And item "xrayGoggles" is carried
    And item "backwardsWatch" is worn in slot "wrist"
    And item "clockTalisman" is in "reliquary"
    And flag "heirloomsTransformed" is set
    And the game score is 205

  Scenario: A corrected migrated save remains stable after another save and restore
    Given a preceding-redesign save with the goggles deposited is restored
    When I round-trip the game snapshot
    Then item "familyRing" is in "reliquary"
    And item "xrayGoggles" is carried
    And item "backwardsWatch" is worn in slot "wrist"
    And flag "heirloomScore:familyRing" is set
    And flag "heirloomScore:xrayGoggles" is unset
    And flag "curseLiftable" is set
    And the game score is 200

  Scenario: Withdrawn erroneous goggles credit prevents double-scoring the family ring
    Given a preceding-redesign save with withdrawn goggles credit is restored
    Then item "familyRing" is in "nightDrawer"
    And item "xrayGoggles" is worn in slot "eyes"
    And flag "heirloomScore:familyRing" is set
    Given the player is in room "hallBedroom"
    When I send "open drawer"
    And I send "take family ring"
    Given the player is in room "grandHall"
    When I send "put family ring in reliquary"
    Then item "familyRing" is in "reliquary"
    And the game score is 20

  Scenario: Historical family ring ownership and deposit credit are preserved
    Given a historical save with the family ring worn is restored
    Then item "familyRing" is worn in slot "finger"
    And flag "heirloomScore:familyRing" is set
    And item "backwardsWatch" is in "study"
    And the game score is 20

# end heirloom-migration.feature
