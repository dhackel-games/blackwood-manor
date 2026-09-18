// ui.js. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-15.102:acoven.
// Browser adapter. Ties core.js to the DOM terminal, handles meta-verbs
// (save/restore/restart/quit), command history, autosave, and the "phone
// call" screen used while you're on Gary's hint line.
import { createGame, parseRestartTarget } from "./core.js?v=source";
import { world } from "./world.js?v=source";
import { saveGame, loadGame, hasSave } from "./save.js?v=source";
import { createHud, hudStateSummary } from "./hud.js?v=source";
import { Native } from "./native.js?v=source";
import * as garyBrain from "./gary-brain.js?v=source";
import { MAP_MARK } from "./map.js?v=source";
import {
  bugReportBody,
  bugReportDescription,
  bugReportUrl,
  createBugTrace,
  DEFAULT_ISSUE_DESCRIPTION,
  recordBugCommand,
  recordBugDialogue,
  updateBugDialogue,
} from "./issue-report.js?v=source";
import {
  DEFAULT_GARY_VOICE_PRESET,
  estimatedSpeechDurationMs,
  garyVoiceProfile,
  pickGaryVoice,
} from "./gary-voice.js?v=source";
import { expandSysopCommand, renderSysopMenu, sysopMenuAction } from "./sysop-menu.js?v=source";
import { splitCommands } from "./parser.js?v=source";

const transcript = document.getElementById("transcript");
const input = document.getElementById("cmd");
const mainGo = document.getElementById("go");
const bugReport = document.getElementById("bug-report");
const SYSOP_MENU_UNLOCK_KEY = "blackwood-sysop-menu-unlocked-v1";
const LEGACY_MAGIC_MENU_UNLOCK_KEY = "blackwood-magic-menu-unlocked-v1";
let sysopMenuUnlocked = false;
try {
  sysopMenuUnlocked = localStorage.getItem(SYSOP_MENU_UNLOCK_KEY) === "true"
    || localStorage.getItem(LEGACY_MAGIC_MENU_UNLOCK_KEY) === "true";
} catch (error) {
  console.warn("[sysop-menu] could not read unlock state", error);
}

// Mode-switch continuity: the 2D tile-map view (view2d/tilemap.html) is a
// separate page with its own engine instance, so switching would otherwise
// start a brand-new game. We hand the whole game off through a one-shot
// localStorage slot: snapshot on the way out, restore + consume on the way in.
// The payload also carries the command history so the trail is visible in 2D.
const MODE_HANDOFF_KEY = "blackwood-mode-handoff-v1";
let resumedFromMode = false;
function saveModeHandoff() {
  try {
    localStorage.setItem(MODE_HANDOFF_KEY,
      JSON.stringify({ snapshot: game.snapshot(), history }));
  } catch (error) {
    console.warn("[mode-switch] could not save handoff", error);
  }
}
function takeModeHandoff() {
  try {
    const raw = localStorage.getItem(MODE_HANDOFF_KEY);
    if (!raw) return null;
    localStorage.removeItem(MODE_HANDOFF_KEY);   // consume once
    return JSON.parse(raw);
  } catch (error) {
    console.warn("[mode-switch] could not read handoff", error);
    return null;
  }
}

// phone-call screen elements
const phone = document.getElementById("phone");
const phoneT = document.getElementById("phone-transcript");
const phoneCmd = document.getElementById("phone-cmd");
const phoneGo = document.getElementById("phone-go");
const phoneTimer = document.getElementById("phone-timer");
const phoneBillEl = document.getElementById("phone-bill");
const garyVoiceSelect = document.getElementById("gary-voice");
const garyVolumeInput = document.getElementById("gary-volume");
const aiBadge = document.getElementById("phone-ai");
let callTimer = null;
let callSeconds = 0;
let endingCall = false;
let introBannerElement = null;
let currentSessionAnchorId = "";
let modelCheckReady = false;
let modelCheckAnnounced = false;
let sessionIntroReady = false;
let pendingSavedNotice = false;
let pendingSessionMessage = "";
let autoCallPending = /[?&]call\b/.test(location.search);

// HUD status is declarative: each HudSlot owns its emoji and calculation.
const hud = createHud(document);
const hudElement = document.getElementById("hud");
// The launch banner can only stamp a placeholder "Source" — no network fetch has
// run yet — so it reads "Unavailable" even when the content source is reachable.
// Now that this module is live, ask the native layer for the real remote content
// version so the intro reflects reality. This is silent: unlike the VERSION
// command it must not echo the version line into the transcript.
if (Native.isMobileApp()) Native.post("content", { action: "version-banner" });

let game = createGame(world);
let bugTrace = createBugTrace("page reload");
const history = [];
let hi = 0;

// Only auto-focus the text field on devices with a real keyboard (desktop).
// On touch devices, focusing pops the on-screen keyboard, which is jarring when
// you just tapped a movement/action button — so we don't.
const canType = !!(window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches);
const commandPanel = document.getElementById("command-panel");
const controls = document.getElementById("controls");
const navSizePicker = document.getElementById("nav-size-picker");
const navSizeButtons = [...document.querySelectorAll("#nav-size-picker [data-nav-size]")];
const navDisclosure = document.getElementById("nav-disclosure");
const navDisclosureIcon = navDisclosure.querySelector("[aria-hidden]");
const NAV_SIZE_KEY = "blackwood-nav-size";
const NAV_COLLAPSED_KEY = "blackwood-nav-collapsed";

function applyNavSize(size, persist = false) {
  const selected = ["1", "2", "3"].includes(String(size)) ? String(size) : "1";
  controls.dataset.navSize = selected;
  navSizePicker.dataset.size = selected;
  for (const button of navSizeButtons) {
    button.setAttribute("aria-checked", String(button.dataset.navSize === selected));
  }
  if (persist) {
    try {
      localStorage.setItem(NAV_SIZE_KEY, selected);
    } catch (error) {
      console.warn("[controls] could not save navigation size", error);
    }
  }
}

let savedNavSize = null;
let savedNavCollapsed = false;
try {
  savedNavSize = localStorage.getItem(NAV_SIZE_KEY);
  savedNavCollapsed = localStorage.getItem(NAV_COLLAPSED_KEY) === "true";
} catch (error) {
  console.warn("[controls] could not read navigation preferences", error);
}
const coarsePointer = !!window.matchMedia?.("(any-pointer: coarse)").matches;
const prefersLargeNav = Native.isMobileApp() || coarsePointer;
const defaultNavSize = prefersLargeNav ? "3" : "1";
applyNavSize(["1", "2", "3"].includes(savedNavSize) ? savedNavSize : defaultNavSize);
for (const button of navSizeButtons) {
  button.addEventListener("click", () => applyNavSize(button.dataset.navSize, true));
}

