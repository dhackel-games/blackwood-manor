// issue-report.js. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-14.100:acoven.

export const ISSUE_URL = "https://github.com/dhackel-games/blackwood-manor/issues/new";
export const DEFAULT_ISSUE_DESCRIPTION = "Describe issue here";
export const MAX_BUG_HISTORY_CHARS = 6000;
export const MAX_GARY_DIALOGUE_CHARS = 4000;

export function createBugTrace(origin = "page reload") {
  return { origin, turns: 0, commands: [], dialogue: [], userName: null };
}

export function recordBugCommand(trace, command) {
  const normalized = String(command || "").trim().replace(/\s+/g, " ");
  if (normalized) trace.commands.push(normalized);
}

function normalizeDialogueText(text) {
  return String(text || "").trim().replace(/\s+/g, " ");
}

function callerName(text) {
  const match = /\b(?:my name is|call me)\s+([a-z][a-z'-]{0,30})\b/i.exec(text);
  if (!match) return null;
  return match[1].charAt(0).toUpperCase() + match[1].slice(1);
}

export function recordBugDialogue(trace, speaker, text) {
  const normalized = normalizeDialogueText(text);
  if (!normalized || !["gary", "user"].includes(speaker)) return null;
  if (speaker === "user" && !trace.userName) trace.userName = callerName(normalized);
  const entry = { speaker, text: normalized };
  trace.dialogue.push(entry);
  return entry;
}

export function updateBugDialogue(entry, text) {
  const normalized = normalizeDialogueText(text);
  if (entry && normalized) entry.text = normalized;
}

function shortestUniqueLabel(name, other) {
  const normalized = name.toLowerCase();
  const comparison = other.toLowerCase();
  if (normalized === comparison) return `${normalized} (caller)`;
  for (let length = 1; length <= normalized.length; length++) {
    const prefix = normalized.slice(0, length);
    if (!comparison.startsWith(prefix)) return prefix;
  }
  return normalized;
}

export function formatGaryDialogue(
  dialogue, userName = null, maxLength = MAX_GARY_DIALOGUE_CHARS
) {
  if (!Array.isArray(dialogue) || !dialogue.length) return "";
  const caller = normalizeDialogueText(userName) || "user";
  const sameName = caller.toLowerCase() === "gary";
  const shortGary = sameName ? "gary (operator)" : shortestUniqueLabel("gary", caller);
  const shortCaller = shortestUniqueLabel(caller, "gary");
  let garyTurn = 0;
  let userTurn = 0;
  const lines = dialogue.map((entry) => {
    if (entry.speaker === "gary") {
      garyTurn += 1;
      return `${garyTurn}. ${garyTurn === 1 ? "gary" : shortGary}: ${entry.text}`;
    }
    userTurn += 1;
    return `${userTurn === 1 ? (sameName ? "gary (caller)" : caller) : shortCaller}: ${entry.text}`;
  });
  const full = lines.join("\n");
  if (full.length <= maxLength) return full;
  const marker = "\n… [middle Gary dialogue omitted for URL length] …\n";
  const headLength = Math.floor((maxLength - marker.length) * 0.35);
  const tailLength = Math.max(0, maxLength - headLength - marker.length);
  return full.slice(0, headLength) + marker + full.slice(-tailLength);
}

export function formatCommandHistory(commands, maxLength = MAX_BUG_HISTORY_CHARS) {
  const full = commands.join("; ");
  if (full.length <= maxLength) return full || "(no commands yet)";
  const headLength = Math.floor(maxLength * 0.3);
  const marker = " … [middle history omitted for URL length] … ";
  const tailLength = Math.max(0, maxLength - headLength - marker.length);
  return full.slice(0, headLength) + marker + full.slice(-tailLength);
}

export function bugReportBody({
  version = "Version unavailable",
  description = DEFAULT_ISSUE_DESCRIPTION,
  turns = 0,
  origin = "page reload",
  commands = [],
  dialogue = [],
  userName = null,
  hud = "",
  inventory = [],
} = {}) {
  const reportDescription = String(description || "").trim() || DEFAULT_ISSUE_DESCRIPTION;
  const turnLabel = `${turns} turn${turns === 1 ? "" : "s"}`;
  const dialogueText = formatGaryDialogue(dialogue, userName);
  return [
    String(version || "").trim() || "Version unavailable",
    reportDescription,
    "",
    `${turnLabel} from ${origin}: ${formatCommandHistory(commands)}`,
    ...(dialogueText ? ["", "Gary dialogue:", dialogueText] : []),
    `HUD: ${hud || "(unavailable)"}`,
    `Inv: ${inventory.length ? inventory.join(", ") : "(empty)"}`,
  ].join("\n");
}

export function bugReportUrl(roomName, description = "") {
  const url = new URL(ISSUE_URL);
  url.searchParams.set("title", `Room "${roomName}" Blackwood Manor issue`);
  if (description) url.searchParams.set("body", description);
  return url.toString();
}

export function bugReportDescription(command) {
  const match = command.match(/^bug(?:\s+(.*))?$/i);
  return match ? (match[1] || "").trim() : null;
}

// end issue-report.js
