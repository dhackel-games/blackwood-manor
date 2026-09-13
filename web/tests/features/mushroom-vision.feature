# mushroom-vision.feature. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-12.068:acoven.

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
    Then the output contains "THIRD EYE (👁️ 11 turns left)"
    And the output contains "BLACKWOOD BLOODSIGNET"
    And vision status has 11 turns
    And flight status has 11 turns
    When I send "look"
    Then the output contains "THIRD EYE"

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
    Then the output contains "ASTRAL CHAMBER"

  Scenario: The Obsidian Eye grants permanent hidden sight but not dark-sight
    Given flag "vaultFound" is set
    And item "headlamp" is carried
    And the player is in room "hiddenVault"
    When I send "wear headlamp"
    And I send "take eye"
    Then item "obsidianEye" is in "inventory"
    And the output contains "WEAR EYE"
    When I send "wear eye"
    Then item "obsidianEye" is worn in slot "forehead"
    And vision status is permanent
    And light status has 198 turns
    Given the player is in room "garden"
    When I send "look"
    Then the output contains "THIRD EYE (👁️ ∞)"
    And the output contains "IRON KEY"
    Given the player is in room "crypt"
    When I send "remove headlamp"
    Then the output contains "pitch black"
    And light status is inactive

  Scenario: USE preserves the obsidian eye's take reward before wearing it
    Given the player is in room "hiddenVault"
    When I send "use eye"
    Then item "obsidianEye" is worn in slot "forehead"
    And flag "obsidianEyeClaimed" is set
    And the game score is 15
    And the output contains "(get obsidian eye, wear eye)"

  Scenario: The Obsidian Eye and XRAY GOGGLES can be worn together
    Given item "obsidianEye" is carried
    And item "xrayGoggles" is carried
    When I send "wear eye"
    And I send "wear goggles"
    Then item "obsidianEye" is worn in slot "forehead"
    And item "xrayGoggles" is worn in slot "eyes"

# end mushroom-vision.feature