function applyNavCollapsed(collapsed, persist = false) {
  const isCollapsed = !!collapsed;
  commandPanel.dataset.collapsed = String(isCollapsed);
  navDisclosure.setAttribute("aria-expanded", String(!isCollapsed));
  navDisclosure.setAttribute(
    "aria-label", isCollapsed ? "show navigation controls" : "hide navigation controls");
  navDisclosure.title = isCollapsed ? "Show navigation controls" : "Hide navigation controls";
  navDisclosureIcon.textContent = isCollapsed ? "▾" : "▴";
  if (persist) {
    try {
      localStorage.setItem(NAV_COLLAPSED_KEY, String(isCollapsed));
    } catch (error) {
      console.warn("[controls] could not save navigation disclosure", error);
    }
  }
}

applyNavCollapsed(savedNavCollapsed);
navDisclosure.addEventListener("click", () => {
  applyNavCollapsed(commandPanel.dataset.collapsed !== "true", true);
});

function createChatEntry({ field, submit, starterText }) {
  field.placeholder = starterText;
  const sync = () => submit.classList.toggle("has-text", field.value.trim().length > 0);
  const setValue = (value) => {
    field.value = value;
    sync();
  };
  field.addEventListener("input", sync);
  sync();
  return { clear: () => setValue(""), setValue, sync };
}

const mainEntry = createChatEntry({
  field: input,
  submit: mainGo,
  starterText: "type command / tap button",
});
const phoneEntry = createChatEntry({
  field: phoneCmd,
  submit: phoneGo,
  starterText: "say something to Gary…",
});

function setEntryValue(field, value) {
  (field === phoneCmd ? phoneEntry : mainEntry).setValue(value);
}

const BIG_BANNER = (versionLine) =>
` ____  _            _                             _
 | __ )| | __ _  ___| | ____      _____   ___   __| |
 |  _ \\| |/ _\` |/ __| |/ /\\ \\ /\\ / / _ \\ / _ \\ / _\` |
 | |_) | | (_| | (__|   <  \\ V  V / (_) | (_) | (_| |
 |____/|_|\\__,_|\\___|_|\\_\\  \\_/\\_/ \\___/ \\___/ \\__,_|

              M A N O R
An Adventure in the Classic Style
${versionLine}

Type HELP for commands.  Type LOOK to look around.  Beware the dark.`;

// Compact banner for narrow (phone) screens, where the ASCII art would wrap.
const SMALL_BANNER = (versionLine) =>
`+------------------------------+
|      B L A C K W O O D       |
|          M A N O R           |
+------------------------------+
An Adventure in the Classic Style
${versionLine}

Type HELP for commands. Type LOOK
to look around. Beware the dark.`;

function bannerText(versionLine = Native.version()) {
  return (window.innerWidth < 640 ? SMALL_BANNER : BIG_BANNER)(versionLine);
}

function showIntroBanner() {
  if (!introBannerElement) introBannerElement = print(bannerText(), "banner");
}

function syncNameGate() {
  const waitingForIntro = !sessionIntroReady;
  input.disabled = waitingForIntro;
  mainGo.disabled = waitingForIntro;
  const awaitingName = sessionIntroReady && !!game.state.flags.awaitingPlayerName;
  input.placeholder = waitingForIntro
    ? "checking AI…"
    : awaitingName
      ? "type your name and press Enter (or just start playing)…"
      : "type command / tap button";
  hudElement.hidden = waitingForIntro;
  controls.hidden = waitingForIntro;
  navDisclosure.hidden = waitingForIntro;
}

function completeSessionIntro() {
  if (!modelCheckReady || sessionIntroReady) return;
  announceModelCheck();
  if (pendingSavedNotice && !resumedFromMode) {
    print("\n(A saved game exists in this browser. Type RESTORE to continue it.)");
  }
  pendingSavedNotice = false;
  if (pendingSessionMessage) {
    print(pendingSessionMessage, "sys");
    pendingSessionMessage = "";
  }
  if (resumedFromMode) {
    print(game.showMessage(
      "↩︎ Back in the text terminal — same night, same {{player_name}}. " +
        "Everything you did in the 2D map carried over."), "sys");
  } else {
    print(game.showMessage(
      "For now the manor calls you {{player_name}}. To pick your own name, just type it and press " +
        "Enter — or type CALL ME {name}. Prefer to keep it? Ignore this and start exploring."));
  }
  print("\n" + game.startMessage());
  sessionIntroReady = true;
  mainEntry.clear();
  syncNameGate();
  if (canType) {
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }
  if (autoCallPending) {
    autoCallPending = false;
    mainEntry.clear();
    setTimeout(() => handle("call"), 0);
  }
}

function beginSession({ showSavedNotice = false, message = "", resumed = false } = {}) {
  markSessionStart();
  introBannerElement = null;
  modelCheckAnnounced = false;
  sessionIntroReady = false;
  resumedFromMode = resumed;
  pendingSavedNotice = showSavedNotice && hasSave();
  pendingSessionMessage = message;
  if (game.needsPlayerName()) game.useDefaultPlayerName();
  showIntroBanner();
  syncNameGate();
  updateHud();
  completeSessionIntro();
}

// --- terminal output ---
// Text may contain MAP_MARK-delimited ASCII blocks. Those must not word-wrap,
// so they're emitted as their own `.map` element; everything else wraps normally.
function emit(container, text, cls, prefix = "") {
  let last = null;
  const rendered = game?.showMessage ? game.showMessage(text) : String(text);
  const parts = String(rendered).split(MAP_MARK);
  parts.forEach((part, i) => {
    const isMap = i % 2 === 1;
    if (!isMap && !part.trim()) return;
    const div = document.createElement("div");
    div.className = isMap ? "map" : (cls || "");
    div.textContent = (!isMap && prefix ? prefix : "") + (isMap ? part : part.trim());
    container.appendChild(div);
    last = div;
  });
  container.scrollTop = container.scrollHeight;
  return last;
}

function print(text, cls) {
  if (text == null) return null;
  return emit(transcript, text, cls);
}

