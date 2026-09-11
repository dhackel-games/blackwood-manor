# xray-goggles.feature Copyright (c) 2026:dhackel-games. All Rights Reserved. Do Not Distribute.

@walkthrough
Feature: X-ray goggles in the study desk
  A stuck desk drawer in the study hides a pair of brass-and-glass X-RAY
  GOGGLES. Worn, they let you see in the dark for as long as they stay on
  your face — no mushroom trip required, and no permanent commitment either.

  Background:
    Given a fresh manor game

  Scenario: Prying the stuck desk drawer reveals the goggles
    Given the player is in room "study"
    When I send "pry desk"
    Then the output contains "X-RAY GOGGLES"
    And item "xrayGoggles" is in "study"
    When I send "pry desk"
    Then the output contains "hangs open"

  Scenario: Wearing the goggles lights up a pitch-black room
    Given the player is in room "study"
    When I send "pry desk"
    And I send "take goggles"
    And I send "wear goggles"
    Then the output contains "grainy"
    Given the player is in room "crypt"
    When I send "look"
    Then the output does not contain "pitch black"

  Scenario: Taking the goggles off returns the room to pitch black
    Given the player is in room "study"
    When I send "pry desk"
    And I send "take goggles"
    And I send "wear goggles"
    And I send "remove goggles"
    Given the player is in room "crypt"
    When I send "look"
    Then the output contains "pitch black"

  Scenario: You can't wear the goggles before you've found them
    When I send "wear goggles"
    Then the output contains "aren't carrying"

# end xray-goggles.feature
