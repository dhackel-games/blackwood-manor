# manor-weathervane.feature. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.001:acoven.

@walkthrough
Feature: Silver Weathervane and roof gargoyles
  The fixed roof gargoyles answer in saved cycling pools before the
  far-gazing gargoyle releases the treasure weathervane.

  Background:
    Given a fresh manor game
    And the player is in room "roof"

  Scenario: The roof describes the fixed gargoyles and their release cost
    When I send "look"
    Then the output contains "Four fixed GARGOYLES crouch around a RUSTED WEATHERVANE."
    And the output contains "The PUFF-CHEEKED GARGOYLE faces NORTH"
    And the output contains "The FAR-GAZING GARGOYLE faces EAST"
    And the output contains "SOUTHEAST toward the TREE FORT"
    And the output does not match "BURPER|FARTER|SHITTER|HORIZON-GAZER"
    When I send "search"
    Then the output contains "The ridge from the BELFRY is solid enough to walk."
    And the output does not match "BURPER|FARTER|SHITTER|HORIZON-GAZER"
    And the roof gargoyles are fixed and the weathervane is a treasure

  Scenario: Directional and legacy grammar direct the weathervane and award once
    When I send "point vane n"
    Then the output contains "The north gargoyle pats its chest and makes the gutter ring. (+2) (+5)"
    And flag "progressAward:gargoylePuffCheeks" is set
    And flag "useItem:rustedWeathervane" is set
    And the game score is 7
    When I send "move vane w"
    Then the output contains "The west gargoyle pinches its nose and points accusingly at an innocent cloud. (+2)"
    And flag "progressAward:gargoyleNosePinch" is set
    And the game score is 9
    When I send "rotate vane s"
    Then the output contains "The south gargoyle clutches its stone rear. Even the mortar looks nervous. (+2)"
    And flag "progressAward:gargoyleRearGuard" is set
    And the game score is 11
    When I send "turn vane n"
    Then the output contains "Its puffed cheeks deflate like sad bagpipes; three pigeons resign."
    And the game score is 11

  Scenario: Gargoyle pools persist through a save without an early repeat
    When I turn the weathervane toward "north" 13 times, saving after 6
    Then the weathervane "north" replies cover a full unique cycle after restore
    And the game score is 7

  Scenario: A legacy vane save migrates its state and score flags
    Given a legacy vane save is restored
    Then item "rustedWeathervane" is in "reliquary"
    And flag "manor:weathervaneFreed" is set
    And flag "progressAward:weathervaneFreed" is set
    And flag "progressItem:rustedWeathervane" is set
    And flag "useItem:rustedWeathervane" is set
    And flag "heirloomScore:rustedWeathervane" is set

  Scenario: Missing and unknown weathervane destinations are fair refusals
    When I send "turn vane"
    Then the output equals "Face the WEATHERVANE toward which gargoyle or direction?"
    When I send "turn vane to face chimney"
    Then the output equals "The vane has four directions: NORTH, EAST, SOUTH, WEST."
    When I send "fight puff"
    Then the output equals "The gargoyle is stone. Try facing the WEATHERVANE toward it instead."

  Scenario: The far-gazing gargoyle frees the weathervane irreversibly
    When I send "take vane"
    Then the output equals "The WEATHERVANE is bolted to its post. Face it toward the gargoyles first."
    When I send "turn vane e"
    Then the output contains "For centuries I have longed to wander past that horizon, but the curse of this stone holds me fast. You, vane, I can set free."
    And the output contains "Its curled stone tail snaps the post's bolt. The RUSTED WEATHERVANE drops free for you to TAKE. (+5) (+5)"
    And flag "manor:weathervaneFreed" is set
    And flag "progressAward:weathervaneFreed" is set
    And flag "useItem:rustedWeathervane" is set
    And the game score is 10
    And item "rustedWeathervane" is a treasure heirloom
    When I send "turn vane n"
    Then the output equals "The WEATHERVANE is free of its post. It can no longer be turned."
    When I send "take rusted weathervane"
    Then the output contains "Taken. (+5)"
    And item "rustedWeathervane" is in room "inventory"
    And the game score is 15
    When I send "use vane"
    Then the output equals "The freed WEATHERVANE no longer turns. Its rusted needle makes a fine pointer."
    And the game score is 15

  Scenario Outline: Gary gives the canonical roof hints
    Given the random number generator always returns 1.0
    When I send "call gary"
    And I send "<topic>"
    Then the output contains "<hint>"

    Examples:
      | topic           | hint                                                                                                                          |
      | hint roof       | From the ATTIC, fly through the skylight, or find the NORTH door with hidden sight, then go UP from the HIDDEN VAULT and WEST from the BELFRY. |
      | hint gargoyles  | The WEATHERVANE can face the NORTH, WEST, SOUTH, or EAST gargoyle. Visit the first three before the FAR-GAZING GARGOYLE EAST; a freed vane cannot turn again. |
      | hint weathervane | TURN VANE TO FACE a gargoyle or direction. The FAR-GAZING GARGOYLE EAST points SOUTHEAST toward the TREE FORT and frees the RUSTED WEATHERVANE. |

# end manor-weathervane.feature
