# upsidedown-planetarium.feature. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-09.002:acoven.

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
      | hint projector | SET the PROJECTOR's DIAL to a number from 1 to 5, then FLICK the SWITCH. READ the STELLAR MAP next door to see what each number shows. |
      | hint map       | The STELLAR MAP in the MAP ROOM lists what each number projects. |
      | hint eyepiece  | A safe constellation can shake an EYEPIECE out of the projector. The first safe choice is enough. |

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
      | carried | set dial to 1. push button | giant ladle over a tiny celery moon                              | safe     |
      | unread  | set projector to 1. flick switch | giant ladle over a tiny celery moon                              | safe     |
      | carried | turn dial to 2. press button | stretch into one spectacular noodle                              | bunghole |
      | unread  | set projector to 2. turn on projector | stretch into one spectacular noodle                              | bunghole |
      | carried | turn dial to 3. flip switch | celestial belt rides much too high                               | safe     |
      | unread  | turn projector to 3. use projector | celestial belt rides much too high                               | safe     |
      | carried | set dial to 4. push button | furious white star flares                                        | sirius   |
      | unread  | turn projector to 4. flick bulb switch | furious white star flares                                        | sirius   |
      | carried | use projector with 5. push button | huge backside constellation rises over the horizon               | safe     |
      | unread  | set dial to 5. turn on switch | brass projector clears its throat in a way that sounds like a snicker | safe |

  Scenario: The dial picks a projection and the switch projects it, dropping one eyepiece
    Given the player is in room "planetarium"
    When I send "use projector"
    Then the output equals "Set the PROJECTOR's DIAL to a number from 1 to 5, then flick its bulb SWITCH."
    When I send "push button"
    Then the output contains "the DIAL isn't set to a number"
    When I send "set dial to 1"
    Then the output equals "You click the DIAL to 1."
    When I send "flick switch"
    Then flag "realm:eyepieceDropped" is set
    And flag "progressAward:eyepieceDropped" is set
    And item "goldEyepiece" is in "planetarium"
    And the game score is 10
    When I send "examine dial"
    Then the output contains "set to 1"
    When I send "turn dial to 3"
    And I send "press button"
    Then the output contains "Orion reaches behind himself"
    And the output does not contain "hatch"
    And item "goldEyepiece" is in "planetarium"
    And the game score is 10

  Scenario: The eyepiece award and state survive restore without a second drop
    Given the player is in room "planetarium"
    When I send "set dial to 1. push button"
    And I round-trip the game snapshot
    And I send "set dial to 3. push button"
    Then flag "realm:eyepieceDropped" is set
    And item "goldEyepiece" is in "planetarium"
    And the output does not contain "EYEPIECE rolls"
    And the game score is 10

  Scenario: The eyepiece is usable and the Sirius fire lights the brazier
    Given the player is in room "planetarium"
    When I send "set dial to 5. push button"
    And I send "take eyepiece"
    And I send "look through brass ocular"
    Then the output contains "fingerprint looms like a planetary system"
    And flag "useItem:goldEyepiece" is set
    When I send "set dial to 4. push button"
    Then the planetarium result is sirius
    And the output does not contain "BRAZIER"
    When I send "east"
    And I send "light brazier"
    Then flag "onFire" is false
    And flag "brazierLit" is true
    And the output contains "(+30)"

  Scenario: Invalid dial settings are refused and speaking a number does nothing
    Given the player is in room "planetarium"
    When I send "set dial to 6"
    Then the output equals "The DIAL only goes from 1 to 5."
    When I send "set projector to 0"
    Then the output equals "The DIAL only goes from 1 to 5."
    When I send "use projector with 6"
    Then the output equals "The DIAL only goes from 1 to 5."
    When I send "say 1"
    Then flag "realm:eyepieceDropped" is unset

# end upsidedown-planetarium.feature
