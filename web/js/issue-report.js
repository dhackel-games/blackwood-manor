// issue-report.js Copyright (c) 2026:dhackel-games. All Rights Reserved. Do Not Distribute.

export const ISSUE_URL = "https://github.com/dhackel-games/blackwood-manor/issues/new";

export function bugReportUrl(roomName) {
  const url = new URL(ISSUE_URL);
  url.searchParams.set("title", `Room "${roomName}" Blackwood Manor issue`);
  return url.toString();
}

// end issue-report.js
