# true-ending.feature. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-15.102:acoven.

Feature: Reliquary choice and Gary cliffhanger
  The ordinary heirloom ritual creates the thirteen-hour countdown clock.
  Leaving through the opened front door ends the game; taking the clock opens
  the floor stair and continues into Part II.

  Background:
    Given a fresh manor game
    And the player is in room "grandHall"
    And every treasure but the "familyCrest" is already in the reliquary

  Scenario: Depositing the last heirloom only prepares the bell ritual
    When I send "put family crest in reliquary"
    Then the output contains "All thirteen heirlooms are in place"
    And flag "curseLiftable" is set
    And flag "floorDoorOpen" is unset
    When I send "down"
    Then the current room is "grandHall"
    And the output contains "no stair DOWN"

  Scenario: Pulling the closet rope transforms the heirlooms and opens both doors
    When I send "put family crest in reliquary"
    And I send "close reliquary"
    And I send "open bell closet"
    And I send "pull bell rope"
    Then the output contains "magical white light"
    And the output contains "Every heirloom vanishes"
    And the output contains "FRONT DOOR"
    And the output contains "SLAMS SHUT"
    And the output contains "WIDE OPEN"
    And the output contains "trapdoor"
    And the output contains "(+5)"
    And flag "bellRung" is set
    And flag "heirloomsTransformed" is set
    And flag "floorDoorOpen" is set
    And item "frontDoor" is open
    And item "clockTalisman" is in "reliquary"
    And every required family item is inside the countdown clock

  Scenario: Examining the reliquary reveals what the heirlooms became
    When I send "put family crest in reliquary"
    And I send "close reliquary"
    And I send "open bell closet"
    And I send "pull bell rope"
    And I send "examine reliquary"
    Then the output contains "all thirteen heirlooms have become this single clock"
    And the output contains "TAKE it"

  Scenario: The clock is required before descending the already-open stair
    When I send "put family crest in reliquary"
    And I send "close reliquary"
    And I send "open bell closet"
    And I send "pull bell rope"
    And I send "down"
    Then the current room is "grandHall"
    And the output contains "toward the RELIQUARY"
    When I send "open reliquary"
    And I send "take clock"
    Then item "clockTalisman" is carried
    And flag "floorDoorOpen" is set
    And the output contains "open trapdoor"

  Scenario: Gary waits alone and knocks the clock-bearer into Part II
    When I send "put family crest in reliquary"
    And I send "close reliquary"
    And I send "open bell closet"
    And I send "pull bell rope"
    And I send "open reliquary"
    And I send "take clock"
    And I send "down"
    Then the output contains "receiver rests silently in its cradle"
    And the output contains "No caller. No ringing."
    And the output contains "surprise"
    And the output contains "excitement"
    And the output contains "\"Jeb,\" he says"
    And the output contains "FREEEEDOMMM"
    And the output contains "You are a ghost"
    And the output contains "EXAMINE the CLOCK"
    And the output does not contain "mid-sentence"
    And the current room is "p2_awakening"
    And the game is alive
    And the game is not won

  Scenario: Leaving through the opened front door ends the game
    When I send "put family crest in reliquary"
    And I send "close reliquary"
    And I send "open bell closet"
    And I send "pull bell rope"
    And I send "south"
    Then the game is won
    And the output contains "wide-open FRONT DOOR"
    And the output contains "You keep walking, Jeb"

# end true-ending.feature
