# build-ui.feature. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-15.102:acoven.

@unit
Feature: Build metadata and touch-control contract
  The local game build must identify itself consistently and keep every touch
  direction available without allowing the transcript to displace the controls.

  Scenario: Copyright-version and package date identify the build
    Then the copyright-version is exact
    And the package version matches the native app release date

  Scenario: Large title art keeps its first line aligned when displayed
    Then the large title art has aligned top strokes

  Scenario: Touch controls cannot enter a hidden layout state
    Then the touch UI has no control-hiding typing state
    And the transcript shrinks and scrolls inside the viewport
    And the controls remain pinned inside the viewport
    And the local launcher serves every file with no-store headers

  @toc
  Scenario: TOP and CLEAR manage scrollback without advancing the game
    Then TOP and CLEAR manage both text transcripts without advancing the game
    And the 2D command trail supports TOP and CLEAR

  @toc
  Scenario Outline: Text shortcuts prefill their original gameplay followed by one TOC
    Given a manor text transcript with the sysop menu unlocked
    When I prefill sysop command "<shortcut>" in the text transcript
    Then the text prefill appends TOC without executing its gameplay

    Examples:
      | shortcut  |
      | ::baron   |
      | ::powerup |
      | ::win     |

  @toc
  Scenario: Chained TOC links this submission's pickup without a gameplay turn
    Given a fixture text transcript
    When I type "take key; toc" in the text transcript
    Then pickup "brasskey" marks the message "Taken."
    And the TOC links are "brasskey"
    And the final TOC links every original pickup
    And trailing TOC preserves the gameplay of "take key"
    And the submitted chain remains in command history and the bug trail

  @toc
  Scenario: Trailing TOC preserves a gameplay error and the stopped command chain
    Given a fixture text transcript
    When I type "take key; flummox; take match; toc" in the text transcript
    Then trailing TOC preserves the gameplay of "take key; flummox; take match"
    And item "match" is in "hall"
    And the TOC links are "brasskey"
    And the final TOC links every original pickup

  @toc
  Scenario: Trailing TOC respects quoted speech command boundaries
    Given a fixture text transcript
    When I type "take key; say \"toc; toc\"; toc" in the text transcript
    Then trailing TOC preserves the gameplay of "take key; say \"toc; toc\""
    And the final TOC links every original pickup

  @toc
  Scenario: Quoted TOC is speech rather than a display command
    Given a fixture text transcript
    When I type "take key; say \"toc; toc\"" in the text transcript
    Then observed and headless gameplay output and snapshots agree
    And no TOC has been displayed

  @toc
  Scenario Outline: Trailing TOC remains available after the game ends
    Given a fixture text transcript
    When I type "take key" in the text transcript
    Given the text game is <state>
    When I type "look; toc" in the text transcript
    Then trailing TOC preserves the gameplay of "look"
    And the final TOC links every original pickup

    Examples:
      | state |
      | dead  |
      | won   |

  @toc
  Scenario: TOC jumps to a pickup without advancing the game
    Given a fixture text transcript
    When I type "take key" in the text transcript
    Then pickup "brasskey" marks the message "Taken."
    When I type "toc" in the text transcript
    Then the TOC links are "brasskey"
    And the display command leaves gameplay and Gary untouched
    When I click the TOC link for "brasskey"
    Then that pickup stays in view after a transcript resize

  @toc
  Scenario: Retaking and depositing an item preserve its original pickup target
    Given a fixture text transcript
    When I type "take key" in the text transcript
    And I remember the pickup target for "brasskey"
    And I type "drop key; take key; open box with key; put key in box" in the text transcript
    Then the original pickup target for "brasskey" is unchanged
    And item "key" is in "box"
    When I type "toc" in the text transcript
    Then the TOC links are "brasskey"

  @toc
  Scenario: Discovery and refused takes do not create TOC entries
    Given a fixture text transcript
    When I type "look; examine key; take box; take desk" in the text transcript
    Then the transcript pickup anchors are ""
    When I type "toc" in the text transcript
    Then the TOC honestly reports no pickup locations

  @toc
  Scenario: TAKE ALL records every acquired object using its canonical short name
    Given a fixture text transcript
    When I type "take all" in the text transcript
    Then the transcript pickup anchors are "brasskey,candle,match"
    When I type "toc" in the text transcript
    Then the TOC links are "brasskey,candle,match"

  @toc
  Scenario: Pickup observations cannot change inventory or saved gameplay
    Given a fixture text transcript
    When I modify a received pickup observation
    Then the acquired item and snapshot match an unobserved pickup

  @toc
  Scenario: A later same-chain rename does not rewrite an earlier pickup anchor
    Given a fixture text transcript
    And the fixture lever renames the key
    When I type "take key; pull lever" in the text transcript
    Then pickup "brasskey" marks the message "> take key"
    And the transcript pickup anchors are "brasskey,token"
    When I type "toc" in the text transcript
    Then the TOC links are "brasskey,token"

  @toc
  Scenario: Shared INFO identifies TOC as a text-view-only command
    Then the shared INFO entry marks TOC as text-view-only

  @toc
  Scenario Outline: Implicit acquisition survives consumption in the same command
    Given a fixture text transcript
    And the player is in fixture room "study"
    When I type "<command>" in the text transcript
    Then pickup "ration" marks the message "You eat the ration."
    And the transcript ration has been consumed
    When I type "toc" in the text transcript
    Then the TOC links are "ration"

    Examples:
      | command    |
      | use ration |
      | eat ration |

  @toc
  Scenario: A chain anchors ordinary pickups and puzzle grants before calling Gary
    Given a fixture text transcript
    When I type "take key; pull lever; north; eat ration; call; toc" in the text transcript
    Then trailing TOC preserves the gameplay of "take key; pull lever; north; eat ration; call"
    And pickup "brasskey" marks the message "> take key"
    And pickup "token" marks the message "> pull lever"
    And pickup "ration" marks the message "> eat ration"
    And pickups "brasskey,token,ration" have distinct output messages
    And the phone transcript says "Hang up, then type TOC to jump to item pickups in the game transcript."

  @toc
  Scenario: The full SYSOP win route keeps pickup targets inside individual command outputs
    Given a manor text transcript with the sysop menu unlocked
    When I run the SYSOP win route in the text transcript
    Then the route reaches the clock with separate original key and clock pickup messages
    And observed and headless gameplay output and snapshots agree
    And the final TOC links every original pickup

  @toc
  Scenario: CLEAR removes the DOM pickup record without removing carried items
    Given a fixture text transcript
    When I type "take key" in the text transcript
    And I type "clear" in the text transcript
    Then item "key" is in "inventory"
    And the transcript pickup anchors are ""
    When I type "toc" in the text transcript
    Then the TOC honestly reports no pickup locations
    And the display command leaves gameplay and Gary untouched

  @toc
  Scenario: TOC on Gary's call screen gives local guidance without contacting Gary
    Given a fixture text transcript
    And Gary's call screen is active
    When I type "toc" in the text transcript
    Then the phone transcript says "Hang up, then type TOC to jump to item pickups in the game transcript."
    And the display command leaves gameplay and Gary untouched

  Scenario: The HUD exposes inventory, reliquary, digestive, mushroom, vision, flight, fire, and light status
    Then the HUD has inventory, reliquary, bowel pressure, sickness phase, mushroom, vision, flight, fire, and light indicators

  Scenario: HUD statuses use declarative slots
    Then every HUD status is a HudSlot with an emoji and calculation

  Scenario: The compact HUD groups sound and view controls without wasting a row
    Then the sound-effects toggle is leftmost in the HUD slots and explains its state
    And the HUD remains one non-wrapping row
    And the bowel meter has no trailing solid cap

  Scenario: Static game controls use half-size boxes
    Then the static control boxes are half size with readable text

  Scenario: Restoring a game refreshes effect countdowns
    Then a successful restore updates the HUD before returning

  Scenario: Explicit save-state actions are recorded for end-game awards
    Then Save and Restore mark the no-takebacks disqualifier

  Scenario: Say is available as a shortcut prefill
    Then the page has a "say " prefill control

  Scenario: Use is available as a contextual shortcut prefill
    Then the page has a "use " prefill control

  Scenario: Redundant inspection and hint-line buttons stay out of the shortcut strip
    Then the shortcut strip keeps Look, Call, and question-mark Info without Examine or Hint

  Scenario: Bug reports open the repository issue form outside the game
    Then the page has an icon-only Bug button
    And bug reports include the current room in the issue title
    And clicking the Bug button uses the default issue description
    And a Bug command uses its phrase as the issue description
    And bug reports include the full session trail, HUD state, and inventory
    And bug reports include numbered Gary dialogue with compact speaker labels
    And overlong bug histories preserve both ends and mark the omission
    And the iOS wrapper opens new-window web links externally

  @toc
  Scenario: Game and Gary use large icon-only submit controls
    Then both submit controls use the same extra-thick SVG arrow
    And Gary's circular voice toggle contains a speaker icon
    And both entry rows place the microphone left of the text field and submit arrow
    And both entry rows share text-aware submit styling with custom starter text
    And game-over restart text links to the latest session start
    And browser restart handling supports both game parts

  Scenario: Gary offers persistent icon-only computer and Australian voice presets
    Then Gary offers robot and human voice icons
    And Australian presets remain distinct when only the female accent is installed
    And Gary remembers the selected voice preset
    And Gary offers persona and volume controls below his sole mute control
    And Gary's help line keeps the game HUD visible

  Scenario: Browser speech stays active until the microphone is tapped again
    Then browser speech accumulates finalized phrases until explicit submission
    And browser speech retries transient network interruptions

  Scenario: Ending Gary's call leaves extra time for his final line
    Then END CALL disables and stays visible 1.5 times longer while Gary finishes

  Scenario: Movement controls form a compact arrow rose beside two action rows
    Then the movement controls form an eight-arrow compass around a center star
    And Up, Down, In, and Out use compact directional glyphs
    And touch-capable movement controls are twenty-five percent larger without widening actions
    And the navigation selector sits left of a persistent disclosure control
    And the compass centers responsively beside edge-aligned action shortcuts

  Scenario: 2D command entry shares the text-mode parser vocabulary
    Then 2D command entry delegates manor verbs to the shared parser

  Scenario: 2D mode matches the text terminal's behavior
    Then 2D mode reaches behavior parity with the text terminal

  Scenario Outline: Every movement direction has a touch button
    Then the page has a "<direction>" touch command

    Examples:
      | direction |
      | north     |
      | south     |
      | east      |
      | west      |
      | northeast |
      | northwest |
      | southeast |
      | southwest |
      | up        |
      | down      |
      | in        |
      | out       |

  Scenario: TestFlight packages the canonical web game
    Then the TestFlight release refreshes the web bundle before generating the Xcode project
    And the iOS app version matches the date-only package version
    And the TestFlight release synchronizes the app version from the package
    And successful TestFlight releases publish verified app availability
    And iOS and Pages derive their deploy identity from CONTENT_VERSION
    And the TestFlight release replaces its repository-local build folder

  Scenario: iOS compares persistent and remote numeric web-content versions
    Then Version reports local and source content through the native bridge
    And the iOS launch banner reports the live content source without a transcript echo
    And Reload seeds the local cache and refreshes differing GitHub.io content
    And release-channel metadata decides whether a native iOS update is available

  Scenario: Local Gary model status is visible in-page instead of logged
    Then local daemon status is announced in the transcript without console noise

# end build-ui.feature
