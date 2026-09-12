// issue-report.js Copyright (c) 2026:dhackel-games. All Rights Reserved. Do Not Distribute.

export const ISSUE_URL = "https://github.com/dhackel-games/blackwood-manor/issues/new";
export const DEFAULT_ISSUE_DESCRIPTION = "Describe issue here";
export const MAX_BUG_HISTORY_CHARS = 6000;

export function createBugTrace(origin = "page reload") {
  return { origin, turns: 0, commands: [] };
}

export function recordBugCommand(trace, command) {
  const normalized = String(command || "").trim().replace(/\s+/g, " ");
  if (normalized) trace.commands.push(normalized);
}

export function formatCommandHistory(commands, maxLength = MAX_BUG_HISTORY_CHARS) {
  const full = commands.join("; ");
  if (full.length <= maxLength) return full || "(no commands yet)";
  const headLength = Math.floor(maxLength * 0.3);
  const marker = ` … [${full.length - maxLength} history characters omitted for URL length] … `;
  const tailLength = Math.max(0, maxLength - headLength - marker.length);
  return full.slice(0, headLength) + marker + full.slice(-tailLength);
}

export function bugReportBody({
  description = DEFAULT_ISSUE_DESCRIPTION,
  turns = 0,
  origin = "page reload",
  commands = [],
  hud = "",
  inventory = [],
} = {}) {
  const reportDescription = String(description || "").trim() || DEFAULT_ISSUE_DESCRIPTION;
  const turnLabel = `${turns} turn${turns === 1 ? "" : "s"}`;
  return [
    reportDescription,
    "",
    `${turnLabel} from ${origin}: ${formatCommandHistory(commands)}`,
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
