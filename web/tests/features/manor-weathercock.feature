# manor-weathercock.feature. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.001:acoven.

@walkthrough
Feature: Silver Weathercock and roof gargoyles
  The fixed roof gargoyles answer in saved cycling pools before the
  HORIZON-GAZER releases the treasure weathercock.

  Background:
    Given a fresh manor game
    And the player is in room "roof"

  Scenario: The roof describes the fixed gargoyles and their release cost
    When I send "look"
    Then the output contains "Four fixed GARGOYLES ring a SILVER WEATHERCOCK: the BURPER NORTH, the FARTER EAST, the SHITTER SOUTH, and the HORIZON-GAZER WEST. The last one's hand rests on the post's bolt."
    And the output contains "The BURPER faces NORTH with cheeks inflated and a fist against its chest."
    And the output contains "The HORIZON-GAZER faces WEST, its fingers resting on the post's bolt."
    When I send "search"
    Then the output contains "The ridge from the BELFRY is solid enough to walk. The BURPER puffs its cheeks and presses a fist to its chest, the FARTER holds its nose, the SHITTER covers its butt with both hands, and the HORIZON-GAZER watches the far edge of the sky with one hand ready to snap the WEATHERCOCK free."
    And the roof gargoyles are fixed and the weathercock is a treasure

  Scenario: Every pre-release grammar directs the weathercock and awards once
    When I send "turn weathercock to face burper"
    Then the output contains "The BURPER pats its chest and lets out a belch that makes the gutter ring. (+2) (+5)"
    And flag "progressAward:gargoyleBurper" is set
    And flag "useItem:silverWeathercock" is set
    And the game score is 7
    When I send "turn weathercock to farter"
    Then the output contains "The FARTER pinches its nose and points accusingly at an innocent cloud. (+2)"
    And flag "progressAward:gargoyleFarter" is set
    And the game score is 9
    When I send "rotate vane to face shitter"
    Then the output contains "The SHITTER clutches its stone butt with both hands. Even the mortar looks nervous. (+2)"
    And flag "progressAward:gargoyleShitter" is set
    And the game score is 11
    When I send "turn weathercock north"
    Then the output contains "The BURPER's puffed cheeks deflate like sad bagpipes; three pigeons resign."
    And the game score is 11

  Scenario: Gargoyle pools persist through a save without an early repeat
    When I turn the weathercock toward "burper" 13 times, saving after 6
    Then the weathercock "burper" replies cover a full unique cycle after restore
    And the game score is 7

  Scenario: Missing and unknown weathercock destinations are fair refusals
    When I send "turn weathercock"
    Then the output equals "Face the WEATHERCOCK toward which gargoyle or direction?"
    When I send "turn weathercock to face chimney"
    Then the output equals "The rooster has four perches: NORTH, EAST, SOUTH, WEST."
    When I send "fight burper"
    Then the output equals "The gargoyle is stone. Try facing the WEATHERCOCK toward it instead."

  Scenario: The Horizon-Gazer frees the weathercock irreversibly
    When I send "take weathercock"
    Then the output equals "The WEATHERCOCK is bolted to its post. Face it toward the gargoyles first."
    When I send "rotate vane to face horizon gazer"
    Then the output contains "For centuries I have longed to wander past that horizon, but the curse of this stone holds me fast. You, rooster, I can set free."
    And the output contains "Its stone hand snaps the post's bolt. The SILVER WEATHERCOCK drops free for you to TAKE. (+5) (+5)"
    And flag "manor:weathercockFreed" is set
    And flag "progressAward:weathercockFreed" is set
    And flag "useItem:silverWeathercock" is set
    And the game score is 10
    And item "silverWeathercock" is a treasure heirloom
    When I send "turn weathercock to face burper"
    Then the output equals "The WEATHERCOCK is free of its post. It can no longer be turned."
    When I send "take silver weathercock"
    Then the output contains "Taken. (+5)"
    And item "silverWeathercock" is in room "inventory"
    And the game score is 15
    When I send "use weathercock"
    Then the output equals "The freed WEATHERCOCK no longer turns. Its silver beak makes a fine pointer."
    And the game score is 15

  Scenario Outline: Gary gives the canonical roof hints
    Given the random number generator always returns 1.0
    When I send "call gary"
    And I send "<topic>"
    Then the output contains "<hint>"

    Examples:
      | topic           | hint                                                                                                                          |
      | hint roof       | From the ATTIC, fly through the skylight, or find the NORTH door with hidden sight, then go UP from the HIDDEN VAULT and WEST from the BELFRY. |
      | hint gargoyles  | The WEATHERCOCK can face four fixed stone faces. Visit BURPER, FARTER, and SHITTER before HORIZON-GAZER; a freed rooster cannot turn again. |
      | hint weathercock | TURN WEATHERCOCK TO FACE a gargoyle or direction. After the HORIZON-GAZER frees it, TAKE the SILVER WEATHERCOCK. |

# end manor-weathercock.feature
