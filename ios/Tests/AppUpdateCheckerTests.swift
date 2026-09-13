// AppUpdateCheckerTests.swift. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-13.085:acoven.

import XCTest

final class AppUpdateCheckerTests: XCTestCase {
    private let testFlightReceipt = URL(fileURLWithPath: "/bundle/StoreKit/sandboxReceipt")
    private let appStoreReceipt = URL(fileURLWithPath: "/bundle/StoreKit/receipt")

    override func tearDown() {
        StubURLProtocol.reset()
        super.tearDown()
    }

    private func lookupJSON(
        bundleIdentifier: String = "com.dhackel.BlackwoodManor",
        version: String,
        storeURL: String = "https://apps.apple.com/app/id123456789"
    ) -> Data {
        Data("""
        {
          "resultCount": 1,
          "results": [{
            "bundleId": "\(bundleIdentifier)",
            "version": "\(version)",
            "trackViewUrl": "\(storeURL)"
          }]
        }
        """.utf8)
    }

    private func testFlightJSON(
        available: Bool = true,
        version: String? = "2026.9.11",
        build: Int? = 85,
        expiresAt: String? = "2099-12-12T22:00:00Z"
    ) -> Data {
        let versionJSON = version.map { "\"\($0)\"" } ?? "null"
        let buildJSON = build.map(String.init) ?? "null"
        let expiresJSON = expiresAt.map { "\"\($0)\"" } ?? "null"
        return Data("""
        {
          "channel": "testflight",
          "available": \(available),
          "appVersion": \(versionJSON),
          "appBuild": \(buildJSON),
          "availableAt": "2026-09-13T22:00:00Z",
          "expiresAt": \(expiresJSON)
        }
        """.utf8)
    }

    private func checker(
        installedVersion: String = "2026.9.11",
        installedBuild: String = "84"
    ) -> AppUpdateChecker {
        AppUpdateChecker(
            bundleIdentifier: "com.dhackel.BlackwoodManor",
            installedVersion: installedVersion,
            installedBuild: installedBuild,
            countryCode: "US",
            appStoreLookupURL: URL(string: "https://itunes.apple.com/lookup")!,
            testFlightReleaseURL: URL(
                string: "https://example.test/latest_app_build_available.json")!,
            session: StubURLProtocol.makeSession())
    }

    func testNewerPublishedVersionReturnsAppStoreUpdate() {
        var requestURL: URL?
        StubURLProtocol.handler = { request in
            requestURL = request.url
            return (200, self.lookupJSON(version: "2026.10.1"))
        }

        let exp = expectation(description: "lookup")
        checker().check(receiptURL: appStoreReceipt) { update in
            XCTAssertEqual(update, AppUpdate(
                version: "2026.10.1",
                build: nil,
                channel: .appStore,
                storeURL: URL(string: "https://apps.apple.com/app/id123456789")!))
            let components = requestURL.flatMap {
                URLComponents(url: $0, resolvingAgainstBaseURL: false)
            }
            XCTAssertEqual(components?.host, "itunes.apple.com")
            XCTAssertEqual(components?.path, "/lookup")
            XCTAssertEqual(
                components?.queryItems?.first(where: { $0.name == "bundleId" })?.value,
                "com.dhackel.BlackwoodManor")
            XCTAssertEqual(
                components?.queryItems?.first(where: { $0.name == "country" })?.value,
                "us")
            exp.fulfill()
        }
        wait(for: [exp], timeout: 5)
    }

    func testMatchingOrOlderPublishedVersionDoesNotOfferUpdate() {
        for version in ["2026.9.11", "2026.8.31"] {
            StubURLProtocol.handler = { _ in
                (200, self.lookupJSON(version: version))
            }
            let exp = expectation(description: version)
            checker().check(receiptURL: appStoreReceipt) { update in
                XCTAssertNil(update)
                exp.fulfill()
            }
            wait(for: [exp], timeout: 5)
        }
    }

    func testMissingAppStoreListingDoesNotOfferUpdate() {
        StubURLProtocol.handler = { _ in
            (200, Data(#"{"resultCount":0,"results":[]}"#.utf8))
        }

        let exp = expectation(description: "no listing")
        checker().check(receiptURL: appStoreReceipt) { update in
            XCTAssertNil(update)
            exp.fulfill()
        }
        wait(for: [exp], timeout: 5)
    }

    func testNewerTestFlightBuildReturnsMarkerUpdate() {
        var requestURL: URL?
        StubURLProtocol.handler = { request in
            requestURL = request.url
            return (200, self.testFlightJSON())
        }

        let exp = expectation(description: "TestFlight marker")
        checker().check(receiptURL: testFlightReceipt) { update in
            XCTAssertEqual(update, AppUpdate(
                version: "2026.9.11",
                build: 85,
                channel: .testFlight,
                storeURL: URL(string: "itms-beta://")!))
            XCTAssertEqual(requestURL?.lastPathComponent, "latest_app_build_available.json")
            XCTAssertFalse(URLComponents(
                url: requestURL!, resolvingAgainstBaseURL: false)?
                .queryItems?.first(where: { $0.name == "v" })?.value?.isEmpty ?? true)
            exp.fulfill()
        }
        wait(for: [exp], timeout: 5)
    }

    func testUnavailableMatchingOrOlderTestFlightBuildDoesNotOfferUpdate() {
        let releases = [
            testFlightJSON(available: false),
            testFlightJSON(build: 84),
            testFlightJSON(build: 83),
            testFlightJSON(build: 85, expiresAt: "2020-01-01T00:00:00Z"),
        ]
        for (index, release) in releases.enumerated() {
            StubURLProtocol.handler = { _ in (200, release) }
            let exp = expectation(description: "release \(index)")
            checker().check(receiptURL: testFlightReceipt) { update in
                XCTAssertNil(update)
                exp.fulfill()
            }
            wait(for: [exp], timeout: 5)
        }
    }

    func testEachTestFlightBuildIsPromptedOnlyOnce() {
        let build85 = AppUpdate(
            version: "2026.9.11", build: 85, channel: .testFlight,
            storeURL: URL(string: "itms-beta://")!)
        let build86 = AppUpdate(
            version: "2026.9.11", build: 86, channel: .testFlight,
            storeURL: URL(string: "itms-beta://")!)
        XCTAssertTrue(AppUpdatePromptPolicy.shouldPresent(
            updateIdentifier: build85.identifier, lastPromptedIdentifier: nil))
        XCTAssertFalse(AppUpdatePromptPolicy.shouldPresent(
            updateIdentifier: build85.identifier,
            lastPromptedIdentifier: build85.identifier))
        XCTAssertTrue(AppUpdatePromptPolicy.shouldPresent(
            updateIdentifier: build86.identifier,
            lastPromptedIdentifier: build85.identifier))
    }
}

// end AppUpdateCheckerTests.swift
