// manifest.steps.js Copyright (c) 2026:dhackel-games. All Rights Reserved. Do Not Distribute.
import assert from "node:assert";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { After, Given, Then, When } from "@cucumber/cucumber";
import { buildManifest } from "../../tools/gen-web-manifest.mjs";

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
    'export const APP_VERSION = "2026.9.11";\nexport const BUILD = "77";\n');
  put(this.root, "js/core.js", "export const x = 1;");
  put(this.root, "js/ui.js", "export const y = 2;");
});

Given("the scratch root also contains {string}", function (rel) {
  put(this.root, rel, "decoy");
});

Given("the scratch root is missing its {string} directory", function (dir) {
  rmSync(join(this.root, dir), { recursive: true, force: true });
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

Then("manifest {string} is newer than manifest {string}", function (a, b) {
  assert.ok(this.saved[a].version > this.saved[b].version,
    `${a} (${this.saved[a].version}) should be > ${b} (${this.saved[b].version})`);
});

Then("building the manifest threw an error mentioning {string}", function (needle) {
  assert.ok(this.error, "expected an error");
  assert.match(this.error.message, new RegExp(needle));
});
