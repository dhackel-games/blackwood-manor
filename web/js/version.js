// version.js — single source of truth for the on-screen build stamp.
//
// The stamp mirrors what App Store Connect (and iOS Settings) shows: the
// marketing version plus the build number, in Apple's "version (build)" form.
//   - APP_VERSION  = the clean number we monitor. Always equals package.json
//                    "version" (== iOS MARKETING_VERSION). A test enforces this.
//   - BUILD        = iOS CFBundleVersion, kept for bug tracking. Stamped
//                    automatically by ios/release-testflight.sh on every upload.
//
// Shown in the banner and the always-visible HUD so you can tell at a glance
// which build a screenshot came from (GitHub Pages serves js/ with
// `cache-control: max-age=600`, so a stale tab can lag ~10min behind a push).
//
// To cut a release: bump package.json "version" (the release date); the release
// script mirrors it here and into project.yml, and bumps BUILD.

export const APP_VERSION = "2026.9.11"; // == package.json version == App Store marketing version
export const BUILD = "46"; // == iOS CFBundleVersion (stamped by release-testflight.sh)
export const COPYRIGHT = "Copyright (c) dhackel-games. All Rights Reserved.";

// Apple-style "version (build)" so the badge matches App Store Connect exactly.
export const VERSION = `${COPYRIGHT} ${APP_VERSION} (build ${BUILD})`;
