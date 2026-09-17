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

    private func testFlightVersion(_ availableVersion: String = "20260911085") -> Data {
        Data("""
        {
          "APP_VERSION": "2026.9.16",
          "BUILD": "1",
          "NATIVE_APP_VERSION": "2026.9.11",
          "NATIVE_APP_BUILD": "85",
          "CONTENT_DATE": "2026.9.16",
          "CONTENT_BUILD": "1",
          "CONTENT_VERSION": 20260916001,
          "LATEST_APP_BUILD_AVAILABLE": \(availableVersion),
          "CONTENT_FILES": ["index.html", "versions.json"]
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
                string: "https://example.test/versions.json")!,
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
            return (200, self.testFlightVersion())
        }

        let exp = expectation(description: "TestFlight build")
        checker().check(receiptURL: testFlightReceipt) { update in
            XCTAssertEqual(update, AppUpdate(
                version: "2026.9.11",
                build: 85,
                channel: .testFlight,
                storeURL: URL(string: "itms-beta://")!))
            XCTAssertEqual(requestURL?.lastPathComponent, "versions.json")
            XCTAssertFalse(URLComponents(
                url: requestURL!, resolvingAgainstBaseURL: false)?
                .queryItems?.first(where: { $0.name == "v" })?.value?.isEmpty ?? true)
            exp.fulfill()
        }
        wait(for: [exp], timeout: 5)
    }

    func testInvalidMatchingOrOlderTestFlightBuildDoesNotOfferUpdate() {
        let releases = [
            testFlightVersion("not-a-number"),
            testFlightVersion("20260911084"),
            testFlightVersion("20260911083"),
        ]
        for (index, release) in releases.enumerated() {
            StubURLProtocol.handler = { _ in (200, release) }
            let exp = expectation(description: "release \(index)")
            checker().check(receiptURL: testFlightReceipt) { update in
                XCTAssertNil(update)
                exp.fulfill()
            }

            func testInstalledInfoPlistIdentityUsesExactYYYYMMDDBBBFormat() {
                XCTAssertEqual(
                    AppUpdateChecker.releaseNumber(appVersion: "2026.9.11", build: "85"),
                    20260911085)
                XCTAssertEqual(
                    AppUpdateChecker.releaseNumber(appVersion: "2026.10.1", build: "7"),
                    20261001007)
                XCTAssertNil(
                    AppUpdateChecker.releaseNumber(appVersion: "2026.13.1", build: "85"))
                XCTAssertNil(
                    AppUpdateChecker.releaseNumber(appVersion: "2026.9.11", build: "1000"))
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
