# upsidedown-demogorgonzola.feature. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.001:acoven.

@lane3
Feature: The kitchen fridge and Demogorgonzola
  The fridge supplies the three stinky cheeses that safely feed the creature.

  Background:
    Given a fresh manor game

  Scenario: The closed fridge protects its contents and holds the starting supplies
    Given the player is in room "kitchen"
    When I send "take limburger"
    Then the output contains "The FRIDGE is closed. OPEN it first."
    When I send "open fridge"
    Then the output contains "MILK, an EMPTY MILK JUG, LIMBURGER, ÉPOISSES, and MUNSTER greet you with four different levels of bad judgment."
    And item "milk" is in "fridge"
    And item "milkJug" is in "fridge"
    And item "limburgerCheese" is in "fridge"
    And item "epoissesCheese" is in "fridge"
    And item "munsterCheese" is in "fridge"
    When I send "take cheese"
    Then the output contains "Which CHEESE? Try LIMBURGER, ÉPOISSES, or MUNSTER."
    When I send "take limburger"
    And I send "eat limburger"
    Then the output contains "This is food for something with a larger digestive tract and worse manners. You leave the CHEESE intact."
    And item "limburgerCheese" is in "inventory"

  Scenario Outline: Older saves receive the fridge supplies without relocating moved milk
    Given a pre-fridge save with milk "<milk location>" is restored
    Then item "fridge" is in "kitchen"
    And item "milkJug" is in "fridge"
    And item "limburgerCheese" is in "fridge"
    And item "epoissesCheese" is in "fridge"
    And item "munsterCheese" is in "fridge"
    And item "milk" is in "<expected location>"

    Examples:
      | milk location | expected location |
      | kitchen       | fridge            |
      | inventory     | inventory         |

  Scenario: Older saves preserve milk that has already been drunk
    Given a pre-fridge save with milk "destroyed" is restored
    Then item "milk" is gone
    And item "milkJug" is in "fridge"

  Scenario: A filled milk jug can be poured out anywhere and earns its first use reward once
    Given the player is in room "gate"
    And item "milkJug" is carried
    And the milk jug is filled
    When I send "pour out"
    Then the output contains "You tip out the JUG. It is EMPTY again. (+5)"
    And the game score is 5
    When I send "pour jug out"
    Then the output contains "The JUG is already empty."
    And the game score is 5

  Scenario: Feeding the cheeses in one order opens the creature and awards once
    Given the player is in room "cheeseGrotto"
    And item "limburgerCheese" is carried
    And item "epoissesCheese" is carried
    And item "munsterCheese" is carried
    When I send "feed limburger"
    Then the output contains "DEMOGORGONZOLA gulps down the LIMBURGER. One face-petal unfolds. (1/3)"
    When I send "offer epoisses to monster"
    Then the output contains "DEMOGORGONZOLA gulps down the ÉPOISSES. One face-petal unfolds. (2/3)"
    When I send "give munster to creature"
    Then the output contains "The last cheese disappears. DEMOGORGONZOLA'S face opens petal by petal like a ghastly flower"
    And flag "realm:demoFed" is true
    And item "demogorgonzolaRind" is in "cheeseGrotto"
    And the game score is 25
    When I send "feed limburger"
    Then the output contains "All three cheeses have done their work. The RIND is on the grotto floor."
    And the game score is 25

  Scenario: Feeding the cheeses in another order also works
    Given the player is in room "cheeseGrotto"
    And item "limburgerCheese" is carried
    And item "epoissesCheese" is carried
    And item "munsterCheese" is carried
    When I send "feed munster"
    And I send "feed limburger"
    And I send "feed epoisses"
    Then flag "realm:demoFed" is true
    And item "demogorgonzolaRind" is in "cheeseGrotto"
    And the game score is 25

  Scenario: The rind is a treasure heirloom with normal pickup and use rewards
    Given the player is in room "cheeseGrotto"
    And item "limburgerCheese" is carried
    And item "epoissesCheese" is carried
    And item "munsterCheese" is carried
    When I send "feed limburger"
    And I send "feed epoisses"
    And I send "feed munster"
    And I send "take rind"
    Then the output contains "Taken. (+5)"
    And item "demogorgonzolaRind" is a treasure heirloom worth 15
    When I send "use rind"
    Then the output contains "You brandish the RIND. DEMOGORGONZOLA hiccups from somewhere very far away. (+5)"
    And the game score is 35
    When I send "use rind"
    Then the output does not contain "(+5)"
    And the game score is 35

  Scenario Outline: Every unsafe directed interaction ejects the player with possessions intact
    Given the player is in room "cheeseGrotto"
    And item "apple" is carried
    When I send "<command>"
    Then the current room is "gate"
    And the output contains "You have been warned about those jaws."
    And item "apple" is in "inventory"

    Examples:
      | command                     |
      | attack demogorgonzola       |
      | fight demogorgonzola        |
      | touch demogorgonzola        |
      | kick demogorgonzola         |
      | take demogorgonzola         |
      | drop demogorgonzola         |
      | push demogorgonzola         |
      | pull demogorgonzola         |
      | move demogorgonzola         |
      | talk to demogorgonzola      |
      | say hello to demogorgonzola |
      | use apple on demogorgonzola |
      | burn demogorgonzola         |
      | throw apple at demogorgonzola |
      | read demogorgonzola         |
      | listen to demogorgonzola    |
      | open demogorgonzola         |
      | close demogorgonzola        |
      | unlock demogorgonzola       |
      | lock demogorgonzola         |
      | on demogorgonzola           |
      | off demogorgonzola          |
      | light demogorgonzola        |
      | extinguish demogorgonzola   |
      | eat demogorgonzola          |
      | drink demogorgonzola        |
      | wear demogorgonzola         |
      | remove demogorgonzola       |
      | put apple in demogorgonzola |
      | enter demogorgonzola        |
      | climb demogorgonzola        |
      | reach into demogorgonzola   |
      | ring demogorgonzola         |
      | combine demogorgonzola      |
      | spell demogorgonzola        |
      | turn demogorgonzola         |
      | set demogorgonzola          |
      | start demogorgonzola        |
      | pour demogorgonzola         |
      | fill demogorgonzola         |
      | stomp demogorgonzola        |
      | smother demogorgonzola      |
      | flush demogorgonzola        |
      | give apple to demogorgonzola |
      | wake demogorgonzola         |
      | pray demogorgonzola         |
      | sit demogorgonzola          |
      | show demogorgonzola         |
      | route demogorgonzola        |

# end upsidedown-demogorgonzola.feature
