# belfry-xray-watch.feature. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-21.104:acoven.

@unit
Feature: Belfry goggles and Woodblack Watch
  The manor's great bell hangs in the belfry. Its rope continues down to a
  closet beside the front door, while bats guard the thirteenth heirloom above.
  The Woodblack Watch supplies remote sight and route preparation.

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

  Scenario: The Woodblack Watch can inspect any named room without moving
    Given item "backwardsWatch" is carried
    And the player is in room "belfry"
    When I send "look in watch"
    Then the output contains "SHOW KITCHEN"
    And the output contains "WHAT TIME TAKES, BLOOD REMEMBERS"
    And the output does not contain "heirloom remains"
    When I send "look in watch at kitchen"
    Then the output contains "WOODBLACK WATCH"
    And the output contains "KITCHEN"
    And the output contains "cavernous scullery"
    And the output contains "THIRD EYE"
    And the output contains "ROUTE READY"
    And flag "mirrorRoutePrefill" equals "w; dn; dn; dn; w; s"
    And the current room is "belfry"
    And flag "seen:kitchen" is unset

  Scenario: The visible watch must be taken before its black crystal can scry
    Given the player is in room "hallBedroom"
    When I send "open drawer"
    And I send "look in watch at kitchen"
    Then the output contains "need to take or wear the WOODBLACK WATCH"
    And item "backwardsWatch" is in "nightDrawer"
    And flag "mirrorRoutePrefill" is unset

  Scenario: The Woodblack Watch covers every Part I room
    Then the Woodblack Watch can view every Part I room

  Scenario: SHOW reveals third-eye detail and prepares but does not execute the route
    Given item "backwardsWatch" is carried
    And flag "frontDoorOpen" is set
    And the player is in room "belfry"
    When I send "show library in watch"
    Then the output contains "WOODBLACK WATCH — LIBRARY"
    And the output contains "THIRD EYE"
    And the output contains "brass LEVER is polished"
    And the output contains "ROUTE READY"
    And the output contains "w; dn; dn; dn; e; s"
    And flag "mirrorRoutePrefill" equals "w; dn; dn; dn; e; s"
    And the current room is "belfry"
    And flag "seen:library" is unset
    And browser scry routes are prefilled after command submission

  Scenario: SHOW infers the carried watch for a different room
    Given item "backwardsWatch" is carried
    And the player is in room "belfry"
    When I send "show kitchen"
    Then the output contains "(show KITCHEN in WOODBLACK WATCH)"
    And the output contains "WOODBLACK WATCH — KITCHEN"
    And flag "mirrorRoutePrefill" equals "w; dn; dn; dn; w; s"

  Scenario: SHOW inspects normally when the named room is the current room
    Given item "backwardsWatch" is carried
    And the player is in room "kitchen"
    When I send "show kitchen"
    Then the output contains "CLOSER INSPECTION"
    And the output does not contain "WOODBLACK WATCH —"
    And flag "mirrorRoutePrefill" is unset

  Scenario Outline: Guide commands infer the carried watch and prefill without moving
    Given item "backwardsWatch" is carried
    And the player is in room "belfry"
    When I send "<command>"
    Then the output contains "(route to KITCHEN with WOODBLACK WATCH)"
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
    Then the output contains "(route to LEATHER DIARY with WOODBLACK WATCH)"
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
    Then the output contains "need the WOODBLACK WATCH"

    Examples:
      | command          |
      | guide to kitchen |
      | path to kitchen  |
      | route to kitchen |

  Scenario: The redesigned required set contains exactly thirteen heirlooms
    Then the required family item count is 13
    And the required family items are exactly "ancestralPortrait,ancientCoin,blackwoodHammer,candelabra,crystalDecanter,familyCrest,goldLocket,grimoire,musicBox,rubyRing,spyglass,talisman,xrayGoggles"
    And item "batSightMirror" is absent from game state
    And the player-facing heirloom catalogs and icons match the required set
    And the static 2D rooms show the redesigned item placements

  Scenario: The lower rope transforms a full closed reliquary
    Given every treasure but the "xrayGoggles" is already in the reliquary
    And the player is in room "grandHall"
    When I send "put xray goggles in reliquary"
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
