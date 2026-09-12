# cave-gear.feature Copyright (c) 2026:dhackel-games. All Rights Reserved. Do Not Distribute.

@gear
Feature: Dreadmaw's mine, wearable gear, and the roof route
  Equipment found beyond Dreadmaw opens new ways to explore the manor without
  consuming carrying capacity while it is worn.

  Background:
    Given a fresh manor game

  Scenario: The abandoned mining backpack expands carrying capacity
    Then the inventory HUD shows "👤" with "0/6"
    Given flag "dragonMoved" is set
    And the player is in room "mineGallery"
    When I send "wear headlamp"
    And I send "down"
    Then the output contains "BACKPACK"
    When I send "take backpack"
    Then the output contains "Taken and worn"
    And item "backpack" is worn in slot "back"
    And the inventory capacity is 20
    And the inventory load is 0
    And the inventory HUD shows "🎒" with "0/20"

  Scenario: A dusty Blackwood family ring waits in an ore cart
    Given the player is in room "dragonAntechamber"
    When I send "take family ring"
    Then item "familyRing" is in "inventory"
    When the player moves directly to room "grandHall"
    And I send "put family ring in reliquary"
    Then item "familyRing" is in "reliquary"
    And the game score is 20

  Scenario: The mining headlamp lights the deep shaft for two hundred turns
    Given flag "dragonMoved" is set
    And the player is in room "dragonCaveMouth"
    When I play this command sequence:
      """
      east
      east
      wear headlamp
      """
    Then the current room is "mineGallery"
    And item "headlamp" is worn in slot "head"
    And the inventory load is 0
    And headlamp status has 200 turns
    When I send "down"
    Then the current room is "deepShaft"
    And the output does not contain "pitch black"
    And headlamp status has 199 turns

  Scenario: The headlamp battery expires after two hundred illuminated turns
    Given item "headlamp" is carried
    When I send "wear headlamp"
    And I wait 199 turns
    Then headlamp status has 1 turn
    When I send "wait"
    Then the output contains "battery dies"
    And item "headlamp" is unlit

  Scenario: Worn equipment occupies body slots instead of carrying capacity
    Given item "headlamp" is carried
    And item "xrayGoggles" is carried
    And item "wingedShoes" is carried
    And item "rubyRing" is carried
    And item "talisman" is carried
    When I play this command sequence:
      """
      wear headlamp
      wear goggles
      wear shoes
      wear ring
      wear talisman
      """
    Then item "headlamp" is worn in slot "head"
    And item "xrayGoggles" is worn in slot "eyes"
    And item "wingedShoes" is worn in slot "feet"
    And item "rubyRing" is worn in slot "finger"
    And item "talisman" is worn in slot "neck"
    And the inventory load is 0
    When the player moves directly to room "grandHall"
    And I send "put ring in reliquary"
    Then the output contains "Remove the ring"
    And item "rubyRing" is worn in slot "finger"

  Scenario: Only one item can occupy an equipment slot
    Given item "headlamp" is carried
    And item "xrayGoggles" is carried
    And item "xrayGoggles" uses wear slot "head"
    When I send "wear headlamp"
    And I send "wear goggles"
    Then the output contains "head slot is already occupied"
    And item "xrayGoggles" is not worn

  Scenario: XRAY GOGGLES are hidden in the hall bedroom drawer
    Given the player is in room "landing"
    When I send "north"
    Then the current room is "hallBedroom"
    And the output contains "NIGHT TABLE"
    When I send "open drawer"
    Then the output contains "GOGGLES"
    When I send "wear goggles"
    Then the output contains "(get goggles, wear goggles)"
    And item "xrayGoggles" is worn in slot "eyes"
    And vision status is permanent
    When the player moves directly to room "garden"
    And I send "look"
    Then the output contains "THIRD EYE (👁️ ∞)"
    And the output contains "IRON KEY"

  Scenario: WINGED SHOES open the physical roof and belfry route
    Given item "wingedShoes" is carried
    And the player is in room "attic"
    When I play this command sequence:
      """
      wear shoes
      up
      east
      down
      """
    Then the current room is "hiddenVault"
    And flight status is permanent

  Scenario: WINGED SHOES protect against open vertical hazards
    Given item "wingedShoes" is carried
    And the player is in room "garden"
    When I send "wear shoes"
    And I send "down"
    Then the game is alive
    And the output contains "drift down the WELL"
    Given flag "ladderDown" is set
    And item "apple" is carried
    And item "matches" is carried
    And item "rope" is carried
    When the player moves directly to room "landing"
    And I send "up"
    Then the game is alive
    And the current room is "attic"

  Scenario Outline: Mushrooms can fly to every named rooftop room
    Given flag "high" is 8
    When I send "fly <destination>"
    Then the current room is "<room>"

    Examples:
      | destination  | room        |
      | roof         | roof        |
      | belfry       | belfry      |
      | hidden vault | hiddenVault |
      | dreadmaw vault | dreadmawVault |

  Scenario Outline: WINGED SHOES can fly to every named rooftop room
    Given item "wingedShoes" is carried
    When I send "wear shoes"
    And I send "fly <destination>"
    Then the current room is "<room>"

    Examples:
      | destination  | room        |
      | roof         | roof        |
      | belfry       | belfry      |
      | hidden vault | hiddenVault |
      | dreadmaw vault | dreadmawVault |

  Scenario: Dreadmaw's vault contains the family crest and winged shoes
    Given the player is in room "dreadmawVault"
    When I send "take family crest"
    And I send "wear winged shoes"
    Then item "familyCrest" is in "inventory"
    And item "wingedShoes" is worn in slot "feet"

  Scenario: The stolen Blackwood heirlooms return to the reliquary for score
    Given item "silverChalice" is carried
    And item "jeweledCrown" is carried
    And item "familyCrest" is carried
    And the player is in room "grandHall"
    When I send "put chalice in reliquary"
    Then item "silverChalice" is in "reliquary"
    And the game score is 20
    When I send "put crown in reliquary"
    Then item "jeweledCrown" is in "reliquary"
    And the game score is 45
    When I send "put family crest in reliquary"
    Then item "familyCrest" is in "reliquary"
    And the game score is 60

  Scenario: Ten family heirlooms are required to lift the curse
    Then the required family item count is 10

  Scenario: Vault bonus treasures do not by themselves trigger the curse-lifting
    Given item "silverChalice" is carried
    And the player is in room "grandHall"
    When I send "put chalice in reliquary"
    Then flag "curseLiftable" is unset
    And the output does not contain "longs to be RUNG"

  Scenario: Winged shoes float up through the shut attic trap-door
    Given item "wingedShoes" is carried
    And the player is in room "landing"
    When I send "wear winged shoes"
    And I send "up"
    Then the current room is "attic"
    And the output contains "WINGED SHOES"

  Scenario: MAP charts the mine and roofline without spoiling their vaults
    Given the player is in room "mineGallery"
    When I send "map"
    Then the output contains "DREADMAW'S CAVE"
    And the output contains "Mine Gallery"
    And the output does not contain "Dreadmaw Vault"
    When the player moves directly to room "roof"
    And I send "map"
    Then the output contains "ROOFLINE"
    And the output contains "Roof"
    And the output does not contain "Hidden Vault"

# end cave-gear.feature
