# progress-scoring.feature. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-21.103:acoven.

@unit
Feature: One-time rewards for meaningful progress
  Every portable item earns five points when acquired and five when genuinely
  used; puzzle, deposit, and survival bonuses remain separate and one-time.

  Background:
    Given a fresh manor game

  Scenario: Finding the iron key and opening the manor reward each breakthrough once
    Given the player is in room "garden"
    When I send "move statue"
    Then the output contains "(+5)"
    And the game score is 5
    When I send "move statue"
    Then the game score is 5
    When I send "take iron key"
    Then the output contains "(+5)"
    And the game score is 10
    Given the player is in room "porch"
    When I send "unlock front door with iron key"
    And I send "open front door"
    Then the output contains "(+5)"
    And the game score is 20
    When I send "close front door"
    And I send "open front door"
    Then the game score is 20

  Scenario: Reading the mailbox letter rewards its warning once
    Given the player is in room "porch"
    When I send "open mailbox"
    And I send "read letter"
    Then the output contains "(+5)"
    And the game score is 15
    And item "letter" is carried
    When I send "read letter"
    Then the game score is 15

  Scenario: Implicitly taking an intermediate key still awards its progress points
    Given the player is in room "garden"
    When I send "move statue"
    And I send "read iron"
    Then item "frontKey" is carried
    And the game score is 10

  Scenario: Legacy accidental fires do not count as deliberate survival
    Given a legacy accidental-fire save is restored
    Then flag "progressAward:selfFireSurvived" is unset
    And the game score is 0

  Scenario: Well, cellar, and library discoveries award once
    Given item "rope" is carried
    And the player is in room "garden"
    When I send "down"
    Then the output contains "(+5)"
    And the game score is 10
    When I send "down"
    Then the game score is 10
    Given the player is in room "kitchen"
    When I send "open cellar"
    Then the output contains "(+5)"
    And the game score is 15
    When I send "open cellar"
    Then the game score is 15
    Given the player is in room "library"
    When I send "pull lever"
    Then the output contains "(+5)"
    And the game score is 20
    When I send "pull lever"
    Then the game score is 20

  Scenario: Discovering and opening the hidden safe awards each step once
    Given the player is in room "study"
    When I send "read diary"
    Then the output contains "(+5)"
    And the game score is 15
    When I send "read diary"
    Then the game score is 15
    Given the player is in room "parlor"
    When I send "move painting"
    Then the output contains "(+5)"
    And the game score is 20
    When I send "open safe with 7 3 9"
    Then the output contains "(+5)"
    And the game score is 25
    When I send "close safe"
    And I send "open safe"
    Then the game score is 25

  Scenario: The tiny key route awards its container, key, and lock solution
    Given the player is in room "nursery"
    When I send "open music box"
    Then the output contains "(+5)"
    And the game score is 10
    When I send "take tiny key"
    Then the output contains "(+5)"
    And the game score is 15
    Given the player is in room "masterBedroom"
    When I send "unlock jewelry box with tiny key"
    And I send "open jewelry box"
    Then the output contains "(+5)"
    And the game score is 25
    When I send "close jewelry box"
    And I send "open jewelry box"
    Then the game score is 25

  Scenario: The nursery wall route rewards discovery and deliberate entry
    Given the player is in room "nursery"
    When I send "pull wallpaper"
    Then the output contains "(+5)"
    And the game score is 5
    When I send "pull wallpaper"
    Then the game score is 5
    When I send "in"
    Then the current room is "betweenWalls"
    And the output contains "(+20)"
    And the game score is 25
    When I send "take hammer"
    Then the game score is 30

  Scenario: Passing the wraith with the talisman awards once
    Given item "talisman" is carried
    And flag "__suSight" is set
    And the player is in room "wineCellar"
    When I send "wear talisman"
    And I send "south"
    Then the output contains "(+5)"
    And the game score is 10
    When I send "north"
    And I send "south"
    Then the game score is 10

  Scenario: Discovering mushroom vision and reusable power gear rewards each capability once
    Given the player is in room "kitchen"
    When I send "eat mushrooms"
    Then the output contains "(+10)"
    And the game score is 20
    Given item "mushrooms" is carried
    When I send "eat mushrooms"
    Then the game score is 20
    Given the player is in room "deepShaft"
    When I send "take backpack"
    Then the output contains "(+5)"
    And the game score is 30
    Given the player is in room "mineGallery"
    When I send "take headlamp"
    Then the output contains "(+5)"
    And the game score is 35
    Given the player is in room "dreadmawVault"
    When I send "take winged shoes"
    Then the output contains "(+5)"
    And the game score is 40
    Given flag "progressAward:belfryGogglesFreed" is set
    And the player is in room "belfry"
    When I send "pull rope"
    And I send "take xray goggles"
    Then the output contains "(+5)"
    And the game score is 45

  Scenario: Lowering the attic ladder rewards the solved access mechanism once
    Given the player is in room "landing"
    When I send "pull cord"
    Then the output contains "(+5)"
    And the game score is 5
    When I send "pull cord"
    Then the game score is 5

  Scenario: Sealing the collection and pulling the closet rope reward each step
    Given every treasure but the "ancestralPortrait" is already in the reliquary
    And the player is in room "grandHall"
    When I send "put ancestral portrait in reliquary"
    Then the game score is 25
    When I send "close reliquary"
    Then the output contains "(+5)"
    And the game score is 30
    When I send "open reliquary"
    And I send "close reliquary"
    Then the game score is 30
    When I send "open bell closet"
    And I send "pull bell rope"
    Then the output contains "(+5)"
    And the game score is 35
    When I send "open reliquary"
    And I send "take clock"
    Then flag "floorDoorOpen" is set
    And the game score is 40

  Scenario: Implicit pickup, safe use, dropping and restoring cannot farm the mystery package
    Given the player is in room "grandHall"
    When I send "use package"
    Then flag "useItem:mysteryPackage" is unset
    And the game score is 0
    When I send "read package"
    Then item "mysteryPackage" is carried
    And flag "progressItem:mysteryPackage" is set
    And flag "useItem:mysteryPackage" is set
    And the game score is 10
    When I send "drop package"
    And I send "take package"
    And I round-trip the game snapshot
    And I send "use package"
    Then item "mysteryPackage" is carried
    And the game is alive
    And the game score is 10

  Scenario: Ordinary and custom bulk pickup reward each acquired item exactly once
    Given the player is in room "dreadmawVault"
    When I send "take all"
    Then item "familyCrest" is carried
    And item "wingedShoes" is carried
    And flag "progressItem:familyCrest" is set
    And flag "progressItem:wingedShoes" is set
    And the game score is 10
    When I send "wear shoes"
    Then flag "useItem:wingedShoes" is set
    And the game score is 15
    When I send "drop crest"
    And I send "take crest"
    And I round-trip the game snapshot
    Then the game score is 15
    Given the player is in room "hallBedroom"
    When I send "pull shard"
    Then item "mirrorShard" is carried
    And flag "progressItem:mirrorShard" is set
    And the game score is 20
    When I send "drop shard"
    And I send "take shard"
    Then the game score is 20

  Scenario: Failed or inaccessible uses and incorrect gem placement do not award use points
    Given the player is in room "greatOak"
    And item "emberStone" is carried
    When I send "put emerald in top"
    Then item "emberStone" is carried
    And flag "useItem:emberStone" is unset
    And the game score is 0
    When I send "take ruby"
    And I send "put emerald in top"
    Then item "emberStone" is in "oakMechanism"
    And flag "useItem:emberStone" is unset
    And the game score is 5
    When I send "take emerald"
    And I send "put emerald in middle"
    Then flag "useItem:emberStone" is set
    And the game score is 15
    When I send "use nonexistent"
    And I send "use rope"
    Then the game score is 15
    And flag "useItem:rope" is unset

  Scenario: Indirect fake targets and full hands cannot claim custom pickup or use rewards
    Given the player is in room "nursery"
    When I send "open nonexistent with musicbox"
    Then flag "useItem:musicBox" is unset
    And the game score is 0
    Given the player is in room "porch"
    When I send "open mailbox"
    And I send "read nonexistent with letter"
    Then flag "useItem:letter" is unset
    And the game score is 0
    Given the player is in room "treeFort"
    When I send "use nonexistent with spyglass"
    Then flag "useItem:spyglass" is unset
    And the game score is 0
    Given item "frontKey" is carried
    And the player is in room "masterBedroom"
    When I send "open jewelry with iron"
    Then flag "useItem:frontKey" is unset
    And the game score is 0
    Given item "rope" is carried
    And item "matches" is carried
    And item "apple" is carried
    And item "diary" is carried
    And item "mysteryPackage" is carried
    And flag "__suSight" is set
    And the player is in room "hiddenVault"
    When I send "take eye"
    Then item "obsidianEye" is in "hiddenVault"
    And flag "progressItem:obsidianEye" is unset
    And the game score is 0

  Scenario: Naturally regrown mushrooms cannot repeat pickup, use or vision awards after restore
    Given the player is in room "privy"
    When I send "use fresh"
    Then flag "progressItem:outhouseMushrooms" is set
    And flag "useItem:outhouseMushrooms" is set
    And the game score is 20
    When I round-trip the game snapshot
    And a fresh mushroom crop regrows naturally
    And I send "use fresh"
    Then item "outhouseMushrooms" is destroyed
    And the game score is 20

# end progress-scoring.feature
