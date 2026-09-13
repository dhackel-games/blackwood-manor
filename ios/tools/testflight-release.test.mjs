// testflight-release.test.mjs. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-13.085:acoven.

import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import test from "node:test";

import {
  availableBuildMarker,
  createAppStoreConnectClient,
  createAppStoreConnectToken,
  latestUploadedBuildNumber,
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

test("availability marker records the verified TestFlight build", () => {
  const availableAt = new Date("2026-09-13T22:00:00Z");
  assert.deepEqual(availableBuildMarker(
    "2026.9.11", "85", "2026-12-12T22:00:00Z", availableAt), {
    channel: "testflight",
    available: true,
    appVersion: "2026.9.11",
    appBuild: 85,
    availableAt: "2026-09-13T22:00:00.000Z",
    expiresAt: "2026-12-12T22:00:00.000Z",
  });
});

test("availability marker rejects missing or expired build dates", () => {
  const availableAt = new Date("2026-09-13T22:00:00Z");
  assert.throws(
    () => availableBuildMarker("2026.9.11", "85", null, availableAt),
    /no valid expiration date/);
  assert.throws(
    () => availableBuildMarker("2026.9.11", "85", "2026-09-12T22:00:00Z", availableAt),
    /missing or expired/);
});

test("latest build selection includes failed and processing uploads", async () => {
  const request = async (path) => {
    if (path === "/v1/apps") return { data: [{ id: "app-1" }] };
    assert.equal(path, "/v1/builds");
    return {
      data: [
        { attributes: { version: "83" } },
        { attributes: { version: "86" } },
        { attributes: { version: "not-numeric" } },
      ],
    };
  };
  assert.equal(
    await latestUploadedBuildNumber(request, "com.dhackel.BlackwoodManor"),
    86);
});

// end testflight-release.test.mjs
