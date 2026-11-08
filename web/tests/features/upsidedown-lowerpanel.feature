# upsidedown-lowerpanel.feature. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.001:acoven.

@unit
Feature: The lower panel beneath the oak
  Its inverted gems persist, reject bulk transfer, and awaken the third lift stop.

  Background:
    Given a fresh manor game
    And the player is in room "below"

  Scenario: The initial slots persist after a save and restore
    When I send "examine lower panel"
    Then the output contains "TOP SLOT: MAGENTA GEM"
    And the output contains "MIDDLE SLOT: EMPTY"
    And the output contains "BOTTOM SLOT: YELLOW GEM"
    When I send "take magenta gem"
    And I save a game snapshot
    And I restore that snapshot
    And I send "examine lower panel"
    Then the output contains "TOP SLOT: EMPTY"
    And the output contains "BOTTOM SLOT: YELLOW GEM"
    And lower panel slots are "EMPTY", "EMPTY", "yellowGem"

  Scenario: A full wrong arrangement ejects the three gems and bulk is refused
    Given item "cyanGem" is carried
    When I send "put all in lower panel"
    Then the output contains "The LOWER PANEL must be solved deliberately"
    When I send "take magenta gem"
    And I send "take yellow gem"
    And I send "put cyan gem in middle slot"
    And I send "put magenta gem in bottom slot"
    And I send "put yellow gem in top slot"
    Then the output contains "The LOWER PANEL spits all three gems onto the OAK UNDERCROFT floor"
    And lower panel slots are "EMPTY", "EMPTY", "EMPTY"
    And item "cyanGem" is in "below"
    And item "magentaGem" is in "below"
    And item "yellowGem" is in "below"
    And flag "oak:lowerPanelAligned" is unset

  Scenario: Yellow, magenta, cyan aligns the panel and starts the lift below
    Given item "cyanGem" is carried
    When I send "take magenta gem"
    And I send "take yellow gem"
    And I send "put yellow gem in top slot"
    And I send "put magenta gem in middle slot"
    And I send "put cyan gem in bottom slot"
    Then the output contains "Three beams join into a white shaft"
    And flag "oak:lowerPanelAligned" is set
    And flag "oak:liftBeat" equals 3
    And item "oakPlatform" is in "below"
    And lower panel slots are "yellowGem", "magentaGem", "cyanGem"
    And the game score is 35

  Scenario: Look up and wait identify the lower lift's stop
    Given the aligned lower lift is at "below"
    When I send "look up"
    Then the output contains "The PLATFORM is at BELOW; its next stop is GROUND."
    When I send "wait"
    Then the output contains "The PLATFORM reaches ABOVE."

# end upsidedown-lowerpanel.feature