function sessionAnchorId(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_` +
    `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function markSessionStart(now = new Date()) {
  let date = new Date(now);
  let id = sessionAnchorId(date);
  while (document.getElementById(id)) {
    date = new Date(date.getTime() + 1000);
    id = sessionAnchorId(date);
  }
  const anchor = document.createElement("span");
  anchor.id = id;
  anchor.className = "session-anchor";
  anchor.tabIndex = -1;
  anchor.setAttribute("aria-label", "Beginning of current session");
  transcript.appendChild(anchor);
  currentSessionAnchorId = id;
  return id;
}

function jumpToSessionStart(id) {
  const anchor = document.getElementById(id);
  if (!anchor) return;
  const anchorTop = anchor.getBoundingClientRect().top;
  const transcriptTop = transcript.getBoundingClientRect().top;
  transcript.scrollTop += anchorTop - transcriptTop;
  anchor.focus({ preventScroll: true });
}

function printRestartPrompt() {
  const line = document.createElement("div");
  line.className = "over session-restart";
  line.append("Type RESTART to play again. (Jump to the ");
  const link = document.createElement("a");
  link.href = `#${currentSessionAnchorId}`;
  link.textContent = "top";
  link.addEventListener("click", (event) => {
    event.preventDefault();
    if (window.location.hash === link.hash) {
      window.history.replaceState(null, "", link.hash);
    } else {
      window.history.pushState(null, "", link.hash);
    }
    jumpToSessionStart(currentSessionAnchorId);
  });
  line.append(link, ".)");
  transcript.appendChild(line);
  transcript.scrollTop = transcript.scrollHeight;
}

// --- phone-call screen ---
function billText() { return "$" + ((game.state.flags.phoneBill || 0) / 100).toFixed(2); }
function updatePhoneStatus() { phoneBillEl.textContent = billText(); }
function fmtTime(s) {
  const m = Math.floor(s / 60), r = s % 60;
  return String(m).padStart(2, "0") + ":" + String(r).padStart(2, "0");
}
function printToPhone(text, cls) {
  if (text == null) return null;
  return emit(phoneT, text, cls || "gary", cls === "you" ? "You: " : "");
}
function garyLineLabel() {
  const xp = game.state.flags.garyXP || 0;
  if (xp >= 16) return "Wellness Line · 99¢/min";
  if (xp >= 9) return "Crisis Line · 99¢/min";
  return "Hint Line · 99¢/min";
}
function syncPhoneHudOffset() {
  if (!hudElement) return;
  phone.style.setProperty(
    "--phone-hud-offset", `${Math.ceil(hudElement.getBoundingClientRect().bottom)}px`);
}
function showPhone() {
  endingCall = false;
  phone.removeAttribute("aria-busy");
  const endButton = document.getElementById("phone-end");
  endButton.disabled = false;
  endButton.classList.remove("closing");
  endButton.style.removeProperty("--end-call-duration");
  phoneT.innerHTML = "";
  callSeconds = 0;
  phoneTimer.textContent = "00:00";
  const sub = document.getElementById("phone-sub");
  if (sub) sub.textContent = garyLineLabel();
  updatePhoneStatus();
  syncPhoneHudOffset();
  phone.hidden = false;
  requestAnimationFrame(() => phone.classList.add("show"));
  clearInterval(callTimer);
  callTimer = setInterval(() => { callSeconds++; phoneTimer.textContent = fmtTime(callSeconds); }, 1000);
  if (canType) setTimeout(() => phoneCmd.focus(), 300);
}
function endCallUI() {
  clearInterval(callTimer);
  callTimer = null;
  phone.classList.remove("show");
  setTimeout(() => {
    phone.hidden = true;
    phone.removeAttribute("aria-busy");
    const endButton = document.getElementById("phone-end");
    endButton.disabled = false;
    endButton.classList.remove("closing");
    endButton.style.removeProperty("--end-call-duration");
    endingCall = false;
    if (canType) input.focus();
  }, 450);
}

function updateHud() {
  hud.update({ game, world });
  if (!phone.hidden) requestAnimationFrame(syncPhoneHudOffset);
}
window.addEventListener("resize", () => {
  if (!phone.hidden) syncPhoneHudOffset();
});

function inventoryForBugReport() {
  return game.inventory().map((item) => {
    const primary = item.names[0];
    const adjective = item.adjectives?.[0];
    const words = primary.toLowerCase().split(/\s+/);
    const name = (adjective && !words.includes(adjective.toLowerCase())
      ? `${adjective} ${primary}`
      : primary).toUpperCase();
    return item.worn ? `${name} (WORN${item.wearSlot ? `: ${item.wearSlot.toUpperCase()}` : ""})` : name;
  });
}

function openBugReport(description = DEFAULT_ISSUE_DESCRIPTION) {
  const hudState = [
    `SFX: ${sfxMuted ? "off" : "on"}`,
    hudStateSummary({ game, world }),
  ].join("; ");
  const body = bugReportBody({
    version: Native.version(),
    description,
    turns: bugTrace.turns,
    origin: bugTrace.origin,
    commands: bugTrace.commands,
    dialogue: bugTrace.dialogue,
    userName: bugTrace.userName,
    hud: hudState,
    inventory: inventoryForBugReport(),
  });
  window.open(
    bugReportUrl(game.room().name, body),
    "_blank",
    "noopener,noreferrer",
  );
}

// ---- Text-to-speech: Gary talks (WKWebView supports speechSynthesis) ----
// Default MUTED so audio never plays unexpectedly (e.g. at work) — tap Gary's
// large speaker on the call screen to turn his voice on.
const GARY_VOICE_PRESET_KEY = "blackwood-gary-voice";
const GARY_VOLUME_KEY = "blackwood-gary-volume";
let ttsMuted = true;
let garyVoice = null;
let garyVoicePreset = DEFAULT_GARY_VOICE_PRESET;
let garyVolume = 1;
try {
  garyVoicePreset = garyVoiceProfile(localStorage.getItem(GARY_VOICE_PRESET_KEY)).id;
  const savedVolume = localStorage.getItem(GARY_VOLUME_KEY);
  const parsedVolume = savedVolume == null ? NaN : Number(savedVolume);
  if (Number.isFinite(parsedVolume)) garyVolume = Math.min(1, Math.max(0, parsedVolume));
} catch (error) {
  console.warn("[gary] could not read saved voice settings", error);
}
if (garyVoiceSelect) garyVoiceSelect.value = garyVoicePreset;
function refreshGaryVolume() {
  if (!garyVolumeInput) return;
  const percent = Math.round(garyVolume * 100);
  garyVolumeInput.value = String(percent);
  garyVolumeInput.setAttribute("aria-valuetext", `${percent}%`);
  garyVolumeInput.title = `Gary volume: ${percent}%`;
}
refreshGaryVolume();
function refreshGaryVoice() {
  if (!("speechSynthesis" in window)) return;
  const profile = garyVoiceProfile(garyVoicePreset);
  garyVoice = pickGaryVoice(speechSynthesis.getVoices(), garyVoicePreset);
  if (garyVoiceSelect) {
    garyVoiceSelect.setAttribute("aria-label", `Gary voice: ${profile.label}`);
    garyVoiceSelect.title = garyVoice
      ? `${profile.label} — system voice: ${garyVoice.name}`
      : `${profile.label} — no matching system voice is installed`;
  }
}
if ("speechSynthesis" in window) {
  refreshGaryVoice();
  speechSynthesis.addEventListener("voiceschanged", refreshGaryVoice);
} else if (garyVoiceSelect) {
  garyVoiceSelect.disabled = true;
  if (garyVolumeInput) garyVolumeInput.disabled = true;
}
function garySpeak(text) {
  const rendered = game.showMessage(text);
  if (ttsMuted || garyVolume <= 0 || !rendered || !("speechSynthesis" in window)) {
    return Promise.resolve();
  }
  // strip stage directions like *click* / *chewing* so he doesn't read them aloud
  // Drop MAP_MARK blocks entirely — nobody wants the torn edge read aloud.
  const spoken = rendered.split(MAP_MARK).filter((_, i) => i % 2 === 0).join(" ")
    .replace(/\*[^*]*\*/g, " ").replace(/\s+/g, " ").trim();
  if (!spoken) return Promise.resolve();
  return new Promise((resolve) => {
    try {
      const u = new SpeechSynthesisUtterance(spoken);
      if (garyVoice) u.voice = garyVoice;
      const profile = garyVoiceProfile(garyVoicePreset);
      u.pitch = profile.pitch;
      u.rate = profile.rate;
      u.volume = garyVolume;
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        resolve();
      };
      u.onend = finish;
      u.onerror = finish;
      const speak = () => {
        if (ttsMuted) { finish(); return; }
        try { speechSynthesis.speak(u); } catch { finish(); }
      };
      // Chrome DROPS an utterance if cancel() and speak() run back-to-back.
      // Only cancel when something's already playing, and defer the new speak.
      if (speechSynthesis.speaking || speechSynthesis.pending) {
        speechSynthesis.cancel();
        setTimeout(speak, 130);
      } else {
        speak();
      }
    } catch {
      resolve();
    }
  });
}
function stopSpeaking() { if ("speechSynthesis" in window) try { speechSynthesis.cancel(); } catch {} }

