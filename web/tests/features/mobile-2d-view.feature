# mobile-2d-view.feature. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-25.011:dhackel.

@unit @mobile
Feature: Mobile 2D map view
  The phone-sized 2D map view (view2d/tilemap.html) drops redundant chrome so the
  room description and story text can breathe: the location/guest/bait/lured HUD
  block is hidden, the step count rides the top status line, the command trail
  moves into a dismissable Commands sheet, zoom is an inline control on the map
  row (the Map settings sheet is gone), and the reading surfaces are enlarged.

  Scenario: The redundant room readout is dropped and steps ride the top status line
    Then the mobile 2D view hides the location HUD block
    And the step count is rendered on the top status line

  Scenario: The command trail is a dismissable bottom sheet on phones
    Then the mobile 2D view has a Commands bottom sheet
    And the Commands sheet opens, closes, and dismisses
    And the command trail renders into the Commands sheet
    And the desktop right-column trail is hidden on phones

  Scenario: Zoom is a first-class control and the settings sheet is gone
    Then the mobile 2D view exposes an inline zoom control
    And the Map settings button is removed
    And the inline zoom control mirrors the map scale

  Scenario: Reading surfaces are enlarged now that chrome is trimmed
    Then the mobile 2D view enlarges the map, description, and message text

  Scenario: The resume banner does not reference a desktop-only column on phones
    Then the resume message adapts to phone layout

# end mobile-2d-view.feature
