# player-name.feature. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-15.102:acoven.

@unit
Feature: Player name and message templates
  The game asks for a name before the first room appears and resolves explicit
  player-name templates through the single message renderer.

  Scenario: The browser shows title and AI status before the name question
    Then browser startup shows title and AI before asking for the name

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
    Then the output contains "gives Ada back as a reflection"
    And the output does not contain "{{player_name}}"

  Scenario: Gary addresses the player by the authored name token
    Given a fresh unnamed manor game
    When I send "Call me Jeb"
    And I send "call"
    Then the output contains "Jeb"
    And the output does not contain "{{player_name}}"

  Scenario Outline: Skipping the name assigns a changeable silly name
    Given a fresh unnamed manor game
    When I send '<input>'
    Then flag "playerName" equals "Professor Spooky Pants"
    And the output contains "Change it anytime with CALL ME FOO"
    And the output contains "FRONT GATE"

    Examples:
      | input     |
      |           |
      | skip      |
      | no thanks |

  Scenario: Call me changes the player name without spending a turn
    Given a fresh manor game
    When I send "call me Foo"
    Then flag "playerName" equals "Foo"
    And the output contains "We will call you Foo"
    And the turn count is 0
    Given the player is in room "hallBedroom"
    When I send "examine hall mirror"
    Then the output contains "gives Foo back as a reflection"

# end player-name.feature
