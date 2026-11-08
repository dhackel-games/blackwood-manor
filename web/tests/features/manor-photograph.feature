# manor-photograph.feature. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.001:acoven.

@unit @lane8
Feature: Baroness Photograph
  Four named torn pieces form the pending-heirloom portrait without losing the
  mailbox letter's warning, progress award, or burn protection.

  Scenario: The mailbox letter remains photo piece A and scraps lie in the hedge and privy
    Given a fresh manor game
    And the player is in room "porch"
    When I send "open mailbox"
    And I send "get photo piece a"
    Then item "letter" is carried
    And the output contains "Taken. (+5)"
    When I send "examine letter"
    Then the output contains "PHOTO PIECE A"
    Given the player is in room "hedgeMazeLoop"
    When I send "search"
    Then the output contains "PHOTO PIECE B rests against a root"
    When I send "get photo piece b"
    Then item "photoPieceB" is carried
    Given the player is in room "privy"
    When I send "search"
    Then the output contains "PHOTO PIECE C above the reach of the TOILET HOLE"
    When I send "get photo piece c"
    Then item "photoPieceC" is carried

  Scenario: The rotting book and hidden sight reveal photo piece D once
    Given a fresh manor game
    And the player is in room "library"
    When I send "search books"
    Then the output contains "A loose PHOTO PIECE D slides onto the LIBRARY floor"
    And flag "manor:photoPieceDFound" is set
    And item "photoPieceD" is in "library"
    When I send "search library"
    Then the output contains "no second hidden piece"
    Given a fresh manor game
    And item "xrayGoggles" is carried
    And the player is in room "library"
    When I send "wear goggles"
    And I send "look"
    Then the output contains "Hidden sight shows a folded PHOTO PIECE D"
    And item "photoPieceD" is in "library"
    And flag "manor:photoPieceDFound" is set

  Scenario: Combining complete pieces preserves the letter and awards every first use once
    Given a fresh manor game
    When I send "combine pieces"
    Then the output contains "You have none; still missing PHOTO PIECE A"
    Given all loose photograph pieces are carried
    When I send "assemble photo pieces"
    Then the output contains "THE BARONESS stands beside a GRANDFATHER CLOCK whose hands read 1:30"
    And item "baronessPhotograph" is carried
    And item "letter" is in "baronessPhotograph"
    And the Baroness Photograph is a pending heirloom worth 15
    And flag "progressAward:photoCombined" is set
    And flag "letterRead" is unset
    And flag "progressAward:letterRead" is unset
    And flag "useItem:letter" is set
    And flag "useItem:photoPieceB" is set
    And flag "useItem:photoPieceC" is set
    And flag "useItem:photoPieceD" is set
    And the game score is 30
    When I send "combine pieces"
    Then the output contains "already whole"
    And the game score is 30
    When I send "read letter"
    Then the output contains "On the back of the BARONESS PHOTOGRAPH"
    And the output contains "whoever inherits this cursed MANOR"
    And flag "progressAward:letterRead" is set
    And flag "useItem:baronessPhotograph" is set
    And the game score is 40
    When I send "read photograph"
    Then the game score is 40

# end manor-photograph.feature
