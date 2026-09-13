// manifest.steps.js. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-12.067:acoven.
import assert from "node:assert";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { After, Given, Then, When } from "@cucumber/cucumber";
import {
  buildManifest,
  contentVersionFor,
  stampModuleUrls,
  writeManifest,
} from "../../tools/gen-web-manifest.mjs";

function put(root, rel, contents) {
  const full = join(root, rel);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, contents);
}

After(function () {
  if (this.root && existsSync(this.root)) rmSync(this.root, { recursive: true, force: true });
});

Given("a scratch web root that mirrors the real bundle", function () {
  this.root = mkdtempSync(join(tmpdir(), "bm-manifest-"));
  this.saved = {};
  put(this.root, "index.html", "<!doctype html><title>bm</title>");
  put(this.root, "css/style.css", "body{}");
  put(this.root, "js/version.js",
    'export const APP_VERSION = "2026.9.11";\nexport const BUILD = "77";\n' +
    'export const CONTENT_VERSION = 20260911077;\n' +
    'export const CONTENT_FILES = ["css/style.css","index.html","js/core.js","js/ui.js","js/version.js"];\n');
  put(this.root, "js/core.js", "export const x = 1;");
  put(this.root, "js/ui.js", "export const y = 2;");
});

Given("the scratch root also contains {string}", function (rel) {
  put(this.root, rel, "decoy");
});

Given("the scratch root is missing its {string} directory", function (dir) {
  rmSync(join(this.root, dir), { recursive: true, force: true });
});

Given("the scratch web root contains linked ES modules", function () {
  put(this.root, "index.html",
    '<link rel="stylesheet" href="css/style.css"><script type="module" src="js/ui.js"></script>');
  put(this.root, "js/ui.js",
    'import { x } from "./core.js";\nimport "./side.js";\nexport const y = x;\n');
  put(this.root, "js/core.js", 'import { z } from "./side.js";\nexport const x = z;\n');
  put(this.root, "js/side.js", "export const z = 1;\n");
});

Given("the scratch web root links its entry module", function () {
  put(this.root, "index.html",
    '<link rel="stylesheet" href="css/style.css"><script type="module" src="js/ui.js"></script>');
});

When("I build a manifest with version {string} and commit {string}", function (version, commit) {
  this.manifest = buildManifest(this.root, version, commit);
});

When("I build a manifest expecting failure", function () {
  this.error = null;
  try {
    buildManifest(this.root, "1000", "abc1234");
  } catch (err) {
    this.error = err;
  }
});

When("I stamp module URLs with cache key {string}", function (cacheKey) {
  stampModuleUrls(this.root, cacheKey);
});

When("I write the manifest from its declared content identity", function () {
  this.manifest = writeManifest(this.root);
});

When("I remember that manifest as {string}", function (name) {
  this.saved[name] = this.manifest;
});

Then("the manifest files are exactly:", function (table) {
  const expected = table.raw().map(([f]) => f.trim()).sort();
  assert.deepEqual(this.manifest.files, expected);
});

Then("the manifest does not list {string}", function (rel) {
  assert.ok(!this.manifest.files.includes(rel), `${rel} should not be listed`);
});

Then("the manifest version is the number {int}", function (n) {
  assert.strictEqual(this.manifest.version, n);
});

Then("the manifest label is {string}", function (label) {
  assert.strictEqual(this.manifest.label, label);
});

Then("content version {string} build {int} composes to {int}", function (version, build, expected) {
  assert.equal(contentVersionFor(version, build), expected);
});

Then("manifest {string} is newer than manifest {string}", function (a, b) {
  assert.ok(this.saved[a].version > this.saved[b].version,
    `${a} (${this.saved[a].version}) should be > ${b} (${this.saved[b].version})`);
});

Then("building the manifest threw an error mentioning {string}", function (needle) {
  assert.ok(this.error, "expected an error");
  assert.match(this.error.message, new RegExp(needle));
});

Then("the entry module URL contains cache key {string}", function (cacheKey) {
  const html = readFileSync(join(this.root, "index.html"), "utf8");
  assert.match(html, new RegExp(`src="js/ui\\.js\\?v=${cacheKey}"`));
  assert.match(html, new RegExp(`href="css/style\\.css\\?v=${cacheKey}"`));
});

Then("every relative module import contains cache key {string}", function (cacheKey) {
  for (const file of ["js/ui.js", "js/core.js"]) {
    const source = readFileSync(join(this.root, file), "utf8");
    const imports = [...source.matchAll(/(?:from|import)\s+["'](\.\.?\/[^"']+\.js(?:\?v=[^"']+)?)["']/g)]
      .map((match) => match[1]);
    assert.ok(imports.length > 0, `${file} must contain imports`);
    for (const specifier of imports) assert.match(specifier, new RegExp(`\\?v=${cacheKey}$`));
  }
});

Then("no module URL contains cache key {string}", function (cacheKey) {
  const files = ["index.html", "js/ui.js", "js/core.js", "js/side.js"];
  for (const file of files) {
    const source = readFileSync(join(this.root, file), "utf8");
    assert.ok(!source.includes(`?v=${cacheKey}`), `${file} retained stale cache key`);
  }
});

Then("the canonical CONTENT_FILES matches its runtime bundle", function () {
  const webRoot = fileURLToPath(new URL("../..", import.meta.url));
  assert.doesNotThrow(() => buildManifest(webRoot, "1000", "abc1234"));
});
