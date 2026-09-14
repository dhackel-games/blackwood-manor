// native.js. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-13.086:acoven.

const versionsURL = new URL("../versions.json", import.meta.url);
let versions;
if (versionsURL.protocol === "file:") {
  const { readFile } = await import("node:fs/promises");
  versions = JSON.parse(await readFile(versionsURL, "utf8"));
} else {
  versionsURL.search = new URL(import.meta.url).search;
  const versionsResponse = await fetch(versionsURL);
  if (!versionsResponse.ok) {
    throw new Error(`Could not load version metadata (${versionsResponse.status}).`);
  }
  versions = await versionsResponse.json();
}
if (typeof versions.APP_VERSION !== "string"
    || typeof versions.BUILD !== "string"
    || typeof versions.COPYRIGHT !== "string"
    || !Number.isSafeInteger(versions.CONTENT_VERSION)
    || !Number.isSafeInteger(versions.LATEST_APP_BUILD_AVAILABLE)
    || !Array.isArray(versions.CONTENT_FILES)) {
  throw new Error("Version metadata is invalid.");
}

export const {
  APP_VERSION,
  BUILD,
  CONTENT_VERSION,
  COPYRIGHT,
  LATEST_APP_BUILD_AVAILABLE,
  CONTENT_FILES,
} = versions;
export const VERSION = `${COPYRIGHT} ${APP_VERSION} (build ${BUILD})`;

export class Native {
  static appInstalledVersion =
    typeof window !== "undefined" ? window.__appInstalledVersion : undefined;
  static appInstalledBuild =
    typeof window !== "undefined" ? window.__appInstalledBuild : undefined;
  static contentLocal = CONTENT_VERSION;
  static contentSource = null;

  static bridge(name) {
    return typeof window !== "undefined"
      ? window.webkit?.messageHandlers?.[name] || null
      : null;
  }

  static hasBridge(name) {
    return !!this.bridge(name);
  }

  static isMobileApp() {
    return this.hasBridge("content");
  }

  static post(name, message) {
    const bridge = this.bridge(name);
    if (!bridge) return false;
    bridge.postMessage(message);
    return true;
  }

  static setContentVersions(appVersion, appBuild, contentLocal, contentSource) {
    this.appInstalledVersion = appVersion;
    this.appInstalledBuild = appBuild;
    this.contentLocal = contentLocal || CONTENT_VERSION;
    this.contentSource = contentSource || null;
  }

  static version() {
    if (this.isMobileApp()) {
      return `${COPYRIGHT} iOS ${this.appInstalledVersion} (Build ${this.appInstalledBuild}). ` +
        `Content: Local ${this.contentLocal}. Source ${this.contentSource || "Unavailable"}.`;
    }
    return `${COPYRIGHT} Web ${APP_VERSION} (Build ${BUILD}). ` +
      `Content: Version ${CONTENT_VERSION}. Continuous updates.`;
  }
}

// end native.js
