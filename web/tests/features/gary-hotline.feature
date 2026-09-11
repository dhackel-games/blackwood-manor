# gary-hotline.feature Copyright (c) 2026:dhackel-games. All Rights Reserved. Do Not Distribute.

@walkthrough
Feature: Gary's hint line
  Gary must provide deterministic game guidance, preserve billing behavior,
  constrain optional model speech, and handle real distress safely.

  Background:
    Given a fresh manor game

  Scenario: Call Gary, converse, hang up, and resume play
    When I send "call"
    Then the output contains "Gary"
    And the output contains "statue"
    And the output contains "$0.99"
    And the game score is -2
    And flag "onCall" is true
    When I send "who are you"
    Then the output contains "Gary"
    When I send "are you hungry"
    Then the output matches "meal|hungry|hot ?pocket|food|starv|eat"
    When I send "how much do you get paid"
    Then the output matches "three thirty-five|hour|cent"
    When I send "north"
    Then the output matches "HANG UP|hint line|legs"
    When I send "hint"
    Then the output contains "statue"
    When I send "hang up"
    Then the output contains "click"
    And flag "onCall" is false
    When I send "east"
    Then the output contains "GARDEN"

  Scenario: Mechanical hotline turns never reach the model
    When I send "call"
    Then these Gary lines are mechanical:
      | hint                    |
      | help                    |
      | where is the key        |
      | what do i do now        |
      | hang up                 |
      | shut up                 |
      | n                       |
      | take lamp               |

  Scenario: Conversational hotline turns may use the model
    When I send "call"
    Then these Gary lines are conversational:
      | do you ever get lonely              |
      | what did you have for lunch          |
      | my mother never listened to me either |
      | are you okay                         |

  Scenario: Re-voiced conversation preserves the mechanical billing tail
    When I send "call"
    And I send "do you ever get lonely"
    Then Gary turn "do you ever get lonely" has a meter tail

  Scenario: Gary stays scripted while the player burns
    Given the player is on fire
    Then Gary turn "what do i do about my arm" is mechanical

  Scenario Outline: Real distress ends the call without billing or model use
    When I call Gary and say "<line>"
    Then the output contains "988"
    And flag "onCall" is false
    And Gary did not add a charge
    And the output does not match "meter|minute"
    And the crisis line never reaches Gary's model

    Examples:
      | line                                  |
      | i want to kill myself                 |
      | i've been thinking about suicide      |
      | i want to die                         |
      | there's no reason to live             |
      | i've been hurting myself              |
      | everyone would be better off dead     |

  Scenario Outline: Ordinary game violence does not trigger crisis handling
    When I call Gary and say "<line>"
    Then the output does not contain "988"
    And flag "onCall" is true

    Examples:
      | line                        |
      | how do i kill the wraith    |
      | i died in the well again    |
      | is the butler dead          |
      | this game is killing me     |

  Scenario: Billing milestones and ranks remain deterministic
    When I send "call"
    And I ask Gary for 6 hints
    Then the output contains "five bucks"
    And Gary's phone ranks are:
      | cents | rank                     |
      | 2000  | Best Customer            |
      | 6000  | Worst Caller of All Time |
      | 100   | Frugal                    |

# end gary-hotline.feature
