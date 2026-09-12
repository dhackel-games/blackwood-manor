# flavor-variety.feature Copyright (c) 2026:dhackel-games. All Rights Reserved. Do Not Distribute.

@unit
Feature: Recurring flavor text variety
  Repeated ambient and conversational lines rotate through complete pools so
  the player does not hear the same line every few turns.

  Scenario: Every recurring flavor category cycles through twelve unique lines
    Given a fresh manor game
    Then every recurring flavor pool has twelve distinct entries and cycles without repetition

# end flavor-variety.feature