// ---- Sound effects: fart/burp/barf/high noises, deliberately NOT Gary's voice ----
// These used to be spoken as a one-liner in Gary's own TTS voice ("Classy.",
// "Good god, that stinks."). Andy heard that as Gary randomly talking to him
// out of nowhere ("Gary's a ghost") and found it confusing/creepy rather than
// funny. The actual goal was a silly noise cue, not Gary editorializing — so
// these are now synthesized tones through Web Audio, fully decoupled from
// speechSynthesis/Gary's character voice. They also have their OWN mute flag
// (sfxMuted, below) — burping/farting can happen anywhere in the manor, with
// or without ever calling Gary, so gating them behind his call-screen voice
// toggle would mean never hearing them unless you dial the phone first.
let sfxMuted = true;
let sfxCtx = null;
function sfxContext() {
  if (!sfxCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) sfxCtx = new AC();
  }
  return sfxCtx;
}
function sfxTone(ctx, { type = "sine", freqFrom, freqTo, start, dur, gain = 0.15 }) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqFrom, start);
  osc.frequency.linearRampToValueAtTime(freqTo, start + dur);
  g.gain.setValueAtTime(gain, start);
  g.gain.exponentialRampToValueAtTime(0.001, start + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}
const SFX = {
  burp: (ctx, t) => sfxTone(ctx, { type: "sawtooth", freqFrom: 160, freqTo: 70, start: t, dur: 0.35, gain: 0.18 }),
  barf: (ctx, t) => {
    sfxTone(ctx, { type: "sawtooth", freqFrom: 220, freqTo: 90, start: t, dur: 0.25, gain: 0.16 });
    sfxTone(ctx, { type: "sawtooth", freqFrom: 90, freqTo: 260, start: t + 0.22, dur: 0.3, gain: 0.16 });
  },
  fart: (ctx, t) => sfxTone(ctx, { type: "square", freqFrom: 90, freqTo: 55, start: t, dur: 0.5, gain: 0.14 }),
  diarrhea: (ctx, t) => {
    sfxTone(ctx, { type: "square", freqFrom: 130, freqTo: 45, start: t, dur: 0.4, gain: 0.15 });
    sfxTone(ctx, { type: "sawtooth", freqFrom: 300, freqTo: 60, start: t + 0.05, dur: 0.5, gain: 0.1 });
  },
  high: (ctx, t) => {
    sfxTone(ctx, { type: "sine", freqFrom: 440, freqTo: 660, start: t, dur: 0.6, gain: 0.12 });
    sfxTone(ctx, { type: "sine", freqFrom: 660, freqTo: 330, start: t + 0.15, dur: 0.6, gain: 0.1 });
  },
};
function playSfx(kind) {
  if (sfxMuted || !SFX[kind]) return;   // own "no surprise audio" gate, independent of Gary's voice
  const ctx = sfxContext();
  if (!ctx) return;
  const fire = () => { try { SFX[kind](ctx, ctx.currentTime); } catch { /* ignore */ } };
  // Safari keeps a freshly-created AudioContext "suspended" until resume()'s
  // promise actually settles (a tick or two later, unlike some browsers that
  // resolve it synchronously within a user gesture). Scheduling start() before
  // that happens gets silently dropped there — wait for it, then fire.
  if (ctx.state === "suspended") ctx.resume().then(fire).catch(() => {});
  else fire();
}
// Which noise (if any) this turn's output is narrating, keyed off the same
// ASCII-art substrings the sick-line system stamps in.
function ambientSfxKind(out, prevFlags, flags) {
  if (out.includes("S P L U R T")) return "diarrhea";
  if (out.includes("F O O M P")) return "fart";
  if (out.includes("H U U U R K")) return "barf";
  if (out.includes("B U R P")) return "burp";
  if ((flags.high || 0) > 0 && !(prevFlags.high || 0)) return "high";
  return null;
}

// Sound-effects toggle — lives in the main HUD (not the phone screen), since
// burping/farting/getting high can happen anywhere in the manor and shouldn't
// require ever calling Gary first. Muted by default, same "no surprise audio"
// policy as everything else; tap the HUD icon to turn it on.
const soundToggleBtn = document.getElementById("sound-toggle");
function setSoundToggleLabel() {
  if (!soundToggleBtn) return;
  soundToggleBtn.textContent = sfxMuted ? "🔇" : "🔊";
  soundToggleBtn.classList.toggle("on", !sfxMuted);
  soundToggleBtn.setAttribute("aria-pressed", String(!sfxMuted));
  const state = sfxMuted
    ? "Sound effects off — click to turn on"
    : "Sound effects on — click to mute";
  soundToggleBtn.setAttribute("aria-label", state);
  soundToggleBtn.title = state;
}
setSoundToggleLabel();
if (soundToggleBtn) {
  soundToggleBtn.addEventListener("click", () => {
    sfxMuted = !sfxMuted;
    setSoundToggleLabel();
    // Prime the AudioContext inside this click handler (the user gesture) and
    // give an audible confirmation, same as the phone's voice toggle. Routed
    // through playSfx so it gets the same suspended-context resume handling.
    if (!sfxMuted) playSfx("burp");
  });
}

