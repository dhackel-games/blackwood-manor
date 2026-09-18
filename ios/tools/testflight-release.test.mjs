// testflight-release.test.mjs. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-13.085:acoven.

import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import test from "node:test";

import {
  appBuildVersion,
  buildNumberForVersion,
  createAppStoreConnectClient,
  createAppStoreConnectToken,
  latestUploadedBuildNumber,
  synchronizedAppBuild,
  verifyTestFlightAvailability,
} from "./testflight-release.mjs";

const testPrivateKey = () => generateKeyPairSync("ec", { namedCurve: "P-256" })
  .privateKey.export({ type: "pkcs8", format: "pem" });

test("App Store Connect token is a 15-minute ES256 JWT", () => {
  const token = createAppStoreConnectToken({
    keyId: "KEY123",
    issuerId: "issuer-123",
    privateKey: testPrivateKey(),
    now: 1_000,
  });
  const [headerPart, payloadPart, signaturePart] = token.split(".");
  const header = JSON.parse(Buffer.from(headerPart, "base64url"));
  const payload = JSON.parse(Buffer.from(payloadPart, "base64url"));

  assert.deepEqual(header, { alg: "ES256", kid: "KEY123", typ: "JWT" });
  assert.deepEqual(payload, {
    iss: "issuer-123",
    iat: 1_000,
    exp: 1_900,
    aud: "appstoreconnect-v1",
  });
  assert.equal(Buffer.from(signaturePart, "base64url").length, 64);
});

test("verified internal release resolves, assigns, and observes the exact build", async () => {
  const requests = [];
  let assigned = false;
  const json = (body, status = 200) => new Response(
    status === 204 ? null : JSON.stringify(body),
    { status, headers: { "Content-Type": "application/json" } });
  const fetchImpl = async (url, options) => {
    requests.push({ url, options });
    assert.match(options.headers.Authorization, /^Bearer [^.]+\.[^.]+\.[^.]+$/);
    switch (`${options.method} ${url.pathname}`) {
    case "GET /v1/apps":
      return json({ data: [{ type: "apps", id: "app-1", attributes: {
        name: "Blackwood Manor", bundleId: "com.dhackel.BlackwoodManor",
      } }] });
    case "GET /v1/builds":
      assert.equal(url.searchParams.get("filter[version]"), "85");
      assert.equal(url.searchParams.get("filter[preReleaseVersion.version]"), "2026.9.11");
      return json({ data: [{ type: "builds", id: "build-85", attributes: {
        version: "85", processingState: "VALID",
        expirationDate: "2026-12-12T22:00:00Z", expired: false,
      } }] });
    case "GET /v1/betaGroups":
      return json({ data: [{ type: "betaGroups", id: "group-1", attributes: {
        name: "Internal Testers", isInternalGroup: true, hasAccessToAllBuilds: false,
      } }] });
    case "GET /v1/betaGroups/group-1/betaTesters":
      return json({ data: [{ type: "betaTesters", id: "tester-1" }] });
    case "GET /v1/betaGroups/group-1/relationships/builds":
      if (!assigned) return json({ data: [] });
      if (url.searchParams.get("cursor") === "2") {
        return json({ data: [{ type: "builds", id: "build-85" }] });
      }
      return json({
        data: [],
        links: {
          next: "https://api.appstoreconnect.apple.com/v1/betaGroups/" +
            "group-1/relationships/builds?cursor=2",
        },
      });
    case "POST /v1/betaGroups/group-1/relationships/builds":
      assert.deepEqual(JSON.parse(options.body), {
        data: [{ type: "builds", id: "build-85" }],
      });
      assigned = true;
      return json(null, 204);
    case "GET /v1/builds/build-85/buildBetaDetail":
      return json({ data: { type: "buildBetaDetails", id: "detail-1", attributes: {
        internalBuildState: "IN_BETA_TESTING",
      } } });
    case "GET /v1/builds/build-85":
      return json({ data: { type: "builds", id: "build-85", attributes: {
        version: "85", processingState: "VALID",
        expirationDate: "2026-12-12T22:00:00Z", expired: false,
      } } });
    default:
      throw new Error(`Unexpected request: ${options.method} ${url}`);
    }
  };
  const request = createAppStoreConnectClient({
    keyId: "KEY123",
    issuerId: "issuer-123",
    privateKey: testPrivateKey(),
    fetchImpl,
  });

  const result = await verifyTestFlightAvailability({
    request,
    bundleIdentifier: "com.dhackel.BlackwoodManor",
    marketingVersion: "2026.9.11",
    buildNumber: "85",
    groupName: "Internal Testers",
    timeoutSeconds: 1,
    intervalSeconds: 0,
  });

  assert.equal(result.app.id, "app-1");
  assert.equal(result.build.id, "build-85");
  assert.equal(result.group.id, "group-1");
  assert.equal(assigned, true);
  assert.ok(requests.some(({ url }) =>
    url.pathname === "/v1/builds/build-85/buildBetaDetail"));
});

