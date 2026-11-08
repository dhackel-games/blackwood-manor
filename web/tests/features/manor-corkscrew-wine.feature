# manor-corkscrew-wine.feature. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.001:acoven.

@unit
Feature: Corkscrew and bottomless wine bottle
  The Wine Cellar offers a scored heirloom opener and a renewable, unscored
  source of four shared-high wine sips.

  Background:
    Given a fresh manor game
    And the player is in room "wineCellar"
    And the wine cellar is lit

  Scenario: The cellar prose tracks the decanter and corkscrew
    When I send "look"
    Then the output contains "A CORKSCREW lies beside the CRYSTAL DECANTER"
    And the output contains "WINE BOTTLE with a broken cork waits on the rack"
    When I send "take corkscrew"
    And I send "look"
    Then the output contains "CRYSTAL DECANTER stands beside an empty corkscrew mark"
    Given item "crystalDecanter" is carried
    When I send "search"
    Then the output contains "The space beside the decanter's dust outline is empty"

  Scenario: Using a corkscrew alone names the required bottle
    When I send "take corkscrew"
    And I send "use corkscrew"
    Then the output equals "It needs a WINE BOTTLE with a broken cork."

  Scenario: The corkscrew is the only way to open a cellar bottle
    When I send "take bottle"
    Then item "wineBottle" is carried
    And wine bottle "wineBottle:2" is offered on the cellar rack
    And the output contains "Another dusty WINE BOTTLE waits on the rack"
    When I send "open bottle with corkscrew"
    Then the output contains "Only a CORKSCREW can open it"
    When I send "take corkscrew"
    When I send "open bottle with corkscrew"
    Then the output contains "tiny, scandalized pop"
    And the game score is 15
    When I send "open bottle with corkscrew"
    Then the output contains "already open"
    And the game score is 15

  Scenario: Wine gives four stacking sips and a refill never farms rewards
    When I send "take corkscrew"
    And I send "take bottle"
    And I send "open wine bottle with corkscrew"
    And I send "drink wine"
    Then wine bottle "wineBottle" has 1 consumed sip
    And flag "high" equals 10
    And the game score is 30
    When I send "drink wine"
    And I send "drink wine"
    And I send "drink wine"
    Then wine bottle "wineBottle" has 4 consumed sips
    And item "wineBottle" is destroyed
    And flag "high" equals 40
    And the output contains "The empty BOTTLE crumbles into harmless green dust"
    And wine bottle "wineBottle:2" is offered on the cellar rack
    When I send "take winebtl2"
    And I send "open winebtl2 with corkscrew"
    And I send "drink winebtl2"
    Then wine bottle "wineBottle:2" has 1 consumed sip
    And wine bottle family rewards are earned once
    And the game score is 30

  Scenario: Bottle instances and sip history survive save and restore
    Given the derived maximum score is recorded
    When I send "take corkscrew"
    And I send "take winebtl"
    And I send "open winebtl with corkscrew"
    And I send "drink wine"
    And I round-trip the game snapshot
    Then wine bottle "wineBottle" has 1 consumed sip
    And wine bottle "wineBottle:2" is offered on the cellar rack
    And the derived maximum score is unchanged
    When I send "take winebtl2"
    And I send "open winebtl2 with corkscrew"
    And I send "drink wine"
    Then wine bottle "wineBottle" has 2 consumed sips
    And wine bottle "wineBottle:2" has 0 consumed sips
    When I send "drink winebtl2"
    Then wine bottle "wineBottle:2" has 1 consumed sip
    And wine bottle "wineBottle:3" is offered on the cellar rack

  Scenario: BOTTLE stays milk outside the cellar collision rule
    Given item "milk" rests in room "wineCellar"
    When I send "take bottle"
    Then the output equals "Which BOTTLE? Try WINE BOTTLE or MILK."
    And wine bottle "wineBottle" is offered on the cellar rack
    Given item "milk" is carried
    When I send "take bottle"
    Then item "wineBottle" is carried

  Scenario: Gary explains the opener, refill, and reliquary tradeoff
    When I send "call"
    And I send "give me a hint about the corkscrew"
    Then the output contains "TAKE it before trying the WINE BOTTLE"
    When I send "give me a hint about wine"
    Then the output contains "Each bottle has four sips"
    When I send "give me a hint about the tradeoff"
    Then the output contains "seal the CORKSCREW in the RELIQUARY"

# end manor-corkscrew-wine.feature
