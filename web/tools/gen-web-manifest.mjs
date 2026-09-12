// gen-web-manifest.mjs Copyright (c) 2026:dhackel-games. All Rights Reserved. Do Not Distribute.
//
// Emit <root>/manifest.json describing the runtime web bundle so the iOS app can
// version-check against GitHub Pages and self-update its cached copy without a
// new TestFlight build. Run for BOTH the bundled copy (ios/copy-web.sh) and the
// Pages deploy (.github/workflows/pages.yml) so their manifests are comparable.
//
//   node gen-web-manifest.mjs <rootDir> <version> <commit>
//
//   version : integer, the commit's committer timestamp (git show -s --format=%ct).
//             Monotonic across commits, so the app can order "newer" reliably and
//             pick whichever of bundle/cache/remote is freshest.
//   commit  : short git SHA, purely for the human-readable label.
//
// The runtime bundle is exactly what ios/copy-web.sh ships: index.html, css/**,
// and js/**. Everything else in web/ (tests, assets, node_modules, docs) is
// deliberately excluded.

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, posix, relative, sep } from "node:path";
import { pathToFileURL } from "node:url";

function walk(dir, out) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
}

// Build (but do not write) the manifest object for a web root. Exported so tests
// can exercise the file-selection, ordering, and label logic directly.
export function buildManifest(root, version, commit) {
  const files = [];
  files.push(join(root, "index.html"));
  for (const sub of ["css", "js"]) {
    try {
      walk(join(root, sub), files);
    } catch {
      throw new Error(`gen-web-manifest: expected directory ${join(root, sub)} not found`);
    }
  }

  const relFiles = files
    .map((f) => relative(root, f).split(sep).join(posix.sep))
    .filter((f) => f !== "manifest.json")
    .sort();

  let appVersion = "?";
  let build = "?";
  try {
    const vjs = readFileSync(join(root, "js", "version.js"), "utf8");
    appVersion = /APP_VERSION\s*=\s*"([^"]*)"/.exec(vjs)?.[1] ?? appVersion;
    build = /BUILD\s*=\s*"([^"]*)"/.exec(vjs)?.[1] ?? build;
  } catch {
    // Non-fatal: label falls back to the commit sha.
  }

  return {
    version: Number.parseInt(String(version ?? "0"), 10) || 0,
    label: `${appVersion} build ${build} \u00b7 ${commit || "local"}`,
    commit: commit || "local",
    files: relFiles,
  };
}

// Build and write <root>/manifest.json. Returns the manifest object.
export function writeManifest(root, version, commit) {
  const manifest = buildManifest(root, version, commit);
  writeFileSync(join(root, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  return manifest;
}

// CLI: node gen-web-manifest.mjs <rootDir> <version> <commit>
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const [, , rootArg, versionArg, commitArg] = process.argv;
  if (!rootArg) {
    console.error("usage: node gen-web-manifest.mjs <rootDir> <version> <commit>");
    process.exit(1);
  }
  try {
    const m = writeManifest(rootArg, versionArg, commitArg);
    console.log(`gen-web-manifest: wrote ${join(rootArg, "manifest.json")} (v${m.version}, ${m.files.length} files, "${m.label}")`);
  } catch (err) {
    console.error(String(err?.message || err));
    process.exit(1);
  }
}
