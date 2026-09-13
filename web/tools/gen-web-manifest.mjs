// gen-web-manifest.mjs. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-12.067:acoven.
//
// Stamp one cache key across the ES-module graph, then emit <root>/manifest.json
// with the runtime file list. The complete manifest is the iOS-app package
// identity; CONTENT_VERSION and CONTENT_FILES in js/version.js govern web
// content selection and downloads. Run for BOTH the bundled copy
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
  if (parts.length !== 3 || parts.some((part) => !/^\d+$/.test(part)) || !/^\d+$/.test(String(build))) {
    throw new Error("gen-web-manifest: APP_VERSION and BUILD must be numeric");
  }
  return Number(`${parts[0].padStart(4, "0")}${parts[1].padStart(2, "0")}` +
    `${parts[2].padStart(2, "0")}${String(build).padStart(3, "0")}`);
}

export function declaredContentVersion(root) {
  const source = readFileSync(join(root, "js/version.js"), "utf8");
  const value = /export const CONTENT_VERSION\s*=\s*(\d+)\s*;/.exec(source)?.[1];
  if (!value) throw new Error("gen-web-manifest: CONTENT_VERSION is missing");
  return value;
}

export function contentFilesFromVersionSource(source) {
  const match = /export const CONTENT_FILES\s*=\s*(\[[\s\S]*?\])\s*;/.exec(source);
  if (!match) throw new Error("gen-web-manifest: version.js must define CONTENT_FILES");
  const files = JSON.parse(match[1]);
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
    const declaredVersion = Number(/CONTENT_VERSION\s*=\s*(\d+)/.exec(vjs)?.[1]);
    if (declaredVersion !== contentVersionFor(appVersion, build)) {
      throw new Error("gen-web-manifest: CONTENT_VERSION does not match APP_VERSION and BUILD");
    }
    const declaredFiles = contentFilesFromVersionSource(vjs).slice().sort();
    if (JSON.stringify(declaredFiles) !== JSON.stringify(relFiles)) {
      throw new Error("gen-web-manifest: CONTENT_FILES does not match the runtime bundle");
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("gen-web-manifest:")) throw error;
    throw new Error("gen-web-manifest: version.js metadata is invalid");
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
