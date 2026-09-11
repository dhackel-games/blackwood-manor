# third-eye.feature Copyright (c) 2026:dhackel-games. All Rights Reserved. Do Not Distribute.

@walkthrough
Feature: The nightshade third eye
  A rotten tomato is a nightshade, kin to belladonna. Eating it opens astral
  sight: you see in the dark, a vision reveals the hidden attic vault, and the
  Obsidian Eye inside makes dark-sight permanent. The trip is survivable.

  Background:
    Given a fresh manor game

  Scenario: Eating the rotten tomato opens the third eye, reveals the vault, and lights the dark
    Given the player is in room "kitchen"
    When I send "examine tomato"
    Then the output matches "nightshade|belladonna"
    When I send "eat tomato"
    Then flag "thirdEye" is positive
    And flag "vaultFound" is set
    And the output matches "NIGHTSHADE|third eye"
    # a normally pitch-black room is now legible through astral sight
    Given the player is in room "crypt"
    When I send "look"
    Then the output does not contain "pitch black"

  Scenario: The third eye reveals hidden astral detail and shows a countdown
    Given the player is in room "kitchen"
    When I send "eat tomato"
    And the player moves directly to room "masterBedroom"
    When I send "look"
    Then the output contains "THIRD-EYE SIGHT"
    And the output contains "RUBY RING"
    And the output matches "[0-9]+ turns of astral sight left"

  Scenario: Mushroom flight and the library lever do not end tomato sight
    Given the player is in room "kitchen"
    When I send "eat mushrooms"
    And I send "eat tomato"
    And I send "fly to library"
    And I send "pull lever"
    Then flag "thirdEye" is positive
    When I send "down"
    Then the current room is "secretChamber"
    And the output does not contain "pitch black"
    And flag "thirdEye" is positive

  Scenario: The attic vault door opens only after the third eye has shown it
    Given the player is in room "attic"
    When I send "north"
    Then the output matches "gable|seam"
    And flag "vaultFound" is unset
    Given flag "vaultFound" is set
    And flag "thirdEye" is set
    When I send "north"
    Then the output contains "HIDDEN VAULT"

  Scenario: The Obsidian Eye grants permanent dark-sight that outlasts the trip
    Given flag "vaultFound" is set
    And flag "thirdEye" is set
    And the player is in room "hiddenVault"
    When I send "take eye"
    Then item "obsidianEye" is in "inventory"
    And flag "darkSight" is set
    # dark-sight persists with the third eye closed and no candle
    Given the player is in room "crypt"
    When I send "look"
    Then the output does not contain "pitch black"

# end third-eye.feature
