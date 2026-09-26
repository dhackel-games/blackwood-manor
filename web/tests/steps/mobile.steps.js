// mobile.steps.js. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-25.011:dhackel.
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { Then } from "@cucumber/cucumber";

// The phone layout lives entirely in view2d/tilemap.html (self-contained
// HTML/CSS/JS shipped through the web/ OTA updater), so — like the other UI
// contract tests in this suite — we validate it by static analysis of that file.
const tilemap = () =>
  readFileSync(new URL("../../view2d/tilemap.html", import.meta.url), "utf8");

// Extract the body of the `@media (max-width: 820px)` block by brace-matching,
// so CSS assertions can be scoped to the mobile rules (and can't be satisfied by
// a same-named desktop rule elsewhere in the stylesheet).
function mobileMediaBlock(html) {
  const marker = /@media\s*\(max-width:\s*820px\)\s*\{/.exec(html);
  assert.ok(marker, "expected a @media (max-width: 820px) block");
  let depth = 1;
  let i = marker.index + marker[0].length;
  const start = i;
  for (; i < html.length && depth > 0; i++) {
    const c = html[i];
    if (c === "{") depth++;
    else if (c === "}") depth--;
  }
  assert.equal(depth, 0, "unbalanced braces in the mobile media block");
  return html.slice(start, i - 1);
}

Then("the mobile 2D view hides the location HUD block", function () {
  const html = tilemap();
  const mobile = mobileMediaBlock(html);
  // The old 📍 location / 👤 guest / 🧀 bait / ✨ lured readout is redundant on a
  // phone (the room title already says where you are) and is hidden.
  assert.match(mobile, /\.hud\s*\{\s*display:\s*none;?\s*\}/,
    "expected the .hud readout to be hidden on mobile");
});

Then("the step count is rendered on the top status line", function () {
  const html = tilemap();
  // renderHud() injects a steps slot into the top #hud-slots status line so the
  // count survives even though the .hud block is hidden on phones.
  assert.match(html,
    /getElementById\("steps-slot"\)[\s\S]*\.id\s*=\s*"steps-slot"[\s\S]*\.className\s*=\s*"hud-slot hud-slot--steps"/,
    "expected a #steps-slot to be created inside the top status line");
  assert.match(html,
    /getElementById\("hud-slots"\)[\s\S]*appendChild\(s\)/,
    "expected the steps slot to be appended to #hud-slots");
  assert.match(html,
    /steps-slot[\s\S]*querySelector\("\.hud-slot-value"\)\.textContent\s*=\s*String\(steps\)/,
    "expected the steps slot value to reflect the step count");
});

Then("the mobile 2D view has a Commands bottom sheet", function () {
  const html = tilemap();
  const mobile = mobileMediaBlock(html);
  // A 📜 Commands button on the map row and a dismissable sheet + backdrop.
  assert.match(html, /id="cmdSheetBtn"[^>]*>\s*📜 Commands/,
    "expected a 📜 Commands button");
  assert.match(html, /id="cmdSheet"[^>]*role="dialog"/, "expected a #cmdSheet dialog");
  assert.match(html, /id="cmdSheetClose"/, "expected a close control");
  assert.match(html, /id="cmdBackdrop"/, "expected a dismiss backdrop");
  assert.match(html, /<ol id="cmdSheetList"/, "expected a #cmdSheetList");
  assert.match(mobile, /\.cmd-sheet\s*\{[\s\S]*display:\s*none;?/,
    "expected the sheet hidden until opened");
  assert.match(mobile, /\.cmd-sheet\.open\s*\{\s*display:\s*flex;?\s*\}/,
    "expected .open to reveal the sheet");
});

Then("the Commands sheet opens, closes, and dismisses", function () {
  const html = tilemap();
  assert.match(html,
    /function openCmdSheet\(\)\s*\{[\s\S]*renderTrail\(\)[\s\S]*cmdSheet\.classList\.add\("open"\)/,
    "expected openCmdSheet to refresh the trail and add .open");
  assert.match(html,
    /function closeCmdSheet\(\)\s*\{[\s\S]*cmdSheet\.classList\.remove\("open"\)/,
    "expected closeCmdSheet to remove .open");
  assert.match(html,
    /cmdSheetBtn\?\.addEventListener\("click",[\s\S]*closeCmdSheet\(\);\s*else\s*openCmdSheet\(\)/,
    "expected the Commands button to toggle the sheet");
  assert.match(html, /cmdSheetClose\?\.addEventListener\("click", closeCmdSheet\)/,
    "expected the close button to dismiss the sheet");
  assert.match(html, /cmdBackdrop\?\.addEventListener\("click", closeCmdSheet\)/,
    "expected the backdrop to dismiss the sheet");
  assert.match(html,
    /"Escape"\s*&&\s*cmdSheet\?\.classList\.contains\("open"\)\)\s*closeCmdSheet\(\)/,
    "expected Escape to dismiss the sheet");
});

Then("the command trail renders into the Commands sheet", function () {
  const html = tilemap();
  // renderTrail() must populate the sheet list as well as the desktop trail.
  assert.match(html,
    /function renderTrail\(\)\s*\{[\s\S]*getElementById\("cmdSheetList"\)[\s\S]*sheetList\.innerHTML\s*=\s*html/,
    "expected renderTrail to fill #cmdSheetList");
});

Then("the desktop right-column trail is hidden on phones", function () {
  const mobile = mobileMediaBlock(tilemap());
  assert.match(mobile, /\.side\s+\.trail\s*\{\s*display:\s*none;?\s*\}/,
    "expected the in-column trail to be hidden on mobile");
});

Then("the mobile 2D view exposes an inline zoom control", function () {
  const html = tilemap();
  const mobile = mobileMediaBlock(html);
  assert.match(html, /<label class="map-zoom"[\s\S]*<select id="zoomM"/,
    "expected an inline zoom select on the map row");
  assert.match(mobile, /\.map-zoom\s*\{/, "expected mobile styling for the zoom control");
});

Then("the Map settings button is removed", function () {
  const html = tilemap();
  // The dedicated settings trigger is gone entirely; the map button row now
  // carries only Show full map, Commands, and the inline zoom control.
  assert.doesNotMatch(html, /id="mapSettingsBtn"/,
    "the Map settings button should be gone on phones");
  const row = /<div class="map-btn-row">[\s\S]*?<\/div>\s*<div class="bar-backdrop"/.exec(html)?.[0] || "";
  assert.ok(row, "expected to find the map button row");
  assert.doesNotMatch(row, /Map settings/,
    "the map button row should not include a settings trigger");
});

Then("the inline zoom control mirrors the map scale", function () {
  const html = tilemap();
  // Changing the inline control drops focus mode and re-renders at the shared
  // #zoom scale, keeping desktop and mobile controls in sync.
  assert.match(html,
    /const zoomM = document\.getElementById\("zoomM"\)[\s\S]*zoomM\.value = zoom\.value/,
    "expected zoomM to seed from the shared zoom value");
  assert.match(html,
    /zoomM\.addEventListener\("change",[\s\S]*zoom\.value = zoomM\.value[\s\S]*recenter = true; render\(\)/,
    "expected zoomM changes to update the map scale");
});

Then("the mobile 2D view enlarges the map, description, and message text", function () {
  const mobile = mobileMediaBlock(tilemap());
  assert.match(mobile, /\.map-hero\s*\{[^}]*height:\s*36dvh/,
    "expected a taller map hero");
  assert.match(mobile, /\.side\s+\.desc\s*\{[^}]*font-size:\s*20px/,
    "expected larger room description text");
  assert.match(mobile, /\.textbar\s*\{[^}]*font-size:\s*17px/,
    "expected larger message/story text");
});

Then("the resume message adapts to phone layout", function () {
  const html = tilemap();
  // On a phone there is no right-hand column, so the resume banner points at the
  // 📜 Commands sheet instead of "on the right".
  assert.match(html,
    /matchMedia\("\(max-width: 820px\)"\)\.matches[\s\S]*Resumed in 2D as[\s\S]*tap 📜 Commands to see your trail/,
    "expected a phone-aware resume message");
  assert.match(html,
    /your command trail is on the right/,
    "expected the desktop wording to remain for wide screens");
});

// end mobile.steps.js
