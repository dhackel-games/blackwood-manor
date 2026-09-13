# build-ui.feature. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-12.067:acoven.

@unit
Feature: Build metadata and touch-control contract
  The local game build must identify itself consistently and keep every touch
  direction available without allowing the transcript to displace the controls.

  Scenario: Copyright-version and package date identify the build
    Then the copyright-version is exact
    And the package version is the release date

  Scenario: Touch controls cannot enter a hidden layout state
    Then the touch UI has no control-hiding typing state
    And the transcript shrinks and scrolls inside the viewport
    And the controls remain pinned inside the viewport
    And the local launcher serves every file with no-store headers

  Scenario: The HUD exposes inventory, reliquary, digestive, mushroom, vision, flight, fire, and light status
    Then the HUD has inventory, reliquary, bowel pressure, sickness phase, mushroom, vision, flight, fire, and light indicators

  Scenario: HUD statuses use declarative slots
    Then every HUD status is a HudSlot with an emoji and calculation

  Scenario: The compact HUD explains sound state without wasting a row
    Then the sound-effects toggle is leftmost in the HUD slots and explains its state
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
    Then the shortcut strip keeps Look, Call, and question-mark Help without Examine or Hint

  Scenario: Bug reports open the repository issue form outside the game
    Then the page has an icon-only Bug button
    And bug reports include the current room in the issue title
    And clicking the Bug button uses the default issue description
    And a Bug command uses its phrase as the issue description
    And bug reports include the full session trail, HUD state, and inventory
    And overlong bug histories preserve both ends and mark the omission
    And the iOS wrapper opens new-window web links externally

  Scenario: Game and Gary use large icon-only submit controls
    Then both send arrows are visually doubled and bold without resizing their buttons
    And Gary's circular voice toggle contains a speaker icon
    And both entry rows place the microphone left of the text field and submit arrow
    And both entry rows share text-aware submit styling with custom starter text

  Scenario: Gary offers persistent icon-only computer and Australian voice presets
    Then Gary offers robot and human voice icons
    And Australian presets remain distinct when only the female accent is installed
    And Gary remembers the selected voice preset
    And Gary offers persona and volume controls below his sole mute control
    And Gary's help line keeps the game HUD visible

  Scenario: Browser speech stays active until the microphone is tapped again
    Then browser speech accumulates finalized phrases until explicit submission

  Scenario: Ending Gary's call leaves extra time for his final line
    Then END CALL disables and stays visible 1.5 times longer while Gary finishes

  Scenario: Movement controls form a compact arrow rose beside two action rows
    Then the movement controls form an eight-arrow compass around a center star
    And Up, Down, In, and Out use compact directional glyphs
    And action shortcuts occupy two equally wide rows beside movement

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
    And iOS and Pages derive their deploy identity from CONTENT_VERSION
    And the TestFlight release replaces its repository-local build folder

  Scenario: iOS compares persistent and remote numeric web-content versions
    Then Version reports cached and GitHub.io content through the native bridge
    And Reload seeds the local cache and refreshes differing GitHub.io content
    And a changed app manifest offers an iOS update

  Scenario: Local Gary model status is visible in-page instead of logged
    Then local daemon status is announced in the transcript without console noise

# end build-ui.feature