// Ambient reactions — Gary editorializes on gross/dangerous turns, even when
// you're not on a call with him. Kept to genuine surprises (catching fire);
// the fart/burp/barf/high events are now a sound effect instead (see above),
// not a line spoken in Gary's voice.
function garyReacts(prevFlags, flags) {
  if (flags.onFire && !prevFlags.onFire) return "{{player_name}}, whoa! You're on fire!";
  return null;
}

// ---- Speech-to-text: talk to it (native bridge in the app, web API in browsers) ----
const nativeSpeech = Native.hasBridge("speech");
const WebSR = window.SpeechRecognition || window.webkitSpeechRecognition;
const speechAvailable = !!(nativeSpeech || WebSR);
const WEB_RECOGNITION_RESTART_MS = 100;
const WEB_NETWORK_RETRY_INITIAL_MS = 1000;
const WEB_NETWORK_RETRY_MAX_MS = 8000;
let listening = false;
let speechTarget = input;
let webRec = null;
let webTranscript = "";
let webPartial = "";
let webRestartTimer = null;
let webNetworkRetryDelay = 0;

let activeMic = null;
function setListening(on) {
  listening = on;
  document.querySelectorAll(".iconbtn").forEach((b) => b.classList.toggle("listening", on && b === activeMic));
  if (!on && speechTarget && speechTarget.dataset.ph != null) {
    speechTarget.placeholder = speechTarget.dataset.ph;   // restore original hint
  }
}

function clearWebRestartTimer() {
  if (webRestartTimer) clearTimeout(webRestartTimer);
  webRestartTimer = null;
}

function scheduleWebRecognition() {
  clearWebRestartTimer();
  const delay = webNetworkRetryDelay || WEB_RECOGNITION_RESTART_MS;
  webRestartTimer = setTimeout(() => {
    webRestartTimer = null;
    beginWebRecognition();
  }, delay);
}

function speechRecognitionFailed(error) {
  clearWebRestartTimer();
  webNetworkRetryDelay = 0;
  setListening(false);
  const detail = error ? ` (${error})` : "";
  const message = `Speech recognition stopped${detail}. Tap the microphone to try again.`;
  speechTarget === phoneCmd ? printToPhone(message, "sys") : print(message, "sys");
}

function beginWebRecognition() {
  if (!listening || !WebSR || webRec) return;
  const recognition = new WebSR();
  webRec = recognition;
  recognition.lang = "en-US";
  recognition.interimResults = true;
  recognition.continuous = true;
  recognition.onstart = () => {
    if (listening && webRec === recognition) {
      speechTarget.placeholder = "listening… tap mic to stop";
    }
  };
  recognition.onresult = (event) => {
    if (!listening) return;
    webNetworkRetryDelay = 0;
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const text = event.results[i][0].transcript;
      if (event.results[i].isFinal) webTranscript += text.trim() + " ";
      else interim += text;
    }
    webPartial = interim;
    setEntryValue(speechTarget, (webTranscript + webPartial).trim());
  };
  recognition.onerror = (event) => {
    if (!listening || event.error === "no-speech" || event.error === "aborted") return;
    if (event.error === "network") {
      webNetworkRetryDelay = webNetworkRetryDelay
        ? Math.min(webNetworkRetryDelay * 2, WEB_NETWORK_RETRY_MAX_MS)
        : WEB_NETWORK_RETRY_INITIAL_MS;
      speechTarget.placeholder = "speech network interrupted… retrying";
      console.warn(`[speech] network interruption; retrying in ${webNetworkRetryDelay}ms`);
      return;
    }
    speechRecognitionFailed(event.error);
  };
  recognition.onend = () => {
    if (webRec !== recognition) return;
    webRec = null;
    if (listening && webPartial.trim()) {
      webTranscript += webPartial.trim() + " ";
      webPartial = "";
      setEntryValue(speechTarget, webTranscript.trim());
    }
    if (listening) scheduleWebRecognition();
  };
  try {
    recognition.start();
  } catch (error) {
    if (webRec === recognition) webRec = null;
    speechRecognitionFailed(error?.message || "unavailable");
  }
}

function startListening(targetInput, micBtn) {
  if (!speechAvailable || listening) return;
  speechTarget = targetInput;
  activeMic = micBtn;
  webTranscript = "";
  webPartial = "";
  webNetworkRetryDelay = 0;
  clearWebRestartTimer();
  stopSpeaking();                 // don't record Gary's own voice
  targetInput.dataset.ph = targetInput.getAttribute("placeholder") || "";
  setEntryValue(targetInput, ""); // start clean so nothing stale is appended
  targetInput.placeholder = "listening… tap mic to stop";
  setListening(true);
  if (nativeSpeech) {
    Native.post("speech", { action: "start" });
  } else if (WebSR) {
    beginWebRecognition();
  }
}
function stopListening() {
  if (nativeSpeech) {
    Native.post("speech", { action: "stop" });
    setListening(false);
    return;
  }
  const text = (webTranscript + webPartial).trim();
  setListening(false);
  clearWebRestartTimer();
  webNetworkRetryDelay = 0;
  const recognition = webRec;
  webRec = null;
  if (recognition) try { recognition.stop(); } catch {}
  finishListening(text);
}
function finishListening(text) {
  setListening(false);
  const t = (text || "").trim();
  if (!t) return;
  setEntryValue(speechTarget, t);
}
// Called by the native bridge (evaluateJavaScript).
window.__speech = (text, isFinal) => {
  if (!listening && !isFinal) return;          // ignore stray callbacks after we've stopped
  if (text != null) setEntryValue(speechTarget, text); // live partials
  if (isFinal) finishListening(text);
};
window.__speechEnd = () => { setListening(false); };

