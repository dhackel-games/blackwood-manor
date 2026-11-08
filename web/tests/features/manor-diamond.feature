# manor-diamond.feature. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.001:acoven.

@walkthrough
Feature: Blackwood Diamond microwave and DIAL
  The PARLOR supplies one COAL lump at a time, and the KITCHEN MICROWAVE
  turns only its unexplained dial marks into the BLACKWOOD DIAMOND.

  Background:
    Given a fresh manor game

  Scenario: The coal stack gives one lump and search is visible to hidden sight
    Given the player is in room "parlor"
    When I send "look"
    Then the output contains "one loose lump near the grate"
    When I send "take coal"
    Then the output contains "You pry one lump of COAL from the cold fireplace."
    And item "coalLump" is in "inventory"
    When I send "take lump"
    Then the output equals "One lump at a time. Use or recover the COAL you already took before taking another."
    When I send "look"
    Then the output contains "but no second lump is loose"
    When I send "search"
    Then the output contains "The cold fireplace has a reachable COAL stack, but only one loose lump at a time."
    Given flag "high" is 2
    When I send "look"
    Then the output contains "The cold fireplace has a reachable COAL stack, but only one loose lump at a time."
    Given the player is in room "kitchen"
    When I send "put coal in microwave"
    And I send "set dial to M"
    And I send "start microwave"
    Given the player is in room "parlor"
    When I send "take coal"
    Then the output contains "You pry one lump of COAL from the cold fireplace."

  Scenario Outline: Every microwave setting has its canonical coal outcome
    Given the player is in room "kitchen"
    And item "coalLump" is carried
    When I send "put coal in microwave"
    Then the output equals "You put the COAL in the MICROWAVE."
    When I send "set dial to <setting>"
    And I send "start microwave"
    Then the output contains "<outcome>"
    And the microwave coal outcome is "<state>"

    Examples:
      | setting | outcome                                                               | state     |
      | 1       | The MICROWAVE hums, stops, and leaves the same lump of COAL unchanged inside. | unchanged |
      | 100     | The MICROWAVE rattles for a while, stops, and leaves the same lump of COAL unchanged inside. | unchanged |
      | M       | The MICROWAVE opens on a smear of graphite. Your lump of COAL is gone; fetch another from the PARLOR. | consumed |
      | T       | The MICROWAVE opens on a sad dusting of powder. Your lump of COAL is gone; fetch another from the PARLOR. | consumed |
      | B       | The MICROWAVE chimes. Where the COAL sat, a BLACKWOOD DIAMOND winks at you from the open tray. | diamond |

  Scenario: The Diamond is unique, a treasure, and usable
    Given the player is in room "kitchen"
    And item "coalLump" is carried
    When I send "put coal in microwave"
    And I send "set dial to B"
    And I send "start microwave"
    Then the Blackwood Diamond is a treasure heirloom worth 15
    And item "blackwoodDiamond" is in "microwave"
    When I send "take diamond"
    And I send "use diamond"
    Then the output contains "briefly give your own reflection a monocle"
    And flag "useItem:blackwoodDiamond" is set
    When I send "start microwave"
    Then the output equals "The MICROWAVE has made its one DIAMOND. Another lump would only waste your time."
    And the Diamond award was granted only once

  Scenario: The Diamond state survives restore without a second award
    Given the player is in room "kitchen"
    And item "coalLump" is carried
    When I send "put coal in microwave"
    And I send "set dial to B"
    And I send "start microwave"
    And I round-trip the game snapshot
    And I send "start microwave"
    Then item "blackwoodDiamond" is in "microwave"
    And flag "progressAward:diamondMade" is set
    And the game score is 10

  Scenario: RUN starts machinery while retaining directional travel
    Given the player is in room "kitchen"
    And item "coalLump" is carried
    When I send "put coal in microwave"
    And I send "run microwave"
    Then the output contains "The MICROWAVE hums, stops"
    When I send "run north"
    Then the current room is "diningRoom"

  Scenario: The microwave descriptions and absent Diamond refusal are fair
    Given the player is in room "kitchen"
    And item "rope" is carried
    When I send "search"
    Then the output contains "The MICROWAVE has a dial marked only 1 · 100 · M · B · T."
    When I send "put rope in microwave"
    Then the output equals "The MICROWAVE has room for one lump of COAL, not that."
    When I send "take diamond"
    Then the output equals "There is no DIAMOND in the MICROWAVE yet."
    When I send "open microwave"
    Then the output equals "The MICROWAVE door drops open."
    When I send "open microwave"
    Then the output equals "The MICROWAVE is already open."
    When I send "start microwave"
    Then the output equals "The MICROWAVE has nothing to cook. PUT a lump of COAL inside."

  Scenario: Dial errors and settings are persisted
    Given the visible dial is "microwave"
    When I send "set dial"
    Then the output equals "Set the DIAL to which mark?"
    When I send "rotate dial to X"
    Then the output equals "The DIAL has only five marks: 1 · 100 · M · B · T."
    When I send "set microwave dial to B"
    And I round-trip the game snapshot
    Then the visible dial setting is "B"

  Scenario Outline: DIAL keeps Gary explicit while visible dialables handle settings
    Given the visible dial is "<dial>"
    When I send "<command>"
    Then the output contains "<result>"
    And the DIAL call state is "<onCall>"

    Examples:
      | dial      | command             | result                                         | onCall |
      | none      | dial                | Gary                                           | true   |
      | microwave | dial                | Gary                                           | true   |
      | microwave | dial B              | The MICROWAVE DIAL clicks to B.                | false  |
      | microwave | turn dial to T      | The MICROWAVE DIAL clicks to T.                | false  |
      | microwave | set dial to M       | The MICROWAVE DIAL clicks to M.                | false  |
      | microwave | set microwave dial to B | The MICROWAVE DIAL clicks to B.             | false  |
      | microwave | rotate dial to T    | The MICROWAVE DIAL clicks to T.                | false  |
      | microwave | spin dial           | The MICROWAVE DIAL clicks to 100.              | false  |
      | microwave | dial Gary           | Gary                                           | true   |
      | microwave | dial phone          | Gary                                           | true   |
      | microwave | dial hotline        | Gary                                           | true   |
      | safe      | dial B              | The SAFE dial accepts its own numbers, not B.  | false  |
      | safe      | dial 7 3 9          | The safe clicks open                            | false  |

  Scenario Outline: Gary gives only the fair coal and microwave hints
    Given the random number generator always returns 1.0
    When I send "call"
    And I send "hint <topic>"
    Then the output contains "<hint>"

    Examples:
      | topic     | hint                                                                                         |
      | coal      | The PARLOR has COAL in its cold fireplace. You may carry only one lump at a time.           |
      | microwave | PUT COAL IN MICROWAVE, SET its DIAL to one of the printed marks, then START. Some settings leave the lump; others consume it. |
      | diamond   | If a setting eats your COAL without making a DIAMOND, go back to the PARLOR for another lump. |

# end manor-diamond.feature
