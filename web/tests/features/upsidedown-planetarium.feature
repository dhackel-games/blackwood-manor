# upsidedown-planetarium.feature. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.001:acoven.

@walkthrough
Feature: Planetarium projector and stellar map
  The brass projector keeps asking for a number while the fixed stellar map
  foreshadows its three safe constellations and two nasty ejections.

  Background:
    Given a fresh manor game

  Scenario: Reading the stellar map reveals every fixed setting
    Given the player is in room "mapRoom"
    When I send "read stellar map"
    Then item "stellarMap" is in "inventory"
    And the output contains "STELLAR MAP"
    And the output contains "1 BIG DIPPER OF RANCH"
    And the output contains "2 BLACK BUNGHOLE"
    And the output contains "3 ORION'S WEDGIE"
    And the output contains "4 SERIOUS-SIRIUS"
    And the output contains "5 URANUS MAJOR"
    And flag "useItem:stellarMap" is set
    And the game score is 10
    And the Planetarium heirlooms are treasures with ratified deposits

  Scenario Outline: Gary has the Planetarium safety hints
    Given the random number generator always returns 1.0
    When I send "call gary"
    And I send "<topic>"
    Then the output contains "<hint>"

    Examples:
      | topic     | hint                                                                                         |
      | hint projector | The brass PROJECTOR accepts only numbers 1 to 5. READ the STELLAR MAP next door before you pick one. |
      | hint map       | The STELLAR MAP in the MAP ROOM fixes the order. The dome's drain and scorch marks warn that not every number is kind. |
      | hint eyepiece  | A safe constellation can shake an EYEPIECE out of the projector. The first safe choice is enough. |
      | hint burning   | If the dome sends you to the FRONT GATE on fire, go EAST and LIGHT the GARDEN BRAZIER before you burn out. |

  Scenario Outline: Every setting has the same result with or without the map
    Given the player is in room "planetarium"
    And the stellar map is <map>
    And item "matches" is carried
    When I send "<command>"
    Then the output contains "<outcome>"
    And the planetarium result is <result>
    And item "matches" is in "inventory"

    Examples:
      | map     | command              | outcome                                                          | result   |
      | carried | say 1                | giant ladle over a tiny celery moon                              | safe     |
      | unread  | set projector to 1   | giant ladle over a tiny celery moon                              | safe     |
      | carried | say 2                | stretch into one spectacular noodle                              | bunghole |
      | unread  | set projector to 2   | stretch into one spectacular noodle                              | bunghole |
      | carried | answer 3             | celestial belt rides much too high                               | safe     |
      | unread  | turn projector to 3  | celestial belt rides much too high                               | safe     |
      | carried | say 4                | furious white star flares                                        | sirius   |
      | unread  | turn projector to 4  | furious white star flares                                        | sirius   |
      | carried | use projector with 5 | huge backside constellation rises over the horizon               | safe     |
      | unread  | 5                    | brass projector clears its throat in a way that sounds like a snicker | safe |

  Scenario: The projector always asks the same question and drops one eyepiece
    Given the player is in room "planetarium"
    When I send "use projector"
    Then the output equals "The PROJECTOR asks: Choose a number from 1 to 5."
    When I send "say 1"
    Then flag "realm:eyepieceDropped" is set
    And flag "progressAward:eyepieceDropped" is set
    And item "goldEyepiece" is in "planetarium"
    And the game score is 10
    When I send "start projector"
    Then the output equals "The PROJECTOR asks: Choose a number from 1 to 5."
    When I send "say 3"
    Then the output contains "The projector hatch is empty."
    And item "goldEyepiece" is in "planetarium"
    And the game score is 10

  Scenario: The eyepiece is usable and the Sirius fire lights the brazier
    Given the player is in room "planetarium"
    When I send "say 5"
    And I send "take eyepiece"
    And I send "look through brass ocular"
    Then the output contains "fingerprint looms like a planetary system"
    And flag "useItem:goldEyepiece" is set
    When I send "say 4"
    Then the planetarium result is sirius
    When I send "east"
    And I send "light brazier"
    Then flag "onFire" is false
    And flag "brazierLit" is true
    And the output contains "(+30)"

  Scenario: Invalid projector selections are refused
    Given the player is in room "planetarium"
    When I send "say six"
    Then the output equals "The PROJECTOR asks for one number from 1 to 5."
    When I send "set projector to 0"
    Then the output equals "The PROJECTOR asks for one number from 1 to 5."
    When I send "use projector with 6"
    Then the output equals "The PROJECTOR asks for one number from 1 to 5."
    When I send "0"
    Then the output equals "The PROJECTOR asks for one number from 1 to 5."

# end upsidedown-planetarium.feature
