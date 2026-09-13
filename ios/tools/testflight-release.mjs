// testflight-release.mjs. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-13.085:acoven.

import { createPrivateKey, sign } from "node:crypto";
import { readFileSync, renameSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const API_ROOT = "https://api.appstoreconnect.apple.com";
const FAILURE_PROCESSING_STATES = new Set(["FAILED", "INVALID"]);
const FAILURE_BETA_STATES = new Set([
  "PROCESSING_EXCEPTION",
  "MISSING_EXPORT_COMPLIANCE",
  "IN_EXPORT_COMPLIANCE_REVIEW",
  "EXPIRED",
]);

class AppStoreConnectError extends Error {
  constructor(message, status = null) {
    super(message);
    this.status = status;
  }
}

const sleep = (milliseconds) => new Promise((resolvePromise) =>
  setTimeout(resolvePromise, milliseconds));

function base64url(value) {
  const data = Buffer.isBuffer(value) ? value : Buffer.from(JSON.stringify(value));
  return data.toString("base64url");
}

export function createAppStoreConnectToken({
  keyId,
  issuerId,
  privateKey,
  now = Math.floor(Date.now() / 1000),
}) {
  const header = base64url({ alg: "ES256", kid: keyId, typ: "JWT" });
  const payload = base64url({
    iss: issuerId,
    iat: now,
    exp: now + 15 * 60,
    aud: "appstoreconnect-v1",
  });
  const signingInput = `${header}.${payload}`;
  const signature = sign("sha256", Buffer.from(signingInput), {
    key: createPrivateKey(privateKey),
    dsaEncoding: "ieee-p1363",
  });
  return `${signingInput}.${base64url(signature)}`;
}

function errorDetail(body) {
  try {
    const parsed = JSON.parse(body);
    return (parsed.errors || [])
      .map((error) => error.detail || error.title || error.code)
      .filter(Boolean)
      .join("; ");
  } catch {
    return body.trim();
  }
}

export function createAppStoreConnectClient({
  keyId, issuerId, privateKey, fetchImpl = fetch,
}) {
  return async function request(path, { method = "GET", query = {}, body } = {}) {
    const url = new URL(path, API_ROOT);
    for (const [name, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(name, String(value));
      }
    }
    const response = await fetchImpl(url, {
      method,
      headers: {
        Authorization: `Bearer ${createAppStoreConnectToken({
          keyId, issuerId, privateKey,
        })}`,
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await response.text();
    if (!response.ok) {
      const detail = errorDetail(text);
      throw new AppStoreConnectError(
        `App Store Connect ${method} ${url.pathname} failed (${response.status})` +
          (detail ? `: ${detail}` : ""),
        response.status);
    }
    return text ? JSON.parse(text) : null;
  };
}

async function poll({ label, timeoutSeconds, intervalSeconds, action }) {
  const deadline = Date.now() + timeoutSeconds * 1000;
  let lastStatus = "";
  while (Date.now() < deadline) {
    const result = await action();
    if (result.done) return result.value;
    if (result.status && result.status !== lastStatus) {
      console.log(`==> ${label}: ${result.status}`);
      lastStatus = result.status;
    }
    await sleep(intervalSeconds * 1000);
  }
  throw new Error(`${label} timed out after ${timeoutSeconds} seconds`);
}

async function resolveApp(request, bundleIdentifier) {
  const response = await request("/v1/apps", {
    query: {
      "filter[bundleId]": bundleIdentifier,
      "fields[apps]": "name,bundleId",
      limit: 1,
    },
  });
  const app = response?.data?.[0];
  if (!app) throw new Error(`No App Store Connect app matches ${bundleIdentifier}`);
  return app;
}

async function waitForBuild(
  request, { appId, marketingVersion, buildNumber, timeoutSeconds, intervalSeconds }
) {
  return poll({
    label: `TestFlight build ${buildNumber} processing`,
    timeoutSeconds,
    intervalSeconds,
    action: async () => {
      const response = await request("/v1/builds", {
        query: {
          "filter[app]": appId,
          "filter[version]": buildNumber,
          "filter[preReleaseVersion.version]": marketingVersion,
          "filter[preReleaseVersion.platform]": "IOS",
          "fields[builds]": "version,processingState,expirationDate,expired",
          "sort": "-uploadedDate",
          "limit": 1,
        },
      });
      const build = response?.data?.[0];
      if (!build) return { done: false, status: "waiting for uploaded build" };
      const state = build.attributes?.processingState || "UNKNOWN";
      if (FAILURE_PROCESSING_STATES.has(state)) {
        throw new Error(`TestFlight build ${buildNumber} processing failed: ${state}`);
      }
      if (build.attributes?.expired === true) {
        throw new Error(`TestFlight build ${buildNumber} is already expired.`);
      }
      return state === "VALID"
        ? { done: true, value: build }
        : { done: false, status: state };
    },
  });
}

async function resolveBetaGroup(request, { appId, groupId, groupName }) {
  let group;
  if (groupId) {
    group = (await request(`/v1/betaGroups/${groupId}`, {
      query: { "fields[betaGroups]": "name,isInternalGroup,hasAccessToAllBuilds" },
    }))?.data;
  } else {
    const query = {
      "filter[app]": appId,
      "fields[betaGroups]": "name,isInternalGroup,hasAccessToAllBuilds",
      limit: 200,
    };
    if (groupName) query["filter[name]"] = groupName;
    const groups = (await request("/v1/betaGroups", { query }))?.data || [];
    const internalGroups = groups.filter((candidate) =>
      candidate.attributes?.isInternalGroup === true);
    if (groupName) {
      group = internalGroups.find((candidate) => candidate.attributes?.name === groupName);
    } else if (internalGroups.length === 1) {
      [group] = internalGroups;
    } else {
      throw new Error(
        "Set ASC_BETA_GROUP_ID or ASC_BETA_GROUP_NAME when more than one internal beta group exists.");
    }
  }
  if (!group) throw new Error("The configured internal TestFlight beta group was not found.");
  if (group.attributes?.isInternalGroup !== true) {
    throw new Error(`Beta group "${group.attributes?.name || group.id}" is not an internal group.`);
  }
  return group;
}

async function requireGroupTester(request, group) {
  const testers = await request(`/v1/betaGroups/${group.id}/betaTesters`, {
    query: { limit: 1 },
  });
  if (!testers?.data?.length) {
    throw new Error(`Internal beta group "${group.attributes?.name || group.id}" has no testers.`);
  }
}

async function groupContainsBuild(request, groupId, buildId) {
  let path = `/v1/betaGroups/${groupId}/relationships/builds`;
  let query = { limit: 200 };
  const visited = new Set();
  while (path) {
    if (visited.has(path)) throw new Error("App Store Connect returned cyclic pagination.");
    visited.add(path);
    const relationship = await request(path, { query });
    if ((relationship?.data || []).some((build) => build.id === buildId)) return true;
    path = relationship?.links?.next || null;
    query = {};
  }
  return false;
}

async function assignBuildToGroup(request, group, buildId) {
  if (await groupContainsBuild(request, group.id, buildId)) return;
  await request(`/v1/betaGroups/${group.id}/relationships/builds`, {
    method: "POST",
    body: {
      data: [{ type: "builds", id: buildId }],
    },
  });
}

async function waitForInternalAvailability(
  request, { buildId, groupId, requireRelationship, timeoutSeconds, intervalSeconds }
) {
  return poll({
    label: "Internal TestFlight availability",
    timeoutSeconds,
    intervalSeconds,
    action: async () => {
      if (requireRelationship) {
        const linked = await groupContainsBuild(request, groupId, buildId);
        if (!linked) return { done: false, status: "waiting for beta-group assignment" };
      }
      let detail;
      try {
        detail = await request(`/v1/builds/${buildId}/buildBetaDetail`);
      } catch (error) {
        if (error instanceof AppStoreConnectError && error.status === 404) {
          return { done: false, status: "waiting for beta details" };
        }
        throw error;
      }
      const state = detail?.data?.attributes?.internalBuildState || "UNKNOWN";
      if (FAILURE_BETA_STATES.has(state)) {
        throw new Error(`TestFlight internal availability failed: ${state}`);
      }
      return state === "IN_BETA_TESTING"
        ? { done: true, value: detail.data }
        : { done: false, status: state };
    },
  });
}

export function availableBuildMarker(
  marketingVersion, buildNumber, expiresAt, availableAt = new Date()
) {
  if (typeof expiresAt !== "string" || !expiresAt.trim()) {
    throw new Error("The verified TestFlight build has no valid expiration date.");
  }
  const expiration = new Date(expiresAt);
  if (Number.isNaN(expiration.getTime()) || expiration <= availableAt) {
    throw new Error("The verified TestFlight build expiration date is missing or expired.");
  }
  return {
    channel: "testflight",
    available: true,
    appVersion: marketingVersion,
    appBuild: Number(buildNumber),
    availableAt: availableAt.toISOString(),
    expiresAt: expiration.toISOString(),
  };
}

export async function verifyTestFlightAvailability({
  request,
  bundleIdentifier,
  marketingVersion,
  buildNumber,
  groupId,
  groupName,
  timeoutSeconds = 1800,
  intervalSeconds = 30,
}) {
  const app = await resolveApp(request, bundleIdentifier);
  const build = await waitForBuild(request, {
    appId: app.id,
    marketingVersion,
    buildNumber,
    timeoutSeconds,
    intervalSeconds,
  });
  const group = await resolveBetaGroup(request, {
    appId: app.id,
    groupId,
    groupName,
  });
  await requireGroupTester(request, group);
  const automaticDistribution = group.attributes?.hasAccessToAllBuilds === true;
  if (automaticDistribution) {
    console.log(`==> ${group.attributes?.name || group.id} automatically receives all builds`);
  } else {
    console.log(`==> Assigning build ${buildNumber} to ${group.attributes?.name || group.id}`);
    await assignBuildToGroup(request, group, build.id);
  }
  await waitForInternalAvailability(request, {
    buildId: build.id,
    groupId: group.id,
    requireRelationship: !automaticDistribution,
    timeoutSeconds,
    intervalSeconds,
  });
  const refreshedBuild = (await request(`/v1/builds/${build.id}`, {
    query: {
      "fields[builds]": "version,processingState,expirationDate,expired",
    },
  }))?.data;
  if (!refreshedBuild
      || refreshedBuild.attributes?.processingState !== "VALID"
      || refreshedBuild.attributes?.expired === true) {
    throw new Error(`TestFlight build ${buildNumber} is no longer valid.`);
  }
  return { app, build: refreshedBuild, group };
}

export async function latestUploadedBuildNumber(request, bundleIdentifier) {
  const app = await resolveApp(request, bundleIdentifier);
  const response = await request("/v1/builds", {
    query: {
      "filter[app]": app.id,
      "fields[builds]": "version",
      "sort": "-uploadedDate",
      "limit": 200,
    },
  });
  return Math.max(0, ...(response?.data || [])
    .map((build) => Number(build.attributes?.version))
    .filter(Number.isInteger));
}

function writeMarker(path, marker) {
  const temporary = `${path}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(marker, null, 2)}\n`);
  renameSync(temporary, path);
}

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

async function main() {
  const bundleIdentifier = argument("--bundle-id");
  const marketingVersion = argument("--version");
  const buildNumber = argument("--build");
  const markerPath = argument("--marker");
  if (!bundleIdentifier) {
    throw new Error(
      "usage: node testflight-release.mjs --bundle-id ID --version VERSION " +
      "--build BUILD --marker PATH");
  }

  const keyId = process.env.ASC_KEY_ID;
  const issuerId = process.env.ASC_ISSUER_ID;
  if (!keyId || !issuerId) throw new Error("ASC_KEY_ID and ASC_ISSUER_ID are required.");
  const keyPath = process.env.ASC_KEY_PATH
    || resolve(homedir(), `.appstoreconnect/private_keys/AuthKey_${keyId}.p8`);
  const privateKey = readFileSync(keyPath, "utf8");
  const timeoutSeconds = Number(process.env.ASC_PROCESS_TIMEOUT || 1800);
  const intervalSeconds = Number(process.env.ASC_POLL_INTERVAL || 30);
  const request = createAppStoreConnectClient({ keyId, issuerId, privateKey });

  if (process.argv.includes("--latest-build")) {
    console.log(await latestUploadedBuildNumber(request, bundleIdentifier));
    return;
  }
  if (!marketingVersion || !buildNumber || !markerPath) {
    throw new Error(
      "usage: node testflight-release.mjs --bundle-id ID --version VERSION " +
      "--build BUILD --marker PATH");
  }

  console.log(`==> Resolving ${bundleIdentifier} in App Store Connect`);
  const verified = await verifyTestFlightAvailability({
    request,
    bundleIdentifier,
    marketingVersion,
    buildNumber,
    groupId: process.env.ASC_BETA_GROUP_ID,
    groupName: process.env.ASC_BETA_GROUP_NAME,
    timeoutSeconds,
    intervalSeconds,
  });

  writeMarker(markerPath, availableBuildMarker(
    marketingVersion,
    buildNumber,
    verified.build.attributes?.expirationDate));
  console.log(`==> TestFlight build ${buildNumber} is available; wrote ${markerPath}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main().catch((error) => {
    console.error(`testflight-release: ${error.message}`);
    process.exit(1);
  });
}

// end testflight-release.mjs