// Called by the native iOS harness after it has downloaded and swapped in a newer
// web bundle from GitHub Pages (see ios/Sources/BlackwoodApp.swift). Surfaces the
// self-update to the player so they can see they're now on the latest code.
window.__contentUpdateNotice = (from, to) => {
  print("\n— UPDATE —", "sys");
  print("Local content: " + (from || "unknown"), "sys");
  print("Content source: " + (to || "unknown"), "sys");
  print("Running the latest available content.\n", "sys");
};
function printContentStatus(message) {
  if (game.state.flags.onCall) printToPhone(message, "sys");
  else print(message, "sys");
}
window.__contentVersions = (appVersion, appBuild, contentLocalValue, contentSourceValue) => {
  Native.setContentVersions(appVersion, appBuild, contentLocalValue, contentSourceValue);
  refreshIntroBanner();
  printContentStatus(Native.version());
};
// Launch handshake companion to __contentVersions: refresh only the intro's
// "Source" field to the live remote content version (or leave "Unavailable" when
// offline) WITHOUT printing the version line into the transcript.
window.__contentBanner = (appVersion, appBuild, contentLocalValue, contentSourceValue) => {
  Native.setContentVersions(appVersion, appBuild, contentLocalValue, contentSourceValue);
  refreshIntroBanner();
};
window.__contentRefreshFailed = (message) => {
  printContentStatus(message || "Content source refresh failed. Local content was left unchanged.");
};
window.__contentStatus = (message) => {
  printContentStatus(message || "The iOS web cache was reloaded.");
};

function newGame(origin = "restart") {
  game = createGame(world);
  bugTrace = createBugTrace(origin);
  history.length = 0;
  hi = 0;
  beginSession({ showSavedNotice: true, message: "Restarting Part I..." });
}

function restartPartTwo() {
  const restored = game.restoreCheckpoint("partII");
  if (!restored) {
    print("The Part II restart point is unavailable. Type RESTART 1 to begin again.", "sys");
    return;
  }
  delete game.state.flags.playerName;
  delete game.state.flags.playerNameDefaulted;
  bugTrace = createBugTrace("Part II restart");
  history.length = 0;
  hi = 0;
  beginSession({ message: "Restarting Part II..." });
}

function finishPhoneCall(message) {
  printToPhone(message, "gary");
  phoneT.scrollTop = phoneT.scrollHeight;
  updatePhoneStatus();
  endingCall = true;
  phone.setAttribute("aria-busy", "true");
  const profile = garyVoiceProfile(garyVoicePreset);
  const canSpeak = !ttsMuted && garyVolume > 0 && "speechSynthesis" in window;
  const duration = canSpeak ? estimatedSpeechDurationMs(message, profile.rate) : 1400;
  const closeDelay = Math.round(duration * 1.5);
  phoneEnd.disabled = true;
  phoneEnd.style.setProperty("--end-call-duration", `${closeDelay}ms`);
  phoneEnd.classList.add("closing");

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const speechDone = canSpeak
    ? Promise.race([garySpeak(message), wait(closeDelay + 5000)])
    : Promise.resolve();
  Promise.all([speechDone, wait(closeDelay)]).then(() => {
    endCallUI();
    print("(You hang up. Phone bill so far: " + billText() + ".)", "echo");
    updateHud();
  });
}

function handle(raw) {
  let cmd = raw.trim();
  if ((!cmd && !game.needsPlayerName()) || endingCall) return;
  const submitted = cmd;
  const onCall = !!game.state.flags.onCall;

  // Echo to whichever screen is active.
  if (cmd) {
    if (onCall) printToPhone(cmd, "you");
    else print("> " + cmd, "echo");
  }

  if (cmd) {
    history.push(cmd);
    hi = history.length;
  }

  const low = cmd.toLowerCase();

  // View-mode switch. "2D" jumps to the tile-map view; "text" is a no-op here
  // (you're already in the text game). The Text/2D toggle top-right does the same.
  if (!onCall && (low === "2d" || low === "2d mode" || low === "2-d")) {
    print("Switching to the 2D map view…", "sys");
    saveModeHandoff();
    window.location.href = "view2d/tilemap.html";
    return;
  }
  if (!onCall && (low === "text" || low === "text mode" || low === "1d")) {
    print("You're already in text mode. Type 2D to switch to the tile-map view.", "sys");
    return;
  }

  const bugDescription = bugReportDescription(cmd);
  if (bugDescription !== null) {
    recordBugCommand(bugTrace, submitted);
    openBugReport(bugDescription || DEFAULT_ISSUE_DESCRIPTION);
    const message = bugDescription
      ? "Opening a GitHub issue with your description."
      : "Opening a GitHub issue.";
    onCall ? printToPhone(message, "sys") : print(message, "sys");
    return;
  }

  // restart/quit are UI meta-verbs and must work from ANYWHERE — including the
  // call screen. Otherwise a game that ends mid-call strands you on the phone,
  // where the engine refuses every command. Tear down the phone overlay first.
  const restartTarget = parseRestartTarget(cmd);
  if (restartTarget) {
    if (onCall) endCallUI();
    if (restartTarget === 2) restartPartTwo();
    else {
      newGame();
    }
    return;
  }
  const traceCommands = onCall ? [submitted] : splitCommands(submitted);
  for (const command of traceCommands) recordBugCommand(bugTrace, command);
  if (low === "ver" || low === "version" || low === "build") {
    if (Native.isMobileApp()) {
      Native.post("content", { action: "version" });
    } else {
      const message = Native.version();
      onCall ? printToPhone(message, "sys") : print(message, "sys");
    }
    return;
  }
  if (low === "reload" || low === "refresh") {
    if (Native.isMobileApp()) {
      const message = "Forcing a fresh download from the content source...";
      onCall ? printToPhone(message, "sys") : print(message, "sys");
      Native.post("content", { action: "refresh" });
    } else {
      print("Reloading the latest web files with a fresh cache key...", "sys");
      const url = new URL(window.location.href);
      url.searchParams.set("_bmrefresh", Date.now().toString());
      window.location.replace(url.toString());
    }
    return;
  }
  if (low === "quit") { if (onCall) endCallUI(); print("Thanks for playing. Refresh to return to Blackwood Manor."); input.disabled = true; return; }
  // AI status is a meta-verb too, and must work mid-call — "is Gary actually
  // using the model?" is precisely the question you ask while talking to him.
  if (low === "ai" || low === "ai status" || low === "model") {
    const text = modelStatusText();
    onCall ? printToPhone(text, "sys") : print(text);
    if (onCall) phoneT.scrollTop = phoneT.scrollHeight;
    return;
  }
  // save/restore stay terminal-only.
  if (!onCall) {
    if (low === "save") {
      game.setFlag("usedSaveRestore", true);
      print(saveGame(game) ? "Game saved to this browser." : "Save failed.");
      return;
    }
    if (low === "restore") {
      game.setFlag("usedSaveRestore", true);
      if (!hasSave()) { print("There is no saved game."); return; }
      const restored = loadGame(game);
      if (restored) {
        if (game.needsPlayerName()) game.useDefaultPlayerName();
        game.setFlag("usedSaveRestore", true);
        saveGame(game);
        markSessionStart();
        if (!game.needsPlayerName()) showIntroBanner();
      }
      print(restored ? "Restored.\n\n" + game.startMessage() : "Restore failed.");
      if (restored) {
        syncNameGate();
        updateHud();
        announceModelCheck();
      }
      return;
    }
  }

  if (onCall) recordBugDialogue(bugTrace, "user", submitted);
  const prevFlags = { ...game.state.flags };
  const turnsBefore = game.state.turns;
  const out = game.send(cmd);
  bugTrace.turns += Math.max(0, game.state.turns - turnsBefore);
  const nowOnCall = !!game.state.flags.onCall;

  if (nowOnCall) {
    if (!onCall) showPhone();          // the call just connected → switch to the phone screen
    const dialogueEntry = recordBugDialogue(bugTrace, "gary", out);
    // If an on-device model is available and this turn is pure conversation,
    // let Gary actually think. The canned line is kept as the fallback and the
    // mechanical tail (meter / bill milestone) is preserved either way.
    const info = onCall ? world.garyTurnInfo(game, cmd) : null;
    if (info && info.llmOk && garyBrain.isAvailable()) {
      // Just an animated ellipsis. The finished line carries the ◆ AI tag and
      // the header badge is always on screen, so spelling out "thinking
      // on-device" here said the same thing a third time. Must be non-empty:
      // emit() drops whitespace-only text and would return no element to
      // replace, losing the reply.
      const el = printToPhone("…", "gary thinking");
      updatePhoneStatus();
      updateHud();
      garyBrain.speak(info).then((line) => {
        const spoken = game.showMessage(line ? line + (info.tail || "") : out);
        updateBugDialogue(dialogueEntry, spoken);
        // Only model-written lines get a marker. Scripted fallbacks remain
        // unmarked rather than adding a second status label to every response.
        if (el) { el.className = line ? "gary llm" : "gary"; el.textContent = spoken; }
        phoneT.scrollTop = phoneT.scrollHeight;
        garySpeak(spoken);
      });
      return;
    }
    printToPhone(out, "gary");
    garySpeak(out);                    // Gary complains out loud
    updatePhoneStatus();
    updateHud();
    return;
  }

  if (onCall) {                        // the call just ended → switch back to the game
    recordBugDialogue(bugTrace, "gary", out);
    finishPhoneCall(out);
    return;
  }

  // normal terminal turn
  const gameOver = game.state.dead || game.state.won;
  print(out, gameOver ? "over" : null);
  updateHud();
  syncNameGate();  // reset the "type your name" placeholder once the name gate closes
  const mirrorRoute = game.getFlag("mirrorRoutePrefill");
  if (typeof mirrorRoute === "string" && mirrorRoute) {
    game.setFlag("mirrorRoutePrefill", null);
  }
  const sfxKind = ambientSfxKind(out, prevFlags, game.state.flags);
  if (sfxKind) playSfx(sfxKind);       // noise cue, not Gary talking
  const reaction = garyReacts(prevFlags, game.state.flags);
  if (reaction) garySpeak(reaction);   // Gary editorializes from off-screen
  if (game.state.won) printRestartPrompt();
  else if (!game.state.dead) saveGame(game);
  if (mirrorRoute) {
    queueMicrotask(() => {
      mainEntry.setValue(mirrorRoute);
      if (canType) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    });
  }
}

