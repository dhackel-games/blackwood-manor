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

  Scenario: The HUD exposes digestive, mushroom, and fire countdowns
    Then the HUD has bowel pressure, sickness phase, mushroom, and fire indicators

  Scenario: HUD statuses use declarative slots
    Then every HUD status is a HudSlot with an emoji and calculation

  Scenario: Say is available as a shortcut prefill
    Then the page has a "say " prefill control

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
