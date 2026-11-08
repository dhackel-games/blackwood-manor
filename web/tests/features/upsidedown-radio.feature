# upsidedown-radio.feature. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.001:acoven.

@walkthrough
Feature: Cabinet radio quiz
  The AV CLUB DEN's CABINET RADIO offers original clue play-by-plays, never
  lyrics, and makes a persisted, seeded five-title round.

  Scenario: The song catalog and a seeded round follow the canonical draw
    Given a fresh radio quiz game seeded with 123456789
    When I start the cabinet radio
    Then the radio catalog has twenty songs with five clues each
    And the active radio round matches the canonical LCG draw for seed 123456789
    And the active radio round lists its answer exactly once

  Scenario: A title answer works and a wrong answer resets the streak
    Given a fresh radio quiz game seeded with 123456789
    When I start the cabinet radio
    And I answer the active radio title
    Then the radio streak is 1
    When I answer the active radio option incorrectly
    Then the output contains "Wrong. The CABINET RADIO plays"
    And the output contains "back in a cracking falsetto without getting through a single note. Streak: 0/3."
    And the radio streak is 0

  Scenario: An unquoted title retains parser prepositions
    Given a fresh radio quiz game seeded with 123456789
    And the active radio title is "Take On Me"
    When I send "say take on me"
    Then the output contains "Correct. The CABINET RADIO applauds itself with a tinny drum roll. Streak: 1/3."
    And the radio streak is 1

  Scenario: An invalid answer does not move the active round
    Given a fresh radio quiz game seeded with 123456789
    When I start the cabinet radio
    And I save the current radio state
    And I send "answer 6"
    Then the output contains "Pick a number from 1 to 5; the clue hasn't changed."
    And the current radio state is unchanged

  Scenario: Three numbered answers open the cabinet and award the heirloom once
    Given a fresh radio quiz game seeded with 123456789
    When I start the cabinet radio
    And I answer the active radio option correctly by number
    And I answer the active radio option correctly by number
    And I answer the active radio option correctly by number
    Then the output contains "Three in a row! The CABINET RADIO rattles like a locker full of angry spoons."
    And the cabinet radio is open
    And the portable transistor radio is revealed
    And the radio quiz score is 10
    When I replay the opened cabinet radio
    Then the output contains "The cabinet has already opened. The PORTABLE TRANSISTOR RADIO is yours to take."
    And the radio quiz score is 10
    When I take and use the portable transistor radio twice
    Then the portable transistor radio pickup and use award only once
    And the radio quiz score is 20

  Scenario: Restoring preserves an active round and streak
    Given a fresh radio quiz game seeded with 123456789
    When I start the cabinet radio
    And I answer the active radio option correctly by number
    And I save the active radio round
    And I answer the active radio option incorrectly
    And I restore the active radio round
    Then the saved radio round and streak are preserved

# end upsidedown-radio.feature