test("all-builds internal groups do not require an explicit relationship", async () => {
  const json = (body) => new Response(JSON.stringify(body), {
    status: 200, headers: { "Content-Type": "application/json" },
  });
  const fetchImpl = async (url, options) => {
    switch (`${options.method} ${url.pathname}`) {
    case "GET /v1/apps":
      return json({ data: [{ type: "apps", id: "app-1", attributes: {
        name: "Blackwood Manor", bundleId: "com.dhackel.BlackwoodManor",
      } }] });
    case "GET /v1/builds":
      return json({ data: [{ type: "builds", id: "build-85", attributes: {
        version: "85", processingState: "VALID",
        expirationDate: "2026-12-12T22:00:00Z", expired: false,
      } }] });
    case "GET /v1/betaGroups":
      return json({ data: [{ type: "betaGroups", id: "group-1", attributes: {
        name: "Automatic Internal", isInternalGroup: true, hasAccessToAllBuilds: true,
      } }] });
    case "GET /v1/betaGroups/group-1/betaTesters":
      return json({ data: [{ type: "betaTesters", id: "tester-1" }] });
    case "GET /v1/builds/build-85/buildBetaDetail":
      return json({ data: { type: "buildBetaDetails", id: "detail-1", attributes: {
        internalBuildState: "IN_BETA_TESTING",
      } } });
    case "GET /v1/builds/build-85":
      return json({ data: { type: "builds", id: "build-85", attributes: {
        version: "85", processingState: "VALID",
        expirationDate: "2026-12-12T22:00:00Z", expired: false,
      } } });
    default:
      throw new Error(`Automatic group made an unexpected request: ${options.method} ${url}`);
    }
  };
  const request = createAppStoreConnectClient({
    keyId: "KEY123",
    issuerId: "issuer-123",
    privateKey: testPrivateKey(),
    fetchImpl,
  });

  const result = await verifyTestFlightAvailability({
    request,
    bundleIdentifier: "com.dhackel.BlackwoodManor",
    marketingVersion: "2026.9.11",
    buildNumber: "85",
    groupName: "Automatic Internal",
    timeoutSeconds: 1,
    intervalSeconds: 0,
  });

  assert.equal(result.group.attributes.hasAccessToAllBuilds, true);
});

test("availability value uses the manifest-style app build version", () => {
  assert.equal(appBuildVersion("2026.9.11", "85"), 20260911085);
});

test("availability version rejects malformed or oversized values", () => {
  assert.throws(() => appBuildVersion("2026.9", "85"), /YYYY\.M\.D/);
  assert.throws(() => appBuildVersion("2026.13.1", "85"), /YYYY\.M\.D/);
  assert.throws(() => appBuildVersion("2026.9.11", "1000"), /fit BBB/);
});

test("release build extraction is scoped to the app version date", () => {
  assert.equal(buildNumberForVersion(20260917004, "2026.9.17"), 4);
  assert.equal(buildNumberForVersion(20260911107, "2026.9.17"), 0);
});

test("a new app date resets every synchronized identity to build one", () => {
  assert.equal(synchronizedAppBuild({
    releaseVersion: "2026.9.18",
    currentAppVersion: "2026.9.17",
    currentAppBuild: 107,
    contentDate: "2026.9.17",
    contentBuild: 4,
    latestAvailableRelease: 20260917107,
    latestUploadedBuild: 0,
  }), 1);
});

test("a same-date app build advances beyond content and uploaded builds", () => {
  assert.equal(synchronizedAppBuild({
    releaseVersion: "2026.9.17",
    currentAppVersion: "2026.9.17",
    currentAppBuild: 1,
    contentDate: "2026.9.17",
    contentBuild: 4,
    latestAvailableRelease: 20260917001,
    latestUploadedBuild: 3,
  }), 5);
});

test("an unpublished synchronized app build is reused unless forced", () => {
  const release = {
    releaseVersion: "2026.9.17",
    currentAppVersion: "2026.9.17",
    currentAppBuild: 5,
    contentDate: "2026.9.17",
    contentBuild: 5,
    latestAvailableRelease: 20260917004,
    latestUploadedBuild: 4,
  };
  assert.equal(synchronizedAppBuild(release), 5);
  assert.equal(synchronizedAppBuild({ ...release, forceNext: true }), 6);
});

test("a new app date cannot rewind same-date OTA content", () => {
  assert.throws(() => synchronizedAppBuild({
    releaseVersion: "2026.9.17",
    currentAppVersion: "2026.9.11",
    currentAppBuild: 107,
    contentDate: "2026.9.17",
    contentBuild: 4,
    latestAvailableRelease: 20260911107,
    latestUploadedBuild: 0,
  }), /already has a later build/);
});

test("latest build selection includes failed and processing uploads", async () => {
  const request = async (path, options = {}) => {
    if (path === "/v1/apps") return { data: [{ id: "app-1" }] };
    assert.equal(path, "/v1/builds");
    assert.equal(options.query["filter[preReleaseVersion.version]"], "2026.9.17");
    return {
      data: [
        { attributes: { version: "83" } },
        { attributes: { version: "86" } },
        { attributes: { version: "not-numeric" } },
      ],
    };
  };
  assert.equal(
    await latestUploadedBuildNumber(request, "com.dhackel.BlackwoodManor", "2026.9.17"),
    86);
});

// end testflight-release.test.mjs
