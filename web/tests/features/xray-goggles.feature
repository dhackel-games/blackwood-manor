# xray-goggles.feature. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-21.103:acoven.

@walkthrough
Feature: Blackwood X-ray goggles
  The belfry bats drop antique BM-marked XRAY GOGGLES. They are a required
  heirloom and, worn on the EYES, provide the same clue vision and darkness
  sight as mushrooms without consuming carrying capacity.

  Background:
    Given a fresh manor game

  Scenario: Ringing the belfry bell reveals the goggles
    Given the player is in room "belfry"
    When I send "pull rope"
    Then the output contains "XRAY GOGGLES"
    And item "xrayGoggles" is in "belfry"

  Scenario: Wearing the goggles lights up a pitch-black room
    Given item "xrayGoggles" is carried
    When I send "wear goggles"
    Then item "xrayGoggles" is worn in slot "eyes"
    Given the player is in room "crypt"
    When I send "look"
    Then the output does not contain "pitch black"

  Scenario: Wearing the goggles reveals mushroom-vision clues
    Given item "xrayGoggles" is carried
    When I send "wear goggles"
    Given the player is in room "garden"
    When I send "look"
    Then the output contains "THIRD EYE (👁️ ∞)"
    And the output contains "IRON KEY"

  Scenario: Taking the goggles off returns the room to pitch black
    Given item "xrayGoggles" is carried
    When I send "wear goggles"
    And I send "remove goggles"
    Given the player is in room "crypt"
    When I send "look"
    Then the output contains "pitch black"

  Scenario: You can't wear the goggles before you've found them
    When I send "wear goggles"
    Then the output contains "aren't carrying"

  Scenario: Depositing the goggles awards the inherited mirror value
    Given item "xrayGoggles" is carried
    And the player is in room "grandHall"
    When I send "put goggles in reliquary"
    Then item "xrayGoggles" is in "reliquary"
    And the output contains line "HEIRLOOMS: 1/13 +0"
    And the game score is 20

# end xray-goggles.feature
