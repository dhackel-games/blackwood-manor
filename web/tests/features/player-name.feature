# player-name.feature. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-21.103:acoven.

@unit
Feature: Player name and message templates
  The game asks for a name before the first room appears and resolves explicit
  player-name templates through the single message renderer.

  Scenario: The browser intro requests a name without blocking the first room
    Then browser startup includes a nonblocking name request
    And the default name uses three distinct twelve-entry pools

  Scenario Outline: The opening accepts natural name responses without spending a turn
    Given a fresh unnamed manor game
    Then the output contains "What should we call you?"
    When I send '<input>'
    Then flag "playerName" equals "<name>"
    And the turn count is 0
    And the output contains "<name>"
    And the output contains "FRONT GATE"
    And the output does not contain "{{player_name}}"

    Examples:
      | input         | name |
      | Jeb           | Jeb  |
      | say "Jeb"     | Jeb  |
      | call me Foo   | Foo  |
      | call me "Foo" | Foo  |

  Scenario: Room and item prose use the same player-name template renderer
    Given a fresh unnamed manor game
    When I send "Call me Ada"
    Then the output contains "Ada, you stand at the rusted iron FRONT GATE"
    Given the player is in room "hallBedroom"
    When I send "examine hall mirror"
    Then the output contains "gives you back as a reflection"
    And the output does not contain "{{player_name}}"

  Scenario: Descriptions use second-person grammar instead of treating the player name as a pronoun
    Given a fresh unnamed manor game
    When I send "Call me Ada"
    Given the player is in room "porch"
    When I send "look"
    Then the output contains "under your weight"
    And the output does not contain "Ada's weight"
    Given the player is in room "grandHall"
    When I send "look"
    Then the output contains "your smallest movement"
    Given the player is in room "parlor"
    When I send "look"
    Then the output contains "track you"
    Given flag "__suSight" is set
    And the player is in room "crypt"
    When I send "look"
    Then the output contains "at your breast"
    Given the player is in room "nursery"
    When I send "look"
    Then the output contains "fixed on you"
    Given the player is in room "attic"
    When I send "look"
    Then the output contains "eyes find you"
    Given item "backwardsWatch" is carried
    When I send "examine woodblack watch"
    Then the output contains "beneath your reflection"
    And the output does not contain "Ada's reflection"
    And the output does not contain "heirlooms remain"

  Scenario: Gary addresses the player by the authored name token
    Given a fresh unnamed manor game
    When I send "Call me Jeb"
    And I send "call"
    Then the output contains "Jeb"
    And the output does not contain "{{player_name}}"

  Scenario Outline: Skipping the name assigns a changeable silly name
    Given a fresh unnamed manor game
    And the random number generator always returns 0.0
    When I send '<input>'
    Then flag "playerName" equals "Professor Spooky McPoopypants"
    And the output contains "Change it anytime with CALL ME FOO"
    And the output contains "FRONT GATE"

    Examples:
      | input     |
      |           |
      | skip      |
      | no thanks |

  Scenario: Call me changes the player name without spending a turn
    Given a fresh manor game
    And the random number generator always returns 0.0
    When I send "call me Foo"
    Then flag "playerName" equals "Foo"
    And the output contains "Okay! I'll call you Professor Foo McPoopypants"
    And the output contains "just kidding, I'll call you Foo from now on"
    And the turn count is 0
    Given the player is in room "hallBedroom"
    When I send "examine hall mirror"
    Then the output contains "gives you back as a reflection"

  Scenario Outline: A bare first response uses the generated-name joke
    Given a fresh unnamed manor game
    And the random number generator always returns 0.0
    When I send ""
    And I send '<input>'
    Then flag "playerName" equals "Dave"
    And the output contains "Professor Dave McPoopypants"
    And the output contains "just kidding, I'll call you Dave from now on"
    And the turn count is 0

    Examples:
      | input    |
      | dave     |
      | say dave |

  Scenario Outline: CALL ME jokes with one or two supplied words
    Given a fresh unnamed manor game
    And the random number generator always returns 0.0
    When I send ""
    And I send '<input>'
    Then flag "playerName" equals "<actual>"
    And the output contains "<funny>"
    And the output contains "just kidding, I'll call you <actual> from now on"
    And the turn count is 0

    Examples:
      | input               | actual      | funny                       |
      | call me dave        | Dave        | Professor Dave McPoopypants |
      | call me dave hackel | Dave Hackel | Professor Dave Hackel       |
      | my name is dave     | Dave        | Professor Dave McPoopypants |

# end player-name.feature
