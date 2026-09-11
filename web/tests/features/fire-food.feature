# fire-food.feature Copyright (c) 2026:dhackel-games. All Rights Reserved. Do Not Distribute.

@walkthrough
Feature: Fire and food consequences
  Matches, self-immolation, Gary's fire response, the brazier, and the burrito
  affliction must preserve their deliberately ridiculous but deterministic rules.

  Background:
    Given a fresh manor game

  Scenario: Burn the letter, confirm the match, and ask Gary for rescue
    When I send "north"
    And I send "open mailbox"
    Then the output contains "letter"
    When I send "get letter"
    Then the output equals "Taken."
    And the letter has no hard line breaks
    When I send "burn letter"
    Then the output matches "alight|ash|flakes"
    And item "letter" is destroyed
    When I send "light self on fire"
    Then the output contains "source of ignition"
    And flag "onFire" is unset
    Given item "matches" is carried
    When I send "light self on fire"
    Then the output equals "(with match?)"
    And flag "onFire" is unset
    And item "matches" is in "inventory"
    When I send "yes"
    Then the output contains "(with match)"
    And the output contains "on fire"
    And flag "onFire" is true
    And item "matches" is destroyed
    When I send "call gary"
    Then the output matches "burning|on fire"
    And the output matches "dollar ninety-nine|1[.]99"
    When I send "Gary call the fire department!"
    Then the output contains "2.98"
    And the output contains "pizza"
    When I send "here's the money"
    Then the output matches "fire brigade|hose|OUT"
    And flag "onFire" is false

  Scenario: Burn self alias requires confirmation and can be extinguished
    When I send "burn self"
    Then the output contains "source of ignition"
    Given item "matches" is carried
    When I send "burn self"
    Then the output equals "(with match?)"
    When I send "yes"
    Then the output contains "on fire"
    When I send "extinguish self"
    Then the output contains "no longer on fire"
    When I send "light mailbox"
    Then the output equals "You can't light that."

  Scenario: Declining self-immolation preserves the match
    Given item "matches" is carried
    When I send "light self on fire"
    Then the output equals "(with match?)"
    When I send "no"
    Then the output contains "unused"
    And item "matches" is in "inventory"
    And flag "onFire" is unset

  Scenario: The single match can light the candle or the player, never both
    Given item "candlestick" is carried
    And item "matches" is carried
    When I send "light candle"
    Then the output matches "spent match|no more matches"
    And item "matches" is destroyed
    When I send "light self on fire"
    Then the output contains "source of ignition"

  Scenario: Unchecked self-immolation is fatal and displays its status art
    Given item "matches" is carried
    When I send "light self on fire with match"
    And I send "look"
    Then the output matches "ON   F I R E|🔥"
    When I wait at most 12 turns until death
    Then the game is dead

  Scenario: The garden brazier requires the player's whole fire
    Given the player is in room "garden"
    When I send "light brazier"
    Then the output matches "whole person|hisses"
    Given item "matches" is carried
    When I send "light self on fire with match"
    And I send "light brazier"
    Then the output contains "EMBER STONE"
    And flag "onFire" is false
    And flag "brazierLit" is true
    And item "emberStone" is in "garden"

  Scenario: Kitchen foods intoxicate, infect, or cure
    Given the player is in room "kitchen"
    When I send "eat mushrooms"
    Then flag "high" is positive
    Given a fresh manor game
    And the player is in room "kitchen"
    When I send "examine burrito"
    Then the output matches "two kinds of beans.*three kinds of cheese.*four kinds of meat"
    And the output contains "Cyclospora cayetanensis"
    And the output contains "edible if you're feeling adventurous"
    When I send "search burrito"
    Then the output matches "two kinds of beans.*Cyclospora"
    When I send "eat burrito"
    Then flag "sick" equals 40
    And item "burritoWrapper" is in "inventory"
    When I send "look"
    Then the output matches "FART-FIRE|🤢"
    When I send "drink milk"
    Then flag "sick" equals 0
    And flag "drankMilk" is true
    When I win with "You step into the dawn."
    Then the output contains "Got Milk?"

  Scenario: Carrying match and foil requires an explicit source choice
    Given the player is in room "kitchen"
    When I send "take matches"
    And I send "eat burrito"
    And I send "light self on fire"
    Then the output contains "with match or fart flames"
    And flag "onFire" is unset
    When I send "light self on fire with match"
    Then the output contains "(with match)"
    And the output contains "on fire"
    And item "matches" is destroyed
    And item "burritoWrapper" is in "inventory"

  Scenario: Explicit fart flames preserve the match
    Given the player is in room "kitchen"
    When I send "take matches"
    And I send "eat burrito"
    And I send "light self on fire with fart flames"
    Then the output contains "next flaming fart or sparking diarrhea"
    And item "matches" is in "inventory"

  Scenario: The foil wrapper waits for a combustible turn and remains reusable
    Given the player is in room "kitchen"
    When I send "eat burrito"
    And I send "light self on fire"
    Then the output contains "next flaming fart or sparking diarrhea"
    And flag "onFire" is unset
    When I send "wait"
    And I send "wait"
    Then the output contains "FLAMING FART"
    And the output contains "tin foil"
    And the output contains "comprehensively ablaze"
    And flag "onFire" is true
    And item "burritoWrapper" is in "inventory"
    When I send "extinguish self"
    And I send "light self on fire"
    And I send "wait"
    And I send "wait"
    Then flag "onFire" is true

  Scenario: The foil wrapper can ignite from sparking diarrhea
    Given the player is in room "kitchen"
    When I send "eat burrito"
    And I send "wait"
    And I send "wait"
    And I send "wait"
    And I send "light self on fire"
    Then the output contains "spicy, sparking diarrhea"
    And the output contains "whole body catches"
    And flag "onFire" is true
    And item "burritoWrapper" is in "inventory"

  Scenario: Dropping the foil cancels queued fart ignition
    Given the player is in room "kitchen"
    When I send "eat burrito"
    And I send "light self on fire"
    And I send "drop wrapper"
    Then the output contains "plan is cancelled"
    And flag "fartIgnitionQueued" is false

  Scenario: Bare "light fart" ignites via the burrito foil
    Given the player is in room "kitchen"
    When I send "eat burrito"
    And I send "light fart"
    Then the output contains "next flaming fart or sparking diarrhea"
    And flag "fartIgnitionQueued" is true
    And flag "onFire" is unset
    When I send "wait"
    And I send "wait"
    Then the output contains "comprehensively ablaze"
    And flag "onFire" is true

  Scenario: The wrapper self-immolates on demand long after the sickness is cured
    Given the player is in room "kitchen"
    When I send "eat burrito"
    And I send "drink milk"
    Then flag "sick" equals 0
    And item "burritoWrapper" is in "inventory"
    When I send "light self on fire"
    Then the output contains "permanent pilot light"
    And the output contains "comprehensively ablaze"
    And flag "onFire" is true
    And item "burritoWrapper" is in "inventory"
    When I send "extinguish self"
    And the player moves directly to room "garden"
    And I send "light fart"
    Then flag "onFire" is true

  Scenario: Untreated burrito sickness completes ten cycles and kills
    Given the player is in room "kitchen"
    When I send "eat burrito"
    And I wait through the full burrito course
    Then the accumulated output contains "stomach acid climbs" 10 times
    And the accumulated output contains "BARF with" 10 times
    And the accumulated output contains "FLAMING FART cracks" 10 times
    And the accumulated output contains "spicy, sparking diarrhea" 10 times
    And the accumulated output contains "B L E A R G H" 10 times
    And the accumulated output contains "F O O M P" 10 times
    And the accumulated output contains "S P L U R T" 10 times
    And every sickness event drawing is marked as non-wrapping output
    And the game is dead

  Scenario Outline: Using or entering the toilet cures burrito sickness
    Given the player is in room "kitchen"
    When I send "eat burrito"
    And the player moves directly to room "privy"
    And I send "<command>"
    Then the output contains "CURED"
    And flag "sick" equals 0

    Examples:
      | command      |
      | use toilet   |
      | enter toilet |

  @toilet
  Scenario: The outhouse toilet is only a hole and cannot flush
    Given the player is in room "privy"
    When I send "flush toilet"
    Then the output contains "hole in the ground"
    And the output contains "nothing to flush"

  Scenario: Escaping while burning awards the fire badge
    Given the player is on fire
    When I win with "You step into the dawn."
    Then the output contains "alive 🔥"
    And the output contains "Frying Pan"

# end fire-food.feature
