// ui.js — browser adapter. Ties core.js to the DOM terminal, handles meta-verbs
// (save/restore/restart/quit/again), command history, autosave, and the "phone
// call" screen used while you're on Gary's hint line.
import { createGame } from "./core.js";
import { world } from "./world.js";
import { saveGame, loadGame, hasSave } from "./save.js";
import { VERSION } from "./version.js";
import * as garyBrain from "./gary-brain.js";
import { MAP_MARK } from "./map.js";

const transcript = document.getElementById("transcript");
const input = document.getElementById("cmd");

// phone-call screen elements
const phone = document.getElementById("phone");
const phoneT = document.getElementById("phone-transcript");
const phoneCmd = document.getElementById("phone-cmd");
const phoneTimer = document.getElementById("phone-timer");
const phoneBillEl = document.getElementById("phone-bill");
let callTimer = null;
let callSeconds = 0;

// HUD (always-on score/turns/bill)
const hudScore = document.getElementById("hud-score");
const hudTurns = document.getElementById("hud-turns");
const hudBill = document.getElementById("hud-bill");
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
  setTimeout(() => { phone.hidden = true; if (canType) input.focus(); }, 450);
}

function updateHud() {
  hudScore.textContent = "Score " + game.state.score;
  hudTurns.textContent = game.state.turns + (game.state.turns === 1 ? " turn" : " turns");
  hudBill.textContent = "☎ " + billText();
}

// ---- Text-to-speech: Gary talks (WKWebView supports speechSynthesis) ----
// Default MUTED so audio never plays unexpectedly (e.g. at work) — tap 🔇 Gary
// on the call screen to turn his voice on.
let ttsMuted = true;
let garyVoice = null;
function pickGaryVoice() {
  if (!("speechSynthesis" in window)) return null;
  const vs = speechSynthesis.getVoices();
  const prefs = ["Fred", "Ralph", "Albert", "Aaron", "Arthur", "Reed", "Rocko", "Eddy", "Daniel"];
  for (const p of prefs) { const v = vs.find((v) => v.name && v.name.includes(p)); if (v) return v; }
  return vs.find((v) => /^en/i.test(v.lang)) || vs[0] || null;
}
if ("speechSynthesis" in window) {
  garyVoice = pickGaryVoice();
  speechSynthesis.addEventListener("voiceschanged", () => { garyVoice = pickGaryVoice(); });
}
function garySpeak(text) {
  if (ttsMuted || !text || !("speechSynthesis" in window)) return;
  // strip stage directions like *click* / *chewing* so he doesn't read them aloud
  // Drop MAP_MARK blocks entirely — nobody wants the torn edge read aloud.
  const spoken = text.split(MAP_MARK).filter((_, i) => i % 2 === 0).join(" ")
    .replace(/\*[^*]*\*/g, " ").replace(/\s+/g, " ").trim();
  if (!spoken) return;
  try {
    const u = new SpeechSynthesisUtterance(spoken);
    if (garyVoice) u.voice = garyVoice;
    u.pitch = 0.7; u.rate = 1.02;
    // Chrome DROPS an utterance if cancel() and speak() run back-to-back.
    // Only cancel when something's already playing, and defer the new speak.
    if (speechSynthesis.speaking || speechSynthesis.pending) {
      speechSynthesis.cancel();
      setTimeout(() => { try { speechSynthesis.speak(u); } catch { /* ignore */ } }, 130);
    } else {
      speechSynthesis.speak(u);
    }
  } catch { /* ignore */ }
}
function stopSpeaking() { if ("speechSynthesis" in window) try { speechSynthesis.cancel(); } catch {} }

// ---- Speech-to-text: talk to it (native bridge in the app, web API in browsers) ----
const nativeSpeech = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.speech;
const WebSR = window.SpeechRecognition || window.webkitSpeechRecognition;
const speechAvailable = !!(nativeSpeech || WebSR);
let listening = false;
let speechTarget = input;
let webRec = null;

let activeMic = null;
function setListening(on) {
  listening = on;
  document.querySelectorAll(".iconbtn").forEach((b) => b.classList.toggle("listening", on && b === activeMic));
  if (!on && speechTarget && speechTarget.dataset.ph != null) {
    speechTarget.placeholder = speechTarget.dataset.ph;   // restore original hint
  }
}

