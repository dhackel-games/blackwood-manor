# heirloom-migration.feature. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-21.108:acoven.

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
    And item "backwardsWatch" is in "studyDrawer"
    And item "batSightMirror" is absent from game state
    And flag "candelabraRestored" is set
    And flag "heirloomScore:familyRing" is set
    And flag "heirloomScore:batSightMirror" is unset
    And flag "progressAward:candelabraRestored" is set
    And flag "curseLiftable" is set
    And the game score is 220

  Scenario: A legacy deposited watch credits its replacement hammer, not the untouched desk watch
    Given a legacy deposited watch with no portable ledger is restored
    Then item "blackwoodHammer" is in "reliquary"
    And item "backwardsWatch" is in "studyDrawer"
    And flag "progressItem:blackwoodHammer" is set
    And flag "progressItem:backwardsWatch" is unset
    And flag "portableRewardLedgerVersion" equals 1
    And the game score is 17
    When I round-trip the game snapshot
    Then the game score is 17

  Scenario: Pre-redesign transformed mirror progress stays inside the Doomsday Clock
    Given a pre-redesign transformed heirloom save is restored
    Then every required family item is inside the Doomsday Clock
    And item "familyRing" is in "clockTalisman"
    And item "blackwoodHammer" is in "clockTalisman"
    And item "candelabra" is in "clockTalisman"
    And item "xrayGoggles" is worn in slot "eyes"
    And item "backwardsWatch" is carried
    And item "clockTalisman" is in "reliquary"
    And flag "heirloomsTransformed" is set
    And flag "progressAward:candelabraRestored" is set
    And the game score is 225

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
    And flag "progressAward:candelabraRestored" is set
    And flag "curseLiftable" is set
    And the game score is 220

  Scenario: Preceding-redesign transformed goggles transfer into the Doomsday Clock
    Given a preceding-redesign transformed heirloom save is restored
    Then every required family item is inside the Doomsday Clock
    And item "familyRing" is in "clockTalisman"
    And item "xrayGoggles" is carried
    And item "backwardsWatch" is worn in slot "wrist"
    And item "clockTalisman" is in "reliquary"
    And flag "heirloomsTransformed" is set
    And flag "progressAward:candelabraRestored" is set
    And the game score is 225

  Scenario: A corrected migrated save remains stable after another save and restore
    Given a preceding-redesign save with the goggles deposited is restored
    When I round-trip the game snapshot
    Then item "familyRing" is in "reliquary"
    And item "xrayGoggles" is carried
    And item "backwardsWatch" is worn in slot "wrist"
    And flag "heirloomScore:familyRing" is set
    And flag "heirloomScore:xrayGoggles" is unset
    And flag "curseLiftable" is set
    And flag "progressAward:candelabraRestored" is set
    And the game score is 220

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
    And the game score is 30

  Scenario: Historical family ring ownership and deposit credit are preserved
    Given a historical save with the family ring worn is restored
    Then item "familyRing" is worn in slot "finger"
    And flag "heirloomScore:familyRing" is set
    And item "backwardsWatch" is in "studyDrawer"
    And the game score is 20

  Scenario: Build-three untouched desk watches move inside the new drawer
    Given a build-three save with the untouched desk watch is restored
    Then item "studyDrawer" is in "study"
    And item "backwardsWatch" is in "studyDrawer"
    Given the player is in room "study"
    When I send "open desk drawer"
    Then the output contains "BM WATCH"

  Scenario: Pre-bonus restored candelabras receive the puzzle award once
    Given a pre-bonus save with the restored candelabra is restored
    Then item "candelabra" is carried
    And item "candelabra" is lit
    And flag "progressAward:candelabraRestored" is set
    And the game score is 20
    When I round-trip the game snapshot
    Then flag "progressAward:candelabraRestored" is set
    And the game score is 20

  Scenario: Pre-roost saves place undiscovered goggles beneath the belfry bats
    Given a pre-roost save with undiscovered goggles is restored
    Then item "xrayGoggles" is in "belfryBats"
    And flag "belfryBatsScattered" is unset

  Scenario: An already-aligned oak save restores its physical platform without changing score
    Given a solved-oak save without the platform is restored
    Then item "oakPlatform" is in "greatOak"
    And the game score is 5
    When I round-trip the game snapshot
    Then item "oakPlatform" is in "greatOak"
    And the game score is 5

  Scenario: A legacy thirteen-deposit save loses only its now-incomplete ritual readiness
    Given a legacy thirteen-deposit save is restored
    Then flag "curseLiftable" is unset
    And flag "reliquarySealed" is set
    And flag "heirloomScore:familyCrest" is set
    And flag "heirloomScore:demogorgonzolaRind" is unset
    And the game score is 195

  Scenario: A legacy bell-rung save retains its ritual without new deposit awards
    Given a legacy bell-rung save is restored
    Then flag "bellRung" is set
    And flag "heirloomsTransformed" is set
    And item "clockTalisman" is in "reliquary"
    And every required family item is inside the Doomsday Clock
    And flag "heirloomScore:demogorgonzolaRind" is unset
    And the game score is 200

  Scenario: A Part II save upgrades its clock hour without replaying ritual awards
    Given a legacy Part II save after the old scene is restored
    Then flag "partII" is set
    And flag "bellRung" is set
    And flag "hour13Done" is set
    And flag "clockHour" equals 23
    And item "clockTalisman" is carried
    And the game score is 225

  Scenario: A collected letter becomes PHOTO PIECE A without losing its history
    Given a legacy collected PHOTO PIECE A save is restored
    Then item "letter" is carried
    And item "letter" recognizes name "photo piece a"
    And flag "letterRead" is set
    And flag "progressAward:letterRead" is set
    And flag "progressItem:letter" is set
    And the game score is 15

  Scenario: A destroyed legacy letter returns as PHOTO PIECE A without an award
    Given a legacy burned-letter save is restored
    Then item "letter" is in "mailbox"
    And item "letter" recognizes name "photo piece a"
    And flag "letterBurned" is set
    And flag "progressAward:letterRead" is set
    And flag "progressItem:letter" is set
    And the game score is 15

# end heirloom-migration.feature
