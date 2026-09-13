Feature: Reusable engine runs a non-Blackwood game
  The engine (core/parser/commands/map/save) is game-agnostic: an entirely
  different game — the Dave & Andy Games "Escape the Derelict" example — plays
  through the same code with no engine changes. This locks that guarantee into CI.

  Scenario: A brand-new game reaches its own win state on the shared engine
    Given the example spaceport game
    When I send "take keycard"
    And I send "take lamp"
    And I send "north"
    Then the current room is "corridor"
    When I send "north"
    Then the current room is "bridge"
    When I send "use pod"
    Then the game is won
    And the output contains "You blast free of the derelict"

  Scenario: The pod refuses to launch without the keycard (game-specific handler)
    Given the example spaceport game
    When I send "take lamp"
    And I send "north"
    And I send "north"
    And I send "use pod"
    Then the game is not won
    And the output contains "It needs a keycard"

  Scenario: Generic darkness + grue mechanic applies to any game
    Given the example spaceport game
    When I send "north"
    And I send "down"
    Then the current room is "shaft"
    And the output contains "grue"

  Scenario: Carrying a light source lights any dark room
    Given the example spaceport game
    When I send "take lamp"
    And I send "north"
    And I send "down"
    Then the current room is "shaft"
    And the output does not contain "grue"
