# manifest.feature. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-12.067:acoven.

@unit
Feature: iOS self-update manifest generation
  The iOS app compares numeric CONTENT_VERSION values from js/version.js.
  CONTENT_FILES supplies the atomic content-download list, while manifest.json
  is compared independently for iOS app-update availability.

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

  Scenario: The legacy manifest version remains a numeric commit timestamp
    When I build a manifest with version "1789248707" and commit "abc1234"
    Then the manifest version is the number 1789248707

  Scenario: A non-numeric version degrades to zero rather than throwing
    When I build a manifest with version "not-a-number" and commit "abc1234"
    Then the manifest version is the number 0

  Scenario: The label is human-readable and pulled from version.js
    When I build a manifest with version "1000" and commit "abc1234"
    Then the manifest label is "2026.9.11 build 77 · abc1234"
    And content version "2026.9.11" build 77 composes to 20260911077

  Scenario: The version.js file list must match the runtime bundle
    Given the scratch root also contains "js/unlisted.js"
    When I build a manifest expecting failure
    Then building the manifest threw an error mentioning "CONTENT_FILES"

  Scenario: The canonical source declares every runtime content file
    Then the canonical CONTENT_FILES matches its runtime bundle

  Scenario: Generated artifacts default to the declared content identity
    Given the scratch web root links its entry module
    When I write the manifest from its declared content identity
    Then the manifest version is the number 20260911077
    And the manifest label is "2026.9.11 build 77 · 20260911077"
    And the entry module URL contains cache key "20260911077"

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

  Scenario: Published module graphs share one immutable cache key
    Given the scratch web root contains linked ES modules
    When I stamp module URLs with cache key "abc1234"
    Then the entry module URL contains cache key "abc1234"
    And every relative module import contains cache key "abc1234"
    When I stamp module URLs with cache key "def5678"
    Then the entry module URL contains cache key "def5678"
    And every relative module import contains cache key "def5678"
    And no module URL contains cache key "abc1234"
