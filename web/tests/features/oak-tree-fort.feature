# oak-tree-fort.feature. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.010:acoven.

@unit
Feature: The mirrored gem panel and Blackwood tree fort
  Three gems must focus mirrored sunlight before the alternating pulley
  platform can reach the fort and its family spyglass.

  Background:
    Given a fresh manor game
    And the player is in room "greatOak"
    And item "emberStone" is carried

  Scenario: The oak and panel explain the optics without printing the solution
    When I send "look"
    Then the output contains "PANEL"
    And the output contains "mirrors"
    And the output does not contain "RGB"
    When I send "examine panel"
    Then the output contains "TOP SLOT: RUBY GEM"
    And the output contains "MIDDLE SLOT: EMPTY"
    And the output contains "BOTTOM SLOT: SAPPHIRE GEM"
    And the output contains "holes bored in the tree"
    And the output does not contain "R G B"
    And the output does not contain "MECHANISM"
    And flag "oakLightAligned" is unset

  Scenario: PLACE in the panel uses the next open slot from bottom to top
    When I send "place emerald in panel"
    Then the output contains "EMERALD GEM"
    And the output contains "MIDDLE SLOT"
    And the output contains "brilliant white shaft"
    And flag "oakLightAligned" is set
    And item "oakPlatform" is in "greatOak"
    And the game score is 10

  Scenario: Explicit named slots can assemble the panel
    When I send "take all"
    And I send "place emerald gem in middle slot"
    Then the output contains "EMERALD GEM"
    And the output contains "MIDDLE SLOT"
    When I send "place ruby gem in top slot"
    Then the output contains "RUBY GEM"
    And the output contains "TOP SLOT"
    When I send "place sapphire gem in bottom slot"
    Then the output contains "SAPPHIRE GEM"
    And the output contains "BOTTOM SLOT"
    And flag "oakLightAligned" is set
    And the game score is 30

  Scenario: A complete wrong arrangement ejects every gem
    When I send "take ruby gem"
    And I send "place ruby in panel"
    Then the output contains "RUBY GEM"
    And the output contains "MIDDLE SLOT"
    And the output contains "fail to converge"
    When I send "place emerald in panel"
    Then the output contains "TOP SLOT"
    And the output contains "spits every gem onto the ground"
    And flag "oakLightAligned" is unset
    And item "oakPlatform" is destroyed
    And item "emberStone" is in "greatOak"
    And item "greenGlassStone" is in "greatOak"
    And item "blueGlassStone" is in "greatOak"
    And the game score is 5
    When I send "examine panel"
    Then the output contains "TOP SLOT: EMPTY"
    And the output contains "MIDDLE SLOT: EMPTY"
    And the output contains "BOTTOM SLOT: EMPTY"

  Scenario: An explicitly occupied slot identifies its gem
    When I send "place emerald in top slot"
    Then the output contains "TOP SLOT already holds the RUBY GEM"
    And item "emberStone" is carried

  Scenario: TAKE ALL removes both installed gems without corrupting their slots
    When I send "take all"
    Then item "greenGlassStone" is carried
    And item "blueGlassStone" is carried
    When I send "examine panel"
    Then the output contains "TOP SLOT: EMPTY"
    And the output contains "MIDDLE SLOT: EMPTY"
    And the output contains "BOTTOM SLOT: EMPTY"
    When I send "put ruby gem in top slot"
    And I send "put emerald gem in middle slot"
    And I send "put sapphire gem in bottom slot"
    Then flag "oakLightAligned" is set

  Scenario: PUT ALL does not bypass the ordered gem puzzle
    When I send "take all"
    And I send "put all in panel"
    Then the output contains "Place each GEM in its named SLOT"
    And item "emberStone" is carried
    And item "greenGlassStone" is carried
    And item "blueGlassStone" is carried
    And flag "oakLightAligned" is unset

  Scenario: Boarding waits one turn before carrying the player to the fort
    When I send "place emerald in panel"
    And I send "step onto platform"
    Then the current room is "greatOak"
    And the output contains "next turn"
    When I send "wait"
    Then the current room is "treeFort"
    And the output contains "BLACKWOOD TREE FORT"

  Scenario: The empty platform alternates and carries the player back down
    When I send "place emerald in panel"
    And I send "enter platform"
    And I send "wait"
    And I send "wait"
    Then item "oakPlatform" is in "greatOak"
    When I send "wait"
    Then item "oakPlatform" is in "treeFort"
    When I send "enter platform"
    And I send "wait"
    Then the current room is "greatOak"

  Scenario: Walking away after boarding disembarks instead of teleporting the player
    When I send "place emerald in panel"
    And I send "enter platform"
    And I send "west"
    Then the current room is "privy"
    And flag "oakLiftRiding" is false

  Scenario: Flying away after boarding always disembarks
    Given flag "high" is 3
    When I send "place emerald in panel"
    And I send "enter platform"
    And I send "fly garden"
    Then the current room is "garden"
    And flag "oakLiftRiding" is false

  Scenario: Aligned lift descriptions override only the obsolete two-stop prose
    Given flag "oak:lowerPanelAligned" is set
    And flag "seen:greatOak" is set
    And flag "seen:below" is set
    And item "oakPlatform" rests in room "greatOak"
    When I send "examine platform"
    Then the output contains "OAK UNDERCROFT"
    And the output does not contain "shuttles between the roots and the TREE FORT"
    When I send "look"
    Then the output contains "An immense GREAT OAK towers"
    And the output contains "In the PANEL, the TOP SLOT holds the RUBY GEM"
    And the output contains "deep roots plunge into the earth; the PLATFORM'S ropes run down a shaft between them to the OAK UNDERCROFT, where up and down trade places."
    Given the player is in room "treeFort"
    When I send "look"
    Then the output contains "A weathered TREE FORT fills the GREAT OAK'S crown."
    And the output contains "sinks past the GREAT OAK'S roots to the OAK UNDERCROFT."

  Scenario: The oak and undercroft name each other only after both are visited
    Given the player is in room "greatOak"
    When I send "look"
    Then the output contains "a dark shaft that drops to some level below that you can't quite make out."
    And the output does not contain "UNDERCROFT"

  Scenario: The undercroft does not name the oak before the oak is visited
    Given the player is in room "below"
    When I send "look"
    Then the output contains "as if a giant oak had been planted upside down"
    And the output does not contain "GREAT OAK"
    And the output does not contain "TREE FORT"

  Scenario: The undercroft lists what each LOWER PANEL slot holds
    Given the player is in room "below"
    When I send "look"
    And the output contains "In the LOWER PANEL, the TOP SLOT holds the MAGENTA GEM, the MIDDLE SLOT is EMPTY, and the BOTTOM SLOT holds the YELLOW GEM."

  Scenario: Runtime navigation uses the declared aligned lift links
    Given the player is in room "below"
    And the aligned lower lift is at "below"
    Then the path from the current room to "GREAT OAK" is "in platform; z; out"

  Scenario: The lower panel adds the four-beat return lift and repeated oak round trips
    Given the player is in room "below"
    And item "cyanGem" is carried
    When I send "take magenta gem"
    And I send "take yellow gem"
    And I send "put yellow gem in top slot"
    And I send "put magenta gem in middle slot"
    And I send "put cyan gem in bottom slot"
    Then item "oakPlatform" is in "below"
    And flag "oak:liftBeat" equals 3
    When I send "enter platform"
    And I send "wait"
    Then the current room is "greatOak"
    And flag "oakLiftRiding" is true
    And flag "oak:liftBeat" equals 0
    When I send "wait"
    Then the current room is "treeFort"
    And flag "oak:liftBeat" equals 1
    When I send "wait"
    Then the current room is "greatOak"
    And flag "oak:liftBeat" equals 2
    When I send "wait"
    Then the current room is "below"
    And flag "oak:liftBeat" equals 3
    When I send "out"
    Then the output contains "You step off into the OAK UNDERCROFT."
    And flag "oakLiftRiding" is false
    When I send "enter platform"
    And I send "wait"
    Then the current room is "greatOak"
    When I send "out"
    Then the output contains "You step off at the GREAT OAK'S roots."
    And flag "oakLiftRiding" is false
    When I send "enter platform"
    And I send "wait"
    And I send "wait"
    And I send "wait"
    Then the current room is "below"
    And flag "oak:liftBeat" equals 3

  Scenario: Hidden shortcuts can route down from the tree fort
    When I send "place emerald in panel"
    And I send "enter platform"
    And I send "wait"
    Then the path from the current room to "PRIVY" is "out; z; w"

  Scenario: Temporary flight cannot bypass an unsolved lift and strand the player
    Given flag "high" is 1
    When I send "fly tree fort"
    Then the current room is "greatOak"
    And the output contains "mirrored sunlight"
    And the game is alive

  Scenario: The BM spyglass reveals the roof route and replaces the old gem reward
    Given the player is in room "treeFort"
    When I send "examine spyglass"
    Then the output contains "BELFRY"
    And the output contains "ROOF"
    When I send "take spyglass"
    Then item "spyglass" is carried
    And the output contains "BM"
    Given the player is in room "grandHall"
    When I send "put spyglass in reliquary"
    Then the output contains line "HEIRLOOMS: 1/24 +0"
    And the game score is 13

  Scenario: The emerald gem does not contribute to the family collection
    Given the player is in room "grandHall"
    When I send "place emerald gem in reliquary"
    Then the output contains line "HEIRLOOMS: 0/24 +1"
    When I send "take emerald gem from reliquary"
    Then item "emberStone" is carried
    And the output contains "take the emerald gem from the RELIQUARY"

  Scenario: A gem nested in a deposited heirloom remains retrievable
    Given item "musicBox" is carried
    And the player is in room "grandHall"
    When I send "open music box"
    And I send "take tiny key"
    And I send "place emerald gem in music box"
    And I send "put music box in reliquary"
    And I send "take emerald gem from reliquary"
    Then item "emberStone" is carried
    And item "musicBox" is in "reliquary"
    And the output contains "take the emerald gem from the RELIQUARY"

  Scenario: A nested family heirloom can be recovered until it occupies its own recess
    Given item "musicBox" is carried
    And item "rubyRing" is carried
    And the player is in room "grandHall"
    When I send "open music box"
    And I send "take tiny key"
    And I send "put ruby ring in music box"
    And I send "put music box in reliquary"
    And I send "take ruby ring from reliquary"
    Then item "rubyRing" is carried
    And item "musicBox" is in "reliquary"
    And the output contains "take the ravenblood ring from the RELIQUARY"

  Scenario: Legacy saves gain the new oak objects and preserve completed heirloom progress
    Given a legacy pre-oak save with the ember deposited is restored
    Then item "spyglass" is in "reliquary"
    And item "greenGlassStone" is in "oakMechanism"
    And item "blueGlassStone" is in "oakMechanism"
    And item "oakPlatform" is destroyed
    And item "silverChalice" is absent from game state
    And item "jeweledCrown" is absent from game state

  Scenario: A completed legacy collection gains both current completion flags
    Given every treasure but the "emberStone" is already in the reliquary
    And a legacy pre-oak save with the ember deposited is restored
    Then flag "curseLiftable" is set
    And flag "floorDoorOpen" is set
    And item "talisman" is in "reliquary"

  Scenario: A completed pre-watch collection gains the replacement hammer but not a new ritual
    Given a completed pre-watch save is restored
    Then item "blackwoodHammer" is in "reliquary"
    And item "backwardsWatch" is in "studyDrawer"
    And the required family item count is 24
    And flag "curseLiftable" is unset
    And flag "floorDoorOpen" is set
    And flag "progressAward:candelabraRestored" is set
    And the game score is 32

  Scenario: A claimed legacy watch maps to the hammer without scoring twice
    Given an in-progress pre-watch save with the watch already claimed is restored
    And the player is in room "grandHall"
    When I send "put hammer in reliquary"
    Then item "blackwoodHammer" is in "reliquary"
    And the game score is 12

# end oak-tree-fort.feature