function applySysopCommand(raw) {
  const command = String(raw || "").trim();
  const action = sysopMenuAction(command, sysopMenuUnlocked);
  if (!action.handled) return false;
  recordBugCommand(bugTrace, command);
  if (action.unlocked && !sysopMenuUnlocked) {
    try {
      localStorage.setItem(SYSOP_MENU_UNLOCK_KEY, "true");
    } catch (error) {
      console.warn("[sysop-menu] could not save unlock state", error);
    }
  }
  sysopMenuUnlocked = action.unlocked;
  if (action.showMenu) {
    print(renderSysopMenu(), "sys");
    mainEntry.clear();
    return true;
  }
  if (action.message) {
    print(action.message, "sys");
    mainEntry.clear();
    return true;
  }
  try {
    mainEntry.setValue(expandSysopCommand(action.shortcut, game));
  } catch (error) {
    print(error.message, "sys");
    return true;
  }
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);
  return true;
}

// --- input wiring (terminal) ---
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    if (!applySysopCommand(input.value)) { handle(input.value); mainEntry.clear(); }
  }
  else if (e.key === "ArrowUp") { if (hi > 0) { hi--; mainEntry.setValue(history[hi] || ""); } e.preventDefault(); }
  else if (e.key === "ArrowDown") { if (hi < history.length) { hi++; mainEntry.setValue(history[hi] || ""); } e.preventDefault(); }
});
mainGo.addEventListener("click", () => {
  if (!applySysopCommand(input.value)) { handle(input.value); mainEntry.clear(); }
  if (canType) input.focus();
});

// Keep the newest text visible whenever the layout changes (keyboard show/hide
// resizes the view, which would otherwise leave the transcript scrolled up).
const scrollBottom = () => { transcript.scrollTop = transcript.scrollHeight; };
window.addEventListener("resize", () => setTimeout(scrollBottom, 60));

// Keep controls visible on touch devices even while the keyboard is open.
if (!canType) {
  input.addEventListener("focus", () => {
    requestAnimationFrame(scrollBottom);
    setTimeout(scrollBottom, 350);   // after the reflow settles
  });
  input.addEventListener("blur", () => {
    setTimeout(scrollBottom, 150);
  });
}

// --- input wiring (phone screen) ---
phoneCmd.addEventListener("keydown", (e) => {
  if (e.key === "Enter") { handle(phoneCmd.value); phoneEntry.clear(); }
});
// iOS: tapping a control while the keyboard is up blurs the field first, and the
// blur handler below drops the "compact" class — which un-hides the avatar, the
// sub-label and the name, shoving the button down out from under your finger
// before the click lands. The tap is swallowed and you have to press Say twice.
// Suppressing the default focus shift keeps the field focused, so nothing
// reflows and the first tap counts (and the keyboard stays up between lines).
function keepFocus(el) {
  if (el) el.addEventListener("mousedown", (e) => e.preventDefault());
}

const phoneEnd = document.getElementById("phone-end");
phoneGo.addEventListener("click", () => {
  handle(phoneCmd.value);
  phoneEntry.clear();
  if (canType) phoneCmd.focus();
});
phoneEnd.addEventListener("click", () => { phoneCmd.blur(); handle("hang up"); });
[phoneGo, phoneEnd, document.getElementById("phone-mic"), document.getElementById("phone-ai"),
 document.getElementById("phone-avatar")].forEach(keepFocus);

