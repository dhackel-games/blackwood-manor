# upsidedown-shack.feature. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.001:acoven.

@walkthrough
Feature: The Shack alphabet wall
  The rundown SHACK accepts three rude whole words on its alphabet-bulb wall.

  Background:
    Given a fresh manor game
    And the player is in room "shack"

  Scenario Outline: Each accepted spelling produces the crayon once
    When I send "<command>"
    Then the output contains "The bulbs spell <word> back at you. The wall hiccups and spits out a PURPLE CRAYON with a tiny BM stamped on its wrapper. (+10)"
    And flag "realm:shackSpelled" is true
    And item "purpleCrayon" is in room "shack"
    And item "purpleCrayon" is a treasure heirloom
    And the game score is 10

    Examples:
      | command                                | word   |
      | SpElL F A R T                          | FART   |
      |   tYpE s t i n k on alphabet wall      | STINK  |
      | SPELL CHEESE ON WALL                   | CHEESE |

  Scenario Outline: Incorrect alphabet-wall words do not create an award
    When I send "<command>"
    Then the output contains "The bulbs blink through your word, make a rude raspberry, and go dark. Try another word."
    And flag "realm:shackSpelled" is unset
    And the game score is 0

    Examples:
      | command          |
      | spell FARTS      |
      | type blue on wall |

  Scenario: Blank spelling and speech do not solve the wall
    When I send "spell"
    Then the output contains "Spell what on the ALPHABET WALL?"
    When I send "say fart"
    Then flag "realm:shackSpelled" is unset
    And the game score is 0

  Scenario: The drawing is a separately rewarded heirloom and updates SEARCH
    When I send "search"
    Then the output contains "The drawing has enough arrows to turn a single rude noise into a road map. The wall's bulbs twitch when someone spells on it; their colors mean nothing."
    When I send "take kid's drawing"
    Then the game score is 5
    And item "kidsDrawing" is a treasure heirloom
    When I send "search"
    Then the output contains "The door's nail remembers a drawing covered in arrows. The wall's bulbs twitch when someone spells on it; their colors mean nothing."
    When I send "read drawing"
    Then the output contains "There are no written words. The arrows all accuse the same enormous fart. (+5)"
    And the game score is 10
    When I send "use drawing"
    Then the output contains "There are no written words. The arrows all accuse the same enormous fart."
    And the output does not contain "(+5)"
    And the game score is 10

  Scenario: The crayon's use and the wall reward cannot be farmed
    When I send "spell fart"
    And I send "take crayon"
    Then the game score is 15
    When I send "use purple crayon"
    Then the output contains "You sketch a heroic butt, sign it anonymously, and tuck the PURPLE CRAYON away. (+5)"
    And the game score is 20
    When I send "use crayon"
    Then the output contains "You sketch a heroic butt, sign it anonymously, and tuck the PURPLE CRAYON away."
    And the output does not contain "(+5)"
    And the game score is 20
    When I send "drop crayon"
    And I send "type cheese"
    Then the output contains "The wall gives one sleepy blink. It has no second CRAYON."
    And item "purpleCrayon" is in room "shack"
    And the game score is 20

  Scenario: The wall's award and one crayon survive a snapshot
    When I send "spell fart"
    And I round-trip the game snapshot
    And I send "spell cheese"
    Then item "purpleCrayon" is in room "shack"
    And flag "progressAward:shackSpelled" is set
    And the output contains "no second CRAYON"
    And the game score is 10

  Scenario: The unspawned crayon cannot be mistaken for a color puzzle
    When I send "examine crayon"
    Then the output contains "The wall has not spat out a CRAYON yet."
    When I send "examine alphabet wall"
    Then the output contains "No bulb color matters; the door's KID'S DRAWING is the clue."

# end upsidedown-shack.feature
