// version.js — single source of truth for the build stamp.
//
// Shown in the banner and in the always-visible HUD so you can tell at a glance
// whether the browser is running the build you just deployed (GitHub Pages
// serves js/ with `cache-control: max-age=600`, so a stale tab can lag ~10min
// behind a push — if the version here doesn't match, hard-refresh).
//
// BUMP THIS in the same commit as any gameplay/engine change.
export const VERSION = "2.5.0";
export const BUILD_DATE = "2026-09-09";
