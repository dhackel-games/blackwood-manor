# manifest.feature Copyright (c) 2026:dhackel-games. All Rights Reserved. Do Not Distribute.

@unit
Feature: iOS self-update manifest generation
  The iOS app version-checks and self-updates its bundled web game against the
  copy published to GitHub Pages. That handshake depends on a manifest.json that
  describes the runtime bundle. Both the bundled copy (ios/copy-web.sh) and the
  Pages deploy (.github/workflows/pages.yml) generate it with the same tool, so
  the two manifests MUST be directly comparable.

  Background:
    Given a scratch web root that mirrors the real bundle

  Scenario: The manifest lists exactly the runtime files, sorted
    When I build a manifest with version "1000" and commit "abc1234"
    Then the manifest files are exactly:
      | css/style.css |
      | index.html    |
      | js/core.js    |
      | js/ui.js      |
      | js/version.js |

  Scenario: Non-runtime files are excluded from the manifest
    Given the scratch root also contains "manifest.json"
    And the scratch root also contains "package.json"
    And the scratch root also contains "tests/world.test.js"
    And the scratch root also contains "assets/icon.png"
    And the scratch root also contains "DESIGN.md"
    When I build a manifest with version "1000" and commit "abc1234"
    Then the manifest does not list "manifest.json"
    And the manifest does not list "package.json"
    And the manifest does not list "tests/world.test.js"
    And the manifest does not list "assets/icon.png"
    And the manifest does not list "DESIGN.md"

  Scenario: The version is the numeric commit timestamp, for ordering
    When I build a manifest with version "1789248707" and commit "abc1234"
    Then the manifest version is the number 1789248707

  Scenario: A non-numeric version degrades to zero rather than throwing
    When I build a manifest with version "not-a-number" and commit "abc1234"
    Then the manifest version is the number 0

  Scenario: The label is human-readable and pulled from version.js
    When I build a manifest with version "1000" and commit "abc1234"
    Then the manifest label is "2026.9.11 build 77 · abc1234"

  Scenario: A newer deploy always sorts above an older one
    When I build a manifest with version "1000" and commit "old"
    And I remember that manifest as "earlier"
    And I build a manifest with version "2000" and commit "new"
    And I remember that manifest as "later"
    Then manifest "later" is newer than manifest "earlier"

  Scenario: A broken bundle missing its js directory fails loudly
    Given the scratch root is missing its "js" directory
    When I build a manifest expecting failure
    Then building the manifest threw an error mentioning "js"
