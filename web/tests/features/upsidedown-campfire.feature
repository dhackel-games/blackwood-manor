# upsidedown-campfire.feature. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.001:acoven.

@unit
Feature: The Upside-Down campfire and stream
  The downward fire yields one cyan gem, and the stream keeps the milk jug useful.

  Scenario Outline: Every intended method extinguishes the campfire once
    Given a fresh manor game
    And the player is in room "waylampClearing"
    And the campfire method "<method>" is ready
    When I send "<command>"
    Then the output contains "<success>"
    And flag "realm:campfireOut" is set
    And item "cyanGem" is in "waylampClearing"
    And the game score is <score>
    When I send "stomp fire"
    Then the output contains "The CAMPFIRE is already out"
    And the game score is <score>

    Examples:
      | method | command             | success                                  | score |
      | wine   | pour wine on fire   | They cough, blush, and go out.           | 10    |
      | milk   | pour milk on fire   | The fire sulks like a child denied dessert | 10    |
      | water  | pour jug on fire    | A JUG of STREAM water hisses into the fire | 5     |
      | body   | stomp fire          | You stomp the flames flat with your shoes | 5     |
      | body   | smother fire        | You smother the fire with your body       | 5     |

  Scenario: Filling, pouring, and refilling the reusable jug
    Given a fresh manor game
    And the player is in room "waylampClearing"
    And item "milkJug" is carried
    When I send "fill jug with water"
    Then the output contains "You dip the MILK JUG into the STREAM"
    And the milk jug is full
    And the game score is 5
    When I send "pour water on fire"
    Then flag "realm:campfireOut" is set
    And the milk jug is empty
    And the game score is 10
    When I send "fill jug"
    Then the milk jug is full
    And the game score is 10

  Scenario Outline: Wine and milk portable-use credits survive the extinguish branch once
    Given a fresh manor game
    And the player is in room "waylampClearing"
    And the campfire method "<method>" is ready
    When I send "<command>"
    Then flag "useItem:<item>" is set
    And the game score is 10
    And I round-trip the game snapshot
    When I send "stomp fire"
    Then item "cyanGem" is in "waylampClearing"
    And the game score is 10

    Examples:
      | method | command           | item       |
      | wine   | pour wine on fire | wineBottle |
      | milk   | pour milk on fire | milk       |

  Scenario: A filled jug keeps its dynamic description after restore
    Given a fresh manor game
    And the player is in room "waylampClearing"
    And item "milkJug" is carried
    When I send "fill jug"
    And I round-trip the game snapshot
    And I send "examine jug"
    Then the output contains "sloshes with fresh STREAM water"

  Scenario: The cyan gem remains unavailable until the fire is out
    Given a fresh manor game
    And the player is in room "waylampClearing"
    When I send "take cyan gem"
    Then the output contains "The flames bar your hand"
    When I send "smother fire"
    And I send "take cyan gem"
    Then item "cyanGem" is carried
    And the game score is 10

# end upsidedown-campfire.feature
