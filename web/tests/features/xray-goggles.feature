# xray-goggles.feature Copyright (c) 2026:dhackel-games. All Rights Reserved. Do Not Distribute.

@walkthrough
Feature: X-ray goggles in the hall bedroom
  The night table drawer hides cheap plastic XRAY GOGGLES. Worn on the EYES,
  they provide the same clue vision and darkness sight as mushrooms without
  consuming carrying capacity.

  Background:
    Given a fresh manor game

  Scenario: Opening the night table drawer reveals the goggles
    Given the player is in room "hallBedroom"
    When I send "open drawer"
    Then the output contains "GOGGLES"
    And item "xrayGoggles" is in "nightDrawer"

  Scenario: Wearing the goggles lights up a pitch-black room
    Given the player is in room "hallBedroom"
    When I send "open drawer"
    And I send "wear goggles"
    Then item "xrayGoggles" is worn in slot "eyes"
    Given the player is in room "crypt"
    When I send "look"
    Then the output does not contain "pitch black"

  Scenario: Wearing the goggles reveals mushroom-vision clues
    Given the player is in room "hallBedroom"
    When I send "open drawer"
    And I send "wear goggles"
    Given the player is in room "garden"
    When I send "look"
    Then the output contains "THIRD EYE (👁️ ∞)"
    And the output contains "IRON KEY"

  Scenario: Taking the goggles off returns the room to pitch black
    Given the player is in room "hallBedroom"
    When I send "open drawer"
    And I send "wear goggles"
    And I send "remove goggles"
    Given the player is in room "crypt"
    When I send "look"
    Then the output contains "pitch black"

  Scenario: You can't wear the goggles before you've found them
    When I send "wear goggles"
    Then the output contains "aren't carrying"

# end xray-goggles.feature
