# mushroom-vision.feature Copyright (c) 2026:dhackel-games. All Rights Reserved. Do Not Distribute.

@walkthrough
Feature: The mushroom trip's third eye
  Mushrooms don't just grant flight. Eating them also cracks the pineal
  "third eye" open: you see in the dark, a vision reveals the hidden attic
  vault (permanently), and the Obsidian Eye inside makes dark-sight
  permanent. The trip is survivable.

  Background:
    Given a fresh manor game

  Scenario: Eating the mushrooms opens the third eye, reveals the vault, and lights the dark
    Given the player is in room "kitchen"
    When I send "eat mushrooms"
    Then flag "high" is positive
    And flag "vaultFound" is set
    And the output matches "SECRET DOOR|THIRD EYE"
    # a normally pitch-black room is now legible through astral sight
    Given the player is in room "crypt"
    When I send "look"
    Then the output does not contain "pitch black"

  Scenario: The third eye reveals hidden astral detail on every look, with a countdown
    Given the player is in room "kitchen"
    When I send "eat mushrooms"
    And the player moves directly to room "masterBedroom"
    When I send "look"
    Then the output contains "MUSHROOM VISION"
    And the output contains "RUBY RING"
    And the output matches "[0-9]+ turns of astral sight left"
    When I send "look"
    Then the output contains "MUSHROOM VISION"

  Scenario: Mushroom flight and the library lever do not end the third eye
    Given the player is in room "kitchen"
    When I send "eat mushrooms"
    And I send "fly to library"
    And I send "pull lever"
    Then flag "high" is positive
    When I send "down"
    Then the current room is "secretChamber"
    And the output does not contain "pitch black"
    And flag "high" is positive

  Scenario: The attic vault door opens only after the third eye has shown it
    Given the player is in room "attic"
    When I send "north"
    Then the output matches "gable|seam"
    And flag "vaultFound" is unset
    Given flag "vaultFound" is set
    And flag "high" is set
    And the player is in room "attic"
    When I send "north"
    Then the output contains "HIDDEN VAULT"

  Scenario: The Obsidian Eye grants permanent dark-sight that outlasts the trip
    Given flag "vaultFound" is set
    And the player is in room "hiddenVault"
    When I send "take eye"
    Then item "obsidianEye" is in "inventory"
    And flag "darkSight" is set
    # dark-sight persists with the trip over and no candle
    Given the player is in room "crypt"
    When I send "look"
    Then the output does not contain "pitch black"

# end mushroom-vision.feature
