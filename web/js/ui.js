// ui.js — browser adapter. Ties core.js to the DOM terminal, handles meta-verbs
// (save/restore/restart/quit/again), command history, autosave, and the "phone
// call" screen used while you're on Gary's hint line.
import { createGame } from "./core.js";
import { world } from "./world.js";
import { saveGame, loadGame, hasSave } from "./save.js";
import { VERSION } from "./version.js";
import { createHud } from "./hud.js";
import * as garyBrain from "./gary-brain.js";
import { MAP_MARK } from "./map.js";
import {
  bugReportDescription,
  bugReportUrl,
  DEFAULT_ISSUE_DESCRIPTION,
} from "./issue-report.js";
import {
  DEFAULT_GARY_VOICE_PRESET,
  estimatedSpeechDurationMs,
  garyVoiceProfile,
  pickGaryVoice,
} from "./gary-voice.js";
import { cheatMenu, expandCheatPrompt, magicMenuAction } from "./cheat-prompts.js";

const transcript = document.getElementById("transcript");
const input = document.getElementById("cmd");
const bugReport = document.getElementById("bug-report");
const MAGIC_MENU_UNLOCK_KEY = "blackwood-magic-menu-unlocked-v1";
let magicMenuUnlocked = false;
try {
  magicMenuUnlocked = localStorage.getItem(MAGIC_MENU_UNLOCK_KEY) === "true";
} catch (error) {
  console.warn("[magic-menu] could not read unlock state", error);
}

// phone-call screen elements
const phone = document.getElementById("phone");
const phoneT = document.getElementById("phone-transcript");
const phoneCmd = document.getElementById("phone-cmd");
const phoneTimer = document.getElementById("phone-timer");
const phoneBillEl = document.getElementById("phone-bill");
const garyVoiceSelect = document.getElementById("gary-voice");
let callTimer = null;
let callSeconds = 0;
let endingCall = false;

// HUD status is declarative: each HudSlot owns its emoji and calculation.
const hud = createHud(document);
const hudVersion = document.getElementById("hud-version");
if (hudVersion) hudVersion.textContent = VERSION;

let game = createGame(world);
const history = [];
let hi = 0;
let lastCmd = "";

// Only auto-focus the text field on devices with a real keyboard (desktop).
// On touch devices, focusing pops the on-screen keyboard, which is jarring when
// you just tapped a movement/action button — so we don't.
const canType = !!(window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches);

const BIG_BANNER =
`  ____  _            _                     _
 | __ )| | __ _  ___| | ____      _____   ___   __| |
 |  _ \\| |/ _\` |/ __| |/ /\\ \\ /\\ / / _ \\ / _ \\ / _\` |
 | |_) | | (_| | (__|   <  \\ V  V / (_) | (_) | (_| |
 |____/|_|\\__,_|\\___|_|\\_\\  \\_/\\_/ \\___/ \\___/ \\__,_|

              M A N O R
An Adventure in the Classic Style
${VERSION}

Type HELP for commands.  Type LOOK to look around.  Beware the dark.`;

// Compact banner for narrow (phone) screens, where the ASCII art would wrap.
const SMALL_BANNER =
`+------------------------------+
|      B L A C K W O O D       |
|          M A N O R           |
+------------------------------+
An Adventure in the Classic Style
${VERSION}

Type HELP for commands. Type LOOK
to look around. Beware the dark.`;

const BANNER = window.innerWidth < 640 ? SMALL_BANNER : BIG_BANNER;

// --- terminal output ---
// Text may contain MAP_MARK-delimited ASCII blocks. Those must not word-wrap,
// so they're emitted as their own `.map` element; everything else wraps normally.
function emit(container, text, cls, prefix = "") {
  let last = null;
  const parts = String(text).split(MAP_MARK);
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
  if (text == null) return;
  emit(transcript, text, cls);
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
}

function openBugReport(description = "") {
  window.open(
    bugReportUrl(game.room().name, description),
    "_blank",
    "noopener,noreferrer",
  );
}

