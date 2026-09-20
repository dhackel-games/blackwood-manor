# belfry-bat-sight.feature. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-15.102:acoven.

@unit
Feature: Belfry bell and Bat Sight Mirror
  The manor's great bell hangs in the belfry. Its rope continues down to a
  closet beside the front door, while bats guard the thirteenth heirloom above.

  Background:
    Given a fresh manor game

  Scenario: The belfry contains the bell, bats, and rope through the floor
    Given the player is in room "belfry"
    When I send "look"
    Then the output contains "BELL"
    And the output contains "BATS"
    And the output contains "ROPE"
    And the output contains "HOLE in the floor"

  Scenario: Pulling the upper rope rings the bell and drops the mirror
    Given the player is in room "belfry"
    When I send "pull rope"
    Then the output contains "DONG... DONG..."
    And the output contains "BATS burst"
    And the output contains "HAND MIRROR"
    And the output contains "(+5)"
    And the game score is 5
    And item "batSightMirror" is in "belfry"
    And item "belfryBats" is destroyed
    And flag "belfryBatsScattered" is true
    When I send "pull rope"
    Then the game score is 5

  Scenario: The Bat Sight Mirror can inspect any named room without moving
    Given item "batSightMirror" is carried
    And the player is in room "belfry"
    When I send "look in mirror"
    Then the output contains "SHOW KITCHEN IN MIRROR"
    When I send "look in mirror at kitchen"
    Then the output contains "BAT SIGHT"
    And the output contains "KITCHEN"
    And the output contains "cavernous scullery"
    And the output contains "THIRD EYE"
    And the output contains "ROUTE READY"
    And flag "mirrorRoutePrefill" equals "say \"route to kitchen\"; w; dn; dn; dn; w; s"
    And the current room is "belfry"
    And flag "seen:kitchen" is unset

  Scenario: The Bat Sight Mirror covers every Part I room
    Then the Bat Sight Mirror can view every Part I room

  Scenario: SHOW reveals third-eye detail and prepares but does not execute the route
    Given item "batSightMirror" is carried
    And flag "frontDoorOpen" is set
    And the player is in room "belfry"
    When I send "show library in mirror"
    Then the output contains "BAT SIGHT — LIBRARY"
    And the output contains "THIRD EYE"
    And the output contains "brass LEVER is polished"
    And the output contains "ROUTE READY"
    And the output contains "w; dn; dn; dn; e; s"
    And flag "mirrorRoutePrefill" equals "say \"route to library\"; w; dn; dn; dn; e; s"
    And the current room is "belfry"
    And flag "seen:library" is unset
    And browser mirror routes are prefilled after command submission

  Scenario: The mirror replaces the removed Family Ring in the thirteen heirlooms
    Then the required family item count is 13
    And item "familyRing" is absent from game state
    Given item "rubyRing" is carried
    When I send "examine ravenblood"
    Then the output contains "RAVENBLOOD RING"
    And the output does not contain "RAVENBLOOD SIGNET"

  Scenario: The lower rope transforms a full closed reliquary
    Given every treasure but the "batSightMirror" is already in the reliquary
    And the player is in room "grandHall"
    When I send "put bat sight mirror in reliquary"
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
    And item "batSightMirror" is in "belfry"
    And item "belfryBats" is destroyed
    When the player moves directly to room "belfry"
    And I send "look"
    Then the output contains "BAT SIGHT MIRROR lies on the belfry boards"
    And the output does not contain "Hundreds of black BATS crowd the rafters"

# end belfry-bat-sight.feature
