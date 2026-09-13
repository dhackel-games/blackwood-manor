# fire-food.feature. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-12.068:acoven.

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
    And the output contains "(+10)"
    And the game score is 10
    Given item "matches" is carried
    When I send "light self on fire with match"
    Then the output contains "(-5)"
    And the game score is 5
    When I send "extinguish self"
    Then the game score is 5
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
    Then fire status has 6 turns
    And I send "look"
    Then fire status has 5 turns
    Then the output matches "ON   F I R E|🔥"
    When I wait at most 12 turns until death
    Then the game is dead

  Scenario: The player's flames illuminate a dark room
    Given the player is on fire
    And the player is in room "library"
    And flag "leverPulled" is set
    When I send "down"
    Then the current room is "secretChamber"
    And the output does not contain "pitch black"
    And the output contains "HIDDEN CHAMBER"

  Scenario: The garden brazier rejects a lone match but accepts the player's whole fire
    Given the player is in room "garden"
    When I send "light brazier"
    Then the output contains "lone MATCH"
    Given item "matches" is carried
    When I send "light brazier with match"
    Then the output contains "lone MATCH"
    And flag "brazierLit" is unset
    When I send "light self on fire with match"
    And I send "light brazier"
    Then the output contains "EMERALD GEM"
    And the output contains "(+30)"
    And the output contains "set yourself on fire and survived"
    And flag "onFire" is false
    And flag "brazierLit" is true
    And item "emberStone" is in "garden"
    When I send "take emerald gem"
    Then item "emberStone" is in "inventory"
    And the output contains "Taken"
    When the player moves directly to room "grandHall"
    And I send "place emerald gem in reliquary"
    Then item "emberStone" is in "reliquary"
    And the game score is 40
    And the output contains "Family heirlooms: 0/13"
    And the output contains "does not contribute"

  Scenario: A lit candlestick can patiently ignite the garden brazier
    Given the player is in room "garden"
    And item "candlestick" is carried
    And item "matches" is carried
    When I send "light candle"
    And I send "light brazier"
    Then flag "brazierLit" is true
    And flag "onFire" is unset
    And item "emberStone" is in "garden"
    And the output contains "LIT CANDLESTICK"
    And the output contains "EMERALD GEM"
    And the output contains "(+10)"
    And the game score is 10

  Scenario: Water-offer flavor advances only when the offer is displayed
    Given the player is on fire
    And flag "onCall" is set
    And the random number generator always returns 0.0
    When I send "hello"
    Then the output contains "glass of water"
    And flag "flavorCycle:waterOffers" equals 1
    Given a fresh manor game
    And the player is on fire
    And flag "onCall" is set
    And flag "fireStage" is 3
    And the random number generator always returns 0.0
    When I send "pizza"
    Then flag "flavorCycle:waterOffers" is unset

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
    Then the output matches "FART|🤢"
    When I send "drink milk"
    Then flag "sick" equals 0
    And flag "drankMilk" is true
    And the output contains "survived the super burrito"
    And the output contains "(+25)"
    And the game score is 30
    When I win with "You step into the dawn."
    Then the output contains "Got Milk?"

  Scenario: USE contextually eats food and drinks beverages
    Given the player is in room "kitchen"
    When I send "use mushrooms"
    Then flag "high" is positive
    And the output contains "(get mushrooms, eat mushrooms)"
    Given a fresh manor game
    And the player is in room "kitchen"
    And flag "sick" is 10
    When I send "use milk"
    Then flag "sick" equals 0
    And flag "drankMilk" is true
    And the output contains "(get milk, drink milk)"

  Scenario: USE prefers inventory and disambiguates two carried mushroom types
    Given a fresh manor game
    And item "mushrooms" is carried
    And item "outhouseMushrooms" is carried
    When I send "use mushrooms"
    Then the output contains "(which MUSHROOMS? FRESH or DRIED?)"
    And the turn count is 0
    When I send "fresh"
    Then item "outhouseMushrooms" is destroyed
    And item "mushrooms" is carried
    And flag "high" equals 12
    When I send "use mushrooms"
    Then item "mushrooms" is destroyed
    And flag "high" equals 24

  Scenario: A USE clarification stops a command chain
    Given a fresh manor game
    And item "mushrooms" is carried
    And item "outhouseMushrooms" is carried
    When I send "use mushrooms; north"
    Then the output contains "(which MUSHROOMS? FRESH or DRIED?)"
    And the current room is "gate"
    And the turn count is 0
    When I send "fresh"
    Then item "outhouseMushrooms" is destroyed
    And the current room is "gate"
    And the turn count is 1

  Scenario: A USE clarification remembers non-mushroom choices
    Given a fresh manor game
    And item "familyRing" is carried
    And item "rubyRing" is carried
    When I send "use ring"
    Then the output contains "(which RING? DUSTY or RUBY?)"
    And the turn count is 0
    When I send "neither"
    Then the output contains "(which RING? DUSTY or RUBY?)"
    And the turn count is 0

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
    And I send "wait"
    And I send "light self on fire"
    Then the output contains "spicy, sparking diarrhea"
    And the output contains "whole body catches"
    And flag "onFire" is true
    And item "burritoWrapper" is in "inventory"

  Scenario: A carried match does not block ignition during the displayed fart phase
    Given the player is in room "kitchen"
    When I send "take matches"
    And I send "eat burrito"
    And I send "wait"
    And I send "wait"
    And I send "wait"
    Then digestive status has 37 turns and phase "FART"
    When I send "light self on fire"
    Then flag "onFire" is true
    And item "matches" is in "inventory"
    And the output contains "flaming fart"

  Scenario: Inline and HUD bowel status use the same turn snapshot
    Given the player is in room "kitchen"
    When I send "eat burrito"
    And I send "look"
    Then the inline bowel status matches the current digestive state

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

  Scenario: The bowel-pressure gauge tracks the march toward detonation
    Given the player is in room "kitchen"
    When I send "eat burrito"
    And I send "look"
    Then the output contains "BOWEL PRESSURE"
    And the output contains "turns to blast"
    And the output contains "3%"
    When I send "wait"
    And I send "wait"
    And I send "wait"
    And I send "wait"
    And I send "wait"
    And I send "wait"
    And I send "wait"
    And I send "wait"
    And I send "look"
    Then the output matches "BOWEL PRESSURE.*[1-9][0-9]?%"
    And the output contains "turns to blast"

  Scenario: Untreated burrito sickness completes ten cycles and kills
    Given the player is in room "kitchen"
    When I send "eat burrito"
    And I wait through the full burrito course
    Then the accumulated output contains "~ B U R P ~" 10 times
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
    And the output contains "(+25)"
    And the game score is 25

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