// ---- Text-to-speech: Gary talks (WKWebView supports speechSynthesis) ----
// Default MUTED so audio never plays unexpectedly (e.g. at work) — tap 🔇 Gary
// on the call screen to turn his voice on.
const GARY_VOICE_PRESET_KEY = "blackwood-gary-voice";
let ttsMuted = true;
let garyVoice = null;
let garyVoicePreset = DEFAULT_GARY_VOICE_PRESET;
try {
  garyVoicePreset = garyVoiceProfile(localStorage.getItem(GARY_VOICE_PRESET_KEY)).id;
} catch (error) {
  console.warn("[gary] could not read saved voice preset", error);
}
if (garyVoiceSelect) garyVoiceSelect.value = garyVoicePreset;
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
}
function garySpeak(text) {
  if (ttsMuted || !text || !("speechSynthesis" in window)) return Promise.resolve();
  // strip stage directions like *click* / *chewing* so he doesn't read them aloud
  // Drop MAP_MARK blocks entirely — nobody wants the torn edge read aloud.
  const spoken = text.split(MAP_MARK).filter((_, i) => i % 2 === 0).join(" ")
    .replace(/\*[^*]*\*/g, " ").replace(/\s+/g, " ").trim();
  if (!spoken) return Promise.resolve();
  return new Promise((resolve) => {
    try {
      const u = new SpeechSynthesisUtterance(spoken);
      if (garyVoice) u.voice = garyVoice;
      const profile = garyVoiceProfile(garyVoicePreset);
      u.pitch = profile.pitch;
      u.rate = profile.rate;
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
  if (flags.onFire && !prevFlags.onFire) return "Whoa! You're on fire!";
  return null;
}

// ---- Speech-to-text: talk to it (native bridge in the app, web API in browsers) ----
const nativeSpeech = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.speech;
const WebSR = window.SpeechRecognition || window.webkitSpeechRecognition;
const speechAvailable = !!(nativeSpeech || WebSR);
let listening = false;
let speechTarget = input;
let webRec = null;
let webTranscript = "";
let webPartial = "";
let webRestartTimer = null;

let activeMic = null;
function setListening(on) {
  listening = on;
  document.querySelectorAll(".iconbtn").forEach((b) => b.classList.toggle("listening", on && b === activeMic));
  if (!on && speechTarget && speechTarget.dataset.ph != null) {
    speechTarget.placeholder = speechTarget.dataset.ph;   // restore original hint
  }
}

function speechRecognitionFailed(error) {
  setListening(false);
  const detail = error ? ` (${error})` : "";
  const message = `Speech recognition stopped${detail}. Tap the microphone to try again.`;
  speechTarget === phoneCmd ? printToPhone(message, "sys") : print(message, "sys");
}

function beginWebRecognition() {
  if (!listening || !WebSR) return;
  const recognition = new WebSR();
  webRec = recognition;
  recognition.lang = "en-US";
  recognition.interimResults = true;
  recognition.continuous = true;
  recognition.onresult = (event) => {
    if (!listening) return;
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const text = event.results[i][0].transcript;
      if (event.results[i].isFinal) webTranscript += text.trim() + " ";
      else interim += text;
    }
    webPartial = interim;
    speechTarget.value = (webTranscript + webPartial).trim();
  };
  recognition.onerror = (event) => {
    if (!listening || event.error === "no-speech" || event.error === "aborted") return;
    speechRecognitionFailed(event.error);
  };
  recognition.onend = () => {
    if (webRec === recognition) webRec = null;
    if (listening && webPartial.trim()) {
      webTranscript += webPartial.trim() + " ";
      webPartial = "";
      speechTarget.value = webTranscript.trim();
    }
    if (listening) webRestartTimer = setTimeout(beginWebRecognition, 100);
  };
  try {
    recognition.start();
  } catch (error) {
    speechRecognitionFailed(error?.message || "unavailable");
  }
}

function startListening(targetInput, micBtn) {
  if (!speechAvailable || listening) return;
  speechTarget = targetInput;
  activeMic = micBtn;
  webTranscript = "";
  webPartial = "";
  stopSpeaking();                 // don't record Gary's own voice
  targetInput.dataset.ph = targetInput.getAttribute("placeholder") || "";
  targetInput.value = "";         // start clean so nothing stale is appended
  targetInput.placeholder = "listening… tap mic to send";
  setListening(true);
  if (nativeSpeech) {
    nativeSpeech.postMessage({ action: "start" });
  } else if (WebSR) {
    beginWebRecognition();
  }
}
function stopListening() {
  if (nativeSpeech) {
    nativeSpeech.postMessage({ action: "stop" });
    setListening(false);
    return;
  }
  const text = (webTranscript + webPartial).trim();
  setListening(false);
  if (webRestartTimer) clearTimeout(webRestartTimer);
  webRestartTimer = null;
  const recognition = webRec;
  webRec = null;
  if (recognition) try { recognition.stop(); } catch {}
  finishListening(text);
}
function finishListening(text) {
  setListening(false);
  const t = (text || "").trim();
  if (!t) return;
  const el = speechTarget;
  el.value = "";
  handle(t);                      // voice command auto-runs
}
// Called by the native bridge (evaluateJavaScript).
window.__speech = (text, isFinal) => {
  if (!listening && !isFinal) return;          // ignore stray callbacks after we've stopped
  if (text != null) speechTarget.value = text; // live partials
  if (isFinal) finishListening(text);
};
window.__speechEnd = () => { setListening(false); };

function newGame() {
  game = createGame(world);
  print("\n" + game.describeRoom(true));
  updateHud();
}

function finishPhoneCall(message) {
  printToPhone(message, "gary");
  phoneT.scrollTop = phoneT.scrollHeight;
  updatePhoneStatus();
  endingCall = true;
  phone.setAttribute("aria-busy", "true");
  const profile = garyVoiceProfile(garyVoicePreset);
  const canSpeak = !ttsMuted && "speechSynthesis" in window;
  const duration = canSpeak ? estimatedSpeechDurationMs(message, profile.rate) : 1400;
  phoneEnd.disabled = true;
  phoneEnd.style.setProperty("--end-call-duration", `${duration}ms`);
  phoneEnd.classList.add("closing");

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const speechDone = canSpeak
    ? Promise.race([garySpeak(message), wait(duration + 5000)])
    : Promise.resolve();
  Promise.all([speechDone, wait(duration)]).then(() => {
    endCallUI();
    print("(You hang up. Phone bill so far: " + billText() + ".)", "echo");
    updateHud();
  });
}

function handle(raw) {
  let cmd = raw.trim();
  if (!cmd || endingCall) return;
  const onCall = !!game.state.flags.onCall;

  // Echo to whichever screen is active.
  if (onCall) printToPhone(cmd, "you");
  else print("> " + cmd, "echo");

  history.push(cmd);
  hi = history.length;

  if (/^(again|g)$/i.test(cmd)) {
    if (!lastCmd) { onCall ? printToPhone("(nothing to repeat)", "sys") : print("Nothing to repeat."); return; }
    cmd = lastCmd;
  }
  const low = cmd.toLowerCase();

  const bugDescription = bugReportDescription(cmd);
  if (bugDescription !== null) {
    openBugReport(bugDescription);
    const message = bugDescription
      ? "Opening a GitHub issue with your description."
      : "Opening a GitHub issue.";
    onCall ? printToPhone(message, "sys") : print(message, "sys");
    return;
  }

  // restart/quit are UI meta-verbs and must work from ANYWHERE — including the
  // call screen. Otherwise a game that ends mid-call strands you on the phone,
  // where the engine refuses every command. Tear down the phone overlay first.
  if (low === "restart") { if (onCall) endCallUI(); print("Restarting..."); newGame(); return; }
  if (low === "quit") { if (onCall) endCallUI(); print("Thanks for playing. Refresh to return to Blackwood Manor."); input.disabled = true; return; }
  // AI status is a meta-verb too, and must work mid-call — "is Gary actually
  // using the model?" is precisely the question you ask while talking to him.
  if (low === "ai" || low === "ai status" || low === "model") {
    const text = modelStatusText();
    onCall ? printToPhone(text, "sys") : print(text, garyBrain.isAvailable() ? "sys ok" : "sys");
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
        game.setFlag("usedSaveRestore", true);
        saveGame(game);
      }
      print(restored ? "Restored.\n\n" + game.describeRoom(true) : "Restore failed.");
      if (restored) updateHud();
      return;
    }
  }

  lastCmd = cmd;
  const prevFlags = { ...game.state.flags };
  const out = game.send(cmd);
  const nowOnCall = !!game.state.flags.onCall;

  if (nowOnCall) {
    if (!onCall) showPhone();          // the call just connected → switch to the phone screen
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
        const spoken = line ? line + (info.tail || "") : out;
        // `llm` marks a line the model actually wrote. When speak() returns ""
        // we fell back to the scripted line, and it must NOT claim otherwise —
        // a badge that lies is worse than no badge. Mark that case explicitly
        // too: an unlabelled line was exactly what made testers conclude the
        // model "isn't working" when it was simply a fallback on that turn.
        if (el) { el.className = line ? "gary llm" : "gary scripted"; el.textContent = spoken; }
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
    finishPhoneCall(out);
    return;
  }

  // normal terminal turn
  const gameOver = game.state.dead || game.state.won;
  print(out, gameOver ? "over" : null);
  updateHud();
  const sfxKind = ambientSfxKind(out, prevFlags, game.state.flags);
  if (sfxKind) playSfx(sfxKind);       // noise cue, not Gary talking
  const reaction = garyReacts(prevFlags, game.state.flags);
  if (reaction) garySpeak(reaction);   // Gary editorializes from off-screen
  if (game.state.won) print("\nType RESTART to play again.", "over");
  else if (!game.state.dead) saveGame(game);
}

