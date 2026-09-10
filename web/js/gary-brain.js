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

import { profileForStage, buildInstructions, EXAMPLE_REPLIES, normaliseLine } from "./gary-profile.js";

const DAEMON_URL = "http://127.0.0.1:8138";
const REPLY_TIMEOUT_MS = 8000;
const PROBE_TIMEOUT_MS = 700;
const OPT_IN_KEY = "blackwood-llm-optin";

let provider = null;     // "native" | "daemon" | null
let probed = false;
let reason = "not probed yet";  // human-readable why-not, for the AI command
let nextId = 1;
const pending = new Map();

// Opt-in escape hatch for the public site.
//
// The site never probes loopback by default (see the header) because it would
// make every stranger who opens a text adventure approve local network access.
// But a *known* tester on the public URL is exactly who needs the model, and
// telling them to clone the repo to try it is absurd. So: `?llm` on the URL
// opts in explicitly and is remembered, `?llm=0` opts back out. The scary
// permission prompt then belongs to someone who deliberately asked for it.
export function optedIn() {
  try {
    const m = typeof location !== "undefined" && /[?&]llm(?:=([^&]*))?/.exec(location.search);
    if (m) {
      const on = m[1] !== "0" && m[1] !== "off" && m[1] !== "false";
      localStorage.setItem(OPT_IN_KEY, on ? "1" : "0");
      return on;
    }
    return localStorage.getItem(OPT_IN_KEY) === "1";
  } catch {
    return false;   // Safari in private mode throws on localStorage
  }
}

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

async function daemonHealth() {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(`${DAEMON_URL}/health`, { signal: ctl.signal });
    if (!res.ok) return { ok: false, why: `daemon returned ${res.status}` };
    const data = await res.json().catch(() => ({}));
    // The daemon refuses to boot at all when the model is unavailable, so a
    // reachable daemon reporting model:"unavailable" is close to impossible —
    // but report it honestly rather than claiming a working model.
    if (data && data.ok === false) {
      return { ok: false, why: "daemon is up but the on-device model is unavailable" };
    }
    return { ok: true };
  } catch {
    return { ok: false, why: "no daemon answered on 127.0.0.1:8138" };
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
    if (hasNativeBridge()) { provider = "native"; reason = "Apple on-device model via the app"; return provider; }
    if (typeof fetch !== "function") { reason = "this browser has no fetch"; return null; }
    if (!isLocalPage() && !optedIn()) {
      reason = "public site — the model is off by default. Add ?llm to the URL to switch it on.";
      return null;
    }
    const h = await daemonHealth();
    if (h.ok) { provider = "daemon"; reason = "Apple on-device model via the local Mac daemon"; }
    else if (!isLocalPage()) {
      // From the public site the probe can fail for two very different reasons
      // and the distinction is invisible to fetch() — it reports a bare
      // "Failed to fetch" for both. Chrome's actual console error is
      // "Permission was denied for this request to access the loopback address
      // space", i.e. the Local Network Access prompt was dismissed or blocked.
      // Naming only the daemon here sends people off debugging a daemon that is
      // running perfectly, so say both, shortest fix first.
      reason = "couldn't reach the daemon — either it isn't running, or the browser " +
               "blocked local network access. Playing from the local launcher avoids the prompt.";
    }
    else reason = h.why;
  } catch {
    provider = null;
    reason = "the model probe failed";
  }
  return provider;
}

/** Probe again from scratch — used after the player opts in mid-game. */
export async function redetect() {
  probed = false;
  provider = null;
  return detect();
}

/** Everything the AI command needs to explain itself to a confused tester. */
export function status() {
  return {
    provider,                       // "native" | "daemon" | null
    reason,
    available: provider !== null,
    optedIn: optedIn(),
    localPage: isLocalPage(),
    label: provider === "native" ? "on-device (app)"
         : provider === "daemon" ? "on-device (daemon)"
         : "scripted",
  };
}

export function currentProvider() { return provider; }
export function isAvailable() { return provider !== null; }

