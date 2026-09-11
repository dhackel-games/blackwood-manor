// issue-report.js Copyright (c) 2026:dhackel-games. All Rights Reserved. Do Not Distribute.

export const ISSUE_URL = "https://github.com/dhackel-games/blackwood-manor/issues/new";
export const DEFAULT_ISSUE_DESCRIPTION = "Describe issue here";

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