function startListening(targetInput, micBtn) {
  if (!speechAvailable || listening) return;
  speechTarget = targetInput;
  activeMic = micBtn;
  stopSpeaking();                 // don't record Gary's own voice
  targetInput.dataset.ph = targetInput.getAttribute("placeholder") || "";
  targetInput.value = "";         // start clean so nothing stale is appended
  targetInput.placeholder = "listening… tap mic to send";
  setListening(true);
  if (nativeSpeech) {
    nativeSpeech.postMessage({ action: "start" });
  } else if (WebSR) {
    webRec = new WebSR();
    webRec.lang = "en-US";
    webRec.interimResults = true;
    webRec.continuous = false;
    webRec.onresult = (e) => {
      const t = Array.from(e.results).map((r) => r[0].transcript).join("");
      speechTarget.value = t;
      if (e.results[e.results.length - 1].isFinal) finishListening(t);
    };
    webRec.onerror = () => setListening(false);
    webRec.onend = () => { if (listening) setListening(false); };
    try { webRec.start(); } catch { setListening(false); }
  }
}
function stopListening() {
  if (nativeSpeech) nativeSpeech.postMessage({ action: "stop" });
  if (webRec) try { webRec.stop(); } catch {}
  setListening(false);
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

function handle(raw) {
  let cmd = raw.trim();
  if (!cmd) return;
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

  // restart/quit are UI meta-verbs and must work from ANYWHERE — including the
  // call screen. Otherwise a game that ends mid-call strands you on the phone,
  // where the engine refuses every command. Tear down the phone overlay first.
  if (low === "restart") { if (onCall) endCallUI(); print("Restarting..."); newGame(); return; }
  if (low === "quit") { if (onCall) endCallUI(); print("Thanks for playing. Refresh to return to Blackwood Manor."); input.disabled = true; return; }
  // save/restore stay terminal-only.
  if (!onCall) {
    if (low === "save") { print(saveGame(game) ? "Game saved to this browser." : "Save failed."); return; }
    if (low === "restore") {
      if (!hasSave()) { print("There is no saved game."); return; }
      print(loadGame(game) ? "Restored.\n\n" + game.describeRoom(true) : "Restore failed.");
      return;
    }
  }

  lastCmd = cmd;
  const out = game.send(cmd);
  const nowOnCall = !!game.state.flags.onCall;

  if (nowOnCall) {
    if (!onCall) showPhone();          // the call just connected → switch to the phone screen
    // If an on-device model is available and this turn is pure conversation,
    // let Gary actually think. The canned line is kept as the fallback and the
    // mechanical tail (meter / bill milestone) is preserved either way.
    const info = onCall ? world.garyTurnInfo(game, cmd) : null;
    if (info && info.llmOk && garyBrain.isAvailable()) {
      const el = printToPhone("Gary is thinking", "gary thinking");
      updatePhoneStatus();
      updateHud();
      garyBrain.speak(info).then((line) => {
        const spoken = line ? line + (info.tail || "") : out;
        // `llm` marks a line the model actually wrote. When speak() returns ""
        // we fell back to the scripted line, and it must NOT claim otherwise —
        // a badge that lies is worse than no badge.
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
    printToPhone(out, "gary");
    garySpeak(out);
    updatePhoneStatus();
    endCallUI();
    print("(You hang up. Phone bill so far: " + billText() + ".)", "echo");
    updateHud();
    return;
  }

  // normal terminal turn
  const gameOver = game.state.dead || game.state.won;
  print(out, gameOver ? "over" : null);
  updateHud();
  if (game.state.won) print("\nType RESTART to play again.", "over");
  else if (!game.state.dead) saveGame(game);
}

// --- input wiring (terminal) ---
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") { handle(input.value); input.value = ""; }
  else if (e.key === "ArrowUp") { if (hi > 0) { hi--; input.value = history[hi] || ""; } e.preventDefault(); }
  else if (e.key === "ArrowDown") { if (hi < history.length) { hi++; input.value = history[hi] || ""; } e.preventDefault(); }
});
document.getElementById("go").addEventListener("click", () => { handle(input.value); input.value = ""; if (canType) input.focus(); });

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
document.getElementById("phone-go").addEventListener("click", () => { handle(phoneCmd.value); phoneCmd.value = ""; if (canType) phoneCmd.focus(); });
document.getElementById("phone-end").addEventListener("click", () => { handle("hang up"); });

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

// Voice toggle — tap the big GARY avatar (or the hint under it). Muted by default.
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

// Mic buttons (speech-to-text).
const micBtn = document.getElementById("mic");
const phoneMicBtn = document.getElementById("phone-mic");
micBtn.addEventListener("click", () => { listening ? stopListening() : startListening(input, micBtn); });
phoneMicBtn.addEventListener("click", () => { listening ? stopListening() : startListening(phoneCmd, phoneMicBtn); });

// --- touch controls ---
// Action buttons run WITHOUT grabbing the keyboard (only refocus on desktop).
document.querySelectorAll("#controls [data-cmd]").forEach((b) =>
  b.addEventListener("click", (event) => {
    event.preventDefault();
    handle(b.dataset.cmd);
    scrollBottom();
    if (canType) input.focus();
  }));
// Prefill buttons (Examine/Take) need an object typed, so they DO open the keyboard.
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
    const s = garyBrain.status();
    printToPhone(s.available
      ? `[Gary's replies are being written live by the ${s.label} model. Lines marked ◆ came from it; unmarked lines are the script.]`
      : `[Gary is running from the script. ${s.reason}]`, "sys");
    phoneT.scrollTop = phoneT.scrollHeight;
  };
  aiBadge.addEventListener("click", explain);
  aiBadge.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); explain(); }
  });
}

garyBrain.detect().then((p) => {
  refreshAiBadge();
  console.log(p
    ? `[gary] on-device voice active via "${p}" provider`
    : `[gary] scripted — ${garyBrain.status().reason}`);
});

// Demo/testing helper: index.html?call auto-dials Gary on load.
if (/[?&]call\b/.test(location.search)) setTimeout(() => handle("call"), 350);
