# candelabra-restoration.feature. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-21.103:acoven.

@walkthrough
Feature: Restore the dining-room candelabra
  A removable shard from the broken hall-bedroom mirror and the manor's sole
  candle complete the rundown dining-room fixture in either order.

  Background:
    Given a fresh manor game

  Scenario: The broken mirror yields a distinct inscribed shard
    Given the player is in room "hallBedroom"
    When I send "examine mirror"
    Then the output contains "broken"
    And the output contains "central SHARD"
    When I send "take shard"
    Then item "mirrorShard" is carried
    And the output contains "work the central MIRROR SHARD free"
    When I send "examine shard"
    Then the output contains "nonreflective back"
    And the output contains "...GLASS, THE HOUSE REMEMBERS"
    And the output does not contain "WHEN THE LAST LIGHT MEETS BROKEN GLASS"

  Scenario: The rundown fixture describes both missing parts without solving itself
    Given the player is in room "diningRoom"
    When I send "examine candelabra"
    Then the output contains "rundown"
    And the output contains "single CANDLE"
    And the output contains "mirror-shaped recess"
    And the output contains "WHEN THE LAST LIGHT MEETS BROKEN—"
    And item "candelabra" is destroyed

  Scenario: A wrong item cannot solve or disappear into the fixture
    Given the player is in room "diningRoom"
    And item "rope" is carried
    When I send "put rope in candelabra"
    Then the output contains "fits neither"
    And item "rope" is carried
    And flag "candelabraRestored" is unset

  Scenario Outline: The shard and candle restore the candelabra in either order
    Given the player is in room "hallBedroom"
    When I send "take shard"
    Given the player is in room "diningRoom"
    When I send "take candlestick"
    And I send "<first>"
    Then the output contains "<missing>"
    When I send "<second>"
    Then flag "candelabraRestored" is set
    And item "mirrorShard" is destroyed
    And item "candlestick" is destroyed
    And item "candelabraFrame" is destroyed
    And item "candelabra" is in "diningRoom"
    And item "candelabra" is lit
    And the output contains "beautiful, portable BLACKWOOD CANDELABRA"
    And the output contains "WHEN THE LAST LIGHT MEETS BROKEN GLASS, THE HOUSE REMEMBERS"

    Examples:
      | first                     | missing                      | second                    |
      | put shard in candelabra   | empty candle socket          | put candle on candelabra  |
      | put candle in candelabra  | mirror-shaped recess         | put shard into candelabra |

  Scenario: The restored candelabra is a required ten-point heirloom
    Given the restored candelabra is carried
    And the player is in room "grandHall"
    When I send "put candelabra in reliquary"
    Then item "candelabra" is in "reliquary"
    And the output contains line "HEIRLOOMS: 1/13 +0"
    And the game score is 10

  Scenario: The candelabra remains lit without fuel in darkness
    Given the restored candelabra is carried
    Given the player is in room "secretChamber"
    When I send "wait"
    And I send "extinguish candelabra"
    Then item "candelabra" is lit
    And the output contains "no fuel to spend"
    When I send "look"
    Then the output does not contain "pitch black"

  Scenario Outline: The carried candelabra ignites the garden brazier in one action
    Given the restored candelabra is carried
    And the player is in room "garden"
    When I send "<command>"
    Then flag "brazierLit" is set
    And the output contains "CANDELABRA"
    And the output contains "EMERALD GEM"
    And the game score is 10

    Examples:
      | command                              |
      | light brazier                        |
      | light brazier with candelabra        |
      | touch candelabra to brazier          |
      | touch brazier with candelabra        |

# end candelabra-restoration.feature
