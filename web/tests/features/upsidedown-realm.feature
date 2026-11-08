# upsidedown-realm.feature. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.001:acoven.

@walkthrough
Feature: The Upside Down realm hub
  The MINERS' LOCKER is an open portal after DREADMAW, with a walkable realm
  hub that remains reachable by the ordinary named-flight rules.

  Background:
    Given a fresh manor game

  Scenario: The locker opens onto the realm and OUT returns to the gallery
    Given flag "dragonMoved" is set
    And the player is in room "mineGallery"
    When I send "open locker"
    Then the output contains "The LOCKER swings open onto a lamplit forest instead of its own back wall. You can go IN."
    When I send "in"
    Then the current room is "waylampClearing"
    And the output contains "The world folds around the hinge; you step into THE UPSIDE DOWN. (+20)"
    When I send "out"
    Then the current room is "mineGallery"
    And the output contains "You climb out through the MINERS' LOCKER into the MINING GALLERY."

  Scenario: Realm discovery awards once across repeated locker entries
    Given flag "dragonMoved" is set
    And the player is in room "mineGallery"
    When I send "open locker"
    And I send "in"
    Then the game score is 20
    When I send "out"
    And I send "in"
    Then the output contains "You duck through the locker into THE UPSIDE DOWN."
    And the output does not contain "(+20)"
    And the game score is 20

  Scenario: Realm discovery survives restore without another award
    Given flag "dragonMoved" is set
    And the player is in room "mineGallery"
    When I send "open locker"
    And I send "in"
    And I round-trip the game snapshot
    And I send "out"
    And I send "in"
    Then flag "progressAward:realmDiscovered" is set
    And the output does not contain "(+20)"
    And the game score is 20

  Scenario: The BM Watch routes through the declared locker portal
    Given item "backwardsWatch" is carried
    And the player is in room "mineGallery"
    When I send "open locker"
    And I send "route to waylamp"
    Then the output contains "ROUTE READY"
    And flag "mirrorRoutePrefill" equals "in"

  Scenario: Named flight reaches and leaves realm rooms without a special case
    Given item "wingedShoes" is carried
    And the player is in room "gate"
    When I send "wear shoes"
    And I send "fly waylamp"
    Then the current room is "waylampClearing"
    And the output contains "You arrive in THE UPSIDE DOWN. (+20)"
    When I send "fly gate"
    Then the current room is "gate"

  Scenario: The map shows a separate realm floor after entry
    Given the player is in room "waylampClearing"
    When I send "map"
    Then the output contains "THE UPSIDE DOWN"
    And the output contains "X Waylamp"

  Scenario: Generic puzzle verbs retain their default refusals without puzzle knowledge
    When I send "combine; spell; kick; fight; turn; set; start; pour; fill; stomp; smother"
    Then the output contains "Those pieces do not fit together."
    And the output contains "There is nothing here to spell on."
    And the output contains "Kicking that would not help."
    And the output contains "There is no fight to pick here."
    And the output contains "Nothing here turns."
    And the output contains "There is nothing here to set."
    And the output contains "Nothing here starts."
    And the output contains "You have nothing suitable to pour there."
    And the output contains "There is nothing here to fill that with."
    And the output contains "Stomping changes nothing."
    And the output contains "There is nothing here to smother."

# end upsidedown-realm.feature
