# baron-clues.feature Copyright (c) 2026:dhackel-games. All Rights Reserved. Do Not Distribute.

@unit
Feature: Baron Munchhausen the Third speaks from the Parlor portrait
  The painted Baron guards the safe behind his frame. His first two clues point
  to the Study diary and Gary's helpful hint line; later he alternates between
  embellished heirloom locations and impossible tall tales.

  Scenario: The Baron is a portrait in the Parlor, not a guest behind the wallpaper
    Given a fresh manor game
    And the player is in room "betweenWalls"
    When I send "talk to baron"
    Then the output contains "No one answers"
    And item "baronMunchhausen" is in "parlor"
    And item "portrait" is in "parlor"

  Scenario: An older save moves the Baron out of the wall and keeps his conversation
    Given a fresh manor game
    And a save with the Baron behind the wallpaper is restored
    And the player is in room "parlor"
    When I send "talk to baron"
    Then item "baronMunchhausen" is in "parlor"
    And flag "baronLine" equals 3
    And the output contains "CALL GARY"

  Scenario: Either the portrait or the Baron can introduce himself
    Given a fresh manor game
    And the player is in room "parlor"
    When I send "talk to portrait"
    Then the output contains "BARON MUNCHHAUSEN THE THIRD, at your service"
    And the output contains "PROFILE PAINTING"
    And flag "baronLine" equals 1

  Scenario: His second speech sends you to the Study diary for the safe combination
    Given a fresh manor game
    And the player is in room "parlor"
    When I play this command sequence:
      """
      talk to baron
      talk to baron
      """
    Then the output contains "READ the leather-bound DIARY first found on the STUDY desk"
    And the output contains "SAFE behind my PROFILE PAINTING"
    And flag "baronLine" equals 2

  Scenario: His third speech recommends Gary for genuinely helpful hints
    Given a fresh manor game
    And the player is in room "parlor"
    When I play this command sequence:
      """
      talk to baron
      talk to baron
      talk to baron
      """
    Then the output contains "CALL GARY"
    And the output contains "HINT LINE"
    And the output contains "genuinely helpful"
    And flag "baronLine" equals 3

  Scenario: Moving either the Baron or the painting exposes the safe
    Given a fresh manor game
    And the player is in room "parlor"
    When I send "move baron"
    Then the output contains "BARON'S PROFILE PAINTING"
    And the output contains "SAFE"
    And item "safe" is in "parlor"

  Scenario: After his two fixed hints he leaks a hidden heirloom's location
    Given a fresh manor game
    And the player is in room "parlor"
    And the random number generator always returns 0.0
    When I play this command sequence:
      """
      talk to baron
      talk to baron
      talk to baron
      talk to baron
      """
    Then the output contains "The BARON leans out of the painted frame"
    And the output contains "Great Siege of the Chandeliers"
    And the output contains "SPYGLASS"
    And the output contains "BLACKWOOD TREE FORT"

  Scenario: An heirloom clue about a room starting with The reads cleanly
    Given a fresh manor game
    And every treasure but the "blackwoodHammer" is already in the reliquary
    And item "blackwoodHammer" rests in room "betweenWalls"
    And the player is in room "parlor"
    And the random number generator always returns 0.0
    When I play this command sequence:
      """
      talk to baron
      talk to baron
      talk to baron
      talk to baron
      """
    Then the output contains "The BARON leans out of the painted frame"
    And the output contains "SPACE BETWEEN THE WALLS"
    And the output does not contain "the THE "

  Scenario: When he chooses a tall tale no heirloom clue leaks through
    Given a fresh manor game
    And the player is in room "parlor"
    And the random number generator always returns 0.9
    When I play this command sequence:
      """
      talk to baron
      talk to baron
      talk to baron
      talk to baron
      """
    Then the output contains "rode a cannonball in through the BELFRY"
    And the output does not contain "leans out of the painted frame"

  Scenario: With every heirloom already recovered he has none left to reveal
    Given a fresh manor game
    And every treasure but the "blackwoodHammer" is already in the reliquary
    And the player is in room "parlor"
    And the random number generator always returns 0.0
    When I play this command sequence:
      """
      talk to baron
      talk to baron
      talk to baron
      talk to baron
      """
    Then the output does not contain "leans out of the painted frame"

  Scenario: The 2D map and guide show the Baron as a framed Parlor portrait
    Then the 2D Baron appears in the Parlor portrait

# end baron-clues.feature
