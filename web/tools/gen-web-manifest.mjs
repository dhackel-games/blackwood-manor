// gen-web-manifest.mjs. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-13.085:acoven.
//
// Stamp one cache key across the ES-module graph, then emit <root>/manifest.json
// with the runtime file list. This describes downloadable web content only;
// LATEST_APP_BUILD_AVAILABLE in versions.json separately identifies a distributed
// native build. CONTENT_VERSION and CONTENT_FILES govern web content selection
// and downloads. Run for BOTH the bundled copy
// (ios/copy-web.sh) and Pages deploy (.github/workflows/pages.yml).
//
//   node gen-web-manifest.mjs <rootDir> [version] [cacheKey]
//
// With no optional arguments, CONTENT_VERSION is used for both values so the
// iOS bundle and Pages artifact have exactly the same deploy identity.
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

export function contentVersionFor(appVersion, build) {
  const parts = String(appVersion).split(".");
  const numbers = parts.map(Number);
  const buildNumber = Number(build);
  if (parts.length !== 3
      || parts.some((part) => !/^\d+$/.test(part))
      || numbers[0] < 1000
      || numbers[0] > 9999
      || numbers[1] < 1
      || numbers[1] > 12
      || numbers[2] < 1
      || numbers[2] > 31
      || !/^\d+$/.test(String(build))
      || buildNumber > 999) {
    throw new Error("gen-web-manifest: content date and build must fit YYYY.M.D and BBB");
  }
  return Number(`${parts[0].padStart(4, "0")}${parts[1].padStart(2, "0")}` +
    `${parts[2].padStart(2, "0")}${String(build).padStart(3, "0")}`);
}

export function declaredContentVersion(root) {
  const versions = JSON.parse(readFileSync(join(root, "versions.json"), "utf8"));
  if (!Number.isSafeInteger(versions.CONTENT_VERSION)) {
    throw new Error("gen-web-manifest: CONTENT_VERSION is missing");
  }
  return versions.CONTENT_VERSION;
}

export function contentFilesFromVersionSource(source) {
  const files = JSON.parse(source).CONTENT_FILES;
  if (!Array.isArray(files) || files.some((file) => typeof file !== "string")) {
    throw new Error("gen-web-manifest: CONTENT_FILES must be an array of paths");
  }
  return files;
}

export function stampModuleUrls(root, cacheKey) {
  const token = encodeURIComponent(String(cacheKey || "local"));
  const indexPath = join(root, "index.html");
  const index = readFileSync(indexPath, "utf8").replace(
    /(<script\b[^>]*\btype=["']module["'][^>]*\bsrc=["'])([^"'?]+\.js)(?:\?v=[^"']*)?(["'])/gi,
    `$1$2?v=${token}$3`,
  ).replace(
    /(<link\b[^>]*\brel=["']stylesheet["'][^>]*\bhref=["'])([^"'?]+\.css)(?:\?v=[^"']*)?(["'])/gi,
    `$1$2?v=${token}$3`,
  );
  writeFileSync(indexPath, index);

  const jsFiles = [];
  walk(join(root, "js"), jsFiles);
  for (const file of jsFiles.filter((path) => path.endsWith(".js"))) {
    const source = readFileSync(file, "utf8").replace(
      /((?:from|import)\s*["'])(\.\.?\/[^"'?]+\.js)(?:\?v=[^"']*)?(["'])/g,
      `$1$2?v=${token}$3`,
    );
    writeFileSync(file, source);
  }
}

// Build (but do not write) the manifest object for a web root. Exported so tests
// can exercise the file-selection, ordering, and label logic directly.
export function buildManifest(root, version, commit) {
  const files = [];
  files.push(join(root, "index.html"));
  files.push(join(root, "versions.json"));
  for (const sub of ["css", "js"]) {
    try {
      walk(join(root, sub), files);
    } catch {
      throw new Error(`gen-web-manifest: expected directory ${join(root, sub)} not found`);
    }
  }

  // Optional shipped content bundles beyond the core runtime (e.g. the 2D tile
  // view under view2d/). Present in the real web root, absent in the manifest
  // unit-test fixtures, so a missing directory is not an error here.
  for (const sub of ["view2d"]) {
    try {
      walk(join(root, sub), files);
    } catch {
      // optional bundle not present in this root
    }
  }

  const relFiles = files
    .map((f) => relative(root, f).split(sep).join(posix.sep))
    .filter((f) => f !== "manifest.json")
    .sort();

  let contentDate = "?";
  let contentBuild = "?";
  try {
    const source = readFileSync(join(root, "versions.json"), "utf8");
    const versions = JSON.parse(source);
    contentDate = versions.CONTENT_DATE ?? contentDate;
    contentBuild = versions.CONTENT_BUILD ?? contentBuild;
    const declaredVersion = versions.CONTENT_VERSION;
    if (declaredVersion !== contentVersionFor(contentDate, contentBuild)) {
      throw new Error("gen-web-manifest: CONTENT_VERSION does not match CONTENT_DATE and CONTENT_BUILD");
    }
    const declaredFiles = contentFilesFromVersionSource(source).slice().sort();
    if (JSON.stringify(declaredFiles) !== JSON.stringify(relFiles)) {
      throw new Error("gen-web-manifest: CONTENT_FILES does not match the runtime bundle");
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("gen-web-manifest:")) throw error;
    throw new Error("gen-web-manifest: versions.json metadata is invalid");
  }

  return {
    version: Number.parseInt(String(version ?? "0"), 10) || 0,
    label: `${contentDate} content build ${contentBuild} \u00b7 ${commit || "local"}`,
    commit: commit || "local",
    files: relFiles,
  };
}

// Build and write <root>/manifest.json. Returns the manifest object.
export function writeManifest(root, version, commit) {
  const contentIdentity = version || declaredContentVersion(root);
  const cacheKey = commit || contentIdentity;
  stampModuleUrls(root, cacheKey);
  const manifest = buildManifest(root, contentIdentity, cacheKey);
  writeFileSync(join(root, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  return manifest;
}

// CLI: node gen-web-manifest.mjs <rootDir> [version] [cacheKey]
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const [, , rootArg, versionArg, commitArg] = process.argv;
  if (!rootArg) {
    console.error("usage: node gen-web-manifest.mjs <rootDir> [version] [cacheKey]");
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
