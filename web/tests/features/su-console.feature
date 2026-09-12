Feature: The super-user debug console
  A hidden "su" console lets a human tester jump around the manor, spawn items,
  fast-forward to either ending, and survive death — all without passing a turn.
  It is a testing aid; every subcommand is deterministic and side-effect scoped.

  Scenario: The bare "su" command prints the console menu without ending the game
    Given a fresh manor game
    When I send "su"
    Then the output contains "SUPER-USER CONSOLE"
    And the output contains "su goto"
    And the game is not won

  Scenario: "su goto" teleports by room id
    Given a fresh manor game
    When I send "su goto crypt"
    Then the current room is "crypt"

  Scenario: "su goto" resolves a room by its name
    Given a fresh manor game
    When I send "su goto kitchen"
    Then the current room is "kitchen"

  Scenario: Teleporting into a dark room reports the darkness
    Given a fresh manor game
    When I send "su goto wineCellar"
    Then the output contains "pitch dark"

  Scenario: "su light" lets the tester see in the dark
    Given a fresh manor game
    When I send "su light"
    And I send "su goto wineCellar"
    Then the output does not contain "pitch dark"

  Scenario: "su give" drops an item straight into the tester's hands
    Given a fresh manor game
    When I send "su give jeweledCrown"
    Then item "jeweledCrown" is in "inventory"

  Scenario: "su fill" deposits every treasure and opens the floor to Gary's ending
    Given a fresh manor game
    When I send "su fill"
    And I send "su goto grandHall"
    And I send "down"
    Then the current room is "garysLair"
    And the game is won

  Scenario: "su win" fast-forwards to the dawn ending
    Given a fresh manor game
    When I send "su win"
    Then the game is won

  Scenario: "su gary" jumps straight to the secret Gary cliffhanger
    Given a fresh manor game
    When I send "su gary"
    Then the current room is "garysLair"
    And the output contains "GARY"
    And the game is won

  Scenario: "su god" survives an otherwise-fatal action
    Given a fresh manor game
    When I send "su god"
    And I send "east"
    And I send "enter well"
    Then the output contains "GOD MODE"
    And the game is alive

  Scenario: "su score" sets the score directly
    Given a fresh manor game
    When I send "su score 500"
    Then the game score is 500

  Scenario: An unknown subcommand falls back to the menu
    Given a fresh manor game
    When I send "su wobble"
    Then the output contains "unknown command"
    And the output contains "SUPER-USER CONSOLE"

  Scenario: The word "surface" is not swallowed by the su console
    Given a fresh manor game
    When I send "surface"
    Then the output does not contain "SUPER-USER CONSOLE"
