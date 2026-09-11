# build-ui.feature Copyright (c) 2026:dhackel-games. All Rights Reserved. Do Not Distribute.

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

  Scenario: The HUD exposes digestive, mushroom, vision, flight, fire, and headlamp countdowns
    Then the HUD has bowel pressure, sickness phase, mushroom, vision, flight, fire, and headlamp indicators

  Scenario: HUD statuses use declarative slots
    Then every HUD status is a HudSlot with an emoji and calculation

  Scenario: Say is available as a shortcut prefill
    Then the page has a "say " prefill control

  Scenario: Bug reports open the repository issue form outside the game
    Then the page has an icon-only Bug button
    And bug reports include the current room in the issue title
    And clicking the Bug button uses the default issue description
    And a Bug command uses its phrase as the issue description
    And the iOS wrapper opens new-window web links externally

  Scenario: Gary uses large icon-only voice controls
    Then Gary's send arrow is visually doubled without resizing its button
    And Gary's circular voice toggle contains a speaker icon

  Scenario: Gary offers persistent icon-only computer and Australian voice presets
    Then Gary offers robot and human voice icons
    And Australian presets remain distinct when only the female accent is installed
    And Gary remembers the selected voice preset

  Scenario: Browser speech stays active until the microphone is tapped again
    Then browser speech accumulates finalized phrases until explicit submission

  Scenario: Ending Gary's call waits for his final spoken line
    Then END CALL disables and shows progress until Gary finishes speaking

  Scenario: In and Out controls use title case
    Then the movement controls are labeled In and Out

  Scenario Outline: Every movement direction has a touch button
    Then the page has a "<direction>" touch command

    Examples:
      | direction |
      | north     |
      | south     |
      | east      |
      | west      |
      | up        |
      | down      |
      | in        |
      | out       |

  Scenario: TestFlight packages the canonical web game
    Then the TestFlight release refreshes the web bundle before generating the Xcode project
    And the iOS app version matches the date-only package version
    And the TestFlight release synchronizes the app version from the package

# end build-ui.feature
