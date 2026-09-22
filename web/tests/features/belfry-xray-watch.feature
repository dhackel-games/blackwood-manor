# belfry-xray-watch.feature. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-21.108:acoven.

@unit
Feature: Belfry goggles, the family ring, and the BM Watch
  The manor's great bell hangs in the belfry. Its rope continues down to a
  closet beside the front door, while bats guard useful vision equipment above.
  The Hall Bedroom holds its one heirloom, and the Study's BM Watch supplies
  remote sight and route preparation.

  Background:
    Given a fresh manor game

  Scenario: The belfry contains the bell, bats, and rope through the floor
    Given the player is in room "belfry"
    When I send "look"
    Then the output contains "BELL"
    And the output contains "BATS"
    And the output contains "ROPE"
    And the output contains "HOLE in the floor"

  Scenario: Pulling the upper rope rings the bell and drops the Blackwood goggles
    Given the player is in room "belfry"
    When I send "pull rope"
    Then the output contains "DONG... DONG..."
    And the output contains "BATS burst"
    And the output contains "XRAY GOGGLES"
    And the output contains "BM monogram"
    And the output contains "(+5)"
    And the game score is 5
    And item "xrayGoggles" is in "belfry"
    And item "belfryBats" is destroyed
    And flag "belfryBatsScattered" is true
    When I send "take goggles"
    Then the output contains "(+5)"
    And the game score is 10
    When I send "examine goggles"
    Then the output contains "blackened brass"
    And the output contains "BM"
    And the output does not contain "cheap plastic"
    When I send "pull rope"
    Then the game score is 10

  Scenario: Hidden goggles cannot be seen or taken before the bats scatter
    Given the player is in room "belfry"
    When I send "look"
    Then the output does not contain "XRAY GOGGLES"
    When I send "take goggles"
    Then the output contains "can't see"
    And item "xrayGoggles" is in "belfryBats"
    And flag "belfryBatsScattered" is unset

  Scenario: The BM Watch waits inside the Study desk drawer
    Given the player is in room "study"
    When I send "look"
    Then the output contains "DIARY"
    And the output contains "DESK DRAWER"
    And the output does not contain "BM WATCH"
    And item "diary" is in "study"
    And item "diary" is not a required family heirloom
    When I send "open desk drawer"
    Then the output contains "BM WATCH"
    And item "backwardsWatch" is in "studyDrawer"
    When I send "examine watch"
    Then the output contains "empty mirror face"
    And the output contains "crystal ball worn on the wrist"
    And the output contains "reflects nothing"
    And the output contains "looking into somewhere else"
    And the output contains "nonreflective back"
    And the output contains "BM insignia"
    And the output does not contain "HEIRLOOMS:"
    And the output does not contain "turns"
    And the game score is 0

  Scenario: The Hall Bedroom drawer holds the required Blackwood Family Ring
    Given the player is in room "hallBedroom"
    When I send "look"
    Then the output contains "broken MIRROR"
    And the output contains "NIGHT TABLE"
    When I send "open drawer"
    Then the output contains "BLACKWOOD FAMILY RING"
    And item "familyRing" is in "nightDrawer"
    And the Hall Bedroom has exactly one required heirloom
    When I send "take family ring"
    And I send "examine family ring"
    Then the output contains "raised BM initials"
    Given the player is in room "grandHall"
    When I send "put family ring in reliquary"
    Then item "familyRing" is in "reliquary"
    And the game score is 20

  Scenario: The BM Watch can inspect any named room without moving
    Given item "backwardsWatch" is carried
    And the player is in room "belfry"
    When I send "look in watch"
    Then the output contains "SCRY KITCHEN"
    And the output contains "WHAT TIME TAKES, BLOOD REMEMBERS"
    And the output does not contain "heirloom remains"
    When I send "look in watch at kitchen"
    Then the output contains "BM WATCH"
    And the output contains "KITCHEN"
    And the output contains "cavernous scullery"
    And the output contains "THIRD EYE"
    And the output contains "ROUTE READY"
    And flag "mirrorRoutePrefill" equals "w; dn; dn; dn; w; s"
    And the current room is "belfry"
    And flag "seen:kitchen" is unset

  Scenario: The visible watch must be taken before its mirror face can scry
    Given the player is in room "study"
    When I send "open drawer"
    And I send "look in watch at kitchen"
    Then the output contains "need to take or wear the BM WATCH"
    And item "backwardsWatch" is in "studyDrawer"
    And flag "mirrorRoutePrefill" is unset

  Scenario: The BM Watch covers every Part I room
    Then the BM Watch can view every Part I room

  Scenario: SHOW reveals third-eye detail and prepares but does not execute the route
    Given item "backwardsWatch" is carried
    And flag "frontDoorOpen" is set
    And the player is in room "belfry"
    When I send "show library in watch"
    Then the output contains "BM WATCH — LIBRARY"
    And the output contains "THIRD EYE"
    And the output contains "brass LEVER is polished"
    And the output contains "ROUTE READY"
    And the output contains "w; dn; dn; dn; e; s"
    And flag "mirrorRoutePrefill" equals "w; dn; dn; dn; e; s"
    And the current room is "belfry"
    And flag "seen:library" is unset
    And browser scry routes are prefilled after command submission

  Scenario Outline: SHOW and SCRY resolve goggles hidden inside the belfry roost
    Given item "backwardsWatch" is carried
    And the player is in room "roof"
    When I send "<command>"
    Then the output contains "BM WATCH — BELFRY"
    And the output contains "TARGET: XRAY GOGGLES IN BELFRY"
    And the output contains "BATS"
    And the output contains "ROUTE READY"
    And flag "mirrorRoutePrefill" equals "e"
    And the current room is "roof"
    And item "xrayGoggles" is in "belfryBats"

    Examples:
      | command               |
      | show goggles in watch |
      | scry goggles in watch |
      | scry goggles          |

  Scenario: SCRY resolves a room through the BM Watch
    Given item "backwardsWatch" is carried
    And the player is in room "belfry"
    When I send "scry kitchen in watch"
    Then the output contains "BM WATCH — KITCHEN"
    And the output contains "cavernous scullery"
    And the output contains "ROUTE READY"
    And flag "mirrorRoutePrefill" equals "w; dn; dn; dn; w; s"

  Scenario Outline: The BM Watch accepts its descriptive noun aliases
    Given item "backwardsWatch" is carried
    And the player is in room "belfry"
    When I send "<command>"
    Then the output contains "BM WATCH — KITCHEN"
    And the output does not contain "CRYSTAL BALL WATCH —"
    And flag "mirrorRoutePrefill" equals "w; dn; dn; dn; w; s"

    Examples:
      | command                              |
      | scry kitchen in scrying watch        |
      | scry kitchen in crystal ball watch   |

  Scenario: Object scrying follows goggles after they drop and move
    Given item "backwardsWatch" is carried
    And the player is in room "belfry"
    When I send "pull rope"
    Given the player is in room "roof"
    When I send "show goggles in watch"
    Then the output contains "TARGET: XRAY GOGGLES IN BELFRY"
    And flag "mirrorRoutePrefill" equals "e"
    Given the player is in room "belfry"
    When I send "take goggles"
    Given the player is in room "kitchen"
    When I send "drop goggles"
    Given the player is in room "belfry"
    When I send "scry goggles"
    Then the output contains "TARGET: XRAY GOGGLES IN KITCHEN"
    And flag "mirrorRoutePrefill" equals "w; dn; dn; dn; w; s"

  Scenario: Object scrying resolves a family ring nested in a closed drawer
    Given item "backwardsWatch" is carried
    And the player is in room "belfry"
    When I send "scry family ring in crystal ball watch"
    Then the output contains "TARGET: BLACKWOOD FAMILY RING IN HALL BEDROOM"
    And flag "mirrorRoutePrefill" equals "w; dn; dn; n"

  Scenario: Object scrying ignores a destroyed namesake
    Given the restored candelabra is carried
    And item "backwardsWatch" is carried
    Given the player is in room "diningRoom"
    When I send "drop candelabra"
    Given the player is in room "belfry"
    When I send "show candelabra in watch"
    Then the output contains "TARGET: CANDELABRA IN DINING ROOM"
    And the output contains "ROUTE READY"

  Scenario: SHOW infers the carried watch for a different room
    Given item "backwardsWatch" is carried
    And the player is in room "belfry"
    When I send "show kitchen"
    Then the output contains "(show KITCHEN in BM WATCH)"
    And the output contains "BM WATCH — KITCHEN"
    And flag "mirrorRoutePrefill" equals "w; dn; dn; dn; w; s"

  Scenario: SHOW inspects normally when the named room is the current room
    Given item "backwardsWatch" is carried
    And the player is in room "kitchen"
    When I send "show kitchen"
    Then the output contains "CLOSER INSPECTION"
    And the output does not contain "BM WATCH —"
    And flag "mirrorRoutePrefill" is unset

  Scenario Outline: Guide commands infer the carried watch and prefill without moving
    Given item "backwardsWatch" is carried
    And the player is in room "belfry"
    When I send "<command>"
    Then the output contains "(route to KITCHEN with BM WATCH)"
    And the output contains "ROUTE READY"
    And flag "mirrorRoutePrefill" equals "w; dn; dn; dn; w; s"
    And the current room is "belfry"

    Examples:
      | command          |
      | guide to kitchen |
      | path to kitchen  |
      | route to kitchen |

  Scenario: A watch route can target an object
    Given item "backwardsWatch" is carried
    And the player is in room "belfry"
    When I send "route to diary"
    Then the output contains "(route to LEATHER DIARY with BM WATCH)"
    And the output contains "DIARY is in STUDY"
    And flag "mirrorRoutePrefill" equals "w; dn; dn; s"

  Scenario: A watch route ignores a destroyed namesake when targeting an object
    Given item "backwardsWatch" is carried
    And the player is in room "belfry"
    When I send "route to candelabra"
    Then the output contains "CANDELABRA is in DINING ROOM"
    And the output contains "ROUTE READY"

  Scenario Outline: Guide commands explain their watch requirement
    When I send "<command>"
    Then the output contains "need the BM WATCH"

    Examples:
      | command          |
      | guide to kitchen |
      | path to kitchen  |
      | route to kitchen |

  Scenario: The redesigned required set contains exactly thirteen heirlooms
    Then the required family item count is 13
    And the required family items are exactly "ancestralPortrait,ancientCoin,blackwoodHammer,candelabra,crystalDecanter,familyCrest,familyRing,goldLocket,grimoire,musicBox,rubyRing,spyglass,talisman"
    And the required heirloom deposit total is 195
    And item "familyRing" has heirloom deposit value 20
    And item "blackwoodHammer" has heirloom deposit value 12
    And item "candelabra" has heirloom deposit value 10
    And item "xrayGoggles" is not a required family heirloom
    And item "batSightMirror" is absent from game state
    And the player-facing heirloom catalogs and icons match the required set
    And the static 2D rooms show the redesigned item placements

  Scenario: The lower rope transforms a full closed reliquary
    Given every treasure but the "familyRing" is already in the reliquary
    And the player is in room "grandHall"
    When I send "put family ring in reliquary"
    And I send "close reliquary"
    And I send "open bell closet"
    And I send "pull bell rope"
    Then the output contains "DONG... DONG..."
    And the output contains "flash of magical white light"
    And the output contains "FRONT DOOR"
    And the output contains "SLAMS SHUT"
    And the output contains "WIDE OPEN"
    And the output contains "trapdoor"
    And the output contains "STAIRCASE DOWN"
    And the output does not contain "COUNTDOWN CLOCK"
    And flag "bellRung" is set
    And flag "floorDoorOpen" is set
    And item "frontDoor" is open
    And item "clockTalisman" is in "reliquary"
    And every required family item is inside the countdown clock
    When I send "examine reliquary"
    Then the output contains "COUNTDOWN CLOCK"

  Scenario: Pulling the lower rope before the ritual is ready only rings the bell
    Given the player is in room "grandHall"
    When I send "open bell closet"
    And I send "pull bell rope"
    Then the output contains "DONG... DONG..."
    And the output contains "remote"
    And the output contains "CLUNK"
    And the output contains "Nothing changes in the RELIQUARY"
    And the output contains line "HEIRLOOMS: 0/13 +0"
    And flag "bellRung" is unset
    And flag "floorDoorOpen" is unset
    And item "xrayGoggles" is in "belfry"
    And item "belfryBats" is destroyed
    When the player moves directly to room "belfry"
    And I send "look"
    Then the output contains "BLACKWOOD XRAY GOGGLES rest"
    And the output does not contain "Hundreds of black BATS crowd the rafters"

# end belfry-xray-watch.feature