// --- prompt assembly --------------------------------------------------------
// `turn` is the structured record world.js stashes for the turn (see garyTurn).
function buildPrompt(turn, nudge) {
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
  if (nudge) lines.push(nudge);
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

  // The model often prefaces the performance with a sentence *about* the
  // performance — "Here's a possible response from Gary:", "Gary thinks for a
  // moment before answering:" — with the real dialogue after a blank line.
  // Taking paragraph [0] blindly kept the preamble and threw the actual line
  // away; observed live as Gary saying "Here's a possible response from Gary:".
  // Drop leading paragraphs that are clearly framing rather than speech.
  const META_PARA = /^(?:here'?s|sure|okay|certainly|of course|as gary|gary\b)[^:]{0,80}:$/i;
  const paras = out.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  while (paras.length > 1 && META_PARA.test(paras[0])) paras.shift();
  out = paras[0] || "";
  // Same leak, but inline on one line: "Here's what Gary says: ..." — only
  // strip when the clause actually announces a reply, so an ordinary Gary line
  // that happens to contain a colon ("Look: I don't care.") survives untouched.
  out = out.replace(/^(?:here'?s|sure|okay|certainly|of course)\b[^:"]{0,80}:\s*/i, "");
  out = out.replace(/^(?:as )?gary(?:'s)?\b[^:"]{0,60}?\b(?:response|reply|answer|says?|thinks?|would say)\b[^:"]{0,30}:\s*/i, "");
  out = out.trim();
  // Gary talks; he does not write verse. Single newlines get collapsed, because
  // the model likes to answer in two mystical short lines when left alone.
  out = out.replace(/\s*\n+\s*/g, " ").trim();
  out = out.replace(/^"+|"+$/g, "").trim();          // wrapping quotes
  // ...and the single-quoted variant, without touching apostrophes inside.
  if (/^'[\s\S]*'$/.test(out)) out = out.slice(1, -1).trim();
  // An unmatched trailing quote is left behind by the narration case above.
  if ((out.match(/"/g) || []).length === 1) out = out.replace(/"/g, "").trim();

  // Still narrating about himself, or broke character entirely — reject.
  if (/^gary\s+\w+s\b/i.test(out)) return "";
  if (/\b(as an ai|language model|i'?m an ai|assistant|hint line operator here to)\b/i.test(out)) return "";
  // Hand-written Gary never swears. A prompt rule alone doesn't hold on a 3B
  // model, so reject rather than risk a tonal break; the canned line is in-voice.
  if (/\b(fuck\w*|shit\w*|bitch\w*|bastard|cunt|dick|piss)\b/i.test(out)) return "";

  // "Two sentences maximum" is a rule the model ignores when it gets going, and
  // a rambling five-sentence answer stops sounding like a man who resents the
  // call. Enforce it here rather than hoping.
  const sentences = out.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g);
  if (sentences && sentences.length > 2) out = sentences.slice(0, 2).join("").trim();
  // Tidy stray punctuation the model leaves behind ("Yes. , I haven't eaten").
  out = out.replace(/([.!?])\s*[,;:]+\s*/g, "$1 ").replace(/\s+([,.!?;:])/g, "$1").trim();
  return out;
}

/**
 * Ask the model for Gary's line.
 * Returns the generated line, or "" to mean "use the canned line" — every
 * failure path returns "" so the caller never has to handle an error.
 */
// A reply that just replays a tone example, or repeats what Gary said last
// turn, is worse than the canned line: it looks like the model isn't running.
// Observed in real play — two different questions both answered with the
// granola-bar example word for word.
let lastSpoken = "";

export function isEcho(line) {
  const n = normaliseLine(line);
  if (!n) return true;
  return EXAMPLE_REPLIES.has(n) || n === lastSpoken;
}

export async function speak(turn) {
  if (!isAvailable()) return "";
  try {
    const profile = profileForStage(turn.stage || 0, { onFire: !!turn.onFire });
    const instructions = buildInstructions(profile);
    const ask = async (nudge) => {
      const raw = provider === "native"
        ? await askNative(instructions, buildPrompt(turn, nudge))
        : await askDaemon(instructions, buildPrompt(turn, nudge));
      return clean(raw);
    };

    let line = await ask("");
    if (isEcho(line)) {
      // One retry, told plainly what it just did wrong. If it echoes again the
      // hand-written line is the better answer, so give up quietly.
      line = await ask(
        "Do NOT reuse any wording from the tone examples and do not repeat your last reply. " +
        "Answer THIS caller with a fresh sentence."
      );
      if (isEcho(line)) return "";
    }
    lastSpoken = normaliseLine(line);
    return line;
  } catch {
    return ""; // any failure => canned Gary, silently
  }
}