const scrollPhoneBottom = () => { phoneT.scrollTop = phoneT.scrollHeight; };
// While typing on the call screen (touch), collapse Gary's big header so the
// conversation window gets the room.
if (!canType) {
  phoneCmd.addEventListener("focus", () => {
    phone.classList.add("compact");
    requestAnimationFrame(scrollPhoneBottom);
    setTimeout(scrollPhoneBottom, 350);
  });
  phoneCmd.addEventListener("blur", () => {
    phone.classList.remove("compact");
    setTimeout(scrollPhoneBottom, 150);
  });
}

// The large speaker avatar is Gary's only mute control. Muted by default.
const phoneAvatar = document.getElementById("phone-avatar");
function setVoiceToggleState() {
  if (!phoneAvatar) return;
  phoneAvatar.classList.toggle("muted", ttsMuted);
  phoneAvatar.setAttribute("aria-pressed", String(!ttsMuted));
  const label = ttsMuted ? "turn Gary's voice on" : "mute Gary's voice";
  phoneAvatar.setAttribute("aria-label", label);
  phoneAvatar.title = label;
}
setVoiceToggleState();
function toggleVoice() {
  ttsMuted = !ttsMuted;
  setVoiceToggleState();
  if (ttsMuted) {
    stopSpeaking();
  } else {
    // Speak immediately: confirms audio works AND primes the speech engine
    // inside the user's tap (Chrome/Safari need a gesture to start speaking).
    garySpeak("Fine. The voice is on. Don't make it weird.");
  }
}
if (phoneAvatar) phoneAvatar.addEventListener("click", toggleVoice);
if (garyVoiceSelect) {
  garyVoiceSelect.addEventListener("change", () => {
    garyVoicePreset = garyVoiceProfile(garyVoiceSelect.value).id;
    try {
      localStorage.setItem(GARY_VOICE_PRESET_KEY, garyVoicePreset);
    } catch (error) {
      console.warn("[gary] could not save voice preset", error);
    }
    refreshGaryVoice();
    if (!ttsMuted) garySpeak("Fine. New voice. Still Gary.");
  });
}
if (garyVolumeInput) {
  garyVolumeInput.addEventListener("input", () => {
    garyVolume = Math.min(1, Math.max(0, Number(garyVolumeInput.value) / 100));
    refreshGaryVolume();
    try {
      localStorage.setItem(GARY_VOLUME_KEY, String(garyVolume));
    } catch (error) {
      console.warn("[gary] could not save voice volume", error);
    }
  });
}

// Mic buttons (speech-to-text).
const micBtn = document.getElementById("mic");
const phoneMicBtn = document.getElementById("phone-mic");
micBtn.addEventListener("click", () => { listening ? stopListening() : startListening(input, micBtn); });
phoneMicBtn.addEventListener("click", () => { listening ? stopListening() : startListening(phoneCmd, phoneMicBtn); });
if (bugReport) {
  bugReport.addEventListener("click", () => openBugReport(DEFAULT_ISSUE_DESCRIPTION));
}

// --- touch controls ---
// Action buttons run WITHOUT grabbing the keyboard (only refocus on desktop).
document.querySelectorAll("#controls [data-cmd]").forEach((b) =>
  b.addEventListener("click", (event) => {
    event.preventDefault();
    handle(b.dataset.cmd);
    scrollBottom();
    if (canType) input.focus();
  }));
// Prefill buttons (Take/Say) need more text, so they DO open the keyboard.
document.querySelectorAll("#controls [data-prefill]").forEach((b) =>
  b.addEventListener("click", () => { mainEntry.setValue(b.dataset.prefill); input.focus(); }));

// Show the mic buttons only if speech input is actually available.
if (speechAvailable) { micBtn.hidden = false; phoneMicBtn.hidden = false; }

// The top-right 2D toggle is a plain link; snapshot the game into the handoff
// slot before it navigates so the 2D view resumes exactly here.
document.getElementById("to-2d")?.addEventListener("click", () => saveModeHandoff());

// --- boot ---
// If we just arrived from the 2D map view, restore that game (and its command
// trail) so the two modes are one continuous session.
const modeHandoff = takeModeHandoff();
if (modeHandoff && modeHandoff.snapshot) {
  try { game.restore(modeHandoff.snapshot); } catch (error) {
    console.warn("[mode-switch] restore failed", error);
  }
  if (Array.isArray(modeHandoff.history)) {
    history.length = 0;
    history.push(...modeHandoff.history);
    hi = history.length;
  }
}
beginSession({ showSavedNotice: true, resumed: !!(modeHandoff && modeHandoff.snapshot) });

// Probe for an on-device model for Gary (native app bridge, or the local Mac
// daemon). The name prompt waits for this bounded check so the startup order is
// always title, AI status, name, then first room.
export function refreshAiBadge() {
  if (!aiBadge) return;
  const s = garyBrain.status();
  aiBadge.textContent = s.available ? `◆ AI VOICE · ${s.label}` : "○ scripted Gary · tap";
  aiBadge.classList.toggle("on", s.available);
  aiBadge.title = s.reason;
}
if (aiBadge) {
  const explain = () => {
    printToPhone(modelStatusText(), "sys");
    phoneT.scrollTop = phoneT.scrollHeight;
  };
  aiBadge.addEventListener("click", explain);
  aiBadge.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); explain(); }
  });
}

garyBrain.detect()
  .catch((error) => {
    console.warn("[gary] initial model check failed", error);
  })
  .finally(() => {
    refreshAiBadge();
    modelCheckReady = true;
    completeSessionIntro();
  });

// Launch-time model check.
//
// Always surface the result before asking the player's name.
function announceModelCheck() {
  if (!modelCheckReady || modelCheckAnnounced) return;
  modelCheckAnnounced = true;
  print(modelIntroText());
}

function modelIntroText() {
  const s = garyBrain.status();
  return s.available
    ? "Somewhere inside the machine, Gary clears his throat. Tonight his replies will be " +
      "generated live on this device; a ◆ marks the lines he invents."
    : "Somewhere beyond the manor, Gary settles in beside his phone. Tonight he will answer " +
      "from his stack of hand-written replies rather than a live AI voice.";
}

/** Detailed status for the explicit AI command and phone controls. */
export function modelStatusText() {
  const s = garyBrain.status();
  if (s.available) {
    return "Gary's AI is ready. His replies are generated live on this device and marked ◆ AI.";
  }
  const why = s.native ? s.native.detail : s.reason;
  const fix = s.fix || (s.native ? "" : "");
  return "Gary is using scripted replies.\n" +
         `Reason: ${why}` + (fix ? `\nFix: ${fix}` : "");
}

function refreshIntroBanner() {
  if (introBannerElement) introBannerElement.textContent = bannerText();
}

// Demo/testing helper: index.html?call auto-dials Gary after naming.