function applyCheatPrompt(raw) {
  const command = String(raw || "").trim();
  const action = magicMenuAction(command, magicMenuUnlocked);
  if (!action.handled) return false;
  if (action.unlocked && !magicMenuUnlocked) {
    try {
      localStorage.setItem(MAGIC_MENU_UNLOCK_KEY, "true");
    } catch (error) {
      console.warn("[magic-menu] could not save unlock state", error);
    }
  }
  magicMenuUnlocked = action.unlocked;
  if (action.showMenu) {
    print(cheatMenu(), "sys");
    input.value = "";
    return true;
  }
  if (action.message) {
    print(action.message, "sys");
    input.value = "";
    return true;
  }
  try {
    input.value = expandCheatPrompt(action.shortcut, game);
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
    if (!applyCheatPrompt(input.value)) { handle(input.value); input.value = ""; }
  }
  else if (e.key === "ArrowUp") { if (hi > 0) { hi--; input.value = history[hi] || ""; } e.preventDefault(); }
  else if (e.key === "ArrowDown") { if (hi < history.length) { hi++; input.value = history[hi] || ""; } e.preventDefault(); }
});
document.getElementById("go").addEventListener("click", () => {
  if (!applyCheatPrompt(input.value)) { handle(input.value); input.value = ""; }
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
  if (e.key === "Enter") { handle(phoneCmd.value); phoneCmd.value = ""; }
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

const phoneGo = document.getElementById("phone-go");
const phoneEnd = document.getElementById("phone-end");
phoneGo.addEventListener("click", () => { handle(phoneCmd.value); phoneCmd.value = ""; if (canType) phoneCmd.focus(); });
phoneEnd.addEventListener("click", () => { phoneCmd.blur(); handle("hang up"); });
[phoneGo, phoneEnd, document.getElementById("phone-mic"), document.getElementById("phone-ai"),
 document.getElementById("phone-avatar"), document.getElementById("phone-mute")].forEach(keepFocus);

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

// Voice toggle — tap the speaker avatar (or the hint under it). Muted by default.
const muteBtn = document.getElementById("phone-mute");     // the hint text under the name
const phoneAvatar = document.getElementById("phone-avatar");
function setMuteLabel() {
  muteBtn.textContent = ttsMuted ? "🔊 Tap Gary to hear him" : "🔊 Voice on — tap to mute";
  muteBtn.classList.toggle("on", !ttsMuted);
  if (phoneAvatar) phoneAvatar.classList.toggle("muted", ttsMuted);
}
setMuteLabel();   // reflect the default (muted)
function toggleVoice() {
  ttsMuted = !ttsMuted;
  setMuteLabel();
  if (ttsMuted) {
    stopSpeaking();
  } else {
    // Speak immediately: confirms audio works AND primes the speech engine
    // inside the user's tap (Chrome/Safari need a gesture to start speaking).
    garySpeak("Fine. The voice is on. Don't make it weird.");
  }
}
muteBtn.addEventListener("click", toggleVoice);
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
  b.addEventListener("click", () => { input.value = b.dataset.prefill; input.focus(); }));

// Show the mic buttons only if speech input is actually available.
if (speechAvailable) { micBtn.hidden = false; phoneMicBtn.hidden = false; }

// --- boot ---
print(BANNER, "banner");
if (hasSave()) print("\n(A saved game exists in this browser. Type RESTORE to continue it.)");
print("\n" + game.describeRoom(true));
updateHud();
if (canType) input.focus();

// Probe for an on-device model for Gary (native app bridge, or the local Mac
// daemon). Fire-and-forget: if nothing answers, Gary stays canned and nobody
// ever sees an error.
const aiBadge = document.getElementById("phone-ai");
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

garyBrain.detect().then((p) => {
  refreshAiBadge();
  announceModelCheck();
  console.log(p
    ? `[gary] on-device voice active via "${p}" provider`
    : `[gary] scripted — ${garyBrain.status().reason}`);
});

// Launch-time model check.
//
// Testers kept reporting "Gary isn't using the LLM" with no way to tell whether
// the model was missing, switched off, or simply not being reached — the badge
// alone was too quiet and only lives on the call screen. So on the app, say it
// out loud once at launch, in the main transcript, before anyone calls Gary.
function announceModelCheck() {
  const s = garyBrain.status();
  if (!s.nativeApp) return;          // browser: the badge is enough, no launch noise
  print(modelStatusText(), garyBrain.isAvailable() ? "sys ok" : "sys");
}

/** One honest answer about the model, shared by the launch check, the badge and AI. */
export function modelStatusText() {
  const s = garyBrain.status();
  if (s.available) {
    return "[AI check] On-device model READY — Gary's phone replies are written live on this device.\n" +
           "  Lines he actually generates are marked ◆ AI; anything marked '· scripted' came from the script.";
  }
  const why = s.native ? s.native.detail : s.reason;
  const fix = s.fix || (s.native ? "" : "");
  return "[AI check] On-device model NOT ACTIVE — Gary is using his scripted lines.\n" +
         `  Why: ${why}` + (fix ? `\n  Fix: ${fix}` : "");
}

// Demo/testing helper: index.html?call auto-dials Gary on load.
if (/[?&]call\b/.test(location.search)) setTimeout(() => handle("call"), 350);
