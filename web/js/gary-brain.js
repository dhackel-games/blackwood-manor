// gary-brain.js — optional LLM voice for Gary. Content-free engine glue.
//
// DESIGN — the single most important thing in this file:
//   The model is a VOICE LAYER, never a source of truth. All game mechanics
//   (the phone bill, Gary's XP arc, hang-ups, score, and above all the actual
//   HINT TEXT) are computed deterministically in world.js and passed in here
//   already decided. The model only chooses the wording of the conversational
//   part. This is not caution for its own sake: the on-device 3B model was
//   measured silently dropping a hint it was asked to deliver, which in a
//   hint line is the one unforgivable bug.
//
// Providers, in priority order:
//   1. "native"  — iOS/macOS app: Apple FoundationModels via a WKWebView bridge.
//   2. "daemon"  — Mac browser: local Swift daemon on 127.0.0.1 (see mac/gary-daemon).
//   3. null      — no model: caller keeps the canned line. Always the fallback.
//
// Why the daemon is only probed from a LOCAL page (isLocalPage below):
// Contrary to the obvious guess, this is not a mixed-content limit. Chrome does
// allow an https: page to reach http://127.0.0.1 — but it now gates loopback
// behind the Local Network Access permission, so probing from the public site
// makes a browser ask every stranger who opens a text adventure whether it may
// "access devices on your local network". That prompt is alarming, looks like
// malware, and buys nothing: anyone with the daemon is playing locally anyway.
// (Safari blocks the request outright regardless.) So the public site never
// probes, and stays canned by choice rather than by accident.

import { profileForStage, buildInstructions } from "./gary-profile.js";

const DAEMON_URL = "http://127.0.0.1:8138";
const REPLY_TIMEOUT_MS = 8000;
const PROBE_TIMEOUT_MS = 700;

let provider = null;     // "native" | "daemon" | null
let probed = false;
let nextId = 1;
const pending = new Map();

// --- native bridge (iOS/macOS app) -----------------------------------------
function hasNativeBridge() {
  return typeof window !== "undefined" &&
    !!(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.gary);
}

// Swift calls window.__garyReply(id, text, error).
if (typeof window !== "undefined") {
  window.__garyReply = (id, text, error) => {
    const p = pending.get(id);
    if (!p) return;
    pending.delete(id);
    if (error) p.reject(new Error(String(error)));
    else p.resolve(String(text || ""));
  };
}

function askNative(instructions, prompt) {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    setTimeout(() => {
      if (pending.has(id)) { pending.delete(id); reject(new Error("native timeout")); }
    }, REPLY_TIMEOUT_MS);
    window.webkit.messageHandlers.gary.postMessage({ id, instructions, prompt });
  });
}

// --- local daemon (Mac browser) --------------------------------------------
async function askDaemon(instructions, prompt) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), REPLY_TIMEOUT_MS);
  try {
    const res = await fetch(`${DAEMON_URL}/gary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instructions, prompt }),
      signal: ctl.signal,
    });
    if (!res.ok) throw new Error(`daemon ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return String(data.text || "");
  } finally {
    clearTimeout(t);
  }
}

async function daemonAlive() {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(`${DAEMON_URL}/health`, { signal: ctl.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

/** Detect a provider once. Safe to call repeatedly; never throws. */
// Only a page already served from this machine may look for the daemon; see the
// header. Node (no location) counts as local so the test harness can exercise it.
export function isLocalPage() {
  if (typeof location === "undefined" || !location.hostname) return true;
  const h = location.hostname;
  return h === "localhost" || h === "127.0.0.1" || h === "::1" ||
         h === "" || h.endsWith(".localhost") || location.protocol === "file:";
}

export async function detect() {
  if (probed) return provider;
  probed = true;
  try {
    if (hasNativeBridge()) provider = "native";
    else if (typeof fetch === "function" && isLocalPage() && await daemonAlive()) provider = "daemon";
  } catch {
    provider = null;
  }
  return provider;
}

export function currentProvider() { return provider; }
export function isAvailable() { return provider !== null; }

// --- prompt assembly --------------------------------------------------------
// `turn` is the structured record world.js stashes for the turn (see garyTurn).
function buildPrompt(turn) {
  const lines = [];
  const s = turn.situation || {};
  const facts = [
    s.room ? `The caller is in: ${s.room}.` : null,
    typeof s.turns === "number" ? `They have played ${s.turns} turns.` : null,
    s.bill ? `Their phone bill so far is ${s.bill}.` : null,
    s.calls ? `This is call number ${s.calls}.` : null,
  ].filter(Boolean);
  if (facts.length) lines.push(`CONTEXT (do not recite this verbatim):\n${facts.join(" ")}`);
  if (turn.topic) lines.push(`The caller is talking about: ${turn.topic}.`);
  lines.push(`Caller: "${turn.playerLine}"`);
  lines.push("Reply as Gary, in his voice, in two sentences at most.");
  return lines.join("\n\n");
}

// Strip the failure modes a small model reliably produces. Exported for tests.
export function clean(text) {
  let out = String(text || "").trim();
  // Normalise smart punctuation first so every later pattern only sees ASCII.
  out = out.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");

  // Third-person narration leak: `Gary sighs and says, "..."` — keep the quote.
  const narrated = out.match(/^\s*gary\b[^"]{0,60}"([\s\S]+)$/i);
  if (narrated) out = narrated[1];

  out = out.replace(/^\s*gary\s*[:\-—]\s*/i, "");   // "Gary: ..."
  out = out.split(/\n\s*\n/)[0].trim();              // first paragraph only
  out = out.replace(/^"+|"+$/g, "").trim();          // wrapping quotes
  // An unmatched trailing quote is left behind by the narration case above.
  if ((out.match(/"/g) || []).length === 1) out = out.replace(/"/g, "").trim();

  // Still narrating about himself, or broke character entirely — reject.
  if (/^gary\s+\w+s\b/i.test(out)) return "";
  if (/\b(as an ai|language model|i'?m an ai|assistant|hint line operator here to)\b/i.test(out)) return "";
  // Hand-written Gary never swears. A prompt rule alone doesn't hold on a 3B
  // model, so reject rather than risk a tonal break; the canned line is in-voice.
  if (/\b(fuck\w*|shit\w*|bitch\w*|bastard|cunt|dick|piss)\b/i.test(out)) return "";
  return out;
}

/**
 * Ask the model for Gary's line.
 * Returns the generated line, or "" to mean "use the canned line" — every
 * failure path returns "" so the caller never has to handle an error.
 */
export async function speak(turn) {
  if (!isAvailable()) return "";
  try {
    const profile = profileForStage(turn.stage || 0, { onFire: !!turn.onFire });
    const instructions = buildInstructions(profile);
    const prompt = buildPrompt(turn);
    const raw = provider === "native"
      ? await askNative(instructions, prompt)
      : await askDaemon(instructions, prompt);
    return clean(raw);
  } catch {
    return ""; // any failure => canned Gary, silently
  }
}
