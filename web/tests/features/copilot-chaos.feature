# copilot-chaos.feature. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-12.068:acoven.

@chaos
Feature: Copilot's mystery package and lightning jumps
  A gift-wrapped package that begs not to be opened, and random lightning
  strikes once you're inside the manor, both of which can teleport you
  anywhere in the house — including the doorless space between the walls,
  and including straight into the crypt wraith's waiting arms.

  Background:
    Given a fresh manor game
    And the player is in room "grandHall"

  Scenario: The package sits in the royal hall with an ominous card
    When I send "look"
    Then the output contains "PACKAGE"
    When I send "read package"
    Then the output contains "DO NOT OPEN ME"
    And the output contains "regert"

  Scenario Outline: Opening the package can heal you, harm you, or move you
    Given the random number generator always returns <roll>
    When I send "open package"
    Then the output contains "<phrase>"
    And item "mysteryPackage" is destroyed

    Examples:
      | roll  | phrase                    |
      | 0.01  | golden light              |
      | 0.20  | meaty stench              |
      | 0.45  | absurdly lucky coin       |
      | 0.60  | IGNITES                   |
      | 0.90  | walls are breathing again |

  Scenario: Opening the package can trigger flaming diarrhea, immediately
    Given the random number generator always returns 0.75
    When I send "open package"
    Then the output contains "FLAMING. DIARRHEA."
    And flag "onFire" is true
    And flag "sick" is positive
    And fire status has 5 turns

  Scenario: Mystery-package combustion exposes a fire countdown
    Given the random number generator always returns 0.60
    When I send "open package"
    Then flag "onFire" is true
    And fire status has 5 turns

  Scenario: Opening the package can teleport you into the space between the walls
    Given the random number generator returns 0.30 then 0.99
    When I send "open package"
    Then the output contains "get FILED somewhere the house forgot to build"
    And the current room is "betweenWalls"
    And the game score is 20

  Scenario: The between-the-walls bonus only pays out the first time you land there
    Given flag "seen:betweenWalls" is set
    And the random number generator returns 0.30 then 0.99
    When I send "open package"
    Then the current room is "betweenWalls"
    And the game score is 0

  Scenario: The space between the walls holds the backwards watch
    When the player moves directly to room "betweenWalls"
    And I send "look"
    Then the output contains "BACKWARDS WATCH"
    When I send "examine watch"
    Then the output contains "B.W."
    And the output contains "WHAT TIME TAKES, BLOOD REMEMBERS"
    When I send "take watch"
    Then the output contains "Taken"
    And item "backwardsWatch" is in "inventory"
    And the game score is 0
    When I send "out"
    Then the current room is "grandHall"
    When I send "put backwards watch in reliquary"
    Then the output contains "Family heirlooms: 1/13"
    And the game score is 12

  Scenario: Opening the package can teleport you straight into the crypt wraith
    Given the mystery package teleport selects room "crypt"
    When I send "open package"
    Then the game is dead
    And the output contains "WRAITH"

  Scenario: The mystery package cannot strand you in the unsolved tree fort
    Given the mystery package teleport would select room "treeFort"
    When I send "open package"
    Then the current room is not "treeFort"

  Scenario: Peeling the nursery wallpaper opens a deliberate way between the walls
    Given the player is in room "nursery"
    When I send "pull wallpaper"
    And I send "go in"
    Then the current room is "betweenWalls"
    And the output contains "BACKWARDS WATCH"

  Scenario: Flying between the walls preserves its one-time discovery award
    Given item "wingedShoes" is carried
    When I send "wear winged shoes"
    And I send "fly between"
    Then the current room is "betweenWalls"
    And the output contains "(+20)"
    And the game score is 20
    Given the player is in room "nursery"
    When I send "pull wallpaper"
    And I send "in"
    Then the game score is 25

  Scenario: The wallpaper gap stays shut until it has been peeled
    Given the player is in room "nursery"
    When I send "go in"
    Then the output contains "just wallpaper"
    And the current room is "nursery"

  Scenario: Lightning never strikes while chaos is off, no matter the manor state
    Given the random number generator always returns 0.0
    And flag "frontDoorOpen" is set
    When I send "wait"
    Then the current room is "grandHall"
    And the output does not contain "LIGHTNING"

  Scenario: Lightning never strikes before the front door has been opened
    Given chaos events (lightning jumps) are enabled
    And the random number generator always returns 0.0
    When I send "wait"
    Then the current room is "grandHall"
    And the output does not contain "LIGHTNING"

  Scenario: Lightning strikes once you're inside and spears into the floor, not you
    Given chaos events (lightning jumps) are enabled
    And flag "frontDoorOpen" is set
    And the random number generator always returns 0.0
    When I send "wait"
    Then the output contains "LIGHTNING"
    And the output contains "TOUCH it, if you dare"
    And the current room is "grandHall"
    And item "lightningBolt" is in "grandHall"

  Scenario: Touching the lightning bolt teleports you to a random room
    Given chaos events (lightning jumps) are enabled
    And flag "frontDoorOpen" is set
    And the random number generator returns 0.0 then 0.99
    When I send "wait"
    Then item "lightningBolt" is in "grandHall"
    When I send "touch bolt"
    Then the output contains "WHITES OUT"
    And the current room is not "grandHall"
    And item "lightningBolt" is destroyed

  Scenario: A player high on mushrooms is immune to the lightning bolt's touch
    Given chaos events (lightning jumps) are enabled
    And flag "frontDoorOpen" is set
    And flag "high" is 10
    And the random number generator returns 0.0 then 0.99
    When I send "wait"
    Then item "lightningBolt" is in "grandHall"
    When I send "touch bolt"
    Then the output contains "FLY TO or FLOAT TO"
    And the current room is "grandHall"
    And item "lightningBolt" is destroyed

  Scenario: An untouched lightning bolt is use-it-or-lose-it and fizzles the very next turn
    Given chaos events (lightning jumps) are enabled
    And flag "frontDoorOpen" is set
    And the random number generator always returns 0.0
    When I send "wait"
    Then item "lightningBolt" is in "grandHall"
    When I send "wait"
    Then the output contains "sputters out"
    And item "lightningBolt" is destroyed

  Scenario: Lightning never strands you in a guarded, secret, or treasure room
    Given chaos events (lightning jumps) are enabled
    And flag "frontDoorOpen" is set
    And the lightning bolt teleport would select room "dreadmawVault"
    When I send "wait"
    Then item "lightningBolt" is in "grandHall"
    When I send "touch bolt"
    Then the output contains "WHITES OUT"
    And the current room is not "dreadmawVault"
    And the current room is not "crypt"
    And the current room is not "betweenWalls"
    And the current room is not "hiddenVault"
    And the current room is not "hollowSanctum"
    And the current room is not "hollowPassage"
    And the current room is not "secretChamber"
    And the current room is not "treeFort"

  Scenario: Lightning cannot bypass the mirrored gem lift into the tree fort
    Given chaos events (lightning jumps) are enabled
    And flag "frontDoorOpen" is set
    And the lightning bolt teleport would select room "treeFort"
    When I send "wait"
    And I send "touch bolt"
    Then the current room is not "treeFort"

# end copilot-chaos.feature
