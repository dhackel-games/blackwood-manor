// native.js. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-13.080:acoven.

import { APP_VERSION, BUILD, CONTENT_VERSION, COPYRIGHT } from "./version.js?v=source";

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
